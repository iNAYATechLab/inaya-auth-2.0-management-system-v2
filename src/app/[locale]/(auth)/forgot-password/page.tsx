// Forgot Password Page (Step 4)
'use client';

import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ForgotPasswordSchema, ForgotPasswordInput } from '@/lib/utils/validations';
import { requestPasswordResetAction } from '@/lib/auth/passwordResetActions';
import { useActionState, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ForgotPasswordPageProps {
  params: Promise<{ locale: string }>;
}

export default function ForgotPasswordPage({ params }: ForgotPasswordPageProps) {
  const t = useTranslations('auth.forgotPassword');
  const common = useTranslations('common');
  const [emailSent, setEmailSent] = useState(false);

  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await requestPasswordResetAction(prevState, formData);
      if (result?.success) {
        setEmailSent(true);
      }
      return result;
    },
    undefined
  );

  const {
    register,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
  });

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
          {emailSent ? (
            <div className="space-y-4">
              <div className="p-4 bg-success-50 border border-success-200 rounded-lg text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-success-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm text-success-700">{state?.message || t('success')}</p>
              </div>

              <div className="text-center text-sm text-neutral-600">
                <p>Didn't receive the email?</p>
                <p className="text-xs mt-1">Check your spam folder or try again.</p>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setEmailSent(false)}
              >
                Try again
              </Button>
            </div>
          ) : (
            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...register('email')}
                  disabled={isPending}
                />
                {errors.email && (
                  <p className="text-sm text-error-600">{errors.email.message}</p>
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
                {isPending ? common('loading') : t('sendResetLink')}
              </Button>

              <div className="text-center">
                <Link
                  href={`/${params.then(p => p.locale).then(l => l)}/login`}
                  className="text-sm text-primary-700 hover:text-primary-800 font-medium"
                >
                  {t('backToLogin')}
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
