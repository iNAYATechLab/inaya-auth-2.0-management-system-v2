/**
 * OAuth 2.0 Token Endpoint
 * Task 24: Token issuance
 * 
 * POST /oauth/token
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  OAUTH_CONFIG,
  generateAccessToken,
  generateRefreshToken,
  verifyCodeChallenge,
} from '@/lib/oauth/oauth.util';
import * as jose from 'jose';
import { logAction } from '@/lib/utils/audit';

/**
 * POST /oauth/token
 * Exchange authorization code or refresh token for access token
 */
export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type');
  let body: URLSearchParams | any;

  if (contentType?.includes('application/x-www-form-urlencoded')) {
    const formData = await request.formData();
    body = new URLSearchParams();
    formData.forEach((value, key) => body.set(key, value as string));
  } else {
    body = await request.json();
  }

  const grant_type = body.get('grant_type') || body.grant_type;

  switch (grant_type) {
    case 'authorization_code':
      return await handleAuthorizationCodeGrant(body);
    case 'refresh_token':
      return await handleRefreshTokenGrant(body);
    default:
      return NextResponse.json(
        { error: 'unsupported_grant_type', error_description: 'Grant type not supported' },
        { status: 400 }
      );
  }
}

/**
 * Handle authorization code grant
 */
async function handleAuthorizationCodeGrant(body: any): Promise<NextResponse> {
  const code = body.get('code') || body.code;
  const client_id = body.get('client_id') || body.client_id;
  const client_secret = body.get('client_secret') || body.client_secret;
  const redirect_uri = body.get('redirect_uri') || body.redirect_uri;
  const code_verifier = body.get('code_verifier') || body.code_verifier;

  // Validate required parameters
  if (!code || !client_id || !redirect_uri) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Missing required parameters' },
      { status: 400 }
    );
  }

  // Find client
  const client = await prisma.oAuthClient.findUnique({
    where: { clientId: client_id, isActive: true },
  });

  if (!client) {
    return NextResponse.json(
      { error: 'invalid_client', error_description: 'Client not found' },
      { status: 401 }
    );
  }

  // Validate client secret (if not public client)
  if (!client.isPublic) {
    if (!client_secret) {
      return NextResponse.json(
        { error: 'invalid_client', error_description: 'Client secret required' },
        { status: 401 }
      );
    }

    // Decrypt and compare client secret
    // In production, use proper encryption
    if (client.clientSecret !== client_secret) {
      return NextResponse.json(
        { error: 'invalid_client', error_description: 'Invalid client credentials' },
        { status: 401 }
      );
    }
  }

  // Find authorization code
  const authCode = await prisma.oAuthAuthorizationCode.findUnique({
    where: { code },
  });

  if (!authCode) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Invalid authorization code' },
      { status: 400 }
    );
  }

  // Check if code is expired
  if (authCode.expiresAt < new Date()) {
    await prisma.oAuthAuthorizationCode.delete({ where: { id: authCode.id } });
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Authorization code expired' },
      { status: 400 }
    );
  }

  // Check if code was already used
  if (authCode.usedAt) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Authorization code already used' },
      { status: 400 }
    );
  }

  // Validate redirect_uri matches
  if (authCode.redirectUri !== redirect_uri) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Redirect URI mismatch' },
      { status: 400 }
    );
  }

  // Validate PKCE if code_challenge was provided
  if (authCode.codeChallenge) {
    if (!code_verifier) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'Code verifier required for PKCE' },
        { status: 400 }
      );
    }

    const isValid = verifyCodeChallenge(
      code_verifier,
      authCode.codeChallenge,
      authCode.codeChallengeMethod || 'plain'
    );

    if (!isValid) {
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Invalid code verifier' },
        { status: 400 }
      );
    }
  }

  // Mark authorization code as used
  await prisma.oAuthAuthorizationCode.update({
    where: { id: authCode.id },
    data: { usedAt: new Date() },
  });

  // Generate access token
  const { token: accessToken, expiresAt: accessTokenExpiresAt } = await generateAccessToken(
    authCode.userId,
    client.id,
    authCode.scopes as string[]
  );

  // Store access token
  await prisma.oAuthAccessToken.create({
    data: {
      token: accessToken,
      clientId: client.id,
      userId: authCode.userId,
      scopes: authCode.scopes,
      expiresAt: accessTokenExpiresAt,
    },
  });

  const scopes = authCode.scopes as string[];
  const response: any = {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: OAUTH_CONFIG.accessTokenTTL,
    scope: scopes.join(' '),
  };

  // Generate refresh token if offline_access scope was requested
  if (scopes.includes('offline_access')) {
    const { token: refreshToken, expiresAt: refreshTokenExpiresAt } = generateRefreshToken();

    // Store refresh token
    await prisma.oAuthRefreshToken.create({
      data: {
        token: refreshToken,
        clientId: client.id,
        userId: authCode.userId,
        scopes: authCode.scopes,
        expiresAt: refreshTokenExpiresAt,
      },
    });

    response.refresh_token = refreshToken;
  }

  // Generate ID token if openid scope was requested
  if (scopes.includes('openid')) {
    const idToken = await generateIdToken(authCode.userId, client.id, scopes);
    response.id_token = idToken;
  }

  // Log action
  await logAction({
    userId: authCode.userId,
    action: 'LOGIN',
    description: `OAuth token issued for client: ${client.name}`,
    metadata: { clientId: client.clientId, scopes },
  });

  return NextResponse.json(response, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Pragma': 'no-cache',
    },
  });
}

