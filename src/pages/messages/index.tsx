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
  fetchCurrentUser, fetchConversations, fetchMessages, sendMessage,
  markConversationRead, deleteConversation, clearConversation, fetchMessageUsers, currentUserToParticipant,
  toggleReaction, deleteMessages, uploadAttachment,
} from '../../services/messageService'
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
  if (msg.kind === 'audio') return 'Message vocal'
  if (msg.attachments.length > 0) return msg.attachments[0].name
  return msg.body || 'Nouveau message'
}

function TypingBubble() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start"
    >
      <div className="bg-card border border-border/60 shadow-sm rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-text-secondary/50"
            animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </motion.div>
  )
}

function RecordingBubble() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start"
    >
      <div className="bg-card border border-border/60 shadow-sm rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
        <span className="text-xs text-text-secondary">enregistre un message vocal...</span>
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
  const [selectedId, setSelectedId] = useState<string | null>(null)
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
  const [presence, setPresence] = useState<'typing' | 'recording' | null>(null)
  const scrollAnchorRef = useRef<HTMLDivElement>(null)
  const selectedIdRef = useRef<string | null>(null)
  const currentUserIdRef = useRef<string>('')
  const presenceTimerRef = useRef<number | null>(null)
  const conversationsRef = useRef<Conversation[]>([])

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
        setConversations(convs)
        if (admin) setUsers(dir)
      } catch {
        if (!cancelled) toast('error', "Impossible de charger vos conversations. Vérifiez votre connexion.")
      } finally {
        if (!cancelled) setAgentReady(true)
      }
    }
    load()
    return () => { cancelled = true }
  }, [admin, toast])

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
      setConversations(prev => {
        const freshIds = new Set(convs.map(c => c.id))
        const removed = prev.filter(c => !freshIds.has(c.id))
        const merged = convs.map(fresh => {
          const old = prev.find(c => c.id === fresh.id)
          if (!old || old.messages.length === 0) return fresh
          const seen = new Set(fresh.messages.map(m => m.id))
          const leftovers = old.messages.filter(m => !seen.has(m.id))
          const messages = [...fresh.messages, ...leftovers]
            .sort((a, b) => a.sentAt.localeCompare(b.sentAt))
          return { ...fresh, messages }
        })
        return [...removed, ...merged]
      })
      const id = selectedIdRef.current
      if (id) {
        const msgs = await fetchMessages(id)
        setConversations(prev => prev.map(c =>
          c.id === id ? { ...c, messages: msgs, unreadCount: 0 } : c
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
        setConversations(prev => {
          const existing = prev.find(c => c.id === event.conversationId)
          if (!existing) return prev
          if (existing.messages.some(m => m.id === event.message.id)) return prev
          const isOpen = event.conversationId === selectedIdRef.current
          if (isOpen) {
            markConversationRead(event.conversationId).catch(() => {})
          }
          const updated = {
            ...existing,
            messages: [...existing.messages, event.message],
            lastActivityAt: event.message.sentAt,
            preview: realtimePreview(event.message),
            unreadCount: isOpen ? 0 : existing.unreadCount + 1,
          }
          return prev.map(c => (c.id === event.conversationId ? updated : c))
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
        m.attachments.length > 0 || ['image', 'video', 'audio', 'file'].includes(m.kind ?? '')
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
      const msg = await sendMessage(selectedConv.id, { body: text })
      const now = new Date().toISOString()
      updateConv(selectedConv.id, c => ({
        ...c, messages: [...c.messages, msg], lastActivityAt: now, preview: text, unreadCount: 0,
      }))
    } catch {
      toast('error', "Impossible d'envoyer le message.")
    }
  }

  const handleSendVoice = async (duration: string, audioUrl?: string, audioSize?: string) => {
    if (!selectedConv) return
    try {
      const msg = await sendMessage(selectedConv.id, {
        kind: 'audio', duration,
        ...(audioUrl
          ? { audioUrl }
          : { attachmentName: 'note_audio.m4a', attachmentSize: '0.6 Mo' }),
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

  // Leave selection mode whenever the conversation changes
  useEffect(() => {
    setSelectionMode(false)
    setSelectedIds(new Set())
  }, [selectedId])

  const clearFilters = () => {
    setActiveFilter('all')
    setSearchTerm('')
    setAgentFilter('')
  }

  const hasActiveFilters = searchTerm || activeFilter !== 'all' || (admin && agentFilter)

  const basePath = admin ? getAdminBasePath() : ''
  const appearance = useMessagingAppearance()
  const zoomStyle = messageZoomStyle(appearance.messageSize)

  return (
    <div className={cn('flex flex-col h-full w-full', appearance.theme === 'dark' && 'dark bg-background')} style={zoomStyle}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 shrink-0 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <MessageSquare size={20} className="text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">Messagerie</h1>
            <p className="text-xs text-text-secondary">Communications en temps réel</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`${basePath}/messages/settings`)}
            className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-secondary hover:text-text hover:bg-card border border-border/60 rounded-lg transition-colors"
          >
            <Settings size={15} />
            Paramètres
          </button>
          <button
            onClick={() => navigate(`${basePath}/messages/compose`)}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover active:scale-[0.98] shadow-sm transition-all"
          >
            <Plus size={15} />
            Nouvelle conversation
          </button>
        </div>
      </div>

      {/* Admin stats */}
      {admin && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0 pb-3">
          {[
            { label: 'Conversations', value: stats.total, sub: "dans l'agence" },
            { label: 'Non lus', value: stats.unread, sub: 'messages en attente' },
            { label: 'Messages envoyés', value: stats.sentThisMonth, sub: 'ce mois-ci' },
            { label: 'Favoris', value: stats.starred, sub: 'conversations suivies' },
          ].map(stat => (
            <div key={stat.label} className="bg-card rounded-xl border border-border/50 shadow-card px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <MessageSquare size={16} className="text-accent" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-semibold leading-tight">{stat.value}</p>
                <p className="text-[11px] text-text-secondary truncate">{stat.label} · {stat.sub}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chat layout */}
      <div className="flex-1 min-h-0 flex rounded-2xl overflow-hidden border border-border/60 bg-card shadow-card">
        {/* Conversation list */}
        <aside className="w-[330px] shrink-0 border-r border-border/50 flex flex-col min-h-0 bg-card">
          <div className="p-3 border-b border-border/40 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary/50" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Rechercher une conversation..."
                  className="w-full h-9 pl-9 pr-3 text-sm rounded-full bg-background border border-transparent focus:bg-card focus:border-accent/50 focus:ring-2 focus:ring-accent/10 text-text placeholder:text-text-secondary/40 focus:outline-none transition-all"
                />
              </div>
              <button
                onClick={() => navigate(`${basePath}/messages/compose`)}
                className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center hover:bg-accent-hover active:scale-95 shadow-sm transition-all"
                title="Nouvelle conversation"
              >
                <Plus size={17} />
              </button>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin -mx-1 px-1">
              {FILTERS.map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-full border transition-all whitespace-nowrap',
                    activeFilter === filter.id
                      ? 'bg-accent/10 text-accent border-accent/20'
                      : 'bg-background text-text-secondary border-border/60 hover:text-text hover:border-border'
                  )}
                >
                  {filter.label}
                </button>
              ))}
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
                const senderName = conv.isGroup && lastMsg ? lastMsg.sender.name.split(' ')[0] + ' : ' : ''
                return (
                  <div
                    key={conv.id}
                    onClick={() => { setSelectedId(conv.id); setChatSearchOpen(false); setChatSearch(''); setMoreMenu(null) }}
                    className={cn(
                      'relative flex items-center gap-3 px-3 py-3 border-b border-border/20 cursor-pointer transition-colors group',
                      isSelected ? 'bg-accent-light/30' : 'hover:bg-background/70'
                    )}
                  >
                    <Avatar participant={other} showPresence size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn('flex items-center gap-1.5 text-sm truncate', hasUnread ? 'font-bold text-text' : 'font-semibold text-text')}>
                          {other.name}
                          {other.type !== 'client' && other.type !== 'group' && (
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-accent/10 text-accent uppercase tracking-wide shrink-0">
                              {other.type === 'admin' ? 'Admin' : 'Agent'}
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-text-secondary/60 whitespace-nowrap shrink-0">
                          {formatListDate(conv.lastActivityAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <span className={cn('flex items-center gap-1 text-xs truncate', hasUnread ? 'font-medium text-text' : 'text-text-secondary/80')}>
                          {conv.previewReaction ? (
                            <span className="truncate">
                              {conv.previewReaction.name} a réagi {conv.previewReaction.emoji} à « {conv.previewReaction.message} »
                            </span>
                          ) : (
                            <>
                              {previewIcon(lastKind)}
                              <span className="truncate">{senderName}{hasUnread && lastKind === 'text' && lastMsg ? lastMsg.body : conv.preview}</span>
                            </>
                          )}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {conv.isPinned && <Pin size={11} className="text-text-secondary/40" />}
                          {conv.isStarred && <Star size={11} className="text-amber-500 fill-amber-500" />}
                          {hasUnread && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-accent text-white leading-none min-w-[18px] text-center">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {admin && (
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                          setListMenu(
                            listMenu?.convId === conv.id
                              ? null
                              : { convId: conv.id, x: rect.right - 184, y: rect.bottom + 4 }
                          )
                        }}
                        className="p-1.5 rounded-lg text-text-secondary/50 hover:text-text hover:bg-background transition-colors opacity-0 group-hover:opacity-100 shrink-0"
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
        <section className="flex-1 min-w-0 flex flex-col bg-gradient-to-br from-background/40 via-card to-accent-light/20">
          {selectedConv ? (
            <>
              {/* Chat header */}
              <div className="relative flex items-center gap-3 px-4 py-3 border-b border-border/40 bg-card/90 backdrop-blur-sm shrink-0 z-10">
                <button
                  onClick={() => setSelectedId(null)}
                  className="lg:hidden p-1.5 rounded-lg text-text-secondary hover:text-text hover:bg-background transition-colors"
                  title="Retour"
                >
                  <ArrowLeft size={18} />
                </button>
                <Avatar participant={otherParticipant(selectedConv)} showPresence={!selectedConv.isGroup} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-text truncate">{otherParticipant(selectedConv).name}</h3>
                    {selectedConv.isGroup && (
                      <span className="flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-accent/10 text-accent">
                        <Users size={9} /> Groupe
                      </span>
                    )}
                  </div>
                  <p className={cn('text-[11px] flex items-center gap-1.5 truncate', presence ? 'text-accent font-medium' : 'text-text-secondary')}>
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
                      <span className="text-text-secondary">{selectedConv.participants.filter(p => p.type !== 'group').length} membres</span>
                    ) : (
                      <PresenceIndicator participant={otherParticipant(selectedConv)} />
                    )}
                  </p>
                </div>

                {selectedConv.relatedPropertyTitle && (
                  <button
                    onClick={() => navigate(`${basePath}/properties/${selectedConv.relatedPropertyId}`)}
                    className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-accent bg-accent/10 hover:bg-accent/20 rounded-lg transition-colors shrink-0"
                  >
                    <Home size={12} />
                    {selectedConv.relatedPropertyTitle}
                  </button>
                )}

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setChatSearchOpen(o => !o)}
                    className={cn('p-2 rounded-lg transition-colors', chatSearchOpen ? 'text-accent bg-accent/10' : 'text-text-secondary hover:text-text hover:bg-background')}
                    title="Rechercher dans la conversation"
                  >
                    <Search size={17} />
                  </button>
                  <button
                    onClick={() => setMoreMenu(moreMenu === 'chat' ? null : 'chat')}
                    className={cn('p-2 rounded-lg transition-colors', moreMenu === 'chat' ? 'text-accent bg-accent/10' : 'text-text-secondary hover:text-text hover:bg-background')}
                    title="Plus d'options"
                  >
                    <MoreVertical size={17} />
                  </button>
                </div>

                <AnimatePresence>
                  {moreMenu === 'chat' && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setMoreMenu(null)} />
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.14 }}
                        className="absolute right-3 top-14 z-30 w-56 bg-card border border-border/60 rounded-xl shadow-modal p-1.5"
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
                              'w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors',
                              (item as any).danger ? 'text-error hover:bg-error/5' : 'text-text hover:bg-background'
                            )}
                          >
                            {item.icon} {item.label}
                          </button>
                        ))}
                      </motion.div>
                    </>
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
                    className="overflow-hidden border-b border-border/40 bg-card"
                  >
                    <div className="px-4 py-2 flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/50" />
                        <input
                          type="text"
                          value={chatSearch}
                          onChange={e => setChatSearch(e.target.value)}
                          placeholder="Rechercher dans cette conversation..."
                          autoFocus
                          className="w-full h-8 pl-9 pr-3 text-sm rounded-full bg-background border border-transparent focus:border-accent/50 text-text placeholder:text-text-secondary/40 focus:outline-none transition-colors"
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

              {/* Messages */}
              <div className="flex-1 overflow-y-auto scrollbar-thin px-4 sm:px-6 py-4 relative">
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
                              <span className="px-3 py-1 text-[10px] font-medium text-text-secondary bg-card border border-border/50 rounded-full shadow-sm">
                                {dateSeparator(msg.sentAt)}
                              </span>
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

                  {presence === 'typing' && <TypingBubble />}
                  {presence === 'recording' && <RecordingBubble />}

                  <div className="flex items-center justify-center gap-1.5 py-3">
                    <Shield size={11} className="text-text-secondary/40" />
                    <span className="text-[10px] text-text-secondary/40">
                      Messages chiffrés de bout en bout · Square Meter CRM
                    </span>
                  </div>
                  <div ref={scrollAnchorRef} />
                </div>
              </div>

              {/* Selection action bar */}
              {selectionMode && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mx-4 sm:mx-6 mb-3 flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-card border border-border/60 shadow-sm shrink-0"
                >
                  <span className="text-xs text-text-secondary truncate">
                    {selectedIds.size > 0
                      ? `${selectedIds.size} message${selectedIds.size > 1 ? 's' : ''} sélectionné${selectedIds.size > 1 ? 's' : ''}`
                      : 'Sélectionnez des messages'}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setSelectionMode(false)}
                      className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text hover:bg-background rounded-lg transition-colors"
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
                className="w-24 h-24 rounded-3xl bg-accent/10 flex items-center justify-center mb-5"
              >
                <MessageSquare size={42} className="text-accent/60" />
              </motion.div>
              <h2 className="text-lg font-semibold text-text">Sélectionnez une conversation</h2>
              <p className="text-sm text-text-secondary max-w-sm mt-2">
                Choisissez une discussion dans la liste pour consulter vos échanges et envoyer des messages en temps réel.
              </p>
              <button
                onClick={() => navigate(`${basePath}/messages/compose`)}
                className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-hover active:scale-[0.98] shadow-sm transition-all"
              >
                <Plus size={15} />
                Nouvelle conversation
              </button>
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
          <>
            <div className="fixed inset-0 z-40" onClick={() => setListMenu(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.14 }}
              style={{ position: 'fixed', left: listMenu.x, top: listMenu.y }}
              className="z-50 w-52 bg-card border border-border/60 rounded-xl shadow-modal p-1.5"
            >
              {listActions.map(item => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors',
                    (item as any).danger ? 'text-error hover:bg-error/5' : 'text-text hover:bg-background'
                  )}
                >
                  {item.icon} {item.label}
                </button>
              ))}
            </motion.div>
          </>
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
            className="relative bg-card border border-border/60 rounded-2xl shadow-modal p-5 w-80"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Affecter la conversation</h3>
              <button onClick={() => setAssignTarget(null)} className="p-1.5 rounded-lg text-text-secondary hover:text-text hover:bg-background transition-colors">
                <X size={15} />
              </button>
            </div>
            <div className="space-y-1">
              {users.filter(d => d.type !== 'admin').map(a => (
                <button
                  key={a.id}
                  onClick={() => setAssignTarget(null)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-background transition-colors"
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
            className="relative bg-card border border-border/60 rounded-2xl shadow-modal p-6 w-full max-w-sm"
          >
            <h3 className="text-base font-semibold text-text mb-2">Vider la conversation ?</h3>
            <p className="text-sm text-text-secondary leading-relaxed mb-5">
              Les messages seront supprimés de votre vue uniquement. L'autre participant continuera de les voir.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setClearTarget(null)}
                className="px-4 py-2 text-sm font-medium rounded-xl text-text hover:bg-background transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleClearConversation(clearTarget)}
                className="px-4 py-2 text-sm font-medium rounded-xl bg-error text-white hover:bg-error/90 transition-colors"
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
            className="relative bg-card border border-border/60 rounded-2xl shadow-modal p-6 w-full max-w-sm"
          >
            <h3 className="text-base font-semibold text-text mb-2">
              Supprimer {deleteTargets.length} message{deleteTargets.length > 1 ? 's' : ''} ?
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed mb-5">
              Les messages seront supprimés pour tout le monde et remplacés par « Ce message a été supprimé ».
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteTargets(null)}
                className="px-4 py-2 text-sm font-medium rounded-xl text-text hover:bg-background transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDeleteMessages(deleteTargets)}
                className="px-4 py-2 text-sm font-medium rounded-xl bg-error text-white hover:bg-error/90 transition-colors"
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

