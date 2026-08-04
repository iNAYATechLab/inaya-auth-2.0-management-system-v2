// Validation Schemas — Zod schemas for form validation

import { z } from 'zod';

// ─── Strong Password Policy (Task 8) ─────────────────────────────────────────
// At least 8 characters
// At least 1 uppercase letter
// At least 1 lowercase letter
// At least 1 number
// At least 1 special character
// No common passwords
const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=])[A-Za-z\d@$!%*?&#^()_+\-=]{8,}$/;

// Common passwords blacklist
const commonPasswords = [
  'password', '12345678', '123456789', '1234567890', 'qwerty',
  'abc123', 'password1', 'admin123', 'letmein', 'welcome',
  'monkey', 'dragon', 'master', 'login', 'princess',
];

// Validate password strength
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[@$!%*?&#^()_+\-=]/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&#^()_+-=)');
  }
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a stronger password');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// Username validation
const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;

// ─── Login Schema (Task 11: Email/Username + Remember Me) ────────────────────
export const LoginSchema = z.object({
  emailOrUsername: z
    .string()
    .min(1, 'Email or username is required'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof LoginSchema>;

// ─── Phone OTP Login Schema (Task 14) ────────────────────────────────────────
export const PhoneLoginSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number'),
});

export type PhoneLoginInput = z.infer<typeof PhoneLoginSchema>;

export const PhoneOtpLoginSchema = z.object({
  phoneNumber: z.string().min(1, 'Phone number is required'),
  otp: z
    .string()
    .min(6, 'OTP must be 6 digits')
    .max(6, 'OTP must be 6 digits')
    .regex(/^\d{6}$/, 'OTP must be exactly 6 digits'),
});

export type PhoneOtpLoginInput = z.infer<typeof PhoneOtpLoginSchema>;

// ─── Register Schema (Task 6, 8) ─────────────────────────────────────────────
export const RegisterSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters'),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username cannot exceed 30 characters')
      .regex(usernameRegex, 'Username can only contain letters, numbers, underscores, and hyphens')
      .refine((val) => !/^-|-$/.test(val), 'Username cannot start or end with a hyphen'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(passwordStrengthRegex, 'Password must contain uppercase, lowercase, number, and special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof RegisterSchema>;

// ─── Email Verification Schema ───────────────────────────────────────────────
export const EmailVerificationSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export type EmailVerificationInput = z.infer<typeof EmailVerificationSchema>;

// ─── Phone Registration Schema (Task 9) ──────────────────────────────────────
export const PhoneRegistrationSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number (e.g., +8801712345678)'),
});

export type PhoneRegistrationInput = z.infer<typeof PhoneRegistrationSchema>;

// ─── Phone OTP Verification Schema ───────────────────────────────────────────
export const PhoneOtpVerificationSchema = z.object({
  phoneNumber: z.string().min(1, 'Phone number is required'),
  otp: z
    .string()
    .min(6, 'OTP must be 6 digits')
    .max(6, 'OTP must be 6 digits')
    .regex(/^\d{6}$/, 'OTP must be exactly 6 digits'),
});

export type PhoneOtpVerificationInput = z.infer<typeof PhoneOtpVerificationSchema>;

// ─── Account Linking Schema (Task 10) ────────────────────────────────────────
export const AccountLinkSchema = z.object({
  provider: z.string().min(1, 'Provider is required'),
  providerAccountId: z.string().min(1, 'Provider account ID is required'),
});

export type AccountLinkInput = z.infer<typeof AccountLinkSchema>;

// ─── Backup Email Schema ─────────────────────────────────────────────────────
export const BackupEmailSchema = z.object({
  backupEmail: z
    .string()
    .email('Please enter a valid backup email')
    .refine((email) => email.length > 0, 'Backup email is required'),
});

export type BackupEmailInput = z.infer<typeof BackupEmailSchema>;

// ─── Forgot Password Schema ──────────────────────────────────────────────────
export const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

// ─── Reset Password Schema ───────────────────────────────────────────────────
export const ResetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(passwordStrengthRegex, 'Password must contain uppercase, lowercase, number, and special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

// ─── Change Password Schema (Task 21) ───────────────────────────────────────
export const ChangePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(passwordStrengthRegex, 'Password must contain uppercase, lowercase, number, and special character'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
