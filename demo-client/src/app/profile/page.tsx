import { auth } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #6D28D9 0%, #F59E0B 100%)',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Link href="/" style={{ color: 'white', marginBottom: '2rem', display: 'inline-block' }}>
          ← Back to Home
        </Link>
        
        <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>
          Profile
        </h1>
        
        <div style={{ 
          background: 'rgba(255,255,255,0.1)', 
          padding: '2rem', 
          borderRadius: '1rem',
          backdropFilter: 'blur(10px)'
        }}>
          {session.user.image && (
            <img 
              src={session.user.image} 
              alt={session.user.name || 'User'}
              style={{ 
                width: '100px', 
                height: '100px', 
                borderRadius: '50%',
                marginBottom: '1rem',
                border: '3px solid white'
              }}
            />
          )}
          
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>
            {session.user.name}
          </h2>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={{ opacity: 0.8, fontSize: '0.9rem' }}>Email</label>
              <p style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{session.user.email}</p>
            </div>
            
            <div>
              <label style={{ opacity: 0.8, fontSize: '0.9rem' }}>User ID</label>
              <p style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{session.user.id}</p>
            </div>
            
            <div>
              <label style={{ opacity: 0.8, fontSize: '0.9rem' }}>Role</label>
              <p style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                {session.role || 'USER'}
              </p>
            </div>
            
            <div>
              <label style={{ opacity: 0.8, fontSize: '0.9rem' }}>Access Token</label>
              <p style={{ fontSize: '0.8rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {session.accessToken ? `${session.accessToken.substring(0, 50)}...` : 'N/A'}
              </p>
            </div>
          </div>
        </div>
        
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Link 
            href="/api/auth/signout"
            style={{
              background: 'white',
              color: '#6D28D9',
              padding: '0.75rem 2rem',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              fontWeight: 'bold'
            }}
          >
            Sign Out
          </Link>
        </div>
      </div>
    </div>
  );
}
