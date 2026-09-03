import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarEvent, getEventTypeConfig, AGENTS, Agent, getEventUserColor, withAlpha,
  formatEventRange, formatFrenchDate, formatFrenchDayName, getEventDayOverlap, getEventDayHours,
  getWeekDays, getWeekStart, eventMatchesSelectedAgents, isToday, readableChipText,
} from '../../../types/calendar'
import { useStageChrome } from './useStageChrome'

interface TimelineViewProps {
  currentDate: Date
  events: CalendarEvent[]
  selectedAgents: string[]
  selectedEventTypes: string[]
  agents?: Agent[]
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
  currentDate, events, selectedAgents, selectedEventTypes, agents, onEventClick,
}: TimelineViewProps) {
  const { staged, dark } = useStageChrome()
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate])
  const weekEvents = useMemo(() => {
    const start = getWeekStart(currentDate)
    const end = new Date(start)
    end.setDate(end.getDate() + 7)
    return events
      .filter(e => {
        if (selectedEventTypes.length > 0 && !selectedEventTypes.includes(e.type)) return false
        if (!eventMatchesSelectedAgents(e, selectedAgents, agents)) return false
        const s = new Date(e.start)
        const evEnd = new Date(e.end)
        return evEnd > start && s < end
      })
      .sort((a, b) => a.start.getTime() - b.start.getTime())
  }, [events, currentDate, selectedAgents, selectedEventTypes])

  const groups = useMemo(() => {
    const gs: { date: Date; label: string; events: CalendarEvent[] }[] = []
    for (const day of weekDays) {
      const dayEvents = weekEvents.filter(e => {
        const { start, end } = getEventDayOverlap(e, day)
        return start.getTime() < end.getTime()
      })
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
      <div className={`flex flex-col items-center justify-center rounded-2xl py-14 text-sm ${staged ? 'stage-glass' : 'border border-border/50 bg-card'} text-text-secondary`}>
        Aucun événement cette semaine
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {groupLayouts.map((group, gi) => {
        const { layouts } = group
        const dayIsToday = isToday(group.date)
        return (
          <motion.div
            key={gi}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: gi * 0.05 }}
            className={`relative overflow-hidden rounded-2xl shadow-card ${
              staged
                ? 'stage-glass'
                : 'border border-border/50 bg-card'
            }`}
          >
            {/* Day header with gradient beam */}
            <div className={`flex items-center gap-2.5 border-b px-4 py-2.5 backdrop-blur-xl ${
              staged
                ? dark
                  ? 'border-white/[0.08] bg-white/[0.03]'
                  : 'border-teal-900/[0.10] bg-white/40'
                : 'border-border/40 bg-background/50'
            }`}>
              <span
                className="h-5 w-[3px] rounded-full"
                style={{
                  background: dayIsToday
                    ? dark || !staged
                      ? 'linear-gradient(180deg, #8B7CFF, #5646C9)'
                      : 'linear-gradient(180deg, #2DD4BF, #0D9488)'
                    : 'linear-gradient(180deg, rgba(148,163,184,0.7), rgba(100,116,139,0.4))',
                  boxShadow: dayIsToday
                    ? dark || !staged
                      ? '0 0 10px rgba(124,92,255,0.7)'
                      : '0 0 10px rgba(13,148,136,0.55)'
                    : undefined,
                }}
              />
              <h3 className={`text-sm font-bold capitalize tracking-tight ${dayIsToday ? 'text-accent' : staged ? (dark ? 'text-slate-100' : 'text-teal-950') : 'text-text'}`}>
                {group.label}
              </h3>
              <span className="rounded-full bg-accent/10 px-2 py-px text-[9px] font-bold uppercase tracking-wider text-accent">
                {group.events.length} évt{group.events.length > 1 ? 's' : ''}
              </span>
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
                    const cfg = getEventTypeConfig(event.type)
                    const color = getEventUserColor(event, agents)
                    const catalog = agents && agents.length > 0 ? agents : AGENTS
                    const agentColors = event.agentIds.map(id => catalog.find(a => a.id === id)?.color || '#6B7280')
                    const { startH, endH } = getEventDayHours(event, group.date)
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
                        className="cal-event-glow absolute h-[20px] rounded-md border overflow-hidden cursor-pointer z-10 backdrop-blur-sm transition-[filter] hover:brightness-110"
                        style={{
                          left: `${left}%`,
                          width: `${width}%`,
                          top: `${col * 24}px`,
                          background: `linear-gradient(135deg, ${withAlpha(color, '3D')} 0%, ${withAlpha(color, '12')} 100%)`,
                          borderColor: withAlpha(color, '4D'),
                          borderLeft: `2px solid ${color}`,
                          ['--evc' as never]: withAlpha(color, '44'),
                        }}
                        onClick={() => onEventClick(event)}
                      >
                        <div className="flex items-center gap-1 px-1.5 h-full w-full truncate">
                          {startsBefore && (
                            <span className="text-[9px] text-text-secondary/60 mr-0.5">◀</span>
                          )}
                          <span className="flex-shrink-0 inline-flex"><cfg.icon size={10} /></span>
                          <span className="text-[10px] font-semibold whitespace-nowrap flex-shrink-0" style={{ color: readableChipText(color, dark) }}>
                            {formatEventRange(event)}
                          </span>
                          <p className="text-[10px] font-medium truncate min-w-0" style={{ color: readableChipText(color, dark) }}>
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
