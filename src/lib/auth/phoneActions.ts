// Phone OTP Actions (Task 9, 14)
// Server actions for phone number registration, verification, and login

'use server';

import { auth } from '@/lib/auth';
import { signIn as nextAuthSignIn } from '@/lib/auth';
import { PhoneRegistrationSchema, PhoneOtpVerificationSchema, PhoneLoginSchema, PhoneOtpLoginSchema } from '@/lib/utils/validations';
import { generatePhoneOtp, verifyPhoneOtp, resendPhoneOtp } from '@/lib/utils/phoneOtp';
import { logAction } from '@/lib/utils/audit';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { AuthError } from 'next-auth';

/**
 * Send OTP to phone number (Task 9)
 */
export async function sendPhoneOtpAction(
  prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  try {
    // Check if user is authenticated
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be logged in to add a phone number' };
    }

    // Validate phone number
    const validated = PhoneRegistrationSchema.safeParse({
      phoneNumber: formData.get('phoneNumber'),
    });

    if (!validated.success) {
      return { error: validated.error.errors[0].message };
    }

    const { phoneNumber } = validated.data;

    // Generate and send OTP
    const result = await generatePhoneOtp(session.user.id, phoneNumber);

    if (!result.success) {
      return { error: result.error };
    }

    return { 
      success: true, 
      message: `OTP sent to ${phoneNumber}. Please check your phone.`,
      phoneNumber,
    };
  } catch (error) {
    console.error('Send OTP error:', error);
    return { error: 'Something went wrong while sending OTP' };
  }
}

/**
 * Verify phone OTP (Task 9)
 */
export async function verifyPhoneOtpAction(
  prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  try {
    // Check if user is authenticated
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be logged in to verify phone number' };
    }

    // Validate OTP
    const validated = PhoneOtpVerificationSchema.safeParse({
      phoneNumber: formData.get('phoneNumber'),
      otp: formData.get('otp'),
    });

    if (!validated.success) {
      return { error: validated.error.errors[0].message };
    }

    const { phoneNumber, otp } = validated.data;

    // Verify OTP
    const result = await verifyPhoneOtp(session.user.id, phoneNumber, otp);

    if (!result.success) {
      return { error: result.error };
    }

    // Log phone verification
    await logAction({
      userId: session.user.id,
      action: 'PHONE_VERIFIED',
      description: `Phone number verified: ${phoneNumber}`,
    });

    revalidatePath('/', 'layout');
    
    return { 
      success: true, 
      message: 'Phone number verified successfully!' 
    };
  } catch (error) {
    console.error('Verify OTP error:', error);
    return { error: 'Something went wrong while verifying OTP' };
  }
}

/**
 * Resend phone OTP (Task 9)
 */
export async function resendPhoneOtpAction(phoneNumber: string) {
  try {
    // Check if user is authenticated
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be logged in' };
    }

    const result = await resendPhoneOtp(session.user.id, phoneNumber);

    if (!result.success) {
      return { error: result.error };
    }

    return { 
      success: true, 
      message: `New OTP sent to ${phoneNumber}` 
    };
  } catch (error) {
    console.error('Resend OTP error:', error);
    return { error: 'Something went wrong while resending OTP' };
  }
}

/**
 * Remove phone number from account (Task 9)
 */
export async function removePhoneNumberAction() {
  try {
    // Check if user is authenticated
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be logged in' };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        phoneNumber: null,
        phoneVerified: null,
      },
    });

    revalidatePath('/', 'layout');
    
    return { 
      success: true, 
      message: 'Phone number removed successfully' 
    };
  } catch (error) {
    console.error('Remove phone error:', error);
    return { error: 'Something went wrong while removing phone number' };
  }
}

// ─── Phone OTP Login (Task 14) ──────────────────────────────────────────────

/**
 * Send login OTP to phone number (no authentication required)
 */
export async function sendPhoneLoginOtpAction(
  prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  try {
    const validated = PhoneLoginSchema.safeParse({
      phoneNumber: formData.get('phoneNumber'),
    });

    if (!validated.success) {
      return { error: validated.error.errors[0].message };
    }

    const { phoneNumber } = validated.data;

    // Find user with this phone number
    const user = await prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (!user) {
      return { error: 'No account found with this phone number' };
    }

    if (!user.isActive) {
      return { error: 'Your account has been deactivated' };
    }

    if (!user.phoneVerified) {
      return { error: 'Phone number is not verified. Please verify first.' };
    }

    // Delete any existing login OTPs for this user
    await prisma.otpCode.deleteMany({
      where: {
        userId: user.id,
        verifiedAt: null,
      },
    });

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

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

    // TODO: Send SMS via provider (Twilio, etc.)
    console.log(`[DEV] Login OTP for ${phoneNumber}: ${otp}`);

    return {
      success: true,
      message: `OTP sent to ${phoneNumber}`,
    };
  } catch (error) {
    console.error('Send login OTP error:', error);
    return { error: 'Something went wrong while sending OTP' };
  }
}

/**
 * Verify phone login OTP and sign in
 */
export async function verifyPhoneLoginOtpAction(
  prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  try {
    const validated = PhoneOtpLoginSchema.safeParse({
      phoneNumber: formData.get('phoneNumber'),
      otp: formData.get('otp'),
    });

    if (!validated.success) {
      return { error: validated.error.errors[0].message };
    }

    const { phoneNumber, otp } = validated.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (!user) {
      return { error: 'Invalid phone number or OTP' };
    }

    // Find OTP record
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        userId: user.id,
        recipient: phoneNumber,
        recipientType: 'phone',
        purpose: 'login',
        verifiedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return { error: 'No OTP found. Please request a new one.' };
    }

    if (otpRecord.expiresAt < new Date()) {
      return { error: 'OTP has expired. Please request a new one.' };
    }

    if (otpRecord.code !== otp) {
      await logAction({
        userId: user.id,
        action: 'FAILED_LOGIN',
        description: 'Failed phone login - wrong OTP',
      });
      return { error: 'Invalid OTP. Please try again.' };
    }

    // Mark OTP as verified
    await prisma.otpCode.update({
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
      description: `User logged in via phone OTP: ${phoneNumber}`,
    });

    // Sign in with user's email (since credentials use email)
    await nextAuthSignIn('credentials', {
      emailOrUsername: user.email,
      password: 'phone-otp-bypass', // Special marker - handled in authorize
      redirect: false,
    });

    revalidatePath('/', 'layout');

    return {
      success: true,
      message: 'Phone login successful!',
    };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'Authentication failed. Please try again.' };
    }
    console.error('Verify phone login error:', error);
    return { error: 'Something went wrong during phone login' };
  }
}