/**
 * Handle refresh token grant
 */
async function handleRefreshTokenGrant(body: any): Promise<NextResponse> {
  const refresh_token = body.get('refresh_token') || body.refresh_token;
  const client_id = body.get('client_id') || body.client_id;
  const client_secret = body.get('client_secret') || body.client_secret;

  // Validate required parameters
  if (!refresh_token || !client_id) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Missing required parameters' },
      { status: 400 }
    );
  }

  // Find client
  const client = await prisma.oAuthClient.findUnique({
    where: { clientId: client_id, isActive: true },
  });

  if (!client) {
    return NextResponse.json(
      { error: 'invalid_client', error_description: 'Client not found' },
      { status: 401 }
    );
  }

  // Validate client secret (if not public client)
  if (!client.isPublic && client_secret !== client.clientSecret) {
    return NextResponse.json(
      { error: 'invalid_client', error_description: 'Invalid client credentials' },
      { status: 401 }
    );
  }

  // Find refresh token
  const storedRefreshToken = await prisma.oAuthRefreshToken.findUnique({
    where: { token: refresh_token },
  });

  if (!storedRefreshToken) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Invalid refresh token' },
      { status: 400 }
    );
  }

  // Check if token is expired
  if (storedRefreshToken.expiresAt < new Date()) {
    await prisma.oAuthRefreshToken.delete({ where: { id: storedRefreshToken.id } });
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Refresh token expired' },
      { status: 400 }
    );
  }

  // Check if token was revoked
  if (storedRefreshToken.revokedAt) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Refresh token revoked' },
      { status: 400 }
    );
  }

  // Validate client matches
  if (storedRefreshToken.clientId !== client.id) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Client mismatch' },
      { status: 400 }
    );
  }

  // Generate new access token
  const { token: accessToken, expiresAt: accessTokenExpiresAt } = await generateAccessToken(
    storedRefreshToken.userId,
    client.id,
    storedRefreshToken.scopes as string[]
  );

  // Store new access token
  await prisma.oAuthAccessToken.create({
    data: {
      token: accessToken,
      clientId: client.id,
      userId: storedRefreshToken.userId,
      scopes: storedRefreshToken.scopes,
      expiresAt: accessTokenExpiresAt,
    },
  });

  const scopes = storedRefreshToken.scopes as string[];
  const response: any = {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: OAUTH_CONFIG.accessTokenTTL,
    scope: scopes.join(' '),
  };

  // Generate new refresh token (rotation)
  const { token: newRefreshToken, expiresAt: newRefreshTokenExpiresAt } = generateRefreshToken();

  // Revoke old refresh token
  await prisma.oAuthRefreshToken.update({
    where: { id: storedRefreshToken.id },
    data: { revokedAt: new Date() },
  });

  // Create new refresh token
  await prisma.oAuthRefreshToken.create({
    data: {
      token: newRefreshToken,
      clientId: client.id,
      userId: storedRefreshToken.userId,
      scopes: storedRefreshToken.scopes,
      expiresAt: newRefreshTokenExpiresAt,
    },
  });

  response.refresh_token = newRefreshToken;

  // Generate ID token if openid scope was requested
  if (scopes.includes('openid')) {
    const idToken = await generateIdToken(storedRefreshToken.userId, client.id, scopes);
    response.id_token = idToken;
  }

  return NextResponse.json(response, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Pragma': 'no-cache',
    },
  });
}

/**
 * Generate ID token (JWT) for OIDC
 */
async function generateIdToken(userId: string, clientId: string, scopes: string[]): Promise<string> {
  const { privateKey, jwk } = await import('@/lib/oauth/oauth.util').then(m => m.getKeyPair());

  // Get user information
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      emailVerified: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Build claims based on scopes
  const claims: any = {
    sub: user.id,
  };

  if (scopes.includes('profile')) {
    claims.name = user.name;
    claims.picture = user.image;
  }

  if (scopes.includes('email')) {
    claims.email = user.email;
    claims.email_verified = user.emailVerified !== null;
  }

  // Create ID token
  const idToken = await new jose.SignJWT(claims)
    .setProtectedHeader({ alg: 'RS256', kid: jwk.kid })
    .setIssuedAt()
    .setIssuer(OAUTH_CONFIG.issuer)
    .setAudience(clientId)
    .setExpirationTime('1h')
    .sign(privateKey);

  return idToken;
}
