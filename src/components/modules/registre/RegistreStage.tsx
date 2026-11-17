import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'
import {
  FileText, Users, Star, Shield, Share2, Search, Key, Sun, Lock, User,
  TrendingUp, ShoppingCart, Home, Calendar, Clock, Briefcase, Tag,
} from 'react-feather'
import { useStageTheme, useStageScope, STAGE_HUES, SLATE_HUE, ADMIN_ORANGE_HUE, ADMIN_ROSE_HUE, OrbIcon, type StageHue } from '../../dashboard/Stage'
import { RED_HUE, SIDEBAR_EMERALD, LIGHT_INK } from '../prospects/ProspectCard'
import { stagePillStyle } from '../prospects/ProspectDetailStage'
import { MANDAT_TYPE_LABELS, TRANSACTION_ETAPE_LABELS } from '../../../types/transactions'
import type { Transaction, MandatType, TransactionEtape } from '../../../types/transactions'

/* =====================================================================
   RegistreStage — staged kit for the Registre des mandats:
   glass shell accents, hue system, premium tilt cards and the
   staged modal header/tab primitives shared by all registre modals.
   Dark = united stage violet · Light = sidebar emerald glass.
   ===================================================================== */

export const ORANGE_HUE: StageHue = { a: '#FB923C', b: '#C2410C', glow: 'rgba(251,146,60,0.40)', line: '#FB923C' }

/** Theme + accent resolution shared by hero, tabs shell and modal headers.
 *  Dark = admin crimson-rose stage / agent violet stage.
 *  Light = admin orange / agent emerald glass. */
export function useRegistreAccent() {
  const theme = useStageTheme()
  const isDark = theme === 'dark'
  const isAdmin = useStageScope() === 'admin'
  const accent = isDark
    ? isAdmin ? ADMIN_ROSE_HUE : STAGE_HUES.violet
    : isAdmin ? ADMIN_ORANGE_HUE : SIDEBAR_EMERALD
  const ink = isDark
    ? isAdmin ? '#FDA4AF' : STAGE_HUES.violet.a
    : isAdmin ? '#7C2D12' : LIGHT_INK
  return { isDark, isAdmin, accent, ink }
}

/* ------------------------------------------------------------------ */
/* Hue system — mandat type · étape · client role                      */
/* ------------------------------------------------------------------ */

export const MANDAT_TYPE_HUES: Record<MandatType, StageHue> = {
  simple: STAGE_HUES.sky,
  co_exclusif: STAGE_HUES.emerald,
  exclusif: STAGE_HUES.violet,
  exclusif_agence: STAGE_HUES.violet,
  delegation: STAGE_HUES.fuchsia,
  confrere: STAGE_HUES.amber,
  recherche_achat: STAGE_HUES.sky,
  location_gestion: STAGE_HUES.emerald,
  recherche_location: STAGE_HUES.amber,
  location_saisonniere: STAGE_HUES.fuchsia,
}

export const MANDAT_TYPE_ICONS: Record<MandatType, React.ComponentType<{ size?: number | string; className?: string }>> = {
  simple: FileText,
  co_exclusif: Users,
  exclusif: Star,
  exclusif_agence: Shield,
  delegation: Share2,
  confrere: Briefcase,
  recherche_achat: Search,
  location_gestion: Key,
  recherche_location: Search,
  location_saisonniere: Sun,
}

export const ETAPE_HUES: Record<TransactionEtape, StageHue> = {
  reservation: STAGE_HUES.amber,
  signe: STAGE_HUES.emerald,
  actif: STAGE_HUES.emerald,
  cloture: SLATE_HUE,
  en_attente: ORANGE_HUE,
  expire: SLATE_HUE,
  resilie: RED_HUE,
  annule: RED_HUE,
}

export const CLIENT_ROLE_HUES: Record<string, StageHue> = {
  Acheteur: STAGE_HUES.sky,
  Vendeur: STAGE_HUES.violet,
  Bailleur: STAGE_HUES.emerald,
  Locataire: STAGE_HUES.amber,
  Voyageur: STAGE_HUES.fuchsia,
}

export const CLIENT_ROLE_ICONS: Record<string, React.ComponentType<{ size?: number | string; className?: string }>> = {
  Acheteur: ShoppingCart,
  Vendeur: TrendingUp,
  Bailleur: Key,
  Locataire: Home,
  Voyageur: Sun,
}

export const regTypeHue = (t: MandatType | string): StageHue =>
  MANDAT_TYPE_HUES[t as MandatType] || SLATE_HUE
