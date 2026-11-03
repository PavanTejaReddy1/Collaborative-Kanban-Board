# WebSocket Documentation

## Connection

```js
import { io } from 'socket.io-client'

const socket = io('http://localhost:5000', {
  auth: { token: '<jwt_token>' },
  transports: ['websocket', 'polling'],
})
```

The server verifies the JWT in `socket.handshake.auth.token` during the connection handshake. Unauthenticated connections are rejected before any events can be emitted.

---

## Authentication Flow

1. Client connects with JWT in `auth.token`
2. Server middleware verifies token with `verifyToken()`
3. Server loads user from DB — rejected if not found or `isActive: false`
4. `socket.user` is set for all downstream handlers

---

## Joining a Tenant Room

After connecting, the client must explicitly join a tenant room:

```js
socket.emit('presence:join', {
  tenantId:       '<tenantId>',
  organizationId: '<organizationId>',
})
```

**Server-side verification:**
- Looks up `Membership` with `{ userId, organizationId, tenantId }`
- Also accepts `ORG_ADMIN` users (who have `tenantId: null` org-level membership)
- Rejects with `error` event if no valid membership found
- On success: calls `socket.join('tenant:<tenantId>')`

**Never trust the client's claimed tenantId** — the server always verifies membership before joining.

---

## Events Reference

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `presence:join` | `{ tenantId, organizationId }` | Join a tenant room (verified server-side) |
| `presence:leave` | `{ tenantId }` | Leave a tenant room |
| `ping` | — | Keep-alive |

### Server → Client (tenant room broadcasts)

All these events are emitted to `tenant:<tenantId>` room — only members of that tenant receive them.

| Event | Payload | Trigger |
|-------|---------|---------|
| `task:created` | `{ task, boardId }` | Task created via POST |
| `task:updated` | `{ task, boardId }` | Task updated or assigned |
| `task:deleted` | `{ taskId, columnId, boardId }` | Task deleted |
| `task:moved` | `{ task, boardId }` | Task moved between columns |
| `task:reordered` | `{ tasks, boardId }` | Tasks reordered within column |
| `column:created` | `{ column, boardId }` | Column created |
| `column:updated` | `{ column, boardId }` | Column renamed/recoloured |
| `column:deleted` | `{ columnId, boardId }` | Column deleted |
| `column:reordered` | `{ columns, boardId }` | Columns reordered |
| `presence:updated` | `{ users: [{userId, name, email}] }` | Online users list changed |
| `presence:joined` | `{ tenantId, onlineUsers }` | Sent to joining user only |

### Server → Client (individual)

| Event | Payload | Description |
|-------|---------|-------------|
| `error` | `{ message }` | Auth failure or unauthorized room join |
| `pong` | — | Response to `ping` |

---

## Presence Tracking

Online users are tracked in a server-side `Map<tenantId, Map<userId, userInfo>>`. When a user connects to a tenant room, all existing room members receive `presence:updated` with the full updated list.

When a user disconnects or calls `presence:leave`, they are removed and `presence:updated` is broadcast again.

---

## Reconnection

The client is configured with:
```js
reconnectionAttempts: 10
reconnectionDelay: 2000
```

After reconnection, the client should re-emit `presence:join` to rejoin the tenant room. The `BoardContext` subscribes to socket events and applies them to local state, so missed events during disconnection are resolved by calling `openBoard(boardId)` to refetch the full board state.

---

## Security Rules

- No unauthenticated socket connections are accepted
- `presence:join` always verifies DB membership — never trusts client-supplied IDs
- All broadcasts use `io.to('tenant:<tenantId>')` — cross-tenant leakage is impossible by design
- The server never echoes back private data to rooms the sender didn't join
