import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  closestCorners, MouseSensor, TouchSensor,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, horizontalListSortingStrategy,
  verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Plus, ArrowLeft, MoreHorizontal, GripVertical,
  Calendar, User, Flag, Search, Undo2, Redo2, Wifi, WifiOff,
} from 'lucide-react'
import AppLayout    from '../../components/layout/AppLayout.jsx'
import { Button }   from '../../components/ui/Button.jsx'
import { TaskModal } from '../../components/ui/TaskModal.jsx'
import { useBoard } from '../../contexts/BoardContext.jsx'
import { useOrganization } from '../../contexts/OrganizationContext.jsx'
import { useTenant }       from '../../contexts/TenantContext.jsx'
import { useSocket }       from '../../contexts/SocketContext.jsx'
import * as boardApi from '../../api/boards.js'

// ─── Priority colours ────────────────────────────────────────────────────────
const P = {
  LOW:    { dot: 'bg-gray-400',    badge: 'bg-gray-100 text-gray-600' },
  MEDIUM: { dot: 'bg-blue-500',    badge: 'bg-blue-100 text-blue-700' },
  HIGH:   { dot: 'bg-orange-500',  badge: 'bg-orange-100 text-orange-700' },
  URGENT: { dot: 'bg-red-500',     badge: 'bg-red-100 text-red-700' },
}

