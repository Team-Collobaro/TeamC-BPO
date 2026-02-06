import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStripe, isStripeConfigured } from '../lib/stripe';

const stripePromise = getStripe();

function CheckoutForm({ amount, paymentType, metadata, onSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);
    try {
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/learner/payment-success',
          receipt_email: metadata?.email || undefined,
          metadata: { ...metadata, paymentType }
        }
      });
      if (submitError) {
        setError(submitError.message || 'Payment failed');
      } else {
        onSuccess?.();
      }
    } catch (err) {
      setError(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
          {error}
        </div>
      )}
      <div className="flex gap-3">
        <button type="submit" disabled={!stripe || loading} className="btn-primary">
          {loading ? 'Processing...' : `Pay £${(amount / 100).toFixed(2)}`}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export function PaymentForm({ clientSecret, amount, paymentType, metadata, onSuccess, onCancel }) {
  if (!isStripeConfigured()) {
    return (
      <div className="card bg-amber-50 border border-amber-200">
        <p className="text-amber-800 text-sm">
          Payments are not configured. Use the demo button above to unlock without payment, or add VITE_STRIPE_PUBLISHABLE_KEY to .env.local for real payments.
        </p>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="card">
        <p className="text-gray-600">Loading payment form...</p>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: { theme: 'stripe' }
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm
        amount={amount}
        paymentType={paymentType}
        metadata={metadata}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </Elements>
  );
}
