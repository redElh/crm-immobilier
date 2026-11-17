import { API_ORIGIN } from '../../../utils/config'
import { useState, useMemo, useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getAuthToken } from '../../../utils/auth'
import { AnimatePresence, motion } from 'framer-motion'
import {
  CalendarEvent, CalendarView, EventType, Agent,
  getInitials, getAgentColor,
  eventMatchesSelectedAgents,
} from '../../../types/calendar'
import { getMyEffectivePermissions } from '../../../services/permissionsService'
import {
  Lock, RefreshCw, Plus, Sun, Columns, Grid, Users, X, Zap,
} from 'react-feather'
import {
  STAGE_HUES, OrbIcon, StageButton, StageBadge,
  useStageAccent, type StageHue,
} from '../../dashboard/Stage'
import { AdminStatCard } from '../../dashboard/AdminStatCard'
import { useStageChrome } from './useStageChrome'
import CalendarToolbar from './CalendarToolbar'
import CalendarFilters from './CalendarFilters'
import DayView from './DayView'
import WeekView from './WeekView'
import MonthView from './MonthView'
import AgendaView from './AgendaView'
import TimelineView from './TimelineView'
import EventFormModal from './EventFormModal'
import EventDetailModal from './EventDetailModal'
import DayEventsModal from './DayEventsModal'
import GoogleSyncSettings from './GoogleSyncSettings'
import { useToast } from '../../ui/Toast'
import { fetchCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '../../../services/calendarService'
import { api } from '../../../services/api'

const ALL_EVENT_TYPES: EventType[] = ['administratif', 'apres-vente', 'autre', 'commercial', 'compte-rendu', 'conges', 'estimation', 'etat-des-lieux', 'evenement', 'formation', 'message', 'permanence', 'personnel', 'portes-ouvertes', 'proposition', 'prospection', 'publicite', 'relance', 'rendez-vous', 'sondage', 'validation', 'visite', 'visite-virtuelle']

function isAdminRoute() {
  if (typeof window === 'undefined') return false
  return window.location.pathname.startsWith('/admin')
}

function getRouteUserId() {
  if (typeof window === 'undefined') return ''
  const parts = window.location.pathname.split('/').filter(Boolean)
  if (parts[0] === 'admin' && parts[1]) return parts[1]
  if (parts[0] && /^\d+$/.test(parts[0])) return parts[0]
  return ''
}

function getTodayEventsCount(events: CalendarEvent[]): number {
  const today = new Date()
  return events.filter(e => {
    const start = new Date(e.start)
    return start.getFullYear() === today.getFullYear() &&
      start.getMonth() === today.getMonth() &&
      start.getDate() === today.getDate()
  }).length
}

function getWeekEventsCount(events: CalendarEvent[]): number {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)
  return events.filter(e => {
    const start = new Date(e.start)
    return start >= weekStart && start < weekEnd
  }).length
}

function getMonthEventsCount(events: CalendarEvent[]): number {
  const now = new Date()
  return events.filter(e => {
    const start = new Date(e.start)
    return start.getFullYear() === now.getFullYear() &&
      start.getMonth() === now.getMonth()
  }).length
}

function isLiveEvent(event: CalendarEvent, now = new Date()): boolean {
  if (event.type !== 'rendez-vous' && event.type !== 'compte-rendu' && event.type !== 'visite' && event.type !== 'visite-virtuelle') return false
  return new Date(event.start) <= now && new Date(event.end) >= now
}

function getAgentsInMeeting(events: CalendarEvent[]): number {
  const now = new Date()
  const agentsInMeeting = new Set<string>()
  events.forEach(e => {
    if (!isLiveEvent(e, now)) return
    e.agentIds.forEach(id => agentsInMeeting.add(id))
  })
  return agentsInMeeting.size
}

