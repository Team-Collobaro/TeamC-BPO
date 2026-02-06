const { onCall, HttpsError, onRequest } = require('firebase-functions/v2/https');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');
const Stripe = require('stripe');
const { sendEmail } = require('./lib/email');

admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' }) : null;

const VALID_ROLES = ['learner', 'candidate', 'employer', 'admin'];

async function writeAuditLog({ userId, userRole, action, entityType, entityId, changes }) {
  try {
    await db.collection('audit_logs').add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      userId: userId || 'system',
      userRole: userRole || 'system',
      action,
      entityType,
      entityId,
      changes: changes || null
    });
  } catch (err) {
    console.error('Audit log write failed:', err);
  }
}

/**
 * When a user document is created in users/{uid}, set custom claims for RBAC.
 * Custom claims are used for route guards and security rules.
 */
exports.onUserCreated = onDocumentCreated('users/{userId}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;
  const userId = event.params.userId;
  const data = snapshot.data();
  const role = data.role && VALID_ROLES.includes(data.role) ? data.role : 'learner';
  const subscriptionActive = !!data.subscriptionActive;
  const profileComplete = !!data.profileComplete;
  try {
    await auth.setCustomUserClaims(userId, {
      role,
      subscriptionActive,
      profileComplete
    });
    console.log(`Set custom claims for ${userId}: role=${role}`);
    if (data.email) {
      try {
        await sendEmail({
          to: data.email,
          templateId: 'welcome',
          dynamicTemplateData: {
            name: data.displayName || data.email,
            role,
            loginUrl: process.env.APP_URL || 'https://yourapp.com/login'
          }
        });
      } catch (e) {
        console.error('Welcome email failed:', e.message);
      }
    }
  } catch (err) {
    console.error('Error setting custom claims:', err);
  }
});

/**
 * Submit MCQ answers and validate them
 * This function enforces backend validation and unlocking logic
 */
