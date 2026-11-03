import { Router } from 'express'
import { authenticate }  from '../middleware/authenticate.js'
import { resolveOrg, resolveTenant, requireRole, ROLES } from '../middleware/authorize.js'
import * as boardCtrl  from '../controllers/board.controller.js'
import * as columnCtrl from '../controllers/column.controller.js'
import * as taskCtrl   from '../controllers/task.controller.js'
import { getActivity } from '../controllers/activity.controller.js'

/**
 * All board routes are mounted at:
 *   /api/organizations/:organizationId/tenants/:tenantId/boards
 *
 * Every request MUST pass:
 *   1. authenticate   – valid JWT
 *   2. resolveOrg     – user is member of this organization
 *   3. resolveTenant  – user has access to this tenant
 *
 * This guarantees tenantId and organizationId in req come from
 * verified middleware, never from the client body.
 */

const MW = [authenticate, resolveOrg, resolveTenant]
const ADMIN_MW = [...MW, requireRole(ROLES.ORG_ADMIN, ROLES.TENANT_ADMIN)]

const router = Router({ mergeParams: true }) // inherit :organizationId, :tenantId

// ── Boards ────────────────────────────────────────────────────────────────
router.get   ('/',          ...MW,       boardCtrl.getBoards)
router.post  ('/',          ...ADMIN_MW, boardCtrl.createBoard)
router.get   ('/:boardId',  ...MW,       boardCtrl.getBoard)
router.patch ('/:boardId',  ...ADMIN_MW, boardCtrl.updateBoard)
router.delete('/:boardId',  ...ADMIN_MW, boardCtrl.deleteBoard)

// ── Columns ───────────────────────────────────────────────────────────────
router.post  ('/:boardId/columns',                   ...ADMIN_MW, columnCtrl.createColumn)
router.patch ('/:boardId/columns/reorder',           ...ADMIN_MW, columnCtrl.reorderColumns)
router.patch ('/:boardId/columns/:columnId',         ...ADMIN_MW, columnCtrl.updateColumn)
router.delete('/:boardId/columns/:columnId',         ...ADMIN_MW, columnCtrl.deleteColumn)

// ── Tasks ─────────────────────────────────────────────────────────────────
router.get   ('/:boardId/tasks',                     ...MW,       taskCtrl.getTasks)
router.post  ('/:boardId/columns/:columnId/tasks',   ...MW,       taskCtrl.createTask)
router.patch ('/:boardId/tasks/reorder',             ...MW,       taskCtrl.reorderTasks)
router.get   ('/:boardId/tasks/:taskId',             ...MW,       taskCtrl.getTask)
router.patch ('/:boardId/tasks/:taskId',             ...MW,       taskCtrl.updateTask)
router.patch ('/:boardId/tasks/:taskId/move',        ...MW,       taskCtrl.moveTask)
router.patch ('/:boardId/tasks/:taskId/assign',      ...MW,       taskCtrl.assignTask)
router.delete('/:boardId/tasks/:taskId',             ...MW,       taskCtrl.deleteTask)

// ── Activity ──────────────────────────────────────────────────────────────
router.get   ('/activity',  ...MW, getActivity)

export default router
