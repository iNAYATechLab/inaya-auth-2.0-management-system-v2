// Security Settings Client Component (Task 34)
'use client';

import { useEffect, useState } from 'react';
import {
  getSecuritySettingsAction,
  updateSecuritySettingsAction,
  applySecurityPresetAction,
} from '@/lib/security/security.actions';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Shield,
  Bell,
  Lock,
  MapPin,
  Monitor,
  Zap,
  Loader2,
  CheckCircle,
} from 'lucide-react';

interface SecuritySettings {
  loginAlertsEnabled: boolean;
  trustedDevicesEnabled: boolean;
  proactiveProtection: boolean;
  suspiciousLoginDetection: boolean;
  locationBasedSecurity: boolean;
  deviceRecognition: boolean;
  automaticLockout: boolean;
  maxFailedAttempts: number;
  lockoutDuration: number;
  sessionTimeout: number;
  require2FAForTrusted: boolean;
  notifyOnNewDevice: boolean;
  notifyOnNewLocation: boolean;
}

export default function SecuritySettingsClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const res = await getSecuritySettingsAction();
    if (res.success && res.data) {
      setSettings(res.data as SecuritySettings);
    }
    setLoading(false);
  }

  async function updateSetting(key: keyof SecuritySettings, value: any) {
    if (!settings) return;

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setSaving(true);

    const res = await updateSecuritySettingsAction({ [key]: value });
    setSaving(false);

    if (res.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  async function applyPreset(preset: 'basic' | 'standard' | 'strict') {
    setSaving(true);
    const res = await applySecurityPresetAction(preset);
    if (res.success && res.data) {
      setSettings(res.data as SecuritySettings);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Security Settings</h1>
          <p className="text-gray-600 mt-1">
            Centralized security controls (Meta Accounts Center style)
          </p>
        </div>
        {saving && <Loader2 className="w-6 h-6 animate-spin text-primary-600" />}
        {saved && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Saved</span>
          </div>
        )}
      </div>

      {/* Security Presets */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Setup</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => applyPreset('basic')}
            className="p-4 border-2 rounded-lg hover:border-primary-500 transition-all text-left"
          >
            <Shield className="w-8 h-8 text-blue-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Basic</h3>
            <p className="text-sm text-gray-600 mt-1">
              Essential security features for everyday use
            </p>
          </button>
          <button
            onClick={() => applyPreset('standard')}
            className="p-4 border-2 rounded-lg hover:border-primary-500 transition-all text-left"
          >
            <Lock className="w-8 h-8 text-green-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Standard</h3>
            <p className="text-sm text-gray-600 mt-1">
              Recommended for most users with enhanced protection
            </p>
          </button>
          <button
            onClick={() => applyPreset('strict')}
            className="p-4 border-2 rounded-lg hover:border-primary-500 transition-all text-left"
          >
            <Zap className="w-8 h-8 text-red-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Strict</h3>
            <p className="text-sm text-gray-600 mt-1">
              Maximum security with 24/7 proactive protection
            </p>
          </button>
        </div>
      </Card>

      {/* Login Alerts */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Login Alerts</h2>
            <p className="text-sm text-gray-600 mt-1">
              Get notified about suspicious login attempts
            </p>
          </div>
          <Switch
            checked={settings.loginAlertsEnabled}
            onCheckedChange={(checked) => updateSetting('loginAlertsEnabled', checked)}
          />
        </div>
        <div className="space-y-3 pl-4 border-l-2 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Notify on new device</p>
              <p className="text-sm text-gray-600">Alert when login from new device</p>
            </div>
            <Switch
              checked={settings.notifyOnNewDevice}
              onCheckedChange={(checked) => updateSetting('notifyOnNewDevice', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Notify on new location</p>
              <p className="text-sm text-gray-600">Alert when login from new location</p>
            </div>
            <Switch
              checked={settings.notifyOnNewLocation}
              onCheckedChange={(checked) => updateSetting('notifyOnNewLocation', checked)}
            />
          </div>
        </div>
      </Card>

      {/* Device Recognition */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Device Recognition</h2>
            <p className="text-sm text-gray-600 mt-1">
              Recognize and trust your personal devices
            </p>
          </div>
          <Switch
            checked={settings.trustedDevicesEnabled}
            onCheckedChange={(checked) => updateSetting('trustedDevicesEnabled', checked)}
          />
        </div>
        <div className="space-y-3 pl-4 border-l-2 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Device recognition</p>
              <p className="text-sm text-gray-600">Automatically recognize your devices</p>
            </div>
            <Switch
              checked={settings.deviceRecognition}
              onCheckedChange={(checked) => updateSetting('deviceRecognition', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Require 2FA for trusted devices</p>
              <p className="text-sm text-gray-600">Always require 2FA even on trusted devices</p>
            </div>
            <Switch
              checked={settings.require2FAForTrusted}
              onCheckedChange={(checked) => updateSetting('require2FAForTrusted', checked)}
            />
          </div>
        </div>
      </Card>

      {/* Proactive Protection */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Proactive Protection</h2>
            <p className="text-sm text-gray-600 mt-1">
              24/7 automated security monitoring
            </p>
          </div>
          <Switch
            checked={settings.proactiveProtection}
            onCheckedChange={(checked) => updateSetting('proactiveProtection', checked)}
          />
        </div>
        <div className="space-y-3 pl-4 border-l-2 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Suspicious login detection</p>
              <p className="text-sm text-gray-600">Detect and block suspicious logins</p>
            </div>
            <Switch
              checked={settings.suspiciousLoginDetection}
              onCheckedChange={(checked) =>
                updateSetting('suspiciousLoginDetection', checked)
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Location-based security</p>
              <p className="text-sm text-gray-600">Check login locations for anomalies</p>
            </div>
            <Switch
              checked={settings.locationBasedSecurity}
              onCheckedChange={(checked) =>
                updateSetting('locationBasedSecurity', checked)
              }
            />
          </div>
        </div>
      </Card>

      {/* Account Lockout */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Account Lockout</h2>
            <p className="text-sm text-gray-600 mt-1">
              Protect against brute force attacks
            </p>
          </div>
          <Switch
            checked={settings.automaticLockout}
            onCheckedChange={(checked) => updateSetting('automaticLockout', checked)}
          />
        </div>
        <div className="space-y-4 pl-4 border-l-2 border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Max failed attempts: {settings.maxFailedAttempts}
            </label>
            <input
              type="range"
              min="3"
              max="10"
              value={settings.maxFailedAttempts}
              onChange={(e) =>
                updateSetting('maxFailedAttempts', parseInt(e.target.value))
              }
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Lockout duration: {settings.lockoutDuration} minutes
            </label>
            <input
              type="range"
              min="5"
              max="60"
              step="5"
              value={settings.lockoutDuration}
              onChange={(e) =>
                updateSetting('lockoutDuration', parseInt(e.target.value))
              }
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Session timeout: {settings.sessionTimeout} minutes
            </label>
            <input
              type="range"
              min="5"
              max="120"
              step="5"
              value={settings.sessionTimeout}
              onChange={(e) =>
                updateSetting('sessionTimeout', parseInt(e.target.value))
              }
              className="w-full"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
