/**
 * Super Admin Pricing Client Component (Task 45)
 */

'use client';

import { useEffect, useState } from 'react';
import { getPricingPlansAction, upsertPricingPlanAction, deletePricingPlanAction } from '@/lib/billing/billing.actions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit2, Trash2, CheckCircle, AlertCircle, DollarSign } from 'lucide-react';

interface PricingPlan {
  id: string;
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
  pricing: any;
  currency: string;
  billingIntervals: any;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
}

export default function PricingClient() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    maxUsers: -1,
    maxOAuthClients: -1,
    maxApiKeys: -1,
    maxWebhooks: -1,
    customDomain: false,
    ssoEnabled: false,
    advancedSecurity: false,
    prioritySupport: false,
    pricing: { USD: 0, BDT: 0, EUR: 0, GBP: 0 },
    currency: 'USD',
    billingIntervals: { monthly: true, yearly: true, yearly_discount: 20 },
    isActive: true,
    isDefault: false,
  });

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    const result = await getPricingPlansAction();
    if (result.success && result.plans) {
      setPlans(result.plans as unknown as PricingPlan[]);
    }
    setLoading(false);
  }

  function resetForm() {
    setFormData({
      name: '',
      slug: '',
      description: '',
      maxUsers: -1,
      maxOAuthClients: -1,
      maxApiKeys: -1,
      maxWebhooks: -1,
      customDomain: false,
      ssoEnabled: false,
      advancedSecurity: false,
      prioritySupport: false,
      pricing: { USD: 0, BDT: 0, EUR: 0, GBP: 0 },
      currency: 'USD',
      billingIntervals: { monthly: true, yearly: true, yearly_discount: 20 },
      isActive: true,
      isDefault: false,
    });
    setEditingPlan(null);
    setShowForm(false);
  }

  function handleEdit(plan: PricingPlan) {
    setFormData({
      name: plan.name,
      slug: plan.slug,
      description: plan.description || '',
      maxUsers: plan.maxUsers,
      maxOAuthClients: plan.maxOAuthClients,
      maxApiKeys: plan.maxApiKeys,
      maxWebhooks: plan.maxWebhooks,
      customDomain: plan.customDomain,
      ssoEnabled: plan.ssoEnabled,
      advancedSecurity: plan.advancedSecurity,
      prioritySupport: plan.prioritySupport,
      pricing: plan.pricing,
      currency: plan.currency,
      billingIntervals: plan.billingIntervals,
      isActive: plan.isActive,
      isDefault: plan.isDefault,
    });
    setEditingPlan(plan);
    setShowForm(true);
  }

  async function handleSubmit() {
    const form = new FormData();
    form.append('name', formData.name);
    form.append('slug', formData.slug);
    form.append('description', formData.description);
    form.append('maxUsers', formData.maxUsers.toString());
    form.append('maxOAuthClients', formData.maxOAuthClients.toString());
    form.append('maxApiKeys', formData.maxApiKeys.toString());
    form.append('maxWebhooks', formData.maxWebhooks.toString());
    form.append('customDomain', formData.customDomain.toString());
    form.append('ssoEnabled', formData.ssoEnabled.toString());
    form.append('advancedSecurity', formData.advancedSecurity.toString());
    form.append('prioritySupport', formData.prioritySupport.toString());
    form.append('pricing', JSON.stringify(formData.pricing));
    form.append('currency', formData.currency);
    form.append('billingIntervals', JSON.stringify(formData.billingIntervals));
    form.append('isActive', formData.isActive.toString());
    form.append('isDefault', formData.isDefault.toString());

    const result = await upsertPricingPlanAction(form);
    
    if (result.success) {
      setMessage({ type: 'success', text: editingPlan ? 'Plan updated!' : 'Plan created!' });
      resetForm();
      await loadPlans();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to save plan' });
    }
  }

  async function handleDelete(slug: string) {
    if (!confirm('Are you sure you want to delete this plan?')) return;

    const result = await deletePricingPlanAction(slug);
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Plan deleted!' });
      await loadPlans();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to delete plan' });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Pricing Plans</h1>
          <p className="text-neutral-600">
            Manage subscription plans with country-based pricing
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Plan
        </Button>
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

      {/* Form */}
      {showForm && (
        <Card className="mb-8 p-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">
            {editingPlan ? 'Edit Plan' : 'Create New Plan'}
          </h2>
          
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Plan Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Starter, Pro, Enterprise"
                />
              </div>
              <div>
                <Label>Slug</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                  placeholder="e.g., starter, pro, enterprise"
                  disabled={!!editingPlan}
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Plan description"
              />
            </div>

            {/* Limits */}
            <div>
              <Label className="text-lg font-semibold">Resource Limits</Label>
              <p className="text-sm text-neutral-600 mb-2">Use -1 for unlimited</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label>Max Users</Label>
                  <Input
                    type="number"
                    value={formData.maxUsers}
                    onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Max OAuth Clients</Label>
                  <Input
                    type="number"
                    value={formData.maxOAuthClients}
                    onChange={(e) => setFormData({ ...formData, maxOAuthClients: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Max API Keys</Label>
                  <Input
                    type="number"
                    value={formData.maxApiKeys}
                    onChange={(e) => setFormData({ ...formData, maxApiKeys: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Max Webhooks</Label>
                  <Input
                    type="number"
                    value={formData.maxWebhooks}
                    onChange={(e) => setFormData({ ...formData, maxWebhooks: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            {/* Features */}
            <div>
              <Label className="text-lg font-semibold">Features</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="flex items-center justify-between">
                  <Label>Custom Domain</Label>
                  <Switch
                    checked={formData.customDomain}
                    onCheckedChange={(checked: boolean) => setFormData({ ...formData, customDomain: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>SSO Enabled</Label>
                  <Switch
                    checked={formData.ssoEnabled}
                    onCheckedChange={(checked: boolean) => setFormData({ ...formData, ssoEnabled: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Advanced Security</Label>
                  <Switch
                    checked={formData.advancedSecurity}
                    onCheckedChange={(checked: boolean) => setFormData({ ...formData, advancedSecurity: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Priority Support</Label>
                  <Switch
                    checked={formData.prioritySupport}
                    onCheckedChange={(checked: boolean) => setFormData({ ...formData, prioritySupport: checked })}
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div>
              <Label className="text-lg font-semibold">Country-Based Pricing</Label>
              <p className="text-sm text-neutral-600 mb-2">Enter monthly prices in different currencies</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label>USD ($)</Label>
                  <Input
                    type="number"
                    value={formData.pricing.USD || 0}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      pricing: { ...formData.pricing, USD: parseFloat(e.target.value) || 0 }
                    })}
                  />
                </div>
                <div>
                  <Label>BDT (৳)</Label>
                  <Input
                    type="number"
                    value={formData.pricing.BDT || 0}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      pricing: { ...formData.pricing, BDT: parseFloat(e.target.value) || 0 }
                    })}
                  />
                </div>
                <div>
                  <Label>EUR (€)</Label>
                  <Input
                    type="number"
                    value={formData.pricing.EUR || 0}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      pricing: { ...formData.pricing, EUR: parseFloat(e.target.value) || 0 }
                    })}
                  />
                </div>
                <div>
                  <Label>GBP (£)</Label>
                  <Input
                    type="number"
                    value={formData.pricing.GBP || 0}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      pricing: { ...formData.pricing, GBP: parseFloat(e.target.value) || 0 }
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Billing Intervals */}
            <div>
              <Label className="text-lg font-semibold">Billing Intervals</Label>
              <div className="space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <Label>Monthly Billing</Label>
                  <Switch
                    checked={formData.billingIntervals.monthly}
                    onCheckedChange={(checked: boolean) => setFormData({ 
                      ...formData, 
                      billingIntervals: { ...formData.billingIntervals, monthly: checked }
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Yearly Billing</Label>
                  <Switch
                    checked={formData.billingIntervals.yearly}
                    onCheckedChange={(checked: boolean) => setFormData({ 
                      ...formData, 
                      billingIntervals: { ...formData.billingIntervals, yearly: checked }
                    })}
                  />
                </div>
                {formData.billingIntervals.yearly && (
                  <div>
                    <Label>Yearly Discount (%)</Label>
                    <Input
                      type="number"
                      value={formData.billingIntervals.yearly_discount || 0}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        billingIntervals: { 
                          ...formData.billingIntervals, 
                          yearly_discount: parseInt(e.target.value) || 0 
                        }
                      })}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked: boolean) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Default Plan</Label>
                <Switch
                  checked={formData.isDefault}
                  onCheckedChange={(checked: boolean) => setFormData({ ...formData, isDefault: checked })}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <Button onClick={handleSubmit}>
                {editingPlan ? 'Update Plan' : 'Create Plan'}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Plans List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-neutral-900">{plan.name}</h3>
                <p className="text-sm text-neutral-600">{plan.description}</p>
              </div>
              {plan.isDefault && (
                <span className="px-2 py-1 text-xs font-semibold bg-primary-100 text-primary-800 rounded">
                  Default
                </span>
              )}
            </div>

            {/* Pricing */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-neutral-600" />
                <span className="text-2xl font-bold">
                  {plan.pricing.USD || 0} <span className="text-sm text-neutral-600">USD/mo</span>
                </span>
              </div>
              <div className="text-sm text-neutral-600">
                BDT: ৳{plan.pricing.BDT || 0} | EUR: €{plan.pricing.EUR || 0} | GBP: £{plan.pricing.GBP || 0}
              </div>
            </div>

            {/* Limits */}
            <div className="space-y-1 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-neutral-600">Users:</span>
                <span className="font-medium">{plan.maxUsers === -1 ? '∞' : plan.maxUsers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">OAuth Clients:</span>
                <span className="font-medium">{plan.maxOAuthClients === -1 ? '∞' : plan.maxOAuthClients}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">API Keys:</span>
                <span className="font-medium">{plan.maxApiKeys === -1 ? '∞' : plan.maxApiKeys}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Webhooks:</span>
                <span className="font-medium">{plan.maxWebhooks === -1 ? '∞' : plan.maxWebhooks}</span>
              </div>
            </div>

            {/* Features */}
            <div className="flex flex-wrap gap-1 mb-4">
              {plan.customDomain && (
                <span className="px-2 py-1 text-xs bg-success-100 text-success-800 rounded">Custom Domain</span>
              )}
              {plan.ssoEnabled && (
                <span className="px-2 py-1 text-xs bg-success-100 text-success-800 rounded">SSO</span>
              )}
              {plan.advancedSecurity && (
                <span className="px-2 py-1 text-xs bg-success-100 text-success-800 rounded">Advanced Security</span>
              )}
              {plan.prioritySupport && (
                <span className="px-2 py-1 text-xs bg-success-100 text-success-800 rounded">Priority Support</span>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleEdit(plan)}>
                <Edit2 className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleDelete(plan.slug)}>
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
