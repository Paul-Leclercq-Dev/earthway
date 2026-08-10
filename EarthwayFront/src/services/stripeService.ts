import { loadStripe } from '@stripe/stripe-js';

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

export function getStripePromise() {
  if (!publishableKey) {
    return null;
  }

  return loadStripe(publishableKey);
}
