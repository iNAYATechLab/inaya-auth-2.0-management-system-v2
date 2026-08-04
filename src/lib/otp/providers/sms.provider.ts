/**
 * SMS OTP Provider (Task 19: Architecture Extensible)
 * 
 * Placeholder for SMS delivery
 * Currently supports logging in development mode
 * Ready for integration with providers like:
 * - Twilio
 * - Vonage (Nexmo)
 * - AWS SNS
 * - SSL Wireless (Bangladesh)
 * - BulkSMSBD (Bangladesh)
 * 
 * To enable: Implement sendViaProvider() method and set environment variables
 */

import { OTPProvider, OTPDeliveryOptions, OTPDeliveryResult } from './provider.interface';

interface SMSConfig {
  provider: string; // 'twilio' | 'vonage' | 'ssl-wireless' | 'bulksmsbd' | etc
  apiKey?: string;
  apiSecret?: string;
  senderId?: string;
  accountSid?: string; // For Twilio
  authToken?: string; // For Twilio
}

function getSMSConfig(): SMSConfig {
  return {
    provider: process.env.SMS_PROVIDER || 'dev-console',
    apiKey: process.env.SMS_API_KEY,
    apiSecret: process.env.SMS_API_SECRET,
    senderId: process.env.SMS_SENDER_ID,
    accountSid: process.env.SMS_ACCOUNT_SID,
    authToken: process.env.SMS_AUTH_TOKEN,
  };
}

export class SMSOTPProvider implements OTPProvider {
  readonly name = 'sms';
  readonly type = 'sms' as const;

  isConfigured(): boolean {
    const config = getSMSConfig();
    // SMS is not configured unless explicitly set up
    return config.provider !== 'dev-console' && !!config.apiKey;
  }

  async sendOTP(options: OTPDeliveryOptions): Promise<OTPDeliveryResult> {
    const { recipient: phoneNumber, code, type, locale } = options;
    const config = getSMSConfig();

    const message = this.getMessage(code, type, locale);

    try {
      // Development mode: log to console
      if (config.provider === 'dev-console' || !config.apiKey) {
        console.log(`[DEV] SMS to ${phoneNumber}:`);
        console.log(`Message: ${message}`);
        return {
          success: true,
          messageId: `dev-sms-${Date.now()}`,
        };
      }

      // Production: integrate with SMS provider
      switch (config.provider) {
        case 'twilio':
          return await this.sendViaTwilio(config, phoneNumber, message);
        case 'vonage':
          return await this.sendViaVonage(config, phoneNumber, message);
        case 'ssl-wireless':
          return await this.sendViaSSLWireless(config, phoneNumber, message);
        case 'bulksmsbd':
          return await this.sendViaBulkSMSBD(config, phoneNumber, message);
        default:
          throw new Error(`Unknown SMS provider: ${config.provider}`);
      }
    } catch (error) {
      console.error('SMS OTP send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send SMS',
      };
    }
  }

  private getMessage(code: string, type: string, locale?: string): string {
    const isBn = locale === 'bn';

    let prefix: string;
    switch (type) {
      case 'login':
        prefix = isBn ? 'আপনার লগইন কোড' : 'Your login code';
        break;
      case 'verify-phone':
        prefix = isBn ? 'আপনার ফোন ভেরিফিকেশন কোড' : 'Your phone verification code';
        break;
      case 'reset':
      case 'reset-password':
        prefix = isBn ? 'আপনার পাসওয়ার্ড রিসেট কোড' : 'Your password reset code';
        break;
      default:
        prefix = isBn ? 'আপনার ভেরিফিকেশন কোড' : 'Your verification code';
    }

    const expiry = isBn ? '১০ মিনিটের জন্য বৈধ' : 'Expires in 10 minutes';
    
    return `${prefix}: ${code}. ${expiry}. ${isBn ? 'কাউকে দেখাবেন না।' : 'Never share this code.'}`;
  }

  /**
   * Twilio SMS Integration
   * Docs: https://www.twilio.com/docs/sms/quickstart/node
   */
  private async sendViaTwilio(
    config: SMSConfig,
    to: string,
    message: string
  ): Promise<OTPDeliveryResult> {
    // TODO: Implement Twilio API call
    // const client = require('twilio')(config.accountSid, config.authToken);
    // const message = await client.messages.create({
    //   body: message,
    //   from: config.senderId,
    //   to: to,
    // });
    throw new Error('Twilio SMS not yet implemented. Set SMS_PROVIDER=dev-console for development.');
  }

  /**
   * Vonage (Nexmo) SMS Integration
   * Docs: https://developer.vonage.com/messaging/sms/overview
   */
  private async sendViaVonage(
    config: SMSConfig,
    to: string,
    message: string
  ): Promise<OTPDeliveryResult> {
    // TODO: Implement Vonage API call
    throw new Error('Vonage SMS not yet implemented. Set SMS_PROVIDER=dev-console for development.');
  }

  /**
   * SSL Wireless SMS Integration (Bangladesh)
   * Docs: https://sslcommerz.com/
   */
  private async sendViaSSLWireless(
    config: SMSConfig,
    to: string,
    message: string
  ): Promise<OTPDeliveryResult> {
    // TODO: Implement SSL Wireless API call
    throw new Error('SSL Wireless SMS not yet implemented. Set SMS_PROVIDER=dev-console for development.');
  }

  /**
   * BulkSMSBD SMS Integration (Bangladesh)
   * Docs: https://bulksmsbd.com/
   */
  private async sendViaBulkSMSBD(
    config: SMSConfig,
    to: string,
    message: string
  ): Promise<OTPDeliveryResult> {
    // TODO: Implement BulkSMSBD API call
    throw new Error('BulkSMSBD SMS not yet implemented. Set SMS_PROVIDER=dev-console for development.');
  }
}
