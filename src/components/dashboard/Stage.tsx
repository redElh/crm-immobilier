import { createContext, useEffect, useId, useMemo, useRef, useContext, useState } from 'react'
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'framer-motion'
import { ArrowDownRight, ArrowUpRight, ChevronRight } from 'react-feather'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { cn } from '../../lib/utils'
import { AnimatedNumber } from './AnimatedNumber'
export { AnimatedNumber } from './AnimatedNumber'

/* =====================================================================
   STAGE — Mission Control design system (agent dashboard only)
   Deep-space canvas, frosted glass, glossy orbs, neon-glow charts.
   ===================================================================== */

export interface StageHue {
  /** gradient start */
  a: string
  /** gradient end */
  b: string
  /** ambient glow */
  glow: string
  /** solid line/bar color */
  line: string
}

export const STAGE_HUES: Record<string, StageHue> = {
  violet: { a: '#8B7CFF', b: '#5B4BD4', glow: 'rgba(124,92,255,0.55)', line: '#8B7CFF' },
  sky: { a: '#38BDF8', b: '#0369A1', glow: 'rgba(56,189,248,0.45)', line: '#38BDF8' },
  amber: { a: '#FBBF24', b: '#B45309', glow: 'rgba(251,191,36,0.40)', line: '#FBBF24' },
  emerald: { a: '#34D399', b: '#059669', glow: 'rgba(52,211,153,0.45)', line: '#34D399' },
  fuchsia: { a: '#E879F9', b: '#A21CAF', glow: 'rgba(232,121,249,0.45)', line: '#E879F9' },
}

export type StageHueKey = keyof typeof STAGE_HUES

/* Slate hue for "restant / neutral" gauge segments */
export const SLATE_HUE: StageHue = {
  a: '#94A3B8', b: '#475569', glow: 'rgba(148,163,184,0.40)', line: '#94A3B8',
}

/* ---------------------------------------------------------------------
   Theme context — 'dark' (Mission Control) | 'light' (Lagoon)
--------------------------------------------------------------------- */

export type StageTheme = 'dark' | 'light'

const StageThemeContext = createContext<StageTheme>('dark')

export function useStageTheme(): StageTheme {
  return useContext(StageThemeContext)
}

/* Provider so the whole app shell (sidebar, topbar, pages) shares one theme */
export function StageThemeProvider({
  value,
  children,
}: {
  value: StageTheme
  children: React.ReactNode
}) {
  return <StageThemeContext.Provider value={value}>{children}</StageThemeContext.Provider>
}

const StageThemeSetterContext = createContext<((t: StageTheme) => void) | null>(null)

export function useStageThemeSetter() {
  return useContext(StageThemeSetterContext)
}

export function StageThemeSetterProvider({
  value,
  children,
}: {
  value: (t: StageTheme) => void
  children: React.ReactNode
}) {
  return <StageThemeSetterContext.Provider value={value}>{children}</StageThemeSetterContext.Provider>
}

/* Owns the persisted theme state — mount once, in the root layout */
export function useStageThemeState(): [StageTheme, (t: StageTheme) => void] {
  const [theme, setTheme] = useState<StageTheme>(() => {
    try {
      const v = localStorage.getItem('stage-theme')
      return v === 'dark' || v === 'light' ? v : 'light'
    } catch {
      return 'light'
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem('stage-theme', theme)
    } catch {
      /* ignore */
    }
    // Notify portalled widgets (Cardinal, toasts) that live outside the shell.
    window.dispatchEvent(new CustomEvent('stage-theme-change', { detail: theme }))
  }, [theme])
  return [theme, setTheme]
}

/* ---------------------------------------------------------------------
   Shell scope — 'agent' (default) | 'admin'
   Admin light mode wears a vivid orange accent to stand apart from
   the agent emerald lagoon; both scopes share violet in dark mode.
--------------------------------------------------------------------- */

export type StageScope = 'agent' | 'admin'

/** Agent light lagoon accent (emerald) */
export const AGENT_EMERALD_HUE: StageHue = {
  a: '#2DD4BF', b: '#0D9488', glow: 'rgba(13,148,136,0.45)', line: '#0D9488',
}

