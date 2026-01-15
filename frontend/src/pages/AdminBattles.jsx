import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trophy, Plus, Edit, Trash2, AlertTriangle, X } from 'lucide-react'

export default function AdminBattles() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingBattle, setEditingBattle] = useState(null)
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    dishName: '',
    description: '',
    startsAt: '',
    endsAt: '',
    status: 'upcoming'
  })

  const { data, isLoading } = useQuery({
    queryKey: ['adminBattles'],
    queryFn: async () => {
      const response = await fetch('http://localhost/api/admin/battles', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (!response.ok) throw new Error('Failed to fetch battles')
      return response.json()
    }
  })

  const createBattleMutation = useMutation({
    mutationFn: async (battleData) => {
      const response = await fetch('http://localhost/api/battles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(battleData)
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create battle')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminBattles'])
      setShowCreateModal(false)
      resetForm()
    }
  })

  const updateBattleMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      const response = await fetch(`http://localhost/api/admin/battles/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updates)
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update battle')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminBattles'])
      setEditingBattle(null)
    }
  })

  const deleteBattleMutation = useMutation({
    mutationFn: async (id) => {
      const response = await fetch(`http://localhost/api/admin/battles/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete battle')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminBattles'])
    }
  })

  const resetForm = () => {
    setFormData({
      dishName: '',
      description: '',
      startsAt: '',
      endsAt: '',
      status: 'upcoming'
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingBattle) {
      updateBattleMutation.mutate({ id: editingBattle.id, updates: formData })
    } else {
      createBattleMutation.mutate(formData)
    }
  }

  const handleEdit = (battle) => {
    setEditingBattle(battle)
    setFormData({
      dishName: battle.dish_name,
      description: battle.description || '',
      startsAt: battle.starts_at ? new Date(battle.starts_at).toISOString().split('T')[0] : '',
      endsAt: battle.ends_at ? new Date(battle.ends_at).toISOString().split('T')[0] : '',
      status: battle.status
    })
    setShowCreateModal(true)
  }

  const handleDelete = (battle) => {
    if (confirm(`Are you sure you want to delete the battle "${battle.dish_name}"? This will remove all entries and votes!`)) {
      deleteBattleMutation.mutate(battle.id)
    }
  }

  const battles = data?.data?.battles || []

  const getStatusBadge = (status) => {
    const badges = {
      upcoming: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      voting: 'bg-yellow-100 text-yellow-800',
      closed: 'bg-gray-100 text-gray-800'
    }
    return badges[status] || badges.closed
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Battle Management</h1>
          <p className="text-gray-600">Create and manage cooking battles</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setEditingBattle(null)
            setShowCreateModal(true)
          }}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Battle
        </button>
      </div>

      {/* Battles Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading battles...</p>
        </div>
      ) : battles.length === 0 ? (
        <div className="card text-center py-12">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No battles yet</p>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            Create First Battle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {battles.map((battle) => (
            <div key={battle.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold flex-1">{battle.dish_name}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(battle.status)}`}>
                  {battle.status}
                </span>
              </div>

              <p className="text-gray-600 mb-4 line-clamp-2">{battle.description}</p>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Start:</span>
                  <span className="font-semibold">{new Date(battle.start_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">End:</span>
                  <span className="font-semibold">{new Date(battle.end_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Entries:</span>
                  <span className="font-semibold">{battle.entry_count || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Voters:</span>
                  <span className="font-semibold">{battle.voter_count || 0}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <button
                  onClick={() => handleEdit(battle)}
                  className="btn flex-1"
                  disabled={updateBattleMutation.isPending}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(battle)}
                  className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                  disabled={deleteBattleMutation.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {editingBattle ? 'Edit Battle' : 'Create New Battle'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setEditingBattle(null)
                  resetForm()
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Dish Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.dish_name}
                  onChange={(e) => setFormData({ ...formData, dish_name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  placeholder="e.g., Perfect Carbonara"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows="3"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  placeholder="Describe the battle challenge..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.startsAt}
                    onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.endsAt}
                    onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="active">Active</option>
                  <option value="voting">Voting</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setEditingBattle(null)
                    resetForm()
                  }}
                  className="btn flex-1"
                  disabled={createBattleMutation.isPending || updateBattleMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={createBattleMutation.isPending || updateBattleMutation.isPending}
                >
                  {createBattleMutation.isPending || updateBattleMutation.isPending
                    ? 'Saving...'
                    : editingBattle
                    ? 'Update Battle'
                    : 'Create Battle'}
                </button>
              </div>

              {(createBattleMutation.isError || updateBattleMutation.isError) && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <p className="text-red-800 text-sm">
                    {createBattleMutation.error?.message || updateBattleMutation.error?.message}
                  </p>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Delete Error */}
      {deleteBattleMutation.isError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">{deleteBattleMutation.error?.message}</p>
        </div>
      )}
    </div>
  )
}
