/**
 * TOTP (Time-based One-Time Password) Utility
 * Task 20: 2FA authenticator support
 * 
 * Uses Google Authenticator compatible TOTP
 */

import { generate, generateSecret, verify } from 'otplib';
import * as qrcode from 'qrcode';
import crypto from 'crypto';

// TOTP Configuration
const TOTP_STEP = 30; // 30 second window
const TOTP_DIGITS = 6;

/**
 * Generate a new TOTP secret (Base32 encoded)
 */
export function generateTOTPSecret(): string {
  return generateSecret();
}

/**
 * Generate TOTP token from secret
 */
export async function generateTOTPToken(secret: string): Promise<string> {
  return generate({ secret });
}

/**
 * Verify TOTP token
 * Allows 1 step window (30 seconds before/after) for clock skew
 */
export async function verifyTOTPToken(token: string, secret: string): Promise<boolean> {
  try {
    // Verify TOTP token
    const result = await verify({
      token,
      secret,
    });
    
    return result.valid;
  } catch (error) {
    return false;
  }
}

/**
 * Generate OTP Auth URI for authenticator app QR code
 */
export function generateTOTPUri(
  email: string,
  secret: string,
  issuer: string = 'iNAYA Auth'
): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_STEP}`;
}

/**
 * Generate QR code as data URL
 */
export async function generateQRCode(uri: string): Promise<string> {
  return qrcode.toDataURL(uri, {
    width: 300,
    margin: 2,
    color: {
      dark: '#6D28D9', // iNAYA primary color
      light: '#FFFFFF',
    },
  });
}

/**
 * Generate backup/recovery codes
 * Returns array of unique 8-character codes
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    // Format: XXXX-XXXX (8 chars with dash)
    const formattedCode = `${code.substring(0, 4)}-${code.substring(4, 8)}`;
    codes.push(formattedCode);
  }
  
  return codes;
}

/**
 * Verify backup code
 */
export function verifyBackupCode(
  code: string,
  backupCodes: string[]
): { valid: boolean; remainingCodes: string[] } {
  const normalizedCode = code.toUpperCase().replace(/[\s-]/g, '');
  const index = backupCodes.findIndex(c => c.replace(/-/g, '') === normalizedCode);
  
  if (index === -1) {
    return { valid: false, remainingCodes: backupCodes };
  }
  
  // Remove used code
  const remainingCodes = [...backupCodes];
  remainingCodes.splice(index, 1);
  
  return { valid: true, remainingCodes };
}

/**
 * Encrypt sensitive data (secret, backup codes)
 */
export function encryptData(data: string): string {
  const encryptionKey = process.env.ENCRYPTION_KEY || process.env.AUTH_SECRET;
  if (!encryptionKey) {
    throw new Error('ENCRYPTION_KEY or AUTH_SECRET must be set');
  }
  
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(encryptionKey, 'hex').slice(0, 32);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt sensitive data
 */
export function decryptData(encryptedData: string): string {
  const encryptionKey = process.env.ENCRYPTION_KEY || process.env.AUTH_SECRET;
  if (!encryptionKey) {
    throw new Error('ENCRYPTION_KEY or AUTH_SECRET must be set');
  }
  
  const [ivHex, encrypted] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const key = Buffer.from(encryptionKey, 'hex').slice(0, 32);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
