// Account Linking Utility (Task 10)
// Links social accounts with email accounts, supports multiple social links

import { prisma } from '@/lib/prisma';

/**
 * Link a social account to a user
 */
export async function linkSocialAccount(
  userId: string,
  provider: string,
  providerAccountId: string,
  providerData?: {
    email?: string;
    name?: string;
    image?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  // Check if this social account is already linked to another user
  const existingAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider,
        providerAccountId,
      },
    },
  });

  if (existingAccount) {
    if (existingAccount.userId === userId) {
      return { success: false, error: 'This social account is already linked to your profile' };
    }
    return { success: false, error: 'This social account is already linked to another user' };
  }

  // Create the account link
  await prisma.account.create({
    data: {
      userId,
      type: 'oauth',
      provider,
      providerAccountId,
      access_token: providerData?.accessToken,
      refresh_token: providerData?.refreshToken,
      expires_at: providerData?.expiresAt,
    },
  });

  return { success: true };
}

/**
 * Unlink a social account from a user
 */
export async function unlinkSocialAccount(
  userId: string,
  provider: string,
  providerAccountId: string
): Promise<{ success: boolean; error?: string }> {
  const account = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider,
        providerAccountId,
      },
    },
  });

  if (!account) {
    return { success: false, error: 'Social account not found' };
  }

  if (account.userId !== userId) {
    return { success: false, error: 'You do not have permission to unlink this account' };
  }

  // Check if this is the last authentication method
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { accounts: true },
  });

  if (user && !user.password && user.accounts.length === 1) {
    return { 
      success: false, 
      error: 'Cannot unlink the last authentication method. Add a password or link another account first.' 
    };
  }

  await prisma.account.delete({
    where: { id: account.id },
  });

  return { success: true };
}

/**
 * Get all linked accounts for a user
 */
export async function getLinkedAccounts(userId: string) {
  const accounts = await prisma.account.findMany({
    where: { userId },
    select: {
      provider: true,
      providerAccountId: true,
    },
  });

  return accounts.map((account) => ({
    provider: account.provider,
    providerAccountId: account.providerAccountId,
    isLinked: true,
  }));
}

/**
 * Check if user has a specific social account linked
 */
export async function hasLinkedAccount(
  userId: string,
  provider: string
): Promise<boolean> {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider,
    },
  });

  return account !== null;
}

/**
 * Set backup email (Task 10)
 */
export async function setBackupEmail(
  userId: string,
  backupEmail: string
): Promise<{ success: boolean; error?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  // Check if backup email is the same as primary email
  if (backupEmail === user.email) {
    return { success: false, error: 'Backup email cannot be the same as primary email' };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { backupEmail },
  });

  return { success: true };
}

/**
 * Link social account to email account (when user logs in with social but email exists)
 */
export async function linkSocialToEmail(
  email: string,
  provider: string,
  providerAccountId: string,
  providerData?: {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  }
): Promise<{ success: boolean; userId?: string; error?: string }> {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return { success: false, error: 'No account found with this email' };
  }

  // Link the social account
  const result = await linkSocialAccount(
    user.id,
    provider,
    providerAccountId,
    providerData
  );

  if (!result.success) {
    return result;
  }

  return { success: true, userId: user.id };
}
