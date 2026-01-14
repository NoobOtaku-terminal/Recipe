import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { usersAPI } from '../services/api'
import { Trophy, Star, Award, TrendingUp } from 'lucide-react'

export default function Leaderboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: usersAPI.leaderboard
  })

  if (isLoading) return <div className="text-center py-12">Loading leaderboard...</div>

  const judges = data?.data?.leaderboard || []

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Trophy className="w-10 h-10 text-yellow-500" />
        <h1 className="text-4xl font-bold">Judge Leaderboard</h1>
      </div>

      <div className="card overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Rank</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Judge</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Level</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Score</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Reviews</th>
              </tr>
            </thead>
            <tbody>
              {judges.map((judge, index) => (
                <tr key={judge.user_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      {judge.rank <= 3 && (
                        <Trophy className={`w-5 h-5 ${
                          judge.rank === 1 ? 'text-yellow-500' :
                          judge.rank === 2 ? 'text-gray-400' :
                          'text-orange-600'
                        }`} />
                      )}
                      <span className="font-bold text-xl text-gray-800">#{judge.rank}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <Link 
                      to={`/profile/${judge.user_id}`} 
                      className="font-semibold text-lg text-orange-600 hover:text-orange-700 hover:underline"
                    >
                      {judge.username}
                    </Link>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                      <Award className="w-4 h-4" />
                      {judge.level}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold text-lg text-gray-800">
                        {Number(judge.credibility_score || 0).toFixed(0)}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 text-gray-600">
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-medium">{judge.verified_reviews_count}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-4 p-4">
          {judges.map((judge) => (
            <div key={judge.user_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {judge.rank <= 3 && (
                    <Trophy className={`w-6 h-6 ${
                      judge.rank === 1 ? 'text-yellow-500' :
                      judge.rank === 2 ? 'text-gray-400' :
                      'text-orange-600'
                    }`} />
                  )}
                  <span className="font-bold text-2xl text-gray-800">#{judge.rank}</span>
                </div>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  <Award className="w-3 h-3" />
                  {judge.level}
                </span>
              </div>
              
              <Link 
                to={`/profile/${judge.user_id}`} 
                className="font-semibold text-lg text-orange-600 hover:text-orange-700 block mb-3"
              >
                {judge.username}
              </Link>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold text-lg text-gray-800">
                    {Number(judge.credibility_score || 0).toFixed(0)}
                  </span>
                  <span className="text-sm text-gray-500">score</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-medium">{judge.verified_reviews_count}</span>
                  <span className="text-sm text-gray-500">reviews</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
