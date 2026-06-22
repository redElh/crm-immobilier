export type EventType = 'visit' | 'virtual-visit' | 'call' | 'meeting' | 'office' | 'leave' | 'external' | 'matching'

export type CalendarView = 'day' | 'week' | 'month' | 'agenda' | 'timeline'

export interface CalendarEvent {
  id: string
  type: EventType
  title: string
  start: Date
  end: Date
  allDay: boolean
  agentIds: string[]
  clientId?: string
  clientName?: string
  clientPhone?: string
  clientEmail?: string
  clientSince?: string
  propertyId?: string
  propertyName?: string
  propertyRef?: string
  location?: string
  description?: string
  keysInfo?: string
  googleSync?: boolean
  reminders: { label: string; sent?: boolean }[]
  createdAt: Date
  createdBy: string
}

export interface Agent {
  id: string
  name: string
  color: string
  initials: string
}

export interface EventTypeConfig {
  value: EventType
  label: string
  icon: string
  color: string
  bgColor: string
  borderColor: string
  textColor: string
}

export const EVENT_TYPE_CONFIG: Record<EventType, EventTypeConfig> = {
  visit: {
    value: 'visit',
    label: 'Visite terrain',
    icon: '🏠',
    color: 'blue',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
  },
  'virtual-visit': {
    value: 'virtual-visit',
    label: 'Visite virtuelle',
    icon: '🎥',
    color: 'sky',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
    textColor: 'text-sky-700',
  },
  call: {
    value: 'call',
    label: 'Appel / Phoning',
    icon: '📞',
    color: 'green',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
  },
  meeting: {
    value: 'meeting',
    label: 'Réunion interne',
    icon: '✏️',
    color: 'violet',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    textColor: 'text-violet-700',
  },
  office: {
    value: 'office',
    label: 'Bureau / Admin',
    icon: '📄',
    color: 'gray',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-700',
  },
  leave: {
    value: 'leave',
    label: 'Congé',
    icon: '🌴',
    color: 'orange',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
  },
  external: {
    value: 'external',
    label: 'Rendez-vous externe',
    icon: '🤝',
    color: 'yellow',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-700',
  },
  matching: {
    value: 'matching',
    label: 'Croisement',
    icon: '🔄',
    color: 'cyan',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    textColor: 'text-cyan-700',
  },
}

export const AGENTS: Agent[] = [
  { id: 'myriam', name: 'Myriam ABABOU', color: '#4F46E5', initials: 'MA' },
  { id: 'dimitri', name: 'Dimitri DJEDJE', color: '#0891B2', initials: 'DD' },
  { id: 'hayat', name: 'Hayat OUAKRIM', color: '#D97706', initials: 'HO' },
  { id: 'yasmine', name: 'Yasmine AATIC', color: '#059669', initials: 'YA' },
  { id: 'square', name: 'Square Meter AGENCE', color: '#7C3AED', initials: 'SM' },
]

export const EVENT_TYPE_OPTIONS = Object.values(EVENT_TYPE_CONFIG).map(c => ({
  value: c.value,
  label: `${c.icon} ${c.label}`,
}))

export const REMINDER_OPTIONS = [
  { value: '15min', label: '15 minutes avant' },
  { value: '30min', label: '30 minutes avant' },
  { value: '1h', label: '1 heure avant' },
  { value: '2h', label: '2 heures avant' },
  { value: '1d', label: '1 jour avant' },
  { value: '2d', label: '2 jours avant' },
  { value: '1w', label: '1 semaine avant' },
]

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  visit: '#3B82F6',
  'virtual-visit': '#0EA5E9',
  call: '#10B981',
  meeting: '#8B5CF6',
  office: '#6B7280',
  leave: '#F59E0B',
  external: '#EAB308',
  matching: '#06B6D4',
}

export function getEventsForDate(events: CalendarEvent[], date: Date): CalendarEvent[] {
  return events.filter(e => {
    const start = new Date(e.start)
    const end = new Date(e.end)
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)
    return start <= dayEnd && end >= dayStart
  })
}

export function getEventsForDay(events: CalendarEvent[], date: Date): CalendarEvent[] {
  return events.filter(e => {
    const start = new Date(e.start)
    return start.getFullYear() === date.getFullYear() &&
      start.getMonth() === date.getMonth() &&
      start.getDate() === date.getDate()
  })
}

export function getEventsForWeek(events: CalendarEvent[], date: Date): CalendarEvent[] {
  const weekStart = getWeekStart(date)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)
  return events.filter(e => {
    const start = new Date(e.start)
    return start >= weekStart && start <= weekEnd
  })
}

