import { io } from 'socket.io-client'

let socket = null

export function getSocket() {
  return socket
}

export function initSocket(token) {
  if (socket?.connected) return socket

  const socketUrl  = import.meta.env.VITE_SOCKET_URL
  const isVercel   = socketUrl?.includes('vercel.app')

  socket = io(socketUrl, {
    auth: { token },
    // On Vercel (serverless) websocket upgrades aren't supported — use polling only.
    // On Render/local we try websocket first for better performance.
    transports: isVercel ? ['polling'] : ['websocket', 'polling'],
    path: isVercel ? '/api/socket.io' : '/socket.io',
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    autoConnect: true,
  })

  socket.on('connect',       () => console.log('🔌 Socket connected:', socket.id))
  socket.on('disconnect', (r)  => console.log('🔌 Socket disconnected:', r))
  socket.on('connect_error',   (err) => console.warn('🔌 Socket error:', err.message))

  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
