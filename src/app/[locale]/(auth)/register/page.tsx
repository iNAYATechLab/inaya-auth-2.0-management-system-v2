// Register Page (Task 6, 8)
// Added: Username field, password strength meter, email verification notice
'use client';

import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterSchema, RegisterInput, validatePasswordStrength } from '@/lib/utils/validations';
import { registerAction } from '@/lib/auth/actions';
import { useActionState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RegisterPageProps {
  params: Promise<{ locale: string }>;
}

// Password Strength Indicator Component (Task 8)
function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = useMemo(() => {
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
      {/* Strength Bar */}
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
      
      {/* Requirements Checklist */}
      <ul className="grid grid-cols-2 gap-1 text-xs">
        <li className={strength.checks.length ? 'text-green-600' : 'text-neutral-400'}>
          {strength.checks.length ? '✓' : '○'} 8+ characters
        </li>
        <li className={strength.checks.uppercase ? 'text-green-600' : 'text-neutral-400'}>
          {strength.checks.uppercase ? '✓' : '○'} Uppercase letter
        </li>
        <li className={strength.checks.lowercase ? 'text-green-600' : 'text-neutral-400'}>
          {strength.checks.lowercase ? '✓' : '○'} Lowercase letter
        </li>
        <li className={strength.checks.number ? 'text-green-600' : 'text-neutral-400'}>
          {strength.checks.number ? '✓' : '○'} Number
        </li>
        <li className={strength.checks.special ? 'text-green-600' : 'text-neutral-400'}>
          {strength.checks.special ? '✓' : '○'} Special character
        </li>
      </ul>
    </div>
  );
}

export default function RegisterPage({ params }: RegisterPageProps) {
  const t = useTranslations('auth.register');
  const common = useTranslations('common');

  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await registerAction(prevState, formData);
      if (result?.success) {
        window.location.href = `/${await params.then(p => p.locale)}/dashboard`;
      }
      return result;
    },
    undefined
  );

  const {
    register: registerForm,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
  });

  const watchedPassword = watch('password', '');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-inaya-gradient shadow-inaya-lg mb-4">
            <span className="text-2xl font-bold text-white">iN</span>
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 font-heading">
            {t('title')}
          </h1>
          <p className="text-neutral-600 mt-2">{t('subtitle')}</p>
        </div>

        {/* Register Form */}
        <div className="bg-white rounded-2xl shadow-inaya p-8 space-y-6">
          <form action={formAction} className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">{t('name')}</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                {...registerForm('name')}
                disabled={isPending}
              />
              {errors.name && (
                <p className="text-sm text-error-600">{errors.name.message}</p>
              )}
            </div>

            {/* Username (Task 8) */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="johndoe"
                {...registerForm('username')}
                disabled={isPending}
              />
              <p className="text-xs text-neutral-500">
                3-30 characters, letters, numbers, underscores, hyphens only
              </p>
              {errors.username && (
                <p className="text-sm text-error-600">{errors.username.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...registerForm('email')}
                disabled={isPending}
              />
              {errors.email && (
                <p className="text-sm text-error-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password (Task 8: Strong Password Policy) */}
            <div className="space-y-2">
              <Label htmlFor="password">{t('password')}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...registerForm('password')}
                disabled={isPending}
              />
              {errors.password && (
                <p className="text-sm text-error-600">{errors.password.message}</p>
              )}
              {/* Password Strength Meter (Task 8) */}
              <PasswordStrengthMeter password={watchedPassword} />
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...registerForm('confirmPassword')}
                disabled={isPending}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-error-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Terms */}
            <p className="text-xs text-neutral-500">
              {t('terms')}
            </p>

            {/* Email Verification Notice (Task 6) */}
            <div className="p-3 bg-info-50 border border-info-200 rounded-lg">
              <p className="text-xs text-info-700">
                📧 You will receive a verification email after registration. Please verify your email to activate your account.
              </p>
            </div>

            {/* Error Message */}
            {state?.error && (
              <div className="p-3 bg-error-50 border border-error-200 rounded-lg">
                <p className="text-sm text-error-700">{state.error}</p>
              </div>
            )}

            {/* Success Message */}
            {state?.success && state?.message && (
              <div className="p-3 bg-success-50 border border-success-200 rounded-lg">
                <p className="text-sm text-success-700">{state.message}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-primary-700 hover:bg-primary-800 text-white font-medium py-3 rounded-lg transition-all shadow-inaya hover:shadow-inaya-lg"
              disabled={isPending}
            >
              {isPending ? common('loading') : t('signUp')}
            </Button>
          </form>

          {/* Sign In Link */}
          <p className="text-center text-sm text-neutral-600">
            {t('hasAccount')}{' '}
            <Link
              href={`/${params.then(p => p.locale).then(l => l)}/login`}
              className="text-primary-700 hover:text-primary-800 font-medium"
            >
              {t('signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
