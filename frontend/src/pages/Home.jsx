import React from 'react'
import { Link } from 'react-router-dom'
import { ChefHat, Trophy, Star, Users } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import CookOffMascot from '../components/CookOffMascot'

export default function Home() {
  const { user } = useAuthStore()

  return (
    <div>
      {/* Hero Section */}
      <div className="text-center py-16">
        <div className="flex justify-center mb-6">
          <CookOffMascot className="w-40 h-40 animate-bounce" style={{ animationDuration: '3s' }} />
        </div>
        <h1 className="text-5xl font-bold mb-4">Welcome to Cook-Off Platform</h1>
        <p className="text-xl text-gray-600 mb-8">
          Share recipes, compete in battles, and become a trusted food judge
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/recipes" className="btn btn-primary">
            Browse Recipes
          </Link>
          <Link to="/battles" className="btn btn-secondary">
            View Battles
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-2 gap-8 my-16">
        <div className="card text-center">
          <ChefHat className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h3 className="text-xl font-bold mb-2">Share Your Recipes</h3>
          <p className="text-gray-600">
            Create and share your favorite recipes with the community
          </p>
        </div>

        <div className="card text-center">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h3 className="text-xl font-bold mb-2">Compete in Battles</h3>
          <p className="text-gray-600">
            Enter your recipes in themed competitions and win badges
          </p>
        </div>

        <div className="card text-center">
          <Star className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h3 className="text-xl font-bold mb-2">Trusted Reviews</h3>
          <p className="text-gray-600">
            Upload proof of cooking and earn "Tried & Tested" badges
          </p>
        </div>

        <div className="card text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h3 className="text-xl font-bold mb-2">Judge Credibility</h3>
          <p className="text-gray-600">
            Build your reputation and become a Master Critic
          </p>
        </div>
      </div>

      {/* CTA - Only show if user is not logged in */}
      {!user && (
        <div className="card text-center bg-primary text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Cooking?</h2>
          <p className="text-lg mb-6">Join our community of passionate food lovers today</p>
          <Link to="/register" className="btn bg-white text-primary hover:bg-gray-100">
            Create Free Account
          </Link>
        </div>
      )}
    </div>
  )
}
