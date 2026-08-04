// Locale Layout
// Wraps all pages with locale-specific providers and HTML attributes

import { NextIntlClientProvider, useMessages } from 'next-intl';
import { notFound } from 'next/navigation';
import { locales, isValidLocale, localeDirections } from '@/i18n/config';
import { Inter, Poppins } from 'next/font/google';
import '@/styles/globals.css';

// ─── Fonts ───────────────────────────────────────────────────────────────────
const inter = Inter({
  subsets: ['latin', 'bengali'],
  variable: '--font-inter',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

// ─── Props ───────────────────────────────────────────────────────────────────
interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

// ─── Layout ──────────────────────────────────────────────────────────────────
export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  // Validate locale
  if (!isValidLocale(locale)) {
    notFound();
  }

  // Get direction for RTL support
  const direction = localeDirections[locale as keyof typeof localeDirections];

  // Get messages
  const messages = useMessages();

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <body className={`${inter.variable} ${poppins.variable} font-sans antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

// ─── Generate Static Params ──────────────────────────────────────────────────
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
