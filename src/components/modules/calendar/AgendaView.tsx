import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Clock } from 'react-feather'
import { STAGE_HUES, OrbIcon } from '../../dashboard/Stage'
import { useStageChrome } from './useStageChrome'
import {
  CalendarEvent, getEventTypeConfig, Agent, getEventUserColor, withAlpha, getEventAgentNames,
  formatEventRange, readableChipText, formatFrenchDate, formatFrenchDayName, eventMatchesSelectedAgents,
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
  const { staged, dark } = useStageChrome()

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
    const groups: { date: string; label: string; dayNum: number; isToday: boolean; events: CalendarEvent[] }[] = []
    const today = new Date()
    for (const event of sortedEvents) {
      const start = new Date(event.start)
      start.setHours(0, 0, 0, 0)
      const end = new Date(event.end)
      end.setHours(0, 0, 0, 0)
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toLocaleDateString('fr-CA')
        const existing = groups.find(g => g.date === dateKey)
        const isToday = d.toDateString() === today.toDateString()
        if (existing) {
          existing.events.push(event)
        } else {
          groups.push({
            date: dateKey,
            label: `${formatFrenchDayName(d)} ${formatFrenchDate(d)}`,
            dayNum: d.getDate(),
            isToday,
            events: [event],
          })
        }
      }
    }
    return groups
  }, [sortedEvents])

  if (sortedEvents.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center rounded-2xl py-16 ${staged ? 'stage-glass' : 'border border-border/50 bg-card'}`}>
        <OrbIcon icon={Clock} hue={STAGE_HUES.violet} size={52} radius={16} />
        <p className={`mt-3 text-sm font-medium ${staged ? (dark ? 'text-slate-400' : 'text-teal-900/60') : 'text-text-secondary'}`}>
          Aucun événement à venir
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {grouped.map(group => (
        <div key={group.date}>
          {/* Sticky date capsule */}
          <div className="sticky top-0 z-10 mb-3">
            <div
              className={`inline-flex items-center gap-2.5 rounded-2xl border px-3 py-1.5 backdrop-blur-xl ${
                !staged
                  ? 'border-border/60 bg-card/90 shadow-card'
                  : dark
                    ? 'border-white/10 bg-[#0d1228]/85 shadow-[0_12px_32px_-14px_rgba(2,4,18,0.9)]'
                    : 'border-white/80 bg-white/85 shadow-[0_12px_32px_-16px_rgba(13,148,136,0.5)]'
              }`}
            >
              {group.isToday ? (
                <span
                  className="cal-day-orb cal-day-orb-sm"
                  style={
                    !dark && staged
                      ? {
                          backgroundImage: 'linear-gradient(145deg,#2DD4BF,#0D9488)',
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 6px 18px -4px rgba(13,148,136,0.55)',
                        }
                      : undefined
                  }
                >
                  {group.dayNum}
                </span>
              ) : (
                <span
                  className={`flex h-[26px] w-[26px] items-center justify-center rounded-full border text-[11px] font-bold ${
                    !staged
                      ? 'border-border bg-background text-text-secondary'
                      : dark
                        ? 'border-white/15 bg-white/5 text-slate-300'
                        : 'border-teal-900/15 bg-white text-teal-900/70'
                  }`}
                >
                  {group.dayNum}
                </span>
              )}
              <span className={`text-xs font-bold capitalize tracking-tight ${staged ? (dark ? 'text-slate-200' : 'text-teal-950') : 'text-text'}`}>
                {group.label}
              </span>
              <span
                className={`rounded-full px-1.5 py-px text-[9px] font-bold ${
                  !staged
                    ? 'bg-accent-light text-accent'
                    : dark
                      ? 'bg-violet-500/20 text-violet-300'
                      : 'bg-teal-500/15 text-teal-700'
                }`}
              >
                {group.events.length}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {group.events.map(event => {
              const cfg = getEventTypeConfig(event.type)
              const color = getEventUserColor(event, agents)
              const txt = readableChipText(color, dark)
              const agentNames = getEventAgentNames(event)
              return (
                <motion.button
                  key={event.id}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ x: 3 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  className="cal-event-glow w-full overflow-hidden rounded-xl border text-left"
                  style={{
                    backgroundColor: withAlpha(color, '17'),
                    borderColor: withAlpha(color, '40'),
                    borderLeft: `3px solid ${color}`,
                    ['--evc' as never]: withAlpha(color, '40'),
                  }}
                  onClick={() => onEventClick(event)}
                >
                  <div className="flex items-start gap-3 p-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                      style={{
                        backgroundColor: withAlpha(color, '1F'),
                        borderColor: withAlpha(color, '4D'),
                        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 12px -4px ${withAlpha(color, '66')}`,
                      }}
                    >
                      <cfg.icon size={19} style={{ color: txt }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold tracking-tight" style={{ color: txt }}>{event.title}</p>
                        <span
                          className="rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                          style={{
                            backgroundColor: withAlpha(color, dark ? '26' : '1A'),
                            color: txt,
                            boxShadow: `inset 0 0 0 1px ${withAlpha(color, dark ? '40' : '33')}`,
                          }}
                        >
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-text-secondary">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock size={11} />
                          {formatEventRange(event)}
                        </span>
                        {agentNames.length > 0 && (
                          <span className="truncate">{agentNames.join(' · ')}</span>
                        )}
                      </div>
                      {event.clientName && (
                        <p className="mt-1 text-xs text-text-secondary">Client : {event.clientName}</p>
                      )}
                      {event.propertyName && (
                        <p className="text-xs text-text-secondary">Bien : {event.propertyName}</p>
                      )}
                      {event.description && (
                        <p className="mt-1 line-clamp-1 text-xs text-text-secondary/70">{event.description}</p>
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
