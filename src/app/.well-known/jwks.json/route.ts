/**
 * JWKS (JSON Web Key Set) Endpoint
 * Task 24: Public key distribution for token verification
 * 
 * GET /.well-known/jwks.json
 */

import { NextResponse } from 'next/server';
import { getJWKS } from '@/lib/oauth/oauth.util';

export async function GET() {
  const jwks = await getJWKS();
  
  return NextResponse.json(jwks, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
}
