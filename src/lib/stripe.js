import { loadStripe } from '@stripe/stripe-js';

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
let stripePromise = null;

export const getStripe = () => {
  if (!publishableKey) return null;
  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

export const isStripeConfigured = () => !!publishableKey && publishableKey.startsWith('pk_');
