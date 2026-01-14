import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { battlesAPI, recipesAPI, mediaAPI } from '../services/api'
import { Trophy, Upload, X, CheckCircle, Camera } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export default function BattleDetail() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [showEnterModal, setShowEnterModal] = useState(false)
  const [showVoteModal, setShowVoteModal] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [selectedRecipeToEnter, setSelectedRecipeToEnter] = useState('')
  const [proofFile, setProofFile] = useState(null)
  const [proofPreview, setProofPreview] = useState(null)
  const [voteNotes, setVoteNotes] = useState('')

  // Fetch battle details
  const { data: battleData, isLoading: battleLoading } = useQuery({
    queryKey: ['battle', id],
    queryFn: () => battlesAPI.get(id)
  })

  // Fetch battle entries
  const { data: entriesData, isLoading: entriesLoading } = useQuery({
    queryKey: ['battleEntries', id],
    queryFn: async () => {
      const response = await fetch(`http://localhost/api/battles/${id}/entries`)
      if (!response.ok) throw new Error('Failed to fetch entries')
      return response.json()
    }
  })

  // Fetch user's recipes for entry modal
  const { data: userRecipes } = useQuery({
    queryKey: ['userRecipes', user?.id],
    queryFn: async () => {
      const response = await fetch(`http://localhost/api/users/${user?.id}/recipes`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (!response.ok) throw new Error('Failed to fetch user recipes')
      return response.json()
    },
    enabled: !!user && showEnterModal
  })

  // Enter recipe mutation
  const enterMutation = useMutation({
    mutationFn: async (recipeId) => {
      const response = await fetch(`http://localhost/api/battles/${id}/enter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ recipeId })
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to enter battle')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['battleEntries', id])
      setShowEnterModal(false)
      setSelectedRecipeToEnter('')
    }
  })

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async ({ recipeId, proofMediaId, notes }) => {
      const response = await fetch(`http://localhost/api/battles/${id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ recipeId, proofMediaId, notes })
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to vote')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['battleEntries', id])
      setShowVoteModal(false)
      setSelectedRecipe(null)
      setProofFile(null)
      setProofPreview(null)
      setVoteNotes('')
    }
  })

  const handleProofFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setProofFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setProofPreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleVoteSubmit = async () => {
    if (!proofFile) {
      alert('Please upload proof of cooking (photo or video) to vote')
      return
    }

    try {
      // Upload proof media first
      const formData = new FormData()
      formData.append('file', proofFile)
      formData.append('type', proofFile.type.startsWith('video') ? 'video' : 'image')
      formData.append('description', `Battle vote proof for ${selectedRecipe.title}`)

      const mediaResponse = await fetch('http://localhost/api/media/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      if (!mediaResponse.ok) throw new Error('Failed to upload proof')

      const mediaData = await mediaResponse.json()
      const proofMediaId = mediaData.media.id

      // Submit vote with proof
      await voteMutation.mutateAsync({
        recipeId: selectedRecipe.id,
        proofMediaId,
        notes: voteNotes
      })
    } catch (error) {
      alert(error.message)
    }
  }

  if (battleLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading battle...</p>
        </div>
      </div>
    )
  }

  const battle = battleData?.data?.battle?.[0]
  const entries = entriesData?.data?.entries || []

  const getStatusBadge = (status) => {
    const badges = {
      upcoming: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      voting: 'bg-yellow-100 text-yellow-800',
      closed: 'bg-gray-100 text-gray-800'
    }
    return badges[status] || badges.closed
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Battle Header */}
      <div className="card mb-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-4 rounded-2xl">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">{battle?.dish_name}</h1>
              <p className="text-gray-600 text-lg">{battle?.description}</p>
            </div>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusBadge(battle?.status)}`}>
            {battle?.status?.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t">
          <div>
            <p className="text-sm text-gray-600">Start Date</p>
            <p className="font-semibold">{new Date(battle?.start_date).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">End Date</p>
            <p className="font-semibold">{new Date(battle?.end_date).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Entries</p>
            <p className="font-semibold text-2xl text-primary">{entries.length}</p>
          </div>
        </div>

        {user && battle?.status === 'active' && (
          <button
            onClick={() => setShowEnterModal(true)}
            className="btn btn-primary mt-6 w-full md:w-auto"
          >
            Enter Your Recipe
          </button>
        )}
      </div>

      {/* Entries */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-6">Battle Entries</h2>
        
        {entriesLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          </div>
        ) : entries.length === 0 ? (
          <div className="card text-center py-12">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No entries yet. Be the first to enter!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {entries.map((entry) => (
              <div key={entry.id} className="card hover:shadow-lg transition-shadow">
                <Link to={`/recipes/${entry.id}`} className="block mb-4">
                  <h3 className="text-xl font-bold hover:text-primary transition-colors">
                    {entry.title}
                  </h3>
                </Link>
                
                <p className="text-gray-600 mb-2">by {entry.author_username}</p>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{entry.description}</p>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <p className="text-2xl font-bold text-primary">{entry.vote_count || 0}</p>
                    <p className="text-xs text-gray-600">total votes</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-green-600">{entry.verified_vote_count || 0}</p>
                    <p className="text-xs text-gray-600">verified</p>
                  </div>
                </div>

                {user && battle?.status === 'active' && entry.author_id !== user.id && (
                  <button
                    onClick={() => {
                      setSelectedRecipe(entry)
                      setShowVoteModal(true)
                    }}
                    className="btn btn-primary w-full mt-4"
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    Vote for This Recipe
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enter Recipe Modal */}
      {showEnterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold">Enter Recipe</h3>
              <button onClick={() => setShowEnterModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Select Your Recipe</label>
              <select
                value={selectedRecipeToEnter}
                onChange={(e) => setSelectedRecipeToEnter(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
              >
                <option value="">Choose a recipe...</option>
                {userRecipes?.data?.recipes?.map((recipe) => (
                  <option key={recipe.id} value={recipe.id}>
                    {recipe.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowEnterModal(false)}
                className="btn flex-1"
                disabled={enterMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={() => selectedRecipeToEnter && enterMutation.mutate(selectedRecipeToEnter)}
                className="btn btn-primary flex-1"
                disabled={!selectedRecipeToEnter || enterMutation.isPending}
              >
                {enterMutation.isPending ? 'Entering...' : 'Enter Battle'}
              </button>
            </div>

            {enterMutation.isError && (
              <p className="text-red-600 text-sm mt-3">{enterMutation.error.message}</p>
            )}
          </div>
        </div>
      )}

      {/* Vote Modal */}
      {showVoteModal && selectedRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold">Vote for Recipe</h3>
              <button onClick={() => {
                setShowVoteModal(false)
                setSelectedRecipe(null)
                setProofFile(null)
                setProofPreview(null)
                setVoteNotes('')
              }} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <Camera className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900 mb-1">Proof of Cooking Required</p>
                  <p className="text-sm text-blue-700">
                    To vote, you must upload a photo or video showing you cooked this recipe. This ensures fair voting!
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="font-semibold">{selectedRecipe.title}</p>
              <p className="text-sm text-gray-600">by {selectedRecipe.author_username}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Upload Proof (Photo or Video) <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {proofPreview ? (
                  <div className="relative">
                    {proofFile?.type.startsWith('video') ? (
                      <video src={proofPreview} controls className="max-h-48 mx-auto rounded" />
                    ) : (
                      <img src={proofPreview} alt="Proof" className="max-h-48 mx-auto rounded" />
                    )}
                    <button
                      onClick={() => {
                        setProofFile(null)
                        setProofPreview(null)
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 mb-2">Click to upload photo or video</p>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleProofFileChange}
                      className="hidden"
                      id="proof-upload"
                    />
                    <label htmlFor="proof-upload" className="btn btn-primary cursor-pointer inline-block">
                      Choose File
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
              <textarea
                value={voteNotes}
                onChange={(e) => setVoteNotes(e.target.value)}
                placeholder="Share your thoughts about cooking this recipe..."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                rows="3"
                maxLength="500"
              />
              <p className="text-xs text-gray-500 mt-1">{voteNotes.length}/500</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowVoteModal(false)
                  setSelectedRecipe(null)
                  setProofFile(null)
                  setProofPreview(null)
                  setVoteNotes('')
                }}
                className="btn flex-1"
                disabled={voteMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleVoteSubmit}
                className="btn btn-primary flex-1"
                disabled={!proofFile || voteMutation.isPending}
              >
                {voteMutation.isPending ? 'Submitting...' : 'Submit Vote'}
              </button>
            </div>

            {voteMutation.isError && (
              <p className="text-red-600 text-sm mt-3">{voteMutation.error.message}</p>
            )}

            {voteMutation.isSuccess && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-green-800 font-medium">Vote submitted successfully!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
