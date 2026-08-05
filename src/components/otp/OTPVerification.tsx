/**
 * OTP Verification Component
 * Task 18: Complete OTP verification flow with timer and resend
 */

'use client';

import { useState, useEffect } from 'react';
import { OTPInput } from './OTPInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface OTPVerificationProps {
  title: string;
  description: string;
  recipient: string;
  onVerify: (otp: string) => Promise<{ success: boolean; error?: string }>;
  onResend: () => Promise<{ success: boolean; error?: string }>;
  onSuccess?: () => void;
  countdown?: number; // seconds
}

export function OTPVerification({
  title,
  description,
  recipient,
  onVerify,
  onResend,
  onSuccess,
  countdown = 60,
}: OTPVerificationProps) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(countdown);
  const [canResend, setCanResend] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0 && !canResend) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setCanResend(true);
    }
  }, [timeLeft, canResend]);

  // Auto-verify when OTP is complete
  useEffect(() => {
    if (otp.length === 6 && !loading) {
      handleVerify();
    }
  }, [otp]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError('Please enter complete OTP');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await onVerify(otp);
      
      if (result.success) {
        setSuccess(true);
        if (onSuccess) {
          setTimeout(onSuccess, 1500);
        }
      } else {
        setError(result.error || 'Invalid OTP');
        setOtp('');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setResendLoading(true);

    try {
      const result = await onResend();
      
      if (result.success) {
        setTimeLeft(countdown);
        setCanResend(false);
        setOtp('');
      } else {
        setError(result.error || 'Failed to resend OTP');
      }
    } catch (err) {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (success) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-success-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-success-600" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900">Verification Successful!</h3>
            <p className="text-neutral-600">Your identity has been verified successfully.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recipient Info */}
        <div className="bg-neutral-50 rounded-lg p-4">
          <p className="text-sm text-neutral-600">Code sent to:</p>
          <p className="text-sm font-medium text-neutral-900 mt-1">{recipient}</p>
        </div>

        {/* OTP Input */}
        <OTPInput
          value={otp}
          onChange={setOtp}
          disabled={loading}
          error={error}
        />

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-2 text-sm text-error-600 bg-error-50 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Timer and Resend */}
        <div className="text-center space-y-2">
          {!canResend ? (
            <div className="flex items-center justify-center gap-2 text-sm text-neutral-600">
              <Clock className="w-4 h-4" />
              <span>Resend code in {formatTime(timeLeft)}</span>
            </div>
          ) : (
            <Button
              variant="link"
              onClick={handleResend}
              disabled={resendLoading}
              className="text-primary-600"
            >
              {resendLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Resend Code
                </>
              )}
            </Button>
          )}
        </div>

        {/* Verify Button (manual) */}
        <Button
          onClick={handleVerify}
          disabled={loading || otp.length !== 6}
          className="w-full"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify Code'
          )}
        </Button>

        {/* Help Text */}
        <p className="text-xs text-neutral-500 text-center">
          Didn't receive the code? Check your spam folder or try resending.
        </p>
      </CardContent>
    </Card>
  );
}
