import {
  Home, MonitorPlay, Sun, CalendarClock, FileText, Wrench, MoreHorizontal, TrendingUp,
  ClipboardList, Calculator, ClipboardCheck, Sparkles, GraduationCap, MessageSquare, Clock,
  User, DoorOpen, FileSignature, Target, Megaphone, PhoneCall, BarChart3, CheckCircle2,
  type LucideIcon,
} from 'lucide-react'

export type EventType =
  | 'administratif'
  | 'apres-vente'
  | 'autre'
  | 'commercial'
  | 'compte-rendu'
  | 'conges'
  | 'estimation'
  | 'etat-des-lieux'
  | 'evenement'
  | 'formation'
  | 'message'
  | 'permanence'
  | 'personnel'
  | 'portes-ouvertes'
  | 'proposition'
  | 'prospection'
  | 'publicite'
  | 'relance'
  | 'rendez-vous'
  | 'sondage'
  | 'validation'
  | 'visite'
  | 'visite-virtuelle'

export type CalendarView = 'day' | 'week' | 'month' | 'agenda' | 'timeline'

export interface CalendarEvent {
  id: string
  type: EventType
  title: string
  start: Date
  end: Date
  allDay: boolean
  agentIds: string[]
  agentNames?: string[]
  agentId?: string
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
  icon: LucideIcon
  color: string
  bgColor: string
  borderColor: string
  textColor: string
}

export const EVENT_TYPE_CONFIG: Record<EventType, EventTypeConfig> = {
  administratif: {
    value: 'administratif',
    label: 'Administratif',
    icon: FileText,
    color: 'gray',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-700',
  },
  'apres-vente': {
    value: 'apres-vente',
    label: 'Après-vente',
    icon: Wrench,
    color: 'orange',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-700',
  },
  autre: {
    value: 'autre',
    label: 'Autre',
    icon: MoreHorizontal,
    color: 'zinc',
    bgColor: 'bg-zinc-50',
    borderColor: 'border-zinc-200',
    textColor: 'text-zinc-700',
  },
  commercial: {
    value: 'commercial',
    label: 'Commercial',
    icon: TrendingUp,
    color: 'emerald',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
  },
  'compte-rendu': {
    value: 'compte-rendu',
    label: 'Compte-rendu',
    icon: ClipboardList,
    color: 'cyan',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    textColor: 'text-cyan-700',
  },
  conges: {
    value: 'conges',
    label: 'Congés',
    icon: Sun,
    color: 'amber',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
  },
  estimation: {
    value: 'estimation',
    label: 'Estimation',
    icon: Calculator,
    color: 'indigo',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    textColor: 'text-indigo-700',
  },
  'etat-des-lieux': {
    value: 'etat-des-lieux',
    label: 'État des lieux',
    icon: ClipboardCheck,
    color: 'teal',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    textColor: 'text-teal-700',
  },
  evenement: {
    value: 'evenement',
    label: 'Évènement',
    icon: Sparkles,
    color: 'pink',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    textColor: 'text-pink-700',
  },
  formation: {
    value: 'formation',
    label: 'Formation',
    icon: GraduationCap,
    color: 'blue',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
  },
  message: {
    value: 'message',
    label: 'Message',
    icon: MessageSquare,
    color: 'sky',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
    textColor: 'text-sky-700',
  },
  permanence: {
    value: 'permanence',
    label: 'Permanence',
    icon: Clock,
    color: 'violet',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    textColor: 'text-violet-700',
  },
  personnel: {
    value: 'personnel',
    label: 'Personnel',
    icon: User,
    color: 'purple',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
  },
  'portes-ouvertes': {
    value: 'portes-ouvertes',
    label: 'Portes Ouvertes',
    icon: DoorOpen,
    color: 'fuchsia',
    bgColor: 'bg-fuchsia-50',
    borderColor: 'border-fuchsia-200',
    textColor: 'text-fuchsia-700',
  },
  proposition: {
    value: 'proposition',
    label: 'Proposition',
    icon: FileSignature,
    color: 'green',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
  },
  prospection: {
    value: 'prospection',
    label: 'Prospection',
    icon: Target,
    color: 'rose',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    textColor: 'text-rose-700',
  },
  publicite: {
    value: 'publicite',
    label: 'Publicité',
    icon: Megaphone,
    color: 'yellow',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-700',
  },
  relance: {
    value: 'relance',
    label: 'Relance',
    icon: PhoneCall,
    color: 'red',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
  },
  'rendez-vous': {
    value: 'rendez-vous',
    label: 'Rendez-vous',
    icon: CalendarClock,
    color: 'lime',
    bgColor: 'bg-lime-50',
    borderColor: 'border-lime-200',
    textColor: 'text-lime-700',
  },
  sondage: {
    value: 'sondage',
    label: 'Sondage',
    icon: BarChart3,
    color: 'stone',
    bgColor: 'bg-stone-50',
    borderColor: 'border-stone-200',
    textColor: 'text-stone-700',
  },
  validation: {
    value: 'validation',
    label: 'Validation',
    icon: CheckCircle2,
    color: 'slate',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    textColor: 'text-slate-700',
  },
  visite: {
    value: 'visite',
    label: 'Visite',
    icon: Home,
    color: 'blue',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
  },
  'visite-virtuelle': {
    value: 'visite-virtuelle',
    label: 'Visite virtuelle',
    icon: MonitorPlay,
    color: 'sky',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
    textColor: 'text-sky-700',
  },
}

