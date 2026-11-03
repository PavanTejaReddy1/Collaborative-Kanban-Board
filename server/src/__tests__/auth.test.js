import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../app.js'
import { startTestServer, stopTestServer, clearCollections } from './setup.js'

beforeAll(async () => { await startTestServer() }, 30000)
afterAll(async ()  => { await stopTestServer()  }, 30000)
beforeEach(async ()=> { await clearCollections('users') })

const REG = { name: 'Test User', email: 'test@example.com', password: 'TestPass1' }

describe('POST /api/auth/register', () => {
  it('registers a new user and returns token', async () => {
    const res = await request(app).post('/api/auth/register').send(REG)
    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.token).toBeTruthy()
    expect(res.body.data.user.email).toBe(REG.email)
    expect(res.body.data.user.password).toBeUndefined()
  })

  it('rejects duplicate email with 409', async () => {
    await request(app).post('/api/auth/register').send(REG)
    const res = await request(app).post('/api/auth/register').send(REG)
    expect(res.status).toBe(409)
  })

  it('rejects missing fields with 400', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'x@x.com' })
    expect(res.status).toBe(400)
  })

  it('rejects weak password with 400', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...REG, password: 'weak' })
    expect(res.status).toBe(400)
  })
})

describe('POST /api/auth/login', () => {
  it('returns token on valid credentials', async () => {
    await request(app).post('/api/auth/register').send(REG)
    const res = await request(app).post('/api/auth/login').send({ email: REG.email, password: REG.password })
    expect(res.status).toBe(200)
    expect(res.body.data.token).toBeTruthy()
  })

  it('returns 401 on wrong password (same generic message)', async () => {
    await request(app).post('/api/auth/register').send(REG)
    const res = await request(app).post('/api/auth/login').send({ email: REG.email, password: 'WrongPass1' })
    expect(res.status).toBe(401)
    expect(res.body.message).toMatch(/invalid/i)
  })

  it('returns 401 for non-existent email with same message', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nobody@x.com', password: 'Pass1234' })
    expect(res.status).toBe(401)
    expect(res.body.message).toMatch(/invalid/i)
  })
})

describe('GET /api/auth/me', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  it('returns user profile with valid token', async () => {
    const reg = await request(app).post('/api/auth/register').send(REG)
    const token = reg.body.data.token
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.user.email).toBe(REG.email)
    expect(res.body.data.user.password).toBeUndefined()
  })

  it('returns 401 for invalid token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not.a.real.token')
    expect(res.status).toBe(401)
  })
})
