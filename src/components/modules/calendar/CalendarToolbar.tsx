import { motion } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, Sun, Columns, Grid, List, Activity, Filter,
} from 'react-feather'
import { CalendarView, MONTH_NAMES, addDays, addWeeks, addMonths } from '../../../types/calendar'
import { useStageAccent } from '../../dashboard/Stage'
import { useStageChrome } from './useStageChrome'

interface CalendarToolbarProps {
  view: CalendarView
  currentDate: Date
  filtersOpen: boolean
  activeFilterCount?: number
  eventCount?: number
  onToggleFilters: () => void
  onViewChange: (view: CalendarView) => void
  onDateChange: (date: Date) => void
  onToday: () => void
}

const VIEWS: { value: CalendarView; label: string; icon: React.ComponentType<{ size?: number | string; className?: string }> }[] = [
  { value: 'day', label: 'Jour', icon: Sun },
  { value: 'week', label: 'Semaine', icon: Columns },
  { value: 'month', label: 'Mois', icon: Grid },
  { value: 'agenda', label: 'Agenda', icon: List },
  { value: 'timeline', label: 'Timeline', icon: Activity },
]

function usePeriodLabel(view: CalendarView, currentDate: Date) {
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
    return `${start.getDate()} ${monthStart} – ${end.getDate()} ${monthEnd} ${end.getFullYear()}`
  }
  return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
}

function useNavigate(view: CalendarView, currentDate: Date, onDateChange: (d: Date) => void) {
  return (direction: -1 | 1) => {
    const offsets: Record<CalendarView, (d: Date, n: number) => Date> = {
      day: addDays,
      week: addWeeks,
      month: addMonths,
      agenda: addMonths,
      timeline: addWeeks,
    }
    onDateChange(offsets[view](currentDate, direction))
  }
}

