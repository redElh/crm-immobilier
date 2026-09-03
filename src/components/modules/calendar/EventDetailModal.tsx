import { motion } from 'framer-motion'
import { Edit3, Trash2, Phone, Mail, MapPin, Key, Calendar, User } from 'react-feather'
import {
  CalendarEvent, getEventTypeConfig, Agent, AGENTS, getEventUserColor, withAlpha, getAgentColor, getInitials, formatFrenchDate, formatTime,
} from '../../../types/calendar'
import StageModal, { useStageFormClasses, useStageModalButtons } from './StageModal'

interface EventDetailModalProps {
  event: CalendarEvent | null
  agents?: Agent[]
  onClose: () => void
  onEdit: (event: CalendarEvent) => void
  onDelete: (eventId: string) => void
  canWrite?: boolean
}

function InfoTile({
  icon: Icon,
  tint,
  label,
  children,
  staged,
  dark,
}: {
  icon: React.ComponentType<{ size?: number | string; className?: string; style?: React.CSSProperties }>
  tint: string
  label: string
  children: React.ReactNode
  staged: boolean
  dark: boolean
}) {
  return (
    <div
      className={`flex items-start gap-2.5 rounded-xl border p-3 ${
        staged
          ? dark
            ? 'border-white/[0.07] bg-white/[0.03]'
            : 'border-teal-900/[0.08] bg-white/60'
          : 'border-border/70 bg-background'
      }`}
    >
      <span
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border"
        style={{
          borderColor: withAlpha(tint, '4D'),
          backgroundColor: withAlpha(tint, '1F'),
          boxShadow: `0 4px 12px -6px ${withAlpha(tint, '88')}`,
        }}
      >
        <Icon size={13} style={{ color: tint }} />
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-[9px] font-bold uppercase tracking-[0.18em] ${staged ? (dark ? 'text-slate-500' : 'text-teal-900/40') : 'text-text-secondary/80'}`}>
          {label}
        </p>
        <div className="mt-0.5">{children}</div>
      </div>
    </div>
  )
}

export default function EventDetailModal({ event, agents, onClose, onEdit, onDelete, canWrite = true }: EventDetailModalProps) {
  const { staged, dark } = useStageFormClasses()
  const btns = useStageModalButtons()
  if (!event) return null

  const cfg = getEventTypeConfig(event.type)
  const color = getEventUserColor(event, agents)
  const catalog = agents && agents.length > 0 ? agents : AGENTS
  const chipColor = (name: string) => catalog.find(a => a.name.replace(/\s+/g, ' ').trim() === name.replace(/\s+/g, ' ').trim())?.color || getAgentColor(name)

  const bodyText = staged ? (dark ? 'text-sm text-slate-200' : 'text-sm text-teal-950/85') : 'text-sm text-text'
  const subText = staged ? (dark ? 'text-xs text-slate-400' : 'text-xs text-teal-900/55') : 'text-xs text-text-secondary'
  /* Resolves to '' for admin mode so token classes below stay authoritative */
  const tone = (darkCls: string, lightCls: string) => (staged ? (dark ? darkCls : lightCls) : '')

  return (
    <StageModal
      open={Boolean(event)}
      onClose={onClose}
      eyebrow="Détail de l'événement"
      title={event.title}
      icon={cfg.icon}
      accent={color}
      maxWidth="max-w-lg"
      badge={
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{
            backgroundColor: withAlpha(color, '26'),
            color,
            boxShadow: `inset 0 0 0 1px ${withAlpha(color, '59')}, 0 0 12px -4px ${withAlpha(color, '99')}`,
          }}
        >
          <cfg.icon size={10} /> {cfg.label}
        </span>
      }
      bodyClassName="max-h-[58vh] overflow-y-auto scrollbar-thin space-y-2.5 pt-1"
      footer={
        canWrite ? (
          <>
            <button
              onClick={() => onDelete(event.id)}
              className={`${btns.ghost} transition-colors`}
              style={{
                borderColor: 'rgba(251,113,133,0.35)',
                color: staged && dark ? '#FDA4AF' : '#E11D48',
              }}
            >
              <Trash2 size={14} /> Annuler
            </button>
            <button onClick={() => onEdit(event)} className={btns.primary}>
              <Edit3 size={14} /> Modifier
            </button>
          </>
        ) : (
          <div className={`w-full text-center text-xs py-1 ${tone('text-slate-500', 'text-teal-900/50') || 'text-text-secondary'}`}>
            Lecture seule — vous ne pouvez pas modifier cet événement.
          </div>
        )
      }
    >
      {/* Schedule banner */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-3 overflow-hidden rounded-xl border p-3.5"
        style={{
          borderColor: withAlpha(color, '40'),
          background: `linear-gradient(135deg, ${withAlpha(color, '26')}, ${withAlpha(color, '0D')})`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 24px -10px ${withAlpha(color, '66')}`,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="text-center">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color }}>
              Début
            </p>
            <p className="font-mono text-lg font-extrabold leading-tight" style={{ color }}>
              {formatTime(event.start)}
            </p>
            <p className={`text-[10px] ${tone('text-slate-400', 'text-teal-900/55') || 'text-text-secondary'}`}>
              {formatFrenchDate(event.start)}
            </p>
          </div>
          <div className="flex flex-col items-center px-1">
            <span className="h-1 w-1 rounded-full" style={{ backgroundColor: color }} />
            <span className="my-0.5 h-px w-8" style={{ background: `linear-gradient(90deg, transparent, ${withAlpha(color, '99')}, transparent)` }} />
            <span className="h-1 w-1 rounded-full" style={{ backgroundColor: color }} />
          </div>
          <div className="text-center">
            <p className={`font-mono text-[9px] font-bold uppercase tracking-[0.18em] ${tone('text-slate-500', 'text-teal-900/40') || 'text-text-secondary'}`}>
              Fin
            </p>
            <p className={`font-mono text-lg font-extrabold leading-tight ${staged ? (dark ? 'text-slate-100' : 'text-teal-950') : 'text-text'}`}>
              {formatTime(event.end)}
            </p>
            <p className={`text-[10px] ${tone('text-slate-400', 'text-teal-900/55') || 'text-text-secondary'}`}>
              {formatFrenchDate(event.end)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Author */}
      {event.createdBy && (
        <InfoTile icon={User} tint="#38BDF8" label="Auteur d'événement" staged={staged} dark={dark}>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold text-white"
            style={{ backgroundColor: chipColor(event.createdBy), boxShadow: `0 0 12px -4px ${chipColor(event.createdBy)}` }}
          >
            {getInitials(event.createdBy)} · {event.createdBy}
          </span>
        </InfoTile>
      )}

      {/* Client */}
      {event.clientName && (
        <InfoTile icon={User} tint="#34D399" label="Client" staged={staged} dark={dark}>
          <p className={bodyText}>{event.clientName}</p>
          {event.clientPhone && (
            <p className={`${subText} mt-0.5 flex items-center gap-1`}>
              <Phone size={10} /> {event.clientPhone}
            </p>
          )}
          {event.clientEmail && (
            <p className={`${subText} flex items-center gap-1`}>
              <Mail size={10} /> {event.clientEmail}
            </p>
          )}
        </InfoTile>
      )}

      {/* Property */}
      {event.propertyName && (
        <InfoTile icon={MapPin} tint="#FBBF24" label="Bien" staged={staged} dark={dark}>
          <p className={bodyText}>{event.propertyName}</p>
          {event.propertyRef && <p className={subText}>Réf {event.propertyRef}</p>}
        </InfoTile>
      )}

      {/* Location */}
      {event.location && (
        <InfoTile icon={MapPin} tint="#E879F9" label="Adresse" staged={staged} dark={dark}>
          <p className={bodyText}>{event.location}</p>
        </InfoTile>
      )}

      {/* Keys */}
      {event.keysInfo && (
        <InfoTile icon={Key} tint="#8B7CFF" label="Clés" staged={staged} dark={dark}>
          <p className={bodyText}>{event.keysInfo}</p>
        </InfoTile>
      )}

      {/* Description */}
      {event.description && (
        <InfoTile icon={Calendar} tint="#94A3B8" label="Description" staged={staged} dark={dark}>
          <p className={`${subText} leading-relaxed`}>{event.description}</p>
        </InfoTile>
      )}

      {/* Reminders */}
      {event.reminders.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {event.reminders.map((r, i) => (
            <span
              key={i}
              className={`rounded-lg px-2 py-0.5 text-[11px] font-semibold ${
                r.sent
                  ? 'bg-emerald-500/15 text-emerald-400 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.35)]'
                  : staged && dark
                    ? 'bg-white/[0.05] text-slate-400 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.09)]'
                    : 'bg-background text-text-secondary border border-border'
              }`}
            >
              {r.label} {r.sent ? '(envoyé)' : ''}
            </span>
          ))}
        </div>
      )}

      {/* History footer line */}
      <p className={`pt-1 text-[11px] ${tone('text-slate-600', 'text-teal-900/45') || 'text-text-secondary/60'}`}>
        Créé par {event.createdBy || '—'} le {formatFrenchDate(event.createdAt)}
        {event.googleSync && ' · Google Agenda synchronisé'}
      </p>
    </StageModal>
  )
}
