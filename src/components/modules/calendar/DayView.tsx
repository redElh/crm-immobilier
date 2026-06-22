import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { CalendarEvent, EVENT_TYPE_CONFIG, formatTime, getEventsForDay, isToday } from '../../../types/calendar'

interface DayViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onSlotClick: (date: Date) => void
}

const HOUR_HEIGHT = 56
const TOTAL_HOURS = 24
const CONTAINER_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT

function eventsOverlap(a: CalendarEvent, b: CalendarEvent) {
  return a.start.getTime() < b.end.getTime() && b.start.getTime() < a.end.getTime()
}

interface EventLayout {
  event: CalendarEvent
  col: number
  cols: number
}

function layoutDayEvents(events: CalendarEvent[]): EventLayout[] {
  const sorted = [...events].sort((a, b) => {
    const diff = a.start.getTime() - b.start.getTime()
    if (diff !== 0) return diff
    return b.end.getTime() - a.end.getTime()
  })

  const columns: EventLayout[] = []

  for (const event of sorted) {
    const occupied = new Set<number>()
    for (const placed of columns) {
      if (eventsOverlap(event, placed.event)) {
        occupied.add(placed.col)
      }
    }
    let col = 0
    while (occupied.has(col)) col++
    columns.push({ event, col, cols: 1 })
  }

  const maxCol = columns.reduce((m, c) => Math.max(m, c.col), 0) + 1
  return columns.map(c => ({ ...c, cols: maxCol }))
}

export default function DayView({ currentDate, events, onEventClick, onSlotClick }: DayViewProps) {
  const dayEvents = useMemo(() => {
    return getEventsForDay(events, currentDate).sort((a, b) => a.start.getTime() - b.start.getTime())
  }, [events, currentDate])

  const eventLayouts = useMemo(() => layoutDayEvents(dayEvents), [dayEvents])

  const HOURS = Array.from({ length: TOTAL_HOURS }, (_, i) => i)

  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
      <div className="text-center py-3 border-b border-border/30 bg-background/50">
        <p className={`text-sm font-semibold ${isToday(currentDate) ? 'text-accent' : 'text-text'}`}>
          {currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>
      <div className="overflow-y-auto scrollbar-thin" style={{ height: 650 }}>
        <div className="overflow-x-auto scrollbar-thin">
        <div className="relative min-w-[600px]" style={{ height: CONTAINER_HEIGHT }}>
          {/* Hour grid lines */}
          {HOURS.map(hour => (
            <div
              key={hour}
              className="absolute left-0 right-0 border-t border-border/25 cursor-pointer hover:bg-background/30 transition-colors"
              style={{ top: `${(hour / TOTAL_HOURS) * 100}%`, height: `${100 / TOTAL_HOURS}%` }}
              onClick={() => {
                const d = new Date(currentDate)
                d.setHours(hour, 0, 0, 0)
                onSlotClick(d)
              }}
            >
              <span className="absolute top-0 left-2 -translate-y-1/2 text-xs text-text-secondary font-medium bg-card px-1.5">
                {String(hour).padStart(2, '0')}:00
              </span>
            </div>
          ))}

          {/* Events */}
          {eventLayouts.map(({ event, col, cols }) => {
            const cfg = EVENT_TYPE_CONFIG[event.type]
            const startH = event.start.getHours() + event.start.getMinutes() / 60
            const endH = event.end.getHours() + event.end.getMinutes() / 60
            const top = (startH / TOTAL_HOURS) * CONTAINER_HEIGHT
            const height = Math.max(((endH - startH) / TOTAL_HOURS) * CONTAINER_HEIGHT, 24)
            const gutter = 64
            const width = cols > 1 ? `calc((100% - ${gutter}px) / ${cols})` : `calc(100% - ${gutter}px)`
            const left = cols > 1 ? `calc(${gutter}px + (100% - ${gutter}px) * ${col} / ${cols})` : `${gutter}px`

            return (
              <motion.button
                key={event.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`absolute rounded-md border overflow-hidden text-left cursor-pointer z-10 hover:opacity-85 hover:shadow-md transition-all ${cfg.bgColor} ${cfg.borderColor}`}
                style={{
                  top,
                  height,
                  width,
                  left,
                  minHeight: 24,
                  borderLeftWidth: 4,
                  borderLeftColor: cfg.value === 'office' ? '#6B7280' : undefined,
                }}
                onClick={(e) => { e.stopPropagation(); onEventClick(event) }}
              >
                <div className="px-2 py-1 h-full flex flex-col justify-center">
                  <div className="flex items-center gap-1">
                    <span className="text-xs">{cfg.icon}</span>
                    <span className={`text-xs font-bold ${cfg.textColor} leading-tight`}>
                      {formatTime(event.start)} - {formatTime(event.end)}
                    </span>
                  </div>
                  <p className={`text-sm font-semibold leading-tight truncate ${cfg.textColor}`}>
                    {event.title}
                  </p>
                  {event.clientName && (
                    <p className="text-xs text-text-secondary truncate leading-tight">
                      {event.clientName}
                    </p>
                  )}
                </div>
              </motion.button>
            )
          })}
        </div>
        </div>
      </div>
    </div>
  )
}