export const regTypeIcon = (t: MandatType | string) =>
  MANDAT_TYPE_ICONS[t as MandatType] || FileText
export const regEtapeHue = (e: TransactionEtape | string): StageHue =>
  ETAPE_HUES[e as TransactionEtape] || SLATE_HUE
export const regRoleHue = (r: string): StageHue =>
  CLIENT_ROLE_HUES[r] || SLATE_HUE
export const regRoleIcon = (r: string) =>
  CLIENT_ROLE_ICONS[r] || User

export const regTypeLabel = (t: MandatType | string): string =>
  MANDAT_TYPE_LABELS[t as MandatType] || String(t)

/* ------------------------------------------------------------------ */
/* Hue pill — staged chip with glowing dot (same language as lists)    */
/* ------------------------------------------------------------------ */

export function HuePill({ hue, label, isDark, icon: Icon }: { hue: StageHue; label: string; isDark: boolean; icon?: React.ComponentType<{ size?: number | string; className?: string }> }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm"
      style={{
        color: isDark ? hue.line : hue.b,
        borderColor: `${hue.line}44`,
        background: isDark ? `${hue.line}1A` : `${hue.line}12`,
      }}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: hue.line, boxShadow: `0 0 6px ${hue.glow}` }} />
      {Icon ? <Icon size={10} /> : null}
      {label}
    </span>
  )
}

/* Role pill — stagePillStyle dressing (used by hero headers). */
export function RolePill({ role, isDark, pulse }: { role: string; isDark: boolean; pulse?: boolean }) {
  const Icon = regRoleIcon(role)
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] backdrop-blur-md"
      style={stagePillStyle(regRoleHue(role), isDark)}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: regRoleHue(role).line }} />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: regRoleHue(role).line }} />
        </span>
      )}
      <Icon size={9} /> {role}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Party avatar — hue initials chip                                    */
/* ------------------------------------------------------------------ */

export type StageTooltipPosition = 'top' | 'bottom' | 'left' | 'right'

/**
 * StageTooltip — premium animated tooltip wrapper.
 * Portals to document.body (immortal to overflow-hidden / tilt ancestors),
 * anchors to the wrapped element's rect, springs + blurs in with a soft
 * delay, follows the trigger through scroll and hides natively-safe.
 */
