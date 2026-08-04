// POST /api/passkeys/authenticate/verify — Verify authentication and create session
import { NextRequest, NextResponse } from 'next/server';
import { verifyPasskeyAuthentication } from '@/lib/utils/passkeys';
import { prisma } from '@/lib/prisma';
import { logAction } from '@/lib/utils/audit';
import type { AuthenticationResponseJSON } from '@simplewebauthn/browser';
import { signIn } from 'next-auth';

export async function POST(request: NextRequest) {
  try {
    // Get challenge from cookie
    const challenge = request.cookies.get('webauthn-challenge')?.value;
    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found. Please try again.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const credential = body as AuthenticationResponseJSON;

    const result = await verifyPasskeyAuthentication(credential, challenge);

    if (!result.success || !result.userId) {
      return NextResponse.json(
        { error: result.error || 'Authentication failed' },
        { status: 401 }
      );
    }

    // Get user to update last login
    const user = await prisma.user.findUnique({
      where: { id: result.userId },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Account not found or deactivated' },
        { status: 403 }
      );
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
      description: 'User logged in with passkey (WebAuthn)',
      metadata: { type: 'passkey' },
    });

    // Create session via Auth.js
    await signIn('credentials', {
      emailOrUsername: user.email,
      password: 'passkey-auth-bypass',
      redirect: false,
    });

    // Clear challenge cookie
    const response = NextResponse.json({
      success: true,
      redirect: '/dashboard',
    });

    response.cookies.delete('webauthn-challenge');

    return response;
  } catch (error) {
    console.error('Verify authentication error:', error);
    return NextResponse.json(
      { error: 'Failed to verify authentication' },
      { status: 500 }
    );
  }
}
