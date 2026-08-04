/**
 * OTP Configuration Utilities (Task 48)
 * 
 * Super Admin can configure OTP delivery methods per tenant
 */

import { prisma } from '@/lib/prisma';

export type OTPDeliveryMethod = 'email' | 'sms' | 'whatsapp' | 'telegram';

export interface OTPTenantConfig {
  tenantId: string;
  allowedMethods: OTPDeliveryMethod[];
  defaultMethod: OTPDeliveryMethod;
  expiryMinutes: number;
  maxLength: number;
  rateLimit: number;
  resendCooldownSeconds: number;
  maxAttempts: number;
  lockoutDurationMinutes: number;
}

/**
 * Get OTP configuration for tenant
 */
export async function getOTPTenantConfig(tenantId: string): Promise<OTPTenantConfig> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  });

  const settings = (tenant?.settings as any) || {};
  const otpConfig = settings.otp || {};

  return {
    tenantId,
    allowedMethods: otpConfig.allowedMethods || ['email'],
    defaultMethod: otpConfig.defaultMethod || 'email',
    expiryMinutes: otpConfig.expiryMinutes || 10,
    maxLength: otpConfig.maxLength || 6,
    rateLimit: otpConfig.rateLimit || 5,
    resendCooldownSeconds: otpConfig.resendCooldownSeconds || 60,
    maxAttempts: otpConfig.maxAttempts || 5,
    lockoutDurationMinutes: otpConfig.lockoutDurationMinutes || 15,
  };
}

/**
 * Update OTP configuration for tenant
 */
export async function updateOTPTenantConfig(
  tenantId: string,
  config: Partial<OTPTenantConfig>
): Promise<{
  success: boolean;
  config?: OTPTenantConfig;
  error?: string;
}> {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });

    if (!tenant) {
      return { success: false, error: 'Tenant not found' };
    }

    const settings = (tenant.settings as any) || {};
    const currentOtpConfig = settings.otp || {};

    const newOtpConfig = {
      ...currentOtpConfig,
      ...config,
    };

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: {
          ...settings,
          otp: newOtpConfig,
        },
      },
    });

    return {
      success: true,
      config: {
        tenantId,
        ...newOtpConfig,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get global OTP configuration (Super Admin)
 */
export async function getGlobalOTPConfig() {
  const globalSettings = await prisma.globalCooldownSettings.findFirst();
  
  // Default global OTP config
  return {
    defaultAllowedMethods: ['email', 'sms'] as OTPDeliveryMethod[],
    defaultExpiryMinutes: 10,
    defaultMaxLength: 6,
    defaultRateLimit: 5,
    defaultResendCooldownSeconds: 60,
    defaultMaxAttempts: 5,
    defaultLockoutDurationMinutes: 15,
    
    // Provider configurations
    emailProvider: process.env.EMAIL_PROVIDER || 'resend',
    smsProvider: process.env.SMS_PROVIDER || 'dev-console',
    whatsappProvider: process.env.WHATSAPP_PROVIDER || 'dev-console',
    telegramBotToken: !!process.env.TELEGRAM_BOT_TOKEN,
  };
}

/**
 * Validate OTP method is allowed for tenant
 */
export async function isOTPMethodAllowed(
  tenantId: string,
  method: OTPDeliveryMethod
): Promise<boolean> {
  const config = await getOTPTenantConfig(tenantId);
  return config.allowedMethods.includes(method);
}

/**
 * Get default OTP method for tenant
 */
export async function getDefaultOTPMethod(tenantId: string): Promise<OTPDeliveryMethod> {
  const config = await getOTPTenantConfig(tenantId);
  return config.defaultMethod;
}
