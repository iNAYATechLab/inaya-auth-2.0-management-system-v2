/**
 * useUsernameCheck Hook
 * Task 17: Real-time username availability check with debouncing
 * 
 * Features:
 * - Debounced API calls (500ms delay)
 * - Loading state management
 * - Error handling
 * - Automatic cleanup
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface UsernameCheckResult {
  available: boolean;
  message: string;
}

interface UseUsernameCheckReturn {
  available: boolean | null;
  message: string;
  loading: boolean;
  error: string | null;
  checkUsername: (username: string) => void;
}

/**
 * Hook to check username availability in real-time
 * 
 * @example
 * const { available, message, loading, checkUsername } = useUsernameCheck();
 * 
 * useEffect(() => {
 *   if (username.length >= 3) {
 *     checkUsername(username);
 *   }
 * }, [username]);
 */
export function useUsernameCheck(): UseUsernameCheckReturn {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Check username availability with debouncing
  const checkUsername = useCallback((username: string) => {
    // Cleanup previous requests
    cleanup();

    // Reset state
    setAvailable(null);
    setMessage('');
    setError(null);

    // Don't check if username is too short
    if (!username || username.length < 3) {
      setLoading(false);
      return;
    }

    // Set loading state
    setLoading(true);

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    // Debounce API call (500ms)
    timeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/username/check?username=${encodeURIComponent(username)}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: abortControllerRef.current?.signal,
          }
        );

        const data: UsernameCheckResult = await response.json();

        setAvailable(data.available);
        setMessage(data.message);
        setLoading(false);
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }

        setError('Failed to check username availability');
        setLoading(false);
      }
    }, 500); // 500ms debounce
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    available,
    message,
    loading,
    error,
    checkUsername,
  };
}
