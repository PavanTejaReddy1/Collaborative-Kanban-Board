import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }         from './contexts/AuthContext.jsx'
import { OrganizationProvider } from './contexts/OrganizationContext.jsx'
import { TenantProvider }       from './contexts/TenantContext.jsx'
import { SocketProvider }       from './contexts/SocketContext.jsx'
import { BoardProvider }        from './contexts/BoardContext.jsx'
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute.jsx'

import LoginPage              from './pages/auth/LoginPage.jsx'
import RegisterPage           from './pages/auth/RegisterPage.jsx'
import DashboardPage          from './pages/DashboardPage.jsx'
import BoardsPage             from './pages/board/BoardsPage.jsx'
import KanbanBoardPage        from './pages/board/KanbanBoardPage.jsx'
import MembersPage            from './pages/MembersPage.jsx'
import ActivityPage           from './pages/ActivityPage.jsx'
import SettingsPage           from './pages/SettingsPage.jsx'
import MyTasksPage            from './pages/MyTasksPage.jsx'
import CreateOrganizationPage from './pages/organization/CreateOrganizationPage.jsx'
import CreateTenantPage       from './pages/tenant/CreateTenantPage.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OrganizationProvider>
          <TenantProvider>
            <SocketProvider>
              <BoardProvider>
                <Routes>
                  {/* Public */}
                  <Route path="/login"    element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
                  <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />

                  {/* Protected */}
                  <Route path="/dashboard"         element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                  <Route path="/boards"             element={<ProtectedRoute><BoardsPage /></ProtectedRoute>} />
                  <Route path="/boards/:boardId"    element={<ProtectedRoute><KanbanBoardPage /></ProtectedRoute>} />
                  <Route path="/my-tasks"           element={<ProtectedRoute><MyTasksPage /></ProtectedRoute>} />
                  <Route path="/members"            element={<ProtectedRoute><MembersPage /></ProtectedRoute>} />
                  <Route path="/activity"           element={<ProtectedRoute><ActivityPage /></ProtectedRoute>} />
                  <Route path="/settings"           element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                  <Route path="/organizations/new"  element={<ProtectedRoute><CreateOrganizationPage /></ProtectedRoute>} />
                  <Route path="/tenants/new"        element={<ProtectedRoute><CreateTenantPage /></ProtectedRoute>} />

                  <Route path="/"  element={<Navigate to="/dashboard" replace />} />
                  <Route path="*"  element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </BoardProvider>
            </SocketProvider>
          </TenantProvider>
        </OrganizationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
