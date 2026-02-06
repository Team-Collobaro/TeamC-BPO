import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { isStripeConfigured } from '../../lib/stripe';
import { EmployerLayout } from '../../components/EmployerLayout';

export const EmployerSubscriptionPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const success = searchParams.get('success');
  const [subscription, setSubscription] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startingCheckout, setStartingCheckout] = useState(false);
  const [demoActivating, setDemoActivating] = useState(false);
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

  const handleSubscribe = async () => {
    setStartingCheckout(true);
    setError(null);
    try {
      const createSession = httpsCallable(functions, 'createSubscriptionCheckoutSession');
      const origin = window.location.origin;
      const result = await createSession({
        successUrl: `${origin}/employer/subscription?success=1`,
        cancelUrl: `${origin}/employer/subscription?cancel=1`
      });
      if (result.data?.url) {
        window.location.href = result.data.url;
      } else {
        setError('No checkout URL returned');
      }
    } catch (err) {
      setError(err.message || 'Failed to start checkout');
    } finally {
      setStartingCheckout(false);
    }
  };

  const handleDemoActivate = async () => {
    setDemoActivating(true);
    setError(null);
    try {
      const demoUnlock = httpsCallable(functions, 'demoUnlock');
      await demoUnlock({ type: 'subscription' });
      setSubscription({ status: 'active' });
      window.location.reload();
    } catch (err) {
      setError(err.message || 'Demo activation failed');
    } finally {
      setDemoActivating(false);
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
        <div className="flex flex-wrap gap-3">
          {isStripeConfigured() ? (
            <button
              onClick={handleSubscribe}
              disabled={startingCheckout}
              className="btn-primary"
            >
              {startingCheckout ? 'Redirecting...' : 'Subscribe'}
            </button>
          ) : (
            <button
              onClick={handleDemoActivate}
              disabled={demoActivating}
              className="btn-primary bg-amber-600 hover:bg-amber-700"
            >
              {demoActivating ? 'Activating...' : 'Activate subscription (demo — no payment)'}
            </button>
          )}
        </div>
      </div>
    </EmployerLayout>
  );
};
