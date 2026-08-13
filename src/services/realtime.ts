import { useEffect, useState } from 'react'
import { getAuthToken } from '../utils/auth'
import { fetchConversations, fetchMessagingSettings } from './messageService'
import type { Message, MessageParticipant, MessageReaction, MessageReactionPreview } from '../types/messages'

const WS_URL = 'ws://localhost:5000/ws'

export type PresenceStatus = 'online' | 'away' | 'offline'

export type RealtimeEvent =
  | { type: 'message:new'; conversationId: string; message: Message }
  | { type: 'conversation:new'; conversationId: string }
  | { type: 'typing'; conversationId: string; userId: number; state: 'typing' | 'recording' | 'stop' }
  | { type: 'message:read'; conversationId: string; userId: number }
  | {
      type: 'message:reaction'
      conversationId: string
      messageId: string
      reactions: MessageReaction[]
      preview?: string
      previewReaction?: MessageReactionPreview | null
      lastActivityAt?: string
    }
  | { type: 'message:deleted'; conversationId: string; messageIds: string[] }
  | { type: 'conversation:members-changed'; conversationId: string; participants: MessageParticipant[] }
  | { type: 'conversation:member-removed'; conversationId: string }
  | { type: 'presence:update'; user: { id: string; presence: PresenceStatus; lastSeen?: string } }
  | { type: 'hello'; userId: number; role: string }

type Listener = (event: RealtimeEvent) => void

let ws: WebSocket | null = null
let reconnectTimer: number | null = null
let reconnectDelay = 1000
const listeners = new Set<Listener>()
let activeConversationId: string | null = null
let lastPresence: PresenceStatus | null = null

function emit(event: RealtimeEvent) {
  for (const listener of Array.from(listeners)) {
    try {
      listener(event)
    } catch {
      // ignore listener errors
    }
  }
}

function scheduleReconnect() {
  if (reconnectTimer) return
  if (!getAuthToken()) return
  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null
    connectRealtime()
  }, reconnectDelay)
  reconnectDelay = Math.min(reconnectDelay * 2, 15000)
}

export function connectRealtime() {
  const token = getAuthToken()
  if (!token) return
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return
  let socket: WebSocket
  try {
    socket = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`)
  } catch {
    scheduleReconnect()
    return
  }
  ws = socket
  socket.onopen = () => {
    reconnectDelay = 1000
    if (lastPresence) send({ type: 'presence', status: lastPresence })
  }
  socket.onmessage = (ev) => {
    try {
      const data = JSON.parse(ev.data as string)
      if (data && typeof data.type === 'string') emit(data as RealtimeEvent)
    } catch {
      // ignore malformed frames
    }
  }
  socket.onclose = () => {
    if (ws === socket) ws = null
    scheduleReconnect()
  }
  socket.onerror = () => {
    try {
      socket.close()
    } catch {
      // ignore
    }
  }
}

export function subscribeRealtime(listener: Listener): () => void {
  listeners.add(listener)
  connectRealtime()
  return () => {
    listeners.delete(listener)
  }
}

export function setActiveConversation(id: string | null) {
  activeConversationId = id
}

export function isActiveConversation(id: string): boolean {
  return activeConversationId === id
}

function send(payload: Record<string, unknown>) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload))
  }
}

export function sendTyping(conversationId: string, active: boolean) {
  send({ type: 'typing', conversationId, active })
}

export function sendRecording(conversationId: string, active: boolean) {
  send({ type: 'recording', conversationId, active })
}

export function sendPresence(status: PresenceStatus) {
  lastPresence = status
  // Make sure a socket actually exists: `send()` alone silently drops the
  // signal when the socket is null/CLOSED (and then the status would only go
  // out on the next heartbeat or reconnect). This forces an immediate connect
  // so the first visit to the Messages page reports `online` right away; if
  // the socket is already up this is a no-op, and if it is dead it bypasses
  // the reconnect backoff.
  connectRealtime()
  send({ type: 'presence', status })
}

/**
 * Shared realtime unread store for the Messages badge.
 * Kept module-level so the badge hook and the messages pages stay in sync:
 * - `message:new` events for conversations that are not currently open bump
 *   the count instantly (only received messages, never your own).
 * - `setConversationRead()` clears a conversation instantly when it is opened.
 * - A periodic API refresh keeps everything aligned with the server.
 */
const unreadListeners = new Set<() => void>()
let unreadMap = new Map<string, number>()
let unreadTotal = 0
let notifyNewMessage = true

function recalcUnread() {
  let total = 0
  for (const value of Array.from(unreadMap.values())) total += value
  unreadTotal = total
  for (const listener of Array.from(unreadListeners)) {
    try {
      listener()
    } catch {
      // ignore listener errors
    }
  }
}

export function refreshMessagingSettings() {
  fetchMessagingSettings()
    .then(settings => {
      notifyNewMessage = settings.notifyOnNewMessage !== false
    })
    .catch(() => {
      // keep the current value on transient errors
    })
    .finally(() => recalcUnread())
}

export function setConversationRead(conversationId: string) {
  if (unreadMap.get(conversationId)) {
    unreadMap.set(conversationId, 0)
    recalcUnread()
  }
}

export function useMessageUnread(): number {
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    const listener = () => forceUpdate(n => n + 1)
    unreadListeners.add(listener)
    connectRealtime()

    const refresh = async () => {
      try {
        const convs = await fetchConversations()
        unreadMap = new Map(convs.map(c => [c.id, c.unreadCount || 0]))
        recalcUnread()
      } catch {
        // transient network error, keep current value
      }
      refreshMessagingSettings()
    }

    refresh()
    const poll = window.setInterval(refresh, 20000)

    const unsubscribe = subscribeRealtime(event => {
      if (event.type === 'message:new') {
        if (!isActiveConversation(event.conversationId)) {
          unreadMap.set(event.conversationId, (unreadMap.get(event.conversationId) || 0) + 1)
          recalcUnread()
        }
      } else if (event.type === 'conversation:new') {
        refresh()
      }
    })

    return () => {
      unreadListeners.delete(listener)
      window.clearInterval(poll)
      unsubscribe()
    }
  }, [])

  return notifyNewMessage ? unreadTotal : 0
}
