/**
 * Password Hashing Utility
 * Task 22: Support for bcrypt and argon2
 * 
 * Configurable via PASSWORD_HASH_ALGORITHM environment variable
 * Default: bcrypt (widely supported)
 * Recommended: argon2 (more secure, OWASP recommended)
 */

import bcrypt from 'bcryptjs';

// Determine which algorithm to use
const HASH_ALGORITHM = process.env.PASSWORD_HASH_ALGORITHM || 'bcrypt';

// bcrypt config
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

// argon2 config
const ARGON2_OPTIONS = {
  timeCost: parseInt(process.env.ARGON2_TIME_COST || '3'),
  memoryCost: parseInt(process.env.ARGON2_MEMORY_COST || '65536'), // 64 MB
  parallelism: parseInt(process.env.ARGON2_PARALLELISM || '4'),
};

/**
 * Hash password using configured algorithm
 */
export async function hashPassword(password: string): Promise<string> {
  if (HASH_ALGORITHM === 'argon2') {
    return await hashWithArgon2(password);
  }
  return await hashWithBcrypt(password);
}

/**
 * Verify password against hash
 * Auto-detects algorithm from hash format
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Argon2 hashes start with $argon2
  if (hash.startsWith('$argon2')) {
    return await verifyWithArgon2(password, hash);
  }
  // bcrypt hashes start with $2a$, $2b$, or $2y$
  return await verifyWithBcrypt(password, hash);
}

/**
 * Check if hash needs to be rehashed (e.g., if algorithm changed or rounds increased)
 */
export function needsRehash(hash: string): boolean {
  // If current algorithm is argon2 but hash is bcrypt
  if (HASH_ALGORITHM === 'argon2' && !hash.startsWith('$argon2')) {
    return true;
  }
  
  // If current algorithm is bcrypt but hash is argon2
  if (HASH_ALGORITHM === 'bcrypt' && hash.startsWith('$argon2')) {
    return true;
  }
  
  // For bcrypt, check if rounds have increased
  if (HASH_ALGORITHM === 'bcrypt') {
    const match = hash.match(/^\$2[aby]\$(\d+)\$/);
    if (match) {
      const hashRounds = parseInt(match[1]);
      return hashRounds < BCRYPT_ROUNDS;
    }
  }
  
  return false;
}

// ─── bcrypt Implementation ──────────────────────────────────────────────────

async function hashWithBcrypt(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
  return await bcrypt.hash(password, salt);
}

async function verifyWithBcrypt(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// ─── argon2 Implementation ──────────────────────────────────────────────────

async function hashWithArgon2(password: string): Promise<string> {
  try {
    const argon2 = await import('argon2');
    return await argon2.hash(password, {
      type: argon2.argon2id, // Use argon2id variant
      timeCost: ARGON2_OPTIONS.timeCost,
      memoryCost: ARGON2_OPTIONS.memoryCost,
      parallelism: ARGON2_OPTIONS.parallelism,
    });
  } catch (error) {
    console.error('Argon2 hash error:', error);
    throw new Error('Failed to hash password with argon2');
  }
}

async function verifyWithArgon2(password: string, hash: string): Promise<boolean> {
  try {
    const argon2 = await import('argon2');
    return await argon2.verify(hash, password);
  } catch (error) {
    console.error('Argon2 verify error:', error);
    return false;
  }
}

/**
 * Get current hash algorithm info
 */
export function getHashAlgorithmInfo() {
  return {
    algorithm: HASH_ALGORITHM,
    config: HASH_ALGORITHM === 'bcrypt' 
      ? { rounds: BCRYPT_ROUNDS }
      : ARGON2_OPTIONS,
  };
}
