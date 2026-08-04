/**
 * Change Password Page
 * Task 21: Password change (authenticated users)
 */

'use client';

import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChangePasswordSchema, ChangePasswordInput, validatePasswordStrength } from '@/lib/utils/validations';
import { changePasswordAction } from '@/lib/password/password.actions';
import { useActionState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Password Strength Indicator
function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: '', checks: {} };
    
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&#^()_+\-=]/.test(password),
    };
    
    const score = Object.values(checks).filter(Boolean).length;
    const labels = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
    
    return { score, label: labels[score], checks };
  }, [password]);

  if (!password) return null;

  const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-emerald-600'];
  const widths = ['0%', '20%', '40%', '60%', '80%', '100%'];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${colors[strength.score]} transition-all duration-300`}
            style={{ width: widths[strength.score] }}
          />
        </div>
        <span className={`text-xs font-medium ${
          strength.score <= 2 ? 'text-red-600' :
          strength.score <= 3 ? 'text-yellow-600' :
          'text-green-600'
        }`}>
          {strength.label}
        </span>
      </div>
      
      <ul className="grid grid-cols-2 gap-1 text-xs">
        <li className={strength.checks.length ? 'text-green-600' : 'text-neutral-400'}>
          {strength.checks.length ? '✓' : '○'} 8+ characters
        </li>
        <li className={strength.checks.uppercase ? 'text-green-600' : 'text-neutral-400'}>
          {strength.checks.uppercase ? '✓' : '○'} Uppercase
        </li>
        <li className={strength.checks.lowercase ? 'text-green-600' : 'text-neutral-400'}>
          {strength.checks.lowercase ? '✓' : '○'} Lowercase
        </li>
        <li className={strength.checks.number ? 'text-green-600' : 'text-neutral-400'}>
          {strength.checks.number ? '✓' : '○'} Number
        </li>
        <li className={strength.checks.special ? 'text-green-600' : 'text-neutral-400'}>
          {strength.checks.special ? '✓' : '○'} Special char
        </li>
      </ul>
    </div>
  );
}

export default function ChangePasswordPage() {
  const t = useTranslations('profile');
  const common = useTranslations('common');

  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await changePasswordAction(prevState, formData);
      return result;
    },
    undefined
  );

  const {
    register,
    watch,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(ChangePasswordSchema),
  });

  const watchedPassword = watch('newPassword', '');

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50/30">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-inaya-gradient flex items-center justify-center">
              <span className="text-lg font-bold text-white">iN</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-neutral-900">iNAYA Auth 2.0</h1>
              <p className="text-xs text-neutral-500">Change Password</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Change Password</h2>
        <p className="text-neutral-600 mb-8">
          Update your password to keep your account secure
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>
              Your password must be at least 8 characters with uppercase, lowercase, number, and special character
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              {/* Current Password */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="••••••••"
                  {...register('currentPassword')}
                  disabled={isPending}
                />
                {errors.currentPassword && (
                  <p className="text-sm text-error-600">{errors.currentPassword.message}</p>
                )}
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  {...register('newPassword')}
                  disabled={isPending}
                />
                {errors.newPassword && (
                  <p className="text-sm text-error-600">{errors.newPassword.message}</p>
                )}
                <PasswordStrengthMeter password={watchedPassword} />
              </div>

              {/* Confirm New Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                  disabled={isPending}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-error-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Messages */}
              {state?.error && (
                <div className="p-3 bg-error-50 border border-error-200 rounded-lg">
                  <p className="text-sm text-error-700">{state.error}</p>
                </div>
              )}

              {state?.success && (
                <div className="p-3 bg-success-50 border border-success-200 rounded-lg">
                  <p className="text-sm text-success-700">{state.message}</p>
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                className="bg-primary-700 hover:bg-primary-800 text-white"
                disabled={isPending}
              >
                {isPending ? 'Changing...' : 'Change Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
