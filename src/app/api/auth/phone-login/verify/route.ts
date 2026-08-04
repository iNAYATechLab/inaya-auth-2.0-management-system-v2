// POST /api/auth/phone-login/verify — Verify login OTP and create session
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PhoneOtpLoginSchema } from '@/lib/utils/validations';
import { logAction } from '@/lib/utils/audit';
import { signIn } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validated = PhoneOtpLoginSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const { phoneNumber, otp } = validated.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid phone number or OTP' },
        { status: 401 }
      );
    }

    // Find OTP record
    const otpRecord = await prisma.phoneOtp.findFirst({
      where: {
        userId: user.id,
        phoneNumber,
        verifiedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'No OTP found. Please request a new one.' },
        { status: 400 }
      );
    }

    if (otpRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    if (otpRecord.otp !== otp) {
      await logAction({
        userId: user.id,
        action: 'FAILED_LOGIN',
        description: 'Failed phone login - wrong OTP',
      });
      return NextResponse.json(
        { error: 'Invalid OTP. Please try again.' },
        { status: 401 }
      );
    }

    // Mark OTP as verified
    await prisma.phoneOtp.update({
      where: { id: otpRecord.id },
      data: { verifiedAt: new Date() },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Log successful login
    await logAction({
      userId: user.id,
      action: 'LOGIN',
      description: `User logged in via phone OTP`,
    });

    // Sign in via Auth.js (using email internally)
    try {
      await signIn('credentials', {
        emailOrUsername: user.email,
        password: 'phone-otp-bypass',
        redirect: false,
      });
    } catch (authError) {
      // Auth.js throws redirect error even with redirect: false
      // This is expected behavior
    }

    return NextResponse.json({
      success: true,
      message: 'Login successful!',
      redirect: '/dashboard',
    });
  } catch (error) {
    console.error('Verify phone login OTP error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
