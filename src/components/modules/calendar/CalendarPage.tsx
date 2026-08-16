import { API_ORIGIN } from '../../../utils/config'
import { useState, useMemo, useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getAuthToken } from '../../../utils/auth'
import { motion } from 'framer-motion'
import {
  CalendarEvent, CalendarView, EventType, Agent,
  getInitials, getAgentColor,
  getEventsForDay, getEventsForWeek, getEventsForMonth,
  isSameDay, eventMatchesSelectedAgents,
} from '../../../types/calendar'
import { getMyEffectivePermissions } from '../../../services/permissionsService'
import { Lock, RefreshCw } from 'react-feather'
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

  const agentEvents = useMemo(() => events, [events])

  const filteredEvents = useMemo(() => {
    return agentEvents.filter(e => {
      if (selectedEventTypes.length > 0 && !selectedEventTypes.includes(e.type)) return false
      if (!eventMatchesSelectedAgents(e, selectedAgents, viewAgents)) return false
      return true
    })
  }, [agentEvents, selectedAgents, selectedEventTypes, viewAgents])

  const stats = useMemo(() => ({
    today: getTodayEventsCount(filteredEvents),
    week: getWeekEventsCount(filteredEvents),
    month: getMonthEventsCount(filteredEvents),
    agentsInMeeting: admin ? getAgentsInMeeting(events) : 0,
  }), [filteredEvents, events, admin])

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

  if (!admin && permissionsLoaded && !canReadCalendar) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-border/40 flex items-center justify-center mb-4">
          <Lock size={28} className="text-text-secondary" />
        </div>
        <h2 className="text-lg font-semibold">Calendrier inaccessible</h2>
        <p className="text-sm text-text-secondary mt-1 max-w-sm">
          Vous n'avez pas la permission de consulter le calendrier. Contactez votre administrateur.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {admin && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-card rounded-xl border border-border/50 shadow-card p-4">
            <p className="text-xs text-text-secondary uppercase tracking-wider font-medium">Aujourd'hui</p>
            <p className="text-2xl font-semibold mt-1">{stats.today}</p>
            <p className="text-xs text-text-secondary/60 mt-0.5">événements</p>
          </div>
          <div className="bg-card rounded-xl border border-border/50 shadow-card p-4">
            <p className="text-xs text-text-secondary uppercase tracking-wider font-medium">Cette semaine</p>
            <p className="text-2xl font-semibold mt-1">{stats.week}</p>
            <p className="text-xs text-text-secondary/60 mt-0.5">événements</p>
          </div>
          <div className="bg-card rounded-xl border border-border/50 shadow-card p-4">
            <p className="text-xs text-text-secondary uppercase tracking-wider font-medium">Ce mois</p>
            <p className="text-2xl font-semibold mt-1">{stats.month}</p>
            <p className="text-xs text-text-secondary/60 mt-0.5">événements</p>
          </div>
          <div className="bg-card rounded-xl border border-border/50 shadow-card p-4">
            <p className="text-xs text-text-secondary uppercase tracking-wider font-medium">En réunion</p>
            <p className="text-2xl font-semibold mt-1">{stats.agentsInMeeting}</p>
            <p className="text-xs text-text-secondary/60 mt-0.5">agents actuellement</p>
          </div>
        </div>
      )}

      <CalendarToolbar
        view={view}
        currentDate={currentDate}
        filtersOpen={filtersOpen}
        onToggleFilters={() => setFiltersOpen(o => !o)}
        onViewChange={setView}
        onDateChange={setCurrentDate}
        onToday={() => setCurrentDate(new Date())}
        onAddEvent={canWriteCalendar ? handleAddEvent : undefined}
      />

      <div className="flex gap-4">
        {filtersOpen && (
          <div className="w-64 flex-shrink-0 space-y-3">
            <CalendarFilters
              selectedAgents={selectedAgents}
              selectedEventTypes={selectedEventTypes}
              onAgentsChange={setSelectedAgents}
              onEventTypesChange={setSelectedEventTypes}
              showAgents
              agents={viewAgents}
            />
            <button
              onClick={() => setShowGoogleSync(!showGoogleSync)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-border/50 bg-card text-sm text-text hover:bg-surface transition-colors"
            >
              <RefreshCw size={14} className="text-accent" />
              Synchronisation Google
            </button>
            <GoogleSyncSettings isOpen={showGoogleSync} onSynced={handleGoogleSynced} />
          </div>
        )}

        <motion.div
          key={view}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1 min-w-0"
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
  )
}
