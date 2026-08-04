// Security Checkup Utility (Task 31)
// Calculates security score and provides recommendations

import { prisma } from '@/lib/prisma';

export interface SecurityCheck {
  id: string;
  title: string;
  description: string;
  status: 'pass' | 'fail' | 'warning';
  severity: 'critical' | 'high' | 'medium' | 'low';
  recommendation?: string;
  fixUrl?: string;
}

export interface SecurityScoreResult {
  score: number;
  grade: string;
  checks: SecurityCheck[];
  recommendations: Array<{
    priority: number;
    title: string;
    description: string;
    action: string;
    fixUrl: string;
  }>;
}

/**
 * Perform comprehensive security checkup
 */
export async function performSecurityCheckup(userId: string): Promise<SecurityScoreResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      twoFactorAuth: true,
      passkeys: true,
      accounts: true,
      trustedDevices: {
        where: { isRevoked: false },
      },
      securitySettings: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const checks: SecurityCheck[] = [];

  // Check 1: Two-Factor Authentication
  checks.push({
    id: '2fa_enabled',
    title: 'Two-Factor Authentication',
    description: user.twoFactorAuth?.isEnabled
      ? '2FA is enabled and protecting your account'
      : '2FA is not enabled',
    status: user.twoFactorAuth?.isEnabled ? 'pass' : 'fail',
    severity: 'critical',
    recommendation: user.twoFactorAuth?.isEnabled
      ? undefined
      : 'Enable two-factor authentication to add an extra layer of security',
    fixUrl: '/security',
  });

  // Check 2: Email Verified
  checks.push({
    id: 'email_verified',
    title: 'Email Verification',
    description: user.emailVerified
      ? 'Your email address is verified'
      : 'Your email address is not verified',
    status: user.emailVerified ? 'pass' : 'fail',
    severity: 'high',
    recommendation: user.emailVerified
      ? undefined
      : 'Verify your email address to secure your account',
    fixUrl: '/profile',
  });

  // Check 3: Backup Email
  checks.push({
    id: 'backup_email',
    title: 'Backup Email',
    description: user.backupEmail
      ? 'Backup email is configured for account recovery'
      : 'No backup email configured',
    status: user.backupEmail ? 'pass' : 'warning',
    severity: 'medium',
    recommendation: user.backupEmail
      ? undefined
      : 'Add a backup email address for account recovery',
    fixUrl: '/profile',
  });

  // Check 4: Phone Verified
  checks.push({
    id: 'phone_verified',
    title: 'Phone Verification',
    description: user.phoneVerified
      ? 'Your phone number is verified'
      : 'Your phone number is not verified',
    status: user.phoneVerified ? 'pass' : 'warning',
    severity: 'medium',
    recommendation: user.phoneVerified
      ? undefined
      : 'Verify your phone number for additional security and recovery options',
    fixUrl: '/verify-phone',
  });

  // Check 5: Passkeys
  checks.push({
    id: 'passkeys',
    title: 'Passkeys (Passwordless)',
    description: user.passkeys.length > 0
      ? `${user.passkeys.length} passkey(s) configured`
      : 'No passkeys configured',
    status: user.passkeys.length > 0 ? 'pass' : 'warning',
    severity: 'low',
    recommendation: user.passkeys.length > 0
      ? undefined
      : 'Add passkeys for secure, passwordless authentication',
    fixUrl: '/passkeys',
  });

  // Check 6: Connected Social Accounts
  const hasSocial = user.accounts.some((acc) => acc.type === 'oauth');
  checks.push({
    id: 'social_accounts',
    title: 'Connected Accounts',
    description: hasSocial
      ? `${user.accounts.filter((a) => a.type === 'oauth').length} social account(s) connected`
      : 'No social accounts connected',
    status: hasSocial ? 'pass' : 'warning',
    severity: 'low',
    recommendation: hasSocial
      ? undefined
      : 'Connect social accounts for easier login options',
    fixUrl: '/connected-accounts',
  });

  // Check 7: Trusted Devices
  checks.push({
    id: 'trusted_devices',
    title: 'Trusted Devices',
    description: user.trustedDevices.length > 0
      ? `${user.trustedDevices.length} trusted device(s) configured`
      : 'No trusted devices configured',
    status: user.trustedDevices.length > 0 ? 'pass' : 'warning',
    severity: 'low',
    recommendation: user.trustedDevices.length > 0
      ? undefined
      : 'Mark your personal devices as trusted for enhanced security',
    fixUrl: '/security',
  });

  // Check 8: Strong Password
  checks.push({
    id: 'strong_password',
    title: 'Strong Password',
    description: user.password
      ? 'Account has a password set'
      : 'No password set (OAuth only)',
    status: user.password ? 'pass' : 'warning',
    severity: 'medium',
    recommendation: user.password
      ? undefined
      : 'Set a strong password or ensure you have alternative login methods',
    fixUrl: '/change-password',
  });

  // Check 9: Recent Activity Review
  const recentLogin = await prisma.auditLog.findFirst({
    where: {
      userId,
      action: 'LOGIN',
    },
    orderBy: { createdAt: 'desc' },
  });

  checks.push({
    id: 'recent_activity',
    title: 'Recent Activity',
    description: recentLogin
      ? `Last login: ${recentLogin.createdAt.toLocaleDateString()}`
      : 'No recent login activity',
    status: recentLogin ? 'pass' : 'warning',
    severity: 'low',
  });

  // Check 10: Proactive Protection
  const settings = user.securitySettings;
  checks.push({
    id: 'proactive_protection',
    title: 'Proactive Protection',
    description: settings?.proactiveProtection
      ? 'Proactive protection is enabled'
      : 'Proactive protection is not enabled',
    status: settings?.proactiveProtection !== false ? 'pass' : 'fail',
    severity: 'high',
    recommendation: settings?.proactiveProtection === false
      ? 'Enable proactive protection for 24/7 security monitoring'
      : undefined,
    fixUrl: '/security-settings',
  });

  // Calculate security score
  const totalChecks = checks.length;
  const passedChecks = checks.filter((c) => c.status === 'pass').length;
  const score = Math.round((passedChecks / totalChecks) * 100);

  // Determine grade
  let grade: string;
  if (score >= 90) grade = 'A+';
  else if (score >= 80) grade = 'A';
  else if (score >= 70) grade = 'B';
  else if (score >= 60) grade = 'C';
  else if (score >= 50) grade = 'D';
  else grade = 'F';

  // Generate recommendations sorted by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const recommendations = checks
    .filter((c) => c.status !== 'pass' && c.recommendation)
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
    .map((c, i) => ({
      priority: i + 1,
      title: c.title,
      description: c.recommendation!,
      action: `Fix ${c.title}`,
      fixUrl: c.fixUrl || '/security',
    }));

  // Save checkup result
  await prisma.securityCheckup.create({
    data: {
      userId,
      securityScore: score,
      checklist: JSON.parse(JSON.stringify(checks)),
      recommendations: JSON.parse(JSON.stringify(recommendations)),
    },
  });

  return {
    score,
    grade,
    checks,
    recommendations,
  };
}

/**
 * Get latest security checkup for user
 */
export async function getLatestSecurityCheckup(userId: string) {
  return prisma.securityCheckup.findFirst({
    where: { userId },
    orderBy: { lastCheckedAt: 'desc' },
  });
}
