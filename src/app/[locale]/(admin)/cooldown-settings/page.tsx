// Admin Cooldown Settings Page (Task 41: Super Admin Configurable)
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import CooldownSettingsClient from './client';

export default async function CooldownSettingsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  // Check if user is Super Admin
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
        <CooldownSettingsClient />
      </div>
    </div>
  );
}
