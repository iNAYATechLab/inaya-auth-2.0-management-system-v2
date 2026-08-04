/**
 * Security Utilities (Task 50)
 * 
 * CSRF protection, XSS prevention, SQL injection prevention,
 * security headers, and security logging
 */

import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// ─── CSRF Protection ─────────────────────────────────────────────────────────

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Verify CSRF token
 */
export function verifyCSRFToken(token: string, sessionToken: string): boolean {
  if (!token || !sessionToken) return false;
  
  const expectedToken = crypto
    .createHmac('sha256', sessionToken)
    .update('csrf-token')
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(token, 'hex'),
    Buffer.from(expectedToken, 'hex')
  );
}

/**
 * Create CSRF token for session
 */
export async function createCSRFTokenForSession(sessionId: string): Promise<string> {
  const token = generateCSRFToken();
  
  await prisma.cSRFToken.create({
    data: {
      token,
      sessionId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  });
  
  return token;
}

/**
 * Validate CSRF token from request
 */
export async function validateCSRFToken(
  token: string,
  sessionId: string
): Promise<boolean> {
  const storedToken = await prisma.cSRFToken.findFirst({
    where: {
      token,
      sessionId,
      expiresAt: { gte: new Date() },
    },
  });
  
  return !!storedToken;
}

// ─── XSS Prevention ──────────────────────────────────────────────────────────

/**
 * Sanitize HTML to prevent XSS
 */
export function sanitizeHTML(html: string): string {
  // Remove script tags
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove iframe, object, embed tags
  sanitized = sanitized.replace(/<(iframe|object|embed|applet)\b[^>]*>/gi, '');
  
  return sanitized;
}

/**
 * Sanitize user input for database storage
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

// ─── SQL Injection Prevention ────────────────────────────────────────────────

/**
 * Validate and sanitize query parameters
 * Note: Prisma ORM already provides SQL injection protection
 * This is for additional validation layer
 */
export function sanitizeQueryParam(param: any): any {
  if (typeof param === 'string') {
    return param.replace(/['";\\]/g, '');
  }
  return param;
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// ─── Security Headers ────────────────────────────────────────────────────────

export interface SecurityHeadersConfig {
  contentSecurityPolicy?: string;
  strictTransportSecurity?: string;
  xContentTypeOptions?: string;
  xFrameOptions?: string;
  xXSSProtection?: string;
  referrerPolicy?: string;
  permissionsPolicy?: string;
}

/**
 * Get default security headers
 */
export function getDefaultSecurityHeaders(): SecurityHeadersConfig {
  return {
    contentSecurityPolicy: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
    strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',
    xContentTypeOptions: 'nosniff',
    xFrameOptions: 'DENY',
    xXSSProtection: '1; mode=block',
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'interest-cohort=()',
    ].join(', '),
  };
}

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(
  headers: Headers,
  config?: SecurityHeadersConfig
): void {
  const defaultHeaders = getDefaultSecurityHeaders();
  const headersToApply = { ...defaultHeaders, ...config };
  
  if (headersToApply.contentSecurityPolicy) {
    headers.set('Content-Security-Policy', headersToApply.contentSecurityPolicy);
  }
  if (headersToApply.strictTransportSecurity) {
    headers.set('Strict-Transport-Security', headersToApply.strictTransportSecurity);
  }
  if (headersToApply.xContentTypeOptions) {
    headers.set('X-Content-Type-Options', headersToApply.xContentTypeOptions);
  }
  if (headersToApply.xFrameOptions) {
    headers.set('X-Frame-Options', headersToApply.xFrameOptions);
  }
  if (headersToApply.xXSSProtection) {
    headers.set('X-XSS-Protection', headersToApply.xXSSProtection);
  }
  if (headersToApply.referrerPolicy) {
    headers.set('Referrer-Policy', headersToApply.referrerPolicy);
  }
  if (headersToApply.permissionsPolicy) {
    headers.set('Permissions-Policy', headersToApply.permissionsPolicy);
  }
}

// ─── CORS Configuration ──────────────────────────────────────────────────────

export interface CORSConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  maxAge: number;
  credentials: boolean;
}

/**
 * Get default CORS configuration
 */
export function getDefaultCORSConfig(): CORSConfig {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    allowedOrigins: isProduction
      ? (process.env.ALLOWED_ORIGINS?.split(',') || [process.env.NEXT_PUBLIC_APP_URL || ''])
      : ['http://localhost:3000', 'http://localhost:3001'],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    exposedHeaders: ['X-CSRF-Token'],
    maxAge: 86400, // 24 hours
    credentials: true,
  };
}

/**
 * Validate CORS origin
 */
export function isValidCORSOrigin(origin: string, config?: CORSConfig): boolean {
  const corsConfig = config || getDefaultCORSConfig();
  return corsConfig.allowedOrigins.includes(origin);
}

// ─── Security Logging ────────────────────────────────────────────────────────

export type SecurityEventType =
  | 'CSRF_VIOLATION'
  | 'XSS_ATTEMPT'
  | 'SQLI_ATTEMPT'
  | 'RATE_LIMIT_EXCEEDED'
  | 'BRUTE_FORCE_ATTEMPT'
  | 'UNAUTHORIZED_ACCESS'
  | 'PRIVILEGE_ESCALATION'
  | 'SUSPICIOUS_ACTIVITY'
  | 'DATA_EXPORT'
  | 'DATA_DELETION'
  | 'PASSWORD_CHANGE'
  | '2FA_ENABLED'
  | '2FA_DISABLED';

export interface SecurityLogEntry {
  eventType: SecurityEventType;
  userId?: string;
  tenantId?: string;
  ipAddress: string;
  userAgent: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Log security event
 */
export async function logSecurityEvent(entry: SecurityLogEntry): Promise<void> {
  try {
    await prisma.securityLog.create({
      data: {
        eventType: entry.eventType,
        userId: entry.userId,
        tenantId: entry.tenantId,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        details: entry.details,
        severity: entry.severity,
      },
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

/**
 * Get security logs for tenant
 */
export async function getSecurityLogs(
  tenantId: string,
  filters?: {
    eventType?: SecurityEventType;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    startDate?: Date;
    endDate?: Date;
  },
  page: number = 1,
  limit: number = 50
) {
  const where: any = { tenantId };
  
  if (filters?.eventType) {
    where.eventType = filters.eventType;
  }
  if (filters?.severity) {
    where.severity = filters.severity;
  }
  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate;
    }
  }
  
  const [logs, total] = await Promise.all([
    prisma.securityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.securityLog.count({ where }),
  ]);
  
  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get security statistics
 */
export async function getSecurityStats(tenantId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const logs = await prisma.securityLog.findMany({
    where: {
      tenantId,
      createdAt: { gte: startDate },
    },
  });
  
  const stats = {
    total: logs.length,
    byType: {} as Record<string, number>,
    bySeverity: {} as Record<string, number>,
    byDay: {} as Record<string, number>,
  };
  
  logs.forEach(log => {
    // By type
    stats.byType[log.eventType] = (stats.byType[log.eventType] || 0) + 1;
    
    // By severity
    stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1;
    
    // By day
    const day = new Date(log.createdAt).toISOString().split('T')[0];
    stats.byDay[day] = (stats.byDay[day] || 0) + 1;
  });
  
  return stats;
}
