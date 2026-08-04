// Session & Cookie Security Configuration (Task 15)
// Comprehensive security hardening for authentication

/**
 * Security Headers Configuration
 * Applied to all responses via middleware
 */
export const securityHeaders = {
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // Enable XSS protection (legacy browsers)
  'X-XSS-Protection': '1; mode=block',
  
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions policy
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  
  // Strict Transport Security (production only)
  ...(process.env.NODE_ENV === 'production' && {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  }),
};

/**
 * Cookie Options for Session Tokens
 * Task 15: httpOnly, secure, sameSite
 */
export const sessionCookieOptions = {
  httpOnly: true,       // Prevent XSS access
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'lax' as const, // CSRF protection
  path: '/',            // Available on all routes
  maxAge: 30 * 24 * 60 * 60, // 30 days (matches session maxAge)
};

/**
 * Cookie Options for Remember Me
 * Extended session duration
 */
export const rememberMeCookieOptions = {
  ...sessionCookieOptions,
  maxAge: 90 * 24 * 60 * 60, // 90 days for remember me
};

/**
 * Validate session security
 */
export function validateSessionSecurity() {
  const warnings: string[] = [];

  if (process.env.NODE_ENV === 'production') {
    if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) {
      warnings.push('AUTH_SECRET should be at least 32 characters in production');
    }

    if (!process.env.NEXT_PUBLIC_APP_URL?.startsWith('https')) {
      warnings.push('NEXT_PUBLIC_APP_URL should use HTTPS in production');
    }
  }

  if (!process.env.AUTH_SECRET) {
    warnings.push('AUTH_SECRET is not set. Please set a secure random secret.');
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const crypto = require('crypto');
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash token for storage
 */
export async function hashToken(token: string): Promise<string> {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(token).digest('hex');
}
