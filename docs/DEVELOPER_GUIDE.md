# 🚀 Developer Integration Guide - iNAYA Auth 2.0

## Quick Start

Integrate iNAYA Auth 2.0 into your application in 5 minutes!

### 1. Install Dependencies

```bash
npm install next-auth@beta
```

### 2. Configure Authentication

Create `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from 'next-auth';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    {
      id: 'inaya-auth',
      name: 'iNAYA Auth',
      type: 'oidc',
      issuer: 'https://accounts.inaya-auth.com',
      clientId: process.env.INAYA_AUTH_CLIENT_ID,
      clientSecret: process.env.INAYA_AUTH_CLIENT_SECRET,
      authorization: {
        params: { scope: 'openid profile email' },
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: profile.role,
        };
      },
    },
  ],
});
```

### 3. Set Environment Variables

```env
INAYA_AUTH_CLIENT_ID=your-client-id
INAYA_AUTH_CLIENT_SECRET=your-client-secret
AUTH_SECRET=your-auth-secret
```

### 4. Use in Your App

```typescript
import { auth } from '@/app/api/auth/[...nextauth]/route';

export default async function Page() {
  const session = await auth();
  
  if (!session) {
    return <div>Not signed in</div>;
  }
  
  return <div>Welcome, {session.user.name}!</div>;
}
```

---

## Integration Examples

### React/Next.js (Full Example)

```typescript
// src/app/page.tsx
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { signIn, signOut } from 'next-auth/react';

export default async function Home() {
  const session = await auth();

  return (
    <div>
      {session?.user ? (
        <div>
          <p>Welcome, {session.user.name}!</p>
          <button onClick={() => signOut()}>Sign Out</button>
        </div>
      ) : (
        <button onClick={() => signIn('inaya-auth')}>
          Sign In with iNAYA Auth
        </button>
      )}
    </div>
  );
}
```

### Express.js

```javascript
const express = require('express');
const passport = require('passport');
const OIDCStrategy = require('passport-openidconnect').Strategy;

passport.use('inaya-auth', new OIDCStrategy({
  issuer: 'https://accounts.inaya-auth.com',
  authorizationURL: 'https://accounts.inaya-auth.com/oauth/authorize',
  tokenURL: 'https://accounts.inaya-auth.com/oauth/token',
  userInfoURL: 'https://accounts.inaya-auth.com/oauth/userinfo',
  clientID: process.env.INAYA_AUTH_CLIENT_ID,
  clientSecret: process.env.INAYA_AUTH_CLIENT_SECRET,
  callbackURL: 'http://localhost:3000/auth/callback',
  scope: 'openid profile email'
}, (issuer, profile, done) => {
  return done(null, profile);
}));

const app = express();

app.get('/auth/login', passport.authenticate('inaya-auth'));

app.get('/auth/callback', 
  passport.authenticate('inaya-auth', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/');
  }
);

app.get('/profile', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/auth/login');
  }
  res.json(req.user);
});
```

### Python (Flask)

```python
from flask import Flask, redirect, url_for, session
from authlib.integrations.flask_client import OAuth

app = Flask(__name__)
app.secret_key = 'your-secret-key'

oauth = OAuth(app)

inaya = oauth.register(
    name='inaya-auth',
    client_id='your-client-id',
    client_secret='your-client-secret',
    server_metadata_url='https://accounts.inaya-auth.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid profile email'}
)

@app.route('/login')
def login():
    redirect_uri = url_for('auth_callback', _external=True)
    return inaya.authorize_redirect(redirect_uri)

@app.route('/auth/callback')
def auth_callback():
    token = inaya.authorize_access_token()
    user = inaya.parse_id_token(token)
    session['user'] = user
    return redirect('/')

@app.route('/profile')
def profile():
    user = session.get('user')
    if user:
        return f"Hello, {user['name']}!"
    return redirect('/login')
```

---

## API Reference

### Authentication Endpoints

#### Authorize

```
GET https://accounts.inaya-auth.com/oauth/authorize
```

**Parameters:**
- `client_id` (required): Your client ID
- `redirect_uri` (required): Your callback URL
- `response_type` (required): Must be `code`
- `scope` (required): Space-separated list of scopes
- `state` (recommended): CSRF protection token

**Example:**
```
https://accounts.inaya-auth.com/oauth/authorize?
  client_id=your-client-id&
  redirect_uri=https://your-app.com/auth/callback&
  response_type=code&
  scope=openid profile email&
  state=random-state-token
```

#### Token Exchange

```
POST https://accounts.inaya-auth.com/oauth/token
```

**Parameters:**
- `grant_type`: Must be `authorization_code`
- `code`: Authorization code from authorize endpoint
- `redirect_uri`: Must match the redirect_uri from authorize
- `client_id`: Your client ID
- `client_secret`: Your client secret

