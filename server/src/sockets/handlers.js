import Membership from '../models/Membership.js'
import { verifyToken } from '../utils/jwt.js'
import User from '../models/User.js'
import mongoose from 'mongoose'

/**
 * Socket.IO handler registration.
 *
 * Security model:
 *  1. JWT verified on every socket connection (handshake auth).
 *  2. Tenant room join is verified against the Membership collection.
 *  3. Users can only join rooms for tenants they actually belong to.
 *  4. All broadcasts go to `tenant:<tenantId>` rooms — never to individuals
 *     or to rooms the broadcaster hasn't verified.
 *
 * Room naming:
 *   tenant:<tenantId>   – all users in a tenant
 */

// Track per-tenant online users: Map<tenantId, Map<userId, { name, email, socketId }>>
const presenceMap = new Map()

export function registerSocketHandlers(io) {

  // ── Connection-level JWT verification ────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1]

      if (!token) {
        return next(new Error('Authentication required.'))
      }

      const result = verifyToken(token)
      if (!result.valid) {
        return next(new Error(result.expired ? 'Token expired.' : 'Invalid token.'))
      }

      const user = await User.findById(result.decoded.userId).select('name email isActive')
      if (!user || !user.isActive) {
        return next(new Error('User not found or deactivated.'))
      }

      // Attach user to socket for use in event handlers
      socket.user = user
      next()
    } catch (err) {
      next(new Error('Authentication failed.'))
    }
  })

  // ── Per-socket event handlers ────────────────────────────────────────────
  io.on('connection', (socket) => {
    console.log(`🔌 Socket ${socket.id} connected — user: ${socket.user.email}`)

    // ── presence:join ──────────────────────────────────────────────────────
    // Client emits this to join a tenant room after connecting.
    // We verify membership before allowing the join.
    socket.on('presence:join', async ({ tenantId, organizationId }) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(tenantId) || !mongoose.Types.ObjectId.isValid(organizationId)) {
          socket.emit('error', { message: 'Invalid tenant or organization ID.' })
          return
        }

        // Verify membership
        const membership = await Membership.findOne({
          userId:         socket.user._id,
          organizationId: new mongoose.Types.ObjectId(organizationId),
          tenantId:       new mongoose.Types.ObjectId(tenantId),
        })

        // Also allow ORG_ADMINs (they have null tenantId org-level membership)
        const orgMembership = !membership
          ? await Membership.findOne({
              userId:         socket.user._id,
              organizationId: new mongoose.Types.ObjectId(organizationId),
              tenantId:       null,
            })
          : null

        if (!membership && !orgMembership) {
          socket.emit('error', { message: 'Not authorized to join this tenant room.' })
          return
        }

        const room = `tenant:${tenantId}`
        socket.join(room)

        // Track presence
        if (!presenceMap.has(tenantId)) presenceMap.set(tenantId, new Map())
        presenceMap.get(tenantId).set(socket.user._id.toString(), {
          userId:   socket.user._id,
          name:     socket.user.name,
          email:    socket.user.email,
          socketId: socket.id,
          joinedAt: new Date(),
        })

        // Notify everyone in the room
        const onlineUsers = Array.from(presenceMap.get(tenantId).values())
        io.to(room).emit('presence:updated', { users: onlineUsers })

        socket.emit('presence:joined', {
          tenantId,
          onlineUsers,
          message: `Joined tenant room.`,
        })

        // Store for cleanup on disconnect
        if (!socket.tenantRooms) socket.tenantRooms = []
        socket.tenantRooms.push({ tenantId, room })

        console.log(`👥 ${socket.user.email} joined room ${room}`)
      } catch (err) {
        console.error('presence:join error:', err.message)
        socket.emit('error', { message: 'Failed to join tenant room.' })
      }
    })

    // ── presence:leave ─────────────────────────────────────────────────────
    socket.on('presence:leave', ({ tenantId }) => {
      const room = `tenant:${tenantId}`
      socket.leave(room)
      removePresence(socket, tenantId, io)
    })

    // ── ping (keep-alive) ──────────────────────────────────────────────────
    socket.on('ping', () => socket.emit('pong'))

    // ── disconnect ─────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`🔌 Socket ${socket.id} disconnected — user: ${socket.user?.email}`)
      if (socket.tenantRooms) {
        for (const { tenantId } of socket.tenantRooms) {
          removePresence(socket, tenantId, io)
        }
      }
    })
  })
}

// ── Helper: remove user from presence and broadcast update ─────────────────
function removePresence(socket, tenantId, io) {
  if (!presenceMap.has(tenantId)) return

  const tenantPresence = presenceMap.get(tenantId)
  tenantPresence.delete(socket.user?._id?.toString())

  if (tenantPresence.size === 0) {
    presenceMap.delete(tenantId)
  } else {
    const room = `tenant:${tenantId}`
    const onlineUsers = Array.from(tenantPresence.values())
    io.to(room).emit('presence:updated', { users: onlineUsers })
  }
}
