import { API_ORIGIN } from '../../utils/config'
import { NavLink, useLocation } from 'react-router-dom'
import { Activity, Home, Users, FileText, MessageSquare, Settings, Crosshair, CheckCircle, Calendar, BookOpen, Eye, Zap, Edit3, Compass, ChevronLeft, Tool, Shield } from 'react-feather'
import { Library as LibraryIcon } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useMessageUnread } from '../../services/realtime'
import { useAutomator } from '../../contexts/AutomatorContext'
import { getEventById } from '../../types/automator'
import { getMyEffectivePermissions } from '../../services/permissionsService'
import { getAuthToken } from '../../utils/auth'
import { useStageTheme } from '../dashboard/Stage'
import { StageTooltip } from '../modules/registre/RegistreStage'
import { cn } from '../../lib/utils'

type BadgeHue = 'violet' | 'sky' | 'emerald'

interface NavItem {
  icon: React.ComponentType<{ size?: number | string; className?: string }>
  label: string
  to: string
  badge?: number
  badgeHue?: BadgeHue
}

const BADGE_TOKENS: Record<BadgeHue, { dark: [string, string, string, string]; light: [string, string, string, string] }> = {
  violet: {
    dark: ['rgba(139,124,255,0.18)', 'rgba(139,124,255,0.45)', '#D9D4FF', 'rgba(124,92,255,0.75)'],
    light: ['rgba(124,92,255,0.12)', 'rgba(124,92,255,0.35)', '#4C3DCC', 'rgba(124,92,255,0.4)'],
  },
  sky: {
    dark: ['rgba(56,189,248,0.16)', 'rgba(56,189,248,0.42)', '#C3ECFE', 'rgba(56,189,248,0.65)'],
    light: ['rgba(2,132,199,0.10)', 'rgba(2,132,199,0.30)', '#075985', 'rgba(2,132,199,0.35)'],
  },
  emerald: {
    dark: ['rgba(52,211,153,0.14)', 'rgba(52,211,153,0.40)', '#A7F3D0', 'rgba(52,211,153,0.6)'],
    light: ['rgba(5,150,105,0.10)', 'rgba(5,150,105,0.30)', '#047857', 'rgba(5,150,105,0.35)'],
  },
}

function SidebarNavTooltip({
  enabled, label, dark, children,
}: {
  enabled: boolean
  label: string
  dark: boolean
  children: React.ReactNode
}) {
  if (!enabled) return <>{children}</>
  return (
    <StageTooltip
      label={label}
      position="right"
      isDark={dark}
      delay={180}
      zIndex={130}
      className="w-full"
    >
      {children}
    </StageTooltip>
  )
}

export interface SidebarProps {
  basePath?: string
  /** 'agent' (default) — permission-gated business nav · 'admin' — management nav, no gating */
  variant?: 'agent' | 'admin'
  /** Brand tile image override (admin uses the official admin crest) */
  brandImage?: string
}

/* Ambient rail wave — one continuous swell spans the whole rail: each link
   oscillates along a sinusoidal depth curve (nav-wave keyframes, index.css),
   rising toward the viewer's device as the crest arrives and sinking slightly
   behind the rail plane in the trough. The cycle below is the time the crest
   takes to travel from the first link to the last; the per-link phase offset
   is derived from the live link count so adjacent links stay ~1/17th of a
   cycle apart — the sidebar moves as one liquid surface, never as
   independent buttons. */
const NAV_WAVE = {
  cycle: 3.5, // seconds for the crest to travel the whole rail (s)
}

