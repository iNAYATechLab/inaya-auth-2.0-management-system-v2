// Passkey/WebAuthn Utility (Task 13)
// Implements passwordless authentication using FIDO2/WebAuthn

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type VerifiedRegistrationResponse,
  type VerifiedAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/browser';
import { prisma } from '@/lib/prisma';

// ─── Configuration ───────────────────────────────────────────────────────────
const rpName = 'iNAYA Auth 2.0';
const rpID = process.env.NEXT_PUBLIC_APP_URL 
  ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname 
  : 'localhost';
const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ─── Generate Registration Options ───────────────────────────────────────────
export async function generatePasskeyRegistrationOptions(userId: string, userEmail: string) {
  // Get existing passkeys to exclude
  const existingPasskeys = await prisma.passkey.findMany({
    where: { userId },
    select: { credentialId: true },
  });

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: userEmail,
    attestationType: 'none',
    excludeCredentials: existingPasskeys.map((pk) => ({
      id: pk.credentialId,
      type: 'public-key' as const,
      transports: [] as AuthenticatorTransport[],
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  });

  // Store challenge in session/cookie (for verification)
  return {
    options,
    challenge: options.challenge,
  };
}

// ─── Verify Registration Response ────────────────────────────────────────────
export async function verifyPasskeyRegistration(
  userId: string,
  response: RegistrationResponseJSON,
  challenge: string
): Promise<{ success: boolean; credentialId?: string; error?: string }> {
  try {
    const verification: VerifiedRegistrationResponse = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return { success: false, error: 'Passkey verification failed' };
    }

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

    // Save passkey to database
    const passkey = await prisma.passkey.create({
      data: {
        userId,
        credentialId: Buffer.from(credential.id).toString('base64url'),
        publicKey: Buffer.from(credential.publicKey).toString('base64url'),
        counter: credential.counter,
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
        transports: response.response.transports || [],
      },
    });

    return { success: true, credentialId: passkey.credentialId };
  } catch (error) {
    console.error('Passkey registration verification error:', error);
    return { success: false, error: 'Failed to verify passkey registration' };
  }
}

// ─── Generate Authentication Options ─────────────────────────────────────────
export async function generatePasskeyAuthenticationOptions(credentialId?: string) {
  const allowCredentials = credentialId
    ? [{ id: credentialId, type: 'public-key' as const }]
    : undefined;

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials,
    userVerification: 'preferred',
  });

  return {
    options,
    challenge: options.challenge,
  };
}

// ─── Verify Authentication Response ──────────────────────────────────────────
export async function verifyPasskeyAuthentication(
  response: AuthenticationResponseJSON,
  challenge: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const credentialId = response.id;

    // Find passkey in database
    const passkey = await prisma.passkey.findUnique({
      where: { credentialId },
      include: { user: true },
    });

    if (!passkey) {
      return { success: false, error: 'Passkey not found' };
    }

    if (!passkey.user.isActive) {
      return { success: false, error: 'Account is deactivated' };
    }

    const verification: VerifiedAuthenticationResponse = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: passkey.credentialId,
        publicKey: Buffer.from(passkey.publicKey, 'base64url'),
        counter: Number(passkey.counter),
        transports: passkey.transports as AuthenticatorTransport[],
      },
    });

    if (!verification.verified) {
      return { success: false, error: 'Passkey authentication failed' };
    }

    // Update counter
    await prisma.passkey.update({
      where: { id: passkey.id },
      data: {
        counter: BigInt(verification.authenticationInfo.newCounter),
        lastUsedAt: new Date(),
      },
    });

    return { success: true, userId: passkey.userId };
  } catch (error) {
    console.error('Passkey authentication verification error:', error);
    return { success: false, error: 'Failed to verify passkey authentication' };
  }
}

// ─── Get User Passkeys ───────────────────────────────────────────────────────
export async function getUserPasskeys(userId: string) {
  return prisma.passkey.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      deviceType: true,
      backedUp: true,
      transports: true,
      lastUsedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

// ─── Delete Passkey ──────────────────────────────────────────────────────────
export async function deletePasskey(passkeyId: string, userId: string) {
  const passkey = await prisma.passkey.findUnique({
    where: { id: passkeyId },
  });

  if (!passkey || passkey.userId !== userId) {
    throw new Error('Passkey not found');
  }

  await prisma.passkey.delete({
    where: { id: passkeyId },
  });

  return { success: true };
}

// ─── Check WebAuthn Support ──────────────────────────────────────────────────
export function isWebAuthnSupported(): boolean {
  return typeof window !== 'undefined' && 
    typeof window.PublicKeyCredential !== 'undefined';
}
