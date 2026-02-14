import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { recipesAPI } from '../services/api'
import { Clock, Star, ChefHat, Utensils } from 'lucide-react'

export default function RecipeList() {
  const { data, isLoading } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => recipesAPI.list({})
  })

  if (isLoading) return <div className="text-center py-12 text-gray-500">Loading recipes...</div>

  const recipes = data?.recipes || []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-10">
        <div className="w-full sm:w-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-1 sm:mb-2">Browse Recipes</h1>
          <p className="text-sm sm:text-base text-gray-600">Discover delicious recipes from our community</p>
        </div>
        <Link to="/recipes/create" className="btn btn-primary whitespace-nowrap w-full sm:w-auto justify-center">
          <ChefHat className="w-5 h-5" />
          <span>Create Recipe</span>
        </Link>
      </div>

      {recipes.length === 0 ? (
        <div className="card text-center py-12 sm:py-16">
          <Utensils className="w-16 h-16 sm:w-20 sm:h-20 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl sm:text-2xl font-bold text-gray-400 mb-2">No recipes yet</h3>
          <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">Be the first to share a recipe!</p>
          <Link to="/recipes/create" className="btn btn-primary inline-flex">
            <ChefHat className="w-5 h-5" />
            <span>Create First Recipe</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {recipes.map((recipe) => (
            <Link 
              key={recipe.id} 
              to={`/recipes/${recipe.id}`} 
              className="card hover:shadow-2xl hover:border-orange-300 transition-all duration-300 border border-gray-200 flex flex-col"
            >
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-gray-800 hover:text-orange-600 transition-colors line-clamp-2">
                  {recipe.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                  {recipe.description}
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-100">
                <span className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600">
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" />
                  <span className="font-medium">{recipe.cook_time_minutes} min</span>
                </span>
                <span className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600">
                  <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">
                    {recipe.avg_rating ? Number(recipe.avg_rating).toFixed(1) : 'New'}
                  </span>
                </span>
                <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-semibold ${
                  recipe.is_veg 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {recipe.is_veg ? '🥗 Veg' : '🍖 Non-Veg'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
