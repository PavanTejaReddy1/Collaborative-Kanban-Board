/**
 * seed.js — Demo data seeder
 *
 * Creates a realistic demo workspace with:
 *   - 1 demo user  (demo@kanban.app / Demo@1234)
 *   - 1 org        (Acme Corp)
 *   - 2 tenants    (Engineering, Marketing)
 *   - 3 boards     (Sprint Board, Bug Tracker, Content Calendar)
 *   - columns + tasks with priorities, due dates and assignments
 *   - activity log entries
 *
 * Usage:
 *   node src/seed.js            # seed if not already seeded
 *   node src/seed.js --fresh    # drop existing demo data first
 *
 * Safe to run multiple times (idempotent unless --fresh).
 */

// Load env before importing anything else
const { config } = await import('dotenv')
config()

import mongoose from 'mongoose'

// ── Models (imported after env is loaded) ──────────────────────────────────
import User         from './models/User.js'
import Organization from './models/Organization.js'
import Tenant       from './models/Tenant.js'
import Membership   from './models/Membership.js'
import Board        from './models/Board.js'
import Column       from './models/Column.js'
import Task         from './models/Task.js'
import ActivityLog  from './models/ActivityLog.js'

const FRESH = process.argv.includes('--fresh')

const DEMO = {
  email:    'demo@kanban.app',
  password: 'Demo@1234',
  name:     'Demo User',
}

