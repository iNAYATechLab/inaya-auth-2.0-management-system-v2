/**
 * OAuth 2.0 Authorization Endpoint
 * Task 24: SSO Authorization
 * 
 * GET /oauth/authorize - Show consent screen
 * POST /oauth/authorize - Process authorization
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  OAUTH_CONFIG,
  generateAuthorizationCode,
  validateRedirectUri,
  verifyCodeChallenge,
} from '@/lib/oauth/oauth.util';
import { logAction } from '@/lib/utils/audit';

/**
 * GET /oauth/authorize
 * Show authorization consent screen
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  const { searchParams } = new URL(request.url);

  // Extract OAuth parameters
  const response_type = searchParams.get('response_type');
  const client_id = searchParams.get('client_id');
  const redirect_uri = searchParams.get('redirect_uri');
  const scope = searchParams.get('scope') || 'openid';
  const state = searchParams.get('state');
  const code_challenge = searchParams.get('code_challenge');
  const code_challenge_method = searchParams.get('code_challenge_method') || 'plain';

  // Validate required parameters
  if (!response_type || !client_id || !redirect_uri) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Missing required parameters' },
      { status: 400 }
    );
  }

  // Validate response_type
  if (response_type !== 'code') {
    return NextResponse.json(
      { error: 'unsupported_response_type', error_description: 'Only "code" response type is supported' },
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
      { status: 400 }
    );
  }

  // Validate redirect_uri
  const allowedRedirectUris = client.redirectUris as string[];
  if (!validateRedirectUri(redirect_uri, allowedRedirectUris)) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Invalid redirect_uri' },
      { status: 400 }
    );
  }

  // Validate scopes
  const requestedScopes = scope.split(' ').filter(s => s);
  const allowedScopes = client.scopes as string[];
  const invalidScopes = requestedScopes.filter(s => !allowedScopes.includes(s));
  
  if (invalidScopes.length > 0) {
    return NextResponse.json(
      { error: 'invalid_scope', error_description: `Invalid scopes: ${invalidScopes.join(', ')}` },
      { status: 400 }
    );
  }

  // If user is not authenticated, redirect to login
  if (!session?.user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Check if user has already authorized this client
  const existingAuth = await prisma.oAuthAuthorization.findUnique({
    where: {
      userId_clientId: {
        userId: session.user.id,
        clientId: client.id,
      },
    },
  });

  // If already authorized and scopes match, auto-approve
  if (existingAuth) {
    const grantedScopes = existingAuth.scopes as string[];
    const allScopesGranted = requestedScopes.every(s => grantedScopes.includes(s));
    
    if (allScopesGranted) {
      // Generate authorization code
      const code = generateAuthorizationCode();
      const expiresAt = new Date(Date.now() + OAUTH_CONFIG.authorizationCodeTTL * 1000);

      // Store authorization code
      await prisma.oAuthAuthorizationCode.create({
        data: {
          code,
          clientId: client.id,
          userId: session.user.id,
          redirectUri: redirect_uri,
          scopes: requestedScopes,
          codeChallenge: code_challenge,
          codeChallengeMethod: code_challenge_method,
          expiresAt,
        },
      });

      // Redirect with code
      const redirectUrl = new URL(redirect_uri);
      redirectUrl.searchParams.set('code', code);
      if (state) {
        redirectUrl.searchParams.set('state', state);
      }

      return NextResponse.redirect(redirectUrl);
    }
  }

  // Show consent screen
  const consentHtml = generateConsentHTML({
    client: {
      name: client.name,
      description: client.description,
      logoUrl: client.logoUrl,
      websiteUrl: client.websiteUrl,
    },
    user: {
      name: session.user.name,
      email: session.user.email,
    },
    scopes: requestedScopes,
    redirect_uri,
    state,
    code_challenge,
    code_challenge_method,
  });

  return new NextResponse(consentHtml, {
    headers: { 'Content-Type': 'text/html' },
  });
}

/**
 * POST /oauth/authorize
 * Process authorization decision
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  const formData = await request.formData();

  // Extract parameters
  const action = formData.get('action'); // 'approve' or 'deny'
  const client_id = formData.get('client_id');
  const redirect_uri = formData.get('redirect_uri');
  const scope = formData.get('scope') || 'openid';
  const state = formData.get('state');
  const code_challenge = formData.get('code_challenge');
  const code_challenge_method = formData.get('code_challenge_method');

  if (!session?.user) {
    return NextResponse.json(
      { error: 'unauthorized', error_description: 'User not authenticated' },
      { status: 401 }
    );
  }

  // Find client
  const client = await prisma.oAuthClient.findUnique({
    where: { clientId: client_id as string, isActive: true },
  });

  if (!client) {
    return NextResponse.json(
      { error: 'invalid_client', error_description: 'Client not found' },
      { status: 400 }
    );
  }

  // If denied, redirect with error
  if (action !== 'approve') {
    const redirectUrl = new URL(redirect_uri as string);
    redirectUrl.searchParams.set('error', 'access_denied');
    redirectUrl.searchParams.set('error_description', 'User denied the request');
    if (state) {
      redirectUrl.searchParams.set('state', state as string);
    }
    return NextResponse.redirect(redirectUrl);
  }

  // Parse scopes
  const requestedScopes = (scope as string).split(' ').filter(s => s);

  // Generate authorization code
  const code = generateAuthorizationCode();
  const expiresAt = new Date(Date.now() + OAUTH_CONFIG.authorizationCodeTTL * 1000);

  // Store authorization code
  await prisma.oAuthAuthorizationCode.create({
    data: {
      code,
      clientId: client.id,
      userId: session.user.id,
      redirectUri: redirect_uri as string,
      scopes: requestedScopes,
      codeChallenge: code_challenge as string | null,
      codeChallengeMethod: (code_challenge_method as string) || 'plain',
      expiresAt,
    },
  });

  // Create or update authorization
  await prisma.oAuthAuthorization.upsert({
    where: {
      userId_clientId: {
        userId: session.user.id,
        clientId: client.id,
      },
    },
    update: {
      scopes: requestedScopes,
    },
    create: {
      userId: session.user.id,
      clientId: client.id,
      scopes: requestedScopes,
    },
  });

  // Log action
  await logAction({
    userId: session.user.id,
    action: 'ACCOUNT_LINKED',
    description: `Authorized OAuth client: ${client.name}`,
    metadata: { clientId: client.clientId, scopes: requestedScopes },
  });

  // Redirect with code
  const redirectUrl = new URL(redirect_uri as string);
  redirectUrl.searchParams.set('code', code);
  if (state) {
    redirectUrl.searchParams.set('state', state as string);
  }

  return NextResponse.redirect(redirectUrl);
}

/**
 * Generate consent screen HTML
 */
