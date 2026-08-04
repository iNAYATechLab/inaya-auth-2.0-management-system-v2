/**
 * Webhook Utilities (Task 44: Webhooks)
 * Handles webhook creation, delivery, and management
 */

import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

/**
 * Webhook event types
 */
export type WebhookEvent =
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'user.login'
  | 'user.logout'
  | 'tenant.created'
  | 'tenant.updated'
  | 'tenant.deleted'
  | 'oauth.client.created'
  | 'oauth.client.updated'
  | 'oauth.client.deleted'
  | 'api.key.created'
  | 'api.key.revoked'
  | 'security.alert'
  | 'kyc.submitted'
  | 'kyc.verified'
  | 'kyc.rejected';

/**
 * Create a new webhook
 */
export async function createWebhook(
  tenantId: string,
  userId: string,
  url: string,
  events: WebhookEvent[]
) {
  // Validate URL
  try {
    new URL(url);
  } catch {
    throw new Error('Invalid webhook URL');
  }

  // Generate webhook signing secret
  const secret = crypto.randomBytes(32).toString('hex');

  // Create webhook
  const webhook = await prisma.webhook.create({
    data: {
      tenantId,
      userId,
      url,
      secret,
      events,
    },
  });

  return {
    ...webhook,
    secret, // Return secret only once
  };
}

/**
 * Get all webhooks for a tenant
 */
export async function getWebhooksByTenant(tenantId: string) {
  return await prisma.webhook.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get webhooks subscribed to specific event
 */
export async function getWebhooksByEvent(tenantId: string, event: WebhookEvent) {
  const webhooks = await prisma.webhook.findMany({
    where: {
      tenantId,
      isActive: true,
    },
  });

  // Filter webhooks that are subscribed to this event
  return webhooks.filter((webhook) => {
    const events = webhook.events as string[];
    return events.includes(event) || events.includes('*');
  });
}

/**
 * Deliver webhook to subscribers
 */
export async function deliverWebhook(
  tenantId: string,
  event: WebhookEvent,
  payload: any
) {
  // Get webhooks subscribed to this event
  const webhooks = await getWebhooksByEvent(tenantId, event);

  if (webhooks.length === 0) {
    return { delivered: 0, failed: 0 };
  }

  let delivered = 0;
  let failed = 0;

  // Deliver to each webhook
  for (const webhook of webhooks) {
    try {
      await triggerWebhook(webhook, event, payload);
      delivered++;
    } catch (error) {
      failed++;
      console.error(`Webhook delivery failed for ${webhook.url}:`, error);
    }
  }

  return { delivered, failed };
}

/**
 * Trigger a single webhook
 */
async function triggerWebhook(
  webhook: any,
  event: WebhookEvent,
  payload: any
) {
  const timestamp = Date.now().toString();
  
  // Create signature
  const signature = crypto
    .createHmac('sha256', webhook.secret)
    .update(`${timestamp}.${JSON.stringify(payload)}`)
    .digest('hex');

  // Send webhook
  const response = await fetch(webhook.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Event': event,
      'X-Webhook-Signature': signature,
      'X-Webhook-Timestamp': timestamp,
    },
    body: JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      data: payload,
    }),
  });

  // Log delivery
  await prisma.webhookDelivery.create({
    data: {
      webhookId: webhook.id,
      event,
      payload,
      statusCode: response.status,
      success: response.ok,
      deliveredAt: new Date(),
    },
  });

  // Update webhook last triggered
  await prisma.webhook.update({
    where: { id: webhook.id },
    data: { lastTriggeredAt: new Date() },
  });

  if (!response.ok) {
    throw new Error(`Webhook delivery failed with status ${response.status}`);
  }

  return response;
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  timestamp: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

/**
 * Update webhook
 */
export async function updateWebhook(
  webhookId: string,
  tenantId: string,
  data: {
    url?: string;
    events?: WebhookEvent[];
    isActive?: boolean;
  }
) {
  // Validate URL if provided
  if (data.url) {
    try {
      new URL(data.url);
    } catch {
      throw new Error('Invalid webhook URL');
    }
  }

  return await prisma.webhook.update({
    where: { id: webhookId, tenantId },
    data,
  });
}

/**
 * Delete webhook
 */
export async function deleteWebhook(webhookId: string, tenantId: string) {
  return await prisma.webhook.delete({
    where: { id: webhookId, tenantId },
  });
}

/**
 * Get webhook delivery logs
 */
export async function getWebhookDeliveries(
  webhookId: string,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit;

  const [deliveries, total] = await Promise.all([
    prisma.webhookDelivery.findMany({
      where: { webhookId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.webhookDelivery.count({ where: { webhookId } }),
  ]);

  return {
    deliveries,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
