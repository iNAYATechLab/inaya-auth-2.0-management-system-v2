// Passkeys Client Component (Task 13)
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { deletePasskeyAction, renamePasskeyAction } from '@/lib/auth/passkeyActions';

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 2592000)}mo ago`;
}

interface Passkey {
  id: string;
  name: string | null;
  deviceType: string;
  backedUp: boolean;
  transports: string[];
  lastUsedAt: Date | null;
  createdAt: Date;
}

interface PasskeysClientProps {
  passkeys: Passkey[];
  userEmail: string;
}

export default function PasskeysClient({ passkeys: initialPasskeys, userEmail }: PasskeysClientProps) {
  const [passkeys, setPasskeys] = useState(initialPasskeys);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Register new passkey
  const handleRegister = async () => {
    setLoading(true);
    setMessage(null);

    try {
      // 1. Get registration options
      const optionsRes = await fetch('/api/passkeys/register/generate', {
        method: 'POST',
      });

      if (!optionsRes.ok) {
        throw new Error('Failed to get registration options');
      }

      const { options } = await optionsRes.json();

      // 2. Start WebAuthn registration
      const { startRegistration } = await import('@simplewebauthn/browser');
      const credential = await startRegistration(options);

      // 3. Verify registration
      const verifyRes = await fetch('/api/passkeys/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credential),
      });

      if (!verifyRes.ok) {
        const errorData = await verifyRes.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      setMessage({ type: 'success', text: 'Passkey registered successfully!' });
      
      // Refresh passkeys list
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        setMessage({ type: 'error', text: 'Registration was cancelled' });
      } else {
        setMessage({ type: 'error', text: error.message || 'Failed to register passkey' });
      }
    } finally {
      setLoading(false);
    }
  };

  // Delete passkey
  const handleDelete = async (passkeyId: string) => {
    if (!confirm('Are you sure you want to delete this passkey?')) {
      return;
    }

    const result = await deletePasskeyAction(passkeyId);
    if (result.success) {
      setPasskeys(passkeys.filter(pk => pk.id !== passkeyId));
      setMessage({ type: 'success', text: result.message || 'Passkey deleted!' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to delete passkey' });
    }
  };

  // Rename passkey
  const handleRename = async (passkeyId: string, currentName: string) => {
    const newName = prompt('Enter a new name for this passkey:', currentName || '');
    if (!newName || newName === currentName) return;

    const result = await renamePasskeyAction(passkeyId, newName);
    if (result.success) {
      setPasskeys(passkeys.map(pk => 
        pk.id === passkeyId ? { ...pk, name: newName } : pk
      ));
      setMessage({ type: 'success', text: result.message || 'Passkey renamed!' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to rename passkey' });
    }
  };

  // Check WebAuthn support
  const isSupported = typeof window !== 'undefined' && 
    typeof window.PublicKeyCredential !== 'undefined';

  return (
    <div className="space-y-6">
      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success'
            ? 'bg-success-50 border-success-200 text-success-700'
            : 'bg-error-50 border-error-200 text-error-700'
        }`}>
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      {/* Register New Passkey */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Register New Passkey</CardTitle>
          <CardDescription>
            Create a new passkey for passwordless authentication
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isSupported ? (
            <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg">
              <p className="text-sm text-warning-700">
                ⚠️ Your browser does not support WebAuthn. Please use a modern browser like Chrome, Firefox, or Safari.
              </p>
            </div>
          ) : (
            <Button
              onClick={handleRegister}
              disabled={loading}
              className="bg-primary-700 hover:bg-primary-800 text-white"
            >
              {loading ? 'Registering...' : '+ Register Passkey'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Existing Passkeys */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Passkeys</CardTitle>
          <CardDescription>
            {passkeys.length} passkey{passkeys.length !== 1 ? 's' : ''} registered
          </CardDescription>
        </CardHeader>
        <CardContent>
          {passkeys.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <p>No passkeys registered yet.</p>
              <p className="text-sm mt-2">Register a passkey to enable passwordless login.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {passkeys.map((passkey) => (
                <div
                  key={passkey.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-xl">🔐</span>
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">
                        {passkey.name || 'Unnamed Passkey'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <span>{passkey.deviceType === 'singleDevice' ? '📱' : '🌐'} {passkey.deviceType}</span>
                        {passkey.backedUp && <span className="text-success-600">✓ Backed up</span>}
                        {passkey.lastUsedAt && (
                          <span>
                            • Last used {formatTimeAgo(new Date(passkey.lastUsedAt))}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRename(passkey.id, passkey.name || '')}
                    >
                      Rename
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(passkey.id)}
                      className="text-error-600 hover:text-error-700 hover:bg-error-50"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
        <h4 className="font-medium text-neutral-900 mb-2">ℹ️ About Passkeys</h4>
        <ul className="space-y-1 text-sm text-neutral-600 list-disc list-inside">
          <li>Passkeys use biometric authentication (fingerprint, face, PIN)</li>
          <li>More secure than passwords — immune to phishing</li>
          <li>Works across devices with cloud sync (iCloud, Google Password Manager)</li>
          <li>Supported on modern browsers and devices</li>
        </ul>
      </div>
    </div>
  );
}