export function StageTooltip({
  label, children, position = 'top', isDark = false, accent, className, delay = 280, zIndex = 120,
}: {
  label: string
  children: React.ReactNode
  position?: StageTooltipPosition
  isDark?: boolean
  /** Accent color for the glowing dot — defaults to violet (dark) / teal (light). */
  accent?: string | null
  className?: string
  delay?: number
  /** Stack height of the portaled panel — bump for floating rails. */
  zIndex?: number
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)
  const [rect, setRect] = useState<{ cx: number; cy: number; left: number; top: number; right: number; bottom: number } | null>(null)
  const [shiftX, setShiftX] = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)
  const showTimer = useRef<number | null>(null)
  const hideTimer = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  const scope = useStageScope()
  const dotColor = accent
    || (isDark
      ? scope === 'admin' ? '#FB7185' : '#8B7CFF'
      : scope === 'admin' ? '#C2410C' : '#0D9488')

  const measure = useCallback((el: HTMLElement) => {
    const r = el.getBoundingClientRect()
    const vw = window.innerWidth
    const pw = panelRef.current?.offsetWidth ?? 0
    const gap = 9
    let sx = 0
    if (position === 'top' || position === 'bottom') {
      const ax = r.left + r.width / 2
      const half = pw > 0 ? pw / 2 : 70
      const clamped = Math.min(Math.max(ax, half + 10), Math.max(half + 10, vw - half - 10))
      sx = clamped - ax
    } else if (position === 'left') {
      sx = Math.max(0, 10 - (r.left - gap - pw))
    } else {
      sx = Math.min(0, (vw - 10) - (r.right + gap + pw))
    }
    setShiftX(sx)
    setRect({ cx: r.left + r.width / 2, cy: r.top + r.height / 2, left: r.left, top: r.top, right: r.right, bottom: r.bottom })
  }, [position])

  const open = useCallback((el: HTMLElement) => {
    if (hideTimer.current) { window.clearTimeout(hideTimer.current); hideTimer.current = null }
    if (showTimer.current) { window.clearTimeout(showTimer.current); showTimer.current = null }
    showTimer.current = window.setTimeout(() => {
      measure(el)
      setAnchor(el)
      setVisible(true)
    }, delay)
  }, [delay, measure])

  const close = useCallback(() => {
    if (showTimer.current) { window.clearTimeout(showTimer.current); showTimer.current = null }
    if (hideTimer.current) { window.clearTimeout(hideTimer.current); hideTimer.current = null }
    hideTimer.current = window.setTimeout(() => setVisible(false), 90)
  }, [])

  useEffect(() => () => {
    if (showTimer.current) window.clearTimeout(showTimer.current)
    if (hideTimer.current) window.clearTimeout(hideTimer.current)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }, [])

  const panelMounted = visible && anchor
  useLayoutEffect(() => {
    if (!panelMounted || !anchor) return
    const follow = () => {
      if (rafRef.current) return
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        measure(anchor)
      })
    }
    measure(anchor)
    window.addEventListener('scroll', follow, true)
    window.addEventListener('resize', follow)
    return () => {
      window.removeEventListener('scroll', follow, true)
      window.removeEventListener('resize', follow)
    }
  }, [panelMounted, anchor, measure])

  const arrowBase = 'absolute h-2 w-2 rotate-45 rounded-[2px]'

  const arrowPos = {
    top: 'left-1/2 -translate-x-1/2 -bottom-1',
    bottom: 'left-1/2 -translate-x-1/2 -top-1',
    left: 'top-1/2 -translate-y-1/2 -right-1',
    right: 'top-1/2 -translate-y-1/2 -left-1',
  }[position]

  let PANEL: React.CSSProperties = { left: rect ? rect.cx : 0, top: rect ? rect.top : 0 }
  let entrance: any = {
    initial: { opacity: 0, scale: 0.7, x: '-50%', y: 12, filter: 'blur(6px)' },
    animate: { opacity: 1, scale: 1, x: '-50%', y: '-100%', filter: 'blur(0px)' },
    exit: { opacity: 0, scale: 0.75, y: 8, filter: 'blur(4px)', transition: { duration: 0.12, ease: 'easeIn' as const } },
  }
  let originClass = 'origin-bottom'

  if (rect) {
    if (position === 'top') {
      PANEL = { left: rect.cx + shiftX, top: rect.top - 9 }
      entrance = {
        initial: { opacity: 0, scale: 0.7, x: '-50%', y: 12, filter: 'blur(6px)' },
        animate: { opacity: 1, scale: 1, x: '-50%', y: '-100%', filter: 'blur(0px)' },
        exit: { opacity: 0, scale: 0.75, y: 8, filter: 'blur(4px)', transition: { duration: 0.12, ease: 'easeIn' } },
      }
      originClass = 'origin-bottom'
    } else if (position === 'bottom') {
      PANEL = { left: rect.cx + shiftX, top: rect.bottom + 9 }
      entrance = {
        initial: { opacity: 0, scale: 0.7, x: '-50%', y: -8, filter: 'blur(6px)' },
        animate: { opacity: 1, scale: 1, x: '-50%', y: '0%', filter: 'blur(0px)' },
        exit: { opacity: 0, scale: 0.75, y: -6, filter: 'blur(4px)', transition: { duration: 0.12, ease: 'easeIn' } },
      }
      originClass = 'origin-top'
    } else if (position === 'left') {
      PANEL = { left: rect.left - 9 + shiftX, top: rect.cy }
      entrance = {
        initial: { opacity: 0, scale: 0.7, x: -10, y: '-50%', filter: 'blur(6px)' },
        animate: { opacity: 1, scale: 1, x: '-100%', y: '-50%', filter: 'blur(0px)' },
        exit: { opacity: 0, scale: 0.75, x: -8, y: '-50%', filter: 'blur(4px)', transition: { duration: 0.12, ease: 'easeIn' } },
      }
      originClass = 'origin-right'
    } else {
      PANEL = { left: rect.right + 9 + shiftX, top: rect.cy }
      entrance = {
        initial: { opacity: 0, scale: 0.7, x: 10, y: '-50%', filter: 'blur(6px)' },
        animate: { opacity: 1, scale: 1, x: '0%', y: '-50%', filter: 'blur(0px)' },
        exit: { opacity: 0, scale: 0.75, x: 8, y: '-50%', filter: 'blur(4px)', transition: { duration: 0.12, ease: 'easeIn' } },
      }
      originClass = 'origin-left'
    }
  }

  return (
    <span
      className={`relative inline-flex ${className || ''}`}
      onMouseEnter={(e) => open(e.currentTarget as HTMLElement)}
      onMouseLeave={close}
    >
      {children}
      {createPortal(
        <AnimatePresence>
          {visible && rect && (
            <motion.div
              key="stage-tooltip"
              ref={panelRef}
              {...(entrance as any)}
              transition={{ type: 'spring', stiffness: 420, damping: 26, mass: 0.7 }}
              className={`pointer-events-none fixed ${originClass}`}
              style={{ left: PANEL.left, top: PANEL.top, zIndex }}
            >
              <div
                role="tooltip"
                className={`relative inline-flex max-w-[240px] items-center gap-2 rounded-xl border px-3 py-2 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.55)] backdrop-blur-xl ${
                  isDark
                    ? 'border-white/15 bg-[#0B0A1A]/95 text-slate-100'
                    : 'border-white/90 bg-white/95 text-teal-950 shadow-[0_18px_40px_-14px_rgba(13,148,136,0.35)]'
                }`}
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: dotColor, boxShadow: `0 0 8px ${dotColor}` }} />
                <span className="text-[11px] font-bold leading-snug">{label}</span>
                <span
                  aria-hidden="true"
                  className={`absolute ${arrowBase} ${arrowPos} ${
                    isDark ? 'border-b border-r border-white/15 bg-[#0B0A1A]/95' : 'border-b border-r border-white/90 bg-white/95'
                  }`}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </span>
  )
}

export function PartyAvatar({ name, role, isDark }: { name: string; role?: string; isDark: boolean }) {
  const hue = (role && CLIENT_ROLE_HUES[role.trim()]) || SLATE_HUE
  const initials = (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase() || '—'
  const chip = (
    <span
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[9px] font-extrabold tracking-wide"
      style={{
        background: isDark ? `${hue.line}26` : `${hue.line}14`,
        borderColor: `${hue.line}44`,
        color: isDark ? hue.line : hue.b,
        boxShadow: `0 0 10px ${hue.glow}`,
      }}
    >
      {initials}
    </span>
  )
  if (!name) return chip
  return (
    <StageTooltip label={name} isDark={isDark} accent={hue.line} delay={420}>
      {chip}
    </StageTooltip>
  )
}

/* ------------------------------------------------------------------ */
/* Premium glass mandat card: tilt + glare + hue hairline              */
/* ------------------------------------------------------------------ */

export function StagedRegistreCard({
  t, index, isDark, menuLocked, onOpen, actions,
}: {
  t: Transaction
  index: number
  isDark: boolean
  menuLocked: boolean
  onOpen: () => void
  /** RegistreActionsMenu node rendered top-right of the card. */
  actions: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const rx = useSpring(useMotionValue(0), { stiffness: 240, damping: 20 })
  const ry = useSpring(useMotionValue(0), { stiffness: 240, damping: 20 })

  const typeHue = regTypeHue(t.type)
  const etapeHue = regEtapeHue(t.etape)
  const typeLabel = regTypeLabel(t.type)
  const TypeIcon = regTypeIcon(t.type)
  const createdLabel = (t.dateContrat || (t as any).dateContracted)
    ? new Date(t.dateContrat || (t as any).dateContracted).toLocaleDateString('fr-FR')
    : '—'

  const onMove = (e: React.MouseEvent) => {
    if (reduce || !ref.current || !window.matchMedia?.('(pointer: fine)').matches) return
    const rect = ref.current.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    ry.set((px - 0.5) * 5)
    rx.set(-(py - 0.5) * 5)
    ref.current.style.setProperty('--glare-x', `${px * 100}%`)
    ref.current.style.setProperty('--glare-y', `${py * 100}%`)
  }

  const onLeave = () => { rx.set(0); ry.set(0) }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onOpen}
      initial={{ opacity: 0, y: 24, scale: 0.96, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      transition={{ delay: Math.min(index * 0.05, 0.45), duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className="stage-glass tilt-card group relative flex h-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-2xl"
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
    >
      <div className="tilt-glare" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
        style={{ background: `linear-gradient(90deg, transparent, ${typeHue.line}CC 30%, ${typeHue.line}CC 70%, transparent)` }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(58% 85% at 100% 0%, ${typeHue.glow}, transparent 70%)`, opacity: 0.16 }}
      />

      {/* identity row: type orb + reference + property, actions on the right */}
      <div className="relative flex items-start gap-3 p-4 pb-3">
        <OrbIcon icon={TypeIcon} hue={typeHue} size={40} radius={13} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className={`font-mono text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.reference}</span>
            {menuLocked && (
              <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-300' : 'border-slate-200/80 bg-white text-slate-500'}`}>
                <Lock size={9} /> Confidential
              </span>
            )}
          </div>
          <p className={`mt-1 truncate text-[15px] font-extrabold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {t.propertyTitle || t.clientName || 'Sans bien lié'}
          </p>
          {t.propertyRef ? (
            <p className={`mt-0.5 font-mono text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t.propertyRef}</p>
          ) : null}
        </div>
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          {menuLocked ? (
            <StageTooltip label="Actions verrouillées" isDark={isDark} position="top">
              <span
                className={`inline-flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-xl border opacity-60 blur-[1.5px] ${isDark ? 'border-white/10 bg-white/[0.05] text-slate-300' : 'border-slate-200/80 bg-white/70 text-slate-400'}`}
              >
                <Lock size={14} />
              </span>
            </StageTooltip>
          ) : (
            actions
          )}
        </div>
      </div>

      {/* status + type pills */}
      <div className="relative flex flex-wrap items-center gap-1.5 px-4">
        <HuePill hue={typeHue} label={typeLabel} isDark={isDark} />
        <HuePill hue={etapeHue} label={TRANSACTION_ETAPE_LABELS[t.etape] || t.etape} isDark={isDark} />
      </div>

      {/* client row with role avatar */}
      <div className="relative mt-3 flex min-w-0 items-center gap-2 px-4">
        <PartyAvatar name={t.clientName} role={t.clientType} isDark={isDark} />
        <span className={`truncate text-[11px] font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{t.clientName || '—'}</span>
        <HuePill hue={regRoleHue(t.clientType)} label={t.clientType || '—'} isDark={isDark} />
      </div>

      {/* footer: agent + date / montant */}
      <div className={`relative mt-auto flex items-center justify-between gap-3 border-t px-4 py-3 text-[11px] font-medium ${isDark ? 'border-white/[0.06]' : 'border-slate-200/70'}`}>
        <span className={`flex min-w-0 items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <User size={11} className="shrink-0" />
          <span className="truncate">{t.agentName || '—'}</span>
          <span className="hidden truncate sm:inline"><span className="opacity-40">·</span> {createdLabel}</span>
        </span>
        <span className={`shrink-0 truncate text-[13px] font-extrabold tabular-nums ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
          {t.montant ? (
            <span className="inline-flex items-center gap-1">
              <Tag size={10} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
              {t.montant}
            </span>
          ) : (
            <span className="opacity-60">—</span>
          )}
        </span>
      </div>
    </motion.div>
  )
}




/* ------------------------------------------------------------------ */
/* Modal hero — orb identity + reference/title + pills + money lens    */
/* ------------------------------------------------------------------ */

export function RegistreModalHero({
  t, isDark, icon, instanceLabel, badges, amountLabel, kpiChips, titleOverride,
}: {
  t: Transaction
  isDark: boolean
  icon: React.ComponentType<{ size?: number | string; className?: string }>
  /** e.g. "Détail du mandat" — renders above the reference. */
  instanceLabel: string
  badges: React.ReactNode
  amountLabel: string
  kpiChips: { icon: React.ComponentType<{ size?: number | string; className?: string; style?: React.CSSProperties }>; label: string; value: string; mono?: boolean }[]
  titleOverride?: string
}) {
  const { accent, ink } = useRegistreAccent()
  const hue = regTypeHue(t.type)
  const roleHue = regRoleHue(t.clientType)
  const title = titleOverride ?? t.clientName
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl border p-4 sm:p-5"
      style={{
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(148,163,184,0.35)',
        background: isDark
          ? `linear-gradient(160deg, rgba(255,255,255,0.055), rgba(255,255,255,0.02)), rgba(15,23,42,0.35)`
          : `linear-gradient(160deg, rgba(255,255,255,0.9), rgba(255,255,255,0.65))`,
        backdropFilter: 'blur(14px)',
        boxShadow: isDark
          ? '0 18px 44px -22px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.10)'
          : '0 16px 40px -24px rgba(15,23,42,0.18), inset 0 1px 0 rgba(255,255,255,0.9)',
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: isDark
            ? `radial-gradient(90% 80% at 0% 0%, ${hue.glow}, transparent 60%)`
            : `radial-gradient(90% 80% at 0% 0%, ${hue.glow}, transparent 62%)`,
          opacity: isDark ? 0.22 : 0.5,
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ background: `linear-gradient(90deg, ${accent.a}, ${accent.b})`, boxShadow: `0 0 14px ${accent.glow}` }}
      />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex min-w-0 flex-1 items-start gap-3.5">
          <OrbIcon icon={icon} hue={hue} size={52} radius={16} />
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: isDark ? accent.a : ink }}>
              {instanceLabel} · <span className="font-mono">{t.reference}</span>
            </p>
            <h1 className={`mt-0.5 truncate text-lg font-extrabold tracking-[-0.3px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {title || '—'}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {badges}
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${isDark ? 'border-white/10 bg-white/[0.05] text-slate-300' : 'border-slate-200/80 bg-white/70 text-slate-500'}`}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: roleHue.line, boxShadow: `0 0 6px ${roleHue.glow}` }} />
                {t.clientType || 'Client'}
              </span>
            </div>
          </div>
        </div>
        <div
          className="flex shrink-0 flex-col items-center justify-center rounded-2xl border px-5 py-3"
          style={{
            borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(13,148,136,0.16)',
            background: isDark ? 'rgba(10,15,36,0.55)' : 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(10px)',
            boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.08)' : 'inset 0 1px 0 rgba(255,255,255,0.9)',
          }}
        >
          <span className={`text-[9px] font-bold uppercase tracking-[1.5px] ${isDark ? 'text-slate-400' : 'text-teal-900/60'}`}>{amountLabel}</span>
          <span className={`mt-1 text-[17px] font-extrabold leading-none tracking-[-0.5px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {t.montant || '—'}
          </span>
        </div>
      </div>

      {kpiChips.length > 0 && (
        <div className="relative mt-4 flex flex-wrap gap-2">
          {kpiChips.map((k) => {
            const KIcon = k.icon
            return (
              <span
                key={k.label}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-semibold ${isDark ? 'border-white/[0.08] bg-white/[0.04] text-slate-300' : 'border-slate-200/80 bg-white/70 text-slate-600'}`}
              >
                <KIcon size={11} style={{ color: isDark ? accent.a : ink }} />
                <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>{k.label}</span>
                <span className={`truncate font-bold ${k.mono ? 'font-mono' : ''} ${isDark ? 'text-white' : 'text-slate-900'}`}>{k.value}</span>
              </span>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* Modal pill tabs — sliding gradient indicator                        */
/* ------------------------------------------------------------------ */

const TAB_ICONS: Record<string, React.ComponentType<{ size?: number | string; className?: string }>> = {
  apercu: Home,
  criteres: Search,
  bien: Tag,
  biens: Home,
  sejour: Home,
  finances: Briefcase,
  documents: FileText,
  suivi: Clock,
  reservation: Calendar,
  demandes: Calendar,
  client: User,
}

export function RegistreModalTabs({
  tabs, activeId, onChange,
}: {
  tabs: { id: string; label: string }[]
  activeId: string
  onChange: (id: string) => void
}) {
  const theme = useStageTheme()
  const isDark = theme === 'dark'
  const { accent, isAdmin } = useRegistreAccent()
  return (
    <div
      className="flex gap-1.5 overflow-x-auto rounded-xl border px-1.5 py-1.5 scrollbar-thin"
      style={{
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(148,163,184,0.3)',
        background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {tabs.map((tab) => {
        const active = tab.id === activeId
        const Icon = TAB_ICONS[tab.id] || FileText
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all duration-200 ${
              active
                ? 'text-white'
                : isDark
                  ? 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
                  : 'text-slate-500 hover:bg-teal-900/[0.05] hover:text-slate-900'
            }`}
          >
            {active && (
              <motion.span
                layoutId="registre-modal-tab-pill"
                className="absolute inset-0 rounded-lg border border-white/20"
                style={{
                  backgroundImage: `linear-gradient(145deg, ${accent.a} 0%, ${accent.b} 60%, ${accent.b} 100%)`,
                  boxShadow: isDark
                    ? isAdmin
                      ? 'inset 0 1px 0 rgba(255,255,255,0.35), 0 8px 20px -8px rgba(190,18,60,0.55)'
                      : 'inset 0 1px 0 rgba(255,255,255,0.35), 0 8px 20px -8px rgba(0,0,0,0.5)'
                    : isAdmin
                      ? 'inset 0 1px 0 rgba(255,255,255,0.5), 0 8px 20px -10px rgba(249,115,22,0.55)'
                      : 'inset 0 1px 0 rgba(255,255,255,0.5), 0 8px 20px -10px rgba(13,148,136,0.55)',
                }}
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <Icon size={13} className="relative z-10 shrink-0" />
            <span className="relative z-10 whitespace-nowrap">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
