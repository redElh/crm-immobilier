import { motion } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, Sun, Columns, Grid, List, Activity, Filter,
} from 'react-feather'
import { CalendarView, MONTH_NAMES, addDays, addWeeks, addMonths } from '../../../types/calendar'
import { useStageChrome } from './useStageChrome'

interface CalendarToolbarProps {
  view: CalendarView
  currentDate: Date
  filtersOpen: boolean
  activeFilterCount?: number
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
  view, currentDate, filtersOpen, activeFilterCount = 0, onToggleFilters, onViewChange, onDateChange, onToday,
}: CalendarToolbarProps) {
  const { staged, dark } = useStageChrome()
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
      <div
        className={`relative min-w-[190px] pl-2.5 before:absolute before:left-0 before:top-1/2 before:h-6 before:w-0.5 before:-translate-y-1/2 before:rounded-full ${
          dark ? 'before:bg-gradient-to-b before:from-violet-400 before:to-indigo-500' : 'before:bg-gradient-to-b before:from-teal-500 before:to-emerald-600'
        }`}
      >
        <p className={`text-[9px] font-bold uppercase tracking-[0.22em] ${dark ? 'text-slate-400/70' : 'text-teal-900/45'}`}>
          Période
        </p>
        <h2
          className={`bg-gradient-to-r bg-clip-text text-base font-bold capitalize leading-tight tracking-tight text-transparent ${
            dark ? 'from-white via-indigo-100 to-indigo-300' : 'from-teal-900 via-teal-700 to-emerald-600'
          }`}
        >
          {title}
        </h2>
      </div>

      <div className="ml-auto flex items-center gap-2.5">
        {/* Filters toggle */}
        <button
          onClick={onToggleFilters}
          title="Filtres"
          className={`relative flex h-8 w-8 items-center justify-center rounded-xl border transition-all duration-200 active:scale-95 ${
            filtersOpen
              ? dark
                ? 'border-violet-400/40 bg-violet-500/20 text-violet-200 shadow-[0_0_16px_-4px_rgba(124,92,255,0.7),inset_0_1px_0_rgba(255,255,255,0.25)]'
                : 'border-teal-500/50 bg-teal-500/15 text-teal-800 shadow-[0_0_16px_-4px_rgba(13,148,136,0.6),inset_0_1px_0_rgba(255,255,255,0.7)]'
              : dark
                ? 'border-white/10 bg-white/5 text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] hover:bg-white/10 hover:text-white'
                : 'border-teal-900/10 bg-white/70 text-teal-900/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] hover:bg-white hover:text-teal-900'
          }`}
        >
          <Filter size={14} />
          {activeFilterCount > 0 && (
            <span
              className={`absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-white ${
                dark
                  ? 'bg-gradient-to-br from-fuchsia-400 to-violet-500 shadow-[0_2px_8px_-1px_rgba(124,92,255,0.8)]'
                  : 'bg-gradient-to-br from-teal-400 to-emerald-600 shadow-[0_2px_8px_-1px_rgba(13,148,136,0.8)]'
              }`}
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
                      backgroundImage: dark
                        ? 'linear-gradient(145deg, #8B7CFF 0%, #6C5ECF 60%, #5646C9 100%)'
                        : 'linear-gradient(145deg, #2DD4BF 0%, #14B8A6 60%, #0D9488 100%)',
                      boxShadow: dark
                        ? 'inset 0 1px 0 rgba(255,255,255,0.4), 0 6px 18px -6px rgba(124,92,255,0.7)'
                        : 'inset 0 1px 0 rgba(255,255,255,0.5), 0 6px 18px -8px rgba(13,148,136,0.65)',
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
