import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarEvent, getEventTypeConfig, Agent, getEventUserColor, withAlpha, formatEventRange, readableChipText, getEventsForDay, getEventDayHours, isToday } from '../../../types/calendar'
import { useStageChrome } from './useStageChrome'

interface DayViewProps {
  currentDate: Date
  events: CalendarEvent[]
  agents?: Agent[]
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

export default function DayView({ currentDate, events, agents, onEventClick, onSlotClick }: DayViewProps) {
  const { staged, dark } = useStageChrome()
  const dayEvents = useMemo(() => {
    return getEventsForDay(events, currentDate).sort((a, b) => a.start.getTime() - b.start.getTime())
  }, [events, currentDate])

  const eventLayouts = useMemo(() => layoutDayEvents(dayEvents), [dayEvents])

  const HOURS = Array.from({ length: TOTAL_HOURS }, (_, i) => i)

  /* Live "now" indicator */
  const [nowTs, setNowTs] = useState(() => new Date())
  useEffect(() => {
    const t = window.setInterval(() => setNowTs(new Date()), 30000)
    return () => window.clearInterval(t)
  }, [])
  const isToday_ = isToday(currentDate)
  const nowMinutes = nowTs.getHours() * 60 + nowTs.getMinutes()
  const showNowLine = isToday_

  const skin = staged
    ? {
        container: 'stage-glass overflow-hidden',
        headBorder: dark ? 'border-white/[0.08]' : 'border-teal-900/[0.10]',
        headBg: dark ? 'bg-white/[0.03]' : 'bg-white/40',
        cellLine: dark ? 'border-white/[0.05]' : 'border-teal-900/[0.07]',
        chip: dark ? 'bg-[#0d1228]' : 'bg-white/80',
      }
    : {
        container: 'bg-card overflow-hidden rounded-2xl border border-border/50 shadow-card',
        headBorder: 'border-border/30',
        headBg: 'bg-background/50',
        cellLine: 'border-border/20',
        chip: 'bg-card',
      }

  return (
    <div className={skin.container}>
      <div className={`flex items-center justify-center gap-2 border-b ${skin.headBorder} ${skin.headBg} py-3 backdrop-blur-xl`}>
        {isToday_ && (
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
        )}
        <p className={`text-sm font-bold capitalize tracking-tight ${isToday_ ? 'text-accent' : 'text-text'}`}>
          {currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <span className={`text-[10px] font-bold uppercase tracking-[0.18em] ${isToday_ ? 'text-accent/70' : 'text-text-secondary/50'}`}>
          · {dayEvents.length} événement{dayEvents.length > 1 ? 's' : ''}
        </span>
      </div>
      <div className="overflow-y-auto scrollbar-thin" style={{ height: 650 }}>
        <div className="overflow-x-auto scrollbar-thin">
        <div className="relative min-w-[600px]" style={{ height: CONTAINER_HEIGHT }}>
          {/* Hour grid lines */}
          {HOURS.map(hour => (
            <div
              key={hour}
              className="group absolute left-0 right-0 cursor-pointer transition-colors hover:bg-accent/[0.03]"
              style={{ top: `${(hour / TOTAL_HOURS) * 100}%`, height: `${100 / TOTAL_HOURS}%` }}
              onClick={() => {
                const d = new Date(currentDate)
                d.setHours(hour, 0, 0, 0)
                onSlotClick(d)
              }}
            >
              <div className={`absolute inset-x-0 top-0 border-t ${skin.cellLine} group-hover:border-accent/25 transition-colors`} />
              <span className={`absolute top-0 left-2 -translate-y-1/2 rounded-md px-1.5 py-px font-mono text-[10px] font-semibold ${skin.chip} text-text-secondary/70`}>
                {String(hour).padStart(2, '0')}:00
              </span>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg border border-dashed border-border/40 px-2 py-0.5 text-[10px] font-medium text-text-secondary/0 transition-colors duration-150 group-hover:text-text-secondary/70">
                + Créer à {String(hour).padStart(2, '0')}:00
              </span>
            </div>
          ))}

          {/* Live now-line */}
          {showNowLine && (
            <div
              className="cal-now-line"
              style={{
                top: `${(nowMinutes / (TOTAL_HOURS * 60)) * CONTAINER_HEIGHT}px`,
                marginLeft: 56,
              }}
            >
              <span className="cal-now-dot" style={{ left: -4, top: -3.5 }} />
              <span className="cal-now-chip" style={{ right: 'auto', left: 6 }}>
                {String(nowTs.getHours()).padStart(2, '0')}:{String(nowTs.getMinutes()).padStart(2, '0')}
              </span>
            </div>
          )}

          {/* Events */}
          {eventLayouts.map(({ event, col, cols }) => {
            const cfg = getEventTypeConfig(event.type)
            const color = getEventUserColor(event, agents)
            const { startH, endH } = getEventDayHours(event, currentDate)
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
                className="cal-event-glow absolute rounded-md border overflow-hidden text-left cursor-pointer z-10 backdrop-blur-sm transition-[filter] hover:brightness-110"
                style={{
                  top,
                  height,
                  width,
                  left,
                  minHeight: 24,
                  background: `linear-gradient(135deg, ${withAlpha(color, '40')} 0%, ${withAlpha(color, '14')} 100%)`,
                  borderColor: withAlpha(color, '4D'),
                  borderLeft: `4px solid ${color}`,
                  ['--evc' as never]: withAlpha(color, '55'),
                }}
                onClick={(e) => { e.stopPropagation(); onEventClick(event) }}
              >
                <div
                  className="px-2 py-1 h-full flex flex-col justify-center"
                  style={{ color: readableChipText(color, dark) }}
                >
                  <div className="flex items-center gap-1">
                    <span className="text-xs inline-flex"><cfg.icon size={12} /></span>
                    <span className="text-xs font-bold leading-tight">
                      {formatEventRange(event)}
                    </span>
                  </div>
                  <p className="text-sm font-semibold leading-tight truncate">
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
