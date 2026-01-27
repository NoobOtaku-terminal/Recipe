import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tantml:parameter name="@tanstack/react-query'
import { recipesAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function EditRecipe() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'medium',
    cookTime: '',
    isVeg: false,
    calories: '',
    cuisines: [],
    ingredients: [{ name: '', quantity: '' }],
    steps: [{ stepNo: 1, instruction: '' }]
  })

  const { data, isLoading } = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => recipesAPI.get(id)
  })

  useEffect(() => {
    if (data?.recipe) {
      const recipe = data.recipe
      setFormData({
        title: recipe.title || '',
        description: recipe.description || '',
        difficulty: recipe.difficulty_claimed || 'medium',
        cookTime: recipe.cook_time_minutes || '',
        isVeg: recipe.is_veg || false,
        calories: recipe.calories || '',
        cuisines: recipe.cuisine_ids || [],
        ingredients: recipe.ingredients?.map(ing => ({
          id: ing.ingredient_id,
          name: ing.name,
          quantity: ing.quantity
        })) || [{ name: '', quantity: '' }],
        steps: recipe.steps?.map(s => ({
          stepNo: s.step_no,
          instruction: s.instruction
        })) || [{ stepNo: 1, instruction: '' }]
      })
    }
  }, [data])

  const updateMutation = useMutation({
    mutationFn: (data) => recipesAPI.update(id, data),
    onSuccess: () => {
      toast.success('Recipe updated successfully!')
      navigate(`/recipes/${id}`)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update recipe')
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (formData.cuisines.length === 0) {
      toast.error('Please select at least one cuisine')
      return
    }

    const validIngredients = formData.ingredients.filter(
      ing => ing.name.trim() && ing.quantity.trim()
    )
    
    if (validIngredients.length === 0) {
      toast.error('Please add at least one ingredient')
      return
    }

    const validSteps = formData.steps.filter(s => s.instruction.trim())
    if (validSteps.length === 0) {
      toast.error('Please add at least one step')
      return
    }

    updateMutation.mutate({
      title: formData.title,
      description: formData.description,
      difficulty: formData.difficulty,
      cookTime: parseInt(formData.cookTime),
      isVeg: formData.isVeg,
      calories: formData.calories ? parseInt(formData.calories) : null,
      cuisines: formData.cuisines,
      ingredients: validIngredients,
      steps: validSteps
    })
  }

  const addIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { name: '', quantity: '' }]
    })
  }

  const removeIngredient = (index) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index)
    })
  }

  const updateIngredient = (index, field, value) => {
    const updated = [...formData.ingredients]
    updated[index][field] = value
    setFormData({ ...formData, ingredients: updated })
  }

  const addStep = () => {
    setFormData({
      ...formData,
      steps: [...formData.steps, { stepNo: formData.steps.length + 1, instruction: '' }]
    })
  }

  const removeStep = (index) => {
    const updated = formData.steps
      .filter((_, i) => i !== index)
      .map((step, i) => ({ ...step, stepNo: i + 1 }))
    setFormData({ ...formData, steps: updated })
  }

  const updateStep = (index, value) => {
    const updated = [...formData.steps]
    updated[index].instruction = value
    setFormData({ ...formData, steps: updated })
  }

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <h1 className="text-3xl font-bold mb-6">Edit Recipe</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">Recipe Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input"
              required
              minLength={3}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input min-h-[100px]"
              rows={4}
            />
          </div>

          {/* Recipe Details Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Difficulty</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="input"
                required
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Cook Time (minutes)</label>
              <input
                type="number"
                value={formData.cookTime}
                onChange={(e) => setFormData({ ...formData, cookTime: e.target.value })}
                className="input"
                required
                min={1}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Calories (optional)</label>
              <input
                type="number"
                value={formData.calories}
                onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                className="input"
                min={0}
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isVeg"
                checked={formData.isVeg}
                onChange={(e) => setFormData({ ...formData, isVeg: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="isVeg" className="text-sm font-medium">Vegetarian</label>
            </div>
          </div>

          {/* Cuisines */}
          <div>
            <label className="block text-sm font-medium mb-2">Cuisines (select at least one)</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { id: 1, name: 'Italian' },
                { id: 2, name: 'Chinese' },
                { id: 3, name: 'Indian' },
                { id: 4, name: 'Mexican' },
                { id: 5, name: 'Japanese' },
                { id: 6, name: 'Thai' },
                { id: 7, name: 'French' },
                { id: 8, name: 'Mediterranean' }
              ].map(cuisine => (
                <label key={cuisine.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.cuisines.includes(cuisine.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          cuisines: [...formData.cuisines, cuisine.id]
                        })
                      } else {
                        setFormData({
                          ...formData,
                          cuisines: formData.cuisines.filter(id => id !== cuisine.id)
                        })
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{cuisine.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <label className="block text-sm font-medium mb-2">Ingredients</label>
            <div className="space-y-2">
              {formData.ingredients.map((ing, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ingredient name"
                    value={ing.name}
                    onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                    className="input flex-1"
                  />
                  <input
                    type="text"
                    placeholder="Quantity"
                    value={ing.quantity}
                    onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                    className="input w-32"
                  />
                  {formData.ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="btn btn-error"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addIngredient}
              className="btn btn-secondary mt-2"
            >
              Add Ingredient
            </button>
          </div>

          {/* Steps */}
          <div>
            <label className="block text-sm font-medium mb-2">Instructions</label>
            <div className="space-y-3">
              {formData.steps.map((step, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <span className="font-bold text-primary mt-2">{step.stepNo}.</span>
                  <textarea
                    placeholder="Instruction"
                    value={step.instruction}
                    onChange={(e) => updateStep(index, e.target.value)}
                    className="input flex-1 min-h-[80px]"
                    rows={3}
                  />
                  {formData.steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      className="btn btn-error"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addStep}
              className="btn btn-secondary mt-2"
            >
              Add Step
            </button>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Updating...' : 'Update Recipe'}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/recipes/${id}`)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
