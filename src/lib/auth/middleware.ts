// Auth Middleware Configuration
// Defines protected routes and public routes

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication
export const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/api/auth',
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

// Check if route is public
export function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some((route) => 
    pathname === route || pathname.startsWith(route + '/')
  );
}

// Check if route is an auth route
export function isAuthRoute(pathname: string): boolean {
  return authRoutes.includes(pathname);
}

// Check if route is an API auth route
export function isApiAuthRoute(pathname: string): boolean {
  return pathname.startsWith(apiAuthPrefix);
}

export default {
  publicRoutes,
  authRoutes,
  apiAuthPrefix,
  DEFAULT_LOGIN_REDIRECT,
  isPublicRoute,
  isAuthRoute,
  isApiAuthRoute,
};