exports.submitMcq = onCall(async (request) => {
  // Check authentication
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { courseId, moduleId, answers } = request.data;

  // Validate input
  if (!courseId || !moduleId || !Array.isArray(answers)) {
    throw new HttpsError('invalid-argument', 'Missing required parameters');
  }

  try {
    // Get module data
    const moduleDoc = await db
      .collection('courses')
      .doc(courseId)
      .collection('modules')
      .doc(moduleId)
      .get();

    if (!moduleDoc.exists) {
      throw new HttpsError('not-found', 'Module not found');
    }

    const moduleData = moduleDoc.data();
    const mcqQuestions = moduleData.mcq || [];

    // Get user progress
    const progressRef = db
      .collection('users')
      .doc(userId)
      .collection('progress')
      .doc(courseId);

    const progressDoc = await progressRef.get();
    
    if (!progressDoc.exists) {
      throw new HttpsError('failed-precondition', 'Progress not initialized');
    }

    const progressData = progressDoc.data();

    // Check if user has access to this module
    if (moduleData.order > progressData.unlockedModuleOrder) {
      throw new HttpsError('permission-denied', 'Module is locked');
    }

    // Check if video is completed
    const moduleProgress = progressData.completedModules?.[moduleId] || {};
    if (!moduleProgress.videoCompleted) {
      throw new HttpsError('failed-precondition', 'Video must be completed first');
    }

    // Validate answers
    if (answers.length !== mcqQuestions.length) {
      throw new HttpsError('invalid-argument', 'Invalid number of answers');
    }

    let correctCount = 0;
    mcqQuestions.forEach((question, index) => {
      if (answers[index] === question.correctIndex) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / mcqQuestions.length) * 100);
    const passed = score === 100; // Must get 100% to pass

    // Update progress in a transaction
    await db.runTransaction(async (transaction) => {
      const progressSnapshot = await transaction.get(progressRef);
      const currentProgress = progressSnapshot.data();

      // Update module completion
      const updatedCompletedModules = {
        ...currentProgress.completedModules,
        [moduleId]: {
          videoCompleted: true,
          mcqPassed: passed,
          score: score,
          completedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      };

      let newUnlockedOrder = currentProgress.unlockedModuleOrder;

      // If passed and this is the current unlocked module, unlock next
      if (passed && moduleData.order === currentProgress.unlockedModuleOrder) {
        newUnlockedOrder = currentProgress.unlockedModuleOrder + 1;
      }

      transaction.update(progressRef, {
        completedModules: updatedCompletedModules,
        unlockedModuleOrder: newUnlockedOrder
      });
    });

    // Return results
    return {
      passed,
      score,
      correctCount,
      totalQuestions: mcqQuestions.length,
      nextUnlockedOrder: passed && moduleData.order === progressData.unlockedModuleOrder
        ? progressData.unlockedModuleOrder + 1
        : progressData.unlockedModuleOrder
    };
  } catch (error) {
    console.error('Error in submitMcq:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Failed to process MCQ submission');
  }
});

/**
 * Map score (0-100) to star rating (1-5) using questionnaire starMapping or default bands.
 */
function scoreToStarRating(score, starMapping) {
  if (starMapping && typeof starMapping === 'object') {
    const entries = Object.entries(starMapping).sort((a, b) => {
      const aMax = parseInt(a[0].split('-')[1], 10);
      const bMax = parseInt(b[0].split('-')[1], 10);
      return bMax - aMax;
    });
    for (const [band, stars] of entries) {
      const [min, max] = band.split('-').map(Number);
      if (score >= min && score <= max) return stars;
    }
  }
  if (score >= 90) return 5;
  if (score >= 80) return 4;
  if (score >= 70) return 3;
  if (score >= 60) return 2;
  return 1;
}

/**
 * Submit final assessment (questionnaire). Calculates score, star rating, creates certificate.
 */
exports.submitAssessment = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { questionnaireId, answers, courseId } = request.data;

  if (!questionnaireId || !Array.isArray(answers)) {
    throw new HttpsError('invalid-argument', 'Missing questionnaireId or answers');
  }

  try {
    const questionnaireDoc = await db.collection('questionnaires').doc(questionnaireId).get();
    if (!questionnaireDoc.exists) {
      throw new HttpsError('not-found', 'Questionnaire not found');
    }

    const questionnaire = questionnaireDoc.data();
    const questions = questionnaire.questions || [];
    const passingScore = questionnaire.passingScore ?? 60;
    const starMapping = questionnaire.starMapping || null;

    if (answers.length !== questions.length) {
      throw new HttpsError('invalid-argument', 'Invalid number of answers');
    }

    let correctCount = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correctIndex) correctCount++;
    });

    const score = Math.round((correctCount / questions.length) * 100);
    const starRating = scoreToStarRating(score, starMapping);
    const passed = score >= passingScore;

    const assessmentRef = db.collection('assessments').doc();
    const certificateRef = db.collection('certificates').doc();
    const certificateNumber = 'CERT-' + Date.now() + '-' + userId.slice(0, 6);

    await db.runTransaction(async (transaction) => {
      transaction.set(assessmentRef, {
        userId,
        questionnaireId,
        courseId: courseId || null,
        attemptNumber: 1,
        startedAt: admin.firestore.FieldValue.serverTimestamp(),
        submittedAt: admin.firestore.FieldValue.serverTimestamp(),
        answers: questions.map((q, i) => ({ questionId: q.id, selectedIndex: answers[i] })),
        score,
        starRating,
        certificateId: certificateRef.id,
        isPaid: false,
        paymentId: null
      });

      transaction.set(certificateRef, {
        userId,
        assessmentId: assessmentRef.id,
        courseId: courseId || null,
        certificateNumber,
        issuedAt: admin.firestore.FieldValue.serverTimestamp(),
        score,
        starRating,
        pdfUrl: null,
        isRevoked: false
      });

      const userDoc = await transaction.get(db.collection('users').doc(userId));
      const userData = userDoc.data() || {};
      const role = userData.role || 'learner';
      const profileCol = role === 'candidate' ? 'candidate_profiles' : 'learner_profiles';
      const profileRef = db.collection(profileCol).doc(userId);
      const profileSnap = await transaction.get(profileRef);
      const existing = profileSnap.exists ? profileSnap.data() : {};
      transaction.set(profileRef, {
        ...existing,
        userId,
        latestStarRating: starRating,
        latestScore: score,
        latestAssessmentId: assessmentRef.id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    });

    return {
      score,
      starRating,
      certificateId: certificateRef.id,
      certificateNumber,
      passed
    };
  } catch (error) {
    console.error('Error in submitAssessment:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'Failed to process assessment');
  }
});

