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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-8">
        <Trophy className="w-10 h-10 text-yellow-500" />
        <h1 className="text-4xl font-bold">Judge Leaderboard</h1>
      </div>

      <div className="card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left table-fixed">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 font-semibold text-gray-600 w-[15%]">Rank</th>
                <th className="p-4 font-semibold text-gray-600 w-[35%]">Judge</th>
                <th className="p-4 font-semibold text-gray-600 w-[20%] text-center">Level</th>
                <th className="p-4 font-semibold text-gray-600 w-[15%] text-center">Score</th>
                <th className="p-4 font-semibold text-gray-600 w-[15%] text-center">Reviews</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {judges.map((judge) => (
                <tr key={judge.user_id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 align-middle">
                    <div className="flex items-center gap-2">
                      {judge.rank <= 3 ? (
                        <Trophy className={`w-6 h-6 flex-shrink-0 ${
                          judge.rank === 1 ? 'text-yellow-500' :
                          judge.rank === 2 ? 'text-gray-400' :
                          'text-orange-600'
                        }`} />
                      ) : (
                        <span className="w-6 h-6"></span>
                      )}
                      <span className={`font-bold text-xl ${
                        judge.rank <= 3 ? 'text-gray-800' : 'text-gray-500'
                      }`}>
                        #{judge.rank}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="flex flex-col">
                      <Link 
                        to={`/profile/${judge.user_id}`} 
                        className="font-bold text-lg text-gray-800 hover:text-orange-600 transition-colors"
                      >
                        {judge.username}
                      </Link>
                    </div>
                  </td>
                  <td className="p-4 align-middle text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      <Award className="w-4 h-4" />
                      {judge.level}
                    </span>
                  </td>
                  <td className="p-4 align-middle text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="font-bold text-xl text-gray-900">
                        {Number(judge.credibility_score || 0).toFixed(0)}
                      </span>
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    </div>
                  </td>
                  <td className="p-4 align-middle text-center">
                    <div className="flex items-center justify-center gap-1.5 text-gray-600">
                      <span className="font-medium text-lg">{judge.verified_reviews_count}</span>
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
