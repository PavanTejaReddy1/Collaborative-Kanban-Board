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
cp .env.example .env   # fill in MONGO_URI and JWT_SECRET
npm install
npm run seed           # populate demo data
npm run dev            # starts on :5000
```

### Frontend
```bash
cd client
cp .env.example .env
npm install
npm run dev            # starts on :5173
```

### Demo Login
After running `npm run seed` in the server directory:
| Field | Value |
|-------|-------|
| Email | `demo@kanban.app` |
| Password | `Demo@1234` |

Or click the **"Demo login"** button on the login page.

### Health Check
```
GET http://localhost:5000/api/health
```

## Deployment

### Frontend → Vercel
1. Connect your GitHub repo to Vercel
2. Set root directory to `client`
3. Add env vars: `VITE_API_BASE_URL`, `VITE_SOCKET_URL`

### Backend → Render
1. Connect your GitHub repo to Render
2. Set root directory to `server`, build command `npm install`, start command `npm start`
3. Add env vars from `server/.env.example` in the Render dashboard
4. After deploy, run: `npm run seed` once to populate demo data

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
