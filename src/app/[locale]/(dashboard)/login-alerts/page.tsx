// Login Alerts Page (Task 32)
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import LoginAlertsClient from './client';

export default async function LoginAlertsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50/30">
      <div className="container mx-auto px-4 py-8">
        <LoginAlertsClient />
      </div>
    </div>
  );
}
