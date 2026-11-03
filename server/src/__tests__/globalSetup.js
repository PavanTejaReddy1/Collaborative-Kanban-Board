/**
 * globalSetup.js — runs once before any test file is loaded.
 * Sets env vars before any module is imported so config/env.js reads correct values.
 */
export function setup() {
  process.env.NODE_ENV             = 'test'
  process.env.MONGO_URI            = 'mongodb://localhost:27017/kanban_test'
  process.env.JWT_SECRET           = 'test_secret_key_at_least_32_characters_long!!'
  process.env.JWT_EXPIRES_IN       = '1h'
  process.env.CLIENT_ORIGIN        = 'http://localhost:5173'
  process.env.PORT                 = '5001'
  process.env.RATE_LIMIT_WINDOW_MS = '900000'
  process.env.RATE_LIMIT_MAX       = '1000'
}

export function teardown() {}
