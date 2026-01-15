import React, { useState, useEffect } from 'react'
import { Users, Search, Shield, ShieldCheck, Trash2, AlertTriangle } from 'lucide-react'
import { adminAPI } from '../services/api'

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [searchTerm, page])

  const fetchUsers = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const params = {
        page: page.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm })
      }
      const response = await adminAPI.getUsers(params)
      setUsers(response.data?.data?.users || [])
      setPagination(response.data?.data?.pagination || {})
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch users')
      setUsers([])
      console.error('Error fetching users:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleAdmin = async (user) => {
    if (confirm(`${user.is_admin ? 'Remove admin rights from' : 'Grant admin rights to'} ${user.username}?`)) {
      try {
        await adminAPI.updateUser(user.id, { is_admin: !user.is_admin })
        fetchUsers()
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to update user')
      }
    }
  }

  const handleToggleModerator = async (user) => {
    if (confirm(`${user.is_moderator ? 'Remove moderator rights from' : 'Grant moderator rights to'} ${user.username}?`)) {
      try {
        await adminAPI.updateUser(user.id, { is_moderator: !user.is_moderator })
        fetchUsers()
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to update user')
      }
    }
  }

  const handleDeleteUser = async (user) => {
    if (confirm(`Are you sure you want to delete ${user.username}? This action cannot be undone!`)) {
      try {
        await adminAPI.deleteUser(user.id)
        fetchUsers()
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to delete user')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 py-8 px-4">
      <div className="max-w-[1600px] mx-auto">
        {/* Elegant Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-3 rounded-lg shadow-sm">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">User Management</h1>
                <p className="text-sm text-gray-500 mt-0.5">Manage users, roles, and permissions</p>
              </div>
            </div>
            <div className="text-center bg-indigo-50 rounded-lg px-6 py-3 border border-indigo-100">
              <p className="text-xs text-indigo-600 uppercase font-medium tracking-wide mb-0.5">Total Users</p>
              <p className="text-3xl font-bold text-indigo-600">{pagination.total || users.length}</p>
            </div>
          </div>
        </div>

        {/* Elegant Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by username or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(1)
              }}
              className="w-full pl-12 pr-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-3"></div>
              <p className="text-gray-500 text-sm font-medium">Loading users...</p>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <h3 className="text-xl font-semibold text-gray-700 mb-1">No users found</h3>
            <p className="text-gray-500 text-sm">Try adjusting your search criteria</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="py-3.5 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Username</th>
                      <th className="py-3.5 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                      <th className="py-3.5 px-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Level</th>
                      <th className="py-3.5 px-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Credibility</th>
                      <th className="py-3.5 px-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                      <th className="py-3.5 px-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Joined</th>
                      <th className="py-3.5 px-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3.5 px-4 text-sm font-medium text-gray-900">{user.username}</td>
                        <td className="py-3.5 px-4 text-sm text-gray-600">{user.email}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            Level {user.level || 1}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center text-sm font-semibold text-indigo-600">{user.credibility_score || 0}</td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {user.is_admin && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200">Admin</span>
                            )}
                            {user.is_moderator && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">Mod</span>
                            )}
                            {!user.is_admin && !user.is_moderator && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">User</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleToggleAdmin(user)}
                              className={`p-1.5 rounded-md transition-all ${
                                user.is_admin 
                                  ? 'bg-red-600 text-white hover:bg-red-700' 
                                  : 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600'
                              }`}
                              title={user.is_admin ? 'Remove Admin' : 'Make Admin'}
                            >
                              <Shield className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleModerator(user)}
                              className={`p-1.5 rounded-md transition-all ${
                                user.is_moderator 
                                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                  : 'bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600'
                              }`}
                              title={user.is_moderator ? 'Remove Moderator' : 'Make Moderator'}
                            >
                              <ShieldCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="p-1.5 rounded-md bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all"
                              title="Delete User"
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
            </div>

            {pagination.total_pages > 1 && (
              <div className="flex items-center justify-between mt-4 bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{users.length}</span> of{' '}
                  <span className="font-semibold text-gray-900">{pagination.total}</span> users
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg">
                    Page {page} of {pagination.total_pages || 1}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(pagination.total_pages || 1, p + 1))}
                    disabled={page === (pagination.total_pages || 1)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800 font-medium">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
