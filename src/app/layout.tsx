// Root Layout
// This is the base layout that wraps the entire application

import type { Metadata, Viewport } from 'next';
import { Inter, Poppins } from 'next/font/google';
import '@/styles/globals.css';

// ─── Fonts ───────────────────────────────────────────────────────────────────
const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

// ─── Metadata ────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: 'iNAYA Auth 2.0 — Authentication & Authorization Management',
    template: '%s | iNAYA Auth 2.0',
  },
  description: 'A modern authentication and authorization management system built with Next.js, PostgreSQL, Prisma, and Auth.js v5.',
  keywords: ['authentication', 'authorization', 'management', 'iNAYA', 'Next.js', 'PostgreSQL'],
  authors: [{ name: 'iNAYA TechLab' }],
  creator: 'iNAYA TechLab',
  publisher: 'iNAYA TechLab',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'iNAYA Auth 2.0',
    title: 'iNAYA Auth 2.0 — Authentication & Authorization Management',
    description: 'A modern authentication and authorization management system.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'iNAYA Auth 2.0',
    description: 'Authentication & Authorization Management System',
  },
};

// ─── Viewport ────────────────────────────────────────────────────────────────
export const viewport: Viewport = {
  themeColor: '#6D28D9',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

// ─── Layout ──────────────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
