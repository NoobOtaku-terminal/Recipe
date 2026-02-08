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
  const [availableIngredients, setAvailableIngredients] = useState([])
  const [selectedCuisine, setSelectedCuisine] = useState('')
  const [recipeIngredients, setRecipeIngredients] = useState([{ ingredientId: '', name: '', quantity: '' }])
  const [steps, setSteps] = useState(['', '']) // At least 2 steps

  useEffect(() => {
    // Fetch cuisines and ingredients
    const fetchData = async () => {
      try {
        const [cuisinesRes, ingredientsRes] = await Promise.all([
          axios.get('/api/cuisines'),
          axios.get('/api/ingredients')
        ])
        setCuisines(cuisinesRes.data.cuisines || [])
        setAvailableIngredients(ingredientsRes.data.ingredients || [])
      } catch (error) {
        console.error('Failed to fetch options:', error)
      }
    }
    fetchData()
  }, [])

  const onSubmit = async (data) => {
    if (!selectedCuisine) {
      toast.error('Please select a cuisine')
      return
    }
    
    const validIngredients = recipeIngredients.filter(ing => ing.ingredientId && ing.quantity.trim())
    if (validIngredients.length === 0) {
      toast.error('Please add at least one ingredient with quantity')
      return
    }

    setIsLoading(true)
    
    const payload = {
      ...data,
      cuisineIds: [parseInt(selectedCuisine)],
      ingredients: validIngredients.map(ing => ({
        ingredientId: parseInt(ing.ingredientId),
        quantity: ing.quantity.trim()
      })),
      steps: steps.map((instruction, index) => ({
        stepNo: index + 1,
        instruction: instruction.trim()
      })).filter(s => s.instruction) // Remove empty steps
    }
    
    try {
      const response = await recipesAPI.create(payload)
      toast.success('Recipe created successfully!')
      setIsLoading(false)
      navigate(`/recipes/${response.data.recipe.id}`)
    } catch (error) {
      console.error('Recipe creation error:', error)
      setIsLoading(false)
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to create recipe'
      toast.error(errorMsg)
    }
  }

  const addIngredient = () => {
    setRecipeIngredients([...recipeIngredients, { ingredientId: '', name: '', quantity: '' }])
  }

  const removeIngredient = (index) => {
    if (recipeIngredients.length > 1) {
      setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index))
    }
  }

  const updateIngredient = (index, field, value) => {
    const newIngredients = [...recipeIngredients]
    newIngredients[index][field] = value
    if (field === 'ingredientId') {
      const ing = availableIngredients.find(i => i.id === parseInt(value))
      newIngredients[index].name = ing?.name || ''
    }
    setRecipeIngredients(newIngredients)
  }

  const addStep = () => {
    setSteps([...steps, ''])
  }

  const removeStep = (index) => {
    if (steps.length > 2) {
      setSteps(steps.filter((_, i) => i !== index))
    }
  }

  const updateStep = (index, value) => {
    const newSteps = [...steps]
    newSteps[index] = value
    setSteps(newSteps)
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Ingredients</h2>
            <button
              type="button"
              onClick={addIngredient}
              className="btn btn-sm bg-green-500 text-white hover:bg-green-600"
            >
              + Add Ingredient
            </button>
          </div>
          <div className="space-y-3">
            {recipeIngredients.map((ing, index) => (
              <div key={index} className="flex gap-2">
                <select 
                  className="input flex-1"
                  value={ing.ingredientId}
                  onChange={(e) => updateIngredient(index, 'ingredientId', e.target.value)}
                  required
                >
                  <option value="">Select ingredient...</option>
                  {availableIngredients.map(item => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
                <input 
                  type="text"
                  className="input flex-1"
                  placeholder="e.g., 2 cups, 200g"
                  value={ing.quantity}
                  onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                  required
                />
                {recipeIngredients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    className="btn btn-sm bg-red-500 text-white hover:bg-red-600"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-2">💡 Click "+ Add Ingredient" to add more ingredients</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Instructions</h2>
            <button
              type="button"
              onClick={addStep}
              className="btn btn-sm bg-green-500 text-white hover:bg-green-600"
            >
              + Add Step
            </button>
          </div>
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-2">
                <textarea
                  className="input flex-1"
                  placeholder={`Step ${index + 1}`}
                  value={step}
                  onChange={(e) => updateStep(index, e.target.value)}
                  required={index < 2}
                  rows={2}
                />
                {steps.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeStep(index)}
                    className="btn btn-sm bg-red-500 text-white hover:bg-red-600 self-start mt-1"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Recipe'}
        </button>
      </form>
    </div>
  )
}
