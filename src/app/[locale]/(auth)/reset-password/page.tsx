// Reset Password Page (Step 4)
'use client';

import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ResetPasswordSchema, ResetPasswordInput, validatePasswordStrength } from '@/lib/utils/validations';
import { resetPasswordAction, verifyResetTokenAction } from '@/lib/auth/passwordResetActions';
import { useActionState, useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
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

interface ResetPasswordPageProps {
  params: Promise<{ locale: string }>;
}

export default function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const t = useTranslations('auth.resetPassword');
  const common = useTranslations('common');
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [tokenError, setTokenError] = useState<string>('');

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setTokenError('No reset token provided');
      return;
    }

    verifyResetTokenAction(token).then((result) => {
      setTokenValid(result.valid);
      if (!result.valid) {
        setTokenError(result.error || 'Invalid token');
      }
    });
  }, [token]);

  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await resetPasswordAction(prevState, formData);
      return result;
    },
    undefined
  );

  const {
    register,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
  });

  const watchedPassword = watch('password', '');

  // Loading state while verifying token
  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary-700 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-neutral-600">Verifying reset link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid token
  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-error-50 via-white to-neutral-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-error-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-neutral-900">Invalid Reset Link</h2>
            <p className="text-sm text-neutral-600">{tokenError}</p>
            <Link href="/forgot-password">
              <Button variant="outline">Request New Link</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success message
  if (state?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-success-50 via-white to-neutral-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-success-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-neutral-900">Password Reset!</h2>
            <p className="text-sm text-neutral-600">{state.message || t('success')}</p>
            <Link href="/login">
              <Button>Sign In with New Password</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Reset password form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-inaya-gradient shadow-inaya-lg mb-4">
              <span className="text-2xl font-bold text-white">iN</span>
            </div>
          </div>
          <CardTitle className="text-2xl text-center">{t('title')}</CardTitle>
          <CardDescription className="text-center">
            {t('subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="token" value={token || ''} />

            <div className="space-y-2">
              <Label htmlFor="password">{t('newPassword')}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
                disabled={isPending}
              />
              {errors.password && (
                <p className="text-sm text-error-600">{errors.password.message}</p>
              )}
              <PasswordStrengthMeter password={watchedPassword} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
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

            {state?.error && (
              <div className="p-3 bg-error-50 border border-error-200 rounded-lg">
                <p className="text-sm text-error-700">{state.error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-primary-700 hover:bg-primary-800 text-white"
              disabled={isPending}
            >
              {isPending ? common('loading') : t('reset')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
