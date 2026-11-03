# Security

## Authentication

- Passwords hashed with **bcryptjs** (12 salt rounds)
- Password field has `select: false` — never returned in queries by default
- JWT signed with `HS256`, configured expiry (default 7d), issuer claim `kanban-app`
- Login uses a **generic error message** ("Invalid email or password") for both wrong email and wrong password — prevents user enumeration
- Token stored in `localStorage` on the client (tradeoff: simple to implement; XSS mitigation via CSP headers recommended in production)
- Every protected request re-fetches the user from DB — deactivated accounts are rejected immediately without waiting for token expiry

## Authorization

### Middleware chain (every protected board request)

```
authenticate → resolveOrg → resolveTenant → requireRole → controller
```

- `authenticate`: verifies JWT + DB user lookup
- `resolveOrg`: verifies `Membership { userId, organizationId, tenantId: null }` — reads orgId from **URL param only**
- `resolveTenant`: verifies `Membership { userId, organizationId, tenantId }` — reads tenantId from **URL param only**. ORG_ADMINs get implicit access.
- `requireRole(...roles)`: checks `req.membershipRole || req.orgRole`

**Critical:** `organizationId` and `tenantId` are never read from `req.body`. Any client-supplied IDs in the body are ignored for authorization decisions.

## Tenant Isolation

Every DB query on business data includes the scoping fields:

```js
Task.find({ boardId, tenantId: req.tenantId, organizationId: req.organizationId })
```

Cross-tenant data access is structurally impossible — the middleware always sets `req.tenantId` and `req.organizationId` from verified membership, and the service layer always uses both.

## Concurrency

The `version` field on `Task` implements optimistic locking:

```js
Task.findOneAndUpdate(
  { _id, tenantId, organizationId, version: clientVersion },
  { $set: fields, $inc: { version: 1 } },
)
```

Returns HTTP `409` with the current task state if version mismatch is detected. This prevents lost updates in concurrent edit scenarios.

## Socket.IO Security

- JWT verified in Socket.IO middleware (`io.use(...)`) before `connection` fires
- `presence:join` always queries `Membership` — a socket cannot join a room it has no DB membership for
- All emits target `tenant:<tenantId>` room — global broadcast (`io.emit`) is never used for business data

## Input Validation

All request bodies are validated with **Joi** before reaching the service layer:
- `stripUnknown: true` — extra fields silently removed
- `abortEarly: false` — all errors collected and returned
- Schemas centralized in `utils/validation.js`

## Rate Limiting

Applied globally via `express-rate-limit`:
- Default: 100 requests per 15 minutes per IP
- Configurable via `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX` env vars

## Security Headers

`helmet` applied globally — sets:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security` (in production)
- `Content-Security-Policy`

## CORS

Configured with explicit allowed origins from `CLIENT_ORIGIN` env var. Credentials are allowed. No wildcard origins.

## Secrets

- JWT secret in `JWT_SECRET` env var — never hardcoded
- `.env` files excluded from git via `.gitignore`
- `.env.example` provided with placeholder values only

## Production Hardening Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use a strong, random `JWT_SECRET` (min 64 chars)
- [ ] Set `CLIENT_ORIGIN` to your exact frontend domain
- [ ] Use MongoDB Atlas with IP allowlist + auth
- [ ] Enable MongoDB TLS
- [ ] Add `X-Robots-Tag: noindex` if not public
- [ ] Consider short-lived access tokens (15 min) + refresh tokens in httpOnly cookies
- [ ] Enable CSP header to mitigate XSS
- [ ] Monitor with rate limiting alerts
