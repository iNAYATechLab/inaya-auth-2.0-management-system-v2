/**
 * Tenant Middleware (Task 42: Multi-Tenant Architecture)
 * Extracts tenant context from request and enforces data isolation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTenantBySlug, getTenantByDomain } from '@/lib/tenant/tenant.util';

export interface TenantRequest extends NextRequest {
  tenantId?: string;
  tenantSlug?: string;
}

/**
 * Extract tenant from request
 * Priority:
 * 1. Subdomain (e.g., acme.inaya-auth.com)
 * 2. Custom domain
 * 3. Header (X-Tenant-ID)
 * 4. Query parameter (?tenant=acme)
 */
export async function extractTenant(request: NextRequest): Promise<{
  tenantId?: string;
  tenantSlug?: string;
} | null> {
  const url = new URL(request.url);
  const hostname = url.hostname;

  // 1. Check for subdomain (e.g., acme.inaya-auth.com)
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    const subdomain = parts[0];
    if (subdomain !== 'www' && subdomain !== 'api' && subdomain !== 'app') {
      const tenant = await getTenantBySlug(subdomain);
      if (tenant) {
        return {
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
        };
      }
    }
  }

  // 2. Check for custom domain
  const tenantByDomain = await getTenantByDomain(hostname);
  if (tenantByDomain) {
    return {
      tenantId: tenantByDomain.id,
      tenantSlug: tenantByDomain.slug,
    };
  }

  // 3. Check header
  const tenantIdHeader = request.headers.get('X-Tenant-ID');
  if (tenantIdHeader) {
    const tenant = await getTenantBySlug(tenantIdHeader);
    if (tenant) {
      return {
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
      };
    }
  }

  // 4. Check query parameter
  const tenantSlug = url.searchParams.get('tenant');
  if (tenantSlug) {
    const tenant = await getTenantBySlug(tenantSlug);
    if (tenant) {
      return {
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
      };
    }
  }

  return null;
}

/**
 * Tenant middleware for API routes
 * Ensures tenant context is available for all tenant-scoped operations
 */
export async function tenantMiddleware(
  request: NextRequest,
  handler: (req: NextRequest, tenantId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  const tenantContext = await extractTenant(request);

  if (!tenantContext) {
    return NextResponse.json(
      { error: 'Tenant not found' },
      { status: 400 }
    );
  }

  // Add tenant context to request
  const extendedRequest = request as TenantRequest;
  extendedRequest.tenantId = tenantContext.tenantId;
  extendedRequest.tenantSlug = tenantContext.tenantSlug;

  return handler(extendedRequest, tenantContext.tenantId!);
}

/**
 * Enforce tenant isolation
 * Ensures that queries are scoped to the current tenant
 */
export function withTenantIsolation<T extends { tenantId: string }>(
  data: T,
  tenantId: string
): boolean {
  return data.tenantId === tenantId;
}

/**
 * Get tenant-scoped Prisma where clause
 */
export function tenantWhere(tenantId: string) {
  return { tenantId };
}

/**
 * Validate tenant access
 * Checks if user has access to the specified tenant
 */
export async function validateTenantAccess(
  userId: string,
  tenantId: string
): Promise<boolean> {
  const { prisma } = await import('@/lib/prisma');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tenantId: true },
  });

  return user?.tenantId === tenantId;
}
