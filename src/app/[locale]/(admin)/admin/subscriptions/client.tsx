/**
 * Admin Subscriptions Management Client Component (Task 47)
 */

'use client';

import { useEffect, useState } from 'react';
import { 
  getAllSubscriptionsAdminAction, 
  forceCancelSubscriptionAction 
} from '@/lib/admin/admin.actions';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, XCircle } from 'lucide-react';

interface Subscription {
  id: string;
  status: string;
  billingInterval: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
  plan: {
    name: string;
  };
}

export default function AdminSubscriptionsClient() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadSubscriptions();
  }, [page]);

  async function loadSubscriptions() {
    const result = await getAllSubscriptionsAdminAction(page, 20);
    if (result.success && result.subscriptions) {
      setSubscriptions(result.subscriptions as unknown as Subscription[]);
      setTotalPages(result.pagination?.totalPages || 1);
    }
    setLoading(false);
  }

  async function handleForceCancel(subscriptionId: string, tenantName: string) {
    const reason = prompt(`Why are you force canceling ${tenantName}'s subscription?`);
    if (!reason) return;

    const result = await forceCancelSubscriptionAction(subscriptionId, reason);
    if (result.success) {
      await loadSubscriptions();
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
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Subscription Management</h1>
          <p className="text-neutral-600">Manage all tenant subscriptions</p>
        </div>
      </div>

      {/* Subscriptions List */}
      <div className="space-y-4">
        {subscriptions.map((subscription) => (
          <Card key={subscription.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-primary-700" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-neutral-900">
                      {subscription.tenant.name}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      subscription.status === 'ACTIVE' 
                        ? 'bg-success-100 text-success-800'
                        : subscription.status === 'CANCELED'
                        ? 'bg-error-100 text-error-800'
                        : subscription.status === 'PAST_DUE'
                        ? 'bg-warning-100 text-warning-800'
                        : 'bg-neutral-100 text-neutral-800'
                    }`}>
                      {subscription.status}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-600 mb-2">
                    {subscription.tenant.slug} • {subscription.plan.name} Plan
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-neutral-600">
                      Billing: <strong className="capitalize">{subscription.billingInterval}</strong>
                    </span>
                    {subscription.currentPeriodEnd && (
                      <span className="text-neutral-600">
                        {subscription.cancelAtPeriodEnd ? 'Cancels on' : 'Renews on'}:{' '}
                        <strong>{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              {subscription.status === 'ACTIVE' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleForceCancel(subscription.id, subscription.tenant.name)}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Force Cancel
                </Button>
              )}
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
