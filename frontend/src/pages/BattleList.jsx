import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { battlesAPI } from '../services/api'
import { Trophy, Calendar } from 'lucide-react'

export default function BattleList() {
  const { data, isLoading } = useQuery({
    queryKey: ['battles'],
    queryFn: battlesAPI.list
  })

  if (isLoading) return <div>Loading battles...</div>

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Recipe Battles</h1>

      <div className="grid gap-6">
        {data?.data?.battles?.map((battle) => (
          <Link key={battle.battle_id} to={`/battles/${battle.battle_id}`} className="card hover:shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  {battle.dish_name}
                </h3>
                <p className="text-gray-600">
                  {battle.recipe_title} by {battle.recipe_author}
                </p>
              </div>
              <span className={`badge ${battle.status === 'active' ? 'badge-success' : 'badge-info'}`}>
                {battle.status}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>{new Date(battle.starts_at).toLocaleDateString()}</span>
              <span>-</span>
              <span>{new Date(battle.ends_at).toLocaleDateString()}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
