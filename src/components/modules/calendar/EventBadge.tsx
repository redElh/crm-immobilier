import { CalendarEvent, getEventTypeConfig, AGENTS, Agent, getEventUserColor, withAlpha, formatEventRange } from '../../../types/calendar'
import { cn } from '../../../lib/utils'

interface EventBadgeProps {
  event: CalendarEvent
  compact?: boolean
  onClick?: (e: CalendarEvent) => void
  className?: string
  agents?: Agent[]
}

export default function EventBadge({ event, compact, onClick, className, agents }: EventBadgeProps) {
  const cfg = getEventTypeConfig(event.type)
  const color = getEventUserColor(event, agents)
  const catalog = agents && agents.length > 0 ? agents : AGENTS
  const agentColors = event.agentIds.map(id => catalog.find(a => a.id === id)?.color || '#6B7280')

  if (compact) {
    return (
      <button
        onClick={() => onClick?.(event)}
        className={cn(
          'w-full text-left px-1.5 py-0.5 rounded text-[11px] font-medium truncate border-l-2 transition-colors hover:opacity-80',
          className,
        )}
        style={{ backgroundColor: withAlpha(color, '1F'), borderLeftColor: color }}
      >
        {<cfg.icon size={12} className="inline-block -mt-0.5 shrink-0" />} {event.title}
      </button>
    )
  }

  return (
    <button
      onClick={() => onClick?.(event)}
      className={cn(
        'w-full text-left p-2 rounded-lg border transition-colors hover:opacity-80',
        className,
      )}
      style={{ backgroundColor: withAlpha(color, '14'), borderColor: withAlpha(color, '40'), borderLeft: `3px solid ${color}` }}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="text-xs inline-flex"><cfg.icon size={12} /></span>
        <span className={cn('text-xs font-semibold truncate', cfg.textColor)}>
          {formatEventRange(event)}
        </span>
      </div>
      <p className={cn('text-xs font-medium truncate', cfg.textColor)}>
        {event.title}
      </p>
      {event.clientName && (
        <p className="text-[11px] text-text-secondary truncate mt-0.5">
          {event.clientName}
        </p>
      )}
      {agentColors.length > 0 && (
        <div className="flex gap-1 mt-1">
          {agentColors.map((color, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      )}
    </button>
  )
}
