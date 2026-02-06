import { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, ROLES } from '../lib/firebase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const buildUserFromFirebase = async (firebaseUser) => {
    // Token first (works offline); Firestore for profile data when online
    const tokenResult = await firebaseUser.getIdTokenResult();
    const role = tokenResult.claims?.role || ROLES.LEARNER;
    const subscriptionActive = !!tokenResult.claims?.subscriptionActive;
    const profileComplete = !!tokenResult.claims?.profileComplete;

    let userData = {};
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) userData = userDoc.data();
    } catch (err) {
      // Client offline or Firestore unavailable – use token claims only
      if (err?.code === 'unavailable' || err?.message?.includes('offline')) {
        console.warn('Firestore offline – using auth token for user role.');
      } else {
        console.error('Error loading user profile:', err);
      }
    }

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: userData.displayName || '',
      role: userData.role || role,
      status: userData.status || 'active',
      emailVerified: firebaseUser.emailVerified,
      subscriptionActive,
      profileComplete,
      ...userData
    };
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const fullUser = await buildUserFromFirebase(firebaseUser);
          setUser(fullUser);
        } catch (err) {
          console.error('Error loading user:', err);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: ROLES.LEARNER,
            displayName: '',
            status: 'active',
            emailVerified: firebaseUser.emailVerified
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const refreshUserClaims = async () => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      await firebaseUser.getIdToken(true);
      const fullUser = await buildUserFromFirebase(firebaseUser);
      setUser(fullUser);
    }
  };

  const signUp = async (email, password, role = ROLES.LEARNER, profile = {}) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    const now = new Date().toISOString();
    await setDoc(doc(db, 'users', uid), {
      email,
      role,
      displayName: profile.displayName || '',
      phoneNumber: profile.phoneNumber || null,
      timezone: profile.timezone || null,
      companyName: profile.companyName || null,
      companyRegNumber: profile.companyRegNumber || null,
      status: 'active',
      createdAt: now,
      lastLoginAt: now,
      emailVerified: false
    });
    return userCredential.user;
  };

  const signIn = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    return firebaseSignOut(auth);
  };

  const isLearner = () => user?.role === ROLES.LEARNER;
  const isCandidate = () => user?.role === ROLES.CANDIDATE;
  const isEmployer = () => user?.role === ROLES.EMPLOYER;
  const isAdmin = () => user?.role === ROLES.ADMIN;

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    refreshUserClaims,
    isLearner,
    isCandidate,
    isEmployer,
    isAdmin,
    ROLES
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
