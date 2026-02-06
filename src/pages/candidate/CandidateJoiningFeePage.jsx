import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { isStripeConfigured } from '../../lib/stripe';
import { CandidateLayout } from '../../components/CandidateLayout';
import { PaymentForm } from '../../components/PaymentForm';

export const CandidateJoiningFeePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pricing, setPricing] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [demoUnlocking, setDemoUnlocking] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getDoc(doc(db, 'pricing_config', 'default'))
      .then((snap) => snap.exists && setPricing(snap.data()))
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const amount = pricing?.joiningFee ?? 2500;

  const handleStartPayment = async () => {
    setCreatingPayment(true);
    setError(null);
    try {
      const processPayment = httpsCallable(functions, 'processPayment');
      const result = await processPayment({
        paymentType: 'joining_fee',
        amount,
        currency: 'gbp',
        metadata: { userId: user.uid }
      });
      setClientSecret(result.data.clientSecret);
    } catch (err) {
      setError(err.message || 'Failed to create payment');
    } finally {
      setCreatingPayment(false);
    }
  };

  const handleDemoUnlock = async () => {
    setDemoUnlocking(true);
    setError(null);
    try {
      const demoUnlock = httpsCallable(functions, 'demoUnlock');
      await demoUnlock({ type: 'joining_fee' });
      navigate('/candidate/dashboard');
    } catch (err) {
      setError(err.message || 'Demo unlock failed');
    } finally {
      setDemoUnlocking(false);
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
        {!clientSecret ? (
          <div className="flex flex-wrap gap-3">
            {isStripeConfigured() ? (
              <button
                onClick={handleStartPayment}
                disabled={creatingPayment}
                className="btn-primary"
              >
                {creatingPayment ? 'Preparing...' : 'Pay Joining Fee'}
              </button>
            ) : (
              <button
                onClick={handleDemoUnlock}
                disabled={demoUnlocking}
                className="btn-primary bg-amber-600 hover:bg-amber-700"
              >
                {demoUnlocking ? 'Unlocking...' : 'Unlock questionnaire (demo — no payment)'}
              </button>
            )}
          </div>
        ) : (
          <PaymentForm
            clientSecret={clientSecret}
            amount={amount}
            paymentType="joining_fee"
            metadata={{ userId: user.uid }}
            onSuccess={() => navigate('/candidate/dashboard')}
            onCancel={() => setClientSecret(null)}
          />
        )}
      </div>
    </CandidateLayout>
  );
};
