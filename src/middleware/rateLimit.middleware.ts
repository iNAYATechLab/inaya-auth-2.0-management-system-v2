import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, type RateLimitResult } from '@/lib/rateLimit/rateLimit.util';
import { RateLimitType } from '@prisma/client';

/**
 * Extract client IP from request
 */
export function getClientIP(request: NextRequest): string {
  // Check for forwarded headers
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fall back to connection info or unknown
  return 'unknown';
}

/**
 * Extract user ID from request (if authenticated)
 */
export async function getUserID(request: NextRequest): Promise<string | null> {
  try {
    // Try to get user ID from session cookie or token
    // This is a placeholder - in real implementation, you'd verify the session
    const sessionCookie = request.cookies.get('authjs.session-token');
    if (sessionCookie) {
      // In production, verify the session token and extract user ID
      // For now, return null (unauthenticated)
      return null;
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Create rate limit response headers
 */
function createRateLimitHeaders(result: RateLimitResult): HeadersInit {
  const headers: HeadersInit = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetAt.toISOString(),
  };

  if (result.blocked && result.blockedUntil) {
    headers['Retry-After'] = Math.ceil(
      (result.blockedUntil.getTime() - Date.now()) / 1000
    ).toString();
  }

  return headers;
}

/**
 * Rate limit middleware for IP-based limiting
 */
export async function withIPRateLimit(
  request: NextRequest,
  type: RateLimitType = RateLimitType.IP_GLOBAL
): Promise<NextResponse | null> {
  const ip = getClientIP(request);
  const result = await checkRateLimit(`ip:${ip}`, type);

  if (!result.allowed) {
    const retryAfter = result.blockedUntil
      ? Math.ceil((result.blockedUntil.getTime() - Date.now()) / 1000)
      : Math.ceil((result.resetAt.getTime() - Date.now()) / 1000);

    return NextResponse.json(
      {
        error: result.blocked ? 'Too many requests. Please try again later.' : 'Rate limit exceeded.',
        retryAfter,
      },
      {
        status: 429,
        headers: createRateLimitHeaders(result),
      }
    );
  }

  return null; // Continue to next handler
}

/**
 * Rate limit middleware for user-based limiting
 */
export async function withUserRateLimit(
  request: NextRequest,
  type: RateLimitType = RateLimitType.USER_GLOBAL
): Promise<NextResponse | null> {
  const userId = await getUserID(request);
  
  if (!userId) {
    return null; // No user, skip user rate limiting
  }

  const result = await checkRateLimit(`user:${userId}`, type);

  if (!result.allowed) {
    const retryAfter = result.blockedUntil
      ? Math.ceil((result.blockedUntil.getTime() - Date.now()) / 1000)
      : Math.ceil((result.resetAt.getTime() - Date.now()) / 1000);

    return NextResponse.json(
      {
        error: result.blocked ? 'Too many requests. Please try again later.' : 'Rate limit exceeded.',
        retryAfter,
      },
      {
        status: 429,
        headers: createRateLimitHeaders(result),
      }
    );
  }

  return null; // Continue to next handler
}

/**
 * Rate limit middleware for endpoint-specific limiting
 */
export async function withEndpointRateLimit(
  request: NextRequest,
  endpoint: string
): Promise<NextResponse | null> {
  const result = await checkRateLimit(`endpoint:${endpoint}`, RateLimitType.ENDPOINT);

  if (!result.allowed) {
    const retryAfter = result.blockedUntil
      ? Math.ceil((result.blockedUntil.getTime() - Date.now()) / 1000)
      : Math.ceil((result.resetAt.getTime() - Date.now()) / 1000);

    return NextResponse.json(
      {
        error: result.blocked ? 'Too many requests. Please try again later.' : 'Rate limit exceeded.',
        retryAfter,
      },
      {
        status: 429,
        headers: createRateLimitHeaders(result),
      }
    );
  }

  return null; // Continue to next handler
}

/**
 * Combined rate limit middleware (IP + User)
 */
export async function withCombinedRateLimit(
  request: NextRequest,
  ipType: RateLimitType = RateLimitType.IP_GLOBAL,
  userType: RateLimitType = RateLimitType.USER_GLOBAL
): Promise<NextResponse | null> {
  // Check IP rate limit first
  const ipResult = await withIPRateLimit(request, ipType);
  if (ipResult) return ipResult;

  // Check user rate limit if authenticated
  const userResult = await withUserRateLimit(request, userType);
  if (userResult) return userResult;

  return null; // All checks passed
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  const headers = createRateLimitHeaders(result);
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}
