// Security Server Actions (Tasks 31-34)
// Meta/Facebook-style security features

'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import {
  performSecurityCheckup,
  getLatestSecurityCheckup,
} from '@/lib/security/securityCheckup.util';
import {
  assessLoginRisk,
  getUnrecognizedAlerts,
  acknowledgeLoginAlert,
  trustDeviceFromAlert,
} from '@/lib/security/loginAlert.util';
import {
  parseDeviceInfo,
  getTrustedDevices,
  addTrustedDevice,
  removeTrustedDevice,
} from '@/lib/security/trustedDevice.util';
import {
  getProtectionEvents,
  resolveProtectionEvent,
} from '@/lib/security/proactiveProtection.util';
import {
  getSecuritySettings,
  updateSecuritySettings,
  applySecurityPreset,
  blockIP,
  unblockIP,
  type SecuritySettingsInput,
} from '@/lib/security/securitySettings.util';

// ─── Task 31: Security Checkup ──────────────────────────────────────────────

export async function runSecurityCheckupAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    const result = await performSecurityCheckup(session.user.id);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Security checkup error:', error);
    return { error: 'Failed to run security checkup' };
  }
}

export async function getSecurityCheckupAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    const checkup = await getLatestSecurityCheckup(session.user.id);

    return {
      success: true,
      data: checkup,
    };
  } catch (error) {
    console.error('Get security checkup error:', error);
    return { error: 'Failed to get security checkup' };
  }
}

// ─── Task 32: Login Alerts ──────────────────────────────────────────────────

export async function getLoginAlertsAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    const alerts = await getUnrecognizedAlerts(session.user.id);

    return {
      success: true,
      data: alerts,
    };
  } catch (error) {
    console.error('Get login alerts error:', error);
    return { error: 'Failed to get login alerts' };
  }
}

export async function acknowledgeAlertAction(alertId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    await acknowledgeLoginAlert(alertId, session.user.id);

    return {
      success: true,
      message: 'Alert acknowledged',
    };
  } catch (error) {
    console.error('Acknowledge alert error:', error);
    return { error: 'Failed to acknowledge alert' };
  }
}

export async function trustDeviceFromAlertAction(alertId: string, deviceName?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    const device = await trustDeviceFromAlert(alertId, session.user.id, deviceName);

    revalidatePath('/security');

    return {
      success: true,
      data: device,
      message: 'Device marked as trusted',
    };
  } catch (error) {
    console.error('Trust device error:', error);
    return { error: 'Failed to trust device' };
  }
}

// ─── Task 33: Trusted Devices ───────────────────────────────────────────────

export async function getTrustedDevicesAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    const devices = await getTrustedDevices(session.user.id);

    return {
      success: true,
      data: devices,
    };
  } catch (error) {
    console.error('Get trusted devices error:', error);
    return { error: 'Failed to get trusted devices' };
  }
}

export async function removeTrustedDeviceAction(deviceId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    await removeTrustedDevice(deviceId, session.user.id);

    revalidatePath('/security');

    return {
      success: true,
      message: 'Device removed from trusted list',
    };
  } catch (error) {
    console.error('Remove trusted device error:', error);
    return { error: 'Failed to remove trusted device' };
  }
}

// ─── Task 33: Proactive Protection ──────────────────────────────────────────

export async function getProtectionEventsAction(limit: number = 20) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    const events = await getProtectionEvents(session.user.id, limit);

    return {
      success: true,
      data: events,
    };
  } catch (error) {
    console.error('Get protection events error:', error);
    return { error: 'Failed to get protection events' };
  }
}

export async function resolveProtectionEventAction(eventId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    await resolveProtectionEvent(eventId, session.user.id);

    return {
      success: true,
      message: 'Event resolved',
    };
  } catch (error) {
    console.error('Resolve protection event error:', error);
    return { error: 'Failed to resolve event' };
  }
}

// ─── Task 34: Central Security Settings ─────────────────────────────────────

export async function getSecuritySettingsAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    const settings = await getSecuritySettings(session.user.id);

    return {
      success: true,
      data: settings,
    };
  } catch (error) {
    console.error('Get security settings error:', error);
    return { error: 'Failed to get security settings' };
  }
}

export async function updateSecuritySettingsAction(input: SecuritySettingsInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    const settings = await updateSecuritySettings(session.user.id, input);

    revalidatePath('/security-settings');

    return {
      success: true,
      data: settings,
      message: 'Security settings updated',
    };
  } catch (error) {
    console.error('Update security settings error:', error);
    return { error: 'Failed to update security settings' };
  }
}

export async function applySecurityPresetAction(preset: 'basic' | 'standard' | 'strict') {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    const settings = await applySecurityPreset(session.user.id, preset);

    revalidatePath('/security-settings');

    return {
      success: true,
      data: settings,
      message: `Security preset "${preset}" applied`,
    };
  } catch (error) {
    console.error('Apply security preset error:', error);
    return { error: 'Failed to apply security preset' };
  }
}

export async function blockIPAction(ipAddress: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    const blockedIPs = await blockIP(session.user.id, ipAddress);

    revalidatePath('/security-settings');

    return {
      success: true,
      data: blockedIPs,
      message: 'IP address blocked',
    };
  } catch (error) {
    console.error('Block IP error:', error);
    return { error: 'Failed to block IP' };
  }
}

export async function unblockIPAction(ipAddress: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    const blockedIPs = await unblockIP(session.user.id, ipAddress);

    revalidatePath('/security-settings');

    return {
      success: true,
      data: blockedIPs,
      message: 'IP address unblocked',
    };
  } catch (error) {
    console.error('Unblock IP error:', error);
    return { error: 'Failed to unblock IP' };
  }
}
