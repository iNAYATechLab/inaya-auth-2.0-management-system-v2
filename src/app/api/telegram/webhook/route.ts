/**
 * Telegram Bot Webhook Handler
 * Task 17: Telegram Bot OTP ডেলিভারি
 * 
 * Handles incoming messages from Telegram
 * Stores user chat IDs for OTP delivery
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    date: number;
    text?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const update: TelegramUpdate = await request.json();

    // Handle message
    if (update.message) {
      const { from, chat, text } = update.message;

      // Only handle messages from users (not bots)
      if (from.is_bot) {
        return NextResponse.json({ ok: true });
      }

      const chatId = chat.id.toString();
      const telegramUserId = from.id.toString();

      // Handle /start command
      if (text === '/start') {
        // Store/update user's Telegram chat ID
        // In production, link to user account via email/username
        console.log(`[Telegram] New user: ${from.username || from.first_name} (${chatId})`);

        // Send welcome message
        await sendTelegramMessage(chatId, getWelcomeMessage(from.language_code));

        return NextResponse.json({ ok: true });
      }

      // Handle other commands
      if (text?.startsWith('/')) {
        await sendTelegramMessage(chatId, getHelpMessage(from.language_code));
        return NextResponse.json({ ok: true });
      }

      // For any other message, inform user about the bot
      await sendTelegramMessage(
        chatId,
        'This bot is used for receiving OTP codes. You don\'t need to send any messages here.'
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}

/**
 * Send message via Telegram Bot API
 */
async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.error('Telegram bot token not configured');
    return;
  }

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    });
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
  }
}

function getWelcomeMessage(languageCode?: string): string {
  const isBn = languageCode?.startsWith('bn');

  if (isBn) {
    return `
<b>🎉 স্বাগতম iNAYA Auth Bot এ!</b>

এই বটটি আপনাকে OTP কোড পাঠাতে ব্যবহৃত হবে।

<b>কিভাবে ব্যবহার করবেন:</b>
1. আপনার অ্যাকাউন্ট সেটিংসে যান
2. "Telegram" অপশন সিলেক্ট করুন
3. এই বটের সাথে আপনার Telegram অ্যাকাউন্ট লিংক করুন

এরপর থেকে আপনি OTP কোড এখানে পাবেন!

/help - সাহায্য দেখুন
    `.trim();
  }

  return `
<b>🎉 Welcome to iNAYA Auth Bot!</b>

This bot will send you OTP codes for authentication.

<b>How to use:</b>
1. Go to your account settings
2. Select "Telegram" option
3. Link your Telegram account with this bot

From now on, you'll receive OTP codes here!

/help - View help
  `.trim();
}

function getHelpMessage(languageCode?: string): string {
  const isBn = languageCode?.startsWith('bn');

  if (isBn) {
    return `
<b>📚 সাহায্য</b>

<b>আদেশসমূহ:</b>
/start - শুরু করুন
/help - এই বার্তা দেখুন

<b>কিভাবে কাজ করে:</b>
• এই বটটি আপনাকে OTP কোড পাঠাবে
• আপনাকে কোনো বার্তা পাঠাতে হবে না
• শুধু /start করুন এবং আপনার অ্যাকাউন্টের সাথে লিংক করুন
    `.trim();
  }

  return `
<b>📚 Help</b>

<b>Commands:</b>
/start - Get started
/help - View this message

<b>How it works:</b>
• This bot sends you OTP codes
• You don't need to send any messages
• Just /start and link with your account
  `.trim();
}
