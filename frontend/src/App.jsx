import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import RecipeList from './pages/RecipeList'
import RecipeDetail from './pages/RecipeDetail'
import CreateRecipe from './pages/CreateRecipe'
import BattleList from './pages/BattleList'
import BattleDetail from './pages/BattleDetail'
import Profile from './pages/Profile'
import Leaderboard from './pages/Leaderboard'
import AdminDashboard from './pages/AdminDashboard'
import AdminUsers from './pages/AdminUsers'
import AdminBattles from './pages/AdminBattles'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="recipes" element={<RecipeList />} />
        <Route path="recipes/:id" element={<RecipeDetail />} />
        <Route path="recipes/create" element={
          <ProtectedRoute>
            <CreateRecipe />
          </ProtectedRoute>
        } />
        <Route path="battles" element={<BattleList />} />
        <Route path="battles/:id" element={<BattleDetail />} />
        <Route path="profile/:id" element={<Profile />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="admin" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="admin/users" element={
          <ProtectedRoute>
            <AdminUsers />
          </ProtectedRoute>
        } />
        <Route path="admin/battles" element={
          <ProtectedRoute>
            <AdminBattles />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  )
}

export default App
