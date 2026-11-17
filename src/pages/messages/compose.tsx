import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Search, Users, User, Shield, Send, X, Paperclip,
  FileText, MessageSquare, Clock, Star, EyeOff, Check,
  CheckCircle, Circle, Image as ImageIcon, Smile, Trash2, Plus, ChevronDown,
} from 'react-feather'
import EmojiPicker, { Theme } from 'emoji-picker-react'
import { mockTemplates } from '../../types/messages'
import type { MessageParticipant } from '../../types/messages'
import { cn, getAdminBasePath } from '../../lib/utils'
import { Avatar } from '../../components/modules/messages/Avatar'
import { Checkbox } from '../../components/ui/Checkbox'
import { DatePicker } from '../../components/ui/DatePicker'
import { TimePicker } from '../../components/ui/TimePicker'
import { useToast } from '../../components/ui/Toast'
import {
  OrbIcon, StageBadge, StageButton, GERANT_MAUVE_HUE, useStageAccent, useStageTheme,
} from '../../components/dashboard/Stage'
import {
  fetchMessageUsers, fetchCurrentUser, createConversation, sendMessage, uploadAttachment,
} from '../../services/messageService'
import {
  sealForConversation,
  cacheOwnSealed,
  formatBytes,
  myIdFromToken,
} from '../../services/e2ee/conversation'
import { encryptBlob } from '../../services/e2ee/chat'
import { useMessagingAppearance, messageZoomStyle } from '../../services/messageAppearance'

function isAdminRoute() {
  if (typeof window === 'undefined') return false
  return window.location.pathname.startsWith('/admin')
}

interface DirectoryItem extends MessageParticipant {
  email: string
}

type RecipientFilter = 'all' | 'client' | 'agent' | 'admin' | 'group'

const TABS: { id: RecipientFilter; label: string; Icon: typeof Users }[] = [
  { id: 'all', label: 'Tous', Icon: Users },
  { id: 'client', label: 'Clients', Icon: User },
  { id: 'agent', label: 'Agents', Icon: Users },
  { id: 'admin', label: 'Admins', Icon: Shield },
  { id: 'group', label: 'Groupes', Icon: MessageSquare },
]

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes)) return ''
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

function typeBadgeLabel(type: string): string {
  if (type === 'group') return 'Groupe'
  if (type === 'admin') return 'Admin'
  if (type === 'client') return 'Client'
  if (type === 'agent') return 'Agent'
  return type
}

