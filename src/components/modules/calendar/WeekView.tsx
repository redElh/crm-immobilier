import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarEvent, EVENT_TYPE_CONFIG, AGENTS, formatTime,
  getWeekDays, getEventsForWeek, isToday, formatFrenchShortDate,
} from '../../../types/calendar'

interface WeekViewProps {
  currentDate: Date
  events: CalendarEvent[]
  selectedAgents: string[]
  selectedEventTypes: string[]
  onEventClick: (event: CalendarEvent) => void
  onSlotClick: (date: Date) => void
  onDayNameClick: (date: Date) => void
}

const START_HOUR = 7
const END_HOUR = 20
const TOTAL_HOURS = END_HOUR - START_HOUR
const HOUR_HEIGHT = 44
const CELL_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT
const TIME_COL_WIDTH = 170

export default function WeekView({
  currentDate, events, selectedAgents, selectedEventTypes, onEventClick, onSlotClick, onDayNameClick,
}: WeekViewProps) {
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate])
  const weekEvents = useMemo(() => getEventsForWeek(events, currentDate), [events, currentDate])
  const filteredEvents = useMemo(() =>
    weekEvents.filter(e =>
      selectedEventTypes.length === 0 || selectedEventTypes.includes(e.type)
    ),
    [weekEvents, selectedEventTypes]
  )
  const visibleAgents = useMemo(() =>
    AGENTS.filter(a => selectedAgents.length === 0 || selectedAgents.includes(a.id)),
    [selectedAgents]
  )

  const getAgentEvents = (agentId: string, day: Date) =>
    filteredEvents
      .filter(e => {
        if (!e.agentIds.includes(agentId)) return false
        const s = new Date(e.start)
        return s.getFullYear() === day.getFullYear() &&
               s.getMonth() === day.getMonth() &&
               s.getDate() === day.getDate()
      })
      .sort((a, b) => a.start.getTime() - b.start.getTime())

  const getEventLayout = (event: CalendarEvent) => {
    const startH = event.start.getHours() + event.start.getMinutes() / 60
    const endH = event.end.getHours() + event.end.getMinutes() / 60
    const clampedStart = Math.max(startH, START_HOUR)
    const clampedEnd = Math.min(endH, END_HOUR)
    const top = ((clampedStart - START_HOUR) / TOTAL_HOURS) * CELL_HEIGHT
    const height = Math.max(((clampedEnd - clampedStart) / TOTAL_HOURS) * CELL_HEIGHT, 22)
    return { top, height }
  }

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

          {/* Agent rows with mini-timeline cells */}
          {visibleAgents.map(agent => (
            <div
              key={agent.id}
              className="grid border-b border-border/30 last:border-b-0"
              style={{ gridTemplateColumns: gridCols }}
            >
              <div
                className="border-r border-border/30 flex items-start gap-3 px-4 pt-4"
                style={{ height: CELL_HEIGHT }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: agent.color }}
                >
                  {agent.initials}
                </div>
                <div className="pt-0.5">
                  <p className="text-sm font-semibold text-text leading-tight">{agent.name}</p>
                </div>
              </div>
              <div className="grid grid-cols-7 divide-x divide-border/20">
                {weekDays.map((day, i) => {
                  const agentEvents = getAgentEvents(agent.id, day)
                  return (
                    <div
                      key={i}
                      className="relative cursor-pointer transition-colors hover:bg-accent/[0.03]"
                      style={{ height: CELL_HEIGHT }}
                      onClick={() => {
                        const d = new Date(day)
                        d.setHours(9, 0, 0, 0)
                        onSlotClick(d)
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

                      {/* Hour labels on the left of first column */}
                      {i === 0 && Array.from({ length: TOTAL_HOURS }, (_, h) => (
                        <div
                          key={h}
                          className="absolute text-[10px] text-text-secondary/40 font-medium pointer-events-none leading-none"
                          style={{
                            left: -TIME_COL_WIDTH,
                            top: `${(h / TOTAL_HOURS) * CELL_HEIGHT}px`,
                            width: TIME_COL_WIDTH - 8,
                            textAlign: 'right',
                            paddingRight: 8,
                          }}
                        >
                          {String(START_HOUR + h).padStart(2, '0')}:00
                        </div>
                      ))}

                      {/* Today highlight bar */}
                      {isToday(day) && (
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-accent z-20" />
                      )}

                      {/* Events positioned by time */}
                      {agentEvents.map(event => {
                        const cfg = EVENT_TYPE_CONFIG[event.type]
                        const layout = getEventLayout(event)
                        return (
                          <motion.button
                            key={event.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`absolute left-1 right-1 rounded-md border ${cfg.bgColor} ${cfg.borderColor} hover:opacity-85 hover:shadow-md transition-all overflow-hidden cursor-pointer z-10`}
                            style={{ top: layout.top, height: layout.height, borderLeftWidth: 3, borderLeftColor: EVENT_TYPE_CONFIG[event.type].color === 'gray' ? '#6B7280' : undefined }}
                            onClick={(e) => { e.stopPropagation(); onEventClick(event) }}
                          >
                            <div className="px-2 py-1 h-full flex flex-col justify-center">
                              <div className="flex items-center gap-1">
                                <span className="text-xs">{cfg.icon}</span>
                                <span className={`text-xs font-bold ${cfg.textColor} leading-tight`}>
                                  {formatTime(event.start)}
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
          ))}
        </div>
      </div>
    </div>
  )
}
