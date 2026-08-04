/**
 * Billing Server Actions (Tasks 45-46)
 * 
 * Server actions for managing pricing plans, subscriptions, and billing
 */

'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getAllPricingPlans,
  getPricingPlanBySlug,
  upsertPricingPlan,
  deletePricingPlan,
  checkPlanLimits,
  checkPlanFeature,
  getPriceForCountry,
} from './pricing.util';
import {
  createSubscription,
  updateSubscriptionPlan,
  cancelSubscription,
  reactivateSubscription,
  getSubscription,
  isSubscriptionActive,
  createBillingPortalSession,
} from './subscription.util';
import { revalidatePath } from 'next/cache';

// ─── Pricing Plan Actions (Super Admin) ─────────────────────────────────────

/**
 * Get all pricing plans
 */
export async function getPricingPlansAction() {
  try {
    const plans = await getAllPricingPlans();
    return { success: true, plans };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Create or update pricing plan (Super Admin only)
 */
export async function upsertPricingPlanAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if user is Super Admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== 'SUPERADMIN') {
      return { success: false, error: 'Only Super Admin can manage pricing plans' };
    }

    const data = {
      name: formData.get('name') as string,
      slug: formData.get('slug') as string,
      description: formData.get('description') as string,
      maxUsers: parseInt(formData.get('maxUsers') as string) || -1,
      maxOAuthClients: parseInt(formData.get('maxOAuthClients') as string) || -1,
      maxApiKeys: parseInt(formData.get('maxApiKeys') as string) || -1,
      maxWebhooks: parseInt(formData.get('maxWebhooks') as string) || -1,
      customDomain: formData.get('customDomain') === 'true',
      ssoEnabled: formData.get('ssoEnabled') === 'true',
      advancedSecurity: formData.get('advancedSecurity') === 'true',
      prioritySupport: formData.get('prioritySupport') === 'true',
      pricing: JSON.parse(formData.get('pricing') as string),
      currency: formData.get('currency') as string || 'USD',
      billingIntervals: JSON.parse(formData.get('billingIntervals') as string),
      isActive: formData.get('isActive') === 'true',
      isDefault: formData.get('isDefault') === 'true',
    };

    const plan = await upsertPricingPlan(data);
    revalidatePath('/admin/pricing');
    
    return { success: true, plan };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Delete pricing plan (Super Admin only)
 */
export async function deletePricingPlanAction(slug: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if user is Super Admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== 'SUPERADMIN') {
      return { success: false, error: 'Only Super Admin can delete pricing plans' };
    }

    await deletePricingPlan(slug);
    revalidatePath('/admin/pricing');
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ─── Subscription Actions (Tenant) ──────────────────────────────────────────

/**
 * Get current subscription for tenant
 */
export async function getSubscriptionAction(tenantId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const subscription = await getSubscription(tenantId);
    return { success: true, subscription };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Create new subscription
 */
export async function createSubscriptionAction(
  tenantId: string,
  planSlug: string,
  interval: 'monthly' | 'yearly' = 'monthly',
  currency: string = 'USD'
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const subscription = await createSubscription(tenantId, planSlug, interval, currency);
    revalidatePath('/dashboard/billing');
    
    return { success: true, subscription };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Update subscription plan (upgrade/downgrade)
 */
export async function updateSubscriptionPlanAction(
  tenantId: string,
  newPlanSlug: string,
  interval: 'monthly' | 'yearly' = 'monthly'
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const subscription = await updateSubscriptionPlan(tenantId, newPlanSlug, interval);
    revalidatePath('/dashboard/billing');
    
    return { success: true, subscription };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscriptionAction(
  tenantId: string,
  atPeriodEnd: boolean = true
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const subscription = await cancelSubscription(tenantId, atPeriodEnd);
    revalidatePath('/dashboard/billing');
    
    return { success: true, subscription };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Reactivate canceled subscription
 */
export async function reactivateSubscriptionAction(tenantId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const subscription = await reactivateSubscription(tenantId);
    revalidatePath('/dashboard/billing');
    
    return { success: true, subscription };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Create billing portal session
 */
export async function createBillingPortalSessionAction(
  tenantId: string,
  returnUrl: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const portalSession = await createBillingPortalSession(tenantId, returnUrl);
    return { success: true, url: portalSession.url };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ─── Plan Limit & Feature Check Actions ─────────────────────────────────────

/**
 * Check if tenant can create resource (enforce plan limits)
 */
export async function checkPlanLimitAction(
  tenantId: string,
  resource: 'users' | 'oauthClients' | 'apiKeys' | 'webhooks'
) {
  try {
    const result = await checkPlanLimits(tenantId, resource);
    return { success: true, ...result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Check if tenant has access to feature
 */
export async function checkPlanFeatureAction(
  tenantId: string,
  feature: 'customDomain' | 'sso' | 'advancedSecurity' | 'prioritySupport'
) {
  try {
    const result = await checkPlanFeature(tenantId, feature);
    return { success: true, ...result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get pricing for specific plan and country
 */
export async function getPlanPriceAction(
  planSlug: string,
  currency: string,
  interval: 'monthly' | 'yearly' = 'monthly'
) {
  try {
    const plan = await getPricingPlanBySlug(planSlug);
    if (!plan) {
      return { success: false, error: 'Plan not found' };
    }

    const price = getPriceForCountry(plan, currency, interval);
    return { success: true, price, plan };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Check if subscription is active
 */
export async function isSubscriptionActiveAction(tenantId: string) {
  try {
    const isActive = await isSubscriptionActive(tenantId);
    return { success: true, isActive };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ─── Invoice Actions ─────────────────────────────────────────────────────────

/**
 * Get invoices for tenant
 */
export async function getInvoicesAction(tenantId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const subscription = await prisma.subscription.findUnique({
      where: { tenantId },
      include: {
        invoices: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return { success: true, invoices: subscription?.invoices || [] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
