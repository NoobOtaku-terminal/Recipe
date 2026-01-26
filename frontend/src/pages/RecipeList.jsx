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
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Browse Recipes</h1>
          <p className="text-gray-600">Discover delicious recipes from our community</p>
        </div>
        <Link to="/recipes/create" className="btn btn-primary whitespace-nowrap">
          <ChefHat className="w-5 h-5" />
          Create Recipe
        </Link>
      </div>

      {recipes.length === 0 ? (
        <div className="card text-center py-16">
          <Utensils className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-400 mb-2">No recipes yet</h3>
          <p className="text-gray-500 mb-6">Be the first to share a recipe!</p>
          <Link to="/recipes/create" className="btn btn-primary inline-flex">
            <ChefHat className="w-5 h-5" />
            Create First Recipe
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <Link 
              key={recipe.id} 
              to={`/recipes/${recipe.id}`} 
              className="card hover:shadow-2xl hover:border-orange-300 transition-all duration-300 border border-gray-200 flex flex-col"
            >
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-3 text-gray-800 hover:text-orange-600 transition-colors">
                  {recipe.title}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                  {recipe.description}
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-100">
                <span className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span className="font-medium">{recipe.cook_time_minutes} min</span>
                </span>
                <span className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">
                    {recipe.avg_rating ? Number(recipe.avg_rating).toFixed(1) : 'New'}
                  </span>
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  recipe.is_veg 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {recipe.is_veg ? '🥗 Vegetarian' : '🍖 Non-Veg'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
