import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { battlesAPI } from '../services/api'
import { Trophy, Calendar, User, Flame, Users } from 'lucide-react'

export default function BattleList() {
  const { data, isLoading } = useQuery({
    queryKey: ['battles'],
    queryFn: battlesAPI.list
  })

  if (isLoading) return <div className="text-center py-12">Loading battles...</div>

  const battles = data?.data?.battles || []

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Flame className="w-10 h-10 text-orange-500" />
        <h1 className="text-4xl font-bold">Recipe Battles</h1>
      </div>

      {battles.length === 0 ? (
        <div className="card text-center py-12">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No active battles yet</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {battles.map((battle) => (
            <Link 
              key={battle.battle_id} 
              to={`/battles/${battle.battle_id}`} 
              className="card hover:shadow-xl hover:border-orange-300 transition-all border border-gray-200"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Trophy className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                    <h3 className="text-2xl font-bold text-gray-800">{battle.dish_name}</h3>
                  </div>
                  
                  <div className="flex items-center gap-4 text-gray-600 mb-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span className="font-medium">{parseInt(battle.entry_count) || 0} Entries</span>
                    </div>
                    {battle.creator_name && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span className="text-gray-400">by</span>
                        <span className="text-orange-600 font-semibold">{battle.creator_name}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(battle.starts_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}</span>
                    <span className="text-gray-400">-</span>
                    <span>{new Date(battle.ends_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}</span>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                    battle.status === 'active' 
                      ? 'bg-green-100 text-green-700' 
                      : battle.status === 'completed'
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {battle.status === 'active' ? '🔥 Active' : battle.status === 'completed' ? '✅ Completed' : '📅 Upcoming'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
