import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Users as UsersLucide } from 'lucide-react'
import {
  ArrowLeft, Search, Users, User, Shield, Send, X, Paperclip,
  FileText, Image as ImageIcon, Mic, Camera, Clock, Star, EyeOff,
  Check, MessageSquare,
} from 'react-feather'
import { mockTemplates } from '../../types/messages'
import type { MessageParticipant } from '../../types/messages'
import { cn, getAdminBasePath } from '../../lib/utils'
import { Avatar } from '../../components/modules/messages/Avatar'
import { Checkbox } from '../../components/ui/Checkbox'
import { useToast } from '../../components/ui/Toast'
import {
  fetchMessageUsers, createConversation,
} from '../../services/messageService'
import { useMessagingAppearance, messageZoomStyle } from '../../services/messageAppearance'

function isAdminRoute() {
  if (typeof window === 'undefined') return false
  return window.location.pathname.startsWith('/admin')
}

interface DirectoryItem extends MessageParticipant {
  email: string
}

type RecipientFilter = 'all' | 'client' | 'agent' | 'admin' | 'group'

const TABS: { id: RecipientFilter; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'Tous', icon: <Users size={14} /> },
  { id: 'client', label: 'Clients', icon: <User size={14} /> },
  { id: 'agent', label: 'Agents', icon: <Users size={14} /> },
  { id: 'admin', label: 'Admins', icon: <Shield size={14} /> },
  { id: 'group', label: 'Groupes', icon: <MessageSquare size={14} /> },
]

const ATTACH_NAMES = [
  { name: 'brochure_villa_marrakech.pdf', size: '2.4 Mo' },
  { name: 'plan_acces.pdf', size: '1.2 Mo' },
  { name: 'photo_visite_bien.jpg', size: '1.4 Mo' },
  { name: 'video_visite_bien.mp4', size: '18.5 Mo' },
]

