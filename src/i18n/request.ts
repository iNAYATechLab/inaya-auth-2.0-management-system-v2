// next-intl Request Configuration
// Docs: https://next-intl-docs.vercel.app/docs/routing

import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, isValidLocale } from './config';

export default getRequestConfig(async () => {
  return {
    locale: defaultLocale,
    messages: {
      ...(await import(`../../messages/${defaultLocale}.json`)).default,
    },
  };
});
