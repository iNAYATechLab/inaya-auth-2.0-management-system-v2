// KYC Verification Page (Tasks 35-38)
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import KYCClient from './client';

export default async function KYCPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50/30">
      <div className="container mx-auto px-4 py-8">
        <KYCClient userId={session.user.id} />
      </div>
    </div>
  );
}
