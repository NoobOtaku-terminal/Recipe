import React, { useState, useEffect } from 'react'
import { Users, Search, Shield, ShieldCheck, Trash2, AlertTriangle, UserCheck, Mail, Calendar, BarChart3, Filter, X } from 'lucide-react'

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [updateError, setUpdateError] = useState(null)
  const [filterRole, setFilterRole] = useState('all') // all, admin, moderator, user

  useEffect(() => {
    fetchUsers()
  }, [searchTerm, page])

  const fetchUsers = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
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
      const data = await response.json()
      console.log('Users data:', data) // Debug
      setUsers(data?.data?.users || [])
      setPagination(data?.data?.pagination || {})
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleAdmin = (user) => {
    if (confirm(`${user.is_admin ? 'Remove admin rights from' : 'Grant admin rights to'} ${user.username}?`)) {
      setUsers(users.map(u => 
        u.id === user.id ? { ...u, is_admin: !u.is_admin } : u
      ))
      setUpdateError(null)
    }
  }

  const handleToggleModerator = (user) => {
    if (confirm(`${user.is_moderator ? 'Remove moderator rights from' : 'Grant moderator rights to'} ${user.username}?`)) {
      setUsers(users.map(u => 
        u.id === user.id ? { ...u, is_moderator: !u.is_moderator } : u
      ))
      setUpdateError(null)
    }
  }

  const handleDeleteUser = (user) => {
    if (confirm(`Are you sure you want to delete user ${user.username}? This action cannot be undone!`)) {
      setUsers(users.filter(u => u.id !== user.id))
      setUpdateError(null)
    }
  }

  const filteredUsers = users.filter(user => {
    if (filterRole === 'all') return true
    if (filterRole === 'admin') return user.is_admin
    if (filterRole === 'moderator') return user.is_moderator
    if (filterRole === 'user') return !user.is_admin && !user.is_moderator
    return true
  })

  const getRoleColor = (user) => {
    if (user.is_admin) return 'from-red-500 to-pink-600'
    if (user.is_moderator) return 'from-blue-500 to-indigo-600'
    return 'from-gray-400 to-gray-500'
  }

  const getRoleBadge = (user) => {
    if (user.is_admin) return { text: 'ADMIN', icon: Shield, color: 'red' }
    if (user.is_moderator) return { text: 'MODERATOR', icon: ShieldCheck, color: 'blue' }
    return { text: 'USER', icon: UserCheck, color: 'gray' }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
      <div className="max-w-[1400px] mx-auto px-6">
        {/* Modern Header with Stats */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white via-white to-blue-50 rounded-3xl shadow-2xl p-8 mb-8 border border-blue-100">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-200 to-pink-200 rounded-full blur-3xl opacity-20 -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-200 to-purple-200 rounded-full blur-3xl opacity-20 -ml-32 -mb-32"></div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-pink-600 rounded-2xl blur-xl opacity-50 animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-orange-500 to-pink-600 p-5 rounded-2xl shadow-lg">
                  <Users className="w-12 h-12 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-5xl font-extrabold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-2">
                  User Management
                </h1>
                <p className="text-gray-600 text-lg">Manage users, roles, and permissions across the platform</p>
              </div>
            </div>
            <div className="text-right bg-gradient-to-br from-orange-50 to-pink-50 rounded-2xl p-6 border-2 border-orange-200 shadow-lg">
              <p className="text-sm text-gray-600 uppercase tracking-wider font-semibold mb-1">Total Users</p>
              <p className="text-5xl font-black bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                {pagination.total || users.length}
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filter Bar */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-200">
          <div className="flex gap-4 items-center flex-wrap">
            {/* Search Input */}
            <div className="flex-1 min-w-[300px] relative">
              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
              <input
                type="text"
                placeholder="Search by username or email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPage(1)
                }}
                className="w-full pl-14 pr-12 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all bg-gray-50 hover:bg-white"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-2 border-2 border-gray-200">
              <Filter className="w-5 h-5 text-gray-500 ml-2" />
              <select
                value={filterRole}
                onChange={(e) => {
                  setFilterRole(e.target.value)
                  setPage(1)
                }}
                className="px-4 py-2 bg-transparent border-0 text-gray-700 font-semibold focus:ring-0 cursor-pointer outline-none"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admins Only</option>
                <option value="moderator">Moderators Only</option>
                <option value="user">Users Only</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-3 rounded-xl border-2 border-blue-200">
              <p className="text-sm text-gray-600 font-medium whitespace-nowrap">
                Showing <span className="font-black text-blue-600">{filteredUsers.length}</span> results
              </p>
            </div>
          </div>
        </div>

        {/* Users List - Horizontal Layout */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-t-4 border-blue-600 mx-auto mb-6"></div>
                <div className="absolute inset-0 animate-ping rounded-full h-20 w-20 border-4 border-blue-300 mx-auto opacity-20"></div>
              </div>
              <p className="text-gray-600 text-xl font-semibold">Loading users...</p>
            </div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-xl p-20 text-center border-2 border-dashed border-gray-300">
            <div className="relative inline-block mb-6">
              <Users className="w-24 h-24 text-gray-300" />
              <div className="absolute -top-2 -right-2 bg-orange-500 rounded-full p-2">
                <Search className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">No users found</h3>
            <p className="text-gray-500 text-lg">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="bg-gradient-to-r from-gray-50 to-white rounded-t-xl border-b-2 border-gray-200 px-4 py-3 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-[220px] text-xs font-bold text-gray-600 uppercase tracking-wider">User</div>
                <div className="w-[200px] text-xs font-bold text-gray-600 uppercase tracking-wider">Email</div>
                <div className="w-[90px] text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Levels</div>
                <div className="w-[90px] text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Score</div>
                <div className="w-[100px] text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Joined</div>
                <div className="flex-1 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</div>
              </div>
            </div>

            {/* User Rows */}
            <div className="space-y-2 mb-8">
              {filteredUsers.map((user) => {
                const role = getRoleBadge(user)
                const RoleIcon = role.icon
                
                return (
                  <div 
                    key={user.id}
                    className="group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-blue-400 overflow-hidden"
                  >
                    {/* Gradient Accent Bar */}
                    <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${getRoleColor(user)}`}></div>
                    
                    <div className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {/* User Info - 220px */}
                        <div className="flex items-center gap-2 w-[220px] flex-shrink-0">
                          <div className="relative flex-shrink-0">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getRoleColor(user)} flex items-center justify-center shadow-sm`}>
                              <span className="text-base font-black text-white">
                                {user.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gradient-to-br ${getRoleColor(user)} rounded-full border border-white flex items-center justify-center`}>
                              <RoleIcon className="w-2 h-2 text-white" />
                            </div>
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-bold text-gray-900 truncate">{user.username}</h3>
                            <span className={`inline-block px-1.5 py-0.5 bg-gradient-to-r ${getRoleColor(user)} text-white text-[9px] font-bold rounded`}>
                              {role.text}
                            </span>
                          </div>
                        </div>

                        {/* Email - 200px */}
                        <div className="flex items-center gap-1 w-[200px] flex-shrink-0">
                          <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <span className="text-xs text-gray-600 truncate" title={user.email}>{user.email}</span>
                        </div>

                        {/* Levels - 90px */}
                        <div className="w-[90px] flex-shrink-0">
                          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg px-2 py-1.5 border border-orange-200">
                            <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-1.5 py-0.5 rounded text-[10px] font-black text-center mb-0.5">
                              LVL {user.level || 1}
                            </div>
                            <div className="text-[9px] text-gray-500 font-medium text-center">
                              Judge {user.judge_level || 1}
                            </div>
                          </div>
                        </div>

                        {/* Credibility Score - 90px */}
                        <div className="w-[90px] flex-shrink-0">
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg px-2 py-1.5 border border-blue-200">
                            <div className="flex items-center justify-center gap-0.5 mb-0.5">
                              <BarChart3 className="w-3 h-3 text-blue-600" />
                              <span className="text-base font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                {user.credibility_score || 0}
                              </span>
                            </div>
                            <div className="text-[9px] text-gray-500 font-medium text-center">Points</div>
                          </div>
                        </div>

                        {/* Join Date - 100px */}
                        <div className="w-[100px] flex-shrink-0">
                          <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg px-2 py-1.5 border border-gray-200">
                            <div className="flex items-center justify-center gap-0.5 mb-0.5">
                              <Calendar className="w-2.5 h-2.5 text-gray-500" />
                              <span className="text-[11px] font-bold text-gray-900">
                                {new Date(user.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                            <div className="text-[9px] text-gray-500 font-medium text-center">
                              {new Date(user.created_at).getFullYear()}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons - Flex */}
                        <div className="flex-1 flex justify-center gap-1.5">
                          <button
                            onClick={() => handleToggleAdmin(user)}
                            className={`p-2 rounded-lg transition-all duration-200 shadow-sm border ${
                              user.is_admin 
                                ? 'bg-gradient-to-br from-red-500 to-pink-600 text-white border-red-400 hover:shadow-md' 
                                : 'bg-white text-gray-500 border-gray-300 hover:border-red-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title={user.is_admin ? 'Remove Admin Rights' : 'Grant Admin Rights'}
                          >
                            <Shield className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleModerator(user)}
                            className={`p-2 rounded-lg transition-all duration-200 shadow-sm border ${
                              user.is_moderator 
                                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-blue-400 hover:shadow-md' 
                                : 'bg-white text-gray-500 border-gray-300 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50'
                            }`}
                            title={user.is_moderator ? 'Remove Moderator Rights' : 'Grant Moderator Rights'}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="p-2 rounded-lg bg-white text-gray-500 border border-gray-300 hover:border-red-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200 shadow-sm"
                            title="Delete User (Permanent)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div className="bg-gradient-to-r from-white to-blue-50 rounded-2xl shadow-xl p-6 border-2 border-blue-100">
                <div className="flex items-center justify-between">
                  <p className="text-gray-700 font-semibold text-lg">
                    Showing <span className="font-black text-blue-600">{filteredUsers.length}</span> of{' '}
                    <span className="font-black text-blue-600">{pagination.total}</span> users
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-blue-600 hover:text-white hover:border-blue-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-700 disabled:hover:border-gray-300 transition-all font-semibold shadow-md"
                    >
                      ← Previous
                    </button>
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-black text-lg shadow-lg border-2 border-blue-500 min-w-[140px] text-center">
                      {page} / {pagination.total_pages || 1}
                    </div>
                    <button
                      onClick={() => setPage(p => Math.min(pagination.total_pages || 1, p + 1))}
                      disabled={page === (pagination.total_pages || 1)}
                      className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-blue-600 hover:text-white hover:border-blue-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-700 disabled:hover:border-gray-300 transition-all font-semibold shadow-md"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Error Messages */}
        {(error || updateError) && (
          <div className="mt-6 p-6 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 rounded-2xl flex items-center gap-4 shadow-xl">
            <div className="bg-red-500 p-3 rounded-xl">
              <AlertTriangle className="w-7 h-7 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-red-900 text-lg mb-1">Error Occurred</h4>
              <p className="text-red-800 font-medium">
                {error || updateError}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}