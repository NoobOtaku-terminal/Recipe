import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { usersAPI } from '../services/api'
import { Trophy, Star, Award, TrendingUp, Medal, Crown } from 'lucide-react'

export default function Leaderboard() {
  const [judges, setJudges] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await usersAPI.leaderboard()
      setJudges(response.data?.leaderboard || [])
    } catch (err) {
      setError(err.message || 'Failed to load leaderboard')
      console.error('Error fetching leaderboard:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 py-8 px-4">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-3"></div>
              <p className="text-gray-500 text-sm font-medium">Loading leaderboard...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 py-8 px-4">
      <div className="max-w-[1600px] mx-auto">
        {/* Elegant Header */}
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Crown className="w-10 h-10 text-amber-500" />
            <h1 className="text-4xl font-semibold text-gray-900 tracking-tight">
              Judge Leaderboard
            </h1>
            <Crown className="w-10 h-10 text-amber-500" />
          </div>
          <p className="text-sm text-gray-500">
            Top culinary judges ranked by credibility and performance
          </p>
        </div>

        {judges.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <h3 className="text-xl font-semibold text-gray-700 mb-1">No judges yet</h3>
            <p className="text-gray-500 text-sm">Be the first to start judging!</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-amber-50 border-b border-amber-100">
                    <th className="py-3.5 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rank</th>
                    <th className="py-3.5 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Judge</th>
                    <th className="py-3.5 px-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Level</th>
                    <th className="py-3.5 px-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Credibility</th>
                    <th className="py-3.5 px-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Reviews</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {judges.map((judge) => (
                    <tr key={judge.user_id} className="hover:bg-amber-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {judge.rank === 1 && <Medal className="w-5 h-5 text-amber-500 fill-amber-400" />}
                          {judge.rank === 2 && <Medal className="w-5 h-5 text-gray-400 fill-gray-300" />}
                          {judge.rank === 3 && <Medal className="w-5 h-5 text-orange-500 fill-orange-400" />}
                          <span className={`text-lg font-semibold ${
                            judge.rank === 1 ? 'text-amber-600' :
                            judge.rank === 2 ? 'text-gray-500' :
                            judge.rank === 3 ? 'text-orange-600' :
                            'text-gray-600'
                          }`}>
                            #{judge.rank}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Link 
                          to={`/profile/${judge.user_id}`} 
                          className="text-sm font-semibold text-gray-900 hover:text-amber-600 transition-colors hover:underline"
                        >
                          {judge.username}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <Award className="w-3.5 h-3.5" />
                          Level {judge.level || 1}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                          <span className="text-lg font-semibold text-amber-600">
                            {Number(judge.credibility_score || 0).toFixed(0)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <TrendingUp className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm font-medium text-gray-700">{judge.verified_reviews_count || 0}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 font-medium text-center">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
