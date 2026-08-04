// Phone OTP Actions (Task 9)
// Server actions for phone number registration and verification

'use server';

import { auth } from '@/lib/auth';
import { PhoneRegistrationSchema, PhoneOtpVerificationSchema } from '@/lib/utils/validations';
import { generatePhoneOtp, verifyPhoneOtp, resendPhoneOtp } from '@/lib/utils/phoneOtp';
import { logAction } from '@/lib/utils/audit';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

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
