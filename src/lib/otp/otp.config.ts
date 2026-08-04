/**
 * OTP Configuration
 * Task 18: OTP expiry, resend-limit, rate-limiting configuration
 */

export interface OTPConfig {
  /**
   * Code length (4-8 digits)
   */
  codeLength: number;

  /**
   * Code expiry in minutes
   */
  expiryMinutes: number;

  /**
   * Maximum resend attempts within cooldown window
   */
  maxResendAttempts: number;

  /**
   * Cooldown window for resend attempts (in minutes)
   */
  resendCooldownMinutes: number;

  /**
   * Minimum seconds between resend attempts
   */
  resendIntervalSeconds: number;

  /**
   * Maximum failed attempts before lockout
   */
  maxFailedAttempts: number;

  /**
   * Lockout duration in minutes after max failed attempts
   */
  lockoutDurationMinutes: number;

  /**
   * Rate limit: maximum OTP requests per hour per user
   */
  rateLimitPerHour: number;

  /**
   * Rate limit: maximum OTP requests per day per user
   */
  rateLimitPerDay: number;
}

export const OTP_CONFIG: Record<string, OTPConfig> = {
  login: {
    codeLength: 6,
    expiryMinutes: 10,
    maxResendAttempts: 3,
    resendCooldownMinutes: 30,
    resendIntervalSeconds: 60,
    maxFailedAttempts: 5,
    lockoutDurationMinutes: 15,
    rateLimitPerHour: 5,
    rateLimitPerDay: 10,
  },
  verify: {
    codeLength: 6,
    expiryMinutes: 15,
    maxResendAttempts: 5,
    resendCooldownMinutes: 60,
    resendIntervalSeconds: 60,
    maxFailedAttempts: 10,
    lockoutDurationMinutes: 30,
    rateLimitPerHour: 10,
    rateLimitPerDay: 20,
  },
  reset: {
    codeLength: 6,
    expiryMinutes: 5,
    maxResendAttempts: 2,
    resendCooldownMinutes: 60,
    resendIntervalSeconds: 120,
    maxFailedAttempts: 3,
    lockoutDurationMinutes: 60,
    rateLimitPerHour: 3,
    rateLimitPerDay: 5,
  },
};

/**
 * Default provider preferences
 */
export const DEFAULT_PROVIDERS = {
  email: 'email',
  phone: 'telegram', // Free by default
  telegram: 'telegram',
};
