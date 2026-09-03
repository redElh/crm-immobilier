import { useState, useEffect } from 'react'
import {
  CalendarEvent, EventType, AGENTS, Agent,
  EVENT_TYPE_OPTIONS, REMINDER_OPTIONS,
  generateEventId, formatDateInput, formatTimeInput,
} from '../../../types/calendar'
import { Select } from '../../../components/ui/Select'
import { DatePicker } from '../../../components/ui/DatePicker'
import { TimePicker } from '../../../components/ui/TimePicker'
import { Check } from 'react-feather'
import StageModal, { useStageFormClasses, useStageModalButtons } from './StageModal'
import SearchSelect from './SearchSelect'
import { fetchContacts } from '../../../services/contactService'
import { fetchProperties } from '../../../services/propertyService'
import type { Contact } from '../../../types/contact'
import type { Property } from '../../../types/property'

interface EventFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (event: CalendarEvent) => void
  editEvent?: CalendarEvent | null
  defaultDate?: Date
  currentAgentId?: string
  currentAgentName?: string
  agentUserId?: string
  agents?: Agent[]
  adminUserId?: string
  adminUserName?: string
}

interface FormData {
  type: EventType
  title: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  allDay: boolean
  agentIds: string[]
  clientName: string
  clientPhone: string
  clientEmail: string
  propertyName: string
  propertyRef: string
  location: string
  description: string
  googleSync: boolean
  reminders: string[]
}

function CheckSquare({ checked, color }: { checked: boolean; color?: string }) {
  return (
    <span
      className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border transition-all duration-200"
      style={
        checked
          ? {
              borderColor: color || '#8B7CFF',
              background: color ? color : 'linear-gradient(145deg, #8B7CFF, #5646C9)',
              boxShadow: `0 0 10px -2px ${color || 'rgba(124,92,255,0.8)'}`,
            }
          : { borderColor: 'rgba(148,163,184,0.35)', background: 'rgba(148,163,184,0.06)' }
      }
    >
      {checked && <Check size={11} strokeWidth={3.5} className="text-white" />}
    </span>
  )
}

