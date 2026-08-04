/**
 * OAuth Clients Management Page
 * Task 23-26: SSO Client Management
 */

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import OAuthClientsClient from './client';

interface OAuthClientsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function OAuthClientsPage({ params }: OAuthClientsPageProps) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  // Get user's OAuth clients
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
              <p className="text-xs text-neutral-500">OAuth Clients</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">OAuth Applications</h2>
            <p className="text-neutral-600">
              Manage your OAuth 2.0 / OIDC applications for Single Sign-On
            </p>
          </div>
          <a
            href="/oauth-clients/new"
            className="px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white rounded-lg font-medium transition-all shadow-inaya hover:shadow-inaya-lg"
          >
            + New Application
          </a>
        </div>

        <OAuthClientsClient clients={clients} />
      </main>
    </div>
  );
}
