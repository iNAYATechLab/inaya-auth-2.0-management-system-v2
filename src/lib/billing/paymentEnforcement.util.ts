/**
 * Payment Status Enforcement Middleware (Task 46)
 * 
 * Enforce subscription status and plan limits across the application
 * This ensures tenants can only access features they've paid for
 */

import { prisma } from '@/lib/prisma';
import { isSubscriptionActive } from './subscription.util';

export interface EnforcementResult {
  allowed: boolean;
  reason?: string;
  action?: 'upgrade' | 'renew' | 'contact_support';
}

/**
 * Check if tenant can access a feature
 */
export async function canAccessFeature(
  tenantId: string,
  feature: 'customDomain' | 'sso' | 'advancedSecurity' | 'prioritySupport'
): Promise<EnforcementResult> {
  // Check if subscription is active
  const isActive = await isSubscriptionActive(tenantId);
  if (!isActive) {
    return {
      allowed: false,
      reason: 'No active subscription',
      action: 'renew',
    };
  }

  // Get subscription with plan
  const subscription = await prisma.subscription.findUnique({
    where: { tenantId },
    include: { plan: true },
  });

  if (!subscription) {
    return {
      allowed: false,
      reason: 'No subscription found',
      action: 'upgrade',
    };
  }

  // Check if feature is enabled in plan
  const plan = subscription.plan;
  let hasFeature = false;

  switch (feature) {
    case 'customDomain':
      hasFeature = plan.customDomain;
      break;
    case 'sso':
      hasFeature = plan.ssoEnabled;
      break;
    case 'advancedSecurity':
      hasFeature = plan.advancedSecurity;
      break;
    case 'prioritySupport':
      hasFeature = plan.prioritySupport;
      break;
  }

  if (!hasFeature) {
    return {
      allowed: false,
      reason: `Feature not available in ${plan.name} plan`,
      action: 'upgrade',
    };
  }

  return { allowed: true };
}

/**
 * Check if tenant can create a resource (enforce plan limits)
 */
export async function canCreateResource(
  tenantId: string,
  resource: 'users' | 'oauthClients' | 'apiKeys' | 'webhooks'
): Promise<EnforcementResult> {
  // Check if subscription is active
  const isActive = await isSubscriptionActive(tenantId);
  if (!isActive) {
    return {
      allowed: false,
      reason: 'No active subscription',
      action: 'renew',
    };
  }

  // Get subscription with plan
  const subscription = await prisma.subscription.findUnique({
    where: { tenantId },
    include: { plan: true },
  });

  if (!subscription) {
    return {
      allowed: false,
      reason: 'No subscription found',
      action: 'upgrade',
    };
  }

  const plan = subscription.plan;
  let currentCount = 0;
  let limit = 0;

  // Get current count and limit
  switch (resource) {
    case 'users':
      currentCount = await prisma.user.count({ where: { tenantId } });
      limit = plan.maxUsers;
      break;
    case 'oauthClients':
      currentCount = await prisma.oAuthClient.count({ where: { tenantId } });
      limit = plan.maxOAuthClients;
      break;
    case 'apiKeys':
      currentCount = await prisma.apiKey.count({ where: { tenantId } });
      limit = plan.maxApiKeys;
      break;
    case 'webhooks':
      currentCount = await prisma.webhook.count({ where: { tenantId } });
      limit = plan.maxWebhooks;
      break;
  }

  // Check if limit is reached (-1 means unlimited)
  if (limit !== -1 && currentCount >= limit) {
    return {
      allowed: false,
      reason: `Limit reached: ${currentCount}/${limit} ${resource}`,
      action: 'upgrade',
    };
  }

  return { allowed: true };
}

/**
 * Middleware to enforce payment status for API routes
 */
export async function enforcePaymentMiddleware(
  tenantId: string,
  requiredFeature?: 'customDomain' | 'sso' | 'advancedSecurity' | 'prioritySupport',
  requiredResource?: 'users' | 'oauthClients' | 'apiKeys' | 'webhooks'
): Promise<EnforcementResult> {
  // Check subscription status
  const isActive = await isSubscriptionActive(tenantId);
  if (!isActive) {
    return {
      allowed: false,
      reason: 'Subscription is not active',
      action: 'renew',
    };
  }

  // Check feature access if required
  if (requiredFeature) {
    const featureCheck = await canAccessFeature(tenantId, requiredFeature);
    if (!featureCheck.allowed) {
      return featureCheck;
    }
  }

  // Check resource limits if required
  if (requiredResource) {
    const resourceCheck = await canCreateResource(tenantId, requiredResource);
    if (!resourceCheck.allowed) {
      return resourceCheck;
    }
  }

  return { allowed: true };
}

/**
 * Get tenant's plan status summary
 */
export async function getPlanStatusSummary(tenantId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { tenantId },
    include: { plan: true },
  });

  if (!subscription) {
    return {
      hasSubscription: false,
      isActive: false,
      plan: null,
    };
  }

  const isActive = await isSubscriptionActive(tenantId);

  // Get current usage
  const usage = {
    users: await prisma.user.count({ where: { tenantId } }),
    oauthClients: await prisma.oAuthClient.count({ where: { tenantId } }),
    apiKeys: await prisma.apiKey.count({ where: { tenantId } }),
    webhooks: await prisma.webhook.count({ where: { tenantId } }),
  };

  return {
    hasSubscription: true,
    isActive,
    plan: subscription.plan,
    subscription: {
      status: subscription.status,
      billingInterval: subscription.billingInterval,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    },
    usage,
    limits: {
      users: subscription.plan.maxUsers,
      oauthClients: subscription.plan.maxOAuthClients,
      apiKeys: subscription.plan.maxApiKeys,
      webhooks: subscription.plan.maxWebhooks,
    },
  };
}
