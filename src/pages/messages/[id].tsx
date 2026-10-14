import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Pin, Check, CheckCheck } from 'lucide-react'
import {
  ArrowLeft, MoreVertical, Star, Trash2, Home,
  Download, Delete, CornerUpRight, Users,
} from 'react-feather'
import type { Conversation, Message, MessageParticipant, MessageKind } from '../../types/messages'
import { cn, getAdminBasePath } from '../../lib/utils'
import { Avatar } from '../../components/modules/messages/Avatar'
import { MessageBubble } from '../../components/modules/messages/MessageBubble'
import { MessageMediaViewer } from '../../components/modules/messages/MessageMediaViewer'
import { ChatComposer } from '../../components/modules/messages/ChatComposer'
import { PresenceIndicator } from '../../components/modules/messages/PresenceIndicator'
import { GroupMembersModal } from '../../components/modules/messages/GroupMembersModal'
import { useToast } from '../../components/ui/Toast'
import {
  StageBadge,
  StageButton,
  useStageTheme,
} from '../../components/dashboard/Stage'
import {
  fetchCurrentUser, fetchConversation, fetchMessages, sendMessage,
  deleteConversation, clearConversation, markConversationRead, currentUserToParticipant,
  toggleReaction, deleteMessages, uploadAttachment, uploadVoice,
} from '../../services/messageService'
import {
  ensureE2EEIdentity,
  sealForConversation,
  prepareSealedMedia,
  normalizeMessage,
  normalizeMessages,
  cacheOwnSealed,
  previewTextFor,
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

function dateSeparator(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return "Aujourd'hui"
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 1) return 'Hier'
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
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

export default function ConversationDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const admin = isAdminRoute()
  const basePath = admin ? getAdminBasePath() : ''
  const appearance = useMessagingAppearance()
  const zoomStyle = messageZoomStyle(appearance.messageSize)
  const theme = useStageTheme()
  const isDark = theme === 'dark'
  const chatWallpaper = isDark
    ? { backgroundImage: 'radial-gradient(rgba(148,163,184,0.12) 1px, transparent 1.4px)', backgroundSize: '18px 18px' }
    : { backgroundImage: 'radial-gradient(rgba(13,148,136,0.12) 1px, transparent 1.4px)', backgroundSize: '18px 18px' }
  const [currentUser, setCurrentUser] = useState<MessageParticipant>(EMPTY_PARTICIPANT)

  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [moreMenu, setMoreMenu] = useState(false)
  const [membersModal, setMembersModal] = useState(false)
  const [presence, setPresence] = useState<'typing' | 'recording' | null>(null)
  const [clearTarget, setClearTarget] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [deleteTargets, setDeleteTargets] = useState<number[] | null>(null)
  const [viewerMessage, setViewerMessage] = useState<Message | null>(null)
  const scrollAnchorRef = useRef<HTMLDivElement>(null)
  const currentUserIdRef = useRef<string>('')
  const presenceTimerRef = useRef<number | null>(null)
  const chatMenuRef = useRef<HTMLDivElement>(null)

  // Collapse the floating menu on outside click (independent of CSS containing blocks)
  useEffect(() => {
    if (!moreMenu) return
    const onPointerDown = (e: MouseEvent) => {
      const t = e.target as Element
      if (
        chatMenuRef.current &&
        !chatMenuRef.current.contains(t) &&
        !(t.closest && t.closest('[data-chat-menu-toggle]'))
      ) {
        setMoreMenu(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [moreMenu])

  const showPresence = (p: 'typing' | 'recording' | null) => {
    setPresence(p)
    if (presenceTimerRef.current) window.clearTimeout(presenceTimerRef.current)
    if (p) {
      presenceTimerRef.current = window.setTimeout(() => setPresence(null), 4000)
    }
  }

  useEffect(() => {
    if (!id) {
      navigate(`${basePath}/messages`, { replace: true })
      return
    }
    let cancelled = false
    const load = async () => {
      try {
        const me = await fetchCurrentUser()
        if (!cancelled) {
          currentUserIdRef.current = String(me.id)
          setCurrentUser(currentUserToParticipant(me))
        }
        const conv = await fetchConversation(id!)
        if (!cancelled && conv) {
          conv.messages = await normalizeMessages(currentUserIdRef.current, conv.messages || [])
          if (!cancelled) setConversation(conv)
        }
      } catch {
        if (!cancelled) {
          toast('error', 'Conversation introuvable.')
          navigate(`${basePath}/messages`, { replace: true })
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [id, basePath, navigate, toast])

  // E2EE identity: generate + publish once the user is known (never throws).
  useEffect(() => {
    if (currentUser.id) ensureE2EEIdentity(currentUser.id)
  }, [currentUser.id])

  // Poll for new messages (fallback for missed realtime events)
  useEffect(() => {
    if (!id) return
    let cancelled = false
    const poll = async () => {
      try {
        const msgs = await fetchMessages(id!)
        if (!cancelled) {
          const norm = await normalizeMessages(currentUserIdRef.current, msgs)
          if (!cancelled) {
            setConversation(prev => (prev ? { ...prev, messages: norm, unreadCount: 0 } : prev))
          }
        }
      } catch {
        // ignore transient polling errors
      }
    }
    const t = setInterval(poll, 12000)
    return () => { cancelled = true; clearInterval(t) }
  }, [id])

  // Realtime: instant message delivery + typing/recording indicators
  useEffect(() => {
    if (!id) return
    sendPresence('online')
    setActiveConversation(id)
    setConversationRead(id)
    const unsubscribe = subscribeRealtime(event => {
      if (event.type === 'message:new') {
        if (event.conversationId !== id) return
        normalizeMessage(currentUserIdRef.current, event.message).then(nmsg => {
          setConversation(prev => {
            if (!prev) return prev
            if (prev.messages.some(m => m.id === nmsg.id)) return prev
            markConversationRead(event.conversationId).catch(() => {})
            return {
              ...prev,
              messages: [...prev.messages, nmsg],
              lastActivityAt: nmsg.sentAt,
              preview: previewTextFor(nmsg),
              unreadCount: 0,
            }
          })
        })
      } else if (event.type === 'typing') {
        if (event.conversationId !== id) return
        if (event.userId === Number(currentUserIdRef.current)) return
        showPresence(event.state === 'stop' ? null : (event.state as 'typing' | 'recording'))
      } else if (event.type === 'message:read') {
        if (id) {
          fetchMessages(id)
            .then(async msgs => {
              const norm = await normalizeMessages(currentUserIdRef.current, msgs)
              setConversation(prev => (prev ? { ...prev, messages: norm } : prev))
            })
            .catch(() => {})
        }
      } else if (event.type === 'message:deleted') {
        if (event.conversationId !== id) return
        setConversation(prev => {
          if (!prev) return prev
          const ids = new Set(event.messageIds)
          return { ...prev, messages: prev.messages.map(m => (ids.has(m.id) ? { ...m, deleted: true } : m)) }
        })
      } else if (event.type === 'message:reaction') {
        if (event.conversationId !== id) return
        setConversation(prev => {
          if (!prev) return prev
          return {
            ...prev,
            messages: prev.messages.map(m =>
              m.id === event.messageId ? { ...m, reactions: event.reactions } : m
            ),
          }
        })
      } else if (event.type === 'conversation:members-changed') {
        if (event.conversationId !== id) return
        setConversation(prev => (prev ? { ...prev, participants: event.participants } : prev))
      } else if (event.type === 'conversation:member-removed') {
        if (event.conversationId === id) {
          toast('info', 'Vous avez été retiré du groupe.')
          navigate(`${basePath}/messages`)
        }
      } else if (event.type === 'presence:update') {
        const { id: uid, presence, lastSeen } = event.user
        setConversation(prev => {
          if (!prev) return prev
          let changed = false
          const participants = prev.participants.map(p => {
            if (p.id === uid && (p.presence !== presence || p.lastSeen !== lastSeen)) {
              changed = true
              return { ...p, presence, lastSeen }
            }
            return p
          })
          return changed ? { ...prev, participants } : prev
        })
      }
    })
    return () => {
      unsubscribe()
      if (presenceTimerRef.current) window.clearTimeout(presenceTimerRef.current)
      setActiveConversation(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const otherParticipant = useMemo((): MessageParticipant => {
    if (!conversation) return EMPTY_PARTICIPANT
    if (conversation.isGroup) {
      return {
        id: `group-${conversation.id}`,
        name: conversation.subject || 'Groupe',
        type: 'group',
        role: `${conversation.participants.length} membres`,
        presence: 'offline',
      }
    }
    const others = conversation.participants.filter(p => p.id !== currentUser.id)
    return others[0] || conversation.participants[0]
  }, [conversation, currentUser.id])

  const updateConv = (fn: (c: Conversation) => Conversation) => {
    setConversation(prev => (prev ? fn(prev) : prev))
  }

  const handleClearConversation = async () => {
    setClearTarget(false)
    setMoreMenu(false)
    if (!conversation) return
    try {
      await clearConversation(conversation.id)
      const conv = await fetchConversation(conversation.id)
      setConversation(conv)
    } catch {
      toast('error', "Impossible de vider la conversation.")
    }
  }

  const handleDeleteMessages = async (ids: number[]) => {
    if (!conversation || ids.length === 0) return
    setDeleteTargets(null)
    setMoreMenu(false)
    setSelectionMode(false)
    setSelectedIds(new Set())
    const idSet = new Set(ids.map(String))
    updateConv(c => ({
      ...c,
      messages: c.messages.map(m => (idSet.has(m.id) ? { ...m, deleted: true } : m)),
    }))
    try {
      await deleteMessages(conversation.id, ids)
    } catch {
      toast('error', "Impossible de supprimer les messages sélectionnés.")
    }
  }

  // Delete key goes back to the conversation list.
  // Ignored while typing, selecting messages, or when a dialog is open.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Delete') return
      const el = document.activeElement as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return
      if (selectionMode || viewerMessage || moreMenu || membersModal || clearTarget || deleteTargets) return
      e.preventDefault()
      navigate(`${basePath}/messages`)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navigate, basePath, selectionMode, viewerMessage, moreMenu, membersModal, clearTarget, deleteTargets])

  const handleSendText = async (text: string) => {
    if (!conversation) return
    try {
      const myId = currentUser.id
      const attempt = await sealForConversation({ myId, participants: conversation.participants, text })
      const msg = await sendMessage(
        conversation.id,
        attempt.sealed ? { body: attempt.body, kind: 'sealed' } : { body: text }
      )
      if (attempt.sealed && attempt.payload) cacheOwnSealed(myId, msg.id, attempt.payload)
      const finalMsg = await normalizeMessage(myId, msg)
      updateConv(c => ({
        ...c, messages: [...c.messages, finalMsg], lastActivityAt: new Date().toISOString(),
        preview: text, unreadCount: 0,
      }))
    } catch {
      toast('error', "Impossible d'envoyer le message.")
    }
  }

  const handleSendVoice = async (duration: string, audioUrl?: string, audioSize?: string, blob?: Blob | null) => {
    if (!conversation) return
    try {
      const myId = currentUser.id
      if (blob) {
        const prepared = await prepareSealedMedia({
          myId,
          participants: conversation.participants,
          file: blob,
          filename: 'note-vocale.webm',
          mime: blob.type || 'audio/webm',
          upload: b => uploadVoice(b),
        })
        if (prepared.sealed && prepared.meta) {
          const attempt = await sealForConversation({
            myId, participants: conversation.participants, text: '', media: prepared.meta,
          })
          if (attempt.sealed && attempt.payload) {
            const msg = await sendMessage(conversation.id, {
              body: attempt.body, kind: 'sealed', duration,
              attachmentName: prepared.name, attachmentSize: prepared.size, attachmentUrl: prepared.url,
            })
            cacheOwnSealed(myId, msg.id, attempt.payload)
            const finalMsg = await normalizeMessage(myId, msg)
            updateConv(c => ({
              ...c, messages: [...c.messages, finalMsg], lastActivityAt: new Date().toISOString(), preview: 'Message vocal', unreadCount: 0,
            }))
            return
          }
        }
        const plain = await uploadVoice(blob)
        const msg = await sendMessage(conversation.id, { kind: 'audio', duration, audioUrl: plain.url })
        updateConv(c => ({
          ...c, messages: [...c.messages, msg], lastActivityAt: new Date().toISOString(), preview: 'Message vocal', unreadCount: 0,
        }))
        return
      }
      const msg = await sendMessage(conversation.id, {
        kind: 'audio', duration,
        ...(audioUrl
          ? { audioUrl }
          : { attachmentName: 'note_audio.m4a', attachmentSize: '0.6 Mo' }),
      })
      updateConv(c => ({
        ...c, messages: [...c.messages, msg], lastActivityAt: new Date().toISOString(), preview: 'Message vocal', unreadCount: 0,
      }))
    } catch {
      toast('error', "Impossible d'envoyer le message vocal.")
    }
  }

  const handleAttach = async (kind: 'image' | 'video' | 'document' | 'audio', file: File): Promise<boolean> => {
    if (!conversation) return false
    const msgKind: MessageKind = kind === 'document' ? 'file' : kind
    const myId = currentUser.id
    try {
      const prepared = await prepareSealedMedia({
        myId,
        participants: conversation.participants,
        file,
        filename: file.name,
        mime: file.type || 'application/octet-stream',
        upload: b => uploadAttachment(b as File).then(u => ({ url: u.url, size: u.size })),
      })
      if (prepared.sealed && prepared.meta) {
        const attempt = await sealForConversation({
          myId, participants: conversation.participants, text: '', media: prepared.meta,
        })
        if (attempt.sealed && attempt.payload) {
          const msg = await sendMessage(conversation.id, {
            body: attempt.body, kind: 'sealed',
            attachmentName: prepared.name, attachmentSize: prepared.size, attachmentUrl: prepared.url,
          })
          cacheOwnSealed(myId, msg.id, attempt.payload)
          const finalMsg = await normalizeMessage(myId, msg)
          updateConv(c => ({
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
      const msg = await sendMessage(conversation.id, {
        kind: msgKind, attachmentName: uploaded.name, attachmentSize: uploaded.size, attachmentUrl: uploaded.url,
      })
      updateConv(c => ({
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

  const handleReactionChange = (messageId: string, emoji: string) => {
    if (!conversation) return
    toggleReaction(conversation.id, messageId, emoji)
      .then(result => updateConv(c => ({
        ...c,
        messages: c.messages.map(m => (m.id === messageId ? { ...m, reactions: result.reactions } : m)),
        preview: result.preview,
        previewReaction: result.previewReaction,
        lastActivityAt: result.lastActivityAt,
      })))
      .catch(() => toast('error', "Impossible de réagir au message."))
  }

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [conversation?.messages.length, conversation?.id, presence])

  if (!conversation) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent" />
      </div>
    )
  }

  const lastMsg = conversation.messages[conversation.messages.length - 1]

  return (
    <div className={cn('relative flex flex-col h-full w-full rounded-2xl overflow-hidden animate-fade-in', isDark ? 'stage-dark' : 'stage-light', appearance.theme === 'dark' && 'dark')} style={zoomStyle}>
      {moreMenu && (
        <div
          aria-hidden="true"
          onClick={() => setMoreMenu(false)}
          className="absolute inset-0 z-[5] backdrop-blur-[2px]"
          style={{ background: isDark ? 'rgba(5,9,20,0.45)' : 'rgba(13,60,60,0.10)' }}
        />
      )}
      {/* Header */}
      <div className={cn('relative flex items-center gap-3 px-4 py-3 border-b backdrop-blur-md shrink-0 z-10', isDark ? 'border-white/10 bg-white/[0.02]' : 'border-teal-900/10 bg-white/60')}>
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-8 bottom-0 h-px" style={{ background: isDark ? 'linear-gradient(90deg, transparent, rgba(139,124,255,0.55), rgba(94,234,212,0.3), transparent)' : 'linear-gradient(90deg, transparent, rgba(45,212,191,0.55), rgba(124,92,255,0.3), transparent)' }} />
        <button
          onClick={() => navigate(`${basePath}/messages`)}
          className={cn('p-1.5 rounded-lg transition-colors', isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-teal-900 hover:bg-teal-900/5')}
          title="Retour"
        >
          <ArrowLeft size={18} />
        </button>
        <Avatar participant={otherParticipant} showPresence={!conversation.isGroup} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={cn('text-sm font-bold tracking-tight truncate', isDark ? 'text-white' : 'text-slate-900')}>{otherParticipant.name}</h3>
            {conversation.isGroup && (
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
            ) : conversation.isGroup ? (
              <span>{conversation.participants.filter(p => p.type !== 'group').length} membres</span>
            ) : (
              <PresenceIndicator participant={otherParticipant} />
            )}
          </p>
        </div>

        {conversation.relatedPropertyTitle && (
          <button
            onClick={() => navigate(`${basePath}/properties/${conversation.relatedPropertyId}`)}
            className={cn('hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border backdrop-blur-md transition-colors shrink-0', isDark ? 'text-indigo-300 bg-violet-400/10 hover:bg-violet-400/20 border-violet-400/25' : 'text-teal-700 bg-teal-500/10 hover:bg-teal-500/20 border-teal-500/25')}
          >
            <Home size={12} />
            {conversation.relatedPropertyTitle}
          </button>
        )}

        <div className="flex items-center gap-1 shrink-0">
          <button
            data-chat-menu-toggle
            onClick={() => setMoreMenu(o => !o)}
            className={cn('p-2 rounded-xl border transition-colors', moreMenu
              ? isDark ? 'text-indigo-300 bg-violet-400/10 border-violet-400/30' : 'text-teal-700 bg-teal-500/10 border-teal-500/30'
              : isDark ? 'text-slate-400 border-transparent hover:text-white hover:bg-white/5 hover:border-white/10' : 'text-slate-500 border-transparent hover:text-teal-900 hover:bg-teal-900/5 hover:border-teal-900/10')}
            title="Plus d'options"
          >
            <MoreVertical size={17} />
          </button>
        </div>

        <AnimatePresence>
          {moreMenu && (
            <motion.div
              ref={chatMenuRef}
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.14 }}
              className="!absolute right-3 top-14 z-30 w-56 stage-glass rounded-2xl p-1.5"
            >
                {[
                  { icon: <CheckCheck size={14} />, label: 'Marquer comme lu', action: () => setMoreMenu(false) },
                  ...(conversation.isGroup && conversation.createdBy === currentUser.id
                    ? [{ icon: <Users size={14} />, label: 'Gérer les membres', action: () => { setMembersModal(true); setMoreMenu(false) } }]
                    : []),
                  { icon: <Check size={14} />, label: selectionMode ? 'Annuler la sélection' : 'Sélectionner des messages', action: () => { setSelectionMode(s => !s); setSelectedIds(new Set()); setMoreMenu(false) } },
                  { icon: <Delete size={14} />, label: 'Vider la conversation', action: () => { setClearTarget(true); setMoreMenu(false) } },
                  { icon: <Star size={14} />, label: conversation.isStarred ? 'Retirer des favoris' : 'Ajouter aux favoris', action: () => setMoreMenu(false) },
                  { icon: <Pin size={14} />, label: conversation.isPinned ? 'Désépingler' : 'Épingler', action: () => setMoreMenu(false) },
                  { icon: <CornerUpRight size={14} />, label: 'Transférer', action: () => setMoreMenu(false) },
                  { icon: <Download size={14} />, label: 'Exporter la conversation', action: () => setMoreMenu(false) },
                  { icon: <Trash2 size={14} />, label: 'Supprimer la conversation', danger: true, action: () => {
                    if (conversation) {
                      deleteConversation(conversation.id).catch(() => {})
                    }
                    setMoreMenu(false)
                    navigate(`${basePath}/messages`)
                  } },
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 sm:px-6 py-4 relative" style={chatWallpaper}>
        <div className="space-y-1.5 max-w-4xl mx-auto">
          {(() => {
            let lastDateKey = ''
            let lastSenderId = ''
            return conversation.messages.map((msg, i) => {
              const isMine = msg.sender.id === currentUser.id
              const dateKey = new Date(msg.sentAt).toDateString()
              const showDate = dateKey !== lastDateKey
              lastDateKey = dateKey
              const showSender = conversation.isGroup && !isMine && msg.sender.id !== lastSenderId
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
                    senderIsGroupAdmin={conversation.isGroup && msg.sender.id === conversation.createdBy}
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

          <div className="flex items-center justify-center gap-1.5 py-3">
            <span className={cn('text-[10px] font-medium', isDark ? 'text-slate-400' : 'text-slate-500')}>
              {conversation.messages.length} message{conversation.messages.length !== 1 ? 's' : ''} · {lastMsg ? new Date(lastMsg.sentAt).toLocaleDateString('fr-FR') : ''}
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
          if (conversation) sendTyping(conversation.id, active)
        }}
        onRecordingChange={active => {
          if (conversation) sendRecording(conversation.id, active)
        }}
      />

      {/* Clear conversation confirmation */}
      {clearTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setClearTarget(false)} />
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
              <StageButton variant="glass" onClick={() => setClearTarget(false)}>
                Annuler
              </StageButton>
              <button
                onClick={handleClearConversation}
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
      {membersModal && conversation && (
        <GroupMembersModal
          conversationId={conversation.id}
          participants={conversation.participants.filter(p => p.type !== 'group')}
          currentUserId={currentUser.id}
          onClose={() => setMembersModal(false)}
          onChanged={() => {
            fetchConversation(conversation.id)
              .then(setConversation)
              .catch(() => toast('error', 'Impossible de rafraîchir la conversation.'))
          }}
        />
      )}
      {/* Media viewer */}
      {viewerMessage && (
        <MessageMediaViewer message={viewerMessage} onClose={() => setViewerMessage(null)} />
      )}
    </div>
  )
}
