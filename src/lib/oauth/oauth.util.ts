/**
 * OAuth 2.0 / OIDC Utility Functions
 * Task 23-24: SSO / Identity Provider
 */

import * as jose from 'jose';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

// OAuth configuration
export const OAUTH_CONFIG = {
  issuer: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  accessTokenTTL: 3600, // 1 hour
  refreshTokenTTL: 2592000, // 30 days
  authorizationCodeTTL: 600, // 10 minutes
  scopes: ['openid', 'profile', 'email', 'offline_access'],
};

// RSA Key Pair for JWT signing (JWKS)
let keyPair: { publicKey: any; privateKey: any; jwk: jose.JWK } | null = null;

/**
 * Generate or retrieve RSA key pair for JWT signing
 */
export async function getKeyPair() {
  if (keyPair) return keyPair;

  // Generate RSA key pair
  const { publicKey, privateKey } = await jose.generateKeyPair('RS256', {
    extractable: true,
  });

  // Export public key as JWK
  const jwk = await jose.exportJWK(publicKey);
  jwk.kid = 'inaya-auth-key-1'; // Key ID
  jwk.use = 'sig';
  jwk.alg = 'RS256';

  keyPair = { publicKey, privateKey, jwk };
  return keyPair;
}

/**
 * Generate OAuth client credentials
 */
export function generateClientCredentials(): { clientId: string; clientSecret: string } {
  const clientId = `inaya_${uuidv4().replace(/-/g, '')}`;
  const clientSecret = crypto.randomBytes(32).toString('hex');
  return { clientId, clientSecret };
}

/**
 * Generate authorization code
 */
export function generateAuthorizationCode(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate access token (JWT)
 */
export async function generateAccessToken(
  userId: string,
  clientId: string,
  scopes: string[]
): Promise<{ token: string; expiresAt: Date }> {
  const { privateKey, jwk } = await getKeyPair();
  
  const expiresAt = new Date(Date.now() + OAUTH_CONFIG.accessTokenTTL * 1000);
  
  const jwt = await new jose.SignJWT({
    sub: userId,
    client_id: clientId,
    scope: scopes.join(' '),
  })
    .setProtectedHeader({ alg: 'RS256', kid: jwk.kid })
    .setIssuedAt()
    .setIssuer(OAUTH_CONFIG.issuer)
    .setAudience(clientId)
    .setExpirationTime(expiresAt)
    .setJti(uuidv4())
    .sign(privateKey);

  return { token: jwt, expiresAt };
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(): { token: string; expiresAt: Date } {
  const token = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + OAUTH_CONFIG.refreshTokenTTL * 1000);
  return { token, expiresAt };
}

/**
 * Verify access token
 */
export async function verifyAccessToken(token: string): Promise<{
  valid: boolean;
  payload?: any;
  error?: string;
}> {
  try {
    const { publicKey } = await getKeyPair();
    const { payload } = await jose.jwtVerify(token, publicKey, {
      issuer: OAUTH_CONFIG.issuer,
    });

    return { valid: true, payload };
  } catch (error) {
    return { valid: false, error: 'Invalid or expired token' };
  }
}

/**
 * Validate redirect URI
 */
export function validateRedirectUri(redirectUri: string, allowedUris: string[]): boolean {
  return allowedUris.includes(redirectUri);
}

/**
 * PKCE: Generate code challenge from verifier
 */
export function generateCodeChallenge(verifier: string, method: string = 'S256'): string {
  if (method === 'plain') {
    return verifier;
  }
  
  // S256
  const hash = crypto.createHash('sha256').update(verifier).digest();
  return hash.toString('base64url');
}

/**
 * PKCE: Verify code verifier against challenge
 */
export function verifyCodeChallenge(verifier: string, challenge: string, method: string): boolean {
  const expected = generateCodeChallenge(verifier, method);
  return expected === challenge;
}

/**
 * Get OpenID Connect configuration
 */
export function getOpenIDConfiguration(): any {
  return {
    issuer: OAUTH_CONFIG.issuer,
    authorization_endpoint: `${OAUTH_CONFIG.issuer}/oauth/authorize`,
    token_endpoint: `${OAUTH_CONFIG.issuer}/oauth/token`,
    userinfo_endpoint: `${OAUTH_CONFIG.issuer}/oauth/userinfo`,
    jwks_uri: `${OAUTH_CONFIG.issuer}/.well-known/jwks.json`,
    scopes_supported: OAUTH_CONFIG.scopes,
    response_types_supported: ['code', 'token'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256'],
    token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
    code_challenge_methods_supported: ['S256', 'plain'],
  };
}

/**
 * Get JWKS (JSON Web Key Set)
 */
export async function getJWKS(): Promise<{ keys: any[] }> {
  const { jwk } = await getKeyPair();
  return { keys: [jwk] };
}
