import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }         from './contexts/AuthContext.jsx'
import { OrganizationProvider } from './contexts/OrganizationContext.jsx'
import { TenantProvider }       from './contexts/TenantContext.jsx'
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute.jsx'

import LoginPage              from './pages/auth/LoginPage.jsx'
import RegisterPage           from './pages/auth/RegisterPage.jsx'
import DashboardPage          from './pages/DashboardPage.jsx'
import CreateOrganizationPage from './pages/organization/CreateOrganizationPage.jsx'
import CreateTenantPage       from './pages/tenant/CreateTenantPage.jsx'

/**
 * Context layering:
 *   AuthProvider                – JWT + user session
 *     OrganizationProvider      – active org + org list (depends on auth)
 *       TenantProvider          – active tenant + tenant list (depends on active org)
 *
 * All context providers are inside BrowserRouter so they can use
 * useNavigate if needed in the future.
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OrganizationProvider>
          <TenantProvider>
            <Routes>
              {/* ── Public routes ──────────────────────────────────────── */}
              <Route path="/login"    element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
              <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />

              {/* ── Protected routes ───────────────────────────────────── */}
              <Route path="/dashboard"          element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/organizations/new"  element={<ProtectedRoute><CreateOrganizationPage /></ProtectedRoute>} />
              <Route path="/tenants/new"        element={<ProtectedRoute><CreateTenantPage /></ProtectedRoute>} />

              {/* ── Default redirects ──────────────────────────────────── */}
              <Route path="/"  element={<Navigate to="/dashboard" replace />} />
              <Route path="*"  element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </TenantProvider>
        </OrganizationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
