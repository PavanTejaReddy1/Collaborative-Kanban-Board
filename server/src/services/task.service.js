import mongoose from 'mongoose'
import Task     from '../models/Task.js'
import Column   from '../models/Column.js'
import { log }  from './activity.service.js'

// ── createTask ────────────────────────────────────────────────────────────
export async function createTask({ title, description, priority, assignedTo, dueDate, labels, columnId, boardId, tenantId, organizationId, userId }) {
  // Verify column is in this tenant/board
  const col = await Column.findOne({ _id: columnId, boardId, tenantId, organizationId })
  if (!col) {
    const err = new Error('Column not found.')
    err.status = 404
    throw err
  }

  // Assign position at end of column
  const lastTask = await Task.findOne({ columnId }).sort({ position: -1 }).lean()
  const position = lastTask ? lastTask.position + 1000 : 0

  const task = await Task.create({
    title, description, priority, dueDate, labels, position, version: 1,
    assignedTo: assignedTo || null,
    columnId, boardId, tenantId, organizationId,
    createdBy: userId,
  })

  const populated = await Task.findById(task._id)
    .populate('assignedTo', 'name email')
    .populate('createdBy',  'name email')
    .lean()

  await log({
    organizationId, tenantId, userId,
    action: 'task.created', entityType: 'task', entityId: task._id,
    details: { title, columnId, boardId },
  })

  return populated
}

// ── getTasks ──────────────────────────────────────────────────────────────
export async function getTasks(boardId, tenantId, organizationId) {
  return Task.find({ boardId, tenantId, organizationId })
    .sort({ position: 1 })
    .populate('assignedTo', 'name email')
    .populate('createdBy',  'name email')
    .lean()
}

// ── getTaskById ───────────────────────────────────────────────────────────
export async function getTaskById(taskId, tenantId, organizationId) {
  const task = await Task.findOne({ _id: taskId, tenantId, organizationId })
    .populate('assignedTo', 'name email')
    .populate('createdBy',  'name email')
    .lean()

  if (!task) {
    const err = new Error('Task not found.')
    err.status = 404
    throw err
  }
  return task
}

// ── updateTask ────────────────────────────────────────────────────────────
/**
 * Optimistic concurrency control via the version field.
 *
 * The client sends the version it last saw. The server performs an
 * atomic conditional update:  { _id, tenantId, organizationId, version: clientVersion }
 * If the document has already been updated (version mismatch), the
 * findOneAndUpdate returns null and we throw a 409.
 */
export async function updateTask(taskId, tenantId, organizationId, updates, clientVersion, userId) {
  const { version: _ignored, ...fields } = updates // strip version from $set payload

  const task = await Task.findOneAndUpdate(
    { _id: taskId, tenantId, organizationId, version: clientVersion },
    { $set: fields, $inc: { version: 1 } },
    { new: true, runValidators: true },
  ).populate('assignedTo', 'name email').populate('createdBy', 'name email')

  if (!task) {
    // Check whether the task exists at all (vs. just version conflict)
    const exists = await Task.exists({ _id: taskId, tenantId, organizationId })
    if (!exists) {
      const err = new Error('Task not found.')
      err.status = 404
      throw err
    }
    // Task exists but version doesn't match → conflict
    const current = await Task.findOne({ _id: taskId }).lean()
    const err = new Error('Task was modified by another user. Please refresh and try again.')
    err.status = 409
    err.currentTask = current
    throw err
  }

  await log({
    organizationId, tenantId, userId,
    action: 'task.updated', entityType: 'task', entityId: task._id,
    details: fields,
  })

  return task
}

// ── moveTask ──────────────────────────────────────────────────────────────
/**
 * Moves a task to a different column and/or position.
 * Also uses version-based concurrency control.
 */
export async function moveTask(taskId, tenantId, organizationId, { columnId, position, version: clientVersion }, userId) {
  // Verify target column belongs to the same tenant
  const targetCol = await Column.findOne({ _id: columnId, tenantId, organizationId })
  if (!targetCol) {
    const err = new Error('Target column not found.')
    err.status = 404
    throw err
  }

  const prevTask = await Task.findOne({ _id: taskId, tenantId, organizationId }).lean()
  if (!prevTask) {
    const err = new Error('Task not found.')
    err.status = 404
    throw err
  }

  const task = await Task.findOneAndUpdate(
    { _id: taskId, tenantId, organizationId, version: clientVersion },
    { $set: { columnId, position }, $inc: { version: 1 } },
    { new: true, runValidators: true },
  ).populate('assignedTo', 'name email').populate('createdBy', 'name email')

  if (!task) {
    const current = await Task.findOne({ _id: taskId }).lean()
    const err = new Error('Concurrent update conflict. Please refresh and try again.')
    err.status = 409
    err.currentTask = current
    throw err
  }

  await log({
    organizationId, tenantId, userId,
    action: 'task.moved', entityType: 'task', entityId: task._id,
    details: {
      from: { columnId: prevTask.columnId, position: prevTask.position },
      to:   { columnId, position },
    },
  })

  return task
}

// ── reorderTasks ──────────────────────────────────────────────────────────
export async function reorderTasks(tenantId, organizationId, tasks, userId) {
  const ops = tasks.map(({ taskId, position }) => ({
    updateOne: {
      filter: { _id: new mongoose.Types.ObjectId(taskId), tenantId, organizationId },
      update: { $set: { position }, $inc: { version: 1 } },
    },
  }))
  await Task.bulkWrite(ops)
  return tasks
}

// ── deleteTask ────────────────────────────────────────────────────────────
export async function deleteTask(taskId, tenantId, organizationId, userId) {
  const task = await Task.findOneAndDelete({ _id: taskId, tenantId, organizationId })
  if (!task) {
    const err = new Error('Task not found.')
    err.status = 404
    throw err
  }

  await log({
    organizationId, tenantId, userId,
    action: 'task.deleted', entityType: 'task', entityId: task._id,
    details: { title: task.title, columnId: task.columnId },
  })

  return task
}

// ── assignTask ────────────────────────────────────────────────────────────
export async function assignTask(taskId, tenantId, organizationId, assignedTo, clientVersion, userId) {
  const task = await Task.findOneAndUpdate(
    { _id: taskId, tenantId, organizationId, version: clientVersion },
    { $set: { assignedTo: assignedTo || null }, $inc: { version: 1 } },
    { new: true },
  ).populate('assignedTo', 'name email').populate('createdBy', 'name email')

  if (!task) {
    const exists = await Task.exists({ _id: taskId, tenantId, organizationId })
    if (!exists) { const err = new Error('Task not found.'); err.status = 404; throw err }
    const current = await Task.findOne({ _id: taskId }).lean()
    const err = new Error('Concurrent update conflict.')
    err.status = 409; err.currentTask = current; throw err
  }

  await log({
    organizationId, tenantId, userId,
    action: 'task.assigned', entityType: 'task', entityId: task._id,
    details: { assignedTo },
  })

  return task
}
