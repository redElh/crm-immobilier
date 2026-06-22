import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock } from 'react-feather'
import {
  CalendarEvent, EVENT_TYPE_CONFIG, AGENTS,
  formatFrenchDate, formatTime, formatFrenchDayName,
} from '../../../types/calendar'

interface AgendaViewProps {
  events: CalendarEvent[]
  selectedAgents: string[]
  selectedEventTypes: string[]
  onEventClick: (event: CalendarEvent) => void
}

export default function AgendaView({
  events, selectedAgents, selectedEventTypes, onEventClick,
}: AgendaViewProps) {
  const sortedEvents = useMemo(() => {
    return events
      .filter(e => {
        if (selectedEventTypes.length > 0 && !selectedEventTypes.includes(e.type)) return false
        if (selectedAgents.length > 0 && !e.agentIds.some(a => selectedAgents.includes(a))) return false
        return true
      })
      .sort((a, b) => a.start.getTime() - b.start.getTime())
  }, [events, selectedAgents, selectedEventTypes])

  const grouped = useMemo(() => {
    const groups: { date: string; label: string; events: CalendarEvent[] }[] = []
    for (const event of sortedEvents) {
      const dateKey = event.start.toLocaleDateString('fr-CA')
      const existing = groups.find(g => g.date === dateKey)
      if (existing) {
        existing.events.push(event)
      } else {
        groups.push({
          date: dateKey,
          label: `${formatFrenchDayName(event.start)} ${formatFrenchDate(event.start)}`,
          events: [event],
        })
      }
    }
    return groups
  }, [sortedEvents])

  if (sortedEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-text-secondary">
        <Calendar size={36} className="opacity-30 mb-3" />
        <p className="text-sm">Aucun événement à venir</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {grouped.map(group => (
        <div key={group.date}>
          <h3 className="text-sm font-semibold text-text-secondary mb-3 sticky top-0 bg-background py-2 z-10 border-b border-border/20">
            {group.label}
          </h3>
          <div className="space-y-2">
            {group.events.map(event => {
              const cfg = EVENT_TYPE_CONFIG[event.type]
              const agentNames = event.agentIds
                .map(id => AGENTS.find(a => a.id === id)?.name)
                .filter(Boolean)
              return (
                <motion.button
                  key={event.id}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`w-full text-left p-3 rounded-lg border ${cfg.bgColor} ${cfg.borderColor} hover:opacity-80 transition-opacity`}
                  onClick={() => onEventClick(event)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${cfg.bgColor} ${cfg.borderColor} border shrink-0`}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={`text-sm font-semibold ${cfg.textColor}`}>{event.title}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${cfg.bgColor} ${cfg.textColor}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-text-secondary">
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {formatTime(event.start)} - {formatTime(event.end)}
                        </span>
                        {agentNames.length > 0 && (
                          <span>{agentNames.join(', ')}</span>
                        )}
                      </div>
                      {event.clientName && (
                        <p className="text-xs text-text-secondary mt-1">
                          Client : {event.clientName}
                        </p>
                      )}
                      {event.propertyName && (
                        <p className="text-xs text-text-secondary">
                          Bien : {event.propertyName}
                        </p>
                      )}
                      {event.description && (
                        <p className="text-xs text-text-secondary/70 mt-1 line-clamp-1">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
