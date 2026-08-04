import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale, isValidLocale } from '@/i18n/config';
import { securityHeaders } from '@/lib/auth/security';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
});

export default async function middleware(request: NextRequest) {
  const response = intlMiddleware(request);

  // Apply security headers (Task 15)
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  matcher: [
    '/((?!_next|api(?!/auth)|favicon.ico|.*\\..*).*)',
  ],
};
