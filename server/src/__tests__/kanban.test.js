import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../app.js'
import { startTestServer, stopTestServer, clearCollections } from './setup.js'

let token, orgId, tenantId, boardId, colId

const auth = (t) => ({ Authorization: `Bearer ${t}` })
const BOARD_BASE = () => `/api/organizations/${orgId}/tenants/${tenantId}/boards`

beforeAll(async () => { await startTestServer() }, 30000)
afterAll(async ()  => { await stopTestServer()  }, 30000)

async function setupOrgAndTenant() {
  await clearCollections('users','organizations','tenants','memberships','boards','columns','tasks','activitylogs')

  const r1 = await request(app).post('/api/auth/register')
    .send({ name: 'Dev', email: 'dev@kanban.com', password: 'DevPass123' })
  token = r1.body.data.token

  const r2 = await request(app).post('/api/organizations')
    .set(auth(token)).send({ name: 'Dev Org', slug: 'dev-org' })
  expect(r2.status).toBe(201)
  orgId = r2.body.data.organization._id

  const r3 = await request(app).post(`/api/organizations/${orgId}/tenants`)
    .set(auth(token)).send({ name: 'Dev Team', slug: 'dev-team' })
  expect(r3.status).toBe(201)
  tenantId = r3.body.data.tenant._id
}

beforeEach(setupOrgAndTenant)

describe('Board CRUD', () => {
  it('creates a board', async () => {
    const res = await request(app).post(BOARD_BASE()).set(auth(token)).send({ title: 'Sprint 1' })
    expect(res.status).toBe(201)
    expect(res.body.data.board.title).toBe('Sprint 1')
  })

  it('lists boards', async () => {
    await request(app).post(BOARD_BASE()).set(auth(token)).send({ title: 'B1' })
    const res = await request(app).get(BOARD_BASE()).set(auth(token))
    expect(res.status).toBe(200)
    expect(res.body.data.boards.length).toBeGreaterThanOrEqual(1)
  })

  it('gets board with columns', async () => {
    const br = await request(app).post(BOARD_BASE()).set(auth(token)).send({ title: 'B' })
    boardId = br.body.data.board._id
    const res = await request(app).get(`${BOARD_BASE()}/${boardId}`).set(auth(token))
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data.columns)).toBe(true)
  })

  it('rejects board access without token', async () => {
    const res = await request(app).get(BOARD_BASE())
    expect(res.status).toBe(401)
  })
})

describe('Column CRUD', () => {
  beforeEach(async () => {
    const br = await request(app).post(BOARD_BASE()).set(auth(token)).send({ title: 'Board' })
    boardId = br.body.data.board._id
  })

  it('creates a column', async () => {
    const res = await request(app).post(`${BOARD_BASE()}/${boardId}/columns`)
      .set(auth(token)).send({ title: 'To Do' })
    expect(res.status).toBe(201)
    expect(res.body.data.column.title).toBe('To Do')
  })

  it('updates a column', async () => {
    const cr = await request(app).post(`${BOARD_BASE()}/${boardId}/columns`)
      .set(auth(token)).send({ title: 'Old' })
    colId = cr.body.data.column._id

    const res = await request(app).patch(`${BOARD_BASE()}/${boardId}/columns/${colId}`)
      .set(auth(token)).send({ title: 'New' })
    expect(res.status).toBe(200)
    expect(res.body.data.column.title).toBe('New')
  })

  it('deletes a column', async () => {
    const cr = await request(app).post(`${BOARD_BASE()}/${boardId}/columns`)
      .set(auth(token)).send({ title: 'Del' })
    colId = cr.body.data.column._id

    const res = await request(app).delete(`${BOARD_BASE()}/${boardId}/columns/${colId}`)
      .set(auth(token))
    expect(res.status).toBe(200)
  })
})

