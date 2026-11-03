import * as boardService from '../services/board.service.js'
import { validate, createBoardSchema, updateBoardSchema } from '../utils/validation.js'

export async function createBoard(req, res, next) {
  try {
    const { value, error } = validate(createBoardSchema, req.body)
    if (error) return res.status(400).json({ success: false, message: error })

    const board = await boardService.createBoard({
      ...value,
      organizationId: req.organizationId,
      tenantId:       req.tenantId,
      userId:         req.user._id,
    })
    return res.status(201).json({ success: true, data: { board } })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message })
    next(err)
  }
}

export async function getBoards(req, res, next) {
  try {
    const boards = await boardService.getBoards(req.tenantId, req.organizationId)
    return res.status(200).json({ success: true, data: { boards } })
  } catch (err) { next(err) }
}

export async function getBoard(req, res, next) {
  try {
    const data = await boardService.getBoardWithColumns(
      req.params.boardId, req.tenantId, req.organizationId,
    )
    return res.status(200).json({ success: true, data })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message })
    next(err)
  }
}

export async function updateBoard(req, res, next) {
  try {
    const { value, error } = validate(updateBoardSchema, req.body)
    if (error) return res.status(400).json({ success: false, message: error })

    const board = await boardService.updateBoard(
      req.params.boardId, req.tenantId, req.organizationId, value, req.user._id,
    )
    return res.status(200).json({ success: true, data: { board } })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message })
    next(err)
  }
}

export async function deleteBoard(req, res, next) {
  try {
    await boardService.deleteBoard(
      req.params.boardId, req.tenantId, req.organizationId, req.user._id,
    )
    return res.status(200).json({ success: true, message: 'Board archived successfully.' })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message })
    next(err)
  }
}
