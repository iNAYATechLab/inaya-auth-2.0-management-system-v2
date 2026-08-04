// Central Security Settings Utility (Task 34)
// Meta Accounts Center style centralized security settings

import { prisma } from '@/lib/prisma';

export interface SecuritySettingsInput {
  loginAlertsEnabled?: boolean;
  trustedDevicesEnabled?: boolean;
  proactiveProtection?: boolean;
  suspiciousLoginDetection?: boolean;
  locationBasedSecurity?: boolean;
  deviceRecognition?: boolean;
  automaticLockout?: boolean;
  maxFailedAttempts?: number;
  lockoutDuration?: number;
  sessionTimeout?: number;
  require2FAForTrusted?: boolean;
  notifyOnNewDevice?: boolean;
  notifyOnNewLocation?: boolean;
  allowedCountries?: string[];
  blockedIPs?: string[];
}

/**
 * Get or create security settings for user
 */
export async function getSecuritySettings(userId: string) {
  let settings = await prisma.securitySettings.findUnique({
    where: { userId },
  });

  // Create default settings if not exists
  if (!settings) {
    settings = await prisma.securitySettings.create({
      data: { userId },
    });
  }

  return settings;
}

/**
 * Update security settings
 */
export async function updateSecuritySettings(userId: string, input: SecuritySettingsInput) {
  const settings = await getSecuritySettings(userId);

  const updated = await prisma.securitySettings.update({
    where: { userId },
    data: {
      loginAlertsEnabled: input.loginAlertsEnabled ?? settings.loginAlertsEnabled,
      trustedDevicesEnabled: input.trustedDevicesEnabled ?? settings.trustedDevicesEnabled,
      proactiveProtection: input.proactiveProtection ?? settings.proactiveProtection,
      suspiciousLoginDetection:
        input.suspiciousLoginDetection ?? settings.suspiciousLoginDetection,
      locationBasedSecurity: input.locationBasedSecurity ?? settings.locationBasedSecurity,
      deviceRecognition: input.deviceRecognition ?? settings.deviceRecognition,
      automaticLockout: input.automaticLockout ?? settings.automaticLockout,
      maxFailedAttempts: input.maxFailedAttempts ?? settings.maxFailedAttempts,
      lockoutDuration: input.lockoutDuration ?? settings.lockoutDuration,
      sessionTimeout: input.sessionTimeout ?? settings.sessionTimeout,
      require2FAForTrusted: input.require2FAForTrusted ?? settings.require2FAForTrusted,
      notifyOnNewDevice: input.notifyOnNewDevice ?? settings.notifyOnNewDevice,
      notifyOnNewLocation: input.notifyOnNewLocation ?? settings.notifyOnNewLocation,
      allowedCountries: input.allowedCountries
        ? JSON.parse(JSON.stringify(input.allowedCountries))
        : settings.allowedCountries,
      blockedIPs: input.blockedIPs
        ? JSON.parse(JSON.stringify(input.blockedIPs))
        : settings.blockedIPs,
    },
  });

  return updated;
}

/**
 * Apply security preset (quick setup)
 */
export async function applySecurityPreset(userId: string, preset: 'basic' | 'standard' | 'strict') {
  const presets = {
    basic: {
      loginAlertsEnabled: true,
      trustedDevicesEnabled: false,
      proactiveProtection: false,
      suspiciousLoginDetection: false,
      locationBasedSecurity: false,
      deviceRecognition: false,
      automaticLockout: false,
      maxFailedAttempts: 10,
      lockoutDuration: 5,
      sessionTimeout: 60,
      require2FAForTrusted: false,
      notifyOnNewDevice: true,
      notifyOnNewLocation: false,
    },
    standard: {
      loginAlertsEnabled: true,
      trustedDevicesEnabled: true,
      proactiveProtection: true,
      suspiciousLoginDetection: true,
      locationBasedSecurity: true,
      deviceRecognition: true,
      automaticLockout: true,
      maxFailedAttempts: 5,
      lockoutDuration: 15,
      sessionTimeout: 30,
      require2FAForTrusted: false,
      notifyOnNewDevice: true,
      notifyOnNewLocation: true,
    },
    strict: {
      loginAlertsEnabled: true,
      trustedDevicesEnabled: true,
      proactiveProtection: true,
      suspiciousLoginDetection: true,
      locationBasedSecurity: true,
      deviceRecognition: true,
      automaticLockout: true,
      maxFailedAttempts: 3,
      lockoutDuration: 30,
      sessionTimeout: 15,
      require2FAForTrusted: true,
      notifyOnNewDevice: true,
      notifyOnNewLocation: true,
    },
  };

  return updateSecuritySettings(userId, presets[preset]);
}

/**
 * Add IP to blocked list
 */
export async function blockIP(userId: string, ipAddress: string) {
  const settings = await getSecuritySettings(userId);
  const blockedIPs = (settings.blockedIPs as string[]) || [];

  if (!blockedIPs.includes(ipAddress)) {
    blockedIPs.push(ipAddress);
    await prisma.securitySettings.update({
      where: { userId },
      data: { blockedIPs: JSON.parse(JSON.stringify(blockedIPs)) },
    });
  }

  return blockedIPs;
}

/**
 * Remove IP from blocked list
 */
export async function unblockIP(userId: string, ipAddress: string) {
  const settings = await getSecuritySettings(userId);
  const blockedIPs = ((settings.blockedIPs as string[]) || []).filter(
    (ip) => ip !== ipAddress
  );

  await prisma.securitySettings.update({
    where: { userId },
    data: { blockedIPs: JSON.parse(JSON.stringify(blockedIPs)) },
  });

  return blockedIPs;
}

/**
 * Add country to allowed list
 */
export async function addAllowedCountry(userId: string, countryCode: string) {
  const settings = await getSecuritySettings(userId);
  const allowedCountries = (settings.allowedCountries as string[]) || [];

  if (!allowedCountries.includes(countryCode)) {
    allowedCountries.push(countryCode);
    await prisma.securitySettings.update({
      where: { userId },
      data: { allowedCountries: JSON.parse(JSON.stringify(allowedCountries)) },
    });
  }

  return allowedCountries;
}

/**
 * Remove country from allowed list
 */
export async function removeAllowedCountry(userId: string, countryCode: string) {
  const settings = await getSecuritySettings(userId);
  const allowedCountries = ((settings.allowedCountries as string[]) || []).filter(
    (code) => code !== countryCode
  );

  await prisma.securitySettings.update({
    where: { userId },
    data: { allowedCountries: JSON.parse(JSON.stringify(allowedCountries)) },
  });

  return allowedCountries;
}