export default function ComposeMessagePage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const admin = isAdminRoute()
  const appearance = useMessagingAppearance()
  const zoomStyle = messageZoomStyle(appearance.messageSize)
  const theme = useStageTheme()
  const isDark = theme === 'dark'
  const stageAccent = useStageAccent()
  const [searchParams] = useSearchParams()
  const clientId = searchParams.get('clientId')
  const templateId = searchParams.get('templateId')

  const [directory, setDirectory] = useState<DirectoryItem[]>([])
  const [usersReady, setUsersReady] = useState(false)
  const [filter, setFilter] = useState<RecipientFilter>(clientId ? 'client' : 'all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<DirectoryItem[]>([])
  const [groupName, setGroupName] = useState('')
  const [body, setBody] = useState(() => {
    const t = templateId ? mockTemplates.find(t => t.id === templateId) : null
    return t ? t.body : ''
  })
  const [templatePick, setTemplatePick] = useState(templateId ?? '')
  const [templateOpen, setTemplateOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [sendCopy, setSendCopy] = useState(false)
  const [scheduleSend, setScheduleSend] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [markImportant, setMarkImportant] = useState(false)
  const [disableReceipts, setDisableReceipts] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [currentRole, setCurrentRole] = useState<string | null>(null)
  const [myId, setMyId] = useState<string>(() => myIdFromToken() ?? '')

  const isGerant = admin && currentRole === 'gerant'
  const interfaceHue = isGerant ? GERANT_MAUVE_HUE : stageAccent

  useEffect(() => {
    fetchCurrentUser()
      .then(u => {
        setMyId(String(u.id))
        setCurrentRole(u.role ?? null)
      })
      .catch(() => {})
  }, [])

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const emojiWrapRef = useRef<HTMLDivElement>(null)
  const templateWrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const users = await fetchMessageUsers()
        if (!cancelled) setDirectory(users as DirectoryItem[])
      } catch {
        if (!cancelled) toast('error', "Impossible de charger la liste des destinataires.")
      } finally {
        if (!cancelled) setUsersReady(true)
      }
    }
    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Pré-sélection via ?clientId=
  useEffect(() => {
    if (!clientId || !usersReady || directory.length === 0) return
    const found = directory.find(d => String(d.id) === String(clientId))
    if (found && !selected.some(s => s.id === found.id)) {
      setSelected([found])
      if (found.type === 'client' || found.type === 'agent' || found.type === 'admin' || found.type === 'group') {
        setFilter(found.type)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, usersReady, directory])

  // Auto-resize du textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 260) + 'px'
  }, [body])

  // Fermer les popovers au clic extérieur
  useEffect(() => {
    if (!emojiOpen && !templateOpen) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Element
      if (emojiOpen && emojiWrapRef.current && !emojiWrapRef.current.contains(t)) setEmojiOpen(false)
      if (templateOpen && templateWrapRef.current && !templateWrapRef.current.contains(t)) setTemplateOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [emojiOpen, templateOpen])

  const isGroup = selected.length > 1

  const counts = useMemo(() => {
    const c: Record<RecipientFilter, number> = { all: directory.length, client: 0, agent: 0, admin: 0, group: 0 }
    for (const d of directory) {
      if (d.type === 'client') c.client += 1
      else if (d.type === 'agent') c.agent += 1
      else if (d.type === 'admin') c.admin += 1
      else if (d.type === 'group') c.group += 1
    }
    return c
  }, [directory])

  const results = useMemo(() => {
    let list = directory
    if (filter !== 'all') list = list.filter(d => d.type === filter)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(d =>
        d.name.toLowerCase().includes(q) ||
        (d.email || '').toLowerCase().includes(q) ||
        (d.role || '').toLowerCase().includes(q)
      )
    }
    return list.filter(d => !selected.some(s => s.id === d.id))
  }, [filter, search, selected, directory])

  // Aperçus locaux pour les images (URL éphémères, révoquées au cleanup)
  const filePreviews = useMemo(() => {
    const map = new Map<number, string>()
    files.forEach((f, i) => {
      if (f.type.startsWith('image/')) {
        try { map.set(i, URL.createObjectURL(f)) } catch { /* ignore */ }
      }
    })
    return map
  }, [files])

  useEffect(() => {
    return () => {
      filePreviews.forEach(url => {
        try { URL.revokeObjectURL(url) } catch { /* ignore */ }
      })
    }
  }, [filePreviews])

  const toggleSelect = (item: DirectoryItem) => {
    setSelected(prev => prev.some(s => s.id === item.id) ? prev.filter(s => s.id !== item.id) : [...prev, item])
  }

  const addFiles = (incoming: FileList | File[]) => {
    const arr = Array.from(incoming || [])
    if (arr.length === 0) return
    setFiles(prev => [...prev, ...arr].slice(0, 10))
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const insertTemplate = (id: string) => {
    setTemplatePick(id)
    setTemplateOpen(false)
    if (!id) return
    const t = mockTemplates.find(t => t.id === id)
    if (t) {
      setBody(t.body)
      textareaRef.current?.focus()
    }
  }

  const activeTemplate = mockTemplates.find(t => t.id === templatePick)

  const isFormValid =
    selected.length > 0 &&
    (!isGroup || groupName.trim().length > 0) &&
    body.trim().length > 0

  const groupSubject = groupName.trim() || selected.map(s => s.name.split(' ')[0]).join(', ')
  const basePath = admin ? getAdminBasePath() : ''
  const charCount = body.trim().length

  const previewNames = selected.length <= 2
    ? selected.map(s => s.name).join(', ')
    : `${selected.slice(0, 2).map(s => s.name.split(' ')[0]).join(', ')} +${selected.length - 2}`

  // Date + heure programmées — combinées au format `YYYY-MM-DDTHH:mm`
  const [scheduleDatePart, scheduleTimePart] = useMemo(() => {
    if (!scheduleDate) return ['', '']
    const [d, t] = scheduleDate.split('T')
    return [d || '', (t || '').slice(0, 5)]
  }, [scheduleDate])

  const scheduleTodayStr = useMemo(() => {
    const n = new Date()
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`
  }, [])

  const handleScheduleDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = e.target.value
    if (!d) {
      setScheduleDate('')
      return
    }
    setScheduleDate(`${d}T${scheduleTimePart || '09:00'}`)
  }

  const handleScheduleTime = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = e.target.value
    if (!t) {
      setScheduleDate(scheduleDatePart ? `${scheduleDatePart}T09:00` : '')
      return
    }
    setScheduleDate(`${scheduleDatePart || scheduleTodayStr}T${t}`)
  }

  const scheduleLabel = useMemo(() => {
    if (!scheduleDate) return ''
    const d = new Date(scheduleDate)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }, [scheduleDate])

  const handleSend = async () => {
    if (!isFormValid || isSending) return
    setIsSending(true)
    try {
      // Opportunistic seal: sealed envelope for all-keyed recipients, else plaintext.
      const attempt = await sealForConversation({ myId, participants: selected, text: body.trim() })
      const conv = await createConversation({
        participantIds: selected.map(s => Number(s.id)).filter(n => Number.isFinite(n) && n > 0),
        name: isGroup ? groupName.trim() : undefined,
        firstMessage: attempt.body,
        kind: attempt.kind,
      })
      if (attempt.sealed && attempt.payload) {
        const own = [...(conv.messages || [])].reverse().find(m => String(m.sender?.id) === String(myId))
        if (own) cacheOwnSealed(myId, own.id, attempt.payload)
      }
      // Pièces jointes : chiffrées quand la conversation est scellée, sinon envoi classique.
      for (const file of files) {
        try {
          if (attempt.sealed) {
            const enc = await encryptBlob(file)
            const up = await uploadAttachment(new File([enc.bytes], file.name, { type: 'application/octet-stream' }))
            const meta = {
              key: enc.keyB64, iv: enc.ivB64,
              name: file.name, size: file.size, mime: file.type || 'application/octet-stream',
            }
            const a2 = await sealForConversation({ myId, participants: selected, text: '', media: meta })
            if (a2.sealed && a2.payload) {
              const m = await sendMessage(conv.id, {
                body: a2.body, kind: 'sealed',
                attachmentName: file.name, attachmentSize: formatBytes(file.size), attachmentUrl: up.url,
              })
              cacheOwnSealed(myId, m.id, a2.payload)
              continue
            }
          }
          const up = await uploadAttachment(file)
          await sendMessage(conv.id, {
            body: `📎 ${up.name}`,
            kind: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file',
            attachmentName: up.name,
            attachmentSize: up.size,
            attachmentUrl: up.url,
          })
        } catch {
          // n'interrompt pas la création — la conversation existe déjà
        }
      }
      if (scheduleSend && scheduleDate) {
        const when = new Date(scheduleDate).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
        toast('info', `Conversation créée — rappel programmé pour le ${when} (option locale).`)
      } else {
        toast('success', isGroup ? 'Groupe créé et message envoyé.' : 'Message envoyé.')
      }
      navigate(`${basePath}/messages?id=${conv.id}`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Impossible de créer la conversation."
      toast('error', msg)
      setIsSending(false)
    }
  }

  const msgVars = {
    '--msg-accent-a': interfaceHue.a,
    '--msg-accent-b': interfaceHue.b,
    '--msg-accent-line': interfaceHue.line,
    '--msg-accent-glow': interfaceHue.glow,
    '--msg-accent-soft': `${interfaceHue.a}18`,
    '--msg-accent-border': `${interfaceHue.a}42`,
    '--msg-hairline': isDark ? 'rgba(255,255,255,0.10)' : `${interfaceHue.line}1F`,
    '--msg-hairline-soft': isDark ? 'rgba(255,255,255,0.05)' : `${interfaceHue.line}12`,
    '--msg-ink': isDark ? '#E2E8F0' : interfaceHue.line,
    '--msg-ink-soft': isDark ? 'rgba(148,163,184,0.8)' : `${interfaceHue.line}B3`,
  } as CSSProperties
  const gradientTitle = isDark
    ? (admin ? 'from-[#F43F5E] via-[#FB7185] to-[#8B7CFF]' : 'from-white via-indigo-100 to-indigo-300')
    : (isGerant
        ? 'from-[#905D5D] via-[#A56E6E] to-[#C89292]'
        : admin ? 'from-[#EA580C] via-[#F97316] to-[#FBBF24]' : 'from-teal-900 via-teal-700 to-emerald-600')
  const lightInk = isDark ? 'text-slate-400' : isGerant ? 'text-[#905D5D]/65' : admin ? 'text-orange-900/60' : 'text-[color:var(--msg-ink-soft)]'
  const stageInput = isDark
    ? 'bg-white/[0.05] border-white/10 text-white placeholder:text-slate-500 focus:bg-white/[0.07] focus:border-[color:var(--msg-accent-line)] focus:ring-2 focus:ring-[var(--msg-accent-soft)]'
    : 'bg-white border-[color:var(--msg-hairline)] text-slate-900 placeholder:text-slate-400 focus:border-[color:var(--msg-accent-line)] focus:ring-2 focus:ring-[var(--msg-accent-soft)]'

  const steps = [
    { n: 1, label: 'Destinataires', done: selected.length > 0, hint: selected.length > 0 ? `${selected.length} choisi${selected.length > 1 ? 's' : ''}` : 'À choisir' },
    { n: 2, label: 'Message', done: body.trim().length > 0, hint: charCount > 0 ? `${charCount} caractères` : 'À rédiger' },
    { n: 3, label: 'Envoi', done: isFormValid, hint: isFormValid ? 'Prêt' : 'En attente' },
  ]

  return (
    <div className={cn('flex flex-col h-full w-full animate-fade-in overflow-y-auto')} style={{ ...zoomStyle, ...msgVars }}>
      {/* Hero */}
      <div className="relative z-10 flex flex-wrap items-end justify-between gap-4 shrink-0 pb-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate(`${basePath}/messages`)}
            className={cn('w-10 h-10 rounded-xl border flex items-center justify-center transition-colors shrink-0',
              isDark ? 'border-white/10 text-slate-300 hover:text-white hover:bg-white/5' : 'border-[color:var(--msg-hairline)] text-slate-500 hover:text-[color:var(--msg-ink)] hover:bg-white/70 bg-white/60')}
            title="Retour à la messagerie"
          >
            <ArrowLeft size={17} />
          </button>
          <OrbIcon icon={MessageSquare} hue={interfaceHue} size={48} radius={14} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
              </span>
              <p className={cn('text-[10px] font-bold uppercase tracking-[0.24em] truncate', isDark ? 'text-slate-400/80' : lightInk)}>
                Messagerie · Nouvelle conversation
              </p>
            </div>
            <h1 className={cn('mt-1 bg-gradient-to-r bg-clip-text text-2xl sm:text-3xl font-extrabold tracking-tight truncate text-transparent', gradientTitle)}>
              Nouvelle conversation
            </h1>
            <p className={cn('mt-0.5 text-sm truncate', lightInk)}>
              {isGroup ? `Groupe · ${selected.length} membres · ${groupSubject}` : selected.length === 1 ? `À : ${selected[0].name}` : 'Choisissez un destinataire, rédigez, envoyez'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StageButton variant="glass" icon={<ArrowLeft size={14} />} onClick={() => navigate(`${basePath}/messages`)}>
            Annuler
          </StageButton>
          <StageButton
            variant="primary"
            icon={isSending ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Send size={14} />}
            onClick={handleSend}
            disabled={!isFormValid || isSending}
          >
            {isSending ? 'Envoi…' : scheduleSend && scheduleDate ? 'Programmer' : isGroup ? 'Créer et envoyer' : 'Envoyer'}
          </StageButton>
        </div>
      </div>

      {/* Étapes */}
      <div className="relative z-10 grid grid-cols-3 gap-2 sm:gap-3 shrink-0 pb-4">
        {steps.map((s) => (
          <div key={s.n} className={cn('stage-glass !rounded-2xl px-3 py-2.5 flex items-center gap-2.5 min-w-0',
            s.done && '!border-[color:var(--msg-accent-border)]')}>
            <span
              className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-extrabold text-white shrink-0"
              style={{
                backgroundImage: 'linear-gradient(145deg, var(--msg-accent-a), var(--msg-accent-b))',
                boxShadow: '0 6px 16px -6px var(--msg-accent-glow), inset 0 1px 0 rgba(255,255,255,0.4)',
              }}
            >
              {s.done ? <Check size={13} strokeWidth={3} /> : s.n}
            </span>
            <div className="min-w-0 hidden sm:block">
              <p className={cn('text-xs font-bold leading-tight truncate', isDark ? 'text-white' : 'text-slate-900')}>
                {s.label}
              </p>
              <p className={cn('text-[11px] truncate', isDark ? 'text-slate-400' : 'text-slate-500')}>{s.hint}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Corps principal */}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col lg:flex-row stage-glass overflow-hidden">
        {/* ── Colonne destinataires ── */}
        <aside className={cn('lg:w-[310px] shrink-0 border-b lg:border-b-0 lg:border-r flex flex-col min-h-0 max-h-[42vh] lg:max-h-none',
          isDark ? 'border-white/10' : 'border-[color:var(--msg-hairline)]')}>
          <div className={cn('p-3 border-b space-y-2.5 shrink-0', isDark ? 'border-white/10' : 'border-[color:var(--msg-hairline)]')}>
            {/* Titre stagé */}
            <div className="flex items-center gap-2.5">
              <OrbIcon icon={Users} hue={interfaceHue} size={34} radius={11} />
              <div className="min-w-0 flex-1">
                <h2 className={cn('text-sm font-bold tracking-tight leading-tight', isDark ? 'text-white' : 'text-slate-900')}>
                  Destinataires
                </h2>
                <p className={cn('text-[11px] leading-tight', isDark ? 'text-slate-400' : 'text-slate-500')}>
                  {selected.length > 0
                    ? `${selected.length} sélectionné${selected.length > 1 ? 's' : ''}${isGroup ? ' · groupe' : ''}`
                    : `${directory.length} contact${directory.length > 1 ? 's' : ''} disponible${directory.length > 1 ? 's' : ''}`}
                </p>
              </div>
              {isGroup && <StageBadge variant="warn">Groupe</StageBadge>}
            </div>
            <div className="relative">
              <Search size={15} className={cn('absolute left-3.5 top-1/2 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-slate-400')} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher nom, email, rôle…"
                className={cn('w-full h-10 pl-10 pr-3 text-sm rounded-xl border focus:outline-none transition-all', stageInput)}
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {TABS.map(tab => {
                const Icon = tab.Icon
                const active = filter === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id)}
                    className={cn('flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border whitespace-nowrap transition-all',
                      active
                        ? 'text-white border-transparent'
                        : isDark ? 'text-slate-400 border-white/10 hover:text-white hover:bg-white/5' : 'text-slate-500 border-[color:var(--msg-hairline)] hover:text-[color:var(--msg-ink)] hover:bg-[var(--msg-accent-soft)]')}
                    style={active ? {
                      backgroundImage: 'linear-gradient(145deg, var(--msg-accent-a), var(--msg-accent-b))',
                      boxShadow: '0 6px 16px -6px var(--msg-accent-glow)',
                    } : undefined}
                  >
                    <Icon size={13} /> {tab.label}
                    <span className={cn('text-[10px] font-bold px-1 rounded', active ? 'bg-white/20' : isDark ? 'bg-white/5 text-slate-500' : 'bg-slate-900/5 text-slate-400')}>
                      {counts[tab.id]}
                    </span>
                  </button>
                )
              })}
            </div>
            {selected.length > 0 && (
              <div
                className={cn('rounded-2xl border p-2 space-y-2 backdrop-blur-md transition-all',
                  isDark
                    ? 'bg-[var(--msg-accent-soft)] border-[color:var(--msg-accent-border)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_24px_-12px_var(--msg-accent-glow)]'
                    : 'bg-[var(--msg-accent-soft)] border-[color:var(--msg-accent-border)] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_24px_-12px_var(--msg-accent-glow)]')}
              >
                <div className="flex items-center justify-between gap-2 px-1">
                  <p className={cn('text-[10px] font-bold uppercase tracking-[0.14em]', isDark ? 'text-[color:var(--msg-accent-line)]' : 'text-[color:var(--msg-accent-line)]')}>
                    Sélection · {selected.length}
                  </p>
                  <button
                    onClick={() => setSelected([])}
                    className={cn('inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-full transition-colors',
                      isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50')}
                  >
                    <Trash2 size={11} /> Tout effacer
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selected.map(item => (
                    <span
                      key={item.id}
                      className={cn('inline-flex items-center gap-2 pl-1 pr-1 py-1 rounded-full text-xs font-semibold border backdrop-blur-md transition-all',
                        isDark
                          ? 'bg-white/[0.06] border-[color:var(--msg-accent-border)] text-white shadow-[0_4px_16px_-8px_var(--msg-accent-glow)]'
                          : 'bg-white border-[color:var(--msg-accent-border)] text-slate-800 shadow-[0_4px_16px_-8px_var(--msg-accent-glow)]')}
                    >
                      <Avatar participant={item} size="xs" />
                      <span className="max-w-[110px] truncate">{item.name}</span>
                      <button
                        onClick={() => toggleSelect(item)}
                        className={cn('w-5 h-5 rounded-full flex items-center justify-center transition-colors shrink-0',
                          isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50')}
                        title={`Retirer ${item.name}`}
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
            <AnimatePresence>
              {isGroup && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden"
                >
                  <div className="relative">
                    <Users size={14} className={cn('absolute left-3 top-1/2 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-slate-400')} />
                    <input
                      type="text"
                      value={groupName}
                      onChange={e => setGroupName(e.target.value)}
                      placeholder="Nom du groupe — Ex. : Équipe Casa"
                      className={cn('w-full h-10 pl-9 pr-3 text-sm rounded-xl border focus:outline-none transition-all', stageInput,
                        isGroup && !groupName.trim() && (isDark ? '!border-amber-400/40' : '!border-amber-500/40'))}
                    />
                  </div>
                  <p className={cn('text-[11px] mt-1.5', !groupName.trim() ? (isDark ? 'text-amber-300' : 'text-amber-600') : isDark ? 'text-slate-500' : 'text-slate-400')}>
                    {!groupName.trim()
                      ? `Nom requis pour un groupe de ${selected.length} membres.`
                      : `Groupe « ${groupName.trim()} » · ${selected.length} membres + vous.`}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-1.5">
            {!usersReady ? (
              <div className="space-y-1.5 p-1.5">
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl animate-pulse', isDark ? 'bg-white/[0.03]' : 'bg-slate-900/[0.03]')}>
                    <div className={cn('w-10 h-10 rounded-full', isDark ? 'bg-white/10' : 'bg-slate-900/10')} />
                    <div className="flex-1 space-y-1.5">
                      <div className={cn('h-3 rounded w-2/3', isDark ? 'bg-white/10' : 'bg-slate-900/10')} />
                      <div className={cn('h-2 rounded w-1/2', isDark ? 'bg-white/5' : 'bg-slate-900/5')} />
                    </div>
                  </div>
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className={cn('flex flex-col items-center justify-center py-10 px-4 text-center')}>
                <Users size={22} className={isDark ? 'text-slate-600' : 'text-slate-300'} />
                <p className={cn('mt-2 text-sm font-semibold', isDark ? 'text-slate-300' : 'text-slate-600')}>Aucun destinataire</p>
                <p className={cn('text-xs mt-0.5', isDark ? 'text-slate-500' : 'text-slate-400')}>
                  {selected.length > 0 ? 'Tous les résultats sont déjà sélectionnés.' : 'Essayez un autre filtre ou une autre recherche.'}
                </p>
              </div>
            ) : (
              results.map(item => (
                <button
                  key={item.id}
                  onClick={() => toggleSelect(item)}
                  className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left group',
                    isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-white/70')}
                >
                  <Avatar participant={item} showPresence size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p className={cn('text-sm font-semibold truncate', isDark ? 'text-white' : 'text-slate-900')}>{item.name}</p>
                      <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide shrink-0 border',
                        isDark ? 'bg-[var(--msg-accent-soft)] text-[color:var(--msg-accent-line)] border-[color:var(--msg-accent-border)]' : 'bg-[var(--msg-accent-soft)] text-[color:var(--msg-accent-line)] border-[color:var(--msg-accent-border)]')}>
                        {typeBadgeLabel(item.type)}
                      </span>
                    </div>
                    <p className={cn('text-[11px] truncate', isDark ? 'text-slate-500' : 'text-slate-400')}>{item.email || item.role || '—'}</p>
                  </div>
                  <span className={cn('w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all border',
                    isDark ? 'border-white/15 text-slate-500 group-hover:text-white group-hover:bg-[var(--msg-accent-soft)] group-hover:border-[color:var(--msg-accent-border)]'
                      : 'border-slate-900/15 text-slate-400 group-hover:text-[color:var(--msg-accent-line)] group-hover:bg-[var(--msg-accent-soft)] group-hover:border-[color:var(--msg-accent-border)]')}>
                    <Plus size={13} />
                  </span>
                </button>
              ))
            )}
          </div>
          <div className={cn('px-3 py-2 border-t text-[11px] shrink-0', isDark ? 'border-white/10 text-slate-500' : 'border-[color:var(--msg-hairline)] text-slate-400')}>
            {usersReady ? `${results.length} résultat${results.length > 1 ? 's' : ''} · ${selected.length} sélectionné${selected.length > 1 ? 's' : ''}` : 'Chargement…'}
          </div>
        </aside>

        {/* ── Colonne message ── */}
        <section className={cn('flex-1 min-w-0 flex flex-col', isDark ? 'bg-white/[0.015]' : 'bg-white/40')}>
          {/* Barre destinataires */}
          <div className={cn('flex items-center gap-3 px-4 py-3 border-b shrink-0 min-h-[61px]',
            isDark ? 'border-white/10 bg-white/[0.02]' : 'border-[color:var(--msg-hairline)] bg-white/60')}>
            <span className={cn('text-[11px] font-bold uppercase tracking-wider shrink-0', isDark ? 'text-slate-500' : 'text-slate-400')}>À :</span>
            {selected.length === 0 ? (
              <span className={cn('text-sm italic', isDark ? 'text-slate-500' : 'text-slate-400')}>Sélectionnez au moins un destinataire…</span>
            ) : (
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="flex -space-x-2 shrink-0">
                  {selected.slice(0, 4).map(p => (
                    <Avatar
                      key={p.id}
                      participant={p}
                      size="xs"
                      className={cn('ring-2', isDark ? 'ring-[#1b2342]' : 'ring-white')}
                    />
                  ))}
                </div>
                <p className={cn('text-sm font-semibold truncate flex-1', isDark ? 'text-white' : 'text-slate-900')}>{previewNames}</p>
                {isGroup && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/25 shrink-0">
                    <Users size={10} /> Groupe
                  </span>
                )}
                <button
                  onClick={() => setSelected([])}
                  className={cn('p-1.5 rounded-lg transition-colors shrink-0', isDark ? 'text-slate-500 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-[color:var(--msg-ink)] hover:bg-[var(--msg-accent-soft)]')}
                  title="Effacer les destinataires"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
            {/* Modèle + emoji + compteur */}
            <div className="flex flex-wrap items-center gap-2">
              <div ref={templateWrapRef} className="relative">
                <button
                  type="button"
                  onClick={() => { setTemplateOpen(o => !o); setEmojiOpen(false) }}
                  className={cn('h-9 pl-3 pr-2.5 flex items-center gap-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer max-w-[240px]',
                    templateOpen
                      ? 'text-white border-transparent'
                      : isDark
                        ? 'bg-white/[0.05] border-white/10 text-slate-200 hover:bg-white/[0.08] hover:border-[color:var(--msg-accent-border)]'
                        : 'bg-white border-[color:var(--msg-hairline)] text-slate-700 hover:border-[color:var(--msg-accent-border)] hover:shadow-[0_0_20px_-6px_var(--msg-accent-glow)]')}
                  style={templateOpen ? {
                    backgroundImage: 'linear-gradient(145deg, var(--msg-accent-a), var(--msg-accent-b))',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 8px 20px -8px var(--msg-accent-glow)',
                  } : undefined}
                  title="Insérer un modèle"
                >
                  <FileText size={14} className={cn('shrink-0', templateOpen ? 'text-white' : 'text-[color:var(--msg-accent-line)]')} />
                  <span className="truncate">{activeTemplate ? activeTemplate.name : 'Modèle…'}</span>
                  {templatePick && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={e => { e.stopPropagation(); insertTemplate('') }}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); insertTemplate('') } }}
                      className={cn('w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors',
                        templateOpen ? 'hover:bg-white/20' : isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-900/10 text-slate-400')}
                      title="Retirer le modèle"
                    >
                      <X size={10} />
                    </span>
                  )}
                  <ChevronDown size={13} className={cn('shrink-0 transition-transform duration-200', templateOpen && 'rotate-180')} />
                </button>
                <AnimatePresence>
                  {templateOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className={cn('!absolute left-0 top-11 z-40 w-72 overflow-hidden rounded-2xl p-1.5 border max-h-[320px] overflow-y-auto',
                        isDark
                          ? 'bg-[#141b34]/95 backdrop-blur-xl border-white/10 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.08)]'
                          : 'bg-white/95 backdrop-blur-xl border-[color:var(--msg-hairline)] shadow-[0_24px_60px_-24px_var(--msg-accent-glow),inset_0_1px_0_rgba(255,255,255,0.9)]')}
                    >
                      <button
                        type="button"
                        onClick={() => insertTemplate('')}
                        className={cn('w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold rounded-xl transition-colors text-left',
                          !templatePick
                            ? isDark ? 'bg-[var(--msg-accent-soft)] text-white' : 'bg-[var(--msg-accent-soft)] text-[color:var(--msg-ink)]'
                            : isDark ? 'text-slate-300 hover:bg-white/5' : 'text-slate-600 hover:bg-[var(--msg-accent-soft)]')}
                      >
                        <span className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                          isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-900/5 text-slate-400')}>
                          <X size={13} />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block truncate">Sans modèle</span>
                          <span className={cn('block text-[11px] font-normal truncate', isDark ? 'text-slate-400' : 'text-slate-400')}>Message libre</span>
                        </span>
                        {!templatePick && <Check size={13} className={isDark ? 'text-[color:var(--msg-accent-line)]' : 'text-[color:var(--msg-accent-line)]'} />}
                      </button>
                      {mockTemplates.map(t => {
                        const active = t.id === templatePick
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => insertTemplate(t.id)}
                            className={cn('w-full flex items-center gap-2.5 px-3 py-2.5 text-xs rounded-xl transition-colors text-left',
                              active
                                ? isDark ? 'bg-[var(--msg-accent-soft)] text-white' : 'bg-[var(--msg-accent-soft)] text-[color:var(--msg-ink)]'
                                : isDark ? 'hover:bg-white/10 text-slate-100' : 'hover:bg-[var(--msg-accent-soft)] text-slate-700')}
                          >
                            <span
                              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white"
                              style={active
                                ? { backgroundImage: 'linear-gradient(145deg, var(--msg-accent-a), var(--msg-accent-b))' }
                                : isDark ? { background: 'rgba(255,255,255,0.06)' } : { background: 'var(--msg-accent-soft)' }}
                            >
                              <FileText size={13} className={active ? 'text-white' : isDark ? 'text-[color:var(--msg-accent-line)]' : 'text-[color:var(--msg-accent-line)]'} />
                            </span>
                            <span className="flex-1 min-w-0">
                              <span className="flex items-center gap-1.5">
                                <span className="font-semibold truncate">{t.name}</span>
                                <span className={cn('text-[9px] font-bold px-1.5 py-px rounded-md uppercase tracking-wide shrink-0 border',
                                  isDark ? 'bg-[var(--msg-accent-soft)] text-[color:var(--msg-accent-line)] border-[color:var(--msg-accent-border)]' : 'bg-[var(--msg-accent-soft)] text-[color:var(--msg-accent-line)] border-[color:var(--msg-accent-border)]')}>
                                  {t.category}
                                </span>
                              </span>
                              <span className={cn('block text-[11px] font-normal truncate', isDark ? 'text-slate-400' : 'text-slate-400')}>
                                {t.body.split('\n')[0]?.slice(0, 60) || 'Voir le contenu…'}
                              </span>
                            </span>
                            {active && <Check size={13} className={cn('shrink-0', isDark ? 'text-[color:var(--msg-accent-line)]' : 'text-[color:var(--msg-accent-line)]')} />}
                          </button>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div ref={emojiWrapRef} className="relative">
                <button
                  onClick={() => setEmojiOpen(o => !o)}
                  className={cn('h-9 w-9 rounded-xl border flex items-center justify-center transition-colors',
                    emojiOpen
                      ? 'text-white border-transparent'
                      : isDark ? 'text-slate-400 border-white/10 hover:text-white hover:bg-white/5' : 'text-slate-500 border-[color:var(--msg-hairline)] hover:text-[color:var(--msg-ink)] hover:bg-white bg-white/60')}
                  style={emojiOpen ? { backgroundImage: 'linear-gradient(145deg, var(--msg-accent-a), var(--msg-accent-b))' } : undefined}
                  title="Émoticônes"
                >
                  <Smile size={16} />
                </button>
                <AnimatePresence>
                  {emojiOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="!absolute left-0 top-11 z-40 overflow-hidden stage-glass !rounded-2xl"
                    >
                      <EmojiPicker
                        width={320}
                        height={380}
                        theme={isDark ? Theme.DARK : Theme.LIGHT}
                        onEmojiClick={({ emoji }) => setBody(b => b + emoji)}
                        searchPlaceHolder="Rechercher un émoji"
                        previewConfig={{ showPreview: false }}
                        lazyLoadEmojis
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <span className={cn('ml-auto text-[11px] tabular-nums font-medium', charCount > 1000 ? (isDark ? 'text-amber-300' : 'text-amber-600') : isDark ? 'text-slate-500' : 'text-slate-400')}>
                {charCount} caractère{charCount > 1 ? 's' : ''} · ⌘ + Entrée pour envoyer
              </span>
            </div>

            {/* Zone de frappe — glow Stage */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files) }}
              className={cn('relative rounded-2xl border transition-all duration-300 overflow-hidden',
                dragOver
                  ? isDark
                    ? 'border-[color:var(--msg-accent-line)] ring-2 ring-[var(--msg-accent-border)] bg-[var(--msg-accent-soft)] shadow-[0_0_0_1px_var(--msg-accent-border),0_0_50px_-10px_var(--msg-accent-glow)]'
                    : 'border-[color:var(--msg-accent-line)] ring-2 ring-[var(--msg-accent-border)] bg-[var(--msg-accent-soft)] shadow-[0_0_0_1px_var(--msg-accent-border),0_0_50px_-12px_var(--msg-accent-glow)]'
                  : isDark
                    ? 'bg-white/[0.05] border-white/10 placeholder:text-slate-500 focus-within:bg-white/[0.07] focus-within:border-[color:var(--msg-accent-line)] focus-within:ring-2 focus-within:ring-[var(--msg-accent-border)] focus-within:shadow-[0_0_0_1px_var(--msg-accent-border),0_0_44px_-10px_var(--msg-accent-glow),inset_0_1px_0_rgba(255,255,255,0.06)]'
                    : 'bg-white border-[color:var(--msg-hairline)] placeholder:text-slate-400 focus-within:border-[color:var(--msg-accent-line)] focus-within:ring-2 focus-within:ring-[var(--msg-accent-border)] focus-within:shadow-[0_0_0_1px_var(--msg-accent-border),0_0_44px_-12px_var(--msg-accent-glow),inset_0_1px_0_rgba(255,255,255,0.9)]')}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-8 top-0 h-px z-10"
                style={{ background: `linear-gradient(90deg, transparent, ${interfaceHue.line}${isDark ? '99' : 'B3'}, ${interfaceHue.a}66, transparent)` }}
              />
              <textarea
                ref={textareaRef}
                value={body}
                onChange={e => setBody(e.target.value)}
                onKeyDown={e => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && isFormValid) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder={selected.length > 0 ? `Écrivez à ${selected.map(s => s.name.split(' ')[0]).join(', ')}…` : "Sélectionnez d'abord un destinataire, puis rédigez votre message…"}
                rows={6}
                className={cn('w-full bg-transparent px-4 py-3.5 text-sm leading-relaxed resize-none focus:outline-none min-h-[150px]',
                  isDark ? 'text-white placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400')}
              />
              <div className={cn('flex items-center gap-1.5 px-3 py-2 border-t', isDark ? 'border-white/10 bg-white/[0.02]' : 'border-[color:var(--msg-hairline)] bg-white/50')}>
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = '' }} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={cn('flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors',
                    isDark ? 'text-slate-300 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-[color:var(--msg-ink)] hover:bg-[var(--msg-accent-soft)]')}
                >
                  <Paperclip size={13} /> Joindre
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={cn('p-1.5 rounded-lg transition-colors', isDark ? 'text-slate-500 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-[color:var(--msg-ink)] hover:bg-[var(--msg-accent-soft)]')}
                  title="Ajouter une image"
                >
                  <ImageIcon size={15} />
                </button>
                <span className={cn('text-[11px] ml-1 hidden sm:inline', isDark ? 'text-slate-500' : 'text-slate-400')}>
                  {dragOver ? 'Déposez vos fichiers ici…' : 'Glissez-déposez ou cliquez · 10 fichiers max'}
                </span>
                {files.length > 0 && (
                  <span className={cn('ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full border',
                    isDark ? 'bg-[var(--msg-accent-soft)] text-[color:var(--msg-accent-line)] border-[color:var(--msg-accent-border)]' : 'bg-[var(--msg-accent-soft)] text-[color:var(--msg-accent-line)] border-[color:var(--msg-accent-border)]')}>
                    {files.length} fichier{files.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Fichiers */}
            <AnimatePresence>
              {files.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2">
                    {files.map((f, i) => {
                      const isImg = f.type.startsWith('image/')
                      const previewUrl = filePreviews.get(i)
                      return (
                        <div key={`${f.name}-${f.size}-${i}`} className={cn('flex items-center gap-3 px-3 py-2 rounded-xl border backdrop-blur-md',
                          isDark ? 'bg-white/[0.03] border-white/10' : 'bg-white/70 border-[color:var(--msg-hairline)]')}>
                          <div className={cn('w-9 h-9 rounded-lg overflow-hidden shrink-0 flex items-center justify-center',
                            isDark ? 'bg-white/5' : 'bg-[var(--msg-accent-soft)]')}>
                            {isImg && previewUrl ? (
                              <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <FileText size={15} className={isDark ? 'text-[color:var(--msg-accent-line)]' : 'text-[color:var(--msg-accent-line)]'} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-xs font-semibold truncate', isDark ? 'text-white' : 'text-slate-900')}>{f.name}</p>
                            <p className={cn('text-[11px]', isDark ? 'text-slate-500' : 'text-slate-400')}>{formatFileSize(f.size)}</p>
                          </div>
                          <button onClick={() => removeFile(i)} className={cn('p-1.5 rounded-lg transition-colors shrink-0',
                            isDark ? 'text-slate-500 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50')}>
                            <X size={14} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Aperçu */}
            <div>
              <p className={cn('text-[11px] font-bold uppercase tracking-wider mb-2', isDark ? 'text-slate-500' : 'text-slate-400')}>
                Aperçu en direct
              </p>
              <div className="flex justify-end">
                <div
                  className="max-w-[85%] rounded-2xl rounded-br-md px-4 py-3 text-sm leading-relaxed text-white"
                  style={{
                    backgroundImage: 'linear-gradient(145deg, var(--msg-accent-a), var(--msg-accent-b))',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), 0 10px 24px -10px var(--msg-accent-glow)',
                  }}
                >
                  {body.trim()
                    ? <p className="whitespace-pre-wrap break-words">{body.trim()}</p>
                    : <p className="italic opacity-70">Votre message apparaîtra ici…</p>}
                  {files.length > 0 && (
                    <p className="mt-2 pt-2 border-t border-white/20 text-xs font-medium flex items-center gap-1.5">
                      <Paperclip size={11} /> {files.length} pièce{files.length > 1 ? 's' : ''} jointe{files.length > 1 ? 's' : ''}
                    </p>
                  )}
                  <p className="mt-1.5 text-[10px] opacity-70 text-right">
                    {isGroup ? `Groupe · ${groupSubject}` : previewNames || '—'} · Maintenant
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Colonne récap + options ── */}
        <aside className={cn('lg:w-[300px] shrink-0 border-t lg:border-t-0 lg:border-l flex flex-col min-h-0 max-h-[46vh] lg:max-h-none',
          isDark ? 'border-white/10' : 'border-[color:var(--msg-hairline)]')}>
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
            {/* Récapitulatif stagé */}
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <OrbIcon icon={Send} hue={interfaceHue} size={34} radius={11} />
                <div className="min-w-0 flex-1">
                  <h2 className={cn('text-sm font-bold tracking-tight leading-tight', isDark ? 'text-white' : 'text-slate-900')}>
                    Récapitulatif
                  </h2>
                  <p className={cn('text-[11px] leading-tight', isDark ? 'text-slate-400' : 'text-slate-500')}>
                    {isFormValid ? 'Prêt à envoyer' : 'En cours de préparation'}
                  </p>
                </div>
                <StageBadge variant={isFormValid ? 'ok' : 'neutral'}>
                  {isGroup ? 'Groupe' : 'Direct'}
                </StageBadge>
              </div>
              <div className={cn('relative rounded-2xl border p-3 space-y-2 text-xs overflow-hidden backdrop-blur-md',
                isDark
                  ? 'bg-white/[0.03] border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                  : 'bg-white/70 border-[color:var(--msg-hairline)] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]')}>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-8 top-0 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${interfaceHue.line}${isDark ? '8C' : '80'}, ${interfaceHue.a}4D, transparent)` }}
                />
                <div className="flex justify-between gap-2">
                  <span className={cn('flex items-center gap-1.5', isDark ? 'text-slate-400' : 'text-slate-500')}><Users size={12} /> Destinataires</span>
                  <span className={cn('font-bold tabular-nums px-1.5 py-px rounded-md border',
                    isDark ? 'bg-white/[0.05] border-white/10 text-white' : 'bg-[var(--msg-accent-soft)] border-[color:var(--msg-accent-border)] text-[color:var(--msg-ink)]')}>{selected.length}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className={cn(isDark ? 'text-slate-400' : 'text-slate-500')}>Type</span>
                  <span className={cn('font-bold', isDark ? 'text-white' : 'text-slate-900')}>{isGroup ? `Groupe · ${groupSubject}` : 'Direct'}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className={cn(isDark ? 'text-slate-400' : 'text-slate-500')}>Message</span>
                  <span className={cn('font-bold tabular-nums', isDark ? 'text-white' : 'text-slate-900')}>{charCount} car.</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className={cn(isDark ? 'text-slate-400' : 'text-slate-500')}>Fichiers</span>
                  <span className={cn('font-bold tabular-nums', isDark ? 'text-white' : 'text-slate-900')}>{files.length}</span>
                </div>
              </div>
              {/* Checklist stagée */}
              <div className="mt-2 space-y-1.5">
                {[
                  { ok: selected.length > 0, label: 'Destinataire sélectionné', detail: selected.length > 0 ? previewNames : 'En attente' },
                  ...(isGroup ? [{ ok: groupName.trim().length > 0, label: 'Nom du groupe renseigné', detail: groupName.trim() || 'Requis' }] : []),
                  { ok: body.trim().length > 0, label: 'Message rédigé', detail: charCount > 0 ? `${charCount} car.` : 'En attente' },
                ].map(item => (
                  <div
                    key={item.label}
                    className={cn('flex items-center gap-2.5 px-2.5 py-2 rounded-xl border text-xs font-medium transition-all',
                      item.ok
                        ? 'bg-[var(--msg-accent-soft)] border-[color:var(--msg-accent-border)] text-[color:var(--msg-ink)] shadow-[0_0_20px_-8px_var(--msg-accent-glow)]'
                        : isDark
                          ? 'bg-white/[0.02] border-white/10 text-slate-500'
                          : 'bg-white/50 border-[color:var(--msg-hairline)] text-slate-400')}
                  >
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-white"
                      style={item.ok
                        ? { backgroundImage: 'linear-gradient(145deg, var(--msg-accent-a), var(--msg-accent-b))', boxShadow: '0 4px 12px -4px var(--msg-accent-glow)' }
                        : isDark
                          ? { background: 'rgba(255,255,255,0.08)' }
                          : { background: 'rgba(15,23,42,0.08)' }}
                    >
                      {item.ok ? <Check size={11} strokeWidth={3.5} /> : <Circle size={10} className={isDark ? 'text-slate-500' : 'text-slate-400'} />}
                    </span>
                    <span className="flex-1 min-w-0 truncate">{item.label}</span>
                    <span className={cn('text-[11px] truncate max-w-[110px]', item.ok ? 'text-[color:var(--msg-accent-line)]' : (isDark ? 'text-slate-600' : 'text-slate-400'))}>
                      {item.detail}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Options */}
            <div>
              <p className={cn('text-[11px] font-bold uppercase tracking-wider mb-2', isDark ? 'text-slate-500' : 'text-slate-400')}>Options d'envoi</p>
              <div className={cn('rounded-2xl border divide-y overflow-hidden', isDark ? 'bg-white/[0.03] border-white/10 divide-white/10' : 'bg-white/60 border-[color:var(--msg-hairline)] divide-[color:var(--msg-hairline)]')}>
                <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <span className={cn('flex items-center gap-2 text-xs font-medium', isDark ? 'text-slate-200' : 'text-slate-700')}>
                    <CheckCircle size={13} className={isDark ? 'text-slate-500' : 'text-slate-400'} /> Copie à mon adresse
                  </span>
                  <Checkbox checked={sendCopy} onChange={setSendCopy} />
                </div>
                <div className="px-3 py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className={cn('flex items-center gap-2 text-xs font-medium', isDark ? 'text-slate-200' : 'text-slate-700')}>
                      <Clock size={13} className={isDark ? 'text-slate-500' : 'text-slate-400'} /> Programmer l'envoi
                    </span>
                    <Checkbox checked={scheduleSend} onChange={setScheduleSend} />
                  </div>
                  {scheduleSend && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <DatePicker
                            value={scheduleDatePart}
                            onChange={handleScheduleDate}
                            min={scheduleTodayStr}
                            placeholder="Date"
                            className="h-9 text-xs"
                          />
                          <TimePicker
                            value={scheduleTimePart}
                            onChange={handleScheduleTime}
                            placeholder="Heure"
                            className="h-9 text-xs"
                          />
                        </div>
                        {scheduleLabel && (
                          <p className={cn('flex items-center gap-1.5 text-[11px] font-medium px-1',
                            isDark ? 'text-[color:var(--msg-accent-line)]' : 'text-[color:var(--msg-accent-line)]')}>
                            <Clock size={11} className="shrink-0" />
                            Envoi prévu : {scheduleLabel}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <span className={cn('flex items-center gap-2 text-xs font-medium', isDark ? 'text-slate-200' : 'text-slate-700')}>
                    <Star size={13} className={isDark ? 'text-slate-500' : 'text-slate-400'} /> Marquer important
                  </span>
                  <Checkbox checked={markImportant} onChange={setMarkImportant} />
                </div>
                <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <span className={cn('flex items-center gap-2 text-xs font-medium', isDark ? 'text-slate-200' : 'text-slate-700')}>
                    <EyeOff size={13} className={isDark ? 'text-slate-500' : 'text-slate-400'} /> Sans accusé de réception
                  </span>
                  <Checkbox checked={disableReceipts} onChange={setDisableReceipts} />
                </div>
              </div>
            </div>
          </div>

          <div className={cn('p-4 border-t shrink-0 space-y-2', isDark ? 'border-white/10' : 'border-[color:var(--msg-hairline)]')}>
            <StageButton
              variant="primary"
              size="md"
              icon={isSending ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Send size={15} />}
              onClick={handleSend}
              disabled={!isFormValid || isSending}
              className="w-full"
            >
              {isSending ? 'Envoi en cours…' : scheduleSend && scheduleDate ? 'Programmer l’envoi' : isGroup ? 'Créer le groupe et envoyer' : 'Envoyer le message'}
            </StageButton>
            <p className={cn('text-center text-[11px]', isDark ? 'text-slate-500' : 'text-slate-400')}>
              {selected.length > 0
                ? <>{isGroup ? 'Groupe' : 'À'} : <span className={cn('font-semibold', isDark ? 'text-slate-300' : 'text-slate-600')}>{isGroup ? groupSubject : previewNames}</span></>
                : 'Choisissez un destinataire pour activer l’envoi'}
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
