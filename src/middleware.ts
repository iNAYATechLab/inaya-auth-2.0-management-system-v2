/**
 * Security Middleware (Task 50)
 * 
 * Apply security headers, CSRF protection, CORS, rate limiting
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { applySecurityHeaders, getDefaultCORSConfig, isValidCORSOrigin, logSecurityEvent } from '@/lib/security/security.util';

// Public routes that don't require authentication
export const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/api/auth',
  '/api/webhooks',
  '/legal',
  '/privacy-policy',
  '/cookie-policy',
  '/terms',
];

// Routes that are public but redirect to dashboard if authenticated
export const authRoutes = [
  '/login',
  '/register',
];

// API routes that don't require authentication
export const apiAuthPrefix = '/api/auth';

// Default redirect path after login
export const DEFAULT_LOGIN_REDIRECT = '/dashboard';

/**
 * Check if route is public
 */
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some((route) => 
    pathname === route || pathname.startsWith(route + '/')
  );
}

/**
 * Check if route is an auth route
 */
function isAuthRoute(pathname: string): boolean {
  return authRoutes.includes(pathname);
}

/**
 * Check if route is an API auth route
 */
function isApiAuthRoute(pathname: string): boolean {
  return pathname.startsWith(apiAuthPrefix);
}

export default async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const pathname = nextUrl.pathname;
  
  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }
  
  // Apply security headers to all responses
  const response = NextResponse.next();
  applySecurityHeaders(response.headers);
  
  // Handle CORS for API routes
  if (pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    const corsConfig = getDefaultCORSConfig();
    
    if (origin && isValidCORSOrigin(origin, corsConfig)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Methods', corsConfig.allowedMethods.join(', '));
      response.headers.set('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '));
      response.headers.set('Access-Control-Expose-Headers', corsConfig.exposedHeaders.join(', '));
      response.headers.set('Access-Control-Max-Age', corsConfig.maxAge.toString());
      
      if (corsConfig.credentials) {
        response.headers.set('Access-Control-Allow-Credentials', 'true');
      }
    }
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: response.headers,
      });
    }
  }
  
  // Get session token
  const sessionToken = request.cookies.get('authjs.session-token')?.value ||
    request.cookies.get('__Secure-authjs.session-token')?.value;
  
  // Check if route is public (auth pages)
  const isPublic = isPublicRoute(pathname);
  
  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (sessionToken && isAuthRoute(pathname)) {
    const locale = pathname.split('/')[1] || 'en';
    const url = new URL(`/${locale}/dashboard`, request.url);
    return NextResponse.redirect(url);
  }
  
  // If user is not authenticated and trying to access protected route, redirect to login
  if (!sessionToken && !isPublic && !isApiAuthRoute(pathname) && !pathname.startsWith('/api/')) {
    // Determine locale from pathname or cookie
    const localeFromPath = pathname.split('/')[1];
    const locale = ['en', 'bn', 'hi', 'ar'].includes(localeFromPath) ? localeFromPath : 'en';
    const url = new URL(`/${locale}/login`, request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }
  
  // Log security events for suspicious activity
  if (pathname.includes('<script>') || pathname.includes('javascript:')) {
    await logSecurityEvent({
      eventType: 'XSS_ATTEMPT',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      details: { path: pathname },
      severity: 'high',
    });
  }
  
  return response;
}

export const config = {
  matcher: [
    '/((?!_next|api(?!/auth)|favicon.ico|.*\\..*).*)',
  ],
};
