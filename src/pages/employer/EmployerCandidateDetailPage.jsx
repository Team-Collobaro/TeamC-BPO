import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, getDocs, query, where, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { demoUnlockLocal } from '../../lib/dbUpdates';
import { useAuth } from '../../contexts/AuthContext';
import { EmployerLayout } from '../../components/EmployerLayout';

export const EmployerCandidateDetailPage = () => {
  const { candidateId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [pricing, setPricing] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!candidateId) return;
      try {
        const [profileSnap, pricingSnap, unlocksSnap] = await Promise.all([
          getDoc(doc(db, 'candidate_profiles', candidateId)),
          getDoc(doc(db, 'pricing_config', 'default')),
          getDocs(
            query(
              collection(db, 'cv_unlocks'),
              where('employerId', '==', user.uid),
              where('candidateId', '==', candidateId)
            )
          )
        ]);
        if (profileSnap.exists()) {
          setCandidate({ uid: candidateId, ...profileSnap.data() });
        }
        if (pricingSnap.exists()) setPricing(pricingSnap.data());
        setUnlocked(!unlocksSnap.empty);
      } catch (err) {
        setError('Failed to load');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [candidateId, user?.uid]);

  const starRating = candidate?.latestStarRating ?? 0;
  const priceKey = `${starRating}-star`;
  const amount = (pricing?.cvUnlockPricing?.[priceKey] ?? (100 * starRating)) || 500;

  const checkUnlocked = async () => {
    const unlocksSnap = await getDocs(
      query(
        collection(db, 'cv_unlocks'),
        where('employerId', '==', user.uid),
        where('candidateId', '==', candidateId)
      )
    );
    setUnlocked(!unlocksSnap.empty);
  };

  const handleUnlock = async () => {
    setUnlocking(true);
    setError(null);
    try {
      await demoUnlockLocal(db, user.uid, { type: 'cv_unlock', candidateId });
      await checkUnlocked();
    } catch (err) {
      setError(err.message || 'Unlock failed');
    } finally {
      setUnlocking(false);
    }
  };

  if (loading) {
    return (
      <EmployerLayout>
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </EmployerLayout>
    );
  }

  if (!candidate) {
    return (
      <EmployerLayout>
        <div className="card">
          <p className="text-gray-600">Candidate not found.</p>
          <button onClick={() => navigate('/employer/candidates')} className="btn-primary mt-4">
            Back to pool
          </button>
        </div>
      </EmployerLayout>
    );
  }

  return (
    <EmployerLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Candidate</h1>
      <div className="card max-w-2xl mb-6">
        <p className="text-sm text-gray-500 mb-1">Rating</p>
        <p className="text-2xl font-bold text-primary-600 mb-4">
          {starRating > 0 ? `${starRating}★` : '—'}
        </p>
        <p className="text-sm text-gray-600 mb-4">
          Score: {candidate.latestScore ?? '—'}%
        </p>
        {candidate.skills?.length > 0 && (
          <p className="text-sm text-gray-600 mb-4">
            Skills: {candidate.skills.join(', ')}
          </p>
        )}

        {unlocked ? (
          <div className="border-t pt-4">
            <p className="font-medium text-gray-900 mb-2">CV & contact (unlocked)</p>
            <p className="text-sm text-gray-600">
              CV and contact details would be visible here after unlock. (Stored in cv_unlocks after payment.)
            </p>
          </div>
        ) : (
          <>
            <p className="text-lg font-semibold text-gray-900 mb-2">
              Unlock CV: £{(amount / 100).toFixed(2)}
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
              {unlocking ? 'Unlocking...' : `Unlock CV — £${(amount / 100).toFixed(2)}`}
            </button>
          </>
        )}
      </div>
      <button onClick={() => navigate('/employer/candidates')} className="btn-secondary">
        Back to pool
      </button>
    </EmployerLayout>
  );
};
