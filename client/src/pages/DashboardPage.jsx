import { useAuth } from '../contexts/AuthContext.jsx'
import { Button }  from '../components/ui/Button.jsx'

/**
 * DashboardPage
 *
 * Placeholder for the authenticated home screen.
 * Displays the current user's profile info to confirm auth is working.
 * Will be replaced by the full Kanban board UI in Phase 4.
 */
export default function DashboardPage() {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    // AuthContext clears the token; ProtectedRoute redirects to /login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
            </svg>
          </div>
          <span className="font-semibold text-gray-900">Collaborative Kanban</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <Button variant="secondary" size="sm" onClick={handleLogout}>
            Sign out
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 animate-fade-in">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-2xl">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Welcome, {user?.name}!</h1>
              <p className="text-gray-500 text-sm">Authentication is working correctly.</p>
            </div>
          </div>

          {/* User profile card */}
          <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
            <ProfileRow label="User ID"    value={user?.id} mono />
            <ProfileRow label="Name"       value={user?.name} />
            <ProfileRow label="Email"      value={user?.email} />
            <ProfileRow label="Status"     value={user?.isActive ? 'Active' : 'Inactive'} />
            <ProfileRow label="Last login" value={user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'First login'} />
            <ProfileRow label="Member since" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'} />
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-700">
            <strong>Phase 2 complete.</strong> Organization and tenant management, board creation, and the full Kanban UI will be added in the next phases.
          </div>
        </div>
      </main>
    </div>
  )
}

function ProfileRow({ label, value, mono = false }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm">
      <span className="text-gray-500 font-medium w-32 flex-shrink-0">{label}</span>
      <span className={`text-gray-900 text-right break-all ${mono ? 'font-mono text-xs' : ''}`}>
        {value || '—'}
      </span>
    </div>
  )
}
