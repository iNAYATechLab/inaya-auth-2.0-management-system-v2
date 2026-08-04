/**
 * WhatsApp OTP Provider (Task 19: Architecture Extensible)
 * 
 * Placeholder for WhatsApp delivery
 * Currently supports logging in development mode
 * Ready for integration with providers like:
 * - Twilio WhatsApp
 * - WhatsApp Business API (Meta)
 * - 360dialog
 * 
 * To enable: Implement sendViaProvider() method and set environment variables
 */

import { OTPProvider, OTPDeliveryOptions, OTPDeliveryResult } from './provider.interface';

interface WhatsAppConfig {
  provider: string; // 'twilio' | 'meta' | '360dialog' | etc
  apiKey?: string;
  apiSecret?: string;
  senderNumber?: string;
  accountSid?: string; // For Twilio
  authToken?: string; // For Twilio
  businessAccountId?: string; // For Meta
}

function getWhatsAppConfig(): WhatsAppConfig {
  return {
    provider: process.env.WHATSAPP_PROVIDER || 'dev-console',
    apiKey: process.env.WHATSAPP_API_KEY,
    apiSecret: process.env.WHATSAPP_API_SECRET,
    senderNumber: process.env.WHATSAPP_SENDER_NUMBER,
    accountSid: process.env.WHATSAPP_ACCOUNT_SID,
    authToken: process.env.WHATSAPP_AUTH_TOKEN,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
  };
}

export class WhatsAppOTPProvider implements OTPProvider {
  readonly name = 'whatsapp';
  readonly type = 'whatsapp' as const;

  isConfigured(): boolean {
    const config = getWhatsAppConfig();
    // WhatsApp is not configured unless explicitly set up
    return config.provider !== 'dev-console' && !!config.apiKey;
  }

  async sendOTP(options: OTPDeliveryOptions): Promise<OTPDeliveryResult> {
    const { recipient: phoneNumber, code, type, locale } = options;
    const config = getWhatsAppConfig();

    const message = this.getMessage(code, type, locale);

    try {
      // Development mode: log to console
      if (config.provider === 'dev-console' || !config.apiKey) {
        console.log(`[DEV] WhatsApp to ${phoneNumber}:`);
        console.log(`Message: ${message}`);
        return {
          success: true,
          messageId: `dev-whatsapp-${Date.now()}`,
        };
      }

      // Production: integrate with WhatsApp provider
      switch (config.provider) {
        case 'twilio':
          return await this.sendViaTwilio(config, phoneNumber, message);
        case 'meta':
          return await this.sendViaMeta(config, phoneNumber, message);
        case '360dialog':
          return await this.sendVia360Dialog(config, phoneNumber, message);
        default:
          throw new Error(`Unknown WhatsApp provider: ${config.provider}`);
      }
    } catch (error) {
      console.error('WhatsApp OTP send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send WhatsApp message',
      };
    }
  }

  private getMessage(code: string, type: string, locale?: string): string {
    const isBn = locale === 'bn';

    let emoji: string;
    let title: string;
    switch (type) {
      case 'login':
        emoji = '🔐';
        title = isBn ? 'লগইন কোড' : 'Login Code';
        break;
      case 'verify-phone':
        emoji = '📱';
        title = isBn ? 'ফোন ভেরিফিকেশন' : 'Phone Verification';
        break;
      case 'reset':
      case 'reset-password':
        emoji = '🔑';
        title = isBn ? 'পাসওয়ার্ড রিসেট' : 'Password Reset';
        break;
      default:
        emoji = '🔢';
        title = isBn ? 'ভেরিফিকেশন কোড' : 'Verification Code';
    }

    const expiry = isBn ? '১০ মিনিটের জন্য বৈধ' : 'Expires in 10 minutes';
    const warning = isBn ? 'কাউকে দেখাবেন না!' : 'Never share this code!';

    return `
${emoji} *iNAYA Auth - ${title}*

${isBn ? 'আপনার কোড:' : 'Your code:'}

*${code}*

⏰ ${expiry}
⚠️ ${warning}
    `.trim();
  }

  /**
   * Twilio WhatsApp Integration
   * Docs: https://www.twilio.com/whatsapp
   */
  private async sendViaTwilio(
    config: WhatsAppConfig,
    to: string,
    message: string
  ): Promise<OTPDeliveryResult> {
    // TODO: Implement Twilio WhatsApp API call
    // const client = require('twilio')(config.accountSid, config.authToken);
    // const message = await client.messages.create({
    //   from: `whatsapp:${config.senderNumber}`,
    //   body: message,
    //   to: `whatsapp:${to}`,
    // });
    throw new Error('Twilio WhatsApp not yet implemented. Set WHATSAPP_PROVIDER=dev-console for development.');
  }

  /**
   * Meta WhatsApp Business API Integration
   * Docs: https://developers.facebook.com/docs/whatsapp/
   */
  private async sendViaMeta(
    config: WhatsAppConfig,
    to: string,
    message: string
  ): Promise<OTPDeliveryResult> {
    // TODO: Implement Meta WhatsApp Business API call
    throw new Error('Meta WhatsApp not yet implemented. Set WHATSAPP_PROVIDER=dev-console for development.');
  }

  /**
   * 360dialog WhatsApp Integration
   * Docs: https://www.360dialog.com/
   */
  private async sendVia360Dialog(
    config: WhatsAppConfig,
    to: string,
    message: string
  ): Promise<OTPDeliveryResult> {
    // TODO: Implement 360dialog API call
    throw new Error('360dialog WhatsApp not yet implemented. Set WHATSAPP_PROVIDER=dev-console for development.');
  }
}
