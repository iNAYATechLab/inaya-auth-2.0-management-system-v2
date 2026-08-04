import { auth } from '@/app/api/auth/[...nextauth]/route';
import Link from 'next/link';

export default async function HomePage() {
  const session = await auth();

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #6D28D9 0%, #F59E0B 100%)',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '2rem'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '800px' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          🎉 Demo OIDC Client
        </h1>
        <p style={{ fontSize: '1.5rem', marginBottom: '2rem', opacity: 0.9 }}>
          iNAYA Auth 2.0 Integration Example
        </p>
        
        {session?.user ? (
          <div style={{ 
            background: 'rgba(255,255,255,0.1)', 
            padding: '2rem', 
            borderRadius: '1rem',
            backdropFilter: 'blur(10px)'
          }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
              Welcome back, {session.user.name}! 👋
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              Email: {session.user.email}
            </p>
            <p style={{ marginBottom: '1.5rem' }}>
              Role: {session.role || 'USER'}
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <Link 
                href="/profile" 
                style={{
                  background: 'white',
                  color: '#6D28D9',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  fontWeight: 'bold'
                }}
              >
                View Profile
              </Link>
              <Link 
                href="/dashboard" 
                style={{
                  background: 'white',
                  color: '#6D28D9',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  fontWeight: 'bold'
                }}
              >
                Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ 
            background: 'rgba(255,255,255,0.1)', 
            padding: '2rem', 
            borderRadius: '1rem',
            backdropFilter: 'blur(10px)'
          }}>
            <p style={{ fontSize: '1.25rem', marginBottom: '2rem' }}>
              Sign in with iNAYA Auth to see the demo in action!
            </p>
            <Link 
              href="/auth/signin"
              style={{
                background: 'white',
                color: '#6D28D9',
                padding: '1rem 2rem',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                display: 'inline-block'
              }}
            >
              Sign In with iNAYA Auth →
            </Link>
          </div>
        )}
        
        <div style={{ marginTop: '3rem', fontSize: '0.9rem', opacity: 0.8 }}>
          <p>This is a demo OIDC client showing how to integrate with iNAYA Auth 2.0</p>
          <p>Learn more: <a href="/docs" style={{ color: 'white', textDecoration: 'underline' }}>Documentation</a></p>
        </div>
      </div>
    </div>
  );
}
