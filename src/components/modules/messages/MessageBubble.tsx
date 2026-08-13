import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCheck } from 'lucide-react'
import {
  Check, Paperclip, File, FileText, Image as ImageIcon,
  Video, Phone, PhoneMissed, PhoneIncoming, PhoneOutgoing, Play, Mic,
  Download, Film, Plus, Trash2,
} from 'react-feather'
import type { Message, MessageReaction } from '../../../types/messages'
import { cn } from '../../../lib/utils'
import { resolveMediaUrl } from '../../../utils/mediaUrl'
import { AudioPlayer } from './AudioPlayer'

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

function fileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <ImageIcon size={16} />
  if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) return <Video size={16} />
  if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return <Mic size={16} />
  if (['pdf'].includes(ext)) return <FileText size={16} />
  if (['zip', 'rar'].includes(ext)) return <File size={16} />
  return <File size={16} />
}

export function ReadReceipts({ status, readAt }: { status?: 'sent' | 'delivered' | 'read', readAt?: string }) {
  if (status === 'read') {
    return (
      <span className="flex items-center gap-1">
        <CheckCheck size={14} className="text-emerald-300" />
        {readAt && <span className="text-[10px] leading-none opacity-90">{formatTime(readAt)}</span>}
      </span>
    )
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
  const kind = message.kind ?? (message.attachments.length > 0 ? 'file' : 'text')
  const reactions = message.reactions ?? []
  const [menu, setMenu] = useState<null | 'quick' | 'picker'>(null)
  const longPressRef = useRef<number | null>(null)
  const pressPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const movedRef = useRef(false)

  const bubbleBase = isMine
    ? 'bg-accent text-white shadow-sm rounded-2xl rounded-br-md'
    : 'bg-card text-text border border-border/60 shadow-sm rounded-2xl rounded-bl-md'

  const attachmentUrl = resolveMediaUrl(
    message.attachmentUrl ||
      (message.attachments[0] && message.attachments[0].url && message.attachments[0].url !== '#' ? message.attachments[0].url : undefined)
  )
  const audioSrc = resolveMediaUrl(message.audioUrl || message.attachmentUrl)

  const subText = isMine ? 'text-white/70' : 'text-text-secondary/70'
  const subTextStrong = isMine ? 'text-white/90' : 'text-text-secondary'

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
        <div className="flex items-center gap-1.5 max-w-[78%] px-3 py-1.5 rounded-xl bg-card/60 border border-border/40 text-text-secondary/70">
          <Trash2 size={12} className="shrink-0" />
          <span className="text-xs">Ce message a été supprimé</span>
        </div>
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
        <span className="px-3 py-1 text-[11px] text-text-secondary/80 bg-card/60 border border-border/40 rounded-full">
          {message.body}
        </span>
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
                ? 'bg-accent border-accent text-white'
                : 'bg-card border-border text-transparent hover:border-accent'
            )}
          >
            <Check size={12} strokeWidth={3} />
          </button>
        )}
        {showSenderName && !isMine && (
          <p className={cn('text-[11px] font-semibold mb-1 px-1', 'text-accent')}>
            {message.sender.name}
            {senderIsGroupAdmin && (
              <span className="font-medium opacity-70"> (Admin du groupe)</span>
            )}
          </p>
        )}

        <div className="relative">
          <div className={cn(bubbleBase, 'overflow-hidden')}>
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
                    <ImageIcon size={28} className={isMine ? 'text-white/70' : 'text-accent/50'} />
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
                <div className="w-60 flex items-center gap-2.5 px-3 py-2.5 opacity-50">
                  <span className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center">
                    <Play size={14} />
                  </span>
                  <div className="flex-1">
                    <div className="flex items-end gap-0.5 h-6">
                      {[10, 18, 26, 14, 30, 22, 12, 24, 16, 28].map((h, i) => (
                        <span key={i} className={cn('w-[3px] rounded-sm origin-bottom', isMine ? 'bg-white/50' : 'bg-accent/40')} style={{ height: `${h}px` }} />
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
                <p className={cn('text-sm leading-relaxed whitespace-pre-wrap px-3 py-2', isMine ? 'text-white/95' : 'text-text')}>
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
                      <span className={cn('shrink-0', isMine ? 'text-white/80' : 'text-accent')}>
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
                    isMine ? 'bg-white/10 hover:bg-white/20' : 'bg-background hover:bg-border/40',
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
              {isMine && <ReadReceipts status={message.status} readAt={message.readAt} />}
            </div>
          </div>

          {/* Reaction chips */}
          {reactions.length > 0 && (
            <div className={cn('absolute -bottom-2.5 flex items-center gap-1', isMine ? 'right-2' : 'left-2')}>
              {reactions.map(r => (
                <button
                  key={r.emoji}
                  onClick={() => handleReact(r.emoji)}
                  title={(r.users || []).join(', ')}
                  className={cn(
                    'flex items-center gap-1 pl-1.5 pr-2 py-0.5 rounded-full text-[11px] leading-none shadow-sm border transition-colors',
                    r.mine
                      ? 'bg-accent text-white border-accent'
                      : 'bg-card text-text border-border/60 hover:bg-background'
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
              <>
                <div className="fixed inset-0 z-30" onClick={() => setMenu(null)} />
                <motion.div
                  key={menu}
                  initial={{ opacity: 0, scale: 0.9, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 6 }}
                  transition={{ duration: 0.12 }}
                  className={cn(
                    'absolute z-40 flex bg-card border border-border/60 shadow-modal',
                    isMine ? 'right-0' : 'left-0',
                    menu === 'quick'
                      ? '-top-12 items-center gap-0.5 px-1.5 py-1 rounded-full'
                      : '-top-40 w-48 flex-wrap p-2 rounded-xl'
                  )}
                >
                  {menu === 'quick' ? (
                    <>
                      {QUICK_REACTIONS.map(e => (
                        <button
                          key={e}
                          onClick={() => handleReact(e)}
                          className="w-8 h-8 flex items-center justify-center text-lg hover:bg-background hover:scale-110 transition rounded-full"
                        >
                          {e}
                        </button>
                      ))}
                      <button
                        onClick={() => setMenu('picker')}
                        title="Plus de réactions"
                        className="w-8 h-8 flex items-center justify-center text-text-secondary hover:text-text hover:bg-background hover:scale-110 transition rounded-full"
                      >
                        <Plus size={15} />
                      </button>
                    </>
                  ) : (
                    REACTION_EMOJIS.map(e => (
                      <button
                        key={e}
                        onClick={() => handleReact(e)}
                        className="w-7 h-7 flex items-center justify-center text-base hover:bg-background rounded-md transition-colors"
                      >
                        {e}
                      </button>
                    ))
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* System line */}
        {reactions.length > 0 && (
          <div className="mt-4 px-1 text-center">
            <span className="text-[10px] text-text-secondary/70">{reactionSystemLine(reactions)}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export function attachmentLabel(message: Message): string {
  const kind = message.kind ?? 'text'
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
    case 'image': return <ImageIcon size={12} className="shrink-0" />
    case 'video': return <Film size={12} className="shrink-0" />
    case 'audio': return <Mic size={12} className="shrink-0" />
    case 'file': return <Paperclip size={12} className="shrink-0" />
    case 'call': return <Phone size={12} className="shrink-0" />
    default: return null
  }
}
