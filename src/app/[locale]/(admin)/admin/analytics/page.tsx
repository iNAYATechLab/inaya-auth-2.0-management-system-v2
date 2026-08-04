/**
 * Admin Analytics & Revenue Reports Page (Task 49)
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AdminAnalyticsClient from './client';

export default async function AdminAnalyticsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== 'SUPERADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50/30">
      <div className="container mx-auto px-4 py-8">
        <AdminAnalyticsClient />
      </div>
    </div>
  );
}
