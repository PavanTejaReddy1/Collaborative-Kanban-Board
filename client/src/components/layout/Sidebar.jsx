import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Kanban, CheckSquare, Users,
  Activity, Settings, LogOut, ChevronDown,
  Plus, Building2, GitBranch, Wifi, WifiOff,
} from 'lucide-react'
import { useAuth }         from '../../contexts/AuthContext.jsx'
import { useOrganization } from '../../contexts/OrganizationContext.jsx'
import { useTenant }       from '../../contexts/TenantContext.jsx'
import { useSocket }       from '../../contexts/SocketContext.jsx'

export default function Sidebar() {
  const { user, logout }                                       = useAuth()
  const { organizations, activeOrg, activeOrgRole, selectOrg } = useOrganization()
  const { tenants, activeTenant, selectTenant }                = useTenant()
  const { isConnected, onlineUsers }                           = useSocket()
  const navigate = useNavigate()

  const [orgOpen, setOrgOpen] = useState(false)

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard'  },
    { to: '/boards',    icon: Kanban,           label: 'Boards'     },
    { to: '/my-tasks',  icon: CheckSquare,      label: 'My Tasks'  },
    { to: '/members',   icon: Users,            label: 'Members'   },
    { to: '/activity',  icon: Activity,         label: 'Activity'  },
  ]

  return (
    <aside className="w-60 bg-gray-900 flex flex-col h-screen fixed left-0 top-0 z-20 border-r border-gray-800">

      {/* ── Logo ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-gray-800 flex-shrink-0">
        <div className="w-7 h-7 rounded-md bg-primary-500 flex items-center justify-center flex-shrink-0">
          <Kanban className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-white text-sm">Kanban Board</span>
      </div>

      {/* ── Org selector ──────────────────────────────────────────────── */}
      <div className="px-3 pt-3 pb-1 flex-shrink-0 relative">
        <button
          onClick={() => setOrgOpen(o => !o)}
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-gray-800 transition-colors text-left"
        >
          <div className="w-6 h-6 rounded bg-primary-700 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate leading-tight">
              {activeOrg?.name || 'No organization'}
            </p>
            <p className="text-xs text-gray-500 truncate leading-tight">{activeOrgRole}</p>
          </div>
          {organizations.length > 1 && (
            <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform flex-shrink-0 ${orgOpen ? 'rotate-180' : ''}`} />
          )}
        </button>

        {/* Org dropdown */}
        {orgOpen && organizations.length > 1 && (
          <div className="absolute left-3 right-3 top-full mt-1 bg-gray-800 rounded-lg border border-gray-700 shadow-2xl z-50 overflow-hidden">
            {organizations.map(({ organization }) => (
              <button
                key={organization._id}
                onClick={() => { selectOrg(organization._id); setOrgOpen(false) }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors hover:bg-gray-700 ${
                  activeOrg?._id === organization._id
                    ? 'text-primary-300 bg-primary-900/30'
                    : 'text-gray-300'
                }`}
              >
                <div className="w-5 h-5 rounded bg-primary-700/50 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-3 h-3 text-primary-300" />
                </div>
                <span className="truncate font-medium">{organization.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Branch list ───────────────────────────────────────────────── */}
      {activeOrg && tenants.length > 0 && (
        <div className="px-3 pb-2 flex-shrink-0">
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wider px-2 mb-1">Branch</p>
          <div className="flex flex-col gap-0.5">
            {tenants.map(t => (
              <button
                key={t._id}
                onClick={() => selectTenant(t._id)}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
                  activeTenant?._id === t._id
                    ? 'bg-primary-600/20 text-primary-300'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{t.name}</span>
                {activeTenant?._id === t._id && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400 flex-shrink-0" />
                )}
              </button>
            ))}
            {activeOrgRole === 'ORG_ADMIN' && (
              <button
                onClick={() => navigate('/tenants/new')}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-gray-600 hover:text-gray-400 hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>New branch</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Divider ───────────────────────────────────────────────────── */}
      <div className="mx-3 border-t border-gray-800 mb-1 flex-shrink-0" />

      {/* ── Nav ───────────────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 overflow-y-auto">
        <div className="py-1 flex flex-col gap-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary-400' : ''}`} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Admin section */}
        {['ORG_ADMIN', 'TENANT_ADMIN'].includes(activeOrgRole) && (
          <div className="pt-2 mt-1 border-t border-gray-800 flex flex-col gap-0.5">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Settings className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary-400' : ''}`} />
                  Settings
                </>
              )}
            </NavLink>
          </div>
        )}
      </nav>

      {/* ── Online presence ───────────────────────────────────────────── */}
      {isConnected && onlineUsers.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-800 flex-shrink-0">
          <p className="text-xs text-gray-600 mb-1.5">{onlineUsers.length} online now</p>
          <div className="flex -space-x-1">
            {onlineUsers.slice(0, 6).map(u => (
              <div
                key={u.userId}
                title={u.name}
                className="w-5 h-5 rounded-full bg-primary-600 border border-gray-900 flex items-center justify-center text-white text-xs font-bold ring-1 ring-gray-900"
              >
                {u.name?.charAt(0)?.toUpperCase()}
              </div>
            ))}
            {onlineUsers.length > 6 && (
              <div className="w-5 h-5 rounded-full bg-gray-700 border border-gray-900 flex items-center justify-center text-gray-400 text-xs">
                +{onlineUsers.length - 6}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── User profile ──────────────────────────────────────────────── */}
      <div className="px-3 py-3 border-t border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-100 truncate leading-tight">{user?.name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              {isConnected
                ? <Wifi className="w-2.5 h-2.5 text-green-400 flex-shrink-0" />
                : <WifiOff className="w-2.5 h-2.5 text-red-400 flex-shrink-0" />
              }
              <span className="text-xs text-gray-500 truncate">{user?.email}</span>
            </div>
          </div>
          <button
            onClick={() => logout()}
            title="Sign out"
            className="p-1.5 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-gray-800 transition-colors flex-shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </aside>
  )
}
