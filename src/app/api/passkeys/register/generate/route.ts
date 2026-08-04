// POST /api/passkeys/register/generate — Generate registration options
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generatePasskeyRegistrationOptions } from '@/lib/utils/passkeys';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { options, challenge } = await generatePasskeyRegistrationOptions(
      session.user.id,
      session.user.email
    );

    // Store challenge in a cookie (short-lived)
    const response = NextResponse.json({ options });
    response.cookies.set('webauthn-challenge', challenge, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 5, // 5 minutes
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Generate registration options error:', error);
    return NextResponse.json(
      { error: 'Failed to generate registration options' },
      { status: 500 }
    );
  }
}
