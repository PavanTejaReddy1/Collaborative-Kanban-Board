# Database Design

## ER Diagram (text)

```
User ─────────────────────────────────────────────────────────┐
 │                                                             │
 │ createdBy                                                   │
 ▼                                                             │
Organization ──────────────────────────────────┐              │
 │                                             │              │
 │ organizationId                              │ organizationId│
 ▼                                             ▼              │
Tenant ──────────────────────────────── Membership            │
 │                                        userId ─────────────┘
 │ tenantId                               organizationId
 ▼                                        tenantId (null=org-level)
Board ─────────────┐                      role
 │                 │
 │ boardId         │ boardId
 ▼                 ▼
Column           ActivityLog
 │
 │ columnId
 ▼
Task
```

## Collections

### users
| Field | Type | Notes |
|-------|------|-------|
| _id | ObjectId | |
| name | String | 2–80 chars |
| email | String | unique, lowercase |
| password | String | bcrypt hash, `select: false` |
| isActive | Boolean | default true |
| lastLoginAt | Date | |
| createdAt / updatedAt | Date | |

Index: `{ email: 1 }`

### organizations
| Field | Type | Notes |
|-------|------|-------|
| _id | ObjectId | |
| name | String | 2–100 chars |
| slug | String | globally unique, `^[a-z0-9-]+$` |
| description | String | max 500 |
| createdBy | ObjectId → User | |
| isActive | Boolean | |

Indexes: `{ slug: 1 }`, `{ createdBy: 1 }`

### tenants
| Field | Type | Notes |
|-------|------|-------|
| _id | ObjectId | |
| name | String | |
| slug | String | unique within org |
| description | String | |
| organizationId | ObjectId → Organization | required |
| createdBy | ObjectId → User | |
| isActive | Boolean | |

Indexes: `{ organizationId: 1, slug: 1 }` (unique), `{ organizationId: 1, isActive: 1 }`

### memberships
| Field | Type | Notes |
|-------|------|-------|
| _id | ObjectId | |
| userId | ObjectId → User | |
| organizationId | ObjectId → Organization | |
| tenantId | ObjectId → Tenant | **null = org-level** |
| role | String | ORG_ADMIN / TENANT_ADMIN / MEMBER |
| invitedBy | ObjectId → User | |

Indexes:
- `{ userId, organizationId, tenantId }` (unique compound) — prevents duplicates
- `{ organizationId, tenantId }` — fast "list members of tenant"

### boards
| Field | Type | Notes |
|-------|------|-------|
| _id | ObjectId | |
| title | String | 1–120 |
| description | String | |
| organizationId | ObjectId | |
| tenantId | ObjectId | |
| createdBy | ObjectId → User | |
| isArchived | Boolean | soft delete |

Index: `{ tenantId, organizationId, isArchived }`

### columns
| Field | Type | Notes |
|-------|------|-------|
| _id | ObjectId | |
| title | String | 1–80 |
| boardId | ObjectId → Board | |
| organizationId | ObjectId | |
| tenantId | ObjectId | |
| position | Number | gap-based (0, 1000, 2000…) |
| color | String | hex color |

Indexes: `{ boardId, position }`, `{ tenantId, boardId }`

### tasks
| Field | Type | Notes |
|-------|------|-------|
| _id | ObjectId | |
| title | String | 1–200 |
| description | String | max 5000 |
| boardId | ObjectId → Board | |
| columnId | ObjectId → Column | |
| organizationId | ObjectId | |
| tenantId | ObjectId | |
| assignedTo | ObjectId → User | nullable |
| priority | String | LOW/MEDIUM/HIGH/URGENT |
| dueDate | Date | nullable |
| position | Number | gap-based within column |
| **version** | Number | optimistic concurrency counter |
| labels | [String] | |
| createdBy | ObjectId → User | |

Indexes: `{ columnId, position }`, `{ boardId, tenantId }`, `{ tenantId, assignedTo }`

### activitylogs
| Field | Type | Notes |
|-------|------|-------|
| _id | ObjectId | |
| organizationId | ObjectId | |
| tenantId | ObjectId | |
| userId | ObjectId → User | |
| action | String | enum (board.created, task.moved, …) |
| entityType | String | board/column/task/member |
| entityId | ObjectId | |
| details | Mixed | before/after snapshots |
| createdAt | Date | **no updatedAt** — logs are immutable |

Indexes: `{ tenantId, createdAt: -1 }`, `{ entityId, createdAt: -1 }`

## Tenant Isolation Strategy

Every business-data query **must** include both `organizationId` and `tenantId`:

```js
// ✅ Correct
Task.find({ boardId, tenantId, organizationId })

// ❌ Wrong — could return data from another tenant
Task.find({ boardId })
```

The `organizationId` and `tenantId` values in every query come from `req.organizationId` and `req.tenantId`, which are set by the `resolveOrg` and `resolveTenant` middleware after verifying the user's `Membership` document. They are **never** read from `req.body` or `req.query`.
