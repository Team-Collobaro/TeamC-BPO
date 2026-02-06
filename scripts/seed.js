import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const seedData = async () => {
  console.log('🌱 Starting database seed...\n');

  try {
    // Create a course
    const courseId = 'bpo-fundamentals-101';
    console.log('📚 Creating course...');
    
    await setDoc(doc(db, 'courses', courseId), {
      title: 'BPO Fundamentals 101',
      description: 'Master the essential skills for Business Process Outsourcing operations. Learn customer service, communication, and best practices.',
      createdAt: new Date().toISOString()
    });
    console.log('✅ Course created: BPO Fundamentals 101\n');

    // Create modules
    console.log('📖 Creating modules...');
    
    const modules = [
      {
        id: 'module-1-intro',
        title: 'Introduction to BPO',
        description: 'Understanding the BPO industry and your role',
        order: 1,
        bunnyEmbedUrl: 'https://iframe.mediadelivery.net/embed/YOUR_LIBRARY_ID/YOUR_VIDEO_ID_1?autoplay=false&preload=true',
        mcq: [
          {
            id: 'q1',
            question: 'What does BPO stand for?',
            options: [
              'Business Process Outsourcing',
              'Business Professional Organization',
              'Basic Process Operations',
              'Business Performance Optimization'
            ],
            correctIndex: 0
          },
          {
            id: 'q2',
            question: 'Which of the following is a key benefit of BPO?',
            options: [
              'Increased operational costs',
              'Access to specialized expertise',
              'Reduced service quality',
              'Limited scalability'
            ],
            correctIndex: 1
          },
          {
            id: 'q3',
            question: 'What is the primary goal of a BPO professional?',
            options: [
              'To minimize customer interactions',
              'To deliver high-quality service efficiently',
              'To reduce company transparency',
              'To work independently without collaboration'
            ],
            correctIndex: 1
          }
        ]
      },
      {
        id: 'module-2-communication',
        title: 'Effective Communication Skills',
        description: 'Master professional communication techniques',
        order: 2,
        bunnyEmbedUrl: 'https://iframe.mediadelivery.net/embed/YOUR_LIBRARY_ID/YOUR_VIDEO_ID_2?autoplay=false&preload=true',
        mcq: [
          {
            id: 'q1',
            question: 'What is active listening?',
            options: [
              'Waiting for your turn to speak',
              'Fully concentrating and understanding what is being said',
              'Listening to music while working',
              'Only hearing the words spoken'
            ],
            correctIndex: 1
          },
          {
            id: 'q2',
            question: 'Which communication method is best for complex issues?',
            options: [
              'Text message',
              'Email with detailed explanation',
              'Quick phone call',
              'Social media post'
            ],
            correctIndex: 1
          },
          {
            id: 'q3',
            question: 'What should you do when a customer is upset?',
            options: [
              'Argue back to defend yourself',
              'Remain calm and empathetic',
              'Transfer them immediately',
              'End the conversation quickly'
            ],
            correctIndex: 1
          }
        ]
      },
      {
        id: 'module-3-customer-service',
        title: 'Customer Service Excellence',
        description: 'Deliver outstanding customer experiences',
        order: 3,
        bunnyEmbedUrl: 'https://iframe.mediadelivery.net/embed/YOUR_LIBRARY_ID/YOUR_VIDEO_ID_3?autoplay=false&preload=true',
        mcq: [
          {
            id: 'q1',
            question: 'What is the first step in resolving a customer complaint?',
            options: [
              'Blame another department',
              'Acknowledge and apologize',
              'Offer a refund immediately',
              'Defend company policy'
            ],
            correctIndex: 1
          },
          {
            id: 'q2',
            question: 'How should you handle a request you cannot fulfill?',
            options: [
              'Say "That\'s impossible"',
              'Offer alternative solutions',
              'Ignore the customer',
              'Transfer without explanation'
            ],
            correctIndex: 1
          },
          {
            id: 'q3',
            question: 'What demonstrates good follow-up?',
            options: [
              'Never contacting the customer again',
              'Checking if the issue was resolved satisfactorily',
              'Waiting for them to complain again',
              'Assuming everything is fine'
            ],
            correctIndex: 1
          }
        ]
      }
    ];

    for (const module of modules) {
      await setDoc(doc(db, 'courses', courseId, 'modules', module.id), module);
      console.log(`✅ Module ${module.order}: ${module.title}`);
    }
    console.log('\n📦 All modules created!\n');

    // Create final questionnaire
    const questionnaireId = 'final-assessment';
    console.log('📝 Creating final questionnaire...');
    await setDoc(doc(db, 'questionnaires', questionnaireId), {
      title: 'Final Assessment',
      description: 'Final questionnaire after course completion',
      courseId: courseId,
      isFinalAssessment: true,
      passingScore: 60,
      questions: [
        { id: 'f1', question: 'What does BPO stand for?', type: 'multiple-choice', options: ['Business Process Outsourcing', 'Business Professional Organization', 'Basic Process Operations'], correctIndex: 0, points: 1 },
        { id: 'f2', question: 'Which is a key benefit of BPO?', type: 'multiple-choice', options: ['Higher costs', 'Access to specialized expertise', 'Reduced quality'], correctIndex: 1, points: 1 },
        { id: 'f3', question: 'Active listening means fully concentrating on what is being said.', type: 'multiple-choice', options: ['True', 'False'], correctIndex: 0, points: 1 }
      ],
      starMapping: { '90-100': 5, '80-89': 4, '70-79': 3, '60-69': 2, '0-59': 1 }
    });
    console.log('✅ Questionnaire created\n');

    // Pricing config (single doc)
    await setDoc(doc(db, 'pricing_config', 'default'), {
      courseFee: 5000,
      joiningFee: 2500,
      retakeFee: 2500,
      reactivationFee: 1500,
      employerSubscriptionFee: 9900,
      cvUnlockPricing: { '5-star': 500, '4-star': 400, '3-star': 300, '2-star': 200, '1-star': 100 },
      currency: 'GBP',
      updatedAt: new Date().toISOString(),
      updatedBy: 'seed'
    });

    // System config (internship, survey, etc.)
    await setDoc(doc(db, 'system_config', 'default'), {
      jobSeekingSurveyEnabled: true,
      surveyTimeoutHours: 48,
      autoInactiveEnabled: true,
      internshipProgramEnabled: true,
      internshipSlots: 10
    });

    // Create a demo user
    console.log('👤 Creating demo user...');
    const demoEmail = 'learner@demo.com';
    const demoPassword = 'password123';
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, demoEmail, demoPassword);
      const userId = userCredential.user.uid;
      
      // Create user document
      await setDoc(doc(db, 'users', userId), {
        email: demoEmail,
        role: 'learner',
        createdAt: new Date().toISOString()
      });

      // Initialize progress for the course
      await setDoc(doc(db, 'users', userId, 'progress', courseId), {
        unlockedModuleOrder: 1,
        completedModules: {}
      });

      console.log(`✅ Demo user created: ${demoEmail} / ${demoPassword}`);
      console.log(`   User ID: ${userId}\n`);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('ℹ️  Demo user already exists: learner@demo.com\n');
      } else {
        throw error;
      }
    }

    console.log('✨ Seed completed successfully!\n');
    console.log('📝 Next steps:');
    console.log('   1. Replace Bunny Stream embed URLs in the modules');
    console.log('   2. Run: npm run dev');
    console.log('   3. Login with: learner@demo.com / password123\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
