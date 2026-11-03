import * as taskService from '../services/task.service.js'
import {
  validate,
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
  reorderTasksSchema,
} from '../utils/validation.js'

// helper – emit to tenant room
function emit(req, event, payload) {
  const io = req.app.get('io')
  io?.to(`tenant:${req.tenantId}`).emit(event, payload)
}

export async function createTask(req, res, next) {
  try {
    const { value, error } = validate(createTaskSchema, req.body)
    if (error) return res.status(400).json({ success: false, message: error })

    const task = await taskService.createTask({
      ...value,
      columnId:       req.params.columnId,
      boardId:        req.params.boardId,
      organizationId: req.organizationId,
      tenantId:       req.tenantId,
      userId:         req.user._id,
    })

    emit(req, 'task:created', { task, boardId: req.params.boardId })
    return res.status(201).json({ success: true, data: { task } })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message })
    next(err)
  }
}

export async function getTasks(req, res, next) {
  try {
    const tasks = await taskService.getTasks(
      req.params.boardId, req.tenantId, req.organizationId,
    )
    return res.status(200).json({ success: true, data: { tasks } })
  } catch (err) { next(err) }
}

export async function getTask(req, res, next) {
  try {
    const task = await taskService.getTaskById(
      req.params.taskId, req.tenantId, req.organizationId,
    )
    return res.status(200).json({ success: true, data: { task } })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message })
    next(err)
  }
}

export async function updateTask(req, res, next) {
  try {
    const { value, error } = validate(updateTaskSchema, req.body)
    if (error) return res.status(400).json({ success: false, message: error })

    const task = await taskService.updateTask(
      req.params.taskId,
      req.tenantId,
      req.organizationId,
      value,
      value.version,
      req.user._id,
    )

    emit(req, 'task:updated', { task, boardId: task.boardId })
    return res.status(200).json({ success: true, data: { task } })
  } catch (err) {
    if (err.status === 409) {
      return res.status(409).json({
        success: false,
        message: err.message,
        currentTask: err.currentTask,
      })
    }
    if (err.status) return res.status(err.status).json({ success: false, message: err.message })
    next(err)
  }
}

export async function moveTask(req, res, next) {
  try {
    const { value, error } = validate(moveTaskSchema, req.body)
    if (error) return res.status(400).json({ success: false, message: error })

    const task = await taskService.moveTask(
      req.params.taskId, req.tenantId, req.organizationId, value, req.user._id,
    )

    emit(req, 'task:moved', { task, boardId: task.boardId })
    return res.status(200).json({ success: true, data: { task } })
  } catch (err) {
    if (err.status === 409) {
      return res.status(409).json({
        success: false,
        message: err.message,
        currentTask: err.currentTask,
      })
    }
    if (err.status) return res.status(err.status).json({ success: false, message: err.message })
    next(err)
  }
}

export async function reorderTasks(req, res, next) {
  try {
    const { value, error } = validate(reorderTasksSchema, req.body)
    if (error) return res.status(400).json({ success: false, message: error })

    await taskService.reorderTasks(
      req.tenantId, req.organizationId, value.tasks, req.user._id,
    )

    emit(req, 'task:reordered', { tasks: value.tasks, boardId: req.params.boardId })
    return res.status(200).json({ success: true, message: 'Tasks reordered.' })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message })
    next(err)
  }
}

export async function deleteTask(req, res, next) {
  try {
    const task = await taskService.deleteTask(
      req.params.taskId, req.tenantId, req.organizationId, req.user._id,
    )

    emit(req, 'task:deleted', {
      taskId: task._id, columnId: task.columnId, boardId: task.boardId,
    })
    return res.status(200).json({ success: true, message: 'Task deleted.' })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message })
    next(err)
  }
}

export async function assignTask(req, res, next) {
  try {
    const { assignedTo, version } = req.body
    if (version === undefined) {
      return res.status(400).json({ success: false, message: 'version is required' })
    }

    const task = await taskService.assignTask(
      req.params.taskId, req.tenantId, req.organizationId,
      assignedTo || null, version, req.user._id,
    )

    emit(req, 'task:updated', { task, boardId: task.boardId })
    return res.status(200).json({ success: true, data: { task } })
  } catch (err) {
    if (err.status === 409) {
      return res.status(409).json({ success: false, message: err.message, currentTask: err.currentTask })
    }
    if (err.status) return res.status(err.status).json({ success: false, message: err.message })
    next(err)
  }
}
