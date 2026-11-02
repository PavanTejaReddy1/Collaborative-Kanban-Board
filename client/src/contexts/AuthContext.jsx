import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { registerUser, loginUser, getMe, logoutUser } from '../api/auth.js'

/**
 * AuthContext
 *
 * Provides:
 *   user        – the authenticated User object, or null
 *   token       – the JWT string, or null
 *   isLoading   – true while the initial session is being restored
 *   isAuthenticated – derived boolean
 *   register(data)  – call the register API
 *   login(data)     – call the login API
 *   logout()        – clear session
 *
 * Token strategy:
 *   The JWT is stored in localStorage under the key 'token'.
 *   This is a deliberate tradeoff: localStorage is vulnerable to XSS but
 *   simple to implement. A production hardening step would move to an
 *   httpOnly cookie with a short-lived access token and refresh token.
 *   The architecture here makes that migration straightforward because the
 *   Axios interceptor in api/index.js is the single place the token is read.
 *
 *   Passwords are NEVER stored anywhere on the client.
 */

const AuthContext = createContext(null)

const TOKEN_KEY = 'token'

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(null)
  const [token,     setToken]     = useState(() => localStorage.getItem(TOKEN_KEY))
  const [isLoading, setIsLoading] = useState(true)

  // ── Persist token to localStorage ────────────────────────────────────────
  const saveToken = useCallback((newToken) => {
    if (newToken) {
      localStorage.setItem(TOKEN_KEY, newToken)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
    setToken(newToken)
  }, [])

  // ── Clear session ─────────────────────────────────────────────────────────
  const clearSession = useCallback(() => {
    saveToken(null)
    setUser(null)
  }, [saveToken])

  // ── Restore session on mount ──────────────────────────────────────────────
  // If a token exists in localStorage, verify it with the server and
  // re-hydrate the user object. This handles page refreshes.
  useEffect(() => {
    if (!token) {
      setIsLoading(false)
      return
    }

    getMe()
      .then((res) => {
        setUser(res.data.data.user)
      })
      .catch(() => {
        // Token is expired or invalid — clear it
        clearSession()
      })
      .finally(() => {
        setIsLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // run only on mount

  // ── register ──────────────────────────────────────────────────────────────
  const register = useCallback(async (data) => {
    const res = await registerUser(data)
    const { token: newToken, user: newUser } = res.data.data
    saveToken(newToken)
    setUser(newUser)
    return newUser
  }, [saveToken])

  // ── login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (data) => {
    const res = await loginUser(data)
    const { token: newToken, user: newUser } = res.data.data
    saveToken(newToken)
    setUser(newUser)
    return newUser
  }, [saveToken])

  // ── logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await logoutUser()
    } catch {
      // Ignore server errors during logout — we clear locally regardless
    } finally {
      clearSession()
    }
  }, [clearSession])

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user,
    register,
    login,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * useAuth()
 * Convenience hook. Throws if used outside <AuthProvider>.
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