export default function Sidebar({ basePath = '', variant = 'agent', brandImage = '/CRM_Official_Image.jfif' }: SidebarProps) {
  const admin = variant === 'admin'
  const location = useLocation()
  const theme = useStageTheme()
  const dark = theme === 'dark'
  const savedCollapsed = typeof localStorage !== 'undefined' ? localStorage.getItem('crm-sidebar-collapsed') === 'true' : false
  const [collapsed, setCollapsed] = useState(savedCollapsed)
  const [espaceType, setEspaceType] = useState('')
  const [agentName, setAgentName] = useState('')
  const unreadCount = useMessageUnread()
  const automator = useAutomator()
  /* Badge scoped to this agent's own automations (same rule as the automator
     page): the backend feed is global, so counting it raw shows phantom
     notifications from other agents/admin events with zero automations.
     Admin/gerant: the feed IS theirs, so count raw unread entries. */
  const myAutomatorEventIds = useMemo(() => {
    if (admin) return null
    return new Set(
      automator.automators.filter(a => {
        if (!a.eventId) return false
        const ev = getEventById(a.eventId)
        if (ev?.clientType === 'admin') return false
        if (a.createdBy === agentName) return true
        if (a.delegatedTo === 'all') return true
        if (a.delegatedTo && a.delegatedTo === agentName) return true
        return false
      }).map(a => a.eventId as string)
    )
  }, [admin, automator.automators, agentName])
  const automatorBadge = admin
    ? automator.triggeredNotifications.filter(n => !n.read && n.eventId).length || 0
    : automator.triggeredNotifications.filter(
        n => !n.read && n.eventId && myAutomatorEventIds!.has(n.eventId)
      ).length || 0
  const [calendarVisible, setCalendarVisible] = useState(true)
  const [contactsVisible, setContactsVisible] = useState(true)
  const [prospectsVisible, setProspectsVisible] = useState(true)
  const [clientsVisible, setClientsVisible] = useState(true)
  const [contractsVisible, setContractsVisible] = useState(true)
  const [biensVisible, setBiensVisible] = useState(true)
  const [registreVisible, setRegistreVisible] = useState(true)

  useEffect(() => {
    if (admin) return
    let cancelled = false
    getMyEffectivePermissions()
      .then(perms => {
        if (cancelled) return
        if (perms['calendrier-lecture'] === false) setCalendarVisible(false)
        if (perms['contacts-lecture'] === false) setContactsVisible(false)
        if (perms['prospects-lecture'] === false) setProspectsVisible(false)
        if (perms['clients-lecture'] === false) setClientsVisible(false)
        if (perms['contrats-lecture'] === false) setContractsVisible(false)
        if (perms['biens-lecture'] === false) setBiensVisible(false)
        if (perms['registre-lecture'] === false) setRegistreVisible(false)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const token = getAuthToken()
    if (!token) return
    fetch(`${API_ORIGIN}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          if (data.role === 'admin') setEspaceType('Administrateur')
          else if (data.role === 'gerant') setEspaceType('Gérant')
          else setEspaceType(data.position || 'Agent')
          setAgentName([data.first_name, data.last_name].filter(Boolean).join(' '))
        }
      })
      .catch(() => {})
  }, [])

  const byId: Record<string, NavItem | undefined> = admin
    ? {
        dashboard: { icon: Activity, label: 'Dashboard', to: basePath || '/' },
        calendar: { icon: Calendar, label: 'Calendrier', to: `${basePath}/calendar` },
        biens: { icon: Home, label: 'Biens', to: `${basePath}/properties` },
        clients: { icon: Users, label: 'Clients', to: `${basePath}/clients` },
        prospects: { icon: Crosshair, label: 'Prospects', to: `${basePath}/prospects` },
        contacts: { icon: CheckCircle, label: 'Contacts', to: `${basePath}/contacts` },
        contrats: { icon: Edit3, label: 'Contrats', to: `${basePath}/contracts` },
        registre: { icon: BookOpen, label: 'Registre', to: `${basePath}/register` },
        messages: { icon: MessageSquare, label: 'Messages', to: `${basePath}/messages`, badge: unreadCount, badgeHue: 'sky' },
        automator: { icon: Zap, label: 'Automator', to: `${basePath}/automator`, badge: automatorBadge, badgeHue: 'violet' },
        squarepeek: { icon: Eye, label: 'Squarepeek', to: `${basePath}/extranet` },
        conciergerie: { icon: Compass, label: 'Activités Conciergerie', to: `${basePath}/conciergerie` },
        documents: { icon: FileText, label: 'Documents', to: `${basePath}/documents` },
        librairie: { icon: LibraryIcon, label: 'Librairie', to: `${basePath}/library` },
        toolbox: { icon: Tool, label: 'Toolbox', to: `${basePath}/toolbox` },
        parametres: { icon: Settings, label: 'Paramètres', to: `${basePath}/settings` },
        users: { icon: Shield, label: 'Utilisateurs', to: `${basePath}/users` },
      }
    : {
        dashboard: { icon: Activity, label: 'Dashboard', to: basePath || '/' },
        calendar: calendarVisible ? { icon: Calendar, label: 'Calendrier', to: `${basePath}/calendar` } : undefined,
        biens: biensVisible ? { icon: Home, label: 'Biens', to: `${basePath}/properties` } : undefined,
        clients: clientsVisible ? { icon: Users, label: 'Clients', to: `${basePath}/clients` } : undefined,
        prospects: prospectsVisible ? { icon: Crosshair, label: 'Prospects', to: `${basePath}/prospects` } : undefined,
        contacts: contactsVisible ? { icon: CheckCircle, label: 'Contacts', to: `${basePath}/contacts` } : undefined,
        contrats: contractsVisible ? { icon: Edit3, label: 'Contrats', to: `${basePath}/contracts` } : undefined,
        registre: registreVisible ? { icon: BookOpen, label: 'Registre', to: `${basePath}/register` } : undefined,
        messages: { icon: MessageSquare, label: 'Messages', to: `${basePath}/messages`, badge: unreadCount, badgeHue: 'sky' },
        automator: { icon: Zap, label: 'Automator', to: `${basePath}/automator`, badge: automatorBadge, badgeHue: 'violet' },
        squarepeek: { icon: Eye, label: 'Squarepeek', to: `${basePath}/extranet` },
        conciergerie: { icon: Compass, label: 'Activités Conciergerie', to: `${basePath}/conciergerie` },
        documents: { icon: FileText, label: 'Documents', to: `${basePath}/documents` },
        librairie: { icon: LibraryIcon, label: 'Librairie', to: `${basePath}/library` },
        toolbox: { icon: Tool, label: 'Toolbox', to: `${basePath}/toolbox` },
        users: admin ? { icon: Users, label: 'Utilisateurs', to: `${basePath}/users` } : undefined,
        parametres: { icon: Settings, label: 'Paramètres', to: `${basePath}/settings` },
      }

  const groups: { title: string; keys: string[] }[] = admin
    ? [
        { title: 'Pilotage', keys: ['dashboard', 'calendar'] },
        { title: 'Gestion', keys: ['users'] },
        { title: 'Business', keys: ['biens', 'clients', 'prospects', 'contacts', 'contrats', 'registre'] },
        { title: 'Hub & Flux', keys: ['messages', 'automator', 'squarepeek', 'conciergerie'] },
        { title: 'Ressources', keys: ['documents', 'librairie'] },
        { title: 'Premium', keys: ['toolbox'] },
        { title: 'Système', keys: ['parametres'] },
      ]
    : [
        { title: 'Pilotage', keys: ['dashboard', 'calendar'] },
        { title: 'Business', keys: ['biens', 'clients', 'prospects', 'contacts', 'contrats', 'registre'] },
        { title: 'Hub & Flux', keys: ['messages', 'automator', 'squarepeek', 'conciergerie'] },
        { title: 'Ressources', keys: ['documents', 'librairie'] },
        { title: 'Premium', keys: ['toolbox'] },
        { title: 'Système', keys: ['parametres'] },
      ]

  const navGroups = groups
    .map(group => ({
      title: group.title,
      items: group.keys.map(k => byId[k]).filter((it): it is NavItem => Boolean(it)),
    }))
    .filter(group => group.items.length > 0)
  const waveOffsets = navGroups.map((_, gi) =>
    navGroups.slice(0, gi).reduce((sum, g) => sum + g.items.length, 0)
  )
  /* One wavelength spans the whole rail: derive the per-link phase offset
     from the live link count so the crest always flows from the first link
     to the last in exactly one cycle, whatever the variant or permissions. */
  const totalWaveLinks = navGroups.reduce((sum, g) => sum + g.items.length, 0)
  const waveStagger = totalWaveLinks > 0 ? NAV_WAVE.cycle / totalWaveLinks : 0

  const espaceChipStyle = dark
    ? admin
      ? { borderColor: 'rgba(244,63,94,0.38)', backgroundColor: 'rgba(190,18,60,0.16)', color: '#FDA4AF' }
      : { borderColor: 'rgba(139,124,255,0.38)', backgroundColor: 'rgba(124,92,255,0.13)', color: '#CDC7FF' }
    : admin
      ? { borderColor: 'rgba(234,88,12,0.30)', backgroundColor: 'rgba(255,255,255,0.8)', color: '#9A3412' }
      : { borderColor: 'rgba(13,148,136,0.25)', backgroundColor: 'rgba(255,255,255,0.75)', color: '#0F766E' }
  const espaceDot = dark ? (admin ? '#F43F5E' : '#8B7CFF') : admin ? '#EA580C' : '#0D9488'

  const renderDivider = () =>
    collapsed ? (
      <div className={cn('mx-auto my-2.5 h-px w-8 rounded-full', dark ? 'bg-white/10' : 'bg-teal-900/10')} />
    ) : null

  return (
    <aside
      className={cn(
        'shell-rail relative z-30 flex h-screen shrink-0 flex-col overflow-hidden transition-[width] duration-300 ease-in-out',
        collapsed ? 'w-[72px]' : 'w-[244px]'
      )}
      style={{ ['--nav-wave-glow' as string]: admin ? 'rgba(244,63,94,0.55)' : 'rgba(139,124,255,0.55)' }}
    >
      {/* Ambient depth inside the rail */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="absolute -right-12 -top-20 h-52 w-52 rounded-full blur-3xl"
          style={{ background: dark
            ? admin
              ? 'radial-gradient(circle, rgba(244,63,94,0.26), transparent 65%)'
              : 'radial-gradient(circle, rgba(124,92,255,0.22), transparent 65%)'
            : admin
              ? 'radial-gradient(circle, rgba(251,146,60,0.35), transparent 65%)'
              : 'radial-gradient(circle, rgba(109,213,196,0.35), transparent 65%)' }}
        />
        <div
          className="absolute -bottom-20 -left-14 h-56 w-56 rounded-full blur-3xl"
          style={{ background: dark
            ? 'radial-gradient(circle, rgba(34,211,238,0.15), transparent 65%)'
            : 'radial-gradient(circle, rgba(124,92,255,0.12), transparent 65%)' }}
        />
        <div
          className="absolute inset-y-6 right-0 w-px opacity-70"
          style={{ background: dark
            ? admin
              ? 'linear-gradient(180deg, transparent, rgba(244,63,94,0.6), rgba(190,18,60,0.40), rgba(124,58,237,0.45), transparent)'
              : 'linear-gradient(180deg, transparent, rgba(139,124,255,0.55), rgba(94,234,212,0.35), rgba(232,121,249,0.3), transparent)'
            : admin
              ? 'linear-gradient(180deg, transparent, rgba(251,146,60,0.55), rgba(124,92,255,0.3), transparent)'
              : 'linear-gradient(180deg, transparent, rgba(45,212,191,0.55), rgba(124,92,255,0.3), transparent)' }}
        />
      </div>

      {/* Brand */}
      <div className={cn(
        'relative z-10 flex h-[68px] shrink-0 items-center gap-3 overflow-hidden border-b px-3.5',
        dark ? 'border-white/[0.07]' : 'border-teal-900/[0.08]'
      )}>
        <motion.div
          whileHover={{ scale: 1.07, rotate: -3 }}
          transition={{ type: 'spring', stiffness: 320, damping: 18 }}
          className="relative h-11 w-11 shrink-0 cursor-pointer"
          style={{ filter: dark
            ? admin
              ? 'drop-shadow(0 8px 22px rgba(244,63,94,0.45))'
              : 'drop-shadow(0 8px 22px rgba(124,92,255,0.45))'
            : admin
              ? 'drop-shadow(0 8px 22px rgba(249,115,22,0.4))'
              : 'drop-shadow(0 8px 22px rgba(13,148,136,0.4))' }}
        >
          <span aria-hidden="true" className="holo-spin absolute -inset-[3px] rounded-[15px]" />
          <div className={cn('relative h-full w-full rounded-xl p-[2px]', dark ? 'bg-[#0B1022]' : 'bg-white')}>
            <div className="h-full w-full overflow-hidden rounded-[10px] ring-1 ring-inset ring-white/25">
              <img src={brandImage} alt="CRM Square Immo" className="h-full w-full object-cover" />
            </div>
          </div>
        </motion.div>
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              key="brand"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="min-w-0 overflow-hidden whitespace-nowrap"
            >
              <p className={cn(
                'bg-gradient-to-r bg-clip-text text-[15px] font-extrabold leading-tight tracking-tight text-transparent',
                dark ? 'from-white via-indigo-100 to-indigo-400' : admin
                  ? 'from-orange-900 via-orange-700 to-amber-600'
                  : 'from-teal-900 via-teal-700 to-emerald-600'
              )}>
                CRM Square Immo
              </p>
              {espaceType && (
                <span
                  className="mt-1 inline-flex items-center gap-1.5 rounded-md border px-1.5 py-[2px] text-[8px] font-extrabold uppercase leading-none tracking-[1.8px]"
                  style={espaceChipStyle}
                >
                  <span className="h-1 w-1 shrink-0 rounded-full" style={{ backgroundColor: espaceDot, boxShadow: `0 0 6px ${espaceDot}` }} />
                  {espaceType}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav — grouped mission modules */}
      <nav className="scrollbar-thin relative z-10 flex-1 overflow-y-auto px-2.5 py-3">
        {navGroups.map((group, gi) => (
          <div key={group.title}>
            {gi > 0 && !collapsed && (
              <div className={cn('mx-1 mt-3 mb-1 h-px', dark ? 'bg-white/[0.06]' : 'bg-teal-900/[0.08]')} />
            )}
            {gi > 0 && collapsed && renderDivider()}
            {!collapsed && (
              <p className={cn(
                'flex items-center gap-2 px-2 pb-1.5 pt-3 text-[9px] font-extrabold uppercase tracking-[2.6px]',
                gi === 0 && 'pt-1.5',
                dark ? 'text-slate-500' : admin ? 'text-orange-900/45' : 'text-teal-900/45'
              )}>
                {group.title}
                <span
                  className="h-px flex-1"
                  style={{ background: dark
                    ? 'linear-gradient(90deg, rgba(255,255,255,0.1), transparent)'
                    : admin
                      ? 'linear-gradient(90deg, rgba(234,88,12,0.18), transparent)'
                      : 'linear-gradient(90deg, rgba(13,148,136,0.15), transparent)' }}
                />
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item, li) => {
                const waveIndex = waveOffsets[gi] + li
                const isActive = item.to === basePath
                  ? location.pathname === item.to
                  : location.pathname.startsWith(item.to)
                const Icon = item.icon
                const badge = item.badge || 0
                const showBadge = badge > 0
                const tokens = BADGE_TOKENS[item.badgeHue || 'violet']
                const [bBg, bBorder, bText, bGlow] = dark ? tokens.dark : tokens.light

                return (
                  <div
                    key={item.to}
                    className="sq-nav-wave"
                    style={{ animationDelay: `${(waveIndex * waveStagger).toFixed(3)}s` }}
                  >
                    <SidebarNavTooltip enabled={collapsed} label={item.label} dark={dark}>
                    <NavLink
                      to={item.to}
                      aria-label={collapsed ? item.label : undefined}
                      className={cn(
                        'group relative flex h-10 w-full items-center rounded-xl border border-transparent text-sm font-medium transition-colors duration-200',
                        collapsed ? 'justify-center' : 'gap-3 px-2.5',
                        isActive ? 'text-white' : dark
                          ? 'text-slate-400 hover:bg-white/[0.05] hover:text-white'
                          : admin
                            ? 'text-slate-600 hover:bg-orange-900/[0.05] hover:text-orange-900'
                            : 'text-slate-500 hover:bg-teal-900/[0.05] hover:text-teal-900'
                      )}
                    >
                      {isActive && (
                        <>
                          <motion.span
                            layoutId="stage-rail-pill"
                            className="absolute inset-0 rounded-xl border border-white/25"
                            style={{
                              backgroundImage: dark
                                ? admin
                                  ? 'linear-gradient(145deg, #F43F5E 0%, #C2266B 55%, #6D28D9 100%)'
                                  : 'linear-gradient(145deg, #8B7CFF 0%, #6C5ECF 60%, #5646C9 100%)'
                                : admin
                                  ? 'linear-gradient(145deg, #FDBA74 0%, #F97316 55%, #C2410C 100%)'
                                  : 'linear-gradient(145deg, #2DD4BF 0%, #14B8A6 60%, #0D9488 100%)',
                              boxShadow: dark
                                ? admin
                                  ? 'inset 0 1px 0 rgba(255,255,255,0.35), 0 12px 28px -8px rgba(190,18,60,0.75)'
                                  : 'inset 0 1px 0 rgba(255,255,255,0.35), 0 12px 28px -8px rgba(124,92,255,0.75)'
                                : admin
                                  ? 'inset 0 1px 0 rgba(255,255,255,0.45), 0 12px 28px -10px rgba(249,115,22,0.65)'
                                  : 'inset 0 1px 0 rgba(255,255,255,0.45), 0 12px 28px -10px rgba(13,148,136,0.65)',
                            }}
                            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                          />
                          <span className="nav-beam" aria-hidden="true" />
                          <span className="pill-sheen" aria-hidden="true" />
                        </>
                      )}
                      <Icon
                        size={17}
                        className={cn(
                          'relative z-10 shrink-0 transition-transform duration-200 group-hover:scale-110',
                          isActive && 'drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]'
                        )}
                      />
                      <AnimatePresence initial={false}>
                        {!collapsed && (
                          <motion.span
                            key="label"
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                            className="relative z-10 flex-1 truncate whitespace-nowrap text-left"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {!collapsed && showBadge && (
                        <span
                          className="relative z-10 flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full border px-1 text-[10px] font-bold tabular-nums"
                          style={{
                            backgroundColor: bBg,
                            borderColor: bBorder,
                            color: bText,
                            boxShadow: dark ? `0 0 12px ${bGlow}` : 'none',
                          }}
                        >
                          {badge > 99 ? '99+' : badge}
                        </span>
                      )}
                      {collapsed && showBadge && (
                        <span
                          className="absolute right-2 top-1.5 z-10 h-2 w-2 rounded-full"
                          style={{ backgroundColor: bText, boxShadow: dark ? `0 0 8px ${bGlow}` : 'none' }}
                        />
                      )}
                    </NavLink>
                    </SidebarNavTooltip>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <motion.button
        onClick={() => {
          const next = !collapsed
          setCollapsed(next)
          if (typeof localStorage !== 'undefined') localStorage.setItem('crm-sidebar-collapsed', String(next))
        }}
        aria-label={collapsed ? 'Ouvrir le menu latéral' : 'Fermer le menu latéral'}
        title={collapsed ? 'Ouvrir le menu' : 'Fermer le menu'}
        initial={false}
        animate={{ rotate: collapsed ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 24, mass: 0.6 }}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        className={cn(
          'absolute -right-3 top-1/2 z-50 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border backdrop-blur-md transition-shadow duration-300',
          dark
            ? admin
              ? 'border-white/15 bg-[#18122e]/90 text-slate-300 shadow-[0_4px_16px_rgba(0,0,0,0.5)] hover:text-white hover:shadow-[0_0_20px_rgba(244,63,94,0.5)]'
              : 'border-white/15 bg-[#161C36]/90 text-slate-300 shadow-[0_4px_16px_rgba(0,0,0,0.5)] hover:text-white hover:shadow-[0_0_20px_rgba(124,92,255,0.55)]'
            : admin
              ? 'border-orange-900/15 bg-white/95 text-orange-700 shadow-[0_4px_16px_rgba(249,115,22,0.35)] hover:text-orange-900 hover:shadow-[0_0_20px_rgba(249,115,22,0.5)]'
              : 'border-teal-900/15 bg-white/95 text-teal-700 shadow-[0_4px_16px_rgba(13,148,136,0.35)] hover:text-teal-900 hover:shadow-[0_0_20px_rgba(13,148,136,0.5)]'
        )}
      >
        <ChevronLeft size={14} strokeWidth={2.6} />
      </motion.button>
    </aside>
  )
}
