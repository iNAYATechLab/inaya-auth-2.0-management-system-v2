'use client';

import { signIn } from 'next-auth/react';

export default function SignInPage() {
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
      <div style={{ 
        background: 'rgba(255,255,255,0.1)', 
        padding: '3rem', 
        borderRadius: '1rem',
        backdropFilter: 'blur(10px)',
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
          Sign In
        </h1>
        <p style={{ marginBottom: '2rem', opacity: 0.9 }}>
          Sign in with your iNAYA Auth account
        </p>
        
        <button
          onClick={() => signIn('inaya-auth', { callbackUrl: '/' })}
          style={{
            background: 'white',
            color: '#6D28D9',
            padding: '1rem 2rem',
            borderRadius: '0.5rem',
            border: 'none',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            cursor: 'pointer',
            width: '100%',
            marginBottom: '1rem'
          }}
        >
          Continue with iNAYA Auth →
        </button>
        
        <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
          You will be redirected to iNAYA Auth to sign in
        </p>
      </div>
    </div>
  );
}
