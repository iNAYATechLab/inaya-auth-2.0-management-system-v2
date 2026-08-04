// Passkeys Management Page (Task 13)
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import PasskeysClient from './client';

interface PasskeysPageProps {
  params: Promise<{ locale: string }>;
}

export default async function PasskeysPage({ params }: PasskeysPageProps) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  // Get user's passkeys
  const passkeys = await prisma.passkey.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      name: true,
      deviceType: true,
      backedUp: true,
      transports: true,
      lastUsedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50/30">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-inaya-gradient flex items-center justify-center">
              <span className="text-lg font-bold text-white">iN</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-neutral-900">iNAYA Auth 2.0</h1>
              <p className="text-xs text-neutral-500">Passkeys Management</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Passkeys</h2>
        <p className="text-neutral-600 mb-8">
          Manage your passkeys for passwordless authentication using fingerprint, face recognition, or device PIN.
        </p>

        <PasskeysClient
          passkeys={passkeys}
          userEmail={session.user.email || ''}
        />
      </main>
    </div>
  );
}
