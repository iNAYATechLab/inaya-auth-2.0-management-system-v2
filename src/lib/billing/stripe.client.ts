/**
 * Stripe Client Initialization (Task 46)
 * 
 * Initialize Stripe client with API key from environment
 */

import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn('⚠️ STRIPE_SECRET_KEY is not set. Stripe features will not work.');
}

export const stripe = new Stripe(stripeSecretKey || 'sk_test_dummy', {
  apiVersion: '2026-07-29.dahlia',
  typescript: true,
});

export default stripe;