const PAYMENT_TYPES = ['course_purchase', 'joining_fee', 'retake_fee', 'cv_unlock', 'reactivation', 'subscription'];

/**
 * Demo mode: unlock access without real payment. Only available when Stripe is NOT configured.
 * Use for local/dev when STRIPE_SECRET_KEY is not set.
 */
exports.demoUnlock = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
  if (stripe) {
    throw new HttpsError('failed-precondition', 'Demo unlock is only available when Stripe is not configured');
  }

  const userId = request.auth.uid;
  const { type, courseId, candidateId } = request.data;

  if (!type || !['course_purchase', 'joining_fee', 'reactivation', 'cv_unlock', 'subscription'].includes(type)) {
    throw new HttpsError('invalid-argument', 'Invalid type');
  }

  if (type === 'cv_unlock' && (!candidateId || request.auth.uid === candidateId)) {
    throw new HttpsError('invalid-argument', 'candidateId required for cv_unlock');
  }
  if (type === 'course_purchase' && !courseId) {
    throw new HttpsError('invalid-argument', 'courseId required for course_purchase');
  }

  const employerId = type === 'cv_unlock' || type === 'subscription' ? userId : null;

  if (type === 'course_purchase') {
    await db.collection('users').doc(userId).collection('course_access').doc(courseId).set({
      courseId,
      purchasedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    const progressRef = db.collection('users').doc(userId).collection('progress').doc(courseId);
    const progressSnap = await progressRef.get();
    if (!progressSnap.exists) {
      await progressRef.set({ unlockedModuleOrder: 1, completedModules: {} });
    }
    return { success: true, message: 'Course access granted (demo)' };
  }

  if (type === 'joining_fee') {
    await db.collection('users').doc(userId).collection('questionnaire_access').doc('default').set({
      unlocked: true,
      unlockedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { success: true, message: 'Questionnaire unlocked (demo)' };
  }

  if (type === 'reactivation') {
    const learnerRef = db.collection('learner_profiles').doc(userId);
    const candidateRef = db.collection('candidate_profiles').doc(userId);
    const [learnerSnap, candidateSnap] = await Promise.all([learnerRef.get(), candidateRef.get()]);
    const updates = {
      visibleToEmployers: true,
      autoInactiveTimestamp: admin.firestore.FieldValue.delete()
    };
    if (learnerSnap.exists) await learnerRef.update(updates);
    if (candidateSnap.exists) await candidateRef.update(updates);
    return { success: true, message: 'Profile reactivated (demo)' };
  }

  if (type === 'cv_unlock') {
    const candidateProfile = await db.collection('candidate_profiles').doc(candidateId).get();
    const candidate = candidateProfile.exists ? candidateProfile.data() : {};
    const userDoc = await db.collection('users').doc(candidateId).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    const unlockId = `demo_${employerId}_${candidateId}_${Date.now()}`;
    await db.collection('cv_unlocks').doc(unlockId).set({
      employerId,
      candidateId,
      paymentId: unlockId,
      price: 0,
      starRating: candidate.latestStarRating || 0,
      unlockedAt: admin.firestore.FieldValue.serverTimestamp(),
      candidateCvUrl: candidate.cvUrl || null,
      candidateEmail: userData.email || '',
      candidatePhone: candidate.phoneNumber || null
    });
    return { success: true, unlockId, message: 'CV unlocked (demo)' };
  }

  if (type === 'subscription') {
    const subId = `demo_sub_${userId}_${Date.now()}`;
    await db.collection('subscriptions').doc(subId).set({
      employerId: userId,
      stripeSubscriptionId: subId,
      stripeCustomerId: null,
      status: 'active',
      plan: { name: 'Monthly (Demo)', amount: 0, interval: 'month' },
      currentPeriodStart: admin.firestore.FieldValue.serverTimestamp(),
      currentPeriodEnd: admin.firestore.Timestamp.fromMillis(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    await auth.setCustomUserClaims(userId, {
      ...(await auth.getUser(userId).then((u) => u.customClaims || {})),
      subscriptionActive: true
    });
    return { success: true, message: 'Subscription active (demo)' };
  }

  throw new HttpsError('invalid-argument', 'Unknown type');
});

/**
 * Create a Stripe PaymentIntent for one-time payments. Returns client_secret for frontend.
 */
exports.processPayment = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
  if (!stripe) {
    throw new HttpsError('failed-precondition', 'Stripe is not configured');
  }

  const userId = request.auth.uid;
  const { paymentType, amount, currency = 'gbp', metadata = {} } = request.data;

  if (!paymentType || !PAYMENT_TYPES.includes(paymentType) || typeof amount !== 'number' || amount < 1) {
    throw new HttpsError('invalid-argument', 'Invalid paymentType or amount');
  }

  try {
    const paymentRef = db.collection('payments').doc();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: currency.toLowerCase(),
      metadata: {
        userId,
        paymentId: paymentRef.id,
        paymentType,
        ...metadata
      },
      automatic_payment_methods: { enabled: true }
    });

    await paymentRef.set({
      userId,
      stripePaymentIntentId: paymentIntent.id,
      stripeCustomerId: null,
      amount,
      currency: currency.toUpperCase(),
      status: 'pending',
      type: paymentType,
      metadata: { ...metadata },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: paymentRef.id
    };
  } catch (error) {
    console.error('processPayment error:', error);
    throw new HttpsError('internal', error.message || 'Failed to create payment');
  }
});

/**
 * Stripe webhook: handle payment_intent.succeeded and unlock access.
 * Configure Stripe webhook to point to this function URL with signing secret in STRIPE_WEBHOOK_SECRET.
 */
exports.stripeWebhook = onRequest(
  { cors: false },
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret || !stripe) {
      console.error('Stripe webhook or Stripe not configured');
      res.status(500).send('Webhook not configured');
      return;
    }

    let event;
    try {
      const rawBody = req.rawBody
        ? (Buffer.isBuffer(req.rawBody) ? req.rawBody.toString('utf8') : req.rawBody)
        : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object;
      const { userId, paymentId, paymentType, courseId, candidateId, employerId } = pi.metadata || {};

      try {
        const paymentRef = db.collection('payments').doc(paymentId);
        await paymentRef.update({
          status: 'succeeded',
          completedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        await writeAuditLog({
          userId: userId || 'system',
          userRole: 'system',
          action: 'payment_processed',
          entityType: 'payment',
          entityId: paymentId,
          changes: { paymentType, status: 'succeeded' }
        });

        if (paymentType === 'cv_unlock' && employerId && candidateId) {
          const candidateProfile = await db.collection('candidate_profiles').doc(candidateId).get();
          const candidate = candidateProfile.exists ? candidateProfile.data() : {};
          const userDoc = await db.collection('users').doc(candidateId).get();
          const userData = userDoc.exists ? userDoc.data() : {};
          await db.collection('cv_unlocks').doc(paymentId).set({
            employerId,
            candidateId,
            paymentId,
            price: pi.amount,
            starRating: candidate.latestStarRating || 0,
            unlockedAt: admin.firestore.FieldValue.serverTimestamp(),
            candidateCvUrl: candidate.cvUrl || null,
            candidateEmail: userData.email || '',
            candidatePhone: candidate.phoneNumber || null
          });
        }

        if (paymentType === 'course_purchase' && userId && courseId) {
          await db.collection('users').doc(userId).collection('course_access').doc(courseId).set({
            courseId,
            purchasedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          const progressRef = db.collection('users').doc(userId).collection('progress').doc(courseId);
          const progressSnap = await progressRef.get();
          if (!progressSnap.exists) {
            await progressRef.set({ unlockedModuleOrder: 1, completedModules: {} });
          }
        }

        if (paymentType === 'joining_fee' && userId) {
          await db.collection('users').doc(userId).collection('questionnaire_access').doc('default').set({
            unlocked: true,
            unlockedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }

        if (paymentType === 'reactivation' && userId) {
          const learnerRef = db.collection('learner_profiles').doc(userId);
          const candidateRef = db.collection('candidate_profiles').doc(userId);
          const [learnerSnap, candidateSnap] = await Promise.all([learnerRef.get(), candidateRef.get()]);
          const updates = {
            visibleToEmployers: true,
            autoInactiveTimestamp: admin.firestore.FieldValue.delete()
          };
          if (learnerSnap.exists) await learnerRef.update(updates);
          if (candidateSnap.exists) await candidateRef.update(updates);
        }
      } catch (err) {
        console.error('Webhook handler error:', err);
        res.status(500).send('Handler error');
        return;
      }
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      if (session.mode === 'subscription' && session.subscription && session.metadata?.userId) {
        const userId = session.metadata.userId;
        try {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          await db.collection('subscriptions').doc(subscription.id).set({
            employerId: userId,
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: subscription.customer,
            status: subscription.status,
            plan: {
              name: 'Monthly',
              amount: subscription.items.data[0]?.price?.unit_amount || 0,
              interval: subscription.items.data[0]?.price?.recurring?.interval || 'month'
            },
            currentPeriodStart: subscription.current_period_start
              ? admin.firestore.Timestamp.fromMillis(subscription.current_period_start * 1000)
              : null,
            currentPeriodEnd: subscription.current_period_end
              ? admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000)
              : null,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
          await auth.setCustomUserClaims(userId, {
            ...(await auth.getUser(userId).then((u) => u.customClaims || {})),
            subscriptionActive: true
          });
        } catch (err) {
          console.error('Subscription webhook error:', err);
        }
      }
    }

    res.status(200).send();
  }
);

/**
 * Get unlock price for a candidate and create PaymentIntent for CV unlock.
 */
exports.unlockCandidateCV = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
  if (!stripe) {
    throw new HttpsError('failed-precondition', 'Stripe is not configured');
  }

  const employerId = request.auth.uid;
  const { candidateId } = request.data;

  if (!candidateId) {
    throw new HttpsError('invalid-argument', 'Missing candidateId');
  }

  const [subscriptionSnap, candidateSnap, pricingSnap] = await Promise.all([
    db.collection('subscriptions')
      .where('employerId', '==', employerId)
      .where('status', 'in', ['active', 'trialing'])
      .limit(1)
      .get(),
    db.collection('candidate_profiles').doc(candidateId).get(),
    db.collection('pricing_config').doc('default').get()
  ]);

  if (subscriptionSnap.empty) {
    throw new HttpsError('failed-precondition', 'Active subscription required');
  }
  if (!candidateSnap.exists) {
    throw new HttpsError('not-found', 'Candidate not found');
  }

  const candidate = candidateSnap.data();
  const starRating = candidate.latestStarRating || 0;
  const pricing = pricingSnap.exists ? pricingSnap.data() : {};
  const priceKey = `${starRating}-star`;
  const amount = pricing.cvUnlockPricing?.[priceKey] ?? (100 * starRating) || 500;

  const paymentRef = db.collection('payments').doc();
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount),
    currency: 'gbp',
    metadata: {
      userId: employerId,
      paymentId: paymentRef.id,
      paymentType: 'cv_unlock',
      candidateId,
      employerId
    },
    automatic_payment_methods: { enabled: true }
  });

  await paymentRef.set({
    userId: employerId,
    stripePaymentIntentId: paymentIntent.id,
    amount,
    currency: 'GBP',
    status: 'pending',
    type: 'cv_unlock',
    metadata: { candidateId },
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentId: paymentRef.id,
    price: amount
  };
});

/**
 * Create Stripe Checkout Session for employer subscription. Returns session URL.
 */
exports.createSubscriptionCheckoutSession = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
  if (!stripe) {
    throw new HttpsError('failed-precondition', 'Stripe is not configured');
  }

  const userId = request.auth.uid;
  const { successUrl, cancelUrl, priceId } = request.data;

  const pricingSnap = await db.collection('pricing_config').doc('default').get();
  const pricing = pricingSnap.exists ? pricingSnap.data() : {};
  const amount = pricing.employerSubscriptionFee || 9900;
  const currency = (pricing.currency || 'GBP').toLowerCase();

  try {
    const product = await stripe.products.create({
      name: 'UK BPO Employer Subscription',
      metadata: { type: 'employer_subscription' }
    });
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: amount,
      currency,
      recurring: { interval: 'month' }
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: price.id, quantity: 1 }],
      success_url: successUrl || `${request.rawRequest?.headers?.origin || ''}/employer/subscription?success=1`,
      cancel_url: cancelUrl || `${request.rawRequest?.headers?.origin || ''}/employer/subscription?cancel=1`,
      metadata: { userId },
      subscription_data: { metadata: { userId } }
    });

    return { url: session.url };
  } catch (error) {
    console.error('createSubscriptionCheckoutSession error:', error);
    throw new HttpsError('internal', error.message || 'Failed to create session');
  }
});

