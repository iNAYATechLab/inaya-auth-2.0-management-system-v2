/**
 * Super Admin Server Actions (Tasks 47-49)
 * 
 * Admin dashboard actions for managing tenants, subscriptions, analytics
 */

'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getAdminDashboardStats,
  getRevenueStats,
  getTenantStats,
  getUserStats,
} from './analytics.util';
import {
  exportTenantData,
  exportSystemData,
  createSystemBackup,
  listBackups,
  restoreFromBackup,
  deleteBackup,
  type ExportOptions,
  type BackupOptions,
} from './backup.util';
import {
  getOTPTenantConfig,
  updateOTPTenantConfig,
  getGlobalOTPConfig,
} from './otpConfig.util';
import { revalidatePath } from 'next/cache';

/**
 * Check if user is Super Admin
 */
async function checkSuperAdmin(): Promise<{ isSuperAdmin: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { isSuperAdmin: false, error: 'Unauthorized' };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== 'SUPERADMIN') {
    return { isSuperAdmin: false, error: 'Only Super Admin can access this' };
  }

  return { isSuperAdmin: true };
}

// ─── Dashboard Stats ─────────────────────────────────────────────────────────

/**
 * Get admin dashboard statistics
 */
export async function getAdminDashboardStatsAction() {
  const { isSuperAdmin, error } = await checkSuperAdmin();
  if (!isSuperAdmin) {
    return { success: false, error };
  }

  try {
    const stats = await getAdminDashboardStats();
    return { success: true, stats };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get revenue statistics
 */
export async function getRevenueStatsAction() {
  const { isSuperAdmin, error } = await checkSuperAdmin();
  if (!isSuperAdmin) {
    return { success: false, error };
  }

  try {
    const stats = await getRevenueStats();
    return { success: true, stats };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get tenant statistics
 */
export async function getTenantStatsAction() {
  const { isSuperAdmin, error } = await checkSuperAdmin();
  if (!isSuperAdmin) {
    return { success: false, error };
  }

  try {
    const stats = await getTenantStats();
    return { success: true, stats };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get user statistics
 */
export async function getUserStatsAction() {
  const { isSuperAdmin, error } = await checkSuperAdmin();
  if (!isSuperAdmin) {
    return { success: false, error };
  }

  try {
    const stats = await getUserStats();
    return { success: true, stats };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ─── Tenant Management ───────────────────────────────────────────────────────

/**
 * Get all tenants (Super Admin)
 */
export async function getAllTenantsAdminAction(page: number = 1, limit: number = 20) {
  const { isSuperAdmin, error } = await checkSuperAdmin();
  if (!isSuperAdmin) {
    return { success: false, error };
  }

  try {
    const skip = (page - 1) * limit;

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              users: true,
              oauthClients: true,
              apiKeys: true,
              webhooks: true,
            },
          },
          subscription: {
            include: {
              plan: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.tenant.count(),
    ]);

    return {
      success: true,
      tenants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Update tenant status
 */
export async function updateTenantStatusAction(
  tenantId: string,
  isActive: boolean
) {
  const { isSuperAdmin, error } = await checkSuperAdmin();
  if (!isSuperAdmin) {
    return { success: false, error };
  }

  try {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { isActive },
    });

    revalidatePath('/admin');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Delete tenant (Super Admin)
 */
export async function deleteTenantAdminAction(tenantId: string) {
  const { isSuperAdmin, error } = await checkSuperAdmin();
  if (!isSuperAdmin) {
    return { success: false, error };
  }

  try {
    await prisma.tenant.delete({
      where: { id: tenantId },
    });

    revalidatePath('/admin');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ─── Subscription Management ─────────────────────────────────────────────────

/**
 * Get all subscriptions (Super Admin)
 */
export async function getAllSubscriptionsAdminAction(page: number = 1, limit: number = 20) {
  const { isSuperAdmin, error } = await checkSuperAdmin();
  if (!isSuperAdmin) {
    return { success: false, error };
  }

  try {
    const skip = (page - 1) * limit;

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        skip,
        take: limit,
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          plan: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.subscription.count(),
    ]);

    return {
      success: true,
      subscriptions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Force cancel subscription (Super Admin)
 */
export async function forceCancelSubscriptionAction(
  subscriptionId: string,
  reason: string
) {
  const { isSuperAdmin, error } = await checkSuperAdmin();
  if (!isSuperAdmin) {
    return { success: false, error };
  }

  try {
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'CANCELED',
        canceledAt: new Date(),
      },
    });

    revalidatePath('/admin');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ─── Data Export & Backup ────────────────────────────────────────────────────

/**
 * Export tenant data (Super Admin)
 */
export async function exportTenantDataAction(
  tenantId: string,
  options: ExportOptions
) {
  const { isSuperAdmin, error } = await checkSuperAdmin();
  if (!isSuperAdmin) {
    return { success: false, error };
  }

  try {
    const result = await exportTenantData(tenantId, options);
    return result;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Export system data (Super Admin)
 */
export async function exportSystemDataAction() {
  const { isSuperAdmin, error } = await checkSuperAdmin();
  if (!isSuperAdmin) {
    return { success: false, error };
  }

  try {
    const result = await exportSystemData();
    return result;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Create system backup (Super Admin)
 */
export async function createSystemBackupAction(options: BackupOptions) {
  const { isSuperAdmin, error } = await checkSuperAdmin();
  if (!isSuperAdmin) {
    return { success: false, error };
  }

  try {
    const result = await createSystemBackup(options);
    return result;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * List backups (Super Admin)
 */
export async function listBackupsAction() {
  const { isSuperAdmin, error } = await checkSuperAdmin();
  if (!isSuperAdmin) {
    return { success: false, error };
  }

  try {
    const result = await listBackups();
    return result;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Restore from backup (Super Admin)
 */
export async function restoreFromBackupAction(backupFilename: string) {
  const { isSuperAdmin, error } = await checkSuperAdmin();
  if (!isSuperAdmin) {
    return { success: false, error };
  }

  try {
    const result = await restoreFromBackup(backupFilename);
    return result;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Delete backup (Super Admin)
 */
export async function deleteBackupAction(backupFilename: string) {
  const { isSuperAdmin, error } = await checkSuperAdmin();
  if (!isSuperAdmin) {
    return { success: false, error };
  }

  try {
    const result = await deleteBackup(backupFilename);
    return result;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ─── OTP Configuration ───────────────────────────────────────────────────────

/**
 * Get OTP configuration for tenant (Super Admin)
 */
export async function getOTPTenantConfigAction(tenantId: string) {
  const { isSuperAdmin, error } = await checkSuperAdmin();
  if (!isSuperAdmin) {
    return { success: false, error };
  }

  try {
    const config = await getOTPTenantConfig(tenantId);
    return { success: true, config };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Update OTP configuration for tenant (Super Admin)
 */
export async function updateOTPTenantConfigAction(
  tenantId: string,
  config: any
) {
  const { isSuperAdmin, error } = await checkSuperAdmin();
  if (!isSuperAdmin) {
    return { success: false, error };
  }

  try {
    const result = await updateOTPTenantConfig(tenantId, config);
    revalidatePath('/admin');
    return result;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get global OTP configuration (Super Admin)
 */
export async function getGlobalOTPConfigAction() {
  const { isSuperAdmin, error } = await checkSuperAdmin();
  if (!isSuperAdmin) {
    return { success: false, error };
  }

  try {
    const config = await getGlobalOTPConfig();
    return { success: true, config };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
