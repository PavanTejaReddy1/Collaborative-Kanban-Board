import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'

import { env } from './config/env.js'
import healthRouter from './routes/health.js'
import authRouter   from './routes/auth.js'
import orgRouter    from './routes/organizations.js'
import boardRouter  from './routes/boards.js'

const app = express()

// ── Security headers ────────────────────────────────────────────────────────
app.use(helmet())

// ── CORS ────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: env.clientOrigin.split(',').map((o) => o.trim()),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// ── Rate limiting ────────────────────────────────────────────────────────────
app.use(rateLimit({
  windowMs: env.rateLimitWindowMs,
  max:      env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many requests, please try again later.' },
}))

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// ── Request logging (dev only) ───────────────────────────────────────────────
if (env.isDev) {
  app.use(morgan('dev'))
}

// ── Routes ────────────────────────────────────────────────────────────────────
// Root endpoint — useful for deployment health checks
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    name:    'Collaborative Kanban Board API',
    version: '1.0.0',
    status:  'running',
    docs:    '/api/health',
  })
})

app.use('/api',                healthRouter)
app.use('/api/auth',           authRouter)
app.use('/api/organizations',  orgRouter)
app.use('/api/organizations/:organizationId/tenants/:tenantId/boards', boardRouter)

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` })
})

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  const status  = err.status || err.statusCode || 500
  const message = env.isProd ? 'Internal server error' : (err.message || 'Internal server error')
  res.status(status).json({ success: false, message })
})

export default app
