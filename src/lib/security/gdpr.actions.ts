/**
 * GDPR Server Actions (Task 51)
 * 
 * Privacy policy acceptance, cookie consent, data download, data deletion
 */

'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  acceptPrivacyPolicy,
  updateCookieConsent,
  acceptDataProcessing,
  getGDPRConsent,
  hasAcceptedPrivacyPolicy,
  createDataDownloadRequest,
  processDataDownloadRequest,
  getDataRequestStatus,
  createDataDeletionRequest,
  processDataDeletionRequest,
  getUserDataRequests,
  getTenantDataRequests,
  type CookieConsent,
} from './gdpr.util';

/**
 * Accept privacy policy
 */
export async function acceptPrivacyPolicyAction() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tenantId: true },
  });
  
  if (!user?.tenantId) {
    return { success: false, error: 'User not found' };
  }
  
  try {
    const headers = await import('next/headers').then(m => m.headers());
    const ipAddress = headers.get('x-forwarded-for') || 'unknown';
    const userAgent = headers.get('user-agent') || 'unknown';
    
    await acceptPrivacyPolicy(session.user.id, user.tenantId, ipAddress, userAgent);
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Update cookie consent
 */
export async function updateCookieConsentAction(consent: CookieConsent) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tenantId: true },
  });
  
  if (!user?.tenantId) {
    return { success: false, error: 'User not found' };
  }
  
  try {
    const headers = await import('next/headers').then(m => m.headers());
    const ipAddress = headers.get('x-forwarded-for') || 'unknown';
    const userAgent = headers.get('user-agent') || 'unknown';
    
    await updateCookieConsent(session.user.id, user.tenantId, consent, ipAddress, userAgent);
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Accept data processing agreement
 */
export async function acceptDataProcessingAction() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tenantId: true },
  });
  
  if (!user?.tenantId) {
    return { success: false, error: 'User not found' };
  }
  
  try {
    const headers = await import('next/headers').then(m => m.headers());
    const ipAddress = headers.get('x-forwarded-for') || 'unknown';
    const userAgent = headers.get('user-agent') || 'unknown';
    
    await acceptDataProcessing(session.user.id, user.tenantId, ipAddress, userAgent);
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get GDPR consent status
 */
export async function getGDPRConsentAction() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }
  
  try {
    const consent = await getGDPRConsent(session.user.id);
    return { success: true, consent };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Check if privacy policy is accepted
 */
export async function hasAcceptedPrivacyPolicyAction() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, accepted: false };
  }
  
  try {
    const accepted = await hasAcceptedPrivacyPolicy(session.user.id);
    return { success: true, accepted };
  } catch (error: any) {
    return { success: false, accepted: false, error: error.message };
  }
}

/**
 * Request data download
 */
export async function requestDataDownloadAction() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tenantId: true },
  });
  
  if (!user?.tenantId) {
    return { success: false, error: 'User not found' };
  }
  
  try {
    const headers = await import('next/headers').then(m => m.headers());
    const ipAddress = headers.get('x-forwarded-for') || 'unknown';
    const userAgent = headers.get('user-agent') || 'unknown';
    
    const { requestId } = await createDataDownloadRequest(
      session.user.id,
      user.tenantId,
      ipAddress,
      userAgent
    );
    
    // Process the request immediately
    await processDataDownloadRequest(requestId);
    
    return { success: true, requestId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get data request status
 */
export async function getDataRequestStatusAction(requestId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }
  
  try {
    const request = await getDataRequestStatus(requestId);
    
    if (!request || request.userId !== session.user.id) {
      return { success: false, error: 'Request not found' };
    }
    
    return { success: true, request };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Request data deletion (Right to be Forgotten)
 * WARNING: This is irreversible!
 */
export async function requestDataDeletionAction() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tenantId: true },
  });
  
  if (!user?.tenantId) {
    return { success: false, error: 'User not found' };
  }
  
  try {
    const headers = await import('next/headers').then(m => m.headers());
    const ipAddress = headers.get('x-forwarded-for') || 'unknown';
    const userAgent = headers.get('user-agent') || 'unknown';
    
    const { requestId } = await createDataDeletionRequest(
      session.user.id,
      user.tenantId,
      ipAddress,
      userAgent
    );
    
    // Process the deletion request
    const result = await processDataDeletionRequest(requestId);
    
    if (!result.success) {
      return { success: false, error: result.error };
    }
    
    return { success: true, requestId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get user's data requests
 */
export async function getUserDataRequestsAction() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }
  
  try {
    const requests = await getUserDataRequests(session.user.id);
    return { success: true, requests };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get tenant's data requests (Super Admin)
 */
export async function getTenantDataRequestsAction(tenantId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  
  if (user?.role !== 'SUPERADMIN') {
    return { success: false, error: 'Only Super Admin can access this' };
  }
  
  try {
    const requests = await getTenantDataRequests(tenantId);
    return { success: true, requests };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
