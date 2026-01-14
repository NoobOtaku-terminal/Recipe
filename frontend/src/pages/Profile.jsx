import React from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { usersAPI } from '../services/api'
import { User, Award, Star } from 'lucide-react'

export default function Profile() {
  const { id } = useParams()
  const { data, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => usersAPI.get(id)
  })

  if (isLoading) return <div>Loading profile...</div>

  const user = data?.data?.user

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card mb-8">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="w-12 h-12 text-gray-500" />
          </div>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{user?.username}</h1>
            <p className="text-gray-600 mb-4">{user?.bio}</p>
            
            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold text-primary">{user?.recipes_created || 0}</div>
                <div className="text-sm text-gray-600">Recipes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{user?.recipes_rated || 0}</div>
                <div className="text-sm text-gray-600">Ratings</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{user?.comments_made || 0}</div>
                <div className="text-sm text-gray-600">Reviews</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{user?.badges_earned || 0}</div>
                <div className="text-sm text-gray-600">Badges</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-6 h-6 text-yellow-500" />
          <h2 className="text-2xl font-bold">Judge Profile</h2>
        </div>
        <div className="flex items-center gap-4">
          <div>
            <div className="text-xl font-bold">{user?.judge_level}</div>
            <div className="text-sm text-gray-600">Judge Level</div>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              <span className="text-xl font-bold">{Number(user?.credibility_score || 0).toFixed(0)}</span>
            </div>
            <div className="text-sm text-gray-600">Credibility Score</div>
          </div>
        </div>
      </div>
    </div>
  )
}
