import mongoose from 'mongoose'
import { env } from './env.js'

/**
 * Connects to MongoDB using Mongoose.
 * Retries are handled automatically by Mongoose's built-in reconnect logic.
 * We expose a connect() function so index.js can await it before
 * starting the HTTP server — this prevents accepting traffic before
 * the DB is ready.
 */
export async function connectDatabase() {
  mongoose.connection.on('connected',    () => console.log('🍃 MongoDB connected'))
  mongoose.connection.on('disconnected', () => console.warn('⚠️  MongoDB disconnected'))
  mongoose.connection.on('error',        (err) => console.error('❌ MongoDB error:', err.message))

  await mongoose.connect(env.mongoUri, {
    // These are the recommended options for Mongoose 7+
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45_000,
  })
}
