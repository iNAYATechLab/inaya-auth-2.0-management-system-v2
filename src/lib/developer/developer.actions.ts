/**
 * Developer Portal Server Actions (Tasks 43-44)
 * Server-side actions for developer portal management
 */

'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import {
  generateApiKey,
  getApiKeysByTenant,
  revokeApiKey,
  deleteApiKey,
} from './apiKey.util';
import {
  createWebhook,
  getWebhooksByTenant,
  updateWebhook,
  deleteWebhook,
  getWebhookDeliveries,
  type WebhookEvent,
} from './webhook.util';

// ─── API Key Actions ────────────────────────────────────────────────────────

/**
 * Create a new API key
 */
export async function createApiKeyAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  const name = formData.get('name') as string;
  const permissions = formData.getAll('permissions') as string[];
  const expiresIn = formData.get('expiresIn') as string | null;

  // Get user's tenant
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tenantId: true, tenantRole: true },
  });

  if (!user?.tenantId) {
    return { error: 'User does not belong to any tenant' };
  }

  // Calculate expiration date
  let expiresAt: Date | undefined;
  if (expiresIn) {
    const days = parseInt(expiresIn);
    expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  try {
    const apiKey = await generateApiKey(
      user.tenantId,
      session.user.id,
      name,
      permissions,
      expiresAt
    );

    revalidatePath('/developer/api-keys');
    return { success: true, apiKey };
  } catch (error: any) {
    return { error: error.message || 'Failed to create API key' };
  }
}

/**
 * Get all API keys for current tenant
 */
export async function getApiKeysAction() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tenantId: true },
  });

  if (!user?.tenantId) {
    return { error: 'User does not belong to any tenant' };
  }

  try {
    const apiKeys = await getApiKeysByTenant(user.tenantId);
    return { success: true, apiKeys };
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch API keys' };
  }
}

/**
 * Revoke an API key
 */
export async function revokeApiKeyAction(apiKeyId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tenantId: true },
  });

  if (!user?.tenantId) {
    return { error: 'User does not belong to any tenant' };
  }

  try {
    await revokeApiKey(apiKeyId, user.tenantId);
    revalidatePath('/developer/api-keys');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to revoke API key' };
  }
}

/**
 * Delete an API key
 */
export async function deleteApiKeyAction(apiKeyId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tenantId: true },
  });

  if (!user?.tenantId) {
    return { error: 'User does not belong to any tenant' };
  }

  try {
    await deleteApiKey(apiKeyId, user.tenantId);
    revalidatePath('/developer/api-keys');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to delete API key' };
  }
}

// ─── Webhook Actions ────────────────────────────────────────────────────────

/**
 * Create a new webhook
 */
export async function createWebhookAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  const url = formData.get('url') as string;
  const events = formData.getAll('events') as WebhookEvent[];

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tenantId: true },
  });

  if (!user?.tenantId) {
    return { error: 'User does not belong to any tenant' };
  }

  try {
    const webhook = await createWebhook(
      user.tenantId,
      session.user.id,
      url,
      events
    );

    revalidatePath('/developer/webhooks');
    return { success: true, webhook };
  } catch (error: any) {
    return { error: error.message || 'Failed to create webhook' };
  }
}

/**
 * Get all webhooks for current tenant
 */
export async function getWebhooksAction() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tenantId: true },
  });

  if (!user?.tenantId) {
    return { error: 'User does not belong to any tenant' };
  }

  try {
    const webhooks = await getWebhooksByTenant(user.tenantId);
    return { success: true, webhooks };
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch webhooks' };
  }
}

/**
 * Update a webhook
 */
export async function updateWebhookAction(
  webhookId: string,
  data: {
    url?: string;
    events?: WebhookEvent[];
    isActive?: boolean;
  }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tenantId: true },
  });

  if (!user?.tenantId) {
    return { error: 'User does not belong to any tenant' };
  }

  try {
    const webhook = await updateWebhook(webhookId, user.tenantId, data);
    revalidatePath('/developer/webhooks');
    return { success: true, webhook };
  } catch (error: any) {
    return { error: error.message || 'Failed to update webhook' };
  }
}

/**
 * Delete a webhook
 */
export async function deleteWebhookAction(webhookId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tenantId: true },
  });

  if (!user?.tenantId) {
    return { error: 'User does not belong to any tenant' };
  }

  try {
    await deleteWebhook(webhookId, user.tenantId);
    revalidatePath('/developer/webhooks');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to delete webhook' };
  }
}

/**
 * Get webhook delivery logs
 */
export async function getWebhookDeliveriesAction(webhookId: string, page: number = 1) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  try {
    const result = await getWebhookDeliveries(webhookId, page);
    return { success: true, ...result };
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch deliveries' };
  }
}
