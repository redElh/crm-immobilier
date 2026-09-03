import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarEvent, getEventTypeConfig, Agent, getEventUserColor, withAlpha, formatEventRange,
  getEventsForMonth, getMonthDays, isToday,
} from '../../../types/calendar'
import { useStageChrome } from './useStageChrome'

interface MonthViewProps {
  currentDate: Date
  events: CalendarEvent[]
  selectedEventTypes: string[]
  agents?: Agent[]
  onEventClick: (event: CalendarEvent) => void
  onDayClick: (date: Date) => void
}

const DAY_NAMES_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export default function MonthView({
  currentDate, events, selectedEventTypes, agents, onEventClick, onDayClick,
}: MonthViewProps) {
  const { staged, dark } = useStageChrome()
  const monthDays = useMemo(() => getMonthDays(currentDate), [currentDate])
  const monthEvents = useMemo(() => getEventsForMonth(events, currentDate), [events, currentDate])

  const getEventsForDay = (date: Date | null) => {
    if (!date) return []
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)
    return monthEvents.filter(e => {
      return selectedEventTypes.length === 0 || selectedEventTypes.includes(e.type)
    }).filter(e => {
      const start = new Date(e.start)
      const end = new Date(e.end)
      return end > dayStart && start < dayEnd
    })
  }

  const skin = staged
    ? {
        container: 'stage-glass overflow-hidden',
        headBg: dark ? 'bg-white/[0.03]' : 'bg-white/40',
        headBorder: dark ? 'border-white/[0.08]' : 'border-teal-900/[0.10]',
        cellLine: dark ? 'border-white/[0.05]' : 'border-teal-900/[0.07]',
        label: dark ? 'text-slate-500' : 'text-teal-900/35',
      }
    : {
        container: 'bg-card overflow-hidden rounded-2xl border border-border/50 shadow-card',
        headBg: 'bg-background/50',
        headBorder: 'border-border/40',
        cellLine: 'border-border/15',
        label: 'text-text-secondary',
      }

  return (
    <div className={skin.container}>
      {/* Day-of-week header */}
      <div className={`grid grid-cols-7 border-b ${skin.headBorder} ${skin.headBg} backdrop-blur-xl`}>
        {DAY_NAMES_SHORT.map((name, i) => (
          <div
            key={name}
            className={`p-2 text-center text-[10px] font-bold uppercase tracking-[0.18em] ${skin.label} ${
              i > 4 ? 'opacity-60' : ''
            }`}
          >
            {name}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {monthDays.map((date, i) => {
          const dayEvents = getEventsForDay(date)
          const weekend = i % 7 >= 5
          const todayCell = date ? isToday(date) : false
          const colIndex = i % 7

          return (
            <div
              key={i}
              onClick={() => date && onDayClick(date)}
              className={`group relative min-h-[108px] cursor-pointer p-2 transition-colors duration-150 ${
                !date ? (dark ? 'bg-white/[0.015]' : 'bg-black/[0.02]') : weekend ? 'hover:bg-accent/[0.05]' : 'hover:bg-accent/[0.04]'
              } ${todayCell ? 'bg-accent/[0.05]' : ''} ${
                colIndex < 6 ? `border-r border-b ${skin.cellLine}` : `border-b ${skin.cellLine}`
              }`}
            >
              {todayCell && (
                <>
                  <div className="cal-today-beam" />
                  <span
                    className="pointer-events-none absolute inset-1 rounded-xl"
                    style={{
                      boxShadow: dark
                        ? 'inset 0 0 0 1px rgba(139,124,255,0.35)'
                        : 'inset 0 0 0 1px rgba(13,148,136,0.30)',
                      background: dark
                        ? 'radial-gradient(120% 90% at 50% 0%, rgba(139,124,255,0.08) 0%, transparent 60%)'
                        : 'radial-gradient(120% 90% at 50% 0%, rgba(13,148,136,0.07) 0%, transparent 60%)',
                    }}
                  />
                </>
              )}

              {date && (
                <>
                  <div className={`relative mb-1 flex ${colIndex === 6 ? 'justify-start pl-1' : 'items-start'}`}>
                    <span
                      className={`inline-flex items-center justify-center text-xs font-semibold leading-none ${
                        todayCell
                          ? 'cal-day-orb cal-day-orb-sm'
                          : `h-6 w-6 rounded-full ${weekend ? 'text-text-secondary/70' : 'text-text-secondary'} group-hover:text-text`
                      }`}
                      style={
                        todayCell && !dark
                          ? {
                              backgroundImage: 'linear-gradient(145deg,#2DD4BF,#0D9488)',
                              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 6px 18px -4px rgba(13,148,136,0.55)',
                            }
                          : undefined
                      }
                    >
                      {date.getDate()}
                    </span>
                    {dayEvents.length > 0 && !todayCell && (
                      <span className="ml-auto flex items-center gap-1 pt-0.5">
                        {dayEvents.slice(0, 3).map(e => (
                          <span
                            key={e.id}
                            className="h-1.5 w-1.5 rounded-full"
                            style={{
                              backgroundColor: getEventUserColor(e, agents),
                              boxShadow: `0 0 5px ${withAlpha(getEventUserColor(e, agents), 'AA')}`,
                            }}
                          />
                        ))}
                      </span>
                    )}
                  </div>

                  <div className="relative space-y-0.5">
                    {dayEvents.slice(0, 3).map(event => {
                      const cfg = getEventTypeConfig(event.type)
                      const color = getEventUserColor(event, agents)
                      return (
                        <motion.button
                          key={event.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex w-full items-center gap-1 rounded-md px-1 py-0.5 text-left text-[10px] font-medium transition-all duration-150 hover:brightness-110"
                          style={{ backgroundColor: withAlpha(color, '22') }}
                          onClick={(e) => { e.stopPropagation(); onEventClick(event) }}
                        >
                          <span
                            className="h-1 w-1 shrink-0 rounded-full"
                            style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}` }}
                          />
                          <cfg.icon size={9} className="shrink-0 opacity-80" />
                          <span className="truncate">{formatEventRange(event)} {event.title}</span>
                        </motion.button>
                      )
                    })}
                    {dayEvents.length > 3 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onDayClick(date) }}
                        className={`rounded-md px-1 text-[10px] font-bold transition-colors hover:text-accent`}
                        style={{ color: 'inherit', opacity: 0.65 }}
                      >
                        +{dayEvents.length - 3} autres
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
