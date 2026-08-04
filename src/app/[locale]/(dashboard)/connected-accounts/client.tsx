// Connected Accounts Client Component (Task 10)
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useActionState } from 'react';
import { setBackupEmailAction, removeBackupEmailAction, unlinkAccountAction } from '@/lib/auth/accountActions';

interface User {
  id: string;
  email: string;
  backupEmail?: string | null;
  accounts: {
    provider: string;
    providerAccountId: string;
  }[];
}

interface ConnectedAccountsClientProps {
  user: User;
  locale: string;
}

// Social provider icons and labels
const socialProviders = [
  { id: 'github', name: 'GitHub', icon: '🐙', color: 'bg-neutral-900 text-white' },
  { id: 'google', name: 'Google', icon: '🔴', color: 'bg-white border border-neutral-200' },
  { id: 'facebook', name: 'Facebook', icon: '🔵', color: 'bg-blue-600 text-white' },
  { id: 'apple', name: 'Apple', icon: '🍎', color: 'bg-black text-white' },
  { id: 'microsoft-entra-id', name: 'Microsoft', icon: '🟦', color: 'bg-blue-500 text-white' },
];

export default function ConnectedAccountsClient({ user, locale }: ConnectedAccountsClientProps) {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Backup email state
  const [backupEmail, setBackupEmail] = useState(user.backupEmail || '');
  const [backupEmailState, backupEmailAction, backupEmailPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await setBackupEmailAction(prevState, formData);
      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'Backup email updated!' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update backup email' });
      }
      return result;
    },
    undefined
  );

  // Unlink account handler
  const handleUnlink = async (provider: string, providerAccountId: string) => {
    const result = await unlinkAccountAction(provider, providerAccountId);
    if (result.success) {
      setMessage({ type: 'success', text: result.message || 'Account unlinked!' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to unlink account' });
    }
  };

  // Check if provider is linked
  const isLinked = (providerId: string) => {
    return user.accounts.some((acc) => acc.provider === providerId);
  };

  // Get linked account info
  const getLinkedAccount = (providerId: string) => {
    return user.accounts.find((acc) => acc.provider === providerId);
  };

  return (
    <div className="space-y-8">
      {/* Message Toast */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-success-50 border-success-200 text-success-700'
            : 'bg-error-50 border-error-200 text-error-700'
        }`}>
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      {/* ─── Section 1: Social Accounts (Task 10) ──────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Social Accounts</CardTitle>
          <CardDescription>
            Link multiple social accounts for easy access. You can sign in with any linked account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {socialProviders.map((provider) => {
            const linked = isLinked(provider.id);
            const account = getLinkedAccount(provider.id);

            return (
              <div
                key={provider.id}
                className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{provider.icon}</span>
                  <div>
                    <p className="font-medium text-neutral-900">{provider.name}</p>
                    {linked && account && (
                      <p className="text-xs text-neutral-500">
                        Account ID: {account.providerAccountId.substring(0, 12)}...
                      </p>
                    )}
                  </div>
                </div>
                {linked ? (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 text-xs font-medium bg-success-100 text-success-700 rounded-full">
                      ✓ Connected
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => account && handleUnlink(provider.id, account.providerAccountId)}
                      className="text-error-600 hover:text-error-700 hover:bg-error-50"
                    >
                      Unlink
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a href={`/api/auth/signin/${provider.id}`}>
                      Connect
                    </a>
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* ─── Section 2: Backup Email (Task 10) ─────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Backup Email</CardTitle>
          <CardDescription>
            Add a backup email for account recovery. This is useful if you lose access to your primary email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current backup email */}
            {user.backupEmail && (
              <div className="p-4 bg-info-50 border border-info-200 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-info-900">Current backup email:</p>
                  <p className="text-sm text-info-700">{user.backupEmail}</p>
                </div>
                <form action={async () => {
                  await removeBackupEmailAction();
                  setMessage({ type: 'success', text: 'Backup email removed!' });
                }}>
                  <Button variant="outline" size="sm" type="submit">
                    Remove
                  </Button>
                </form>
              </div>
            )}

            {/* Update backup email */}
            <form action={backupEmailAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="backupEmail">Backup Email Address</Label>
                <Input
                  id="backupEmail"
                  name="backupEmail"
                  type="email"
                  placeholder="backup@example.com"
                  value={backupEmail}
                  onChange={(e) => setBackupEmail(e.target.value)}
                  disabled={backupEmailPending}
                />
                <p className="text-xs text-neutral-500">
                  Must be different from your primary email ({user.email})
                </p>
              </div>

              {backupEmailState?.error && (
                <div className="p-3 bg-error-50 border border-error-200 rounded-lg">
                  <p className="text-sm text-error-700">{backupEmailState.error}</p>
                </div>
              )}

              <Button type="submit" disabled={backupEmailPending}>
                {backupEmailPending ? 'Saving...' : 'Save Backup Email'}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* ─── Info Box ──────────────────────────────────────────────────────── */}
      <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
        <h4 className="font-medium text-neutral-900 mb-2">ℹ️ How it works</h4>
        <ul className="space-y-1 text-sm text-neutral-600 list-disc list-inside">
          <li>You can link multiple social accounts to your profile</li>
          <li>Sign in with any connected social account</li>
          <li>Backup email helps recover your account if you lose access to primary email</li>
          <li>At least one authentication method must remain connected at all times</li>
        </ul>
      </div>
    </div>
  );
}