function countByBucket(events: CalendarEvent[], buckets: number, bucketStart: (date: Date, offset: number) => Date): number[] {
  const now = new Date()
  const counts = new Array(buckets).fill(0)
  events.forEach(e => {
    const start = new Date(e.start)
    if (Number.isNaN(start.getTime())) return
    for (let i = buckets - 1; i >= 0; i--) {
      const from = bucketStart(now, -(buckets - 1 - i))
      const to = bucketStart(now, -(buckets - 2 - i))
      if (start >= from && start < to) {
        counts[i] += 1
        return
      }
    }
  })
  return counts
}

function sparkByDay(events: CalendarEvent[]): number[] {
  return countByBucket(events, 7, (date, offset) => {
    const d = new Date(date)
    d.setDate(d.getDate() + offset)
    d.setHours(0, 0, 0, 0)
    return d
  })
}

function sparkByWeek(events: CalendarEvent[]): number[] {
  return countByBucket(events, 6, (date, offset) => {
    const d = new Date(date)
    const day = (d.getDay() + 6) % 7
    d.setDate(d.getDate() - day + offset * 7)
    d.setHours(0, 0, 0, 0)
    return d
  })
}

function sparkByMonth(events: CalendarEvent[]): number[] {
  return countByBucket(events, 6, (date, offset) => {
    const d = new Date(date.getFullYear(), date.getMonth() + offset, 1)
    return d
  })
}

