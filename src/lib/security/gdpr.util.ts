/**
 * GDPR Utilities (Task 51)
 * 
 * Privacy policy, cookie consent, data download, data deletion, DPA
 */

import { prisma } from '@/lib/prisma';
import { logSecurityEvent } from '../security.util';

// ─── GDPR Consent Management ─────────────────────────────────────────────────

export interface CookieConsent {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

/**
 * Accept privacy policy
 */
export async function acceptPrivacyPolicy(
  userId: string,
  tenantId: string,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  await prisma.gDPRConsent.upsert({
    where: { userId },
    update: {
      privacyPolicyAccepted: true,
      privacyPolicyAcceptedAt: new Date(),
    },
    create: {
      userId,
      privacyPolicyAccepted: true,
      privacyPolicyAcceptedAt: new Date(),
    },
  });
  
  await logSecurityEvent({
    eventType: 'DATA_EXPORT', // Using existing event type
    userId,
    tenantId,
    ipAddress,
    userAgent,
    details: { action: 'privacy_policy_accepted' },
    severity: 'low',
  });
}

/**
 * Update cookie consent
 */
export async function updateCookieConsent(
  userId: string,
  tenantId: string,
  consent: CookieConsent,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  await prisma.gDPRConsent.upsert({
    where: { userId },
    update: {
      cookieConsent: consent as any,
      cookieConsentAt: new Date(),
    },
    create: {
      userId,
      cookieConsent: consent as any,
      cookieConsentAt: new Date(),
    },
  });
  
  await logSecurityEvent({
    eventType: 'DATA_EXPORT',
    userId,
    tenantId,
    ipAddress,
    userAgent,
    details: { action: 'cookie_consent_updated', consent },
    severity: 'low',
  });
}

/**
 * Accept data processing agreement
 */
export async function acceptDataProcessing(
  userId: string,
  tenantId: string,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  await prisma.gDPRConsent.upsert({
    where: { userId },
    update: {
      dataProcessingAccepted: true,
      dataProcessingAcceptedAt: new Date(),
    },
    create: {
      userId,
      dataProcessingAccepted: true,
      dataProcessingAcceptedAt: new Date(),
    },
  });
}

/**
 * Get user's GDPR consent status
 */
export async function getGDPRConsent(userId: string) {
  return await prisma.gDPRConsent.findUnique({
    where: { userId },
  });
}

/**
 * Check if user has accepted privacy policy
 */
export async function hasAcceptedPrivacyPolicy(userId: string): Promise<boolean> {
  const consent = await prisma.gDPRConsent.findUnique({
    where: { userId },
  });
  
  return consent?.privacyPolicyAccepted || false;
}

/**
 * Check if user has accepted data processing
 */
export async function hasAcceptedDataProcessing(userId: string): Promise<boolean> {
  const consent = await prisma.gDPRConsent.findUnique({
    where: { userId },
  });
  
  return consent?.dataProcessingAccepted || false;
}

// ─── Data Download (Right to Access) ─────────────────────────────────────────

export interface DataExport {
  user: any;
  profile: any;
  sessions: any[];
  oauthConnections: any[];
  apiKeys: any[];
  webhooks: any[];
  auditLogs: any[];
  securityLogs: any[];
  activityLogs: any[];
  exportDate: string;
}

/**
 * Create data download request
 */
export async function createDataDownloadRequest(
  userId: string,
  tenantId: string,
  ipAddress: string,
  userAgent: string
): Promise<{ requestId: string }> {
  const request = await prisma.dataRequest.create({
    data: {
      userId,
      tenantId,
      type: 'DOWNLOAD',
      status: 'PENDING',
    },
  });
  
  await logSecurityEvent({
    eventType: 'DATA_EXPORT',
    userId,
    tenantId,
    ipAddress,
    userAgent,
    details: { requestId: request.id, action: 'data_download_requested' },
    severity: 'medium',
  });
  
  return { requestId: request.id };
}

/**
 * Process data download request
 */
export async function processDataDownloadRequest(requestId: string): Promise<{
  success: boolean;
  downloadUrl?: string;
  error?: string;
}> {
  try {
    const request = await prisma.dataRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          include: {
            sessions: true,
            accounts: true,
            auditLogs: { take: 100 },
          },
        },
      },
    });
    
    if (!request) {
      return { success: false, error: 'Request not found' };
    }
    
    // Update status to processing
    await prisma.dataRequest.update({
      where: { id: requestId },
      data: { status: 'PROCESSING' },
    });
    
    // Collect all user data
    const dataExport: DataExport = {
      user: {
        id: request.user.id,
        email: request.user.email,
        name: request.user.name,
        username: request.user.username,
        phoneNumber: request.user.phoneNumber,
        locale: request.user.locale,
        createdAt: request.user.createdAt,
        lastLogin: request.user.lastLogin,
      },
      profile: {
        image: request.user.image,
        backupEmail: request.user.backupEmail,
        isVerified: request.user.isVerified,
        verificationTier: request.user.verificationTier,
      },
      sessions: request.user.sessions.map(s => ({
        id: s.id,
        expires: s.expires,
        createdAt: s.createdAt,
      })),
      oauthConnections: request.user.accounts.map(a => ({
        provider: a.provider,
        providerAccountId: a.providerAccountId,
        createdAt: a.createdAt,
      })),
      apiKeys: [], // Will be populated from tenant context
      webhooks: [], // Will be populated from tenant context
      auditLogs: request.user.auditLogs.map(l => ({
        action: l.action,
        description: l.description,
        ipAddress: l.ipAddress,
        createdAt: l.createdAt,
      })),
      securityLogs: [], // Will be populated from tenant context
      activityLogs: [], // Will be populated from tenant context
      exportDate: new Date().toISOString(),
    };
    
    // Generate download URL (in production, this would be a signed S3 URL)
    const downloadUrl = `/api/gdpr/download/${requestId}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    await prisma.dataRequest.update({
      where: { id: requestId },
      data: {
        status: 'COMPLETED',
        downloadUrl,
        expiresAt,
        processedAt: new Date(),
      },
    });
    
    await logSecurityEvent({
      eventType: 'DATA_EXPORT',
      userId: request.userId,
      tenantId: request.tenantId,
      ipAddress: '',
      userAgent: '',
      details: { requestId, action: 'data_download_completed' },
      severity: 'medium',
    });
    
    return { success: true, downloadUrl };
  } catch (error: any) {
    await prisma.dataRequest.update({
      where: { id: requestId },
      data: { status: 'FAILED' },
    });
    
    return { success: false, error: error.message };
  }
}

/**
 * Get data download request status
 */
export async function getDataRequestStatus(requestId: string) {
  return await prisma.dataRequest.findUnique({
    where: { id: requestId },
  });
}

// ─── Data Deletion (Right to be Forgotten) ───────────────────────────────────

/**
 * Create data deletion request
 */
export async function createDataDeletionRequest(
  userId: string,
  tenantId: string,
  ipAddress: string,
  userAgent: string
): Promise<{ requestId: string }> {
  const request = await prisma.dataRequest.create({
    data: {
      userId,
      tenantId,
      type: 'DELETE',
      status: 'PENDING',
    },
  });
  
  await logSecurityEvent({
    eventType: 'DATA_DELETION',
    userId,
    tenantId,
    ipAddress,
    userAgent,
    details: { requestId: request.id, action: 'data_deletion_requested' },
    severity: 'high',
  });
  
  return { requestId: request.id };
}

/**
 * Process data deletion request
 * WARNING: This is irreversible!
 */
export async function processDataDeletionRequest(requestId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const request = await prisma.dataRequest.findUnique({
      where: { id: requestId },
    });
    
    if (!request) {
      return { success: false, error: 'Request not found' };
    }
    
    // Update status to processing
    await prisma.dataRequest.update({
      where: { id: requestId },
      data: { status: 'PROCESSING' },
    });
    
    // Delete user data in transaction
    await prisma.$transaction(async (tx) => {
      // Delete GDPR consent
      await tx.gDPRConsent.deleteMany({
        where: { userId: request.userId },
      });
      
      // Delete data requests
      await tx.dataRequest.deleteMany({
        where: { userId: request.userId },
      });
      
      // Delete audit logs
      await tx.auditLog.deleteMany({
        where: { userId: request.userId },
      });
      
      // Delete sessions
      await tx.session.deleteMany({
        where: { userId: request.userId },
      });
      
      // Delete OAuth accounts
      await tx.account.deleteMany({
        where: { userId: request.userId },
      });
      
      // Delete passkeys
      await tx.passkey.deleteMany({
        where: { userId: request.userId },
      });
      
      // Delete 2FA
      await tx.twoFactorAuth.deleteMany({
        where: { userId: request.userId },
      });
      
      // Delete KYC records
      await tx.kYCRecord.deleteMany({
        where: { userId: request.userId },
      });
      
      // Delete trusted devices
      await tx.trustedDevice.deleteMany({
        where: { userId: request.userId },
      });
      
      // Delete login alerts
      await tx.loginAlert.deleteMany({
        where: { userId: request.userId },
      });
      
      // Delete security checkups
      await tx.securityCheckup.deleteMany({
        where: { userId: request.userId },
      });
      
      // Delete login method cooldowns
      await tx.loginMethodCooldown.deleteMany({
        where: { userId: request.userId },
      });
      
      // Finally, delete the user
      await tx.user.delete({
        where: { id: request.userId },
      });
    });
    
    await prisma.dataRequest.update({
      where: { id: requestId },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
      },
    });
    
    await logSecurityEvent({
      eventType: 'DATA_DELETION',
      userId: request.userId,
      tenantId: request.tenantId,
      ipAddress: '',
      userAgent: '',
      details: { requestId, action: 'data_deletion_completed' },
      severity: 'critical',
    });
    
    return { success: true };
  } catch (error: any) {
    await prisma.dataRequest.update({
      where: { id: requestId },
      data: { status: 'FAILED' },
    });
    
    return { success: false, error: error.message };
  }
}

/**
 * Get all data requests for user
 */
export async function getUserDataRequests(userId: string) {
  return await prisma.dataRequest.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get all data requests for tenant
 */
export async function getTenantDataRequests(tenantId: string) {
  return await prisma.dataRequest.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });
}
