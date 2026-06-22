import { motion, AnimatePresence } from 'framer-motion'
import { X, Edit3, Trash2, Phone, Mail, MapPin, Key, Calendar, User } from 'react-feather'
import {
  CalendarEvent, EVENT_TYPE_CONFIG, AGENTS, formatFrenchDate, formatTime,
} from '../../../types/calendar'

interface EventDetailPanelProps {
  event: CalendarEvent | null
  onClose: () => void
  onEdit: (event: CalendarEvent) => void
  onDelete: (eventId: string) => void
}

export default function EventDetailPanel({ event, onClose, onEdit, onDelete }: EventDetailPanelProps) {
  if (!event) return null
  const cfg = EVENT_TYPE_CONFIG[event.type]
  const agentNames = event.agentIds.map(id => AGENTS.find(a => a.id === id)).filter(Boolean)

  return (
    <AnimatePresence>
      {event && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden"
        >
          <div className={`px-4 py-3 border-b border-border/30 ${cfg.bgColor}`}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bgColor} ${cfg.textColor} border ${cfg.borderColor}`}>
                {cfg.icon} {cfg.label}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEdit(event)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-text-secondary hover:text-text hover:bg-background/50 transition-all"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={() => onClose()}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-text-secondary hover:text-text hover:bg-background/50 transition-all"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
            <h3 className="text-base font-semibold text-text">{event.title}</h3>
          </div>

          <div className="p-4 space-y-4">
            <div className="flex items-start gap-3">
              <Calendar size={14} className="text-text-secondary mt-0.5" />
              <div>
                <p className="text-sm text-text">
                  {formatFrenchDate(event.start)}
                </p>
                {!event.allDay && (
                  <p className="text-sm text-text-secondary">
                    {formatTime(event.start)} - {formatTime(event.end)}
                  </p>
                )}
                {event.allDay && (
                  <p className="text-sm text-text-secondary">Journée entière</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User size={14} className="text-text-secondary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-text">Agent(s)</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {agentNames.map(agent => agent && (
                    <span
                      key={agent.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: agent.color }}
                    >
                      {agent.initials} {agent.name.split(' ')[0]}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {event.clientName && (
              <div className="flex items-start gap-3">
                <User size={14} className="text-text-secondary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-text">Client</p>
                  <p className="text-sm text-text-secondary">{event.clientName}</p>
                  {event.clientPhone && (
                    <p className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
                      <Phone size={10} /> {event.clientPhone}
                    </p>
                  )}
                  {event.clientEmail && (
                    <p className="text-xs text-text-secondary flex items-center gap-1">
                      <Mail size={10} /> {event.clientEmail}
                    </p>
                  )}
                </div>
              </div>
            )}

            {event.propertyName && (
              <div className="flex items-start gap-3">
                <MapPin size={14} className="text-text-secondary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-text">Bien</p>
                  <p className="text-sm text-text-secondary">{event.propertyName}</p>
                  {event.propertyRef && (
                    <p className="text-xs text-text-secondary">Réf {event.propertyRef}</p>
                  )}
                </div>
              </div>
            )}

            {event.location && (
              <div className="flex items-start gap-3">
                <MapPin size={14} className="text-text-secondary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-text">Adresse</p>
                  <p className="text-sm text-text-secondary">{event.location}</p>
                </div>
              </div>
            )}

            {event.keysInfo && (
              <div className="flex items-start gap-3">
                <Key size={14} className="text-text-secondary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-text">Clés</p>
                  <p className="text-sm text-text-secondary">{event.keysInfo}</p>
                </div>
              </div>
            )}

            {event.description && (
              <div>
                <p className="text-sm font-medium text-text mb-1">Description</p>
                <p className="text-sm text-text-secondary bg-background rounded-lg p-3">
                  {event.description}
                </p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-text mb-1.5">Historique</p>
              <div className="space-y-1 text-xs text-text-secondary">
                <p>• Créé par {event.createdBy} le {formatFrenchDate(event.createdAt)}</p>
                {event.googleSync && <p>• Google Agenda : Synchronisé</p>}
              </div>
            </div>

            {event.reminders.length > 0 && (
              <div>
                <p className="text-sm font-medium text-text mb-1">Rappels</p>
                <div className="flex flex-wrap gap-1.5">
                  {event.reminders.map((r, i) => (
                    <span
                      key={i}
                      className={`px-2 py-0.5 rounded text-xs ${
                        r.sent ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-background text-text-secondary border border-border'
                      }`}
                    >
                      {r.label} {r.sent ? '(envoyé)' : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="px-4 py-3 border-t border-border/30 flex gap-2">
            <button
              onClick={() => onEdit(event)}
              className="btn-secondary text-sm flex-1"
            >
              <Edit3 size={14} /> Modifier
            </button>
            <button
              onClick={() => onDelete(event.id)}
              className="btn-secondary text-sm text-error hover:text-error flex-1"
            >
              <Trash2 size={14} /> Annuler l'événement
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