export default function ComposeMessagePage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const admin = isAdminRoute()
  const appearance = useMessagingAppearance()
  const zoomStyle = messageZoomStyle(appearance.messageSize)
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
  const [attachments, setAttachments] = useState<{ name: string; size: string }[]>([])
  const [sendCopy, setSendCopy] = useState(false)
  const [scheduleSend, setScheduleSend] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [markImportant, setMarkImportant] = useState(false)
  const [disableReceipts, setDisableReceipts] = useState(false)
  const [isSending, setIsSending] = useState(false)

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
  }, [toast])

  const isGroup = selected.length > 1

  const results = useMemo(() => {
    let list = directory
    if (filter !== 'all') list = list.filter(d => d.type === filter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(d => d.name.toLowerCase().includes(q) || d.email.toLowerCase().includes(q))
    }
    return list.filter(d => !selected.some(s => s.id === d.id))
  }, [filter, search, selected, directory])

  const toggleSelect = (item: DirectoryItem) => {
    setSelected(prev => prev.some(s => s.id === item.id) ? prev.filter(s => s.id !== item.id) : [...prev, item])
  }

  const addAttachment = () => {
    const att = ATTACH_NAMES[Math.floor(Math.random() * ATTACH_NAMES.length)]
    setAttachments(prev => [...prev, att])
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const isFormValid =
    selected.length > 0 &&
    (!isGroup || groupName.trim().length > 0) &&
    body.trim().length > 0

  const groupSubject = groupName.trim() || selected.map(s => s.name.split(' ')[0]).join(', ')

  const basePath = admin ? getAdminBasePath() : ''

  const handleSend = async () => {
    if (!isFormValid) return
    setIsSending(true)
    try {
      const conv = await createConversation({
        participantIds: selected.map(s => Number(s.id)),
        name: isGroup ? groupName.trim() : undefined,
        firstMessage: body.trim(),
      })
      navigate(`${basePath}/messages?id=${conv.id}`)
    } catch (e: any) {
      toast('error', e?.message || "Impossible de créer la conversation.")
      setIsSending(false)
    }
  }

  return (
    <div className={cn('flex flex-col h-full w-full animate-fade-in', appearance.theme === 'dark' && 'dark bg-background')} style={zoomStyle}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 shrink-0 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`${basePath}/messages`)}
            className="p-2 rounded-lg text-text-secondary hover:text-text hover:bg-card border border-border/60 transition-colors"
            title="Retour"
          >
            <ArrowLeft size={17} />
          </button>
          <div>
            <h1 className="text-xl font-bold leading-tight">Nouvelle conversation</h1>
            <p className="text-xs text-text-secondary">
              {isGroup ? 'Créez un groupe et écrivez à ses membres' : 'Créez une nouvelle discussion en temps réel'}
            </p>
          </div>
        </div>
        <button
          onClick={handleSend}
          disabled={!isFormValid || isSending}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-hover active:scale-[0.98] shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSending ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Envoi en cours...
            </>
          ) : (
            <>
              <Send size={15} />
              Envoyer
            </>
          )}
        </button>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Destinataires */}
        <div className="lg:col-span-2 flex flex-col min-h-0 bg-card rounded-2xl border border-border/50 shadow-card p-5">
          <div className="flex items-center gap-2.5 mb-4 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              {isGroup ? <UsersLucide size={16} className="text-accent" /> : <Users size={16} className="text-accent" />}
            </div>
            <div>
              <h2 className="text-sm font-semibold">{isGroup ? 'Membres du groupe' : 'Destinataires'}</h2>
              <p className="text-[11px] text-text-secondary">{selected.length} sélectionné{selected.length !== 1 ? 's' : ''}</p>
            </div>
            {selected.length >= 2 && (
              <span className="ml-auto inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-md bg-amber-50 text-amber-600 border border-amber-200">
                <UsersLucide size={11} /> Groupe
              </span>
            )}
          </div>

          {/* Type tabs */}
          <div className="flex items-center gap-1.5 mb-4 flex-wrap shrink-0">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all',
                  filter === tab.id
                    ? 'bg-accent text-white border-accent shadow-sm'
                    : 'bg-background text-text-secondary border-border/60 hover:text-text hover:border-border'
                )}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-3 shrink-0">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary/50" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par nom ou email..."
              className="w-full h-10 pl-9 pr-3 text-sm rounded-xl bg-background border border-transparent focus:bg-card focus:border-accent/50 focus:ring-2 focus:ring-accent/10 text-text placeholder:text-text-secondary/40 focus:outline-none transition-all"
            />
          </div>

          {/* Selected chips */}
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 shrink-0">
              {selected.map(item => (
                <span key={item.id} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-xs font-medium text-accent">
                  <Avatar participant={item} size="xs" />
                  {item.name}
                  <button onClick={() => toggleSelect(item)} className="ml-0.5 hover:opacity-70 transition-opacity">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Group name */}
          <AnimatePresence>
            {isGroup && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden shrink-0"
              >
                <div className="mb-3">
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Nom du groupe</label>
                  <div className="relative">
                    <UsersLucide size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/50" />
                    <input
                      type="text"
                      value={groupName}
                      onChange={e => setGroupName(e.target.value)}
                      placeholder="Ex. : Équipe Casablanca"
                      autoFocus
                      className="w-full h-10 pl-9 pr-3 text-sm rounded-xl bg-background border border-transparent focus:bg-card focus:border-accent/50 focus:ring-2 focus:ring-accent/10 text-text placeholder:text-text-secondary/40 focus:outline-none transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-text-secondary mt-1.5">
                    Le groupe sera créé avec {selected.length} membre{selected.length !== 1 ? 's' : ''} (vous inclus).
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin -mx-2 px-2 rounded-xl border border-border/40 bg-background/40">
            {!usersReady ? (
              <div className="flex flex-col items-center justify-center py-10 text-text-secondary">
                <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin mb-3" />
                <p className="text-xs">Chargement des destinataires...</p>
              </div>
            ) : results.length === 0 ? (
              <p className="text-sm text-text-secondary/60 text-center py-8">Aucun destinataire trouvé</p>
            ) : (
              results.map(item => {
                const isSelected = selected.some(s => s.id === item.id)
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleSelect(item)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left',
                      isSelected ? 'bg-accent/10' : 'hover:bg-card'
                    )}
                  >
                    <Avatar participant={item} showPresence size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-text truncate">{item.name}</p>
                        <span className={cn(
                          'text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md shrink-0',
                          item.type === 'client' ? 'bg-emerald-50 text-emerald-600' :
                          item.type === 'admin' ? 'bg-purple-50 text-purple-600' :
                          item.type === 'group' ? 'bg-amber-50 text-amber-600' :
                          'bg-sky-50 text-sky-600'
                        )}>
                          {item.type === 'group' ? 'Groupe' : item.type === 'admin' ? 'Admin' : item.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary truncate">{item.email || item.role}</p>
                    </div>
                    <span className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                      isSelected ? 'bg-accent border-accent' : 'border-border'
                    )}>
                      {isSelected && <Check size={11} className="text-white" />}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Right column: Message + Options */}
        <div className="lg:col-span-3 flex flex-col gap-4 min-h-0">
          {/* Message */}
          <div className="flex-1 min-h-0 flex flex-col bg-card rounded-2xl border border-border/50 shadow-card p-5">
            <div className="flex items-center gap-2.5 mb-4 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <MessageSquare size={16} className="text-accent" />
              </div>
              <h2 className="text-sm font-semibold">Message</h2>
              {isGroup && (
                <span className="text-[11px] text-text-secondary truncate">
                  À : <span className="font-medium text-text">{groupSubject}</span> ({selected.length} membres)
                </span>
              )}
            </div>

            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder={selected.length > 0 ? `Écrivez un message à ${selected.map(s => s.name.split(' ')[0]).join(', ')}...` : 'Sélectionnez d\'abord un destinataire...'}
              rows={5}
              className="flex-1 min-h-0 w-full rounded-xl bg-background border border-transparent focus:bg-card focus:border-accent/50 focus:ring-2 focus:ring-accent/10 px-4 py-3 text-sm text-text placeholder:text-text-secondary/40 resize-none focus:outline-none transition-all"
            />

            {/* Attachments */}
            <div className="flex items-center gap-2 mt-3 flex-wrap shrink-0">
              <button
                onClick={addAttachment}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-accent bg-background hover:bg-accent/5 border border-border/60 rounded-lg transition-colors"
              >
                <Paperclip size={13} /> Pièce jointe
              </button>
              <button onClick={addAttachment} className="p-1.5 rounded-lg text-text-secondary hover:text-accent hover:bg-accent/5 transition-colors" title="Photo">
                <ImageIcon size={16} />
              </button>
              <button onClick={addAttachment} className="p-1.5 rounded-lg text-text-secondary hover:text-accent hover:bg-accent/5 transition-colors" title="Vidéo">
                <Mic size={16} />
              </button>
              <button onClick={addAttachment} className="p-1.5 rounded-lg text-text-secondary hover:text-accent hover:bg-accent/5 transition-colors" title="Audio">
                <Camera size={16} />
              </button>
            </div>

            <AnimatePresence>
              {attachments.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden shrink-0"
                >
                  <div className="mt-3 space-y-2 max-h-28 overflow-y-auto scrollbar-thin">
                    {attachments.map((att, i) => (
                      <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-background border border-border/40">
                        <FileText size={14} className="text-accent shrink-0" />
                        <span className="text-xs font-medium text-text flex-1 truncate">{att.name}</span>
                        <span className="text-[10px] text-text-secondary">{att.size}</span>
                        <button onClick={() => removeAttachment(i)} className="text-text-secondary/60 hover:text-text transition-colors shrink-0">
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Options */}
          <div className="shrink-0 bg-card rounded-2xl border border-border/50 shadow-card p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Star size={16} className="text-accent" />
              </div>
              <h2 className="text-sm font-semibold">Options d'envoi</h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 py-2 border-b border-border/30">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={15} className="text-text-secondary shrink-0" />
                  <span className="text-sm text-text">Envoyer une copie à mon adresse</span>
                </div>
                <Checkbox checked={sendCopy} onChange={setSendCopy} />
              </div>

              <div className="py-2 border-b border-border/30">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Clock size={15} className="text-text-secondary shrink-0" />
                    <span className="text-sm text-text">Programmer l'envoi</span>
                  </div>
                  <Checkbox checked={scheduleSend} onChange={setScheduleSend} />
                </div>
                {scheduleSend && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="overflow-hidden"
                  >
                    <input
                      type="datetime-local"
                      value={scheduleDate}
                      onChange={e => setScheduleDate(e.target.value)}
                      className="mt-3 h-9 w-full sm:w-64 px-3 text-sm rounded-lg border border-border bg-background text-text focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/10 transition-all"
                    />
                  </motion.div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 py-2 border-b border-border/30">
                <div className="flex items-center gap-2.5">
                  <Star size={15} className="text-text-secondary shrink-0" />
                  <span className="text-sm text-text">Marquer comme important</span>
                </div>
                <Checkbox checked={markImportant} onChange={setMarkImportant} />
              </div>

              <div className="flex items-center justify-between gap-3 py-2">
                <div className="flex items-center gap-2.5">
                  <EyeOff size={15} className="text-text-secondary shrink-0" />
                  <span className="text-sm text-text">Désactiver l'accusé de réception</span>
                </div>
                <Checkbox checked={disableReceipts} onChange={setDisableReceipts} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="flex items-center justify-between shrink-0 pt-3">
        <button
          onClick={() => navigate(`${basePath}/messages`)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-secondary hover:text-text hover:bg-card border border-border/60 rounded-xl transition-colors"
        >
          <ArrowLeft size={15} />
          Annuler
        </button>
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          {selected.length > 0 && (
            <span>
              {isGroup ? 'Groupe' : 'À'} : <span className="font-medium text-text">{isGroup ? groupSubject : selected.map(s => s.name).join(', ')}</span>
            </span>
          )}
        </div>
        <button
          onClick={handleSend}
          disabled={!isFormValid || isSending}
          className="flex items-center gap-2 px-6 py-2.5 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-hover active:scale-[0.98] shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={15} />
          {isSending ? 'Envoi...' : isGroup ? 'Créer le groupe et envoyer' : 'Envoyer'}
        </button>
      </div>
    </div>
  )
}
