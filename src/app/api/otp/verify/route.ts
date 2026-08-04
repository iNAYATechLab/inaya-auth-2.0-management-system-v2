/**
 * POST /api/otp/verify
 * Verify OTP code
 */

import { NextRequest, NextResponse } from 'next/server';
import { otpService } from '@/lib/otp/otp.service';
import { auth } from '@/lib/auth';
import { logAction } from '@/lib/utils/audit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipient, recipientType, code, purpose } = body;

    // Validate required fields
    if (!recipient || !recipientType || !code || !purpose) {
      return NextResponse.json(
        { error: 'Missing required fields: recipient, recipientType, code, purpose' },
        { status: 400 }
      );
    }

    // Validate recipient type
    if (!['email', 'phone', 'telegram'].includes(recipientType)) {
      return NextResponse.json(
        { error: 'Invalid recipient type' },
        { status: 400 }
      );
    }

    // Validate code format (should be numeric)
    if (!/^\d+$/.test(code)) {
      return NextResponse.json(
        { error: 'Invalid code format' },
        { status: 400 }
      );
    }

    // Verify OTP
    const result = await otpService.verifyOTP({
      recipient,
      recipientType,
      code,
      purpose,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Log successful verification
    const session = await auth();
    if (session?.user?.id) {
      await logAction({
        userId: session.user.id,
        action: 'EMAIL_VERIFIED',
        description: `OTP verified for ${recipient}`,
        metadata: {
          recipient,
          recipientType,
          purpose,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
