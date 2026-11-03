import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Kanban, CheckSquare, Clock, BarChart3, Plus, ArrowRight } from 'lucide-react'
import AppLayout      from '../components/layout/AppLayout.jsx'
import { Button }     from '../components/ui/Button.jsx'
import { useAuth }    from '../contexts/AuthContext.jsx'
import { useOrganization } from '../contexts/OrganizationContext.jsx'
import { useTenant }  from '../contexts/TenantContext.jsx'
import { useBoard }   from '../contexts/BoardContext.jsx'
import * as boardApi  from '../api/boards.js'

const PRIORITY_COLOR = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
}

export default function DashboardPage() {
  const { user }         = useAuth()
  const { activeOrg, organizations, isLoadingOrgs } = useOrganization()
  const { activeTenant } = useTenant()
  const { boards, loadBoards, isLoading: boardsLoading, createBoard } = useBoard()
  const navigate         = useNavigate()
  const [activity,   setActivity]   = useState([])
  const [statsError, setStatsError] = useState(null)
  const [creating,   setCreating]   = useState(false)

  useEffect(() => { if (activeOrg && activeTenant) loadBoards() }, [activeOrg, activeTenant, loadBoards])

  useEffect(() => {
    if (!activeOrg || !activeTenant) return
    boardApi.getActivity(activeOrg._id, activeTenant._id, { limit: 15 })
      .then(r => setActivity(r.data.data.logs))
      .catch(() => setStatsError('Failed to load activity'))
  }, [activeOrg, activeTenant])

  // No org yet
  if (!isLoadingOrgs && organizations.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-5">
            <Kanban className="w-7 h-7 text-primary-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Welcome, {user?.name}!</h1>
          <p className="text-gray-500 text-sm mb-6">Create your first organization to get started.</p>
          <Button className="w-full" size="lg" onClick={() => navigate('/organizations/new')}>
            Create organization
          </Button>
        </div>
      </div>
    )
  }

  const totalTasks     = boards.reduce((s, b) => s, 0)
  const recentBoards   = boards.slice(0, 4)

  const handleCreateBoard = async () => {
    const title = prompt('Board title:')
    if (!title?.trim()) return
    setCreating(true)
    try {
      const board = await createBoard({ title: title.trim(), description: '' })
      navigate(`/boards/${board._id}`)
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to create board')
    } finally { setCreating(false) }
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Good {getTimeGreeting()}, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-500 mt-1">
            {activeOrg?.name} · {activeTenant?.name || 'Select a branch'}
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Kanban className="w-5 h-5" />} label="Total Boards"   value={boards.length}  color="blue" />
          <StatCard icon={<CheckSquare className="w-5 h-5" />} label="All Tasks"  value="—"              color="green" />
          <StatCard icon={<Clock className="w-5 h-5" />}  label="In Progress"    value="—"              color="orange" />
          <StatCard icon={<BarChart3 className="w-5 h-5" />} label="Completed"   value="—"              color="purple" />
        </div>

        {/* Boards + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Boards list */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Recent Boards</h2>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate('/boards')}>
                  View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
                <Button size="sm" isLoading={creating} onClick={handleCreateBoard}>
                  <Plus className="w-3.5 h-3.5" /> New board
                </Button>
              </div>
            </div>

            {boardsLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
              </div>
            ) : recentBoards.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                <Kanban className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No boards yet</p>
                <p className="text-gray-400 text-sm mt-1">Create your first board to start organizing work</p>
                <Button className="mt-4" onClick={handleCreateBoard} isLoading={creating}>
                  <Plus className="w-4 h-4" /> Create board
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentBoards.map(board => (
                  <button
                    key={board._id}
                    onClick={() => navigate(`/boards/${board._id}`)}
                    className="w-full bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 hover:border-primary-300 hover:shadow-sm transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <Kanban className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{board.title}</p>
                      <p className="text-sm text-gray-400 truncate">{board.description || 'No description'}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div>
            <h2 className="font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 max-h-96 overflow-y-auto scrollbar-thin">
              {activity.length === 0 ? (
                <p className="text-sm text-gray-400 p-4 text-center">No activity yet</p>
              ) : (
                activity.map(log => (
                  <div key={log._id} className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-primary-600 text-xs font-bold">
                          {log.userId?.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700">
                          <span className="font-medium">{log.userId?.name}</span>{' '}
                          <span className="text-gray-500">{formatAction(log.action)}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

function StatCard({ icon, label, value, color }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  }
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className={`w-9 h-9 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

function getTimeGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function formatAction(action) {
  return action.replace('.', ' ').replace('_', ' ')
}
