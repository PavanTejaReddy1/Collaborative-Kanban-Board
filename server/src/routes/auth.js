import { Router } from 'express'
import { register, login, getMe, logout } from '../controllers/auth.controller.js'
import { authenticate } from '../middleware/authenticate.js'

const router = Router()

/**
 * Auth routes
 *
 * Public:
 *   POST /api/auth/register  – create account
 *   POST /api/auth/login     – sign in, receive JWT
 *
 * Protected (requires valid JWT):
 *   GET  /api/auth/me        – current user profile
 *   POST /api/auth/logout    – signal logout (client discards token)
 */

router.post('/register', register)
router.post('/login',    login)
router.get ('/me',       authenticate, getMe)
router.post('/logout',   authenticate, logout)

export default router
