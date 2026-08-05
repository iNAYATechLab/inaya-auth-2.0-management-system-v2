// Phone OTP Utility (Task 9)
// Generates and verifies OTP for phone number registration

import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

/**
 * Generate a random 6-digit OTP
 */
function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Send OTP via SMS (placeholder - integrate with SMS provider)
 */
async function sendOtpSms(phoneNumber: string, otp: string): Promise<boolean> {
  // TODO: Integrate with SMS provider (Twilio, Nexmo, etc.)
  // Example:
  // const twilio = require('twilio');
  // const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
  // await client.messages.create({
  //   body: `Your iNAYA Auth verification code is: ${otp}`,
  //   from: process.env.TWILIO_PHONE_NUMBER,
  //   to: phoneNumber
  // });
  
  console.log(`[DEV] OTP for ${phoneNumber}: ${otp}`);
  return true;
}

/**
 * Generate and send OTP for phone registration
 */
export async function generatePhoneOtp(
  userId: string,
  phoneNumber: string
): Promise<{ success: boolean; error?: string }> {
  // Check if phone number is already registered to another user
  const existingUser = await prisma.user.findUnique({
    where: { phoneNumber },
  });

  if (existingUser && existingUser.id !== userId) {
    return { success: false, error: 'Phone number is already registered to another account' };
  }

  // Delete any existing OTPs for this user
  await prisma.otpCode.deleteMany({
    where: { userId },
  });

  // Generate OTP
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Store OTP in database
  await prisma.otpCode.create({
    data: {
      userId,
      recipient: phoneNumber,
      recipientType: 'phone',
      code: otp,
      purpose: 'verify-phone',
      expiresAt,
    },
  });

  // Send OTP via SMS
  const sent = await sendOtpSms(phoneNumber, otp);
  if (!sent) {
    return { success: false, error: 'Failed to send OTP. Please try again.' };
  }

  return { success: true };
}

/**
 * Verify phone OTP
 */
export async function verifyPhoneOtp(
  userId: string,
  phoneNumber: string,
  otp: string
): Promise<{ success: boolean; error?: string }> {
  // Find the OTP record
  const otpRecord = await prisma.otpCode.findFirst({
    where: {
      userId,
      recipient: phoneNumber,
      recipientType: 'phone',
      purpose: 'verify-phone',
      verifiedAt: null, // Not yet verified
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!otpRecord) {
    return { success: false, error: 'No OTP found. Please request a new one.' };
  }

  // Check if OTP has expired
  if (otpRecord.expiresAt < new Date()) {
    return { success: false, error: 'OTP has expired. Please request a new one.' };
  }

  // Verify OTP
  if (otpRecord.code !== otp) {
    return { success: false, error: 'Invalid OTP. Please try again.' };
  }

  // Mark OTP as verified
  await prisma.otpCode.update({
    where: { id: otpRecord.id },
    data: { verifiedAt: new Date() },
  });

  // Update user's phone number and verification status
  await prisma.user.update({
    where: { id: userId },
    data: {
      phoneNumber,
      phoneVerified: new Date(),
    },
  });

  return { success: true };
}

/**
 * Check if phone is verified
 */
export async function isPhoneVerified(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phoneVerified: true },
  });

  return user?.phoneVerified !== null;
}

/**
 * Resend OTP
 */
export async function resendPhoneOtp(
  userId: string,
  phoneNumber: string
): Promise<{ success: boolean; error?: string }> {
  // Check if there's a recent OTP (rate limiting - 60 seconds)
  const recentOtp = await prisma.otpCode.findFirst({
    where: {
      userId,
      createdAt: {
        gte: new Date(Date.now() - 60 * 1000), // Last 60 seconds
      },
    },
  });

  if (recentOtp) {
    return { 
      success: false, 
      error: 'Please wait 60 seconds before requesting a new OTP' 
    };
  }

  return await generatePhoneOtp(userId, phoneNumber);
}
