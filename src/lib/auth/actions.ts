// Auth Actions — Server Actions for authentication
'use server';

import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from '@/lib/auth';;
import { AuthError } from 'next-auth';
import { LoginSchema, RegisterSchema } from '@/lib/utils/validations';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

// Sign in action
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

// Sign out action
export async function signOutAction() {
  await nextAuthSignOut({
    redirect: false,
  });
  revalidatePath('/', 'layout');
}

// Register action
export async function registerAction(
  prevState: { error?: string } | undefined,
  formData: FormData
) {
  try {
    const validated = RegisterSchema.safeParse({
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
    });

    if (!validated.success) {
      return { error: validated.error.errors[0].message };
    }

    const { name, email, password } = validated.data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: 'Email already in use' };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'USER',
      },
    });

    // Auto sign in after registration
    await nextAuthSignIn('credentials', {
      email,
      password,
      redirect: false,
    });

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Registration error:', error);
    return { error: 'Something went wrong during registration' };
  }
}
