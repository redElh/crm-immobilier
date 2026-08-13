import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'react-feather'
import {
  CalendarEvent, getEventTypeConfig, AGENTS, Agent, formatEventRange, getEventDayOverlap, getEventDayHours,
  getWeekDays, getEventsForWeek, isToday, formatFrenchShortDate, withAlpha, getEventUserColor,
  eventMatchesSelectedAgents,
} from '../../../types/calendar'

interface WeekViewProps {
  currentDate: Date
  events: CalendarEvent[]
  selectedAgents: string[]
  selectedEventTypes: string[]
  overrideAgent?: { id: string; name: string; color: string; initials: string }
  agents?: Agent[]
  canCreate?: boolean
  onEventClick: (event: CalendarEvent) => void
  onSlotClick: (date: Date) => void
  onDayNameClick: (date: Date) => void
}

const START_HOUR = 7
const END_HOUR = 20
const TOTAL_HOURS = END_HOUR - START_HOUR
const HOUR_HEIGHT = 44
const CELL_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT
const TIME_COL_WIDTH = 64

interface PlacedEvent {
  event: CalendarEvent
  level: number
  cluster: number
}

interface ClusterPopup {
  x: number
  y: number
  events: CalendarEvent[]
}

interface CellContextMenu {
  x: number
  y: number
  date: Date
}

