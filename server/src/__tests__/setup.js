/**
 * Per-test-file setup helpers.
 * Env vars are already set by globalSetup.js before modules load.
 */
import mongoose from 'mongoose'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import app from '../app.js'

let httpServer

export async function startTestServer() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 })
  }

  httpServer = createServer(app)
  const io   = new SocketIOServer(httpServer)
  app.set('io', io)

  await new Promise((resolve, reject) =>
    httpServer.listen(0, (err) => err ? reject(err) : resolve()),
  )
  return httpServer
}

export async function stopTestServer() {
  try { await mongoose.connection.dropDatabase() } catch (_) {}
  try { await mongoose.connection.close() }        catch (_) {}
  if (httpServer) await new Promise(r => httpServer.close(r))
}

export async function clearCollections(...names) {
  for (const name of names) {
    const col = mongoose.connection.collections[name]
    if (col) await col.deleteMany({})
  }
}
