// POST /api/auth/phone-login/send — Send login OTP to phone
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PhoneLoginSchema } from '@/lib/utils/validations';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validated = PhoneLoginSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const { phoneNumber } = validated.data;

    // Find user with this phone number
    const user = await prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this phone number' },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Your account has been deactivated' },
        { status: 403 }
      );
    }

    if (!user.phoneVerified) {
      return NextResponse.json(
        { error: 'Phone number is not verified' },
        { status: 400 }
      );
    }

    // Check rate limit (60 seconds)
    const recentOtp = await prisma.otpCode.findFirst({
      where: {
        userId: user.id,
        recipientType: 'phone',
        purpose: 'login',
        createdAt: {
          gte: new Date(Date.now() - 60 * 1000),
        },
      },
    });

    if (recentOtp) {
      return NextResponse.json(
        { error: 'Please wait before requesting a new OTP' },
        { status: 429 }
      );
    }

    // Delete existing unverified OTPs
    await prisma.otpCode.deleteMany({
      where: {
        userId: user.id,
        recipientType: 'phone',
        purpose: 'login',
        verifiedAt: null,
      },
    });

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await prisma.otpCode.create({
      data: {
        userId: user.id,
        recipient: phoneNumber,
        recipientType: 'phone',
        code: otp,
        purpose: 'login',
        expiresAt,
      },
    });

    // TODO: Send via SMS provider
    console.log(`[DEV] Login OTP for ${phoneNumber}: ${otp}`);

    return NextResponse.json({
      success: true,
      message: `OTP sent to ${phoneNumber}`,
    });
  } catch (error) {
    console.error('Send phone login OTP error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
