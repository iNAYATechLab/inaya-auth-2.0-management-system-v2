/**
 * Tenant Billing Dashboard Page (Task 46)
 * 
 * View and manage subscription, view invoices
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import BillingClient from './client';

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  // Get user's tenant
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { tenantId: true },
  });

  if (!user?.tenantId) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50/30">
      <div className="container mx-auto px-4 py-8">
        <BillingClient tenantId={user.tenantId} />
      </div>
    </div>
  );
}
