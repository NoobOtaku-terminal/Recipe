import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChefHat, Search, Flag, Check, X, Trash2, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AdminRecipes() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false)
  const queryClient = useQueryClient()

  // We reuse the public recipes API but maybe filtering for admin?
  // Or we use the specific admin endpoint if we want to manage them.
  // The backend admin.js only had /recipes/flagged.
  // Let's assume we want to see flagged ones by default or all if possible.
  // Since we only found /recipes/flagged, we'll start with that for moderation.
  // If the user wants ALL recipes, we might need to add that endpoint or use the public one.
  // Given "Review recipe" in screenshot, flagged seems appropriate.

  const { data, isLoading } = useQuery({
    queryKey: ['adminFlaggedRecipes'],
    queryFn: async () => {
      const response = await fetch('http://localhost/api/admin/recipes/flagged', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (!response.ok) throw new Error('Failed to fetch recipes')
      return response.json()
    }
  })

  const moderateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await fetch(`http://localhost/api/admin/recipes/${id}/moderate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to moderate recipe')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminFlaggedRecipes'])
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await fetch(`http://localhost/api/admin/recipes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (!response.ok) throw new Error('Failed to delete recipe')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminFlaggedRecipes'])
    }
  })

  const recipes = data?.recipes || []

  if (isLoading) return <div className="p-8 text-center">Loading recipes...</div>

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Recipe Management</h1>
        <p className="text-gray-600">Review and moderate user submitted recipes</p>
      </div>

      <div className="card">
        {recipes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Flag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No flagged recipes requiring moderation.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {recipes.map((recipe) => (
              <div key={recipe.id} className="border rounded-lg p-6 flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold">{recipe.title}</h3>
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-bold uppercase">
                      Flagged
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">by {recipe.author_name}</p>
                  <p className="text-gray-800 mb-4">{recipe.description}</p>
                  
                  {recipe.moderation_notes && (
                    <div className="bg-gray-50 p-3 rounded mb-4 text-sm">
                      <span className="font-semibold">Last Note:</span> {recipe.moderation_notes}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Link to={`/recipes/${recipe.id}`} className="btn btn-outline text-sm">
                      View Full Recipe
                    </Link>
                  </div>
                </div>

                <div className="flex flex-col gap-2 min-w-[200px]">
                  <p className="font-semibold text-sm text-gray-600 mb-2">Moderation Actions</p>
                  <button
                    onClick={() => moderateMutation.mutate({
                      id: recipe.id,
                      data: { isApproved: true, isFlagged: false, moderationNotes: 'Approved by admin' }
                    })}
                    className="btn bg-green-50 text-green-700 hover:bg-green-100 border-green-200 justify-start"
                  >
                    <Check className="w-4 h-4 mr-2" /> Approve & Clear
                  </button>
                  
                  <button
                    onClick={() => {
                      const note = prompt('Enter reason for rejection:')
                      if (note) {
                        moderateMutation.mutate({
                          id: recipe.id,
                          data: { isApproved: false, isFlagged: false, moderationNotes: note }
                        })
                      }
                    }}
                    className="btn bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200 justify-start"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" /> Reject
                  </button>

                  <button
                    onClick={() => {
                      if(confirm('Are you sure? This cannot be undone.')) {
                        deleteMutation.mutate(recipe.id)
                      }
                    }}
                    className="btn bg-red-50 text-red-700 hover:bg-red-100 border-red-200 justify-start"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Recipe
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
