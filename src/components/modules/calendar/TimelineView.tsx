import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarEvent, EVENT_TYPE_CONFIG, AGENTS,
  formatTime, formatFrenchDate, formatFrenchDayName,
  getWeekDays, getWeekStart,
} from '../../../types/calendar'

interface TimelineViewProps {
  currentDate: Date
  events: CalendarEvent[]
  selectedAgents: string[]
  selectedEventTypes: string[]
  onEventClick: (event: CalendarEvent) => void
}

const START_HOUR = 7
const END_HOUR = 20
const TOTAL_HOURS = END_HOUR - START_HOUR

function eventsOverlap(a: CalendarEvent, b: CalendarEvent) {
  return a.start.getTime() < b.end.getTime() && b.start.getTime() < a.end.getTime()
}

interface TimelineEventLayout {
  event: CalendarEvent
  col: number
  totalCols: number
}

function layoutTimelineEvents(events: CalendarEvent[]): TimelineEventLayout[] {
  const sorted = [...events].sort((a, b) => {
    const diff = a.start.getTime() - b.start.getTime()
    if (diff !== 0) return diff
    return b.end.getTime() - a.end.getTime()
  })

  const placed: { event: CalendarEvent; col: number }[] = []

  for (const event of sorted) {
    const occupied = new Set<number>()
    for (const p of placed) {
      if (eventsOverlap(event, p.event)) {
        occupied.add(p.col)
      }
    }
    let col = 0
    while (occupied.has(col)) col++
    placed.push({ event, col })
  }

  return placed.map(c => {
    const maxInGroup = placed
      .filter(p => eventsOverlap(c.event, p.event) || p === c)
      .reduce((m, p) => Math.max(m, p.col), c.col) + 1
    return { ...c, totalCols: maxInGroup }
  })
}

export default function TimelineView({
  currentDate, events, selectedAgents, selectedEventTypes, onEventClick,
}: TimelineViewProps) {
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate])
  const weekEvents = useMemo(() => {
    const start = getWeekStart(currentDate)
    const end = new Date(start)
    end.setDate(end.getDate() + 7)
    return events
      .filter(e => {
        if (selectedEventTypes.length > 0 && !selectedEventTypes.includes(e.type)) return false
        if (selectedAgents.length > 0 && !e.agentIds.some(a => selectedAgents.includes(a))) return false
        const s = new Date(e.start)
        return s >= start && s < end
      })
      .sort((a, b) => a.start.getTime() - b.start.getTime())
  }, [events, currentDate, selectedAgents, selectedEventTypes])

  const groups = useMemo(() => {
    const gs: { date: Date; label: string; events: CalendarEvent[] }[] = []
    for (const day of weekDays) {
      const dayEvents = weekEvents.filter(e =>
        new Date(e.start).getDate() === day.getDate() &&
        new Date(e.start).getMonth() === day.getMonth() &&
        new Date(e.start).getFullYear() === day.getFullYear()
      )
      if (dayEvents.length > 0) {
        gs.push({
          date: day,
          label: `${formatFrenchDayName(day)} ${formatFrenchDate(day)}`,
          events: dayEvents,
        })
      }
    }
    return gs
  }, [weekDays, weekEvents])

  const groupLayouts = useMemo(() =>
    groups.map(g => ({ ...g, layouts: layoutTimelineEvents(g.events) })),
    [groups]
  )

  if (weekEvents.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-text-secondary text-sm">
        Aucun événement cette semaine
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {groupLayouts.map((group, gi) => {
        const { layouts } = group
        return (
          <motion.div
            key={gi}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: gi * 0.05 }}
            className="bg-card rounded-xl border border-border shadow-card overflow-hidden"
          >
            <div className="px-4 py-2.5 bg-background border-b border-border">
              <h3 className="text-sm font-semibold text-text">{group.label}</h3>
            </div>
            <div className="p-4">
              {/* Hour labels header */}
              <div className="relative mb-2 h-5">
                {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 text-[10px] text-text-secondary font-semibold"
                    style={{ left: `${(i / TOTAL_HOURS) * 100}%`, width: `${100 / TOTAL_HOURS}%`, textAlign: 'center' }}
                  >
                    {String(START_HOUR + i).padStart(2, '0')}:00
                  </div>
                ))}
              </div>
              <div className="relative">
                {/* Grid vertical lines */}
                <div className="absolute inset-0 flex pointer-events-none">
                  {Array.from({ length: TOTAL_HOURS - 1 }, (_, i) => (
                    <div key={i} className="flex-1 border-r border-border/25" />
                  ))}
                  <div className="flex-1" />
                </div>
                {/* Alternating hour background */}
                <div className="absolute inset-0 flex pointer-events-none">
                  {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                    <div key={i} className={`flex-1 ${i % 2 === 0 ? '' : 'bg-background/30'}`} />
                  ))}
                </div>
                {/* Events */}
                <div className="relative" style={{ height: Math.max(layouts.reduce((m, l) => Math.max(m, l.col * 24 + 20), 0), 24) }}>
                  {layouts.map(({ event, col, totalCols }) => {
                    const cfg = EVENT_TYPE_CONFIG[event.type]
                    const agentColors = event.agentIds.map(id => AGENTS.find(a => a.id === id)?.color || '#6B7280')
                    const startH = event.start.getHours() + event.start.getMinutes() / 60
                    const endH = event.end.getHours() + event.end.getMinutes() / 60
                    const clampedStart = Math.max(Math.min(startH, END_HOUR), START_HOUR)
                    const clampedEnd = Math.max(Math.min(endH, END_HOUR), START_HOUR)
                    const left = ((clampedStart - START_HOUR) / TOTAL_HOURS) * 100
                    const width = Math.max(((clampedEnd - clampedStart) / TOTAL_HOURS) * 100, 2)
                    const startsBefore = startH < START_HOUR
                    const endsAfter = endH > END_HOUR

                    return (
                      <motion.button
                        key={event.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`absolute h-[20px] rounded-md border overflow-hidden cursor-pointer z-10 hover:opacity-85 hover:shadow-md transition-all ${cfg.bgColor} ${cfg.borderColor}`}
                        style={{
                          left: `${left}%`,
                          width: `${width}%`,
                          top: `${col * 24}px`,
                        }}
                        onClick={() => onEventClick(event)}
                      >
                        <div className="flex items-center gap-1 px-1.5 h-full w-full truncate">
                          {startsBefore && (
                            <span className="text-[9px] text-text-secondary/60 mr-0.5">◀</span>
                          )}
                          <span className="text-[10px] flex-shrink-0">{cfg.icon}</span>
                          <span className={`text-[10px] font-semibold ${cfg.textColor} whitespace-nowrap flex-shrink-0`}>
                            {formatTime(event.start)}
                          </span>
                          <p className={`text-[10px] font-medium truncate min-w-0 ${cfg.textColor}`}>
                            {event.title}
                          </p>
                          {agentColors.length > 0 && (
                            <div className="flex gap-0.5 flex-shrink-0 ml-auto">
                              {agentColors.map((color, i) => (
                                <div key={i} className="w-1.5 h-1.5 rounded-full border border-white/40" style={{ backgroundColor: color }} />
                              ))}
                            </div>
                          )}
                          {endsAfter && (
                            <span className="text-[9px] text-text-secondary/60 ml-0.5">▶</span>
                          )}
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
