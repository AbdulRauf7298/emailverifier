import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Redirect to login on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

// Auth
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (email, password) => {
    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', password)
    return api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  },
  me: () => api.get('/auth/me'),
  regenerateApiKey: () => api.post('/auth/regenerate-api-key'),
}

// Verification
export const verifyApi = {
  single: (email) => api.post('/verify/single', { email }),
  bulkUpload: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/verify/bulk', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  bulkStatus: (jobId) => api.get(`/verify/bulk/${jobId}`),
  bulkResults: (jobId, skip = 0, limit = 100) =>
    api.get(`/verify/bulk/${jobId}/results`, { params: { skip, limit } }),
  history: (skip = 0, limit = 50) =>
    api.get('/verify/history', { params: { skip, limit } }),
}

// Credits
export const creditsApi = {
  balance: () => api.get('/credits/balance'),
  transactions: (skip = 0, limit = 50) =>
    api.get('/credits/transactions', { params: { skip, limit } }),
}

// Admin
export const adminApi = {
  users: (skip = 0, limit = 100) =>
    api.get('/admin/users', { params: { skip, limit } }),
  getUser: (userId) => api.get(`/admin/users/${userId}`),
  toggleActive: (userId, active) =>
    api.patch(`/admin/users/${userId}/activate`, null, { params: { active } }),
  adjustCredits: (userId, amount, reason) =>
    api.post('/admin/credits/adjust', { user_id: userId, amount, reason }),
  allTransactions: (skip = 0, limit = 100) =>
    api.get('/admin/credits/transactions', { params: { skip, limit } }),
  allVerifications: (skip = 0, limit = 100) =>
    api.get('/admin/verifications', { params: { skip, limit } }),
  allBulkJobs: (skip = 0, limit = 100) =>
    api.get('/admin/bulk-jobs', { params: { skip, limit } }),
  stats: () => api.get('/admin/stats'),
}

export default api
