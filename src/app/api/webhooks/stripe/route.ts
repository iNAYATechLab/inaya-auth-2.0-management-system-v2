/**
 * Stripe Webhook Handler (Task 46)
 * 
 * Handle Stripe webhook events for subscription lifecycle
 * POST /api/webhooks/stripe
 */

import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/billing/stripe.client';
import { handleStripeWebhook } from '@/lib/billing/subscription.util';
import crypto from 'crypto';

// Stripe webhook signature verification
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    let event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('⚠️ Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    console.log(`✅ Stripe webhook received: ${event.type}`);
    
    await handleStripeWebhook(event);

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('❌ Stripe webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
