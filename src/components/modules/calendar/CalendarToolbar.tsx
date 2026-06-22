import { ChevronLeft, ChevronRight, Plus } from 'react-feather'
import { CalendarView, MONTH_NAMES, addDays, addWeeks, addMonths } from '../../../types/calendar'

interface CalendarToolbarProps {
  view: CalendarView
  currentDate: Date
  onViewChange: (view: CalendarView) => void
  onDateChange: (date: Date) => void
  onToday: () => void
  onAddEvent: () => void
}

const VIEWS: { value: CalendarView; label: string }[] = [
  { value: 'day', label: 'Jour' },
  { value: 'week', label: 'Semaine' },
  { value: 'month', label: 'Mois' },
  { value: 'agenda', label: 'Agenda' },
  { value: 'timeline', label: 'Timeline' },
]

export default function CalendarToolbar({
  view, currentDate, onViewChange, onDateChange, onToday, onAddEvent,
}: CalendarToolbarProps) {
  const title = () => {
    if (view === 'day') {
      return currentDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    }
    if (view === 'week' || view === 'timeline') {
      const start = addDays(currentDate, -currentDate.getDay() + 1)
      const end = addDays(start, 6)
      const monthStart = start.toLocaleDateString('fr-FR', { month: 'long' })
      const monthEnd = end.toLocaleDateString('fr-FR', { month: 'long' })
      if (monthStart === monthEnd) {
        return `${monthStart} ${start.getFullYear()}`
      }
      return `${start.getDate()} ${monthStart} - ${end.getDate()} ${monthEnd} ${end.getFullYear()}`
    }
    return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
  }

  const navigate = (direction: -1 | 1) => {
    const offsets: Record<CalendarView, (d: Date, n: number) => Date> = {
      day: addDays,
      week: addWeeks,
      month: addMonths,
      agenda: addMonths,
      timeline: addWeeks,
    }
    onDateChange(offsets[view](currentDate, direction))
  }

  return (
    <div className="flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-3">
        <button onClick={onAddEvent} className="btn-primary text-sm">
          <Plus size={16} />
          Nouvel événement
        </button>
        <button onClick={onToday} className="btn-secondary text-sm">
          Aujourd'hui
        </button>
        <div className="flex items-center border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-background transition-colors border-r border-border"
          >
            <ChevronLeft size={16} className="text-text-secondary" />
          </button>
          <button
            onClick={() => navigate(1)}
            className="p-2 hover:bg-background transition-colors"
          >
            <ChevronRight size={16} className="text-text-secondary" />
          </button>
        </div>
        <h1 className="text-lg font-semibold tracking-tight min-w-[200px]">
          {title()}
        </h1>
      </div>
      <div className="flex bg-background rounded-lg border border-border p-0.5">
        {VIEWS.map(v => (
          <button
            key={v.value}
            onClick={() => onViewChange(v.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
              view === v.value
                ? 'bg-card text-text shadow-sm border border-border/50'
                : 'text-text-secondary hover:text-text'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  )
}
