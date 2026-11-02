import axios from 'axios'

/**
 * Shared Axios instance.
 *
 * - Attaches the JWT from localStorage to every request.
 * - On a 401 response, clears the stored token.
 *   The redirect to /login is handled by ProtectedRoute / AuthContext,
 *   NOT here — doing a hard location redirect would bypass React Router
 *   and lose router state (e.g. the "redirect back after login" path).
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

// ── Response interceptor: clear stale token on 401 ────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Remove the expired / invalid token.
      // AuthContext's useEffect will detect user === null and
      // ProtectedRoute will redirect to /login automatically.
      localStorage.removeItem('token')
    }
    return Promise.reject(error)
  },
)

export default api
