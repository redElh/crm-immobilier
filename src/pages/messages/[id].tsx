import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Pin, Check, CheckCheck } from 'lucide-react'
import {
  ArrowLeft, MoreVertical, Star, Trash2, Home,
  Download, Delete, CornerUpRight, Users, Shield,
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
  fetchCurrentUser, fetchConversation, fetchMessages, sendMessage,
  deleteConversation, clearConversation, markConversationRead, currentUserToParticipant,
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

function dateSeparator(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return "Aujourd'hui"
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 1) return 'Hier'
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
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

export default function ConversationDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const admin = isAdminRoute()
  const basePath = admin ? getAdminBasePath() : ''
  const appearance = useMessagingAppearance()
  const zoomStyle = messageZoomStyle(appearance.messageSize)
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
        if (!cancelled) setConversation(conv)
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

  // Poll for new messages (fallback for missed realtime events)
  useEffect(() => {
    if (!id) return
    let cancelled = false
    const poll = async () => {
      try {
        const msgs = await fetchMessages(id!)
        if (!cancelled) {
          setConversation(prev => (prev ? { ...prev, messages: msgs, unreadCount: 0 } : prev))
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
        setConversation(prev => {
          if (!prev) return prev
          if (prev.messages.some(m => m.id === event.message.id)) return prev
          markConversationRead(event.conversationId).catch(() => {})
          return {
            ...prev,
            messages: [...prev.messages, event.message],
            lastActivityAt: event.message.sentAt,
            preview: event.message.body || 'Nouveau message',
            unreadCount: 0,
          }
        })
      } else if (event.type === 'typing') {
        if (event.conversationId !== id) return
        if (event.userId === Number(currentUserIdRef.current)) return
        showPresence(event.state === 'stop' ? null : (event.state as 'typing' | 'recording'))
      } else if (event.type === 'message:read') {
        if (id) {
          fetchMessages(id)
            .then(msgs => setConversation(prev => (prev ? { ...prev, messages: msgs } : prev)))
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

  const handleSendText = async (text: string) => {
    if (!conversation) return
    try {
      const msg = await sendMessage(conversation.id, { body: text })
      updateConv(c => ({
        ...c, messages: [...c.messages, msg], lastActivityAt: new Date().toISOString(), preview: text, unreadCount: 0,
      }))
    } catch {
      toast('error', "Impossible d'envoyer le message.")
    }
  }

  const handleSendVoice = async (duration: string, audioUrl?: string, audioSize?: string) => {
    if (!conversation) return
    try {
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
    <div className={cn('flex flex-col h-full w-full rounded-2xl overflow-hidden border border-border/60 bg-card shadow-card animate-fade-in', appearance.theme === 'dark' && 'dark')} style={zoomStyle}>
      {/* Header */}
      <div className="relative flex items-center gap-3 px-4 py-3 border-b border-border/40 bg-card shrink-0 z-10">
        <button
          onClick={() => navigate(`${basePath}/messages`)}
          className="p-1.5 rounded-lg text-text-secondary hover:text-text hover:bg-background transition-colors"
          title="Retour"
        >
          <ArrowLeft size={18} />
        </button>
        <Avatar participant={otherParticipant} showPresence={!conversation.isGroup} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-text truncate">{otherParticipant.name}</h3>
            {conversation.isGroup && (
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
            ) : conversation.isGroup ? (
              <span className="text-text-secondary">{conversation.participants.filter(p => p.type !== 'group').length} membres</span>
            ) : (
              <PresenceIndicator participant={otherParticipant} />
            )}
          </p>
        </div>

        {conversation.relatedPropertyTitle && (
          <button
            onClick={() => navigate(`${basePath}/properties/${conversation.relatedPropertyId}`)}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-accent bg-accent/10 hover:bg-accent/20 rounded-lg transition-colors shrink-0"
          >
            <Home size={12} />
            {conversation.relatedPropertyTitle}
          </button>
        )}

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setMoreMenu(o => !o)}
            className={cn('p-2 rounded-lg transition-colors', moreMenu ? 'text-accent bg-accent/10' : 'text-text-secondary hover:text-text hover:bg-background')}
            title="Plus d'options"
          >
            <MoreVertical size={17} />
          </button>
        </div>

        <AnimatePresence>
          {moreMenu && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setMoreMenu(false)} />
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.14 }}
                className="absolute right-3 top-14 z-30 w-56 bg-card border border-border/60 rounded-xl shadow-modal p-1.5"
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 sm:px-6 py-4 relative bg-gradient-to-br from-background/40 via-card to-accent-light/20">
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
                      <span className="px-3 py-1 text-[10px] font-medium text-text-secondary bg-card border border-border/50 rounded-full shadow-sm">
                        {dateSeparator(msg.sentAt)}
                      </span>
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

          {presence === 'typing' && <TypingBubble />}
          {presence === 'recording' && <RecordingBubble />}

          <div className="flex items-center justify-center gap-1.5 py-3">
            <Shield size={11} className="text-text-secondary/40" />
            <span className="text-[10px] text-text-secondary/40">
              {conversation.messages.length} message{conversation.messages.length !== 1 ? 's' : ''} · Chiffré de bout en bout · {lastMsg ? new Date(lastMsg.sentAt).toLocaleDateString('fr-FR') : ''}
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
            className="relative bg-card border border-border/60 rounded-2xl shadow-modal p-6 w-full max-w-sm"
          >
            <h3 className="text-base font-semibold text-text mb-2">Vider la conversation ?</h3>
            <p className="text-sm text-text-secondary leading-relaxed mb-5">
              Les messages seront supprimés de votre vue uniquement. L'autre participant continuera de les voir.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setClearTarget(false)}
                className="px-4 py-2 text-sm font-medium rounded-xl text-text hover:bg-background transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleClearConversation}
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
