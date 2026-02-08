import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { demoUnlockLocal } from '../../lib/dbUpdates';
import { useAuth } from '../../contexts/AuthContext';
import { EmployerLayout } from '../../components/EmployerLayout';

export const EmployerSubscriptionPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const success = searchParams.get('success');
  const [subscription, setSubscription] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (success === '1') {
      navigate('/employer/dashboard', { replace: true });
      return;
    }
  }, [success, navigate]);

  useEffect(() => {
    const load = async () => {
      try {
        const pricingSnap = await getDoc(doc(db, 'pricing_config', 'default'));
        if (pricingSnap.exists()) setPricing(pricingSnap.data());

        const subsSnap = await getDocs(
          query(
            collection(db, 'subscriptions'),
            where('employerId', '==', user.uid),
            where('status', 'in', ['active', 'trialing']),
            limit(1)
          )
        );
        if (!subsSnap.empty) {
          setSubscription(subsSnap.docs[0].data());
        }
      } catch (err) {
        setError('Failed to load');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.uid]);

  const handleActivate = async () => {
    setActivating(true);
    setError(null);
    try {
      await demoUnlockLocal(db, user.uid, { type: 'subscription' });
      setSubscription({ status: 'active' });
      window.location.reload();
    } catch (err) {
      setError(err.message || 'Activation failed');
    } finally {
      setActivating(false);
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

  if (subscription) {
    return (
      <EmployerLayout>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Subscription</h1>
        <div className="card max-w-2xl">
          <div className="flex items-center gap-2 text-green-600 font-medium mb-2">
            <span>Active</span>
          </div>
          <p className="text-gray-600 text-sm">
            Your subscription is active. You have access to the candidate pool and can unlock CVs.
          </p>
        </div>
      </EmployerLayout>
    );
  }

  const amount = pricing?.employerSubscriptionFee ?? 9900;

  return (
    <EmployerLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Subscription</h1>
      <div className="card max-w-2xl">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Monthly subscription</h2>
        <p className="text-gray-600 text-sm mb-4">
          Subscribe to access the candidate pool. Filter by star rating and pay to unlock CV/contact.
        </p>
        <p className="text-2xl font-bold text-primary-600 mb-4">
          £{(amount / 100).toFixed(2)} / month
        </p>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm mb-4">
            {error}
          </div>
        )}
        <button
          onClick={handleActivate}
          disabled={activating}
          className="btn-primary"
        >
          {activating ? 'Activating...' : 'Activate subscription'}
        </button>
      </div>
    </EmployerLayout>
  );
};
