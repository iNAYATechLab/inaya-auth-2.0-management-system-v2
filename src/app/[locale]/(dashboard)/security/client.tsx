/**
 * Security Client Component
 * Task 20: 2FA setup, verify, disable, backup codes UI
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  generate2FASetupAction,
  verifyAndEnable2FAAction,
  disable2FAAction,
  regenerateBackupCodesAction,
} from '@/lib/totp/totp.actions';

interface SecurityClientProps {
  is2FAEnabled: boolean;
}

export default function SecurityClient({ is2FAEnabled: initial2FAStatus }: SecurityClientProps) {
  const [is2FAEnabled, setIs2FAEnabled] = useState(initial2FAStatus);
  const [setupData, setSetupData] = useState<{
    secret?: string;
    qrCode?: string;
    backupCodes?: string[];
  } | null>(null);
  const [verificationToken, setVerificationToken] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Generate 2FA setup
  const handleGenerateSetup = async () => {
    setLoading(true);
    setMessage(null);

    const result = await generate2FASetupAction();

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else if (result.success) {
      setSetupData({
        secret: result.secret,
        qrCode: result.qrCode,
        backupCodes: result.backupCodes,
      });
    }

    setLoading(false);
  };

  // Verify and enable 2FA
  const handleVerifyAndEnable = async () => {
    if (!verificationToken) {
      setMessage({ type: 'error', text: 'Please enter the verification code' });
      return;
    }

    setLoading(true);
    setMessage(null);

    const result = await verifyAndEnable2FAAction(verificationToken);

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else if (result.success) {
      setIs2FAEnabled(true);
      setSetupData(null);
      setVerificationToken('');
      setMessage({ type: 'success', text: result.message || '2FA enabled successfully!' });
    }

    setLoading(false);
  };

  // Disable 2FA
  const handleDisable = async () => {
    if (!disablePassword) {
      setMessage({ type: 'error', text: 'Please enter your password' });
      return;
    }

    if (!confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) {
      return;
    }

    setLoading(true);
    setMessage(null);

    const result = await disable2FAAction(disablePassword);

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else if (result.success) {
      setIs2FAEnabled(false);
      setDisablePassword('');
      setSetupData(null);
      setMessage({ type: 'success', text: result.message || '2FA disabled successfully!' });
    }

    setLoading(false);
  };

  // Regenerate backup codes
  const handleRegenerateBackupCodes = async () => {
    if (!confirm('This will invalidate all existing backup codes. Continue?')) {
      return;
    }

    setLoading(true);
    setMessage(null);

    const result = await regenerateBackupCodesAction();

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else if (result.success && result.backupCodes) {
      setSetupData(prev => ({
        ...prev,
        backupCodes: result.backupCodes,
      }));
      setMessage({ type: 'success', text: 'Backup codes regenerated!' });
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg border ${
            message.type === 'success'
              ? 'bg-success-50 border-success-200 text-success-700'
              : 'bg-error-50 border-error-200 text-error-700'
          }`}
        >
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      {/* 2FA Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            🔐 Two-Factor Authentication (2FA)
            {is2FAEnabled && (
              <span className="px-2 py-1 text-xs font-medium bg-success-100 text-success-700 rounded-full">
                Enabled
              </span>
            )}
          </CardTitle>
          <CardDescription>
            {is2FAEnabled
              ? '2FA is enabled. Your account is more secure.'
              : 'Add an extra layer of security to your account using TOTP authenticator.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!is2FAEnabled ? (
            // Setup 2FA
            !setupData ? (
              <Button
                onClick={handleGenerateSetup}
                disabled={loading}
                className="bg-primary-700 hover:bg-primary-800 text-white"
              >
                {loading ? 'Generating...' : 'Setup 2FA'}
              </Button>
            ) : (
              <div className="space-y-6">
                {/* Step 1: Scan QR Code */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Step 1: Scan QR Code</Label>
                  <p className="text-sm text-neutral-600">
                    Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                  </p>
                  <div className="flex justify-center p-4 bg-white rounded-lg border">
                    <img src={setupData.qrCode} alt="2FA QR Code" className="max-w-[250px]" />
                  </div>
                  <details className="text-sm">
                    <summary className="cursor-pointer text-primary-700 hover:underline">
                      Can't scan? Enter this code manually
                    </summary>
                    <div className="mt-2 p-3 bg-neutral-50 rounded border font-mono text-sm break-all">
                      {setupData.secret}
                    </div>
                  </details>
                </div>

                {/* Step 2: Verify Code */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Step 2: Verify Code</Label>
                  <p className="text-sm text-neutral-600">
                    Enter the 6-digit code from your authenticator app
                  </p>
                  <Input
                    type="text"
                    placeholder="123456"
                    value={verificationToken}
                    onChange={(e) => setVerificationToken(e.target.value)}
                    maxLength={6}
                    className="font-mono text-center text-lg tracking-widest"
                  />
                </div>

                {/* Step 3: Save Backup Codes */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Step 3: Save Backup Codes</Label>
                  <p className="text-sm text-neutral-600">
                    Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator.
                  </p>
                  <div className="p-4 bg-neutral-50 rounded-lg border">
                    <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                      {setupData.backupCodes?.map((code, index) => (
                        <div key={index} className="p-2 bg-white rounded border">
                          {code}
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-warning-600">
                    ⚠️ These codes will only be shown once. Save them now!
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleVerifyAndEnable}
                    disabled={loading || !verificationToken}
                    className="bg-primary-700 hover:bg-primary-800 text-white"
                  >
                    {loading ? 'Verifying...' : 'Verify & Enable 2FA'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSetupData(null)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )
          ) : (
            // 2FA Enabled - Show disable option
            <div className="space-y-4">
              <div className="p-4 bg-success-50 border border-success-200 rounded-lg">
                <p className="text-sm text-success-700">
                  ✅ 2FA is enabled. Your account is protected with two-factor authentication.
                </p>
              </div>

              <Button
                variant="outline"
                onClick={handleRegenerateBackupCodes}
                disabled={loading}
              >
                Regenerate Backup Codes
              </Button>

              <div className="pt-4 border-t">
                <Label className="text-base font-semibold text-error-600">Danger Zone</Label>
                <p className="text-sm text-neutral-600 mb-2">
                  Disabling 2FA will make your account less secure.
                </p>
                <div className="flex gap-2 mt-2">
                  <Input
                    type="password"
                    placeholder="Enter your password to confirm"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="destructive"
                    onClick={handleDisable}
                    disabled={loading || !disablePassword}
                  >
                    Disable 2FA
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
        <h4 className="font-medium text-neutral-900 mb-2">ℹ️ About 2FA</h4>
        <ul className="space-y-1 text-sm text-neutral-600 list-disc list-inside">
          <li>2FA adds an extra layer of security to your account</li>
          <li>You'll need your authenticator app to log in</li>
          <li>Backup codes can be used if you lose access to your authenticator</li>
          <li>Compatible with Google Authenticator, Authy, 1Password, etc.</li>
        </ul>
      </div>
    </div>
  );
}
