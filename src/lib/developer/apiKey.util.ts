/**
 * API Key Utilities (Task 43: Developer Portal)
 * Handles API key generation, validation, and management
 */

import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

/**
 * Generate a new API key
 */
export async function generateApiKey(
  tenantId: string,
  userId: string,
  name: string,
  permissions: string[],
  expiresAt?: Date
) {
  // Generate random API key
  const rawKey = crypto.randomBytes(32).toString('hex');
  const keyPrefix = rawKey.substring(0, 8);
  
  // Hash the key for storage (we'll use the raw key for validation)
  const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');

  // Store in database
  const apiKey = await prisma.apiKey.create({
    data: {
      tenantId,
      userId,
      name,
      key: hashedKey,
      keyPrefix,
      permissions,
      expiresAt,
    },
  });

  // Return the raw key (only time it's available)
  return {
    ...apiKey,
    rawKey, // Only returned once
  };
}

/**
 * Validate an API key
 */
export async function validateApiKey(rawKey: string): Promise<{
  valid: boolean;
  apiKey?: any;
  tenantId?: string;
  error?: string;
}> {
  // Hash the provided key
  const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');

  // Find the key in database
  const apiKey = await prisma.apiKey.findUnique({
    where: { key: hashedKey },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          isActive: true,
        },
      },
    },
  });

  if (!apiKey) {
    return { valid: false, error: 'Invalid API key' };
  }

  // Check if API key is active
  if (!apiKey.isActive) {
    return { valid: false, error: 'API key is inactive' };
  }

  // Check if tenant is active
  if (!apiKey.tenant.isActive) {
    return { valid: false, error: 'Tenant is inactive' };
  }

  // Check if API key has expired
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return { valid: false, error: 'API key has expired' };
  }

  // Update last used timestamp
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    valid: true,
    apiKey,
    tenantId: apiKey.tenantId,
  };
}

/**
 * Get all API keys for a tenant
 */
export async function getApiKeysByTenant(tenantId: string) {
  return await prisma.apiKey.findMany({
    where: { tenantId },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      permissions: true,
      expiresAt: true,
      lastUsedAt: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(apiKeyId: string, tenantId: string) {
  return await prisma.apiKey.update({
    where: { id: apiKeyId, tenantId },
    data: { isActive: false },
  });
}

/**
 * Delete an API key
 */
export async function deleteApiKey(apiKeyId: string, tenantId: string) {
  return await prisma.apiKey.delete({
    where: { id: apiKeyId, tenantId },
  });
}

/**
 * Check if API key has specific permission
 */
export function hasPermission(apiKey: any, permission: string): boolean {
  const permissions = apiKey.permissions as string[];
  return permissions.includes('*') || permissions.includes(permission);
}

/**
 * Get API key by ID
 */
export async function getApiKeyById(apiKeyId: string, tenantId: string) {
  return await prisma.apiKey.findFirst({
    where: { id: apiKeyId, tenantId },
  });
}