/** Admin light canvas accent (vivid orange) */
export const ADMIN_ORANGE_HUE: StageHue = {
  a: '#FB923C', b: '#C2410C', glow: 'rgba(249,115,22,0.45)', line: '#F97316',
}

/** Admin dark identity — the vivid "Poche de qualification" blend:
 *  crimson rose → deep violet, distinct from the agent violet stage. */
export const ADMIN_ROSE_HUE: StageHue = {
  a: '#F43F5E', b: '#6D28D9', glow: 'rgba(244,63,94,0.50)', line: '#F43F5E',
}

/** Softer rose for text/dots resting on the dark admin canvas */
export const ADMIN_ROSE_INK = '#FB7185'

/** Gérant identity — muted mauve, mirrors the legacy `#905D5D` token used
 *  across the admin/gérant property pages. */
export const GERANT_MAUVE_HUE: StageHue = {
  a: '#A56E6E', b: '#7D5050', glow: 'rgba(144,93,93,0.45)', line: '#905D5D',
}

const StageScopeContext = createContext<StageScope>('agent')

export function useStageScope(): StageScope {
  return useContext(StageScopeContext)
}

export function StageScopeProvider({
  value,
  children,
}: {
  value: StageScope
  children: React.ReactNode
}) {
  return <StageScopeContext.Provider value={value}>{children}</StageScopeContext.Provider>
}

/** Primary accent for staged chrome:
 *  dark → violet (agent) / crimson-rose (admin)
 *  light → emerald (agent) / orange (admin). */
export function useStageAccent(): StageHue {
  const theme = useStageTheme()
  const scope = useStageScope()
  if (theme === 'dark') return scope === 'admin' ? ADMIN_ROSE_HUE : STAGE_HUES.violet
  return scope === 'admin' ? ADMIN_ORANGE_HUE : AGENT_EMERALD_HUE
}

/* ---------------------------------------------------------------------
   Stage shell: cosmic canvas + drifting aurora fields
--------------------------------------------------------------------- */

export function Stage({
  children,
  theme = 'dark',
}: {
  children: React.ReactNode
  theme?: StageTheme
}) {
  return (
    <StageThemeContext.Provider value={theme}>
      <div className={`${theme === 'dark' ? 'stage-dark' : 'stage-light'} -m-6 p-6`}>
        <div className="aurora-blob aurora-violet" aria-hidden="true" />
        <div className="aurora-blob aurora-cyan" aria-hidden="true" />
        <div className="aurora-blob aurora-magenta" aria-hidden="true" />
        <div className="stage-content space-y-6">{children}</div>
      </div>
    </StageThemeContext.Provider>
  )
}

/** Animated tab-content swap: blur + rise (+ optional horizontal drift
    driven by `direction` so forward/backward swaps read bidirectionally). */
export function StageTabSwap({
  tabId,
  children,
  duration = 0.45,
  direction = 0,
}: {
  tabId: string
  children: React.ReactNode
  duration?: number
  direction?: number
}) {
  return (
    <motion.div
      key={tabId}
      initial={{ opacity: 0, y: 18, x: direction * 22, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, x: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -10, x: direction * -14, filter: 'blur(6px)' }}
      transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-6"
    >
      {children}
    </motion.div>
  )
}

/* ---------------------------------------------------------------------
   TiltCard — cursor-tracking 3D perspective card with moving glare
--------------------------------------------------------------------- */

export function TiltCard({
  children,
  className,
  contentClassName,
  onClick,
}: {
  children: React.ReactNode
  className?: string
  /** Classes for the inner content wrapper (defaults to a plain full-height box). */
  contentClassName?: string
  onClick?: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const canTilt = useMemo(
    () =>
      !reduce &&
      typeof window !== 'undefined' &&
      window.matchMedia?.('(pointer: fine)').matches,
    [reduce]
  )
  const rx = useSpring(useMotionValue(0), { stiffness: 240, damping: 20 })
  const ry = useSpring(useMotionValue(0), { stiffness: 240, damping: 20 })

  const onMove = (e: React.MouseEvent) => {
    if (!canTilt || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    ry.set((px - 0.5) * 7)
    rx.set(-(py - 0.5) * 7)
    ref.current.style.setProperty('--glare-x', `${px * 100}%`)
    ref.current.style.setProperty('--glare-y', `${py * 100}%`)
  }
  const onLeave = () => {
    rx.set(0)
    ry.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900, cursor: onClick ? 'pointer' : 'default' }}
      className={cn('tilt-card stage-glass overflow-hidden', className)}
    >
      <div className="tilt-glare" aria-hidden="true" />
      <div className={cn('relative h-full', contentClassName)}>
        {children}
      </div>
    </motion.div>
  )
}