// ─── Sortable Task Card ──────────────────────────────────────────────────────
function TaskCard({ task, colId, boardId, onOpen, isDragging }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSelf } =
    useSortable({ id: task._id, data: { type: 'task', task, colId } })

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isSelf ? 0.4 : 1 }
  const ps = P[task.priority] || P.MEDIUM
  const overdue = task.dueDate && new Date(task.dueDate) < new Date()

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm hover:shadow-md hover:border-primary-200 transition-all cursor-pointer group select-none"
      onClick={() => onOpen(task, colId)}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-gray-900 leading-snug flex-1">{task.title}</p>
        <button
          {...attributes}
          {...listeners}
          className="p-0.5 rounded text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
          onClick={e => e.stopPropagation()}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
      </div>

      {task.description && (
        <p className="text-xs text-gray-400 line-clamp-2 mb-2">{task.description}</p>
      )}

      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${ps.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${ps.dot}`} />
          {task.priority}
        </span>

        {task.dueDate && (
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${overdue ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
            <Calendar className="w-3 h-3" />
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}

        {task.labels?.map(l => (
          <span key={l} className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">{l}</span>
        ))}
      </div>

      {task.assignedTo && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
          <div className="w-4 h-4 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 font-bold text-xs">
            {task.assignedTo.name?.charAt(0)?.toUpperCase()}
          </div>
          {task.assignedTo.name}
        </div>
      )}
    </div>
  )
}

// ─── Sortable Column ─────────────────────────────────────────────────────────
function KanbanColumn({ col, boardId, onOpenTask, onAddTask, onDeleteColumn, onUpdateColumn }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: col._id, data: { type: 'column', col } })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  const [addingTask, setAddingTask] = useState(false)
  const [taskTitle,  setTaskTitle]  = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const [colTitle, setColTitle] = useState(col.title)
  const [showMenu, setShowMenu] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { if (addingTask) inputRef.current?.focus() }, [addingTask])

  const handleAddTask = async (e) => {
    e.preventDefault()
    if (!taskTitle.trim()) return setAddingTask(false)
    try {
      await onAddTask(boardId, col._id, { title: taskTitle.trim() })
      setTaskTitle(''); setAddingTask(false)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add task')
    }
  }

  const handleRenameColumn = async () => {
    if (!colTitle.trim() || colTitle === col.title) { setEditingTitle(false); return }
    try {
      await onUpdateColumn(boardId, col._id, { title: colTitle })
      setEditingTitle(false)
    } catch (err) {
      setColTitle(col.title); setEditingTitle(false)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex-shrink-0 w-72 bg-gray-100 rounded-2xl flex flex-col max-h-full"
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
            <GripVertical className="w-3.5 h-3.5" />
          </button>
          {editingTitle ? (
            <input
              value={colTitle}
              onChange={e => setColTitle(e.target.value)}
              onBlur={handleRenameColumn}
              onKeyDown={e => { if (e.key === 'Enter') handleRenameColumn(); if (e.key === 'Escape') { setColTitle(col.title); setEditingTitle(false) } }}
              className="flex-1 text-sm font-semibold text-gray-900 bg-white border border-primary-400 rounded px-2 py-0.5 outline-none"
              autoFocus
            />
          ) : (
            <h3
              className="text-sm font-semibold text-gray-800 truncate cursor-pointer hover:text-primary-600"
              onDoubleClick={() => setEditingTitle(true)}
              title="Double-click to rename"
            >
              {col.title}
            </h3>
          )}
          <span className="text-xs text-gray-400 font-medium bg-gray-200 px-1.5 py-0.5 rounded-full flex-shrink-0">
            {col.tasks.length}
          </span>
        </div>
        <div className="relative">
          <button onClick={() => setShowMenu(m => !m)} className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-200">
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-6 bg-white rounded-xl border border-gray-200 shadow-xl z-10 w-40 py-1">
              <button onClick={() => { setEditingTitle(true); setShowMenu(false) }} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Rename</button>
              <button onClick={() => { onDeleteColumn(boardId, col._id); setShowMenu(false) }} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50">Delete column</button>
            </div>
          )}
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto px-3 pb-2 space-y-2 scrollbar-thin">
        <SortableContext items={col.tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
          {col.tasks.map(task => (
            <TaskCard key={task._id} task={task} colId={col._id} boardId={boardId} onOpen={onOpenTask} />
          ))}
        </SortableContext>
      </div>

      {/* Add task */}
      <div className="px-3 pb-3">
        {addingTask ? (
          <form onSubmit={handleAddTask}>
            <textarea
              ref={inputRef}
              value={taskTitle}
              onChange={e => setTaskTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddTask(e) } if (e.key === 'Escape') setAddingTask(false) }}
              placeholder="Task title…"
              rows={2}
              className="w-full text-sm border border-gray-300 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            />
            <div className="flex gap-2 mt-2">
              <button type="submit" className="flex-1 text-xs bg-primary-600 text-white py-1.5 rounded-lg hover:bg-primary-700">Add</button>
              <button type="button" onClick={() => setAddingTask(false)} className="flex-1 text-xs bg-white border border-gray-200 py-1.5 rounded-lg text-gray-500 hover:bg-gray-50">Cancel</button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setAddingTask(true)}
            className="w-full flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-xl px-3 py-2 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add task
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main Board Page ─────────────────────────────────────────────────────────
export default function KanbanBoardPage() {
  const { boardId }      = useParams()
  const navigate         = useNavigate()
  const { activeOrg }    = useOrganization()
  const { activeTenant } = useTenant()
  const {
    activeBoard, openBoard, isLoading, boardError,
    addColumn, updateColumn, deleteColumn,
    addTask, moveTask, canUndo, canRedo, undo, redo,
    applySocketEvent, setActiveBoard,
  } = useBoard()
  const { joinTenantRoom, leaveTenantRoom, on, isConnected } = useSocket()

  const [activeItem,   setActiveItem]   = useState(null)   // drag overlay
  const [selectedTask, setSelectedTask] = useState(null)   // modal
  const [selectedCol,  setSelectedCol]  = useState(null)
  const [searchQuery,  setSearchQuery]  = useState('')
  const [addingCol,    setAddingCol]    = useState(false)
  const [colTitle,     setColTitle]     = useState('')
  const [filterPri,    setFilterPri]    = useState('')

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  )

  // Load board
  useEffect(() => {
    if (activeOrg && activeTenant && boardId) openBoard(boardId)
  }, [activeOrg, activeTenant, boardId]) // eslint-disable-line

  // Join socket room and subscribe to events
  useEffect(() => {
    if (!activeTenant || !activeOrg) return
    joinTenantRoom(activeTenant._id, activeOrg._id)

    const events = ['task:created','task:updated','task:deleted','task:moved','task:reordered','column:created','column:updated','column:deleted','column:reordered']
    const cleanups = events.map(ev => on(ev, payload => applySocketEvent(ev, payload)))

    return () => {
      cleanups.forEach(fn => fn?.())
      leaveTenantRoom(activeTenant._id)
    }
  }, [activeTenant, activeOrg]) // eslint-disable-line

  // ── Drag handlers ──────────────────────────────────────────────────────
  const findContainer = (id) => {
    if (!activeBoard) return null
    for (const col of activeBoard.columns) {
      if (col._id === id) return col
      if (col.tasks.some(t => t._id === id)) return col
    }
    return null
  }

  const handleDragStart = ({ active }) => {
    const col = findContainer(active.id)
    if (!col) return
    if (active.data.current?.type === 'column') {
      setActiveItem({ type: 'column', col })
    } else {
      const task = col.tasks.find(t => t._id === active.id)
      if (task) setActiveItem({ type: 'task', task, colId: col._id })
    }
  }

  const handleDragOver = ({ active, over }) => {
    if (!over || !activeBoard) return
    const activeCol = findContainer(active.id)
    const overCol   = findContainer(over.id)
    if (!activeCol || !overCol) return
    if (active.data.current?.type === 'column') return
    if (activeCol._id === overCol._id) return

    // Moving task between columns (optimistic UI update only — no API call yet)
    setActiveBoard(prev => {
      if (!prev) return prev
      let movedTask = null
      const cols = prev.columns.map(c => {
        if (c._id === activeCol._id) {
          movedTask = c.tasks.find(t => t._id === active.id)
          return { ...c, tasks: c.tasks.filter(t => t._id !== active.id) }
        }
        return c
      }).map(c => {
        if (c._id === overCol._id && movedTask) {
          const overIndex = c.tasks.findIndex(t => t._id === over.id)
          const newTasks = [...c.tasks]
          const idx = overIndex >= 0 ? overIndex : newTasks.length
          newTasks.splice(idx, 0, { ...movedTask, columnId: overCol._id })
          return { ...c, tasks: newTasks }
        }
        return c
      })
      return { ...prev, columns: cols }
    })
  }

  const handleDragEnd = async ({ active, over }) => {
    setActiveItem(null)
    if (!over || !activeBoard) return

    const activeData = active.data.current
    if (!activeData) return

    // Column reorder
    if (activeData.type === 'column') {
      const oldIdx = activeBoard.columns.findIndex(c => c._id === active.id)
      const newIdx = activeBoard.columns.findIndex(c => c._id === over.id)
      if (oldIdx === newIdx) return

      const newCols = arrayMove(activeBoard.columns, oldIdx, newIdx)
      setActiveBoard(prev => prev ? { ...prev, columns: newCols } : prev)

      try {
        await boardApi.reorderColumns(
          activeOrg._id, activeTenant._id, boardId,
          newCols.map((c, i) => ({ columnId: c._id, position: i * 1000 })),
        )
      } catch (_) { openBoard(boardId) }
      return
    }

    // Task move/reorder
    const srcCol = findContainer(active.id)
    const dstCol = findContainer(over.id)
    if (!srcCol || !dstCol) return

    const task = activeBoard.columns.flatMap(c => c.tasks).find(t => t._id === active.id)
    if (!task) return

    if (srcCol._id === dstCol._id) {
      // Reorder within same column
      const oldIdx = srcCol.tasks.findIndex(t => t._id === active.id)
      const newIdx = srcCol.tasks.findIndex(t => t._id === over.id)
      if (oldIdx === newIdx) return

      const newTasks = arrayMove(srcCol.tasks, oldIdx, newIdx)
      setActiveBoard(prev => {
        if (!prev) return prev
        return { ...prev, columns: prev.columns.map(c =>
          c._id === srcCol._id ? { ...c, tasks: newTasks } : c
        )}
      })

      try {
        await boardApi.reorderTasks(
          activeOrg._id, activeTenant._id, boardId,
          newTasks.map((t, i) => ({ taskId: t._id, position: i * 1000 })),
        )
      } catch (_) { openBoard(boardId) }
    } else {
      // Move to different column – confirm with API
      const dstTasks = dstCol.tasks
      const overIndex = dstTasks.findIndex(t => t._id === over.id)
      const newPos = overIndex >= 0 ? overIndex * 1000 : dstTasks.length * 1000

      try {
        await moveTask(boardId, task._id, srcCol._id, dstCol._id, newPos, task)
      } catch (err) {
        if (err.response?.status === 409) {
          alert('Another user updated this task. The board has been refreshed.')
          await openBoard(boardId)
        }
      }
    }
  }

  // ── Add column ─────────────────────────────────────────────────────────
  const handleAddColumn = async (e) => {
    e.preventDefault()
    if (!colTitle.trim()) return setAddingCol(false)
    try {
      await addColumn(boardId, { title: colTitle.trim() })
      setColTitle(''); setAddingCol(false)
    } catch (err) { alert(err.response?.data?.message || 'Failed to add column') }
  }

  // ── Filter tasks ───────────────────────────────────────────────────────
  const filteredColumns = (activeBoard?.columns || []).map(col => ({
    ...col,
    tasks: col.tasks.filter(t => {
      const matchSearch = !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchPri    = !filterPri || t.priority === filterPri
      return matchSearch && matchPri
    }),
  }))

  // ── Render ─────────────────────────────────────────────────────────────
  if (boardError) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-red-500 font-medium mb-4">{boardError}</p>
            <Button variant="secondary" onClick={() => navigate('/boards')}>Back to boards</Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Board toolbar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3 flex-shrink-0">
          <button onClick={() => navigate('/boards')} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-900 text-sm truncate">{activeBoard?.board?.title || '…'}</h1>
            {activeBoard?.board?.description && (
              <p className="text-xs text-gray-400 truncate">{activeBoard.board.description}</p>
            )}
          </div>

          {/* Search */}
          <div className="relative hidden sm:block">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tasks…"
              className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 w-44"
            />
          </div>

          {/* Priority filter */}
          <select
            value={filterPri}
            onChange={e => setFilterPri(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 hidden sm:block"
          >
            <option value="">All priorities</option>
            {['LOW','MEDIUM','HIGH','URGENT'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          {/* Undo/Redo */}
          <button disabled={!canUndo} onClick={undo} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed" title="Undo (Ctrl+Z)">
            <Undo2 className="w-4 h-4" />
          </button>
          <button disabled={!canRedo} onClick={redo} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed" title="Redo (Ctrl+Y)">
            <Redo2 className="w-4 h-4" />
          </button>

          {/* Connection status */}
          <div title={isConnected ? 'Real-time connected' : 'Offline'}>
            {isConnected
              ? <Wifi className="w-4 h-4 text-green-500" />
              : <WifiOff className="w-4 h-4 text-red-400" />
            }
          </div>
        </div>

        {/* Board canvas */}
        {isLoading && !activeBoard ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
              <div className="flex gap-4 p-6 h-full items-start min-w-max">
                <SortableContext
                  items={(activeBoard?.columns || []).map(c => c._id)}
                  strategy={horizontalListSortingStrategy}
                >
                  {filteredColumns.map(col => (
                    <KanbanColumn
                      key={col._id}
                      col={col}
                      boardId={boardId}
                      onOpenTask={(task, colId) => { setSelectedTask(task); setSelectedCol(colId) }}
                      onAddTask={addTask}
                      onDeleteColumn={deleteColumn}
                      onUpdateColumn={updateColumn}
                    />
                  ))}
                </SortableContext>

                {/* Add column button */}
                <div className="flex-shrink-0 w-72">
                  {addingCol ? (
                    <form onSubmit={handleAddColumn} className="bg-gray-100 rounded-2xl p-3">
                      <input
                        value={colTitle}
                        onChange={e => setColTitle(e.target.value)}
                        placeholder="Column title…"
                        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white mb-2"
                        autoFocus
                        onKeyDown={e => { if (e.key === 'Escape') setAddingCol(false) }}
                      />
                      <div className="flex gap-2">
                        <button type="submit" className="flex-1 text-sm bg-primary-600 text-white py-1.5 rounded-lg hover:bg-primary-700">Add column</button>
                        <button type="button" onClick={() => setAddingCol(false)} className="flex-1 text-sm bg-white border border-gray-200 py-1.5 rounded-lg text-gray-500">Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setAddingCol(true)}
                      className="w-full flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 bg-gray-100/70 hover:bg-gray-100 rounded-2xl px-4 py-3 transition-colors border-2 border-dashed border-gray-300 hover:border-gray-400"
                    >
                      <Plus className="w-4 h-4" /> Add column
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Drag overlay */}
            <DragOverlay>
              {activeItem?.type === 'task' && (
                <div className="bg-white rounded-xl border-2 border-primary-300 shadow-2xl p-3 w-72 rotate-1 opacity-95">
                  <p className="text-sm font-medium text-gray-900">{activeItem.task.title}</p>
                </div>
              )}
              {activeItem?.type === 'column' && (
                <div className="bg-gray-100 rounded-2xl shadow-2xl w-72 h-24 opacity-80 border-2 border-primary-300 flex items-center justify-center">
                  <p className="font-semibold text-gray-700">{activeItem.col.title}</p>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Task detail modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          boardId={boardId}
          colId={selectedCol}
          onClose={() => { setSelectedTask(null); setSelectedCol(null) }}
        />
      )}
    </AppLayout>
  )
}