/**
 * Respond to job-seeking survey (yes/maybe/no). Token is stored in survey_tokens collection.
 */
exports.respondToSurvey = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { token, response } = request.data;

  if (!token || !['yes', 'maybe', 'no'].includes(response)) {
    throw new HttpsError('invalid-argument', 'Invalid token or response');
  }

  const tokenDoc = await db.collection('survey_tokens').doc(token).get();
  if (!tokenDoc.exists || tokenDoc.data().userId !== userId) {
    throw new HttpsError('not-found', 'Invalid or expired survey link');
  }

  const now = admin.firestore.FieldValue.serverTimestamp();
  const profileCol = tokenDoc.data().role === 'candidate' ? 'candidate_profiles' : 'learner_profiles';
  await db.collection(profileCol).doc(userId).update({
    'jobSeekingStatus.lastResponseAt': now,
    'jobSeekingStatus.response': response,
    'jobSeekingStatus.confirmedAt': response !== 'no' ? now : null,
    updatedAt: now
  });

  if (response === 'no') {
    await db.collection(profileCol).doc(userId).update({
      visibleToEmployers: false,
      autoInactiveTimestamp: now
    });
  }

  await db.collection('survey_tokens').doc(token).update({ used: true, usedAt: now });

  return { success: true, response };
});

