# Architecture

## Overview

The Collaborative Kanban Board is a full-stack SaaS application built as two independent services:

```
┌─────────────────────────────┐      HTTP / WebSocket
│  client/  (React + Vite)    │ ◄──────────────────► │  server/  (Node + Express)  │
│  Port 5173 (dev)            │                       │  Port 5000                  │
└─────────────────────────────┘                       └─────────────────────────────┘
                                                                    │
                                                              MongoDB Atlas
                                                              (Port 27017)
```

## Hierarchy

```
Organization
  └── Tenants (Branches)
        └── Boards
              └── Columns
                    └── Tasks
```

Every piece of business data (Board, Column, Task, ActivityLog) carries both `organizationId` and `tenantId`. No query operates on just an `_id` — the scoping fields are always present.

## Backend Architecture

```
server/src/
├── config/
│   ├── database.js     ← Mongoose connection with reconnect
│   └── env.js          ← Centralised env validation (throws on missing required vars)
├── models/             ← Mongoose schemas (8 models)
├── services/           ← Business logic layer (called by controllers)
├── controllers/        ← Thin HTTP handlers (validate → call service → respond)
├── middleware/
│   ├── authenticate.js ← JWT verification + DB user lookup
│   └── authorize.js    ← resolveOrg, resolveTenant, requireRole
├── routes/             ← Express routers
├── sockets/
│   └── handlers.js     ← Socket.IO auth + presence + room management
└── utils/
    ├── jwt.js          ← signToken / verifyToken
    ├── roles.js        ← ROLES constants (separated to avoid circular imports)
    └── validation.js   ← All Joi schemas in one auditable file
```

### Request lifecycle (protected route)

```
Request
  → helmet / cors / rate-limit
  → express.json()
  → authenticate()        # extracts JWT, loads req.user from DB
  → resolveOrg()          # verifies org membership, sets req.organizationId + req.orgRole
  → resolveTenant()       # verifies tenant membership, sets req.tenantId + req.membershipRole
  → requireRole(...)      # checks role against allowed set
  → controller()          # validates body, calls service
  → service()             # scoped DB query (always includes tenantId + organizationId)
  → emit Socket.IO event  # notify other connected users
  → res.json()
```

## Frontend Architecture

```
client/src/
├── api/            ← Axios call wrappers (auth, organizations, boards)
├── components/
│   ├── layout/     ← Sidebar, AppLayout
│   └── ui/         ← Button, Input, Alert, TaskModal
├── contexts/       ← React Context providers (Auth, Org, Tenant, Socket, Board)
├── hooks/          ← useForm
├── pages/          ← Route-level components
├── sockets/        ← socket.io-client singleton
└── utils/          ← (reserved)
```

### Context provider stack

```
<AuthProvider>          ← JWT, user session
  <OrganizationProvider> ← org list, active org
    <TenantProvider>    ← tenant list, active tenant
      <SocketProvider>  ← socket.io connection, presence
        <BoardProvider> ← board state, optimistic updates, undo/redo
```

## Security Model

1. **Authentication** — JWT in `Authorization: Bearer` header. Server re-fetches user from DB on every protected request to handle deactivation.
2. **Authorization** — Every protected route runs `resolveOrg` then `resolveTenant`. These middleware read IDs from **URL params**, verify against the `memberships` collection, and attach verified ObjectIds. Controllers never read `organizationId`/`tenantId` from `req.body`.
3. **Tenant isolation** — All business-data queries include `{ tenantId, organizationId }` derived from middleware. Using just `_id` is not allowed.
4. **Socket rooms** — `tenant:<tenantId>` rooms. `presence:join` verifies Membership before `socket.join()`. Events broadcast only to the room, never globally.

## Concurrency

Tasks carry a `version` integer (default 1). Updates use an atomic conditional query:

```js
Task.findOneAndUpdate(
  { _id, tenantId, organizationId, version: clientVersion },
  { $set: changes, $inc: { version: 1 } },
)
```

If `findOneAndUpdate` returns `null`, the task exists but the version doesn't match → HTTP 409 with the current task state so the client can reconcile.

## Trade-offs

| Decision | Reason |
|----------|--------|
| JWT in localStorage | Simple; XSS mitigated by CSP in production. Refresh-token architecture documented as future work. |
| Soft-delete boards/tenants | Preserves audit trail; tasks remain queryable for activity feeds. |
| Gap-based positions (0, 1000, 2000) | Allows inserting between items without rewriting all positions. |
| Membership join table (not embedded) | Scales to many members; allows efficient role lookups without loading full org documents. |
| Single Membership collection for org + tenant | One index lookup per request instead of two collections; tenantId: null distinguishes scope. |
