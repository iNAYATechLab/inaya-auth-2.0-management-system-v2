/**
 * OAuth Client Management Server Actions
 * Task 23-26: SSO Client Management
 */

'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { generateClientCredentials } from '@/lib/oauth/oauth.util';
import { logAction } from '@/lib/utils/audit';

/**
 * Create a new OAuth client
 */
export async function createOAuthClientAction(
  prevState: { error?: string; success?: boolean; data?: any } | undefined,
  formData: FormData
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const redirectUris = (formData.get('redirectUris') as string).split('\n').filter(uri => uri.trim());
    const scopes = formData.getAll('scopes') as string[];
    const isPublic = formData.get('isPublic') === 'true';
    const logoUrl = formData.get('logoUrl') as string;
    const websiteUrl = formData.get('websiteUrl') as string;

    // Validate
    if (!name || redirectUris.length === 0 || scopes.length === 0) {
      return { error: 'Name, redirect URIs, and scopes are required' };
    }

    // Generate client credentials
    // Get or create default tenant
    let defaultTenant = await prisma.tenant.findFirst();
    if (!defaultTenant) {
      defaultTenant = await prisma.tenant.create({
        data: {
          name: 'Default Tenant',
          slug: 'default',
          isActive: true,
        },
      });
    }

    const { clientId, clientSecret } = generateClientCredentials();

    // Create client
    const client = await prisma.oAuthClient.create({
      data: {
        clientId,
        tenantId: defaultTenant.id,
        clientSecret,
        name,
        description: description || null,
        ownerUserId: session.user.id,
        redirectUris,
        scopes,
        isPublic,
        logoUrl: logoUrl || null,
        websiteUrl: websiteUrl || null,
      },
    });

    // Log action
    await logAction({
      userId: session.user.id,
      action: 'ACCOUNT_LINKED',
      description: `Created OAuth client: ${name}`,
      metadata: { clientId: client.clientId },
    });

    revalidatePath('/oauth-clients');

    return {
      success: true,
      data: {
        id: client.id,
        clientId: client.clientId,
        clientSecret: client.clientSecret,
        name: client.name,
      },
    };
  } catch (error) {
    console.error('Create OAuth client error:', error);
    return { error: 'Failed to create OAuth client' };
  }
}

/**
 * Update OAuth client
 */
export async function updateOAuthClientAction(
  prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    const clientId = formData.get('clientId') as string;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const redirectUris = (formData.get('redirectUris') as string).split('\n').filter(uri => uri.trim());
    const scopes = formData.getAll('scopes') as string[];
    const isActive = formData.get('isActive') === 'true';
    const logoUrl = formData.get('logoUrl') as string;
    const websiteUrl = formData.get('websiteUrl') as string;

    // Verify ownership
    const client = await prisma.oAuthClient.findFirst({
      where: {
        id: clientId,
        ownerUserId: session.user.id,
      },
    });

    if (!client) {
      return { error: 'Client not found or access denied' };
    }

    // Update client
    await prisma.oAuthClient.update({
      where: { id: clientId },
      data: {
        name,
        description: description || null,
        redirectUris,
        scopes,
        isActive,
        logoUrl: logoUrl || null,
        websiteUrl: websiteUrl || null,
      },
    });

    revalidatePath('/oauth-clients');

    return { success: true };
  } catch (error) {
    console.error('Update OAuth client error:', error);
    return { error: 'Failed to update OAuth client' };
  }
}

/**
 * Delete OAuth client
 */
export async function deleteOAuthClientAction(clientId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    // Verify ownership
    const client = await prisma.oAuthClient.findFirst({
      where: {
        id: clientId,
        ownerUserId: session.user.id,
      },
    });

    if (!client) {
      return { error: 'Client not found or access denied' };
    }

    // Delete client (cascades to related records)
    await prisma.oAuthClient.delete({
      where: { id: clientId },
    });

    // Log action
    await logAction({
      userId: session.user.id,
      action: 'ACCOUNT_UNLINKED',
      description: `Deleted OAuth client: ${client.name}`,
      metadata: { clientId: client.clientId },
    });

    revalidatePath('/oauth-clients');

    return { success: true };
  } catch (error) {
    console.error('Delete OAuth client error:', error);
    return { error: 'Failed to delete OAuth client' };
  }
}

/**
 * Regenerate client secret
 */
export async function regenerateClientSecretAction(clientId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    // Verify ownership
    const client = await prisma.oAuthClient.findFirst({
      where: {
        id: clientId,
        ownerUserId: session.user.id,
      },
    });

    if (!client) {
      return { error: 'Client not found or access denied' };
    }

    // Generate new secret
    const { clientSecret } = generateClientCredentials();

    // Update client
    await prisma.oAuthClient.update({
      where: { id: clientId },
      data: { clientSecret },
    });

    // Log action
    await logAction({
      userId: session.user.id,
      action: 'PASSWORD_CHANGE',
      description: `Regenerated client secret for: ${client.name}`,
      metadata: { clientId: client.clientId },
    });

    return {
      success: true,
      data: { clientSecret },
    };
  } catch (error) {
    console.error('Regenerate client secret error:', error);
    return { error: 'Failed to regenerate client secret' };
  }
}

/**
 * Get user's OAuth clients
 */
export async function getUserOAuthClientsAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized', clients: [] };
    }

    const clients = await prisma.oAuthClient.findMany({
      where: { ownerUserId: session.user.id },
      select: {
        id: true,
        clientId: true,
        name: true,
        description: true,
        isActive: true,
        isPublic: true,
        createdAt: true,
        logoUrl: true,
        websiteUrl: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, clients };
  } catch (error) {
    console.error('Get OAuth clients error:', error);
    return { error: 'Failed to fetch OAuth clients', clients: [] };
  }
}

/**
 * Get user's SSO authorizations (apps connected to their account)
 */
export async function getUserSSOAuthorizationsAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized', authorizations: [] };
    }

    const authorizations = await prisma.oAuthAuthorization.findMany({
      where: { userId: session.user.id },
      include: {
        client: {
          select: {
            name: true,
            description: true,
            logoUrl: true,
            websiteUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, authorizations };
  } catch (error) {
    console.error('Get SSO authorizations error:', error);
    return { error: 'Failed to fetch authorizations', authorizations: [] };
  }
}

/**
 * Revoke SSO authorization
 */
export async function revokeSSOAuthorizationAction(authorizationId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    // Delete authorization
    await prisma.oAuthAuthorization.delete({
      where: {
        id: authorizationId,
        userId: session.user.id,
      },
    });

    // Also revoke all active tokens for this client
    const authorization = await prisma.oAuthAuthorization.findUnique({
      where: { id: authorizationId },
    });

    if (authorization) {
      await prisma.oAuthAccessToken.updateMany({
        where: {
          clientId: authorization.clientId,
          userId: session.user.id,
        },
        data: { revokedAt: new Date() },
      });

      await prisma.oAuthRefreshToken.updateMany({
        where: {
          clientId: authorization.clientId,
          userId: session.user.id,
        },
        data: { revokedAt: new Date() },
      });
    }

    revalidatePath('/sso-authorizations');

    return { success: true };
  } catch (error) {
    console.error('Revoke SSO authorization error:', error);
    return { error: 'Failed to revoke authorization' };
  }
}
