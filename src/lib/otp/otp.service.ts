/**
 * OTP Service (Tasks 16-18)
 * 
 * Main service for OTP generation, delivery, and verification
 * Handles rate limiting, expiry, and resend logic
 */

import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { OTP_CONFIG, OTPConfig } from './otp.config';
import { OTPProvider, OTPProviderRegistry } from './providers/provider.interface';
import { EmailOTPProvider } from './providers/email.provider';
import { TelegramOTPProvider } from './providers/telegram.provider';
import { SMSOTPProvider } from './providers/sms.provider';
import { WhatsAppOTPProvider } from './providers/whatsapp.provider';

export interface OTPGenerateOptions {
  recipient: string;
  recipientType: 'email' | 'phone' | 'telegram';
  purpose: string;
  userId?: string;
  provider?: string;
  locale?: string;
}

export interface OTPVerifyOptions {
  recipient: string;
  recipientType: 'email' | 'phone' | 'telegram';
  code: string;
  purpose: string;
}

export interface OTPSendResult {
  success: boolean;
  error?: string;
  messageId?: string;
  expiresAt?: Date;
}

/**
 * OTP Service Class
 */
export class OTPService {
  private registry: OTPProviderRegistry;

  constructor() {
    this.registry = new OTPProviderRegistry();
    this.registerProviders();
  }

  /**
   * Register all available OTP providers
   */
  private registerProviders(): void {
    this.registry.register(new EmailOTPProvider());
    this.registry.register(new TelegramOTPProvider());
    this.registry.register(new SMSOTPProvider());
    this.registry.register(new WhatsAppOTPProvider());
  }

  /**
   * Get available providers for a recipient type
   */
  getAvailableProviders(recipientType: string): OTPProvider[] {
    const providerType = this.getProviderType(recipientType);
    return this.registry.getByType(providerType);
  }

  private getProviderType(recipientType: string): OTPProvider['type'] {
    switch (recipientType) {
      case 'email':
        return 'email';
      case 'phone':
        return 'sms'; // Default to SMS for phone
      case 'telegram':
        return 'telegram';
      default:
        throw new Error(`Unknown recipient type: ${recipientType}`);
    }
  }

  /**
   * Generate and send OTP
   */
  async generateAndSendOTP(options: OTPGenerateOptions): Promise<OTPSendResult> {
    const { recipient, recipientType, purpose, userId, provider, locale } = options;

    // Get OTP config for this purpose
    const config = OTP_CONFIG[purpose] || OTP_CONFIG.login;

    // Check rate limits
    const rateLimitCheck = await this.checkRateLimit(recipient, recipientType, config);
    if (!rateLimitCheck.allowed) {
      return {
        success: false,
        error: rateLimitCheck.error,
      };
    }

    // Check if there's an active OTP (prevent spam)
    const existingOtp = await this.getActiveOTP(recipient, recipientType, purpose);
    if (existingOtp) {
      const now = new Date();
      const timeSinceCreation = (now.getTime() - existingOtp.createdAt.getTime()) / 1000;
      const resendInterval = config.resendIntervalSeconds;

      if (timeSinceCreation < resendInterval) {
        const waitTime = Math.ceil(resendInterval - timeSinceCreation);
        return {
          success: false,
          error: `Please wait ${waitTime} seconds before requesting a new code`,
        };
      }
    }

    // Generate OTP code
    const code = this.generateCode(config.codeLength);
    const expiresAt = new Date(Date.now() + config.expiryMinutes * 60 * 1000);

    // Delete any existing OTPs for this recipient/purpose
    await prisma.otpCode.deleteMany({
      where: {
        recipient,
        recipientType,
        purpose,
      },
    });

    // Create new OTP record
    const otp = await prisma.otpCode.create({
      data: {
        recipient,
        recipientType,
        code,
        purpose,
        userId,
        expiresAt,
        maxAttempts: config.maxFailedAttempts,
      },
    });

    // Get provider (or use default)
    const providerInstance = provider
      ? this.registry.get(provider)
      : this.registry.getDefault(this.getProviderType(recipientType));

    if (!providerInstance || !providerInstance.isConfigured()) {
      // Fallback to development mode (console log)
      console.log(`\n[DEV] OTP for ${recipient} (${recipientType}):`);
      console.log(`Code: ${code}`);
      console.log(`Expires: ${expiresAt.toISOString()}\n`);

      return {
        success: true,
        messageId: `dev-${Date.now()}`,
        expiresAt,
      };
    }

    // Send OTP via provider
    const sendResult = await providerInstance.sendOTP({
      recipient,
      code,
      type: purpose as any,
      locale,
    });

    if (!sendResult.success) {
      // Delete OTP if send failed
      await prisma.otpCode.delete({
        where: { id: otp.id },
      });

      return {
        success: false,
        error: sendResult.error || 'Failed to send OTP',
      };
    }

    // Update rate limit counter
    await this.incrementRateLimit(recipient, recipientType, config);

    return {
      success: true,
      messageId: sendResult.messageId,
      expiresAt,
    };
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(options: OTPVerifyOptions): Promise<{ success: boolean; error?: string; otpId?: string }> {
    const { recipient, recipientType, code, purpose } = options;

    // Find active OTP
    const otp = await prisma.otpCode.findFirst({
      where: {
        recipient,
        recipientType,
        code,
        purpose,
        verifiedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otp) {
      return {
        success: false,
        error: 'Invalid or expired code',
      };
    }

    // Check if expired
    if (new Date() > otp.expiresAt) {
      return {
        success: false,
        error: 'Code has expired',
      };
    }

    // Check attempts
    if (otp.attempts >= otp.maxAttempts) {
      return {
        success: false,
        error: 'Maximum attempts exceeded. Please request a new code',
      };
    }

    // Verify code
    if (otp.code !== code) {
      // Increment attempts
      await prisma.otpCode.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });

      const remainingAttempts = otp.maxAttempts - (otp.attempts + 1);
      return {
        success: false,
        error: `Invalid code. ${remainingAttempts} attempts remaining`,
      };
    }

    // Mark as verified
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { verifiedAt: new Date() },
    });

