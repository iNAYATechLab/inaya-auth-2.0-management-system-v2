// i18n Configuration — Supported locales and default settings

export const locales = ['en', 'bn', 'hi', 'ar'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

// Locale metadata
export const localeNames: Record<Locale, string> = {
  en: 'English',
  bn: 'বাংলা',
  hi: 'हिन्दी',
  ar: 'العربية',
};

// Locale directions (RTL support)
export const localeDirections: Record<Locale, 'ltr' | 'rtl'> = {
  en: 'ltr',
  bn: 'ltr',
  hi: 'ltr',
  ar: 'rtl',
};

// Locale flags (emoji)
export const localeFlags: Record<Locale, string> = {
  en: '🇺🇸',
  bn: '🇧🇩',
  hi: '🇮🇳',
  ar: '🇸🇦',
};

// Check if locale is valid
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}
