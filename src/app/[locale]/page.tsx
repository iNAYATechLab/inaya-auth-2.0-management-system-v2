// Home Page — Redirects to login or dashboard
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const session = await auth();

  if (session?.user) {
    redirect(`/${locale}/dashboard`);
  } else {
    redirect(`/${locale}/login`);
  }
}
