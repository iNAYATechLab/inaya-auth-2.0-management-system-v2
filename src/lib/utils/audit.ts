// Audit Logger Utility

import { prisma } from '@/lib/prisma';
import type { AuditAction } from '@prisma/client';

interface AuditLogParams {
  userId: string;
  action: AuditAction;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

/**
 * Create an audit log entry
 */
export async function logAction(params: AuditLogParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        description: params.description,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
        metadata: params.metadata || null,
      },
    });
  } catch (error) {
    // Don't throw error, just log it
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Get audit logs for a user
 */
export async function getUserAuditLogs(userId: string, limit: number = 50) {
  return prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Get all audit logs (admin only)
 */
export async function getAllAuditLogs(
  page: number = 1,
  limit: number = 20,
  filters?: {
    action?: AuditAction;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }
) {
  const where: any = {};

  if (filters?.action) {
    where.action = filters.action;
  }

  if (filters?.userId) {
    where.userId = filters.userId;
  }

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate;
    }
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}
