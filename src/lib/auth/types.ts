// Auth Types — Extended session and user types

import type { DefaultSession } from 'next-auth';

// Extend the default session type
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession['user'];
  }

  interface User {
    role?: string;
  }
}

// Extend JWT token type
declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
  }
}

// Role types
export type UserRole = 'USER' | 'ADMIN' | 'MODERATOR' | 'SUPERADMIN';

// Role permissions
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  USER: ['profile:view', 'profile:edit'],
  MODERATOR: ['profile:view', 'profile:edit', 'users:view', 'audit:view'],
  ADMIN: ['profile:view', 'profile:edit', 'users:view', 'users:manage', 'audit:view', 'settings:view'],
  SUPERADMIN: ['*'],
};

// Check if user has permission
export function hasPermission(userRole: UserRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[userRole];
  if (!permissions) return false;
  if (permissions.includes('*')) return true;
  return permissions.includes(permission);
}