async function seed() {
  const uri = process.env.MONGO_URI
  if (!uri) { console.error('❌ MONGO_URI not set'); process.exit(1) }

  console.log('🌱 Connecting to MongoDB…')
  await mongoose.connect(uri)
  console.log('✅ Connected')

  // Drop any stale/orphaned indexes that might conflict
  try {
    await mongoose.connection.collection('tasks').dropIndex('taskId_1')
    console.log('🔧 Dropped stale taskId_1 index')
  } catch (_) { /* index doesn't exist — fine */ }

  if (FRESH) {
    console.log('🗑  Dropping existing demo data…')

    // Clean by known slugs first (catches leftover data from any prior session)
    const oldOrg = await Organization.findOne({ slug: 'acme-corp' })
    if (oldOrg) {
      const tenants = await Tenant.find({ organizationId: oldOrg._id })
      for (const t of tenants) {
        const boards = await Board.find({ tenantId: t._id })
        for (const b of boards) {
          await Column.deleteMany({ boardId: b._id })
          await Task.deleteMany({ boardId: b._id })
          await ActivityLog.deleteMany({ entityId: b._id })
        }
        await Board.deleteMany({ tenantId: t._id })
      }
      await Tenant.deleteMany({ organizationId: oldOrg._id })
      await Membership.deleteMany({ organizationId: oldOrg._id })
      await Organization.findByIdAndDelete(oldOrg._id)
    }

    // Also clean by demo user (belt-and-suspenders)
    const demoUser = await User.findOne({ email: DEMO.email })
    if (demoUser) await User.findByIdAndDelete(demoUser._id)
    const alexUser = await User.findOne({ email: 'alex@kanban.app' })
    if (alexUser) await User.findByIdAndDelete(alexUser._id)

    console.log('✅ Old demo data removed')
  }

  // ── Check if already seeded ──────────────────────────────────────────────
  const existing = await User.findOne({ email: DEMO.email })
  if (existing) {
    console.log('ℹ️  Demo data already exists. Use --fresh to reseed.')
    await mongoose.disconnect()
    return
  }

  // ── 1. Create demo user ───────────────────────────────────────────────────
  console.log('👤 Creating demo user…')
  // Use User.create() so the pre-save bcrypt hook runs — do NOT pre-hash here
  const user = await User.create({
    name:     DEMO.name,
    email:    DEMO.email,
    password: DEMO.password,   // hook hashes this
    isActive: true,
  })

  const member = await User.create({
    name:     'Alex Chen',
    email:    'alex@kanban.app',
    password: 'Demo@1234',     // hook hashes this
    isActive: true,
  })

  // ── 2. Create organization ────────────────────────────────────────────────
  console.log('🏢 Creating organization…')
  const org = await Organization.create({
    name:      'Acme Corp',
    slug:      'acme-corp',
    description: 'Our primary workspace for all teams',
    createdBy: user._id,
    isActive:  true,
  })

  // Org-level membership for both users
  await Membership.create({ userId: user._id,   organizationId: org._id, tenantId: null, role: 'ORG_ADMIN' })
  await Membership.create({ userId: member._id, organizationId: org._id, tenantId: null, role: 'MEMBER' })

  // ── 3. Create tenants ─────────────────────────────────────────────────────
  console.log('🏗  Creating branches…')
  const engineering = await Tenant.create({
    name: 'Engineering', slug: 'engineering',
    description: 'Product development team',
    organizationId: org._id, createdBy: user._id, isActive: true,
  })
  const marketing = await Tenant.create({
    name: 'Marketing', slug: 'marketing',
    description: 'Growth and content team',
    organizationId: org._id, createdBy: user._id, isActive: true,
  })

  // Tenant memberships
  await Membership.create({ userId: user._id,   organizationId: org._id, tenantId: engineering._id, role: 'TENANT_ADMIN' })
  await Membership.create({ userId: member._id, organizationId: org._id, tenantId: engineering._id, role: 'MEMBER' })
  await Membership.create({ userId: user._id,   organizationId: org._id, tenantId: marketing._id,   role: 'TENANT_ADMIN' })

  // ── 4. Engineering boards ─────────────────────────────────────────────────
  console.log('📋 Creating boards…')

  // Board 1: Sprint Board
  const sprint = await Board.create({
    title: 'Sprint 24 — Feature Release', description: 'Current active sprint',
    organizationId: org._id, tenantId: engineering._id, createdBy: user._id,
  })
  const [todo, inProg, review, done] = await Column.insertMany([
    { title: 'Backlog',     boardId: sprint._id, organizationId: org._id, tenantId: engineering._id, position: 0    },
    { title: 'In Progress', boardId: sprint._id, organizationId: org._id, tenantId: engineering._id, position: 1000 },
    { title: 'In Review',   boardId: sprint._id, organizationId: org._id, tenantId: engineering._id, position: 2000 },
    { title: 'Done',        boardId: sprint._id, organizationId: org._id, tenantId: engineering._id, position: 3000 },
  ])

  await Task.insertMany([
    { title: 'Implement real-time notifications', description: 'Use Socket.IO to push updates to all connected clients without polling.', boardId: sprint._id, columnId: inProg._id, organizationId: org._id, tenantId: engineering._id, assignedTo: user._id, priority: 'HIGH',   position: 0,    version: 1, createdBy: user._id, dueDate: futureDate(3) },
    { title: 'Fix drag-and-drop on mobile',       description: 'Touch events not firing correctly on iOS Safari 17.',                     boardId: sprint._id, columnId: inProg._id, organizationId: org._id, tenantId: engineering._id, assignedTo: member._id, priority: 'URGENT', position: 1000, version: 1, createdBy: user._id, dueDate: futureDate(1) },
    { title: 'Add JWT refresh token support',      description: 'Implement short-lived access tokens with httpOnly refresh cookie.',       boardId: sprint._id, columnId: todo._id,   organizationId: org._id, tenantId: engineering._id, assignedTo: null,      priority: 'MEDIUM', position: 0,    version: 1, createdBy: user._id, dueDate: futureDate(7) },
    { title: 'Write API documentation',            description: 'Document all REST endpoints with examples using OpenAPI 3.0.',            boardId: sprint._id, columnId: todo._id,   organizationId: org._id, tenantId: engineering._id, assignedTo: member._id, priority: 'LOW',    position: 1000, version: 1, createdBy: user._id, dueDate: futureDate(14) },
    { title: 'Set up CI/CD pipeline',             description: 'GitHub Actions: lint → test → build → deploy to Render.',                 boardId: sprint._id, columnId: review._id, organizationId: org._id, tenantId: engineering._id, assignedTo: user._id, priority: 'HIGH',   position: 0,    version: 2, createdBy: user._id, dueDate: futureDate(2) },
    { title: 'Database query optimization',       description: 'Add compound indexes for tenant-scoped queries. Target <50ms p95.',       boardId: sprint._id, columnId: done._id,   organizationId: org._id, tenantId: engineering._id, assignedTo: user._id, priority: 'MEDIUM', position: 0,    version: 3, createdBy: user._id },
    { title: 'User onboarding flow',              description: 'Empty-state screens and guided first-time setup.',                         boardId: sprint._id, columnId: done._id,   organizationId: org._id, tenantId: engineering._id, assignedTo: member._id, priority: 'HIGH',  position: 1000, version: 2, createdBy: user._id },
  ])

  // Board 2: Bug Tracker
  const bugs = await Board.create({
    title: 'Bug Tracker', description: 'Production and staging issues',
    organizationId: org._id, tenantId: engineering._id, createdBy: user._id,
  })
  const [open, investigating, bugDone] = await Column.insertMany([
    { title: 'Open',          boardId: bugs._id, organizationId: org._id, tenantId: engineering._id, position: 0    },
    { title: 'Investigating', boardId: bugs._id, organizationId: org._id, tenantId: engineering._id, position: 1000 },
    { title: 'Resolved',      boardId: bugs._id, organizationId: org._id, tenantId: engineering._id, position: 2000 },
  ])
  await Task.insertMany([
    { title: '500 error on concurrent task move', description: 'Two users moving the same task simultaneously causes a 500. Needs 409 handling.', boardId: bugs._id, columnId: investigating._id, organizationId: org._id, tenantId: engineering._id, assignedTo: user._id, priority: 'URGENT', position: 0, version: 2, createdBy: member._id, dueDate: futureDate(0) },
    { title: 'Sidebar flickers on tenant switch', description: 'Brief white flash when switching branches in the sidebar.', boardId: bugs._id, columnId: open._id, organizationId: org._id, tenantId: engineering._id, priority: 'LOW', position: 0, version: 1, createdBy: member._id },
    { title: 'Activity log missing task.moved',   description: 'Drag-and-drop moves do not appear in the Activity feed.', boardId: bugs._id, columnId: bugDone._id, organizationId: org._id, tenantId: engineering._id, assignedTo: member._id, priority: 'MEDIUM', position: 0, version: 2, createdBy: user._id },
  ])

  // ── 5. Marketing board ────────────────────────────────────────────────────
  const content = await Board.create({
    title: 'Content Calendar', description: 'Blog posts, social media and campaigns',
    organizationId: org._id, tenantId: marketing._id, createdBy: user._id,
  })
  const [ideas, writing, published] = await Column.insertMany([
    { title: 'Ideas',     boardId: content._id, organizationId: org._id, tenantId: marketing._id, position: 0    },
    { title: 'Writing',   boardId: content._id, organizationId: org._id, tenantId: marketing._id, position: 1000 },
    { title: 'Published', boardId: content._id, organizationId: org._id, tenantId: marketing._id, position: 2000 },
  ])
  await Task.insertMany([
    { title: 'Launch announcement blog post', description: 'Announce the public launch with a product walkthrough.', boardId: content._id, columnId: writing._id,   organizationId: org._id, tenantId: marketing._id, assignedTo: user._id, priority: 'HIGH',   position: 0,    version: 1, createdBy: user._id, dueDate: futureDate(5) },
    { title: 'Twitter thread — real-time features', description: 'Explain the Socket.IO architecture in an engaging thread.', boardId: content._id, columnId: ideas._id,    organizationId: org._id, tenantId: marketing._id, priority: 'MEDIUM', position: 0,    version: 1, createdBy: user._id },
    { title: 'Product Hunt launch checklist',  description: 'Hunter found, assets ready, 50 supporters lined up.', boardId: content._id, columnId: published._id, organizationId: org._id, tenantId: marketing._id, priority: 'URGENT', position: 0,    version: 2, createdBy: user._id },
  ])

  // ── 6. Activity logs ─────────────────────────────────────────────────────
  console.log('📝 Creating activity logs…')
  await ActivityLog.insertMany([
    { organizationId: org._id, tenantId: engineering._id, userId: user._id,   action: 'board.created', entityType: 'board', entityId: sprint._id, details: { title: sprint.title } },
    { organizationId: org._id, tenantId: engineering._id, userId: user._id,   action: 'board.created', entityType: 'board', entityId: bugs._id,   details: { title: bugs.title   } },
    { organizationId: org._id, tenantId: engineering._id, userId: member._id, action: 'task.created',  entityType: 'task',  entityId: sprint._id, details: { title: 'Implement real-time notifications' } },
    { organizationId: org._id, tenantId: engineering._id, userId: user._id,   action: 'task.moved',    entityType: 'task',  entityId: sprint._id, details: { from: { columnId: todo._id }, to: { columnId: done._id } } },
    { organizationId: org._id, tenantId: marketing._id,   userId: user._id,   action: 'board.created', entityType: 'board', entityId: content._id, details: { title: content.title } },
  ])

  console.log('\n✅ Seed complete!\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  Demo login credentials:')
  console.log(`  Email    : ${DEMO.email}`)
  console.log(`  Password : ${DEMO.password}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  Second user:')
  console.log('  Email    : alex@kanban.app')
  console.log(`  Password : Demo@1234`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  await mongoose.disconnect()
}

function futureDate(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message)
  process.exit(1)
})
