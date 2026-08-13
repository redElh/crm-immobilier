import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Clock } from 'react-feather'
import {
  CalendarEvent, getEventTypeConfig, Agent, getEventUserColor, withAlpha, getEventAgentNames,
  formatEventRange,
  getEventsForDay,
} from '../../../types/calendar'

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

  const dayEvents = useMemo(() => {
    if (!date) return []
    return getEventsForDay(events, date).sort((a, b) => a.start.getTime() - b.start.getTime())
  }, [events, date])

  const totalPages = Math.max(1, Math.ceil(dayEvents.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages - 1)
  const pageEvents = dayEvents.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)

  return (
    <AnimatePresence>
      {isOpen && date && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-lg mx-4 bg-card rounded-xl border border-border/50 shadow-modal overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
              <div>
                <h2 className="text-lg font-semibold">
                  {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </h2>
                <p className="text-sm text-text-secondary mt-0.5">
                  {dayEvents.length} événement{dayEvents.length > 1 ? 's' : ''}
                </p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text hover:bg-background transition-all">
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-4 max-h-[50vh] overflow-y-auto space-y-2">
              {pageEvents.length === 0 ? (
                <p className="text-sm text-text-secondary text-center py-8">Aucun événement ce jour</p>
              ) : (
                pageEvents.map(event => {
                  const cfg = getEventTypeConfig(event.type)
                  const color = getEventUserColor(event, agents)
                  const agentNames = getEventAgentNames(event).map(n => n.split(' ')[0])
                  return (
                    <motion.button
                      key={event.id}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="w-full text-left p-3 rounded-lg border hover:opacity-80 transition-opacity cursor-pointer"
                      style={{ backgroundColor: withAlpha(color, '14'), borderColor: withAlpha(color, '40'), borderLeft: `3px solid ${color}` }}
                      onClick={() => onEventClick(event)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center border shrink-0" style={{ backgroundColor: withAlpha(color, '1F'), borderColor: withAlpha(color, '40') }}>
                          <cfg.icon size={18} className={cfg.textColor} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className={`text-sm font-semibold ${cfg.textColor}`}>{event.title}</p>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${cfg.bgColor} ${cfg.textColor} flex-shrink-0`}>
                              {cfg.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-text-secondary">
                            <span className="flex items-center gap-1">
                              <Clock size={11} />
                              {formatEventRange(event)}
                            </span>
                            {agentNames.length > 0 && <span>{agentNames.join(', ')}</span>}
                          </div>
                          {event.clientName && (
                            <p className="text-xs text-text-secondary mt-0.5">Client : {event.clientName}</p>
                          )}
                          {event.description && (
                            <p className="text-xs text-text-secondary/70 mt-0.5 line-clamp-1">{event.description}</p>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  )
                })
              )}
            </div>
            {dayEvents.length > PAGE_SIZE && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-border/30 bg-background/50">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="btn-ghost text-xs disabled:opacity-30"
                >
                  <ChevronLeft size={14} /> Précédent
                </button>
                <span className="text-xs text-text-secondary">
                  Page {currentPage + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="btn-ghost text-xs disabled:opacity-30"
                >
                  Suivant <ChevronRight size={14} />
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