/**
 * Scheduled: send job-seeking survey to candidates/learners who are visible and due for survey.
 * Run daily. For each profile with visibleToEmployers=true and (lastSurveySentAt > 30 days or null),
 * create a survey token and enqueue email (or log for MVP).
 */
exports.sendJobSeekingSurvey = onSchedule('0 9 * * *', async () => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [learnerSnap, candidateSnap] = await Promise.all([
    db.collection('learner_profiles').where('visibleToEmployers', '==', true).get(),
    db.collection('candidate_profiles').where('visibleToEmployers', '==', true).get()
  ]);

  for (const d of learnerSnap.docs) {
    const data = d.data();
    const lastSent = data.jobSeekingStatus?.lastSurveySentAt?.toDate?.();
    if (lastSent && lastSent > thirtyDaysAgo) continue;
    const token = `s_${d.id}_${Date.now()}`;
    await db.collection('survey_tokens').doc(token).set({
      userId: d.id,
      role: 'learner',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      used: false
    });
    await db.collection('learner_profiles').doc(d.id).update({
      'jobSeekingStatus.lastSurveySentAt': admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`Survey queued for learner ${d.id}, token ${token}`);
  }
  for (const d of candidateSnap.docs) {
    const data = d.data();
    const lastSent = data.jobSeekingStatus?.lastSurveySentAt?.toDate?.();
    if (lastSent && lastSent > thirtyDaysAgo) continue;
    const token = `s_${d.id}_${Date.now()}`;
    await db.collection('survey_tokens').doc(token).set({
      userId: d.id,
      role: 'candidate',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      used: false
    });
    await db.collection('candidate_profiles').doc(d.id).update({
      'jobSeekingStatus.lastSurveySentAt': admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`Survey queued for candidate ${d.id}, token ${token}`);
  }
});

/**
 * Scheduled: check survey responses after 48 hours. Set inactive if no response.
 * Run hourly.
 */
exports.checkSurveyResponses = onSchedule('0 * * * *', async () => {
  const now = new Date();
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const [learners, candidates] = await Promise.all([
    db.collection('learner_profiles').where('visibleToEmployers', '==', true).get(),
    db.collection('candidate_profiles').where('visibleToEmployers', '==', true).get()
  ]);

  const setInactive = async (col, docId, data) => {
    const lastSent = data.jobSeekingStatus?.lastSurveySentAt?.toDate?.();
    const lastResp = data.jobSeekingStatus?.lastResponseAt?.toDate?.();
    if (!lastSent || (lastResp && lastResp >= lastSent)) return;
    if (lastSent < fortyEightHoursAgo) {
      await db.collection(col).doc(docId).update({
        visibleToEmployers: false,
        autoInactiveTimestamp: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`Set inactive: ${col} ${docId} (no survey response in 48h)`);
    }
  };

  for (const d of learners.docs) {
    await setInactive('learner_profiles', d.id, d.data());
  }
  for (const d of candidates.docs) {
    await setInactive('candidate_profiles', d.id, d.data());
  }
});

/**
 * Apply for internship (learners with 5-star assessment only).
 * Input: { assessmentId, availability, preferredStartDate, commitmentAgreed }
 */
exports.applyForInternship = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { assessmentId, availability, preferredStartDate, commitmentAgreed } = request.data;

  if (!assessmentId || typeof commitmentAgreed !== 'boolean' || !commitmentAgreed) {
    throw new HttpsError('invalid-argument', 'assessmentId and commitmentAgreed required');
  }

  const [assessmentSnap, configSnap, existingSnap] = await Promise.all([
    db.collection('assessments').doc(assessmentId).get(),
    db.collection('system_config').doc('default').get(),
    db.collection('internship_applications').where('learnerId', '==', userId).get()
  ]);

  if (!assessmentSnap.exists) {
    throw new HttpsError('not-found', 'Assessment not found');
  }
  const assessment = assessmentSnap.data();
  if (assessment.userId !== userId) {
    throw new HttpsError('permission-denied', 'Assessment does not belong to you');
  }
  if (assessment.starRating !== 5) {
    throw new HttpsError('failed-precondition', 'Only 5-star assessments qualify for internship');
  }

  const config = configSnap.exists ? configSnap.data() : {};
  if (config.internshipProgramEnabled === false) {
    throw new HttpsError('failed-precondition', 'Internship program is currently closed');
  }

  const acceptedCount = await db.collection('internship_applications')
    .where('status', '==', 'accepted')
    .get();
  const slots = config.internshipSlots ?? 10;
  if (acceptedCount.size >= slots) {
    throw new HttpsError('resource-exhausted', 'No internship slots available');
  }

  const hasPending = existingSnap.docs.some((d) => d.data().status === 'pending');
  if (hasPending) {
    throw new HttpsError('failed-precondition', 'You already have a pending application');
  }

  const preferredDate = preferredStartDate
    ? (typeof preferredStartDate === 'string'
        ? admin.firestore.Timestamp.fromDate(new Date(preferredStartDate))
        : preferredStartDate)
    : null;

  const ref = db.collection('internship_applications').doc();
  await ref.set({
    learnerId: userId,
    assessmentId,
    starRating: 5,
    appliedAt: admin.firestore.FieldValue.serverTimestamp(),
    status: 'pending',
    availability: availability || '',
    preferredStartDate: preferredDate,
    commitmentAgreed: true
  });

  return { applicationId: ref.id, status: 'pending' };
});

