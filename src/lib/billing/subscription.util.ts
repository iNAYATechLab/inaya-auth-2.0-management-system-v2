/**
 * Subscription Management Utilities (Task 46: Stripe Integration)
 * 
 * Handle subscription creation, updates, cancellations, and Stripe webhooks
 */

import { prisma } from '@/lib/prisma';
import stripe from './stripe.client';
import { getDefaultPlan } from './pricing.util';

/**
 * Create a new subscription for a tenant
 */
export async function createSubscription(
  tenantId: string,
  planSlug: string,
  interval: 'monthly' | 'yearly' = 'monthly',
  currency: string = 'USD'
) {
  // Get plan
  const plan = await prisma.pricingPlan.findUnique({
    where: { slug: planSlug },
  });

  if (!plan) {
    throw new Error('Plan not found');
  }

  // Check if tenant already has a subscription
  const existingSubscription = await prisma.subscription.findUnique({
    where: { tenantId },
  });

  if (existingSubscription) {
    throw new Error('Tenant already has a subscription');
  }

  // Get Stripe Price ID based on interval
  const stripePriceId = interval === 'monthly' 
    ? plan.stripePriceIdMonthly 
    : plan.stripePriceIdYearly;

  // If no Stripe Price ID, create subscription without Stripe (for testing/free plans)
  if (!stripePriceId) {
    return await prisma.subscription.create({
      data: {
        tenantId,
        planId: plan.id,
        status: 'ACTIVE',
        billingInterval: interval,
        currency,
        amount: 0,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });
  }

  // Create Stripe customer (if not exists)
  // In production, you'd associate this with tenant's billing info
  const customer = await stripe.customers.create({
    metadata: {
      tenantId,
    },
  });

  // Create Stripe subscription
  const stripeSubscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: stripePriceId }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent'],
  });

  // Save subscription to database
  const subscription = await prisma.subscription.create({
    data: {
      tenantId,
      planId: plan.id,
      stripeSubscriptionId: stripeSubscription.id,
      stripeCustomerId: customer.id,
      status: mapStripeStatus(stripeSubscription.status),
      billingInterval: interval,
      currency,
      amount: stripeSubscription.items.data[0].price.unit_amount || 0,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
    },
  });

  return subscription;
}

/**
 * Update subscription plan (upgrade/downgrade)
 */
export async function updateSubscriptionPlan(
  tenantId: string,
  newPlanSlug: string,
  interval: 'monthly' | 'yearly' = 'monthly'
) {
  const subscription = await prisma.subscription.findUnique({
    where: { tenantId },
    include: { plan: true },
  });

  if (!subscription) {
    throw new Error('No active subscription found');
  }

  const newPlan = await prisma.pricingPlan.findUnique({
    where: { slug: newPlanSlug },
  });

  if (!newPlan) {
    throw new Error('New plan not found');
  }

  // If using Stripe
  if (subscription.stripeSubscriptionId) {
    const stripePriceId = interval === 'monthly' 
      ? newPlan.stripePriceIdMonthly 
      : newPlan.stripePriceIdYearly;

    if (!stripePriceId) {
      throw new Error('Stripe Price ID not configured for new plan');
    }

    // Update Stripe subscription
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
    
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      items: [{
        id: stripeSubscription.items.data[0].id,
        price: stripePriceId,
      }],
      proration_behavior: 'create_prorations',
    });
  }

  // Update database
  return await prisma.subscription.update({
    where: { tenantId },
    data: {
      planId: newPlan.id,
      billingInterval: interval,
    },
  });
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(tenantId: string, atPeriodEnd: boolean = true) {
  const subscription = await prisma.subscription.findUnique({
    where: { tenantId },
  });

  if (!subscription) {
    throw new Error('No active subscription found');
  }

  // If using Stripe
  if (subscription.stripeSubscriptionId) {
    if (atPeriodEnd) {
      // Cancel at period end
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    } else {
      // Cancel immediately
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
    }
  }

  // Update database
  return await prisma.subscription.update({
    where: { tenantId },
    data: {
      status: atPeriodEnd ? 'ACTIVE' : 'CANCELED',
      cancelAtPeriodEnd: atPeriodEnd,
      canceledAt: atPeriodEnd ? null : new Date(),
    },
  });
}

/**
 * Reactivate canceled subscription
 */