export function getEventTypeConfig(type: string): EventTypeConfig {
  return EVENT_TYPE_CONFIG[type as EventType] ?? EVENT_TYPE_CONFIG['autre']
}

export const AGENT_COLOR_PALETTE = ['#4F46E5', '#2563EB', '#059669', '#0891B2', '#D97706', '#DC2626', '#7C3AED', '#0F766E']

export function getAgentColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return AGENT_COLOR_PALETTE[hash % AGENT_COLOR_PALETTE.length]
}

export function withAlpha(hex: string, alpha: string): string {
  return /^#[0-9a-f]{6}$/i.test(hex) ? `${hex}${alpha}` : hex
}

export function getEventUserColor(event: CalendarEvent, agents?: Agent[]): string {
  const catalog = agents && agents.length > 0 ? agents : AGENTS
  const byId = (id: string) => catalog.find(a => a.id === id)?.color
  const norm = (name: string) => name.replace(/\s+/g, ' ').trim()
  const byName = (name: string) => catalog.find(a => norm(a.name) === norm(name))?.color
  for (const id of event.agentIds) {
    const color = byId(id)
    if (color) return color
  }
  if (event.createdBy) {
    const color = byId(event.createdBy) || byName(event.createdBy)
    if (color) return color
  }
  if (event.agentId) {
    const color = byId(String(event.agentId))
    if (color) return color
  }
  return EVENT_TYPE_COLORS[event.type] ?? '#6B7280'
}

function normalizeAgentName(name: string): string {
  return String(name || '').replace(/\s+/g, ' ').trim().toLowerCase()
}

export function eventMatchesSelectedAgents(
  event: CalendarEvent,
  selectedAgents: string[],
  agents?: Agent[]
): boolean {
  if (selectedAgents.length === 0) return true
  if (event.agentIds.some(id => selectedAgents.includes(String(id)))) return true
  if (event.agentId && selectedAgents.includes(String(event.agentId))) return true
  if (event.createdBy) {
    const creator = (agents || []).find(
      a => normalizeAgentName(a.name) === normalizeAgentName(event.createdBy)
    )
    if (creator && selectedAgents.includes(creator.id)) return true
  }
  return false
}

