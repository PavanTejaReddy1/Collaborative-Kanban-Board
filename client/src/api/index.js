import axios from 'axios'

/**
 * Shared Axios instance.
 * Every request automatically includes the JWT from localStorage.
 * A 401 response clears the token so the user is returned to login.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

// ── Request interceptor: attach JWT ────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor: handle global 401 ───────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      // A full page redirect is the safest fallback before the
      // AuthContext is wired up.
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default api
