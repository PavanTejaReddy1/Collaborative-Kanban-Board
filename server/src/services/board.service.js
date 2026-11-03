import Board      from '../models/Board.js'
import Column     from '../models/Column.js'
import Task       from '../models/Task.js'
import { log }    from './activity.service.js'

// ── createBoard ───────────────────────────────────────────────────────────
export async function createBoard({ title, description, organizationId, tenantId, userId }) {
  const board = await Board.create({ title, description, organizationId, tenantId, createdBy: userId })

  await log({
    organizationId, tenantId, userId,
    action: 'board.created', entityType: 'board', entityId: board._id,
    details: { title },
  })

  return board
}

// ── getBoards ─────────────────────────────────────────────────────────────
export async function getBoards(tenantId, organizationId) {
  return Board.find({ tenantId, organizationId, isArchived: false })
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name email')
    .lean()
}

// ── getBoardById ──────────────────────────────────────────────────────────
export async function getBoardById(boardId, tenantId, organizationId) {
  const board = await Board.findOne({ _id: boardId, tenantId, organizationId, isArchived: false })
    .populate('createdBy', 'name email')
    .lean()

  if (!board) {
    const err = new Error('Board not found.')
    err.status = 404
    throw err
  }
  return board
}

// ── updateBoard ───────────────────────────────────────────────────────────
export async function updateBoard(boardId, tenantId, organizationId, updates, userId) {
  const board = await Board.findOneAndUpdate(
    { _id: boardId, tenantId, organizationId },
    { $set: updates },
    { new: true, runValidators: true },
  )
  if (!board) {
    const err = new Error('Board not found.')
    err.status = 404
    throw err
  }

  await log({
    organizationId, tenantId, userId,
    action: 'board.updated', entityType: 'board', entityId: board._id,
    details: updates,
  })

  return board
}

// ── deleteBoard ───────────────────────────────────────────────────────────
export async function deleteBoard(boardId, tenantId, organizationId, userId) {
  const board = await Board.findOneAndUpdate(
    { _id: boardId, tenantId, organizationId },
    { $set: { isArchived: true } },
    { new: true },
  )
  if (!board) {
    const err = new Error('Board not found.')
    err.status = 404
    throw err
  }

  await log({
    organizationId, tenantId, userId,
    action: 'board.deleted', entityType: 'board', entityId: board._id,
    details: { title: board.title },
  })

  return board
}

// ── getBoardWithColumns ───────────────────────────────────────────────────
/**
 * Returns the board with all its columns and tasks in a single response.
 * This is the primary data shape the Kanban UI needs.
 */
export async function getBoardWithColumns(boardId, tenantId, organizationId) {
  const board = await getBoardById(boardId, tenantId, organizationId)

  const columns = await Column.find({ boardId, tenantId, organizationId })
    .sort({ position: 1 })
    .lean()

  const tasks = await Task.find({ boardId, tenantId, organizationId })
    .sort({ position: 1 })
    .populate('assignedTo', 'name email')
    .populate('createdBy',  'name email')
    .lean()

  // Group tasks by columnId for easy consumption by the frontend
  const tasksByColumn = {}
  for (const col of columns) {
    tasksByColumn[col._id.toString()] = []
  }
  for (const task of tasks) {
    const key = task.columnId.toString()
    if (tasksByColumn[key]) {
      tasksByColumn[key].push(task)
    }
  }

  return {
    board,
    columns: columns.map((col) => ({
      ...col,
      tasks: tasksByColumn[col._id.toString()] || [],
    })),
  }
}
