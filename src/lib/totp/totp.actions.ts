/**
 * Two-Factor Authentication Server Actions
 * Task 20: 2FA (TOTP authenticator) setup, verify, disable, recovery codes
 */

'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import {
  generateTOTPSecret,
  verifyTOTPToken,
  generateTOTPUri,
  generateQRCode,
  generateBackupCodes,
  verifyBackupCode,
  encryptData,
  decryptData,
} from '@/lib/totp/totp.util';
import { logAction } from '@/lib/utils/audit';

/**
 * Generate 2FA setup data (secret + QR code)
 * Returns secret, QR code, and backup codes
 */
export async function generate2FASetupAction() {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
      return { error: 'Unauthorized' };
    }

    // Check if 2FA is already enabled
    const existing2FA = await prisma.twoFactorAuth.findUnique({
      where: { userId: session.user.id },
    });

    if (existing2FA?.isEnabled) {
      return { error: '2FA is already enabled. Disable it first to reconfigure.' };
    }

    // Generate new secret
    const secret = generateTOTPSecret();
    
    // Generate URI and QR code
    const uri = generateTOTPUri(session.user.email, secret, 'iNAYA Auth');
    const qrCode = await generateQRCode(uri);
    
    // Generate backup codes
    const backupCodes = generateBackupCodes(10);

    // Store unverified 2FA setup
    await prisma.twoFactorAuth.upsert({
      where: { userId: session.user.id },
      update: {
        secret: encryptData(secret),
        isVerified: false,
        isEnabled: false,
        backupCodes: JSON.parse(JSON.stringify(backupCodes.map(code => encryptData(code)))),
      },
      create: {
        userId: session.user.id,
        secret: encryptData(secret),
        isVerified: false,
        isEnabled: false,
        backupCodes: JSON.parse(JSON.stringify(backupCodes.map(code => encryptData(code)))),
      },
    });

    return {
      success: true,
      secret,
      qrCode,
      backupCodes,
    };
  } catch (error) {
    console.error('Generate 2FA setup error:', error);
    return { error: 'Failed to generate 2FA setup' };
  }
}

/**
 * Verify and enable 2FA
 */
export async function verifyAndEnable2FAAction(token: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    // Get 2FA setup
    const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
      where: { userId: session.user.id },
    });

    if (!twoFactorAuth) {
      return { error: '2FA setup not found. Please generate setup first.' };
    }

    if (twoFactorAuth.isEnabled) {
      return { error: '2FA is already enabled.' };
    }

    // Decrypt secret
    const secret = decryptData(twoFactorAuth.secret);

    // Verify token
    const isValid = verifyTOTPToken(token, secret);
    if (!isValid) {
      return { error: 'Invalid TOTP token. Please try again.' };
    }

    // Enable 2FA
    await prisma.twoFactorAuth.update({
      where: { userId: session.user.id },
      data: {
        isVerified: true,
        isEnabled: true,
        lastVerifiedAt: new Date(),
      },
    });

    // Log action
    await logAction({
      userId: session.user.id,
      action: 'PROFILE_UPDATE',
      description: 'Two-factor authentication enabled',
    });

    revalidatePath('/', 'layout');

    return {
      success: true,
      message: '2FA enabled successfully!',
    };
  } catch (error) {
    console.error('Verify and enable 2FA error:', error);
    return { error: 'Failed to enable 2FA' };
  }
}

/**
 * Disable 2FA
 */
export async function disable2FAAction(password: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    // Verify password
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });

    if (!user?.password) {
      return { error: 'User not found' };
    }

    const bcrypt = require('bcryptjs');
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return { error: 'Invalid password' };
    }

    // Delete 2FA
    await prisma.twoFactorAuth.delete({
      where: { userId: session.user.id },
    });

    // Log action
    await logAction({
      userId: session.user.id,
      action: 'PROFILE_UPDATE',
      description: 'Two-factor authentication disabled',
    });

    revalidatePath('/', 'layout');

    return {
      success: true,
      message: '2FA disabled successfully!',
    };
  } catch (error) {
    console.error('Disable 2FA error:', error);
    return { error: 'Failed to disable 2FA' };
  }
}

