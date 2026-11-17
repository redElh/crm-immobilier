import { useState, useMemo, useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, MotionConfig, type Variants } from 'framer-motion'
import {
  Plus, X, ChevronRight, ChevronLeft, MoreVertical, Activity, ToggleLeft, Trash2,
  BarChart2, Zap, Mail, MessageSquare, Smartphone, Calendar, Crosshair, FileText, Globe, Users,
  Check, CheckCircle, XCircle, Clock, Play, Eye,
  User, UserCheck, ShoppingCart, TrendingUp, Key, Home, MapPin, Bell, Send, Sliders, Search, Copy,
  BookOpen, Edit3, AlertTriangle,
} from 'react-feather'
import { Select } from '../../components/ui/Select'
import {
  Stage, StageStatCard, StagePanel, StageBadge, StageButton, OrbIcon,
  STAGE_HUES, useStageTheme, StageAreaChart, StageDonut3D,
} from '../../components/dashboard/Stage'
import { api } from '../../services/api'
import {
  mockModeles,
  getModeleById, getEventById, LOG_STATUT_LABELS,
  EVENTS as sharedEvents, CLIENT_TYPE_CONFIG as sharedClientTypes, REAL_CLIENT_TYPES,
} from '../../types/automator'
import type { Automator, NotificationCanal, AutomatorCategorie, AutomatorLog, RecipientType, ClientType, AutomatorEvent, NotificationTemplate } from '../../types/automator'
import { useAutomator, AddAutomatorInput } from '../../contexts/AutomatorContext'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { allContacts } from '../admin/contacts/mockData'
import { mockPropertiesList } from '../../data/mockProperties'

const CANAL_ICONES: Record<NotificationCanal, { icon: any; label: string }> = {
  email: { icon: Mail, label: 'Email' },
  sms: { icon: MessageSquare, label: 'SMS' },
  push: { icon: Smartphone, label: 'Push' },
  application_mobile: { icon: Smartphone, label: 'CRM Square Immo' },
}

const CATEGORIE_ICONS: Record<AutomatorCategorie, any> = {
  calendrier: Calendar,
  contrats: FileText,
  extranet: Eye,
  contacts: Users,
}

/* Hue cycle for the category gauge + legend (stage palette) */
const AUTO_HUES = [STAGE_HUES.violet, STAGE_HUES.emerald, STAGE_HUES.amber, STAGE_HUES.sky, STAGE_HUES.fuchsia]

/* Active-state hue — lagoon teal in light, mission-control fuchsia in dark */
const TEAL_HUE = { a: '#2DD4BF', b: '#0D9488', glow: 'rgba(20,184,166,0.50)', line: '#14B8A6' }

/* Wizard step transitions: directional slide + deblur */
const WIZARD_STEP_VARIANTS: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir >= 0 ? 56 : -56, filter: 'blur(6px)' }),
  center: { opacity: 1, x: 0, filter: 'blur(0px)' },
  exit: (dir: number) => ({ opacity: 0, x: dir >= 0 ? -56 : 56, filter: 'blur(6px)' }),
}

const MODELE_TO_CLIENT_TYPE: Record<number, ClientType> = {
  1: 'calendrier', 2: 'calendrier',
  5: 'contrats', 6: 'contrats', 7: 'contrats', 8: 'contrats',
  9: 'extranet', 10: 'extranet', 11: 'contacts',
}

const ICON_MAP: Record<string, any> = {
  tous: Sliders, acheteur: ShoppingCart, vendeur: TrendingUp, bailleur: Key,
  locataire: Home, voyageur: MapPin, contacts: Users,
  calendrier: Calendar, contrats: FileText, extranet: Eye,
}

const CLIENT_TYPE_CONFIG = sharedClientTypes
  .filter(ct => ct.key !== 'admin')
  .map(ct => ({ ...ct, icon: ICON_MAP[ct.key] || Sliders }))

const EVENTS = sharedEvents.filter(e => e.clientType !== 'admin')

function getAutomatorEventName(a: { eventId?: string; modeleId: number }): string {
  if (a.eventId) {
    const ev = getEventById(a.eventId)
    if (ev) return ev.label
  }
  return getModeleById(a.modeleId)?.nom || '—'
}

type WizardStep = 1 | 2 | 3

