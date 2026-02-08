import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { demoUnlockLocal } from '../../lib/dbUpdates';
import { useAuth } from '../../contexts/AuthContext';
import { CandidateLayout } from '../../components/CandidateLayout';

export const CandidateJoiningFeePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getDoc(doc(db, 'pricing_config', 'default'))
      .then((snap) => snap.exists && setPricing(snap.data()))
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const amount = pricing?.joiningFee ?? 2500;

  const handleUnlock = async () => {
    setUnlocking(true);
    setError(null);
    try {
      await demoUnlockLocal(db, user.uid, { type: 'joining_fee' });
      navigate('/candidate/dashboard');
    } catch (err) {
      setError(err.message || 'Unlock failed');
    } finally {
      setUnlocking(false);
    }
  };

  if (loading) {
    return (
      <CandidateLayout>
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </CandidateLayout>
    );
  }

  return (
    <CandidateLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Pay Joining Fee</h1>
      <div className="card max-w-2xl">
        <p className="text-gray-600 text-sm mb-4">
          One-time joining fee to unlock the final questionnaire. One attempt is included; resits require the full fee.
        </p>
        <p className="text-2xl font-bold text-primary-600 mb-4">
          £{(amount / 100).toFixed(2)}
        </p>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm mb-4">
            {error}
          </div>
        )}
        <button
          onClick={handleUnlock}
          disabled={unlocking}
          className="btn-primary"
        >
          {unlocking ? 'Unlocking...' : 'Unlock questionnaire'}
        </button>
      </div>
    </CandidateLayout>
  );
};