/**
 * Verify 2FA token during login
 */
export async function verify2FATokenAction(token: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized', valid: false };
    }

    const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
      where: { userId: session.user.id },
    });

    if (!twoFactorAuth || !twoFactorAuth.isEnabled) {
      return { error: '2FA is not enabled', valid: false };
    }

    const secret = decryptData(twoFactorAuth.secret);
    const isValid = verifyTOTPToken(token, secret);

    if (isValid) {
      // Update last verified
      await prisma.twoFactorAuth.update({
        where: { userId: session.user.id },
        data: { lastVerifiedAt: new Date() },
      });
    }

    return {
      valid: isValid,
      error: isValid ? undefined : 'Invalid TOTP token',
    };
  } catch (error) {
    console.error('Verify 2FA token error:', error);
    return { error: 'Failed to verify 2FA token', valid: false };
  }
}

/**
 * Verify backup code during login
 */
export async function verifyBackupCodeAction(code: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized', valid: false, remaining: 0 };
    }

    const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
      where: { userId: session.user.id },
    });

    if (!twoFactorAuth || !twoFactorAuth.isEnabled) {
      return { error: '2FA is not enabled', valid: false, remaining: 0 };
    }

    // Decrypt backup codes
    const encryptedCodes = twoFactorAuth.backupCodes as string[];
    const backupCodes = encryptedCodes.map(encrypted => decryptData(encrypted));

    // Verify code
    const { valid, remainingCodes } = verifyBackupCode(code, backupCodes);

    if (valid) {
      // Update backup codes (remove used code)
      const newEncryptedCodes = remainingCodes.map(code => encryptData(code));
      await prisma.twoFactorAuth.update({
        where: { userId: session.user.id },
        data: {
          backupCodes: JSON.parse(JSON.stringify(newEncryptedCodes)),
          lastVerifiedAt: new Date(),
        },
      });

      // Log action
      await logAction({
        userId: session.user.id,
        action: 'PROFILE_UPDATE',
        description: 'Backup code used for 2FA verification',
      });
    }

    return {
      valid,
      remaining: remainingCodes.length,
      error: valid ? undefined : 'Invalid backup code',
    };
  } catch (error) {
    console.error('Verify backup code error:', error);
    return { error: 'Failed to verify backup code', valid: false, remaining: 0 };
  }
}

/**
 * Regenerate backup codes
 */
export async function regenerateBackupCodesAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
      where: { userId: session.user.id },
    });

    if (!twoFactorAuth || !twoFactorAuth.isEnabled) {
      return { error: '2FA is not enabled' };
    }

    // Generate new backup codes
    const newBackupCodes = generateBackupCodes(10);
    const encryptedCodes = newBackupCodes.map(code => encryptData(code));

    // Update in database
    await prisma.twoFactorAuth.update({
      where: { userId: session.user.id },
      data: {
        backupCodes: JSON.parse(JSON.stringify(encryptedCodes)),
      },
    });

    // Log action
    await logAction({
      userId: session.user.id,
      action: 'PROFILE_UPDATE',
      description: 'Backup codes regenerated',
    });

    return {
      success: true,
      backupCodes: newBackupCodes,
    };
  } catch (error) {
    console.error('Regenerate backup codes error:', error);
    return { error: 'Failed to regenerate backup codes' };
  }
}

/**
 * Check if 2FA is enabled for current user
 */
export async function check2FAStatusAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { enabled: false };
    }

    const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
      where: { userId: session.user.id },
      select: { isEnabled: true, isVerified: true },
    });

    return {
      enabled: twoFactorAuth?.isEnabled || false,
      verified: twoFactorAuth?.isVerified || false,
    };
  } catch (error) {
    console.error('Check 2FA status error:', error);
    return { enabled: false };
  }
}
