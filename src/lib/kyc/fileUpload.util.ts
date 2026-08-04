// KYC File Upload Utility (Task 35)
// Handles secure file upload and encryption

import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = process.env.KYC_UPLOAD_DIR || './uploads/kyc';
const ENCRYPTION_KEY = process.env.KYC_ENCRYPTION_KEY || process.env.AUTH_SECRET || 'default-key';

/**
 * Ensure upload directory exists
 */
async function ensureUploadDir(): Promise<void> {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create upload directory:', error);
  }
}

/**
 * Generate secure file path with encryption
 */
export function generateSecureFilePath(userId: string, fileType: string): string {
  const timestamp = Date.now();
  const uniqueId = uuidv4();
  const fileName = `${userId}_${fileType}_${timestamp}_${uniqueId}`;
  return path.join(UPLOAD_DIR, fileName);
}

/**
 * Encrypt file data before storage
 */
export function encryptFileData(data: Buffer): { encrypted: Buffer; iv: string } {
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  
  return {
    encrypted,
    iv: iv.toString('hex'),
  };
}

/**
 * Decrypt file data
 */
export function decryptFileData(encrypted: Buffer, iv: string): Buffer {
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(iv, 'hex'));
  
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

/**
 * Save encrypted file to disk
 */
export async function saveEncryptedFile(
  filePath: string,
  data: Buffer
): Promise<{ path: string; iv: string; size: number }> {
  await ensureUploadDir();
  
  const { encrypted, iv } = encryptFileData(data);
  await fs.writeFile(filePath, encrypted);
  
  return {
    path: filePath,
    iv,
    size: encrypted.length,
  };
}

/**
 * Read and decrypt file from disk
 */
export async function readEncryptedFile(filePath: string, iv: string): Promise<Buffer> {
  const encrypted = await fs.readFile(filePath);
  return decryptFileData(encrypted, iv);
}

/**
 * Delete encrypted file
 */
export async function deleteEncryptedFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error('Failed to delete file:', error);
  }
}

/**
 * Validate file type and size
 */
export function validateFile(
  file: { mimetype: string; size: number },
  allowedTypes: string[],
  maxSize: number
): { valid: boolean; error?: string } {
  if (!allowedTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`,
    };
  }
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`,
    };
  }
  
  return { valid: true };
}
