import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Kanban, CheckSquare, Users,
  Activity, Settings, LogOut, ChevronDown, Plus,
  Building2, GitBranch, Wifi, WifiOff,
} from 'lucide-react'
import { useAuth }         from '../../contexts/AuthContext.jsx'
import { useOrganization } from '../../contexts/OrganizationContext.jsx'
import { useTenant }       from '../../contexts/TenantContext.jsx'
import { useSocket }       from '../../contexts/SocketContext.jsx'

export default function Sidebar() {
  const { user, logout }                               = useAuth()
  const { organizations, activeOrg, activeOrgRole, selectOrg } = useOrganization()
  const { tenants, activeTenant, selectTenant }        = useTenant()
  const { isConnected, onlineUsers }                   = useSocket()
  const navigate = useNavigate()

  const nav = [
    { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/boards',     icon: Kanban,          label: 'Boards' },
    { to: '/my-tasks',   icon: CheckSquare,     label: 'My Tasks' },
    { to: '/members',    icon: Users,           label: 'Members' },
    { to: '/activity',   icon: Activity,        label: 'Activity' },
  ]
  const adminNav = [
    { to: '/settings',   icon: Settings,        label: 'Settings' },
  ]

  return (
    <aside className="w-64 bg-gray-900 text-gray-100 flex flex-col h-screen fixed left-0 top-0 z-20">
      {/* ── Logo ─────────────────────────────────────────────────────── */}
      <div className="px-4 py-5 border-b border-gray-700/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center flex-shrink-0">
            <Kanban className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-sm tracking-wide">Kanban Board</span>
        </div>
      </div>

      {/* ── Org Selector ─────────────────────────────────────────────── */}
      <div className="px-3 pt-4 pb-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Organization</p>
        <div className="relative group">
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-sm">
            <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="flex-1 text-left truncate text-gray-200 font-medium">
              {activeOrg?.name || 'Select org…'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>
          {organizations.length > 1 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 rounded-lg border border-gray-700 shadow-xl z-30 hidden group-focus-within:block">
              {organizations.map(({ organization }) => (
                <button
                  key={organization._id}
                  onClick={() => selectOrg(organization._id)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${activeOrg?._id === organization._id ? 'text-primary-400' : 'text-gray-300'}`}
                >
                  {organization.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Branch Selector ──────────────────────────────────────────── */}
      {activeOrg && (
        <div className="px-3 pb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Branch</p>
          <div className="flex flex-col gap-1">
            {tenants.map(t => (
              <button
                key={t._id}
                onClick={() => selectTenant(t._id)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${activeTenant?._id === t._id ? 'bg-primary-600/20 text-primary-300' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
              >
                <GitBranch className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{t.name}</span>
              </button>
            ))}
            {['ORG_ADMIN'].includes(activeOrgRole) && (
              <button
                onClick={() => navigate('/tenants/new')}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors mt-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New branch</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Nav links ────────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-2 border-t border-gray-700/60 overflow-y-auto">
        <div className="space-y-0.5 mt-2">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-primary-600/20 text-primary-300 font-medium'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </div>

        {['ORG_ADMIN', 'TENANT_ADMIN'].includes(activeOrgRole) && (
          <div className="space-y-0.5 mt-4 pt-4 border-t border-gray-700/60">
            {adminNav.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive ? 'bg-primary-600/20 text-primary-300 font-medium' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      {/* ── Presence indicator ───────────────────────────────────────── */}
      {isConnected && onlineUsers.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-700/60">
          <p className="text-xs text-gray-500 mb-1.5">{onlineUsers.length} online</p>
          <div className="flex -space-x-1.5">
            {onlineUsers.slice(0, 5).map(u => (
              <div
                key={u.userId}
                title={u.name}
                className="w-6 h-6 rounded-full bg-primary-600 border-2 border-gray-900 flex items-center justify-center text-white text-xs font-bold"
              >
                {u.name?.charAt(0)?.toUpperCase()}
              </div>
            ))}
            {onlineUsers.length > 5 && (
              <div className="w-6 h-6 rounded-full bg-gray-700 border-2 border-gray-900 flex items-center justify-center text-gray-300 text-xs">
                +{onlineUsers.length - 5}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── User profile ─────────────────────────────────────────────── */}
      <div className="px-3 py-3 border-t border-gray-700/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-200 truncate">{user?.name}</p>
            <div className="flex items-center gap-1">
              {isConnected
                ? <Wifi className="w-3 h-3 text-green-400" />
                : <WifiOff className="w-3 h-3 text-red-400" />
              }
              <span className="text-xs text-gray-500 truncate">{user?.email}</span>
            </div>
          </div>
          <button
            onClick={() => logout()}
            title="Sign out"
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
