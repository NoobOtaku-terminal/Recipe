import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trophy, Crown, Medal, Upload, Camera, X, CheckCircle } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export default function Leaderboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [activeBattles, setActiveBattles] = useState([])
  const [battleEntries, setBattleEntries] = useState({}) // Map of battleId -> entries
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showVoteModal, setShowVoteModal] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [selectedBattleId, setSelectedBattleId] = useState(null)
  const [proofFile, setProofFile] = useState(null)
  const [proofPreview, setProofPreview] = useState(null)
  const [voteNotes, setVoteNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchActiveBattleLeaderboards()
  }, [])

  const fetchActiveBattleLeaderboards = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch all battles and find active ones
      const battlesResponse = await fetch('/api/battles')
      if (!battlesResponse.ok) throw new Error('Failed to fetch battles')
      const battlesData = await battlesResponse.json()
      
      const activeBattlesList = battlesData.battles?.filter(b => b.status === 'active') || []
      
      if (activeBattlesList.length === 0) {
        setActiveBattles([])
        setBattleEntries({})
        setIsLoading(false)
        return
      }

      setActiveBattles(activeBattlesList)

      // Fetch entries for ALL active battles
      const entriesMap = {}
      await Promise.all(
        activeBattlesList.map(async (battle) => {
          try {
            const entriesResponse = await fetch(`/api/battles/${battle.battle_id}/entries`)
            if (entriesResponse.ok) {
              const entriesData = await entriesResponse.json()
              
              // Sort entries by verified votes first, then total votes
              const sortedEntries = (entriesData.entries || []).sort((a, b) => {
                if (b.verified_vote_count !== a.verified_vote_count) {
                  return b.verified_vote_count - a.verified_vote_count
                }
                return b.vote_count - a.vote_count
              })
              
              entriesMap[battle.battle_id] = sortedEntries
            }
          } catch (err) {
            console.error(`Failed to fetch entries for battle ${battle.battle_id}:`, err)
            entriesMap[battle.battle_id] = []
          }
        })
      )

      setBattleEntries(entriesMap)
    } catch (err) {
      setError(err.message || 'Failed to load battle leaderboards')
      console.error('Error fetching battle leaderboards:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProofFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')
      
      if (!isImage && !isVideo) {
        alert('Please upload an image or video file')
        e.target.value = ''
        return
      }

      if (isVideo && file.size > 20 * 1024 * 1024) {
        alert('Video file must be less than 20MB')
        e.target.value = ''
        return
      }

      if (isImage && file.size > 5 * 1024 * 1024) {
        alert('Image file must be less than 5MB')
        e.target.value = ''
        return
      }

      setProofFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setProofPreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleVoteSubmit = async () => {
    if (!proofFile) {
      alert('Please upload proof of cooking to vote')
      return
    }

    try {
      setSubmitting(true)

      // Upload proof media first
      const formData = new FormData()
      formData.append('file', proofFile)
      formData.append('type', proofFile.type.startsWith('video') ? 'video' : 'image')
      formData.append('description', `Battle vote proof for ${selectedRecipe.title}`)

      const mediaResponse = await fetch('/api/media/upload', {
        method: 'POST',selectedBattleI
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      if (!mediaResponse.ok) throw new Error('Failed to upload proof')
      const mediaData = await mediaResponse.json()

      // Submit vote with proof
      const voteResponse = await fetch(`/api/battles/${activeBattle.battle_id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          recipeId: selectedRecipe.id,
          proofMediaId: mediaData.media.id,
          notes: voteNotes
        })
      })

      if (!voteResponse.ok) {
        const error = await voteResponse.json()
        throw new Error(error.error || 'Failed to vote')
      }

      // Success - refresh leaderboard and close modal
      await fetchActiveBattleLeaderboards()
      setShowVoteModal(false)
      setSelectedRecipe(null)
      setSelectedBattleId(null)
      setProofFile(null)
      setProofPreview(null)
      setVoteNotes('')
      alert('Vote submitted successfully!')
    } catch (error) {
      alert(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-3"></div>
              <p className="text-gray-500 text-sm font-medium">Loading battle leaderboard...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
s || activeBattles.length === 0
  if (!activeBattle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-12 text-center">
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-3">No Active Battle</h2>
            <p className="text-gray-600 text-lg mb-6">
              There are currently no cooking battles in progress.
            </p>
            <p className="text-gray-500 mb-8">
              Check back soon for exciting culinary competitions!
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/battles" className="btn btn-primary">
                View All Battles
              </Link>
              <Link to="/recipes" className="btn">
                Browse Recipes
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const getRankBadge = (index) => {
    if (index === 0) return { icon: Crown, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' }
    if (index === 1) return { icon: Medal, color: 'text-gray-400', bg: 'bg-gray-50', border: 'border-gray-200' }
    if (index === 2) return { icon: Medal, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200' }
    return { icon: Trophy, color: 'text-gray-400', bg: 'bg-white', border: 'border-gray-200' }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Active Battle Leaderboards</h1>
          <p className="text-gray-600">
            {activeBattles.length} {activeBattles.length === 1 ? 'battle' : 'battles'} currently active
          </p>
        </div>

        {/* All Active Battles Stacked */}
        <div className="space-y-8">
          {activeBattles.map((battle) => {
            const entries = battleEntries[battle.battle_id] || []
            
            return (
              <div key={battle.battle_id} className="bg-white rounded-2xl shadow-lg border-2 border-amber-200 overflow-hidden">
                {/* Battle Header */}
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Trophy className="w-6 h-6 text-white" />
                      <div>
                        <h2 className="text-2xl font-bold text-white">{battle.dish_name}</h2>
                        <p className="text-amber-100 text-sm">
                          {new Date(battle.starts_at).toLocaleDateString()} - {new Date(battle.ends_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="bg-white text-amber-600 px-4 py-1 rounded-full text-sm font-semibold">
                      {entries.length} Entries
                    </span>
                  </div>
                </div>

                {/* Battle Stats */}
                <div className="grid grid-cols-3 gap-4 p-6 bg-amber-50 border-b border-amber-200">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{entries.length}</p>
                    <p className="text-sm text-blue-700">Total Entries</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {entries.reduce((sum, e) => sum + (e.verified_vote_count || 0), 0)}
                    </p>
                    <p className="text-sm text-green-700">Verified Votes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {entries.reduce((sum, e) => sum + (e.vote_count || 0), 0)}
                    </p>
                    <p className="text-sm text-purple-700">Total Votes</p>
                  </div>
                </div>

                {/* Leaderboard */}
                {entries.length === 0 ? (
                  <div className="p-12 text-center">
                    <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No entries yet. Be the first to enter!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {entries.map((entry, index) => {
                      const badge = getRankBadge(index)
                      const BadgeIcon = badge.icon
                      const isUserEntry = user && String(entry.author_id) === String(user.id)

                      return (
                        <div key={entry.id} className={`p-6 hover:bg-gray-50 transition-colors ${badge.bg}`}>
                          <div className="flex items-start gap-4">
                            {/* Rank Badge */}
                            <div className={`flex-shrink-0 w-16 h-16 rounded-full ${badge.bg} border-2 ${badge.border} flex flex-col items-center justify-center`}>
                              <BadgeIcon className={`w-6 h-6 ${badge.color}`} />
                              <span className={`text-xs font-bold ${badge.color}`}>#{index + 1}</span>
                            </div>

                            {/* Recipe Info */}
                            <div className="flex-1">
                              <Link to={`/recipes/${entry.id}`} className="text-xl font-bold text-gray-900 hover:text-amber-600 transition-colors">
                                {entry.title}
                              </Link>
                              <p className="text-sm text-gray-600 mb-2">by {entry.author_username}</p>
                              <p className="text-sm text-gray-700 line-clamp-2 mb-3">{entry.description}</p>
                              
                              <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                  <div>
                                    <p className="text-lg font-bold text-green-600">{entry.verified_vote_count || 0}</p>
                                    <p className="text-xs text-gray-600">Verified</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Trophy className="w-5 h-5 text-amber-600" />
                                  <div>
                                    <p className="text-lg font-bold text-amber-600">{entry.vote_count || 0}</p>
                                    <p className="text-xs text-gray-600">Total Votes</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Vote Button */}
                            <div className="flex-shrink-0">
                              {!user ? (
                                <Link to="/login" className="btn btn-primary">
                                  Login to Vote
                                </Link>
                              ) : isUserEntry ? (
                                <button disabled className="btn bg-gray-100 text-gray-500 cursor-not-allowed">
                                  Your Entry
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedRecipe(entry)
                                    setSelectedBattleId(battle.battle_id)
                                    setShowVoteModal(true)
                                  }}
                                  className="btn btn-primary flex items-center gap-2"
                                >
                                  <Trophy className="w-4 h-4" />
                                  Vote
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 font-medium text-center">{error}</p>
          </div>
        )}
      </div>

      {/* Vote Modal */}
      {showVoteModal && selectedRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold">Cast Your Vote</h3>
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
                  <p className="text-sm text-blue-700 mb-2">
                    Upload a photo or video showing you cooked this recipe to ensure fair voting!
                  </p>
                  <ul className="text-xs text-blue-600 list-disc list-inside space-y-1">
                    <li>Videos: Max 20MB (MP4, MOV, AVI, WebM)</li>
                    <li>Images: Max 5MB (JPG, PNG, GIF, WebP)</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="font-semibold">{selectedRecipe.title}</p>
              <p className="text-sm text-gray-600">by {selectedRecipe.author_username}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Upload Proof <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {proofPreview ? (
                  <div className="relative">
                    {proofFile?.type.startsWith('video') ? (
                      <video src={proofPreview} controls className="max-h-48 mx-auto rounded" />
                    ) : (
                      <img src={proofPreview} alt="Proof" className="max-h-48 mx-auto rounded" />
                    )}
                    <div className="mt-2 text-sm text-gray-600">
                      {proofFile?.name} ({(proofFile?.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                    <button
                      onClick={() => {
                        setProofFile(null)
                        setProofPreview(null)
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 mb-1">Click to upload</p>
                    <p className="text-xs text-gray-500 mb-3">Max 20MB (video) or 5MB (image)</p>
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
                placeholder="Share your thoughts..."
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
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleVoteSubmit}
                className="btn btn-primary flex-1"
                disabled={!proofFile || submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Vote'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
