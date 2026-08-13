import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Clock, Trash2, ArrowRight, X, Search, Home, Briefcase, Users, Sun } from 'react-feather'
import { getDrafts, deleteDraft, type ClientDraft } from '../../../services/clientDraftStorage'
import { CompletionRing } from '../../ui/CompletionRing'

const CLIENT_TYPE_CONFIG: Record<string, { gradient: string; icon: React.ReactNode; label: string }> = {
  Acheteur: { gradient: 'from-blue-500/20 to-blue-600/10', icon: <Search size={15} />, label: 'Acheteur' },
  Vendeur: { gradient: 'from-violet-500/20 to-violet-600/10', icon: <Home size={15} />, label: 'Vendeur' },
  Bailleur: { gradient: 'from-emerald-500/20 to-emerald-600/10', icon: <Briefcase size={15} />, label: 'Bailleur' },
  Locataire: { gradient: 'from-amber-500/20 to-amber-600/10', icon: <Users size={15} />, label: 'Locataire' },
  Voyageur: { gradient: 'from-rose-500/20 to-rose-600/10', icon: <Sun size={15} />, label: 'Voyageur' },
}

const DEFAULT_CONFIG = { gradient: 'from-gray-500/20 to-gray-600/10', icon: <Users size={15} />, label: 'Client' }

const getClientConfig = (clientType: string, isGerant: boolean) => {
  const base = CLIENT_TYPE_CONFIG[clientType] || DEFAULT_CONFIG
  if (isGerant && clientType === 'Locataire') return { ...base, gradient: 'from-[#905D5D]/20 to-[#7D5050]/10' }
  return base
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "À l'instant"
  if (mins < 60) return `Il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `Il y a ${days}j`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

interface ClientDraftSectionProps {
  clientType?: string
  userId?: string
  onResume: (draft: ClientDraft) => void
  isGerant?: boolean
}

export function ClientDraftSection({ clientType, userId, onResume, isGerant = false }: ClientDraftSectionProps) {
  const [drafts, setDrafts] = useState<ClientDraft[]>([])
  const [open, setOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const loadDrafts = () => {
    if (!userId) { setDrafts([]); return }
    setDrafts(getDrafts(userId, clientType))
  }

  useEffect(() => { loadDrafts() }, [clientType, userId])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleResume = (draft: ClientDraft) => {
    setOpen(false)
    onResume(draft)
  }

  const handleDelete = (id: string) => {
    if (!userId) return
    setDeletingId(id)
    setTimeout(() => {
      deleteDraft(userId, id)
      setDeletingId(null)
      loadDrafts()
    }, 300)
  }

  if (drafts.length === 0) return null

  return (
    <>
      <motion.button
        onClick={() => setOpen(v => !v)}
        className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-br ${isGerant ? 'from-[#905D5D] to-[#7D5050]' : 'from-amber-400 to-amber-500'} text-white shadow-lg hover:shadow-xl hover:scale-105 transition-shadow`}
        whileTap={{ scale: 0.95 }}
        layoutId="client-draft-bubble"
      >
        <div className="relative">
          <FileText size={18} />
          <motion.span
            key={drafts.length}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute -top-2 -right-3 w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold flex items-center justify-center"
          >
            {drafts.length}
          </motion.span>
        </div>
        <span className="text-sm font-semibold">Brouillons</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.85, y: 20, originX: 1, originY: 1 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', damping: 22, stiffness: 300, mass: 0.8 }}
            className="fixed bottom-24 right-6 z-[9999] w-[400px] max-w-[calc(100vw-32px)] bg-card rounded-2xl border border-border/50 shadow-2xl overflow-hidden"
            style={{ maxHeight: 'calc(100vh - 160px)' }}
          >
            <div className={`px-5 py-4 border-b border-border/30 flex items-center justify-between ${isGerant ? 'bg-gradient-to-r from-[#F0E2E2] to-[#F0E2E2]/30' : 'bg-gradient-to-r from-amber-50 to-amber-50/30'}`}>
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg ${isGerant ? 'bg-[#E7D5D5] text-[#905D5D]' : 'bg-amber-100 text-amber-600'}`}>
                  <FileText size={15} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text">Brouillons en cours</h3>
                  <p className="text-[11px] text-text-secondary/60">{drafts.length} brouillon{drafts.length !== 1 ? 's' : ''} à finaliser</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-text-secondary/40 hover:text-text hover:bg-card transition-all"
              >
                <X size={15} />
              </button>
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 260px)' }}>
              {drafts.map((draft) => {
                const config = getClientConfig(draft.clientType, isGerant)
                const pct = draft.completion
                const deleting = deletingId === draft.id

                return (
                  <motion.div
                    key={draft.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: deleting ? 0.2 : 1, x: 0, scale: deleting ? 0.95 : 1 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-background/50 transition-colors border-b border-border/10 last:border-0"
                  >
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center flex-shrink-0 ${isGerant ? 'text-[#905D5D]' : 'text-accent'}`}>
                      {config.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-text truncate">{draft.title || 'Sans titre'}</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D]' : 'bg-accent/10 text-accent'} flex-shrink-0`}>{config.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-text-secondary/50 mt-0.5">
                        <span>Client</span>
                        <span>·</span>
                        <Clock size={9} />
                        <span>{formatTimeAgo(draft.updatedAt)}</span>
                      </div>
                    </div>

                    <CompletionRing percent={pct} size={34} strokeWidth={3} showLabel={true} />

                    <div className="flex items-center gap-0.5">
                      <button onClick={() => handleResume(draft)}
                        className={`p-1.5 rounded-lg ${isGerant ? 'text-[#905D5D] hover:bg-[#905D5D]/10' : 'text-accent hover:bg-accent/10'} transition-all`} title="Reprendre">
                        <ArrowRight size={13} />
                      </button>
                      <button onClick={() => handleDelete(draft.id)}
                        className="p-1.5 rounded-lg text-text-secondary/30 hover:text-red-500 hover:bg-red-50 transition-all" title="Supprimer">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            <div className="px-5 py-3 border-t border-border/20 bg-background/30 flex items-center justify-between">
              <span className="text-[10px] text-text-secondary/50">Brouillons sauvegardés automatiquement</span>
              <button onClick={() => setOpen(false)}
                className={`text-[11px] font-medium ${isGerant ? 'text-[#905D5D] hover:text-[#905D5D]/80' : 'text-accent hover:text-accent/80'} transition-colors`}>
                Fermer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