export const AGENTS: Agent[] = [
  { id: 'agent-1', name: 'Myriam ABABOU', color: getAgentColor('agent-1'), initials: 'MA' },
  { id: 'agent-2', name: 'Karim ELOUI', color: getAgentColor('agent-2'), initials: 'KE' },
  { id: 'agent-3', name: 'Yasmine AATIC', color: getAgentColor('agent-3'), initials: 'YA' },
  { id: 'agent-4', name: 'Dimitri DJEDJE', color: getAgentColor('agent-4'), initials: 'DD' },
  { id: 'agent-5', name: 'Hayat OUAKRIM', color: getAgentColor('agent-5'), initials: 'HO' },
  { id: 'myriam', name: 'Myriam ABABOU', color: getAgentColor('myriam'), initials: 'MA' },
  { id: 'dimitri', name: 'Dimitri DJEDJE', color: getAgentColor('dimitri'), initials: 'DD' },
  { id: 'hayat', name: 'Hayat OUAKRIM', color: getAgentColor('hayat'), initials: 'HO' },
  { id: 'yasmine', name: 'Yasmine AATIC', color: getAgentColor('yasmine'), initials: 'YA' },
  { id: 'square', name: 'Square Meter AGENCE', color: getAgentColor('square'), initials: 'SM' },
]

export const EVENT_TYPE_OPTIONS = Object.values(EVENT_TYPE_CONFIG).map(c => ({
  value: c.value,
  label: c.label,
  icon: c.icon,
}))

export function isDbEvent(event: CalendarEvent): boolean {
  return /^\d+$/.test(event.id)
}

export function getEventAgentNames(event: CalendarEvent): string[] {
  if (isDbEvent(event) && event.agentNames && event.agentNames.length > 0) return event.agentNames
  if (isDbEvent(event) && event.createdBy) return [event.createdBy]
  return event.agentIds
    .map(id => AGENTS.find(a => a.id === id)?.name)
    .filter((n): n is string => Boolean(n))
}

export function getInitials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
}

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
  administratif: '#6B7280',
  'apres-vente': '#F97316',
  autre: '#71717A',
  commercial: '#10B981',
  'compte-rendu': '#06B6D4',
  conges: '#F59E0B',
  estimation: '#6366F1',
  'etat-des-lieux': '#14B8A6',
  evenement: '#EC4899',
  formation: '#3B82F6',
  message: '#0EA5E9',
  permanence: '#8B5CF6',
  personnel: '#A855F7',
  'portes-ouvertes': '#D946EF',
  proposition: '#22C55E',
  prospection: '#F43F5E',
  publicite: '#EAB308',
  relance: '#EF4444',
  'rendez-vous': '#84CC16',
  sondage: '#78716C',
  validation: '#64748B',
  visite: '#3B82F6',
  'visite-virtuelle': '#0EA5E9',
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
  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)
  return events.filter(e => {
    const start = new Date(e.start)
    const end = new Date(e.end)
    return end > dayStart && start < dayEnd
  })
}

export function getEventsForWeek(events: CalendarEvent[], date: Date): CalendarEvent[] {
  const weekStart = getWeekStart(date)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)
  return events.filter(e => {
    const start = new Date(e.start)
    const end = new Date(e.end)
    return end > weekStart && start < weekEnd
  })
}

export function getEventsForMonth(events: CalendarEvent[], date: Date): CalendarEvent[] {
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
  const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 1)
  return events.filter(e => {
    const start = new Date(e.start)
    const end = new Date(e.end)
    return end >= monthStart && start < monthEnd
  })
}

export function getEventDayOverlap(event: CalendarEvent, day: Date): { start: Date; end: Date } {
  const dayStart = new Date(day)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)
  const start = new Date(Math.max(event.start.getTime(), dayStart.getTime()))
  const end = new Date(Math.min(event.end.getTime(), dayEnd.getTime()))
  return { start, end }
}

