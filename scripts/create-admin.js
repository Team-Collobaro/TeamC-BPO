import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
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

const createAdminUser = async () => {
  console.log('👤 Creating admin user...\n');

  // Get email and password from command line arguments or use defaults
  const email = process.argv[2] || 'admin@example.com';
  const password = process.argv[3] || 'admin123456';
  const displayName = process.argv[4] || 'Admin User';

  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;
    
    // Create user document in Firestore with admin role
    await setDoc(doc(db, 'users', userId), {
      email,
      role: 'admin',
      displayName,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      emailVerified: false
    });

    console.log('✅ Admin user created successfully!\n');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 User ID:', userId);
    console.log('🎭 Role: admin\n');
    console.log('📝 Next steps:');
    console.log('   1. The Cloud Function will automatically set custom claims');
    console.log('   2. Run: npm run dev');
    console.log(`   3. Login at: http://localhost:5173/login`);
    console.log(`   4. Use email: ${email}`);
    console.log(`   5. Use password: ${password}`);
    console.log('   6. You will be redirected to /admin/dashboard\n');
    
    process.exit(0);
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log(`❌ Error: Email ${email} is already registered.`);
      console.log('   If this user exists, you can manually update their role in Firestore:');
      console.log(`   Collection: users/${error.customData?.uid || 'USER_ID'}`);
      console.log('   Field: role = "admin"\n');
      console.log('   Or use a different email address.\n');
    } else {
      console.error('❌ Error creating admin user:', error.message);
    }
    process.exit(1);
  }
};

createAdminUser();
