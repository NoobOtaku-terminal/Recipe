import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { recipesAPI } from '../services/api'
import { Clock, Star } from 'lucide-react'

export default function RecipeList() {
  const { data, isLoading } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => recipesAPI.list({})
  })

  if (isLoading) return <div>Loading recipes...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Recipes</h1>
        <Link to="/recipes/create" className="btn btn-primary">
          Create Recipe
        </Link>
      </div>

      <div className="grid grid-2 gap-6">
        {data?.data?.recipes?.map((recipe) => (
          <Link key={recipe.id} to={`/recipes/${recipe.id}`} className="card hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-bold mb-2">{recipe.title}</h3>
            <p className="text-gray-600 mb-4 line-clamp-2">{recipe.description}</p>
            
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {recipe.cook_time_minutes} min
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                {recipe.avg_rating ? Number(recipe.avg_rating).toFixed(1) : 'N/A'}
              </span>
              <span className={`badge ${recipe.is_veg ? 'badge-success' : 'badge-warning'}`}>
                {recipe.is_veg ? 'Veg' : 'Non-Veg'}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
