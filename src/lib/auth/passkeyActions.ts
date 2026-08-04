// Passkey Server Actions (Task 13)
'use server';

import { auth } from '@/lib/auth';
import { getUserPasskeys, deletePasskey } from '@/lib/utils/passkeys';
import { logAction } from '@/lib/utils/audit';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Get all passkeys for current user
 */
export async function getPasskeysAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized', passkeys: [] };
    }

    const passkeys = await getUserPasskeys(session.user.id);
    return { success: true, passkeys };
  } catch (error) {
    console.error('Get passkeys error:', error);
    return { error: 'Failed to fetch passkeys', passkeys: [] };
  }
}

/**
 * Delete a passkey
 */
export async function deletePasskeyAction(passkeyId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    // Check if this is the last auth method
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        accounts: { select: { provider: true } },
        passkeys: true,
      },
    });

    if (user && !user.password && user.accounts.length === 0 && user.passkeys.length === 1) {
      return {
        error: 'Cannot delete your only authentication method. Add a password or link a social account first.',
      };
    }

    await deletePasskey(passkeyId, session.user.id);

    // Log deletion
    await logAction({
      userId: session.user.id,
      action: 'ACCOUNT_UNLINKED',
      description: 'Passkey removed',
      metadata: { type: 'passkey', passkeyId },
    });

    revalidatePath('/', 'layout');

    return { success: true, message: 'Passkey deleted successfully!' };
  } catch (error) {
    console.error('Delete passkey error:', error);
    return { error: 'Failed to delete passkey' };
  }
}

/**
 * Rename a passkey
 */
export async function renamePasskeyAction(passkeyId: string, name: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    await prisma.passkey.update({
      where: { id: passkeyId },
      data: { name },
    });

    revalidatePath('/', 'layout');

    return { success: true, message: 'Passkey renamed successfully!' };
  } catch (error) {
    console.error('Rename passkey error:', error);
    return { error: 'Failed to rename passkey' };
  }
}
