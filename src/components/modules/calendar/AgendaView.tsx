import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock } from 'react-feather'
import {
  CalendarEvent, getEventTypeConfig, Agent, getEventUserColor, withAlpha, getEventAgentNames,
  formatEventRange, formatFrenchDate, formatFrenchDayName, eventMatchesSelectedAgents,
} from '../../../types/calendar'

interface AgendaViewProps {
  events: CalendarEvent[]
  selectedAgents: string[]
  selectedEventTypes: string[]
  agents?: Agent[]
  onEventClick: (event: CalendarEvent) => void
}

export default function AgendaView({
  events, selectedAgents, selectedEventTypes, agents, onEventClick,
}: AgendaViewProps) {
  const sortedEvents = useMemo(() => {
    return events
      .filter(e => {
        if (selectedEventTypes.length > 0 && !selectedEventTypes.includes(e.type)) return false
        if (!eventMatchesSelectedAgents(e, selectedAgents, agents)) return false
        return true
      })
      .sort((a, b) => a.start.getTime() - b.start.getTime())
  }, [events, selectedAgents, selectedEventTypes])

  const grouped = useMemo(() => {
    const groups: { date: string; label: string; events: CalendarEvent[] }[] = []
    for (const event of sortedEvents) {
      const start = new Date(event.start)
      start.setHours(0, 0, 0, 0)
      const end = new Date(event.end)
      end.setHours(0, 0, 0, 0)
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toLocaleDateString('fr-CA')
        const existing = groups.find(g => g.date === dateKey)
        if (existing) {
          existing.events.push(event)
        } else {
          groups.push({
            date: dateKey,
            label: `${formatFrenchDayName(d)} ${formatFrenchDate(d)}`,
            events: [event],
          })
        }
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
              const cfg = getEventTypeConfig(event.type)
              const color = getEventUserColor(event, agents)
              const agentNames = getEventAgentNames(event)
              return (
                <motion.button
                  key={event.id}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full text-left p-3 rounded-lg border hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: withAlpha(color, '14'), borderColor: withAlpha(color, '40'), borderLeft: `3px solid ${color}` }}
                  onClick={() => onEventClick(event)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center border shrink-0" style={{ backgroundColor: withAlpha(color, '1F'), borderColor: withAlpha(color, '40') }}>
                      <cfg.icon size={20} className={cfg.textColor} />
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
                          {formatEventRange(event)}
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