export default function WeekView({
  currentDate, events, selectedAgents, selectedEventTypes, overrideAgent, agents, canCreate = true, onEventClick, onSlotClick, onDayNameClick,
}: WeekViewProps) {
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate])
  const weekEvents = useMemo(() => getEventsForWeek(events, currentDate), [events, currentDate])
  const filteredEvents = useMemo(() =>
    weekEvents.filter(e =>
      selectedEventTypes.length === 0 || selectedEventTypes.includes(e.type)
    ),
    [weekEvents, selectedEventTypes]
  )
  const visibleAgents = useMemo(() => {
    const catalog = agents && agents.length > 0 ? agents : AGENTS
    return overrideAgent
      ? [overrideAgent]
      : catalog.filter(a => selectedAgents.length === 0 || selectedAgents.includes(a.id))
  }, [overrideAgent, selectedAgents, agents])

  const dayEvents = useMemo(() => {
    return filteredEvents.filter(e => eventMatchesSelectedAgents(e, selectedAgents, agents))
  }, [filteredEvents, selectedAgents, agents])

  const getEventColor = (event: CalendarEvent): string =>
    getEventUserColor(event, visibleAgents)

  const getEventLayout = (event: CalendarEvent, day: Date) => {
    const { startH, endH } = getEventDayHours(event, day)
    const clampedStart = Math.max(startH, START_HOUR)
    const clampedEnd = Math.min(endH, END_HOUR)
    const top = ((clampedStart - START_HOUR) / TOTAL_HOURS) * CELL_HEIGHT
    const height = Math.max(((clampedEnd - clampedStart) / TOTAL_HOURS) * CELL_HEIGHT, 22)
    return { top, height }
  }

  const layoutDay = (events: CalendarEvent[], day: Date): { placed: PlacedEvent[]; clusters: CalendarEvent[][] } => {
    const sorted = [...events].sort((a, b) => {
      const aStart = getEventDayHours(a, day).startH
      const bStart = getEventDayHours(b, day).startH
      if (aStart !== bStart) return aStart - bStart
      return getEventDayHours(b, day).endH - getEventDayHours(a, day).endH
    })

    const clusters: CalendarEvent[][] = []
    let current: CalendarEvent[] = []
    let clusterEnd = -Infinity
    for (const e of sorted) {
      const { startH, endH } = getEventDayHours(e, day)
      if (startH >= clusterEnd) {
        if (current.length > 0) clusters.push(current)
        current = []
        clusterEnd = -Infinity
      }
      current.push(e)
      clusterEnd = Math.max(clusterEnd, endH)
    }
    if (current.length > 0) clusters.push(current)

    const placed: PlacedEvent[] = []
    clusters.forEach((cluster, ci) => {
      cluster.forEach((event, level) => placed.push({ event, level, cluster: ci }))
    })
    return { placed, clusters }
  }

  const [popup, setPopup] = useState<ClusterPopup | null>(null)
  const closeTimer = useRef<number | undefined>(undefined)
  const scheduleClose = () => {
    window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setPopup(null), 140)
  }
  const cancelClose = () => {
    window.clearTimeout(closeTimer.current)
  }

  const getDayOverlapping = (day: Date) =>
    dayEvents.filter(e => {
      const { start, end } = getEventDayOverlap(e, day)
      return start.getTime() < end.getTime()
    })

  const [ctxMenu, setCtxMenu] = useState<CellContextMenu | null>(null)
  const dateFromCellY = (clientY: number, rect: DOMRect, day: Date): Date => {
    const ratio = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
    const hour = Math.min(Math.floor(START_HOUR + ratio * TOTAL_HOURS), END_HOUR - 1)
    const d = new Date(day)
    d.setHours(hour, 0, 0, 0)
    return d
  }
  useEffect(() => {
    if (!ctxMenu) return
    const close = () => setCtxMenu(null)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('mousedown', close)
    window.addEventListener('scroll', close, true)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', close)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('keydown', onKey)
    }
  }, [ctxMenu])

  if (visibleAgents.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-text-secondary text-sm">
        Sélectionnez au moins un agent pour afficher le calendrier
      </div>
    )
  }

  const gridCols = `${TIME_COL_WIDTH}px 1fr`

  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin">
        <div className="min-w-[1100px]">
          {/* Day headers */}
          <div className="grid border-b border-border/40 bg-background/50 sticky top-0 z-20" style={{ gridTemplateColumns: gridCols }}>
            <div className="p-3 text-xs font-semibold text-text-secondary uppercase tracking-wider border-r border-border/30 text-center">
              Horaire
            </div>
            <div className="grid grid-cols-7 divide-x divide-border/20">
              {weekDays.map((day, i) => (
                <div
                  key={i}
                  className={`py-3 px-2 text-center cursor-pointer transition-colors ${isToday(day) ? 'bg-accent/5' : ''} hover:bg-accent/10`}
                  onClick={() => onDayNameClick(day)}
                >
                  <p className={`text-sm font-semibold ${isToday(day) ? 'text-accent' : 'text-text-secondary'}`}>
                    {day.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')}
                  </p>
                  <p className={`text-xl font-bold mt-0.5 ${isToday(day) ? 'text-accent' : 'text-text'}`}>
                    {day.getDate()}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">{formatFrenchShortDate(day)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Shared body row: time column + 7 day columns */}
          <div className="grid" style={{ gridTemplateColumns: gridCols }}>
            <div className="relative border-r border-border/30" style={{ height: CELL_HEIGHT }}>
              {Array.from({ length: TOTAL_HOURS }, (_, h) => (
                <div
                  key={h}
                  className="absolute right-2 text-[10px] text-text-secondary/40 font-medium leading-none pointer-events-none"
                  style={{ top: `calc(${(h / TOTAL_HOURS) * CELL_HEIGHT}px - 5px)` }}
                >
                  {String(START_HOUR + h).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 divide-x divide-border/20">
              {weekDays.map((day, i) => {
                const { placed, clusters } = layoutDay(getDayOverlapping(day), day)
                return (
                  <div
                    key={i}
                    className="relative cursor-pointer transition-colors hover:bg-accent/[0.03]"
                    style={{ height: CELL_HEIGHT }}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      onSlotClick(dateFromCellY(e.clientY, rect, day))
                    }}
                    onContextMenu={(e) => {
                      if (!canCreate) return
                      if (getDayOverlapping(day).length === 0) return
                      e.preventDefault()
                      setPopup(null)
                      const rect = e.currentTarget.getBoundingClientRect()
                      setCtxMenu({ x: e.clientX, y: e.clientY, date: dateFromCellY(e.clientY, rect, day) })
                    }}
                  >
                    {/* Hour grid lines */}
                    {Array.from({ length: TOTAL_HOURS - 1 }, (_, h) => (
                      <div
                        key={h}
                        className="absolute left-0 right-0 border-t border-border/20 pointer-events-none"
                        style={{ top: `${((h + 1) / TOTAL_HOURS) * CELL_HEIGHT}px` }}
                      />
                    ))}

                    {/* Today highlight bar */}
                    {isToday(day) && (
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-accent z-20" />
                    )}

                    {/* Events positioned by time, colored by creator */}
                    {placed.map(({ event, level, cluster }) => {
                      const cfg = getEventTypeConfig(event.type)
                      const layout = getEventLayout(event, day)
                      const color = getEventColor(event)
                      const offset = level * 8
                      return (
                        <motion.button
                          key={event.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          title={event.title}
                          className="absolute rounded-md border hover:opacity-85 hover:shadow-md transition-all overflow-hidden cursor-pointer z-10 text-left"
                          style={{
                            top: layout.top,
                            height: layout.height,
                            left: `calc(1px + ${offset}px)`,
                            width: `calc(100% - ${2 + offset}px)`,
                            zIndex: 10 + level,
                            backgroundColor: withAlpha(color, level === 0 ? '1F' : '17'),
                            borderColor: withAlpha(color, '40'),
                            borderLeft: `3px solid ${color}`,
                            boxShadow: level > 0 ? '0 1px 3px rgba(0,0,0,0.12)' : undefined,
                          }}
                          onMouseEnter={(e) => {
                            cancelClose()
                            if (clusters[cluster].length > 1) {
                              setPopup({ x: e.clientX, y: e.clientY, events: clusters[cluster] })
                            }
                          }}
                          onMouseLeave={() => scheduleClose()}
                          onClick={(e) => { e.stopPropagation(); setPopup(null); onEventClick(event) }}
                          onContextMenu={(e) => {
                            if (!canCreate) return
                            e.stopPropagation()
                            e.preventDefault()
                            setPopup(null)
                            const cellEl = e.currentTarget.parentElement
                            if (!cellEl) return
                            const rect = cellEl.getBoundingClientRect()
                            setCtxMenu({ x: e.clientX, y: e.clientY, date: dateFromCellY(e.clientY, rect, day) })
                          }}
                        >
                          <div className="px-2 py-1 h-full flex flex-col justify-center">
                            <div className="flex items-center gap-1">
                              <span className="text-xs inline-flex"><cfg.icon size={12} /></span>
                              <span className={`text-xs font-bold ${cfg.textColor} leading-tight`}>
                                {formatEventRange(event)}
                              </span>
                            </div>
                            <p className={`text-xs font-medium leading-tight truncate ${cfg.textColor}`}>
                              {event.title}
                            </p>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Hover popup for simultaneous events */}
      {popup && (
        <div
          className="fixed z-50 w-80 max-h-[320px] overflow-y-auto rounded-xl border border-border/60 bg-card shadow-2xl p-2 space-y-1.5"
          style={{
            left: Math.max(8, Math.min(popup.x + 12, (typeof window !== 'undefined' ? window.innerWidth : 1024) - 340)),
            top: Math.max(8, Math.min(popup.y + 12, (typeof window !== 'undefined' ? window.innerHeight : 768) - 340)),
          }}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <div className="px-2 pt-1 pb-1.5 flex items-center justify-between border-b border-border/30 mb-1">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Événements simultanés
            </span>
            <span className="text-xs font-bold text-accent">{popup.events.length}</span>
          </div>
          {popup.events.map(event => {
            const cfg = getEventTypeConfig(event.type)
            const color = getEventColor(event)
            return (
              <button
                key={event.id}
                onClick={() => { setPopup(null); onEventClick(event) }}
                className="w-full text-left p-2 rounded-lg border bg-card hover:bg-surface hover:shadow-md transition-all"
                style={{ borderLeft: `3px solid ${color}` }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 border border-white/40" style={{ backgroundColor: color }} />
                  <span className={`inline-flex flex-shrink-0`}><cfg.icon size={13} className={cfg.textColor} /></span>
                  <span className="text-sm font-semibold text-text truncate">{event.title}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 pl-5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${cfg.bgColor} ${cfg.textColor}`}>
                    {cfg.label}
                  </span>
                  <span className="text-xs text-text-secondary">{formatEventRange(event)}</span>
                </div>
                {event.clientName && (
                  <p className="text-xs text-text-secondary truncate mt-1 pl-5">Client : {event.clientName}</p>
                )}
              </button>
            )
          })}
        </div>
      )}
      {/* Right-click context menu: add another event in an occupied cell */}
      {ctxMenu && (
        <div
          className="fixed z-50 w-56 rounded-xl border border-border/60 bg-card shadow-2xl p-1.5"
          style={{
            left: Math.max(8, Math.min(ctxMenu.x, (typeof window !== 'undefined' ? window.innerWidth : 1024) - 236)),
            top: Math.max(8, Math.min(ctxMenu.y, (typeof window !== 'undefined' ? window.innerHeight : 768) - 88)),
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              setCtxMenu(null)
              onSlotClick(ctxMenu.date)
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-text hover:bg-surface transition-colors"
          >
            <Plus size={15} className="text-accent" />
            Ajouter un autre événement
          </button>
        </div>
      )}
    </div>
  )
}
