import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'react-feather'
import {
  CalendarEvent, CalendarView, EventType,
  createMockEvents, AGENTS, EVENT_TYPE_CONFIG,
  getEventsForDay, getEventsForWeek, getEventsForMonth,
  isSameDay,
} from '../../../types/calendar'
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

const ALL_EVENT_TYPES: EventType[] = ['visit', 'virtual-visit', 'call', 'meeting', 'office', 'leave', 'external', 'matching']

function isAdminRoute() {
  if (typeof window === 'undefined') return false
  return window.location.pathname.startsWith('/admin')
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
  const currentAgentId = 'myriam'

  const [view, setView] = useState<CalendarView>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>(() => createMockEvents())
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [selectedEventTypes, setSelectedEventTypes] = useState<EventType[]>(ALL_EVENT_TYPES)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null)
  const [defaultSlotDate, setDefaultSlotDate] = useState<Date | undefined>()
  const [showGoogleSync, setShowGoogleSync] = useState(false)
  const [dayModalDate, setDayModalDate] = useState<Date | null>(null)

  const agentEvents = useMemo(() => {
    if (admin) return events
    return events.filter(e => e.agentIds.includes(currentAgentId))
  }, [events, admin, currentAgentId])

  const filteredEvents = useMemo(() => {
    return agentEvents.filter(e => {
      if (selectedEventTypes.length > 0 && !selectedEventTypes.includes(e.type)) return false
      if (admin && selectedAgents.length > 0 && !e.agentIds.some(a => selectedAgents.includes(a))) return false
      return true
    })
  }, [agentEvents, admin, selectedAgents, selectedEventTypes])

  const stats = useMemo(() => ({
    today: getTodayEventsCount(filteredEvents),
    week: getWeekEventsCount(filteredEvents),
    month: getMonthEventsCount(filteredEvents),
    agentsInMeeting: admin ? getAgentsInMeeting(events) : 0,
  }), [filteredEvents, events, admin])

  const handleSaveEvent = useCallback((event: CalendarEvent) => {
    setEvents(prev => {
      const idx = prev.findIndex(e => e.id === event.id)
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = event
        return copy
      }
      return [...prev, event]
    })
  }, [])

  const handleDeleteEvent = useCallback((eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId))
    setSelectedEvent(null)
  }, [])

  const handleEventClick = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event)
  }, [])

  const handleSlotClick = useCallback((date: Date) => {
    setDefaultSlotDate(date)
    setEditEvent(null)
    setFormOpen(true)
  }, [])

  const handleAddEvent = useCallback(() => {
    setDefaultSlotDate(undefined)
    setEditEvent(null)
    setFormOpen(true)
  }, [])

  const handleEditFromDetail = useCallback((event: CalendarEvent) => {
    setEditEvent(event)
    setFormOpen(true)
    setSelectedEvent(null)
  }, [])

  const handleMonthDayClick = useCallback((date: Date) => {
    setDayModalDate(date)
  }, [])

  const handleWeekDayNameClick = useCallback((date: Date) => {
    setCurrentDate(date)
    setView('day')
  }, [])

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
        onViewChange={setView}
        onDateChange={setCurrentDate}
        onToday={() => setCurrentDate(new Date())}
        onAddEvent={handleAddEvent}
      />

      <div className="flex gap-4">
        {admin && (
          <div className="w-64 flex-shrink-0 space-y-3">
            <CalendarFilters
              selectedAgents={selectedAgents}
              selectedEventTypes={selectedEventTypes}
              onAgentsChange={setSelectedAgents}
              onEventTypesChange={setSelectedEventTypes}
            />
            <button
              onClick={() => setShowGoogleSync(!showGoogleSync)}
              className="w-full btn-secondary text-sm"
            >
              <RefreshCwSmall /> Synchronisation Google
            </button>
            <GoogleSyncSettings isOpen={showGoogleSync} />
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
              onEventClick={handleEventClick}
              onSlotClick={handleSlotClick}
            />
          )}
          {view === 'week' && (
            <WeekView
              currentDate={currentDate}
              events={filteredEvents}
              selectedAgents={admin ? selectedAgents : [currentAgentId]}
              selectedEventTypes={selectedEventTypes}
              onEventClick={handleEventClick}
              onSlotClick={handleSlotClick}
              onDayNameClick={handleWeekDayNameClick}
            />
          )}
          {view === 'month' && (
            <MonthView
              currentDate={currentDate}
              events={filteredEvents}
              selectedEventTypes={selectedEventTypes}
              onEventClick={handleEventClick}
              onDayClick={handleMonthDayClick}
            />
          )}
          {view === 'agenda' && (
            <AgendaView
              events={filteredEvents}
              selectedAgents={admin ? selectedAgents : [currentAgentId]}
              selectedEventTypes={selectedEventTypes}
              onEventClick={handleEventClick}
            />
          )}
          {view === 'timeline' && (
            <TimelineView
              currentDate={currentDate}
              events={filteredEvents}
              selectedAgents={admin ? selectedAgents : [currentAgentId]}
              selectedEventTypes={selectedEventTypes}
              onEventClick={handleEventClick}
            />
          )}
        </motion.div>
      </div>

      {admin && (
        <div className="bg-card rounded-xl border border-border/50 shadow-card p-4 flex items-center gap-2">
          <span className="text-sm font-medium text-text-secondary mr-1">⚡ Actions rapides</span>
          <button onClick={handleAddEvent} className="btn-primary text-xs h-8 px-3">
            <Plus size={14} /> Nouvel événement
          </button>
          <button className="btn-secondary text-xs h-8 px-3">
            <CalendarBlank size={14} /> Voir l'agenda de tous les agents
          </button>
          <button className="btn-secondary text-xs h-8 px-3">
            <Bell size={14} /> Envoyer un rappel
          </button>
          <button onClick={() => setShowGoogleSync(true)} className="btn-secondary text-xs h-8 px-3">
            <RefreshCwSmall /> Synchroniser Google
          </button>
        </div>
      )}

      <EventFormModal
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditEvent(null) }}
        onSave={handleSaveEvent}
        editEvent={editEvent}
        defaultDate={defaultSlotDate}
      />

      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onEdit={handleEditFromDetail}
        onDelete={handleDeleteEvent}
      />

      <DayEventsModal
        isOpen={dayModalDate !== null}
        date={dayModalDate}
        events={filteredEvents}
        onClose={() => setDayModalDate(null)}
        onEventClick={(event) => { setDayModalDate(null); setSelectedEvent(event) }}
      />
    </div>
  )
}

function RefreshCwSmall() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  )
}

function CalendarBlank(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function Bell(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}
