import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { usersAPI } from '../services/api'
import { Trophy, Star } from 'lucide-react'

export default function Leaderboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: usersAPI.leaderboard
  })

  if (isLoading) return <div>Loading leaderboard...</div>

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Trophy className="w-8 h-8 text-yellow-500" />
        <h1 className="text-3xl font-bold">Judge Leaderboard</h1>
      </div>

      <div className="card">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3">Rank</th>
              <th className="text-left py-3">Judge</th>
              <th className="text-left py-3">Level</th>
              <th className="text-left py-3">Score</th>
              <th className="text-left py-3">Verified Reviews</th>
            </tr>
          </thead>
          <tbody>
            {data?.data?.leaderboard?.map((judge, index) => (
              <tr key={judge.user_id} className="border-b last:border-0">
                <td className="py-3">
                  <span className="font-bold text-lg">#{judge.rank}</span>
                </td>
                <td className="py-3">
                  <Link to={`/profile/${judge.user_id}`} className="font-medium hover:text-primary">
                    {judge.username}
                  </Link>
                </td>
                <td className="py-3">
                  <span className="badge badge-info">{judge.level}</span>
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold">{judge.credibility_score?.toFixed(0)}</span>
                  </div>
                </td>
                <td className="py-3 text-gray-600">
                  {judge.verified_reviews_count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