export default function EventFormModal({ isOpen, onClose, onSave, editEvent, defaultDate, currentAgentId, currentAgentName, agentUserId, agents, adminUserId, adminUserName }: EventFormModalProps) {
  const [form, setForm] = useState<FormData>(() => getDefaultForm(defaultDate, currentAgentId))
  const [selfAssign, setSelfAssign] = useState(false)
  const { input, label, staged, dark } = useStageFormClasses()
  const btns = useStageModalButtons()
  /* Glass skin shared by every form control so pickers match the Objet field */
  const ctrl = (extra?: string) => (staged ? input(extra) : undefined)

  useEffect(() => {
    setSelfAssign(false)
    if (editEvent) {
      setForm({
        type: editEvent.type,
        title: editEvent.title,
        startDate: formatDateInput(editEvent.start),
        startTime: formatTimeInput(editEvent.start),
        endDate: formatDateInput(editEvent.end),
        endTime: formatTimeInput(editEvent.end),
        allDay: false,
        agentIds: [...editEvent.agentIds],
        clientName: editEvent.clientName || '',
        clientPhone: editEvent.clientPhone || '',
        clientEmail: editEvent.clientEmail || '',
        propertyName: editEvent.propertyName || '',
        propertyRef: editEvent.propertyRef || '',
        location: editEvent.location || '',
        description: editEvent.description || '',
        googleSync: editEvent.googleSync || false,
        reminders: editEvent.reminders.map(r => {
          const opt = REMINDER_OPTIONS.find(o => o.label === r.label)
          return opt ? opt.value : r.label
        }),
      })
      if (adminUserId) {
        setSelfAssign(editEvent.agentIds.includes(adminUserId))
      }
    } else if (defaultDate) {
      setForm(getDefaultForm(defaultDate, currentAgentId))
    } else {
      setForm(getDefaultForm(undefined, currentAgentId))
    }
  }, [editEvent, defaultDate, isOpen, currentAgentId, adminUserId])

  function getDefaultForm(date?: Date, agentId?: string): FormData {
    const d = date || new Date()
    const end = new Date(d)
    end.setHours(end.getHours() + 1)
    return {
      type: 'visite',
      title: '',
      startDate: formatDateInput(d),
      startTime: formatTimeInput(d),
      endDate: formatDateInput(end),
      endTime: formatTimeInput(end),
      allDay: false,
      agentIds: agentId ? [agentId] : [],
      clientName: '',
      clientPhone: '',
      clientEmail: '',
      propertyName: '',
      propertyRef: '',
      location: '',
      description: '',
      googleSync: false,
      reminders: [],
    }
  }

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const toggleReminder = (value: string) => {
    if (form.reminders.includes(value)) {
      update('reminders', form.reminders.filter(r => r !== value))
    } else {
      update('reminders', [...form.reminders, value])
    }
  }

  const agentDisplayName = currentAgentName || AGENTS.find(a => a.id === currentAgentId)?.name || ''

  const handleSave = () => {
    const isSelf = !!adminUserId && selfAssign
    const ownId = currentAgentId || agentUserId || ''
    const event: CalendarEvent = {
      id: editEvent?.id || generateEventId(),
      type: form.type,
      title: form.title,
      start: new Date(`${form.startDate}T${form.startTime}`),
      end: new Date(`${form.endDate}T${form.endTime}`),
      allDay: false,
      agentIds: isSelf ? [adminUserId] : (ownId ? [ownId] : form.agentIds),
      clientName: form.clientName || undefined,
      clientPhone: form.clientPhone || undefined,
      clientEmail: form.clientEmail || undefined,
      propertyName: form.propertyName || undefined,
      propertyRef: form.propertyRef || undefined,
      location: form.location || undefined,
      description: form.description || undefined,
      googleSync: form.googleSync,
      reminders: form.reminders.map(r => ({ label: REMINDER_OPTIONS.find(o => o.value === r)?.label || r })),
      createdAt: editEvent?.createdAt || new Date(),
      createdBy: editEvent?.createdBy || agentDisplayName || adminUserName || 'Myriam ABABOU',
    }
    onSave(event)
    onClose()
  }

  const sectionTitle = 'mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-80'

  return (
    <StageModal
      open={isOpen}
      onClose={onClose}
      eyebrow={editEvent ? 'Modification' : 'Nouvelle entrée'}
      title={editEvent ? "Modifier l'événement" : 'Ajouter un événement'}
      subtitle="Renseignez les informations puis validez pour planifier."
      maxWidth="max-w-2xl"
      bodyClassName="max-h-[calc(100vh-300px)] min-h-[120px] overflow-y-auto scrollbar-thin space-y-5 pt-1"
      footer={
        <>
          <button onClick={onClose} className={btns.ghost}>Annuler</button>
          <button onClick={handleSave} className={btns.primary}>
            {editEvent ? 'Enregistrer' : 'Ajouter'}
          </button>
        </>
      }
    >
      {/* ── Qualification ── */}
      <section>
        <p className={`${sectionTitle} text-violet-400`}>
          <span className="h-px w-4 bg-gradient-to-r from-violet-400 to-transparent" />
          Qualification
        </p>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,220px)_1fr]">
          <div>
            <label className={label}>Type d'événement</label>
            <Select
              value={form.type}
              onChange={(val: string) => update('type', val as EventType)}
              options={EVENT_TYPE_OPTIONS}
              className={ctrl('h-9 pr-2.5')}
            />
          </div>
          <div>
            <label className={label}>Objet</label>
            <input
              value={form.title}
              onChange={e => update('title', e.target.value)}
              placeholder="Visite appartement - Client Martin"
              className={input('h-9')}
            />
          </div>
        </div>
      </section>

      {/* ── Horaires ── */}
      <section>
        <p className={`${sectionTitle} text-sky-400`}>
          <span className="h-px w-4 bg-gradient-to-r from-sky-400 to-transparent" />
          Horaires
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Démarre le</label>
            <DatePicker
              value={form.startDate}
              min={editEvent ? undefined : formatDateInput(new Date())}
              onChange={e => update('startDate', e.target.value)}
              className={ctrl('h-9')}
            />
            <div className="mt-2">
              <TimePicker
                value={form.startTime}
                onChange={e => update('startTime', e.target.value)}
                className={ctrl('h-9')}
              />
            </div>
          </div>
          <div>
            <label className={label}>Termine le</label>
            <DatePicker
              value={form.endDate}
              onChange={e => update('endDate', e.target.value)}
              className={ctrl('h-9')}
            />
            <div className="mt-2">
              <TimePicker
                value={form.endTime}
                onChange={e => update('endTime', e.target.value)}
                className={ctrl('h-9')}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Responsables ── */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <p className={`${sectionTitle} mb-0 text-emerald-400`}>
            <span className="h-px w-4 bg-gradient-to-r from-emerald-400 to-transparent" />
            Responsables
          </p>
          {adminUserId && !currentAgentId && (
            <button
              type="button"
              className="flex items-center gap-1.5 select-none"
              onClick={() => {
                if (selfAssign) {
                  update('agentIds', form.agentIds.filter(id => id !== adminUserId))
                } else {
                  update('agentIds', [])
                }
                setSelfAssign(!selfAssign)
              }}
            >
              <CheckSquare checked={selfAssign} color="#D97706" />
              <span className="text-xs font-medium opacity-80">Cet événement vous concerne ?</span>
            </button>
          )}
        </div>

        {selfAssign ? (
          <div className="flex items-center gap-2">
            <CheckSquare checked color="#D97706" />
            <span className="text-sm font-semibold">{adminUserName || 'Vous'}</span>
          </div>
        ) : currentAgentId ? (
          <div className="flex items-center gap-2">
            <CheckSquare checked />
            <span className="text-sm font-semibold">{agentDisplayName}</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {(agents && agents.length > 0 ? agents : AGENTS).map(agent => {
              const active = form.agentIds.includes(agent.id)
              return (
                <button
                  key={agent.id}
                  type="button"
                  disabled={Boolean(adminUserId && String(agent.id) === String(adminUserId))}
                  onClick={() => {
                    if (adminUserId && String(agent.id) === String(adminUserId)) return
                    setSelfAssign(false)
                    if (active) {
                      update('agentIds', form.agentIds.filter(a => a !== agent.id))
                    } else {
                      update('agentIds', [...form.agentIds, agent.id])
                    }
                  }}
                  className={`flex items-center gap-2 rounded-xl border px-2 py-1.5 text-left transition-all duration-200 disabled:opacity-40 ${
                    staged
                      ? active
                        ? 'border-white/20 bg-white/[0.07]'
                        : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                      : active
                        ? 'border-border bg-accent-light/60'
                        : 'border-border bg-card hover:bg-background'
                  }`}
                  style={active ? { boxShadow: `inset 3px 0 0 ${agent.color}, 0 4px 14px -6px ${agent.color}` } : undefined}
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                    style={{
                      backgroundColor: agent.color,
                      boxShadow: active ? `0 0 10px ${agent.color}` : 'inset 0 1px 0 rgba(255,255,255,0.35)',
                      opacity: active ? 1 : 0.55,
                    }}
                  >
                    {agent.initials}
                  </span>
                  <span className={`truncate text-xs font-medium ${active ? 'opacity-100' : 'opacity-60'}`}>
                    {agent.name}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Liens CRM ── */}
      <section>
        <p className={`${sectionTitle} text-amber-400`}>
          <span className="h-px w-4 bg-gradient-to-r from-amber-400 to-transparent" />
          Liens CRM
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={label}>Client / Contact lié</label>
            <SearchSelect<Contact>
              value={form.clientName}
              placeholder="Rechercher un client..."
              className={ctrl('h-9 pl-9 pr-8')}
              onSelect={(contact) => {
                if (!contact) {
                  update('clientName', '')
                  update('clientPhone', '')
                  update('clientEmail', '')
                  return
                }
                update('clientName', `${contact.civility || ''} ${contact.firstName} ${contact.lastName}`.trim())
                update('clientPhone', contact.mobile || '')
                update('clientEmail', contact.emailPrincipal || '')
              }}
              fetchOptions={async (q) => {
                const contacts = await fetchContacts(q ? { search: q } : {})
                return contacts.filter(c => c.mandats && c.mandats.length > 0)
              }}
              getLabel={(c) => `${c.civility || ''} ${c.firstName} ${c.lastName}`.trim()}
              getSubLabel={(c) => [c.mobile, c.emailPrincipal].filter(Boolean).join(' • ')}
              getKey={(c) => c.id}
            />
          </div>
          <div>
            <label className={label}>Bien lié</label>
            <SearchSelect<Property>
              value={form.propertyName}
              placeholder="Rechercher un bien..."
              className={ctrl('h-9 pl-9 pr-8')}
              onSelect={(property) => {
                if (!property) {
                  update('propertyName', '')
                  update('propertyRef', '')
                  return
                }
                update('propertyName', property.title || property.reference || '')
                update('propertyRef', property.reference || '')
                const loc = [property.address, property.city].filter(Boolean).join(', ')
                if (loc) update('location', loc)
              }}
              fetchOptions={async (q) => {
                const params: Record<string, string> = {}
                if (agentUserId) params.agent_id = agentUserId
                if (q) params.search = q
                return fetchProperties(params)
              }}
              getLabel={(p) => `${p.title || ''}${p.reference ? ` (${p.reference})` : ''}`}
              getSubLabel={(p) => [p.address, p.city].filter(Boolean).join(', ')}
              getKey={(p) => p.id}
            />
          </div>
        </div>
        <div className="mt-3">
          <label className={label}>Localisation</label>
          <input
            value={form.location}
            onChange={e => update('location', e.target.value)}
            placeholder="15 Rue de la Liberté, Casablanca"
            className={input('h-9')}
          />
        </div>
      </section>

      {/* ── Notes & options ── */}
      <section>
        <p className={`${sectionTitle} text-fuchsia-400`}>
          <span className="h-px w-4 bg-gradient-to-r from-fuchsia-400 to-transparent" />
          Notes & options
        </p>
        <textarea
          value={form.description}
          onChange={e => update('description', e.target.value)}
          rows={3}
          className={input('resize-none py-2')}
          placeholder="Détails de l'événement..."
        />

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div
            role="checkbox"
            aria-checked={form.googleSync}
            tabIndex={0}
            onClick={() => update('googleSync', !form.googleSync)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') update('googleSync', !form.googleSync) }}
            className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-colors ${
              staged
                ? dark
                  ? 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                  : 'border-teal-900/10 bg-white/70 hover:bg-white'
                : 'border-border bg-card hover:bg-background'
            }`}
          >
            <span
              className="relative h-4 w-7 shrink-0 rounded-full transition-colors duration-200"
              style={{ background: form.googleSync ? 'linear-gradient(90deg,#34D399,#059669)' : staged && dark ? 'rgba(148,163,184,0.25)' : 'rgba(100,116,139,0.3)' }}
            >
              <span
                className="absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-all duration-200"
                style={{ left: form.googleSync ? 14 : 2 }}
              />
            </span>
            <span className={`text-xs font-medium leading-tight ${staged ? (dark ? 'text-slate-300' : 'text-teal-900/85') : ''}`}>
              Synchroniser avec mon agenda Google
            </span>
          </div>

          <div className="flex flex-wrap content-start items-start gap-1.5">
            {REMINDER_OPTIONS.map(opt => {
              const active = form.reminders.includes(opt.value)
              return (
                <button
                  key={opt.value}
                  onClick={() => toggleReminder(opt.value)}
                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all duration-200 ${
                    active
                      ? staged
                        ? dark
                          ? 'border-violet-400/50 bg-gradient-to-b from-violet-500/30 to-indigo-600/25 text-violet-100 shadow-[0_0_12px_-4px_rgba(124,92,255,0.9)]'
                          : 'border-teal-500/50 bg-teal-500/15 text-teal-800 shadow-[0_0_12px_-4px_rgba(13,148,136,0.8)]'
                        : 'border-accent/40 bg-accent-light text-text font-semibold'
                      : staged
                        ? dark
                          ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'
                          : 'border-teal-900/10 bg-white/70 text-teal-900/65 hover:bg-white'
                        : 'border-border bg-card text-text-secondary hover:text-text'
                  }`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>
      </section>
    </StageModal>
  )
}
