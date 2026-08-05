// Phone Verification Page (Task 9)
// OTP-based phone number registration
'use client';

import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PhoneRegistrationSchema, PhoneRegistrationInput, PhoneOtpVerificationSchema, PhoneOtpVerificationInput } from '@/lib/utils/validations';
import { sendPhoneOtpAction, verifyPhoneOtpAction, resendPhoneOtpAction } from '@/lib/auth/phoneActions';
import { useActionState, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function VerifyPhonePage() {
  const t = useTranslations();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');

  // Step 1: Send OTP
  const [sendState, sendAction, sendPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await sendPhoneOtpAction(prevState, formData);
      if (result?.success) {
        setPhoneNumber(formData.get('phoneNumber') as string);
        setStep('otp');
        setCooldown(60);
        startCooldown();
      }
      return result;
    },
    undefined
  );

  // Step 2: Verify OTP
  const [verifyState, verifyAction, verifyPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await verifyPhoneOtpAction(prevState, formData);
      if (result?.success) {
        setSuccessMessage(result.message || 'Phone verified!');
      }
      return result;
    },
    undefined
  );

  // Resend cooldown timer
  const startCooldown = () => {
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Handle resend
  const handleResend = async () => {
    if (cooldown > 0) return;
    const result = await resendPhoneOtpAction(phoneNumber);
    if (result.success) {
      setCooldown(60);
      startCooldown();
    }
  };

  const phoneForm = useForm<PhoneRegistrationInput>({
    resolver: zodResolver(PhoneRegistrationSchema),
  });

  const otpForm = useForm<PhoneOtpVerificationInput>({
    resolver: zodResolver(PhoneOtpVerificationSchema),
    defaultValues: { phoneNumber: '' },
  });

  if (successMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-success-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">Phone Verified!</h2>
            <p className="text-neutral-600 mb-6">{successMessage}</p>
            <Button asChild>
              <a href="/dashboard">Go to Dashboard</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">📱</span>
            {step === 'phone' ? 'Verify Phone Number' : 'Enter OTP'}
          </CardTitle>
          <CardDescription>
            {step === 'phone'
              ? 'Add your phone number for two-factor authentication'
              : `Enter the 6-digit code sent to ${phoneNumber}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'phone' ? (
            <form action={sendAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+8801712345678"
                  {...phoneForm.register('phoneNumber')}
                  disabled={sendPending}
                />
                <p className="text-xs text-neutral-500">
                  Include country code (e.g., +880 for Bangladesh)
                </p>
                {phoneForm.formState.errors.phoneNumber && (
                  <p className="text-sm text-error-600">
                    {phoneForm.formState.errors.phoneNumber.message}
                  </p>
                )}
              </div>

              {sendState?.error && (
                <div className="p-3 bg-error-50 border border-error-200 rounded-lg">
                  <p className="text-sm text-error-700">{sendState.error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={sendPending}
              >
                {sendPending ? 'Sending...' : 'Send OTP'}
              </Button>
            </form>
          ) : (
            <form action={verifyAction} className="space-y-4">
              <input type="hidden" name="phoneNumber" value={phoneNumber} />
              
              <div className="space-y-2">
                <Label htmlFor="otp">6-Digit OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  {...otpForm.register('otp')}
                  disabled={verifyPending}
                  className="text-center text-2xl tracking-[1em] font-mono"
                />
                {otpForm.formState.errors.otp && (
                  <p className="text-sm text-error-600">
                    {otpForm.formState.errors.otp.message}
                  </p>
                )}
              </div>

              {verifyState?.error && (
                <div className="p-3 bg-error-50 border border-error-200 rounded-lg">
                  <p className="text-sm text-error-700">{verifyState.error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={verifyPending}
              >
                {verifyPending ? 'Verifying...' : 'Verify OTP'}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="text-primary-700 hover:text-primary-800 font-medium"
                >
                  ← Change number
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0}
                  className="text-primary-700 hover:text-primary-800 font-medium disabled:text-neutral-400"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
