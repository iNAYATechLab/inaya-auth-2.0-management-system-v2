/**
 * Data Export & Backup Utilities (Task 49)
 * 
 * Export tenant data, system backup/restore
 */

import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export interface ExportOptions {
  tenantId?: string;
  includeUsers: boolean;
  includeOAuthClients: boolean;
  includeApiKeys: boolean;
  includeWebhooks: boolean;
  includeSubscriptions: boolean;
  includeAuditLogs: boolean;
}

export interface BackupOptions {
  compress: boolean;
  encrypt: boolean;
  includeMedia: boolean;
}

/**
 * Export tenant data as JSON
 */
export async function exportTenantData(
  tenantId: string,
  options: ExportOptions
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
  filename?: string;
}> {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        users: options.includeUsers ? {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            role: true,
            tenantRole: true,
            isActive: true,
            createdAt: true,
            lastLogin: true,
          },
        } : undefined,
        oauthClients: options.includeOAuthClients ? true : undefined,
        apiKeys: options.includeApiKeys ? {
          select: {
            id: true,
            name: true,
            keyPrefix: true,
            permissions: true,
            expiresAt: true,
            isActive: true,
            createdAt: true,
          },
        } : undefined,
        webhooks: options.includeWebhooks ? {
          select: {
            id: true,
            url: true,
            events: true,
            isActive: true,
            createdAt: true,
          },
        } : undefined,
        subscription: options.includeSubscriptions ? {
          include: {
            plan: true,
          },
        } : undefined,
      },
    });

    if (!tenant) {
      return { success: false, error: 'Tenant not found' };
    }

    // Get audit logs if requested
    let auditLogs = [];
    if (options.includeAuditLogs) {
      auditLogs = await prisma.auditLog.findMany({
        where: {
          user: {
            tenantId: tenantId,
          },
        },
        take: 1000,
        orderBy: { createdAt: 'desc' },
      });
    }

    const exportData = {
      exportMetadata: {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        tenantId: tenant.id,
        tenantName: tenant.name,
        options,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        domain: tenant.domain,
        plan: tenant.plan,
        isActive: tenant.isActive,
        createdAt: tenant.createdAt,
      },
      users: options.includeUsers ? tenant.users : undefined,
      oauthClients: options.includeOAuthClients ? tenant.oauthClients : undefined,
      apiKeys: options.includeApiKeys ? tenant.apiKeys : undefined,
      webhooks: options.includeWebhooks ? tenant.webhooks : undefined,
      subscription: options.includeSubscriptions ? tenant.subscription : undefined,
      auditLogs: options.includeAuditLogs ? auditLogs : undefined,
    };

    const filename = `tenant-${tenant.slug}-export-${Date.now()}.json`;

    return {
      success: true,
      data: exportData,
      filename,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Export all system data (Super Admin only)
 */
export async function exportSystemData(): Promise<{
  success: boolean;
  data?: any;
  error?: string;
  filename?: string;
}> {
  try {
    const tenants = await prisma.tenant.findMany({
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
    });

    const pricingPlans = await prisma.pricingPlan.findMany();

    const exportData = {
      exportMetadata: {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        type: 'system',
      },
      tenants: tenants.map(t => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        domain: t.domain,
        plan: t.plan,
        isActive: t.isActive,
        createdAt: t.createdAt,
        stats: t._count,
        subscription: t.subscription,
      })),
      pricingPlans,
      summary: {
        totalTenants: tenants.length,
        activeTenants: tenants.filter(t => t.isActive).length,
        totalUsers: tenants.reduce((sum, t) => sum + t._count.users, 0),
        totalOAuthClients: tenants.reduce((sum, t) => sum + t._count.oauthClients, 0),
        totalApiKeys: tenants.reduce((sum, t) => sum + t._count.apiKeys, 0),
        totalWebhooks: tenants.reduce((sum, t) => sum + t._count.webhooks, 0),
      },
    };

    const filename = `system-export-${Date.now()}.json`;

    return {
      success: true,
      data: exportData,
      filename,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Create system backup
 */
export async function createSystemBackup(
  options: BackupOptions
): Promise<{
  success: boolean;
  backupPath?: string;
  error?: string;
}> {
  try {
    const backupDir = path.join(process.cwd(), 'backups');
    await fs.mkdir(backupDir, { recursive: true });

    const timestamp = Date.now();
    const backupFilename = `backup-${timestamp}.json`;
    const backupPath = path.join(backupDir, backupFilename);

    // Export all data
    const systemData = await exportSystemData();
    if (!systemData.success || !systemData.data) {
      return { success: false, error: 'Failed to export system data' };
    }

    let backupContent = JSON.stringify(systemData.data, null, 2);

    // Encrypt if requested
    if (options.encrypt) {
      const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY || process.env.AUTH_SECRET;
      if (!encryptionKey) {
        return { success: false, error: 'Backup encryption key not configured' };
      }

      const iv = crypto.randomBytes(16);
      const key = crypto.createHash('sha256').update(encryptionKey).digest();
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      
      let encrypted = cipher.update(backupContent, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      backupContent = JSON.stringify({
        encrypted: true,
        iv: iv.toString('hex'),
        data: encrypted,
      });
    }

    await fs.writeFile(backupPath, backupContent);

    return {
      success: true,
      backupPath,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * List available backups
 */
export async function listBackups(): Promise<{
  success: boolean;
  backups?: any[];
  error?: string;
}> {
  try {
    const backupDir = path.join(process.cwd(), 'backups');
    
    try {
      await fs.access(backupDir);
    } catch {
      return { success: true, backups: [] };
    }

    const files = await fs.readdir(backupDir);
    const backups = await Promise.all(
      files
        .filter(f => f.endsWith('.json'))
        .map(async (filename) => {
          const stats = await fs.stat(path.join(backupDir, filename));
          return {
            filename,
            size: stats.size,
            createdAt: stats.birthtime,
          };
        })
    );

    return {
      success: true,
      backups: backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Restore from backup
 */
export async function restoreFromBackup(
  backupFilename: string
): Promise<{
  success: boolean;
  error?: string;
  restoredData?: any;
}> {
  try {
    const backupDir = path.join(process.cwd(), 'backups');
    const backupPath = path.join(backupDir, backupFilename);

    const backupContent = await fs.readFile(backupPath, 'utf-8');
    let backupData;

    try {
      const parsed = JSON.parse(backupContent);
      
      // Check if encrypted
      if (parsed.encrypted) {
        const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY || process.env.AUTH_SECRET;
        if (!encryptionKey) {
          return { success: false, error: 'Backup encryption key not configured' };
        }

        const iv = Buffer.from(parsed.iv, 'hex');
        const key = crypto.createHash('sha256').update(encryptionKey).digest();
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        
        let decrypted = decipher.update(parsed.data, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        backupData = JSON.parse(decrypted);
      } else {
        backupData = parsed;
      }
    } catch (error) {
      return { success: false, error: 'Invalid backup file' };
    }

    return {
      success: true,
      restoredData: backupData,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Delete backup
 */
export async function deleteBackup(
  backupFilename: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const backupDir = path.join(process.cwd(), 'backups');
    const backupPath = path.join(backupDir, backupFilename);

    await fs.unlink(backupPath);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
