import React from 'react'
import { Outlet, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { ChefHat, Home, BookOpen, Trophy, User, LogOut, LogIn } from 'lucide-react'

export default function Layout() {
  const { isAuthenticated, user, logout } = useAuthStore()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        boxShadow: 'var(--shadow-md)',
        borderBottom: '1px solid var(--border-light)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <nav className="container" style={{ margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '5rem' }}>
            <Link to="/" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '1.75rem',
              fontWeight: '900',
              fontFamily: 'var(--font-display)',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textDecoration: 'none'
            }}>
              <span style={{ fontSize: '2rem' }}>🍳</span>
              <span>Recipe Battle</span>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
              <Link to="/" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--text)',
                fontWeight: '500',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}>
                <Home style={{ width: '18px', height: '18px' }} />
                <span>Home</span>
              </Link>
              <Link to="/recipes" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--text)',
                fontWeight: '500',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}>
                <BookOpen style={{ width: '18px', height: '18px' }} />
                <span>Recipes</span>
              </Link>
              <Link to="/battles" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--text)',
                fontWeight: '500',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}>
                <Trophy style={{ width: '18px', height: '18px' }} />
                <span>Battles</span>
              </Link>
              <Link to="/leaderboard" style={{
                color: 'var(--text)',
                fontWeight: '500',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}>
                🏆 Leaderboard
              </Link>

              {isAuthenticated ? (
                <>
                  <Link to={`/profile/${user?.id}`} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'var(--text)',
                    fontWeight: '600',
                    textDecoration: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-secondary)',
                    transition: 'all 0.2s'
                  }}>
                    <User style={{ width: '18px', height: '18px' }} />
                    <span>{user?.username}</span>
                  </Link>
                  <button onClick={logout} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'var(--text-secondary)',
                    fontWeight: '500',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'color 0.2s'
                  }}>
                    <LogOut style={{ width: '18px', height: '18px' }} />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <Link to="/login" className="btn btn-primary" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem'
                }}>
                  <LogIn style={{ width: '18px', height: '18px' }} />
                  <span>Login</span>
                </Link>
              )}
            </div>
          </div>
        </nav>
      </header>

      <main style={{ flex: 1, padding: '3rem 0' }}>
        <div className="container">
          <Outlet />
        </div>
      </main>

      <footer style={{
        background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-secondary) 100%)',
        borderTop: '1px solid var(--border)',
        padding: '3rem 0',
        marginTop: '4rem'
      }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '3rem' }}>🍳</span>
          </div>
          <p style={{
            color: 'var(--text-secondary)',
            fontWeight: '500',
            marginBottom: '0.5rem'
          }}>
            © 2026 Recipe Battle Platform
          </p>
          <p style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>
            Built with ❤️ for food lovers around the world
          </p>
        </div>
      </footer>
    </div>
  )
}
