import type { ComponentType, CSSProperties, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Edit3, MessageSquare, Shield, Sun, User } from 'react-feather'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { useStageAccent, useStageScope, useStageTheme, type StageHue } from '../dashboard/Stage'

export interface SettingsChrome {
  isDark: boolean
  isAdmin: boolean
  accent: StageHue
  eyebrow: string
  titleGradient: string
  subtitle: string
  dot: string
  dotShadow: string
  backButton: string
  tabInactive: string
  tabPillStyle: CSSProperties
  label: string
  inputFocus: string
  link: string
  activeSoft: string
  activeSoftIcon: string
  avatarGradient: string
  activeGradient: string
  surfaceBg: string
  surfaceBorder: string
  surfaceHover: string
  mutedSurface: string
}

export function useSettingsChrome(): SettingsChrome {
  const theme = useStageTheme()
  const scope = useStageScope()
  const accent = useStageAccent()
  const isDark = theme === 'dark'
  const isAdmin = scope === 'admin'

  if (isAdmin && isDark) {
    return {
      isDark,
      isAdmin,
      accent,
      eyebrow: 'text-rose-200/70',
      titleGradient: 'from-white via-rose-100 to-rose-300',
      subtitle: 'text-rose-100/55',
      dot: 'bg-rose-400',
      dotShadow: 'shadow-[0_0_14px_2px_rgba(244,63,94,0.8)]',
      backButton:
        'border-rose-400/20 bg-white/[0.045] text-rose-200/75 hover:border-rose-400/40 hover:bg-white/[0.08] hover:text-rose-100',
      tabInactive: 'text-rose-100/55 hover:bg-white/[0.06] hover:text-rose-100',
      tabPillStyle: {
        background: 'linear-gradient(135deg, #F43F5E 0%, #C2266B 45%, #6D28D9 100%)',
        boxShadow:
          '0 10px 26px -12px rgba(244,63,94,0.85), inset 0 1px 0 rgba(255,255,255,0.24)',
      },
      label: 'text-rose-200/70',
      inputFocus: 'focus:border-rose-400/70 focus:ring-rose-400/20',
      link: 'text-rose-300 hover:text-rose-200',
      activeSoft: 'border-rose-400/30 bg-rose-500/10',
      activeSoftIcon: 'text-rose-200',
      avatarGradient: 'from-rose-500 to-violet-600',
      activeGradient: 'from-rose-500/25 to-violet-600/25',
      surfaceBg: 'bg-white/[0.045]',
      surfaceBorder: 'border-white/10',
      surfaceHover: 'hover:border-white/20 hover:bg-white/[0.07]',
      mutedSurface: 'bg-white/[0.035]',
    }
  }

  if (isAdmin) {
    return {
      isDark,
      isAdmin,
      accent,
      eyebrow: 'text-orange-900/55',
      titleGradient: 'from-orange-950 via-orange-700 to-amber-600',
      subtitle: 'text-orange-900/60',
      dot: 'bg-orange-500',
      dotShadow: 'shadow-[0_0_16px_2px_rgba(249,115,22,0.7)]',
      backButton:
        'border-orange-900/12 bg-white/70 text-orange-900/70 hover:border-orange-700/30 hover:bg-white hover:text-orange-950',
      tabInactive: 'text-orange-900/55 hover:bg-orange-900/[0.05] hover:text-orange-950',
      tabPillStyle: {
        background: 'linear-gradient(135deg, #EA580C 0%, #F97316 50%, #F59E0B 100%)',
        boxShadow:
          '0 10px 24px -14px rgba(194,65,12,0.7), inset 0 1px 0 rgba(255,255,255,0.32)',
      },
      label: 'text-orange-900/55',
      inputFocus: 'focus:border-orange-500/70 focus:ring-orange-500/20',
      link: 'text-orange-700 hover:text-orange-800',
      activeSoft: 'border-orange-500/20 bg-orange-50/60',
      activeSoftIcon: 'text-orange-700',
      avatarGradient: 'from-orange-400 to-amber-600',
      activeGradient: 'from-orange-500/20 to-amber-500/20',
      surfaceBg: 'bg-white/70',
      surfaceBorder: 'border-orange-900/10',
      surfaceHover: 'hover:border-orange-700/20 hover:bg-white/90',
      mutedSurface: 'bg-orange-50/40',
    }
  }

  if (isDark) {
    return {
      isDark,
      isAdmin,
      accent,
      eyebrow: 'text-violet-300/65',
      titleGradient: 'from-white via-violet-100 to-indigo-300',
      subtitle: 'text-slate-400/75',
      dot: 'bg-violet-400',
      dotShadow: 'shadow-[0_0_14px_2px_rgba(124,92,255,0.8)]',
      backButton:
        'border-white/10 bg-white/[0.05] text-slate-400 hover:border-white/20 hover:bg-white/[0.08] hover:text-white',
      tabInactive: 'text-slate-400 hover:bg-white/[0.06] hover:text-white',
      tabPillStyle: {
        background: 'linear-gradient(135deg, rgba(139,124,255,0.95) 0%, rgba(86,70,201,0.95) 100%)',
        boxShadow:
          '0 10px 26px -12px rgba(124,92,255,0.9), inset 0 1px 0 rgba(255,255,255,0.24)',
      },
      label: 'text-slate-400/85',
      inputFocus: 'focus:border-violet-400/70 focus:ring-violet-400/20',
      link: 'text-violet-300 hover:text-violet-200',
      activeSoft: 'border-violet-400/30 bg-violet-500/10',
      activeSoftIcon: 'text-violet-200',
      avatarGradient: 'from-violet-500 to-indigo-600',
      activeGradient: 'from-violet-500/25 to-indigo-600/25',
      surfaceBg: 'bg-white/[0.045]',
      surfaceBorder: 'border-white/10',
      surfaceHover: 'hover:border-white/20 hover:bg-white/[0.07]',
      mutedSurface: 'bg-white/[0.035]',
    }
  }

  return {
    isDark,
    isAdmin,
    accent,
    eyebrow: 'text-teal-900/55',
    titleGradient: 'from-teal-950 via-teal-800 to-emerald-600',
    subtitle: 'text-teal-900/60',
    dot: 'bg-teal-500',
    dotShadow: 'shadow-[0_0_16px_2px_rgba(20,184,166,0.65)]',
    backButton:
      'border-teal-900/12 bg-white/70 text-teal-900/65 hover:border-teal-700/30 hover:bg-white hover:text-teal-950',
    tabInactive: 'text-teal-900/55 hover:bg-teal-900/[0.05] hover:text-teal-950',
    tabPillStyle: {
      background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 55%, #059669 100%)',
      boxShadow:
        '0 10px 24px -14px rgba(13,148,136,0.75), inset 0 1px 0 rgba(255,255,255,0.32)',
    },
    label: 'text-teal-900/55',
    inputFocus: 'focus:border-teal-500/70 focus:ring-teal-500/20',
    link: 'text-teal-700 hover:text-teal-800',
    activeSoft: 'border-teal-500/20 bg-teal-50/60',
    activeSoftIcon: 'text-teal-700',
    avatarGradient: 'from-teal-400 to-emerald-600',
    activeGradient: 'from-teal-500/15 to-emerald-600/15',
    surfaceBg: 'bg-white/65',
    surfaceBorder: 'border-teal-900/10',
    surfaceHover: 'hover:border-teal-700/20 hover:bg-white/90',
    mutedSurface: 'bg-teal-50/40',
  }
}

