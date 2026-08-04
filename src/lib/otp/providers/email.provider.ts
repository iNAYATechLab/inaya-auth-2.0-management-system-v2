/**
 * Email OTP Provider
 * Task 16: ইমেইল OTP/ভেরিফিকেশন লিংক ডেলিভারি
 * 
 * Supports: Resend (default) or SMTP
 * Configure via environment variables
 */

import { OTPProvider, OTPDeliveryOptions, OTPDeliveryResult } from './provider.interface';

interface EmailConfig {
  provider: 'resend' | 'smtp';
  from: string;
  fromName?: string;
  // Resend config
  resendApiKey?: string;
  // SMTP config
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
}

function getEmailConfig(): EmailConfig {
  return {
    provider: (process.env.EMAIL_PROVIDER as 'resend' | 'smtp') || 'resend',
    from: process.env.EMAIL_FROM || 'noreply@inaya-auth.com',
    fromName: process.env.EMAIL_FROM_NAME || 'iNAYA Auth',
    resendApiKey: process.env.RESEND_API_KEY,
    smtpHost: process.env.SMTP_HOST,
    smtpPort: parseInt(process.env.SMTP_PORT || '587'),
    smtpUser: process.env.SMTP_USER,
    smtpPassword: process.env.SMTP_PASSWORD,
  };
}

export class EmailOTPProvider implements OTPProvider {
  readonly name = 'email';
  readonly type = 'email' as const;

  isConfigured(): boolean {
    const config = getEmailConfig();
    if (config.provider === 'resend') {
      return !!config.resendApiKey;
    }
    return !!(config.smtpHost && config.smtpUser && config.smtpPassword);
  }

  async sendOTP(options: OTPDeliveryOptions): Promise<OTPDeliveryResult> {
    const { recipient: email, code, type, locale } = options;
    const config = getEmailConfig();
    
    const subject = this.getSubject(type, locale);
    const html = this.getOtpHtml(code, type, locale);
    const text = this.getOtpText(code, type, locale);

    try {
      if (config.provider === 'resend') {
        return await this.sendViaResend(config, email, subject, html, text);
      } else {
        return await this.sendViaSmtp(config, email, subject, html, text);
      }
    } catch (error) {
      console.error('Email OTP send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email',
      };
    }
  }

  async sendVerificationLink(
    email: string,
    link: string,
    locale?: string
  ): Promise<OTPDeliveryResult> {
    const config = getEmailConfig();
    const subject = this.getSubject('verify', locale);
    const html = this.getVerificationLinkHtml(link, locale);
    const text = `Verify your email by clicking this link: ${link}`;

    try {
      if (config.provider === 'resend') {
        return await this.sendViaResend(config, email, subject, html, text);
      } else {
        return await this.sendViaSmtp(config, email, subject, html, text);
      }
    } catch (error) {
      console.error('Email verification link send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email',
      };
    }
  }