    return {
      success: true,
      otpId: otp.id,
    };
  }

  /**
   * Check if there's an active (unexpired, unverified) OTP
   */
  private async getActiveOTP(
    recipient: string,
    recipientType: string,
    purpose: string
  ) {
    return prisma.otpCode.findFirst({
      where: {
        recipient,
        recipientType,
        purpose,
        verifiedAt: null,
        expiresAt: {
          gte: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Check rate limits
   */
  private async checkRateLimit(
    recipient: string,
    recipientType: string,
    config: OTPConfig
  ): Promise<{ allowed: boolean; error?: string }> {
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get rate limit record
    const rateLimit = await prisma.otpRateLimit.findUnique({
      where: {
        recipient_recipientType: {
          recipient,
          recipientType,
        },
      },
    });

    if (!rateLimit) {
      return { allowed: true };
    }

    // Check if window has expired
    if (rateLimit.windowEnd < now) {
      return { allowed: true };
    }

    // Check hourly limit
    if (rateLimit.count >= config.rateLimitPerHour) {
      return {
        allowed: false,
        error: `Rate limit exceeded. Please try again later`,
      };
    }

    return { allowed: true };
  }

  /**
   * Increment rate limit counter
   */
  private async incrementRateLimit(
    recipient: string,
    recipientType: string,
    config: OTPConfig
  ): Promise<void> {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour window

    await prisma.otpRateLimit.upsert({
      where: {
        recipient_recipientType: {
          recipient,
          recipientType,
        },
      },
      update: {
        count: { increment: 1 },
        windowEnd,
      },
      create: {
        recipient,
        recipientType,
        count: 1,
        windowStart: now,
        windowEnd,
      },
    });
  }

  /**
   * Generate random OTP code
   */
  private generateCode(length: number): string {
    const digits = '0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += digits[crypto.randomInt(0, digits.length)];
    }
    return code;
  }

  /**
   * Resend OTP (with cooldown check)
   */
  async resendOTP(
    recipient: string,
    recipientType: string,
    purpose: string,
    options?: { userId?: string; provider?: string; locale?: string }
  ): Promise<OTPSendResult> {
    return this.generateAndSendOTP({
      recipient,
      recipientType,
      purpose,
      ...options,
    });
  }

  /**
   * Send email verification link
   */
  async sendEmailVerificationLink(
    email: string,
    link: string,
    locale?: string
  ): Promise<OTPSendResult> {
    const provider = this.registry.get('email');

    if (!provider || !provider.isConfigured()) {
      console.log(`[DEV] Email verification link for ${email}:`);
      console.log(`Link: ${link}\n`);
      return {
        success: true,
        messageId: `dev-${Date.now()}`,
      };
    }

    if (!provider.sendVerificationLink) {
      return {
        success: false,
        error: 'Provider does not support verification links',
      };
    }

    const result = await provider.sendVerificationLink(email, link, locale);

    return {
      success: result.success,
      error: result.error,
      messageId: result.messageId,
    };
  }
}

// Export singleton instance
export const otpService = new OTPService();