/* ---------------------------------------------------------------------
   OrbIcon — glossy 3D orb badge
--------------------------------------------------------------------- */

export function OrbIcon({
  icon: Icon,
  hue,
  size = 44,
  radius = 14,
  className,
}: {
  icon: React.ComponentType<{ size?: number | string; className?: string }>
  hue: StageHue
  size?: number
  radius?: number
  className?: string
}) {
  return (
    <div
      className={cn('orb-icon shrink-0', className)}
      style={
        {
          width: size,
          height: size,
          borderRadius: radius,
          '--orb-a': hue.a,
          '--orb-b': hue.b,
          '--orb-glow': hue.glow,
        } as React.CSSProperties
      }
    >
      <span style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.35))', display: 'inline-flex' }}>
        <Icon size={Math.round(size * 0.44)} />
      </span>
    </div>
  )
}

/* ---------------------------------------------------------------------
   StageStatCard — KPI formula on a tilt card
   [orb] [⋯]
   LABEL
   12 345
   [↑ +12%] vs période précédente
   ~~~~~~~~~ glow sparkline ~~~~~~~~~
--------------------------------------------------------------------- */

interface StageStatCardProps {
  icon: React.ComponentType<{ size?: number | string; className?: string }>
  label: string
  value: number
  suffix?: string
  trend?: string
  trendUp?: boolean
  hue: StageHue
  spark?: number[]
  delay?: number
  /** Useful top-right slot (e.g. live badge, mini action). Renders nothing when omitted. */
  action?: React.ReactNode
  /** Compact context line shown below the KPI value. */
  detail?: string
}

export function StageStatCard({
  icon,
  label,
  value,
  suffix,
  trend,
  trendUp = true,
  hue,
  spark,
  delay = 0,
  action,
  detail,
}: StageStatCardProps) {
  const theme = useStageTheme()
  const TrendIcon = trendUp ? ArrowUpRight : ArrowDownRight
  const trendColor = theme === 'dark'
    ? (trendUp ? '#6EE7B7' : '#FDA4AF')
    : (trendUp ? '#059669' : '#E11D48')
  const labelColor = theme === 'dark' ? 'text-slate-400' : 'text-teal-900/60'
  const faintColor = theme === 'dark' ? 'text-slate-500' : 'text-teal-900/40'
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <TiltCard className="flex h-full min-h-[124px] flex-col p-3.5">
        <div className="flex items-start justify-between gap-2">
          <OrbIcon icon={icon} hue={hue} size={40} radius={12} />
          {action}
        </div>

        <p className={`mt-3 text-[10px] font-bold uppercase tracking-[1.35px] ${labelColor}`}>
          {label}
        </p>
        <AnimatedNumber
          value={value}
          suffix={suffix}
          className={theme === 'dark'
            ? 'mt-0.5 block text-[27px] font-extrabold leading-none tracking-[-0.8px] text-white'
            : 'mt-0.5 block text-[27px] font-extrabold leading-none tracking-[-0.8px] text-slate-900'}
        />
        {detail && (
          <p className={`mt-1 truncate text-[10px] font-medium ${faintColor}`}>{detail}</p>
        )}

        {trend && (
          <div className="mt-2 flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold"
              style={{
                color: trendColor,
                borderColor: `${trendColor}33`,
                backgroundColor: `${trendColor}14`,
              }}
            >
              <TrendIcon size={11} strokeWidth={2.75} />
              {trend}
            </span>
            <span className={`text-[11px] font-medium ${faintColor}`}>vs période précédente</span>
          </div>
        )}

        {spark && (
          <div className="-mx-4 -mb-4 mt-auto overflow-hidden rounded-b-[inherit] pt-2">
            <GlowSparkline data={spark} color={hue.line} height={34} />
          </div>
        )}
      </TiltCard>
    </motion.div>
  )
}

