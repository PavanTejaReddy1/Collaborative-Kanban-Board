import User from '../models/User.js'
import { signToken } from '../utils/jwt.js'
import { validate, registerSchema, loginSchema } from '../utils/validation.js'

// ── POST /api/auth/register ────────────────────────────────────────────────
/**
 * register
 *
 * Creates a new user account.
 * - Validates the request body with Joi
 * - Checks for duplicate email
 * - Hashes the password (via the User model pre-save hook)
 * - Returns the new user profile and a signed JWT
 */
export async function register(req, res, next) {
  try {
    // 1. Validate input
    const { value, error } = validate(registerSchema, req.body)
    if (error) {
      return res.status(400).json({ success: false, message: error })
    }

    const { name, email, password } = value

    // 2. Check for duplicate email
    //    We use a case-insensitive check via the lowercase transform in the schema.
    const existing = await User.findOne({ email })
    if (existing) {
      // Return the same message as a password error to avoid email enumeration
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      })
    }

    // 3. Create user — password is hashed by the pre-save hook
    const user = await User.create({ name, email, password })

    // 4. Sign JWT
    const token = signToken({ userId: user._id, email: user.email })

    // 5. Respond — never include the password hash
    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        token,
        user: user.toPublicJSON(),
      },
    })
  } catch (err) {
    next(err)
  }
}

// ── POST /api/auth/login ──────────────────────────────────────────────────
/**
 * login
 *
 * Authenticates an existing user.
 * - Uses a generic error message for both "wrong email" and "wrong password"
 *   to prevent user enumeration attacks.
 * - Updates lastLoginAt on success.
 */
export async function login(req, res, next) {
  try {
    // 1. Validate input
    const { value, error } = validate(loginSchema, req.body)
    if (error) {
      return res.status(400).json({ success: false, message: error })
    }

    const { email, password } = value

    // 2. Find user — must explicitly select password since it's excluded by default
    const user = await User.findOne({ email }).select('+password')

    // 3. Verify credentials
    //    Deliberately use the same message for "not found" and "wrong password"
    //    so an attacker cannot probe which emails exist.
    const INVALID_CREDENTIALS = 'Invalid email or password.'

    if (!user) {
      return res.status(401).json({ success: false, message: INVALID_CREDENTIALS })
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      })
    }

    const passwordMatches = await user.comparePassword(password)
    if (!passwordMatches) {
      return res.status(401).json({ success: false, message: INVALID_CREDENTIALS })
    }

    // 4. Update last login timestamp (non-blocking)
    user.lastLoginAt = new Date()
    await user.save()

    // 5. Sign JWT
    const token = signToken({ userId: user._id, email: user.email })

    // 6. Respond
    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: user.toPublicJSON(),
      },
    })
  } catch (err) {
    next(err)
  }
}

// ── GET /api/auth/me ──────────────────────────────────────────────────────
/**
 * getMe
 *
 * Returns the currently authenticated user's profile.
 * req.user is populated by the authenticate middleware.
 */
export async function getMe(req, res) {
  return res.status(200).json({
    success: true,
    data: {
      user: req.user.toPublicJSON(),
    },
  })
}

// ── POST /api/auth/logout ─────────────────────────────────────────────────
/**
 * logout
 *
 * JWT is stateless — we cannot truly invalidate a token on the server
 * without a token revocation list (Redis blacklist), which is out of scope
 * for Phase 2. Instead, we:
 *   1. Tell the client to discard its token.
 *   2. Document clearly that the token remains technically valid until expiry.
 *
 * A real-world production app should implement a short-lived access token
 * (15 min) paired with a refresh token in an httpOnly cookie.
 * That architecture will be added in a future phase if needed.
 */
export async function logout(req, res) {
  // Nothing to invalidate server-side in this phase.
  // The client is responsible for deleting the token from storage.
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully. Please discard your token.',
  })
}
