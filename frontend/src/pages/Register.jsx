import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { authAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'

export default function Register() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [isLoading, setIsLoading] = useState(false)
  const { register, handleSubmit, formState: { errors }, watch } = useForm()

  const password = watch('password')

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const response = await authAPI.register(data)
      setAuth(response.data.user, response.data.token)
      toast.success('Registration successful!')
      navigate('/')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      {/* Decorative Background Blobs */}
      <div className="decorative-blob blob-1"></div>
      <div className="decorative-blob blob-2"></div>
      
      <div className="max-w-md w-full">
        <div className="card fade-in" style={{ padding: '3rem' }}>
          {/* Header with Icon */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-red-500 text-white text-3xl mb-4 shadow-lg">
              🍳
            </div>
            <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Join Cook-Off
            </h1>
            <p className="text-text-secondary">Create your culinary account</p>
          </div>
        
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label>Username</label>
              <input
                type="text"
                className="input"
                placeholder="chef_extraordinaire"
                {...register('username', { 
                  required: 'Username is required',
                  minLength: { value: 3, message: 'Minimum 3 characters' }
                })}
              />
              {errors.username && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '0.5rem' }}>{errors.username.message}</p>}
            </div>

            <div>
              <label>Email</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                {...register('email', { required: 'Email is required' })}
              />
              {errors.email && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '0.5rem' }}>{errors.email.message}</p>}
            </div>

            <div>
              <label>Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                {...register('password', { 
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Minimum 8 characters' }
                })}
              />
              {errors.password && <p style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '0.5rem' }}>{errors.password.message}</p>}
            </div>

            <button 
              type="submit" 
              className="btn btn-primary w-full"
              disabled={isLoading}
              style={{ width: '100%', marginTop: '1rem', fontSize: '1.1rem', padding: '1rem' }}
            >
              {isLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></span>
                  Creating Account...
                </span>
              ) : (
                <>
                  <span>🚀</span> Start Cooking
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: '2rem', textAlign: 'center', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--text-secondary)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>
                Login here →
              </Link>
            </p>
          </div>
        </div>
        
        {/* Footer Note */}
        <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-light)', fontSize: '0.875rem' }}>
          © 2026 Cook-Off Platform. Built with ❤️ for food lovers.
        </p>
      </div>
    </div>
  )
}