/**
 * Admin: update internship application status (accept / reject / waitlist).
 */
exports.updateInternshipApplication = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const callerUid = request.auth.uid;
  const userRecord = await auth.getUser(callerUid);
  const role = userRecord.customClaims?.role;
  if (role !== 'admin') {
    throw new HttpsError('permission-denied', 'Admin only');
  }

  const { applicationId, status, decisionNotes } = request.data;
  if (!applicationId || !['accepted', 'rejected', 'waitlisted'].includes(status)) {
    throw new HttpsError('invalid-argument', 'applicationId and status (accepted|rejected|waitlisted) required');
  }

  const ref = db.collection('internship_applications').doc(applicationId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpsError('not-found', 'Application not found');
  }

  const slots = (await db.collection('system_config').doc('default').get()).data()?.internshipSlots ?? 10;
  if (status === 'accepted') {
    const acceptedCount = await db.collection('internship_applications')
      .where('status', '==', 'accepted')
      .get();
    if (acceptedCount.size >= slots) {
      throw new HttpsError('resource-exhausted', 'No internship slots available');
    }
  }

  await ref.update({
    status,
    reviewedBy: callerUid,
    reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
    decisionNotes: decisionNotes || null
  });
  await writeAuditLog({
    userId: callerUid,
    userRole: 'admin',
    action: 'internship_decision',
    entityType: 'internship_application',
    entityId: applicationId,
    changes: { status, decisionNotes }
  });
  return { applicationId, status };
});

