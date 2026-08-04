/**
 * TOTP (Time-based One-Time Password) Utility
 * Task 20: 2FA authenticator support
 * 
 * Uses Google Authenticator compatible TOTP
 */

import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';
import crypto from 'crypto';

// Configure authenticator
authenticator.options = {
  window: 1, // Allow 1 step before/after for clock skew
  step: 30,  // 30 second window
};

/**
 * Generate a new TOTP secret
 */
export function generateTOTPSecret(): string {
  return authenticator.generateSecret();
}

/**
 * Generate TOTP token from secret
 */
export function generateTOTPToken(secret: string): string {
  return authenticator.generate(secret);
}

/**
 * Verify TOTP token
 */
export function verifyTOTPToken(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch (error) {
    return false;
  }
}

/**
 * Generate QR code URI for authenticator app
 */
export function generateTOTPUri(
  email: string,
  secret: string,
  issuer: string = 'iNAYA Auth'
): string {
  return authenticator.keyuri(email, issuer, secret);
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
 * Returns array of 10 unique 8-character codes
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
  const normalizedCode = code.toUpperCase().replace(/\s+/g, '');
  const index = backupCodes.findIndex(c => c.replace(/-/g, '') === normalizedCode.replace(/-/g, ''));
  
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
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encryptionKey, 'hex').slice(0, 32), iv);
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
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(encryptionKey, 'hex').slice(0, 32), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
