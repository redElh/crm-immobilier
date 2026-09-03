import { API_ORIGIN } from '../../../utils/config'
import { useState, useMemo, useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getAuthToken } from '../../../utils/auth'
import { motion } from 'framer-motion'
import {
  CalendarEvent, CalendarView, EventType, Agent,
  getInitials, getAgentColor,
  eventMatchesSelectedAgents,
} from '../../../types/calendar'
import { getMyEffectivePermissions } from '../../../services/permissionsService'
import {
  Lock, RefreshCw, Plus, Sun, Columns, Grid, Users,
} from 'react-feather'
import { STAGE_HUES, OrbIcon, TiltCard, StageButton } from '../../dashboard/Stage'
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

function getAgentsInMeeting(events: CalendarEvent[]): number {
  const now = new Date()
  const agentsInMeeting = new Set<string>()
  events.forEach(e => {
    if (e.type !== 'rendez-vous' && e.type !== 'compte-rendu' && e.type !== 'visite' && e.type !== 'visite-virtuelle') return
    const start = new Date(e.start)
    const end = new Date(e.end)
    if (start <= now && end >= now) {
      e.agentIds.forEach(id => agentsInMeeting.add(id))
    }
  })
  return agentsInMeeting.size
}

export default function CalendarPage() {
  const admin = isAdminRoute()
  const { staged, dark } = useStageChrome()
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
  const handleGoogleSynced = useCallback(() => setRefreshTick(t => t + 1), [])
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
  }), [filteredEvents, events, admin])

  const activeFilterCount = useMemo(() => {
    let n = selectedAgents.length
    if (selectedEventTypes.length !== ALL_EVENT_TYPES.length) n += 1
    return n
  }, [selectedAgents, selectedEventTypes])

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
  const statCards = [
    { label: "Aujourd'hui", sub: 'événements', value: stats.today, hue: STAGE_HUES.violet, Icon: Sun },
    { label: 'Cette semaine', sub: 'événements', value: stats.week, hue: STAGE_HUES.sky, Icon: Columns },
    { label: 'Ce mois', sub: 'événements', value: stats.month, hue: STAGE_HUES.amber, Icon: Grid },
    { label: 'En réunion', sub: 'agents actuellement', value: stats.agentsInMeeting, hue: STAGE_HUES.emerald, Icon: Users, pulse: true },
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

  const heroText = staged
    ? dark
      ? { eyebrow: 'text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400/80', title: 'bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent', sub: 'text-sm text-slate-400' }
      : { eyebrow: 'text-[10px] font-bold uppercase tracking-[0.24em] text-teal-900/50', title: 'bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-600 bg-clip-text text-transparent', sub: 'text-sm text-teal-900/55' }
    : { eyebrow: 'text-[10px] font-bold uppercase tracking-[0.24em] text-text-secondary', title: 'text-text', sub: 'text-sm text-text-secondary' }

  return (
    <div className={staged && dark ? 'dark' : undefined}>
      <div className="space-y-5">
        {/* ── Hero header ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
              </span>
              <p className={heroText.eyebrow}>
                Mission control · Agenda
              </p>
            </div>
            <h1 className={`mt-1 text-3xl font-extrabold tracking-tight ${heroText.title}`}>
              Calendrier
            </h1>
            <p className={`mt-0.5 ${heroText.sub}`}>
              Vos rendez-vous, visites et échéances en temps réel.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowGoogleSync(!showGoogleSync)}
              title="Synchronisation Google"
              className={`group relative flex h-9 items-center gap-2 overflow-hidden rounded-xl border px-3 text-xs font-semibold transition-all duration-200 active:scale-[0.97] ${
                !staged
                  ? 'border-border bg-card text-text hover:bg-background'
                  : showGoogleSync
                    ? dark
                      ? 'border-sky-400/40 bg-sky-500/15 text-sky-200 shadow-[0_0_18px_-4px_rgba(56,189,248,0.7),inset_0_1px_0_rgba(255,255,255,0.25)]'
                      : 'border-teal-500/50 bg-teal-500/15 text-teal-800 shadow-[0_0_18px_-4px_rgba(13,148,136,0.6),inset_0_1px_0_rgba(255,255,255,0.7)]'
                    : dark
                      ? 'border-white/12 bg-white/5 text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] hover:bg-white/10 hover:text-white'
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
        </div>

        {/* ── Stat orbs (admin only) ──────────────────────────────────── */}
        {admin && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {statCards.map(({ label, sub, value, hue, Icon }) =>
              staged ? (
                <TiltCard key={label}>
                  <div className="stage-glass flex h-full items-center gap-3.5 rounded-2xl p-4">
                    <OrbIcon icon={Icon} hue={hue} size={46} radius={15} />
                    <div className="min-w-0">
                      <p className={`truncate text-[9px] font-bold uppercase tracking-[0.2em] ${dark ? 'text-slate-400/75' : 'text-teal-900/45'}`}>
                        {label}
                      </p>
                      <p className={`text-2xl font-extrabold tabular-nums leading-tight tracking-tight ${dark ? 'text-slate-50' : 'text-teal-950'}`}>
                        {value}
                        <span className={`ml-1.5 text-[10px] font-semibold normal-case tracking-normal ${dark ? 'text-slate-500' : 'text-teal-900/40'}`}>
                          {sub}
                        </span>
                      </p>
                    </div>
                  </div>
                </TiltCard>
              ) : (
                <div key={label} className="rounded-xl border border-border/50 bg-card p-4 shadow-card">
                  <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">{label}</p>
                  <p className="mt-1 text-2xl font-semibold">{value}</p>
                  <p className="mt-0.5 text-xs text-text-secondary/60">{sub}</p>
                  <Icon size={14} className="mt-1 text-accent" />
                </div>
              )
            )}
          </div>
        )}

        {/* ── Command bar ─────────────────────────────────────────────── */}
        <CalendarToolbar
          view={view}
          currentDate={currentDate}
          filtersOpen={filtersOpen}
          activeFilterCount={activeFilterCount}
          onToggleFilters={() => setFiltersOpen(o => !o)}
          onViewChange={setView}
          onDateChange={setCurrentDate}
          onToday={() => setCurrentDate(new Date())}
        />

        {/* ── Filters rail + views ───────────────────────────────────── */}
        <div className="flex gap-4">
          {filtersOpen && (
            <motion.div
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="w-64 flex-shrink-0 space-y-3"
            >
              <CalendarFilters
                selectedAgents={selectedAgents}
                selectedEventTypes={selectedEventTypes}
                onAgentsChange={setSelectedAgents}
                onEventTypesChange={setSelectedEventTypes}
                showAgents
                agents={viewAgents}
              />
              <GoogleSyncSettings isOpen={showGoogleSync} onSynced={handleGoogleSynced} />
            </motion.div>
          )}

          <motion.div
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
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
