/**
 * Admin Tenants Management Client Component (Task 47)
 */

'use client';

import { useEffect, useState } from 'react';
import { 
  getAllTenantsAdminAction, 
  updateTenantStatusAction,
  deleteTenantAdminAction,
  exportTenantDataAction
} from '@/lib/admin/admin.actions';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, MoreVertical, Download, Power, Trash2 } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  plan: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    users: number;
    oauthClients: number;
    apiKeys: number;
    webhooks: number;
  };
  subscription?: {
    status: string;
    plan: {
      name: string;
    };
  } | null;
}

export default function AdminTenantsClient() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadTenants();
  }, [page]);

  async function loadTenants() {
    const result = await getAllTenantsAdminAction(page, 20);
    if (result.success && result.tenants) {
      setTenants(result.tenants as Tenant[]);
      setTotalPages(result.pagination?.totalPages || 1);
    }
    setLoading(false);
  }

  async function handleToggleStatus(tenantId: string, currentStatus: boolean) {
    const result = await updateTenantStatusAction(tenantId, !currentStatus);
    if (result.success) {
      await loadTenants();
    }
  }

  async function handleDelete(tenantId: string, tenantName: string) {
    if (!confirm(`Are you sure you want to delete "${tenantName}"? This action cannot be undone.`)) {
      return;
    }

    const result = await deleteTenantAdminAction(tenantId);
    if (result.success) {
      await loadTenants();
    }
  }

  async function handleExport(tenantId: string) {
    const result = await exportTenantDataAction(tenantId, {
      includeUsers: true,
      includeOAuthClients: true,
      includeApiKeys: true,
      includeWebhooks: true,
      includeSubscriptions: true,
      includeAuditLogs: false,
    });

    if (result.success && result.data) {
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename || 'tenant-export.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Tenant Management</h1>
          <p className="text-neutral-600">Manage all tenants in the system</p>
        </div>
      </div>

      {/* Tenants List */}
      <div className="space-y-4">
        {tenants.map((tenant) => (
          <Card key={tenant.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary-700" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-neutral-900">{tenant.name}</h3>
                    {tenant.isActive ? (
                      <span className="px-2 py-1 text-xs font-medium bg-success-100 text-success-800 rounded">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-neutral-100 text-neutral-800 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-600 mb-2">
                    {tenant.slug} • {tenant.domain || 'No custom domain'}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-neutral-600">
                      <strong>{tenant._count.users}</strong> users
                    </span>
                    <span className="text-neutral-600">
                      <strong>{tenant._count.oauthClients}</strong> OAuth clients
                    </span>
                    <span className="text-neutral-600">
                      <strong>{tenant._count.apiKeys}</strong> API keys
                    </span>
                    <span className="text-neutral-600">
                      <strong>{tenant._count.webhooks}</strong> webhooks
                    </span>
                  </div>
                  {tenant.subscription && (
                    <div className="mt-2 text-sm">
                      <span className="text-neutral-600">Plan: </span>
                      <span className="font-medium">{tenant.subscription.plan.name}</span>
                      <span className="text-neutral-600"> • Status: </span>
                      <span className="font-medium">{tenant.subscription.status}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport(tenant.id)}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleStatus(tenant.id, tenant.isActive)}
                >
                  <Power className="w-4 h-4 mr-1" />
                  {tenant.isActive ? 'Disable' : 'Enable'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(tenant.id, tenant.name)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-neutral-600">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
