// Password Reset Server Actions (Step 4)
'use server';

import { ForgotPasswordSchema, ResetPasswordSchema } from '@/lib/utils/validations';
import { generatePasswordResetToken, verifyPasswordResetToken, resetPasswordWithToken } from '@/lib/utils/passwordReset';
import { prisma } from '@/lib/prisma';
import { logAction } from '@/lib/utils/audit';
import { validatePasswordStrength } from '@/lib/utils/validations';

/**
 * Request password reset email
 */
export async function requestPasswordResetAction(
  prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  try {
    const validated = ForgotPasswordSchema.safeParse({
      email: formData.get('email'),
    });

    if (!validated.success) {
      return { error: validated.error.errors[0].message };
    }

    const { email } = validated.data;

    const result = await generatePasswordResetToken(email);

    if (!result.success) {
      return { error: result.error };
    }

    // Log attempt
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (user) {
      await logAction({
        userId: user.id,
        action: 'PASSWORD_RESET',
        description: `Password reset requested for ${email}`,
        metadata: { email },
      });
    }

    return {
      success: true,
      message: 'If an account exists with that email, you will receive a password reset link shortly.',
    };
  } catch (error) {
    console.error('Request password reset error:', error);
    return { error: 'Something went wrong. Please try again.' };
  }
}

/**
 * Verify reset token (check if valid before showing form)
 */
export async function verifyResetTokenAction(token: string) {
  try {
    const result = await verifyPasswordResetToken(token);

    if (!result.valid) {
      return { valid: false, error: result.error };
    }

    return { valid: true };
  } catch (error) {
    console.error('Verify reset token error:', error);
    return { valid: false, error: 'Failed to verify token' };
  }
}

/**
 * Reset password with token
 */
export async function resetPasswordAction(
  prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  try {
    const token = formData.get('token') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // Validate input
    const validated = ResetPasswordSchema.safeParse({
      password,
      confirmPassword,
    });

    if (!validated.success) {
      return { error: validated.error.errors[0].message };
    }

    // Validate password strength
    const strengthCheck = validatePasswordStrength(password);
    if (!strengthCheck.valid) {
      return { error: strengthCheck.errors[0] };
    }

    // Reset password
    const result = await resetPasswordWithToken(token, password);

    if (!result.success) {
      return { error: result.error };
    }

    return {
      success: true,
      message: 'Password has been reset successfully. You can now sign in with your new password.',
    };
  } catch (error) {
    console.error('Reset password error:', error);
    return { error: 'Something went wrong. Please try again.' };
  }
}
