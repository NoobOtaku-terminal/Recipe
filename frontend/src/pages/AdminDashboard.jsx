import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users, ChefHat, Trophy, Flag, Activity, Video } from 'lucide-react'

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (!response.ok) throw new Error('Failed to fetch stats')
      return response.json()
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  const statsData = stats?.data?.stats?.[0] || {}

  const statCards = [
    {
      title: 'Total Users',
      value: parseInt(statsData.total_users) || 0,
      icon: Users,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'Total Recipes',
      value: parseInt(statsData.total_recipes) || 0,
      icon: ChefHat,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'Active Battles',
      value: parseInt(statsData.active_battles) || 0,
      icon: Trophy,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600'
    },
    {
      title: 'Flagged Content',
      value: parseInt(statsData.flagged_recipes) || 0,
      icon: Flag,
      color: 'bg-red-500',
      textColor: 'text-red-600'
    }
  ]

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Platform statistics and management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.title} className="card">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10`}>
                  <Icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-1">{stat.title}</p>
              <p className="text-3xl font-bold">{stat.value.toLocaleString()}</p>
            </div>
          )
        })}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            User Activity
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Total Admins</span>
              <span className="font-semibold">{parseInt(statsData.total_admins) || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Total Moderators</span>
              <span className="font-semibold">{parseInt(statsData.total_moderators) || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Average Credibility</span>
              <span className="font-semibold">
                {Number(statsData.avg_credibility || 0).toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Platform Activity
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Total Comments</span>
              <span className="font-semibold">{parseInt(statsData.total_comments) || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Total Ratings</span>
              <span className="font-semibold">{parseInt(statsData.total_ratings) || 0}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Total Battles</span>
              <span className="font-semibold">{parseInt(statsData.total_battles) || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <a
            href="/admin/users"
            className="btn btn-primary text-center"
          >
            <Users className="w-4 h-4 mr-2 inline" />
            Manage Users
          </a>
          <a
            href="/admin/recipes"
            className="btn btn-primary text-center"
          >
            <ChefHat className="w-4 h-4 mr-2 inline" />
            Review Recipes
          </a>
          <a
            href="/admin/battles"
            className="btn btn-primary text-center"
          >
            <Trophy className="w-4 h-4 mr-2 inline" />
            Manage Battles
          </a>
          <a
            href="/admin/proofs"
            className="btn btn-primary text-center"
          >
            <Video className="w-4 h-4 mr-2 inline" />
            Verify Proofs
          </a>
        </div>
      </div>
    </div>
  )
}
