// Account Linking Actions (Task 10)
// Server actions for linking/unlinking social accounts and backup email

'use server';

import { auth } from '@/lib/auth';
import { BackupEmailSchema } from '@/lib/utils/validations';
import { 
  linkSocialAccount, 
  unlinkSocialAccount, 
  getLinkedAccounts,
  setBackupEmail 
} from '@/lib/utils/accountLinking';
import { logAction } from '@/lib/utils/audit';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Link a social account to current user (Task 10)
 */
export async function linkAccountAction(
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
) {
  try {
    // Check if user is authenticated
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be logged in' };
    }

    const result = await linkSocialAccount(
      session.user.id,
      provider,
      providerAccountId,
      providerData
    );

    if (!result.success) {
      return { error: result.error };
    }

    // Log account linking
    await logAction({
      userId: session.user.id,
      action: 'ACCOUNT_LINKED',
      description: `Linked ${provider} account`,
      metadata: { provider, providerAccountId },
    });

    revalidatePath('/', 'layout');
    
    return { 
      success: true, 
      message: `${provider} account linked successfully!` 
    };
  } catch (error) {
    console.error('Link account error:', error);
    return { error: 'Something went wrong while linking account' };
  }
}

/**
 * Unlink a social account from current user (Task 10)
 */
export async function unlinkAccountAction(
  provider: string,
  providerAccountId: string
) {
  try {
    // Check if user is authenticated
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be logged in' };
    }

    const result = await unlinkSocialAccount(
      session.user.id,
      provider,
      providerAccountId
    );

    if (!result.success) {
      return { error: result.error };
    }

    // Log account unlinking
    await logAction({
      userId: session.user.id,
      action: 'ACCOUNT_UNLINKED',
      description: `Unlinked ${provider} account`,
      metadata: { provider, providerAccountId },
    });

    revalidatePath('/', 'layout');
    
    return { 
      success: true, 
      message: `${provider} account unlinked successfully!` 
    };
  } catch (error) {
    console.error('Unlink account error:', error);
    return { error: 'Something went wrong while unlinking account' };
  }
}

/**
 * Get all linked accounts for current user (Task 10)
 */
export async function getLinkedAccountsAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be logged in', accounts: [] };
    }

    const accounts = await getLinkedAccounts(session.user.id);
    return { success: true, accounts };
  } catch (error) {
    console.error('Get linked accounts error:', error);
    return { error: 'Something went wrong', accounts: [] };
  }
}

/**
 * Set backup email (Task 10)
 */
export async function setBackupEmailAction(
  prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  try {
    // Check if user is authenticated
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be logged in' };
    }

    // Validate backup email
    const validated = BackupEmailSchema.safeParse({
      backupEmail: formData.get('backupEmail'),
    });

    if (!validated.success) {
      return { error: validated.error.errors[0].message };
    }

    const { backupEmail } = validated.data;

    const result = await setBackupEmail(session.user.id, backupEmail);

    if (!result.success) {
      return { error: result.error };
    }

    // Log backup email update
    await logAction({
      userId: session.user.id,
      action: 'BACKUP_EMAIL_UPDATED',
      description: `Backup email updated to: ${backupEmail}`,
    });

    revalidatePath('/', 'layout');
    
    return { 
      success: true, 
      message: 'Backup email updated successfully!' 
    };
  } catch (error) {
    console.error('Set backup email error:', error);
    return { error: 'Something went wrong while setting backup email' };
  }
}

/**
 * Remove backup email (Task 10)
 */
export async function removeBackupEmailAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be logged in' };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { backupEmail: null },
    });

    await logAction({
      userId: session.user.id,
      action: 'BACKUP_EMAIL_UPDATED',
      description: 'Backup email removed',
    });

    revalidatePath('/', 'layout');
    
    return { 
      success: true, 
      message: 'Backup email removed successfully!' 
    };
  } catch (error) {
    console.error('Remove backup email error:', error);
    return { error: 'Something went wrong' };
  }
}
