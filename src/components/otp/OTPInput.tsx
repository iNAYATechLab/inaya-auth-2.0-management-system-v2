/**
 * OTP Input Component
 * Task 18: 6-digit OTP input with auto-focus and paste support
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  error?: string;
}

export function OTPInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  error,
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [digits, setDigits] = useState<string[]>(Array(length).fill(''));

  // Sync with external value
  useEffect(() => {
    if (value) {
      const newDigits = value.split('').slice(0, length);
      setDigits(newDigits);
    }
  }, [value, length]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, inputValue: string) => {
    // Handle paste
    if (inputValue.length > 1) {
      const pastedDigits = inputValue.replace(/\D/g, '').slice(0, length);
      const newDigits = [...digits];
      
      for (let i = 0; i < pastedDigits.length && index + i < length; i++) {
        newDigits[index + i] = pastedDigits[i];
      }
      
      setDigits(newDigits);
      onChange(newDigits.join(''));
      
      // Focus next input or last input
      const nextIndex = Math.min(index + pastedDigits.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    // Handle single digit
    const digit = inputValue.replace(/\D/g, '');
    const newDigits = [...digits];
    newDigits[index] = digit;
    
    setDigits(newDigits);
    onChange(newDigits.join(''));

    // Auto-focus next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Backspace - focus previous input
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    // Arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const pastedDigits = pastedText.replace(/\D/g, '').slice(0, length);
    
    const newDigits = [...digits];
    for (let i = 0; i < pastedDigits.length; i++) {
      newDigits[i] = pastedDigits[i];
    }
    
    setDigits(newDigits);
    onChange(newDigits.join(''));
    
    // Focus last filled input
    const lastIndex = Math.min(pastedDigits.length - 1, length - 1);
    inputRefs.current[lastIndex]?.focus();
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2 justify-center">
        {Array.from({ length }).map((_, index) => (
          <Input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digits[index] || ''}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className={`
              w-12 h-12 text-center text-lg font-bold
              ${error ? 'border-error-500 focus:ring-error-500' : 'border-neutral-300'}
              focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
            `}
            autoComplete="one-time-code"
          />
        ))}
      </div>
      {error && (
        <p className="text-sm text-error-600 text-center">{error}</p>
      )}
    </div>
  );
}
