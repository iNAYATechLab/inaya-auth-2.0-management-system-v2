import NextAuth from 'next-auth';

/**
 * Demo OIDC Client - iNAYA Auth 2.0 Integration
 * 
 * This demonstrates how to integrate your application with iNAYA Auth 2.0
 * using the OpenID Connect (OIDC) protocol.
 */

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    {
      id: 'inaya-auth',
      name: 'iNAYA Auth',
      type: 'oidc',
      issuer: process.env.INAYA_AUTH_ISSUER || 'https://accounts.inaya-auth.com',
      clientId: process.env.INAYA_AUTH_CLIENT_ID,
      clientSecret: process.env.INAYA_AUTH_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'openid profile email',
          response_type: 'code',
        },
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
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist OAuth data to the JWT token
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      if (profile) {
        token.role = profile.role;
      }
      return token;
    },
    async session({ session, token }) {
      // Add custom data to session
      session.accessToken = token.accessToken as string;
      session.role = token.role as string;
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
});
