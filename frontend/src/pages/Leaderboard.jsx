import React, { useState, useEffect } from 'react'
import { Trophy, Star, Award, TrendingUp, Medal, Crown, Zap, Target, Flame, ChevronUp } from 'lucide-react'

export default function Leaderboard() {
  const [judges, setJudges] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState('all') // all, top10, top3

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('http://localhost/api/users/leaderboard')
      if (!response.ok) throw new Error('Failed to fetch leaderboard')
      const data = await response.json()
      console.log('Leaderboard data:', data) // Debug
      setJudges(data?.data?.leaderboard || [])
    } catch (err) {
      console.error('Error fetching leaderboard:', err)
      setJudges([])
    } finally {
      setIsLoading(false)
    }
  }

  const getRankIcon = (rank) => {
    if (rank === 1) return { icon: Crown, color: 'from-yellow-400 to-amber-600', glow: 'shadow-yellow-500/50' }
    if (rank === 2) return { icon: Medal, color: 'from-gray-300 to-gray-500', glow: 'shadow-gray-400/50' }
    if (rank === 3) return { icon: Medal, color: 'from-orange-400 to-orange-600', glow: 'shadow-orange-500/50' }
    return { icon: Target, color: 'from-blue-400 to-blue-600', glow: 'shadow-blue-400/50' }
  }

  const getRankBadge = (rank) => {
    if (rank <= 3) return 'elite'
    if (rank <= 10) return 'master'
    if (rank <= 50) return 'expert'
    return 'active'
  }

  const filteredJudges = judges.filter((judge, index) => {
    if (viewMode === 'top3') return index < 3
    if (viewMode === 'top10') return index < 10
    return true
  })

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      <div className="text-center">
        <div className="relative inline-block mb-6">
          <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-t-4 border-purple-600 mx-auto"></div>
          <div className="absolute inset-0 animate-ping rounded-full h-20 w-20 border-4 border-purple-300 opacity-20"></div>
        </div>
        <p className="text-gray-700 text-xl font-semibold">Loading champions...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 py-8">
      <div className="max-w-[1400px] mx-auto px-6">
        {/* Stunning Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 rounded-3xl shadow-2xl p-10 mb-8 border-2 border-white/20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl opacity-10 -mr-48 -mt-48"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-300 rounded-full blur-3xl opacity-10 -ml-48 -mb-48"></div>
          
          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-400 rounded-2xl blur-2xl opacity-60 animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-yellow-300 to-yellow-500 p-6 rounded-2xl shadow-2xl border-2 border-yellow-200">
                  <Trophy className="w-14 h-14 text-white drop-shadow-lg" />
                </div>
              </div>
              <div>
                <h1 className="text-6xl font-black text-white mb-2 drop-shadow-lg">
                  Judge Leaderboard
                </h1>
                <p className="text-white/90 text-xl font-medium drop-shadow-md">
                  Top performing judges in the community 🏆
                </p>
              </div>
            </div>
            <div className="text-right bg-white/20 backdrop-blur-sm rounded-2xl p-6 border-2 border-white/30 shadow-2xl">
              <p className="text-sm text-white/80 uppercase tracking-wider font-bold mb-2">Total Champions</p>
              <p className="text-6xl font-black text-white drop-shadow-lg">{judges.length}</p>
            </div>
          </div>
        </div>

        {/* View Mode Selector */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setViewMode('top3')}
            className={`px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg border-2 ${
              viewMode === 'top3'
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-yellow-300 shadow-yellow-300/50'
                : 'bg-white text-gray-700 border-gray-300 hover:border-yellow-400 hover:shadow-yellow-200'
            }`}
          >
            <Trophy className="w-5 h-5 inline-block mr-2" />
            Top 3
          </button>
          <button
            onClick={() => setViewMode('top10')}
            className={`px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg border-2 ${
              viewMode === 'top10'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-300 shadow-purple-300/50'
                : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400 hover:shadow-purple-200'
            }`}
          >
            <Medal className="w-5 h-5 inline-block mr-2" />
            Top 10
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg border-2 ${
              viewMode === 'all'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-blue-300 shadow-blue-300/50'
                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:shadow-blue-200'
            }`}
          >
            <TrendingUp className="w-5 h-5 inline-block mr-2" />
            All Judges
          </button>
        </div>

        {/* Leaderboard */}
        {filteredJudges.length === 0 ? (
          <div className="bg-gradient-to-br from-white to-purple-50 rounded-3xl shadow-2xl p-20 text-center border-2 border-dashed border-purple-300">
            <Trophy className="w-24 h-24 text-purple-300 mx-auto mb-6" />
            <h3 className="text-3xl font-bold text-gray-800 mb-2">No judges found</h3>
            <p className="text-gray-600 text-lg">Be the first champion on the leaderboard!</p>
          </div>
        ) : (
          <>
            {/* Top 3 Podium View */}
            {viewMode === 'top3' && filteredJudges.length >= 3 && (
              <div className="mb-12">
                <div className="flex items-end justify-center gap-6 mb-8">
                  {/* 2nd Place */}
                  {filteredJudges[1] && (
                    <div className="flex-1 max-w-xs">
                      <div className="relative bg-gradient-to-br from-gray-100 to-gray-300 rounded-3xl shadow-2xl p-8 border-4 border-gray-400 transform hover:scale-105 transition-all">
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                          <div className="bg-gradient-to-br from-gray-300 to-gray-500 rounded-full p-4 shadow-lg border-4 border-white">
                            <Medal className="w-10 h-10 text-white" />
                          </div>
                        </div>
                        <div className="text-center mt-6">
                          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-3xl font-black text-white shadow-lg">
                            {filteredJudges[1].username.charAt(0).toUpperCase()}
                          </div>
                          <h3 className="text-2xl font-black text-gray-900 mb-2">{filteredJudges[1].username}</h3>
                          <div className="bg-gray-200 rounded-full px-4 py-2 inline-block mb-4">
                            <span className="font-bold text-gray-700">Rank #2</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-center gap-2">
                              <Star className="w-5 h-5 text-yellow-500 fill-yellow-400" />
                              <span className="text-xl font-bold">{Number(filteredJudges[1].credibility_score || 0).toFixed(0)}</span>
                            </div>
                            <div className="text-sm text-gray-600">{filteredJudges[1].verified_reviews_count} Reviews</div>
                          </div>
                        </div>
                      </div>
                      <div className="h-32 bg-gradient-to-b from-gray-300 to-gray-400 rounded-b-3xl shadow-lg"></div>
                    </div>
                  )}

                  {/* 1st Place */}
                  {filteredJudges[0] && (
                    <div className="flex-1 max-w-xs">
                      <div className="relative bg-gradient-to-br from-yellow-100 to-amber-300 rounded-3xl shadow-2xl p-10 border-4 border-yellow-500 transform hover:scale-105 transition-all">
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                          <div className="bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full p-5 shadow-2xl border-4 border-white animate-pulse">
                            <Crown className="w-12 h-12 text-white" />
                          </div>
                        </div>
                        <div className="text-center mt-8">
                          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-4xl font-black text-white shadow-2xl border-4 border-yellow-200">
                            {filteredJudges[0].username.charAt(0).toUpperCase()}
                          </div>
                          <h3 className="text-3xl font-black text-gray-900 mb-3">{filteredJudges[0].username}</h3>
                          <div className="bg-yellow-500 rounded-full px-5 py-2 inline-block mb-4 shadow-lg">
                            <span className="font-black text-white text-lg">👑 CHAMPION</span>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center justify-center gap-2">
                              <Star className="w-6 h-6 text-yellow-600 fill-yellow-500" />
                              <span className="text-2xl font-black">{Number(filteredJudges[0].credibility_score || 0).toFixed(0)}</span>
                            </div>
                            <div className="text-sm text-gray-700 font-semibold">{filteredJudges[0].verified_reviews_count} Reviews</div>
                          </div>
                        </div>
                      </div>
                      <div className="h-48 bg-gradient-to-b from-yellow-400 to-amber-600 rounded-b-3xl shadow-2xl"></div>
                    </div>
                  )}

                  {/* 3rd Place */}
                  {filteredJudges[2] && (
                    <div className="flex-1 max-w-xs">
                      <div className="relative bg-gradient-to-br from-orange-100 to-orange-300 rounded-3xl shadow-2xl p-8 border-4 border-orange-400 transform hover:scale-105 transition-all">
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                          <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-full p-4 shadow-lg border-4 border-white">
                            <Medal className="w-10 h-10 text-white" />
                          </div>
                        </div>
                        <div className="text-center mt-6">
                          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-3xl font-black text-white shadow-lg">
                            {filteredJudges[2].username.charAt(0).toUpperCase()}
                          </div>
                          <h3 className="text-2xl font-black text-gray-900 mb-2">{filteredJudges[2].username}</h3>
                          <div className="bg-orange-200 rounded-full px-4 py-2 inline-block mb-4">
                            <span className="font-bold text-orange-700">Rank #3</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-center gap-2">
                              <Star className="w-5 h-5 text-yellow-500 fill-yellow-400" />
                              <span className="text-xl font-bold">{Number(filteredJudges[2].credibility_score || 0).toFixed(0)}</span>
                            </div>
                            <div className="text-sm text-gray-600">{filteredJudges[2].verified_reviews_count} Reviews</div>
                          </div>
                        </div>
                      </div>
                      <div className="h-24 bg-gradient-to-b from-orange-300 to-orange-400 rounded-b-3xl shadow-lg"></div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* List View - Horizontal Rows */}
            {viewMode !== 'top3' && (
              <>
                {/* Table Header */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-xl border-b-2 border-purple-200 px-4 py-3 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-[80px] text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Rank</div>
                    <div className="w-[220px] text-xs font-bold text-gray-600 uppercase tracking-wider">Judge</div>
                    <div className="w-[120px] text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Level</div>
                    <div className="w-[130px] text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Credibility</div>
                    <div className="w-[110px] text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Reviews</div>
                    <div className="flex-1 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Status</div>
                  </div>
                </div>

                {/* Judge Rows */}
                <div className="space-y-2">
                  {filteredJudges.map((judge) => {
                    const rankInfo = getRankIcon(judge.rank)
                    const RankIcon = rankInfo.icon
                    const badge = getRankBadge(judge.rank)
                    
                    return (
                      <div 
                        key={judge.user_id}
                        className={`group relative rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border overflow-hidden ${
                          judge.rank <= 3 
                            ? 'bg-gradient-to-r from-yellow-50 via-orange-50 to-pink-50 border-yellow-300 hover:border-yellow-400' 
                            : 'bg-white border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        {/* Gradient Top Border */}
                        <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${rankInfo.color}`}></div>
                        
                        <div className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {/* Rank Badge - 80px */}
                            <div className="w-[80px] flex-shrink-0">
                              <div className="flex flex-col items-center gap-1">
                                {judge.rank <= 3 ? (
                                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${rankInfo.color} shadow-md flex items-center justify-center transform group-hover:scale-105 transition-transform`}>
                                    <RankIcon className="w-6 h-6 text-white" />
                                  </div>
                                ) : (
                                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-300 flex items-center justify-center shadow-sm">
                                    <span className="font-black text-lg text-blue-700">#{judge.rank}</span>
                                  </div>
                                )}
                                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                  badge === 'elite' ? 'bg-yellow-500 text-white' :
                                  badge === 'master' ? 'bg-purple-500 text-white' :
                                  badge === 'expert' ? 'bg-blue-500 text-white' :
                                  'bg-gray-400 text-white'
                                }`}>
                                  {badge}
                                </span>
                              </div>
                            </div>

                            {/* Judge Info - 220px */}
                            <div className="flex items-center gap-2 w-[220px] flex-shrink-0">
                              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${rankInfo.color} flex items-center justify-center shadow-sm flex-shrink-0`}>
                                <span className="text-lg font-black text-white">
                                  {judge.username?.charAt(0).toUpperCase() || 'U'}
                                </span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1 mb-0.5">
                                  <h3 className="text-sm font-black text-gray-900 truncate">{judge.username || 'Unknown'}</h3>
                                  {judge.rank === 1 && <span className="text-base">👑</span>}
                                  {judge.rank === 2 && <span className="text-sm">🥈</span>}
                                  {judge.rank === 3 && <span className="text-sm">🥉</span>}
                                </div>
                                <div className="text-[9px] text-gray-500 font-medium">Judge Champion</div>
                              </div>
                            </div>

                            {/* Level - 120px */}
                            <div className="w-[120px] flex-shrink-0">
                              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg px-2 py-1.5 border border-blue-200">
                                <div className="text-[10px] text-gray-600 uppercase font-bold mb-1 flex items-center justify-center gap-0.5">
                                  <Award className="w-2.5 h-2.5" />
                                  <span>Level</span>
                                </div>
                                <div className="text-xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent text-center mb-1">
                                  {judge.level || 1}
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
                                  <div 
                                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-1 rounded-full transition-all"
                                    style={{width: `${((judge.level % 1) * 100) || 75}%`}}
                                  ></div>
                                </div>
                              </div>
                            </div>

                            {/* Credibility - 130px */}
                            <div className="w-[130px] flex-shrink-0">
                              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg px-2 py-1.5 border border-yellow-300">
                                <div className="text-[10px] text-gray-600 uppercase font-bold mb-1 flex items-center justify-center gap-0.5">
                                  <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-500" />
                                  <span>Credibility</span>
                                </div>
                                <div className="flex items-center justify-center gap-1 mb-0.5">
                                  <Zap className="w-3.5 h-3.5 text-yellow-500 fill-yellow-400" />
                                  <span className="text-xl font-black bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                                    {Number(judge.credibility_score || 0).toFixed(0)}
                                  </span>
                                </div>
                                <div className="text-[9px] text-gray-500 font-medium text-center">Points</div>
                              </div>
                            </div>

                            {/* Reviews - 110px */}
                            <div className="w-[110px] flex-shrink-0">
                              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg px-2 py-1.5 border border-green-300">
                                <div className="text-[10px] text-gray-600 uppercase font-bold mb-1 flex items-center justify-center gap-0.5">
                                  <TrendingUp className="w-2.5 h-2.5" />
                                  <span>Reviews</span>
                                </div>
                                <div className="flex items-center justify-center gap-1 mb-0.5">
                                  <Flame className="w-3.5 h-3.5 text-green-600" />
                                  <span className="text-xl font-black text-green-700">
                                    {judge.verified_reviews_count || 0}
                                  </span>
                                </div>
                                <div className="text-[9px] text-gray-500 font-medium text-center">Verified</div>
                              </div>
                            </div>

                            {/* Status - Flex */}
                            <div className="flex-1 flex justify-center items-center gap-2">
                              {judge.rank <= 10 && (
                                <div className="flex flex-col items-center gap-0.5">
                                  <div className="bg-green-100 rounded-full p-1.5 border border-green-300">
                                    <ChevronUp className="w-3 h-3 text-green-600" />
                                  </div>
                                  <span className="text-[9px] font-bold text-green-600">Rising</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </>
        )}

        {/* Enhanced Footer Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl shadow-xl p-6 border-2 border-yellow-200">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-4 rounded-xl shadow-lg">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-semibold uppercase tracking-wide">Top Judge</p>
                <p className="text-2xl font-black text-gray-900">{judges[0]?.username || 'N/A'}</p>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  {judges[0]?.credibility_score ? `${Number(judges[0].credibility_score).toFixed(0)} points` : ''}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-xl p-6 border-2 border-blue-200">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-xl shadow-lg">
                <Award className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-semibold uppercase tracking-wide">Average Level</p>
                <p className="text-2xl font-black text-gray-900">
                  {judges.length > 0 ? (judges.reduce((acc, j) => acc + (j.level || 0), 0) / judges.length).toFixed(1) : '0'}
                </p>
                <p className="text-xs text-gray-500 font-medium mt-1">Community Average</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-xl p-6 border-2 border-green-200">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-xl shadow-lg">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-semibold uppercase tracking-wide">Total Reviews</p>
                <p className="text-2xl font-black text-gray-900">
                  {judges.reduce((acc, j) => acc + (j.verified_reviews_count || 0), 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 font-medium mt-1">Community Impact</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}