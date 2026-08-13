import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Clock, Trash2, ArrowRight, X, Home, Briefcase, MapPin, Sun, Star } from 'react-feather'
import { getDrafts, deleteDraft, type PropertyDraft } from '../../../services/draftStorage'
import { CompletionRing } from '../../ui/CompletionRing'
import { PROPERTY_TYPE_LABELS } from '../../../types/property'

const PROPERTY_TYPE_CONFIG: Record<string, { gradient: string; Icon: React.ComponentType<{ size?: number }> }> = {
  residential: { gradient: 'from-blue-500/20 to-blue-600/10', Icon: Home },
  commercial: { gradient: 'from-purple-500/20 to-purple-600/10', Icon: Briefcase },
  land: { gradient: 'from-emerald-500/20 to-emerald-600/10', Icon: MapPin },
  vacation: { gradient: 'from-amber-500/20 to-amber-600/10', Icon: Sun },
  luxury: { gradient: 'from-rose-500/20 to-rose-600/10', Icon: Star },
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

function getTransactionLabel(data: Record<string, any>): string {
  const t = data.transactionType
  if (t === 'vente') return 'Vente'
  if (t === 'location_ld') return 'Location LD'
  if (t === 'location_saisonniere') return 'Location saisonnière'
  return ''
}

interface DraftSectionProps {
  propertyType?: string
  agentSlug?: string
  adminSlug?: string
}

export function DraftSection({ propertyType, agentSlug, adminSlug }: DraftSectionProps) {
  const navigate = useNavigate()
  const userId = adminSlug || agentSlug
  const [drafts, setDrafts] = useState<PropertyDraft[]>([])
  const [open, setOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const loadDrafts = () => {
    if (!userId) { setDrafts([]); return }
    setDrafts(getDrafts(userId, propertyType))
  }

  useEffect(() => { loadDrafts() }, [propertyType, userId])

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

  const basePath = (pt: string) => adminSlug
    ? `/admin/${adminSlug}/properties/type/${pt}/add`
    : agentSlug
      ? `/${agentSlug}/properties/type/${pt}/add`
      : '/properties/add'

  const handleResume = (draft: PropertyDraft) => {
    setOpen(false)
    const pt = draft.propertyType
    navigate(`${basePath(pt)}?draftId=${draft.id}`)
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
      {/* Floating bubble */}
      <motion.button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-shadow"
        whileTap={{ scale: 0.95 }}
        layoutId="draft-bubble"
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

      {/* Flyout panel */}
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
            {/* Header */}
            <div className="px-5 py-4 border-b border-border/30 flex items-center justify-between bg-gradient-to-r from-amber-50 to-amber-50/30">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-100 text-amber-600">
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

            {/* List */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 260px)' }}>
              {drafts.map((draft) => {
                const config = PROPERTY_TYPE_CONFIG[draft.propertyType] || PROPERTY_TYPE_CONFIG.residential
                const { Icon } = config
                const pct = draft.completion
                const deleting = deletingId === draft.id
                const typeLabel = PROPERTY_TYPE_LABELS[draft.propertyType as keyof typeof PROPERTY_TYPE_LABELS] || draft.propertyType
                const txnLabel = getTransactionLabel(draft.data)

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
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center flex-shrink-0 text-accent`}>
                      <Icon size={15} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-text truncate">{draft.title || 'Sans titre'}</span>
                        {txnLabel && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-accent/10 text-accent flex-shrink-0">{txnLabel}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-text-secondary/50 mt-0.5">
                        <span>{typeLabel}</span>
                        <span>·</span>
                        <Clock size={9} />
                        <span>{formatTimeAgo(draft.updatedAt)}</span>
                      </div>
                    </div>

                    <CompletionRing percent={pct} size={34} strokeWidth={3} showLabel={true} />

                    <div className="flex items-center gap-0.5">
                      <button onClick={() => handleResume(draft)}
                        className="p-1.5 rounded-lg text-accent hover:bg-accent/10 transition-all" title="Reprendre">
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

            {/* Footer */}
            <div className="px-5 py-3 border-t border-border/20 bg-background/30 flex items-center justify-between">
              <span className="text-[10px] text-text-secondary/50">Brouillons sauvegardés automatiquement</span>
              <button onClick={() => setOpen(false)}
                className="text-[11px] font-medium text-accent hover:text-accent/80 transition-colors">
                Fermer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
