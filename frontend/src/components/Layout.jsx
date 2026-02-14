import React, { useState } from 'react'
import { Outlet, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { ChefHat, Home, BookOpen, Trophy, User, LogOut, LogIn, Shield, Menu, X } from 'lucide-react'
import CookOffMascot from './CookOffMascot'

export default function Layout() {
  const { isAuthenticated, user, logout } = useAuthStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Mobile-Optimized Header */}
      <header style={{
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(10px)',
        boxShadow: 'var(--shadow-md)',
        borderBottom: '1px solid var(--border-light)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <nav className="container" style={{ margin: '0 auto', padding: '0 clamp(1rem, 3vw, 2rem)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 'clamp(3.5rem, 12vw, 5rem)' }}>
            {/* Logo */}
            <Link to="/" onClick={closeMobileMenu} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(0.5rem, 2vw, 0.75rem)',
              fontSize: 'clamp(1.25rem, 4vw, 1.75rem)',
              fontWeight: '900',
              fontFamily: 'var(--font-display)',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textDecoration: 'none'
            }}>
              <CookOffMascot className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />
              <span>Cook-Off</span>
            </Link>

            {/* Desktop Navigation */}
            <div style={{ display: 'none' }} className="md:flex md:items-center md:gap-6 lg:gap-8">
              <Link to="/" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--text)',
                fontWeight: '500',
                textDecoration: 'none',
                transition: 'color 0.2s',
                fontSize: '0.95rem'
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
                transition: 'color 0.2s',
                fontSize: '0.95rem'
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
                transition: 'color 0.2s',
                fontSize: '0.95rem'
              }}>
                <Trophy style={{ width: '18px', height: '18px' }} />
                <span>Battles</span>
              </Link>
              <Link to="/leaderboard" style={{
                color: 'var(--text)',
                fontWeight: '500',
                textDecoration: 'none',
                transition: 'color 0.2s',
                fontSize: '0.95rem'
              }}>
                🏆 Leaderboard
              </Link>

              {isAuthenticated && (user?.isAdmin || user?.is_admin) && (
                <Link to="/admin" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: 'var(--primary)',
                  fontWeight: '600',
                  textDecoration: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 107, 53, 0.1)',
                  transition: 'all 0.2s',
                  fontSize: '0.95rem'
                }}>
                  <Shield style={{ width: '18px', height: '18px' }} />
                  <span>Admin</span>
                </Link>
              )}

              {isAuthenticated ? (
                <>
                  <Link to={`/profile/${user?.id}`} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    color: 'var(--text)',
                    fontWeight: '600',
                    textDecoration: 'none',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '50px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-light)',
                    transition: 'all 0.2s',
                    boxShadow: 'var(--shadow-sm)',
                    fontSize: '0.9rem'
                  }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}>
                      {user?.level || 1}
                    </div>
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
                    transition: 'color 0.2s',
                    fontSize: '0.95rem',
                    padding: '0.5rem'
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
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.95rem'
                }}>
                  <LogIn style={{ width: '18px', height: '18px' }} />
                  <span>Login</span>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button & User Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }} className="md:hidden">
              {isAuthenticated && (
                <Link to={`/profile/${user?.id}`} onClick={closeMobileMenu} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  textDecoration: 'none',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '50px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-light)'
                }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}>
                    {user?.level || 1}
                  </div>
                </Link>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  color: 'var(--text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '44px',
                  minHeight: '44px'
                }}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Slide-Out Menu */}
        <div style={{
          position: 'fixed',
          top: 'clamp(3.5rem, 12vw, 5rem)',
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(10px)',
          transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease-in-out',
          zIndex: 90,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          boxShadow: mobileMenuOpen ? '0 10px 40px rgba(0,0,0,0.15)' : 'none'
        }} className="md:hidden">
          <div style={{ padding: '1.5rem' }}>
            {/* User Info Section (Mobile Only) */}
            {isAuthenticated && (
              <div style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)',
                marginBottom: '1.5rem',
                color: 'white'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.3)',
                    border: '2px solid white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    fontWeight: 'bold'
                  }}>
                    {user?.level || 1}
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '1.125rem' }}>{user?.username}</div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                      {user?.level_name || 'Beginner'} • {user?.experience_points || 0} XP
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Navigation Links */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Link to="/" onClick={closeMobileMenu} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text)',
                fontWeight: '600',
                textDecoration: 'none',
                transition: 'all 0.2s',
                background: 'var(--bg-secondary)',
                fontSize: '1rem',
                minHeight: '52px'
              }}>
                <Home style={{ width: '22px', height: '22px' }} />
                <span>Home</span>
              </Link>
              
              <Link to="/recipes" onClick={closeMobileMenu} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text)',
                fontWeight: '600',
                textDecoration: 'none',
                transition: 'all 0.2s',
                background: 'var(--bg-secondary)',
                fontSize: '1rem',
                minHeight: '52px'
              }}>
                <BookOpen style={{ width: '22px', height: '22px' }} />
                <span>Recipes</span>
              </Link>
              
              <Link to="/battles" onClick={closeMobileMenu} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text)',
                fontWeight: '600',
                textDecoration: 'none',
                transition: 'all 0.2s',
                background: 'var(--bg-secondary)',
                fontSize: '1rem',
                minHeight: '52px'
              }}>
                <Trophy style={{ width: '22px', height: '22px' }} />
                <span>Battles</span>
              </Link>
              
              <Link to="/leaderboard" onClick={closeMobileMenu} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text)',
                fontWeight: '600',
                textDecoration: 'none',
                transition: 'all 0.2s',
                background: 'var(--bg-secondary)',
                fontSize: '1rem',
                minHeight: '52px'
              }}>
                🏆 <span>Leaderboard</span>
              </Link>

              {isAuthenticated && (user?.isAdmin || user?.is_admin) && (
                <Link to="/admin" onClick={closeMobileMenu} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  color: 'white',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                  fontSize: '1rem',
                  minHeight: '52px'
                }}>
                  <Shield style={{ width: '22px', height: '22px' }} />
                  <span>Admin Dashboard</span>
                </Link>
              )}

              {isAuthenticated ? (
                <>
                  <Link to={`/profile/${user?.id}`} onClick={closeMobileMenu} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem 1.25rem',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text)',
                    fontWeight: '600',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    background: 'var(--bg-secondary)',
                    fontSize: '1rem',
                    minHeight: '52px',
                    marginTop: '1rem',
                    border: '2px solid var(--primary)'
                  }}>
                    <User style={{ width: '22px', height: '22px' }} />
                    <span>My Profile</span>
                  </Link>
                  
                  <button onClick={() => { logout(); closeMobileMenu(); }} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem 1.25rem',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--error)',
                    fontWeight: '600',
                    background: 'rgba(214, 40, 40, 0.1)',
                    transition: 'all 0.2s',
                    fontSize: '1rem',
                    minHeight: '52px',
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer',
                    border: 'none'
                  }}>
                    <LogOut style={{ width: '22px', height: '22px' }} />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <Link to="/login" onClick={closeMobileMenu} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  padding: '1rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  color: 'white',
                  fontWeight: '700',
                  textDecoration: 'none',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                  fontSize: '1.125rem',
                  minHeight: '56px',
                  marginTop: '1rem'
                }}>
                  <LogIn style={{ width: '24px', height: '24px' }} />
                  <span>Login / Register</span>
                </Link>
              )}
            </nav>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div 
            onClick={closeMobileMenu}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.3)',
              zIndex: 89,
              backdropFilter: 'blur(2px)'
            }}
            className="md:hidden"
          />
        )}
      </header>

      <main style={{ flex: 1, padding: 'clamp(1.5rem, 4vw, 3rem) 0', minHeight: 'calc(100vh - 200px)' }}>
        <div className="container">
          <Outlet />
        </div>
      </main>

      <footer style={{
        background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-secondary) 100%)',
        borderTop: '1px solid var(--border)',
        padding: 'clamp(2rem, 5vw, 3rem) 0',
        marginTop: 'clamp(2rem, 5vw, 4rem)'
      }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <span style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}>🍳</span>
          </div>
          <p style={{
            color: 'var(--text-secondary)',
            fontWeight: '500',
            marginBottom: '0.5rem'
          }}>
            © 2026 Cook-Off Platform
          </p>
          <p style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>
            Built with ❤️ for food lovers around the world
          </p>
        </div>
      </footer>
    </div>
  )
}
