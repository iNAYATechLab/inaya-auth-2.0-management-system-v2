/**
 * SSO Integration Documentation Page
 * Task 26: Reusable integration code + guides
 */

export default function SSODocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50/30">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-inaya-gradient flex items-center justify-center">
              <span className="text-lg font-bold text-white">iN</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-neutral-900">iNAYA Auth 2.0</h1>
              <p className="text-xs text-neutral-500">SSO Integration Guide</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">SSO Integration Guide</h2>
        <p className="text-neutral-600 mb-8">
          Connect your applications to iNAYA Auth for Single Sign-On
        </p>

        <div className="space-y-6">
          {/* Discovery Endpoint */}
          <section className="bg-white rounded-xl border border-neutral-200 p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-3">
              🔍 OpenID Connect Discovery
            </h3>
            <p className="text-sm text-neutral-600 mb-4">
              All configuration is available via the discovery endpoint:
            </p>
            <pre className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 text-sm overflow-x-auto">
              <code>{`GET /.well-known/openid-configuration`}</code>
            </pre>
          </section>

          {/* Quick Start */}
          <section className="bg-white rounded-xl border border-neutral-200 p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-3">
              🚀 Quick Start (5 Minutes)
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-neutral-900 mb-2">Step 1: Create OAuth Application</h4>
                <p className="text-sm text-neutral-600">
                  Go to <a href="/oauth-clients/new" className="text-primary-700 hover:underline">OAuth Applications</a> and create a new application.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-neutral-900 mb-2">Step 2: Configure Redirect URI</h4>
                <p className="text-sm text-neutral-600">
                  Add your application's callback URL (e.g., <code className="bg-neutral-100 px-1 rounded">http://localhost:3000/api/auth/callback</code>)
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-neutral-900 mb-2">Step 3: Integrate</h4>
                <p className="text-sm text-neutral-600">
                  Use the code examples below to integrate with your application.
                </p>
              </div>
            </div>
          </section>

          {/* Endpoints */}
          <section className="bg-white rounded-xl border border-neutral-200 p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-3">
              📡 OAuth 2.0 / OIDC Endpoints
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-mono rounded">GET</span>
                <div>
                  <code className="text-sm font-mono">/oauth/authorize</code>
                  <p className="text-xs text-neutral-600 mt-1">Authorization endpoint - redirects user to login</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-mono rounded">POST</span>
                <div>
                  <code className="text-sm font-mono">/oauth/token</code>
                  <p className="text-xs text-neutral-600 mt-1">Token endpoint - exchange code for tokens</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-mono rounded">GET</span>
                <div>
                  <code className="text-sm font-mono">/oauth/userinfo</code>
                  <p className="text-xs text-neutral-600 mt-1">UserInfo endpoint - get user profile</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-mono rounded">GET</span>
                <div>
                  <code className="text-sm font-mono">/.well-known/jwks.json</code>
                  <p className="text-xs text-neutral-600 mt-1">JWKS endpoint - public keys for token verification</p>
                </div>
              </div>
            </div>
          </section>

          {/* Scopes */}
          <section className="bg-white rounded-xl border border-neutral-200 p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-3">
              🔑 Available Scopes
            </h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <code className="text-sm font-mono bg-neutral-100 px-2 py-0.5 rounded">openid</code>
                <span className="text-sm text-neutral-600">Required for OIDC. Returns user ID.</span>
              </div>
              <div className="flex items-start gap-2">
                <code className="text-sm font-mono bg-neutral-100 px-2 py-0.5 rounded">profile</code>
                <span className="text-sm text-neutral-600">Returns name, picture, updated_at.</span>
              </div>
              <div className="flex items-start gap-2">
                <code className="text-sm font-mono bg-neutral-100 px-2 py-0.5 rounded">email</code>
                <span className="text-sm text-neutral-600">Returns email, email_verified.</span>
              </div>
              <div className="flex items-start gap-2">
                <code className="text-sm font-mono bg-neutral-100 px-2 py-0.5 rounded">offline_access</code>
                <span className="text-sm text-neutral-600">Returns refresh_token for long-lived sessions.</span>
              </div>
            </div>
          </section>

          {/* Next.js Integration */}
          <section className="bg-white rounded-xl border border-neutral-200 p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-3">
              ⚡ Next.js + Auth.js Integration
            </h3>
            <pre className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 text-sm overflow-x-auto">
              <code>{`// .env.local
INAYA_AUTH_CLIENT_ID="your_client_id"
INAYA_AUTH_CLIENT_SECRET="your_client_secret"

// src/lib/auth.ts
import NextAuth from 'next-auth';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    {
      id: 'inaya-auth',
      name: 'iNAYA Auth',
      type: 'oidc',
      issuer: 'https://accounts.inayatechlabs.com',
      clientId: process.env.INAYA_AUTH_CLIENT_ID,
      clientSecret: process.env.INAYA_AUTH_CLIENT_SECRET,
      authorization: {
        params: { scope: 'openid profile email offline_access' },
      },
    },
  ],
});`}</code>
            </pre>
          </section>

          {/* Node.js Integration */}
          <section className="bg-white rounded-xl border border-neutral-200 p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-3">
              🟢 Node.js Integration
            </h3>
            <pre className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 text-sm overflow-x-auto">
              <code>{`// Install dependencies
npm install openid-client

// Example usage
import { Issuer } from 'openid-client';

const issuer = await Issuer.discover('https://accounts.inayatechlabs.com');
const client = new issuer.Client({
  client_id: 'your_client_id',
  client_secret: 'your_client_secret',
  redirect_uris: ['http://localhost:3000/callback'],
  response_types: ['code'],
});

// Authorization URL
const authUrl = client.authorizationUrl({
  scope: 'openid profile email offline_access',
  state: 'random_state',
});

// Token exchange
const tokenSet = await client.callback(
  'http://localhost:3000/callback',
  { code: 'authorization_code' }
);

// Get user info
const userInfo = await client.userinfo(tokenSet.access_token);`}</code>
            </pre>
          </section>

          {/* React Integration */}
          <section className="bg-white rounded-xl border border-neutral-200 p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-3">
              ⚛️ React (Custom OAuth)
            </h3>
            <pre className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 text-sm overflow-x-auto">
              <code>{`// Initiate login
const login = () => {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: 'your_client_id',
    redirect_uri: 'http://localhost:3000/callback',
    scope: 'openid profile email',
    state: crypto.randomUUID(),
  });
  
  window.location.href = \`https://accounts.inayatechlabs.com/oauth/authorize?\${params}\`;
};

// Handle callback
const handleCallback = async (code: string) => {
  const response = await fetch('https://accounts.inayatechlabs.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: 'your_client_id',
      client_secret: 'your_client_secret',
      redirect_uri: 'http://localhost:3000/callback',
    }),
  });
  
  const tokens = await response.json();
  
  // Get user info
  const userInfo = await fetch('https://accounts.inayatechlabs.com/oauth/userinfo', {
    headers: { Authorization: \`Bearer \${tokens.access_token}\` },
  }).then(r => r.json());
  
  return { tokens, userInfo };
};`}</code>
            </pre>
          </section>

          {/* Single Logout */}
          <section className="bg-white rounded-xl border border-neutral-200 p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-3">
              🚪 Single Logout (SLO)
            </h3>
            <p className="text-sm text-neutral-600 mb-4">
              To log out from all connected applications:
            </p>
            <pre className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 text-sm overflow-x-auto">
              <code>{`// Revoke tokens
await fetch('https://accounts.inayatechlabs.com/oauth/revoke', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    token: refresh_token,
    client_id: 'your_client_id',
    client_secret: 'your_client_secret',
  }),
});

// Or revoke via account settings
// Users can revoke access from: https://accounts.inayatechlabs.com/sso-authorizations`}</code>
            </pre>
          </section>

          {/* Security Best Practices */}
          <section className="bg-white rounded-xl border border-neutral-200 p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-3">
              🔒 Security Best Practices
            </h3>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li className="flex items-start gap-2">
                <span className="text-success-600">✓</span>
                <span>Always use HTTPS in production</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success-600">✓</span>
                <span>Validate redirect URIs strictly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success-600">✓</span>
                <span>Use PKCE for public clients (SPAs, mobile apps)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success-600">✓</span>
                <span>Verify ID tokens using JWKS endpoint</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success-600">✓</span>
                <span>Store client secrets securely (environment variables)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success-600">✓</span>
                <span>Implement state parameter to prevent CSRF</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success-600">✓</span>
                <span>Request only necessary scopes</span>
              </li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
