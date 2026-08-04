// Login Page (Task 11-15)
// Email/Username + Password + Remember Me + Passkeys + Phone OTP + Social
'use client';

import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema, LoginInput } from '@/lib/utils/validations';
import { signInAction } from '@/lib/auth/actions';
import { useActionState, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LoginPageProps {
  params: Promise<{ locale: string }>;
}

// Social provider icons
function GitHubIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.413-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#F25022" d="M1 1h10v10H1z"/>
      <path fill="#7FBA00" d="M13 1h10v10H13z"/>
      <path fill="#00A4EF" d="M1 13h10v10H1z"/>
      <path fill="#FFB900" d="M13 13h10v10H13z"/>
    </svg>
  );
}

// Login method tabs
type LoginMethod = 'credentials' | 'passkey' | 'phone';

export default function LoginPage({ params }: LoginPageProps) {
  const t = useTranslations('auth.login');
  const common = useTranslations('common');
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('credentials');
  const [phoneStep, setPhoneStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [passkeyError, setPasskeyError] = useState('');
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  // Credentials form (Task 11: Email/Username + Remember Me)
  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await signInAction(prevState, formData);
      if (result?.success) {
        window.location.href = `/${await params.then(p => p.locale)}/dashboard`;
      }
      return result;
    },
    undefined
  );

  const {
    register,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      rememberMe: false,
    },
  });

  // Passkey login handler (Task 13)
  const handlePasskeyLogin = async () => {
    setPasskeyError('');
    setPasskeyLoading(true);

    try {
      // 1. Get authentication options
      const optionsRes = await fetch('/api/passkeys/authenticate/generate', {
        method: 'POST',
      });

      if (!optionsRes.ok) {
        throw new Error('Failed to get authentication options');
      }

      const { options } = await optionsRes.json();

      // 2. Start WebAuthn authentication
      const { startAuthentication } = await import('@simplewebauthn/browser');
      const credential = await startAuthentication(options);

      // 3. Verify authentication
      const verifyRes = await fetch('/api/passkeys/authenticate/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credential),
      });

      if (!verifyRes.ok) {
        const errorData = await verifyRes.json();
        throw new Error(errorData.error || 'Authentication failed');
      }

      const result = await verifyRes.json();
      if (result.success) {
        window.location.href = `/${await params.then(p => p.locale)}/dashboard`;
      }
    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        setPasskeyError('Authentication was cancelled');
      } else {
        setPasskeyError(error.message || 'Passkey authentication failed');
      }
    } finally {
      setPasskeyLoading(false);
    }
  };

  // Phone OTP login handlers (Task 14)
  const handleSendPhoneOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const phone = formData.get('phoneNumber') as string;
    
    const res = await fetch('/api/auth/phone-login/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: phone }),
    });

    const data = await res.json();
    if (data.success) {
      setPhoneNumber(phone);
      setPhoneStep('otp');
    }
  };

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

        {/* Login Form Card */}
        <div className="bg-white rounded-2xl shadow-inaya p-8 space-y-6">
          {/* Login Method Tabs (Task 11, 13, 14) */}
          <div className="flex gap-1 p-1 bg-neutral-100 rounded-lg">
            <button
              onClick={() => setLoginMethod('credentials')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                loginMethod === 'credentials'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              🔑 Password
            </button>
            <button
              onClick={() => setLoginMethod('passkey')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                loginMethod === 'passkey'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              🔐 Passkey
            </button>
            <button
              onClick={() => setLoginMethod('phone')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                loginMethod === 'phone'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              📱 Phone
            </button>
          </div>

          {/* ─── Credentials Login (Task 11) ───────────────────────────────── */}
          {loginMethod === 'credentials' && (
            <form action={formAction} className="space-y-4">
              {/* Email or Username (Task 11) */}
              <div className="space-y-2">
                <Label htmlFor="emailOrUsername">Email or Username</Label>
                <Input
                  id="emailOrUsername"
                  type="text"
                  placeholder="you@example.com or @username"
                  {...register('emailOrUsername')}
                  disabled={isPending}
                />
                {errors.emailOrUsername && (
                  <p className="text-sm text-error-600">{errors.emailOrUsername.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t('password')}</Label>
                  <Link
                    href={`/${params.then(p => p.locale).then(l => l)}/forgot-password`}
                    className="text-sm text-primary-700 hover:text-primary-800 font-medium"
                  >
                    {t('forgotPassword')}
                  </Link>
                </div>
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
              </div>

              {/* Remember Me (Task 11) */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rememberMe"
                  {...register('rememberMe')}
                  className="w-4 h-4 rounded border-neutral-300 text-primary-700 focus:ring-primary-500"
                />
                <Label htmlFor="rememberMe" className="text-sm font-normal text-neutral-600 cursor-pointer">
                  Remember me for 30 days
                </Label>
              </div>

              {/* Error Message */}
              {state?.error && (
                <div className="p-3 bg-error-50 border border-error-200 rounded-lg">
                  <p className="text-sm text-error-700">{state.error}</p>
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                className="w-full bg-primary-700 hover:bg-primary-800 text-white font-medium py-3 rounded-lg transition-all shadow-inaya hover:shadow-inaya-lg"
                disabled={isPending}
              >
                {isPending ? common('loading') : t('signIn')}
              </Button>
            </form>
          )}

          {/* ─── Passkey Login (Task 13) ───────────────────────────────────── */}
          {loginMethod === 'passkey' && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-50 flex items-center justify-center">
                  <span className="text-3xl">🔐</span>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900">Sign in with Passkey</h3>
                <p className="text-sm text-neutral-600 mt-1">
                  Use your fingerprint, face recognition, or device PIN
                </p>
              </div>

              {passkeyError && (
                <div className="p-3 bg-error-50 border border-error-200 rounded-lg">
                  <p className="text-sm text-error-700">{passkeyError}</p>
                </div>
              )}

              <Button
                onClick={handlePasskeyLogin}
                disabled={passkeyLoading}
                className="w-full bg-primary-700 hover:bg-primary-800 text-white font-medium py-3 rounded-lg transition-all"
              >
                {passkeyLoading ? 'Authenticating...' : 'Use Passkey'}
              </Button>

              <p className="text-center text-xs text-neutral-500">
                Don't have a passkey?{' '}
                <Link href="/register" className="text-primary-700 hover:underline">
                  Register first
                </Link>
                , then add a passkey from settings.
              </p>
            </div>
          )}

          {/* ─── Phone OTP Login (Task 14) ─────────────────────────────────── */}
          {loginMethod === 'phone' && (
            phoneStep === 'phone' ? (
              <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                <div className="text-center py-2">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-50 flex items-center justify-center">
                    <span className="text-3xl">📱</span>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900">Sign in with Phone</h3>
                  <p className="text-sm text-neutral-600 mt-1">
                    Enter your registered phone number
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    placeholder="+8801712345678"
                  />
                  <p className="text-xs text-neutral-500">
                    Include country code (e.g., +880)
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary-700 hover:bg-primary-800 text-white font-medium py-3 rounded-lg transition-all"
                >
                  Send OTP
                </Button>
              </form>
            ) : (
              <form className="space-y-4">
                <div className="text-center py-2">
                  <h3 className="text-lg font-semibold text-neutral-900">Enter OTP</h3>
                  <p className="text-sm text-neutral-600 mt-1">
                    Code sent to {phoneNumber}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp">6-Digit OTP</Label>
                  <Input
                    id="otp"
                    name="otp"
                    type="text"
                    placeholder="123456"
                    maxLength={6}
                    className="text-center text-2xl tracking-[1em] font-mono"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary-700 hover:bg-primary-800 text-white font-medium py-3 rounded-lg transition-all"
                >
                  Verify & Sign In
                </Button>

                <button
                  type="button"
                  onClick={() => setPhoneStep('phone')}
                  className="w-full text-center text-sm text-primary-700 hover:underline"
                >
                  ← Change phone number
                </button>
              </form>
            )
          )}

          {/* ─── Social Login (Task 7, 12) ─────────────────────────────────── */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-neutral-500">{t('orContinueWith')}</span>
            </div>
          </div>

          {/* 5 Social Providers (Task 12) */}
          <div className="grid grid-cols-3 gap-3">
            <Button variant="outline" size="icon" className="w-full border-neutral-200 hover:bg-neutral-50" asChild>
              <a href="/api/auth/signin/github"><GitHubIcon /></a>
            </Button>
            <Button variant="outline" size="icon" className="w-full border-neutral-200 hover:bg-neutral-50" asChild>
              <a href="/api/auth/signin/google"><GoogleIcon /></a>
            </Button>
            <Button variant="outline" size="icon" className="w-full border-neutral-200 hover:bg-neutral-50" asChild>
              <a href="/api/auth/signin/facebook"><FacebookIcon /></a>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="w-full border-neutral-200 hover:bg-neutral-50" asChild>
              <a href="/api/auth/signin/apple">
                <AppleIcon /><span className="ml-2">Apple</span>
              </a>
            </Button>
            <Button variant="outline" className="w-full border-neutral-200 hover:bg-neutral-50" asChild>
              <a href="/api/auth/signin/microsoft-entra-id">
                <MicrosoftIcon /><span className="ml-2">Microsoft</span>
              </a>
            </Button>
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-neutral-600">
            {t('noAccount')}{' '}
            <Link
              href={`/${params.then(p => p.locale).then(l => l)}/register`}
              className="text-primary-700 hover:text-primary-800 font-medium"
            >
              {t('signUp')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