export default function CalendarPage() {
  const admin = isAdminRoute()
  const { staged, dark } = useStageChrome()
  const accent = useStageAccent()
  const { toast } = useToast()

  const [currentUserName, setCurrentUserName] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string>(getRouteUserId)
  const [currentUserColor, setCurrentUserColor] = useState('')
  const currentAgentId = currentUserId
  useEffect(() => {
    const token = getAuthToken()
    if (!token) return
    fetch(`${API_ORIGIN}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setCurrentUserId(String(data.id))
          setCurrentUserName(`${data.first_name || ''} ${data.last_name || ''}`.trim())
          setCurrentUserColor(data.color || getAgentColor(String(data.id)))
        }
      })
      .catch(() => {})
  }, [])

  const [agents, setAgents] = useState<Agent[]>([])
  useEffect(() => {
    if (!currentUserId) return
    const endpoint = admin ? '/admin/users' : '/messages/users'
    api.get<Array<Record<string, unknown>>>(endpoint)
      .then(users => {
        const list = (users || [])
          .filter(u => {
            const role = String((u.role as string) || '')
            const type = String((u.type as string) || '')
            return ['agent', 'admin', 'gerant'].includes(role) || ['agent', 'admin'].includes(type)
          })
          .map((u) => {
            const name = `${u.first_name || ''} ${u.last_name || ''}`.trim() || (u.name as string) || ''
            const id = String(u.id)
            return {
              id,
              name: name || 'Agent',
              color: (u.color as string) || getAgentColor(id),
              initials: getInitials(name || 'Agent'),
            }
          })
        setAgents(list)
      })
      .catch(() => {})
  }, [admin, currentUserId])

  const allAgents = useMemo(() => {
    if (!currentUserId) return agents
    if (agents.some(a => a.id === currentUserId)) return agents
    return [{
      id: currentUserId,
      name: currentUserName || 'Agent',
      color: currentUserColor || getAgentColor(currentUserId),
      initials: getInitials(currentUserName || 'Agent'),
    }, ...agents]
  }, [currentUserId, currentUserName, currentUserColor, agents])

  const viewAgents = useMemo(() => allAgents, [allAgents])

  const [view, setView] = useState<CalendarView>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [selectedEventTypes, setSelectedEventTypes] = useState<EventType[]>(ALL_EVENT_TYPES)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null)
  const [defaultSlotDate, setDefaultSlotDate] = useState<Date | undefined>()
  const [refreshTick, setRefreshTick] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const handleGoogleSynced = useCallback(() => setRefreshTick(t => t + 1), [])
  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    setRefreshTick(t => t + 1)
    window.setTimeout(() => setRefreshing(false), 700)
  }, [])
  const [dayModalDate, setDayModalDate] = useState<Date | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const [showGoogleSync, setShowGoogleSync] = useState(() => searchParams.get('google') !== null)
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [permissionsLoaded, setPermissionsLoaded] = useState(false)
  const [canReadCalendar, setCanReadCalendar] = useState(true)
  const [canWriteCalendar, setCanWriteCalendar] = useState(true)

  useEffect(() => {
    if (admin) {
      setPermissionsLoaded(true)
      return
    }
    let cancelled = false
    getMyEffectivePermissions()
      .then(perms => {
        if (cancelled) return
        setCanReadCalendar(perms['calendrier-lecture'] !== false)
        setCanWriteCalendar(perms['calendrier-ecriture'] !== false)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setPermissionsLoaded(true) })
    return () => { cancelled = true }
  }, [admin])

  useEffect(() => {
    let cancelled = false
    const load = () =>
      fetchCalendarEvents()
        .then(dbEvents => {
          if (!cancelled) setEvents(dbEvents)
        })
        .catch(() => {})
    load()
    const interval = setInterval(load, 15000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [refreshTick])

  useEffect(() => {
    const eventId = searchParams.get('event')
    if (!eventId) return
    const target = events.find(e => e.id === eventId)
    if (target) {
      setSelectedEvent(target)
      setCurrentDate(new Date(target.start))
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, events, setSearchParams])

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (selectedEventTypes.length > 0 && !selectedEventTypes.includes(e.type)) return false
      if (!eventMatchesSelectedAgents(e, selectedAgents, viewAgents)) return false
      return true
    })
  }, [events, selectedAgents, selectedEventTypes, viewAgents])

  const stats = useMemo(() => ({
    today: getTodayEventsCount(filteredEvents),
    week: getWeekEventsCount(filteredEvents),
    month: getMonthEventsCount(filteredEvents),
    agentsInMeeting: admin ? getAgentsInMeeting(events) : 0,
    live: events.filter(e => isLiveEvent(e)).length,
    total: filteredEvents.length,
  }), [filteredEvents, events, admin])

  const sparks = useMemo(() => ({
    day: sparkByDay(filteredEvents),
    week: sparkByWeek(filteredEvents),
    month: sparkByMonth(filteredEvents),
    today: sparkByDay(events.filter(e => isLiveEvent(e))),
  }), [filteredEvents, events])

  const activeFilterCount = useMemo(() => {
    let n = selectedAgents.length
    if (selectedEventTypes.length !== ALL_EVENT_TYPES.length) n += 1
    return n
  }, [selectedAgents, selectedEventTypes])

  const resetFilters = useCallback(() => {
    setSelectedAgents([])
    setSelectedEventTypes(ALL_EVENT_TYPES)
  }, [])

  const isOwnEvent = useCallback((event: CalendarEvent) => {
    const norm = (s: string) => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase()
    if (event.agentIds.some(id => String(id) === String(currentUserId))) return true
    if (currentUserName && event.createdBy && norm(event.createdBy) === norm(currentUserName)) return true
    return false
  }, [currentUserId, currentUserName])

  const canWriteEvent = useCallback((event: CalendarEvent) => {
    if (admin) return true
    return canWriteCalendar && isOwnEvent(event)
  }, [admin, canWriteCalendar, isOwnEvent])

  const handleSaveEvent = useCallback(async (event: CalendarEvent) => {
    const isExisting = /^\d+$/.test(event.id)
    if (!admin && isExisting && !isOwnEvent(event)) return
    try {
      const saved = isExisting
        ? await updateCalendarEvent(event.id, event)
        : await createCalendarEvent(event)
      setEvents(prev => {
        const idx = prev.findIndex(e => e.id === event.id)
        if (idx >= 0) {
          const copy = [...prev]
          copy[idx] = saved
          return copy
        }
        return [...prev, saved]
      })
      toast('success', isExisting ? 'Événement mis à jour avec succès' : 'Événement créé avec succès')
    } catch {
      toast('error', "Erreur lors de l'enregistrement de l'événement")
    }
  }, [toast])

  const handleEventUpdate = useCallback((event: CalendarEvent) => {
    setEvents(prev => prev.map(e => e.id === event.id ? event : e))
    if (!/^\d+$/.test(event.id)) return
    updateCalendarEvent(event.id, event)
      .then(saved => setEvents(prev => prev.map(e => e.id === event.id ? saved : e)))
      .catch(() => toast('error', "Erreur lors de la mise à jour de l'événement"))
  }, [toast])

  const handleDeleteEvent = useCallback((eventId: string) => {
    const target = events.find(e => e.id === eventId)
    if (!target || !canWriteEvent(target)) return
    setEvents(prev => prev.filter(e => e.id !== eventId))
    setSelectedEvent(null)
    if (/^\d+$/.test(eventId)) {
      deleteCalendarEvent(eventId).catch(() => {
        toast('error', "Erreur lors de la suppression de l'événement")
      })
    }
  }, [canWriteEvent, events, toast])

  const handleEventClick = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event)
  }, [])

  const handleSlotClick = useCallback((date: Date) => {
    if (!canWriteCalendar) return
    setDefaultSlotDate(date)
    setEditEvent(null)
    setFormOpen(true)
  }, [canWriteCalendar])

  const handleAddEvent = useCallback(() => {
    if (!canWriteCalendar) return
    setDefaultSlotDate(undefined)
    setEditEvent(null)
    setFormOpen(true)
  }, [canWriteCalendar])

  const handleEditFromDetail = useCallback((event: CalendarEvent) => {
    if (!canWriteEvent(event)) return
    setEditEvent(event)
    setFormOpen(true)
    setSelectedEvent(null)
  }, [canWriteEvent])

  const handleMonthDayClick = useCallback((date: Date) => {
    setDayModalDate(date)
  }, [])

  const handleWeekDayNameClick = useCallback((date: Date) => {
    setCurrentDate(date)
    setView('day')
  }, [])

  /* Token adapter: sub-views & modals use bg-card/text tokens — flipping the
     `dark` class here makes them follow the Mission Control / Lagoon palette. */
  const statCards: {
    label: string
    value: number
    unit: string
    detail: string
    hue: StageHue
    Icon: typeof Sun
    spark: number[]
    facts: { label: string; value: React.ReactNode }[]
  }[] = [
    {
      label: "Aujourd'hui",
      value: stats.today,
      unit: 'événements',
      detail: `${stats.week} planifiés cette semaine`,
      hue: accent,
      Icon: Sun,
      spark: sparks.day,
      facts: [
        { label: 'Semaine', value: stats.week },
        { label: 'Mois', value: stats.month },
      ],
    },
    {
      label: 'Cette semaine',
      value: stats.week,
      unit: 'événements',
      detail: `${stats.total} visibles avec les filtres`,
      hue: STAGE_HUES.sky,
      Icon: Columns,
      spark: sparks.week,
      facts: [
        { label: "Aujourd'hui", value: stats.today },
        { label: 'En cours', value: stats.live },
      ],
    },
    {
      label: 'Ce mois',
      value: stats.month,
      unit: 'événements',
      detail: 'Vue mensuelle consolidée',
      hue: STAGE_HUES.amber,
      Icon: Grid,
      spark: sparks.month,
      facts: [
        { label: 'Semaine', value: stats.week },
        { label: 'Total', value: stats.total },
      ],
    },
    {
      label: 'En réunion',
      value: stats.agentsInMeeting,
      unit: 'agents',
      detail: 'Rendez-vous & visites en direct',
      hue: STAGE_HUES.emerald,
      Icon: Users,
      spark: sparks.today,
      facts: [
        { label: 'En cours', value: stats.live },
        { label: "Aujourd'hui", value: stats.today },
      ],
    },
  ]

  if (!admin && permissionsLoaded && !canReadCalendar) {
    return (
      <div className="stage-glass mx-auto mt-10 flex max-w-md flex-col items-center rounded-3xl p-10 text-center">
        <OrbIcon icon={Lock} hue={STAGE_HUES.fuchsia} size={56} radius={18} />
        <h2 className={`mt-4 text-lg font-bold tracking-tight ${dark ? 'text-slate-100' : 'text-teal-950'}`}>
          Calendrier inaccessible
        </h2>
        <p className={`mt-1 text-sm ${dark ? 'text-slate-400' : 'text-teal-900/60'}`}>
          Vous n'avez pas la permission de consulter le calendrier. Contactez votre administrateur.
        </p>
      </div>
    )
  }

  const heroEyebrow = staged
    ? dark ? 'text-slate-400' : (admin ? 'text-orange-900/55' : 'text-teal-900/50')
    : 'text-text-secondary'
  const heroSub = staged
    ? dark ? 'text-slate-400' : (admin ? 'text-orange-900/60' : 'text-teal-900/60')
    : 'text-text-secondary'
  const gradientTitle = staged
    ? dark
      ? admin
        ? 'bg-gradient-to-r from-[#F43F5E] via-[#FB7185] to-[#8B7CFF]'
        : 'bg-gradient-to-r from-white via-indigo-100 to-indigo-300'
      : admin
        ? 'bg-gradient-to-r from-[#EA580C] via-[#F97316] to-[#FBBF24]'
        : 'bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-600'
    : 'text-text'
  const googleActiveStyle = showGoogleSync
    ? {
        borderColor: `${accent.a}66`,
        backgroundColor: `${accent.a}1f`,
        color: dark ? accent.a : accent.b,
        boxShadow: `0 0 18px -4px ${accent.glow}, inset 0 1px 0 rgba(255,255,255,0.25)`,
      }
    : undefined

  return (
    <div className={staged && dark ? 'dark' : undefined}>
      <div className="space-y-5">
        {/* ── Hero header ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-wrap items-end justify-between gap-4"
        >
          <div className="min-w-0">
            <p className={`flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[3px] ${heroEyebrow}`}>
              <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Square Immo · Agenda {admin ? '· Espace administrateur' : '· Espace agent'} · Temps réel
            </p>
            <h1 className={`mt-2 text-4xl font-black tracking-[-2px] sm:text-5xl ${staged ? `${gradientTitle} bg-clip-text text-transparent` : gradientTitle}`}>
              CALENDRIER
            </h1>
            <p className={`mt-1.5 max-w-2xl text-sm ${heroSub}`}>
              {stats.today} événement{stats.today !== 1 ? 's' : ''} aujourd'hui · {stats.week} cette semaine · {stats.month} ce mois.
              {admin && stats.agentsInMeeting > 0 && ` ${stats.agentsInMeeting} agent${stats.agentsInMeeting !== 1 ? 's' : ''} en rendez-vous maintenant.`}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <StageBadge variant="ok">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                {stats.live} en cours
              </StageBadge>
              <StageBadge variant="violet">{stats.total} événements affichés</StageBadge>
              {activeFilterCount > 0 && (
                <StageBadge variant="warn">{activeFilterCount} filtre{activeFilterCount !== 1 ? 's' : ''} actif{activeFilterCount !== 1 ? 's' : ''}</StageBadge>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StageButton
              variant="glass"
              size="md"
              icon={<RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              Actualiser
            </StageButton>
            <button
              onClick={() => setShowGoogleSync(!showGoogleSync)}
              title="Synchronisation Google"
              style={googleActiveStyle}
              className={`group relative flex h-9 items-center gap-2 overflow-hidden rounded-xl border px-3 text-xs font-semibold transition-all duration-200 active:scale-[0.97] ${
                !staged
                  ? 'border-border bg-card text-text hover:bg-background'
                  : dark
                    ? 'border-white/12 bg-white/5 text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] hover:bg-white/10 hover:text-white'
                    : admin
                      ? 'border-orange-900/12 bg-white/70 text-orange-900/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] hover:bg-white hover:text-orange-900'
                      : 'border-teal-900/12 bg-white/70 text-teal-900/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] hover:bg-white hover:text-teal-900'
              }`}
            >
              <RefreshCw size={13} className={showGoogleSync ? 'animate-spin' : 'transition-transform duration-500 group-hover:rotate-180'} />
              Google
            </button>
            {canWriteCalendar && (
              staged ? (
                <StageButton variant="primary" size="md" onClick={handleAddEvent} icon={<Plus size={15} />}>
                  Nouvel événement
                </StageButton>
              ) : (
                <button onClick={handleAddEvent} className="btn-primary inline-flex h-9 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold">
                  <Plus size={15} /> Nouvel événement
                </button>
              )
            )}
          </div>
        </motion.div>

        {/* ── Stat deck (admin only) ──────────────────────────────────── */}
        {admin && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map(({ label, value, unit, detail, hue, Icon, spark, facts }, index) => (
              <AdminStatCard
                key={label}
                icon={Icon}
                label={label}
                value={value}
                unit={unit}
                detail={detail}
                hue={hue}
                spark={spark}
                facts={facts}
                delay={index * 0.06}
                action={
                  label === 'En réunion' && value > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-emerald-500">
                      <Zap size={9} /> Live
                    </span>
                  ) : undefined
                }
              />
            ))}
          </div>
        )}

        {/* ── Command bar ─────────────────────────────────────────────── */}
        <CalendarToolbar
          view={view}
          currentDate={currentDate}
          filtersOpen={filtersOpen}
          activeFilterCount={activeFilterCount}
          eventCount={stats.total}
          onToggleFilters={() => setFiltersOpen(o => !o)}
          onViewChange={setView}
          onDateChange={setCurrentDate}
          onToday={() => setCurrentDate(new Date())}
        />

        {/* ── Active filter summary ───────────────────────────────────── */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-[10px] font-bold uppercase tracking-[0.18em] ${staged ? (dark ? 'text-slate-500' : admin ? 'text-orange-900/45' : 'text-teal-900/45') : 'text-text-secondary'}`}>
              Filtres actifs
            </span>
            {selectedAgents.map(id => {
              const agent = viewAgents.find(a => a.id === id)
              if (!agent) return null
              return (
                <span
                  key={id}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${staged ? (dark ? 'border-white/10 bg-white/[0.05] text-slate-300' : 'border-teal-900/10 bg-white/80 text-teal-900/70') : 'border-border bg-card text-text'}`}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: agent.color }} />
                  {agent.name}
                  <button type="button" onClick={() => setSelectedAgents(prev => prev.filter(a => a !== id))} aria-label={`Retirer ${agent.name}`} className="opacity-60 hover:opacity-100">
                    <X size={10} />
                  </button>
                </span>
              )
            })}
            {selectedEventTypes.length !== ALL_EVENT_TYPES.length && (
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${staged ? (dark ? 'border-amber-400/25 bg-amber-400/10 text-amber-300' : 'border-amber-500/30 bg-amber-400/15 text-amber-800') : 'border-border bg-card text-text'}`}>
                <Grid size={10} /> {selectedEventTypes.length} types
              </span>
            )}
            <button
              type="button"
              onClick={resetFilters}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${staged ? (dark ? 'text-slate-400 hover:text-white' : admin ? 'text-orange-800/60 hover:text-orange-900' : 'text-teal-800/60 hover:text-teal-900') : 'text-text-secondary hover:text-text'}`}
            >
              <X size={10} /> Tout effacer
            </button>
          </div>
        )}

        {/* ── Filters rail + views ───────────────────────────────────── */}
        <div className="flex">
          <motion.div
            initial={false}
            animate={{
              width: filtersOpen ? 256 : 0,
              marginRight: filtersOpen ? 16 : 0,
              opacity: filtersOpen ? 1 : 0,
              x: filtersOpen ? 0 : -14,
            }}
            transition={{ type: 'spring', stiffness: 260, damping: 30, mass: 0.9 }}
            className="flex-shrink-0 overflow-hidden"
            style={{ pointerEvents: filtersOpen ? 'auto' : 'none' }}
            aria-hidden={!filtersOpen}
          >
            <div className="w-64 space-y-3 pb-1">
              <CalendarFilters
                selectedAgents={selectedAgents}
                selectedEventTypes={selectedEventTypes}
                onAgentsChange={setSelectedAgents}
                onEventTypesChange={setSelectedEventTypes}
                showAgents
                agents={viewAgents}
              />
              <GoogleSyncSettings isOpen={showGoogleSync} onSynced={handleGoogleSynced} />
            </div>
          </motion.div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.995 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="min-w-0 flex-1"
            >
            {view === 'day' && (
              <DayView
                currentDate={currentDate}
                events={filteredEvents}
                agents={viewAgents}
                onEventClick={handleEventClick}
                onSlotClick={handleSlotClick}
              />
            )}
            {view === 'week' && (
              <WeekView
                currentDate={currentDate}
                events={filteredEvents}
                selectedAgents={selectedAgents}
                selectedEventTypes={selectedEventTypes}
                agents={viewAgents}
                canCreate={canWriteCalendar}
                canEditEvent={canWriteEvent}
                onEventClick={handleEventClick}
                onEventUpdate={handleEventUpdate}
                onSlotClick={handleSlotClick}
                onDayNameClick={handleWeekDayNameClick}
              />
            )}
            {view === 'month' && (
              <MonthView
                currentDate={currentDate}
                events={filteredEvents}
                selectedEventTypes={selectedEventTypes}
                agents={viewAgents}
                onEventClick={handleEventClick}
                onDayClick={handleMonthDayClick}
              />
            )}
            {view === 'agenda' && (
              <AgendaView
                events={filteredEvents}
                selectedAgents={selectedAgents}
                selectedEventTypes={selectedEventTypes}
                agents={viewAgents}
                onEventClick={handleEventClick}
              />
            )}
            {view === 'timeline' && (
              <TimelineView
                currentDate={currentDate}
                events={filteredEvents}
                selectedAgents={selectedAgents}
                selectedEventTypes={selectedEventTypes}
                agents={viewAgents}
                onEventClick={handleEventClick}
              />
            )}
          </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Modals (unchanged behavior) ─────────────────────────────── */}
        <EventFormModal
          isOpen={formOpen}
          onClose={() => { setFormOpen(false); setEditEvent(null) }}
          onSave={handleSaveEvent}
          editEvent={editEvent}
          defaultDate={defaultSlotDate}
          currentAgentId={admin ? undefined : currentAgentId}
          currentAgentName={admin ? undefined : currentUserName}
          agentUserId={admin ? undefined : currentUserId}
          agents={admin ? agents : undefined}
          adminUserId={admin ? currentUserId : undefined}
          adminUserName={admin ? currentUserName : undefined}
        />

        <EventDetailModal
          event={selectedEvent}
          agents={viewAgents}
          onClose={() => setSelectedEvent(null)}
          onEdit={handleEditFromDetail}
          onDelete={handleDeleteEvent}
          canWrite={selectedEvent ? canWriteEvent(selectedEvent) : false}
        />

        <DayEventsModal
          isOpen={dayModalDate !== null}
          date={dayModalDate}
          events={filteredEvents}
          agents={viewAgents}
          onClose={() => setDayModalDate(null)}
          onEventClick={(event) => { setDayModalDate(null); setSelectedEvent(event) }}
        />
      </div>
    </div>
  )
}
