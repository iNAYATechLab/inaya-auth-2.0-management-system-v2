/**
 * Analytics Utilities (Task 49)
 * 
 * Revenue reports, user analytics, tenant statistics
 */

import { prisma } from '@/lib/prisma';

export interface RevenueStats {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  averageRevenuePerTenant: number;
  revenueByMonth: Array<{ month: string; revenue: number }>;
  revenueByPlan: Array<{ plan: string; revenue: number; tenants: number }>;
  revenueByCountry: Array<{ country: string; revenue: number }>;
}

export interface TenantStats {
  totalTenants: number;
  activeTenants: number;
  newTenantsThisMonth: number;
  churnRate: number;
  tenantsByPlan: Array<{ plan: string; count: number }>;
  tenantsByStatus: Array<{ status: string; count: number }>;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  averageUsersPerTenant: number;
  usersByMonth: Array<{ month: string; count: number }>;
  usersByTenant: Array<{ tenantName: string; userCount: number }>;
}

/**
 * Get revenue statistics
 */
export async function getRevenueStats(): Promise<RevenueStats> {
  // Get all paid invoices
  const invoices = await prisma.invoice.findMany({
    where: { status: 'PAID' },
    include: {
      subscription: {
        include: {
          plan: true,
          tenant: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Calculate total revenue
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0);

  // Calculate MRR (Monthly Recurring Revenue)
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  const monthlyInvoices = invoices.filter(inv => 
    new Date(inv.createdAt) >= currentMonth
  );
  const monthlyRecurringRevenue = monthlyInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  // Calculate ARR
  const annualRecurringRevenue = monthlyRecurringRevenue * 12;

  // Calculate average revenue per tenant
  const activeSubscriptions = await prisma.subscription.count({
    where: { status: 'ACTIVE' },
  });
  const averageRevenuePerTenant = activeSubscriptions > 0 
    ? totalRevenue / activeSubscriptions 
    : 0;

  // Revenue by month (last 12 months)
  const revenueByMonth = [];
  for (let i = 11; i >= 0; i--) {
    const month = new Date();
    month.setMonth(month.getMonth() - i);
    month.setDate(1);
    const nextMonth = new Date(month);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const monthInvoices = invoices.filter(inv => {
      const invDate = new Date(inv.createdAt);
      return invDate >= month && invDate < nextMonth;
    });

    const monthRevenue = monthInvoices.reduce((sum, inv) => sum + inv.amount, 0);

    revenueByMonth.push({
      month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      revenue: monthRevenue,
    });
  }

  // Revenue by plan
  const plans = await prisma.pricingPlan.findMany({
    include: {
      subscriptions: {
        include: {
          invoices: {
            where: { status: 'PAID' },
          },
        },
      },
    },
  });

  const revenueByPlan = plans.map(plan => {
    const planRevenue = plan.subscriptions.reduce((sum, sub) => {
      return sum + sub.invoices.reduce((s, inv) => s + inv.amount, 0);
    }, 0);

    return {
      plan: plan.name,
      revenue: planRevenue,
      tenants: plan.subscriptions.filter(s => s.status === 'ACTIVE').length,
    };
  });

  // Revenue by country (simplified - based on tenant location or billing currency)
  const revenueByCountry = [
    { country: 'USD', revenue: invoices.filter(i => i.currency === 'USD').reduce((s, i) => s + i.amount, 0) },
    { country: 'BDT', revenue: invoices.filter(i => i.currency === 'BDT').reduce((s, i) => s + i.amount, 0) },
    { country: 'EUR', revenue: invoices.filter(i => i.currency === 'EUR').reduce((s, i) => s + i.amount, 0) },
  ];

  return {
    totalRevenue,
    monthlyRecurringRevenue,
    annualRecurringRevenue,
    averageRevenuePerTenant,
    revenueByMonth,
    revenueByPlan,
    revenueByCountry,
  };
}

/**
 * Get tenant statistics
 */
export async function getTenantStats(): Promise<TenantStats> {
  const totalTenants = await prisma.tenant.count();

  const activeTenants = await prisma.tenant.count({
    where: { isActive: true },
  });

  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  const newTenantsThisMonth = await prisma.tenant.count({
    where: {
      createdAt: { gte: currentMonth },
    },
  });

  // Calculate churn rate (tenants who canceled in last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const canceledSubscriptions = await prisma.subscription.count({
    where: {
      status: 'CANCELED',
      canceledAt: { gte: thirtyDaysAgo },
    },
  });

  const churnRate = totalTenants > 0 
    ? (canceledSubscriptions / totalTenants) * 100 
    : 0;

  // Tenants by plan
  const plans = await prisma.pricingPlan.findMany({
    include: {
      _count: {
        select: {
          subscriptions: {
            where: { status: 'ACTIVE' },
          },
        },
      },
    },
  });

  const tenantsByPlan = plans.map(plan => ({
    plan: plan.name,
    count: plan._count.subscriptions,
  }));

  // Tenants by status
  const tenantsByStatus = [
    { status: 'Active', count: activeTenants },
    { status: 'Inactive', count: totalTenants - activeTenants },
  ];

  return {
    totalTenants,
    activeTenants,
    newTenantsThisMonth,
    churnRate,
    tenantsByPlan,
    tenantsByStatus,
  };
}

/**
 * Get user statistics
 */
export async function getUserStats(): Promise<UserStats> {
  const totalUsers = await prisma.user.count();

  const activeUsers = await prisma.user.count({
    where: { isActive: true },
  });

  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  const newUsersThisMonth = await prisma.user.count({
    where: {
      createdAt: { gte: currentMonth },
    },
  });

  const totalTenants = await prisma.tenant.count();
  const averageUsersPerTenant = totalTenants > 0 ? totalUsers / totalTenants : 0;

  // Users by month (last 12 months)
  const usersByMonth = [];
  for (let i = 11; i >= 0; i--) {
    const month = new Date();
    month.setMonth(month.getMonth() - i);
    month.setDate(1);
    const nextMonth = new Date(month);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const monthUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: month,
          lt: nextMonth,
        },
      },
    });

    usersByMonth.push({
      month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      count: monthUsers,
    });
  }

  // Top tenants by user count
  const tenants = await prisma.tenant.findMany({
    include: {
      _count: {
        select: { users: true },
      },
    },
    orderBy: {
      users: {
        _count: 'desc',
      },
    },
    take: 10,
  });

  const usersByTenant = tenants.map(t => ({
    tenantName: t.name,
    userCount: t._count.users,
  }));

  return {
    totalUsers,
    activeUsers,
    newUsersThisMonth,
    averageUsersPerTenant,
    usersByMonth,
    usersByTenant,
  };
}

/**
 * Get overall admin dashboard stats
 */
export async function getAdminDashboardStats() {
  const [revenueStats, tenantStats, userStats] = await Promise.all([
    getRevenueStats(),
    getTenantStats(),
    getUserStats(),
  ]);

  return {
    revenue: revenueStats,
    tenants: tenantStats,
    users: userStats,
  };
}