  private async sendViaResend(
    config: EmailConfig,
    to: string,
    subject: string,
    html: string,
    text: string
  ): Promise<OTPDeliveryResult> {
    // Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.resendApiKey}`,
      },
      body: JSON.stringify({
        from: `${config.fromName || 'iNAYA Auth'} <${config.from}>`,
        to: [to],
        subject,
        html,
        text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${error}`);
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  }

  private async sendViaSmtp(
    config: EmailConfig,
    to: string,
    subject: string,
    html: string,
    text: string
  ): Promise<OTPDeliveryResult> {
    // Placeholder for SMTP implementation
    // In production, use nodemailer or similar
    // For now, log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV] SMTP Email to ${to}:`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${text}`);
      return { success: true, messageId: `dev-${Date.now()}` };
    }

    throw new Error('SMTP not yet implemented. Use Resend provider.');
  }

  private getSubject(type: string, locale?: string): string {
    const isBn = locale === 'bn';
    
    switch (type) {
      case 'login':
        return isBn ? 'আপনার লগইন কোড' : 'Your Login Code';
      case 'verify':
      case 'verify-email':
        return isBn ? 'আপনার ইমেইল ভেরিফিকেশন' : 'Verify Your Email';
      case 'verify-phone':
        return isBn ? 'আপনার ফোন ভেরিফিকেশন কোড' : 'Your Phone Verification Code';
      case 'reset':
      case 'reset-password':
        return isBn ? 'পাসওয়ার্ড রিসেট কোড' : 'Password Reset Code';
      default:
        return isBn ? 'আপনার ভেরিফিকেশন কোড' : 'Your Verification Code';
    }
  }

  private getOtpHtml(code: string, type: string, locale?: string): string {
    const isBn = locale === 'bn';
    const title = this.getSubject(type, locale);
    const description = isBn
      ? 'আপনার ভেরিফিকেশন কোড নিচে দেওয়া হলো। এই কোডটি কাউকে দেখাবেন না।'
      : 'Your verification code is below. Do not share this code with anyone.';
    const expiry = isBn ? 'এই কোডটি ১০ মিনিটের জন্য বৈধ।' : 'This code expires in 10 minutes.';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6D28D9 0%, #F59E0B 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">iNAYA Auth</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px;">${title}</h2>
              <p style="margin: 0 0 30px 0; color: #6b7280; font-size: 16px; line-height: 1.6;">${description}</p>
              <!-- OTP Code -->
              <div style="background-color: #f9fafb; border: 2px dashed #6D28D9; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
                <div style="font-size: 48px; font-weight: bold; letter-spacing: 8px; color: #6D28D9; font-family: 'Courier New', monospace;">
                  ${code}
                </div>
              </div>
              <p style="margin: 0 0 20px 0; color: #9ca3af; font-size: 14px; text-align: center;">${expiry}</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                ${isBn ? 'আপনি যদি এই অনুরোধ না করে থাকেন, তবে এই ইমেইলটি উপেক্ষা করুন।' : 'If you didn\'t request this, please ignore this email.'}
              </p>
              <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} iNAYA Auth. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  private getOtpText(code: string, type: string, locale?: string): string {
    const isBn = locale === 'bn';
    const title = this.getSubject(type, locale);
    
    if (isBn) {
      return `${title}\n\nআপনার কোড: ${code}\n\nএই কোডটি ১০ মিনিটের জন্য বৈধ।\n\nআপনি যদি এই অনুরোধ না করে থাকেন, তবে এই ইমেইলটি উপেক্ষা করুন।`;
    }
    
    return `${title}\n\nYour code: ${code}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore this email.`;
  }

  private getVerificationLinkHtml(link: string, locale?: string): string {
    const isBn = locale === 'bn';
    const title = isBn ? 'ইমেইল ভেরিফিকেশন' : 'Email Verification';
    const description = isBn
      ? 'আপনার ইমেইল ঠিকানা ভেরিফাই করতে নিচের বাটনে ক্লিক করুন।'
      : 'Click the button below to verify your email address.';
    const buttonText = isBn ? 'ইমেইল ভেরিফাই করুন' : 'Verify Email';
    const expiry = isBn ? 'এই লিংকটি ২৪ ঘন্টার জন্য বৈধ।' : 'This link expires in 24 hours.';
    const fallback = isBn
      ? `যদি বাটনটি কাজ না করে, এই লিংকটি কপি করে ব্রাউজারে পেস্ট করুন:\n${link}`
      : `If the button doesn't work, copy and paste this link into your browser:\n${link}`;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6D28D9 0%, #F59E0B 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">iNAYA Auth</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px; text-align: center;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px;">${title}</h2>
              <p style="margin: 0 0 30px 0; color: #6b7280; font-size: 16px; line-height: 1.6;">${description}</p>
              <!-- Button -->
              <a href="${link}" style="display: inline-block; background: linear-gradient(135deg, #6D28D9 0%, #7C3AED 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; margin: 20px 0;">
                ${buttonText}
              </a>
              <p style="margin: 30px 0 0 0; color: #9ca3af; font-size: 14px;">${expiry}</p>
              <p style="margin: 20px 0 0 0; color: #9ca3af; font-size: 12px; word-break: break-all;">${fallback}</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                ${isBn ? 'আপনি যদি এই অ্যাকাউন্টটি তৈরি না করে থাকেন, তবে এই ইমেইলটি উপেক্ষা করুন।' : 'If you didn\'t create this account, please ignore this email.'}
              </p>
              <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} iNAYA Auth. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }
}