export function getEventDayHours(event: CalendarEvent, day: Date): { startH: number; endH: number } {
  const { start, end } = getEventDayOverlap(event, day)
  const dayStart = new Date(day)
  dayStart.setHours(0, 0, 0, 0)
  const startH = (start.getTime() - dayStart.getTime()) / 3600000
  const endH = (end.getTime() - dayStart.getTime()) / 3600000
  return { startH, endH }
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

export function formatEventRange(event: CalendarEvent): string {
  const shortDate = (date: Date) => date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
  const sameDay = event.start.toDateString() === event.end.toDateString()
  if (sameDay) {
    return `${shortDate(event.start)} ${formatTime(event.start)} - ${formatTime(event.end)}`
  }
  return `${shortDate(event.start)} ${formatTime(event.start)} → ${shortDate(event.end)} ${formatTime(event.end)}`
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
      id: 'evt-1', type: 'compte-rendu', title: 'Réunion équipe', start: makeDate(day, 9, 0), end: makeDate(day, 10, 30),
      allDay: false, agentIds: ['myriam', 'dimitri'], reminders: [{ label: '15 minutes avant' }],
      createdAt: makeDate(day, 8, 0), createdBy: 'Myriam ABABOU',
    },
    {
      id: 'evt-2', type: 'administratif', title: 'Suivi administratif', start: makeDate(day, 14, 0), end: makeDate(day, 16, 0),
      allDay: false, agentIds: ['myriam'], reminders: [],
      createdAt: makeDate(day, 8, 0), createdBy: 'Myriam ABABOU',
    },
    {
      id: 'evt-3', type: 'relance', title: 'Appels clients (5)', start: makeDate(day + 1, 9, 0), end: makeDate(day + 1, 11, 0),
      allDay: false, agentIds: ['yasmine'], reminders: [{ label: '30 minutes avant' }],
      createdAt: makeDate(day, 8, 0), createdBy: 'Yasmine AATIC',
    },
    {
      id: 'evt-4', type: 'visite', title: 'Visite appartement - Client Martin', start: makeDate(day + 1, 10, 0), end: makeDate(day + 1, 11, 30),
      allDay: false, agentIds: ['myriam'], clientName: 'Ahmed Benali', clientPhone: '+212 6 12 34 56 78', clientEmail: 'ahmed@email.com',
      propertyName: 'Villa Marrakech', propertyRef: 'RES-2026-001', location: '15 Rue de la Liberté, Casablanca',
      keysInfo: 'Disponible - Boîte à clés code 1234',
      description: 'Client très intéressé, demande à voir la piscine et le jardin.',
      reminders: [{ label: '15 minutes avant', sent: true }],
      createdAt: makeDate(day, 8, 0), createdBy: 'Myriam ABABOU',
    },
    {
      id: 'evt-5', type: 'commercial', title: 'Session croisements', start: makeDate(day + 2, 10, 0), end: makeDate(day + 2, 12, 0),
      allDay: false, agentIds: ['dimitri'], reminders: [],
      createdAt: makeDate(day, 8, 0), createdBy: 'Dimitri DJEDJE',
    },
    {
      id: 'evt-6', type: 'visite', title: 'Visite villa - Client Dubois', start: makeDate(day + 2, 15, 0), end: makeDate(day + 2, 17, 0),
      allDay: false, agentIds: ['myriam'], reminders: [{ label: '1 heure avant' }],
      createdAt: makeDate(day, 8, 0), createdBy: 'Myriam ABABOU',
    },
    {
      id: 'evt-7', type: 'visite', title: 'Visite Client X', start: makeDate(day + 1, 10, 0), end: makeDate(day + 1, 11, 0),
      allDay: false, agentIds: ['dimitri'], reminders: [],
      createdAt: makeDate(day, 8, 0), createdBy: 'Dimitri DJEDJE',
    },
    {
      id: 'evt-8', type: 'visite', title: 'Visite Client Y', start: makeDate(day + 1, 14, 0), end: makeDate(day + 1, 15, 30),
      allDay: false, agentIds: ['dimitri'], reminders: [],
      createdAt: makeDate(day, 8, 0), createdBy: 'Dimitri DJEDJE',
    },
    {
      id: 'evt-9', type: 'rendez-vous', title: 'Rendez-vous notaire', start: makeDate(day + 1, 9, 30), end: makeDate(day + 1, 11, 0),
      allDay: false, agentIds: ['hayat'], reminders: [{ label: '1 jour avant' }],
      createdAt: makeDate(day, 8, 0), createdBy: 'Hayat OUAKRIM',
    },
    {
      id: 'evt-10', type: 'visite', title: 'Visite Client W', start: makeDate(day + 2, 14, 0), end: makeDate(day + 2, 15, 30),
      allDay: false, agentIds: ['hayat'], reminders: [],
      createdAt: makeDate(day, 8, 0), createdBy: 'Hayat OUAKRIM',
    },
    {
      id: 'evt-11', type: 'visite', title: 'Visite Client U', start: makeDate(day + 3, 10, 0), end: makeDate(day + 3, 11, 30),
      allDay: false, agentIds: ['hayat'], reminders: [],
      createdAt: makeDate(day, 8, 0), createdBy: 'Hayat OUAKRIM',
    },
    {
      id: 'evt-12', type: 'compte-rendu', title: 'Réunion commerciale', start: makeDate(day + 3, 9, 0), end: makeDate(day + 3, 10, 30),
      allDay: false, agentIds: ['yasmine'], reminders: [{ label: '15 minutes avant' }],
      createdAt: makeDate(day, 8, 0), createdBy: 'Yasmine AATIC',
    },
    {
      id: 'evt-13', type: 'visite', title: 'Visite Tanger', start: makeDate(day + 4, 9, 0), end: makeDate(day + 4, 12, 0),
      allDay: false, agentIds: ['myriam'], reminders: [{ label: '1 heure avant' }, { label: '1 jour avant' }],
      createdAt: makeDate(day, 8, 0), createdBy: 'Myriam ABABOU',
    },
    {
      id: 'evt-14', type: 'relance', title: 'Appel Client V', start: makeDate(day + 4, 15, 0), end: makeDate(day + 4, 15, 30),
      allDay: false, agentIds: ['hayat'], reminders: [],
      createdAt: makeDate(day, 8, 0), createdBy: 'Hayat OUAKRIM',
    },
    {
      id: 'evt-15', type: 'visite', title: 'Visite Client B', start: makeDate(day + 4, 16, 0), end: makeDate(day + 4, 17, 30),
      allDay: false, agentIds: ['yasmine'], reminders: [],
      createdAt: makeDate(day, 8, 0), createdBy: 'Yasmine AATIC',
    },
    {
      id: 'evt-16', type: 'visite', title: 'Visite Client T', start: makeDate(day + 5, 10, 0), end: makeDate(day + 5, 11, 30),
      allDay: false, agentIds: ['hayat'], reminders: [],
      createdAt: makeDate(day, 8, 0), createdBy: 'Hayat OUAKRIM',
    },
    {
      id: 'evt-17', type: 'conges', title: 'Congé', start: makeDate(day + 10, 0, 0), end: makeDate(day + 14, 23, 59),
      allDay: true, agentIds: ['dimitri'], reminders: [{ label: '1 jour avant' }],
      createdAt: makeDate(day, 8, 0), createdBy: 'Dimitri DJEDJE',
    },
    {
      id: 'evt-18', type: 'visite', title: 'Visite Client A', start: makeDate(day, 14, 0), end: makeDate(day, 15, 30),
      allDay: false, agentIds: ['yasmine'], reminders: [],
      createdAt: makeDate(day, 8, 0), createdBy: 'Yasmine AATIC',
    },
    {
      id: 'evt-19', type: 'visite', title: 'Visite Bouznika', start: makeDate(day + 2, 9, 0), end: makeDate(day + 2, 11, 0),
      allDay: false, agentIds: ['myriam'], reminders: [],
      createdAt: makeDate(day, 8, 0), createdBy: 'Myriam ABABOU',
    },
    {
      id: 'evt-20', type: 'visite', title: 'Visite Client Z', start: makeDate(day + 3, 11, 0), end: makeDate(day + 3, 12, 30),
      allDay: false, agentIds: ['dimitri'], reminders: [],
      createdAt: makeDate(day, 8, 0), createdBy: 'Dimitri DJEDJE',
    },
  ]
}
