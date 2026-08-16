import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from 'react'
import { api } from '../services/api'

export interface NotificationItem {
  id: string
  userId: string
  senderName: string
  type: 'property_assigned' | 'contact_assigned' | 'prospect_assigned' | string
  message: string
  propertyId: string
  propertyRef: string
  read: boolean
  createdAt: string
  readAt?: string
}

interface NotificationContextValue {
  notifications: NotificationItem[]
  unreadCount: number
  setCurrentUserId: (id: string, name?: string) => void
  addNotification: (n: Omit<NotificationItem, 'id' | 'read' | 'createdAt'>) => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  setCurrentUserId: () => {},
  addNotification: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
})

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [currentUserId, setCurrentUserIdState] = useState<string | null>(null)
  const [currentUserName, setCurrentUserName] = useState<string | null>(null)

  const loadNotifications = useCallback(async (userId: string, userName?: string) => {
    try {
      const params: Record<string, string> = { user_id: userId }
      if (userName) params.user_name = userName
      const data = await api.get<any[]>('/notifications', params)
      setNotifications(data.map((n: any) => ({
        id: String(n.id),
        userId: n.userId,
        senderName: n.senderName,
        type: n.type,
        message: n.message,
        propertyId: n.propertyId,
        propertyRef: n.propertyRef,
        read: n.read,
        createdAt: n.createdAt,
      })))
    } catch {
      // silently fail — backend might not be available
    }
  }, [])

  const setCurrentUserId = useCallback((id: string, name?: string) => {
    setCurrentUserIdState(id)
    if (name) setCurrentUserName(name)
  }, [])

  useEffect(() => {
    if (currentUserId) {
      loadNotifications(currentUserId, currentUserName || undefined)
      const interval = setInterval(() => loadNotifications(currentUserId, currentUserName || undefined), 15000)
      return () => clearInterval(interval)
    }
  }, [currentUserId, currentUserName, loadNotifications])

  const addNotification = useCallback(async (n: Omit<NotificationItem, 'id' | 'read' | 'createdAt'>) => {
    try {
      const created = await api.post<any>('/notifications', n)
      const item: NotificationItem = {
        id: String(created.id),
        userId: created.userId,
        senderName: created.senderName,
        type: created.type,
        message: created.message,
        propertyId: created.propertyId,
        propertyRef: created.propertyRef,
        read: created.read,
        createdAt: created.createdAt,
      }
      setNotifications(prev => [item, ...prev])
    } catch {
      // fallback: add locally
      const item: NotificationItem = {
        ...n,
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        read: false,
        createdAt: new Date().toISOString(),
      }
      setNotifications(prev => [item, ...prev])
    }
  }, [])

  const markAsRead = useCallback(async (id: string) => {
    const now = new Date().toISOString()
    try {
      await api.patch(`/notifications/${id}/read`)
    } catch { /* ignore */ }
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true, readAt: now } : n))
    )
  }, [])

  const markAllAsRead = useCallback(async () => {
    const now = new Date().toISOString()
    if (currentUserId) {
      try {
        await api.patch(`/notifications/read-all?user_id=${currentUserId}`)
      } catch { /* ignore */ }
    }
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true, readAt: now }))
    )
  }, [currentUserId])

  const filtered = useMemo(() => {
    return notifications.filter(n => !n.read)
  }, [notifications])

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.read).length,
    [notifications]
  )

  const value = useMemo(
    () => ({ notifications: filtered, unreadCount, setCurrentUserId, addNotification, markAsRead, markAllAsRead }),
    [filtered, unreadCount, setCurrentUserId, addNotification, markAsRead, markAllAsRead]
  )

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationContext)
}
