import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

/**
 * JWT utility helpers.
 *
 * We sign tokens with a payload that contains only non-sensitive identifiers.
 * The full user object is never embedded — instead, the middleware re-fetches
 * the user from the DB on protected routes so revoked/deactivated accounts
 * are handled correctly.
 */

/**
 * signToken(payload)
 * Signs a JWT using the secret and expiry from env.
 *
 * @param {object} payload  - Data to embed (userId, email)
 * @returns {string}          Signed JWT string
 */
export function signToken(payload) {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
    issuer:    'kanban-app',
  })
}

/**
 * verifyToken(token)
 * Verifies and decodes a JWT.
 *
 * @param {string} token
 * @returns {{ valid: true, decoded: object } | { valid: false, expired: boolean, error: string }}
 */
export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, env.jwtSecret, { issuer: 'kanban-app' })
    return { valid: true, decoded }
  } catch (err) {
    return {
      valid:   false,
      expired: err.name === 'TokenExpiredError',
      error:   err.message,
    }
  }
}