export function useSettingsBasePath(): string {
  const { pathname } = useLocation()
  const parts = pathname.split('/')
  if (parts[1] === 'admin' && parts[2]) return `/admin/${parts[2]}/settings`
  return '/settings'
}

export function SettingsBackButton({ className }: { className?: string }) {
  const navigate = useNavigate()
  const { backButton } = useSettingsChrome()

  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      className={cn(
        'flex w-fit items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors',
        backButton,
        className,
      )}
    >
      <ArrowLeft size={13} />
      Retour
    </button>
  )
}

export function SettingsHero({
  eyebrow,
  title,
  subtitle,
  right,
  className,
}: {
  eyebrow: string
  title: string
  subtitle?: string
  right?: ReactNode
  className?: string
}) {
  const { eyebrow: eyebrowClass, titleGradient, subtitle: subtitleClass, dot, dotShadow } =
    useSettingsChrome()

  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-4', className)}>
      <div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-60', dot)} />
            <span className={cn('relative inline-flex h-2 w-2 rounded-full', dot, dotShadow)} />
          </span>
          <p className={cn('text-[10px] font-bold uppercase tracking-[0.24em]', eyebrowClass)}>
            {eyebrow}
          </p>
        </div>
        <h1
          className={cn(
            'mt-1 bg-gradient-to-r bg-clip-text text-3xl font-extrabold tracking-tight text-transparent',
            titleGradient,
          )}
        >
          {title}
        </h1>
        {subtitle && <p className={cn('mt-0.5 text-sm', subtitleClass)}>{subtitle}</p>}
      </div>
      {right}
    </div>
  )
}

export interface SettingsTab {
  label: string
  icon: ComponentType<{ size?: number | string; className?: string }>
  to: string
}

export function SettingsTabs({
  tabs,
  layoutId,
  className,
}: {
  tabs: SettingsTab[]
  layoutId: string
  className?: string
}) {
  const { pathname } = useLocation()
  const { tabInactive, tabPillStyle } = useSettingsChrome()

  return (
    <div
      className={cn(
        'stage-glass flex w-fit gap-1 rounded-2xl border border-white/10 p-1',
        className,
      )}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon
        const active = pathname === tab.to
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={cn(
              'relative flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-colors',
              active ? 'text-white' : tabInactive,
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-xl"
                style={tabPillStyle}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <Icon size={14} className="relative z-10" />
            <span className="relative z-10">{tab.label}</span>
          </NavLink>
        )
      })}
    </div>
  )
}

export function CompteSettingsTabs({ className }: { className?: string }) {
  const base = useSettingsBasePath()
  return (
    <SettingsTabs
      layoutId="settings-compte-tab"
      className={className}
      tabs={[
        { label: 'Profil', icon: User, to: `${base}/compte/profil` },
        { label: 'Sécurité', icon: Shield, to: `${base}/compte/securite` },
        { label: 'Préférences', icon: Sun, to: `${base}/compte/preferences` },
      ]}
    />
  )
}

export function CommunicationSettingsTabs({ className }: { className?: string }) {
  const base = useSettingsBasePath()
  return (
    <SettingsTabs
      layoutId="settings-communication-tab"
      className={className}
      tabs={[
        { label: 'Signature', icon: Edit3, to: `${base}/communication/signature` },
        {
          label: 'Réponses automatiques',
          icon: MessageSquare,
          to: `${base}/communication/reponses-automatiques`,
        },
      ]}
    />
  )
}
