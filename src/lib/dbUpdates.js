/**
 * Direct Firestore updates so the app can work without Cloud Functions.
 * Use these when you want to "just update the database" from the client.
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  runTransaction,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  deleteField
} from 'firebase/firestore';

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
 * Save MCQ draft answers (selections before submit) to the database.
 * Used so answers persist if the user leaves and comes back.
 */
export async function saveMcqDraftLocal(db, userId, { courseId, moduleId, draftAnswers }) {
  if (!courseId || !moduleId || typeof draftAnswers !== 'object') return;
  const progressRef = doc(db, 'users', userId, 'progress', courseId);
  const progressSnap = await getDoc(progressRef);
  const existing = progressSnap.exists() ? progressSnap.data() : { unlockedModuleOrder: 1, completedModules: {} };
  const completedModules = { ...(existing.completedModules || {}) };
  const currentModule = { ...(completedModules[moduleId] || {}) };
  currentModule.mcqDraft = draftAnswers;
  completedModules[moduleId] = currentModule;
  await setDoc(progressRef, { ...existing, completedModules }, { merge: true });
}

/**
 * Submit MCQ. Saves answers and result to the database (always). Unlocks next module only when 100% and video completed.
 */
export async function submitMcqLocal(db, userId, { courseId, moduleId, answers }) {
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/41320592-e9da-445d-8f78-690f29197d46',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dbUpdates.js:43',message:'submitMcqLocal called',data:{userId,courseId,moduleId,answersLength:answers?.length,answers:answers},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  
  if (!courseId || !moduleId || !Array.isArray(answers)) {
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/41320592-e9da-445d-8f78-690f29197d46',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dbUpdates.js:45',message:'Missing required parameters',data:{courseId,moduleId,isArray:Array.isArray(answers)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    throw new Error('Missing required parameters');
  }

  const moduleRef = doc(db, 'courses', courseId, 'modules', moduleId);
  const progressRef = doc(db, 'users', userId, 'progress', courseId);

  const [moduleSnap, progressSnap] = await Promise.all([
    getDoc(moduleRef),
    getDoc(progressRef)
  ]);

  if (!moduleSnap.exists()) {
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/41320592-e9da-445d-8f78-690f29197d46',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dbUpdates.js:56',message:'Module not found',data:{courseId,moduleId},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    throw new Error('Module not found');
  }
  const moduleData = moduleSnap.data();
  const mcqQuestions = moduleData.mcq || [];
  
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/41320592-e9da-445d-8f78-690f29197d46',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dbUpdates.js:58',message:'Module data loaded',data:{mcqQuestionsLength:mcqQuestions.length,answersLength:answers.length},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  // Initialize progress if it doesn't exist
  let progressData;
  if (!progressSnap.exists()) {
    // Create initial progress
    const initialProgress = {
      unlockedModuleOrder: 1,
      completedModules: {}
    };
    await setDoc(progressRef, initialProgress);
    progressData = initialProgress;
  } else {
    progressData = progressSnap.data();
  }

  if (moduleData.order > progressData.unlockedModuleOrder) {
    throw new Error('Module is locked. Complete previous modules first.');
  }

  if (answers.length !== mcqQuestions.length) {
    throw new Error(`Invalid number of answers. Expected ${mcqQuestions.length}, got ${answers.length}`);
  }

  // Validate answers are numbers
  answers.forEach((answer, i) => {
    if (typeof answer !== 'number' || isNaN(answer) || answer < 0) {
      throw new Error(`Invalid answer format at index ${i}. Expected a number, got: ${answer}`);
    }
  });

  // Calculate correctness for each answer (like video completion - always save)
  // Support both 'correctAnswer' (admin interface) and 'correctIndex' (legacy/seed data)
  const answerResults = mcqQuestions.map((question, index) => {
    const correctAnswerIndex = question.correctAnswer !== undefined ? question.correctAnswer : (question.correctIndex !== undefined ? question.correctIndex : -1);
    const isCorrect = answers[index] === correctAnswerIndex;
    
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/41320592-e9da-445d-8f78-690f29197d46',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dbUpdates.js:106',message:'Calculating answer correctness',data:{questionIndex:index,questionId:question.id,hasCorrectAnswer:question.correctAnswer!==undefined,hasCorrectIndex:question.correctIndex!==undefined,correctAnswer:question.correctAnswer,correctIndex:question.correctIndex,correctAnswerIndex,selectedAnswer:answers[index],isCorrect},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    
    return {
      questionId: question.id || `q${index}`, // Ensure questionId is never undefined
      selectedIndex: answers[index] ?? -1, // Ensure selectedIndex is never undefined
      correctIndex: correctAnswerIndex, // Use correctAnswer (admin) or correctIndex (legacy)
      isCorrect: Boolean(isCorrect) // Ensure isCorrect is always boolean
    };
  });

  let correctCount = answerResults.filter(r => r.isCorrect).length;
  const score = Math.round((correctCount / mcqQuestions.length) * 100) || 0; // Ensure score is never undefined
  const passed = score === 100;

  // Helper function to remove undefined values from object
  const removeUndefined = (obj) => {
    const cleaned = {};
    for (const key in obj) {
      if (obj[key] !== undefined) {
        cleaned[key] = obj[key];
      }
    }
    return cleaned;
  };

  // Always save answers to database (like video completion marking)
  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/41320592-e9da-445d-8f78-690f29197d46',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dbUpdates.js:115',message:'Starting transaction',data:{answerResultsLength:answerResults.length,score,passed},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  
  await runTransaction(db, async (transaction) => {
    const progressSnapTx = await transaction.get(progressRef);
    let currentProgress;
    
    if (!progressSnapTx.exists()) {
      // Initialize progress in transaction
      currentProgress = {
        unlockedModuleOrder: 1,
        completedModules: {}
      };
    } else {
      currentProgress = progressSnapTx.data();
    }

    const moduleProgress = currentProgress.completedModules?.[moduleId] || {};
    const cleanedModuleProgress = removeUndefined(moduleProgress);
    const { mcqDraft, ...moduleProgressWithoutDraft } = cleanedModuleProgress;

    const updatedModuleProgress = {
      ...moduleProgressWithoutDraft, // Preserve videoCompleted etc.; drop draft once submitted
      mcqAnswers: answerResults, // Store all answers with correctness in database
      mcqPassed: passed, // Only true if 100%
      score,
      mcqSubmittedAt: serverTimestamp()
    };
    
    // Ensure no undefined values in the final object
    const cleanedUpdatedModuleProgress = removeUndefined(updatedModuleProgress);
    
    const updatedCompletedModules = {
      ...currentProgress.completedModules,
      [moduleId]: cleanedUpdatedModuleProgress
    };

    // Only unlock next module if passed (100%) AND video was completed for this module
    let newUnlockedOrder = currentProgress.unlockedModuleOrder || 1;
    const videoCompleted = cleanedModuleProgress.videoCompleted === true;
    if (passed && moduleData.order === newUnlockedOrder && videoCompleted) {
      newUnlockedOrder = newUnlockedOrder + 1;
    }

    // Ensure update payload has no undefined values
    const updatePayload = removeUndefined({
      completedModules: updatedCompletedModules,
      unlockedModuleOrder: newUnlockedOrder
    });

    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/41320592-e9da-445d-8f78-690f29197d46',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dbUpdates.js:162',message:'About to update/set progress',data:{progressExists:progressSnapTx.exists(),updatePayloadKeys:Object.keys(updatePayload),hasMcqAnswers:!!updatePayload.completedModules?.[moduleId]?.mcqAnswers},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    if (progressSnapTx.exists()) {
      transaction.update(progressRef, updatePayload);
    } else {
      transaction.set(progressRef, updatePayload);
    }
  });

  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/41320592-e9da-445d-8f78-690f29197d46',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dbUpdates.js:169',message:'Transaction completed, returning result',data:{passed,score,correctCount,totalQuestions:mcqQuestions.length,answerResultsLength:answerResults.length,hasAnswerResults:!!answerResults},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  return {
    passed,
    score,
    correctCount,
    totalQuestions: mcqQuestions.length,
    answerResults, // Return detailed answer results
    nextUnlockedOrder: progressData.unlockedModuleOrder + (passed && moduleData.order === progressData.unlockedModuleOrder ? 1 : 0)
  };
}

/**
 * Submit final assessment: score, star rating, create assessment + certificate, update profile.
 */
export async function submitAssessmentLocal(db, userId, { questionnaireId, answers, courseId = null }) {
  if (!questionnaireId || !Array.isArray(answers)) {
    throw new Error('Missing questionnaireId or answers');
  }

  const questionnaireRef = doc(db, 'questionnaires', questionnaireId);
  const questionnaireSnap = await getDoc(questionnaireRef);
  if (!questionnaireSnap.exists()) throw new Error('Questionnaire not found');

  const questionnaire = questionnaireSnap.data();
  const questions = questionnaire.questions || [];
  const passingScore = questionnaire.passingScore ?? 60;
  const starMapping = questionnaire.starMapping || null;

  if (answers.length !== questions.length) {
    throw new Error('Invalid number of answers');
  }

  // Validate answers are numbers
  answers.forEach((answer, i) => {
    if (typeof answer !== 'number' || isNaN(answer) || answer < 0) {
      throw new Error(`Invalid answer format at index ${i}. Expected a number.`);
    }
  });

  // Calculate correctness for each question
  const questionResults = questions.map((q, i) => {
    const isCorrect = answers[i] === q.correctIndex;
    return {
      questionId: q.id,
      question: q.question,
      options: q.options,
      selectedIndex: answers[i],
      correctIndex: q.correctIndex,
      isCorrect
    };
  });

  const correctCount = questionResults.filter(r => r.isCorrect).length;
  const score = Math.round((correctCount / questions.length) * 100);
  const starRating = scoreToStarRating(score, starMapping);
  const passed = score >= passingScore;

  const assessmentRef = doc(collection(db, 'assessments'));
  const certificateRef = doc(collection(db, 'certificates'));
  const certificateNumber = 'CERT-' + Date.now() + '-' + userId.slice(0, 6);

  const userSnap = await getDoc(doc(db, 'users', userId));
  const userData = userSnap.exists ? userSnap.data() : {};
  const role = userData.role || 'learner';
  const profileCol = role === 'candidate' ? 'candidate_profiles' : 'learner_profiles';
  const profileRef = doc(db, profileCol, userId);
  const profileSnap = await getDoc(profileRef);
  const existing = profileSnap.exists ? profileSnap.data() : {};

  try {
    await runTransaction(db, async (transaction) => {
      transaction.set(assessmentRef, {
        userId,
        questionnaireId,
        courseId,
        attemptNumber: 1,
        startedAt: serverTimestamp(),
        submittedAt: serverTimestamp(),
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
        courseId,
        certificateNumber,
        issuedAt: serverTimestamp(),
        score,
        starRating,
        pdfUrl: null,
        isRevoked: false
      });

      transaction.set(profileRef, {
        ...existing,
        userId,
        latestStarRating: starRating,
        latestScore: score,
        latestAssessmentId: assessmentRef.id,
        updatedAt: serverTimestamp()
      }, { merge: true });
    });
  } catch (error) {
    console.error('Transaction error in submitAssessmentLocal:', error);
    throw new Error(`Failed to save assessment: ${error.message}`);
  }

  return {
    score,
    starRating,
    certificateId: certificateRef.id,
    certificateNumber,
    passed,
    correctCount,
    totalQuestions: questions.length,
    questionResults // Include detailed question results
  };
}

/**
 * Demo/unlock without Stripe: grant course access, questionnaire access, reactivation, cv_unlock, subscription.
 */
export async function demoUnlockLocal(db, userId, { type, courseId, candidateId }) {
  const valid = ['course_purchase', 'joining_fee', 'reactivation', 'cv_unlock', 'subscription'];
  if (!type || !valid.includes(type)) throw new Error('Invalid type');

  if (type === 'course_purchase') {
    if (!courseId) throw new Error('courseId required');
    await setDoc(doc(db, 'users', userId, 'course_access', courseId), {
      courseId,
      purchasedAt: serverTimestamp()
    });
    const progressRef = doc(db, 'users', userId, 'progress', courseId);
    const progressSnap = await getDoc(progressRef);
    if (!progressSnap.exists()) {
      await setDoc(progressRef, { unlockedModuleOrder: 1, completedModules: {} });
    }
    return { success: true, message: 'Course access granted (demo)' };
  }

  if (type === 'joining_fee') {
    await setDoc(doc(db, 'users', userId, 'questionnaire_access', 'default'), {
      unlocked: true,
      unlockedAt: serverTimestamp()
    });
    return { success: true, message: 'Questionnaire unlocked (demo)' };
  }

  if (type === 'reactivation') {
    const learnerRef = doc(db, 'learner_profiles', userId);
    const candidateRef = doc(db, 'candidate_profiles', userId);
    const [learnerSnap, candidateSnap] = await Promise.all([
      getDoc(learnerRef),
      getDoc(candidateRef)
    ]);
    const updates = {
      visibleToEmployers: true,
      autoInactiveTimestamp: deleteField(),
      updatedAt: serverTimestamp()
    };
    if (learnerSnap.exists) await updateDoc(learnerRef, updates);
    if (candidateSnap.exists) await updateDoc(candidateRef, updates);
    return { success: true, message: 'Profile reactivated (demo)' };
  }

  if (type === 'cv_unlock') {
    if (!candidateId || userId === candidateId) throw new Error('candidateId required for cv_unlock');
    const candidateProfile = await getDoc(doc(db, 'candidate_profiles', candidateId));
    const candidate = candidateProfile.exists ? candidateProfile.data() : {};
    const userDoc = await getDoc(doc(db, 'users', candidateId));
    const userData = userDoc.exists ? userDoc.data() : {};
    const unlockId = `demo_${userId}_${candidateId}_${Date.now()}`;
    await setDoc(doc(db, 'cv_unlocks', unlockId), {
      employerId: userId,
      candidateId,
      paymentId: unlockId,
      price: 0,
      starRating: candidate.latestStarRating || 0,
      unlockedAt: serverTimestamp(),
      candidateCvUrl: candidate.cvUrl || null,
      candidateEmail: userData.email || '',
      candidatePhone: candidate.phoneNumber || null
    });
    return { success: true, unlockId, message: 'CV unlocked (demo)' };
  }

  if (type === 'subscription') {
    const subId = `demo_sub_${userId}_${Date.now()}`;
    await setDoc(doc(db, 'subscriptions', subId), {
      employerId: userId,
      stripeSubscriptionId: subId,
      stripeCustomerId: null,
      status: 'active',
      plan: { name: 'Monthly (Demo)', amount: 0, interval: 'month' },
      currentPeriodStart: serverTimestamp(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
      createdAt: serverTimestamp()
    });
    return { success: true, message: 'Subscription active (demo)' };
  }

  throw new Error('Unknown type');
}

/**
 * Respond to job-seeking survey (yes/maybe/no). Updates profile and marks token used.
 */
export async function respondToSurveyLocal(db, userId, { token, response }) {
  if (!token || !['yes', 'maybe', 'no'].includes(response)) {
    throw new Error('Invalid token or response');
  }

  const tokenRef = doc(db, 'survey_tokens', token);
  const tokenSnap = await getDoc(tokenRef);
  if (!tokenSnap.exists || tokenSnap.data().userId !== userId) {
    throw new Error('Invalid or expired survey link');
  }

  const role = tokenSnap.data().role === 'candidate' ? 'candidate' : 'learner';
  const profileCol = role === 'candidate' ? 'candidate_profiles' : 'learner_profiles';
  const profileRef = doc(db, profileCol, userId);
  const now = serverTimestamp();

  await updateDoc(profileRef, {
    'jobSeekingStatus.lastResponseAt': now,
    'jobSeekingStatus.response': response,
    'jobSeekingStatus.confirmedAt': response !== 'no' ? now : null,
    updatedAt: now
  });

  if (response === 'no') {
    await updateDoc(profileRef, {
      visibleToEmployers: false,
      autoInactiveTimestamp: now,
      updatedAt: now
    });
  }

  await updateDoc(tokenRef, { used: true, usedAt: now });
  return { success: true, response };
}

/**
 * Apply for internship (5-star only). Creates internship_applications doc.
 */
export async function applyForInternshipLocal(db, userId, {
  assessmentId,
  availability,
  preferredStartDate,
  commitmentAgreed
}) {
  if (!assessmentId || typeof commitmentAgreed !== 'boolean' || !commitmentAgreed) {
    throw new Error('assessmentId and commitmentAgreed required');
  }

  const [assessmentSnap, configSnap, existingSnap] = await Promise.all([
    getDoc(doc(db, 'assessments', assessmentId)),
    getDoc(doc(db, 'system_config', 'default')),
    getDocs(query(collection(db, 'internship_applications'), where('learnerId', '==', userId)))
  ]);

  if (!assessmentSnap.exists()) throw new Error('Assessment not found');
  const assessment = assessmentSnap.data();
  if (assessment.userId !== userId) throw new Error('Assessment does not belong to you');
  if (assessment.starRating !== 5) throw new Error('Only 5-star assessments qualify for internship');

  const config = configSnap.exists ? configSnap.data() : {};
  if (config.internshipProgramEnabled === false) {
    throw new Error('Internship program is currently closed');
  }

  const acceptedSnap = await getDocs(
    query(collection(db, 'internship_applications'), where('status', '==', 'accepted'))
  );
  const slots = config.internshipSlots ?? 10;
  if (acceptedSnap.size >= slots) throw new Error('No internship slots available');

  const hasPending = existingSnap.docs.some((d) => d.data().status === 'pending');
  if (hasPending) throw new Error('You already have a pending application');

  const preferredDate = preferredStartDate
    ? (typeof preferredStartDate === 'string' ? new Date(preferredStartDate) : preferredStartDate)
    : null;

  const ref = doc(collection(db, 'internship_applications'));
  await setDoc(ref, {
    learnerId: userId,
    assessmentId,
    starRating: 5,
    appliedAt: serverTimestamp(),
    status: 'pending',
    availability: availability || '',
    preferredStartDate: preferredDate,
    commitmentAgreed: true
  });

  return { applicationId: ref.id, status: 'pending' };
}

/**
 * Admin: update internship application status. Caller must be admin (enforced by Firestore rules).
 */
export async function updateInternshipApplicationLocal(db, applicationId, { status, decisionNotes }) {
  const ref = doc(db, 'internship_applications', applicationId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Application not found');

  const configSnap = await getDoc(doc(db, 'system_config', 'default'));
  const slots = configSnap.exists ? configSnap.data()?.internshipSlots ?? 10 : 10;
  if (status === 'accepted') {
    const acceptedSnap = await getDocs(
      query(collection(db, 'internship_applications'), where('status', '==', 'accepted'))
    );
    if (acceptedSnap.size >= slots) throw new Error('No internship slots available');
  }

  await updateDoc(ref, {
    status,
    decisionNotes: decisionNotes || null,
    reviewedAt: serverTimestamp()
  });
  return { applicationId, status };
}

/**
 * Admin: update user status. Caller must be admin.
 */
export async function updateUserStatusLocal(db, userId, status) {
  const ref = doc(db, 'users', userId);
  await updateDoc(ref, { status, updatedAt: serverTimestamp() });
  return { userId, status };
}

/**
 * Admin: update pricing config. Caller must be admin.
 */
export async function updatePricingConfigLocal(db, updates) {
  const allowed = [
    'courseFee', 'joiningFee', 'retakeFee', 'reactivationFee',
    'employerSubscriptionFee', 'cvUnlockPricing', 'currency'
  ];
  const filtered = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) filtered[key] = updates[key];
  }
  if (Object.keys(filtered).length === 0) throw new Error('No allowed fields to update');
  const ref = doc(db, 'pricing_config', 'default');
  await setDoc(ref, { ...filtered, updatedAt: serverTimestamp() }, { merge: true });
  return { success: true };
}