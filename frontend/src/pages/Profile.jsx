import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersAPI, recipesAPI } from '../services/api'
import { User, Award, Star, Clock, ChefHat, Edit2, Save, X } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export default function Profile() {
  const { id } = useParams()
  const { user: currentUser } = useAuthStore()
  const queryClient = useQueryClient()
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [bioText, setBioText] = useState('')
  
  const { data, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => usersAPI.get(id)
  })

  const { data: recipesData, isLoading: recipesLoading } = useQuery({
    queryKey: ['user-recipes', id],
    queryFn: () => usersAPI.getRecipes(id)
  })

  // Bio update mutation
  const updateBioMutation = useMutation({
    mutationFn: async (newBio) => {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ bio: newBio })
      })
      if (!response.ok) throw new Error('Failed to update bio')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user', id])
      setIsEditingBio(false)
    }
  })

  const handleEditBio = () => {
    setBioText(user?.bio || '')
    setIsEditingBio(true)
  }

  const handleSaveBio = () => {
    updateBioMutation.mutate(bioText)
  }

  const handleCancelEdit = () => {
    setIsEditingBio(false)
    setBioText('')
  }

  if (isLoading) return <div className="text-center py-12">Loading profile...</div>

  const user = data?.user
  const recipes = recipesData?.recipes || []
  const isOwnProfile = currentUser?.id === id

  return (
    <div className="max-w-6xl mx-auto">
      {/* User Info Card */}
      <div className="card mb-8">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-lg">
            <User className="w-12 h-12 text-white" />
          </div>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{user?.username || 'Anonymous User'}</h1>
            
            {/* User Level & XP */}
            <div className="mb-4 max-w-md">
              <div className="flex justify-between text-sm font-bold text-gray-700 mb-1">
                <span className="flex items-center gap-2">
                  <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-xs border border-orange-200">
                    LVL {user?.level}
                  </span>
                  {user?.level_name?.toUpperCase()}
                </span>
                <span className="text-orange-600">{user?.experience_points || 0} XP</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 h-full rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${user?.level_progress_percent || 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1 text-right">
                {100 - (user?.level_progress_percent || 0)}% to next level
              </p>
            </div>

            {/* Bio Section */}
            <div className="mb-6">
              {isEditingBio ? (
                <div className="space-y-2">
                  <textarea
                    value={bioText}
                    onChange={(e) => setBioText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    rows={3}
                    placeholder="Tell us about yourself..."
                    maxLength={500}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveBio}
                      disabled={updateBioMutation.isPending}
                      className="btn btn-primary btn-sm flex items-center gap-1"
                    >
                      <Save className="w-4 h-4" />
                      {updateBioMutation.isPending ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="btn btn-secondary btn-sm flex items-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                    <span className="text-xs text-gray-500 ml-auto">
                      {bioText.length}/500
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <p className="text-gray-600 flex-1">{user?.bio || 'No bio yet'}</p>
                  {isOwnProfile && (
                    <button
                      onClick={handleEditBio}
                      className="text-orange-600 hover:text-orange-700 p-1"
                      title="Edit bio"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center md:text-left">
                <div className="text-3xl font-bold text-orange-600">{user?.recipes_created || 0}</div>
                <div className="text-sm text-gray-500 font-medium">Recipes</div>
              </div>
              <div className="text-center md:text-left">
                <div className="text-3xl font-bold text-orange-600">{user?.votes_received || 0}</div>
                <div className="text-sm text-gray-500 font-medium">Votes Rec'd</div>
              </div>
              <div className="text-center md:text-left">
                <div className="text-3xl font-bold text-orange-600">{user?.comments_received || 0}</div>
                <div className="text-sm text-gray-500 font-medium">Reviews Rec'd</div>
              </div>
              <div className="text-center md:text-left">
                <div className="text-3xl font-bold text-orange-600">{user?.battles_entered || 0}</div>
                <div className="text-sm text-gray-500 font-medium">Battles</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Judge Profile Card */}
      <div className="card mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Award className="w-7 h-7 text-yellow-500" />
          <h2 className="text-2xl font-bold">Judge Profile</h2>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-800 mb-1">
              {user?.judge_level || 'Beginner Taster'}
            </div>
            <div className="text-sm text-gray-500 font-medium">Judge Level</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              <span className="text-2xl font-bold text-gray-800">
                {Number(user?.credibility_score || 0).toFixed(0)}
              </span>
            </div>
            <div className="text-sm text-gray-500 font-medium">Credibility Score</div>
          </div>
        </div>
      </div>

      {/* User's Recipes */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <ChefHat className="w-7 h-7 text-orange-500" />
            <h2 className="text-2xl font-bold">My Recipes</h2>
          </div>
          <span className="text-sm text-gray-500">{recipes.length} recipe{recipes.length !== 1 ? 's' : ''}</span>
        </div>

        {recipesLoading ? (
          <div className="text-center py-8 text-gray-500">Loading recipes...</div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-12">
            <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              {isOwnProfile ? 'You haven\'t created any recipes yet' : 'No recipes yet'}
            </p>
            {isOwnProfile && (
              <Link to="/recipes/create" className="btn btn-primary">
                Create Your First Recipe
              </Link>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {recipes.map((recipe) => (
              <Link
                key={recipe.id}
                to={`/recipes/${recipe.id}`}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-orange-300 transition-all"
              >
                <h3 className="text-lg font-bold mb-2 text-gray-800">{recipe.title}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{recipe.description}</p>
                
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-gray-500">
                    <Clock className="w-4 h-4" />
                    {recipe.cook_time_minutes} min
                  </span>
                  <span className="flex items-center gap-1 text-gray-500">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    {recipe.avg_rating ? Number(recipe.avg_rating).toFixed(1) : 'No ratings'}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    recipe.is_veg ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {recipe.is_veg ? '🥗 Veg' : '🍖 Non-Veg'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
