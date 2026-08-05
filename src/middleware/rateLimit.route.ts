import { NextRequest, NextResponse } from 'next/server';
import { withCombinedRateLimit, withIPRateLimit } from './rateLimit.middleware';
import { RateLimitType } from '@prisma/client';

/**
 * Rate limit middleware for authentication endpoints
 * Stricter limits to prevent brute force attacks
 * 
 * Usage in route handler:
 * export const POST = withAuthRateLimit(async (request) => {
 *   // Your handler logic
 * });
 */
export function withAuthRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    // Check IP rate limit (10 requests per minute)
    const ipResult = await withIPRateLimit(request, RateLimitType.IP_AUTH);
    if (ipResult) return ipResult;

    // Check combined rate limit (IP + User)
    const combinedResult = await withCombinedRateLimit(
      request,
      RateLimitType.IP_AUTH,
      RateLimitType.USER_AUTH
    );
    if (combinedResult) return combinedResult;

    // All checks passed, execute handler
    return handler(request);
  };
}

/**
 * Rate limit middleware for API endpoints
 * Moderate limits for general API usage
 * 
 * Usage in route handler:
 * export const GET = withApiRateLimit(async (request) => {
 *   // Your handler logic
 * });
 */
export function withApiRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    // Check IP rate limit (100 requests per minute)
    const ipResult = await withIPRateLimit(request, RateLimitType.IP_GLOBAL);
    if (ipResult) return ipResult;

    // Check user rate limit if authenticated (500 requests per minute)
    const userResult = await withIPRateLimit(request, RateLimitType.USER_API);
    if (userResult) return userResult;

    // All checks passed, execute handler
    return handler(request);
  };
}

/**
 * Rate limit middleware for tenant API endpoints
 * Higher limits for tenant-based API usage
 * 
 * Usage in route handler:
 * export const GET = withTenantApiRateLimit(async (request) => {
 *   // Your handler logic
 * });
 */
export function withTenantApiRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    // Check IP rate limit
    const ipResult = await withIPRateLimit(request, RateLimitType.IP_GLOBAL);
    if (ipResult) return ipResult;

    // Check tenant rate limit if authenticated
    const tenantResult = await withIPRateLimit(request, RateLimitType.TENANT_API);
    if (tenantResult) return tenantResult;

    // All checks passed, execute handler
    return handler(request);
  };
}

/**
 * Custom rate limit middleware
 * Allows custom rate limit configuration
 * 
 * Usage in route handler:
 * export const POST = withCustomRateLimit(
 *   { ipLimit: 20, userLimit: 50, windowSeconds: 60 },
 *   async (request) => {
 *     // Your handler logic
 *   }
 * );
 */
export function withCustomRateLimit(
  options: {
    ipLimit?: number;
    userLimit?: number;
    windowSeconds?: number;
  },
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    // Note: Custom rate limits would need to be stored in database
    // For now, use default limits
    const result = await withCombinedRateLimit(request);
    if (result) return result;

    return handler(request);
  };
}

/**
 * No rate limiting - for internal or admin endpoints
 */
export function withoutRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return handler;
}
