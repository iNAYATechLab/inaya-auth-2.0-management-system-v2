// Auth Actions — Server Actions for authentication
// Task 6: Email verification
// Task 8: Username + Strong password

'use server';

import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from '@/lib/auth';
import { AuthError } from 'next-auth';
import { LoginSchema, RegisterSchema } from '@/lib/utils/validations';
import { validatePasswordStrength } from '@/lib/utils/validations';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { generateEmailVerificationToken } from '@/lib/utils/emailVerification';
import { logAction } from '@/lib/utils/audit';

// ─── Sign In Action ──────────────────────────────────────────────────────────
export async function signInAction(
  prevState: { error?: string } | undefined,
  formData: FormData
) {
  try {
    const validated = LoginSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    if (!validated.success) {
      return { error: validated.error.errors[0].message };
    }

    const { email, password } = validated.data;

    await nextAuthSignIn('credentials', {
      email,
      password,
      redirect: false,
    });

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Invalid email or password' };
        case 'AccessDenied':
          return { error: 'Account is deactivated' };
        default:
          return { error: 'Something went wrong' };
      }
    }
    throw error;
  }
}

// ─── Sign Out Action ─────────────────────────────────────────────────────────
export async function signOutAction() {
  await nextAuthSignOut({
    redirect: false,
  });
  revalidatePath('/', 'layout');
}

// ─── Register Action (Task 6, 8) ─────────────────────────────────────────────
export async function registerAction(
  prevState: { error?: string } | undefined,
  formData: FormData
) {
  try {
    const validated = RegisterSchema.safeParse({
      name: formData.get('name'),
      username: formData.get('username'),
      email: formData.get('email'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
    });

    if (!validated.success) {
      return { error: validated.error.errors[0].message };
    }

    const { name, username, email, password } = validated.data;

    // Task 8: Validate strong password policy
    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.valid) {
      return { error: passwordCheck.errors[0] };
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: 'An account with this email already exists' };
    }

    // Task 8: Check if username is already taken
    if (username) {
      const existingUsername = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUsername) {
        return { error: 'This username is already taken' };
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user (email not verified yet — Task 6)
    const user = await prisma.user.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,
        role: 'USER',
        emailVerified: null, // Will be verified via email
      },
    });

    // Task 6: Generate email verification token
    const verificationToken = await generateEmailVerificationToken(email);

    // Log registration
    await logAction({
      userId: user.id,
      action: 'REGISTER',
      description: `New user registered with email: ${email}`,
      metadata: { hasUsername: !!username },
    });

    // TODO: Send verification email
    console.log(`[DEV] Email verification token for ${email}: ${verificationToken}`);
    // const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}`;
    // await sendVerificationEmail(email, verificationLink);

    // Auto sign in after registration
    await nextAuthSignIn('credentials', {
      email,
      password,
      redirect: false,
    });

    revalidatePath('/', 'layout');
    return { 
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      verificationRequired: true,
    };
  } catch (error) {
    console.error('Registration error:', error);
    return { error: 'Something went wrong during registration' };
  }
}

// ─── Verify Email Action (Task 6) ────────────────────────────────────────────
export async function verifyEmailAction(token: string) {
  try {
    const { verifyEmailToken } = await import('@/lib/utils/emailVerification');
    const result = await verifyEmailToken(token);

    if (result.success && result.email) {
      const user = await prisma.user.findUnique({
        where: { email: result.email },
      });

      if (user) {
        await logAction({
          userId: user.id,
          action: 'EMAIL_VERIFIED',
          description: `Email verified: ${result.email}`,
        });
      }

      revalidatePath('/', 'layout');
      return { success: true, message: 'Email verified successfully!' };
    }

    return { success: false, error: result.error };
  } catch (error) {
    console.error('Email verification error:', error);
    return { success: false, error: 'Something went wrong during email verification' };
  }
}

// ─── Resend Verification Email Action (Task 6) ───────────────────────────────
export async function resendVerificationAction(email: string) {
  try {
    const { resendVerificationEmail } = await import('@/lib/utils/emailVerification');
    const result = await resendVerificationEmail(email);

    if (result.success) {
      return { 
        success: true, 
        message: 'Verification email sent! Please check your inbox.' 
      };
    }

    return { success: false, error: result.error };
  } catch (error) {
    console.error('Resend verification error:', error);
    return { success: false, error: 'Something went wrong' };
  }
}
