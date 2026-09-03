import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Clock, Calendar } from 'react-feather'
import {
  CalendarEvent, getEventTypeConfig, Agent, getEventUserColor, withAlpha, getEventAgentNames,
  formatEventRange, readableChipText,
  getEventsForDay,
} from '../../../types/calendar'
import StageModal, { useStageFormClasses } from './StageModal'

interface DayEventsModalProps {
  isOpen: boolean
  date: Date | null
  events: CalendarEvent[]
  agents?: Agent[]
  onClose: () => void
  onEventClick: (event: CalendarEvent) => void
}

const PAGE_SIZE = 5

export default function DayEventsModal({ isOpen, date, events, agents, onClose, onEventClick }: DayEventsModalProps) {
  const [page, setPage] = useState(0)
  const { staged, dark } = useStageFormClasses()

  const dayEvents = useMemo(() => {
    if (!date) return []
    return getEventsForDay(events, date).sort((a, b) => a.start.getTime() - b.start.getTime())
  }, [events, date])

  const totalPages = Math.max(1, Math.ceil(dayEvents.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages - 1)
  const pageEvents = dayEvents.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)

  return (
    <StageModal
      open={isOpen && date !== null}
      onClose={onClose}
      eyebrow="Planning du jour"
      title={
        date
          ? date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
          : ''
      }
      subtitle={`${dayEvents.length} événement${dayEvents.length > 1 ? 's' : ''} programmé${dayEvents.length > 1 ? 's' : ''}`}
      icon={Calendar}
      maxWidth="max-w-lg"
      bodyClassName="max-h-[52vh] overflow-y-auto scrollbar-thin space-y-2 pt-1"
      footer={
        dayEvents.length > PAGE_SIZE ? (
          <>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className={`${staged ? (dark ? 'border-white/12 bg-white/5 text-slate-300 hover:bg-white/10' : 'border-teal-900/12 bg-white/70 text-teal-900/70 hover:bg-white') : 'btn-ghost'} inline-flex h-8 items-center gap-1 rounded-xl border px-3 text-xs font-semibold transition-all disabled:opacity-30`}
            >
              <ChevronLeft size={13} /> Précédent
            </button>
            <div className="mx-2 flex items-center gap-1.5">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  aria-label={`Page ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentPage ? 'w-5 bg-gradient-to-r from-violet-400 to-indigo-500' : 'w-1.5 bg-slate-500/40 hover:bg-slate-400/60'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              className={`${staged ? (dark ? 'border-white/12 bg-white/5 text-slate-300 hover:bg-white/10' : 'border-teal-900/12 bg-white/70 text-teal-900/70 hover:bg-white') : 'btn-ghost'} inline-flex h-8 items-center gap-1 rounded-xl border px-3 text-xs font-semibold transition-all disabled:opacity-30`}
            >
              Suivant <ChevronRight size={13} />
            </button>
          </>
        ) : undefined
      }
    >
      {pageEvents.length === 0 ? (
        <p className={`py-10 text-center text-sm ${staged ? 'text-slate-500' : 'text-text-secondary'}`}>
          Aucun événement ce jour
        </p>
      ) : (
        pageEvents.map(event => {
          const cfg = getEventTypeConfig(event.type)
          const color = getEventUserColor(event, agents)
          const txt = readableChipText(color, dark)
          const agentNames = getEventAgentNames(event).map(n => n.split(' ')[0])
          return (
            <motion.button
              key={event.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ x: 3 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              className="cal-event-glow w-full overflow-hidden rounded-xl border text-left"
              style={{
                backgroundColor: withAlpha(color, '17'),
                borderColor: withAlpha(color, '38'),
                borderLeft: `3px solid ${color}`,
                ['--evc' as never]: withAlpha(color, '44'),
              }}
              onClick={() => onEventClick(event)}
            >
              <div className="flex items-start gap-3 p-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border"
                  style={{
                    backgroundColor: withAlpha(color, '1F'),
                    borderColor: withAlpha(color, '4D'),
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 12px -4px ${withAlpha(color, '66')}`,
                  }}
                >
                  <cfg.icon size={17} style={{ color: txt }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold tracking-tight" style={{ color: txt }}>{event.title}</p>
                    <span
                      className="rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: withAlpha(color, '22'),
                        color: txt,
                        boxShadow: `inset 0 0 0 1px ${withAlpha(color, '45')}`,
                      }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <div className={`flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs ${staged ? (dark ? 'text-slate-400' : 'text-teal-900/60') : 'text-text-secondary'}`}>
                    <span className="flex items-center gap-1 font-medium">
                      <Clock size={11} />
                      {formatEventRange(event)}
                    </span>
                    {agentNames.length > 0 && <span>{agentNames.join(' · ')}</span>}
                  </div>
                  {event.clientName && (
                    <p className={`mt-0.5 text-xs ${staged ? (dark ? 'text-slate-500' : 'text-teal-900/50') : 'text-text-secondary'}`}>
                      Client : {event.clientName}
                    </p>
                  )}
                  {event.description && (
                    <p className={`mt-0.5 line-clamp-1 text-xs opacity-70 ${staged ? (dark ? 'text-slate-500' : 'text-teal-900/50') : 'text-text-secondary'}`}>
                      {event.description}
                    </p>
                  )}
                </div>
              </div>
            </motion.button>
          )
        })
      )}
    </StageModal>
  )
}