export default function CalendarToolbar({
  view, currentDate, filtersOpen, activeFilterCount = 0, eventCount, onToggleFilters, onViewChange, onDateChange, onToday,
}: CalendarToolbarProps) {
  const { staged, dark } = useStageChrome()
  const accent = useStageAccent()
  const title = usePeriodLabel(view, currentDate)
  const navigate = useNavigate(view, currentDate, onDateChange)

  /* Admin shell — classic token styling */
  if (!staged) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/50 bg-card p-2 shadow-card">
        <div className="flex items-center gap-1">
          <button onClick={() => navigate(-1)} aria-label="Période précédente" className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-background">
            <ChevronLeft size={15} />
          </button>
          <button onClick={onToday} className="btn-secondary h-8 px-3 text-xs uppercase tracking-wider">Aujourd'hui</button>
          <button onClick={() => navigate(1)} aria-label="Période suivante" className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-background">
            <ChevronRight size={15} />
          </button>
        </div>
        <h2 className="min-w-[190px] pl-1.5 text-base font-semibold capitalize tracking-tight text-text">{title}</h2>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onToggleFilters}
            title="Filtres"
            className={`relative flex h-8 w-8 items-center justify-center rounded-xl border transition-all ${
              filtersOpen ? 'border-accent bg-accent text-white' : 'border-border text-text-secondary hover:bg-background'
            }`}
          >
            <Filter size={14} />
            {activeFilterCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
          <div className="flex items-center gap-0.5 rounded-xl border border-border bg-background p-1">
            {VIEWS.map(v => (
              <button
                key={v.value}
                type="button"
                onClick={() => onViewChange(v.value)}
                title={v.label}
                className={`flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors ${
                  view === v.value ? 'bg-card text-text shadow-sm border border-border/50' : 'text-text-secondary hover:text-text'
                }`}
              >
                <v.icon size={13} />
                <span className={`${view === v.value ? '' : 'hidden'} lg:inline`}>{v.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const navBtn = `flex h-8 w-8 items-center justify-center rounded-xl border transition-all duration-200 active:scale-95 ${
    dark
      ? 'border-white/10 bg-white/5 text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] hover:bg-white/10 hover:text-white'
      : 'border-teal-900/10 bg-white/70 text-teal-900/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] hover:bg-white hover:text-teal-900'
  }`

  return (
    <div className="stage-glass flex flex-wrap items-center gap-3 rounded-2xl px-4 py-2.5">
      {/* Time navigation cluster */}
      <div className="flex items-center gap-1">
        <button onClick={() => navigate(-1)} aria-label="Période précédente" className={navBtn}>
          <ChevronLeft size={15} />
        </button>
        <button
          onClick={onToday}
          className={`rounded-xl border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all duration-200 active:scale-95 ${
            dark
              ? 'border-white/10 bg-white/5 text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] hover:bg-white/10 hover:text-white'
              : 'border-teal-900/10 bg-white/70 text-teal-900/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] hover:bg-white hover:text-teal-900'
          }`}
        >
          Aujourd'hui
        </button>
        <button onClick={() => navigate(1)} aria-label="Période suivante" className={navBtn}>
          <ChevronRight size={15} />
        </button>
      </div>

      {/* Period label */}
      <div className="relative min-w-[190px] pl-2.5">
        <span
          className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full"
          style={{ backgroundImage: `linear-gradient(180deg, ${accent.a}, ${accent.b})` }}
        />
        <p className={`text-[9px] font-bold uppercase tracking-[0.22em] ${dark ? 'text-slate-400/70' : 'text-teal-900/45'}`}>
          Période
        </p>
        <div className="flex items-center gap-2">
          <h2
            className="bg-clip-text text-base font-bold capitalize leading-tight tracking-tight text-transparent"
            style={{ backgroundImage: dark ? `linear-gradient(90deg, #FFFFFF, ${accent.a})` : `linear-gradient(90deg, ${accent.b}, ${accent.a})` }}
          >
            {title}
          </h2>
          {typeof eventCount === 'number' && (
            <span
              className={`rounded-full border px-1.5 py-0.5 text-[9px] font-extrabold tabular-nums ${
                dark ? 'border-white/10 bg-white/[0.06] text-slate-300' : 'border-teal-900/10 bg-white/80 text-teal-900/65'
              }`}
            >
              {eventCount}
            </span>
          )}
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2.5">
        {/* Filters toggle */}
        <button
          onClick={onToggleFilters}
          title="Filtres"
          style={filtersOpen ? {
            borderColor: `${accent.a}66`,
            backgroundColor: `${accent.a}24`,
            color: dark ? accent.a : accent.b,
            boxShadow: `0 0 16px -4px ${accent.glow}, inset 0 1px 0 rgba(255,255,255,0.25)`,
          } : undefined}
          className={`relative flex h-8 w-8 items-center justify-center rounded-xl border transition-all duration-200 active:scale-95 ${
            !filtersOpen
              ? dark
                ? 'border-white/10 bg-white/5 text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] hover:bg-white/10 hover:text-white'
                : 'border-teal-900/10 bg-white/70 text-teal-900/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] hover:bg-white hover:text-teal-900'
              : ''
          }`}
        >
          <Filter size={14} />
          {activeFilterCount > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
              style={{
                backgroundImage: `linear-gradient(145deg, ${accent.a}, ${accent.b})`,
                boxShadow: `0 2px 8px -1px ${accent.glow}`,
              }}
            >
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* View switcher */}
        <div className={`flex items-center gap-0.5 rounded-xl border p-1 ${dark ? 'border-white/10 bg-black/20' : 'border-teal-900/10 bg-black/[0.04]'}`}>
          {VIEWS.map(v => {
            const Icon = v.icon
            const active = view === v.value
            return (
              <button
                key={v.value}
                type="button"
                onClick={() => onViewChange(v.value)}
                title={v.label}
                className={`relative flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors duration-200 ${
                  active ? 'text-white' : dark ? 'text-slate-400 hover:text-slate-200' : 'text-teal-900/55 hover:text-teal-900'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="cal-view-pill"
                    className="absolute inset-0 rounded-lg border border-white/20"
                    style={{
                      backgroundImage: `linear-gradient(145deg, ${accent.a} 0%, ${accent.b} 100%)`,
                      boxShadow: dark
                        ? `inset 0 1px 0 rgba(255,255,255,0.4), 0 6px 18px -6px ${accent.glow}`
                        : `inset 0 1px 0 rgba(255,255,255,0.5), 0 6px 18px -8px ${accent.glow}`,
                    }}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <Icon size={13} className="relative z-10" />
                <span className={`relative z-10 ${active ? '' : 'hidden'} lg:inline`}>{v.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
