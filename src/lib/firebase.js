import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
if (!apiKey || apiKey === 'your-api-key' || String(apiKey).trim().startsWith('your-')) {
  const msg =
    'Firebase API key is missing or still a placeholder. ' +
    'Create .env.local in the project root (copy env.example), set VITE_FIREBASE_API_KEY to your Web API key from Firebase Console → Project settings → General, then restart the dev server.';
  console.error(msg);
  throw new Error(msg);
}

const firebaseConfig = {
  apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Role constants for RBAC
export const ROLES = {
  LEARNER: 'learner',
  CANDIDATE: 'candidate',
  EMPLOYER: 'employer',
  ADMIN: 'admin'
};

export default app;