describe('Task CRUD', () => {
  beforeEach(async () => {
    const br = await request(app).post(BOARD_BASE()).set(auth(token)).send({ title: 'Board' })
    boardId = br.body.data.board._id
    const cr = await request(app).post(`${BOARD_BASE()}/${boardId}/columns`)
      .set(auth(token)).send({ title: 'Todo' })
    colId = cr.body.data.column._id
  })

  it('creates a task', async () => {
    const res = await request(app)
      .post(`${BOARD_BASE()}/${boardId}/columns/${colId}/tasks`)
      .set(auth(token)).send({ title: 'Fix bug', priority: 'HIGH' })
    expect(res.status).toBe(201)
    expect(res.body.data.task.version).toBe(1)
  })

  it('updates a task with correct version', async () => {
    const tr = await request(app)
      .post(`${BOARD_BASE()}/${boardId}/columns/${colId}/tasks`)
      .set(auth(token)).send({ title: 'Task' })
    const taskId = tr.body.data.task._id

    const res = await request(app)
      .patch(`${BOARD_BASE()}/${boardId}/tasks/${taskId}`)
      .set(auth(token)).send({ title: 'Updated', version: 1 })
    expect(res.status).toBe(200)
    expect(res.body.data.task.title).toBe('Updated')
    expect(res.body.data.task.version).toBe(2)
  })

  it('returns 409 on version conflict', async () => {
    const tr = await request(app)
      .post(`${BOARD_BASE()}/${boardId}/columns/${colId}/tasks`)
      .set(auth(token)).send({ title: 'Task' })
    const taskId = tr.body.data.task._id

    // First update succeeds (version 1 → 2)
    await request(app).patch(`${BOARD_BASE()}/${boardId}/tasks/${taskId}`)
      .set(auth(token)).send({ title: 'First', version: 1 })

    // Second update with stale version should return 409
    const res = await request(app).patch(`${BOARD_BASE()}/${boardId}/tasks/${taskId}`)
      .set(auth(token)).send({ title: 'Conflict', version: 1 })
    expect(res.status).toBe(409)
    expect(res.body.currentTask).toBeDefined()
  })

  it('moves a task to another column', async () => {
    const tr = await request(app)
      .post(`${BOARD_BASE()}/${boardId}/columns/${colId}/tasks`)
      .set(auth(token)).send({ title: 'Moveable' })
    const taskId = tr.body.data.task._id

    const cr2 = await request(app).post(`${BOARD_BASE()}/${boardId}/columns`)
      .set(auth(token)).send({ title: 'In Progress' })
    const col2Id = cr2.body.data.column._id

    const res = await request(app)
      .patch(`${BOARD_BASE()}/${boardId}/tasks/${taskId}/move`)
      .set(auth(token)).send({ columnId: col2Id, position: 0, version: 1 })
    expect(res.status).toBe(200)
    expect(res.body.data.task.columnId).toBe(col2Id)
  })

  it('deletes a task', async () => {
    const tr = await request(app)
      .post(`${BOARD_BASE()}/${boardId}/columns/${colId}/tasks`)
      .set(auth(token)).send({ title: 'DeleteMe' })
    const taskId = tr.body.data.task._id

    const res = await request(app)
      .delete(`${BOARD_BASE()}/${boardId}/tasks/${taskId}`)
      .set(auth(token))
    expect(res.status).toBe(200)
  })

  it('cannot access task from wrong tenant', async () => {
    const tr = await request(app)
      .post(`${BOARD_BASE()}/${boardId}/columns/${colId}/tasks`)
      .set(auth(token)).send({ title: 'Private' })
    const taskId = tr.body.data.task._id

    const r2 = await request(app).post('/api/auth/register')
      .send({ name: 'Other', email: 'other@test.com', password: 'OtherPass1' })
    const tok2 = r2.body.data.token

    const res = await request(app)
      .get(`${BOARD_BASE()}/${boardId}/tasks/${taskId}`)
      .set('Authorization', `Bearer ${tok2}`)
    expect(res.status).toBe(403)
  })
})
