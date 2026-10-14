import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Pin, Check, CheckCheck } from 'lucide-react'
import {
  Search, Plus, MessageSquare, MoreVertical, Star, Trash2, Send,
  ArrowLeft, Users, Home, Settings,
  X, ChevronDown, CornerUpRight, Download, Eye, Shield, Loader, Delete,
} from 'react-feather'
import type { Conversation, MessageParticipant, MessageKind, Message } from '../../types/messages'
import { cn, getAdminBasePath } from '../../lib/utils'
import { Avatar } from '../../components/modules/messages/Avatar'
import { MessageBubble, previewIcon } from '../../components/modules/messages/MessageBubble'
import { MessageMediaViewer } from '../../components/modules/messages/MessageMediaViewer'
import { ChatComposer } from '../../components/modules/messages/ChatComposer'
import { PresenceIndicator } from '../../components/modules/messages/PresenceIndicator'
import { GroupMembersModal } from '../../components/modules/messages/GroupMembersModal'
import { Select } from '../../components/ui/Select'
import { useToast } from '../../components/ui/Toast'
import {
  StageBadge,
  StageButton,
  OrbIcon,
  STAGE_HUES,
  useStageTheme,
} from '../../components/dashboard/Stage'
import {
  fetchCurrentUser, fetchConversations, fetchMessages, sendMessage,
  markConversationRead, deleteConversation, clearConversation, fetchMessageUsers, currentUserToParticipant,
  toggleReaction, deleteMessages, uploadAttachment, uploadVoice,
} from '../../services/messageService'
import {
  ensureE2EEIdentity,
  sealForConversation,
  prepareSealedMedia,
  normalizeMessage,
  normalizeMessages,
  cacheOwnSealed,
  checkContactIdentity,
  trustContactIdentity,
  storeFor,
  keyServer,
  withDecryptedPreview,
  innerKindOf,
  myIdFromToken,
} from '../../services/e2ee/conversation'
import {
  subscribeRealtime, sendTyping, sendRecording, setActiveConversation, setConversationRead, sendPresence,
} from '../../services/realtime'
import { useMessagingAppearance, messageZoomStyle } from '../../services/messageAppearance'

function isAdminRoute() {
  if (typeof window === 'undefined') return false
  return window.location.pathname.startsWith('/admin')
}

const EMPTY_PARTICIPANT: MessageParticipant = {
  id: '', name: '', type: 'agent', role: '', email: '', presence: 'offline',
}

type ListFilter = 'all' | 'unread' | 'starred' | 'attachments'

const FILTERS: { id: ListFilter; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'unread', label: 'Non lus' },
  { id: 'starred', label: 'Favoris' },
  { id: 'attachments', label: 'Pièces jointes' },
]

function formatListDate(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 1) return 'Hier'
  if (diffDays < 7) return d.toLocaleDateString('fr-FR', { weekday: 'short' })
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function dateSeparator(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return "Aujourd'hui"
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 1) return 'Hier'
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function realtimePreview(msg: Message): string {
  if (msg.kind === 'sealed' && !msg.sealedOk) return 'Message illisible'
  if (msg.kind === 'audio') return 'Message vocal'
  if (msg.attachments.length > 0) return msg.attachments[0].name
  return msg.body || 'Nouveau message'
}

function TypingBubble({ isDark }: { isDark: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start"
    >
      <div className={cn('rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1 border backdrop-blur-md', isDark ? 'bg-white/[0.06] border-white/10' : 'bg-white/80 border-teal-900/10')}>
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            className={cn('w-1.5 h-1.5 rounded-full', isDark ? 'bg-indigo-300' : 'bg-teal-600')}
            animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </motion.div>
  )
}

function RecordingBubble({ isDark }: { isDark: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start"
    >
      <div className={cn('rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2 border backdrop-blur-md', isDark ? 'bg-white/[0.06] border-white/10' : 'bg-white/80 border-teal-900/10')}>
        <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
        <span className={cn('text-xs', isDark ? 'text-slate-300' : 'text-slate-500')}>enregistre un message vocal...</span>
      </div>
    </motion.div>
  )
}

