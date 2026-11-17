import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCheck } from 'lucide-react'
import {
  Check, Paperclip, File, FileText, Image as ImageIcon,
  Video, Phone, PhoneMissed, PhoneIncoming, PhoneOutgoing, Play, Mic,
  Download, Film, Plus, Trash2, X,
} from 'react-feather'
import type { Message, MessageReaction } from '../../../types/messages'
import { cn } from '../../../lib/utils'
import { resolveMediaUrl } from '../../../utils/mediaUrl'
import { AudioPlayer } from './AudioPlayer'
import { innerKindOf } from '../../../services/e2ee/conversation'
import { useSealedMediaUrl } from './useSealedMedia'
import { StageBadge, useStageTheme } from '../../dashboard/Stage'

export const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏']

export const REACTION_EMOJIS = [
  ...QUICK_REACTIONS,
  '🎉', '😍', '🔥', '👏', '🤔', '😎', '😭', '😡', '🤝', '💯',
  '✅', '⭐', '🙌', '😅', '🥳', '😴', '💪', '🤗', '😇', '🥰',
  '🤩', '😜', '🤞', '🧡', '💚', '💙', '💜', '✨', '👀',
]

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function formatSeenAt(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  if (d.toDateString() === now.toDateString()) return `Aujourd'hui à ${time}`
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return `Hier à ${time}`
  return `${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à ${time}`
}

function fileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <ImageIcon size={16} />
  if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) return <Video size={16} />
  if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return <Mic size={16} />
  if (['pdf'].includes(ext)) return <FileText size={16} />
  if (['zip', 'rar'].includes(ext)) return <File size={16} />
  return <File size={16} />
}

export function ReadReceipts({ status }: {
  status?: 'sent' | 'delivered' | 'read'
}) {
  const isDark = useStageTheme() === 'dark'
  if (status === 'read') {
    return <CheckCheck size={14} className={isDark ? 'text-emerald-300' : 'text-sky-500'} />
  }
  if (status === 'delivered') return <CheckCheck size={14} className="opacity-80" />
  return <Check size={14} className="opacity-70" />
}

function reactionSystemLine(reactions: MessageReaction[]): string {
  const mine = reactions.find(r => r.mine)
  if (mine) return `Vous avez réagi ${mine.emoji} à ce message`
  const first = reactions[0]
  const name = (first?.users && first.users[0]) || 'Quelqu\'un'
  return `${name} a réagi ${first?.emoji || ''} à ce message`
}

interface MessageBubbleProps {
  message: Message
  isMine: boolean
  showSenderName?: boolean
  senderIsGroupAdmin?: boolean
  onReactionChange?: (messageId: string, emoji: string) => void
  onOpenMedia?: (message: Message) => void
  selectionMode?: boolean
  selected?: boolean
  toggleSelect?: () => void
}

