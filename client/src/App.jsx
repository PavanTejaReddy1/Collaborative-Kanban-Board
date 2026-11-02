import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }   from './contexts/AuthContext.jsx'
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute.jsx'
import LoginPage     from './pages/auth/LoginPage.jsx'
import RegisterPage  from './pages/auth/RegisterPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'

/**
 * App — root router.
 *
 * Route structure:
 *   /login      – public only (redirects to /dashboard if already logged in)
 *   /register   – public only
 *   /dashboard  – protected (redirects to /login if not authenticated)
 *   /           – redirects to /dashboard
 *   *           – redirects to /dashboard
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <RegisterPage />
              </PublicOnlyRoute>
            }
          />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Default redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