export default function MessagesPage() {
  const admin = isAdminRoute()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchParams] = useSearchParams()

  const [currentUser, setCurrentUser] = useState<MessageParticipant>(EMPTY_PARTICIPANT)
  const [agentReady, setAgentReady] = useState(false)

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [users, setUsers] = useState<MessageParticipant[]>([])
  const [localFlags, setLocalFlags] = useState<Record<string, { isStarred?: boolean; isPinned?: boolean }>>({})
  const [activeFilter, setActiveFilter] = useState<ListFilter>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [agentFilter, setAgentFilter] = useState('')
  // Open conversation — restored from the previous visit in this tab.
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    try {
      const raw = sessionStorage.getItem('msg:selected')
      if (!raw) return null
      const sep = raw.indexOf(':')
      if (sep < 0) return null
      const uid = raw.slice(0, sep)
      const cid = raw.slice(sep + 1)
      return uid && cid && uid === myIdFromToken() ? cid : null
    } catch {
      return null
    }
  })
  const [chatSearchOpen, setChatSearchOpen] = useState(false)
  const [chatSearch, setChatSearch] = useState('')
  const [moreMenu, setMoreMenu] = useState<'chat' | null>(null)
  const [membersModal, setMembersModal] = useState(false)
  const [listMenu, setListMenu] = useState<{ convId: string; x: number; y: number } | null>(null)
  const [assignTarget, setAssignTarget] = useState<string | null>(null)
  const [clearTarget, setClearTarget] = useState<string | null>(null)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [deleteTargets, setDeleteTargets] = useState<number[] | null>(null)
  const [viewerMessage, setViewerMessage] = useState<Message | null>(null)
  const [identityAlert, setIdentityAlert] = useState<{ contactId: string; contactName: string } | null>(null)
  const [trusting, setTrusting] = useState(false)
  const [presence, setPresence] = useState<'typing' | 'recording' | null>(null)
  const scrollAnchorRef = useRef<HTMLDivElement>(null)
  const selectedIdRef = useRef<string | null>(null)
  const currentUserIdRef = useRef<string>('')
  const presenceTimerRef = useRef<number | null>(null)
  const conversationsRef = useRef<Conversation[]>([])
  const chatMenuRef = useRef<HTMLDivElement>(null)
  const listMenuRef = useRef<HTMLDivElement>(null)

  // Collapse floating menus on outside click (independent of CSS containing blocks)
  useEffect(() => {
    if (moreMenu !== 'chat' && !listMenu) return
    const onPointerDown = (e: MouseEvent) => {
      const t = e.target as Element
      if (
        moreMenu === 'chat' &&
        chatMenuRef.current &&
        !chatMenuRef.current.contains(t) &&
        !(t.closest && t.closest('[data-chat-menu-toggle]'))
      ) {
        setMoreMenu(null)
      }
      if (
        listMenu &&
        listMenuRef.current &&
        !listMenuRef.current.contains(t) &&
        !(t.closest && t.closest('[data-conv-menu-toggle]'))
      ) {
        setListMenu(null)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [moreMenu, listMenu])

  const showPresence = (p: 'typing' | 'recording' | null) => {
    setPresence(p)
    if (presenceTimerRef.current) window.clearTimeout(presenceTimerRef.current)
    if (p) {
      presenceTimerRef.current = window.setTimeout(() => setPresence(null), 4000)
    }
  }

  const withFlags = (c: Conversation): Conversation => {
    const f = localFlags[c.id]
    if (!f) return c
    return { ...c, isStarred: f.isStarred ?? c.isStarred, isPinned: f.isPinned ?? c.isPinned }
  }

  // Load the real logged-in user + their conversations
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const me = await fetchCurrentUser()
        if (cancelled) return
        currentUserIdRef.current = String(me.id)
        setCurrentUser(currentUserToParticipant(me))
        const [convs, dir] = await Promise.all([
          fetchConversations(),
          admin ? fetchMessageUsers() : Promise.resolve([]),
        ])
        if (cancelled) return
        setConversations(convs.map(c => withDecryptedPreview(c, currentUserIdRef.current)))
        if (admin) setUsers(dir)
        // Decrypt last messages for list previews (cached ones already applied above).
        void (async () => {
          const myId = currentUserIdRef.current
          const updates = await Promise.all(convs.map(async c => {
            const last = [...(c.messages || [])].reverse().find(m => !m.deleted)
            if (!last || last.kind !== 'sealed' || last.sealedOk) return null
            try {
              const norm = await normalizeMessage(myId, last)
              return { convId: c.id, msg: norm }
            } catch {
              return null
            }
          }))
          if (!cancelled && updates.some(Boolean)) {
            setConversations(prev => prev.map(c => {
              const u = updates.find(x => x && x.convId === c.id)
              if (!u) return c
              const messages = c.messages.some(m => m.id === u.msg.id)
                ? c.messages.map(m => (m.id === u.msg.id ? u.msg : m))
                : [...c.messages, u.msg].sort((a, b) => a.sentAt.localeCompare(b.sentAt))
              return withDecryptedPreview({ ...c, messages }, myId)
            }))
          }
        })()
      } catch {
        if (!cancelled) toast('error', "Impossible de charger vos conversations. Vérifiez votre connexion.")
      } finally {
        if (!cancelled) setAgentReady(true)
      }
    }
    load()
    return () => { cancelled = true }
  }, [admin, toast])

  // E2EE identity: generate + publish once the user is known (never throws).
  useEffect(() => {
    if (currentUser.id) ensureE2EEIdentity(currentUser.id)
  }, [currentUser.id])

  // Auto-open conversation from ?id= (after compose)
  useEffect(() => {
    const id = searchParams.get('id')
    if (id && conversations.some(c => c.id === id)) {
      setSelectedId(id)
      navigate(admin ? `${getAdminBasePath()}/messages` : '/messages', { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, searchParams])

  // Keep a ref of the selected conversation + notify the unread badge hook
  useEffect(() => {
    selectedIdRef.current = selectedId
    setActiveConversation(selectedId)
    if (!selectedId) showPresence(null)
    return () => {
      if (presenceTimerRef.current) window.clearTimeout(presenceTimerRef.current)
    }
  }, [selectedId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => setActiveConversation(null), [])

  useEffect(() => {
    conversationsRef.current = conversations
  }, [conversations])

  const reloadConversations = useCallback(async () => {
    try {
      const convs = await fetchConversations()
      const myId = currentUserIdRef.current
      setConversations(prev => {
        const freshIds = new Set(convs.map(c => c.id))
        const removed = prev.filter(c => !freshIds.has(c.id))
        const merged = convs.map(fresh => {
          const old = prev.find(c => c.id === fresh.id)
          if (!old || old.messages.length === 0) return withDecryptedPreview(fresh, myId)
          const seen = new Set(fresh.messages.map(m => m.id))
          const leftovers = old.messages.filter(m => !seen.has(m.id))
          const messages = [...fresh.messages, ...leftovers]
            .sort((a, b) => a.sentAt.localeCompare(b.sentAt))
          // Re-apply cached plaintext: fresh envelopes must not clobber
          // already-decrypted content between polls.
          return withDecryptedPreview({ ...fresh, messages }, myId)
        })
        return [...removed, ...merged]
      })
      const id = selectedIdRef.current
      if (id) {
        const msgs = await fetchMessages(id)
        const norm = await normalizeMessages(currentUserIdRef.current, msgs)
        setConversations(prev => prev.map(c =>
          c.id === id ? { ...c, messages: norm, unreadCount: 0 } : c
        ))
      }
    } catch {
      // ignore transient polling errors
    }
  }, [])

  // Poll as a fallback for missed realtime events
  useEffect(() => {
    reloadConversations()
    const t = setInterval(reloadConversations, 12000)
    return () => clearInterval(t)
  }, [reloadConversations])

  // Realtime: instant message delivery + typing/recording indicators
  useEffect(() => {
    sendPresence('online')
    const unsubscribe = subscribeRealtime(event => {
      if (event.type === 'message:new') {
        // Decrypt off the state path (async), then merge with a dedupe check.
        normalizeMessage(currentUserIdRef.current, event.message).then(nmsg => {
          setConversations(prev => {
            const existing = prev.find(c => c.id === event.conversationId)
            if (!existing) return prev
            if (existing.messages.some(m => m.id === nmsg.id)) return prev
            const isOpen = event.conversationId === selectedIdRef.current
            if (isOpen) {
              markConversationRead(event.conversationId).catch(() => {})
            }
            const updated = {
              ...existing,
              messages: [...existing.messages, nmsg],
              lastActivityAt: nmsg.sentAt,
              preview: realtimePreview(nmsg),
              unreadCount: isOpen ? 0 : existing.unreadCount + 1,
            }
            return prev.map(c => (c.id === event.conversationId ? updated : c))
          })
        })
      } else if (event.type === 'conversation:new') {
        reloadConversations()
      } else if (event.type === 'conversation:members-changed') {
        reloadConversations()
      } else if (event.type === 'conversation:member-removed') {
        if (selectedIdRef.current === event.conversationId) {
          setSelectedId(null)
          setMoreMenu(null)
          setSelectionMode(false)
        }
        reloadConversations()
      } else if (event.type === 'typing') {
        if (event.conversationId !== selectedIdRef.current) return
        if (event.userId === Number(currentUserIdRef.current)) return
        showPresence(event.state === 'stop' ? null : (event.state as 'typing' | 'recording'))
      } else if (event.type === 'message:read') {
        reloadConversations()
      } else if (event.type === 'message:deleted') {
        setConversations(prev => prev.map(c => {
          if (c.id !== event.conversationId) return c
          const ids = new Set(event.messageIds)
          return { ...c, messages: c.messages.map(m => (ids.has(m.id) ? { ...m, deleted: true } : m)) }
        }))
      } else if (event.type === 'message:reaction') {
        setConversations(prev => prev.map(c => {
          if (c.id !== event.conversationId) return c
          const messages = c.messages.map(m =>
            m.id === event.messageId ? { ...m, reactions: event.reactions } : m
          )
          if (event.preview !== undefined && event.lastActivityAt !== undefined) {
            return {
              ...c,
              messages,
              preview: event.preview,
              previewReaction: event.previewReaction ?? null,
              lastActivityAt: event.lastActivityAt,
            }
          }
          return { ...c, messages }
        }))
      } else if (event.type === 'presence:update') {
        const { id: uid, presence, lastSeen } = event.user
        setConversations(prev => prev.map(c => {
          let changed = false
          const participants = c.participants.map(p => {
            if (p.id === uid && (p.presence !== presence || p.lastSeen !== lastSeen)) {
              changed = true
              return { ...p, presence, lastSeen }
            }
            return p
          })
          return changed ? { ...c, participants } : c
        }))
      }
    })
    return unsubscribe
  }, [reloadConversations])

  const visibleConversations = useMemo(() => {
    if (admin) return conversations
    return conversations.filter(c => c.participants.some(p => p.id === currentUser.id))
  }, [admin, conversations, currentUser.id])

  const filtered = useMemo(() => {
    let list = visibleConversations.map(withFlags)
    if (activeFilter === 'unread') list = list.filter(c => c.unreadCount > 0)
    if (activeFilter === 'starred') list = list.filter(c => c.isStarred)
    if (activeFilter === 'attachments') {
      list = list.filter(c => c.messages.some(m =>
        m.attachments.length > 0 || ['image', 'video', 'audio', 'file'].includes(m.kind ?? '') ||
        (m.kind === 'sealed' && !!m.sealedMedia)
      ))
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      list = list.filter(c =>
        c.subject.toLowerCase().includes(q) ||
        c.participants.some(p => p.name.toLowerCase().includes(q)) ||
        c.preview.toLowerCase().includes(q) ||
        c.messages.some(m => m.body.toLowerCase().includes(q))
      )
    }
    if (admin && agentFilter) {
      list = list.filter(c => c.createdBy === agentFilter || c.participants.some(p => p.id === agentFilter))
    }
    return [...list].sort((a, b) => {
      const pa = a.isPinned ? 1 : 0
      const pb = b.isPinned ? 1 : 0
      if (pa !== pb) return pb - pa
      return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
    })
  }, [visibleConversations, activeFilter, searchTerm, admin, agentFilter, localFlags])

  const selectedConv = useMemo(
    () => {
      const c = conversations.find(c => c.id === selectedId) ?? null
      return c ? withFlags(c) : null
    },
    [conversations, selectedId, localFlags]
  )

  const otherParticipant = (conv: Conversation): MessageParticipant => {
    if (conv.isGroup) {
      return {
        id: `group-${conv.id}`,
        name: conv.subject || 'Groupe',
        type: 'group',
        role: `${conv.participants.length} membres`,
        presence: 'offline',
      }
    }
    const others = conv.participants.filter(p => p.id !== currentUser.id)
    return others[0] || conv.participants[0]
  }

  const stats = useMemo(() => {
    const total = visibleConversations.length
    const unread = visibleConversations.reduce((s, c) => s + c.unreadCount, 0)
    const sentThisMonth = visibleConversations.reduce((s, c) =>
      s + c.messages.filter(m => m.sender.id === currentUser.id).length, 0
    )
    const starred = visibleConversations.filter(c => c.isStarred).length
    return { total, unread, sentThisMonth, starred }
  }, [visibleConversations, currentUser.id])

  // Mark conversation as read when opened (server-side + badge)
  useEffect(() => {
    if (!selectedId) return
    setConversationRead(selectedId)
    const conv = conversations.find(c => c.id === selectedId)
    if (!conv) return
    if (conv.unreadCount > 0) {
      setConversations(prev => prev.map(c =>
        c.id === selectedId
          ? { ...c, unreadCount: 0, messages: c.messages.map(m => (m.isRead ? m : { ...m, isRead: true })) }
          : c
      ))
      markConversationRead(selectedId).catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [selectedId, selectedConv?.messages.length, presence, chatSearch, selectedConv?.id])

  const updateConv = (id: string, fn: (c: Conversation) => Conversation) => {
    setConversations(prev => prev.map(c => (c.id === id ? fn(c) : c)))
  }

  const handleSendText = async (text: string) => {
    if (!selectedConv) return
    try {
      const myId = currentUser.id
      const attempt = await sealForConversation({ myId, participants: selectedConv.participants, text })
      const msg = await sendMessage(
        selectedConv.id,
        attempt.sealed ? { body: attempt.body, kind: 'sealed' } : { body: text }
      )
      if (attempt.sealed && attempt.payload) cacheOwnSealed(myId, msg.id, attempt.payload)
      const finalMsg = await normalizeMessage(myId, msg)
      const now = new Date().toISOString()
      updateConv(selectedConv.id, c => ({
        ...c, messages: [...c.messages, finalMsg], lastActivityAt: now,
        preview: text, unreadCount: 0,
      }))
    } catch {
      toast('error', "Impossible d'envoyer le message.")
    }
  }

  const handleSendVoice = async (duration: string, audioUrl?: string, audioSize?: string, blob?: Blob | null) => {
    if (!selectedConv) return
    try {
      const myId = currentUser.id
      if (blob) {
        const prepared = await prepareSealedMedia({
          myId,
          participants: selectedConv.participants,
          file: blob,
          filename: 'note-vocale.webm',
          mime: blob.type || 'audio/webm',
          upload: b => uploadVoice(b),
        })
        if (prepared.sealed && prepared.meta) {
          const attempt = await sealForConversation({
            myId, participants: selectedConv.participants, text: '', media: prepared.meta,
          })
          if (attempt.sealed && attempt.payload) {
            const msg = await sendMessage(selectedConv.id, {
              body: attempt.body, kind: 'sealed', duration,
              attachmentName: prepared.name, attachmentSize: prepared.size, attachmentUrl: prepared.url,
            })
            cacheOwnSealed(myId, msg.id, attempt.payload)
            const finalMsg = await normalizeMessage(myId, msg)
            const now = new Date().toISOString()
            updateConv(selectedConv.id, c => ({
              ...c, messages: [...c.messages, finalMsg], lastActivityAt: now, preview: 'Message vocal', unreadCount: 0,
            }))
            return
          }
        }
        // Plaintext fallback (single upload, right here).
        const plain = await uploadVoice(blob)
        const msg = await sendMessage(selectedConv.id, {
          kind: 'audio', duration, audioUrl: plain.url,
        })
        const now = new Date().toISOString()
        updateConv(selectedConv.id, c => ({
          ...c, messages: [...c.messages, msg], lastActivityAt: now, preview: 'Message vocal', unreadCount: 0,
        }))
        return
      }
      // Legacy path (no blob handed over).
      const msg = await sendMessage(selectedConv.id, {
        kind: 'audio', duration,
        ...(audioUrl
          ? { audioUrl }
          : { attachmentName: 'note_audio.m4a', attachmentSize: audioSize || '0.6 Mo' }),
      })
      const now = new Date().toISOString()
      updateConv(selectedConv.id, c => ({
        ...c, messages: [...c.messages, msg], lastActivityAt: now, preview: 'Message vocal', unreadCount: 0,
      }))
    } catch {
      toast('error', "Impossible d'envoyer le message vocal.")
    }
  }

  const handleAttach = async (kind: 'image' | 'video' | 'document' | 'audio', file: File): Promise<boolean> => {
    if (!selectedConv) return false
    const msgKind: MessageKind = kind === 'document' ? 'file' : kind
    const myId = currentUser.id
    try {
      const prepared = await prepareSealedMedia({
        myId,
        participants: selectedConv.participants,
        file,
        filename: file.name,
        mime: file.type || 'application/octet-stream',
        upload: b => uploadAttachment(b as File).then(u => ({ url: u.url, size: u.size })),
      })
      if (prepared.sealed && prepared.meta) {
        const attempt = await sealForConversation({
          myId, participants: selectedConv.participants, text: '', media: prepared.meta,
        })
        if (attempt.sealed && attempt.payload) {
          const msg = await sendMessage(selectedConv.id, {
            body: attempt.body, kind: 'sealed',
            attachmentName: prepared.name, attachmentSize: prepared.size, attachmentUrl: prepared.url,
          })
          cacheOwnSealed(myId, msg.id, attempt.payload)
          const finalMsg = await normalizeMessage(myId, msg)
          updateConv(selectedConv.id, c => ({
            ...c, messages: [...c.messages, finalMsg], lastActivityAt: new Date().toISOString(), preview: prepared.name, unreadCount: 0,
          }))
          return true
        }
      }
    } catch {
      toast('error', "Impossible de chiffrer la pièce jointe.")
      return false
    }
    let uploaded: { url: string; name: string; size: string }
    try {
      uploaded = await uploadAttachment(file)
    } catch {
      toast('error', "Impossible de télécharger le fichier.")
      return false
    }
    try {
      const msg = await sendMessage(selectedConv.id, {
        kind: msgKind,
        attachmentName: uploaded.name,
        attachmentSize: uploaded.size,
        attachmentUrl: uploaded.url,
      })
      updateConv(selectedConv.id, c => ({
        ...c, messages: [...c.messages, msg], lastActivityAt: new Date().toISOString(), preview: uploaded.name, unreadCount: 0,
      }))
      return true
    } catch {
      toast('error', "Impossible d'envoyer la pièce jointe.")
      return false
    }
  }

  const handleCapture = async (file: File): Promise<boolean> => {
    return handleAttach('image', file)
  }

  const handleReactionChange = async (messageId: string, emoji: string) => {
    if (!selectedConv) return
    try {
      const result = await toggleReaction(selectedConv.id, messageId, emoji)
      updateConv(selectedConv.id, c => ({
        ...c,
        messages: c.messages.map(m => (m.id === messageId ? { ...m, reactions: result.reactions } : m)),
        preview: result.preview,
        previewReaction: result.previewReaction,
        lastActivityAt: result.lastActivityAt,
      }))
    } catch {
      toast('error', "Impossible de réagir au message.")
    }
  }

  const toggleStar = (id: string) => {
    updateConv(id, c => ({ ...c, isStarred: !c.isStarred }))
    setLocalFlags(prev => ({ ...prev, [id]: { ...prev[id], isStarred: !(prev[id]?.isStarred ?? false) } }))
  }
  const togglePin = (id: string) => {
    updateConv(id, c => ({ ...c, isPinned: !c.isPinned }))
    setLocalFlags(prev => ({ ...prev, [id]: { ...prev[id], isPinned: !(prev[id]?.isPinned ?? false) } }))
  }

  const handleClearConversation = async (id: string) => {
    setClearTarget(null)
    setMoreMenu(null)
    setListMenu(null)
    setConversations(prev => prev.map(c => c.id === id ? { ...c, messages: [], unreadCount: 0, preview: '', previewReaction: null } : c))
    try {
      await clearConversation(id)
      reloadConversations()
    } catch {
      toast('error', "Impossible de vider la conversation.")
    }
  }

  const handleDeleteConversation = async (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id))
    if (selectedId === id) setSelectedId(null)
    setMoreMenu(null)
    setListMenu(null)
    try {
      await deleteConversation(id)
    } catch {
      toast('error', "Impossible de supprimer la conversation.")
    }
  }

  const handleDeleteMessages = async (ids: number[]) => {
    if (!selectedConv || ids.length === 0) return
    setDeleteTargets(null)
    setMoreMenu(null)
    setSelectionMode(false)
    setSelectedIds(new Set())
    const idSet = new Set(ids.map(String))
    updateConv(selectedConv.id, c => {
      const messages = c.messages.map(m => (idSet.has(m.id) ? { ...m, deleted: true } : m))
      const lastVisible = [...messages].reverse().find(m => !m.deleted)
      return {
        ...c,
        messages,
        preview: lastVisible ? realtimePreview(lastVisible) : '',
        previewReaction: lastVisible ? c.previewReaction : null,
      }
    })
    try {
      await deleteMessages(selectedConv.id, ids)
    } catch {
      toast('error', "Impossible de supprimer les messages sélectionnés.")
    }
  }

  // Safety number: warn when a DM contact publishes a new identity
  // (new device / cleared storage). Non-consuming check — burns no prekeys.
  useEffect(() => {
    setIdentityAlert(null)
    if (!selectedConv || selectedConv.isGroup || !currentUser.id) return
    const others = selectedConv.participants.filter(p => p.type !== 'group' && p.id !== currentUser.id)
    if (others.length !== 1) return
    const contact = others[0]
    const myId = currentUser.id
    let cancelled = false
    checkContactIdentity(storeFor(myId), keyServer, String(contact.id))
      .then(res => {
        if (!cancelled && res.changed) {
          setIdentityAlert({ contactId: String(contact.id), contactName: contact.name })
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [selectedConv?.id, currentUser.id])

  const handleTrustContact = async () => {
    if (!identityAlert || !currentUser.id) return
    setTrusting(true)
    try {
      const ok = await trustContactIdentity(storeFor(currentUser.id), keyServer, identityAlert.contactId)
      if (ok) {
        toast('success', `Clé de ${identityAlert.contactName} vérifiée — messages chiffrés réactivés.`)
        setIdentityAlert(null)
      } else {
        toast('error', 'Impossible de vérifier la clé pour le moment.')
      }
    } finally {
      setTrusting(false)
    }
  }

  // Leave selection mode whenever the conversation changes
  useEffect(() => {
    setSelectionMode(false)
    setSelectedIds(new Set())
  }, [selectedId])

  // Memorize the open conversation for this tab (restored on return).
  useEffect(() => {
    try {
      const uid = myIdFromToken()
      if (selectedId && uid) sessionStorage.setItem('msg:selected', `${uid}:${selectedId}`)
      else sessionStorage.removeItem('msg:selected')
    } catch {
      // private mode: memorization simply stays off
    }
  }, [selectedId])

  // Drop the memorized id when it no longer belongs to this user.
  useEffect(() => {
    if (!agentReady || !selectedId) return
    const visible = admin
      ? conversations
      : conversations.filter(c => c.participants.some(p => p.id === currentUser.id))
    if (!visible.some(c => c.id === selectedId)) setSelectedId(null)
  }, [agentReady, conversations, selectedId, admin, currentUser.id])

  // Delete key closes the open conversation back to the empty state.
  // Ignored while typing, selecting messages, or when a dialog is open.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Delete') return
      const el = document.activeElement as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return
      if (!selectedId) return
      if (selectionMode || viewerMessage || moreMenu || listMenu || deleteTargets || clearTarget || membersModal || assignTarget) return
      e.preventDefault()
      setSelectedId(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedId, selectionMode, viewerMessage, moreMenu, listMenu, deleteTargets, clearTarget, membersModal, assignTarget])

  const clearFilters = () => {
    setActiveFilter('all')
    setSearchTerm('')
    setAgentFilter('')
  }

  const hasActiveFilters = searchTerm || activeFilter !== 'all' || (admin && agentFilter)

  const basePath = admin ? getAdminBasePath() : ''
  const appearance = useMessagingAppearance()
  const zoomStyle = messageZoomStyle(appearance.messageSize)
  const theme = useStageTheme()
  const isDark = theme === 'dark'
  const stageInput = isDark
    ? 'bg-white/[0.05] border-white/10 text-white placeholder:text-slate-500 focus:bg-white/[0.07] focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/20'
    : 'bg-white border-teal-900/10 text-slate-900 placeholder:text-slate-400 focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/15'
  const chatWallpaper = isDark
    ? { backgroundImage: 'radial-gradient(rgba(148,163,184,0.12) 1px, transparent 1.4px)', backgroundSize: '18px 18px' }
    : { backgroundImage: 'radial-gradient(rgba(13,148,136,0.12) 1px, transparent 1.4px)', backgroundSize: '18px 18px' }

  return (
    <div className={cn('flex flex-col h-full w-full animate-fade-in', isDark ? 'stage-dark' : 'stage-light', appearance.theme === 'dark' && 'dark bg-background')} style={zoomStyle}>
      {/* Hero */}
      <div className="relative z-10 flex flex-wrap items-end justify-between gap-4 shrink-0 pb-5">
        <div className="flex items-center gap-3">
          <OrbIcon icon={MessageSquare} hue={STAGE_HUES.violet} size={48} radius={14} />
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
              </span>
              <p className={`text-[10px] font-bold uppercase tracking-[0.24em] ${isDark ? 'text-slate-400/80' : 'text-teal-900/50'}`}>
                Messagerie · Temps réel
              </p>
            </div>
            <h1 className={`mt-1 text-3xl font-extrabold tracking-tight ${isDark ? 'bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent' : 'bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-600 bg-clip-text text-transparent'}`}>
              Messagerie
            </h1>
            <p className={`mt-0.5 text-sm ${isDark ? 'text-slate-400' : 'text-teal-900/60'}`}>
              Communications en temps réel{stats.unread > 0 ? ` · ${stats.unread} non lu${stats.unread > 1 ? 's' : ''}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StageButton
            variant="glass"
            icon={<Settings size={14} />}
            onClick={() => navigate(`${basePath}/messages/settings`)}
            className="hidden sm:inline-flex"
          >
            Paramètres
          </StageButton>
          <StageButton
            variant="primary"
            icon={<Plus size={14} />}
            onClick={() => navigate(`${basePath}/messages/compose`)}
          >
            Nouvelle conversation
          </StageButton>
        </div>
      </div>

      {/* Admin stats */}
      {admin && (
        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0 pb-1">
          {[
            { label: 'Conversations', value: stats.total, sub: "dans l'agence", hue: STAGE_HUES.violet },
            { label: 'Non lus', value: stats.unread, sub: 'messages en attente', hue: STAGE_HUES.sky },
            { label: 'Messages envoyés', value: stats.sentThisMonth, sub: 'ce mois-ci', hue: STAGE_HUES.emerald },
            { label: 'Favoris', value: stats.starred, sub: 'conversations suivies', hue: STAGE_HUES.amber },
          ].map(stat => (
            <div key={stat.label} className="stage-glass px-4 py-3 flex items-center gap-3">
              <OrbIcon icon={MessageSquare} hue={stat.hue} size={38} radius={12} />
              <div className="min-w-0">
                <p className={`text-lg font-extrabold leading-tight tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{stat.value}</p>
                <p className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{stat.label} · {stat.sub}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chat layout */}
      <div className="relative z-10 flex-1 min-h-0 flex stage-glass overflow-hidden">
        {moreMenu === 'chat' && (
          <div
            aria-hidden="true"
            onClick={() => setMoreMenu(null)}
            className="absolute inset-0 z-[5] backdrop-blur-[2px]"
            style={{ background: isDark ? 'rgba(5,9,20,0.45)' : 'rgba(13,60,60,0.10)' }}
          />
        )}
        {/* Conversation list */}
        <aside className={cn('w-[330px] shrink-0 border-r flex flex-col min-h-0', isDark ? 'border-white/10' : 'border-teal-900/10')}>
          <div className={cn('p-3 border-b space-y-2.5', isDark ? 'border-white/10' : 'border-teal-900/10')}>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={15} className={cn('absolute left-3.5 top-1/2 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-slate-400')} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Rechercher une conversation..."
                  className={cn('w-full h-9 pl-9 pr-3 text-sm rounded-full border focus:outline-none transition-all', stageInput)}
                />
              </div>
              <button
                onClick={() => navigate(`${basePath}/messages/compose`)}
                className="w-9 h-9 rounded-full text-white flex items-center justify-center active:scale-95 transition-all"
                style={{
                  backgroundImage: isDark
                    ? 'linear-gradient(145deg, #8B7CFF 0%, #6C5ECF 60%, #5646C9 100%)'
                    : 'linear-gradient(145deg, #2DD4BF 0%, #14B8A6 60%, #0D9488 100%)',
                  boxShadow: isDark
                    ? 'inset 0 1px 0 rgba(255,255,255,0.4), 0 8px 20px -6px rgba(124,92,255,0.65)'
                    : 'inset 0 1px 0 rgba(255,255,255,0.5), 0 8px 20px -8px rgba(13,148,136,0.6)',
                }}
                title="Nouvelle conversation"
              >
                <Plus size={17} />
              </button>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin -mx-1 px-1">
              {FILTERS.map(filter => {
                const isActive = activeFilter === filter.id
                return (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-semibold rounded-full border transition-all whitespace-nowrap',
                      isActive
                        ? 'text-white border-transparent'
                        : isDark
                          ? 'text-slate-400 border-white/10 hover:text-white hover:border-white/25 hover:bg-white/5'
                          : 'text-slate-500 border-teal-900/10 bg-white/60 hover:text-teal-900 hover:border-teal-900/25'
                    )}
                    style={isActive ? {
                      backgroundImage: isDark
                        ? 'linear-gradient(135deg, #8B7CFF 0%, #6C5ECF 100%)'
                        : 'linear-gradient(135deg, #2DD4BF 0%, #0D9488 100%)',
                      boxShadow: isDark
                        ? 'inset 0 1px 0 rgba(255,255,255,0.35), 0 6px 16px -6px rgba(124,92,255,0.6)'
                        : 'inset 0 1px 0 rgba(255,255,255,0.5), 0 6px 16px -8px rgba(13,148,136,0.55)',
                    } : undefined}
                  >
                    {filter.label}
                  </button>
                )
              })}
            </div>

            {admin && (
              <div className="flex items-center gap-1.5">
                <div className="flex-1">
                  <Select
                    value={agentFilter}
                    onChange={(val: string) => setAgentFilter(val)}
                    options={[
                      { value: '', label: 'Tous les collaborateurs' },
                      ...users.map(a => ({ value: a.id, label: `${a.name} (${a.type === 'admin' ? 'Admin' : 'Agent'})` })),
                    ]}
                  />
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="p-1.5 rounded-md text-text-secondary hover:text-accent hover:bg-accent/5 transition-colors shrink-0"
                    title="Réinitialiser les filtres"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {!agentReady ? (
              <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
                <Loader size={24} className="animate-spin mb-3 text-accent" />
                <p className="text-xs">Chargement de vos conversations...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-text-secondary px-6 text-center">
                <MessageSquare size={30} className="mb-3 opacity-30" />
                <p className="text-sm font-medium">Aucune conversation</p>
                <p className="text-xs text-text-secondary/60 mt-1">
                  {admin
                    ? 'Essayez de modifier vos filtres ou de rechercher autrement.'
                    : 'Cliquez sur « Nouvelle conversation » pour échanger avec votre équipe.'}
                </p>
              </div>
            ) : (
              filtered.map(conv => {
                const other = otherParticipant(conv)
                const isSelected = selectedId === conv.id
                const hasUnread = conv.unreadCount > 0
                const lastMsg = conv.messages[conv.messages.length - 1]
                const lastKind = lastMsg?.kind
                // Decrypted sealed content displays like any message.
                const lastDecrypted = lastKind === 'sealed' && !!lastMsg?.sealedOk
                const lastDisplayKind = lastDecrypted ? innerKindOf(lastMsg) : lastKind
                const senderName = conv.isGroup && lastMsg ? lastMsg.sender.name.split(' ')[0] + ' : ' : ''
                return (
                  <div
                    key={conv.id}
                    onClick={() => {
                      // Second click on the open conversation closes it.
                      setSelectedId(selectedId === conv.id ? null : conv.id)
                      setChatSearchOpen(false); setChatSearch(''); setMoreMenu(null)
                    }}
                    className={cn(
                      'relative flex items-center gap-3 px-3 py-3 border-b cursor-pointer transition-colors group',
                      isDark ? 'border-white/5' : 'border-teal-900/5',
                      isSelected
                        ? isDark ? 'bg-violet-400/10' : 'bg-teal-500/10'
                        : isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-white/60'
                    )}
                  >
                    {isSelected && (
                      <span
                        className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full"
                        style={{
                          backgroundImage: isDark
                            ? 'linear-gradient(180deg, #8B7CFF, #5B4BD4)'
                            : 'linear-gradient(180deg, #2DD4BF, #0D9488)',
                          boxShadow: isDark ? '0 0 12px rgba(124,92,255,0.65)' : '0 0 12px rgba(13,148,136,0.55)',
                        }}
                      />
                    )}
                    <Avatar participant={other} showPresence size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn('flex items-center gap-1.5 text-sm truncate', hasUnread ? 'font-bold' : 'font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                          {other.name}
                          {other.type !== 'client' && other.type !== 'group' && (
                            <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide shrink-0 border', isDark ? 'bg-violet-400/10 text-indigo-300 border-violet-400/25' : 'bg-teal-500/10 text-teal-700 border-teal-500/25')}>
                              {other.type === 'admin' ? 'Admin' : 'Agent'}
                            </span>
                          )}
                        </span>
                        <span className={cn('text-[10px] whitespace-nowrap shrink-0', isDark ? 'text-slate-500' : 'text-slate-400')}>
                          {formatListDate(conv.lastActivityAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <span className={cn('flex items-center gap-1 text-xs truncate', hasUnread ? 'font-medium' : '', isDark ? (hasUnread ? 'text-slate-200' : 'text-slate-500') : (hasUnread ? 'text-slate-700' : 'text-slate-500'))}>
                          {conv.previewReaction ? (
                            <span className="truncate">
                              {conv.previewReaction.name} a réagi {conv.previewReaction.emoji} à « {conv.previewReaction.message} »
                            </span>
                          ) : (
                            <>
                              {previewIcon(lastDisplayKind)}
                              <span className="truncate">{senderName}{hasUnread && lastMsg && (lastKind === 'text' || lastDecrypted) ? (lastMsg.body || conv.preview) : conv.preview}</span>
                            </>
                          )}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {conv.isPinned && <Pin size={11} className={isDark ? 'text-slate-500' : 'text-slate-400'} />}
                          {conv.isStarred && <Star size={11} className="text-amber-500 fill-amber-500" />}
                          {hasUnread && (
                            <span
                              className="px-1.5 py-0.5 text-[9px] font-bold rounded-full text-white leading-none min-w-[18px] text-center"
                              style={{
                                backgroundImage: isDark
                                  ? 'linear-gradient(135deg, #8B7CFF 0%, #6C5ECF 100%)'
                                  : 'linear-gradient(135deg, #2DD4BF 0%, #0D9488 100%)',
                                boxShadow: isDark ? '0 0 10px rgba(124,92,255,0.55)' : '0 0 10px rgba(13,148,136,0.5)',
                              }}
                            >
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {admin && (
                      <button
                        data-conv-menu-toggle
                        onClick={e => {
                          e.stopPropagation()
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                          setListMenu(
                            listMenu?.convId === conv.id
                              ? null
                              : { convId: conv.id, x: rect.right - 184, y: rect.bottom + 4 }
                          )
                        }}
                        className={cn('p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100 shrink-0', isDark ? 'text-slate-500 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-teal-900 hover:bg-teal-900/5')}
                        title="Actions"
                      >
                        <MoreVertical size={15} />
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </aside>

        {/* Chat view */}
        <section className={cn('flex-1 min-w-0 flex flex-col', isDark ? 'bg-white/[0.015]' : 'bg-white/40')}>
          {selectedConv ? (
            <>
              {/* Chat header */}
              <div className={cn('relative flex items-center gap-3 px-4 py-3 border-b backdrop-blur-md shrink-0 z-10', isDark ? 'border-white/10 bg-white/[0.02]' : 'border-teal-900/10 bg-white/60')}>
                <span aria-hidden="true" className="pointer-events-none absolute inset-x-8 bottom-0 h-px" style={{ background: isDark ? 'linear-gradient(90deg, transparent, rgba(139,124,255,0.55), rgba(94,234,212,0.3), transparent)' : 'linear-gradient(90deg, transparent, rgba(45,212,191,0.55), rgba(124,92,255,0.3), transparent)' }} />
                <button
                  onClick={() => setSelectedId(null)}
                  className={cn('lg:hidden p-1.5 rounded-lg transition-colors', isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-teal-900 hover:bg-teal-900/5')}
                  title="Retour"
                >
                  <ArrowLeft size={18} />
                </button>
                <Avatar participant={otherParticipant(selectedConv)} showPresence={!selectedConv.isGroup} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={cn('text-sm font-bold tracking-tight truncate', isDark ? 'text-white' : 'text-slate-900')}>{otherParticipant(selectedConv).name}</h3>
                    {selectedConv.isGroup && (
                      <span className={cn('flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md border', isDark ? 'bg-violet-400/10 text-indigo-300 border-violet-400/25' : 'bg-teal-500/10 text-teal-700 border-teal-500/25')}>
                        <Users size={9} /> Groupe
                      </span>
                    )}
                  </div>
                  <p className={cn('text-[11px] flex items-center gap-1.5 truncate', presence ? cn('font-semibold', isDark ? 'text-indigo-300' : 'text-teal-700') : isDark ? 'text-slate-400' : 'text-slate-500')}>
                    {presence === 'recording' ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse" />
                        enregistre un message vocal...
                      </>
                    ) : presence === 'typing' ? (
                      <>
                        <span className="flex items-center gap-0.5">
                          <span className="w-1 h-1 rounded-full bg-accent animate-pulse" />
                          <span className="w-1 h-1 rounded-full bg-accent animate-pulse" style={{ animationDelay: '150ms' }} />
                          <span className="w-1 h-1 rounded-full bg-accent animate-pulse" style={{ animationDelay: '300ms' }} />
                        </span>
                        en train d'écrire...
                      </>
                    ) : selectedConv.isGroup ? (
                      <span>{selectedConv.participants.filter(p => p.type !== 'group').length} membres</span>
                    ) : (
                      <PresenceIndicator participant={otherParticipant(selectedConv)} />
                    )}
                  </p>
                </div>

                {selectedConv.relatedPropertyTitle && (
                  <button
                    onClick={() => navigate(`${basePath}/properties/${selectedConv.relatedPropertyId}`)}
                    className={cn('hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border backdrop-blur-md transition-colors shrink-0', isDark ? 'text-indigo-300 bg-violet-400/10 hover:bg-violet-400/20 border-violet-400/25' : 'text-teal-700 bg-teal-500/10 hover:bg-teal-500/20 border-teal-500/25')}
                  >
                    <Home size={12} />
                    {selectedConv.relatedPropertyTitle}
                  </button>
                )}

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setChatSearchOpen(o => !o)}
                    className={cn('p-2 rounded-xl border transition-colors', chatSearchOpen
                      ? isDark ? 'text-indigo-300 bg-violet-400/10 border-violet-400/30' : 'text-teal-700 bg-teal-500/10 border-teal-500/30'
                      : isDark ? 'text-slate-400 border-transparent hover:text-white hover:bg-white/5 hover:border-white/10' : 'text-slate-500 border-transparent hover:text-teal-900 hover:bg-teal-900/5 hover:border-teal-900/10')}
                    title="Rechercher dans la conversation"
                  >
                    <Search size={17} />
                  </button>
                  <button
                    data-chat-menu-toggle
                    onClick={() => setMoreMenu(moreMenu === 'chat' ? null : 'chat')}
                    className={cn('p-2 rounded-xl border transition-colors', moreMenu === 'chat'
                      ? isDark ? 'text-indigo-300 bg-violet-400/10 border-violet-400/30' : 'text-teal-700 bg-teal-500/10 border-teal-500/30'
                      : isDark ? 'text-slate-400 border-transparent hover:text-white hover:bg-white/5 hover:border-white/10' : 'text-slate-500 border-transparent hover:text-teal-900 hover:bg-teal-900/5 hover:border-teal-900/10')}
                    title="Plus d'options"
                  >
                    <MoreVertical size={17} />
                  </button>
                </div>

                <AnimatePresence>
                  {moreMenu === 'chat' && (
                    <motion.div
                      ref={chatMenuRef}
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.14 }}
                        className="!absolute right-3 top-14 z-30 w-56 stage-glass rounded-2xl p-1.5"
                      >
                        {[
                          ...(selectedConv.isGroup && selectedConv.createdBy === currentUser.id
                            ? [{ icon: <Users size={14} />, label: 'Gérer les membres', action: () => { setMembersModal(true); setMoreMenu(null) } }]
                            : []),
                          { icon: <Check size={14} />, label: selectionMode ? 'Annuler la sélection' : 'Sélectionner des messages', action: () => { setSelectionMode(s => !s); setSelectedIds(new Set()); setMoreMenu(null) } },
                          { icon: <Delete size={14} />, label: 'Vider la conversation', action: () => { setClearTarget(selectedConv.id); setMoreMenu(null) } },
                          { icon: <Pin size={14} />, label: selectedConv.isPinned ? 'Désépingler la conversation' : 'Épingler la conversation', action: () => { togglePin(selectedConv.id); setMoreMenu(null) } },
                          { icon: <Star size={14} />, label: selectedConv.isStarred ? 'Retirer des favoris' : 'Ajouter aux favoris', action: () => { toggleStar(selectedConv.id); setMoreMenu(null) } },
                          { icon: <Search size={14} />, label: 'Rechercher dans la conversation', action: () => { setChatSearchOpen(true); setMoreMenu(null) } },
                          { icon: <CornerUpRight size={14} />, label: 'Transférer', action: () => { setMoreMenu(null) } },
                          { icon: <Download size={14} />, label: 'Exporter la conversation', action: () => { setMoreMenu(null) } },
                          { icon: <Trash2 size={14} />, label: 'Supprimer la conversation', action: () => handleDeleteConversation(selectedConv.id), danger: true },
                        ].map(item => (
                          <button
                            key={item.label}
                            onClick={item.action}
                            className={cn(
                              'w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl transition-colors',
                              (item as any).danger
                                ? 'text-error hover:bg-error/5'
                                : isDark ? 'text-slate-200 hover:bg-white/5' : 'text-slate-700 hover:bg-teal-900/5'
                            )}
                          >
                            {item.icon} {item.label}
                          </button>
                        ))}
                      </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* In-chat search */}
              <AnimatePresence>
                {chatSearchOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className={cn('overflow-hidden border-b', isDark ? 'border-white/10 bg-white/[0.02]' : 'border-teal-900/10 bg-white/60')}
                  >
                    <div className="px-4 py-2 flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search size={14} className={cn('absolute left-3 top-1/2 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-slate-400')} />
                        <input
                          type="text"
                          value={chatSearch}
                          onChange={e => setChatSearch(e.target.value)}
                          placeholder="Rechercher dans cette conversation..."
                          autoFocus
                          className={cn('w-full h-8 pl-9 pr-3 text-sm rounded-full border focus:outline-none transition-colors', stageInput)}
                        />
                      </div>
                      <button
                        onClick={() => { setChatSearchOpen(false); setChatSearch('') }}
                        className="text-[11px] font-medium text-text-secondary hover:text-text transition-colors shrink-0"
                      >
                        Fermer
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Safety-number change: contact re-registered elsewhere */}
              <AnimatePresence>
                {identityAlert && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className={cn('overflow-hidden border-b shrink-0', isDark ? 'border-amber-400/20 bg-amber-400/[0.05]' : 'border-amber-500/20 bg-amber-50/80')}
                  >
                    <div className="px-4 py-2.5 flex items-center gap-2.5">
                      <Shield size={15} className="text-amber-500 shrink-0" />
                      <p className={cn('flex-1 min-w-0 text-xs leading-snug', isDark ? 'text-amber-200/90' : 'text-amber-800')}>
                        La clé de sécurité de <span className="font-bold">{identityAlert.contactName}</span> a changé
                        (nouvel appareil&nbsp;?). Vérifiez son identité avant de continuer à échanger.
                      </p>
                      <button
                        onClick={handleTrustContact}
                        disabled={trusting}
                        className={cn('px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 disabled:opacity-50 text-white',
                          isDark ? 'bg-gradient-to-b from-[#8B7CFF] to-[#5646C9] shadow-[0_0_12px_rgba(124,92,255,0.5)]' : 'bg-gradient-to-b from-teal-400 to-emerald-600 shadow-[0_0_12px_rgba(20,184,166,0.4)]')}
                      >
                        {trusting ? 'Vérification…' : 'Faire confiance'}
                      </button>
                      <button
                        onClick={() => setIdentityAlert(null)}
                        className={cn('p-1.5 rounded-lg transition-colors shrink-0', isDark ? 'text-slate-500 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-700 hover:bg-black/5')}
                        title="Ignorer pour cette conversation"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto scrollbar-thin px-4 sm:px-6 py-4 relative" style={chatWallpaper}>
                <div className="space-y-1.5 max-w-4xl mx-auto">
                  {(() => {
                    const messages = chatSearch
                      ? selectedConv.messages.filter(m => m.body.toLowerCase().includes(chatSearch.toLowerCase()))
                      : selectedConv.messages
                    if (chatSearch && messages.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
                          <Search size={28} className="mb-2 opacity-30" />
                          <p className="text-sm">Aucun message trouvé pour « {chatSearch} »</p>
                        </div>
                      )
                    }
                    let lastDateKey = ''
                    let lastSenderId = ''
                    return messages.map((msg, i) => {
                      const isMine = msg.sender.id === currentUser.id
                      const dateKey = new Date(msg.sentAt).toDateString()
                      const showDate = dateKey !== lastDateKey
                      lastDateKey = dateKey
                      const showSender = selectedConv.isGroup && !isMine && msg.sender.id !== lastSenderId
                      if (showSender) lastSenderId = msg.sender.id
                      return (
                        <div key={msg.id}>
                          {showDate && (
                            <div className="flex items-center justify-center my-4">
                              <StageBadge variant="neutral">{dateSeparator(msg.sentAt)}</StageBadge>
                            </div>
                          )}
                          <MessageBubble
                            message={msg}
                            isMine={isMine}
                            showSenderName={showSender}
                            senderIsGroupAdmin={selectedConv.isGroup && msg.sender.id === selectedConv.createdBy}
                            onReactionChange={handleReactionChange}
                            onOpenMedia={setViewerMessage}
                            selectionMode={selectionMode}
                            selected={selectedIds.has(Number(msg.id))}
                            toggleSelect={() => {
                              const id = Number(msg.id)
                              setSelectedIds(prev => {
                                const next = new Set(prev)
                                if (next.has(id)) next.delete(id)
                                else next.add(id)
                                return next
                              })
                            }}
                          />
                        </div>
                      )
                    })
                  })()}

                  {presence === 'typing' && <TypingBubble isDark={isDark} />}
                  {presence === 'recording' && <RecordingBubble isDark={isDark} />}

                  <div ref={scrollAnchorRef} />
                </div>
              </div>

              {/* Selection action bar */}
              {selectionMode && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mx-4 sm:mx-6 mb-3 flex items-center justify-between gap-2 px-3 py-2 rounded-2xl stage-glass shrink-0"
                >
                  <span className="text-xs text-text-secondary truncate">
                    {selectedIds.size > 0
                      ? `${selectedIds.size} message${selectedIds.size > 1 ? 's' : ''} sélectionné${selectedIds.size > 1 ? 's' : ''}`
                      : 'Sélectionnez des messages'}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setSelectionMode(false)}
                      className={cn('px-3 py-1.5 text-xs font-medium rounded-lg transition-colors', isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-teal-900 hover:bg-teal-900/5')}
                    >
                      Annuler
                    </button>
                    <button
                      disabled={selectedIds.size === 0}
                      onClick={() => setDeleteTargets(Array.from(selectedIds))}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                        selectedIds.size === 0
                          ? 'text-text-secondary/40 cursor-not-allowed'
                          : 'text-error bg-error/5 hover:bg-error/10'
                      )}
                    >
                      <Trash2 size={13} />
                      Supprimer
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Composer */}
              <ChatComposer
                onSendText={handleSendText}
                onSendVoice={handleSendVoice}
                onAttach={handleAttach}
                onCapture={handleCapture}
                showEmojis={appearance.showEmojis}
                deferUpload
                onTypingChange={active => {
                  if (selectedConv) sendTyping(selectedConv.id, active)
                }}
                onRecordingChange={active => {
                  if (selectedConv) sendRecording(selectedConv.id, active)
                }}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="mb-5"
              >
                <OrbIcon icon={MessageSquare} hue={STAGE_HUES.violet} size={88} radius={24} />
              </motion.div>
              <h2 className={`text-lg font-extrabold tracking-tight ${isDark ? 'bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent' : 'text-slate-900'}`}>Sélectionnez une conversation</h2>
              <p className={`text-sm max-w-sm mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Choisissez une discussion dans la liste pour consulter vos échanges et envoyer des messages en temps réel.
              </p>
              <StageButton
                variant="primary"
                size="md"
                icon={<Plus size={15} />}
                onClick={() => navigate(`${basePath}/messages/compose`)}
                className="mt-6"
              >
                Nouvelle conversation
              </StageButton>
            </div>
          )}
        </section>
      </div>

      {/* Admin conversation context menu (list) */}
      {admin && listMenu && (() => {
        const conv = conversations.find(c => c.id === listMenu.convId)
        if (!conv) return null
        const listActions = [
          { icon: <Eye size={14} />, label: 'Marquer comme lu', action: () => { setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c)); setListMenu(null) } },
          { icon: <Delete size={14} />, label: 'Vider la conversation', action: () => { setClearTarget(conv.id); setListMenu(null) } },
          { icon: <Pin size={14} />, label: conv.isPinned ? 'Désépingler' : 'Épingler', action: () => { togglePin(conv.id); setListMenu(null) } },
          { icon: <Star size={14} />, label: conv.isStarred ? 'Retirer des favoris' : 'Ajouter aux favoris', action: () => { toggleStar(conv.id); setListMenu(null) } },
          { icon: <Users size={14} />, label: 'Affecter à un agent', action: () => { setAssignTarget(conv.id); setListMenu(null) } },
          { icon: <Download size={14} />, label: 'Exporter la conversation', action: () => setListMenu(null) },
          { icon: <Trash2 size={14} />, label: 'Supprimer', danger: true, action: () => handleDeleteConversation(conv.id) },
        ]
        return (
            <motion.div
              ref={listMenuRef}
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.14 }}
              style={{ position: 'fixed', left: listMenu.x, top: listMenu.y }}
              className="z-50 w-52 stage-glass rounded-2xl p-1.5"
            >
              {listActions.map(item => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl transition-colors',
                    (item as any).danger
                      ? 'text-error hover:bg-error/5'
                      : isDark ? 'text-slate-200 hover:bg-white/5' : 'text-slate-700 hover:bg-teal-900/5'
                  )}
                >
                  {item.icon} {item.label}
                </button>
              ))}
            </motion.div>
        )
      })()}

      {/* Assign modal */}
      {admin && assignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAssignTarget(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.16 }}
            className="relative stage-glass rounded-2xl p-5 w-80"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={cn('text-sm font-bold', isDark ? 'text-white' : 'text-slate-900')}>Affecter la conversation</h3>
              <button onClick={() => setAssignTarget(null)} className={cn('p-1.5 rounded-lg transition-colors', isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-teal-900 hover:bg-teal-900/5')}>
                <X size={15} />
              </button>
            </div>
            <div className="space-y-1">
              {users.filter(d => d.type !== 'admin').map(a => (
                <button
                  key={a.id}
                  onClick={() => setAssignTarget(null)}
                  className={cn('w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors', isDark ? 'hover:bg-white/5' : 'hover:bg-teal-900/5')}
                >
                  <Avatar participant={{ id: a.id, name: a.name, type: a.type, role: a.role }} />
                  <div className="text-left">
                    <p className="text-sm font-medium text-text">{a.name}</p>
                    <p className="text-[11px] text-text-secondary">{a.role}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Clear conversation confirmation */}
      {clearTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setClearTarget(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.16 }}
            className="relative stage-glass rounded-2xl p-6 w-full max-w-sm"
          >
            <h3 className={cn('text-base font-extrabold tracking-tight mb-2', isDark ? 'text-white' : 'text-slate-900')}>Vider la conversation ?</h3>
            <p className={cn('text-sm leading-relaxed mb-5', isDark ? 'text-slate-400' : 'text-slate-500')}>
              Les messages seront supprimés de votre vue uniquement. L'autre participant continuera de les voir.
            </p>
            <div className="flex items-center justify-end gap-2">
              <StageButton variant="glass" onClick={() => setClearTarget(null)}>
                Annuler
              </StageButton>
              <button
                onClick={() => handleClearConversation(clearTarget)}
                className="px-4 h-8 text-xs font-semibold rounded-xl bg-error text-white hover:bg-error/90 transition-colors"
              >
                Vider
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete selected messages confirmation */}
      {deleteTargets && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteTargets(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.16 }}
            className="relative stage-glass rounded-2xl p-6 w-full max-w-sm"
          >
            <h3 className={cn('text-base font-extrabold tracking-tight mb-2', isDark ? 'text-white' : 'text-slate-900')}>
              Supprimer {deleteTargets.length} message{deleteTargets.length > 1 ? 's' : ''} ?
            </h3>
            <p className={cn('text-sm leading-relaxed mb-5', isDark ? 'text-slate-400' : 'text-slate-500')}>
              Les messages seront supprimés pour tout le monde et remplacés par « Ce message a été supprimé ».
            </p>
            <div className="flex items-center justify-end gap-2">
              <StageButton variant="glass" onClick={() => setDeleteTargets(null)}>
                Annuler
              </StageButton>
              <button
                onClick={() => handleDeleteMessages(deleteTargets)}
                className="px-4 h-8 text-xs font-semibold rounded-xl bg-error text-white hover:bg-error/90 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Members management */}
      {membersModal && selectedConv && (
        <GroupMembersModal
          conversationId={selectedConv.id}
          participants={selectedConv.participants.filter(p => p.type !== 'group')}
          currentUserId={currentUser.id}
          onClose={() => setMembersModal(false)}
          onChanged={reloadConversations}
        />
      )}

      {/* Media viewer */}
      {viewerMessage && (
        <MessageMediaViewer message={viewerMessage} onClose={() => setViewerMessage(null)} />
      )}
    </div>
  )
}

