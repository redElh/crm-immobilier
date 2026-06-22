import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarEvent, EVENT_TYPE_CONFIG,
  getEventsForMonth, getMonthDays, isToday,
} from '../../../types/calendar'

interface MonthViewProps {
  currentDate: Date
  events: CalendarEvent[]
  selectedEventTypes: string[]
  onEventClick: (event: CalendarEvent) => void
  onDayClick: (date: Date) => void
}

const DAY_NAMES_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export default function MonthView({
  currentDate, events, selectedEventTypes, onEventClick, onDayClick,
}: MonthViewProps) {
  const monthDays = useMemo(() => getMonthDays(currentDate), [currentDate])
  const monthEvents = useMemo(() => getEventsForMonth(events, currentDate), [events, currentDate])

  const getEventsForDay = (date: Date | null) => {
    if (!date) return []
    return monthEvents.filter(e => {
      return selectedEventTypes.length === 0 || selectedEventTypes.includes(e.type)
    }).filter(e => {
      const start = new Date(e.start)
      return start.getFullYear() === date.getFullYear() &&
        start.getMonth() === date.getMonth() &&
        start.getDate() === date.getDate()
    })
  }

  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border/40 bg-background/50">
        {DAY_NAMES_SHORT.map(name => (
          <div key={name} className="p-2 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider border-r border-border/20 last:border-r-0">
            {name}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 divide-x divide-border/20">
        {monthDays.map((date, i) => {
          const dayEvents = getEventsForDay(date)
          return (
            <div
              key={i}
              className={`min-h-[100px] p-1.5 border-b border-border/20 cursor-pointer transition-colors ${
                !date ? 'bg-gray-50/50' : ''
              } ${date && isToday(date) ? 'bg-accent/[0.04]' : ''} hover:bg-accent/[0.04]`}
              onClick={() => date && onDayClick(date)}
            >
              {date && (
                <>
                  <div className="flex items-center justify-center mb-1">
                    <span className={`text-xs font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                      isToday(date) ? 'bg-accent text-white text-sm font-bold' : 'text-text-secondary'
                    }`}>
                      {date.getDate()}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map(event => {
                      const cfg = EVENT_TYPE_CONFIG[event.type]
                      return (
                        <motion.button
                          key={event.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={`w-full text-left px-1 py-0.5 rounded text-[10px] font-medium truncate ${cfg.bgColor} ${cfg.textColor} hover:opacity-80 transition-opacity`}
                          onClick={(e) => { e.stopPropagation(); onEventClick(event) }}
                        >
                          {cfg.icon} {event.title}
                        </motion.button>
                      )
                    })}
                    {dayEvents.length > 3 && (
                      <p className="text-[10px] text-text-secondary pl-1">
                        +{dayEvents.length - 3} autres
                      </p>
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
