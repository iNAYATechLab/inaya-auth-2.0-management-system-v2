/**
 * OTP Server Actions (Tasks 16-18)
 * 
 * Server actions for sending and verifying OTPs
 * Used by frontend components
 */

'use server';

import { otpService, OTPGenerateOptions } from './otp.service';
import { logAction } from '../utils/audit';
import { prisma } from '../prisma';
import { auth } from '../auth';
import { revalidatePath } from 'next/cache';

/**
 * Send OTP to recipient
 */
export async function sendOTPAction(
  prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean; message?: string }> {
  try {
    const recipient = formData.get('recipient') as string;
    const recipientType = formData.get('recipientType') as string;
    const purpose = formData.get('purpose') as string;
    const provider = formData.get('provider') as string | null;
    const locale = formData.get('locale') as string | null;

    if (!recipient || !recipientType || !purpose) {
      return { error: 'Missing required fields' };
    }

    // Validate recipient type
    if (!['email', 'phone', 'telegram'].includes(recipientType)) {
      return { error: 'Invalid recipient type' };
    }

    // Validate purpose
    const validPurposes = ['login', 'verify-email', 'verify-phone', 'reset-password'];
    if (!validPurposes.includes(purpose)) {
      return { error: 'Invalid purpose' };
    }

    // Get session if available
    const session = await auth();
    const userId = session?.user?.id;

    const result = await otpService.generateAndSendOTP({
      recipient,
      recipientType: recipientType as any,
      purpose,
      userId,
      provider: provider || undefined,
      locale: locale || undefined,
    });

    if (!result.success) {
      return { error: result.error };
    }

    // Log OTP sent
    if (userId) {
      await logAction({
        userId,
        action: 'TOKEN_REFRESH', // Using existing enum, should add OTP_SENT
        description: `OTP sent to ${recipient} via ${recipientType}`,
        metadata: {
          recipient,
          recipientType,
          purpose,
          provider: provider || 'default',
        },
      });
    }

    return {
      success: true,
      message: `OTP sent successfully to ${recipient}`,
    };
  } catch (error) {
    console.error('Send OTP error:', error);
    return { error: 'Failed to send OTP. Please try again.' };
  }
}

/**
 * Verify OTP code
 */
export async function verifyOTPAction(
  prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean; message?: string }> {
  try {
    const recipient = formData.get('recipient') as string;
    const recipientType = formData.get('recipientType') as string;
    const code = formData.get('code') as string;
    const purpose = formData.get('purpose') as string;

    if (!recipient || !recipientType || !code || !purpose) {
      return { error: 'Missing required fields' };
    }

    const result = await otpService.verifyOTP({
      recipient,
      recipientType: recipientType as any,
      code,
      purpose,
    });

    if (!result.success) {
      return { error: result.error };
    }

    // Log successful verification
    const session = await auth();
    if (session?.user?.id) {
      await logAction({
        userId: session.user.id,
        action: 'EMAIL_VERIFIED', // Using existing enum
        description: `OTP verified for ${recipient}`,
        metadata: {
          recipient,
          recipientType,
          purpose,
        },
      });
    }

    return {
      success: true,
      message: 'OTP verified successfully',
    };
  } catch (error) {
    console.error('Verify OTP error:', error);
    return { error: 'Failed to verify OTP. Please try again.' };
  }
}

/**
 * Resend OTP
 */
export async function resendOTPAction(
  prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean; message?: string }> {
  try {
    const recipient = formData.get('recipient') as string;
    const recipientType = formData.get('recipientType') as string;
    const purpose = formData.get('purpose') as string;
    const provider = formData.get('provider') as string | null;
    const locale = formData.get('locale') as string | null;

    if (!recipient || !recipientType || !purpose) {
      return { error: 'Missing required fields' };
    }

    const session = await auth();
    const userId = session?.user?.id;

    const result = await otpService.resendOTP(recipient, recipientType, purpose, {
      userId,
      provider: provider || undefined,
      locale: locale || undefined,
    });

    if (!result.success) {
      return { error: result.error };
    }

    return {
      success: true,
      message: `OTP resent successfully to ${recipient}`,
    };
  } catch (error) {
    console.error('Resend OTP error:', error);
    return { error: 'Failed to resend OTP. Please try again.' };
  }
}

/**
 * Send email verification link
 */
export async function sendEmailVerificationLinkAction(
  email: string,
  token: string,
  locale?: string
): Promise<{ error?: string; success?: boolean; message?: string }> {
  try {
    if (!email || !token) {
      return { error: 'Missing required fields' };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationLink = `${appUrl}/${locale || 'en'}/verify-email?token=${token}`;

    const result = await otpService.sendEmailVerificationLink(email, verificationLink, locale);

    if (!result.success) {
      return { error: result.error };
    }

    // Log verification email sent
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (user) {
      await logAction({
        userId: user.id,
        action: 'EMAIL_VERIFIED', // Using existing enum
        description: 'Email verification link sent',
        metadata: { email },
      });
    }

    return {
      success: true,
      message: 'Verification email sent successfully',
    };
  } catch (error) {
    console.error('Send verification link error:', error);
    return { error: 'Failed to send verification email. Please try again.' };
  }
}

/**
 * Get available providers for a recipient type
 */
export async function getAvailableProvidersAction(
  recipientType: string
): Promise<{ providers: Array<{ name: string; type: string }> }> {
  try {
    const providers = otpService.getAvailableProviders(recipientType);
    return {
      providers: providers.map((p) => ({
        name: p.name,
        type: p.type,
      })),
    };
  } catch (error) {
    console.error('Get available providers error:', error);
    return { providers: [] };
  }
}
