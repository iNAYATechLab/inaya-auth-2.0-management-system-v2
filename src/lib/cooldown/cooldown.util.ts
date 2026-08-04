/**
 * Security Cooldown Utilities (Tasks 39-41)
 * 
 * Task 39: Security cooldown on login method changes
 * Task 40: Prevent simultaneous login method changes (account takeover protection)
 * Task 41: Super Admin configurable cooldown duration
 */

import { prisma } from '@/lib/prisma';

export type LoginMethodType = 'password' | '2fa' | 'passkey' | 'oauth' | 'phone';

export interface CooldownCheckResult {
  allowed: boolean;
  reason?: string;
  cooldownUntil?: Date;
  remainingHours?: number;
}

/**
 * Get global cooldown settings (Task 41)
 */
export async function getGlobalCooldownSettings() {
  let settings = await prisma.globalCooldownSettings.findFirst();
  
  if (!settings) {
    // Create default settings if none exist
    settings = await prisma.globalCooldownSettings.create({
      data: {
        passwordCooldownHours: 24,
        twoFactorCooldownHours: 24,
        passkeyCooldownHours: 24,
        oauthCooldownHours: 24,
        phoneCooldownHours: 24,
        maxSimultaneousChanges: 1,
      },
    });
  }
  
  return settings;
}

/**
 * Update global cooldown settings (Task 41: Super Admin only)
 */
export async function updateGlobalCooldownSettings(settings: {
  passwordCooldownHours?: number;
  twoFactorCooldownHours?: number;
  passkeyCooldownHours?: number;
  oauthCooldownHours?: number;
  phoneCooldownHours?: number;
  maxSimultaneousChanges?: number;
}) {
  const current = await getGlobalCooldownSettings();
  
  return await prisma.globalCooldownSettings.update({
    where: { id: current.id },
    data: {
      passwordCooldownHours: settings.passwordCooldownHours ?? current.passwordCooldownHours,
      twoFactorCooldownHours: settings.twoFactorCooldownHours ?? current.twoFactorCooldownHours,
      passkeyCooldownHours: settings.passkeyCooldownHours ?? current.passkeyCooldownHours,
      oauthCooldownHours: settings.oauthCooldownHours ?? current.oauthCooldownHours,
      phoneCooldownHours: settings.phoneCooldownHours ?? current.phoneCooldownHours,
      maxSimultaneousChanges: settings.maxSimultaneousChanges ?? current.maxSimultaneousChanges,
    },
  });
}

/**
 * Get cooldown duration for a specific login method (Task 41)
 */
export async function getCooldownHours(methodType: LoginMethodType): Promise<number> {
  const settings = await getGlobalCooldownSettings();
  
  switch (methodType) {
    case 'password':
      return settings.passwordCooldownHours;
    case '2fa':
      return settings.twoFactorCooldownHours;
    case 'passkey':
      return settings.passkeyCooldownHours;
    case 'oauth':
      return settings.oauthCooldownHours;
    case 'phone':
      return settings.phoneCooldownHours;
    default:
      return 24; // Default 24 hours
  }
}

/**
 * Check if a login method change is allowed (Tasks 39-40)
 */
export async function checkCooldownAllowed(
  userId: string,
  methodType: LoginMethodType,
  methodIdentifier?: string
): Promise<CooldownCheckResult> {
  const now = new Date();
  
  // Check if this specific method is in cooldown (Task 39)
  const cooldown = await prisma.loginMethodCooldown.findUnique({
    where: {
      userId_methodType_methodIdentifier: {
        userId,
        methodType,
        methodIdentifier: methodIdentifier || '',
      },
    },
  });
  
  if (cooldown && cooldown.cooldownUntil > now) {
    const remainingMs = cooldown.cooldownUntil.getTime() - now.getTime();
    const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));
    
    return {
      allowed: false,
      reason: `This login method is in cooldown until ${cooldown.cooldownUntil.toISOString()}`,
      cooldownUntil: cooldown.cooldownUntil,
      remainingHours,
    };
  }
  
  // Check if user has too many recent changes (Task 40: Account takeover protection)
  const settings = await getGlobalCooldownSettings();
  const recentChanges = await prisma.loginMethodCooldown.count({
    where: {
      userId,
      cooldownUntil: {
        gt: now,
      },
    },
  });
  
  if (recentChanges >= settings.maxSimultaneousChanges) {
    // Find the cooldown that expires latest
    const latestCooldown = await prisma.loginMethodCooldown.findFirst({
      where: {
        userId,
        cooldownUntil: {
          gt: now,
        },
      },
      orderBy: {
        cooldownUntil: 'desc',
      },
    });
    
    if (latestCooldown) {
      const remainingMs = latestCooldown.cooldownUntil.getTime() - now.getTime();
      const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));
      
      return {
        allowed: false,
        reason: `You have too many recent login method changes. Please wait ${remainingHours} hours before making another change.`,
        cooldownUntil: latestCooldown.cooldownUntil,
        remainingHours,
      };
    }
  }
  
  return { allowed: true };
}

/**
 * Apply cooldown to a login method change (Tasks 39-40)
 */
export async function applyCooldown(
  userId: string,
  methodType: LoginMethodType,
  methodIdentifier?: string,
  reason?: string
): Promise<void> {
  const cooldownHours = await getCooldownHours(methodType);
  const cooldownUntil = new Date(Date.now() + cooldownHours * 60 * 60 * 1000);
  
  // Upsert cooldown record
  await prisma.loginMethodCooldown.upsert({
    where: {
      userId_methodType_methodIdentifier: {
        userId,
        methodType,
        methodIdentifier: methodIdentifier || '',
      },
    },
    update: {
      cooldownUntil,
      reason,
    },
    create: {
      userId,
      methodType,
      methodIdentifier: methodIdentifier || '',
      cooldownUntil,
      reason,
    },
  });
}

/**
 * Clear cooldown for a specific login method
 */
export async function clearCooldown(
  userId: string,
  methodType: LoginMethodType,
  methodIdentifier?: string
): Promise<void> {
  await prisma.loginMethodCooldown.deleteMany({
    where: {
      userId,
      methodType,
      methodIdentifier: methodIdentifier || '',
    },
  });
}

/**
 * Get all active cooldowns for a user
 */
export async function getActiveCooldowns(userId: string) {
  const now = new Date();
  
  return await prisma.loginMethodCooldown.findMany({
    where: {
      userId,
      cooldownUntil: {
        gt: now,
      },
    },
    orderBy: {
      cooldownUntil: 'asc',
    },
  });
}

/**
 * Check if user can change any login method right now
 */
export async function canChangeLoginMethod(userId: string): Promise<{
  canChange: boolean;
  activeCooldowns: number;
  maxAllowed: number;
}> {
  const settings = await getGlobalCooldownSettings();
  const activeCooldowns = await getActiveCooldowns(userId);
  
  return {
    canChange: activeCooldowns.length < settings.maxSimultaneousChanges,
    activeCooldowns: activeCooldowns.length,
    maxAllowed: settings.maxSimultaneousChanges,
  };
}
