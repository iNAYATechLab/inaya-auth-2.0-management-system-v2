/**
 * Admin OTP Configuration Client Component (Task 48)
 */

'use client';

import { useEffect, useState } from 'react';
import { 
  getAllTenantsAdminAction,
  getOTPTenantConfigAction,
  updateOTPTenantConfigAction,
  getGlobalOTPConfigAction
} from '@/lib/admin/admin.actions';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, CheckCircle, AlertCircle } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

interface OTPConfig {
  allowedMethods: string[];
  defaultMethod: string;
  expiryMinutes: number;
  maxLength: number;
  rateLimit: number;
  resendCooldownSeconds: number;
  maxAttempts: number;
  lockoutDurationMinutes: number;
}

interface GlobalOTPConfig {
  defaultAllowedMethods: string[];
  defaultExpiryMinutes: number;
  defaultMaxLength: number;
  emailProvider: string;
  smsProvider: string;
  whatsappProvider: string;
  telegramBotToken: boolean;
}

export default function AdminOTPConfigClient() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [config, setConfig] = useState<OTPConfig | null>(null);
  const [globalConfig, setGlobalConfig] = useState<GlobalOTPConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [tenantsResult, globalConfigResult] = await Promise.all([
      getAllTenantsAdminAction(1, 100),
      getGlobalOTPConfigAction(),
    ]);

    if (tenantsResult.success && tenantsResult.tenants) {
      setTenants(tenantsResult.tenants as Tenant[]);
    }

    if (globalConfigResult.success && globalConfigResult.config) {
      setGlobalConfig(globalConfigResult.config as GlobalOTPConfig);
    }

    setLoading(false);
  }

  async function loadTenantConfig(tenantId: string) {
    setSelectedTenant(tenantId);
    setMessage(null);

    const result = await getOTPTenantConfigAction(tenantId);
    if (result.success && result.config) {
      setConfig(result.config as OTPConfig);
    }
  }

  async function handleSave() {
    if (!selectedTenant || !config) return;

    setSaving(true);
    setMessage(null);

    const result = await updateOTPTenantConfigAction(selectedTenant, config);

    if (result.success) {
      setMessage({ type: 'success', text: 'OTP configuration updated successfully!' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to update configuration' });
    }

    setSaving(false);
  }

  function toggleMethod(method: string) {
    if (!config) return;

    const allowedMethods = config.allowedMethods.includes(method)
      ? config.allowedMethods.filter(m => m !== method)
      : [...config.allowedMethods, method];

    setConfig({ ...config, allowedMethods });
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">OTP Configuration</h1>
        <p className="text-neutral-600">Configure OTP delivery methods and settings per tenant</p>
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

      {/* Global Config Info */}
      {globalConfig && (
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Global OTP Providers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-neutral-50 rounded-lg">
              <div className="text-sm text-neutral-600 mb-1">Email Provider</div>
              <div className="font-medium text-neutral-900">{globalConfig.emailProvider}</div>
            </div>
            <div className="p-4 bg-neutral-50 rounded-lg">
              <div className="text-sm text-neutral-600 mb-1">SMS Provider</div>
              <div className="font-medium text-neutral-900">{globalConfig.smsProvider}</div>
            </div>
            <div className="p-4 bg-neutral-50 rounded-lg">
              <div className="text-sm text-neutral-600 mb-1">WhatsApp Provider</div>
              <div className="font-medium text-neutral-900">{globalConfig.whatsappProvider}</div>
            </div>
            <div className="p-4 bg-neutral-50 rounded-lg">
              <div className="text-sm text-neutral-600 mb-1">Telegram Bot</div>
              <div className="font-medium text-neutral-900">
                {globalConfig.telegramBotToken ? '✓ Configured' : '✗ Not configured'}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tenant Selection */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">Select Tenant</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {tenants.map((tenant) => (
            <button
              key={tenant.id}
              onClick={() => loadTenantConfig(tenant.id)}
              className={`p-4 border rounded-lg text-left transition-all ${
                selectedTenant === tenant.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-200 hover:border-primary-300'
              }`}
            >
              <div className="font-medium text-neutral-900">{tenant.name}</div>
              <div className="text-sm text-neutral-600">{tenant.slug}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* Tenant OTP Config */}
      {config && selectedTenant && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-6 h-6 text-primary-700" />
            <h2 className="text-xl font-semibold text-neutral-900">OTP Configuration</h2>
          </div>

          {/* Allowed Methods */}
          <div className="mb-6">
            <Label className="text-base font-semibold mb-3 block">Allowed Delivery Methods</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['email', 'sms', 'whatsapp', 'telegram'].map((method) => (
                <button
                  key={method}
                  onClick={() => toggleMethod(method)}
                  className={`p-4 border rounded-lg text-center transition-all ${
                    config.allowedMethods.includes(method)
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-neutral-200 text-neutral-600 hover:border-primary-300'
                  }`}
                >
                  <div className="font-medium capitalize">{method}</div>
                  <div className="text-xs mt-1">
                    {config.allowedMethods.includes(method) ? '✓ Enabled' : 'Disabled'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Default Method */}
          <div className="mb-6">
            <Label>Default Delivery Method</Label>
            <select
              value={config.defaultMethod}
              onChange={(e) => setConfig({ ...config, defaultMethod: e.target.value })}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg mt-2"
            >
              {config.allowedMethods.map((method) => (
                <option key={method} value={method} className="capitalize">
                  {method}
                </option>
              ))}
            </select>
          </div>

          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <Label>OTP Expiry (minutes)</Label>
              <Input
                type="number"
                value={config.expiryMinutes}
                onChange={(e) => setConfig({ ...config, expiryMinutes: parseInt(e.target.value) })}
                className="mt-2"
              />
            </div>
            <div>
              <Label>OTP Length</Label>
              <Input
                type="number"
                value={config.maxLength}
                onChange={(e) => setConfig({ ...config, maxLength: parseInt(e.target.value) })}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Rate Limit (per hour)</Label>
              <Input
                type="number"
                value={config.rateLimit}
                onChange={(e) => setConfig({ ...config, rateLimit: parseInt(e.target.value) })}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Resend Cooldown (seconds)</Label>
              <Input
                type="number"
                value={config.resendCooldownSeconds}
                onChange={(e) => setConfig({ ...config, resendCooldownSeconds: parseInt(e.target.value) })}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Max Attempts</Label>
              <Input
                type="number"
                value={config.maxAttempts}
                onChange={(e) => setConfig({ ...config, maxAttempts: parseInt(e.target.value) })}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Lockout Duration (minutes)</Label>
              <Input
                type="number"
                value={config.lockoutDurationMinutes}
                onChange={(e) => setConfig({ ...config, lockoutDurationMinutes: parseInt(e.target.value) })}
                className="mt-2"
              />
            </div>
          </div>

          {/* Save Button */}
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </Card>
      )}
    </div>
  );
}
