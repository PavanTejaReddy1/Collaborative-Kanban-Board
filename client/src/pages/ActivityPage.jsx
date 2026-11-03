import { useEffect, useState } from 'react'
import { Activity } from 'lucide-react'
import AppLayout from '../components/layout/AppLayout.jsx'
import { useOrganization } from '../contexts/OrganizationContext.jsx'
import { useTenant }       from '../contexts/TenantContext.jsx'
import * as boardApi from '../api/boards.js'

const ACTION_COLOR = {
  'board.created': 'bg-green-100 text-green-700',
  'board.updated': 'bg-blue-100 text-blue-700',
  'board.deleted': 'bg-red-100 text-red-700',
  'task.created':  'bg-green-100 text-green-700',
  'task.updated':  'bg-blue-100 text-blue-700',
  'task.deleted':  'bg-red-100 text-red-700',
  'task.moved':    'bg-purple-100 text-purple-700',
  'task.assigned': 'bg-yellow-100 text-yellow-700',
  'column.created':'bg-green-100 text-green-700',
  'column.deleted':'bg-red-100 text-red-700',
}

export default function ActivityPage() {
  const { activeOrg }    = useOrganization()
  const { activeTenant } = useTenant()
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!activeOrg || !activeTenant) return
    setLoading(true)
    boardApi.getActivity(activeOrg._id, activeTenant._id, { limit: 100 })
      .then(r => setLogs(r.data.data.logs))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [activeOrg, activeTenant])

  return (
    <AppLayout>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Activity</h1>
          <p className="text-gray-500 mt-1">{activeTenant?.name} · Recent events</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No activity yet</p>
            <p className="text-gray-400 text-sm mt-1">Actions on boards and tasks will appear here</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">
            {logs.map(log => (
              <div key={log._id} className="px-5 py-4 flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary-700 font-bold text-sm">
                    {log.userId?.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">{log.userId?.name || 'Unknown'}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_COLOR[log.action] || 'bg-gray-100 text-gray-600'}`}>
                      {log.action.replace('.', ' ')}
                    </span>
                  </div>
                  {log.details?.title && (
                    <p className="text-sm text-gray-500 mt-0.5 truncate">"{log.details.title}"</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{new Date(log.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
