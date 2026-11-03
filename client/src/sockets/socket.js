import { io } from 'socket.io-client'

let socket = null

export function getSocket() {
  return socket
}

export function initSocket(token) {
  if (socket?.connected) return socket

  socket = io(import.meta.env.VITE_SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    autoConnect: true,
  })

  socket.on('connect', () => console.log('🔌 Socket connected:', socket.id))
  socket.on('disconnect', (reason) => console.log('🔌 Socket disconnected:', reason))
  socket.on('connect_error', (err) => console.warn('🔌 Socket error:', err.message))

  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
