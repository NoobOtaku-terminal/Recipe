import React from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { battlesAPI } from '../services/api'
import { Trophy } from 'lucide-react'

export default function BattleDetail() {
  const { id } = useParams()
  const { data, isLoading } = useQuery({
    queryKey: ['battle', id],
    queryFn: () => battlesAPI.get(id)
  })

  if (isLoading) return <div>Loading battle...</div>

  const battle = data?.data?.battle?.[0]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <h1 className="text-3xl font-bold">{battle?.dish_name}</h1>
        </div>
        <p className="text-gray-600">Vote for your favorite recipe!</p>
      </div>

      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Entries</h2>
        <div className="space-y-4">
          <div className="border-2 border-primary rounded-lg p-4">
            <h3 className="text-xl font-bold">{battle?.recipe_title}</h3>
            <p className="text-gray-600">by {battle?.recipe_author}</p>
            <div className="mt-4">
              <span className="text-2xl font-bold text-primary">{battle?.vote_count} votes</span>
            </div>
            <button className="btn btn-primary mt-4">Vote for This Recipe</button>
          </div>
        </div>
      </div>
    </div>
  )
}