export function getEventsForMonth(events: CalendarEvent[], date: Date): CalendarEvent[] {
  return events.filter(e => {
    const start = new Date(e.start)
    return start.getFullYear() === date.getFullYear() &&
      start.getMonth() === date.getMonth()
  })
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getWeekDays(date: Date): Date[] {
  const start = getWeekStart(date)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    return d
  })
}

export function getMonthDays(date: Date): (Date | null)[] {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPad = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1
  const days: (Date | null)[] = []
  for (let i = 0; i < startPad; i++) days.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d))
  }
  while (days.length % 7 !== 0) days.push(null)
  return days
}

export function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function formatFrenchDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function formatFrenchShortDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export function formatFrenchDayName(date: Date): string {
  return date.toLocaleDateString('fr-FR', { weekday: 'long' })
}

export function formatFrenchDayShort(date: Date): string {
  return date.toLocaleDateString('fr-FR', { weekday: 'short' })
}

export const MONTH_NAMES = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

export const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7)
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export function formatDateInput(date: Date): string {
  return date.toLocaleDateString('fr-CA')
}

export function formatTimeInput(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
}

let eventIdCounter = 0
export function generateEventId(): string {
  eventIdCounter++
  return `evt-${Date.now()}-${eventIdCounter}`
}

export function createMockEvents(): CalendarEvent[] {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const day = now.getDate()

  const makeDate = (d: number, h: number, m: number = 0) => new Date(year, month, d, h, m)

  return [
    {
      id: 'evt-1', type: 'meeting', title: 'Réunion équipe', start: makeDate(day, 9, 0), end: makeDate(day, 10, 30),
      allDay: false, agentIds: ['myriam', 'dimitri'], reminders: [{ label: '15 minutes avant' }],
      createdAt: makeDate(day, 8, 0), createdBy: 'Myriam ABABOU',
    },
    {
      id: 'evt-2', type: 'office', title: 'Suivi administratif', start: makeDate(day, 14, 0), end: makeDate(day, 16, 0),
      allDay: false, agentIds: ['myriam'], reminders: [],
      createdAt: makeDate(day, 8, 0), createdBy: 'Myriam ABABOU',
    },
    {
      id: 'evt-3', type: 'call', title: 'Appels clients (5)', start: makeDate(day + 1, 9, 0), end: makeDate(day + 1, 11, 0),
      allDay: false, agentIds: ['yasmine'], reminders: [{ label: '30 minutes avant' }],
      createdAt: makeDate(day, 8, 0), createdBy: 'Yasmine AATIC',
    },
    {
      id: 'evt-4', type: 'visit', title: 'Visite appartement - Client Martin', start: makeDate(day + 1, 10, 0), end: makeDate(day + 1, 11, 30),
      allDay: false, agentIds: ['myriam'], clientName: 'Ahmed Benali', clientPhone: '+212 6 12 34 56 78', clientEmail: 'ahmed@email.com',
      propertyName: 'Villa Marrakech', propertyRef: 'RES-2026-001', location: '15 Rue de la Liberté, Casablanca',
      keysInfo: 'Disponible - Boîte à clés code 1234',
      description: 'Client très intéressé, demande à voir la piscine et le jardin.',
      reminders: [{ label: '15 minutes avant', sent: true }],
      createdAt: makeDate(day, 8, 0), createdBy: 'Myriam ABABOU',
    },
    {
      id: 'evt-5', type: 'matching', title: 'Session croisements', start: makeDate(day + 2, 10, 0), end: makeDate(day + 2, 12, 0),
      allDay: false, agentIds: ['dimitri'], reminders: [],
      createdAt: makeDate(day, 8, 0), createdBy: 'Dimitri DJEDJE',
    },
    {
      id: 'evt-6', type: 'visit', title: 'Visite villa - Client Dubois', start: makeDate(day + 2, 15, 0), end: makeDate(day + 2, 17, 0),
      allDay: false, agentIds: ['myriam'], reminders: [{ label: '1 heure avant' }],
      createdAt: makeDate(day, 8, 0), createdBy: 'Myriam ABABOU',
    },
    {
      id: 'evt-7', type: 'visit', title: 'Visite Client X', start: makeDate(day + 1, 10, 0), end: makeDate(day + 1, 11, 0),
      allDay: false, agentIds: ['dimitri'], reminders: [],
      createdAt: makeDate(day, 8, 0), createdBy: 'Dimitri DJEDJE',
    },
    {
      id: 'evt-8', type: 'visit', title: 'Visite Client Y', start: makeDate(day + 1, 14, 0), end: makeDate(day + 1, 15, 30),
      allDay: false, agentIds: ['dimitri'], reminders: [],
      createdAt: makeDate(day, 8, 0), createdBy: 'Dimitri DJEDJE',
    },
    {
      id: 'evt-9', type: 'external', title: 'Rendez-vous notaire', start: makeDate(day + 1, 9, 30), end: makeDate(day + 1, 11, 0),
      allDay: false, agentIds: ['hayat'], reminders: [{ label: '1 jour avant' }],
      createdAt: makeDate(day, 8, 0), createdBy: 'Hayat OUAKRIM',
    },
    {
      id: 'evt-10', type: 'visit', title: 'Visite Client W', start: makeDate(day + 2, 14, 0), end: makeDate(day + 2, 15, 30),
      allDay: false, agentIds: ['hayat'], reminders: [],
      createdAt: makeDate(day, 8, 0), createdBy: 'Hayat OUAKRIM',
    },
    {
      id: 'evt-11', type: 'visit', title: 'Visite Client U', start: makeDate(day + 3, 10, 0), end: makeDate(day + 3, 11, 30),
      allDay: false, agentIds: ['hayat'], reminders: [],
      createdAt: makeDate(day, 8, 0), createdBy: 'Hayat OUAKRIM',
    },
    {
      id: 'evt-12', type: 'meeting', title: 'Réunion commerciale', start: makeDate(day + 3, 9, 0), end: makeDate(day + 3, 10, 30),
      allDay: false, agentIds: ['yasmine'], reminders: [{ label: '15 minutes avant' }],
      createdAt: makeDate(day, 8, 0), createdBy: 'Yasmine AATIC',
    },
    {
      id: 'evt-13', type: 'visit', title: 'Visite Tanger', start: makeDate(day + 4, 9, 0), end: makeDate(day + 4, 12, 0),
      allDay: false, agentIds: ['myriam'], reminders: [{ label: '1 heure avant' }, { label: '1 jour avant' }],
      createdAt: makeDate(day, 8, 0), createdBy: 'Myriam ABABOU',
    },
    {
      id: 'evt-14', type: 'call', title: 'Appel Client V', start: makeDate(day + 4, 15, 0), end: makeDate(day + 4, 15, 30),
      allDay: false, agentIds: ['hayat'], reminders: [],
      createdAt: makeDate(day, 8, 0), createdBy: 'Hayat OUAKRIM',
    },
    {
      id: 'evt-15', type: 'visit', title: 'Visite Client B', start: makeDate(day + 4, 16, 0), end: makeDate(day + 4, 17, 30),
      allDay: false, agentIds: ['yasmine'], reminders: [],
      createdAt: makeDate(day, 8, 0), createdBy: 'Yasmine AATIC',
    },
    {
      id: 'evt-16', type: 'visit', title: 'Visite Client T', start: makeDate(day + 5, 10, 0), end: makeDate(day + 5, 11, 30),
      allDay: false, agentIds: ['hayat'], reminders: [],
      createdAt: makeDate(day, 8, 0), createdBy: 'Hayat OUAKRIM',
    },
    {
      id: 'evt-17', type: 'leave', title: 'Congé', start: makeDate(day + 10, 0, 0), end: makeDate(day + 14, 23, 59),
      allDay: true, agentIds: ['dimitri'], reminders: [{ label: '1 jour avant' }],
      createdAt: makeDate(day, 8, 0), createdBy: 'Dimitri DJEDJE',
    },
    {
      id: 'evt-18', type: 'visit', title: 'Visite Client A', start: makeDate(day, 14, 0), end: makeDate(day, 15, 30),
      allDay: false, agentIds: ['yasmine'], reminders: [],
      createdAt: makeDate(day, 8, 0), createdBy: 'Yasmine AATIC',
    },
    {
      id: 'evt-19', type: 'visit', title: 'Visite Bouznika', start: makeDate(day + 2, 9, 0), end: makeDate(day + 2, 11, 0),
      allDay: false, agentIds: ['myriam'], reminders: [],
      createdAt: makeDate(day, 8, 0), createdBy: 'Myriam ABABOU',
    },
    {
      id: 'evt-20', type: 'visit', title: 'Visite Client Z', start: makeDate(day + 3, 11, 0), end: makeDate(day + 3, 12, 30),
      allDay: false, agentIds: ['dimitri'], reminders: [],
      createdAt: makeDate(day, 8, 0), createdBy: 'Dimitri DJEDJE',
    },
  ]
}
