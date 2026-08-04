/**
 * Pricing Utilities (Task 45: Country-based Pricing)
 * 
 * Handle pricing plan management, country-based pricing, and plan validation
 */

import { prisma } from '@/lib/prisma';

export interface PlanFeatures {
  maxUsers: number;
  maxOAuthClients: number;
  maxApiKeys: number;
  maxWebhooks: number;
  customDomain: boolean;
  ssoEnabled: boolean;
  advancedSecurity: boolean;
  prioritySupport: boolean;
}

export interface CountryPricing {
  [currency: string]: number;
}

export interface BillingIntervals {
  monthly: boolean;
  yearly: boolean;
  yearly_discount?: number; // percentage discount
}

/**
 * Get all active pricing plans
 */
export async function getAllPricingPlans() {
  return await prisma.pricingPlan.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Get pricing plan by slug
 */
export async function getPricingPlanBySlug(slug: string) {
  return await prisma.pricingPlan.findUnique({
    where: { slug },
  });
}

/**
 * Get pricing for specific country/currency
 */
export function getPriceForCountry(plan: any, currency: string, interval: 'monthly' | 'yearly' = 'monthly'): number | null {
  const pricing = plan.pricing as CountryPricing;
  const intervals = plan.billingIntervals as BillingIntervals;
  
  // Check if interval is available
  if (interval === 'monthly' && !intervals.monthly) return null;
  if (interval === 'yearly' && !intervals.yearly) return null;
  
  let price = pricing[currency] || pricing[plan.currency] || null;
  
  // Apply yearly discount if applicable
  if (interval === 'yearly' && price && intervals.yearly_discount) {
    price = price * 12 * (1 - intervals.yearly_discount / 100);
  }
  
  return price;
}

/**
 * Get default plan for new tenants
 */
export async function getDefaultPlan() {
  return await prisma.pricingPlan.findFirst({
    where: { isDefault: true, isActive: true },
  });
}

/**
 * Create or update pricing plan (Super Admin)
 */
export async function upsertPricingPlan(data: {
  name: string;
  slug: string;
  description?: string;
  maxUsers: number;
  maxOAuthClients: number;
  maxApiKeys: number;
  maxWebhooks: number;
  customDomain: boolean;
  ssoEnabled: boolean;
  advancedSecurity: boolean;
  prioritySupport: boolean;
  pricing: CountryPricing;
  currency?: string;
  billingIntervals: BillingIntervals;
  isActive?: boolean;
  isDefault?: boolean;
}) {
  // If setting as default, unset other defaults
  if (data.isDefault) {
    await prisma.pricingPlan.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });
  }

  return await prisma.pricingPlan.upsert({
    where: { slug: data.slug },
    update: {
      name: data.name,
      description: data.description,
      maxUsers: data.maxUsers,
      maxOAuthClients: data.maxOAuthClients,
      maxApiKeys: data.maxApiKeys,
      maxWebhooks: data.maxWebhooks,
      customDomain: data.customDomain,
      ssoEnabled: data.ssoEnabled,
      advancedSecurity: data.advancedSecurity,
      prioritySupport: data.prioritySupport,
      pricing: data.pricing as any,
      currency: data.currency || 'USD',
      billingIntervals: data.billingIntervals as any,
      isActive: data.isActive ?? true,
      isDefault: data.isDefault ?? false,
    },
    create: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      maxUsers: data.maxUsers,
      maxOAuthClients: data.maxOAuthClients,
      maxApiKeys: data.maxApiKeys,
      maxWebhooks: data.maxWebhooks,
      customDomain: data.customDomain,
      ssoEnabled: data.ssoEnabled,
      advancedSecurity: data.advancedSecurity,
      prioritySupport: data.prioritySupport,
      pricing: data.pricing as any,
      currency: data.currency || 'USD',
      billingIntervals: data.billingIntervals as any,
      isActive: data.isActive ?? true,
      isDefault: data.isDefault ?? false,
    },
  });
}

/**
 * Delete pricing plan (Super Admin)
 */
export async function deletePricingPlan(slug: string) {
  return await prisma.pricingPlan.delete({
    where: { slug },
  });
}

/**
 * Check if tenant has reached plan limits
 */
export async function checkPlanLimits(tenantId: string, resource: 'users' | 'oauthClients' | 'apiKeys' | 'webhooks') {
  const subscription = await prisma.subscription.findUnique({
    where: { tenantId },
    include: { plan: true },
  });

  if (!subscription) {
    return { allowed: false, reason: 'No active subscription' };
  }

  const plan = subscription.plan;
  let currentCount = 0;
  let limit = 0;

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

  const allowed = limit === -1 || currentCount < limit;

  return {
    allowed,
    current: currentCount,
    limit,
    reason: allowed ? undefined : `Limit reached: ${currentCount}/${limit === -1 ? '∞' : limit}`,
  };
}

/**
 * Check if tenant has access to specific feature
 */
export async function checkPlanFeature(tenantId: string, feature: 'customDomain' | 'sso' | 'advancedSecurity' | 'prioritySupport') {
  const subscription = await prisma.subscription.findUnique({
    where: { tenantId },
    include: { plan: true },
  });

  if (!subscription) {
    return { allowed: false, reason: 'No active subscription' };
  }

  const plan = subscription.plan;
  let allowed = false;

  switch (feature) {
    case 'customDomain':
      allowed = plan.customDomain;
      break;
    case 'sso':
      allowed = plan.ssoEnabled;
      break;
    case 'advancedSecurity':
      allowed = plan.advancedSecurity;
      break;
    case 'prioritySupport':
      allowed = plan.prioritySupport;
      break;
  }

  return {
    allowed,
    reason: allowed ? undefined : `Feature not available in ${plan.name} plan`,
  };
}

/**
 * Get popular currencies for pricing
 */
export function getPopularCurrencies() {
  return [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  ];
}
