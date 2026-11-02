import api from './index.js'

/**
 * Auth API calls.
 * All functions return the Axios response so callers can access
 * response.data.data.token, response.data.data.user, etc.
 */

/**
 * register({ name, email, password })
 * POST /api/auth/register
 */
export function registerUser(data) {
  return api.post('/auth/register', data)
}

/**
 * login({ email, password })
 * POST /api/auth/login
 */
export function loginUser(data) {
  return api.post('/auth/login', data)
}

/**
 * getMe()
 * GET /api/auth/me  – requires valid token (sent automatically by interceptor)
 */
export function getMe() {
  return api.get('/auth/me')
}

/**
 * logout()
 * POST /api/auth/logout
 */
export function logoutUser() {
  return api.post('/auth/logout')
}
