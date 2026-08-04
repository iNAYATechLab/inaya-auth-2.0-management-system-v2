// POST /api/passkeys/register/verify — Verify registration response
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { verifyPasskeyRegistration } from '@/lib/utils/passkeys';
import { logAction } from '@/lib/utils/audit';
import type { RegistrationResponseJSON } from '@simplewebauthn/browser';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get challenge from cookie
    const challenge = request.cookies.get('webauthn-challenge')?.value;
    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found. Please try again.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const credential = body as RegistrationResponseJSON;

    const result = await verifyPasskeyRegistration(
      session.user.id,
      credential,
      challenge
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Verification failed' },
        { status: 400 }
      );
    }

    // Log passkey creation
    await logAction({
      userId: session.user.id,
      action: 'ACCOUNT_LINKED',
      description: 'New passkey registered',
      metadata: { type: 'passkey', credentialId: result.credentialId },
    });

    // Clear challenge cookie
    const response = NextResponse.json({
      success: true,
      message: 'Passkey registered successfully!',
    });

    response.cookies.delete('webauthn-challenge');

    return response;
  } catch (error) {
    console.error('Verify registration error:', error);
    return NextResponse.json(
      { error: 'Failed to verify registration' },
      { status: 500 }
    );
  }
}
