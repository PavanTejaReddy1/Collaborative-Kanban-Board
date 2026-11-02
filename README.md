# Collaborative Kanban Board

A production-quality, multi-tenant, real-time Kanban board application.

## Tech Stack

| Layer     | Technology                             |
|-----------|----------------------------------------|
| Frontend  | React 18, Vite, Tailwind CSS v3, @dnd-kit |
| Routing   | React Router v6                        |
| HTTP      | Axios                                  |
| Real-time | Socket.IO (client + server)            |
| Backend   | Node.js, Express 4                     |
| Database  | MongoDB, Mongoose 8                    |
| Auth      | JWT, bcryptjs                          |
| Validation| Joi                                    |

## Project Structure

```
collaborative-kanban-board/
├── client/     ← React + Vite frontend
└── server/     ← Express + MongoDB backend
```

## Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB (local or Atlas)

### Backend
```bash
cd server
cp .env.example .env   # fill in your values
npm install
npm run dev            # starts on :5000
```

### Frontend
```bash
cd client
cp .env.example .env
npm install
npm run dev            # starts on :5173
```

### Health Check
```
GET http://localhost:5000/api/health
```

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) *(coming soon)*

## Hierarchy

```
Organization
  └── Tenants (Branches)
        └── Boards
              └── Columns
                    └── Tasks
```

## Roles
- **Organization Admin** — full control over the org and all tenants
- **Tenant Admin** — manages a single tenant, its boards and members
- **Member** — creates and moves tasks within their tenant

## Security
- Passwords hashed with bcryptjs
- JWT authentication on all protected routes
- Every query is scoped to `organizationId` + `tenantId`
- Cross-tenant access is rejected at the middleware layer
- Concurrent task updates use optimistic locking (HTTP 409 on conflict)
