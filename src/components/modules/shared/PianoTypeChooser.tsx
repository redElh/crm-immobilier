import { useEffect, type ComponentType, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X } from 'react-feather'
import { AnimatedNumber, OrbIcon, useStageTheme, type StageHue } from '../../dashboard/Stage'

/* =====================================================================
   PianoTypeChooser — premium "piano keys" type picker, shared by every
   "Nouveau …" flow (clients, biens, …).

   Renders through a portal on document.body (so the whole page sits
   behind a single blur layer). The keyboard shares one 3D perspective:
   keys rest tilted back, rise straight toward the viewer on hover and
   press down on tap. Each key is a two-plane 3D body — a glass top face
   (identity + stats + felt gauge) over an extruded hue-lit front edge —
   then they rise one after another like piano notes.

   Two skins share one structure: `agent` (teal/violet, the agent shell)
   and `admin` (orange/rose, the admin/gérant shell). Callers pass only
   their key set, header copy and stat labels — no layout is duplicated.
   ===================================================================== */

export interface PianoChooserKey {
  type: string
  title: string
  description: string
  icon: ComponentType<{ size?: number | string; className?: string }>
  hue: StageHue
}

export interface PianoChooserStat {
  total: number
  actifs: number
  enNegociation: number
}

type PianoVariant = 'agent' | 'admin'
type ThemeMode = 'dark' | 'light'

interface PianoTheme {
  sub: Record<ThemeMode, string>
  labelDim: Record<ThemeMode, string>
  hairline: Record<ThemeMode, string>
  barTrack: Record<ThemeMode, string>
  eyebrow: Record<ThemeMode, CSSProperties>
  face: Record<ThemeMode, CSSProperties>
  backdrop: Record<ThemeMode, string>
  close: Record<ThemeMode, string>
  titleGradient: Record<ThemeMode, string>
  focusRing: string
  edgeTop: Record<ThemeMode, string>
  edgeShadow: Record<ThemeMode, string>
}

const DARK_FACE: CSSProperties = {
  background: 'linear-gradient(180deg, rgba(148,163,184,0.10), rgba(148,163,184,0.035))',
  border: '1px solid rgba(255,255,255,0.07)',
  borderBottom: 'none',
  borderRadius: '16px 16px 0 0',
}

const DARK_EDGE_TOP = '1px solid rgba(0,0,0,0.35)'
const DARK_EDGE_SHADOW = 'rgba(2,4,18,0.85)'
const CLOSE_DARK = 'border-white/10 bg-white/[0.06] text-slate-300 hover:bg-white/10 hover:text-white'

