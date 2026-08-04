/**
 * Tenant Server Actions (Task 42: Multi-Tenant Architecture)
 * Server-side actions for tenant management
 */

'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  createTenant,
  getTenantBySlug,
  getAllTenants,
  updateTenant,
  deleteTenant,
  getTenantMembers,
  inviteUserToTenant,
  updateTenantMemberRole,
  removeUserFromTenant,
} from './tenant.util';
import { revalidatePath } from 'next/cache';

/**
 * Create a new tenant
 */
export async function createTenantAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  const domain = formData.get('domain') as string | null;

  // Validate slug
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { error: 'Invalid slug. Use only lowercase letters, numbers, and hyphens.' };
  }

  try {
    const tenant = await createTenant({
      name,
      slug,
      domain: domain || undefined,
      ownerId: session.user.id,
    });

    revalidatePath('/dashboard');
    return { success: true, tenant };
  } catch (error: any) {
    return { error: error.message || 'Failed to create tenant' };
  }
}

/**
 * Get current user's tenant
 */
export async function getCurrentTenantAction() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      tenant: true,
    },
  });

  if (!user?.tenant) {
    return { error: 'User does not belong to any tenant' };
  }

  return { success: true, tenant: user.tenant, tenantRole: user.tenantRole };
}

/**
 * Get all tenants (Super Admin only)
 */
export async function getAllTenantsAction(page: number = 1) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  // Check if user is super admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== 'SUPERADMIN') {
    return { error: 'Unauthorized. Super Admin access required.' };
  }

  try {
    const result = await getAllTenants(page);
    return { success: true, ...result };
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch tenants' };
  }
}

/**
 * Update tenant
 */
export async function updateTenantAction(tenantId: string, data: {
  name?: string;
  domain?: string;
  logoUrl?: string;
  settings?: any;
  plan?: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  isActive?: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  // Check if user has permission
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tenantId: true, tenantRole: true, role: true },
  });

  if (!user || (user.tenantId !== tenantId && user.role !== 'SUPERADMIN')) {
    return { error: 'Unauthorized' };
  }

  if (user.tenantRole !== 'OWNER' && user.tenantRole !== 'ADMIN' && user.role !== 'SUPERADMIN') {
    return { error: 'Insufficient permissions' };
  }

  try {
    const tenant = await updateTenant(tenantId, data);
    revalidatePath('/dashboard/settings');
    return { success: true, tenant };
  } catch (error: any) {
    return { error: error.message || 'Failed to update tenant' };
  }
}

/**
 * Delete tenant (Super Admin only)
 */
export async function deleteTenantAction(tenantId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  // Check if user is super admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== 'SUPERADMIN') {
    return { error: 'Unauthorized. Super Admin access required.' };
  }

  try {
    await deleteTenant(tenantId);
    revalidatePath('/admin/tenants');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to delete tenant' };
  }
}

/**
 * Get tenant members
 */
export async function getTenantMembersAction(tenantId: string, page: number = 1) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  // Check if user has permission
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tenantId: true, tenantRole: true, role: true },
  });

  if (!user || (user.tenantId !== tenantId && user.role !== 'SUPERADMIN')) {
    return { error: 'Unauthorized' };
  }

  try {
    const result = await getTenantMembers(tenantId, page);
    return { success: true, ...result };
  } catch (error: any) {
    return { error: error.message || 'Failed to fetch members' };
  }
}

/**
 * Invite user to tenant
 */
export async function inviteUserToTenantAction(tenantId: string, email: string, role: 'ADMIN' | 'DEVELOPER' | 'MEMBER') {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  // Check if user has permission
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tenantId: true, tenantRole: true },
  });

  if (!user || user.tenantId !== tenantId) {
    return { error: 'Unauthorized' };
  }

  if (user.tenantRole !== 'OWNER' && user.tenantRole !== 'ADMIN') {
    return { error: 'Insufficient permissions' };
  }

  try {
    const result = await inviteUserToTenant(tenantId, email, role);
    revalidatePath('/dashboard/members');
    return result;
  } catch (error: any) {
    return { error: error.message || 'Failed to invite user' };
  }
}

/**
 * Update tenant member role
 */
export async function updateTenantMemberRoleAction(tenantId: string, userId: string, role: 'ADMIN' | 'DEVELOPER' | 'MEMBER') {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  // Check if user has permission
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tenantId: true, tenantRole: true },
  });

  if (!currentUser || currentUser.tenantId !== tenantId) {
    return { error: 'Unauthorized' };
  }

  if (currentUser.tenantRole !== 'OWNER' && currentUser.tenantRole !== 'ADMIN') {
    return { error: 'Insufficient permissions' };
  }

  try {
    const user = await updateTenantMemberRole(tenantId, userId, role);
    revalidatePath('/dashboard/members');
    return { success: true, user };
  } catch (error: any) {
    return { error: error.message || 'Failed to update member role' };
  }
}

/**
 * Remove user from tenant
 */
export async function removeUserFromTenantAction(tenantId: string, userId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  // Check if user has permission
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tenantId: true, tenantRole: true },
  });

  if (!currentUser || currentUser.tenantId !== tenantId) {
    return { error: 'Unauthorized' };
  }

  if (currentUser.tenantRole !== 'OWNER' && currentUser.tenantRole !== 'ADMIN') {
    return { error: 'Insufficient permissions' };
  }

  try {
    const result = await removeUserFromTenant(tenantId, userId);
    revalidatePath('/dashboard/members');
    return result;
  } catch (error: any) {
    return { error: error.message || 'Failed to remove user' };
  }
}
