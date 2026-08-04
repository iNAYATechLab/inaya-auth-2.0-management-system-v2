/**
 * POST /api/otp/send
 * Send OTP to recipient
 */

import { NextRequest, NextResponse } from 'next/server';
import { otpService } from '@/lib/otp/otp.service';
import { auth } from '@/lib/auth';
import { logAction } from '@/lib/utils/audit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipient, recipientType, purpose, provider, locale } = body;

    // Validate required fields
    if (!recipient || !recipientType || !purpose) {
      return NextResponse.json(
        { error: 'Missing required fields: recipient, recipientType, purpose' },
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

    // Validate purpose
    const validPurposes = ['login', 'verify-email', 'verify-phone', 'reset-password'];
    if (!validPurposes.includes(purpose)) {
      return NextResponse.json(
        { error: 'Invalid purpose' },
        { status: 400 }
      );
    }

    // Get session if available
    const session = await auth();
    const userId = session?.user?.id;

    // Send OTP
    const result = await otpService.generateAndSendOTP({
      recipient,
      recipientType,
      purpose,
      userId,
      provider,
      locale,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Log OTP sent
    if (userId) {
      await logAction({
        userId,
        action: 'TOKEN_REFRESH',
        description: `OTP sent to ${recipient} via ${recipientType}`,
        metadata: {
          recipient,
          recipientType,
          purpose,
          provider: provider || 'default',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `OTP sent successfully to ${recipient}`,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
