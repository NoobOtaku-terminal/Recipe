import React from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { recipesAPI } from '../services/api'
import { Clock, Star, ChefHat } from 'lucide-react'

export default function RecipeDetail() {
  const { id } = useParams()
  const { data, isLoading } = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => recipesAPI.get(id)
  })

  if (isLoading) return <div>Loading...</div>

  const recipe = data?.data?.recipe

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card mb-8">
        <h1 className="text-4xl font-bold mb-4">{recipe?.title}</h1>
        <p className="text-gray-600 mb-6">{recipe?.description}</p>

        <div className="flex items-center gap-6 mb-6">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <span>{recipe?.cook_time_minutes} minutes</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            <span>{recipe?.avg_rating?.toFixed(1)} ({recipe?.rating_count} ratings)</span>
          </div>
          <span className={`badge ${recipe?.is_veg ? 'badge-success' : 'badge-warning'}`}>
            {recipe?.is_veg ? 'Vegetarian' : 'Non-Vegetarian'}
          </span>
          <span className="badge badge-info">{recipe?.difficulty_claimed}</span>
        </div>

        <div className="flex items-center gap-2 text-gray-600">
          <ChefHat className="w-5 h-5" />
          <span>By {recipe?.author_name}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="card">
          <h2 className="text-2xl font-bold mb-4">Ingredients</h2>
          <ul className="space-y-2">
            {recipe?.ingredients?.map((ing, i) => (
              <li key={i} className="flex justify-between">
                <span>{ing.name}</span>
                <span className="text-gray-600">{ing.quantity}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2 className="text-2xl font-bold mb-4">Instructions</h2>
          <ol className="space-y-3">
            {recipe?.steps?.map((step) => (
              <li key={step.id} className="flex gap-3">
                <span className="font-bold text-primary">{step.step_no}.</span>
                <span>{step.instruction}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}