export function MessageBubble({
  message,
  isMine,
  showSenderName = false,
  senderIsGroupAdmin = false,
  onReactionChange,
  onOpenMedia,
  selectionMode = false,
  selected = false,
  toggleSelect,
}: MessageBubbleProps) {
  // Sealed messages render through their decrypted inner kind.
  const kind =
    message.kind === 'sealed'
      ? message.sealedOk
        ? innerKindOf(message)
        : 'sealed'
      : (message.kind ?? (message.attachments.length > 0 ? 'file' : 'text'))
  const reactions = message.reactions ?? []
  const theme = useStageTheme()
  const isDark = theme === 'dark'
  const [menu, setMenu] = useState<null | 'quick' | 'picker'>(null)
  // Seen-at popover: whole-bubble hover opens (desktop), tap toggles
  // (mobile). Only one popover open at a time across bubbles.
  const [seenPin, setSeenPin] = useState(false)
  const [seenHover, setSeenHover] = useState(false)
  const seenPop = seenPin || seenHover
  const showSeenPop = isMine && message.status === 'read' && !!message.readAt

  useEffect(() => {
    if (!seenPop) return
    const closeOthers = (e: Event) => {
      if ((e as CustomEvent).detail !== message.id) {
        setSeenPin(false)
        setSeenHover(false)
      }
    }
    window.addEventListener('seen-pop-open', closeOthers)
    return () => window.removeEventListener('seen-pop-open', closeOthers)
  }, [seenPop, message.id])

  const announceSeenPop = () => {
    window.dispatchEvent(new CustomEvent('seen-pop-open', { detail: message.id }))
  }
  const longPressRef = useRef<number | null>(null)
  const pressPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const movedRef = useRef(false)

  const bubbleRef = useRef<HTMLDivElement>(null)

  // Sealed media bytes are decrypted lazily (ciphertext URL -> object URL).
  const sealedMediaUrl = useSealedMediaUrl(message)
  const sealedMediaActive = message.kind === 'sealed' && message.sealedOk === true && !!message.sealedMedia

  // Collapse the reaction menu on outside click (independent of CSS containing blocks)
  useEffect(() => {
    if (!menu) return
    const onPointerDown = (e: MouseEvent) => {
      const t = e.target as Element
      if (bubbleRef.current && !bubbleRef.current.contains(t)) setMenu(null)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [menu])

  const bubbleBase = isMine
    ? 'text-white rounded-2xl rounded-br-md'
    : cn('relative rounded-2xl rounded-bl-md border backdrop-blur-md overflow-hidden', isDark ? 'bg-white/[0.08] border-white/10 text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_28px_-14px_rgba(0,0,0,0.7)]' : 'bg-white/85 border-[color:var(--msg-hairline)] text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_28px_-16px_var(--msg-accent-glow)]')
  const mineBubbleStyle = isMine
    ? {
        backgroundImage: 'linear-gradient(135deg, var(--msg-accent-a, #8B7CFF) 0%, var(--msg-accent-b, #5B4BD4) 100%)',
        boxShadow: '0 10px 24px -10px var(--msg-accent-glow, rgba(124,92,255,0.6)), inset 0 1px 0 rgba(255,255,255,0.28)',
      }
    : undefined

  const attachmentUrl = sealedMediaActive
    ? sealedMediaUrl || undefined
    : resolveMediaUrl(
      message.attachmentUrl ||
        (message.attachments[0] && message.attachments[0].url && message.attachments[0].url !== '#' ? message.attachments[0].url : undefined)
    )
  const audioSrc = sealedMediaActive
    ? sealedMediaUrl || undefined
    : resolveMediaUrl(message.audioUrl || message.attachmentUrl)

  const subText = isMine ? 'text-white/70' : isDark ? 'text-slate-400' : 'text-slate-500'
  const subTextStrong = isMine ? 'text-white/90' : isDark ? 'text-slate-200' : 'text-slate-700'

  const cancelLongPress = () => {
    if (longPressRef.current) {
      window.clearTimeout(longPressRef.current)
      longPressRef.current = null
    }
  }

  useEffect(() => cancelLongPress, [])

  if (message.deleted) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn('flex', isMine ? 'justify-end' : 'justify-start')}
      >
        <StageBadge variant="neutral" className="gap-1.5">
          <Trash2 size={12} className="shrink-0" />
          Ce message a été supprimé
        </StageBadge>
      </motion.div>
    )
  }

  if (message.kind === 'system') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center my-1.5"
      >
        <StageBadge variant="neutral">{message.body}</StageBadge>
      </motion.div>
    )
  }

  // Undecryptable on this device — neutral placeholder, never ciphertext.
  if (message.kind === 'sealed' && message.sealedOk !== true) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn('flex', isMine ? 'justify-end' : 'justify-start')}
      >
        <div className={cn('px-4 py-2.5 rounded-2xl border backdrop-blur-md max-w-[78%]',
          isDark ? 'bg-white/[0.04] border-white/10' : 'bg-white/70 border-[color:var(--msg-hairline)]')}>
          <p className={cn('text-xs italic', isDark ? 'text-slate-400' : 'text-slate-500')}>
            Message illisible sur cet appareil.
          </p>
        </div>
      </motion.div>
    )
  }

  const startLongPress = (e: React.PointerEvent) => {
    if (!onReactionChange || selectionMode) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    pressPosRef.current = { x: e.clientX, y: e.clientY }
    movedRef.current = false
    cancelLongPress()
    longPressRef.current = window.setTimeout(() => {
      if (!movedRef.current) setMenu('quick')
    }, 450)
  }

  const moveLongPress = (e: React.PointerEvent) => {
    if (longPressRef.current == null) return
    const dx = Math.abs(e.clientX - pressPosRef.current.x)
    const dy = Math.abs(e.clientY - pressPosRef.current.y)
    if (dx > 8 || dy > 8) {
      movedRef.current = true
      cancelLongPress()
    }
  }

  const openBar = () => {
    if (onReactionChange && !selectionMode) setMenu('quick')
  }

  const onContextMenu = (e: React.MouseEvent) => {
    if (!onReactionChange || selectionMode) return
    e.preventDefault()
    setMenu(m => (m ? null : 'quick'))
  }

  const handleReact = (emoji: string) => {
    setMenu(null)
    onReactionChange?.(message.id, emoji)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={cn('flex', isMine ? 'justify-end' : 'justify-start')}
    >
      <div
        ref={bubbleRef}
        onMouseEnter={showSeenPop ? () => { setSeenHover(true); announceSeenPop() } : undefined}
        onMouseLeave={showSeenPop ? () => setSeenHover(false) : undefined}
        onClick={showSeenPop ? (e: React.MouseEvent) => {
          const t = e.target as Element
          if (t.closest('button, a, video, audio, input')) return
          setSeenPin(v => {
            const next = !v
            if (next) announceSeenPop()
            return next
          })
        } : undefined}
        className={cn(
          'relative max-w-[78%] sm:max-w-[68%] min-w-[80px]',
          isMine ? 'items-end' : 'items-start',
          reactions.length > 0 && 'mb-3',
          selectionMode && 'cursor-pointer'
        )}
        onContextMenu={onContextMenu}
        onPointerDown={selectionMode ? undefined : startLongPress}
        onPointerMove={selectionMode ? undefined : moveLongPress}
        onPointerUp={selectionMode ? undefined : cancelLongPress}
        onPointerLeave={selectionMode ? undefined : cancelLongPress}
      >
        {selectionMode && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation()
              toggleSelect?.()
            }}
            className={cn(
              'absolute -top-2 left-2 z-20 w-5 h-5 rounded-full flex items-center justify-center border shadow-sm transition-colors',
              selected
                ? 'text-white border-transparent'
                : isDark ? 'bg-white/10 border-white/20 text-transparent hover:border-[color:var(--msg-accent-line)]' : 'bg-white border-slate-900/20 text-transparent hover:border-[color:var(--msg-accent-line)]'
            )}
            style={selected ? {
              backgroundImage: 'linear-gradient(145deg, var(--msg-accent-a, #8B7CFF), var(--msg-accent-b, #5B4BD4))',
              boxShadow: '0 0 12px var(--msg-accent-glow, rgba(124,92,255,0.55))',
            } : undefined}
          >
            <Check size={12} strokeWidth={3} />
          </button>
        )}
        {showSenderName && !isMine && (
          <p
            className="text-[11px] font-bold mb-1 px-1"
            style={{ color: isDark ? 'var(--msg-accent-a)' : 'var(--msg-accent-line)' }}
          >
            {message.sender.name}
            {senderIsGroupAdmin && (
              <span className="font-medium opacity-70"> (Admin du groupe)</span>
            )}
          </p>
        )}

        <div className="relative">
          <div className={cn(bubbleBase, 'overflow-hidden')} style={mineBubbleStyle}>
            {!isMine && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-8 top-0 h-px z-10"
                style={{ background: 'linear-gradient(90deg, transparent, var(--msg-accent-line), transparent)' }}
              />
            )}
            {/* Image */}
            {kind === 'image' && message.attachments.length > 0 && (
              <div className="max-w-[260px]">
                {attachmentUrl ? (
                  <button
                    type="button"
                    onClick={() => onOpenMedia?.(message)}
                    disabled={!onOpenMedia}
                    className={cn('block w-full p-0 text-left', onOpenMedia && 'cursor-zoom-in')}
                    title="Afficher l'image"
                  >
                    <img
                      src={attachmentUrl}
                      alt={message.attachments[0].name}
                      className="h-44 w-full object-cover"
                    />
                  </button>
                ) : (
                  <div className="h-40 bg-gradient-to-br from-indigo-100 via-violet-100 to-sky-100 flex flex-col items-center justify-center gap-1.5">
                    <ImageIcon size={28} className={isMine ? 'text-white/70' : 'text-[color:var(--msg-accent-line)] opacity-60'} />
                    <span className={cn('text-[11px] font-medium', subText)}>{message.attachments[0].name}</span>
                  </div>
                )}
              </div>
            )}

            {/* Video */}
            {kind === 'video' && (
              attachmentUrl ? (
                <button
                  type="button"
                  onClick={() => onOpenMedia?.(message)}
                  disabled={!onOpenMedia}
                  className="relative block w-60 h-40 bg-slate-950 overflow-hidden group"
                  title="Lire la vidéo"
                >
                  <video src={attachmentUrl} preload="metadata" muted playsInline className="w-full h-full object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                    <span className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center transition-transform group-hover:scale-110">
                      <Play size={18} className="text-white ml-0.5" />
                    </span>
                  </span>
                  <span className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] font-semibold text-white bg-black/40 rounded px-1.5 py-0.5">
                    <Play size={10} /> {message.duration || 'Lire'}
                  </span>
                </button>
              ) : (
                <div className="relative w-56 h-40 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                  <Video size={26} className="text-white/60" />
                  <span className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] font-semibold text-white bg-black/40 rounded px-1.5 py-0.5">
                    <Play size={10} /> {message.duration || '0:05'}
                  </span>
                </div>
              )
            )}

            {/* Audio */}
            {kind === 'audio' && (
              audioSrc ? (
                <AudioPlayer src={audioSrc} isMine={isMine} fallbackDuration={message.duration} />
              ) : (
                <div className="w-60 flex items-center gap-2.5 px-3 py-2.5 opacity-90">
                  <span className={cn('w-8 h-8 rounded-full flex items-center justify-center', isMine ? 'bg-white/20 text-white' : 'bg-[var(--msg-accent-soft)] text-[color:var(--msg-accent-line)]')}>
                    <Play size={14} />
                  </span>
                  <div className="flex-1">
                    <div className="flex items-end gap-0.5 h-6">
                      {[10, 18, 26, 14, 30, 22, 12, 24, 16, 28].map((h, i) => (
                        <span key={i} className={cn('w-[3px] rounded-sm origin-bottom', isMine ? 'bg-white/50' : 'bg-[var(--msg-accent-line)] opacity-50')} style={{ height: `${h}px` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )
            )}

            {/* Call */}
            {kind === 'call' && (
              <div className="w-64 px-4 py-3 flex items-center gap-3">
                <span
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
                    message.callDirection === 'missed'
                      ? 'bg-red-100 text-red-500'
                      : isMine
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-100 text-emerald-600'
                  )}
                >
                  {message.callDirection === 'missed' ? (
                    <PhoneMissed size={16} />
                  ) : message.callDirection === 'incoming' ? (
                    <PhoneIncoming size={16} />
                  ) : (
                    <PhoneOutgoing size={16} />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium truncate', subTextStrong)}>
                    {message.callType === 'video' ? 'Appel vidéo' : 'Appel audio'}
                  </p>
                  <p className={cn('text-[11px] flex items-center gap-1', subText)}>
                    {message.callDirection === 'missed' ? (
                      <span className="text-red-500 font-medium">Manqué</span>
                    ) : (
                      <span>
                        {message.callDirection === 'incoming' ? 'Entrant' : 'Sortant'} • {message.duration || '0:00'}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Text body */}
            {message.body && (
              <div className={cn(kind === 'image' && 'px-3 pt-2')}>
                <p className={cn('text-sm leading-relaxed whitespace-pre-wrap break-words px-3 py-2', isMine ? 'text-white/95' : isDark ? 'text-slate-100' : 'text-slate-900')}>
                  {message.body}
                </p>
              </div>
            )}

            {/* File / document attachments */}
            {(kind === 'file' || (kind === 'text' && message.attachments.length > 0)) && message.attachments.length > 0 && (
              <div className="space-y-1.5 pb-2">
                {message.attachments.map(att => {
                  const realUrl = att.url && att.url !== '#' ? att.url : undefined
                  const row = (
                    <>
                      <span className={cn('shrink-0', isMine ? 'text-white/80' : 'text-[color:var(--msg-accent-line)]')}>
                        {fileIcon(att.name)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-xs font-medium truncate', subTextStrong)}>{att.name}</p>
                        <p className={cn('text-[10px]', subText)}>{att.size}</p>
                      </div>
                      <Download size={14} className={cn('shrink-0', subText)} />
                    </>
                  )
                  const cls = cn(
                    'mx-3 flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-colors',
                    isMine
                      ? 'bg-white/10 hover:bg-white/20'
                      : isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-[var(--msg-accent-soft)] hover:bg-[var(--msg-accent-border)]',
                    realUrl && onOpenMedia ? 'cursor-pointer' : 'cursor-default'
                  )
                  return realUrl && onOpenMedia ? (
                    <button key={att.id} type="button" onClick={() => onOpenMedia(message)} className={cls} title="Ouvrir le document">
                      {row}
                    </button>
                  ) : realUrl ? (
                    <a key={att.id} href={resolveMediaUrl(realUrl)} target="_blank" rel="noreferrer" className={cls} title="Télécharger / ouvrir">
                      {row}
                    </a>
                  ) : (
                    <div key={att.id} className={cls}>{row}</div>
                  )
                })}
              </div>
            )}

            {/* Footer */}
            <div className={cn('flex items-center justify-end gap-1 pb-1.5 pr-2', isMine ? 'pl-3' : 'pl-2 pr-3')}>
              <span className={cn('text-[10px] leading-none', subText)}>{formatTime(message.sentAt)}</span>
              {isMine && (
                <ReadReceipts status={message.status} />
              )}
            </div>
          </div>

          {/* Seen-at popover (staged) */}
          <AnimatePresence>
            {seenPop && showSeenPop && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full right-0 z-40 mb-2"
              >
                <div className="stage-glass !rounded-2xl pl-2 pr-1.5 py-1.5 flex items-center gap-2 whitespace-nowrap">
                  <span
                    className="w-7 h-7 rounded-xl flex items-center justify-center text-white shrink-0"
                    style={{
                      backgroundImage: 'linear-gradient(145deg, var(--msg-accent-a, #8B7CFF), var(--msg-accent-b, #5B4BD4))',
                      boxShadow: '0 4px 12px -4px var(--msg-accent-glow, rgba(124,92,255,0.65)), inset 0 1px 0 rgba(255,255,255,0.4)',
                    }}
                  >
                    <CheckCheck size={13} />
                  </span>
                  <span className="min-w-0">
                    <span className={cn('block text-[10px] font-bold uppercase tracking-wider leading-tight', isDark ? 'text-slate-400' : 'text-slate-500')}>
                      Vu
                    </span>
                    <span className={cn('block text-xs font-semibold leading-tight tabular-nums', isDark ? 'text-white' : 'text-slate-900')}>
                      {formatSeenAt(message.readAt!)}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation()
                      setSeenPin(false)
                      setSeenHover(false)
                    }}
                    className={cn('w-5 h-5 rounded-full flex items-center justify-center transition-colors shrink-0', isDark ? 'text-slate-500 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-900/5')}
                    title="Fermer"
                  >
                    <X size={11} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reaction chips */}
          {reactions.length > 0 && (
            <div className={cn('absolute -bottom-2.5 flex items-center gap-1', isMine ? 'right-2' : 'left-2')}>
              {reactions.map(r => (
                <button
                  key={r.emoji}
                  onClick={() => handleReact(r.emoji)}
                  title={(r.users || []).join(', ')}
                  style={r.mine ? mineBubbleStyle : undefined}
                  className={cn(
                    'flex items-center gap-1 pl-1.5 pr-2 py-0.5 rounded-full text-[11px] leading-none shadow-sm border backdrop-blur-md transition-colors',
                    r.mine
                      ? 'text-white border-transparent'
                      : isDark ? 'bg-white/[0.06] border-white/10 text-slate-200 hover:bg-white/10' : 'bg-white border-[color:var(--msg-hairline)] text-slate-700 hover:bg-[var(--msg-accent-soft)]'
                  )}
                >
                  <span className="text-xs leading-none">{r.emoji}</span>
                  {r.count > 1 && <span className="font-semibold text-[10px]">{r.count}</span>}
                </button>
              ))}
            </div>
          )}

          {/* Reaction bar */}
          <AnimatePresence>
            {menu && (
              <motion.div
                  key={menu}
                  initial={{ opacity: 0, scale: 0.9, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 6 }}
                  transition={{ duration: 0.12 }}
                  className={cn(
                    '!absolute z-40 flex stage-glass',
                    isMine ? 'right-0' : 'left-0',
                    menu === 'quick'
                      ? '-top-12 items-center gap-0.5 px-1.5 py-1 rounded-full'
                      : '-top-40 w-48 flex-wrap p-2 rounded-2xl'
                  )}
                >
                  {menu === 'quick' ? (
                    <>
                      {QUICK_REACTIONS.map(e => (
                        <button
                          key={e}
                          onClick={() => handleReact(e)}
                          className={cn('w-8 h-8 flex items-center justify-center text-lg hover:scale-110 transition rounded-full', isDark ? 'hover:bg-white/10' : 'hover:bg-[var(--msg-accent-soft)]')}
                        >
                          {e}
                        </button>
                      ))}
                      <button
                        onClick={() => setMenu('picker')}
                        title="Plus de réactions"
                        className={cn('w-8 h-8 flex items-center justify-center hover:scale-110 transition rounded-full', isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-[color:var(--msg-accent-line)] hover:bg-[var(--msg-accent-soft)]')}
                      >
                        <Plus size={15} />
                      </button>
                    </>
                  ) : (
                    REACTION_EMOJIS.map(e => (
                      <button
                        key={e}
                        onClick={() => handleReact(e)}
                        className={cn('w-7 h-7 flex items-center justify-center text-base rounded-md transition-colors', isDark ? 'hover:bg-white/10' : 'hover:bg-[var(--msg-accent-soft)]')}
                      >
                        {e}
                      </button>
                    ))
                  )}
                </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* System line */}
        {reactions.length > 0 && (
          <div className="mt-4 px-1 text-center">
            <span className={cn('text-[10px]', isDark ? 'text-slate-500' : 'text-slate-400')}>{reactionSystemLine(reactions)}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export function attachmentLabel(message: Message): string {
  const rawKind = message.kind ?? 'text'
  if (rawKind === 'sealed') {
    if (!message.sealedOk) return 'Fichier'
    const kind = innerKindOf(message)
    switch (kind) {
      case 'image': return 'Photo'
      case 'video': return 'Vidéo'
      case 'audio': return 'Message vocal'
      case 'file': return 'Fichier'
      default: return 'Message'
    }
  }
  const kind = rawKind
  switch (kind) {
    case 'image': return 'Photo'
    case 'video': return 'Vidéo'
    case 'audio': return 'Message vocal'
    case 'file': return 'Fichier'
    case 'call': return message.callType === 'video' ? 'Appel vidéo' : 'Appel audio'
    default: return message.body
  }
}

export function previewIcon(kind?: string) {
  switch (kind) {
    case 'sealed': return null
    case 'image': return <ImageIcon size={12} className="shrink-0" />
    case 'video': return <Film size={12} className="shrink-0" />
    case 'audio': return <Mic size={12} className="shrink-0" />
    case 'file': return <Paperclip size={12} className="shrink-0" />
    case 'call': return <Phone size={12} className="shrink-0" />
    default: return null
  }
}
