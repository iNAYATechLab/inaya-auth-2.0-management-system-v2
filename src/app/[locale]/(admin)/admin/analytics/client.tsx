/**
 * Admin Analytics Client Component (Task 49)
 */

'use client';

import { useEffect, useState } from 'react';
import { getRevenueStatsAction } from '@/lib/admin/admin.actions';
import { Card } from '@/components/ui/card';
import { TrendingUp, DollarSign, Calendar } from 'lucide-react';

interface RevenueStats {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  averageRevenuePerTenant: number;
  revenueByMonth: Array<{ month: string; revenue: number }>;
  revenueByPlan: Array<{ plan: string; revenue: number; tenants: number }>;
  revenueByCountry: Array<{ country: string; revenue: number }>;
}

export default function AdminAnalyticsClient() {
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const result = await getRevenueStatsAction();
    if (result.success && result.stats) {
      setStats(result.stats as RevenueStats);
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
    return <div>Failed to load analytics</div>;
  }

  const maxRevenue = Math.max(...stats.revenueByMonth.map(m => m.revenue));

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Analytics & Revenue Reports</h1>
        <p className="text-neutral-600">Detailed revenue analytics and business metrics</p>
      </div>

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-600">Total Revenue</span>
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">
            ${(stats.totalRevenue / 100).toFixed(2)}
          </div>
          <div className="text-xs text-neutral-500 mt-1">All time</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-600">MRR</span>
            <TrendingUp className="w-5 h-5 text-primary-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">
            ${(stats.monthlyRecurringRevenue / 100).toFixed(2)}
          </div>
          <div className="text-xs text-neutral-500 mt-1">This month</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-600">ARR</span>
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">
            ${(stats.annualRecurringRevenue / 100).toFixed(2)}
          </div>
          <div className="text-xs text-neutral-500 mt-1">Projected annual</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-600">Avg Revenue</span>
            <DollarSign className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">
            ${(stats.averageRevenuePerTenant / 100).toFixed(2)}
          </div>
          <div className="text-xs text-neutral-500 mt-1">Per tenant</div>
        </Card>
      </div>

      {/* Revenue by Month Chart */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">Revenue by Month (Last 12 Months)</h2>
        <div className="space-y-2">
          {stats.revenueByMonth.map((month, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="w-24 text-sm text-neutral-600">{month.month}</div>
              <div className="flex-1 bg-neutral-100 rounded-full h-8 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-600 to-primary-400 flex items-center justify-end px-3"
                  style={{ width: `${maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0}%` }}
                >
                  {month.revenue > 0 && (
                    <span className="text-xs text-white font-medium">
                      ${(month.revenue / 100).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Revenue by Plan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Revenue by Plan</h2>
          <div className="space-y-3">
            {stats.revenueByPlan.map((plan, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                <div>
                  <div className="font-medium text-neutral-900">{plan.plan}</div>
                  <div className="text-sm text-neutral-600">{plan.tenants} tenants</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-neutral-900">
                    ${(plan.revenue / 100).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Revenue by Currency</h2>
          <div className="space-y-3">
            {stats.revenueByCountry.map((country, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                <div>
                  <div className="font-medium text-neutral-900">{country.country}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-neutral-900">
                    {(country.revenue / 100).toFixed(2)} {country.country}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
