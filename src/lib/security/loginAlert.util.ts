// Login Alert Utility (Task 32)
// Detects suspicious logins from unknown devices/locations

import { prisma } from '@/lib/prisma';
import { UAParser } from 'ua-parser-js';

export interface LoginAlertData {
  userId: string;
  ipAddress: string;
  userAgent: string;
  location?: {
    country: string;
    city: string;
    region: string;
    latitude?: number;
    longitude?: number;
  };
}

export interface RiskAssessment {
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  score: number; // 0-100, higher = more risky
}

/**
 * Assess login risk based on various factors
 */
export async function assessLoginRisk(data: LoginAlertData): Promise<RiskAssessment> {
  const { userId, ipAddress, userAgent, location } = data;

  const factors: string[] = [];
  let riskScore = 0;

  // Get user's security settings
  const securitySettings = await prisma.securitySettings.findUnique({
    where: { userId },
  });

  // Get user's trusted devices
  const trustedDevices = await prisma.trustedDevice.findMany({
    where: {
      userId,
      isRevoked: false,
    },
  });

  // Parse user agent
  const parser = new UAParser(userAgent);
  const deviceInfo = parser.getResult();
  const deviceFingerprint = generateDeviceFingerprint(deviceInfo);

  // Check 1: Is this a trusted device?
  const isTrustedDevice = trustedDevices.some(
    (d) => d.deviceFingerprint === deviceFingerprint
  );

  if (!isTrustedDevice && securitySettings?.trustedDevicesEnabled) {
    factors.push('Unrecognized device');
    riskScore += 30;
  }

  // Check 2: Get previous login locations
  const previousLogins = await prisma.loginAlert.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  // Check 3: Location analysis
  if (location && previousLogins.length > 0) {
    const previousLocations = previousLogins
      .map((l) => (l.location as any)?.country)
      .filter(Boolean);

    const uniqueCountries = [...new Set(previousLocations)];

    // New country
    if (uniqueCountries.length > 0 && !uniqueCountries.includes(location.country)) {
      factors.push(`Login from new country: ${location.country}`);
      riskScore += 40;
    }

    // Allowed countries check
    if (
      securitySettings?.allowedCountries &&
      Array.isArray(securitySettings.allowedCountries) &&
      (securitySettings.allowedCountries as string[]).length > 0 &&
      !(securitySettings.allowedCountries as string[]).includes(location.country)
    ) {
      factors.push(`Login from non-allowed country: ${location.country}`);
      riskScore += 50;
    }
  }

  // Check 4: IP address analysis
  const previousIPs = await prisma.loginAlert.findMany({
    where: { userId, ipAddress },
    take: 1,
  });

  if (previousIPs.length === 0) {
    factors.push('New IP address');
    riskScore += 20;
  }

  // Check 5: Rapid login attempts
  const recentAttempts = await prisma.loginAlert.count({
    where: {
      userId,
      createdAt: {
        gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
      },
    },
  });

  if (recentAttempts > 3) {
    factors.push('Multiple login attempts in short time');
    riskScore += 30;
  }

  // Check 6: Unusual time (optional - requires user's typical login times)
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 5) {
    factors.push('Login during unusual hours');
    riskScore += 10;
  }

  // Determine risk level
  let level: 'low' | 'medium' | 'high' | 'critical';
  if (riskScore < 20) {
    level = 'low';
  } else if (riskScore < 40) {
    level = 'medium';
  } else if (riskScore < 60) {
    level = 'high';
  } else {
    level = 'critical';
  }

  return {
    level,
    factors,
    score: riskScore,
  };
}

/**
 * Create login alert
 */
export async function createLoginAlert(data: LoginAlertData, risk: RiskAssessment) {
  const parser = new UAParser(data.userAgent);
  const deviceInfo = parser.getResult();

  const alert = await prisma.loginAlert.create({
    data: {
      userId: data.userId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      deviceInfo: {
        browser: deviceInfo.browser.name || 'Unknown',
        browserVersion: deviceInfo.browser.version || '',
        os: deviceInfo.os.name || 'Unknown',
        osVersion: deviceInfo.os.version || '',
        device: deviceInfo.device.model || 'Desktop',
        deviceType: deviceInfo.device.type || 'desktop',
      },
      location: data.location || {},
      riskLevel: risk.level,
      riskFactors: risk.factors,
      isRecognized: risk.level === 'low',
    },
  });

  return alert;
}

/**
 * Get unrecognized login alerts for user
 */
export async function getUnrecognizedAlerts(userId: string) {
  return prisma.loginAlert.findMany({
    where: {
      userId,
      isRecognized: false,
      isAcknowledged: false,
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
}

/**
 * Acknowledge login alert
 */
export async function acknowledgeLoginAlert(alertId: string, userId: string) {
  return prisma.loginAlert.update({
    where: { id: alertId, userId },
    data: { isAcknowledged: true },
  });
}

/**
 * Mark device as trusted from alert
 */
export async function trustDeviceFromAlert(alertId: string, userId: string, deviceName?: string) {
  const alert = await prisma.loginAlert.findUnique({
    where: { id: alertId, userId },
  });

  if (!alert) {
    throw new Error('Alert not found');
  }

  const parser = new UAParser(alert.userAgent);
  const deviceInfo = parser.getResult();
  const deviceFingerprint = generateDeviceFingerprint(deviceInfo);

  const trustedDevice = await prisma.trustedDevice.create({
    data: {
      userId,
      deviceFingerprint,
      deviceName: deviceName || `${deviceInfo.browser.name} on ${deviceInfo.os.name}`,
      browser: deviceInfo.browser.name || 'Unknown',
      os: deviceInfo.os.name || 'Unknown',
      ipAddress: alert.ipAddress,
    },
  });

  // Mark alert as recognized
  await prisma.loginAlert.update({
    where: { id: alertId },
    data: { isRecognized: true },
  });

  return trustedDevice;
}

/**
 * Generate device fingerprint from device info
 */
function generateDeviceFingerprint(deviceInfo: any): string {
  const components = [
    deviceInfo.browser?.name || '',
    deviceInfo.browser?.version || '',
    deviceInfo.os?.name || '',
    deviceInfo.os?.version || '',
    deviceInfo.device?.model || 'desktop',
    deviceInfo.device?.type || 'desktop',
  ].join('|');

  // Simple hash (in production, use a proper hashing library)
  let hash = 0;
  for (let i = 0; i < components.length; i++) {
    const char = components.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return Math.abs(hash).toString(36);
}
