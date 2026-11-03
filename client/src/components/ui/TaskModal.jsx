import { useState, useEffect } from 'react'
import { X, Calendar, User, Flag, Tag, Trash2 } from 'lucide-react'
import { Button } from './Button.jsx'
import { useBoard } from '../../contexts/BoardContext.jsx'
import { useOrganization } from '../../contexts/OrganizationContext.jsx'
import { useTenant } from '../../contexts/TenantContext.jsx'
import * as boardApi from '../../api/boards.js'

const PRIORITY_STYLES = {
  LOW:    { cls: 'bg-gray-100 text-gray-600',   dot: 'bg-gray-400'   },
  MEDIUM: { cls: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500'   },
  HIGH:   { cls: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  URGENT: { cls: 'bg-red-100 text-red-700',     dot: 'bg-red-500'    },
}

export function TaskModal({ task, boardId, colId, onClose }) {
  const { updateTask, deleteTask } = useBoard()
  const { activeOrg }    = useOrganization()
  const { activeTenant } = useTenant()

  const [editing,  setEditing]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [activity, setActivity] = useState([])
  const [form, setForm] = useState({
    title:       task.title,
    description: task.description || '',
    priority:    task.priority,
    dueDate:     task.dueDate ? task.dueDate.slice(0, 10) : '',
  })

  useEffect(() => {
    if (!activeOrg || !activeTenant) return
    boardApi.getActivity(activeOrg._id, activeTenant._id, { entityId: task._id, limit: 10 })
      .then(r => setActivity(r.data.data.logs))
      .catch(() => {})
  }, [task._id, activeOrg, activeTenant])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateTask(boardId, task._id, {
        ...form,
        dueDate: form.dueDate || null,
        version: task.version,
      })
      setEditing(false)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update task')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return
    setDeleting(true)
    try {
      await deleteTask(boardId, task._id, colId)
      onClose()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete task')
      setDeleting(false)
    }
  }

  const ps = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.MEDIUM

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          {editing ? (
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="text-lg font-bold text-gray-900 flex-1 border-b-2 border-primary-500 outline-none bg-transparent mr-4"
              autoFocus
            />
          ) : (
            <h2 className="text-lg font-bold text-gray-900 flex-1 mr-4">{task.title}</h2>
          )}
          <div className="flex gap-2 flex-shrink-0">
            {!editing && (
              <button onClick={() => setEditing(true)} className="text-xs text-primary-600 hover:underline px-2 py-1 rounded-lg hover:bg-primary-50">Edit</button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Metadata pills */}
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${ps.cls}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${ps.dot}`} />
              {task.priority}
            </span>
            {task.dueDate && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                <Calendar className="w-3 h-3" />
                {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
            {task.assignedTo && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                <User className="w-3 h-3" />
                {task.assignedTo.name}
              </span>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Description</label>
            {editing ? (
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={4}
                className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Add a description…"
              />
            ) : (
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {task.description || <span className="text-gray-400 italic">No description</span>}
              </p>
            )}
          </div>

          {/* Priority (edit mode) */}
          {editing && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Priority</label>
              <div className="flex gap-2">
                {['LOW','MEDIUM','HIGH','URGENT'].map(p => (
                  <button
                    key={p}
                    onClick={() => setForm(f => ({ ...f, priority: p }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${form.priority === p ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Due date (edit mode) */}
          {editing && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Due Date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}

          {/* Meta info */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-xs text-gray-500">
            <div className="flex justify-between"><span>Created by</span><span className="font-medium text-gray-700">{task.createdBy?.name}</span></div>
            <div className="flex justify-between"><span>Created</span><span>{new Date(task.createdAt).toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Updated</span><span>{new Date(task.updatedAt).toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Version</span><span className="font-mono">v{task.version}</span></div>
          </div>

          {/* Activity */}
          {activity.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 block">Activity</label>
              <div className="space-y-2">
                {activity.map(log => (
                  <div key={log._id} className="flex items-start gap-2 text-xs">
                    <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary-700 font-bold text-xs">{log.userId?.name?.charAt(0)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">{log.userId?.name}</span>{' '}
                      <span className="text-gray-500">{log.action.replace('.', ' ')}</span>
                      <p className="text-gray-400 mt-0.5">{new Date(log.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {deleting ? 'Deleting…' : 'Delete task'}
          </button>
          {editing && (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
              <Button size="sm" isLoading={saving} onClick={handleSave}>Save</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
