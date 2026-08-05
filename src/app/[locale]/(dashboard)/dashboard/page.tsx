'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Users,
  Shield,
  Activity,
  Clock,
} from 'lucide-react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const t = useTranslations('dashboard');

  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!session) {
    redirect('/login');
  }

  return (
    <DashboardLayout>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">
          {t('welcome', { name: session.user?.name || 'User' })}
        </h1>
        <p className="text-neutral-600">{t('overview')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">
              {t('stats.totalUsers')}
            </CardTitle>
            <Users className="h-4 w-4 text-primary-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neutral-900">1,234</div>
            <p className="text-xs text-success-600">+12% from last month</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">
              {t('stats.activeUsers')}
            </CardTitle>
            <Shield className="h-4 w-4 text-success-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neutral-900">892</div>
            <p className="text-xs text-success-600">+8% from last month</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">
              {t('stats.newUsers')}
            </CardTitle>
            <Activity className="h-4 w-4 text-accent-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neutral-900">56</div>
            <p className="text-xs text-accent-600">This week</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">
              {t('stats.auditLogs')}
            </CardTitle>
            <Clock className="h-4 w-4 text-info-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-neutral-900">12,456</div>
            <p className="text-xs text-info-600">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{t('recentActivity')}</CardTitle>
          <CardDescription>Latest system activities and events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { action: 'User Login', user: 'admin@inaya-auth.com', time: '2 minutes ago' },
              { action: 'Profile Updated', user: 'user@example.com', time: '15 minutes ago' },
              { action: 'Password Changed', user: 'moderator@inaya-auth.com', time: '1 hour ago' },
              { action: 'New User Registered', user: 'newuser@example.com', time: '2 hours ago' },
              { action: 'Role Updated', user: 'admin@inaya-auth.com', time: '3 hours ago' },
            ].map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{activity.action}</p>
                    <p className="text-xs text-neutral-500">{activity.user}</p>
                  </div>
                </div>
                <span className="text-xs text-neutral-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
