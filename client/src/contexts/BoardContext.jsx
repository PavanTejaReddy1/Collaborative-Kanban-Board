import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { useOrganization } from './OrganizationContext.jsx'
import { useTenant }       from './TenantContext.jsx'
import { useSocket }       from './SocketContext.jsx'
import * as boardApi       from '../api/boards.js'

const BoardContext = createContext(null)

const MAX_HISTORY = 30

export function BoardProvider({ children }) {
  const { activeOrg }    = useOrganization()
  const { activeTenant } = useTenant()
  const { on }           = useSocket()

  const [boards,        setBoards]        = useState([])
  const [activeBoard,   setActiveBoard]   = useState(null) // { board, columns: [{...col, tasks:[]}] }
  const [isLoading,     setIsLoading]     = useState(false)
  const [boardError,    setBoardError]    = useState(null)

  // Undo/redo stacks – each entry: { type, payload, inverse }
  const undoStack = useRef([])
  const redoStack = useRef([])
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const syncUndoRedo = () => {
    setCanUndo(undoStack.current.length > 0)
    setCanRedo(redoStack.current.length > 0)
  }

  const pushUndo = (entry) => {
    undoStack.current.push(entry)
    if (undoStack.current.length > MAX_HISTORY) undoStack.current.shift()
    redoStack.current = []
    syncUndoRedo()
  }

  // ── loadBoards ──────────────────────────────────────────────────────────
  const loadBoards = useCallback(async () => {
    if (!activeOrg || !activeTenant) return
    setIsLoading(true); setBoardError(null)
    try {
      const res = await boardApi.getBoards(activeOrg._id, activeTenant._id)
      setBoards(res.data.data.boards)
    } catch (e) {
      setBoardError(e.response?.data?.message || 'Failed to load boards')
    } finally { setIsLoading(false) }
  }, [activeOrg, activeTenant])

  // ── openBoard ───────────────────────────────────────────────────────────
  const openBoard = useCallback(async (boardId) => {
    if (!activeOrg || !activeTenant) return
    setIsLoading(true); setBoardError(null)
    try {
      const res = await boardApi.getBoard(activeOrg._id, activeTenant._id, boardId)
      setActiveBoard(res.data.data)
      undoStack.current = []; redoStack.current = []
      syncUndoRedo()
    } catch (e) {
      setBoardError(e.response?.data?.message || 'Failed to load board')
    } finally { setIsLoading(false) }
  }, [activeOrg, activeTenant])

  // ── createBoard ─────────────────────────────────────────────────────────
  const createBoard = useCallback(async (data) => {
    const res = await boardApi.createBoard(activeOrg._id, activeTenant._id, data)
    const board = res.data.data.board
    setBoards(prev => [board, ...prev])
    return board
  }, [activeOrg, activeTenant])

  // ── deleteBoard ─────────────────────────────────────────────────────────
  const deleteBoard = useCallback(async (boardId) => {
    await boardApi.deleteBoard(activeOrg._id, activeTenant._id, boardId)
    setBoards(prev => prev.filter(b => b._id !== boardId))
    if (activeBoard?.board?._id === boardId) setActiveBoard(null)
  }, [activeOrg, activeTenant, activeBoard])

  // ── addColumn ───────────────────────────────────────────────────────────
  const addColumn = useCallback(async (boardId, data) => {
    const res = await boardApi.createColumn(activeOrg._id, activeTenant._id, boardId, data)
    const col = { ...res.data.data.column, tasks: [] }
    setActiveBoard(prev => prev ? { ...prev, columns: [...prev.columns, col] } : prev)
    return col
  }, [activeOrg, activeTenant])

  // ── updateColumn ────────────────────────────────────────────────────────
  const updateColumn = useCallback(async (boardId, colId, data) => {
    const res = await boardApi.updateColumn(activeOrg._id, activeTenant._id, boardId, colId, data)
    const updated = res.data.data.column
    setActiveBoard(prev => {
      if (!prev) return prev
      return { ...prev, columns: prev.columns.map(c => c._id === colId ? { ...updated, tasks: c.tasks } : c) }
    })
  }, [activeOrg, activeTenant])

  // ── deleteColumn ────────────────────────────────────────────────────────
  const deleteColumn = useCallback(async (boardId, colId) => {
    await boardApi.deleteColumn(activeOrg._id, activeTenant._id, boardId, colId)
    setActiveBoard(prev => {
      if (!prev) return prev
      return { ...prev, columns: prev.columns.filter(c => c._id !== colId) }
    })
  }, [activeOrg, activeTenant])

  // ── addTask ─────────────────────────────────────────────────────────────
  const addTask = useCallback(async (boardId, colId, data) => {
    const res = await boardApi.createTask(activeOrg._id, activeTenant._id, boardId, colId, data)
    const task = res.data.data.task
    setActiveBoard(prev => {
      if (!prev) return prev
      return { ...prev, columns: prev.columns.map(c =>
        c._id === colId ? { ...c, tasks: [...c.tasks, task] } : c
      )}
    })
    return task
  }, [activeOrg, activeTenant])

  // ── updateTask ──────────────────────────────────────────────────────────
  const updateTask = useCallback(async (boardId, taskId, data) => {
    const res = await boardApi.updateTask(activeOrg._id, activeTenant._id, boardId, taskId, data)
    const task = res.data.data.task
    setActiveBoard(prev => {
      if (!prev) return prev
      return { ...prev, columns: prev.columns.map(c => ({
        ...c, tasks: c.tasks.map(t => t._id === taskId ? task : t)
      }))}
    })
    return task
  }, [activeOrg, activeTenant])

  // ── deleteTask ──────────────────────────────────────────────────────────
  const deleteTask = useCallback(async (boardId, taskId, colId) => {
    await boardApi.deleteTask(activeOrg._id, activeTenant._id, boardId, taskId)
    setActiveBoard(prev => {
      if (!prev) return prev
      return { ...prev, columns: prev.columns.map(c =>
        c._id === colId ? { ...c, tasks: c.tasks.filter(t => t._id !== taskId) } : c
      )}
    })
  }, [activeOrg, activeTenant])

  // ── moveTask (optimistic) ───────────────────────────────────────────────
  const moveTask = useCallback(async (boardId, taskId, srcColId, dstColId, newPos, task) => {
    // Optimistic update
    const prevBoard = activeBoard
    setActiveBoard(prev => {
      if (!prev) return prev
      let movedTask = null
      const cols = prev.columns.map(c => {
        if (c._id === srcColId) {
          movedTask = c.tasks.find(t => t._id === taskId)
          return { ...c, tasks: c.tasks.filter(t => t._id !== taskId) }
        }
        return c
      }).map(c => {
        if (c._id === dstColId && movedTask) {
          const updated = { ...movedTask, columnId: dstColId, position: newPos }
          const arr = [...c.tasks]
          arr.splice(newPos, 0, updated)
          return { ...c, tasks: arr }
        }
        return c
      })
      return { ...prev, columns: cols }
    })

    try {
      const res = await boardApi.moveTask(activeOrg._id, activeTenant._id, boardId, taskId, {
        columnId: dstColId,
        position: newPos,
        version:  task.version,
      })
      const moved = res.data.data.task
      // Push to undo stack
      pushUndo({
        type: 'MOVE_TASK',
        forward: { taskId, boardId, srcColId: dstColId, dstColId: srcColId, pos: task.position, version: moved.version },
        backward: { taskId, boardId, srcColId: dstColId, dstColId: srcColId, pos: task.position, version: moved.version },
        label: `Move task "${task.title}"`,
      })
      // Sync version in state
      setActiveBoard(prev => {
        if (!prev) return prev
        return { ...prev, columns: prev.columns.map(c => ({
          ...c, tasks: c.tasks.map(t => t._id === taskId ? { ...t, version: moved.version } : t)
        }))}
      })
    } catch (err) {
      // Revert on failure
      setActiveBoard(prevBoard)
      if (err.response?.status === 409) {
        const current = err.response.data.currentTask
        setActiveBoard(prev => {
          if (!prev) return prev
          return { ...prev, columns: prev.columns.map(c => ({
            ...c, tasks: c.tasks.map(t => t._id === taskId ? { ...t, ...current } : t)
          }))}
        })
      }
      throw err
    }
  }, [activeOrg, activeTenant, activeBoard])

  // ── undo ────────────────────────────────────────────────────────────────
  const undo = useCallback(async () => {
    const entry = undoStack.current.pop()
    if (!entry) return
    redoStack.current.push(entry)
    syncUndoRedo()
    // Re-execute the backward move
    if (entry.type === 'MOVE_TASK') {
      const { taskId, boardId, dstColId, pos, version } = entry.backward
      try {
        await boardApi.moveTask(activeOrg._id, activeTenant._id, boardId, taskId, {
          columnId: dstColId, position: pos, version,
        })
        await openBoard(boardId)
      } catch (_) { /* best effort */ }
    }
  }, [activeOrg, activeTenant, openBoard])

  // ── redo ────────────────────────────────────────────────────────────────
  const redo = useCallback(async () => {
    const entry = redoStack.current.pop()
    if (!entry) return
    undoStack.current.push(entry)
    syncUndoRedo()
    if (entry.type === 'MOVE_TASK') {
      const { taskId, boardId, srcColId, pos, version } = entry.forward
      try {
        await boardApi.moveTask(activeOrg._id, activeTenant._id, boardId, taskId, {
          columnId: srcColId, position: pos, version,
        })
        await openBoard(boardId)
      } catch (_) { /* best effort */ }
    }
  }, [activeOrg, activeTenant, openBoard])

  // ── Real-time socket event handlers ────────────────────────────────────
  // These update local state when other users make changes
  const applySocketEvent = useCallback((event, payload) => {
    setActiveBoard(prev => {
      if (!prev || prev.board._id !== payload.boardId?.toString()) return prev
      switch (event) {
        case 'task:created':
          return { ...prev, columns: prev.columns.map(c =>
            c._id === payload.task.columnId ? { ...c, tasks: [...c.tasks, payload.task] } : c
          )}
        case 'task:updated':
        case 'task:moved':
          return { ...prev, columns: prev.columns.map(c => ({
            ...c, tasks: c.tasks.map(t => t._id === payload.task._id ? payload.task : t)
          }))}
        case 'task:deleted':
          return { ...prev, columns: prev.columns.map(c => ({
            ...c, tasks: c.tasks.filter(t => t._id !== payload.taskId)
          }))}
        case 'column:created':
          if (prev.columns.some(c => c._id === payload.column._id)) return prev
          return { ...prev, columns: [...prev.columns, { ...payload.column, tasks: [] }] }
        case 'column:updated':
          return { ...prev, columns: prev.columns.map(c =>
            c._id === payload.column._id ? { ...payload.column, tasks: c.tasks } : c
          )}
        case 'column:deleted':
          return { ...prev, columns: prev.columns.filter(c => c._id !== payload.columnId) }
        default: return prev
      }
    })
  }, [])

  const value = {
    boards, activeBoard, isLoading, boardError,
    canUndo, canRedo,
    loadBoards, openBoard, createBoard, deleteBoard,
    addColumn, updateColumn, deleteColumn,
    addTask, updateTask, deleteTask, moveTask,
    undo, redo, applySocketEvent,
    setActiveBoard,
  }

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>
}

export function useBoard() {
  const ctx = useContext(BoardContext)
  if (!ctx) throw new Error('useBoard must be used within BoardProvider')
  return ctx
}
