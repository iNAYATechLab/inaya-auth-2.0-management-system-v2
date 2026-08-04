// Admin Cooldown Settings Client Component (Task 41)
'use client';

import { useEffect, useState } from 'react';
import { getCooldownSettingsAction, updateCooldownSettingsAction } from '@/lib/cooldown/cooldown.actions';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Clock, Save, Loader2, CheckCircle } from 'lucide-react';

interface CooldownSettings {
  passwordCooldownHours: number;
  twoFactorCooldownHours: number;
  passkeyCooldownHours: number;
  oauthCooldownHours: number;
  phoneCooldownHours: number;
  maxSimultaneousChanges: number;
}

export default function CooldownSettingsClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<CooldownSettings | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const result = await getCooldownSettingsAction();
    if (result.success && result.data) {
      setSettings(result.data);
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!settings) return;

    setSaving(true);
    setMessage(null);

    const result = await updateCooldownSettingsAction(settings);

    if (result.success) {
      setMessage({ type: 'success', text: 'Cooldown settings updated successfully!' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to update settings' });
    }

    setSaving(false);
  }

  function updateSetting(key: keyof CooldownSettings, value: number) {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!settings) {
    return <div>Failed to load settings</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-gray-900">Security Cooldown Settings</h1>
        </div>
        <p className="text-gray-600">
          Configure cooldown periods for login method changes to prevent account takeover attacks
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Cooldown Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-semibold">Cooldown Durations</h2>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          When a user changes a login method, they must wait this many hours before changing it again.
          This prevents attackers from quickly changing all methods after gaining access.
        </p>

        <div className="space-y-6">
          {/* Password Cooldown */}
          <div>
            <Label htmlFor="passwordCooldown">Password Change Cooldown (hours)</Label>
            <Input
              id="passwordCooldown"
              type="number"
              min="1"
              max="168" // 7 days
              value={settings.passwordCooldownHours}
              onChange={(e) => updateSetting('passwordCooldownHours', parseInt(e.target.value) || 24)}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Default: 24 hours. Range: 1-168 hours (1 week)
            </p>
          </div>

          {/* 2FA Cooldown */}
          <div>
            <Label htmlFor="twoFactorCooldown">Two-Factor Authentication Cooldown (hours)</Label>
            <Input
              id="twoFactorCooldown"
              type="number"
              min="1"
              max="168"
              value={settings.twoFactorCooldownHours}
              onChange={(e) => updateSetting('twoFactorCooldownHours', parseInt(e.target.value) || 24)}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Default: 24 hours. Applies to enabling/disabling 2FA
            </p>
          </div>

          {/* Passkey Cooldown */}
          <div>
            <Label htmlFor="passkeyCooldown">Passkey Cooldown (hours)</Label>
            <Input
              id="passkeyCooldown"
              type="number"
              min="1"
              max="168"
              value={settings.passkeyCooldownHours}
              onChange={(e) => updateSetting('passkeyCooldownHours', parseInt(e.target.value) || 24)}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Default: 24 hours. Applies to adding/removing passkeys
            </p>
          </div>

          {/* OAuth Cooldown */}
          <div>
            <Label htmlFor="oauthCooldown">Social Login Cooldown (hours)</Label>
            <Input
              id="oauthCooldown"
              type="number"
              min="1"
              max="168"
              value={settings.oauthCooldownHours}
              onChange={(e) => updateSetting('oauthCooldownHours', parseInt(e.target.value) || 24)}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Default: 24 hours. Applies to linking/unlinking social accounts
            </p>
          </div>

          {/* Phone Cooldown */}
          <div>
            <Label htmlFor="phoneCooldown">Phone Number Cooldown (hours)</Label>
            <Input
              id="phoneCooldown"
              type="number"
              min="1"
              max="168"
              value={settings.phoneCooldownHours}
              onChange={(e) => updateSetting('phoneCooldownHours', parseInt(e.target.value) || 24)}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Default: 24 hours. Applies to changing phone number
            </p>
          </div>
        </div>
      </Card>

      {/* Account Takeover Protection */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Account Takeover Protection</h2>
        <p className="text-sm text-gray-600 mb-6">
          Limit how many login methods can be changed within the cooldown period.
          This prevents attackers from changing all methods at once.
        </p>

        <div>
          <Label htmlFor="maxSimultaneousChanges">Maximum Simultaneous Changes</Label>
          <Input
            id="maxSimultaneousChanges"
            type="number"
            min="1"
            max="5"
            value={settings.maxSimultaneousChanges}
            onChange={(e) => updateSetting('maxSimultaneousChanges', parseInt(e.target.value) || 1)}
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Default: 1. Users can only change 1 login method at a time during cooldown period.
            Recommended for security: 1-2
          </p>
        </div>
      </Card>

      {/* Info Box */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">How Cooldown Works</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>
            <strong>Task 39:</strong> When a user changes a login method (password, 2FA, passkey, etc.), 
            a cooldown period starts for that specific method.
          </li>
          <li>
            <strong>Task 40:</strong> Users cannot change multiple login methods simultaneously. 
            This prevents attackers who gain access from quickly changing all authentication methods.
          </li>
          <li>
            <strong>Task 41:</strong> You (Super Admin) can configure the cooldown duration for each 
            login method type. Recommended: 24-72 hours.
          </li>
        </ul>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
