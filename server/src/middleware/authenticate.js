import User from '../models/User.js'
import { verifyToken } from '../utils/jwt.js'

/**
 * authenticate
 *
 * Verifies the JWT in the Authorization header and attaches the full user
 * document to req.user. Any downstream middleware or controller can trust
 * that req.user is a genuine, active user from the database.
 *
 * Header format:  Authorization: Bearer <token>
 *
 * Errors returned:
 *   401 – No token provided
 *   401 – Token expired
 *   401 – Token invalid
 *   401 – User no longer exists or is deactivated
 */
export async function authenticate(req, res, next) {
  try {
    // 1. Extract token from Authorization header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      })
    }

    const token = authHeader.split(' ')[1]

    // 2. Verify JWT signature and expiry
    const result = verifyToken(token)
    if (!result.valid) {
      const message = result.expired
        ? 'Your session has expired. Please log in again.'
        : 'Invalid authentication token.'
      return res.status(401).json({ success: false, message })
    }

    // 3. Load the user from DB to ensure they still exist and are active.
    //    We deliberately do NOT embed full user data in the JWT — this
    //    ensures deactivated accounts are rejected on every request.
    const user = await User.findById(result.decoded.userId).select('-password')
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account not found or deactivated.',
      })
    }

    // 4. Attach the user to the request for downstream handlers
    req.user = user
    next()
  } catch (err) {
    next(err)
  }
}
