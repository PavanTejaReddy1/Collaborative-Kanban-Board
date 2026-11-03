import * as columnService from '../services/column.service.js'
import {
  validate,
  createColumnSchema,
  updateColumnSchema,
  reorderColumnsSchema,
} from '../utils/validation.js'

export async function createColumn(req, res, next) {
  try {
    const { value, error } = validate(createColumnSchema, req.body)
    if (error) return res.status(400).json({ success: false, message: error })

    const column = await columnService.createColumn({
      ...value,
      boardId:        req.params.boardId,
      organizationId: req.organizationId,
      tenantId:       req.tenantId,
      userId:         req.user._id,
    })

    // Emit real-time event
    const io = req.app.get('io')
    io?.to(`tenant:${req.tenantId}`).emit('column:created', { column, boardId: req.params.boardId })

    return res.status(201).json({ success: true, data: { column } })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message })
    next(err)
  }
}

export async function updateColumn(req, res, next) {
  try {
    const { value, error } = validate(updateColumnSchema, req.body)
    if (error) return res.status(400).json({ success: false, message: error })

    const column = await columnService.updateColumn(
      req.params.columnId, req.tenantId, req.organizationId, value, req.user._id,
    )

    const io = req.app.get('io')
    io?.to(`tenant:${req.tenantId}`).emit('column:updated', { column, boardId: column.boardId })

    return res.status(200).json({ success: true, data: { column } })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message })
    next(err)
  }
}

export async function deleteColumn(req, res, next) {
  try {
    const column = await columnService.deleteColumn(
      req.params.columnId, req.tenantId, req.organizationId, req.user._id,
    )

    const io = req.app.get('io')
    io?.to(`tenant:${req.tenantId}`).emit('column:deleted', {
      columnId: column._id, boardId: column.boardId,
    })

    return res.status(200).json({ success: true, message: 'Column deleted.' })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message })
    next(err)
  }
}

export async function reorderColumns(req, res, next) {
  try {
    const { value, error } = validate(reorderColumnsSchema, req.body)
    if (error) return res.status(400).json({ success: false, message: error })

    const columns = await columnService.reorderColumns(
      req.params.boardId, req.tenantId, req.organizationId, value.columns, req.user._id,
    )

    const io = req.app.get('io')
    io?.to(`tenant:${req.tenantId}`).emit('column:reordered', {
      columns, boardId: req.params.boardId,
    })

    return res.status(200).json({ success: true, data: { columns } })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message })
    next(err)
  }
}
