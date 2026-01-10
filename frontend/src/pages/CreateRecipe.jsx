import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { recipesAPI } from '../services/api'

export default function CreateRecipe() {
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm()
  const [isLoading, setIsLoading] = useState(false)

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const payload = {
        ...data,
        cuisineIds: [1], // Simplified: would be from a dropdown
        ingredients: [
          { ingredientId: 1, quantity: '2 cups' }
        ], // Simplified: would be dynamic
        steps: [
          { stepNo: 1, instruction: data.instruction1 },
          { stepNo: 2, instruction: data.instruction2 }
        ]
      }
      
      const response = await recipesAPI.create(payload)
      toast.success('Recipe created successfully!')
      navigate(`/recipes/${response.data.recipe.id}`)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create recipe')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Create New Recipe</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Basic Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block font-medium mb-1">Title</label>
              <input
                className="input"
                {...register('title', { required: 'Title is required' })}
              />
              {errors.title && <p className="text-error text-sm">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block font-medium mb-1">Description</label>
              <textarea
                className="input"
                rows={3}
                {...register('description')}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block font-medium mb-1">Difficulty</label>
                <select className="input" {...register('difficulty', { required: true })}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Cook Time (min)</label>
                <input
                  type="number"
                  className="input"
                  {...register('cookTime', { required: true, min: 1 })}
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Vegetarian?</label>
                <input type="checkbox" {...register('isVeg')} className="mt-2" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold mb-4">Instructions (Simplified)</h2>
          <div className="space-y-3">
            <textarea className="input" placeholder="Step 1" {...register('instruction1', { required: true })} />
            <textarea className="input" placeholder="Step 2" {...register('instruction2', { required: true })} />
          </div>
        </div>

        <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Recipe'}
        </button>
      </form>
    </div>
  )
}
