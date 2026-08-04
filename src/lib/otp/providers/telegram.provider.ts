/**
 * Telegram OTP Provider
 * Task 17: Telegram Bot OTP ডেলিভারি
 * 
 * Users can receive OTP codes via Telegram Bot
 * Configure via environment variables
 */

import { OTPProvider, OTPDeliveryOptions, OTPDeliveryResult } from './provider.interface';

interface TelegramConfig {
  botToken: string;
  botUsername: string;
}

function getTelegramConfig(): TelegramConfig {
  return {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    botUsername: process.env.TELEGRAM_BOT_USERNAME || 'iNAYAAuthBot',
  };
}

export class TelegramOTPProvider implements OTPProvider {
  readonly name = 'telegram';
  readonly type = 'telegram' as const;

  isConfigured(): boolean {
    const config = getTelegramConfig();
    return !!config.botToken;
  }

  async sendOTP(options: OTPDeliveryOptions): Promise<OTPDeliveryResult> {
    const { recipient: chatId, code, type, locale } = options;
    const config = getTelegramConfig();

    if (!config.botToken) {
      return {
        success: false,
        error: 'Telegram bot is not configured',
      };
    }

    const message = this.getMessage(code, type, locale);

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${config.botToken}/sendMessage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Telegram API error: ${error.description || 'Unknown error'}`);
      }

      const data = await response.json();
      return {
        success: true,
        messageId: data.result?.message_id?.toString(),
      };
    } catch (error) {
      console.error('Telegram OTP send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send Telegram message',
      };
    }
  }

  private getMessage(code: string, type: string, locale?: string): string {
    const isBn = locale === 'bn';

    let title: string;
    let description: string;
    let expiry: string;

    switch (type) {
      case 'login':
        title = isBn ? '🔐 লগইন কোড' : '🔐 Login Code';
        description = isBn
          ? 'আপনার লগইন কোড:'
          : 'Your login code:';
        expiry = isBn ? '⏰ ১০ মিনিটের জন্য বৈধ' : '⏰ Expires in 10 minutes';
        break;
      case 'verify':
      case 'verify-email':
        title = isBn ? '✅ ইমেইল ভেরিফিকেশন' : '✅ Email Verification';
        description = isBn
          ? 'আপনার ভেরিফিকেশন কোড:'
          : 'Your verification code:';
        expiry = isBn ? '⏰ ১৫ মিনিটের জন্য বৈধ' : '⏰ Expires in 15 minutes';
        break;
      case 'verify-phone':
        title = isBn ? '📱 ফোন ভেরিফিকেশন' : '📱 Phone Verification';
        description = isBn
          ? 'আপনার ফোন ভেরিফিকেশন কোড:'
          : 'Your phone verification code:';
        expiry = isBn ? '⏰ ১০ মিনিটের জন্য বৈধ' : '⏰ Expires in 10 minutes';
        break;
      case 'reset':
      case 'reset-password':
        title = isBn ? '🔑 পাসওয়ার্ড রিসেট' : '🔑 Password Reset';
        description = isBn
          ? 'আপনার পাসওয়ার্ড রিসেট কোড:'
          : 'Your password reset code:';
        expiry = isBn ? '⏰ ৫ মিনিটের জন্য বৈধ' : '⏰ Expires in 5 minutes';
        break;
      default:
        title = isBn ? '🔢 ভেরিফিকেশন কোড' : '🔢 Verification Code';
        description = isBn
          ? 'আপনার ভেরিফিকেশন কোড:'
          : 'Your verification code:';
        expiry = isBn ? '⏰ ১০ মিনিটের জন্য বৈধ' : '⏰ Expires in 10 minutes';
    }

    const warning = isBn
      ? '⚠️ এই কোডটি কাউকে দেখাবেন না!'
      : '⚠️ Never share this code with anyone!';

    return `
<b>${title}</b>

${description}

<code><b>${code}</b></code>

${expiry}

${warning}

<i>via @${getTelegramConfig().botUsername}</i>
    `.trim();
  }
}

/**
 * Helper function to get Telegram chat ID from username
 * Users need to start a conversation with the bot first
 */
export async function getTelegramChatId(username: string): Promise<string | null> {
  const config = getTelegramConfig();
  
  if (!config.botToken) {
    console.error('Telegram bot is not configured');
    return null;
  }

  // In production, you'd store chat IDs in the database
  // when users first interact with the bot
  // For now, return null as this requires database integration
  console.warn('getTelegramChatId requires database integration');
  return null;
}