**Example:**
```bash
curl -X POST https://accounts.inaya-auth.com/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=AUTH_CODE" \
  -d "redirect_uri=https://your-app.com/auth/callback" \
  -d "client_id=your-client-id" \
  -d "client_secret=your-client-secret"
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "eyJhbGc...",
  "id_token": "eyJhbGc...",
  "scope": "openid profile email"
}
```

#### User Info

```
GET https://accounts.inaya-auth.com/oauth/userinfo
```

**Headers:**
```
Authorization: Bearer ACCESS_TOKEN
```

**Response:**
```json
{
  "sub": "user-id-123",
  "name": "John Doe",
  "email": "john@example.com",
  "picture": "https://example.com/avatar.jpg",
  "role": "USER",
  "email_verified": true
}
```

---

## Scopes

| Scope | Description |
|-------|-------------|
| `openid` | Required for OIDC. Returns user ID |
| `profile` | Returns name, picture, role |
| `email` | Returns email and email_verified |
| `phone` | Returns phone number (if available) |

---

## Session Management

### Access Token Expiration

Access tokens expire after 1 hour. Use refresh tokens to get new access tokens.

### Refresh Token

```bash
curl -X POST https://accounts.inaya-auth.com/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token" \
  -d "refresh_token=REFRESH_TOKEN" \
  -d "client_id=your-client-id" \
  -d "client_secret=your-client-secret"
```

### Logout

```
GET https://accounts.inaya-auth.com/oauth/logout
```

**Parameters:**
- `id_token_hint`: ID token from login
- `post_logout_redirect_uri`: URL to redirect after logout

---

## Security Best Practices

### 1. Always Use HTTPS

Never use HTTP in production. All OAuth flows must use HTTPS.

### 2. Validate State Parameter

Always include and validate the `state` parameter to prevent CSRF attacks.

```javascript
// Generate state
const state = crypto.randomBytes(16).toString('hex');
session.oauthState = state;

// Include in authorize URL
const authorizeUrl = `https://accounts.inaya-auth.com/oauth/authorize?state=${state}`;

// Validate on callback
if (req.query.state !== session.oauthState) {
  throw new Error('Invalid state parameter');
}
```

### 3. Use PKCE (Proof Key for Code Exchange)

For public clients (SPAs, mobile apps), use PKCE:

```javascript
// Generate code verifier
const codeVerifier = generateRandomString(128);

// Generate code challenge
const codeChallenge = base64url(sha256(codeVerifier));

// Include in authorize request
const authorizeUrl = `...&code_challenge=${codeChallenge}&code_challenge_method=S256`;

// Include code_verifier in token exchange
const tokenResponse = await fetch('/oauth/token', {
  body: new URLSearchParams({
    code_verifier: codeVerifier,
    // ... other params
  })
});
```

### 4. Store Tokens Securely

- Never store tokens in localStorage (XSS vulnerable)
- Use httpOnly cookies for web applications
- Encrypt tokens at rest
- Rotate refresh tokens regularly

### 5. Validate ID Tokens

Always validate the ID token:

```javascript
import { jwtVerify } from 'jose';

// Fetch JWKS from iNAYA Auth
const JWKS_URL = 'https://accounts.inaya-auth.com/.well-known/jwks.json';

// Verify token
const { payload } = await jwtVerify(idToken, JWKS, {
  issuer: 'https://accounts.inaya-auth.com',
  audience: 'your-client-id',
});
```

---

## Error Handling

### Common Errors

| Error | Description | Solution |
|-------|-------------|----------|
| `invalid_client` | Invalid client credentials | Check client_id and client_secret |
| `invalid_grant` | Invalid authorization code | Code expired or already used |
| `invalid_scope` | Invalid scope requested | Check requested scopes |
| `unauthorized_client` | Client not authorized | Check redirect_uri matches |

### Error Response Format

```json
{
  "error": "invalid_grant",
  "error_description": "Authorization code has expired"
}
```

---

## Testing

### Test Environment

Use the test environment for development:

```
Issuer: https://test.accounts.inaya-auth.com
```

### Test Users

| Email | Password | Role |
|-------|----------|------|
| test@example.com | Test@12345 | USER |
| admin@example.com | Admin@12345 | ADMIN |

---

## Support

- **Documentation**: https://docs.inaya-auth.com
- **Email**: support@inaya-auth.com
- **GitHub Issues**: https://github.com/iNAYATechLab/inaya-auth-2.0-management-system-v2/issues

---

## Changelog

### v2.0.0 (Current)
- ✅ OIDC compliance
- ✅ PKCE support
- ✅ Refresh token rotation
- ✅ Enhanced security

### v1.0.0
- Initial release

---

**Happy coding! 🚀**
