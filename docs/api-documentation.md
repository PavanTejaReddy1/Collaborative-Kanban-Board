# API Documentation

Base URL: `http://localhost:5000/api` (development)

All protected endpoints require:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

All responses follow the envelope format:
```json
{ "success": true|false, "data": {}, "message": "..." }
```

---

## Authentication

### POST /auth/register
Creates a new user account.

**Body:**
```json
{ "name": "Jane Smith", "email": "jane@example.com", "password": "SecurePass1" }
```
Password rules: min 8 chars, 1 uppercase, 1 lowercase, 1 digit.

**Response 201:**
```json
{ "success": true, "data": { "token": "<jwt>", "user": { "id": "...", "name": "...", "email": "..." } } }
```

**Errors:** `400` validation, `409` email already exists

---

### POST /auth/login
**Body:** `{ "email": "...", "password": "..." }`
**Response 200:** Same as register.
**Errors:** `400` validation, `401` invalid credentials (same message for wrong email/password — prevents enumeration)

---

### GET /auth/me  🔒
Returns the authenticated user's profile. No password hash ever returned.

### POST /auth/logout  🔒
Signals logout. JWT is stateless — client must discard the token.

---

## Organizations

### POST /organizations  🔒
Creates an organization. Caller automatically becomes `ORG_ADMIN`.

**Body:** `{ "name": "Acme Corp", "slug": "acme-corp", "description": "..." }`

### GET /organizations  🔒
Returns all organizations the authenticated user belongs to.

### GET /organizations/:orgId  🔒 (org member)
### PATCH /organizations/:orgId  🔒 (ORG_ADMIN)
**Body:** `{ "name": "...", "description": "..." }` — at least one field required.

### GET /organizations/:orgId/members  🔒
### GET /organizations/:orgId/tenants  🔒

---

## Tenants

### POST /organizations/:orgId/tenants  🔒 (ORG_ADMIN)
**Body:** `{ "name": "Engineering", "slug": "engineering", "description": "..." }`

### GET /organizations/:orgId/tenants/:tenantId  🔒 (tenant member)
### PATCH /organizations/:orgId/tenants/:tenantId  🔒 (TENANT_ADMIN+)
### DELETE /organizations/:orgId/tenants/:tenantId  🔒 (ORG_ADMIN) — soft delete

---

## Tenant Members

### GET /organizations/:orgId/tenants/:tenantId/members  🔒
### POST /organizations/:orgId/tenants/:tenantId/members  🔒 (TENANT_ADMIN+)
**Body:** `{ "email": "user@example.com", "role": "MEMBER" | "TENANT_ADMIN" }`
The user must already have an account.

### DELETE /organizations/:orgId/tenants/:tenantId/members/:membershipId  🔒 (TENANT_ADMIN+)
### PATCH /organizations/:orgId/tenants/:tenantId/members/:membershipId  🔒 (TENANT_ADMIN+)
**Body:** `{ "role": "MEMBER" | "TENANT_ADMIN" }`

---

## Boards
Base path: `/organizations/:orgId/tenants/:tenantId/boards`

### GET /  🔒 (any tenant member)
### POST /  🔒 (TENANT_ADMIN+)  — body: `{ "title": "...", "description": "..." }`
### GET /:boardId  🔒 — returns board + columns + tasks in one response
### PATCH /:boardId  🔒 (TENANT_ADMIN+)
### DELETE /:boardId  🔒 (TENANT_ADMIN+) — soft archive

---

## Columns
Base: `/organizations/:orgId/tenants/:tenantId/boards/:boardId/columns`

### POST /  🔒 (TENANT_ADMIN+)  — body: `{ "title": "...", "color": "#6366f1" }`
### PATCH /:columnId  🔒 (TENANT_ADMIN+)  — body: `{ "title": "...", "color": "..." }`
### DELETE /:columnId  🔒 (TENANT_ADMIN+) — also deletes all tasks in column
### PATCH /reorder  🔒 (TENANT_ADMIN+)
```json
{ "columns": [{ "columnId": "...", "position": 0 }, { "columnId": "...", "position": 1000 }] }
```

---

## Tasks
Base: `/organizations/:orgId/tenants/:tenantId/boards/:boardId`

### GET /tasks  🔒 (any member)
### POST /columns/:columnId/tasks  🔒 (any member)
```json
{ "title": "Fix bug", "description": "...", "priority": "HIGH", "dueDate": "2026-12-31", "assignedTo": "<userId>", "labels": ["backend"] }
```

### GET /tasks/:taskId  🔒
### PATCH /tasks/:taskId  🔒 — **requires `version` field** (concurrency control)
```json
{ "title": "Updated title", "priority": "URGENT", "version": 2 }
```
Returns `409` if `version` doesn't match current. Response includes `currentTask`.

### PATCH /tasks/:taskId/move  🔒 — **requires `version`**
```json
{ "columnId": "<targetColId>", "position": 1000, "version": 2 }
```

### PATCH /tasks/:taskId/assign  🔒
```json
{ "assignedTo": "<userId>", "version": 2 }
```

### DELETE /tasks/:taskId  🔒
### PATCH /tasks/reorder  🔒
```json
{ "tasks": [{ "taskId": "...", "position": 0 }, ...] }
```

---

## Activity
### GET /organizations/:orgId/tenants/:tenantId/boards/activity?limit=50&entityId=<id>  🔒

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Resource created |
| 400 | Validation error |
| 401 | Not authenticated / invalid token |
| 403 | Authenticated but not authorized |
| 404 | Resource not found |
| 409 | Conflict (duplicate slug, concurrent update) |
| 503 | Service unavailable (DB disconnected) |