function generateConsentHTML(data: {
  client: { name: string; description?: string | null; logoUrl?: string | null; websiteUrl?: string | null };
  user: { name?: string | null; email?: string | null };
  scopes: string[];
  redirect_uri: string;
  state?: string | null;
  code_challenge?: string | null;
  code_challenge_method?: string | null;
}): string {
  const { client, user, scopes, redirect_uri, state, code_challenge, code_challenge_method } = data;

  const scopeDescriptions: Record<string, string> = {
    openid: 'Verify your identity',
    profile: 'Access your profile information (name, picture)',
    email: 'Access your email address',
    offline_access: 'Maintain access when you are not present',
  };

  const scopeIcons: Record<string, string> = {
    openid: '🔐',
    profile: '👤',
    email: '📧',
    offline_access: '🔄',
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Authorize ${client.name} - iNAYA Auth</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #F5F3FF 0%, #FFFFFF 50%, #FFFBEB 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      box-shadow: 0 10px 40px rgba(109, 40, 217, 0.1);
      max-width: 480px;
      width: 100%;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #6D28D9 0%, #F59E0B 100%);
      padding: 30px;
      text-align: center;
      color: white;
    }
    .client-logo {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      margin: 0 auto 16px;
      overflow: hidden;
    }
    .client-logo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .header h1 {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .header p {
      font-size: 14px;
      opacity: 0.9;
    }
    .content {
      padding: 30px;
    }
    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #F8FAFC;
      border-radius: 12px;
      margin-bottom: 24px;
    }
    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6D28D9 0%, #7C3AED 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
    }
    .user-details h3 {
      font-size: 14px;
      font-weight: 600;
      color: #1E293B;
    }
    .user-details p {
      font-size: 12px;
      color: #64748B;
    }
    .scopes-title {
      font-size: 14px;
      font-weight: 600;
      color: #1E293B;
      margin-bottom: 12px;
    }
    .scopes-list {
      list-style: none;
      margin-bottom: 24px;
    }
    .scope-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: #F8FAFC;
      border-radius: 10px;
      margin-bottom: 8px;
    }
    .scope-icon {
      font-size: 20px;
    }
    .scope-text {
      flex: 1;
    }
    .scope-text h4 {
      font-size: 13px;
      font-weight: 600;
      color: #1E293B;
    }
    .scope-text p {
      font-size: 11px;
      color: #64748B;
    }
    .buttons {
      display: flex;
      gap: 12px;
    }
    .btn {
      flex: 1;
      padding: 14px 24px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }
    .btn-approve {
      background: linear-gradient(135deg, #6D28D9 0%, #7C3AED 100%);
      color: white;
    }
    .btn-approve:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(109, 40, 217, 0.3);
    }
    .btn-deny {
      background: #F1F5F9;
      color: #475569;
    }
    .btn-deny:hover {
      background: #E2E8F0;
    }
    .footer {
      text-align: center;
      padding: 16px;
      background: #F8FAFC;
      font-size: 12px;
      color: #64748B;
    }
    .footer a {
      color: #6D28D9;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="client-logo">
        ${client.logoUrl ? `<img src="${client.logoUrl}" alt="${client.name}">` : '🔐'}
      </div>
      <h1>${client.name} wants to access your account</h1>
      <p>${client.description || 'An application using iNAYA Auth'}</p>
    </div>
    
    <div class="content">
      <div class="user-info">
        <div class="user-avatar">
          ${(user.name || user.email || 'U').charAt(0).toUpperCase()}
        </div>
        <div class="user-details">
          <h3>${user.name || 'User'}</h3>
          <p>${user.email || ''}</p>
        </div>
      </div>

      <div class="scopes-title">This app will be able to:</div>
      <ul class="scopes-list">
        ${scopes.map(scope => `
          <li class="scope-item">
            <span class="scope-icon">${scopeIcons[scope] || '📋'}</span>
            <div class="scope-text">
              <h4>${scope}</h4>
              <p>${scopeDescriptions[scope] || `Access to ${scope}`}</p>
            </div>
          </li>
        `).join('')}
      </ul>

      <form method="POST">
        <input type="hidden" name="client_id" value="${data.client ? '' : ''}">
        <input type="hidden" name="redirect_uri" value="${redirect_uri}">
        <input type="hidden" name="scope" value="${scopes.join(' ')}">
        ${state ? `<input type="hidden" name="state" value="${state}">` : ''}
        ${code_challenge ? `<input type="hidden" name="code_challenge" value="${code_challenge}">` : ''}
        ${code_challenge_method ? `<input type="hidden" name="code_challenge_method" value="${code_challenge_method}">` : ''}
        
        <div class="buttons">
          <button type="submit" name="action" value="deny" class="btn btn-deny">Cancel</button>
          <button type="submit" name="action" value="approve" class="btn btn-approve">Authorize</button>
        </div>
      </form>
    </div>

    <div class="footer">
      Powered by <a href="#">iNAYA Auth</a> · Secure Single Sign-On
    </div>
  </div>

  <script>
    // Set client_id from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const clientId = urlParams.get('client_id');
    if (clientId) {
      document.querySelector('input[name="client_id"]').value = clientId;
    }
  </script>
</body>
</html>
  `.trim();
}
