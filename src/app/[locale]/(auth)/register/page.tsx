// Register Page
'use client';

import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterSchema, RegisterInput } from '@/lib/utils/validations';
import { registerAction } from '@/lib/auth/actions';
import { useActionState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RegisterPageProps {
  params: Promise<{ locale: string }>;
}

export default function RegisterPage({ params }: RegisterPageProps) {
  const t = useTranslations('auth.register');
  const common = useTranslations('common');

  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await registerAction(prevState, formData);
      if (result?.success) {
        window.location.href = `/${params.then(p => p.locale).then(l => l)}/dashboard`;
      }
      return result;
    },
    undefined
  );

  const {
    register: registerForm,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
  });

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

            {/* Password */}
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

            {/* Error Message */}
            {state?.error && (
              <div className="p-3 bg-error-50 border border-error-200 rounded-lg">
                <p className="text-sm text-error-700">{state.error}</p>
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
