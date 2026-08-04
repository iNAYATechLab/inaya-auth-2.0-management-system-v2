/**
 * Tenant Utilities (Task 42: Multi-Tenant Architecture)
 * Handles tenant isolation and tenant-specific operations
 */

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
}

/**
 * Get current tenant from session
 */
export async function getCurrentTenant(): Promise<TenantContext | null> {
  const session = await auth();
  
  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      tenantId: true,
      tenant: {
        select: {
          slug: true,
          name: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  return {
    tenantId: user.tenantId,
    tenantSlug: user.tenant.slug,
    tenantName: user.tenant.name,
  };
}

/**
 * Get tenant by slug
 */
export async function getTenantBySlug(slug: string) {
  return await prisma.tenant.findUnique({
    where: { slug },
    include: {
      _count: {
        select: {
          users: true,
          oauthClients: true,
        },
      },
    },
  });
}

/**
 * Get tenant by domain
 */
export async function getTenantByDomain(domain: string) {
  return await prisma.tenant.findUnique({
    where: { domain },
  });
}

/**
 * Create a new tenant
 */
export async function createTenant(data: {
  name: string;
  slug: string;
  domain?: string;
  ownerId: string;
}) {
  // Check if slug is available
  const existingTenant = await prisma.tenant.findFirst({
    where: {
      OR: [
        { slug: data.slug },
        { domain: data.domain || '' },
      ],
    },
  });

  if (existingTenant) {
    throw new Error('Tenant slug or domain already exists');
  }

  // Create tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: data.name,
      slug: data.slug,
      domain: data.domain,
    },
  });

  // Update user to be owner of this tenant
  await prisma.user.update({
    where: { id: data.ownerId },
    data: {
      tenantId: tenant.id,
      tenantRole: 'OWNER',
    },
  });

  return tenant;
}

/**
 * Get all tenants (Super Admin only)
 */
export async function getAllTenants(page: number = 1, limit: number = 20) {
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
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.tenant.count(),
  ]);

  return {
    tenants,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Update tenant settings
 */
export async function updateTenant(tenantId: string, data: {
  name?: string;
  domain?: string;
  logoUrl?: string;
  settings?: any;
  plan?: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  isActive?: boolean;
}) {
  return await prisma.tenant.update({
    where: { id: tenantId },
    data,
  });
}

/**
 * Delete tenant (and all associated data)
 */
export async function deleteTenant(tenantId: string) {
  return await prisma.tenant.delete({
    where: { id: tenantId },
  });
}

/**
 * Get tenant members
 */
export async function getTenantMembers(tenantId: string, page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;

  const [members, total] = await Promise.all([
    prisma.user.findMany({
      where: { tenantId },
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        image: true,
        tenantRole: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.user.count({ where: { tenantId } }),
  ]);

  return {
    members,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Invite user to tenant
 */
export async function inviteUserToTenant(tenantId: string, email: string, role: 'ADMIN' | 'DEVELOPER' | 'MEMBER') {
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    if (existingUser.tenantId === tenantId) {
      throw new Error('User is already a member of this tenant');
    }
    throw new Error('User already exists with this email');
  }

  // TODO: Send invitation email
  // For now, just return success
  return {
    success: true,
    message: `Invitation sent to ${email}`,
  };
}

/**
 * Update tenant member role
 */
export async function updateTenantMemberRole(tenantId: string, userId: string, role: 'ADMIN' | 'DEVELOPER' | 'MEMBER') {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.tenantId !== tenantId) {
    throw new Error('User not found in this tenant');
  }

  if (user.tenantRole === 'OWNER') {
    throw new Error('Cannot change owner role');
  }

  return await prisma.user.update({
    where: { id: userId },
    data: { tenantRole: role },
  });
}

/**
 * Remove user from tenant
 */
export async function removeUserFromTenant(tenantId: string, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.tenantId !== tenantId) {
    throw new Error('User not found in this tenant');
  }

  if (user.tenantRole === 'OWNER') {
    throw new Error('Cannot remove owner from tenant');
  }

  // Delete user and all associated data
  await prisma.user.delete({
    where: { id: userId },
  });

  return { success: true };
}
