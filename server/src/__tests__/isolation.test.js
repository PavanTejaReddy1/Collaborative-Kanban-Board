import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../app.js'
import { startTestServer, stopTestServer, clearCollections } from './setup.js'

let adminToken, memberToken, orgId, tenantId

beforeAll(async () => { await startTestServer() }, 30000)
afterAll(async ()  => { await stopTestServer()  }, 30000)

// Full reset before each test — build fresh state
beforeEach(async () => {
  await clearCollections('users', 'organizations', 'tenants', 'memberships')

  const r1 = await request(app).post('/api/auth/register')
    .send({ name: 'Admin', email: 'admin@iso.com', password: 'AdminPass1' })
  adminToken = r1.body.data.token

  const r2 = await request(app).post('/api/auth/register')
    .send({ name: 'Member', email: 'member@iso.com', password: 'MemberPass1' })
  memberToken = r2.body.data.token

  const orgRes = await request(app).post('/api/organizations')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Test Org', slug: 'test-org' })
  expect(orgRes.status).toBe(201)
  orgId = orgRes.body.data.organization._id

  const tenRes = await request(app).post(`/api/organizations/${orgId}/tenants`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Test Tenant', slug: 'test-tenant' })
  expect(tenRes.status).toBe(201)
  tenantId = tenRes.body.data.tenant._id
})

describe('Organization isolation', () => {
  it('non-member cannot access organization', async () => {
    const res = await request(app).get(`/api/organizations/${orgId}`)
      .set('Authorization', `Bearer ${memberToken}`)
    expect(res.status).toBe(403)
  })

  it('fabricated orgId returns 403, not data', async () => {
    const fakeId = '000000000000000000000001'
    const res = await request(app).get(`/api/organizations/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(403)
  })

  it('duplicate org slug returns 409', async () => {
    const res = await request(app).post('/api/organizations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Dup', slug: 'test-org' })
    expect(res.status).toBe(409)
  })
})

describe('Tenant isolation', () => {
  it('non-member cannot access tenant', async () => {
    const res = await request(app)
      .get(`/api/organizations/${orgId}/tenants/${tenantId}`)
      .set('Authorization', `Bearer ${memberToken}`)
    expect(res.status).toBe(403)
  })

  it('MEMBER cannot create tenant (403)', async () => {
    // Give member org-level access first
    await request(app)
      .post(`/api/organizations/${orgId}/tenants/${tenantId}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'member@iso.com', role: 'MEMBER' })

    const res = await request(app)
      .post(`/api/organizations/${orgId}/tenants`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Hack', slug: 'hack' })
    expect(res.status).toBe(403)
  })

  it('MEMBER cannot delete tenant (403)', async () => {
    await request(app)
      .post(`/api/organizations/${orgId}/tenants/${tenantId}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'member@iso.com', role: 'MEMBER' })

    const res = await request(app)
      .delete(`/api/organizations/${orgId}/tenants/${tenantId}`)
      .set('Authorization', `Bearer ${memberToken}`)
    expect(res.status).toBe(403)
  })

  it('duplicate tenant slug within org returns 409', async () => {
    const res = await request(app)
      .post(`/api/organizations/${orgId}/tenants`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Dup', slug: 'test-tenant' })
    expect(res.status).toBe(409)
  })

  it('after invite, member can access tenant', async () => {
    await request(app)
      .post(`/api/organizations/${orgId}/tenants/${tenantId}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'member@iso.com', role: 'MEMBER' })

    const res = await request(app)
      .get(`/api/organizations/${orgId}/tenants/${tenantId}`)
      .set('Authorization', `Bearer ${memberToken}`)
    expect(res.status).toBe(200)
  })
})

describe('Privilege escalation', () => {
  it('MEMBER cannot change own role', async () => {
    await request(app)
      .post(`/api/organizations/${orgId}/tenants/${tenantId}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'member@iso.com', role: 'MEMBER' })

    const members = await request(app)
      .get(`/api/organizations/${orgId}/tenants/${tenantId}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
    const m = members.body.data.members.find(x => x.user?.email === 'member@iso.com')

    const res = await request(app)
      .patch(`/api/organizations/${orgId}/tenants/${tenantId}/members/${m.membershipId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ role: 'TENANT_ADMIN' })
    expect(res.status).toBe(403)
  })
})
