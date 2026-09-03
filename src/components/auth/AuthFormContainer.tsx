import { CSSProperties, ReactNode, useRef, useMemo, useEffect, memo } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { Shield, Home, Layers, Star, ArrowRight, Zap } from 'react-feather'

interface AuthFormContainerProps {
  title: string
  subtitle: string
  children: ReactNode
  backgroundImage?: string
}

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

// ——— FULL-PAGE PREMIUM 3D CITY — self-animated + cursor parallax ———
const BackgroundCity = memo(function BackgroundCity({ isAdmin, mx, my }: { isAdmin: boolean; mx: any; my: any }) {
  const primary = isAdmin ? '#8B7CFF' : '#14B8A6'
  const secondary = isAdmin ? '#F472B6' : '#22D3EE'
  const tertiary = isAdmin ? '#FBBF24' : '#34D399'

  // self-driven drift — autonomous, no cursor needed
  const autoX = useMotionValue(0)
  const autoY = useMotionValue(0)
  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const loop = (now: number) => {
      const t = (now - start) / 1000
      // gentle cinematic drift — no abrupt snapping
      autoX.set(Math.sin(t * 0.11) * 14 + Math.sin(t * 0.19) * 6)
      autoY.set(Math.cos(t * 0.08) * 7 + Math.cos(t * 0.15) * 3)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [autoX, autoY])

  // densified, edge-to-edge skyline — generated to guarantee 100% fill on every viewport
  const buildings = useMemo(() => {
    const out: { x: number; w: number; h: number; hue: string }[] = []
    let x = -20
    let i = 0
    const hues = [primary, secondary, tertiary]
    while (x < 1960) {
      const w = 62 + ((i * 37) % 58) // 62..120 deterministic
      const h = 138 + ((i * 53) % 150) // 138..288
      out.push({ x, w, h, hue: hues[i % 3] })
      x += w + 6
      i++
    }
    return out
  }, [primary, secondary, tertiary])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* ——— SKY — stars + nebula ——— */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(900px 520px at 18% 14%, ${primary}14, transparent 68%), radial-gradient(820px 460px at 82% 18%, ${secondary}10, transparent 68%), radial-gradient(700px 420px at 50% 4%, ${tertiary}08, transparent 70%)`,
        } as CSSProperties}
      />
      <div
        className="absolute inset-0 opacity-[0.38]"
        style={{
          backgroundImage:
            'radial-gradient(1.4px 1.4px at 8% 16%, rgba(255,255,255,0.95) 0, transparent 100%), radial-gradient(1px 1px at 18% 28%, rgba(255,255,255,0.5) 0, transparent 100%), radial-gradient(1.2px 1.2px at 24% 10%, rgba(255,255,255,0.7) 0, transparent 100%), radial-gradient(1px 1px at 34% 34%, rgba(255,255,255,0.42) 0, transparent 100%), radial-gradient(1.3px 1.3px at 44% 14%, rgba(255,255,255,0.62) 0, transparent 100%), radial-gradient(1px 1px at 54% 26%, rgba(255,255,255,0.48) 0, transparent 100%), radial-gradient(1.5px 1.5px at 66% 12%, rgba(255,255,255,0.85) 0, transparent 100%), radial-gradient(1px 1px at 74% 30%, rgba(255,255,255,0.44) 0, transparent 100%), radial-gradient(1.2px 1.2px at 84% 18%, rgba(255,255,255,0.72) 0, transparent 100%), radial-gradient(1px 1px at 92% 26%, rgba(255,255,255,0.4) 0, transparent 100%), radial-gradient(1px 1px at 52% 48%, rgba(255,255,255,0.32) 0, transparent 100%)',
        } as CSSProperties}
      />

      {/* volumetric god-rays — full bleed, fan from behind hero tower */}
      <div
        className="absolute bottom-0 left-1/2 h-[88%] w-[160%] -translate-x-1/2"
        style={{
          background: `conic-gradient(from 180deg at 50% 100%, transparent 10%, ${primary}17 24%, ${secondary}11 34%, transparent 48%, ${tertiary}0c 58%, transparent 72%, ${primary}0f 80%, transparent 90%)`,
          filter: 'blur(18px)',
        } as CSSProperties}
      />

      {/* perspective grid floor — tron horizon */}
      <div
        className="absolute bottom-0 inset-x-0 h-[46%] opacity-[0.22]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)`,
          backgroundSize: '72px 72px',
          transform: 'perspective(520px) rotateX(62deg)',
          transformOrigin: 'center bottom',
          maskImage: 'linear-gradient(to top, black 28%, transparent 88%)',
        } as CSSProperties}
      />
      <div
        className="absolute bottom-0 inset-x-0 h-[46%] opacity-[0.14]"
        style={{
          backgroundImage: `linear-gradient(${primary}26 1px, transparent 1px), linear-gradient(90deg, ${primary}18 1px, transparent 1px)`,
          backgroundSize: '72px 72px',
          transform: 'perspective(520px) rotateX(62deg)',
          transformOrigin: 'center bottom',
          maskImage: 'linear-gradient(to top, black 18%, transparent 78%)',
        } as CSSProperties}
      />

      {/* horizon super-glow — seals city to sky */}
      <div
        className="absolute bottom-0 inset-x-0 h-[54%]"
        style={{
          background: `radial-gradient(1100px 360px at 50% 100%, ${primary}24, transparent 74%), radial-gradient(900px 300px at 24% 100%, ${secondary}12, transparent 74%), radial-gradient(900px 300px at 78% 100%, ${tertiary}10, transparent 74%), linear-gradient(to top, rgba(5,10,26,0.88) 0%, rgba(5,10,26,0.42) 30%, transparent 68%)`,
        } as CSSProperties}
      />

      {/* ——— SELF-ANIMATED PARALLAX WRAPPER — cursor + autonomous drift ——— */}
      <motion.div className="absolute inset-0 pointer-events-none" style={{ x: autoX, y: autoY } as any}>
        {/* orbital halos — huge, centered, premium */}
        <motion.div
          className="absolute left-1/2 top-[50%] h-[1100px] w-[1100px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.03]"
          style={{ x: mx, y: my } as any}
          animate={{ rotate: 360 }}
          transition={{ duration: 140, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute left-1/2 top-[50%] h-[820px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            x: mx,
            y: my,
            background: `conic-gradient(from 0deg, transparent 0deg, ${primary}12 68deg, transparent 138deg, ${secondary}0e 208deg, transparent 278deg, ${tertiary}0c 328deg, transparent 360deg)`,
          } as any}
          animate={{ rotate: -360 }}
          transition={{ duration: 95, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute left-1/2 top-[50%] h-[1320px] w-[1320px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.018]"
          style={{ x: mx, y: my } as any}
          animate={{ rotate: 360 }}
          transition={{ duration: 180, repeat: Infinity, ease: 'linear' }}
        />

        {/* floating bokeh — depth */}
        <motion.div
          className="absolute left-[14%] top-[20%] h-[260px] w-[260px] rounded-full blur-[48px] pointer-events-none"
          style={{ background: `radial-gradient(circle at 32% 32%, ${primary}1c, ${primary}08 44%, transparent 72%)`, x: mx, y: my } as any}
          animate={{ scale: [1, 1.07, 1], opacity: [0.32, 0.52, 0.32] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute right-[12%] top-[18%] h-[220px] w-[220px] rounded-full blur-[42px] pointer-events-none"
          style={{ background: `radial-gradient(circle at 32% 32%, ${secondary}16, transparent 68%)`, x: mx, y: my } as any}
          animate={{ scale: [1, 1.1, 1], opacity: [0.26, 0.46, 0.26] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 1.4 }}
        />
        {/* lens flare */}
        <div
          className="absolute left-1/2 top-[44%] h-[1px] w-[70%] -translate-x-1/2 opacity-[0.28]"
          style={{ background: `linear-gradient(90deg, transparent, ${primary}95, #fff, ${secondary}95, transparent)`, filter: 'blur(1px)' } as CSSProperties}
        />

        {/* ——— FAR MOUNTAINS HAZE ——— */}
        <div
          className="absolute bottom-[33%] inset-x-0 h-[120px] opacity-[0.18]"
          style={{
            background: `linear-gradient(to top, ${primary}14, transparent), url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 120'%3E%3Cpath d='M0 90 L160 42 L320 78 L480 28 L640 66 L760 18 L920 58 L1080 32 L1220 72 L1360 38 L1440 58 L1440 90 Z' fill='%23ffffff' fill-opacity='0.06'/%3E%3C/svg%3E")`,
            backgroundSize: '1440px 120px',
            filter: 'blur(0.6px)',
          } as CSSProperties}
        />

        {/* ——— CITY — two full-bleed layers, guaranteed cover ——— */}
        {/* far haze city */}
        <motion.div className="absolute bottom-[-1%] inset-x-0 opacity-[0.30]" style={{ x: mx, y: my, filter: 'blur(1.4px)' } as any}>
        <svg viewBox="0 0 1920 300" className="h-[280px] w-full lg:h-[340px]" preserveAspectRatio="xMidYMax slice" style={{ width: '100%' }}>
          {buildings.map((b, i) => {
            const top = 300 - b.h * 0.9
            return (
              <g key={`far-${i}`} opacity={0.92}>
                <rect x={b.x} y={top} width={b.w} height={b.h * 0.9} rx="8" fill="rgba(255,255,255,0.032)" stroke="rgba(255,255,255,0.045)" strokeWidth="1" />
                {Array.from({ length: 3 }).map((_, col) =>
                  Array.from({ length: Math.floor((b.h * 0.9) / 36) }).map((__, row) => {
                    const wx = b.x + 11 + col * 15
                    const wy = top + 13 + row * 17
                    if (wx + 7 > b.x + b.w - 10) return null
                    const lit = (col * 5 + row * 7 + i) % 4 === 0
                    return <rect key={`${col}-${row}`} x={wx} y={wy} width="6.5" height="6.5" rx="1" fill={lit ? 'rgba(255,233,168,0.42)' : 'rgba(255,255,255,0.05)'} />
                  }),
                )}
              </g>
            )
          })}
        </svg>
      </motion.div>

      {/* main premium city — isometric 3D with side faces */}
      <motion.div className="absolute bottom-0 inset-x-0" style={{ x: mx, y: my } as any}>
        <svg viewBox="0 0 1920 360" className="h-[340px] w-full lg:h-[410px]" preserveAspectRatio="xMidYMax slice" style={{ width: '100%' }}>
          <defs>
            <linearGradient id="cityFade2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={primary} stopOpacity="0" />
              <stop offset="60%" stopColor={primary} stopOpacity="0.08" />
              <stop offset="100%" stopColor={primary} stopOpacity="0.18" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="1920" height="360" fill="url(#cityFade2)" opacity="0.85" />
          {buildings.map((b, i) => {
            const top = 360 - b.h - 12
            const hue = b.hue
            const isHero = i === Math.floor(buildings.length / 2) // central tower
            const hh = isHero ? b.h + 62 : b.h
            const tt = isHero ? top - 62 : top
            const sideDx = 12
            const sideDy = 10
            return (
              <g key={i}>
                {/* side face — isom depth */}
                <path
                  d={`M ${b.x + b.w} ${tt} L ${b.x + b.w + sideDx} ${tt - sideDy} L ${b.x + b.w + sideDx} ${tt + hh - sideDy} L ${b.x + b.w} ${tt + hh} Z`}
                  fill={hue}
                  opacity={isHero ? 0.16 : 0.09}
                />
                {/* top face */}
                <path
                  d={`M ${b.x} ${tt} L ${b.x + sideDx} ${tt - sideDy} L ${b.x + b.w + sideDx} ${tt - sideDy} L ${b.x + b.w} ${tt} Z`}
                  fill={hue}
                  opacity={isHero ? 0.22 : 0.11}
                />
                {/* shadow */}
                <rect x={b.x + 2} y={tt + 2} width={b.w} height={hh} rx="9" fill="rgba(0,0,0,0.44)" />
                {/* front glass */}
                <rect x={b.x} y={tt} width={b.w} height={hh} rx="9" fill="rgba(255,255,255,0.052)" stroke={hue} strokeOpacity={isHero ? 0.22 : 0.12} strokeWidth={isHero ? 1.5 : 1.2} />
                {/* top neon */}
                <rect x={b.x} y={tt} width={b.w} height="9" rx="9" fill={hue} opacity={isHero ? 0.22 : 0.12} />
                <rect x={b.x + 8} y={tt} width={b.w - 16} height="1.3" rx="1" fill={hue} opacity={isHero ? 1 : 0.8} style={{ filter: 'blur(0.4px)' } as any} />
                {/* hero crown */}
                {isHero && (
                  <g>
                    <rect x={b.x + b.w * 0.22} y={tt - 18} width={b.w * 0.56} height="18" rx="4" fill={hue} opacity="0.18" stroke={hue} strokeOpacity="0.32" />
                    <line x1={b.x + b.w / 2} y1={tt - 18} x2={b.x + b.w / 2} y2={tt - 38} stroke={hue} strokeWidth="2" opacity="0.9" />
                    <circle cx={b.x + b.w / 2} cy={tt - 42} r="4.5" fill="#FFF7C6" style={{ filter: 'drop-shadow(0 0 8px rgba(255,247,198,0.9))' } as any} />
                    <circle cx={b.x + b.w / 2} cy={tt - 42} r="10" fill={hue} opacity="0.14">
                      <animate attributeName="r" values="10;16;10" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.14;0;0.14" dur="2s" repeatCount="indefinite" />
                    </circle>
                    {/* beacon sweep */}
                    <ellipse cx={b.x + b.w / 2} cy={tt - 42} rx="28" ry="6" fill={hue} opacity="0.08">
                      <animate attributeName="opacity" values="0.08;0.02;0.08" dur="1.6s" repeatCount="indefinite" />
                    </ellipse>
                  </g>
                )}
                {/* windows — CSS-driven, no JS per-window */}
                {Array.from({ length: 3 }).map((_, col) =>
                  Array.from({ length: Math.floor(hh / 26) }).map((__, row) => {
                    const wx = b.x + 14 + col * 15
                    const wy = tt + 18 + row * 14
                    if (wx + 7 > b.x + b.w - 11) return null
                    const lit = (col * 7 + row * 11 + i * 3) % 3 !== 0
                    if (!lit) return <rect key={`${col}-${row}`} x={wx} y={wy} width="7" height="8" rx="1.2" fill="rgba(255,255,255,0.06)" opacity="0.06" />
                    return (
                      <rect
                        key={`${col}-${row}`}
                        x={wx}
                        y={wy}
                        width="7"
                        height="8"
                        rx="1.2"
                        fill={isHero ? '#FFF4B8' : '#FFE9A8'}
                        className="window-flicker"
                        style={{ animationDelay: `${(i * 0.12 + col * 0.18 + row * 0.09) % 2.4}s` } as CSSProperties}
                      />
                    )
                  }),
                )}
                {/* antenna for non-hero */}
                {!isHero && i % 4 === 1 && (
                  <g>
                    <line x1={b.x + b.w / 2} y1={tt} x2={b.x + b.w / 2} y2={tt - 14} stroke={hue} strokeWidth="1.5" opacity="0.7" />
                    <circle cx={b.x + b.w / 2} cy={tt - 16} r="2.8" fill={hue} />
                  </g>
                )}
              </g>
            )
          })}
          {/* ground neon — spans full 1920, slice guarantees edge-to-edge */}
          <rect x="0" y="352" width="1920" height="1.6" rx="1" fill={primary} opacity="0.52" />
          <rect x="0" y="354" width="1920" height="7" rx="3" fill={primary} opacity="0.07" />
        </svg>
      </motion.div>
      </motion.div>

      {/* reflection */}
      <div
        className="absolute bottom-0 inset-x-0 h-[90px] opacity-[0.11]"
        style={{
          background: `linear-gradient(to bottom, ${primary}1a, transparent)`,
          maskImage: 'linear-gradient(to bottom, black, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)',
          filter: 'blur(2px)',
          transform: 'scaleY(-1)',
        } as CSSProperties}
      />
      {/* vignette + fog — premium seal */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(122% 78% at 50% 36%, transparent 42%, rgba(5,10,26,0.66) 92%)' } as CSSProperties} />
      <div className="absolute bottom-0 inset-x-0 h-[15%] bg-gradient-to-t from-[#050A1A] via-[#050A1A]/52 to-transparent" />
    </div>
  )
})

export function AuthFormContainer({ title, subtitle, children }: AuthFormContainerProps) {
  const location = useLocation()
  const isAdmin = location.pathname.includes('/admin')
  const formRef = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  // softer, premium — no twitch, slow settle
  const rx = useSpring(useMotionValue(0), { stiffness: 65, damping: 26 })
  const ry = useSpring(useMotionValue(0), { stiffness: 65, damping: 26 })
  const bgX = useSpring(useMotionValue(0), { stiffness: 32, damping: 28 })
  const bgY = useSpring(useMotionValue(0), { stiffness: 32, damping: 28 })

  const onMouseMove = (e: React.MouseEvent) => {
    const cx = window.innerWidth / 2
    const cy = window.innerHeight / 2
    const dx = (e.clientX - cx) / window.innerWidth
    const dy = (e.clientY - cy) / window.innerHeight
    if (formRef.current) {
      const rect = formRef.current.getBoundingClientRect()
      const fcx = rect.left + rect.width / 2
      const fcy = rect.top + rect.height / 2
      // subtle tilt — premium, not spinning
      rx.set(((e.clientY - fcy) / rect.height) * -2.8)
      ry.set(((e.clientX - fcx) / rect.width) * 3.6)
    }
    // background follows cursor subtly — self drift handles the rest
    bgX.set(dx * 12)
    bgY.set(dy * 8)
    mx.set(dx * 5)
    my.set(dy * 5)
  }
  const onMouseLeave = () => {
    rx.set(0)
    ry.set(0)
    bgX.set(0)
    bgY.set(0)
    mx.set(0)
    my.set(0)
  }

  const accent = isAdmin ? '#8B7CFF' : '#14B8A6'
  const accent2 = isAdmin ? '#F472B6' : '#22D3EE'
  const gold = isAdmin ? '#FBBF24' : '#34D399'

  return (
    <div
      className={`relative h-[100dvh] h-screen w-screen overflow-hidden bg-[#050A1A] selection:bg-violet-500/30 auth-${isAdmin ? 'admin' : 'agent'}`}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ '--auth-accent': accent, '--auth-accent2': accent2 } as CSSProperties}
    >
      {/* base */}
      <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_85%_-10%,rgba(124,92,255,0.22),transparent_60%),radial-gradient(900px_500px_at_-10%_110%,rgba(34,211,238,0.13),transparent_60%),linear-gradient(160deg,#070A18_0%,#0B1022_45%,#080C1E_100%)]" />
      {/* grid — full, subtle */}
      <div
        className="absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(148,163,184,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.5) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage: 'radial-gradient(ellipse 85% 70% at 50% 0%, black 30%, transparent 78%)',
        } as CSSProperties}
      />
      {/* aurora — full-bleed */}
      <motion.div
        className="aurora-blob aurora-violet"
        style={{ width: '760px', height: '580px', top: '-14%', right: '-12%', background: `radial-gradient(circle at center, ${accent}3a, transparent 65%)` } as CSSProperties}
        animate={{ x: [0, 16, -12, 0], y: [0, -12, 8, 0], scale: [1, 1.04, 0.98, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="aurora-blob aurora-cyan"
        style={{ width: '660px', height: '540px', bottom: '-16%', left: '-14%', background: `radial-gradient(circle at center, ${accent2}28, transparent 65%)` } as CSSProperties}
        animate={{ x: [0, -18, 10, 0], y: [0, 10, -14, 0], scale: [1, 1.06, 1, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
      <motion.div
        className="absolute rounded-full blur-[90px] pointer-events-none"
        style={{ width: '560px', height: '560px', top: '28%', left: '40%', background: `radial-gradient(circle at center, ${gold}14, transparent 62%)` } as CSSProperties}
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* dust — across full viewport */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 26 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-[2px] w-[2px] rounded-full bg-white/55"
            style={{ left: `${3 + i * 3.7}%`, top: `${8 + (i % 7) * 12}%`, boxShadow: `0 0 10px ${accent}99` } as CSSProperties}
            animate={{ y: [-12, -90, -12], opacity: [0, 0.9, 0], x: [0, 8 + (i % 4) * 4, 0] }}
            transition={{ duration: 6 + (i % 3), repeat: Infinity, delay: i * 0.24, ease: 'easeInOut' }}
          />
        ))}
      </div>
      {/* grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='a'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23a)' opacity='.5'/%3E%3C/svg%3E\")",
        } as CSSProperties}
      />

      {/* 3D CITY — FULL-BLEED, EDGE-TO-EDGE */}
      <BackgroundCity isAdmin={isAdmin} mx={bgX} my={bgY} />

      {/* top brand */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-[1520px] items-center justify-between px-5 py-4 sm:px-8 lg:px-10 lg:py-5">
          <Link to="/" className="pointer-events-auto group flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/12 to-transparent" />
              <Home size={16} className="relative text-white" />
              <div className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)] animate-pulse" />
            </div>
            <div>
              <p className="text-[13px] font-extrabold tracking-tight text-white">CRM SQUARE IMMO</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">Élégance · Performance · Futur</p>
            </div>
          </Link>
          <div className="hidden items-center gap-2 sm:flex">
            <div className="rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-2 text-[11px] font-semibold tracking-wide text-white/70 backdrop-blur-xl">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse" /> Accès sécurisé
              </span>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] backdrop-blur-xl">
              <Shield size={14} className="text-white/80" />
            </div>
          </div>
        </div>
      </div>

      {/* CENTERED FORM — hero, no scroll */}
      <div className="relative z-10 flex h-[100dvh] w-full items-center justify-center overflow-hidden px-4 py-6 sm:px-6">
        <motion.div
          ref={formRef}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.12 }}
          style={{ rotateX: rx, rotateY: ry, transformPerspective: 1100 } as any}
          className="relative w-full max-w-[520px] will-change-transform"
        >
          <motion.div
            className="pointer-events-none absolute -inset-10 -z-10 rounded-[44px] blur-[36px]"
            style={{
              background: `radial-gradient(520px 280px at 30% 12%, ${accent}28, transparent 70%), radial-gradient(480px 300px at 82% 88%, ${accent2}1e, transparent 70%), radial-gradient(380px 200px at 50% 50%, ${gold}12, transparent 70%)`,
            } as CSSProperties}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="pointer-events-none absolute -inset-[1px] rounded-[30px] bg-gradient-to-b from-white/15 via-white/5 to-white/10 opacity-60" />
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.03))] p-[1px] shadow-[0_32px_90px_rgba(0,0,0,0.62),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-[22px]">
            <div className="absolute inset-x-[8%] top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
            <div className="absolute inset-x-[16%] top-[1px] h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent blur-[0.5px]" />
            <div className="relative rounded-[27px] bg-[linear-gradient(180deg,rgba(12,18,36,0.78),rgba(7,10,24,0.94))] p-6 sm:p-7">
              <div className="pointer-events-none absolute inset-0 rounded-[27px] bg-gradient-to-b from-white/[0.06] to-transparent" />
              <div className="pointer-events-none absolute inset-0 rounded-[27px]" style={{ background: `radial-gradient(700px 260px at 50% 0%, ${accent}0d, transparent 68%)` } as CSSProperties} />
              <div className="relative">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 backdrop-blur-xl">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ background: `linear-gradient(135deg, ${accent}, ${accent2})`, boxShadow: `0 4px 14px ${accent}55` } as CSSProperties}>
                    <Star size={12} className="text-white" />
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/75">
                    {isAdmin ? 'Espace Administration' : 'Portail Agent Premium'}
                  </span>
                  <span className="ml-1 hidden h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] sm:block animate-pulse" />
                </div>

                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE, delay: 0.22 }}>
                  <h1 className="bg-gradient-to-r from-white via-white to-white/75 bg-clip-text text-[26px] font-extrabold leading-[1.06] tracking-[-0.7px] text-transparent sm:text-[28px]">{title}</h1>
                  <p className="mt-2.5 max-w-[42ch] text-[13.5px] leading-6 text-slate-300/75">{subtitle}</p>
                </motion.div>

                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-gradient-to-r from-white/10 via-white/10 to-transparent" />
                  <div className="flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-white/30" />
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent, boxShadow: `0 0 10px ${accent}` } as CSSProperties} />
                    <span className="h-1 w-1 rounded-full bg-white/30" />
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-l from-white/10 via-white/10 to-transparent" />
                </div>

                <div className="auth-form-stage">{children}</div>

                <div className="mt-6 flex items-center justify-between border-t border-white/8 pt-4">
                  <div className="flex items-center gap-2 text-[11px] text-white/40">
                    <Layers size={12} />
                    <span>AES-256 · 2FA · RGPD</span>
                  </div>
                  <div className="hidden items-center gap-1.5 text-[11px] text-white/40 sm:flex">
                    <Zap size={12} className="text-white/50" /> Temps réel
                  </div>
                </div>
              </div>
            </div>
            <motion.div
              className="pointer-events-none absolute inset-y-0 w-[42%] opacity-[0.09]"
              style={{ background: `linear-gradient(100deg, transparent, ${accent}66, transparent)` } as CSSProperties}
              animate={{ x: ['-65%', '175%'] }}
              transition={{ duration: 3.6, repeat: Infinity, repeatDelay: 2.4, ease: 'easeInOut' }}
            />
          </div>
          <div className="pointer-events-none absolute inset-x-10 -bottom-7 h-12 rounded-full bg-black/45 blur-2xl" />
          <div className="pointer-events-none absolute inset-x-20 -bottom-10 h-8 rounded-full opacity-40 blur-xl" style={{ background: `${accent}33` } as CSSProperties} />
        </motion.div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center pb-4">
        <div className="flex items-center gap-2 rounded-full border border-white/8 bg-black/20 px-4 py-1.5 text-[11px] text-white/30 backdrop-blur-xl">
          <span>© {new Date().getFullYear()} CRM Square Immo</span>
          <span className="h-1 w-1 rounded-full bg-white/20" />
          <span className="hidden sm:inline">Hébergement souverain · Chiffrement de bout en bout</span>
          <ArrowRight size={11} className="opacity-30" />
        </div>
      </div>

      <style>{`
        html, body { overflow: hidden !important; height: 100dvh; }
        .aurora-blob{position:absolute;border-radius:9999px;filter:blur(90px);pointer-events:none;will-change:transform}
        .window-flicker{ animation: windowFlicker 3.2s ease-in-out infinite; }
        @keyframes windowFlicker{ 0%,100%{ opacity:0.58; } 50%{ opacity:1; } }
        .auth-form-stage input{
          background: linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.04)) !important;
          border: 1px solid rgba(255,255,255,0.10) !important;
          color: #E7EAF6 !important;
          transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease !important;
        }
        .auth-form-stage input::placeholder{color: rgba(232,235,246,0.38) !important}
        .auth-form-stage input:focus{
          border-color: var(--auth-accent) !important;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--auth-accent) 18%, transparent), 0 8px 20px -10px color-mix(in srgb, var(--auth-accent) 35%, transparent) !important;
        }
        .auth-form-stage label{color: rgba(226,232,240,0.75) !important; font-size: 11px !important; font-weight: 700 !important; letter-spacing: 0.14em !important; text-transform: uppercase !important;}
        ::-webkit-scrollbar{ width:0 !important; height:0 !important; display:none !important; }
        *{ scrollbar-width: none !important; -ms-overflow-style: none !important; }
        .auth-form-stage{ max-height: min(78dvh, 620px); overflow-y: auto; scrollbar-width:none; -webkit-overflow-scrolling: touch; }
        .auth-form-stage::-webkit-scrollbar{ display:none; }
      `}</style>
    </div>
  )
}