/* ---------------------------------------------------------------------
   GlowSparkline — self-drawing neon line with soft under-glow
--------------------------------------------------------------------- */

export function GlowSparkline({
  data,
  color,
  height = 48,
}: {
  data: number[]
  color: string
  height?: number
}) {
  const id = useId().replace(/:/g, '')
  const max = Math.max(...data, 1)
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * 100,
    38 - (v / max) * 32,
  ])
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ')
  const areaPath = `${linePath} L100,40 L0,40 Z`

  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ height, width: '100%' }}>
      <defs>
        <linearGradient id={`sg-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={areaPath}
        fill={`url(#sg-${id})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.5 }}
      />
      {/* soft neon under-glow */}
      <motion.path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        style={{ opacity: 0.22, filter: 'blur(3px)' }}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
      />
      {/* crisp core line */}
      <motion.path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
      />
    </svg>
  )
}

/* ---------------------------------------------------------------------
   StagePanel — glass panel with orb title chip
--------------------------------------------------------------------- */

export function StagePanel({
  title,
  icon,
  badge,
  action,
  hue,
  children,
  className,
  outerClassName,
}: {
  title: string
  icon?: React.ComponentType<{ size?: number | string; className?: string }>
  badge?: React.ReactNode
  action?: React.ReactNode
  hue?: StageHue
  children: React.ReactNode
  className?: string
  /** classes for the motion wrapper (e.g. h-full / flex-1 to equalize grid tracks) */
  outerClassName?: string
}) {
  const theme = useStageTheme()
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={outerClassName}
    >
      <div
        className={cn(
          'stage-glass flex h-full min-h-0 flex-col overflow-hidden p-5 transition-all duration-300',
          className
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            {icon && <OrbIcon icon={icon} hue={hue || STAGE_HUES.violet} size={34} radius={11} />}
            <h2 className={cn(
              'text-[15px] font-bold tracking-[-0.2px]',
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            )}>
              {title}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {action}
            {badge}
          </div>
        </div>
        <div className="min-h-0 flex-1">{children}</div>
      </div>
    </motion.div>
  )
}

/* ---------------------------------------------------------------------
   StageBadge — glass semantic pills
--------------------------------------------------------------------- */

const BADGE_VARIANTS: Record<string, { fg: string; bg: string; border: string }> = {
  neutral: { fg: '#C9CFE8', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)' },
  violet: { fg: '#C7CBFF', bg: 'rgba(124,92,255,0.16)', border: 'rgba(139,124,255,0.35)' },
  ok: { fg: '#6EE7B7', bg: 'rgba(52,211,153,0.13)', border: 'rgba(52,211,153,0.32)' },
  warn: { fg: '#FCD34D', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.30)' },
  danger: { fg: '#FDA4AF', bg: 'rgba(251,113,133,0.13)', border: 'rgba(251,113,133,0.32)' },
}

/* Light (lagoon) counterparts — deep ink text on soft tints so every
   variant stays readable on bright glass (dark map above is untouched). */
const BADGE_VARIANTS_LIGHT: Record<string, { fg: string; bg: string; border: string }> = {
  neutral: { fg: '#334155', bg: 'rgba(15,23,42,0.05)', border: 'rgba(15,23,42,0.10)' },
  violet: { fg: '#5B4BD4', bg: 'rgba(124,92,255,0.12)', border: 'rgba(124,92,255,0.30)' },
  ok: { fg: '#047857', bg: 'rgba(5,150,105,0.10)', border: 'rgba(5,150,105,0.28)' },
  warn: { fg: '#B45309', bg: 'rgba(251,191,36,0.14)', border: 'rgba(217,119,6,0.30)' },
  danger: { fg: '#DC2626', bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.28)' },
}

export function StageBadge({
  variant = 'neutral',
  children,
  className,
  style,
}: {
  variant?: keyof typeof BADGE_VARIANTS
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  const theme = useStageTheme()
  const map = theme === 'light' ? BADGE_VARIANTS_LIGHT : BADGE_VARIANTS
  const v = map[variant] || map.neutral
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm',
        className
      )}
      style={{ color: v.fg, backgroundColor: v.bg, borderColor: v.border, ...style }}
    >
      {children}
    </span>
  )
}