export default function AutomatorPage() {
  const automatorCtx = useAutomator()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showWizard, setShowWizard] = useState(false)
  const [wizardStep, setWizardStep] = useState<WizardStep>(1)
  const [showLogsFor, setShowLogsFor] = useState<Automator | null>(null)
  const [emailPreviewHtml, setEmailPreviewHtml] = useState<string | null>(null)
  const [emailPreviewTitle, setEmailPreviewTitle] = useState<string>('')
  const [previewChannel, setPreviewChannel] = useState<'email' | 'crm'>('email')
  const [showActionMenu, setShowActionMenu] = useState<number | null>(null)
  const [logDetail, setLogDetail] = useState<AutomatorLog | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  // Search / filter
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'actif' | 'inactif'>('all')
  const [filterCategory, setFilterCategory] = useState<ClientType | 'all'>('all')
  const [filterRecipient, setFilterRecipient] = useState<'all' | RecipientType>('all')
  const [filterFrequency, setFilterFrequency] = useState<'all' | string>('all')
  const [detailTarget, setDetailTarget] = useState<any>(null)

  /* Stage chrome — the agent shell is always staged (mission control) */
  const theme = useStageTheme()
  const isDark = theme === 'dark'
  const heroText = isDark
    ? { eyebrow: 'text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400/80', title: 'bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent', sub: 'text-sm text-slate-400' }
    : { eyebrow: 'text-[10px] font-bold uppercase tracking-[0.24em] text-teal-900/50', title: 'bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-600 bg-clip-text text-transparent', sub: 'text-sm text-teal-900/55' }
  const activeHue = isDark ? STAGE_HUES.fuchsia : TEAL_HUE
  /* Wizard accent — violet in dark (untouched), lagoon teal in light like calendar modals */
  const wizardHue = isDark ? STAGE_HUES.violet : TEAL_HUE

  /* Theme scope for body-portaled layers (mirrors StageModal): keeps token
     utilities + .dark overrides resolving as if the modal were still inside
     the agent shell. pop-glass is dark by default — it needs the stage-light
     ancestor for its bright skin, otherwise every modal renders dark even in
     light mode. */
  const portalScope = (content: ReactNode) => (
    <div className={`agent-theme cosmic-scope${isDark ? '' : ' stage-light'}`}>
      {isDark ? <div className="dark">{content}</div> : content}
    </div>
  )

  /* Escape closes the topmost open layer */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (emailPreviewHtml) { setEmailPreviewHtml(null); setPreviewChannel('email') }
      else if (logDetail) setLogDetail(null)
      else if (detailTarget) setDetailTarget(null)
      else if (showLogsFor) { setShowLogsFor(null); setLogDetail(null) }
      else if (showWizard) setShowWizard(false)
      else if (showActionMenu !== null) setShowActionMenu(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  // Wizard state
  const [recipient, setRecipient] = useState<RecipientType>('both')
  const [filterClientType, setFilterClientType] = useState<ClientType>('tous')
  const [selectedEvent, setSelectedEvent] = useState<AutomatorEvent | null>(null)

  const [agentEmail, setAgentEmail] = useState(true)
  const [agentSms, setAgentSms] = useState(false)
  const [agentApp, setAgentApp] = useState(true)
  const [clientEmail, setClientEmail] = useState(true)
  const [clientSms, setClientSms] = useState(true)
  const [clientApp, setClientApp] = useState(false)

  useEffect(() => {
    api.get<any>('/auth/me').then(setCurrentUser).catch(() => {})
    api.post('/automators/seed').catch(() => {})
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const highlightId = params.get('highlight')
    if (!highlightId || automatorCtx.automators.length === 0) return
    const el = document.querySelector(`[data-automator-id="${highlightId}"]`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('ring-2', 'ring-accent', 'ring-offset-2', 'rounded-xl')
      setTimeout(() => el.classList.remove('ring-2', 'ring-accent', 'ring-offset-2', 'rounded-xl'), 3000)
    }
  }, [automatorCtx.automators])

  const agentName = currentUser
    ? [currentUser.first_name, currentUser.last_name].filter(Boolean).join(' ') || currentUser.email || ''
    : ''

  const myAutomators = useMemo(() => {
    return automatorCtx.automators.filter(a => {
      if (!a.eventId) return false
      const ev = getEventById(a.eventId)
      if (ev?.clientType === 'admin') return false
      if (a.createdBy === agentName) return true
      if (a.delegatedTo === 'all') return true
      if (a.delegatedTo && a.delegatedTo === agentName) return true
      return false
    })
  }, [automatorCtx.automators, agentName])

  const eventsByRecipient = useMemo(() => {
    return EVENTS.filter(e => e.defaultRecipient === recipient)
  }, [recipient])

  const availableClientTypes = useMemo(() => {
    const types = new Set(eventsByRecipient.map(e => e.clientType))
    return CLIENT_TYPE_CONFIG.filter(ct => ct.key === 'tous' || types.has(ct.key))
  }, [eventsByRecipient])

  const filteredEvents = useMemo(() => {
    if (filterClientType === 'tous') return eventsByRecipient
    return eventsByRecipient.filter(e => e.clientType === filterClientType)
  }, [eventsByRecipient, filterClientType])

  const extendedAutomators = useMemo(() => {
    return myAutomators.map(a => {
      const ev = a.eventId ? getEventById(a.eventId) : undefined
      const clientType = ev?.clientType || 'tous'
      const logs = automatorCtx.logs.filter(l => l.automatorId === a.id)
      const recipientType: RecipientType = a.notifications.some(n => n.destinataires.includes('agent'))
        ? a.notifications.some(n => n.destinataires.includes('contact'))
          ? 'both'
          : 'agent'
        : 'client'
      return { ...a, clientType, recipientType, eventLabel: getAutomatorEventName(a), totalRuns: logs.length, successRate: logs.length > 0 ? Math.round((logs.filter(l => l.statut === 'succes').length / logs.length) * 100) : 0 }
    }) as (Automator & { clientType: ClientType; recipientType: RecipientType; eventLabel: string; totalRuns: number; successRate: number })[]
  }, [myAutomators, automatorCtx.logs])

  const filteredAutomators = useMemo(() => {
    return extendedAutomators.filter(a => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!a.eventLabel.toLowerCase().includes(q) && !a.niveauLabel.toLowerCase().includes(q) && !`#${a.id}`.includes(q)) return false
      }
      if (filterStatus === 'actif' && !a.actif) return false
      if (filterStatus === 'inactif' && a.actif) return false
      if (filterCategory !== 'all' && a.clientType !== filterCategory) return false
      if (filterRecipient !== 'all' && a.recipientType !== filterRecipient) return false
      if (filterFrequency !== 'all' && a.frequence !== filterFrequency) return false
      return true
    })
  }, [extendedAutomators, searchQuery, filterStatus, filterCategory, filterRecipient, filterFrequency])

  const recipientCounts = useMemo(() => {
    const counts = { agent: 0, client: 0, both: 0 }
    extendedAutomators.forEach(a => { counts[a.recipientType]++ })
    return counts
  }, [extendedAutomators])

  const frequencyOptions = useMemo(() => {
    return Array.from(new Set(extendedAutomators.map(a => a.frequence)))
  }, [extendedAutomators])

  const startWizard = () => {
    setSelectedEvent(null); setFilterClientType('tous'); setRecipient('both')
    setWizardStep(1); setShowWizard(true)
    setAgentEmail(true); setAgentSms(false); setAgentApp(true)
    setClientEmail(true); setClientSms(true); setClientApp(false)
  }

  const scrollToEvent = (eventId: string) => {
    setTimeout(() => {
      const el = document.querySelector(`[data-event-id="${eventId}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 150)
  }

  const openEditWizard = (a: Automator) => {
    setSelectedEvent(null); setFilterClientType('tous'); setRecipient('both')
    setWizardStep(1); setShowWizard(true)
    setAgentEmail(true); setAgentSms(false); setAgentApp(true)
    setClientEmail(true); setClientSms(true); setClientApp(false)

    const ev = a.eventId ? getEventById(a.eventId) : undefined
    const ext = extendedAutomators.find(x => x.id === a.id)

    if (ext) setRecipient(ext.recipientType)
    if (ev) {
      setFilterClientType(ev.clientType)
      setSelectedEvent(ev)
      scrollToEvent(ev.id)
    }
  }

  const handleRecipientChange = (r: RecipientType) => {
    setRecipient(r)
    setFilterClientType('tous')
    if (selectedEvent && selectedEvent.defaultRecipient !== r) setSelectedEvent(null)
  }

  /* Wizard step direction (drives the slide/blur transition) */
  const wizardDir = useRef(1)
  const goStep = (s: WizardStep) => {
    wizardDir.current = s >= wizardStep ? 1 : -1
    setWizardStep(s)
  }

  const selectEvent = (e: AutomatorEvent) => {
    setSelectedEvent(e)
    goStep(2)
  }

  const recipientIcon = (r: RecipientType) => {
    switch (r) {
      case 'agent': return User
      case 'client': return UserCheck
      case 'both': return Users
    }
  }

  const recipientLabel = (r: RecipientType) => {
    switch (r) {
      case 'agent': return 'Moi uniquement'
      case 'client': return 'Le client uniquement'
      case 'both': return 'Moi et le client'
    }
  }

  /* The backend returns every agent's executions/notifications (global feed).
     Scope everything to this agent's own automations so foreign/admin events
     never surface as phantom "Notifications déclenchées" with zero automations. */
  const myEventIds = useMemo(() => {
    return new Set(myAutomators.map(a => a.eventId).filter(Boolean) as string[])
  }, [myAutomators])

  const myLogs = useMemo(() => {
    const ids = new Set(myAutomators.map(a => a.id))
    return automatorCtx.logs.filter(l => ids.has(l.automatorId))
  }, [automatorCtx.logs, myAutomators])

  const myTriggeredNotifications = useMemo(() => {
    return automatorCtx.triggeredNotifications.filter(n => n.eventId && myEventIds.has(n.eventId))
  }, [automatorCtx.triggeredNotifications, myEventIds])

  const myUnreadCount = useMemo(() => {
    return myTriggeredNotifications.filter(n => !n.read).length
  }, [myTriggeredNotifications])

  const totalExecutions = useMemo(() => myLogs.length, [myLogs])

  const successRate = useMemo(() => {
    if (myLogs.length > 0) {
      return Math.round((myLogs.filter(l => l.statut === 'succes').length / myLogs.length) * 100)
    }
    return 0
  }, [myLogs])

  const executionChartData = useMemo(() => {
    const days: { jour: string; succes: number; echec: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dayStr = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
      const dayFull = d.toISOString().slice(0, 10)
      const logs = automatorCtx.logs.filter(l => {
        const lDate = l.executeLe.slice(0, 10)
        return lDate === dayFull && myAutomators.some(a => a.id === l.automatorId)
      })
      days.push({
        jour: dayStr,
        succes: logs.filter(l => l.statut === 'succes').length,
        echec: logs.filter(l => l.statut === 'echec').length,
      })
    }
    return days
  }, [myAutomators, automatorCtx.logs])

  const categoryChartData = useMemo(() => {
    const counts: Record<string, number> = {}
    extendedAutomators.forEach(a => {
      const cfg = CLIENT_TYPE_CONFIG.find(c => c.key === a.clientType)
      const label = cfg?.label || a.clientType
      counts[label] = (counts[label] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [extendedAutomators])

  return (
    <Stage theme={theme}>
      <div className="space-y-6 animate-fade-in smooth-scroll">
      {/* Hero header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
            </span>
            <p className={heroText.eyebrow}>Mission control · Automator</p>
          </div>
          <h1 className={`mt-1 text-3xl font-extrabold tracking-tight ${heroText.title}`}>Automator</h1>
          <p className={`mt-0.5 ${heroText.sub}`}>Automatisez vos actions récurrentes</p>
        </div>
        <div className="flex items-center gap-2.5">
          {agentName && <StageBadge variant="violet"><span className="inline-flex items-center gap-1.5"><Users size={11} />{agentName}</span></StageBadge>}
          <StageButton variant="primary" size="md" onClick={startWizard} icon={<Plus size={15} />}>
            Nouvel automator
          </StageButton>
        </div>
      </div>

      {/* Stat orbs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StageStatCard icon={Zap} label="Total automators" value={myAutomators.length} hue={STAGE_HUES.violet} delay={0} />
        <StageStatCard icon={CheckCircle} label="Automators actifs" value={myAutomators.filter(a => a.actif).length} hue={activeHue} delay={0.06} />
        <StageStatCard icon={BarChart2} label="Exécutions totales" value={totalExecutions} hue={STAGE_HUES.sky} spark={executionChartData.map(d => d.succes + d.echec)} delay={0.12} />
        <StageStatCard icon={Activity} label="Taux de succès" value={successRate} suffix="%" hue={STAGE_HUES.amber} delay={0.18} />
      </div>

      {/* Dashboard Row — live activity (left) + config stack (right) */}
      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
        <StagePanel title="Évolution des exécutions" icon={TrendingUp} hue={activeHue} badge={<StageBadge variant="neutral" style={{ color: activeHue.line, backgroundColor: `${activeHue.line}1F`, borderColor: `${activeHue.line}4D` }}>7 derniers jours</StageBadge>} className="h-full" outerClassName="flex-1">
          <StageAreaChart
            data={executionChartData.map(d => ({ label: d.jour, succes: d.succes, echec: d.echec }))}
            series={[
              { dataKey: 'succes', name: 'Succès', hue: STAGE_HUES.emerald },
              { dataKey: 'echec', name: 'Échec', hue: STAGE_HUES.fuchsia },
            ]}
            height={220}
          />
        </StagePanel>

          {/* Notifications déclenchées — scoped to my automations only, live activity feed */}
          {myTriggeredNotifications.length > 0 && (
          <StagePanel
            title="Notifications déclenchées"
            icon={Bell}
            hue={STAGE_HUES.fuchsia}
            badge={<StageBadge variant="warn">{myUnreadCount > 0 ? myUnreadCount : myTriggeredNotifications.length}</StageBadge>}
            action={myUnreadCount > 0 ? (
              <StageButton variant="glass" size="sm" onClick={() => { myTriggeredNotifications.filter(n => !n.read).forEach(n => automatorCtx.markAsRead(n.id)) }}>
                Tout marquer lu
              </StageButton>
            ) : undefined}
          >
            <div className="scrollbar-thin space-y-2 overflow-y-auto" style={{ maxHeight: 260 }}>
              {myTriggeredNotifications.map((n, i) => {
                const chHue = n.channel === 'email' ? STAGE_HUES.sky : STAGE_HUES.fuchsia
                return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.25) }}
                  onClick={() => {
                    if (n.channel !== 'email') return
                    automatorCtx.markAsRead(n.id)
                    if (n.emailHtml) {
                      setPreviewChannel('email')
                      setEmailPreviewHtml(n.emailHtml)
                      setEmailPreviewTitle(n.title)
                    }
                  }}
                  className={`flex items-start gap-3 rounded-2xl border p-3 transition-colors duration-200 ${
                    n.channel === 'email' ? 'cursor-pointer' : ''
                  } ${isDark
                    ? n.read ? 'border-white/[0.06] bg-white/[0.02]' : 'border-white/[0.09] bg-white/[0.05] hover:bg-white/[0.07]'
                    : n.read ? 'border-teal-900/[0.07] bg-teal-900/[0.02]' : 'border-teal-900/[0.1] bg-white/70 hover:bg-white'}`}
                  style={n.read ? undefined : { boxShadow: `inset 3px 0 0 ${chHue.line}55` }}
                >
                  <OrbIcon icon={n.channel === 'email' ? Mail : Bell} hue={chHue} size={34} radius={11} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-xs font-bold tracking-[-0.1px] ${isDark ? 'text-white' : 'text-slate-900'}`}>{n.title}</span>
                      <span
                        className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-1.5 py-px text-[9px] font-bold"
                        style={{ color: chHue.line, borderColor: `${chHue.line}44`, backgroundColor: `${chHue.line}14` }}
                      >
                        {n.channel === 'email' ? <Mail size={8} /> : <Smartphone size={8} />}
                        {n.channel === 'email' ? 'Email' : 'CRM'}
                      </span>
                      {n.clientNom && (
                        <StageBadge variant="violet">{n.clientNom}</StageBadge>
                      )}
                      {n.clientType && n.clientType !== 'admin' && (
                        <StageBadge variant="neutral">{n.clientType}</StageBadge>
                      )}
                      {n.eventId === 'admin_nouvelle_propriete_ajoutee' && (
                        <StageBadge variant="warn">Propriété</StageBadge>
                      )}
                      {!n.read && <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: chHue.line, boxShadow: `0 0 8px ${chHue.glow}` }} />}
                    </div>
                    {n.channel === 'crm' && n.eventId === 'admin_nouvelle_propriete_ajoutee' ? (
                      <p className={`mt-0.5 text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-teal-900/60'}`}>{n.message}</p>
                    ) : n.channel === 'crm' ? (
                      <div className={`mt-1.5 flex items-center gap-2 text-[11px] ${isDark ? 'text-slate-400' : 'text-teal-900/60'}`}>
                        <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: chHue.line }} />
                        {n.clientNom} &middot; {n.clientType} &middot; {n.bienTitre}
                      </div>
                    ) : (
                      <p className={`mt-0.5 line-clamp-2 whitespace-pre-line text-[11px] ${isDark ? 'text-slate-400' : 'text-teal-900/60'}`}>{n.message}</p>
                    )}
                    <span className={`mt-1 block text-[10px] font-medium ${isDark ? 'text-slate-500' : 'text-teal-900/40'}`}>
                      {new Date(n.dateTriggered).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      {n.channel === 'email' && n.emailHtml ? ` · Cliquer pour voir l'email` : ''}
                    </span>
                  </div>
                </motion.div>
                )
              })}
            </div>
          </StagePanel>
          )}
        </div>
        <StagePanel title="Répartition par catégorie" icon={BarChart2} hue={STAGE_HUES.violet} badge={<StageBadge variant="violet">{myAutomators.length} automations</StageBadge>} className="h-full">
          {categoryChartData.length > 0 ? (
            <>
              <StageDonut3D
                slices={categoryChartData.map((c, i) => ({ name: c.name, value: c.value, hue: AUTO_HUES[i % AUTO_HUES.length] }))}
                centerValue={String(myAutomators.length)}
                centerLabel="Automations"
                size={250}
                thickness={22}
              />
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {categoryChartData.map((entry, i) => (
                  <div key={entry.name} className={`flex items-center gap-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: AUTO_HUES[i % AUTO_HUES.length].line, boxShadow: `0 0 8px ${AUTO_HUES[i % AUTO_HUES.length].glow}` }} />
                    <span className="truncate">{entry.name}</span>
                    <span className={`ml-auto font-bold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>{entry.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className={`flex h-[210px] items-center justify-center text-xs ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}>Aucune donnée</div>
          )}
        </StagePanel>

      </div>

      {/* Message preview modal */}
      {typeof document !== 'undefined' && createPortal(portalScope(
        <AnimatePresence>
          {emailPreviewHtml && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
              onClick={() => { setEmailPreviewHtml(null); setPreviewChannel('email') }}>
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }}
                onClick={e => e.stopPropagation()}
                className="pop-glass flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl">
                <div className={`flex items-center justify-between border-b px-5 py-4 ${isDark ? 'border-white/[0.07]' : 'border-teal-900/10'}`}>
                  <div className="flex min-w-0 items-center gap-3">
                    <OrbIcon icon={previewChannel === 'email' ? Mail : Bell} hue={previewChannel === 'email' ? STAGE_HUES.sky : STAGE_HUES.fuchsia} size={36} radius={12} />
                    <div className="min-w-0">
                      <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}>Aperçu {previewChannel === 'email' ? "de l'email" : 'CRM'}</p>
                      <p className={`mt-0.5 truncate text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{emailPreviewTitle}</p>
                    </div>
                  </div>
                  <button onClick={() => { setEmailPreviewHtml(null); setPreviewChannel('email') }} aria-label="Fermer l'aperçu"
                    className={`rounded-lg p-1.5 transition-all ${isDark ? 'text-slate-500 hover:bg-white/[0.07] hover:text-slate-200' : 'text-teal-900/35 hover:bg-teal-900/[0.06] hover:text-teal-900/70'}`}>
                    <X size={16} />
                  </button>
                </div>
                <div className="scrollbar-thin flex-1 overflow-y-auto p-4">
                  <div className="overflow-hidden rounded-2xl border border-white/20 bg-white">
                    <iframe
                      srcDoc={emailPreviewHtml}
                      className="w-full border-0"
                      style={{ minHeight: '500px' }}
                      title="Aperçu du message"
                    />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>),
        document.body,
      )}

      {/* Destinataires summary bar */}
      <div className="stage-glass px-5 py-3">
        <div className={`flex flex-wrap items-center gap-4 text-xs ${isDark ? 'text-slate-400' : 'text-teal-900/60'}`}>
          <span className={`flex items-center gap-1.5 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}><Users size={13} style={{ color: STAGE_HUES.violet.line }} /> Destinataires :</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STAGE_HUES.sky.line, boxShadow: `0 0 8px ${STAGE_HUES.sky.glow}` }} />
            Agent (<span className="font-bold tabular-nums">{recipientCounts.agent}</span>)
          </span>
          <span className={`h-3 w-px ${isDark ? 'bg-white/10' : 'bg-teal-900/10'}`} />
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STAGE_HUES.emerald.line, boxShadow: `0 0 8px ${STAGE_HUES.emerald.glow}` }} />
            Client (<span className="font-bold tabular-nums">{recipientCounts.client}</span>)
          </span>
          <span className={`h-3 w-px ${isDark ? 'bg-white/10' : 'bg-teal-900/10'}`} />
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STAGE_HUES.fuchsia.line, boxShadow: `0 0 8px ${STAGE_HUES.fuchsia.glow}` }} />
            Agent + Client (<span className="font-bold tabular-nums">{recipientCounts.both}</span>)
          </span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="stage-glass p-5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-teal-900/35'}`} />
            <input type="text" placeholder="Rechercher par modèle, événement, type de client..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className={`h-9 w-full rounded-xl border py-2 pl-9 pr-3 text-sm outline-none transition-all duration-200 ${
                isDark
                  ? 'border-white/10 bg-white/[0.06] text-slate-100 placeholder:text-slate-500 focus:border-violet-400/70 focus:shadow-[0_0_0_3px_rgba(124,92,255,0.28)]'
                  : 'border-teal-900/15 bg-white text-teal-950 placeholder:text-teal-900/35 focus:border-teal-500/70 focus:shadow-[0_0_0_3px_rgba(20,184,166,0.25)]'
              }`} />
          </div>
          <Select
            options={[
              { value: 'all', label: 'Tous les types' },
              ...CLIENT_TYPE_CONFIG.filter(ct => ct.key !== 'tous').map(ct => ({ value: ct.key, label: ct.label })),
            ]}
            value={filterCategory}
            onValueChange={v => setFilterCategory(v as ClientType | 'all')}
            className="w-36"
          />
          <Select
            options={[
              { value: 'all', label: 'Tous les statuts' },
              { value: 'actif', label: 'Actif' },
              { value: 'inactif', label: 'Inactif' },
            ]}
            value={filterStatus}
            onValueChange={v => setFilterStatus(v as 'all' | 'actif' | 'inactif')}
            className="w-36"
          />
          <Select
            options={[
              { value: 'all', label: 'Tous les destinataires' },
              { value: 'agent', label: 'Agent' },
              { value: 'client', label: 'Client' },
              { value: 'both', label: 'Agent + Client' },
            ]}
            value={filterRecipient}
            onValueChange={v => setFilterRecipient(v as 'all' | RecipientType)}
            className="w-40"
          />
          <Select
            options={[
              { value: 'all', label: 'Toutes les fréquences' },
              ...frequencyOptions.map(f => ({ value: f, label: f })),
            ]}
            value={filterFrequency}
            onValueChange={setFilterFrequency}
            className="w-36"
          />
          <button onClick={() => { setSearchQuery(''); setFilterStatus('all'); setFilterCategory('all'); setFilterRecipient('all'); setFilterFrequency('all') }}
            className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white' : 'border-teal-900/10 bg-white/70 text-teal-900/60 hover:bg-white hover:text-teal-900'}`}>
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Automations Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <OrbIcon icon={Zap} hue={STAGE_HUES.violet} size={34} radius={11} />
            <p className={`text-[15px] font-bold tracking-[-0.2px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Mes automations
            </p>
            <StageBadge variant="violet">{filteredAutomators.length}</StageBadge>
          </div>
          <StageButton variant="primary" size="sm" onClick={startWizard} icon={<Plus size={14} />}>Nouvel automator</StageButton>
        </div>
        {filteredAutomators.length === 0 ? (
          <div className="stage-glass p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <OrbIcon icon={Zap} hue={STAGE_HUES.violet} size={52} radius={16} />
              <p className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Aucune automation</p>
              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}>Créez votre première automation pour recevoir des notifications.</p>
              <StageButton variant="glass" size="sm" onClick={startWizard} icon={<Plus size={14} />}>Créer un automator</StageButton>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredAutomators.map((a, i) => {
              const ev = a.eventId ? getEventById(a.eventId) : undefined
              const evCat = ev?.clientType === 'contacts' ? 'contacts' : 'contrats'
              const CatIcon = CATEGORIE_ICONS[evCat] || Zap
              const ctConfig = CLIENT_TYPE_CONFIG.find(c => c.key === (ev?.clientType || a.clientType))
              const CtIcon = ctConfig?.icon || null
              const dernierLog = automatorCtx.logs.filter(l => l.automatorId === a.id).sort((x, y) => new Date(y.executeLe).getTime() - new Date(x.executeLe).getTime())[0]
              const execResultOk = dernierLog?.statut === 'succes'
              const execResultFail = dernierLog?.statut === 'echec'
              const activeNotifs = a.notifications.filter(n => n.actif)
              const rHue = a.recipientType === 'client' ? STAGE_HUES.emerald : a.recipientType === 'both' ? STAGE_HUES.violet : STAGE_HUES.sky
              return (
                <motion.div key={a.id} data-automator-id={a.id}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-20px' }}
                  whileHover={{ y: -4, transition: { duration: 0.25, ease: 'easeOut' } }}
                  transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.3) }}
                  className="stage-glass group relative overflow-hidden rounded-2xl transition-[background-color,border-color,box-shadow] duration-300"
                  style={a.actif ? { boxShadow: `inset 3px 0 0 ${STAGE_HUES.emerald.line}66` } : undefined}>
                  {/* recipient accent beam */}
                  <span aria-hidden="true" className="pointer-events-none absolute inset-x-8 top-0 z-10 h-[2px] rounded-full opacity-70 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ background: `linear-gradient(90deg, transparent, ${rHue.line}, transparent)`, boxShadow: `0 0 12px ${rHue.glow}` }} />
                  {/* Card header */}
                  <div className="px-4 pb-3 pt-4">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className={a.actif ? '' : 'opacity-50 saturate-50'}>
                          <OrbIcon icon={CatIcon} hue={STAGE_HUES.violet} size={38} radius={12} />
                        </span>
                        <div className="min-w-0">
                          <p className={`truncate text-sm font-bold tracking-[-0.1px] ${isDark ? 'text-white' : 'text-slate-900'}`}>{getAutomatorEventName(a)}</p>
                          <p className={`font-mono text-[10px] ${isDark ? 'text-slate-500' : 'text-teal-900/40'}`}>#{a.id}</p>
                        </div>
                      </div>
                      <button onClick={() => setShowActionMenu(showActionMenu === (a as Automator).id ? null : (a as Automator).id)}
                        className={`flex-shrink-0 rounded-lg p-1 opacity-0 transition-all group-hover:opacity-100 ${isDark ? 'text-slate-500 hover:bg-white/[0.07] hover:text-slate-200' : 'text-teal-900/35 hover:bg-teal-900/[0.06] hover:text-teal-900/70'}`}>
                        <MoreVertical size={14} />
                      </button>
                    </div>
                    {/* Event description */}
                    <p className={`mb-3 text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-teal-900/60'}`}>{a.eventLabel}</p>
                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Category/Client type badge */}
                      <StageBadge variant="neutral">
                        <span className="inline-flex items-center gap-1">
                          {CtIcon && <CtIcon size={9} />}
                          {ctConfig?.label || '—'}
                        </span>
                      </StageBadge>
                      {/* Recipient badge */}
                      <StageBadge variant={a.recipientType === 'client' ? 'ok' : a.recipientType === 'both' ? 'violet' : 'neutral'}>
                        {a.recipientType === 'agent' ? 'Agent' : a.recipientType === 'client' ? 'Client' : 'Agent + Client'}
                      </StageBadge>
                      {a.delegationType && (
                        <StageBadge variant="warn">
                          <span className="inline-flex items-center gap-1">
                            <UserCheck size={9} />
                            Délégué{a.delegatedBy ? ` par ${a.delegatedBy}` : ''}
                          </span>
                        </StageBadge>
                      )}
                    </div>
                  </div>
                  {/* Channel badges */}
                  <div className="px-4 pb-3">
                    <div className="flex items-center gap-1.5">
                      {activeNotifs.length > 0 ? activeNotifs.map((n, ni) => {
                        const DotIcon = CANAL_ICONES[n.canal].icon
                        const canalLabel = n.canal === 'email' ? 'Email'
                          : n.canal === 'application_mobile' && n.destinataires.some(d => d === 'agent') ? 'CRM Square Immo'
                          : n.canal === 'application_mobile' ? 'Squaremeter web app'
                          : n.canal === 'sms' ? 'SMS'
                          : 'CRM Square Immo'
                        return (
                          <span key={ni} className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-semibold ${isDark ? 'border-white/10 bg-white/[0.05] text-slate-300' : 'border-teal-900/10 bg-white/70 text-teal-900/70'}`}>
                            <DotIcon size={9} />
                            {canalLabel}
                          </span>
                        )
                      }) : (
                        <span className={`text-[10px] ${isDark ? 'text-slate-600' : 'text-teal-900/30'}`}>Aucun canal actif</span>
                      )}
                    </div>
                  </div>
                  {/* Divider */}
                  <div className={`mx-4 h-px ${isDark ? 'bg-white/[0.07]' : 'bg-teal-900/10'}`} />
                  {/* Footer: status + execution + actions */}
                  <div className="flex items-center justify-between gap-2 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {/* Status */}
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${a.actif ? 'bg-emerald-400' : isDark ? 'bg-slate-600' : 'bg-slate-300'}`} style={a.actif ? { boxShadow: '0 0 8px rgba(52,211,153,0.9)' } : undefined} />
                        <span className={`text-[11px] font-bold ${a.actif ? (isDark ? 'text-emerald-300' : 'text-emerald-600') : (isDark ? 'text-slate-500' : 'text-teal-900/40')}`}>
                          {a.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                      <span className={`h-3 w-px ${isDark ? 'bg-white/10' : 'bg-teal-900/10'}`} />
                      {/* Frequency */}
                      <span className={`truncate text-[10px] font-medium ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}>{a.frequence}</span>
                    </div>
                    {/* Last execution */}
                    <div className="flex flex-shrink-0 items-center gap-1.5">
                      {dernierLog ? (
                        <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${execResultOk ? (isDark ? 'text-emerald-300' : 'text-emerald-600') : execResultFail ? (isDark ? 'text-rose-300' : 'text-red-500') : (isDark ? 'text-amber-300' : 'text-amber-600')}`}>
                          {execResultOk ? <CheckCircle size={10} /> : execResultFail ? <XCircle size={10} /> : <Clock size={10} />}
                          {LOG_STATUT_LABELS[dernierLog.statut]}
                        </span>
                      ) : (
                        <span className={`text-[10px] ${isDark ? 'text-slate-600' : 'text-teal-900/30'}`}>—</span>
                      )}
                    </div>
                  </div>
                  {/* Action buttons — smooth reveal on hover / keyboard focus */}
                  <div className="grid grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity] duration-300 ease-out group-hover:grid-rows-[1fr] group-hover:opacity-100 group-focus-within:grid-rows-[1fr] group-focus-within:opacity-100">
                    <div className="overflow-hidden">
                    <div className={`flex translate-y-2 items-center gap-1.5 border-t px-4 pb-3 pt-2.5 transition-all duration-300 group-hover:translate-y-0 group-focus-within:translate-y-0 ${isDark ? 'border-white/[0.07]' : 'border-teal-900/10'}`}>
                      <button onClick={() => setDetailTarget(a)} className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold transition-all ${isDark ? 'border-white/10 text-slate-400 hover:bg-white/[0.06] hover:text-white' : 'border-teal-900/10 text-teal-900/60 hover:bg-white hover:text-teal-900'}`}>
                        <Eye size={11} /> Détail
                      </button>
                      <button onClick={() => setShowLogsFor(a)} className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold transition-all ${isDark ? 'border-white/10 text-slate-400 hover:bg-white/[0.06] hover:text-white' : 'border-teal-900/10 text-teal-900/60 hover:bg-white hover:text-teal-900'}`}>
                        <BarChart2 size={11} /> Logs
                      </button>
                      <button onClick={() => openEditWizard(a)} className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold transition-all ${isDark ? 'border-white/10 text-slate-400 hover:bg-white/[0.06] hover:text-white' : 'border-teal-900/10 text-teal-900/60 hover:bg-white hover:text-teal-900'}`}>
                        <Edit3 size={11} /> Modifier
                      </button>
                      <div className="flex-1" />
                      <button onClick={() => setDeleteTarget((a as Automator).id)} aria-label="Supprimer" className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold transition-all ${isDark ? 'border-rose-400/25 text-rose-300 hover:bg-rose-500/10' : 'border-red-200 text-red-500 hover:bg-red-50'}`}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                    </div>
                  </div>
                  {/* Action menu modal */}
                  {typeof document !== 'undefined' && showActionMenu === (a as Automator).id && createPortal(portalScope(
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                      onClick={() => setShowActionMenu(null)}>
                      <motion.div initial={{ opacity: 0, scale: 0.94, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        onClick={e => e.stopPropagation()}
                        className="pop-glass w-full max-w-sm overflow-hidden rounded-3xl">
                        <div className={`flex items-center justify-between border-b px-5 py-4 ${isDark ? 'border-white/[0.07]' : 'border-teal-900/10'}`}>
                          <div className="flex min-w-0 items-center gap-3">
                            <OrbIcon icon={Zap} hue={wizardHue} size={34} radius={11} />
                            <div className="min-w-0">
                              <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}>Automation #{a.id}</p>
                              <p className={`truncate text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{getAutomatorEventName(a)}</p>
                            </div>
                          </div>
                          <button onClick={() => setShowActionMenu(null)} aria-label="Fermer"
                            className={`rounded-lg p-1.5 transition-all ${isDark ? 'text-slate-500 hover:bg-white/[0.07] hover:text-slate-200' : 'text-teal-900/35 hover:bg-teal-900/[0.06] hover:text-teal-900/70'}`}>
                            <X size={16} />
                          </button>
                        </div>
                        <div className="space-y-3 p-4">
                          <div>
                            <p className={`mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}><Edit3 size={11} /> Gestion</p>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { label: 'Modifier', icon: Activity, fn: () => { setShowActionMenu(null); openEditWizard(a) } },
                                { label: 'Détail', icon: Eye, fn: () => { setShowActionMenu(null); setDetailTarget(a) } },
                              ].map(b => (
                                <button key={b.label} onClick={b.fn}
                                  className={`flex flex-col items-center gap-1.5 rounded-2xl border px-3 py-3 transition-all active:scale-95 ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]' : 'border-teal-900/10 bg-white/70 text-teal-950 hover:bg-white'}`}>
                                  <b.icon size={16} style={{ color: wizardHue.line }} />
                                  <span className="text-[11px] font-bold">{b.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className={`mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}><Zap size={11} /> Exécution</p>
                            <div className="grid grid-cols-2 gap-2">
                              <button onClick={() => { automatorCtx.toggleAutomator((a as Automator).id); setShowActionMenu(null) }}
                                className={`flex flex-col items-center gap-1.5 rounded-2xl border px-3 py-3 transition-all active:scale-95 ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]' : 'border-teal-900/10 bg-white/70 text-teal-950 hover:bg-white'}`}>
                                <ToggleLeft size={16} style={{ color: STAGE_HUES.emerald.line }} />
                                <span className="text-[11px] font-bold">{a.actif ? 'Désactiver' : 'Activer'}</span>
                              </button>
                              <button onClick={() => { setShowActionMenu(null); setShowLogsFor(a); setLogDetail(null) }}
                                className={`flex flex-col items-center gap-1.5 rounded-2xl border px-3 py-3 transition-all active:scale-95 ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]' : 'border-teal-900/10 bg-white/70 text-teal-950 hover:bg-white'}`}>
                                <BarChart2 size={16} style={{ color: STAGE_HUES.sky.line }} />
                                <span className="text-[11px] font-bold">Logs</span>
                              </button>
                            </div>
                          </div>
                          <div>
                            <p className={`mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}><AlertTriangle size={11} /> Risques</p>
                            <button onClick={() => { setDeleteTarget((a as Automator).id); setShowActionMenu(null) }}
                              className={`flex w-full items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-xs font-bold transition-all active:scale-95 ${isDark ? 'border-rose-400/25 text-rose-300 hover:bg-rose-500/10' : 'border-red-200 text-red-500 hover:bg-red-50'}`}>
                              <Trash2 size={14} />
                              Supprimer définitivement
                            </button>
                          </div>
                        </div>
                        <div className={`flex items-center gap-3 border-t px-5 py-3 text-[10px] ${isDark ? 'border-white/[0.07] bg-white/[0.02] text-slate-500' : 'border-teal-900/10 bg-white/50 text-teal-900/50'}`}>
                          <span className="truncate"><span className="font-bold">Dest :</span> {a.recipientType === 'agent' ? 'Agent' : a.recipientType === 'client' ? 'Client' : 'Agent + Client'}</span>
                          <span className={`h-3 w-px shrink-0 ${isDark ? 'bg-white/10' : 'bg-teal-900/10'}`} />
                          <span className="truncate"><span className="font-bold">Événement :</span> {a.eventLabel}</span>
                        </div>
                      </motion.div>
                    </motion.div>),
                    document.body,
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
        {/* Summary bar */}
        <div className="stage-glass px-5 py-3">
          <div className={`flex items-center justify-between text-xs ${isDark ? 'text-slate-400' : 'text-teal-900/60'}`}>
            <div className="flex items-center gap-4">
              <span><span className={`font-bold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>{filteredAutomators.length}</span> automation{filteredAutomators.length > 1 ? 's' : ''}</span>
              <span className={`h-3 w-px ${isDark ? 'bg-white/10' : 'bg-teal-900/10'}`} />
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 8px rgba(52,211,153,0.9)' }} /><span className="font-bold tabular-nums">{filteredAutomators.filter(a => a.actif).length}</span> actif{filteredAutomators.filter(a => a.actif).length > 1 ? 's' : ''}</span>
              <span className={`h-3 w-px ${isDark ? 'bg-white/10' : 'bg-teal-900/10'}`} />
              <span className="flex items-center gap-1.5"><BarChart2 size={11} /><span className="font-bold tabular-nums">{totalExecutions}</span> exécutions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="stage-glass px-5 py-3">
        <div className={`flex flex-wrap items-center gap-x-6 gap-y-2 text-xs ${isDark ? 'text-slate-400' : 'text-teal-900/60'}`}>
          <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Légende :</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: STAGE_HUES.sky.line }} /> Agent</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: STAGE_HUES.emerald.line }} /> Client</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: STAGE_HUES.fuchsia.line }} /> Agent + Client</span>
          <span className={`h-3 w-px ${isDark ? 'bg-white/10' : 'bg-teal-900/10'}`} />
          {CLIENT_TYPE_CONFIG.filter(ct => ct.key !== 'tous').map(ct => {
            const Icon = ct.icon
            return (
              <span key={ct.key} className="inline-flex items-center gap-1.5">
                <Icon size={11} style={{ color: STAGE_HUES.violet.line }} /> {ct.label}
              </span>
            )
          })}
          <span className={`h-3 w-px ${isDark ? 'bg-white/10' : 'bg-teal-900/10'}`} />
          <span className="inline-flex items-center gap-1.5"><CheckCircle size={10} className={isDark ? 'text-emerald-300' : 'text-emerald-600'} /> Succès</span>
          <span className="inline-flex items-center gap-1.5"><XCircle size={10} className={isDark ? 'text-rose-300' : 'text-red-500'} /> Échec</span>
          <span className="inline-flex items-center gap-1.5"><Clock size={10} className={isDark ? 'text-amber-300' : 'text-amber-600'} /> En attente</span>
        </div>
      </div>

      {/* Wizard modal */}
      {typeof document !== 'undefined' && createPortal(portalScope(
        <MotionConfig reducedMotion="user">
        <AnimatePresence>
          {showWizard && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9990] flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-[5vh] backdrop-blur-sm"
              onClick={() => setShowWizard(false)}>
              <motion.div
                initial={{ opacity: 0, y: 36, scale: 0.93, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: 22, scale: 0.95, filter: 'blur(6px)' }}
                transition={{ type: 'spring', stiffness: 280, damping: 30 }}
                onClick={e => e.stopPropagation()}
                className="pop-glass max-h-[90vh] w-full max-w-3xl overflow-y-auto scrollbar-thin rounded-3xl">
                {/* Wizard header */}
                <div className={`flex items-center justify-between gap-3 border-b px-6 py-4 ${isDark ? 'border-white/[0.07]' : 'border-teal-900/10'}`}>
                  <div className="flex min-w-0 items-center gap-3">
                    <OrbIcon icon={Zap} hue={wizardHue} size={38} radius={12} />
                    <div className="min-w-0">
                      <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}>Nouvel automator</p>
                      <div className="mt-1 flex items-center gap-1.5 text-xs">
                        {(['Déclencheur', 'Notifications', 'Synthèse'] as const).map((label, idx) => {
                          const step = (idx + 1) as WizardStep
                          const done = wizardStep > step
                          const current = wizardStep === step
                          return (
                            <span key={label} className="flex items-center gap-1.5">
                              {idx > 0 && <ChevronRight size={12} className={isDark ? 'text-slate-600' : 'text-teal-900/30'} />}
                              <span
                                className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-extrabold"
                                style={done || current
                                  ? { backgroundImage: `linear-gradient(145deg, ${wizardHue.a}, ${wizardHue.b})`, color: '#fff', boxShadow: `0 0 14px ${wizardHue.glow}` }
                                  : { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)', color: isDark ? '#64748b' : 'rgba(15,23,42,0.4)' }}
                              >
                                {done ? <Check size={11} strokeWidth={3} /> : step}
                              </span>
                              <span className={`hidden font-semibold sm:inline ${current ? (isDark ? 'text-white' : 'text-slate-900') : (isDark ? 'text-slate-500' : 'text-teal-900/45')}`}>{label}</span>
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setShowWizard(false)} aria-label="Fermer l'assistant"
                    className={`shrink-0 rounded-lg p-1.5 transition-all ${isDark ? 'text-slate-500 hover:bg-white/[0.07] hover:text-slate-200' : 'text-teal-900/35 hover:bg-teal-900/[0.06] hover:text-teal-900/70'}`}><X size={16} /></button>
                </div>
                {/* Step progress beam */}
                <div className="h-[3px] w-full" style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.08)' }}>
                  <motion.div
                    className="h-full rounded-r-full"
                    style={{ backgroundImage: `linear-gradient(90deg, ${wizardHue.b}, ${wizardHue.a})`, boxShadow: `0 0 12px ${wizardHue.glow}` }}
                    initial={false}
                    animate={{ width: `${(wizardStep / 3) * 100}%` }}
                    transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                  />
                </div>

              <div className="overflow-hidden p-6">
                <AnimatePresence mode="wait" custom={wizardDir.current} initial={false}>
                  <motion.div
                    key={wizardStep}
                    custom={wizardDir.current}
                    variants={WIZARD_STEP_VARIANTS}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  >
                {/* ═══ STEP 1: Trigger & Recipient ═══ */}
                {wizardStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className={`mb-1 flex items-center gap-2 text-base font-extrabold tracking-[-0.2px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        <Zap size={18} style={{ color: wizardHue.line }} />
                        Choisissez le déclencheur et le destinataire
                      </h2>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-teal-900/55'}`}>Configurez l'événement qui déclenchera l'automation et qui recevra la notification</p>
                    </div>

                    {/* Recipient selection */}
                    <div>
                      <p className={`mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] ${isDark ? 'text-slate-400/85' : 'text-teal-900/55'}`}>
                        <Send size={13} /> Destinataire
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        {(['agent', 'client', 'both'] as RecipientType[]).map((r, ri) => {
                          const Icon = recipientIcon(r)
                          const isSelected = recipient === r
                          return (
                            <motion.button key={r} onClick={() => handleRecipientChange(r)}
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              whileTap={{ scale: 0.98 }}
                              transition={{ duration: 0.35, delay: 0.15 + ri * 0.07, ease: [0.22, 1, 0.36, 1] }}
                              className={`rounded-2xl border p-3 text-left transition-colors ${
                                isDark
                                  ? isSelected ? 'border-violet-400/50 bg-violet-500/[0.12]' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                                  : isSelected ? 'border-teal-500/50 bg-teal-500/[0.08]' : 'border-teal-900/10 bg-white/70 hover:bg-white'
                              }`}
                              style={isSelected ? { boxShadow: `0 0 20px -6px ${wizardHue.glow}, inset 0 1px 0 rgba(255,255,255,${isDark ? '0.08' : '0.7'})` } : undefined}>
                              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl text-white"
                                style={isSelected
                                  ? { backgroundImage: `linear-gradient(145deg, ${wizardHue.a}, ${wizardHue.b})`, boxShadow: `0 6px 16px -6px ${wizardHue.glow}` }
                                  : { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)', color: isDark ? '#94a3b8' : 'rgba(15,23,42,0.45)' }}>
                                <Icon size={16} />
                              </div>
                              <p className={`text-xs font-bold ${isSelected ? (isDark ? 'text-white' : 'text-teal-900') : (isDark ? 'text-slate-300' : 'text-slate-600')}`}>{recipientLabel(r)}</p>
                              <p className={`mt-0.5 text-[10px] ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}>
                                {r === 'agent' ? 'Notification interne' : r === 'client' ? 'Notification client' : 'Les deux'}
                              </p>
                            </motion.button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Category filter */}
                    <div>
                      <p className={`mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] ${isDark ? 'text-slate-400/85' : 'text-teal-900/55'}`}>
                        <Sliders size={13} /> Catégorie d'événement
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {availableClientTypes.map((ct, ci) => {
                          const Icon = ct.icon
                          const isActive = filterClientType === ct.key
                          return (
                            <motion.button key={ct.key} onClick={() => setFilterClientType(ct.key)}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              whileTap={{ scale: 0.95 }}
                              transition={{ duration: 0.3, delay: 0.2 + ci * 0.03, ease: [0.22, 1, 0.36, 1] }}
                              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                                isActive ? 'border border-white/20 text-white' : (isDark ? 'border border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white' : 'border border-teal-900/10 bg-white/70 text-teal-900/60 hover:bg-white hover:text-teal-900')
                              }`}
                              style={isActive ? { backgroundImage: `linear-gradient(145deg, ${wizardHue.a}, ${wizardHue.b})`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35), 0 8px 20px -8px ${wizardHue.glow}` } : undefined}>
                              <Icon size={13} />
                              {ct.label}
                            </motion.button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Events list */}
                    <div>
                      <p className={`mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] ${isDark ? 'text-slate-400/85' : 'text-teal-900/55'}`}>
                        <Activity size={13} /> Événements disponibles
                        <StageBadge variant="neutral">{filteredEvents.length}</StageBadge>
                      </p>
                      <div className="scrollbar-thin max-h-64 space-y-2 overflow-y-auto pr-1 events-scroll-container">
                        {filteredEvents.map((evt, ei) => {
                          const isSelected = selectedEvent?.id === evt.id
                          return (
                            <motion.button key={evt.id} data-event-id={evt.id} onClick={() => selectEvent(evt)}
                              initial={{ opacity: 0, x: -12 }}
                              animate={{ opacity: 1, x: 0 }}
                              whileTap={{ scale: 0.99 }}
                              transition={{ duration: 0.3, delay: 0.25 + Math.min(ei * 0.05, 0.4), ease: [0.22, 1, 0.36, 1] }}
                              className={`w-full rounded-2xl border p-3 text-left transition-colors ${
                                isSelected
                                  ? (isDark ? 'border-violet-400/50 bg-violet-500/[0.12]' : 'border-teal-500/50 bg-teal-500/[0.08]')
                                  : (isDark ? 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]' : 'border-teal-900/10 bg-white/70 hover:bg-white')
                              }`}
                              style={isSelected ? { boxShadow: `0 0 20px -8px ${wizardHue.glow}` } : undefined}>
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <p className={`flex items-center gap-1.5 text-sm font-bold ${isSelected ? (isDark ? 'text-white' : 'text-teal-900') : (isDark ? 'text-slate-200' : 'text-slate-700')}`}>
                                    <Activity size={13} style={{ color: isSelected ? wizardHue.line : undefined }} className={isSelected ? '' : (isDark ? 'text-slate-500' : 'text-teal-900/40')} />
                                    {evt.label}
                                  </p>
                                  <p className={`mt-0.5 text-xs ${isDark ? 'text-slate-500' : 'text-teal-900/50'}`}>{evt.description}</p>
                                </div>
                                <StageBadge variant={evt.defaultRecipient === 'client' ? 'ok' : evt.defaultRecipient === 'both' ? 'violet' : 'neutral'}>
                                  {recipientLabel(evt.defaultRecipient)}
                                </StageBadge>
                              </div>
                            </motion.button>
                          )
                        })}
                        {filteredEvents.length === 0 && (
                          <div className={`py-8 text-center text-xs ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}>
                            Aucun événement disponible pour cette combinaison
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={`flex justify-between border-t pt-4 ${isDark ? 'border-white/[0.07]' : 'border-teal-900/10'}`}>
                      <StageButton variant="glass" size="sm" onClick={() => setShowWizard(false)}>Annuler</StageButton>
                      <span className={`self-center text-[11px] ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}>Sélectionnez un événement pour continuer</span>
                    </div>
                  </div>
                )}

                {/* ═══ STEP 2: Notification configuration ═══ */}
                {wizardStep === 2 && selectedEvent && (
                  <div className="space-y-6">
                    <div>
                      <h2 className={`mb-1 flex items-center gap-2 text-base font-extrabold tracking-[-0.2px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        <Bell size={18} style={{ color: STAGE_HUES.sky.line }} />
                        Configurez les notifications
                      </h2>
                      <div className={`flex items-center gap-3 rounded-2xl border px-3 py-2 text-xs ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-300' : 'border-teal-900/10 bg-white/70 text-teal-950'}`}>
                        <span className="font-bold">{selectedEvent.label}</span>
                        <span className={`h-3 w-px ${isDark ? 'bg-white/10' : 'bg-teal-900/10'}`} />
                        <span className="inline-flex items-center gap-1 font-semibold">
                          {(() => { const Icon = recipientIcon(recipient); return <Icon size={12} /> })()}
                          {recipientLabel(recipient)}
                        </span>
                      </div>
                    </div>

                    {/* Agent notification section */}
                    {(recipient === 'agent' || recipient === 'both') && (
                      <div className={`rounded-2xl border p-5 ${isDark ? 'border-sky-400/20 bg-sky-400/[0.06]' : 'border-sky-500/20 bg-sky-500/[0.05]'}`}>
                        <div className="mb-4 flex items-center gap-2">
                          <OrbIcon icon={User} hue={STAGE_HUES.sky} size={30} radius={10} />
                          <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Notification pour l'agent</p>
                        </div>

                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center gap-2 text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}><Bell size={13} style={{ color: STAGE_HUES.sky.line }} /> Canaux :</span>
                            {[
                              { key: 'agentEmail', label: 'Email', icon: Mail, state: agentEmail, setter: setAgentEmail },
                              { key: 'agentCrm', label: 'CRM Square Immo', icon: Smartphone, state: agentSms, setter: setAgentSms },
                            ].map(ch => (
                              <button key={ch.key} onClick={() => ch.setter(!ch.state)}
                                className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold transition-all active:scale-95 ${
                                  ch.state ? 'border-white/20 text-white' : (isDark ? 'border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/[0.08]' : 'border-teal-900/10 bg-white/70 text-teal-900/60 hover:bg-white')
                                }`}
                                style={ch.state ? { backgroundImage: `linear-gradient(145deg, ${STAGE_HUES.sky.a}, ${STAGE_HUES.sky.b})`, boxShadow: `0 6px 16px -8px ${STAGE_HUES.sky.glow}` } : undefined}>
                                <ch.icon size={12} />
                                {ch.label}
                              </button>
                            ))}
                          </div>

                          {agentEmail && (
                            <div>
                              <p className={`mb-1 flex items-center gap-1 text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-teal-900/55'}`}><Mail size={10} /> Message email :</p>
                              <div className={`whitespace-pre-line rounded-xl border p-3 font-mono text-xs leading-relaxed ${isDark ? 'border-white/10 bg-black/20 text-slate-200' : 'border-teal-900/10 bg-white text-slate-700'}`}>
                                {selectedEvent.agentTemplate.emailMessage}
                              </div>
                            </div>
                          )}
                          {agentSms && (
                            <div>
                              <p className={`mb-1 flex items-center gap-1 text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-teal-900/55'}`}><Smartphone size={10} /> Notification CRM :</p>
                              <div className={`whitespace-pre-line rounded-xl border p-3 text-xs leading-relaxed ${isDark ? 'border-white/10 bg-black/20 text-slate-200' : 'border-teal-900/10 bg-white text-slate-700'}`}>
                                {selectedEvent.agentTemplate.smsMessage}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Client notification section */}
                    {(recipient === 'client' || recipient === 'both') && (
                      <div className={`rounded-2xl border p-5 ${isDark ? 'border-emerald-400/20 bg-emerald-400/[0.06]' : 'border-emerald-500/20 bg-emerald-500/[0.05]'}`}>
                        <div className="mb-4 flex items-center gap-2">
                          <OrbIcon icon={UserCheck} hue={STAGE_HUES.emerald} size={30} radius={10} />
                          <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Notification pour le client</p>
                        </div>

                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center gap-2 text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}><Bell size={13} style={{ color: STAGE_HUES.emerald.line }} /> Canaux :</span>
                            {[
                              { key: 'clientEmail', label: 'Email', icon: Mail, state: clientEmail, setter: setClientEmail },
                              { key: 'clientWebapp', label: 'Squaremeter web app', icon: Eye, state: clientSms, setter: setClientSms },
                            ].map(ch => (
                              <button key={ch.key} onClick={() => ch.setter(!ch.state)}
                                className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold transition-all active:scale-95 ${
                                  ch.state ? 'border-white/20 text-white' : (isDark ? 'border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/[0.08]' : 'border-teal-900/10 bg-white/70 text-teal-900/60 hover:bg-white')
                                }`}
                                style={ch.state ? { backgroundImage: `linear-gradient(145deg, ${STAGE_HUES.emerald.a}, ${STAGE_HUES.emerald.b})`, boxShadow: `0 6px 16px -8px ${STAGE_HUES.emerald.glow}` } : undefined}>
                                <ch.icon size={12} />
                                {ch.label}
                              </button>
                            ))}
                          </div>

                          {recipient === 'both' && selectedEvent.clientTemplate && clientEmail && (
                            <div>
                              <p className={`mb-1 flex items-center gap-1 text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-teal-900/55'}`}><Mail size={10} /> Message email pour le client :</p>
                              <div className={`whitespace-pre-line rounded-xl border p-3 font-mono text-xs leading-relaxed ${isDark ? 'border-white/10 bg-black/20 text-slate-200' : 'border-teal-900/10 bg-white text-slate-700'}`}>
                                {selectedEvent.clientTemplate.emailMessage}
                              </div>
                            </div>
                          )}
                          {recipient === 'both' && selectedEvent.clientTemplate && clientSms && (
                            <div>
                              <p className={`mb-1 flex items-center gap-1 text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-teal-900/55'}`}><Eye size={10} /> Notification app mobile :</p>
                              <div className={`whitespace-pre-line rounded-xl border p-3 text-xs leading-relaxed ${isDark ? 'border-white/10 bg-black/20 text-slate-200' : 'border-teal-900/10 bg-white text-slate-700'}`}>
                                {selectedEvent.clientTemplate.smsMessage}
                              </div>
                            </div>
                          )}
                          {recipient === 'client' && clientEmail && (
                            <div>
                              <p className={`mb-1 flex items-center gap-1 text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-teal-900/55'}`}><Mail size={10} /> Message email :</p>
                              <div className={`whitespace-pre-line rounded-xl border p-3 font-mono text-xs leading-relaxed ${isDark ? 'border-white/10 bg-black/20 text-slate-200' : 'border-teal-900/10 bg-white text-slate-700'}`}>
                                {selectedEvent.clientTemplate?.emailMessage || selectedEvent.agentTemplate.emailMessage}
                              </div>
                            </div>
                          )}
                          {recipient === 'client' && clientSms && (
                            <div>
                              <p className={`mb-1 flex items-center gap-1 text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-teal-900/55'}`}><Eye size={10} /> Notification app mobile :</p>
                              <div className={`whitespace-pre-line rounded-xl border p-3 text-xs leading-relaxed ${isDark ? 'border-white/10 bg-black/20 text-slate-200' : 'border-teal-900/10 bg-white text-slate-700'}`}>
                                {selectedEvent.clientTemplate?.smsMessage || selectedEvent.agentTemplate.smsMessage}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className={`flex justify-between border-t pt-4 ${isDark ? 'border-white/[0.07]' : 'border-teal-900/10'}`}>
                      <StageButton variant="glass" size="sm" onClick={() => goStep(1)} icon={<ChevronLeft size={14} />}>Précédent</StageButton>
                      <div className="flex gap-2">
                        <StageButton variant="glass" size="sm" onClick={() => setShowWizard(false)}>Annuler</StageButton>
                        <StageButton variant="primary" size="sm" onClick={() => goStep(3)}>Suivant <ChevronRight size={14} /></StageButton>
                      </div>
                    </div>
                  </div>
                )}

                {/* ═══ STEP 3: Summary ═══ */}
                {wizardStep === 3 && selectedEvent && (
                  <div className="space-y-6">
                    <div>
                      <h2 className={`mb-1 flex items-center gap-2 text-base font-extrabold tracking-[-0.2px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        <BookOpen size={18} style={{ color: STAGE_HUES.amber.line }} />
                        Récapitulatif
                      </h2>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-teal-900/55'}`}>Vérifiez les paramètres avant d'ajouter l'automation</p>
                    </div>

                    <div className={`space-y-3 rounded-2xl border p-5 ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-teal-900/10 bg-white/60'}`}>
                      <p className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] ${isDark ? 'text-slate-400/85' : 'text-teal-900/55'}`}>
                        <Sliders size={13} /> Synthèse
                      </p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className={`rounded-xl border p-3 ${isDark ? 'border-white/10 bg-white/[0.04]' : 'border-teal-900/10 bg-white'}`}>
                          <p className={`mb-1 text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}>Événement</p>
                          <p className={`flex items-center gap-1.5 text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            <Activity size={12} style={{ color: wizardHue.line }} />
                            {selectedEvent.label}
                          </p>
                        </div>
                        <div className={`rounded-xl border p-3 ${isDark ? 'border-white/10 bg-white/[0.04]' : 'border-teal-900/10 bg-white'}`}>
                          <p className={`mb-1 text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}>Destinataire</p>
                          <p className={`flex items-center gap-1.5 text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {(() => { const Icon = recipientIcon(recipient); return <Icon size={12} style={{ color: wizardHue.line }} /> })()}
                            {recipientLabel(recipient)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {(recipient === 'agent' || recipient === 'both') && (
                          <div className={`rounded-xl border p-3 ${isDark ? 'border-white/10 bg-white/[0.04]' : 'border-teal-900/10 bg-white'}`}>
                            <p className={`mb-2 flex items-center gap-1 text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}>
                              <User size={11} /> Notification agent
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {[
                                { label: 'Email', state: agentEmail },
                                { label: 'CRM Square Immo', state: agentSms },
                              ].map(ch => (
                                <StageBadge key={ch.label} variant={ch.state ? 'violet' : 'neutral'}>
                                  {ch.label}
                                </StageBadge>
                              ))}
                            </div>
                          </div>
                        )}
                        {(recipient === 'client' || recipient === 'both') && (
                          <div className={`rounded-xl border p-3 ${isDark ? 'border-white/10 bg-white/[0.04]' : 'border-teal-900/10 bg-white'}`}>
                            <p className={`mb-2 flex items-center gap-1 text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}>
                              <UserCheck size={11} /> Notification client
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {[
                                { label: 'Email', state: clientEmail },
                                { label: 'Squaremeter web app', state: clientSms },
                              ].map(ch => (
                                <StageBadge key={ch.label} variant={ch.state ? 'ok' : 'neutral'}>
                                  {ch.label}
                                </StageBadge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Email preview */}
                    {recipient !== 'agent' && selectedEvent.clientTemplate && (
                      <div className={`rounded-2xl border p-5 ${isDark ? 'border-violet-400/25 bg-violet-500/[0.08]' : 'border-violet-500/25 bg-violet-500/[0.06]'}`}>
                        <p className={`mb-3 flex items-center gap-1.5 text-xs font-bold ${isDark ? 'text-violet-200' : 'text-violet-700'}`}>
                          <Mail size={13} /> Aperçu de l'email pour le client
                        </p>
                        <p className={`mb-2 text-[11px] font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Objet : {selectedEvent.clientTemplate.emailObjet.replace('{{client.prenom}}', 'Jean').replace('{{client.nom}}', 'Dupont')}</p>
                        <div className={`whitespace-pre-line rounded-xl border p-3 text-xs leading-relaxed ${isDark ? 'border-white/10 bg-black/20 text-slate-200' : 'border-teal-900/10 bg-white text-slate-700'}`}>
                          {selectedEvent.clientTemplate.emailMessage
                            .replace(/\{\{client\.prenom\}\}/g, 'Jean')
                            .replace(/\{\{client\.nom\}\}/g, 'Dupont')
                            .replace(/\{\{bien\.titre\}\}/g, 'Ma Villa Mediterraneenne')
                            .replace(/\{\{bien\.prix\}\}/g, '2 500 000')
                            .replace(/\{\{bien\.surface\}\}/g, '420')
                            .replace(/\{\{bien\.pieces\}\}/g, '6')
                            .replace(/\{\{bien\.chambres\}\}/g, '5')
                            .replace(/\{\{bien\.adresse\}\}/g, '12 Rue de la Liberte, Casablanca')
                            .replace(/\{\{score\}\}/g, '92')
                            .replace(/\{\{lien_client\}\}/g, 'https://espace.squaremeter.ma/bien/123')
                            .replace(/\{\{visite\.date\}\}/g, '15/06/2026')
                            .replace(/\{\{visite\.heure\}\}/g, '14h30')
                            .replace(/\{\{rdv\.date\}\}/g, '15/06/2026')
                            .replace(/\{\{rdv\.heure\}\}/g, '14h30')
                            .replace(/\{\{rdv\.adresse\}\}/g, '12 Rue de la Liberte, Casablanca')
                            .replace(/\{\{rdv\.sujet\}\}/g, 'Visite villa')
                          }
                        </div>
                      </div>
                    )}

                    <div className={`flex justify-between border-t pt-4 ${isDark ? 'border-white/[0.07]' : 'border-teal-900/10'}`}>
                      <StageButton variant="glass" size="sm" onClick={() => goStep(2)} icon={<ChevronLeft size={14} />}>Précédent</StageButton>
                      <div className="flex gap-2">
                        <StageButton variant="glass" size="sm" onClick={() => setShowWizard(false)}>Annuler</StageButton>
                        <StageButton variant="primary" size="sm" onClick={() => {
                          if (!selectedEvent) return
                          const notifications: AddAutomatorInput['notifications'] = []
                          if (recipient === 'agent' || recipient === 'both') {
                            if (agentEmail) notifications.push({ canal: 'email', actif: true, langue: 'fr', messageTemplate: selectedEvent.agentTemplate.emailMessage, destinataires: ['agent'] })
                            if (agentSms) notifications.push({ canal: 'application_mobile', actif: true, langue: 'fr', messageTemplate: selectedEvent.agentTemplate.smsMessage, destinataires: ['agent'] })
                          }
                          if (recipient === 'client' || recipient === 'both') {
                            if (clientEmail && selectedEvent.clientTemplate) notifications.push({ canal: 'email', actif: true, langue: 'fr', messageTemplate: selectedEvent.clientTemplate.emailMessage, destinataires: ['contact'] })
                            if (clientSms && selectedEvent.clientTemplate) notifications.push({ canal: 'application_mobile', actif: true, langue: 'fr', messageTemplate: selectedEvent.clientTemplate.smsMessage, destinataires: ['contact'] })
                          }
                          automatorCtx.addAutomator({
                            modeleId: 0,
                            eventId: selectedEvent.id,
                            niveau: 'utilisateur',
                            niveauLabel: agentName || 'Agent',
                            createdBy: agentName || 'Agent',
                            actif: true,
                            frequence: 'À chaque événement',
                            notifications,
                          })
                          setShowWizard(false)
                          setWizardStep(1)
                          setSelectedEvent(null)
                        }}>AJOUTER L'AUTOMATOR</StageButton>
                      </div>
                    </div>
                  </div>
                )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>
        </MotionConfig>),
        document.body,
      )}

      {/* Logs modal */}
      {typeof document !== 'undefined' && createPortal(portalScope(
        <AnimatePresence>
          {showLogsFor && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9990] flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
              onClick={() => { setShowLogsFor(null); setLogDetail(null) }}>
              <motion.div initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.96 }}
                onClick={e => e.stopPropagation()}
                className="pop-glass relative max-h-[80vh] w-full max-w-3xl overflow-y-auto scrollbar-thin rounded-3xl">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-10 top-0 z-10 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${STAGE_HUES.sky.line}66, ${STAGE_HUES.sky.line}33, transparent)` }}
                />
                <div className={`flex items-center justify-between gap-3 border-b px-6 py-4 ${isDark ? 'border-white/[0.07]' : 'border-teal-900/10'}`}>
                  <div className="flex min-w-0 items-center gap-3">
                    <OrbIcon icon={BarChart2} hue={STAGE_HUES.sky} size={36} radius={12} />
                    <h2 className={`truncate text-base font-extrabold tracking-[-0.2px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Logs d'exécution &mdash; #{showLogsFor.id}
                    </h2>
                  </div>
                  <button onClick={() => { setShowLogsFor(null); setLogDetail(null) }} aria-label="Fermer les logs"
                    className={`shrink-0 rounded-lg p-1.5 transition-all ${isDark ? 'text-slate-500 hover:bg-white/[0.07] hover:text-slate-200' : 'text-teal-900/35 hover:bg-teal-900/[0.06] hover:text-teal-900/70'}`}><X size={16} /></button>
                </div>
                <div className="space-y-5 p-6">
                  {automatorCtx.logs.some((l: any) => l.automatorId === showLogsFor.id) ? (
                <div className={`overflow-x-auto rounded-2xl border ${isDark ? 'border-white/10' : 'border-teal-900/10'}`}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className={`text-[11px] ${isDark ? 'border-b border-white/10 bg-white/[0.04]' : 'border-b border-teal-900/10 bg-teal-900/[0.04]'}`}>
                          <th className={`px-3 py-2 text-left font-bold ${isDark ? 'text-slate-400' : 'text-teal-900/55'}`}>Date</th>
                          <th className={`px-3 py-2 text-left font-bold ${isDark ? 'text-slate-400' : 'text-teal-900/55'}`}>Événement</th>
                          <th className={`px-3 py-2 text-left font-bold ${isDark ? 'text-slate-400' : 'text-teal-900/55'}`}>Destinataire</th>
                          <th className={`px-3 py-2 text-left font-bold ${isDark ? 'text-slate-400' : 'text-teal-900/55'}`}>Statut</th>
                          <th className={`px-3 py-2 text-right font-bold ${isDark ? 'text-slate-400' : 'text-teal-900/55'}`}>Détails</th>
                        </tr>
                      </thead>
                      <tbody className={isDark ? 'divide-y divide-white/[0.06]' : 'divide-y divide-teal-900/[0.07]'}>
                        {automatorCtx.logs.filter((l: any) => l.automatorId === showLogsFor.id).map(log => (
                          <tr key={log.id} className={`transition-colors ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-teal-900/[0.03]'}`}>
                            <td className={`whitespace-nowrap px-3 py-2 text-xs tabular-nums ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                              {new Date(log.executeLe).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </td>
                            <td className={`px-3 py-2 text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{log.evenement}</td>
                            <td className={`px-3 py-2 text-xs ${isDark ? 'text-slate-400' : 'text-teal-900/60'}`}>{log.destinataire}</td>
                            <td className="px-3 py-2">
                              <span className={`inline-flex items-center gap-1 text-xs font-bold ${log.statut === 'succes' ? (isDark ? 'text-emerald-300' : 'text-emerald-600') : log.statut === 'echec' ? (isDark ? 'text-rose-300' : 'text-red-600') : (isDark ? 'text-amber-300' : 'text-amber-600')}`}>
                                {log.statut === 'succes' ? <CheckCircle size={12} /> : log.statut === 'echec' ? <XCircle size={12} /> : <Clock size={12} />}
                                {LOG_STATUT_LABELS[log.statut]}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right">
                              <button onClick={() => setLogDetail(logDetail?.id === log.id ? null : log)}
                                className={`rounded-lg border px-2 py-1 text-[10px] font-semibold transition-all ${isDark ? 'border-white/10 text-slate-400 hover:bg-white/[0.06] hover:text-white' : 'border-teal-900/10 text-teal-900/60 hover:bg-white hover:text-teal-900'}`}>
                                Détails
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-10 text-center">
                    <OrbIcon icon={BarChart2} hue={STAGE_HUES.sky} size={48} radius={15} />
                    <p className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Aucune exécution enregistrée</p>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}>Les exécutions de cette automation apparaîtront ici.</p>
                  </div>
                )}
                  {logDetail && (
                    <div className={`space-y-2 rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-teal-900/10 bg-white/60'}`}>
                      <p className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Détail de l'exécution</p>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div><span className={isDark ? 'text-slate-500' : 'text-teal-900/45'}>Date :</span> <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{new Date(logDetail.executeLe).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span></div>
                        <div><span className={isDark ? 'text-slate-500' : 'text-teal-900/45'}>Automator :</span> <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>#{showLogsFor.id} &mdash; {getAutomatorEventName(showLogsFor)}</span></div>
                        <div><span className={isDark ? 'text-slate-500' : 'text-teal-900/45'}>Événement :</span> <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{logDetail.evenement}</span></div>
                        <div><span className={isDark ? 'text-slate-500' : 'text-teal-900/45'}>Destinataire :</span> <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{logDetail.destinataire}</span></div>
                      </div>
                      <div className={`border-t pt-2 ${isDark ? 'border-white/[0.07]' : 'border-teal-900/10'}`}>
                        <p className={`mb-1 text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-teal-900/55'}`}>Notifications envoyées :</p>
                        <div className={`whitespace-pre-line rounded-xl border p-2 font-mono text-xs ${isDark ? 'border-white/10 bg-black/20 text-slate-200' : 'border-teal-900/10 bg-white text-slate-700'}`}>
                          {logDetail.contenu || '—'}
                        </div>
                      </div>
                      {logDetail.messageErreur && (
                        <div className={`rounded-xl border p-2 text-xs font-semibold ${isDark ? 'border-rose-400/25 bg-rose-500/10 text-rose-300' : 'border-red-200 bg-red-50 text-red-600'}`}>
                          Erreur : {logDetail.messageErreur}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>),
        document.body,
      )}

      {/* Detail modal */}
      {typeof document !== 'undefined' && createPortal(portalScope(
        <AnimatePresence>
          {detailTarget && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9990] flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-[6vh] backdrop-blur-sm"
              onClick={() => { setDetailTarget(null) }}>
              <motion.div
                initial={{ opacity: 0, y: 36, scale: 0.93, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: 22, scale: 0.95, filter: 'blur(6px)' }}
                transition={{ type: 'spring', stiffness: 280, damping: 30 }}
                onClick={e => e.stopPropagation()}
                className="pop-glass relative max-h-[85vh] w-full max-w-2xl overflow-y-auto scrollbar-thin rounded-3xl">
                {/* Header */}
                <div className={`flex items-center justify-between gap-3 border-b px-6 py-4 ${isDark ? 'border-white/[0.07]' : 'border-teal-900/10'}`}>
                  <div className="flex min-w-0 items-center gap-3">
                    <OrbIcon icon={Eye} hue={STAGE_HUES.violet} size={38} radius={12} />
                    <div className="min-w-0">
                      <h2 className={`truncate text-base font-extrabold tracking-[-0.2px] ${isDark ? 'text-white' : 'text-slate-900'}`}>Détail de l'automator &mdash; #{detailTarget.id}</h2>
                      <p className={`truncate text-xs ${isDark ? 'text-slate-400' : 'text-teal-900/55'}`}>
                        {getAutomatorEventName(detailTarget)}
                        {detailTarget.clientType ? ` (${CLIENT_TYPE_CONFIG.find((c: any) => c.key === detailTarget.clientType)?.label || detailTarget.clientType})` : ''}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setDetailTarget(null)} aria-label="Fermer le détail"
                    className={`shrink-0 rounded-lg p-1.5 transition-all ${isDark ? 'text-slate-500 hover:bg-white/[0.07] hover:text-slate-200' : 'text-teal-900/35 hover:bg-teal-900/[0.06] hover:text-teal-900/70'}`}><X size={16} /></button>
                </div>
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-10 top-0 z-10 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${STAGE_HUES.violet.line}66, ${STAGE_HUES.violet.line}33, transparent)` }}
                />
              <div className="p-6 space-y-6">
                {/* Informations Generales */}
                <div className={`overflow-hidden rounded-2xl border ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-teal-900/10 bg-white/60'}`}>
                  <div className={`flex items-center gap-2 border-b px-5 py-3 ${isDark ? 'border-white/[0.07] bg-white/[0.02]' : 'border-teal-900/[0.08] bg-teal-900/[0.03]'}`}>
                    <OrbIcon icon={FileText} hue={STAGE_HUES.violet} size={26} radius={9} />
                    <p className={`text-[11px] font-bold uppercase tracking-[0.14em] ${isDark ? 'text-slate-400/85' : 'text-teal-900/55'}`}>Informations générales</p>
                  </div>
                  <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                    <div>
                      <p className={`mb-0.5 text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}>Reference</p>
                      <p className={`font-mono font-bold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>#{detailTarget.id}</p>
                    </div>
                    <div>
                      <p className={`mb-0.5 text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}>Statut</p>
                      <div className="flex items-center gap-2">
                        <span className={`inline-block h-2.5 w-2.5 rounded-full ${detailTarget.actif ? 'bg-emerald-400' : isDark ? 'bg-slate-600' : 'bg-slate-300'}`} style={detailTarget.actif ? { boxShadow: '0 0 8px rgba(52,211,153,0.9)' } : undefined} />
                        <span className={`font-bold ${detailTarget.actif ? (isDark ? 'text-emerald-300' : 'text-emerald-600') : (isDark ? 'text-slate-500' : 'text-teal-900/40')}`}>
                          {detailTarget.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className={`mb-0.5 text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}>Modele</p>
                      <p className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{getAutomatorEventName(detailTarget)}</p>
                    </div>
                    <div>
                      <p className={`mb-0.5 text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}>{REAL_CLIENT_TYPES.has(detailTarget.clientType) ? 'Type de client' : 'Catégorie'}</p>
                      <p className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{(() => { const cfg = CLIENT_TYPE_CONFIG.find((c: any) => c.key === detailTarget.clientType); return cfg?.label || '\u2014' })()}</p>
                    </div>
                    <div>
                      <p className={`mb-0.5 text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}>Destinataire</p>
                      <p className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                        {detailTarget.recipientType === 'agent' ? 'Agent uniquement' :
                         detailTarget.recipientType === 'client' ? 'Client uniquement' :
                         detailTarget.recipientType === 'both' ? 'Agent + Client' : '\u2014'}
                      </p>
                    </div>
                    <div>
                      <p className={`mb-0.5 text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}>Frequence</p>
                      <p className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{detailTarget.frequence}</p>
                    </div>
                    <div>
                      <p className={`mb-0.5 text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}>Cree par</p>
                      <p className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{detailTarget.createdBy}</p>
                    </div>
                    <div>
                      <p className={`mb-0.5 text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}>Derniere execution</p>
                      <p className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{detailTarget.derniereExecution ? new Date(detailTarget.derniereExecution).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '\u2014'}</p>
                    </div>
                    <div>
                      <p className={`mb-0.5 text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}>Cree le</p>
                      <p className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{new Date(detailTarget.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div>
                      <p className={`mb-0.5 text-[10px] uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}>Niveau</p>
                      <p className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{detailTarget.niveauLabel}</p>
                    </div>
                  </div>
                </div>

                {/* Notifications */}
                <div className={`overflow-hidden rounded-2xl border ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-teal-900/10 bg-white/60'}`}>
                  <div className={`flex items-center gap-2 border-b px-5 py-3 ${isDark ? 'border-white/[0.07] bg-white/[0.02]' : 'border-teal-900/[0.08] bg-teal-900/[0.03]'}`}>
                    <OrbIcon icon={Bell} hue={STAGE_HUES.fuchsia} size={26} radius={9} />
                    <p className={`text-[11px] font-bold uppercase tracking-[0.14em] ${isDark ? 'text-slate-400/85' : 'text-teal-900/55'}`}>Notifications</p>
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <p className="text-xs font-medium text-text mb-2 flex items-center gap-1.5">
                        <User size={12} className="text-blue-600" />
                        Agent
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        {(['email', 'sms', 'application_mobile'] as NotificationCanal[]).map(canal => {
                          const info = CANAL_ICONES[canal]
                          const Icon = info.icon
                          const notif = detailTarget.notifications.find((n: any) => n.canal === canal && n.destinataires.includes('agent'))
                          const isActive = notif?.actif ?? false
                          return (
                            <div key={canal} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                              isActive ? (isDark ? 'border-violet-400/40 bg-violet-500/[0.10]' : 'border-teal-500/40 bg-teal-500/[0.07]') : (isDark ? 'border-white/10 bg-white/[0.03] text-slate-500' : 'border-teal-900/10 bg-white/60 text-teal-900/40')
                            }`} style={isActive ? { boxShadow: `0 0 14px -6px ${wizardHue.glow}` } : undefined}>
                              <Icon size={13} style={isActive ? { color: wizardHue.line } : undefined} className={isActive ? '' : (isDark ? 'text-slate-600' : 'text-teal-900/30')} />
                              <span className={isActive ? (isDark ? 'text-white' : 'text-slate-900') : ''}>{info.label}</span>
                              <span className="ml-auto">
                                {isActive ? <Check size={11} className={isDark ? 'text-emerald-300' : 'text-emerald-600'} /> : <X size={11} className={isDark ? 'text-slate-600' : 'text-teal-900/25'} />}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    {(detailTarget.recipientType === 'client' || detailTarget.recipientType === 'both') && (
                      <div>
                        <p className="text-xs font-medium text-text mb-2 flex items-center gap-1.5">
                          <UserCheck size={12} className="text-emerald-600" />
                          Client{detailTarget.clientType ? ` (${(() => { const cfg = CLIENT_TYPE_CONFIG.find((c: any) => c.key === detailTarget.clientType); return REAL_CLIENT_TYPES.has(detailTarget.clientType) ? cfg?.label : 'Catégorie : ' + (cfg?.label || detailTarget.clientType) })()})` : ''}
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                          {(['email', 'sms', 'application_mobile'] as NotificationCanal[]).map(canal => {
                            const info = CANAL_ICONES[canal]
                            const Icon = info.icon
                            const notif = detailTarget.notifications.find((n: any) => n.canal === canal && n.destinataires.includes('contact'))
                            const isActive = notif?.actif ?? false
                            return (
                              <div key={canal} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${
                                isActive ? 'bg-accent/5 border-accent/20' : 'bg-background border-border/30 text-text-secondary/50'
                              }`}>
                                <Icon size={13} className={isActive ? 'text-accent' : 'text-text-secondary/40'} />
                                <span className={isActive ? 'text-text' : ''}>{info.label}</span>
                                <span className="ml-auto">
                                  {isActive ? <Check size={11} className="text-emerald-500" /> : <X size={11} className="text-text-secondary/30" />}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Aperçu du message */}
                <div className={`overflow-hidden rounded-2xl border ${isDark ? 'border-violet-400/25 bg-violet-500/[0.07]' : 'border-violet-500/25 bg-violet-500/[0.05]'}`}>
                  <div className={`flex items-center gap-2 border-b px-5 py-3 ${isDark ? 'border-violet-400/20' : 'border-violet-500/20'}`}>
                    <OrbIcon icon={Mail} hue={STAGE_HUES.violet} size={26} radius={9} />
                    <p className={`text-[11px] font-bold uppercase tracking-[0.14em] ${isDark ? 'text-violet-200' : 'text-violet-700'}`}>Aperçu du message (Client)</p>
                  </div>
                  <div className="p-5 space-y-2">
                    <p className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      Objet : {(() => {
                        const notif = detailTarget.notifications.find((n: any) => n.canal === 'email' && n.destinataires.includes('contact'))
                        return notif?.objetTemplate
                          ?.replace(/\{\{_target\.contact\.nom\}\}/g, 'Dupont')
                          ?.replace(/\{\{_target\.contact\.prenom\}\}/g, 'Jean')
                          ?.replace(/\{\{_target\.produit\.titre\}\}/g, 'Ma Villa Mediterraneenne')
                          ?.replace(/\{\{_target\.email\}\}/g, 'jean.dupont@email.com')
                          ?.replace(/\{\{_target\.mot_de_passe_temporaire\}\}/g, 'Temp123!')
                          ?.replace(/\{\{_target\.lien_connexion\}\}/g, 'https://espace.squaremeter.ma')
                          ?.replace(/\{\{_target\.start_at\|date\("d\/m\/Y"\)\}\}/g, '15/06/2026')
                          ?.replace(/\{\{_target\.start_at\|date\("H:i"\)\}\}/g, '14h30')
                          ?.replace(/\{\{_target\.property\.address\}\}/g, '12 Rue de la Liberte')
                          || 'Identifiants extranet Square Meter'
                      })()}
                    </p>
                    <div className={`whitespace-pre-line rounded-xl border p-4 text-xs leading-relaxed ${isDark ? 'border-white/10 bg-black/20 text-slate-200' : 'border-teal-900/10 bg-white text-slate-700'}`}>
                      {(() => {
                        const notif = detailTarget.notifications.find((n: any) => n.canal === 'email' && n.destinataires.includes('contact'))
                        return notif?.messageTemplate
                          ?.replace(/\{\{_target\.contact\.nom\}\}/g, 'Dupont')
                          ?.replace(/\{\{_target\.contact\.prenom\}\}/g, 'Jean')
                          ?.replace(/\{\{_target\.contact\.firstname\}\}/g, 'Jean')
                          ?.replace(/\{\{_target\.produit\.titre\}\}/g, 'Ma Villa Mediterraneenne')
                          ?.replace(/\{\{_target\.email\}\}/g, 'jean.dupont@email.com')
                          ?.replace(/\{\{_target\.mot_de_passe_temporaire\}\}/g, 'Temp123!')
                          ?.replace(/\{\{_target\.lien_connexion\}\}/g, 'https://espace.squaremeter.ma')
                          ?.replace(/\{\{_target\.start_at\|date\("d\/m\/Y"\)\}\}/g, '15/06/2026')
                          ?.replace(/\{\{_target\.start_at\|date\("H:i"\)\}\}/g, '14h30')
                          ?.replace(/\{\{_target\.property\.address\}\}/g, '12 Rue de la Liberte')
                          ?.replace(/\{\{_target\.prospect\.nom\}\}/g, 'Jean Dupont')
                          ?.replace(/\{\{_target\.prospect\.email\}\}/g, 'jean.dupont@email.com')
                          ?.replace(/\{\{_target\.prospect\.origine\}\}/g, 'Site web')
                          ?.replace(/\{\{_target\.agent\.nom\}\}/g, agentName)
                          ?.replace(/\{\{_target\.contact\.age\}\}/g, '35')
                          || 'Message non disponible'
                      })()}
                    </div>
                  </div>
                </div>

                {/* Statistiques d'execution */}
                <div className={`overflow-hidden rounded-2xl border ${isDark ? 'border-white/10 bg-white/[0.03]' : 'border-teal-900/10 bg-white/60'}`}>
                  <div className={`flex items-center gap-2 border-b px-5 py-3 ${isDark ? 'border-white/[0.07] bg-white/[0.02]' : 'border-teal-900/[0.08] bg-teal-900/[0.03]'}`}>
                    <OrbIcon icon={BarChart2} hue={STAGE_HUES.sky} size={26} radius={9} />
                    <p className={`text-[11px] font-bold uppercase tracking-[0.14em] ${isDark ? 'text-slate-400/85' : 'text-teal-900/55'}`}>Statistiques d'exécution</p>
                  </div>
                  <div className="p-5">
                    {(() => {
                      const logs = automatorCtx.logs.filter((l: any) => l.automatorId === detailTarget.id)
                      const total = logs.length
                      const success = logs.filter((l: any) => l.statut === 'succes').length
                      const failed = logs.filter((l: any) => l.statut === 'echec').length
                      const pending = logs.filter((l: any) => l.statut === 'en_attente').length
                      const rate = total > 0 ? Math.round((success / total) * 100) : 0
                      const lastFail = logs.filter((l: any) => l.statut === 'echec').sort((a: any, b: any) => new Date(b.executeLe).getTime() - new Date(a.executeLe).getTime())[0]
                      return (
                        <div className="space-y-3">
                          <div className="grid grid-cols-4 gap-3">
                            <div className={`rounded-xl border p-3 text-center ${isDark ? 'border-white/10 bg-white/[0.04]' : 'border-teal-900/10 bg-white/70'}`}>
                              <p className={`text-lg font-extrabold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>{total}</p>
                              <p className={`text-[10px] font-semibold ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}>Total</p>
                            </div>
                            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
                              <p className="text-lg font-bold text-emerald-700">{success}</p>
                              <p className="text-[10px] text-emerald-600">Succes</p>
                            </div>
                            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-center">
                              <p className="text-lg font-bold text-red-700">{failed}</p>
                              <p className="text-[10px] text-red-600">Echecs</p>
                            </div>
                            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-center">
                              <p className="text-lg font-bold text-amber-700">{rate}%</p>
                              <p className="text-[10px] text-amber-600">Taux succes</p>
                            </div>
                          </div>
                          {lastFail && (
                            <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200 flex items-center gap-2">
                              <XCircle size={12} />
                              Dernier echec : {new Date(lastFail.executeLe).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} &mdash; {lastFail.messageErreur || 'Erreur inconnue'}
                            </div>
                          )}
                          {pending > 0 && (
                            <div className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200 flex items-center gap-2">
                              <Clock size={12} />
                              {pending} execution{pending > 1 ? 's' : ''} en attente
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                </div>

                <div className="flex justify-end pt-2 gap-2">
                  <StageButton variant="glass" size="sm" onClick={() => { setDetailTarget(null); setShowLogsFor(detailTarget); setLogDetail(null) }} icon={<BarChart2 size={14} />}>Voir les logs</StageButton>
                  <StageButton variant="primary" size="sm" onClick={() => setDetailTarget(null)}>Fermer</StageButton>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>),
        document.body,
      )}

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget !== null) automatorCtx.deleteAutomator(deleteTarget) }}
        title="Supprimer l'automation"
        message={`Êtes-vous sûr de vouloir supprimer définitivement l'automation #${deleteTarget} ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
      />
      </div>
    </Stage>
  )
}
