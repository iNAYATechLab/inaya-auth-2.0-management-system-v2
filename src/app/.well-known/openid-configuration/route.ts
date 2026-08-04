/**
 * OpenID Connect Discovery Endpoint
 * Task 24: OIDC auto-discovery
 * 
 * GET /.well-known/openid-configuration
 */

import { NextResponse } from 'next/server';
import { getOpenIDConfiguration } from '@/lib/oauth/oauth.util';

export async function GET() {
  const config = getOpenIDConfiguration();
  
  return NextResponse.json(config, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
