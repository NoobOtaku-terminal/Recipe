import React from 'react'
import { Outlet, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { ChefHat, Home, BookOpen, Trophy, User, LogOut, LogIn } from 'lucide-react'

export default function Layout() {
  const { isAuthenticated, user, logout } = useAuthStore()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <nav className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary">
              <ChefHat className="w-8 h-8" />
              <span>Recipe Battle</span>
            </Link>

            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-1 hover:text-primary">
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Link>
              <Link to="/recipes" className="flex items-center gap-1 hover:text-primary">
                <BookOpen className="w-4 h-4" />
                <span>Recipes</span>
              </Link>
              <Link to="/battles" className="flex items-center gap-1 hover:text-primary">
                <Trophy className="w-4 h-4" />
                <span>Battles</span>
              </Link>
              <Link to="/leaderboard" className="hover:text-primary">
                Leaderboard
              </Link>

              {isAuthenticated ? (
                <>
                  <Link to={`/profile/${user?.id}`} className="flex items-center gap-1 hover:text-primary">
                    <User className="w-4 h-4" />
                    <span>{user?.username}</span>
                  </Link>
                  <button onClick={logout} className="flex items-center gap-1 hover:text-primary">
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <Link to="/login" className="btn btn-primary flex items-center gap-1">
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </Link>
              )}
            </div>
          </div>
        </nav>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2026 Recipe Battle Platform. Built with ❤️ for food lovers.</p>
        </div>
      </footer>
    </div>
  )
}
