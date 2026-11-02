import 'dotenv/config'

/**
 * Centralised environment configuration.
 * All process.env reads are done here so the rest of the app
 * never accesses process.env directly, making it easy to validate
 * and mock in tests.
 */

function required(key) {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required environment variable: ${key}`)
  return value
}

export const env = {
  nodeEnv:   process.env.NODE_ENV || 'development',
  port:      parseInt(process.env.PORT || '5000', 10),

  mongoUri:  required('MONGO_URI'),

  jwtSecret:    required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',

  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMax:      parseInt(process.env.RATE_LIMIT_MAX       || '100',    10),

  isDev:  (process.env.NODE_ENV || 'development') === 'development',
  isProd: process.env.NODE_ENV === 'production',
}
