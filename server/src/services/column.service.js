import mongoose from 'mongoose'
import Column    from '../models/Column.js'
import Task      from '../models/Task.js'
import Board     from '../models/Board.js'
import { log }   from './activity.service.js'

// ── createColumn ──────────────────────────────────────────────────────────
export async function createColumn({ title, color, boardId, tenantId, organizationId, userId }) {
  // Verify board belongs to this tenant
  const board = await Board.findOne({ _id: boardId, tenantId, organizationId, isArchived: false })
  if (!board) {
    const err = new Error('Board not found.')
    err.status = 404
    throw err
  }

  // Assign position at end
  const lastCol = await Column.findOne({ boardId }).sort({ position: -1 }).lean()
  const position = lastCol ? lastCol.position + 1000 : 0

  const column = await Column.create({ title, color, boardId, tenantId, organizationId, position })

  await log({
    organizationId, tenantId, userId,
    action: 'column.created', entityType: 'column', entityId: column._id,
    details: { title, boardId },
  })

  return column
}

// ── updateColumn ──────────────────────────────────────────────────────────
export async function updateColumn(columnId, tenantId, organizationId, updates, userId) {
  const column = await Column.findOneAndUpdate(
    { _id: columnId, tenantId, organizationId },
    { $set: updates },
    { new: true, runValidators: true },
  )
  if (!column) {
    const err = new Error('Column not found.')
    err.status = 404
    throw err
  }

  await log({
    organizationId, tenantId, userId,
    action: 'column.updated', entityType: 'column', entityId: column._id,
    details: updates,
  })

  return column
}

// ── deleteColumn ──────────────────────────────────────────────────────────
export async function deleteColumn(columnId, tenantId, organizationId, userId) {
  const column = await Column.findOneAndDelete({ _id: columnId, tenantId, organizationId })
  if (!column) {
    const err = new Error('Column not found.')
    err.status = 404
    throw err
  }

  // Also delete all tasks in this column
  await Task.deleteMany({ columnId, tenantId, organizationId })

  await log({
    organizationId, tenantId, userId,
    action: 'column.deleted', entityType: 'column', entityId: column._id,
    details: { title: column.title },
  })

  return column
}

// ── reorderColumns ────────────────────────────────────────────────────────
export async function reorderColumns(boardId, tenantId, organizationId, columns, userId) {
  const ops = columns.map(({ columnId, position }) => ({
    updateOne: {
      filter: { _id: new mongoose.Types.ObjectId(columnId), boardId, tenantId, organizationId },
      update: { $set: { position } },
    },
  }))

  await Column.bulkWrite(ops)

  await log({
    organizationId, tenantId, userId,
    action: 'column.reordered', entityType: 'column', entityId: new mongoose.Types.ObjectId(boardId),
    details: { columns },
  })

  return Column.find({ boardId, tenantId, organizationId }).sort({ position: 1 }).lean()
}
