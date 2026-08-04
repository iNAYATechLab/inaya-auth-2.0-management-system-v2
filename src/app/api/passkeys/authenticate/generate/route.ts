// POST /api/passkeys/authenticate/generate — Generate authentication options
import { NextRequest, NextResponse } from 'next/server';
import { generatePasskeyAuthenticationOptions } from '@/lib/utils/passkeys';

export async function POST(request: NextRequest) {
  try {
    const { options, challenge } = await generatePasskeyAuthenticationOptions();

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
    console.error('Generate authentication options error:', error);
    return NextResponse.json(
      { error: 'Failed to generate authentication options' },
      { status: 500 }
    );
  }
}