export async function reactivateSubscription(tenantId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { tenantId },
  });

  if (!subscription) {
    throw new Error('No subscription found');
  }

  if (!subscription.cancelAtPeriodEnd) {
    throw new Error('Subscription is not scheduled for cancellation');
  }

  // If using Stripe
  if (subscription.stripeSubscriptionId) {
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });
  }

  // Update database
  return await prisma.subscription.update({
    where: { tenantId },
    data: {
      cancelAtPeriodEnd: false,
      canceledAt: null,
    },
  });
}

/**
 * Get subscription for tenant
 */
export async function getSubscription(tenantId: string) {
  return await prisma.subscription.findUnique({
    where: { tenantId },
    include: { plan: true },
  });
}

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(event: any) {
  const { type, data } = event;

  switch (type) {
    case 'customer.subscription.created':
      await handleSubscriptionCreated(data.object);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(data.object);
      break;
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(data.object);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailed(data.object);
      break;
    default:
      console.log(`Unhandled Stripe event type: ${type}`);
  }
}

async function handleSubscriptionCreated(stripeSubscription: any) {
  await prisma.subscription.update({
    where: { stripeSubscriptionId: stripeSubscription.id },
    data: {
      status: mapStripeStatus(stripeSubscription.status),
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
    },
  });
}

async function handleSubscriptionUpdated(stripeSubscription: any) {
  await prisma.subscription.update({
    where: { stripeSubscriptionId: stripeSubscription.id },
    data: {
      status: mapStripeStatus(stripeSubscription.status),
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    },
  });
}

async function handleSubscriptionDeleted(stripeSubscription: any) {
  await prisma.subscription.update({
    where: { stripeSubscriptionId: stripeSubscription.id },
    data: {
      status: 'CANCELED',
      canceledAt: new Date(),
    },
  });
}

async function handlePaymentSucceeded(stripeInvoice: any) {
  // Update subscription
  if (stripeInvoice.subscription) {
    await prisma.subscription.update({
      where: { stripeSubscriptionId: stripeInvoice.subscription },
      data: {
        status: 'ACTIVE',
      },
    });
  }

  // Create invoice record
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: stripeInvoice.subscription },
  });

  if (subscription) {
    await prisma.invoice.create({
      data: {
        subscriptionId: subscription.id,
        stripeInvoiceId: stripeInvoice.id,
        amount: stripeInvoice.amount_paid,
        currency: stripeInvoice.currency,
        status: 'PAID',
        periodStart: new Date(stripeInvoice.period_start * 1000),
        periodEnd: new Date(stripeInvoice.period_end * 1000),
        paidAt: new Date(),
        invoicePdfUrl: stripeInvoice.invoice_pdf,
      },
    });
  }
}

async function handlePaymentFailed(stripeInvoice: any) {
  if (stripeInvoice.subscription) {
    await prisma.subscription.update({
      where: { stripeSubscriptionId: stripeInvoice.subscription },
      data: {
        status: 'PAST_DUE',
      },
    });
  }
}

/**
 * Map Stripe subscription status to our status
 */
function mapStripeStatus(stripeStatus: string): 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNPAID' | 'INCOMPLETE' {
  const statusMap: Record<string, 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNPAID' | 'INCOMPLETE'> = {
    trialing: 'TRIAL',
    active: 'ACTIVE',
    past_due: 'PAST_DUE',
    canceled: 'CANCELED',
    unpaid: 'UNPAID',
    incomplete: 'INCOMPLETE',
    incomplete_expired: 'CANCELED',
    paused: 'CANCELED',
  };

  return statusMap[stripeStatus] || 'ACTIVE';
}

/**
 * Check if subscription is active and valid
 */
export async function isSubscriptionActive(tenantId: string): Promise<boolean> {
  const subscription = await prisma.subscription.findUnique({
    where: { tenantId },
  });

  if (!subscription) {
    return false;
  }

  // Check if subscription is active
  if (subscription.status !== 'ACTIVE' && subscription.status !== 'TRIAL') {
    return false;
  }

  // Check if not canceled
  if (subscription.canceledAt) {
    return false;
  }

  // Check if period is valid
  if (subscription.currentPeriodEnd && subscription.currentPeriodEnd < new Date()) {
    return false;
  }

  return true;
}

/**
 * Create billing portal session for customer
 */
export async function createBillingPortalSession(tenantId: string, returnUrl: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { tenantId },
  });

  if (!subscription?.stripeCustomerId) {
    throw new Error('No Stripe customer found for tenant');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: returnUrl,
  });

  return session;
}
