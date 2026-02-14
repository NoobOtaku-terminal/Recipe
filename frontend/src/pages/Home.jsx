import React from 'react'
import { Link } from 'react-router-dom'
import { ChefHat, Trophy, Star, Users } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import CookOffMascot from '../components/CookOffMascot'

export default function Home() {
  const { user } = useAuthStore()

  return (
    <div className="px-4 sm:px-0">
      {/* Hero Section - Mobile Optimized */}
      <div className="text-center py-8 sm:py-12 md:py-16">
        <div className="flex justify-center mb-4 sm:mb-6">
          <CookOffMascot className="w-32 h-32 sm:w-40 sm:h-40 animate-bounce" style={{ animationDuration: '3s' }} />
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 px-4">
          Welcome to Cook-Off Platform
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 px-4 max-w-2xl mx-auto">
          Share recipes, compete in battles, and become a trusted food judge
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 max-w-md sm:max-w-none mx-auto">
          <Link to="/recipes" className="btn btn-primary w-full sm:w-auto">
            Browse Recipes
          </Link>
          <Link to="/battles" className="btn btn-secondary w-full sm:w-auto">
            View Battles
          </Link>
        </div>
      </div>

      {/* Features - Mobile Optimized Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8 my-8 sm:my-12 md:my-16">
        <div className="card text-center">
          <ChefHat className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-primary" />
          <h3 className="text-lg sm:text-xl font-bold mb-2">Share Your Recipes</h3>
          <p className="text-sm sm:text-base text-gray-600">
            Create and share your favorite recipes with the community
          </p>
        </div>

        <div className="card text-center">
          <Trophy className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-primary" />
          <h3 className="text-lg sm:text-xl font-bold mb-2">Compete in Battles</h3>
          <p className="text-sm sm:text-base text-gray-600">
            Enter your recipes in themed competitions and win badges
          </p>
        </div>

        <div className="card text-center">
          <Star className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-primary" />
          <h3 className="text-lg sm:text-xl font-bold mb-2">Trusted Reviews</h3>
          <p className="text-sm sm:text-base text-gray-600">
            Upload proof of cooking and earn "Tried & Tested" badges
          </p>
        </div>

        <div className="card text-center">
          <Users className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-primary" />
          <h3 className="text-lg sm:text-xl font-bold mb-2">Judge Credibility</h3>
          <p className="text-sm sm:text-base text-gray-600">
            Build your reputation and become a Master Critic
          </p>
        </div>
      </div>

      {/* CTA - Only show if user is not logged in - Mobile Optimized */}
      {!user && (
        <div className="card text-center bg-primary text-white">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Ready to Start Cooking?</h2>
          <p className="text-base sm:text-lg mb-4 sm:mb-6 px-4">
            Join our community of passionate food lovers today
          </p>
          <Link to="/register" className="btn bg-white text-primary hover:bg-gray-100 w-full sm:w-auto mx-auto">
            Create Free Account
          </Link>
        </div>
      )}
    </div>
  )
}
