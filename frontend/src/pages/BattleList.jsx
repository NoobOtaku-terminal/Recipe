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

  const battles = data?.battles || []

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-0">
      <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
        <Flame className="w-8 h-8 sm:w-10 sm:h-10 text-orange-500" />
        <h1 className="text-3xl sm:text-4xl font-bold">Cook-Off Battles</h1>
      </div>

      {battles.length === 0 ? (
        <div className="card text-center py-12">
          <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-base sm:text-lg">No active battles yet</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6">
          {battles.map((battle) => (
            <Link 
              key={battle.battle_id} 
              to={`/battles/${battle.battle_id}`} 
              className="card hover:shadow-xl hover:border-orange-300 transition-all border border-gray-200"
            >
              <div className="flex flex-col gap-3 sm:gap-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight">{battle.dish_name}</h3>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <span className={`inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap self-start ${
                    battle.status === 'active' 
                      ? 'bg-green-100 text-green-700' 
                      : battle.status === 'completed'
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {battle.status === 'active' ? '🔥 Active' : battle.status === 'completed' ? '✅ Completed' : '📅 Upcoming'}
                  </span>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm sm:text-base text-gray-600">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Users className="w-4 h-4" />
                    <span className="font-medium">{parseInt(battle.entry_count) || 0} Entries</span>
                  </div>
                  {battle.creator_name && (
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <User className="w-4 h-4" />
                      <span className="text-gray-400 hidden sm:inline">by</span>
                      <span className="text-orange-600 font-semibold">{battle.creator_name}</span>
                    </div>
                  )}
                </div>

                {/* Dates */}
                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-500">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="font-medium">
                    {new Date(battle.starts_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: window.innerWidth < 640 ? '2-digit' : 'numeric'
                    })}
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className="font-medium">
                    {new Date(battle.ends_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: window.innerWidth < 640 ? '2-digit' : 'numeric'
                    })}
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
