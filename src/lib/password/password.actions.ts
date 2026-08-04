/**
 * Password Server Actions
 * Task 21: Password reset (email) + Password change
 * Tasks 39-41: Security cooldown on password change
 */

'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { logAction } from '@/lib/utils/audit';
import { validatePasswordStrength, ChangePasswordSchema } from '@/lib/utils/validations';
import { hashPassword } from '@/lib/password/hash.util';
import { withCooldownCheck } from '@/lib/cooldown/withCooldown';

/**
 * Change password (authenticated users)
 * Tasks 39-41: Now includes cooldown check
 */
export async function changePasswordAction(
  prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // Validate input
    const validated = ChangePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!validated.success) {
      return { error: validated.error.errors[0].message };
    }

    // Validate password strength
    const strengthCheck = validatePasswordStrength(newPassword);
    if (!strengthCheck.valid) {
      return { error: strengthCheck.errors[0] };
    }

    // Tasks 39-41: Apply cooldown check before changing password
    const cooldownResult = await withCooldownCheck(
      session.user.id,
      'password',
      async () => {
        // Get current user with password
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { password: true },
        });

        if (!user?.password) {
          throw new Error('User not found or has no password (OAuth user)');
        }

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
          throw new Error('Current password is incorrect');
        }

        // Check if new password is same as current
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
          throw new Error('New password must be different from current password');
        }

        // Hash and update password
        const hashedPassword = await hashPassword(newPassword);
        await prisma.user.update({
          where: { id: session.user.id },
          data: { password: hashedPassword },
        });

        // Invalidate all sessions except current
        await prisma.session.deleteMany({
          where: { userId: session.user.id },
        });

        // Log action
        await logAction({
          userId: session.user.id,
          action: 'PASSWORD_CHANGE',
          description: 'Password changed',
        });

        revalidatePath('/', 'layout');

        return { message: 'Password changed successfully! Please sign in again.' };
      },
      undefined, // methodIdentifier
      'Password changed by user'
    );

    if (!cooldownResult.success) {
      return { error: cooldownResult.error };
    }

    return {
      success: true,
      ...cooldownResult.data,
    };
  } catch (error) {
    console.error('Change password error:', error);
    return { error: 'Failed to change password' };
  }
}

/**
 * Get password last changed date
 */
export async function getPasswordInfoAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { hasPassword: false };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        password: true,
        updatedAt: true,
        accounts: {
          select: { provider: true },
        },
      },
    });

    if (!user) {
      return { hasPassword: false };
    }

    return {
      hasPassword: !!user.password,
      lastUpdated: user.updatedAt,
      oauthProviders: user.accounts.map(a => a.provider),
    };
  } catch (error) {
    console.error('Get password info error:', error);
    return { hasPassword: false };
  }
}
