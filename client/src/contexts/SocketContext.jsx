import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from './AuthContext.jsx'
import { initSocket, disconnectSocket, getSocket } from '../sockets/socket.js'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const { token, isAuthenticated } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState([])
  const socketRef = useRef(null)

  useEffect(() => {
    if (!isAuthenticated || !token) {
      disconnectSocket()
      setIsConnected(false)
      return
    }

    const s = initSocket(token)
    socketRef.current = s

    s.on('connect',    () => setIsConnected(true))
    s.on('disconnect', () => setIsConnected(false))
    s.on('presence:updated', ({ users }) => setOnlineUsers(users))

    return () => {
      s.off('connect')
      s.off('disconnect')
      s.off('presence:updated')
    }
  }, [isAuthenticated, token])

  const joinTenantRoom = useCallback((tenantId, organizationId) => {
    const s = getSocket()
    if (s?.connected) {
      s.emit('presence:join', { tenantId, organizationId })
    }
  }, [])

  const leaveTenantRoom = useCallback((tenantId) => {
    const s = getSocket()
    if (s?.connected) {
      s.emit('presence:leave', { tenantId })
    }
  }, [])

  const on = useCallback((event, handler) => {
    const s = getSocket()
    s?.on(event, handler)
    return () => s?.off(event, handler)
  }, [])

  return (
    <SocketContext.Provider value={{ isConnected, onlineUsers, joinTenantRoom, leaveTenantRoom, on, socket: socketRef }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const ctx = useContext(SocketContext)
  if (!ctx) throw new Error('useSocket must be used within SocketProvider')
  return ctx
}
