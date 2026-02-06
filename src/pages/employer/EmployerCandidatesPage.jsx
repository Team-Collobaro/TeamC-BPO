import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { EmployerLayout } from '../../components/EmployerLayout';

const CV_UNLOCK_LABELS = {
  5: '5★',
  4: '4★',
  3: '3★',
  2: '2★',
  1: '1★'
};

export const EmployerCandidatesPage = () => {
  const { user } = useAuth();
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starFilter, setStarFilter] = useState(null);
  const [shortlisting, setShortlisting] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const subsSnap = await getDocs(
          query(
            collection(db, 'subscriptions'),
            where('employerId', '==', user.uid),
            where('status', 'in', ['active', 'trialing'])
          )
        );
        setSubscriptionActive(!subsSnap.empty);

        const pricingSnap = await getDoc(doc(db, 'pricing_config', 'default'));
        if (pricingSnap.exists()) setPricing(pricingSnap.data());

        const profilesSnap = await getDocs(
          query(
            collection(db, 'candidate_profiles'),
            where('visibleToEmployers', '==', true)
          )
        );
        const list = [];
        profilesSnap.docs.forEach((d) => {
          const data = d.data();
          list.push({ uid: d.id, ...data });
        });
        setCandidates(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.uid]);

  const handleShortlist = async (candidateId) => {
    setShortlisting((s) => ({ ...s, [candidateId]: true }));
    try {
      const shortlistRef = doc(
        db,
        'employer_shortlists',
        `${user.uid}_${candidateId}`
      );
      await setDoc(shortlistRef, {
        employerId: user.uid,
        candidateId,
        stage: 'shortlisted',
        addedAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
        cvUnlocked: false
      }, { merge: true });
    } catch (err) {
      console.error(err);
    } finally {
      setShortlisting((s) => ({ ...s, [candidateId]: false }));
    }
  };

  const getUnlockPrice = (starRating) => {
    const key = `${starRating}-star`;
    const map = pricing?.cvUnlockPricing || {};
    return map[key] ?? (100 * starRating);
  };

  const filtered = starFilter
    ? candidates.filter((c) => (c.latestStarRating || 0) === starFilter)
    : candidates;

  if (loading) {
    return (
      <EmployerLayout>
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </EmployerLayout>
    );
  }

  if (!subscriptionActive) {
    return (
      <EmployerLayout>
        <div className="card max-w-2xl">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Subscription required</h2>
          <p className="text-gray-600 text-sm mb-4">
            Subscribe to view the candidate pool and unlock CVs.
          </p>
          <Link to="/employer/subscription" className="btn-primary inline-block">
            View subscription
          </Link>
        </div>
      </EmployerLayout>
    );
  }

  return (
    <EmployerLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Candidate Pool</h1>
      <div className="mb-6 flex flex-wrap gap-2 items-center">
        <span className="text-sm font-medium text-gray-700">Filter by rating:</span>
        {[5, 4, 3, 2, 1].map((s) => (
          <button
            key={s}
            onClick={() => setStarFilter(starFilter === s ? null : s)}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              starFilter === s ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {CV_UNLOCK_LABELS[s]}
          </button>
        ))}
      </div>
      <div className="space-y-4">
        {filtered.map((c) => {
          const stars = c.latestStarRating ?? 0;
          const price = getUnlockPrice(stars);
          return (
            <div key={c.uid} className="card flex flex-wrap justify-between items-center gap-4">
              <div>
                <p className="font-medium text-gray-900">
                  Candidate {c.uid.slice(0, 8)}…
                </p>
                <p className="text-sm text-gray-600">
                  Rating: {stars > 0 ? `${stars}★` : '—'} • Unlock: £{(price / 100).toFixed(2)}
                </p>
                {c.skills?.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Skills: {c.skills.join(', ')}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Link
                  to={`/employer/candidates/${c.uid}`}
                  className="btn-primary"
                >
                  View / Unlock CV
                </Link>
                <button
                  onClick={() => handleShortlist(c.uid)}
                  disabled={shortlisting[c.uid]}
                  className="btn-secondary"
                >
                  {shortlisting[c.uid] ? 'Adding…' : 'Shortlist'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <div className="card">
          <p className="text-gray-600">No candidates match your filters.</p>
        </div>
      )}
    </EmployerLayout>
  );
};
