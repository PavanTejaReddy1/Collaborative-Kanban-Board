import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckSquare, Calendar, Flag } from 'lucide-react'
import AppLayout from '../components/layout/AppLayout.jsx'
import { useAuth }         from '../contexts/AuthContext.jsx'
import { useOrganization } from '../contexts/OrganizationContext.jsx'
import { useTenant }       from '../contexts/TenantContext.jsx'
import * as boardApi from '../api/boards.js'

const P_COLOR = {
  LOW: 'bg-gray-100 text-gray-600', MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700', URGENT: 'bg-red-100 text-red-700',
}

export default function MyTasksPage() {
  const { user }         = useAuth()
  const { activeOrg }    = useOrganization()
  const { activeTenant } = useTenant()
  const navigate         = useNavigate()
  const [tasks,   setTasks]   = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!activeOrg || !activeTenant) return
    setLoading(true)
    // Load all boards then get tasks assigned to current user
    boardApi.getBoards(activeOrg._id, activeTenant._id)
      .then(async (res) => {
        const boards = res.data.data.boards
        const allTasks = []
        for (const board of boards) {
          try {
            const tr = await boardApi.getTasks(activeOrg._id, activeTenant._id, board._id)
            const mine = tr.data.data.tasks.filter(t => t.assignedTo?._id === user?._id || t.assignedTo?.id === user?.id)
            mine.forEach(t => allTasks.push({ ...t, boardTitle: board.title }))
          } catch (_) {}
        }
        setTasks(allTasks.sort((a, b) => {
          if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate)
          if (a.dueDate) return -1; if (b.dueDate) return 1; return 0
        }))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [activeOrg, activeTenant, user])

  return (
    <AppLayout>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
          <p className="text-gray-500 mt-1">{tasks.length} tasks assigned to you</p>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse"/>)}</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-20">
            <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No tasks assigned to you</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => {
              const overdue = task.dueDate && new Date(task.dueDate) < new Date()
              return (
                <button
                  key={task._id}
                  onClick={() => navigate(`/boards/${task.boardId}`)}
                  className="w-full bg-white rounded-xl border border-gray-200 p-4 text-left hover:border-primary-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start gap-3">
                    <CheckSquare className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{task.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{task.boardTitle}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${P_COLOR[task.priority]}`}>
                        {task.priority}
                      </span>
                      {task.dueDate && (
                        <span className={`text-xs flex items-center gap-1 px-2 py-0.5 rounded-full ${overdue ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                          <Calendar className="w-3 h-3" />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
