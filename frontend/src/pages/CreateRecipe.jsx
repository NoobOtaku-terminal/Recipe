import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { recipesAPI } from '../services/api'
import axios from 'axios'

export default function CreateRecipe() {
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm()
  const [isLoading, setIsLoading] = useState(false)
  const [cuisines, setCuisines] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [selectedCuisine, setSelectedCuisine] = useState('')
  const [selectedIngredient, setSelectedIngredient] = useState('')
  const [ingredientQuantity, setIngredientQuantity] = useState('')

  useEffect(() => {
    // Fetch cuisines and ingredients
    const fetchData = async () => {
      try {
        const [cuisinesRes, ingredientsRes] = await Promise.all([
          axios.get('/api/cuisines'),
          axios.get('/api/ingredients')
        ])
        setCuisines(cuisinesRes.data.cuisines || [])
        setIngredients(ingredientsRes.data.ingredients || [])
      } catch (error) {
        console.error('Failed to fetch options:', error)
      }
    }
    fetchData()
  }, [])

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      if (!selectedCuisine) {
        toast.error('Please select a cuisine')
        setIsLoading(false)
        return
      }
      if (!selectedIngredient || !ingredientQuantity) {
        toast.error('Please add at least one ingredient')
        setIsLoading(false)
        return
      }

      const payload = {
        ...data,
        cuisineIds: [parseInt(selectedCuisine)],
        ingredients: [
          { ingredientId: parseInt(selectedIngredient), quantity: ingredientQuantity }
        ],
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

            <div>
              <label className="block font-medium mb-1">Cuisine</label>
              <select 
                className="input" 
                value={selectedCuisine}
                onChange={(e) => setSelectedCuisine(e.target.value)}
                required
              >
                <option value="">Select a cuisine...</option>
                {cuisines.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
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
          <h2 className="text-xl font-bold mb-4">Ingredients (Simplified)</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Ingredient</label>
              <select 
                className="input"
                value={selectedIngredient}
                onChange={(e) => setSelectedIngredient(e.target.value)}
                required
              >
                <option value="">Select ingredient...</option>
                {ingredients.map(ing => (
                  <option key={ing.id} value={ing.id}>{ing.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Quantity</label>
              <input 
                type="text"
                className="input"
                placeholder="e.g., 2 cups, 200g"
                value={ingredientQuantity}
                onChange={(e) => setIngredientQuantity(e.target.value)}
                required
              />
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
