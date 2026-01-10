import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
})

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

// Auth API
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me')
}

// Recipes API
export const recipesAPI = {
    list: (params) => api.get('/recipes', { params }),
    get: (id) => api.get(`/recipes/${id}`),
    create: (data) => api.post('/recipes', data),
    update: (id, data) => api.put(`/recipes/${id}`, data),
    delete: (id) => api.delete(`/recipes/${id}`)
}

// Ratings API
export const ratingsAPI = {
    create: (data) => api.post('/ratings', data),
    getByRecipe: (recipeId) => api.get(`/ratings/recipe/${recipeId}`)
}

// Comments API
export const commentsAPI = {
    create: (data) => api.post('/comments', data),
    getByRecipe: (recipeId) => api.get(`/comments/recipe/${recipeId}`),
    verify: (id) => api.post(`/comments/${id}/verify`)
}

// Battles API
export const battlesAPI = {
    list: () => api.get('/battles'),
    get: (id) => api.get(`/battles/${id}`),
    vote: (id, data) => api.post(`/battles/${id}/vote`, data),
    create: (data) => api.post('/battles', data)
}

// Users API
export const usersAPI = {
    get: (id) => api.get(`/users/${id}`),
    getRecipes: (id) => api.get(`/users/${id}/recipes`),
    leaderboard: () => api.get('/users/leaderboard')
}

// Media API
export const mediaAPI = {
    upload: (file) => {
        const formData = new FormData()
        formData.append('file', file)
        return api.post('/media/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
    }
}

export default api
