// Password Reset Utility (Step 4)
// Handles password reset token generation, verification, and email sending

import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

/**
 * Generate password reset token
 */
export async function generatePasswordResetToken(email: string): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists (security)
      return { success: true };
    }

    if (!user.isActive) {
      return { success: false, error: 'Account is deactivated' };
    }

    // Delete any existing reset tokens
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Send email (TODO: integrate with email provider)
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
    
    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.log(`\n[DEV] Password Reset Email for ${email}:`);
      console.log(`Reset Link: ${resetLink}\n`);
    } else {
      // TODO: Send actual email via Resend/SendGrid/Mailgun
      // await sendPasswordResetEmail(email, resetLink);
    }

    return { success: true, token };
  } catch (error) {
    console.error('Generate password reset token error:', error);
    return { success: false, error: 'Failed to generate reset token' };
  }
}

/**
 * Verify password reset token
 */
export async function verifyPasswordResetToken(token: string): Promise<{ valid: boolean; userId?: string; error?: string }> {
  try {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return { valid: false, error: 'Invalid reset token' };
    }

    if (resetToken.expiresAt < new Date()) {
      // Delete expired token
      await prisma.passwordResetToken.delete({
        where: { token },
      });
      return { valid: false, error: 'Reset token has expired' };
    }

    if (!resetToken.user.isActive) {
      return { valid: false, error: 'Account is deactivated' };
    }

    return { valid: true, userId: resetToken.userId };
  } catch (error) {
    console.error('Verify password reset token error:', error);
    return { valid: false, error: 'Failed to verify token' };
  }
}

/**
 * Reset password with token
 */
export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify token
    const verification = await verifyPasswordResetToken(token);
    if (!verification.valid || !verification.userId) {
      return { success: false, error: verification.error || 'Invalid token' };
    }

    // Hash new password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: verification.userId },
      data: { password: hashedPassword },
    });

    // Delete used token
    await prisma.passwordResetToken.delete({
      where: { token },
    });

    // Log password reset
    await prisma.auditLog.create({
      data: {
        userId: verification.userId,
        action: 'PASSWORD_RESET',
        description: 'Password reset via email link',
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Reset password error:', error);
    return { success: false, error: 'Failed to reset password' };
  }
}

/**
 * Check if password reset token exists
 */
export async function hasPasswordResetToken(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      passwordResetTokens: {
        where: {
          expiresAt: { gte: new Date() },
        },
      },
    },
  });

  return !!user && user.passwordResetTokens.length > 0;
}
