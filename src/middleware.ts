import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale, isValidLocale } from '@/i18n/config';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
});

export default intlMiddleware;

export const config = {
  matcher: [
    '/((?!_next|api(?!/auth)|favicon.ico|.*\\..*).*)',
  ],
};
