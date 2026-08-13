import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'react-feather'
import {
  CalendarEvent, EventType, AGENTS, Agent,
  EVENT_TYPE_OPTIONS, REMINDER_OPTIONS,
  generateEventId, formatDateInput, formatTimeInput,
} from '../../../types/calendar'
import { Select } from '../../../components/ui/Select'
import { DatePicker } from '../../../components/ui/DatePicker'
import { TimePicker } from '../../../components/ui/TimePicker'
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

export default function EventFormModal({ isOpen, onClose, onSave, editEvent, defaultDate, currentAgentId, currentAgentName, agentUserId, agents, adminUserId, adminUserName }: EventFormModalProps) {
  const [form, setForm] = useState<FormData>(() => getDefaultForm(defaultDate, currentAgentId))
  const [selfAssign, setSelfAssign] = useState(false)

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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-2xl mx-4 bg-card rounded-xl border border-border/50 shadow-modal overflow-y-auto max-h-[calc(100vh-80px)]"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 sticky top-0 bg-card z-10">
              <h2 className="text-lg font-semibold">
                {editEvent ? 'Modifier l\'événement' : 'Ajouter un événement'}
              </h2>
              <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text hover:bg-background transition-all">
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-4 space-y-5">
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Type d'événement</label>
                <Select
                  value={form.type}
                  onChange={(val: string) => update('type', val as EventType)}
                  options={EVENT_TYPE_OPTIONS}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Objet</label>
                <input
                  value={form.title}
                  onChange={e => update('title', e.target.value)}
                  placeholder="Visite appartement - Client Martin"
                  className="w-full h-9 px-3 py-2 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-text block mb-1.5">Démarre le</label>
                    <DatePicker
                      value={form.startDate}
                      min={editEvent ? undefined : formatDateInput(new Date())}
                      onChange={e => update('startDate', e.target.value)}
                    />
                    <div className="mt-2">
                      <TimePicker
                        value={form.startTime}
                        onChange={e => update('startTime', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text block mb-1.5">Termine le</label>
                    <DatePicker
                      value={form.endDate}
                      onChange={e => update('endDate', e.target.value)}
                    />
                    <div className="mt-2">
                      <TimePicker
                        value={form.endTime}
                        onChange={e => update('endTime', e.target.value)}
                      />
                    </div>
                  </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-text">
                    {adminUserId ? 'Responsable(s) concerné(s)' : currentAgentId ? 'Agent concerné' : 'Agent(s) concerné(s)'}
                  </label>
                  {adminUserId && !currentAgentId && (
                    <div
                      className="flex items-center gap-2 cursor-pointer group select-none"
                      onClick={() => {
                        if (selfAssign) {
                          update('agentIds', form.agentIds.filter(id => id !== adminUserId))
                        } else {
                          update('agentIds', [])
                        }
                        setSelfAssign(!selfAssign)
                      }}
                    >
                      <div
                        className="w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200"
                        style={{
                          borderColor: selfAssign ? '#D97706' : undefined,
                          backgroundColor: selfAssign ? '#D97706' : undefined,
                        }}
                      >
                        {selfAssign && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <span className="text-xs text-text-secondary group-hover:text-text transition-colors">
                        Cet événement vous concerne ?
                      </span>
                    </div>
                  )}
                </div>
                {selfAssign ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded border-2 flex items-center justify-center bg-accent border-accent">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span className="text-sm text-text font-medium">{adminUserName || 'Vous'}</span>
                  </div>
                ) : currentAgentId ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded border-2 flex items-center justify-center bg-accent border-accent">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span className="text-sm text-text font-medium">{agentDisplayName}</span>
                  </div>
                ) : (
                <div className="grid grid-cols-2 gap-2">
                  {(agents && agents.length > 0 ? agents : AGENTS).map(agent => (
                    <label
                      key={agent.id}
                      className="flex items-center gap-2 cursor-pointer group"
                      onClick={() => {
                        if (adminUserId && String(agent.id) === String(adminUserId)) return
                        setSelfAssign(false)
                        if (form.agentIds.includes(agent.id)) {
                          update('agentIds', form.agentIds.filter(a => a !== agent.id))
                        } else {
                          update('agentIds', [...form.agentIds, agent.id])
                        }
                      }}
                    >
                      <div
                        className="w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200"
                        style={{
                          borderColor: form.agentIds.includes(agent.id) ? agent.color : undefined,
                          backgroundColor: form.agentIds.includes(agent.id) ? agent.color : undefined,
                        }}
                      >
                        {form.agentIds.includes(agent.id) && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm text-text">{agent.name}</span>
                    </label>
                  ))}
                </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Client / Contact lié</label>
                <SearchSelect<Contact>
                  value={form.clientName}
                  placeholder="Rechercher un client..."
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
                <label className="text-sm font-medium text-text block mb-1.5">Bien lié</label>
                <SearchSelect<Property>
                  value={form.propertyName}
                  placeholder="Rechercher un bien..."
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

              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Localisation</label>
                <input
                  value={form.location}
                  onChange={e => update('location', e.target.value)}
                  placeholder="15 Rue de la Liberté, Casablanca"
                  className="w-full h-9 px-3 py-2 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Description / Notes</label>
                <textarea
                  value={form.description}
                  onChange={e => update('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent resize-none"
                  placeholder="Détails de l'événement..."
                />
              </div>

              <div>
                <label
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={(e) => { e.preventDefault(); update('googleSync', !form.googleSync) }}
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${form.googleSync ? 'bg-accent border-accent' : 'border-border'}`}>
                    {form.googleSync && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-text">Synchroniser avec mon agenda Google</span>
                </label>
              </div>

              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Rappels</label>
                <div className="flex flex-wrap gap-2">
                  {REMINDER_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => toggleReminder(opt.value)}
                      className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
                        form.reminders.includes(opt.value)
                          ? 'bg-accent text-white border-accent'
                          : 'border-border text-text-secondary hover:border-text-secondary/30'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/40">
              <button onClick={onClose} className="btn-secondary text-sm">
                Annuler
              </button>
              <button onClick={handleSave} className="btn-primary text-sm">
                {editEvent ? 'Enregistrer' : 'Ajouter'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
