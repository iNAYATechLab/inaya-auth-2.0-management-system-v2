// Proactive Protection Utility (Task 33)
// 24/7 proactive security monitoring and threat detection

import { prisma } from '@/lib/prisma';
import { assessLoginRisk, createLoginAlert, type LoginAlertData } from './loginAlert.util';

export interface ProtectionEvent {
  userId: string;
  type: 'suspicious_login' | 'brute_force' | 'unusual_activity' | 'ip_blocked' | 'account_lockout';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log proactive protection event
 */
export async function logProtectionEvent(event: ProtectionEvent) {
  const protection = await prisma.proactiveProtection.create({
    data: {
      userId: event.userId,
      eventType: event.type,
      severity: event.severity,
      action: determineAction(event),
      details: event.details,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
    },
  });

  return protection;
}

/**
 * Determine action based on event type and severity
 */
function determineAction(event: ProtectionEvent): string {
  if (event.severity === 'critical') {
    return 'blocked';
  } else if (event.severity === 'high') {
    return 'warned';
  } else if (event.severity === 'medium') {
    return 'logged';
  }
  return 'monitored';
}

/**
 * Check for brute force attacks
 */
export async function checkBruteForce(userId: string, ipAddress: string): Promise<{
  isBruteForce: boolean;
  attempts: number;
  lockout: boolean;
}> {
  // Count failed login attempts in last 15 minutes
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  const failedAttempts = await prisma.auditLog.count({
    where: {
      userId,
      action: 'FAILED_LOGIN',
      createdAt: {
        gte: fifteenMinutesAgo,
      },
    },
  });

  // Get user's security settings
  const settings = await prisma.securitySettings.findUnique({
    where: { userId },
  });

  const maxAttempts = settings?.maxFailedAttempts || 5;
  const lockoutDuration = settings?.lockoutDuration || 15;

  const isBruteForce = failedAttempts >= maxAttempts;

  if (isBruteForce && settings?.automaticLockout) {
    // Log protection event
    await logProtectionEvent({
      userId,
      type: 'brute_force',
      severity: 'high',
      details: {
        attempts: failedAttempts,
        maxAllowed: maxAttempts,
        lockoutDuration,
      },
      ipAddress,
    });
  }

  return {
    isBruteForce,
    attempts: failedAttempts,
    lockout: isBruteForce && !!settings?.automaticLockout,
  };
}

/**
 * Monitor for unusual activity patterns
 */
export async function monitorUnusualActivity(userId: string, data: LoginAlertData) {
  const { ipAddress, userAgent, location } = data;

  // Get recent activity
  const recentActivity = await prisma.loginAlert.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const unusualFactors: string[] = [];

  // Check for impossible travel (login from two distant locations in short time)
  if (location && recentActivity.length > 0) {
    const lastLogin = recentActivity[0];
    const lastLocation = lastLogin.location as any;

    if (lastLocation?.country && location.country !== lastLocation.country) {
      const timeDiff = Date.now() - lastLogin.createdAt.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      // If login from different country within 2 hours, flag as suspicious
      if (hoursDiff < 2) {
        unusualFactors.push(`Impossible travel: ${lastLocation.country} → ${location.country} in ${hoursDiff.toFixed(1)} hours`);
      }
    }
  }

  // Check for multiple devices in short time
  const recentDevices = new Set(
    recentActivity
      .filter((a) => Date.now() - a.createdAt.getTime() < 60 * 60 * 1000) // Last hour
      .map((a) => (a.deviceInfo as any)?.browser + (a.deviceInfo as any)?.os)
  );

  if (recentDevices.size > 3) {
    unusualFactors.push(`Multiple devices (${recentDevices.size}) in last hour`);
  }

  // If unusual activity detected, log it
  if (unusualFactors.length > 0) {
    await logProtectionEvent({
      userId,
      type: 'unusual_activity',
      severity: 'medium',
      details: {
        factors: unusualFactors,
        currentIp: ipAddress,
        currentLocation: location,
      },
      ipAddress,
      userAgent,
    });
  }

  return unusualFactors;
}

/**
 * Check if IP is blocked
 */
export async function isIPBlocked(userId: string, ipAddress: string): Promise<boolean> {
  const settings = await prisma.securitySettings.findUnique({
    where: { userId },
  });

  if (!settings?.blockedIPs || !Array.isArray(settings.blockedIPs)) {
    return false;
  }

  return (settings.blockedIPs as string[]).includes(ipAddress);
}

/**
 * Perform comprehensive login security check
 */
export async function performLoginSecurityCheck(data: LoginAlertData) {
  const { userId, ipAddress } = data;

  // Check 1: Is IP blocked?
  if (await isIPBlocked(userId, ipAddress)) {
    await logProtectionEvent({
      userId,
      type: 'ip_blocked',
      severity: 'critical',
      details: { ipAddress },
      ipAddress,
      userAgent: data.userAgent,
    });

    return {
      allowed: false,
      reason: 'IP address is blocked',
      action: 'blocked',
    };
  }

  // Check 2: Brute force detection
  const bruteForceCheck = await checkBruteForce(userId, ipAddress);
  if (bruteForceCheck.lockout) {
    return {
      allowed: false,
      reason: `Account locked due to ${bruteForceCheck.attempts} failed attempts`,
      action: 'locked',
    };
  }

  // Check 3: Risk assessment
  const risk = await assessLoginRisk(data);

  // Check 4: Monitor unusual activity
  const unusualFactors = await monitorUnusualActivity(userId, data);

  // Check 5: Create login alert
  await createLoginAlert(data, risk);

  // Determine if login should be allowed
  if (risk.level === 'critical') {
    await logProtectionEvent({
      userId,
      type: 'suspicious_login',
      severity: 'critical',
      details: {
        riskFactors: risk.factors,
        unusualFactors,
        riskScore: risk.score,
      },
      ipAddress,
      userAgent: data.userAgent,
    });

    return {
      allowed: false,
      reason: 'High-risk login detected',
      action: 'blocked',
      risk,
    };
  }

  if (risk.level === 'high' || unusualFactors.length > 0) {
    await logProtectionEvent({
      userId,
      type: 'suspicious_login',
      severity: risk.level === 'high' ? 'high' : 'medium',
      details: {
        riskFactors: risk.factors,
        unusualFactors,
        riskScore: risk.score,
      },
      ipAddress,
      userAgent: data.userAgent,
    });
  }

  return {
    allowed: true,
    action: 'allowed',
    risk,
    unusualFactors,
  };
}

/**
 * Get recent protection events for user
 */
export async function getProtectionEvents(userId: string, limit: number = 20) {
  return prisma.proactiveProtection.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Resolve protection event
 */
export async function resolveProtectionEvent(eventId: string, userId: string) {
  return prisma.proactiveProtection.update({
    where: { id: eventId, userId },
    data: {
      resolved: true,
      resolvedAt: new Date(),
    },
  });
}