/**
 * Admin: update user status (active | suspended).
 */
exports.updateUserStatus = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
  const callerUid = request.auth.uid;
  const userRecord = await auth.getUser(callerUid);
  if (userRecord.customClaims?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Admin only');
  }
  const { userId, status } = request.data;
  if (!userId || !['active', 'suspended', 'inactive'].includes(status)) {
    throw new HttpsError('invalid-argument', 'userId and status (active|suspended|inactive) required');
  }
  await db.collection('users').doc(userId).update({
    status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  await writeAuditLog({
    userId: callerUid,
    userRole: 'admin',
    action: 'user_status_updated',
    entityType: 'user',
    entityId: userId,
    changes: { status }
  });
  return { userId, status };
});

/**
 * Admin: update pricing config.
 */
exports.updatePricingConfig = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
  const callerUid = request.auth.uid;
  const userRecord = await auth.getUser(callerUid);
  if (userRecord.customClaims?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Admin only');
  }
  const data = request.data;
  if (!data || typeof data !== 'object') {
    throw new HttpsError('invalid-argument', 'Config object required');
  }
  const allowed = [
    'courseFee', 'joiningFee', 'retakeFee', 'reactivationFee',
    'employerSubscriptionFee', 'cvUnlockPricing', 'currency'
  ];
  const updates = {};
  for (const key of allowed) {
    if (data[key] !== undefined) updates[key] = data[key];
  }
  if (Object.keys(updates).length === 0) {
    throw new HttpsError('invalid-argument', 'No allowed fields to update');
  }
  updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
  updates.updatedBy = callerUid;
  await db.collection('pricing_config').doc('default').set(updates, { merge: true });
  await writeAuditLog({
    userId: callerUid,
    userRole: 'admin',
    action: 'pricing_updated',
    entityType: 'pricing_config',
    entityId: 'default',
    changes: updates
  });
  return { success: true };
});

// NOTE: Image uploads are now handled directly in the frontend
// Images are stored as Base64 strings in Firestore (no Firebase Storage used)
// Cloud Functions for Storage uploads have been removed
