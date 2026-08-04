// Email Verification Utility (Task 6)
// Generates and verifies email verification tokens

import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

/**
 * Generate email verification token
 */
export async function generateEmailVerificationToken(email: string): Promise<string> {
  // Delete any existing tokens for this email
  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });

  // Generate a secure random token
  const token = crypto.randomBytes(32).toString('hex');
  
  // Set expiration to 24 hours
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // Store token in database
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  return token;
}

/**
 * Verify email verification token
 */
export async function verifyEmailToken(token: string): Promise<{ success: boolean; email?: string; error?: string }> {
  // Find the token in database
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken) {
    return { success: false, error: 'Invalid verification token' };
  }

  // Check if token has expired
  if (verificationToken.expires < new Date()) {
    // Delete expired token
    await prisma.verificationToken.delete({
      where: { token },
    });
    return { success: false, error: 'Verification token has expired' };
  }

  // Token is valid, mark email as verified
  const email = verificationToken.identifier;
  await prisma.user.update({
    where: { email },
    data: { emailVerified: new Date() },
  });

  // Delete the used token
  await prisma.verificationToken.delete({
    where: { token },
  });

  return { success: true, email };
}

/**
 * Check if email is verified
 */
export async function isEmailVerified(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { emailVerified: true },
  });

  return user?.emailVerified !== null;
}

/**
 * Resend verification email (generates new token)
 */
export async function resendVerificationEmail(email: string): Promise<{ success: boolean; token?: string; error?: string }> {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  if (user.emailVerified) {
    return { success: false, error: 'Email is already verified' };
  }

  const token = await generateEmailVerificationToken(email);

  // TODO: Send email with verification link
  // const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;
  // await sendEmail({ to: email, subject: 'Verify your email', body: verificationLink });

  console.log(`[DEV] Email verification token for ${email}: ${token}`);

  return { success: true, token };
}
