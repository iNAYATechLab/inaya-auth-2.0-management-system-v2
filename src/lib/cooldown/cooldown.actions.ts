/**
 * Cooldown Server Actions (Tasks 39-41)
 * 
 * Task 39: Apply cooldown on login method changes
 * Task 40: Check cooldown before allowing changes
 * Task 41: Super Admin configurable settings
 */

'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import {
  getGlobalCooldownSettings,
  updateGlobalCooldownSettings,
  checkCooldownAllowed,
  getActiveCooldowns,
  canChangeLoginMethod,
  type LoginMethodType,
} from './cooldown.util';

/**
 * Get global cooldown settings (Task 41: Super Admin only)
 */
export async function getCooldownSettingsAction() {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Unauthorized' };
  }

  // Check if user is Super Admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== 'SUPERADMIN') {
    return { error: 'Only Super Admin can view cooldown settings' };
  }

  const settings = await getGlobalCooldownSettings();

  return {
    success: true,
    data: settings,
  };
}

/**
 * Update global cooldown settings (Task 41: Super Admin only)
 */
export async function updateCooldownSettingsAction(settings: {
  passwordCooldownHours?: number;
  twoFactorCooldownHours?: number;
  passkeyCooldownHours?: number;
  oauthCooldownHours?: number;
  phoneCooldownHours?: number;
  maxSimultaneousChanges?: number;
}) {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Unauthorized' };
  }

  // Check if user is Super Admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== 'SUPERADMIN') {
    return { error: 'Only Super Admin can update cooldown settings' };
  }

  try {
    const updated = await updateGlobalCooldownSettings(settings);
    revalidatePath('/admin/cooldown-settings');
    return { success: true, data: updated };
  } catch (error) {
    console.error('Failed to update cooldown settings:', error);
    return { error: 'Failed to update cooldown settings' };
  }
}

/**
 * Check if a login method change is allowed (Task 40)
 */
export async function checkCooldownAction(
  methodType: LoginMethodType,
  methodIdentifier?: string
) {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Unauthorized' };
  }

  const result = await checkCooldownAllowed(session.user.id, methodType, methodIdentifier);

  return {
    success: true,
    data: result,
  };
}

/**
 * Get all active cooldowns for current user
 */
export async function getMyCooldownsAction() {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Unauthorized' };
  }

  const cooldowns = await getActiveCooldowns(session.user.id);

  return {
    success: true,
    data: cooldowns,
  };
}

/**
 * Check if user can change any login method right now
 */
export async function canChangeLoginMethodAction() {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Unauthorized' };
  }

  const result = await canChangeLoginMethod(session.user.id);

  return {
    success: true,
    data: result,
  };
}
