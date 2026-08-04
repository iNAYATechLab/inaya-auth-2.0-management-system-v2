// NextAuth API Route Handler
// Handles all authentication routes at /api/auth/*

import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;
