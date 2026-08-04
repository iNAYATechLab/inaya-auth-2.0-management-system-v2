import { auth } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function DashboardPage() {
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
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Link href="/" style={{ color: 'white', marginBottom: '2rem', display: 'inline-block' }}>
          ← Back to Home
        </Link>
        
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
          Dashboard
        </h1>
        <p style={{ marginBottom: '2rem', opacity: 0.9 }}>
          Welcome, {session.user.name}!
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Stats Card 1 */}
          <div style={{ 
            background: 'rgba(255,255,255,0.1)', 
            padding: '2rem', 
            borderRadius: '1rem',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', opacity: 0.8 }}>API Calls</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>1,234</p>
            <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Last 30 days</p>
          </div>
          
          {/* Stats Card 2 */}
          <div style={{ 
            background: 'rgba(255,255,255,0.1)', 
            padding: '2rem', 
            borderRadius: '1rem',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', opacity: 0.8 }}>Active Sessions</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>3</p>
            <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Across devices</p>
          </div>
          
          {/* Stats Card 3 */}
          <div style={{ 
            background: 'rgba(255,255,255,0.1)', 
            padding: '2rem', 
            borderRadius: '1rem',
            backdropFilter: 'blur(10px)'
          }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', opacity: 0.8 }}>Status</h3>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4ade80' }}>● Active</p>
            <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>All systems operational</p>
          </div>
        </div>
        
        <div style={{ 
          background: 'rgba(255,255,255,0.1)', 
          padding: '2rem', 
          borderRadius: '1rem',
          backdropFilter: 'blur(10px)',
          marginBottom: '2rem'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Recent Activity</h2>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ 
              padding: '1rem', 
              background: 'rgba(255,255,255,0.05)', 
              borderRadius: '0.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <p style={{ fontWeight: 'bold' }}>Login Successful</p>
                <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Chrome on macOS</p>
              </div>
              <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>2 minutes ago</span>
            </div>
            
            <div style={{ 
              padding: '1rem', 
              background: 'rgba(255,255,255,0.05)', 
              borderRadius: '0.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <p style={{ fontWeight: 'bold' }}>API Key Created</p>
                <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>New API key generated</p>
              </div>
              <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>1 hour ago</span>
            </div>
            
            <div style={{ 
              padding: '1rem', 
              background: 'rgba(255,255,255,0.05)', 
              borderRadius: '0.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <p style={{ fontWeight: 'bold' }}>Profile Updated</p>
                <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Email preferences updated</p>
              </div>
              <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>Yesterday</span>
            </div>
          </div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
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
