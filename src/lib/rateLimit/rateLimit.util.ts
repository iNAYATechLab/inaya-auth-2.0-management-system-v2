import { prisma } from '@/lib/prisma';
import { RateLimitType } from '@prisma/client';

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
  blockDuration?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limit: number;
  blocked?: boolean;
  blockedUntil?: Date;
}

// Default rate limit configurations
const DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
  // Auth endpoints - Strict limits
  [RateLimitType.IP_AUTH]: {
    maxRequests: 10,
    windowSeconds: 60, // 10 requests per minute
    blockDuration: 300, // Block for 5 minutes if exceeded
  },
  [RateLimitType.USER_AUTH]: {
    maxRequests: 20,
    windowSeconds: 60, // 20 requests per minute
    blockDuration: 600, // Block for 10 minutes
  },
  // API endpoints - Moderate limits
  [RateLimitType.USER_API]: {
    maxRequests: 100,
    windowSeconds: 60, // 100 requests per minute
  },
  [RateLimitType.TENANT_API]: {
    maxRequests: 1000,
    windowSeconds: 60, // 1000 requests per minute
  },
  // Global IP limit - Relaxed but protective
  [RateLimitType.IP_GLOBAL]: {
    maxRequests: 100,
    windowSeconds: 60, // 100 requests per minute
    blockDuration: 60, // Block for 1 minute
  },
  [RateLimitType.USER_GLOBAL]: {
    maxRequests: 500,
    windowSeconds: 60, // 500 requests per minute
  },
  [RateLimitType.ENDPOINT]: {
    maxRequests: 50,
    windowSeconds: 60, // 50 requests per minute
  },
};

/**
 * Get rate limit configuration for a type
 */
async function getConfig(type: RateLimitType): Promise<RateLimitConfig> {
  // Try to get from database first
  const config = await prisma.rateLimitConfig.findFirst({
    where: { type, isActive: true },
  });

  if (config) {
    return {
      maxRequests: config.maxRequests,
      windowSeconds: config.windowSeconds,
      blockDuration: config.blockDuration,
    };
  }

  // Fall back to defaults
  return DEFAULT_CONFIGS[type] || DEFAULT_CONFIGS[RateLimitType.IP_GLOBAL];
}

/**
 * Check and increment rate limit
 */
export async function checkRateLimit(
  key: string,
  type: RateLimitType
): Promise<RateLimitResult> {
  const config = await getConfig(type);
  const now = new Date();

  // Get or create rate limit record
  let rateLimit = await prisma.rateLimit.findUnique({
    where: {
      key_type: {
        key,
        type,
      },
    },
  });

  // If record doesn't exist or window has expired, create new window
  if (!rateLimit || rateLimit.windowEnd < now) {
    const windowEnd = new Date(now.getTime() + config.windowSeconds * 1000);
    
    rateLimit = await prisma.rateLimit.upsert({
      where: {
        key_type: {
          key,
          type,
        },
      },
      update: {
        count: 1,
        windowStart: now,
        windowEnd,
        blocked: false,
        blockedUntil: null,
      },
      create: {
        key,
        type,
        count: 1,
        windowStart: now,
        windowEnd,
        blocked: false,
        blockedUntil: null,
      },
    });

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: windowEnd,
      limit: config.maxRequests,
    };
  }

  // Check if currently blocked
  if (rateLimit.blocked && rateLimit.blockedUntil && rateLimit.blockedUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: rateLimit.blockedUntil,
      limit: config.maxRequests,
      blocked: true,
      blockedUntil: rateLimit.blockedUntil,
    };
  }

  // Check if limit exceeded
  if (rateLimit.count >= config.maxRequests) {
    // Block if configured
    if (config.blockDuration && config.blockDuration > 0) {
      const blockedUntil = new Date(now.getTime() + config.blockDuration * 1000);
      
      await prisma.rateLimit.update({
        where: {
          key_type: {
            key,
            type,
          },
        },
        data: {
          blocked: true,
          blockedUntil,
        },
      });

      return {
        allowed: false,
        remaining: 0,
        resetAt: blockedUntil,
        limit: config.maxRequests,
        blocked: true,
        blockedUntil,
      };
    }

    // Just deny without blocking
    return {
      allowed: false,
      remaining: 0,
      resetAt: rateLimit.windowEnd,
      limit: config.maxRequests,
    };
  }

  // Increment counter
  await prisma.rateLimit.update({
    where: {
      key_type: {
        key,
        type,
      },
    },
    data: {
      count: {
        increment: 1,
      },
    },
  });

  return {
    allowed: true,
    remaining: config.maxRequests - rateLimit.count - 1,
    resetAt: rateLimit.windowEnd,
    limit: config.maxRequests,
  };
}

/**
 * Get rate limit status without incrementing
 */
export async function getRateLimitStatus(
  key: string,
  type: RateLimitType
): Promise<{
  count: number;
  limit: number;
  remaining: number;
  resetAt: Date | null;
  blocked: boolean;
  blockedUntil: Date | null;
}> {
  const config = await getConfig(type);
  const now = new Date();

  const rateLimit = await prisma.rateLimit.findUnique({
    where: {
      key_type: {
        key,
        type,
      },
    },
  });

  if (!rateLimit) {
    return {
      count: 0,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      resetAt: null,
      blocked: false,
      blockedUntil: null,
    };
  }

  // If window expired, reset
  if (rateLimit.windowEnd < now) {
    return {
      count: 0,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      resetAt: null,
      blocked: false,
      blockedUntil: null,
    };
  }

  return {
    count: rateLimit.count,
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - rateLimit.count),
    resetAt: rateLimit.windowEnd,
    blocked: rateLimit.blocked,
    blockedUntil: rateLimit.blockedUntil,
  };
}

/**
 * Reset rate limit for a key
 */
export async function resetRateLimit(key: string, type: RateLimitType): Promise<void> {
  await prisma.rateLimit.deleteMany({
    where: {
      key,
      type,
    },
  });
}

/**
 * Get all rate limit statistics
 */
export async function getRateLimitStats() {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const stats = await prisma.rateLimit.groupBy({
    by: ['type'],
    where: {
      windowStart: {
        gte: oneHourAgo,
      },
    },
    _sum: {
      count: true,
    },
    _count: {
      _all: true,
    },
  });

  const blockedCount = await prisma.rateLimit.count({
    where: {
      blocked: true,
      blockedUntil: {
        gte: now,
      },
    },
  });

  return {
    byType: stats.map((stat) => ({
      type: stat.type,
      totalRequests: stat._sum.count || 0,
      uniqueKeys: stat._count._all,
    })),
    totalBlocked: blockedCount,
  };
}

/**
 * Clean up expired rate limits
 */
export async function cleanupExpiredRateLimits(): Promise<number> {
  const now = new Date();
  
  const { count } = await prisma.rateLimit.deleteMany({
    where: {
      windowEnd: {
        lt: now,
      },
      blocked: false,
    },
  });

  return count;
}
