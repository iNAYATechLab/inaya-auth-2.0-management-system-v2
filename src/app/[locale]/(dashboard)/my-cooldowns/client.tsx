// User Cooldown Dashboard Client Component
'use client';

import { useEffect, useState } from 'react';
import { getMyCooldownsAction, canChangeLoginMethodAction } from '@/lib/cooldown/cooldown.actions';
import { formatCooldownTime, getMethodName } from '@/lib/cooldown/withCooldown';
import type { LoginMethodType } from '@/lib/cooldown/cooldown.util';
import { Card } from '@/components/ui/card';
import { Clock, Shield, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

interface Cooldown {
  id: string;
  methodType: string;
  methodIdentifier: string | null;
  cooldownUntil: Date;
  reason: string | null;
  createdAt: Date;
}

export default function MyCooldownsClient() {
  const [loading, setLoading] = useState(true);
  const [cooldowns, setCooldowns] = useState<Cooldown[]>([]);
  const [canChange, setCanChange] = useState<{
    canChange: boolean;
    activeCooldowns: number;
    maxAllowed: number;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [cooldownsResult, canChangeResult] = await Promise.all([
      getMyCooldownsAction(),
      canChangeLoginMethodAction(),
    ]);

    if (cooldownsResult.success && cooldownsResult.data) {
      setCooldowns(cooldownsResult.data as Cooldown[]);
    }

    if (canChangeResult.success && canChangeResult.data) {
      setCanChange(canChangeResult.data as any);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-gray-900">Security Cooldowns</h1>
        </div>
        <p className="text-gray-600">
          View active cooldowns on your login methods to prevent unauthorized changes
        </p>
      </div>

      {/* Status Card */}
      {canChange && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            {canChange.canChange ? (
              <>
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <h2 className="text-xl font-semibold text-green-900">No Active Restrictions</h2>
                  <p className="text-sm text-gray-600">
                    You can change your login methods freely
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="w-6 h-6 text-orange-600" />
                <div>
                  <h2 className="text-xl font-semibold text-orange-900">Cooldown Active</h2>
                  <p className="text-sm text-gray-600">
                    You have {canChange.activeCooldowns} active cooldown(s). 
                    Maximum allowed: {canChange.maxAllowed}
                  </p>
                </div>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Active Cooldowns */}
      {cooldowns.length > 0 ? (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold">Active Cooldowns</h2>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            The following login methods are in cooldown period. You cannot change them until the cooldown expires.
          </p>

          <div className="space-y-4">
            {cooldowns.map((cooldown) => {
              const now = new Date();
              const cooldownUntil = new Date(cooldown.cooldownUntil);
              const remainingMs = cooldownUntil.getTime() - now.getTime();
              const remainingHours = remainingMs / (1000 * 60 * 60);

              return (
                <div
                  key={cooldown.id}
                  className="p-4 border border-orange-200 rounded-lg bg-orange-50"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {getMethodName(cooldown.methodType as LoginMethodType)}
                      </h3>
                      {cooldown.methodIdentifier && (
                        <p className="text-sm text-gray-600">
                          Identifier: {cooldown.methodIdentifier}
                        </p>
                      )}
                      {cooldown.reason && (
                        <p className="text-sm text-gray-600 mt-1">
                          Reason: {cooldown.reason}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-orange-900">
                        {formatCooldownTime(remainingHours)} remaining
                      </p>
                      <p className="text-xs text-gray-500">
                        Until {cooldownUntil.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Cooldowns</h3>
            <p className="text-gray-600">
              You don't have any login methods in cooldown period.
            </p>
          </div>
        </Card>
      )}

      {/* Info Box */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">What is Security Cooldown?</h3>
        <p className="text-sm text-blue-800 mb-3">
          Security cooldown is a protective measure that prevents unauthorized changes to your login methods.
          When you change a login method (like password or 2FA), a cooldown period starts for that method.
        </p>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>
            <strong>Prevents Account Takeover:</strong> If an attacker gains access, they can't quickly 
            change all your login methods
          </li>
          <li>
            <strong>Gives You Time:</strong> You'll receive alerts about unauthorized changes and have 
            time to recover your account
          </li>
          <li>
            <strong>Enhanced Security:</strong> Combined with other security features, cooldowns make 
            your account much more secure
          </li>
        </ul>
      </Card>
    </div>
  );
}
