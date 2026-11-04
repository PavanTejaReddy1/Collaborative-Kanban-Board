import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Kanban, CheckSquare, Clock, BarChart3, Plus, ArrowRight, RefreshCw } from 'lucide-react'
import AppLayout      from '../components/layout/AppLayout.jsx'
import { Button }     from '../components/ui/Button.jsx'
import { useAuth }    from '../contexts/AuthContext.jsx'
import { useOrganization } from '../contexts/OrganizationContext.jsx'
import { useTenant }  from '../contexts/TenantContext.jsx'
import { useBoard }   from '../contexts/BoardContext.jsx'
import * as boardApi  from '../api/boards.js'

export default function DashboardPage() {
  const { user }         = useAuth()
  const { activeOrg, organizations, isLoadingOrgs } = useOrganization()
  const { activeTenant, isLoadingTenants } = useTenant()
  const { boards, loadBoards, isLoading: boardsLoading, createBoard } = useBoard()
  const navigate = useNavigate()

  const [activity,  setActivity]  = useState([])
  const [taskStats, setTaskStats] = useState({ total: 0, inProgress: 0, done: 0 })
  const [creating,  setCreating]  = useState(false)

  // Load boards whenever org/tenant are ready
  useEffect(() => {
    if (activeOrg && activeTenant) loadBoards()
  }, [activeOrg, activeTenant, loadBoards])

  // Load activity
  useEffect(() => {
    if (!activeOrg || !activeTenant) return
    boardApi.getActivity(activeOrg._id, activeTenant._id, { limit: 20 })
      .then(r => setActivity(r.data.data.logs))
      .catch(() => {})
  }, [activeOrg, activeTenant])

  // Compute task stats from all boards in this tenant
  useEffect(() => {
    if (!activeOrg || !activeTenant || boards.length === 0) {
      setTaskStats({ total: 0, inProgress: 0, done: 0 })
      return
    }
    let total = 0, inProgress = 0, done = 0
    // Fetch the full board data for each board to count tasks
    const fetchAll = async () => {
      for (const board of boards) {
        try {
          const res = await boardApi.getBoard(activeOrg._id, activeTenant._id, board._id)
          const cols = res.data.data.columns || []
          for (const col of cols) {
            total += col.tasks.length
            const titleLower = col.title.toLowerCase()
            if (titleLower.includes('progress') || titleLower.includes('doing')) {
              inProgress += col.tasks.length
            }
            if (titleLower.includes('done') || titleLower.includes('complete') || titleLower.includes('finished')) {
              done += col.tasks.length
            }
          }
        } catch (_) {}
      }
      setTaskStats({ total, inProgress, done })
    }
    fetchAll()
  }, [boards, activeOrg, activeTenant])

  // Show loading spinner while orgs/tenants are being fetched
  const isInitializing = isLoadingOrgs || isLoadingTenants

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading your workspace…</p>
        </div>
      </div>
    )
  }

  // No org yet (after loading completes)
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

  const recentBoards = boards.slice(0, 4)

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
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <span className="font-medium text-gray-700">{activeOrg?.name}</span>
            <span className="text-gray-300">·</span>
            <span>{activeTenant?.name || 'No branch selected'}</span>
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Kanban className="w-5 h-5" />}       label="Total Boards"   value={boards.length}          color="blue"   />
          <StatCard icon={<CheckSquare className="w-5 h-5" />}  label="Total Tasks"    value={taskStats.total}        color="green"  />
          <StatCard icon={<Clock className="w-5 h-5" />}        label="In Progress"    value={taskStats.inProgress}   color="orange" />
          <StatCard icon={<BarChart3 className="w-5 h-5" />}    label="Completed"      value={taskStats.done}         color="purple" />
        </div>

        {/* Boards + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Boards */}
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
                {[1,2,3].map(i => (
                  <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                ))}
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
                    className="w-full bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 hover:border-primary-300 hover:shadow-sm transition-all text-left group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <Kanban className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{board.title}</p>
                      <p className="text-sm text-gray-400 truncate">{board.description || 'No description'}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 transition-colors flex-shrink-0" />
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
                <p className="text-sm text-gray-400 p-6 text-center">No activity yet</p>
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
  return action.replace(/\./g, ' ').replace(/_/g, ' ')
}
