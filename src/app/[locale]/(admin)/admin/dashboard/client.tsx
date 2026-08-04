/**
 * Super Admin Dashboard Client Component (Task 47)
 */

'use client';

import { useEffect, useState } from 'react';
import { getAdminDashboardStatsAction } from '@/lib/admin/admin.actions';
import { Card } from '@/components/ui/card';
import { 
  DollarSign, 
  Users, 
  Building2, 
  TrendingUp,
  CreditCard,
  Activity
} from 'lucide-react';

interface DashboardStats {
  revenue: {
    totalRevenue: number;
    monthlyRecurringRevenue: number;
    annualRecurringRevenue: number;
    averageRevenuePerTenant: number;
    revenueByMonth: Array<{ month: string; revenue: number }>;
  };
  tenants: {
    totalTenants: number;
    activeTenants: number;
    newTenantsThisMonth: number;
    churnRate: number;
  };
  users: {
    totalUsers: number;
    activeUsers: number;
    newUsersThisMonth: number;
    averageUsersPerTenant: number;
  };
}

export default function AdminDashboardClient() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const result = await getAdminDashboardStatsAction();
    if (result.success && result.stats) {
      setStats(result.stats as DashboardStats);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700"></div>
      </div>
    );
  }

  if (!stats) {
    return <div>Failed to load dashboard stats</div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Super Admin Dashboard</h1>
        <p className="text-neutral-600">Overview of system performance and metrics</p>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-600">Total Revenue</span>
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">
            ${(stats.revenue.totalRevenue / 100).toFixed(2)}
          </div>
          <div className="text-xs text-neutral-500 mt-1">All time</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-600">MRR</span>
            <TrendingUp className="w-5 h-5 text-primary-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">
            ${(stats.revenue.monthlyRecurringRevenue / 100).toFixed(2)}
          </div>
          <div className="text-xs text-neutral-500 mt-1">Monthly recurring</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-600">ARR</span>
            <CreditCard className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">
            ${(stats.revenue.annualRecurringRevenue / 100).toFixed(2)}
          </div>
          <div className="text-xs text-neutral-500 mt-1">Annual recurring</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-600">Avg Revenue/Tenant</span>
            <Activity className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">
            ${(stats.revenue.averageRevenuePerTenant / 100).toFixed(2)}
          </div>
          <div className="text-xs text-neutral-500 mt-1">Per tenant</div>
        </Card>
      </div>

      {/* Tenant Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-600">Total Tenants</span>
            <Building2 className="w-5 h-5 text-neutral-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">{stats.tenants.totalTenants}</div>
          <div className="text-xs text-neutral-500 mt-1">
            {stats.tenants.activeTenants} active
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-600">New Tenants</span>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">{stats.tenants.newTenantsThisMonth}</div>
          <div className="text-xs text-neutral-500 mt-1">This month</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-600">Churn Rate</span>
            <Activity className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">
            {stats.tenants.churnRate.toFixed(1)}%
          </div>
          <div className="text-xs text-neutral-500 mt-1">Monthly churn</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-600">Avg Users/Tenant</span>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">
            {stats.users.averageUsersPerTenant.toFixed(1)}
          </div>
          <div className="text-xs text-neutral-500 mt-1">Per tenant</div>
        </Card>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-600">Total Users</span>
            <Users className="w-5 h-5 text-neutral-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">{stats.users.totalUsers}</div>
          <div className="text-xs text-neutral-500 mt-1">
            {stats.users.activeUsers} active
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-600">New Users</span>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">{stats.users.newUsersThisMonth}</div>
          <div className="text-xs text-neutral-500 mt-1">This month</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-600">Active Users</span>
            <Activity className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">{stats.users.activeUsers}</div>
          <div className="text-xs text-neutral-500 mt-1">
            {((stats.users.activeUsers / stats.users.totalUsers) * 100).toFixed(1)}% of total
          </div>
        </Card>
      </div>

      {/* Quick Links */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="/admin/tenants"
            className="p-4 border border-neutral-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all"
          >
            <Building2 className="w-6 h-6 text-primary-700 mb-2" />
            <div className="font-medium text-neutral-900">Manage Tenants</div>
            <div className="text-sm text-neutral-600">{stats.tenants.totalTenants} tenants</div>
          </a>

          <a
            href="/admin/subscriptions"
            className="p-4 border border-neutral-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all"
          >
            <CreditCard className="w-6 h-6 text-primary-700 mb-2" />
            <div className="font-medium text-neutral-900">Subscriptions</div>
            <div className="text-sm text-neutral-600">Manage billing</div>
          </a>

          <a
            href="/admin/analytics"
            className="p-4 border border-neutral-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all"
          >
            <TrendingUp className="w-6 h-6 text-primary-700 mb-2" />
            <div className="font-medium text-neutral-900">Analytics</div>
            <div className="text-sm text-neutral-600">View reports</div>
          </a>

          <a
            href="/admin/backup"
            className="p-4 border border-neutral-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all"
          >
            <Activity className="w-6 h-6 text-primary-700 mb-2" />
            <div className="font-medium text-neutral-900">Backup & Export</div>
            <div className="text-sm text-neutral-600">Data management</div>
          </a>
        </div>
      </Card>
    </div>
  );
}
