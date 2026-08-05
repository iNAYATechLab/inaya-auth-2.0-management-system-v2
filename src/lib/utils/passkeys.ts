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
    userID: userEmail,
    excludeCredentials: existingPasskeys.map((pk) => ({
      id: pk.credentialId,
      type: 'public-key' as const,
      transports: [] as AuthenticatorTransport[],
    })) as any,
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
  response: any,
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

    const { credentialID, credentialPublicKey, counter, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

    // Save passkey to database
    const passkey = await prisma.passkey.create({
      data: {
        userId,
        credentialId: Buffer.from(credentialID).toString('base64url'),
        publicKey: Buffer.from(credentialPublicKey).toString('base64url'),
        counter: BigInt(counter),
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
        transports: response.response?.transports || [],
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
    allowCredentials: allowCredentials as any,
    userVerification: 'preferred',
  });

  return {
    options,
    challenge: options.challenge,
  };
}

// ─── Verify Authentication Response ──────────────────────────────────────────
export async function verifyPasskeyAuthentication(
  response: any,
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
      authenticator: {
        credentialID: Buffer.from(passkey.credentialId, 'base64url'),
        credentialPublicKey: Buffer.from(passkey.publicKey, 'base64url'),
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
