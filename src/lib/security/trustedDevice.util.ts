// Trusted Device Utility (Task 33)
// Device recognition and trust management

import { prisma } from '@/lib/prisma';
import { UAParser } from 'ua-parser-js';

export interface DeviceInfo {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceType: string;
  deviceModel?: string;
  fingerprint: string;
}

/**
 * Parse user agent and extract device information
 */
export function parseDeviceInfo(userAgent: string): DeviceInfo {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  const info: DeviceInfo = {
    browser: result.browser.name || 'Unknown',
    browserVersion: result.browser.version || '',
    os: result.os.name || 'Unknown',
    osVersion: result.os.version || '',
    deviceType: result.device.type || 'desktop',
    deviceModel: result.device.model,
    fingerprint: generateFingerprint(result),
  };

  return info;
}

/**
 * Generate device fingerprint from parsed info
 */
function generateFingerprint(deviceInfo: any): string {
  const components = [
    deviceInfo.browser?.name || '',
    deviceInfo.browser?.version || '',
    deviceInfo.os?.name || '',
    deviceInfo.os?.version || '',
    deviceInfo.device?.model || 'desktop',
    deviceInfo.device?.type || 'desktop',
  ].join('|');

  // Simple hash
  let hash = 0;
  for (let i = 0; i < components.length; i++) {
    const char = components.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  return Math.abs(hash).toString(36);
}

/**
 * Check if device is trusted
 */
export async function isDeviceTrusted(userId: string, fingerprint: string): Promise<boolean> {
  const device = await prisma.trustedDevice.findFirst({
    where: {
      userId,
      deviceFingerprint: fingerprint,
      isRevoked: false,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
  });

  return !!device;
}

/**
 * Add device to trusted list
 */
export async function addTrustedDevice(
  userId: string,
  userAgent: string,
  ipAddress: string,
  deviceName?: string
) {
  const deviceInfo = parseDeviceInfo(userAgent);

  const trustedDevice = await prisma.trustedDevice.create({
    data: {
      userId,
      deviceFingerprint: deviceInfo.fingerprint,
      deviceName: deviceName || `${deviceInfo.browser} on ${deviceInfo.os}`,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      ipAddress,
      lastUsedAt: new Date(),
    },
  });

  return trustedDevice;
}

/**
 * Get all trusted devices for user
 */
export async function getTrustedDevices(userId: string) {
  return prisma.trustedDevice.findMany({
    where: { userId },
    orderBy: { lastUsedAt: 'desc' },
  });
}

/**
 * Remove trusted device
 */
export async function removeTrustedDevice(deviceId: string, userId: string) {
  return prisma.trustedDevice.update({
    where: { id: deviceId, userId },
    data: { isRevoked: true },
  });
}

/**
 * Update device last used timestamp
 */
export async function updateTrustedDeviceLastUsed(deviceId: string) {
  return prisma.trustedDevice.update({
    where: { id: deviceId },
    data: { lastUsedAt: new Date() },
  });
}

/**
 * Get device by fingerprint
 */
export async function getDeviceByFingerprint(userId: string, fingerprint: string) {
  return prisma.trustedDevice.findFirst({
    where: {
      userId,
      deviceFingerprint: fingerprint,
      isRevoked: false,
    },
  });
}
