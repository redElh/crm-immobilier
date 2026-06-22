import { CalendarEvent, EVENT_TYPE_CONFIG, AGENTS } from '../../../types/calendar'
import { cn } from '../../../lib/utils'

interface EventBadgeProps {
  event: CalendarEvent
  compact?: boolean
  onClick?: (e: CalendarEvent) => void
  className?: string
}

export default function EventBadge({ event, compact, onClick, className }: EventBadgeProps) {
  const cfg = EVENT_TYPE_CONFIG[event.type]
  const agentColors = event.agentIds.map(id => AGENTS.find(a => a.id === id)?.color || '#6B7280')

  if (compact) {
    return (
      <button
        onClick={() => onClick?.(event)}
        className={cn(
          'w-full text-left px-1.5 py-0.5 rounded text-[11px] font-medium truncate border-l-2 transition-colors hover:opacity-80',
          cfg.bgColor, cfg.textColor, cfg.borderColor,
          className,
        )}
      >
        {cfg.icon} {event.title}
      </button>
    )
  }

  return (
    <button
      onClick={() => onClick?.(event)}
      className={cn(
        'w-full text-left p-2 rounded-lg border transition-colors hover:opacity-80',
        cfg.bgColor, cfg.borderColor,
        className,
      )}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="text-xs">{cfg.icon}</span>
        <span className={cn('text-xs font-semibold', cfg.textColor)}>
          {event.start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
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
