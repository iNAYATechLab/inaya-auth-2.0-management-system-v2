# 🎉 iNAYA Auth 2.0 - Demo OIDC Client

A complete demonstration of how to integrate your application with iNAYA Auth 2.0 using OpenID Connect (OIDC).

## 🚀 Quick Start

### 1. Register Your Application

1. Go to [iNAYA Auth 2.0 Developer Portal](https://app.inaya-auth.com/developer/applications)
2. Click "Create New Application"
3. Fill in details:
   - **Name**: Demo Client
   - **Description**: Demo OIDC client application
   - **Redirect URIs**: `http://localhost:3001/api/auth/callback/inaya-auth`
   - **Scopes**: `openid`, `profile`, `email`
4. Click "Create Application"
5. Copy your **Client ID** and **Client Secret**

### 2. Configure Environment

```bash
cd demo-client
cp .env.example .env.local
```

Edit `.env.local`:

```env
INAYA_AUTH_CLIENT_ID="your-client-id"
INAYA_AUTH_CLIENT_SECRET="your-client-secret"
AUTH_SECRET="generate-random-secret"
```

Generate `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

## 📁 Project Structure

```
demo-client/
├── src/
│   └── app/
│       ├── api/auth/[...nextauth]/
│       │   └── route.ts          # NextAuth configuration
│       ├── auth/
│       │   ├── signin/page.tsx   # Sign-in page
│       │   ├── signout/page.tsx  # Sign-out page
│       │   └── error/page.tsx    # Error page
│       ├── profile/page.tsx      # User profile page
│       ├── dashboard/page.tsx    # Dashboard page
│       └── page.tsx              # Home page
├── .env.example                  # Environment template
├── next.config.js                # Next.js configuration
└── package.json                  # Dependencies
```

## 🔑 Key Features Demonstrated

### 1. OIDC Integration

```typescript
// src/app/api/auth/[...nextauth]/route.ts
{
  id: 'inaya-auth',
  name: 'iNAYA Auth',
  type: 'oidc',
  issuer: 'https://accounts.inaya-auth.com',
  clientId: process.env.INAYA_AUTH_CLIENT_ID,
  clientSecret: process.env.INAYA_AUTH_CLIENT_SECRET,
}
```

### 2. Session Management

```typescript
import { auth } from '@/app/api/auth/[...nextauth]/route';

export default async function Page() {
  const session = await auth();
  
  if (!session?.user) {
    return <div>Not signed in</div>;
  }
  
  return <div>Welcome, {session.user.name}!</div>;
}
```

### 3. Sign In/Out

```typescript
import { signIn, signOut } from 'next-auth/react';

// Sign in
<button onClick={() => signIn('inaya-auth')}>
  Sign In with iNAYA Auth
</button>

// Sign out
<button onClick={() => signOut()}>
  Sign Out
</button>
```

### 4. Access User Data

```typescript
const session = await auth();

console.log(session.user.id);       // User ID
console.log(session.user.name);     // User name
console.log(session.user.email);    // User email
console.log(session.user.image);    // User avatar
console.log(session.role);          // User role
console.log(session.accessToken);   // Access token
```

## 📖 Learn More

- [Developer Integration Guide](../docs/DEVELOPER_GUIDE.md)
- [Admin Guide](../docs/ADMIN_GUIDE.md)
- [API Documentation](https://docs.inaya-auth.com)

## 🌐 Test Environment

For development, use the test environment:

```env
INAYA_AUTH_ISSUER="https://test.accounts.inaya-auth.com"
```

**Test Users:**
- `test@example.com` / `Test@12345` (USER role)
- `admin@example.com` / `Admin@12345` (ADMIN role)

## 🔒 Security Checklist

- [ ] Use HTTPS in production
- [ ] Store secrets in environment variables
- [ ] Never commit `.env.local`
- [ ] Validate state parameter
- [ ] Use PKCE for public clients
- [ ] Store tokens securely (httpOnly cookies)
- [ ] Implement proper logout

## 🐛 Troubleshooting

### "Invalid client" error

- Check `INAYA_AUTH_CLIENT_ID` and `INAYA_AUTH_CLIENT_SECRET`
- Verify redirect URI matches exactly

### "Invalid redirect_uri" error

- Ensure redirect URI is registered in developer portal
- Check for trailing slashes
- Verify protocol (http vs https)

### Session not persisting

- Check `AUTH_SECRET` is set
- Verify cookies are enabled
- Check browser console for errors

## 📞 Support

- **Email**: support@inaya-auth.com
- **Documentation**: https://docs.inaya-auth.com
- **GitHub Issues**: https://github.com/iNAYATechLab/inaya-auth-2.0-management-system-v2/issues

## 📄 License

MIT License - see [LICENSE](../LICENSE) for details

---

**Built with ❤️ by the iNAYA Team**
