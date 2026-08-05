/**
 * OTP Countdown Timer Component
 * Task 18: Countdown timer for OTP expiry
 */

'use client';

import { useEffect, useState } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

interface OTPCountdownTimerProps {
  initialSeconds: number;
  onComplete?: () => void;
  showWarning?: boolean;
  warningThreshold?: number; // seconds
}

export function OTPCountdownTimer({
  initialSeconds,
  onComplete,
  showWarning = true,
  warningThreshold = 60,
}: OTPCountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (onComplete) {
        onComplete();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onComplete]);

  // Show warning when time is running low
  useEffect(() => {
    if (showWarning && timeLeft > 0 && timeLeft <= warningThreshold) {
      setIsWarning(true);
    } else {
      setIsWarning(false);
    }
  }, [timeLeft, showWarning, warningThreshold]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (timeLeft / initialSeconds) * 100;

  if (timeLeft === 0) {
    return (
      <div className="flex items-center gap-2 text-error-600 bg-error-50 px-4 py-3 rounded-lg">
        <AlertCircle className="w-5 h-5" />
        <div>
          <p className="font-medium">OTP Expired</p>
          <p className="text-sm">Please request a new code</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Timer Display */}
      <div
        className={`flex items-center gap-2 px-4 py-3 rounded-lg ${
          isWarning ? 'bg-warning-50 text-warning-700' : 'bg-neutral-50 text-neutral-700'
        }`}
      >
        <Clock className={`w-5 h-5 ${isWarning ? 'animate-pulse' : ''}`} />
        <div className="flex-1">
          <p className="font-medium">
            {isWarning ? 'Code expires soon' : 'Code expires in'}
          </p>
          <p className="text-2xl font-bold font-mono">{formatTime(timeLeft)}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${
            isWarning ? 'bg-warning-500' : progressPercentage > 50 ? 'bg-success-500' : 'bg-warning-500'
          }`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
}
