import api from './index.js'

const base = (orgId, tenantId) =>
  `/organizations/${orgId}/tenants/${tenantId}/boards`

// ── Boards ────────────────────────────────────────────────────────────────
export const getBoards   = (orgId, tenantId)         => api.get(base(orgId, tenantId))
export const createBoard = (orgId, tenantId, data)   => api.post(base(orgId, tenantId), data)
export const getBoard    = (orgId, tenantId, boardId)=> api.get(`${base(orgId, tenantId)}/${boardId}`)
export const updateBoard = (orgId, tenantId, boardId, data) =>
  api.patch(`${base(orgId, tenantId)}/${boardId}`, data)
export const deleteBoard = (orgId, tenantId, boardId) =>
  api.delete(`${base(orgId, tenantId)}/${boardId}`)

// ── Columns ───────────────────────────────────────────────────────────────
export const createColumn  = (orgId, tenantId, boardId, data) =>
  api.post(`${base(orgId, tenantId)}/${boardId}/columns`, data)
export const updateColumn  = (orgId, tenantId, boardId, colId, data) =>
  api.patch(`${base(orgId, tenantId)}/${boardId}/columns/${colId}`, data)
export const deleteColumn  = (orgId, tenantId, boardId, colId) =>
  api.delete(`${base(orgId, tenantId)}/${boardId}/columns/${colId}`)
export const reorderColumns = (orgId, tenantId, boardId, columns) =>
  api.patch(`${base(orgId, tenantId)}/${boardId}/columns/reorder`, { columns })

// ── Tasks ─────────────────────────────────────────────────────────────────
export const getTasks     = (orgId, tenantId, boardId)          => api.get(`${base(orgId, tenantId)}/${boardId}/tasks`)
export const createTask   = (orgId, tenantId, boardId, colId, data) =>
  api.post(`${base(orgId, tenantId)}/${boardId}/columns/${colId}/tasks`, data)
export const getTask      = (orgId, tenantId, boardId, taskId)  => api.get(`${base(orgId, tenantId)}/${boardId}/tasks/${taskId}`)
export const updateTask   = (orgId, tenantId, boardId, taskId, data) =>
  api.patch(`${base(orgId, tenantId)}/${boardId}/tasks/${taskId}`, data)
export const moveTask     = (orgId, tenantId, boardId, taskId, data) =>
  api.patch(`${base(orgId, tenantId)}/${boardId}/tasks/${taskId}/move`, data)
export const assignTask   = (orgId, tenantId, boardId, taskId, data) =>
  api.patch(`${base(orgId, tenantId)}/${boardId}/tasks/${taskId}/assign`, data)
export const deleteTask   = (orgId, tenantId, boardId, taskId) =>
  api.delete(`${base(orgId, tenantId)}/${boardId}/tasks/${taskId}`)
export const reorderTasks = (orgId, tenantId, boardId, tasks)  =>
  api.patch(`${base(orgId, tenantId)}/${boardId}/tasks/reorder`, { tasks })

// ── Activity ──────────────────────────────────────────────────────────────
export const getActivity = (orgId, tenantId, params = {}) =>
  api.get(`${base(orgId, tenantId)}/activity`, { params })
