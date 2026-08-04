/**
 * Cooldown Wrapper for Login Method Changes (Tasks 39-40)
 * 
 * This wrapper ensures that all login method changes go through cooldown checks
 * before being executed.
 */

import { checkCooldownAllowed, applyCooldown, type LoginMethodType } from './cooldown.util';

/**
 * Wrapper function to apply cooldown check before executing an action
 * 
 * @param userId - User ID
 * @param methodType - Type of login method being changed
 * @param methodIdentifier - Optional identifier (e.g., OAuth provider name)
 * @param action - The action to execute if cooldown check passes
 * @param reason - Optional reason for cooldown
 */
export async function withCooldownCheck<T>(
  userId: string,
  methodType: LoginMethodType,
  action: () => Promise<T>,
  methodIdentifier?: string,
  reason?: string
): Promise<{ success: true; data: T } | { success: false; error: string; cooldownUntil?: Date; remainingHours?: number }> {
  // Check if change is allowed
  const checkResult = await checkCooldownAllowed(userId, methodType, methodIdentifier);
  
  if (!checkResult.allowed) {
    return {
      success: false,
      error: checkResult.reason || 'Login method change is in cooldown period',
      cooldownUntil: checkResult.cooldownUntil,
      remainingHours: checkResult.remainingHours,
    };
  }
  
  // Execute the action
  try {
    const result = await action();
    
    // Apply cooldown after successful change
    await applyCooldown(userId, methodType, methodIdentifier, reason);
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Action failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Action failed',
    };
  }
}

/**
 * Format remaining cooldown time for display
 */
export function formatCooldownTime(remainingHours: number): string {
  if (remainingHours <= 0) {
    return 'No cooldown active';
  }
  
  if (remainingHours < 1) {
    const remainingMinutes = Math.ceil(remainingHours * 60);
    return `${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
  }
  
  if (remainingHours < 24) {
    return `${Math.ceil(remainingHours)} hour${Math.ceil(remainingHours) !== 1 ? 's' : ''}`;
  }
  
  const days = Math.floor(remainingHours / 24);
  const hours = Math.ceil(remainingHours % 24);
  
  if (hours === 0) {
    return `${days} day${days !== 1 ? 's' : ''}`;
  }
  
  return `${days} day${days !== 1 ? 's' : ''} and ${hours} hour${hours !== 1 ? 's' : ''}`;
}

/**
 * Get human-readable method name
 */
export function getMethodName(methodType: LoginMethodType): string {
  const names: Record<LoginMethodType, string> = {
    password: 'Password',
    '2fa': 'Two-Factor Authentication',
    passkey: 'Passkey',
    oauth: 'Social Login',
    phone: 'Phone Number',
  };
  
  return names[methodType] || methodType;
}
