/**
 * Vercel serverless entry point.
 *
 * Vercel runs Express apps as serverless functions — it handles the HTTP
 * server itself and just calls this handler with (req, res).
 * We export the Express app directly instead of calling app.listen().
 *
 * Socket.IO note: persistent WebSocket connections don't work on Vercel's
 * serverless infrastructure. We configure Socket.IO to use long-polling
 * only, which works fine with serverless (each poll is a new request).
 * For production real-time you'd use Render/Railway/Fly.io instead.
 */

// Must set env vars before importing app (dotenv reads process.env at import)
import { config } from 'dotenv'
config()

import { Server as SocketIOServer } from 'socket.io'
import { connectDatabase }    from '../src/config/database.js'
import app                    from '../src/app.js'
import { registerSocketHandlers } from '../src/sockets/handlers.js'

let isDbConnected = false
let io = null

// Lazy-connect to MongoDB on first request (serverless cold start)
async function ensureDb() {
  if (!isDbConnected) {
    await connectDatabase()
    isDbConnected = true
  }
}

// Attach Socket.IO once (module-level singleton)
if (!io) {
  io = new SocketIOServer({
    cors: {
      origin:      (process.env.CLIENT_ORIGIN || '').split(',').map(o => o.trim()),
      credentials: true,
    },
    // polling only — WebSocket upgrades require persistent connections
    transports: ['polling'],
    path: '/api/socket.io',
  })
  app.set('io', io)
  registerSocketHandlers(io)
}

// Vercel handler
export default async function handler(req, res) {
  await ensureDb()
  return app(req, res)
}
