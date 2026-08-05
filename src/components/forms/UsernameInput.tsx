/**
 * UsernameInput Component
 * Task 17: Username input with real-time availability check
 * 
 * Features:
 * - Real-time availability checking
 * - Loading indicator
 * - Success/error feedback
 * - Debounced API calls
 */

'use client';

import { useEffect, useState } from 'react';
import { useUsernameCheck } from '@/hooks/useUsernameCheck';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';

interface UsernameInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

export function UsernameInput({ value, onChange, disabled, error }: UsernameInputProps) {
  const { available, message, loading, checkUsername } = useUsernameCheck();
  const [touched, setTouched] = useState(false);

  // Check username when it changes (with debounce)
  useEffect(() => {
    if (touched && value.length >= 3) {
      checkUsername(value);
    }
  }, [value, touched, checkUsername]);

  // Reset touched state when value is cleared
  useEffect(() => {
    if (!value) {
      setTouched(false);
    }
  }, [value]);

  const handleBlur = () => {
    if (value.length >= 3) {
      setTouched(true);
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor="username" className="block text-sm font-medium text-neutral-700">
        Username
      </label>
      
      <div className="relative">
        <input
          id="username"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder="johndoe"
          className={`
            w-full px-4 py-2 pr-10 border rounded-lg
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:bg-neutral-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500 focus:ring-red-500' : ''}
            ${!error && touched && available === true ? 'border-green-500 focus:ring-green-500' : ''}
            ${!error && touched && available === false ? 'border-red-500 focus:ring-red-500' : ''}
            ${!error && !touched ? 'border-neutral-300 focus:ring-primary-500' : ''}
          `}
        />
        
        {/* Status Icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading && (
            <Loader2 className="w-5 h-5 text-neutral-400 animate-spin" />
          )}
          {!loading && touched && available === true && (
            <CheckCircle className="w-5 h-5 text-green-500" />
          )}
          {!loading && touched && available === false && (
            <XCircle className="w-5 h-5 text-red-500" />
          )}
        </div>
      </div>

      {/* Helper Text */}
      <p className="text-xs text-neutral-500">
        3-30 characters, letters, numbers, underscores, hyphens only
      </p>

      {/* Error Message (from validation) */}
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}

      {/* Availability Message */}
      {!error && touched && !loading && message && (
        <p className={`text-sm ${available ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </p>
      )}

      {/* Loading Message */}
      {!error && loading && touched && (
        <p className="text-sm text-neutral-500">
          Checking availability...
        </p>
      )}
    </div>
  );
}
