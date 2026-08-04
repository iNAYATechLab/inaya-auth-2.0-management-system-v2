// Auth.js v5 (NextAuth.js) — Main Configuration
// Docs: https://authjs.dev/getting-started

import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import authConfig from './config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  ...authConfig,
});
