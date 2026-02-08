import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { demoUnlockLocal } from '../../lib/dbUpdates';
import { useAuth } from '../../contexts/AuthContext';
import { ROLES } from '../../lib/firebase';
import { LearnerLayout } from '../../components/LearnerLayout';
import { CandidateLayout } from '../../components/CandidateLayout';

const profileCollection = (role) =>
  role === ROLES.CANDIDATE ? 'candidate_profiles' : 'learner_profiles';

const profilePath = (role) =>
  role === ROLES.CANDIDATE ? '/candidate/profile' : '/learner/profile';

const dashboardPath = (role) =>
  role === ROLES.CANDIDATE ? '/candidate/dashboard' : '/learner/dashboard';

export const ReactivationPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState(null);
  const [reactivated, setReactivated] = useState(false);

  const role = user?.role || ROLES.LEARNER;
  const collection = profileCollection(role);
  const Layout = role === ROLES.CANDIDATE ? CandidateLayout : LearnerLayout;

  useEffect(() => {
    const load = async () => {
      if (!user?.uid) return;
      try {
        const [profileSnap, pricingSnap] = await Promise.all([
          getDoc(doc(db, collection, user.uid)),
          getDoc(doc(db, 'pricing_config', 'default'))
        ]);
        if (profileSnap.exists()) setProfile(profileSnap.data());
        if (pricingSnap.exists()) setPricing(pricingSnap.data());
      } catch (err) {
        setError('Failed to load');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.uid, collection]);

  const amount = pricing?.reactivationFee ?? 1500;
  const isInactive = profile?.visibleToEmployers === false && profile?.autoInactiveTimestamp;

  const handleReactivate = async () => {
    setUnlocking(true);
    setError(null);
    try {
      await demoUnlockLocal(db, user.uid, { type: 'reactivation' });
      setReactivated(true);
    } catch (err) {
      setError(err.message || 'Reactivation failed');
    } finally {
      setUnlocking(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  if (reactivated) {
    return (
      <Layout>
        <div className="card max-w-md text-center">
          <p className="text-green-600 font-medium mb-4">Profile reactivated. You are visible to employers again.</p>
          <button onClick={() => navigate(profilePath(role))} className="btn-primary">
            My Profile
          </button>
        </div>
      </Layout>
    );
  }

  if (!isInactive) {
    return (
      <Layout>
        <div className="card max-w-md">
          <p className="text-gray-600">Your profile is active. No reactivation needed.</p>
          <button onClick={() => navigate(dashboardPath(role))} className="btn-primary mt-4">
            Dashboard
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reactivation</h1>
      <div className="card max-w-2xl mb-6 bg-amber-50 border border-amber-200">
        <h2 className="text-lg font-semibold text-amber-800 mb-2">Profile inactive</h2>
        <p className="text-amber-700 text-sm mb-4">
          Your profile was set to inactive because we did not receive a response to the job-seeking survey within 48 hours. Reactivate to make your profile visible to employers again.
        </p>
      </div>
      <div className="card max-w-2xl">
        <p className="text-2xl font-bold text-primary-600 mb-4">
          £{(amount / 100).toFixed(2)}
        </p>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm mb-4">
            {error}
          </div>
        )}
        <button
          onClick={handleReactivate}
          disabled={unlocking}
          className="btn-primary"
        >
          {unlocking ? 'Reactivating...' : 'Reactivate'}
        </button>
      </div>
    </Layout>
  );
};
