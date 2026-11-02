import { Router } from 'express'
import mongoose from 'mongoose'
import { env } from '../config/env.js'

const router = Router()

/**
 * GET /api/health
 *
 * Returns the operational status of the server and its dependencies.
 * Used by monitoring tools, load balancers, and the frontend
 * health-check page to confirm the API is reachable.
 */
router.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState
  // 0 = disconnected | 1 = connected | 2 = connecting | 3 = disconnecting
  const dbStatus = ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] ?? 'unknown'

  const payload = {
    success: true,
    status:  'ok',
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv,
    version: '1.0.0',
    services: {
      database: {
        status:  dbStatus,
        healthy: dbState === 1,
      },
      socket: {
        // io is set on app in index.js once the server is up
        status:  'active',
        healthy: true,
      },
    },
  }

  const httpStatus = dbState === 1 ? 200 : 503
  res.status(httpStatus).json(payload)
})

export default router
