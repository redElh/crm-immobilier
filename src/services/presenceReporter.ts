import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { sendPresence, type PresenceStatus } from './realtime'

export function isMessagesRoute(path: string): boolean {
  return path.startsWith('/messages') || path.includes('/messages')
}

function statusForPath(path: string): PresenceStatus {
  return isMessagesRoute(path) ? 'online' : 'away'
}

/**
 * Reports the current user's presence based on where they are in the CRM:
 * - Messages page        -> 'online'  ("En ligne")
 * - Any other page       -> 'away'    ("Inactif ...")
 * - Explicit logout call -> 'offline' ("Hors ligne")
 *
 * Mount once per layout (AgentLayout / AdminLayout).
 */
export function usePresenceReporter() {
  const location = useLocation()

  useEffect(() => {
    sendPresence(statusForPath(location.pathname))
  }, [location.pathname])

  useEffect(() => {
    const report = () => {
      sendPresence(statusForPath(window.location.pathname))
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendPresence('away')
      } else {
        report()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pagehide', () => sendPresence('away'))
    // Heartbeat: self-heal any presence signal that was lost (e.g. during a
    // reconnect the server may not have received the last status).
    const heartbeat = window.setInterval(report, 15000)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('pagehide', () => sendPresence('away'))
      window.clearInterval(heartbeat)
    }
  }, [])
}