/* ---------------------------------------------------------------------
   StageButton — 3D glass / gradient buttons
--------------------------------------------------------------------- */

export function StageButton({
  variant = 'primary',
  size = 'sm',
  icon,
  onClick,
  children,
  className,
  disabled,
}: {
  variant?: 'primary' | 'glass'
  size?: 'sm' | 'md'
  icon?: React.ReactNode
  onClick?: () => void
  children?: React.ReactNode
  className?: string
  disabled?: boolean
}) {
  const theme = useStageTheme()
  const accent = useStageAccent()
  const dark = theme === 'dark'
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.96, y: 1 }}
      className={cn(
        'relative inline-flex items-center justify-center gap-1.5 overflow-hidden rounded-xl font-semibold transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none',
        size === 'sm' ? 'h-8 px-3 text-xs' : 'h-9 px-4 text-sm',
        variant === 'primary'
          ? 'border border-white/20 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.42)] hover:brightness-110'
          : dark
            ? 'border border-white/12 text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] hover:text-white'
            : 'border border-teal-900/12 text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] hover:text-teal-800',
        className
      )}
      style={
        variant === 'primary'
          ? {
              backgroundImage: `linear-gradient(145deg, ${accent.a} 0%, ${accent.b} 55%, ${accent.b} 100%)`,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45), 0 8px 22px -6px ' + accent.glow,
            }
          : dark
            ? { backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.03))' }
            : { backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.5))' }
      }
    >
      {variant === 'primary' && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 hover:opacity-100"
          style={{ backgroundImage: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)' }}
        />
      )}
      {icon}
      {children}
    </motion.button>
  )
}

/* ---------------------------------------------------------------------
   StageTabs — sliding gradient indicator with glow
--------------------------------------------------------------------- */

export interface StageTab {
  id: string
  label: string
  icon: React.ComponentType<{ size?: number | string; className?: string }>
}

