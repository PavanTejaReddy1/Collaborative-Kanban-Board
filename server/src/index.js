import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'

import { env } from './config/env.js'
import { connectDatabase } from './config/database.js'
import app from './app.js'

async function bootstrap() {
  // 1. Connect to MongoDB.
  // In development we start the HTTP server even if the initial DB
  // connection fails so you can inspect the /api/health endpoint.
  // In production the process exits on failure so a container
  // orchestrator can restart it.
  try {
    await connectDatabase()
  } catch (err) {
    console.error('❌ Initial MongoDB connection failed:', err.message)
    if (env.isProd) {
      process.exit(1)
    }
    console.warn('⚠️  Starting server without DB (development mode). Fix MONGO_URI and restart.')
  }

  // 2. Create HTTP server wrapping the Express app
  const httpServer = createServer(app)

  // 3. Attach Socket.IO (handlers will be registered in a later milestone)
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin:      env.clientOrigin.split(',').map((o) => o.trim()),
      credentials: true,
    },
    // Use websocket first, fall back to polling
    transports: ['websocket', 'polling'],
  })

  // Expose io on app so controllers can emit events if needed
  app.set('io', io)

  // Placeholder — real socket handlers are registered in src/sockets/index.js
  io.on('connection', (socket) => {
    if (env.isDev) {
      console.log(`🔌 Socket connected: ${socket.id}`)
    }
    socket.on('disconnect', () => {
      if (env.isDev) {
        console.log(`🔌 Socket disconnected: ${socket.id}`)
      }
    })
  })

  // 4. Start listening
  httpServer.listen(env.port, () => {
    console.log(`🚀 Server running on port ${env.port} [${env.nodeEnv}]`)
  })
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start server:', err.message)
  process.exit(1)
})
