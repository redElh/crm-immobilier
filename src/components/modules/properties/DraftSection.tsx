import { useState, useEffect, useRef, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { FileText, Clock, Trash2, ArrowRight, X, Home, Briefcase, MapPin, Sun, Star } from 'react-feather'
import { getDrafts, deleteDraft, type PropertyDraft } from '../../../services/draftStorage'
import { CompletionRing } from '../../ui/CompletionRing'
import { PROPERTY_TYPE_LABELS } from '../../../types/property'
import { useStageChrome } from '../calendar/useStageChrome'
import {
  OrbIcon,
  STAGE_HUES,
  type StageHue,
} from '../../dashboard/Stage'
import { cn } from '../../../lib/utils'
import { FLOATING_SLOT_1, FLOATING_PANEL_1, FLOATING_PANEL_MAX_H, FLOATING_PANEL_LIST_H, FLOATING_PANEL_TALL, FLOATING_PANEL_TALL_MAX_H } from '../../../lib/floating'
import { CrumpledPaperBall3D, type DraftTexRow } from './CrumpledPaper3D'

/* ---------------------------------------------------------------------
   Property → Stage hue mapping (mirrors TYPE_HUE_MAP on property pages
   so the draft shell always speaks the same "property theme" language).
--------------------------------------------------------------------- */
const PROPERTY_STAGE_HUE: Record<string, StageHue> = {
  residential: STAGE_HUES.violet,
  commercial: STAGE_HUES.sky,
  land: STAGE_HUES.emerald,
  vacation: STAGE_HUES.amber,
  luxury: STAGE_HUES.fuchsia,
}

const PROPERTY_STAGE_ICON: Record<string, React.ComponentType<{ size?: number | string; className?: string }>> = {
  residential: Home,
  commercial: Briefcase,
  land: MapPin,
  vacation: Sun,
  luxury: Star,
}

/* Legacy (non-staged / admin shell) icon tint — untouched */
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

/* ---------------------------------------------------------------------
   StageCompletionRing — hue-aware animated ring with neon glow.
   Draws itself on mount (pathLength spring) and glows in the draft's
   property hue, unlike the flat red/amber/green legacy ring.
--------------------------------------------------------------------- */
function StageCompletionRing({ percent, hue, size = 38 }: { percent: number; hue: StageHue; size?: number }) {
  const stroke = 3.5
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const reduce = useReducedMotion()
  return (
    <div className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          stroke="currentColor"
          className="text-stone-500/30"
          opacity={0.6}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={hue.line}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={reduce ? { strokeDashoffset: c - (percent / 100) * c } : { strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (percent / 100) * c }}
          transition={{ duration: reduce ? 0 : 1, ease: [0.22, 1, 0.36, 1], delay: reduce ? 0 : 0.6 }}
          style={{ filter: `drop-shadow(0 0 5px ${hue.glow})` }}
        />
      </svg>
      <span
        className="absolute font-extrabold tabular-nums"
        style={{ fontSize: size * 0.24, color: hue.b }}
      >
        {percent}%
      </span>
    </div>
  )
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
  const [hasTossed, setHasTossed] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const basketRef = useRef<HTMLButtonElement>(null)
  const reduce = useReducedMotion()

  const { staged } = useStageChrome()

  const loadDrafts = () => {
    if (!userId) { setDrafts([]); return }
    setDrafts(getDrafts(userId, propertyType))
  }

  useEffect(() => { loadDrafts() }, [propertyType, userId])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (basketRef.current?.contains(t)) return
      if (panelRef.current && !panelRef.current.contains(t)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
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

  /* =====================================================================
     LEGACY — admin shell / non-staged pages (pixel-identical to before)
  ===================================================================== */
  if (!staged) {
    return (
      <>
        {/* Floating bubble */}
        <motion.button
          onClick={() => setOpen(v => !v)}
          className={`fixed ${FLOATING_SLOT_1} right-6 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-shadow`}
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
              className={`fixed ${FLOATING_PANEL_1} right-6 z-[9999] w-[400px] max-w-[calc(100vw-32px)] bg-card rounded-2xl border border-border/50 shadow-2xl overflow-hidden`}
              style={{ maxHeight: FLOATING_PANEL_MAX_H }}
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
              <div className="overflow-y-auto" style={{ maxHeight: FLOATING_PANEL_LIST_H }}>
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

  /* =====================================================================
     STAGED — Mission Control shell (agent pages inside <Stage>)
     pop-glass flyout + property-hue orbs + per-type glow animations.
  ===================================================================== */
  const bubbleHue = (propertyType && PROPERTY_STAGE_HUE[propertyType]) || STAGE_HUES.violet
  const avgCompletion = Math.round(drafts.reduce((s, d) => s + (d.completion || 0), 0) / Math.max(1, drafts.length))
  const activeTypeLabel = propertyType
    ? PROPERTY_TYPE_LABELS[propertyType as keyof typeof PROPERTY_TYPE_LABELS] || propertyType
    : null

  const titleCls = 'text-stone-900'
  const subCls = 'text-stone-600'
  const faintCls = 'text-stone-500'
  const rowHoverCls = 'hover:bg-stone-900/[0.05]'
  const rowBorderCls = 'border-stone-900/10'
  const iconBtnCls = 'text-stone-400 hover:bg-stone-900/[0.06] hover:text-stone-700'

  /* Paper-unfold choreography — one delicate ease shared by every layer
     so the ball → sheet morph reads as a single physical gesture.
     Closing is intentionally slower: wrinkle → crumple → toss → catch. */
  const UNFOLD_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]
  const CRUMPLE_EASE: [number, number, number, number] = [0.5, 0, 0.35, 1]
  const PAPER_NOISE_URL =
    "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")"
  /* Neutral paper fibre — fine strands so the white sheet reads as real
     paper rather than digital glass. */
  const PAPER_FIBRE_URL =
    "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.012 0.14' numOctaves='2' seed='7'/%3E%3CfeColorMatrix values='0 0 0 0 0.35 0 0 0 0 0.4 0 0 0 0 0.48 0 0 0 0.07 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23f)'/%3E%3C/svg%3E\")"
  const PAPER_BASE =
    'linear-gradient(174deg, #FFFFFF 0%, #F8FAFC 42%, #EEF2F6 78%, #E2E8F0 100%)'
  const PAPER_EDGE = '1px solid rgba(100, 116, 139, 0.30)'
  /* Ink for the 3D print — same rows the DOM sheet shows, so the handoff
     from morphing mesh to clickable sheet is seamless. */
  const texSubtitle = `${drafts.length} brouillon${drafts.length !== 1 ? 's' : ''} à finaliser${activeTypeLabel ? ` · ${activeTypeLabel}` : ''}`
  const texRows: DraftTexRow[] = drafts.slice(0, 4).map((d) => {
    const hue = PROPERTY_STAGE_HUE[d.propertyType] || STAGE_HUES.violet
    return {
      title: d.title || 'Sans titre',
      typeLabel: PROPERTY_TYPE_LABELS[d.propertyType as keyof typeof PROPERTY_TYPE_LABELS] || d.propertyType,
      txn: getTransactionLabel(d.data),
      timeAgo: formatTimeAgo(d.updatedAt),
      pct: d.completion || 0,
      hueA: hue.a,
      hueB: hue.b,
    }
  })

  return (
    <>
      {/* Basket — lidded: the draft lives inside under the cover.
          The lid flips open to throw the wad, then shuts after the catch. */}
      <motion.button
        ref={basketRef}
        type="button"
        onClick={() => { setHasTossed(true); setOpen(v => !v) }}
        whileTap={reduce ? { scale: 0.92 } : { scale: 0.88 }}
        whileHover={reduce ? undefined : open ? undefined : { scale: 1.06 }}
        animate={reduce
          ? { scale: open ? 0.94 : 1 }
          : {
              scale: open ? 0.94 : 1,
              rotate: open ? -6 : 0,
              y: open ? 2 : [0, -4, 0],
              boxShadow: [
                `inset 0 1px 0 rgba(255,255,255,0.45), 0 10px 24px -8px ${bubbleHue.glow}`,
                `inset 0 1px 0 rgba(255,255,255,0.45), 0 10px 34px -6px ${bubbleHue.glow}`,
                `inset 0 1px 0 rgba(255,255,255,0.45), 0 10px 24px -8px ${bubbleHue.glow}`,
              ],
            }}
        transition={reduce ? { duration: 0.15 } : {
          scale: { type: 'spring', stiffness: 420, damping: 22 },
          rotate: { type: 'spring', stiffness: 300, damping: 20 },
          y: open ? { duration: 0.2 } : { duration: 3, repeat: Infinity, ease: 'easeInOut' },
          boxShadow: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' },
        }}
        className={`fixed ${FLOATING_SLOT_1} right-6 z-[9999] flex h-16 w-16 items-center justify-center rounded-full border border-white/25 text-white`}
        style={{ backgroundImage: `linear-gradient(145deg, ${bubbleHue.a} 0%, ${bubbleHue.b} 100%)` }}
        aria-label={`${drafts.length} brouillon${drafts.length !== 1 ? 's' : ''} en cours`}
        aria-expanded={open}
        title="Brouillons"
      >
        {/* clipped shine sweep — signature stage gloss */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
          {!reduce && (
            <motion.span
              className="absolute inset-y-0 w-1/3"
              style={{ backgroundImage: 'linear-gradient(105deg, transparent, rgba(255,255,255,0.4), transparent)' }}
              initial={{ x: '-170%' }}
              animate={{ x: '460%' }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.8 }}
            />
          )}
        </span>
        <span className="relative block h-full w-full">
          {/* lidded basket glyph */}
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.35))' }}
          >
            <path d="M4.5 11.5h15" strokeWidth={2} />
            <path d="M6 11.5 7.1 19a1 1 0 0 0 1 .9h7.8a1 1 0 0 0 1-.9L18 11.5" strokeWidth={1.8} />
            <path d="M9.7 11.5l.35 7" strokeWidth={1.3} opacity={0.85} />
            <path d="M12 11.5v7" strokeWidth={1.3} opacity={0.85} />
            <path d="M14.3 11.5l-.35 7" strokeWidth={1.3} opacity={0.85} />
            {/* cover — hinged left, snaps shut once the wad lands */}
            <motion.g
              animate={open ? { rotate: -66, y: -4.5, x: -0.5 } : { rotate: 0, y: 0, x: 0 }}
              transition={open
                ? { type: 'spring', stiffness: 320, damping: 16 }
                : { type: 'spring', stiffness: 240, damping: 15, delay: reduce ? 0 : 1.5 }}
              style={{ transformOrigin: '0% 80%', transformBox: 'fill-box' } as CSSProperties}
            >
              <rect x="4" y="6.8" width="16" height="2.7" rx="1.35" fill="currentColor" stroke="none" />
              <circle cx="12" cy="4.6" r="1.4" fill="currentColor" stroke="none" />
            </motion.g>
          </svg>
          <motion.span
            key={`count-${drafts.length}`}
            initial={{ scale: 1.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            className="absolute right-[5px] top-[5px] flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white text-[10px] font-extrabold tabular-nums shadow-md"
            style={{ color: bubbleHue.b }}
          >
            {drafts.length}
          </motion.span>
        </span>
        {/* catch ripple — elegant ring that settles the basket shut
            once the re-crumpled wad lands inside */}
        {hasTossed && !open && !reduce && (
          <motion.span
            key={`catch-${drafts.length}`}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{ border: `2px solid ${bubbleHue.line}` }}
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: [0, 0.55, 0], scale: [1, 1.35, 1.6] }}
            transition={{ duration: 0.7, delay: 1.55, ease: 'easeOut' }}
          />
        )}
      </motion.button>

      {/* Crumpled-paper flyout.
          Outer = flight path out of the basket (toss + spin + settle).
          Ball   = faceted paper wad, visible only while small.
          Sheet  = pop-glass list, fading in as the wad unwraps. */}
      <AnimatePresence>
        {open && (
          <div
            className={`fixed ${FLOATING_PANEL_TALL} right-6 z-[9999] w-[420px] max-w-[calc(100vw-32px)]`}
            style={{ perspective: 1100 }}
          >
            {/* grounded shadow — tight & dark as a ball, wide & soft as a sheet */}
            {!reduce && (
              <motion.div
                aria-hidden="true"
                className="absolute -bottom-3 left-10 right-10 h-7 rounded-[50%] bg-black/50"
                style={{ filter: 'blur(14px)' }}
                initial={{ opacity: 0, scaleX: 0.3 }}
                animate={{ opacity: 0.32, scaleX: 1 }}
                exit={{ opacity: 0, scaleX: 0.3, transition: { delay: 1.1, duration: 0.5, ease: 'easeInOut' } }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            )}
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-label="Brouillons de biens en cours"
              initial={reduce
                ? { opacity: 0, scale: 0.9, y: 24 }
                : { opacity: 0, scale: 0.2, y: 96, x: 48, rotate: -12 }}
              animate={reduce
                ? { opacity: 1, scale: 1, y: 0, x: 0, rotate: 0 }
                : { opacity: 1, scale: 1, y: 0, x: 0, rotate: 0 }}
              exit={reduce
                ? { opacity: 0, scale: 0.9, y: 16, transition: { duration: 0.16 } }
                : {
                    /* slow elegant sink: the re-crumpled wad drops back
                       into the basket once the morph has closed it */
                    opacity: [1, 1, 0],
                    scale: [1, 0.55, 0.2],
                    y: [0, 30, 96],
                    x: [0, 20, 48],
                    rotate: [0, 4, 12],
                    transition: { duration: 0.5, delay: 1.15, ease: [0.5, 0, 0.75, 0], times: [0, 0.65, 1] },
                  }}
              transition={reduce
                ? { type: 'spring', damping: 24, stiffness: 320, mass: 0.8 }
                : { type: 'spring', stiffness: 150, damping: 21 }}
              className="relative"
              style={{ maxHeight: FLOATING_PANEL_TALL_MAX_H, transformOrigin: '88% 100%', transformStyle: 'preserve-3d' }}
            >
              {/* ---- BALL: the REAL 3D wad with the draft PRINTED on it ----
                  Planar UVs smear the ink over the crumpled ball; as the
                  GPU morph flattens every vertex, the list undistorts and
                  becomes legible — the reveal IS the unfolding. The DOM
                  sheet fades in over the identical print for clicks. */}
              {!reduce && (
                <motion.div
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-6 right-6 z-[3] h-40 w-40"
                  style={{ filter: 'drop-shadow(0 14px 16px rgba(15,23,42,0.35))' }}
                  initial={{ opacity: 1, scale: 1, rotate: -8 }}
                  animate={{ opacity: 0, scale: 1.05, rotate: 6 }}
                  exit={{ opacity: 1, scale: 1, rotate: 0, transition: { delay: 0.1, duration: 0.25, ease: 'easeOut' } }}
                  transition={{ duration: 0.25, delay: 1.2, ease: 'easeOut' }}
                >
                  <CrumpledPaperBall3D
                    seed={7}
                    detail={6}
                    tex={{ rows: texRows, avg: avgCompletion, subtitle: texSubtitle }}
                  />
                </motion.div>
              )}

              {/* ---- SHEET: flattened white paper, ink lives on it ---- */}
              <motion.div
                className="relative z-[2] overflow-hidden"
                style={{
                  transformStyle: 'preserve-3d',
                  backgroundColor: '#ffffff',
                  backgroundImage: PAPER_BASE,
                  border: PAPER_EDGE,
                  borderRadius: '20px 23px 19px 24px / 23px 19px 24px 20px',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,1), inset 0 -14px 32px rgba(100,116,139,0.14), inset 0 0 60px rgba(100,116,139,0.08), 0 30px 60px -18px rgba(15,23,42,0.45), 0 10px 26px -10px rgba(15,23,42,0.3)',
                }}
                initial={reduce
                  ? { opacity: 0 }
                  : { opacity: 0, y: 14, scale: 0.95, rotateX: 26 }}
                animate={reduce
                  ? { opacity: 1, y: 0, scale: 1, rotateX: 0 }
                  : { opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                exit={reduce ? { opacity: 0 } : {
                  /* gentle wrinkle before the sink carries it home */
                  opacity: 0, y: 10, scale: 0.93, rotateX: 24,
                  transition: { duration: 0.32, delay: 0.08, ease: CRUMPLE_EASE },
                }}
                transition={reduce
                  ? { duration: 0.2 }
                  : { type: 'spring', stiffness: 180, damping: 24, delay: 1.05 }}
              >
                {/* washi-tape hue thread — ties the paper to the property theme */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-10 top-0 z-10 h-[2px] rounded-full opacity-70"
                  style={{ background: `linear-gradient(90deg, transparent, ${bubbleHue.line}88, ${bubbleHue.line}44, transparent)` }}
                />
                {/* permanent ironed-paper body — faint facets, fibre & uneven
                    lighting stay visible so the white sheet never looks digital */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 z-[1]"
                  style={{
                    backgroundImage: `${PAPER_FIBRE_URL}, ${PAPER_NOISE_URL}, radial-gradient(200px 140px at 18% 12%, rgba(255,255,255,0.95), transparent 70%), radial-gradient(260px 200px at 85% 88%, rgba(100,116,139,0.18), transparent 70%), radial-gradient(180px 140px at 70% 25%, rgba(100,116,139,0.10), transparent 70%)`,
                    opacity: 0.9,
                  }}
                />
                <svg viewBox="0 0 400 520" className="pointer-events-none absolute inset-0 z-[1] h-full w-full opacity-[0.55]" preserveAspectRatio="none" aria-hidden="true">
                  <g fill="none" strokeLinecap="round">
                    <path d="M-10 92 L150 60 L410 110" stroke="rgba(100,116,139,0.22)" strokeWidth="1.2" />
                    <path d="M-10 94 L150 62 L410 112" stroke="rgba(255,255,255,0.95)" strokeWidth="1" transform="translate(0 1.6)" />
                    <path d="M40 -10 L120 220 L96 530" stroke="rgba(100,116,139,0.17)" strokeWidth="1.1" />
                    <path d="M250 -10 L210 250 L260 530" stroke="rgba(100,116,139,0.19)" strokeWidth="1.3" />
                    <path d="M-10 330 L410 280" stroke="rgba(100,116,139,0.15)" strokeWidth="1" />
                    <path d="M-10 420 L180 380 L410 430" stroke="rgba(100,116,139,0.17)" strokeWidth="1.1" />
                    <path d="M330 -10 L300 180 L410 320" stroke="rgba(100,116,139,0.14)" strokeWidth="1" />
                    <path d="M-10 180 L120 200 L60 340" stroke="rgba(100,116,139,0.11)" strokeWidth="1" />
                    <path d="M120 -10 L170 140 L130 300" stroke="rgba(100,116,139,0.10)" strokeWidth="0.9" />
                    <path d="M-10 250 L200 230 L410 260" stroke="rgba(100,116,139,0.10)" strokeWidth="0.9" />
                  </g>
                  <g stroke="rgba(100,116,139,0.13)" strokeWidth="1" strokeLinejoin="round">
                    <polygon points="150,60 120,220 210,250 250,110" fill="rgba(255,255,255,0.4)" />
                    <polygon points="120,220 96,420 210,380 210,250" fill="rgba(100,116,139,0.06)" />
                    <polygon points="250,110 210,250 300,280 330,140" fill="rgba(100,116,139,0.05)" />
                    <polygon points="40,180 120,200 100,300 30,280" fill="rgba(255,255,255,0.35)" />
                  </g>
                </svg>
                {/* relaxing folds — strong white creases at toss, soft memory at rest,
                    deepening again while re-crumpling */}
                {!reduce && (
                  <motion.div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-[1]"
                    initial={{ opacity: 0.9 }}
                    animate={{ opacity: 0.34 }}
                    exit={{ opacity: 0.9, transition: { delay: 0.05, duration: 0.45, ease: CRUMPLE_EASE } }}
                    transition={{ delay: 1.1, duration: 0.6, ease: 'easeOut' }}
                    style={{
                      backgroundImage: `repeating-linear-gradient(31deg, transparent 0 11px, rgba(15,23,42,0.13) 11px 12px), repeating-linear-gradient(117deg, transparent 0 15px, rgba(15,23,42,0.09) 15px 16px), repeating-linear-gradient(74deg, transparent 0 23px, rgba(15,23,42,0.05) 23px 24px), radial-gradient(150px 110px at 24% 20%, rgba(255,255,255,0.85), transparent 70%), radial-gradient(170px 130px at 78% 75%, rgba(15,23,42,0.20), transparent 70%), ${PAPER_NOISE_URL}`,
                    }}
                  />
                )}
                {/* edge shading — white rim light + cool recessed edges */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 z-[1]"
                  style={{
                    borderRadius: 'inherit',
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.6), inset 0 -18px 34px rgba(100,116,139,0.16), inset 0 10px 22px rgba(255,255,255,0.7), inset 12px 0 26px rgba(100,116,139,0.08), inset -12px 0 26px rgba(100,116,139,0.10)',
                  }}
                />
                {/* sheet content — ink settles in once the paper lies flat,
                    sinks back first when re-crumpling starts */}
                <motion.div
                  className="relative z-[2]"
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.985 }}
                  animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                  exit={reduce
                    ? { opacity: 0 }
                    : { opacity: 0, y: 8, transition: { duration: 0.18, ease: 'easeIn' } }}
                  transition={{ delay: reduce ? 0 : 1.15, duration: 0.4, ease: UNFOLD_EASE }}
                >

            {/* Header */}
            <div className={cn('flex items-center justify-between gap-2 border-b px-5 pb-4 pt-5', rowBorderCls)}>
              <div className="flex min-w-0 items-center gap-3">
                <OrbIcon icon={FileText} hue={bubbleHue} size={38} radius={12} />
                <div className="min-w-0">
                  <h3 className={cn('truncate text-sm font-extrabold tracking-[-0.2px]', titleCls)}>
                    Brouillons en cours
                  </h3>
                  <p className={cn('mt-0.5 text-[11px] font-medium', subCls)}>
                    {drafts.length} brouillon{drafts.length !== 1 ? 's' : ''} à finaliser
                    {activeTypeLabel ? ` · ${activeTypeLabel}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className="inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-bold"
                  style={{
                    color: '#5b21b6',
                    backgroundColor: 'rgba(139,124,255,0.16)',
                    borderColor: 'rgba(91,33,182,0.28)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)',
                  }}
                >
                  {avgCompletion}% moyen
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Fermer les brouillons"
                  className={cn('rounded-lg p-1.5 transition-all', iconBtnCls)}
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Overall progress — pencil-thin groove pressed into the paper */}
            <div className="px-5 pt-3.5">
              <div
                className="w-full overflow-hidden rounded-full"
                style={{
                  height: 7,
                  backgroundColor: 'rgba(15,23,42,0.10)',
                  boxShadow: 'inset 0 1px 2px rgba(15,23,42,0.18)',
                }}
              >
                <motion.div
                  className="relative h-full rounded-full"
                  style={{
                    width: `${avgCompletion}%`,
                    backgroundImage: `linear-gradient(90deg, ${bubbleHue.b}, ${bubbleHue.a})`,
                    boxShadow: `0 0 10px ${bubbleHue.glow}, inset 0 1px 0 rgba(255,255,255,0.5)`,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${avgCompletion}%` }}
                  transition={{ duration: 1, delay: 1.15, ease: UNFOLD_EASE }}
                />
              </div>
            </div>

            {/* List */}
            <div className="scrollbar-thin mt-2 overflow-y-auto px-2 pb-2" style={{ maxHeight: 'calc(100vh - 320px)' }}>
              {drafts.map((draft, i) => {
                const hue = PROPERTY_STAGE_HUE[draft.propertyType] || STAGE_HUES.violet
                const Icon = PROPERTY_STAGE_ICON[draft.propertyType] || Home
                const pct = draft.completion || 0
                const deleting = deletingId === draft.id
                const typeLabel = PROPERTY_TYPE_LABELS[draft.propertyType as keyof typeof PROPERTY_TYPE_LABELS] || draft.propertyType
                const txnLabel = getTransactionLabel(draft.data)

                return (
                  <motion.div
                    key={draft.id}
                    layout
                    initial={reduce ? { opacity: 0 } : { opacity: 0, x: -14 }}
                    animate={
                      deleting
                        ? { opacity: 0.2, x: 0, scale: 0.96 }
                        : { opacity: 1, x: 0, scale: 1 }
                    }
                    exit={{ opacity: 0, x: 32, transition: { duration: 0.18 } }}
                    transition={{ duration: 0.35, delay: reduce ? 0 : 1.25 + Math.min(i * 0.05, 0.25), ease: [0.22, 1, 0.36, 1] }}
                    whileHover={reduce ? undefined : { x: 2 }}
                    onClick={() => handleResume(draft)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleResume(draft) } }}
                    role="button"
                    tabIndex={0}
                    title={`Reprendre « ${draft.title || 'Sans titre'} »`}
                    className={cn(
                      'group relative flex cursor-pointer items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 transition-colors duration-200',
                      rowHoverCls,
                    )}
                  >
                    {/* hue edge — colored per property type */}
                    <span
                      aria-hidden="true"
                      className="absolute bottom-2.5 left-0 top-2.5 w-[3px] rounded-full"
                      style={{ background: `linear-gradient(180deg, ${hue.a}, ${hue.b})`, boxShadow: `0 0 10px ${hue.glow}`, opacity: 0.85 }}
                    />

                    <OrbIcon icon={Icon} hue={hue} size={38} radius={12} />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={cn('truncate text-[13px] font-bold tracking-[-0.1px]', titleCls)}>
                          {draft.title || 'Sans titre'}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span
                          className="inline-flex items-center whitespace-nowrap rounded-full border px-2 py-px text-[10px] font-bold"
                          style={{
                            color: '#4c1d95',
                            borderColor: 'rgba(76,29,149,0.30)',
                            backgroundColor: 'rgba(139,124,255,0.14)',
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)',
                          }}
                        >
                          {typeLabel}
                        </span>
                        {txnLabel && (
                          <span
                            className="inline-flex items-center whitespace-nowrap rounded-full border px-2 py-px text-[10px] font-semibold"
                            style={{
                              color: '#475569',
                              borderColor: 'rgba(100,116,139,0.30)',
                              backgroundColor: 'rgba(100,116,139,0.10)',
                            }}
                          >
                            {txnLabel}
                          </span>
                        )}
                      </div>
                      <div className={cn('mt-1 flex items-center gap-1.5 text-[10px] font-medium', faintCls)}>
                        <Clock size={9} />
                        <span>{formatTimeAgo(draft.updatedAt)}</span>
                      </div>
                    </div>

                    <StageCompletionRing percent={pct} hue={hue} />

                    <div className="flex shrink-0 items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleResume(draft)}
                        aria-label={`Reprendre ${draft.title || 'le brouillon'}`}
                        title="Reprendre"
                        className="rounded-lg p-1.5 transition-all"
                        style={{ color: hue.line }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${hue.line}1A` }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                      >
                        <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(draft.id)}
                        aria-label={`Supprimer ${draft.title || 'le brouillon'}`}
                        title="Supprimer"
                        className={cn('rounded-lg p-1.5 transition-all hover:!text-rose-400', iconBtnCls)}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(251,113,133,0.12)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Footer — rubber-stamp row on the paper */}
            <div className={cn('flex items-center justify-between border-t px-5 py-3', rowBorderCls)}>
              <span className={cn('text-[10px] font-medium italic', faintCls)}>
                Sauvegardés automatiquement
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[11px] font-bold text-stone-700 underline decoration-stone-400/60 underline-offset-4 transition-colors hover:text-stone-950"
              >
                Fermer
              </button>
            </div>
            </motion.div>
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