export function StageTabs({
  tabs,
  activeId,
  onChange,
}: {
  tabs: StageTab[]
  activeId: string
  onChange: (id: string) => void
}) {
  const theme = useStageTheme()
  const dark = theme === 'dark'
  const accent = useStageAccent()
  return (
    <div className="stage-glass grid w-full grid-cols-2 gap-1 p-1.5 sm:grid-cols-3 lg:grid-cols-5">
      {tabs.map(tab => {
        const Icon = tab.icon
        const active = tab.id === activeId
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative flex items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-[13px] font-semibold transition-colors duration-200',
              active
                ? 'text-white'
                : dark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-500 hover:text-teal-900'
            )}
          >
            {active && (
              <motion.span
                layoutId="stage-tab-pill"
                className="absolute inset-0 rounded-xl border border-white/20"
                style={{
                  backgroundImage: `linear-gradient(145deg, ${accent.a} 0%, ${accent.b} 60%, ${accent.b} 100%)`,
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 10px 26px -8px ' + accent.glow,
                }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            {!active && (
              <span className={cn('absolute inset-0 rounded-xl transition-colors',
                dark ? 'hover:bg-white/5' : 'hover:bg-teal-900/5')} />
            )}
            <Icon size={15} className="relative z-10" />
            <span className="relative z-10 truncate">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}

/* ---------------------------------------------------------------------
   StageLinkRow
--------------------------------------------------------------------- */

export function StageLinkRow({
  label,
  onClick,
}: {
  label: string
  onClick?: () => void
}) {
  const theme = useStageTheme()
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold transition-colors',
        theme === 'dark' ? 'text-indigo-300 hover:text-white' : 'text-teal-700 hover:text-teal-900'
      )}
    >
      {label}
      <ChevronRight
        size={14}
        className="transition-transform duration-200 group-hover:translate-x-1"
      />
    </button>
  )
}

/* ---------------------------------------------------------------------
   Charts — neon glass editions
--------------------------------------------------------------------- */

function ChartTooltipBox({ active, payload, label }: {
  active?: boolean
  payload?: { name?: string; value?: number | string; color?: string }[]
  label?: string | number
}) {
  const dark = useStageTheme() === 'dark'
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-2xl border px-4 py-3 text-xs shadow-2xl"
      style={{
        backgroundColor: dark ? 'rgba(10, 15, 36, 0.88)' : 'rgba(255, 255, 255, 0.92)',
        borderColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(13,148,136,0.18)',
        backdropFilter: 'blur(14px)',
      }}
    >
      {label !== undefined && (
        <p className={dark ? 'mb-1.5 font-bold text-white' : 'mb-1.5 font-bold text-slate-900'}>{label}</p>
      )}
      <div className="space-y-1">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor: entry.color || '#8B7CFF',
                boxShadow: `0 0 8px ${entry.color || '#8B7CFF'}`,
              }}
            />
            <span className={dark ? 'text-slate-400' : 'text-slate-500'}>{entry.name}</span>
            <span className="ml-auto pl-4 font-bold tabular-nums text-white">
              {typeof entry.value === 'number'
                ? entry.value.toLocaleString('fr-FR')
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export interface StageSeries {
  dataKey: string
  name?: string
  hue: StageHue
}

export function StageAreaChart({
  data,
  series,
  height = 260,
}: {
  data: Record<string, string | number>[]
  series: StageSeries[]
  height?: number
}) {
  return (
    <div
      className="stage-chart-glow relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.06] via-transparent to-black/[0.08] px-1"
      style={{ height, perspective: '1200px' }}
    >
      <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <div className="h-full [transform:rotateX(2deg)]">
        <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 8, left: -16, bottom: 0 }}>
          <defs>
            {series.map(s => (
              <linearGradient key={s.dataKey} id={`area-${s.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.hue.line} stopOpacity="0.42" />
                <stop offset="70%" stopColor={s.hue.line} stopOpacity="0.06" />
                <stop offset="100%" stopColor={s.hue.line} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            dy={6}
          />
          <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
          <Tooltip
            content={<ChartTooltipBox />}
            cursor={{ stroke: 'rgba(124,92,255,0.35)', strokeDasharray: '3 4' }}
          />
          {series.map(s => (
            <Area
              key={s.dataKey}
              type="monotone"
              dataKey={s.dataKey}
              name={s.name || s.dataKey}
              stroke={s.hue.line}
              strokeWidth={2.75}
              fill={`url(#area-${s.dataKey})`}
              animationDuration={1200}
              dot={false}
              activeDot={{
                r: 5,
                fill: '#fff',
                stroke: s.hue.line,
                strokeWidth: 3,
              }}
            />
          ))}
        </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function StageBarChart({
  data,
  series,
  height = 220,
}: {
  data: Record<string, string | number>[]
  series: StageSeries[]
  height?: number
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.06] via-transparent to-black/[0.08] px-1"
      style={{ height, perspective: '1200px' }}
    >
      <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      <div className="h-full [transform:rotateX(4deg)]">
        <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 8, left: -16, bottom: 0 }} barCategoryGap="28%">
          <defs>
            {series.map(s => (
              <linearGradient key={s.dataKey} id={`bar-${s.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.hue.a} stopOpacity="0.95" />
                <stop offset="100%" stopColor={s.hue.b} stopOpacity="0.55" />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} dy={6} />
          <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
          <Tooltip content={<ChartTooltipBox />} cursor={{ fill: 'rgba(15,23,42,0.04)' }} />
          {series.map(s => (
            <Bar
              key={s.dataKey}
              dataKey={s.dataKey}
              name={s.name || s.dataKey}
              fill={`url(#bar-${s.dataKey})`}
              radius={[6, 6, 0, 0]}
              maxBarSize={16}
              animationDuration={1000}
            />
          ))}
        </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function StageGauge({
  data,
  centerValue,
  centerLabel,
  height = 230,
}: {
  data: { name: string; value: number; hue: StageHue }[]
  centerValue?: string
  centerLabel?: string
  height?: number
}) {
  const theme = useStageTheme()
  const dark = theme === 'dark'
  const total = data.reduce((sum, d) => sum + d.value, 0)
  return (
    <div
      className="relative mx-auto"
      style={{
        height,
        maxWidth: height * 1.4,
        filter: dark
          ? 'drop-shadow(0 0 44px rgba(124,92,255,0.30))'
          : 'drop-shadow(0 0 40px rgba(13,148,136,0.30))',
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={<ChartTooltipBox />} />
          {/* track */}
          <Pie
            data={[{ value: 100 }]}
            dataKey="value"
            innerRadius="70%"
            outerRadius="93%"
            cornerRadius={0}
            strokeWidth={0}
            isAnimationActive={false}
          >
            <Cell fill={dark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.07)'} />
          </Pie>
          {/* segments */}
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="70%"
            outerRadius="93%"
            paddingAngle={2.5}
            cornerRadius={14}
            strokeWidth={0}
            animationDuration={1100}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.hue.line} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {(centerValue || centerLabel) && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className="flex h-[52%] w-[52%] flex-col items-center justify-center rounded-full border text-center"
            style={{
              borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(13,148,136,0.18)',
              backgroundColor: dark ? 'rgba(10,15,36,0.72)' : 'rgba(255,255,255,0.75)',
              backdropFilter: 'blur(10px)',
              boxShadow: dark ? 'inset 0 1px 0 rgba(255,255,255,0.08)' : 'inset 0 1px 0 rgba(255,255,255,0.9)',
            }}
          >
            <span className={`text-2xl font-extrabold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>{centerValue || total}</span>
            {centerLabel && (
              <span className={`mt-0.5 text-[9px] font-semibold uppercase tracking-[1.5px] ${dark ? 'text-slate-400' : 'text-teal-900/60'}`}>
                {centerLabel}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------------------------------------------------------------------
   ShimmerProgress — glowing bar with light sweep
--------------------------------------------------------------------- */

export function ShimmerProgress({
  pct,
  colorFrom,
  colorTo,
  glow,
  height = 8,
  intense = false,
}: {
  pct: number
  colorFrom: string
  colorTo: string
  glow: string
  height?: number
  intense?: boolean
}) {
  const theme = useStageTheme()
  return (
    <div
      className="w-full overflow-hidden rounded-full"
      style={{
        height,
        backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.08)',
        boxShadow: intense ? 'inset 0 2px 5px rgba(0,0,0,0.55), inset 0 -1px 0 rgba(255,255,255,0.06)' : undefined,
      }}
    >
      <motion.div
        className="shimmer-bar relative h-full rounded-full"
        style={{
          width: `${pct}%`,
          backgroundImage: intense
            ? `linear-gradient(180deg, rgba(255,255,255,0.32), rgba(255,255,255,0) 46%), linear-gradient(90deg, ${colorTo}, ${colorFrom})`
            : `linear-gradient(90deg, ${colorTo}, ${colorFrom})`,
          boxShadow: intense
            ? `0 0 10px ${glow}, 0 0 22px ${glow}, 0 4px 12px ${glow}, inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -3px 6px rgba(0,0,0,0.35)`
            : `0 0 14px ${glow}, inset 0 1px 0 rgba(255,255,255,0.35)`,
        }}
        initial={{ width: 0 }}
        whileInView={{ width: `${pct}%` }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="shimmer-sweep" />
      </motion.div>
    </div>
  )
}

/* ---------------------------------------------------------------------
   StageDonut3D — extruded pseudo-3D donut
   Depth = stack of darkened pie layers under a glossy beveled top face,
   tilted with perspective. Center label floats as a glass lens.
--------------------------------------------------------------------- */

function shadeHex(hex: string, f: number): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const ch = (shift: number) => {
    const v = Math.round(((n >> shift) & 255) * f)
    return Math.min(255, Math.max(0, v))
  }
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`
}

export function StageDonut3D({
  slices,
  centerValue,
  centerLabel,
  size = 260,
  thickness = 22,
  tilt = 52,
}: {
  slices: { name: string; value: number; hue: StageHue }[]
  centerValue?: string
  centerLabel?: string
  size?: number
  thickness?: number
  tilt?: number
}) {
  const theme = useStageTheme()
  const dark = theme === 'dark'
  const uid = useId().replace(/:/g, '')
  const total = slices.reduce((sum, s) => sum + s.value, 0)
  const step = 3
  const layers = Math.max(3, Math.ceil(thickness / step))
  /* True projected height so nothing overflows onto content below */
  const boxH = Math.round(size * Math.cos((tilt * Math.PI) / 180)) + thickness + 30

  return (
    <div
      className="group relative mx-auto cursor-default select-none"
      style={{ width: size, height: boxH }}
    >
      {/* grounded shadow — breathes inversely to the float */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-1/2 -translate-x-1/2"
        style={{ width: size * 0.84, height: size * 0.16 }}
      >
        <div
          className="stage-donut-breathe h-full w-full rounded-[50%]"
          style={{
            background: dark
              ? 'radial-gradient(ellipse at center, rgba(0,0,0,0.55), transparent 68%)'
              : 'radial-gradient(ellipse at center, rgba(13,148,136,0.32), transparent 68%)',
            filter: 'blur(7px)',
          }}
        />
      </div>

      {/* levitating donut */}
      <motion.div
        initial={{ opacity: 0, scale: 0.82, y: 36 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 130, damping: 16 }}
        className="absolute inset-x-0 top-0 z-10"
        style={{ height: boxH - 8 }}
      >
        <div className="h-full w-full transition-transform duration-300 ease-out group-hover:scale-[1.045]">
          <div className="stage-donut-float relative h-full w-full">
            {/* glass lens rides along with the donut */}
            {(centerValue || centerLabel) && (
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border text-center"
                style={{
                  width: size * 0.46,
                  height: size * 0.42,
                  borderColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(13,148,136,0.20)',
                  backgroundColor: dark ? 'rgba(10,15,36,0.72)' : 'rgba(255,255,255,0.78)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: dark
                    ? 'inset 0 1px 0 rgba(255,255,255,0.10), 0 14px 30px -14px rgba(0,0,0,0.6)'
                    : 'inset 0 1px 0 rgba(255,255,255,0.95), 0 14px 30px -16px rgba(13,148,136,0.5)',
                }}
              >
                <span className={`text-2xl font-extrabold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>
                  {centerValue || total}
                </span>
                {centerLabel && (
                  <span className={`mt-0.5 px-2 text-[9px] font-semibold uppercase tracking-[1.5px] ${dark ? 'text-slate-400' : 'text-teal-900/60'}`}>
                    {centerLabel}
                  </span>
                )}
              </div>
            )}

            <div
              className="flex h-full w-full items-center justify-center"
              style={{ perspective: '900px', pointerEvents: 'none' }}
            >
              <div
                className="relative"
                style={{ width: size, height: size, transform: `rotateX(${tilt}deg)` }}
              >
                {/* extrusion — fades in just after the top face starts sweeping */}
                <motion.div
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.18 }}
                >
                  {Array.from({ length: layers }).map((_, i) => {
                    const f = 0.45 + (i / layers) * 0.5
                    return (
                      <div
                        key={i}
                        className="absolute inset-0"
                        style={{ transform: `translateY(${thickness - i * step}px)` }}
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={slices}
                              dataKey="value"
                              nameKey="name"
                              innerRadius="60%"
                              outerRadius="90%"
                              paddingAngle={2.5}
                              cornerRadius={12}
                              strokeWidth={0}
                              isAnimationActive={false}
                            >
                              {slices.map((s, j) => (
                                <Cell key={j} fill={shadeHex(s.hue.b, f)} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )
                  })}
                </motion.div>

                {/* glossy top face */}
                <div className="absolute inset-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        {slices.map((s, j) => (
                          <linearGradient key={j} id={`donut-${uid}-${j}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={shadeHex(s.hue.a, 1.4)} />
                            <stop offset="55%" stopColor={s.hue.line} />
                            <stop offset="100%" stopColor={s.hue.b} />
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie
                        data={slices}
                        dataKey="value"
                        nameKey="name"
                        innerRadius="60%"
                        outerRadius="90%"
                        paddingAngle={2.5}
                        cornerRadius={12}
                        strokeWidth={1}
                        stroke={dark ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.55)'}
                        isAnimationActive
                        animationDuration={1100}
                      >
                        {slices.map((s, j) => (
                          <Cell key={j} fill={`url(#donut-${uid}-${j})`} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* slow rotating sheen sweeping across the ring */}
                <div className="stage-donut-sheen" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
