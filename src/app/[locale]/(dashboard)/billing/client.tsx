/**
 * Tenant Billing Dashboard Client Component (Task 46)
 */

'use client';

import { useEffect, useState } from 'react';
import { 
  getSubscriptionAction, 
  createSubscriptionAction, 
  cancelSubscriptionAction,
  getInvoicesAction,
  getPricingPlansAction,
  createBillingPortalSessionAction
} from '@/lib/billing/billing.actions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, AlertCircle, CreditCard, FileText, Crown, Loader2 } from 'lucide-react';

interface Subscription {
  id: string;
  status: string;
  billingInterval: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  plan: {
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
  };
}

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  periodStart: string;
  periodEnd: string;
  paidAt?: string;
  invoicePdfUrl?: string;
}

interface BillingProps {
  tenantId: string;
}

export default function BillingClient({ tenantId }: BillingProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, [tenantId]);

  async function loadData() {
    const [subResult, invoiceResult, plansResult] = await Promise.all([
      getSubscriptionAction(tenantId),
      getInvoicesAction(tenantId),
      getPricingPlansAction(),
    ]);

    if (subResult.success) {
      setSubscription(subResult.subscription as unknown as Subscription);
    }

    if (invoiceResult.success && invoiceResult.invoices) {
      setInvoices(invoiceResult.invoices as unknown as Invoice[]);
    }

    if (plansResult.success && plansResult.plans) {
      setPlans(plansResult.plans);
    }

    setLoading(false);
  }

  async function handleSubscribe(planSlug: string) {
    const result = await createSubscriptionAction(tenantId, planSlug, 'monthly', 'USD');
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Subscription created!' });
      await loadData();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to create subscription' });
    }
  }

  async function handleCancel() {
    if (!confirm('Are you sure you want to cancel your subscription?')) return;

    const result = await cancelSubscriptionAction(tenantId, true);
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Subscription will be canceled at the end of the billing period' });
      await loadData();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to cancel subscription' });
    }
  }

  async function handleManageBilling() {
    const returnUrl = `${window.location.origin}/dashboard/billing`;
    const result = await createBillingPortalSessionAction(tenantId, returnUrl);
    
    if (result.success && result.url) {
      window.location.href = result.url;
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to create billing portal session' });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Billing & Subscription</h1>
        <p className="text-neutral-600">
          Manage your subscription, view invoices, and update payment methods
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-success-50 border border-success-200 text-success-800'
            : 'bg-error-50 border border-error-200 text-error-800'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {/* Current Subscription */}
      {subscription ? (
        <Card className="mb-8 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Crown className="w-6 h-6 text-primary-700" />
                <h2 className="text-2xl font-bold text-neutral-900">{subscription.plan.name} Plan</h2>
              </div>
              <p className="text-neutral-600">{subscription.plan.description}</p>
            </div>
            <div className="text-right">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                subscription.status === 'ACTIVE' 
                  ? 'bg-success-100 text-success-800'
                  : subscription.status === 'PAST_DUE'
                  ? 'bg-warning-100 text-warning-800'
                  : 'bg-neutral-100 text-neutral-800'
              }`}>
                {subscription.status}
              </div>
            </div>
          </div>

          {/* Plan Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-neutral-50 rounded-lg">
              <div className="text-sm text-neutral-600 mb-1">Users</div>
              <div className="text-xl font-bold">
                {subscription.plan.maxUsers === -1 ? '∞' : subscription.plan.maxUsers}
              </div>
            </div>
            <div className="p-4 bg-neutral-50 rounded-lg">
              <div className="text-sm text-neutral-600 mb-1">OAuth Clients</div>
              <div className="text-xl font-bold">
                {subscription.plan.maxOAuthClients === -1 ? '∞' : subscription.plan.maxOAuthClients}
              </div>
            </div>
            <div className="p-4 bg-neutral-50 rounded-lg">
              <div className="text-sm text-neutral-600 mb-1">API Keys</div>
              <div className="text-xl font-bold">
                {subscription.plan.maxApiKeys === -1 ? '∞' : subscription.plan.maxApiKeys}
              </div>
            </div>
            <div className="p-4 bg-neutral-50 rounded-lg">
              <div className="text-sm text-neutral-600 mb-1">Webhooks</div>
              <div className="text-xl font-bold">
                {subscription.plan.maxWebhooks === -1 ? '∞' : subscription.plan.maxWebhooks}
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="flex flex-wrap gap-2 mb-6">
            {subscription.plan.customDomain && (
              <span className="px-3 py-1 text-sm bg-success-100 text-success-800 rounded-full">
                ✓ Custom Domain
              </span>
            )}
            {subscription.plan.ssoEnabled && (
              <span className="px-3 py-1 text-sm bg-success-100 text-success-800 rounded-full">
                ✓ SSO
              </span>
            )}
            {subscription.plan.advancedSecurity && (
              <span className="px-3 py-1 text-sm bg-success-100 text-success-800 rounded-full">
                ✓ Advanced Security
              </span>
            )}
            {subscription.plan.prioritySupport && (
              <span className="px-3 py-1 text-sm bg-success-100 text-success-800 rounded-full">
                ✓ Priority Support
              </span>
            )}
          </div>

          {/* Billing Info */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-neutral-600">Billing Interval</div>
                <div className="font-medium capitalize">{subscription.billingInterval}</div>
              </div>
              {subscription.currentPeriodEnd && (
                <div className="text-right">
                  <div className="text-sm text-neutral-600">
                    {subscription.cancelAtPeriodEnd ? 'Cancels on' : 'Renews on'}
                  </div>
                  <div className="font-medium">
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleManageBilling}>
                <CreditCard className="w-4 h-4 mr-2" />
                Manage Billing
              </Button>
              {!subscription.cancelAtPeriodEnd && (
                <Button variant="outline" onClick={handleCancel}>
                  Cancel Subscription
                </Button>
              )}
            </div>
          </div>
        </Card>
      ) : (
        /* No Subscription - Show Plans */
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">Choose a Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className="p-6">
                <h3 className="text-xl font-bold text-neutral-900 mb-2">{plan.name}</h3>
                <p className="text-sm text-neutral-600 mb-4">{plan.description}</p>
                
                <div className="mb-4">
                  <div className="text-3xl font-bold">
                    ${plan.pricing.USD || 0}
                    <span className="text-sm text-neutral-600">/month</span>
                  </div>
                </div>

                <ul className="space-y-2 mb-6">
                  <li className="text-sm">
                    <span className="font-medium">Users:</span>{' '}
                    {plan.maxUsers === -1 ? 'Unlimited' : plan.maxUsers}
                  </li>
                  <li className="text-sm">
                    <span className="font-medium">OAuth Clients:</span>{' '}
                    {plan.maxOAuthClients === -1 ? 'Unlimited' : plan.maxOAuthClients}
                  </li>
                  <li className="text-sm">
                    <span className="font-medium">API Keys:</span>{' '}
                    {plan.maxApiKeys === -1 ? 'Unlimited' : plan.maxApiKeys}
                  </li>
                  <li className="text-sm">
                    <span className="font-medium">Webhooks:</span>{' '}
                    {plan.maxWebhooks === -1 ? 'Unlimited' : plan.maxWebhooks}
                  </li>
                  {plan.customDomain && <li className="text-sm text-success-700">✓ Custom Domain</li>}
                  {plan.ssoEnabled && <li className="text-sm text-success-700">✓ SSO</li>}
                  {plan.advancedSecurity && <li className="text-sm text-success-700">✓ Advanced Security</li>}
                  {plan.prioritySupport && <li className="text-sm text-success-700">✓ Priority Support</li>}
                </ul>

                <Button className="w-full" onClick={() => handleSubscribe(plan.slug)}>
                  Subscribe
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Invoices */}
      {invoices.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-neutral-600" />
            <h2 className="text-xl font-semibold text-neutral-900">Invoices</h2>
          </div>

          <div className="space-y-2">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                <div>
                  <div className="font-medium">
                    ${(invoice.amount / 100).toFixed(2)} {invoice.currency}
                  </div>
                  <div className="text-sm text-neutral-600">
                    {new Date(invoice.periodStart).toLocaleDateString()} - {new Date(invoice.periodEnd).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    invoice.status === 'PAID' 
                      ? 'bg-success-100 text-success-800'
                      : 'bg-warning-100 text-warning-800'
                  }`}>
                    {invoice.status}
                  </div>
                  {invoice.invoicePdfUrl && (
                    <a href={invoice.invoicePdfUrl} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline">
                        <FileText className="w-4 h-4 mr-1" />
                        PDF
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
