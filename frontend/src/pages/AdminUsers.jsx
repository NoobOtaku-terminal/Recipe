import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Search, Shield, ShieldCheck, Trash2, AlertTriangle } from 'lucide-react'

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['adminUsers', searchTerm, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm })
      })
      const response = await fetch(`http://localhost/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (!response.ok) throw new Error('Failed to fetch users')
      return response.json()
    }
  })

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }) => {
      const response = await fetch(`http://localhost/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updates)
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update user')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminUsers'])
    }
  })

  const deleteUserMutation = useMutation({
    mutationFn: async (userId) => {
      const response = await fetch(`http://localhost/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete user')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminUsers'])
    }
  })

  const handleToggleAdmin = (user) => {
    if (confirm(`${user.is_admin ? 'Remove admin rights from' : 'Grant admin rights to'} ${user.username}?`)) {
      updateUserMutation.mutate({
        userId: user.id,
        updates: { is_admin: !user.is_admin }
      })
    }
  }

  const handleToggleModerator = (user) => {
    if (confirm(`${user.is_moderator ? 'Remove moderator rights from' : 'Grant moderator rights to'} ${user.username}?`)) {
      updateUserMutation.mutate({
        userId: user.id,
        updates: { is_moderator: !user.is_moderator }
      })
    }
  }

  const handleDeleteUser = (user) => {
    if (confirm(`Are you sure you want to delete user ${user.username}? This action cannot be undone!`)) {
      deleteUserMutation.mutate(user.id)
    }
  }

  const users = data?.data?.users || []
  const pagination = data?.data?.pagination || {}

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">User Management</h1>
        <p className="text-gray-600">Manage users, roles, and permissions</p>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by username or email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setPage(1)
            }}
            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No users found</p>
        </div>
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Username</th>
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">Credibility</th>
                  <th className="text-left py-3 px-4">Roles</th>
                  <th className="text-left py-3 px-4">Joined</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-semibold">{user.username}</div>
                      <div className="text-sm text-gray-500">Judge Lv. {user.judge_level}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{user.email}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold">{user.credibility_score}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {user.is_admin && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-semibold">
                            Admin
                          </span>
                        )}
                        {user.is_moderator && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-semibold">
                            Moderator
                          </span>
                        )}
                        {!user.is_admin && !user.is_moderator && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                            User
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleToggleAdmin(user)}
                          className={`p-2 rounded-lg transition-colors ${
                            user.is_admin 
                              ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          title={user.is_admin ? 'Remove Admin' : 'Make Admin'}
                          disabled={updateUserMutation.isPending}
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleModerator(user)}
                          className={`p-2 rounded-lg transition-colors ${
                            user.is_moderator 
                              ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          title={user.is_moderator ? 'Remove Moderator' : 'Make Moderator'}
                          disabled={updateUserMutation.isPending}
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                          title="Delete User"
                          disabled={deleteUserMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-gray-600">
                Showing {users.length} of {pagination.total} users
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn"
                >
                  Previous
                </button>
                <span className="px-4 py-2 bg-gray-100 rounded-lg">
                  Page {page} of {pagination.total_pages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(pagination.total_pages, p + 1))}
                  disabled={page === pagination.total_pages}
                  className="btn"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Error Messages */}
      {(updateUserMutation.isError || deleteUserMutation.isError) && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">
            {updateUserMutation.error?.message || deleteUserMutation.error?.message}
          </p>
        </div>
      )}
    </div>
  )
}