const PIANO_THEME: Record<PianoVariant, PianoTheme> = {
  agent: {
    sub: { dark: 'rgba(148,163,184,0.8)', light: 'rgba(51,65,85,0.65)' },
    labelDim: { dark: 'rgba(148,163,184,0.7)', light: 'rgba(51,65,85,0.5)' },
    hairline: {
      dark: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.13), transparent)',
      light: 'linear-gradient(90deg, transparent, rgba(13,148,136,0.16), transparent)',
    },
    barTrack: { dark: 'rgba(255,255,255,0.06)', light: 'rgba(13,148,136,0.08)' },
    eyebrow: {
      dark: { color: '#C7CBFF', borderColor: 'rgba(139,124,255,0.28)', background: 'rgba(124,92,255,0.1)' },
      light: { color: '#0D9488', borderColor: 'rgba(13,148,136,0.22)', background: 'rgba(45,212,191,0.1)' },
    },
    face: {
      dark: DARK_FACE,
      light: {
        background: 'linear-gradient(180deg, rgba(255,255,255,0.68), rgba(255,255,255,0.44))',
        border: '1px solid rgba(255,255,255,0.6)',
        borderBottom: 'none',
        borderRadius: '16px 16px 0 0',
      },
    },
    backdrop: { dark: 'rgba(4,6,18,0.58)', light: 'rgba(214,236,232,0.5)' },
    close: { dark: CLOSE_DARK, light: 'border-teal-900/10 bg-white/80 text-teal-900/60 hover:bg-white hover:text-teal-900' },
    titleGradient: { dark: 'from-white via-indigo-100 to-indigo-300', light: 'from-teal-900 via-teal-700 to-emerald-600' },
    focusRing: 'focus-visible:ring-emerald-300/60',
    edgeTop: { dark: DARK_EDGE_TOP, light: '1px solid rgba(13,148,136,0.14)' },
    edgeShadow: { dark: DARK_EDGE_SHADOW, light: 'rgba(13,148,136,0.4)' },
  },
  admin: {
    sub: { dark: 'rgba(148,163,184,0.8)', light: 'rgba(70,40,20,0.6)' },
    labelDim: { dark: 'rgba(148,163,184,0.7)', light: 'rgba(70,40,20,0.5)' },
    hairline: {
      dark: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.13), transparent)',
      light: 'linear-gradient(90deg, transparent, rgba(249,115,22,0.14), transparent)',
    },
    barTrack: { dark: 'rgba(255,255,255,0.06)', light: 'rgba(249,115,22,0.08)' },
    eyebrow: {
      dark: { color: '#FB7185', borderColor: 'rgba(244,63,94,0.28)', background: 'rgba(244,63,94,0.1)' },
      light: { color: '#C2410C', borderColor: 'rgba(249,115,22,0.22)', background: 'rgba(249,115,22,0.1)' },
    },
    face: {
      dark: DARK_FACE,
      light: {
        background: 'linear-gradient(180deg, rgba(255,255,255,0.72), rgba(255,255,255,0.48))',
        border: '1px solid rgba(255,255,255,0.62)',
        borderBottom: 'none',
        borderRadius: '16px 16px 0 0',
      },
    },
    backdrop: { dark: 'rgba(13,10,24,0.62)', light: 'rgba(253,243,234,0.55)' },
    close: { dark: CLOSE_DARK, light: 'border-orange-900/10 bg-white/80 text-orange-900/60 hover:bg-white hover:text-orange-900' },
    titleGradient: { dark: 'from-white via-rose-200 to-rose-400', light: 'from-orange-900 via-orange-700 to-amber-600' },
    focusRing: 'focus-visible:ring-orange-300/60',
    edgeTop: { dark: DARK_EDGE_TOP, light: '1px solid rgba(249,115,22,0.14)' },
    edgeShadow: { dark: DARK_EDGE_SHADOW, light: 'rgba(249,115,22,0.3)' },
  },
}

interface PianoTypeChooserProps {
  variant: PianoVariant
  eyebrow: string
  title: string
  subtitle: string
  ariaLabel: string
  keys: PianoChooserKey[]
  stats?: Record<string, PianoChooserStat>
  statLabels?: [string, string, string]
  onClose: () => void
  onSelect: (type: string) => void
}

