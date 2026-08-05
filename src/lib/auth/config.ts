// Auth.js v5 — Configuration
// Handles providers, session, callbacks, pages, and security
// Task 7: Added Facebook, Apple, Microsoft OAuth providers

import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
import Facebook from 'next-auth/providers/facebook';
import Apple from 'next-auth/providers/apple';
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { LoginSchema } from '@/lib/utils/validations';
import { logAction } from '@/lib/utils/audit';

const authConfig: NextAuthConfig = {
  // ─── Trust host header ───────────────────────────────────────────────────────
  trustHost: true,

  // ─── Session strategy ────────────────────────────────────────────────────────
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days (default)
  },

  // ─── Cookie Security (Task 15) ─────────────────────────────────────────────
  cookies: {
    sessionToken: {
      name: `__Secure-authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: `__Secure-authjs.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: `__Host-authjs.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },

  // ─── Custom pages ────────────────────────────────────────────────────────────
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
    verifyRequest: '/login',
    newUser: '/dashboard',
  },

  // ─── Providers ───────────────────────────────────────────────────────────────
  providers: [
    // Credentials Provider (Email/Username + Password) — Task 11
    Credentials({
      name: 'credentials',
      credentials: {
        emailOrUsername: { label: 'Email or Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const emailOrUsername = credentials?.emailOrUsername as string;
          const password = credentials?.password as string;

          if (!emailOrUsername || !password) {
            return null;
          }

          // Find user by email OR username
          const isEmail = emailOrUsername.includes('@');
          const user = await prisma.user.findUnique({
            where: isEmail
              ? { email: emailOrUsername }
              : { username: emailOrUsername },
          });

          if (!user || !user.password) {
            return null;
          }

          // Check if account is active
          if (!user.isActive) {
            return null;
          }

          // Check for passkey auth bypass (Task 13)
          if (password === 'passkey-auth-bypass') {
            // This is a passkey-authenticated login, skip password check
            // Already verified in /api/passkeys/authenticate/verify
          } else {
            // Normal password verification
            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
              // Log failed attempt
              await logAction({
                userId: user.id,
                action: 'FAILED_LOGIN',
                description: 'Failed login attempt - wrong password',
              });
              return null;
            }
          }

          // Update last login
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
          });

          // Log successful login
          await logAction({
            userId: user.id,
            action: 'LOGIN',
            description: 'User logged in with credentials',
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),

    // GitHub OAuth Provider (Task 7)
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),

    // Google OAuth Provider (Task 7)
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),

    // Facebook/Meta OAuth Provider (Task 7)
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),

    // Apple OAuth Provider (Task 7)
    Apple({
      clientId: process.env.APPLE_CLIENT_ID,
      clientSecret: process.env.APPLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),

    // Microsoft OAuth Provider (Task 7)
    MicrosoftEntraID({
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      issuer: process.env.MICROSOFT_ISSUER,
      allowDangerousEmailAccountLinking: true,
    }),
  ],

  // ─── Callbacks ───────────────────────────────────────────────────────────────
  callbacks: {
    // Sign In Callback
    async signIn({ user, account, profile }) {
      // For OAuth providers, check if email is verified
      if (account?.provider !== 'credentials') {
        if (!user.email) {
          return false;
        }

        // Check if user exists and is active
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (existingUser && !existingUser.isActive) {
          return false;
        }
      }

      return true;
    },

    // JWT Callback - Add custom fields to JWT token
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || 'USER';
      }

      // For OAuth providers, fetch user role from database
      if (account?.provider !== 'credentials' && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
          select: { role: true, isActive: true },
        });

        if (dbUser) {
          token.role = dbUser.role;
          if (!dbUser.isActive) {
            // Return empty token to invalidate session
            return {};
          }
        }
      }

      return token;
    },

    // Session Callback - Expose custom fields to client
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }

      return session;
    },
  },

  // ─── Events ──────────────────────────────────────────────────────────────────
  events: {
    // Triggered when user signs in
    async signIn({ user, account }) {
      if (account?.provider !== 'credentials') {
        await logAction({
          userId: user.id!,
          action: 'LOGIN',
          description: `User logged in via ${account?.provider || "unknown"}`,
        });
      }
    },

    // Triggered when user signs out
    async signOut({ session, token }: any) {
      const userId = session?.user?.id || token?.id;
      if (userId) {
        await logAction({
          userId: userId as string,
          action: 'LOGOUT',
          description: 'User logged out',
        });
      }
    },
  },

  // ─── Debug mode ──────────────────────────────────────────────────────────────
  debug: process.env.NODE_ENV === 'development',
};

export default authConfig;
