// Tailwind CSS Configuration
// iNAYA Brand Colors: Indigo #6D28D9 + Gold #F59E0B

import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ─── iNAYA Brand Colors ─────────────────────────────────────────────────
      colors: {
        // Primary - Indigo #6D28D9
        primary: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9', // Brand Primary
          800: '#5B21B6',
          900: '#4C1D95',
          950: '#2E1065',
          DEFAULT: '#6D28D9',
        },
        // Accent - Gold #F59E0B
        accent: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B', // Brand Accent
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
          950: '#451A03',
          DEFAULT: '#F59E0B',
        },
        // Neutral - Slate
        neutral: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        },
        // Semantic Colors
        success: {
          50: '#F0FDF4',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          DEFAULT: '#22C55E',
        },
        warning: {
          50: '#FFFBEB',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          DEFAULT: '#F59E0B',
        },
        error: {
          50: '#FEF2F2',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          DEFAULT: '#EF4444',
        },
        info: {
          50: '#EFF6FF',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          DEFAULT: '#3B82F6',
        },
      },
      // ─── Typography ─────────────────────────────────────────────────────────
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
      // ─── Spacing ────────────────────────────────────────────────────────────
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      // ─── Border Radius ──────────────────────────────────────────────────────
      borderRadius: {
        'lg': 'var(--radius)',
        'md': 'calc(var(--radius) - 2px)',
        'sm': 'calc(var(--radius) - 4px)',
      },
      // ─── Shadows ────────────────────────────────────────────────────────────
      boxShadow: {
        'inaya': '0 4px 6px -1px rgba(109, 40, 217, 0.1), 0 2px 4px -1px rgba(109, 40, 217, 0.06)',
        'inaya-lg': '0 10px 15px -3px rgba(109, 40, 217, 0.1), 0 4px 6px -2px rgba(109, 40, 217, 0.05)',
        'inaya-xl': '0 20px 25px -5px rgba(109, 40, 217, 0.1), 0 10px 10px -5px rgba(109, 40, 217, 0.04)',
      },
      // ─── Animations ─────────────────────────────────────────────────────────
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'spin-slow': 'spin-slow 3s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