export function PianoTypeChooser({
  variant,
  eyebrow,
  title,
  subtitle,
  ariaLabel,
  keys,
  stats,
  statLabels = ['total', 'actifs', 'négo'],
  onClose,
  onSelect,
}: PianoTypeChooserProps) {
  const isDark = useStageTheme() === 'dark'
  const theme = PIANO_THEME[variant]
  const mode: ThemeMode = isDark ? 'dark' : 'light'

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  const sub = theme.sub[mode]
  const labelDim = theme.labelDim[mode]
  const hairline = theme.hairline[mode]
  const barTrack = theme.barTrack[mode]
  const eyebrowStyle = theme.eyebrow[mode]
  const faceStyle = theme.face[mode]

  return createPortal(
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      className="fixed inset-0 z-[10050] overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Full-page blur backdrop */}
      <div
        className="fixed inset-0 backdrop-blur-xl"
        style={{ background: theme.backdrop[mode] }}
        onClick={onClose}
      />

      {/* Close */}
      <motion.button
        type="button"
        onClick={onClose}
        aria-label="Fermer"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 400, damping: 26 }}
        className={`fixed right-5 top-5 z-20 flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-md transition-all hover:scale-105 active:scale-95 ${theme.close[mode]}`}
      >
        <X size={18} />
      </motion.button>

      {/* Centered content (scrolls when taller than the viewport) */}
      <div className="relative z-10 flex min-h-full items-center justify-center p-4 sm:p-8">
        <motion.div
          className="relative flex w-full max-w-5xl flex-col items-center"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        >
          {/* Header */}
          <div className="mb-8 flex flex-col items-center text-center">
            <motion.span
              className="inline-flex items-center rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] backdrop-blur-md"
              style={eyebrowStyle}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              {eyebrow}
            </motion.span>
            <motion.h2
              className={`mt-3 pb-1.5 text-[26px] font-extrabold leading-[1.25] tracking-tight sm:text-[34px] bg-gradient-to-r bg-clip-text text-transparent ${theme.titleGradient[mode]}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              {title}
            </motion.h2>
            <motion.p
              className="mt-2.5 max-w-lg text-[15px]"
              style={{ color: sub }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.18, duration: 0.5 }}
            >
              {subtitle}
            </motion.p>
          </div>

          {/* Piano keys — one shared 3D stage, rising one after another */}
          <div
            className="flex w-full max-w-[520px] flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 lg:max-w-none"
            style={{ perspective: '1400px', perspectiveOrigin: '50% 35%' }}
          >
            {keys.map((key, i) => {
              const Icon = key.icon
              const s = stats?.[key.type] ?? { total: 0, actifs: 0, enNegociation: 0 }
              const delay = 0.16 + i * 0.075
              const ratio = s.total ? Math.max(10, Math.round((s.actifs / s.total) * 100)) : 0

              /* Extruded front edge — the key's thickness, lit by its hue */
              const edgeStyle: CSSProperties = isDark
                ? {
                    background: `linear-gradient(180deg, ${key.hue.a}2E, rgba(2,4,18,0.72))`,
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderTop: theme.edgeTop.dark,
                    borderRadius: '0 0 16px 16px',
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 20px 36px -18px ${key.hue.glow}, 0 34px 54px -34px ${theme.edgeShadow.dark}`,
                  }
                : {
                    background: `linear-gradient(180deg, ${key.hue.a}26, ${key.hue.b}44)`,
                    border: '1px solid rgba(255,255,255,0.65)',
                    borderTop: theme.edgeTop.light,
                    borderRadius: '0 0 16px 16px',
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.5), 0 20px 36px -18px ${key.hue.glow}, 0 30px 50px -34px ${theme.edgeShadow.light}`,
                  }

              return (
                <motion.button
                  key={key.type}
                  type="button"
                  onClick={() => onSelect(key.type)}
                  initial={{ opacity: 0, y: 64, rotateX: 38, z: -90 }}
                  animate={{ opacity: 1, y: 0, rotateX: 12, z: 0 }}
                  transition={{
                    default: { type: 'spring', stiffness: 190, damping: 24, mass: 0.95, delay },
                    opacity: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] },
                  }}
                  whileHover={{ rotateX: 4, y: -8, z: 30, scale: 1.02, transition: { type: 'spring', stiffness: 260, damping: 22, mass: 0.7 } }}
                  whileFocus={{ rotateX: 4, y: -8, z: 30, scale: 1.02, transition: { type: 'spring', stiffness: 260, damping: 22, mass: 0.7 } }}
                  whileTap={{ rotateX: 19, y: 4, z: 4, scale: 0.99, scaleY: 0.96, transition: { type: 'spring', stiffness: 520, damping: 32 } }}
                  style={{ transformOrigin: '50% 100%', transformStyle: 'preserve-3d' }}
                  className={`group relative flex h-[244px] w-[118px] shrink-0 flex-col rounded-2xl text-center focus:outline-none focus-visible:ring-2 ${theme.focusRing} sm:h-[278px] sm:w-[154px] lg:h-[284px] lg:w-[170px]`}
                >
                  {/* Top face — glass surface */}
                  <div
                    className="relative flex h-[calc(100%_-_15px)] w-full flex-col items-center overflow-hidden rounded-t-2xl"
                    style={faceStyle}
                  >
                    {/* soft top bloom on hover */}
                    <span
                      className="pointer-events-none absolute -top-14 h-36 w-36 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-50"
                      style={{ background: key.hue.glow }}
                    />
                    {/* hue wash rising from the felt */}
                    <span
                      className="pointer-events-none absolute inset-0 opacity-60 transition-opacity duration-500 group-hover:opacity-100"
                      style={{ background: `radial-gradient(130% 50% at 50% 104%, ${key.hue.a}22, transparent 72%)` }}
                    />
                    {/* hover ring + bloom */}
                    <span
                      className="pointer-events-none absolute inset-0 rounded-t-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                      style={{ boxShadow: `inset 0 0 0 1px ${key.hue.a}38` }}
                    />

                    {/* Identity zone */}
                    <div className="relative flex w-full flex-col items-center px-3 pt-5">
                      <OrbIcon icon={Icon} hue={key.hue} size={46} radius={15} />
                      <h3 className={`mt-3.5 text-sm font-bold tracking-tight sm:text-[15px] ${isDark ? 'text-white' : 'text-slate-950'}`}>{key.title}</h3>
                      <p className="mt-1.5 line-clamp-2 text-[10.5px] leading-relaxed sm:line-clamp-3 sm:text-[11.5px]" style={{ color: sub }}>
                        {key.description}
                      </p>
                    </div>

                    {/* Stats + felt */}
                    <div className="relative mt-auto w-full">
                      <div className="h-px w-full" style={{ background: hairline }} />
                      <div className="grid grid-cols-2 gap-x-1 px-2 pt-2.5 sm:grid-cols-3">
                        <div className="flex flex-col items-center gap-0.5">
                          <AnimatedNumber value={s.total} className={`text-base font-extrabold leading-none tracking-tight sm:text-[20px] ${isDark ? 'text-white' : 'text-slate-950'}`} />
                          <span className="text-[9px] font-semibold uppercase tracking-[0.14em]" style={{ color: labelDim }}>{statLabels[0]}</span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                          <AnimatedNumber value={s.actifs} className={`text-base font-extrabold leading-none tracking-tight sm:text-[20px] ${isDark ? 'text-white' : 'text-slate-950'}`} />
                          <span className="text-[9px] font-semibold uppercase tracking-[0.14em]" style={{ color: labelDim }}>{statLabels[1]}</span>
                        </div>
                        <div className="hidden flex-col items-center gap-0.5 sm:flex">
                          <AnimatedNumber value={s.enNegociation} className={`text-base font-extrabold leading-none tracking-tight sm:text-[20px] ${isDark ? 'text-white' : 'text-slate-950'}`} />
                          <span className="text-[9px] font-semibold uppercase tracking-[0.14em]" style={{ color: labelDim }}>{statLabels[2]}</span>
                        </div>
                      </div>
                      {/* Full-bleed felt gauge */}
                      <div className="relative mt-2.5 h-[7px] w-full" style={{ background: barTrack }}>
                        <motion.span
                          className="absolute inset-y-0 left-0 rounded-r-full opacity-90 transition-opacity duration-300 group-hover:opacity-100"
                          style={{ backgroundImage: `linear-gradient(90deg, ${key.hue.a}, ${key.hue.b})`, boxShadow: `0 0 12px ${key.hue.glow}` }}
                          initial={{ width: 0 }}
                          animate={{ width: `${ratio}%` }}
                          transition={{ duration: 1, delay: 0.55 + i * 0.075, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Extruded front edge — 3D thickness */}
                  <div
                    className="relative h-[15px] w-full shrink-0 transition-[filter] duration-500 group-hover:brightness-125"
                    style={edgeStyle}
                  />
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      </div>
    </motion.div>,
    document.body
  )
}
