/**
 * OAuth 2.0 UserInfo Endpoint
 * Task 24: User information endpoint
 * 
 * GET /oauth/userinfo
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/oauth/oauth.util';

/**
 * GET /oauth/userinfo
 * Return user information based on access token and scopes
 */
export async function GET(request: NextRequest) {
  // Extract access token from Authorization header
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Missing or invalid authorization header' },
      { status: 401 }
    );
  }

  const accessToken = authHeader.substring(7);

  // Verify access token
  const { valid, payload, error } = await verifyAccessToken(accessToken);
  if (!valid || !payload) {
    return NextResponse.json(
      { error: 'invalid_token', error_description: error || 'Invalid access token' },
      { status: 401 }
    );
  }

  // Check if token is revoked
  const storedToken = await prisma.oAuthAccessToken.findUnique({
    where: { token: accessToken },
  });

  if (!storedToken) {
    return NextResponse.json(
      { error: 'invalid_token', error_description: 'Token not found' },
      { status: 401 }
    );
  }

  if (storedToken.revokedAt) {
    return NextResponse.json(
      { error: 'invalid_token', error_description: 'Token revoked' },
      { status: 401 }
    );
  }

  if (storedToken.expiresAt < new Date()) {
    return NextResponse.json(
      { error: 'invalid_token', error_description: 'Token expired' },
      { status: 401 }
    );
  }

  // Get user information
  const user = await prisma.user.findUnique({
    where: { id: storedToken.userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: 'invalid_token', error_description: 'User not found' },
      { status: 401 }
    );
  }

  // Build response based on scopes
  const scopes = storedToken.scopes as string[];
  const userInfo: any = {
    sub: user.id,
  };

  // Add profile information if scope granted
  if (scopes.includes('profile')) {
    userInfo.name = user.name;
    userInfo.picture = user.image;
    userInfo.updated_at = user.createdAt.toISOString();
  }

  // Add email information if scope granted
  if (scopes.includes('email')) {
    userInfo.email = user.email;
    userInfo.email_verified = user.emailVerified !== null;
  }

  return NextResponse.json(userInfo, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
