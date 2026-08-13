import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Minus, X, ChevronRight, ChevronLeft, MoreVertical, Activity, ToggleLeft, Trash2,
  BarChart2, Zap, Mail, MessageSquare, Smartphone, Calendar, Crosshair, FileText, Globe, Users,
  Check, CheckCircle, XCircle, Clock, Search, Download, Play, Eye, PieChart, Filter,
  User, UserCheck, AlertTriangle, Sliders, Send, ShoppingCart, TrendingUp, Key, Home, MapPin, Bell, BookOpen,
  Shield, Copy, Edit3,
} from 'react-feather'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, BarChart as ReBarChart, Bar,
} from 'recharts'
import Card from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Select } from '../../../components/ui/Select'
import { TimePicker } from '../../../components/ui/TimePicker'
import { DatePicker } from '../../../components/ui/DatePicker'
import {
  CATEGORIE_ICONES,
  getModeleById, getEventById, LOG_STATUT_LABELS,
  EVENTS, CLIENT_TYPE_CONFIG, REAL_CLIENT_TYPES,
} from '../../../types/automator'
import type { Automator, AutomatorModele, AutomatorNiveau, AutomatorNotification, NotificationCanal, AutomatorLog, LogStatut, AutomatorEvent, RecipientType, ClientType } from '../../../types/automator'
import { useAutomator, AddAutomatorInput, UpdateAutomatorInput } from '../../../contexts/AutomatorContext'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { api } from '../../../services/api'
import { allContacts } from '../contacts/mockData'
import { mockPropertiesList } from '../../../data/mockProperties'
import { useThemeColors } from '../../../components/dashboard/useThemeColors'

const CANAL_ICONES: Record<NotificationCanal, { icon: any; label: string }> = {
  email: { icon: Mail, label: 'Email' },
  sms: { icon: MessageSquare, label: 'SMS' },
  push: { icon: Smartphone, label: 'Push' },
  application_mobile: { icon: Smartphone, label: 'CRM Square Immo' },
}

const CATEGORIE_ICONS: Record<string, any> = {
  calendrier: Calendar,
  contrats: FileText,
  extranet: Eye,
  contacts: Users,
}

const CLIENT_TYPE_ICONS: Record<ClientType, any> = {
  tous: Sliders,
  acheteur: ShoppingCart,
  vendeur: TrendingUp,
  bailleur: Key,
  locataire: Home,
  voyageur: MapPin,
  contacts: Users,
  calendrier: Calendar,
  contrats: FileText,
  extranet: Eye,
  admin: Shield,
}

const CLIENT_TYPE_COLORS: Record<ClientType, string> = {
  tous: 'text-text-secondary',
  acheteur: 'text-blue-600',
  vendeur: 'text-emerald-600',
  bailleur: 'text-purple-600',
  locataire: 'text-amber-600',
  voyageur: 'text-rose-600',
  contacts: 'text-cyan-600',
  calendrier: 'text-orange-600',
  contrats: 'text-indigo-600',
  extranet: 'text-teal-600',
  admin: 'text-slate-600',
}

type WizardStep = 1 | 2 | 3
type NiveauChoice = 'agence' | 'agent_specifique' | 'personnel'

const PAGE_SIZE = 8

const LANGUES_DISPO = [
  { key: 'fr', label: 'Français' },
  { key: 'en', label: 'Anglais' },
  { key: 'es', label: 'Espagnol' },
  { key: 'ar', label: 'Arabe' },
]



function recipientIcon(r: RecipientType) {
  switch (r) {
    case 'agent': return User
    case 'client': return User
    case 'both': return Users
  }
}

function recipientLabel(r: RecipientType, isAdmin?: boolean) {
  if (isAdmin && r === 'agent') return 'L\'admin uniquement'
  switch (r) {
    case 'agent': return 'L\'agent uniquement'
    case 'client': return 'Le client uniquement'
    case 'both': return 'L\'agent et le client'
  }
}

function deriveRecipient(a: Automator): RecipientType {
  const types = new Set<string>()
  a.notifications.forEach(n => {
    n.destinataires.forEach(d => types.add(d))
  })
  const hasAgent = types.has('agent')
  const hasClient = types.has('contact') || types.has('client')
  if (hasAgent && hasClient) return 'both'
  if (hasAgent) return 'agent'
  return 'client'
}

const RECIPIENT_SHORT: Record<RecipientType, { label: string; color: string }> = {
  agent: { label: 'Agent', color: 'text-blue-600' },
  client: { label: 'Client', color: 'text-emerald-600' },
  both: { label: 'Agent+Client', color: 'text-purple-600' },
}

const MODELE_CLIENT_TYPE: Record<number, ClientType> = {
  5: 'vendeur', 6: 'acheteur', 7: 'vendeur',
}

function getModeleClientTypeKey(modeleId: number): ClientType | undefined {
  return MODELE_CLIENT_TYPE[modeleId]
}

function automatorRecipientDisplay(a: Automator): { label: string; color: string } {
  const ev = a.eventId ? getEventById(a.eventId) : undefined
  const ctKey = ev?.clientType
  const cfg = ctKey ? CLIENT_TYPE_CONFIG.find(c => c.key === ctKey) : undefined
  const r = deriveRecipient(a)
  if (r === 'agent') return { label: 'Agent', color: 'text-blue-600' }
  if (r === 'client') return { label: cfg?.label || 'Contact', color: cfg?.color || 'text-emerald-600' }
  if (cfg) return { label: `Agent + ${cfg.label}`, color: 'text-purple-600' }
  return { label: 'Agent + Contact', color: 'text-purple-600' }
}

function niveauLabel(n: NiveauChoice) {
  switch (n) {
    case 'agence': return 'L\'ensemble de l\'agence'
    case 'agent_specifique': return 'Un agent spécifique'
    case 'personnel': return 'Personnellement (moi uniquement)'
  }
}

function getAutomatorEventName(a: { eventId?: string; modeleId: number }): string {
  if (a.eventId) {
    const ev = getEventById(a.eventId)
    if (ev) return ev.label
  }
  return getModeleById(a.modeleId)?.nom || '—'
}

function AnimatedCounter({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<number | null>(null)
  useEffect(() => {
    const start = performance.now()
    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * value))
      if (progress < 1) ref.current = requestAnimationFrame(animate)
    }
    ref.current = requestAnimationFrame(animate)
    return () => { if (ref.current) cancelAnimationFrame(ref.current) }
  }, [value, duration])
  return <>{display}</>
}

function StatCard({ icon: Icon, label, value, color = 'accent' }: {
  icon: any; label: string; value: string | number; color?: string
}) {
  const colorMap: Record<string, string> = {
    accent: 'bg-accent/10 text-accent',
    emerald: 'bg-emerald-500/10 text-emerald-500',
    indigo: 'bg-indigo-500/10 text-indigo-500',
    amber: 'bg-amber-500/10 text-amber-500',
    red: 'bg-red-500/10 text-red-500',
    purple: 'bg-purple-500/10 text-purple-500',
  }
  return (
    <Card className="p-4 flex items-center gap-4 hover:shadow-md transition-shadow duration-300">
      <div className={`w-11 h-11 rounded-xl ${colorMap[color] || colorMap.accent} flex items-center justify-center flex-shrink-0`}>
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-bold text-text">
          {typeof value === 'number' ? <AnimatedCounter value={value} /> : value}
        </p>
        <p className="text-xs text-text-secondary truncate">{label}</p>
      </div>
    </Card>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border/50 rounded-lg shadow-lg p-3 text-xs">
        <p className="font-medium text-text mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} style={{ color: entry.color }}>{entry.name}: {entry.value}</p>
        ))}
      </div>
    )
  }
  return null
}

export default function AdminAutomatorPage() {
  const automatorCtx = useAutomator()
  const colors = useThemeColors()
  const [usersAgentNames, setUsersAgentNames] = useState<string[]>([])

  useEffect(() => {
    api.get<any[]>('/admin/users').then(users => {
      const names = users
        .filter(u => u.role === 'agent' && u.first_name)
        .map(u => [u.first_name, u.last_name].filter(Boolean).join(' '))
        .filter(Boolean)
      setUsersAgentNames(names)
    }).catch(() => {})
  }, [])

  const ALL_AGENTS = useMemo(() => {
    const fromAutomators = automatorCtx.automators.map(a => a.createdBy)
    return Array.from(new Set([...fromAutomators, ...usersAgentNames]))
  }, [automatorCtx.automators, usersAgentNames])

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatut, setFilterStatut] = useState('all')
  const [filterAgent, setFilterAgent] = useState('all')
  const [filterDestinataire, setFilterDestinataire] = useState('all')
  const [filterTypeClient, setFilterTypeClient] = useState('all')
  const [page, setPage] = useState(1)

  const [showWizard, setShowWizard] = useState(false)
  const [editTarget, setEditTarget] = useState<Automator | null>(null)
  const [wizardStep, setWizardStep] = useState<WizardStep>(1)
  const [showLogsFor, setShowLogsFor] = useState<Automator | null>(null)
  const [logDetail, setLogDetail] = useState<AutomatorLog | null>(null)
  const [logDateFilter, setLogDateFilter] = useState<'all' | 'mois'>('all')
  const [logStatutFilter, setLogStatutFilter] = useState('all')
  const [logDateDebut, setLogDateDebut] = useState('')
  const [logDateFin, setLogDateFin] = useState('')
  const [logHeureDebut, setLogHeureDebut] = useState('')
  const [logHeureFin, setLogHeureFin] = useState('')
  const [showAllLogs, setShowAllLogs] = useState(false)
  const [allLogsSearch, setAllLogsSearch] = useState('')
  const [allLogsAutomator, setAllLogsAutomator] = useState('all')
  const [allLogsStatut, setAllLogsStatut] = useState('all')
  const [allLogsDateDebut, setAllLogsDateDebut] = useState('')
  const [allLogsDateFin, setAllLogsDateFin] = useState('')
  const [allLogsHeureDebut, setAllLogsHeureDebut] = useState('')
  const [allLogsHeureFin, setAllLogsHeureFin] = useState('')
  const [allLogsPage, setAllLogsPage] = useState(1)
  const [allLogsDetail, setAllLogsDetail] = useState<any>(null)
  const [showActionMenu, setShowActionMenu] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
  const [emailPreviewHtml, setEmailPreviewHtml] = useState<string | null>(null)
  const [emailPreviewTitle, setEmailPreviewTitle] = useState<string>('')
  const [previewChannel, setPreviewChannel] = useState<'email' | 'crm'>('email')
  const [detailTarget, setDetailTarget] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    api.get<any>('/auth/me').then(setCurrentUser).catch(() => {})
  }, [])

  const adminName = currentUser
    ? [currentUser.first_name, currentUser.last_name].filter(Boolean).join(' ') || currentUser.email || ''
    : ''

  // Step 1 state
  const [niveau, setNiveau] = useState<NiveauChoice>('agence')
  const [selectedAgent, setSelectedAgent] = useState('')
  const [recipient, setRecipient] = useState<RecipientType>('both')
  const [filterClientType, setFilterClientType] = useState<ClientType>('tous')
  const [selectedEvent, setSelectedEvent] = useState<AutomatorEvent | null>(null)
  const [priority, setPriority] = useState<'haute' | 'normale' | 'basse'>('haute')
  const [periode, setPeriode] = useState<'toujours' | 'plage_horaire'>('toujours')
  const [heureDebut, setHeureDebut] = useState('09:00')
  const [heureFin, setHeureFin] = useState('18:00')
  const [limite, setLimite] = useState<'illimite' | 'nombre_max'>('illimite')
  const [nombreMax, setNombreMax] = useState(10)
  const [actifParDefaut, setActifParDefaut] = useState(true)

  // Step 2 state
  const [agentEmail, setAgentEmail] = useState(true)
  const [agentSms, setAgentSms] = useState(false)
  const [agentApp, setAgentApp] = useState(true)
  const [clientEmail, setClientEmail] = useState(true)
  const [clientSms, setClientSms] = useState(true)
  const [clientApp, setClientApp] = useState(false)
  const [sendFrequence, setSendFrequence] = useState<'chaque' | 'quotidien' | 'hebdomadaire'>('chaque')
  const [langues, setLangues] = useState<string[]>(['fr', 'en', 'es'])




  const filtered = useMemo(() => {
    return automatorCtx.automators.filter(a => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase()
        const evName = getAutomatorEventName(a).toLowerCase()
        if (!a.id.toString().includes(q) && !evName.includes(q) && !a.createdBy.toLowerCase().includes(q)) return false
      }
      if (filterStatut === 'actif' && !a.actif) return false
      if (filterStatut === 'inactif' && a.actif) return false
      if (filterAgent !== 'all') {
        if (filterAgent === 'Admin') {
          if (a.createdBy !== 'Admin' && a.createdBy !== 'system') return false
        } else if (a.createdBy !== filterAgent) return false
      }
      if (filterDestinataire !== 'all') {
        const isAdmin = a.createdBy === 'system' || a.createdBy === 'Admin'
        const r = deriveRecipient(a)
        if (filterDestinataire === 'admin') {
          if (r !== 'agent' || !isAdmin) return false
        } else if (filterDestinataire === 'agent') {
          if (r !== 'agent' || isAdmin) return false
        } else if (r !== filterDestinataire) return false
      }
      if (filterTypeClient !== 'all') {
        const ev = a.eventId ? getEventById(a.eventId) : undefined
        const evClientType = ev?.clientType
        if (evClientType !== filterTypeClient) return false
      }
      return true
    })
  }, [searchTerm, filterStatut, filterAgent, filterDestinataire, filterTypeClient, automatorCtx.automators])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const totalExecs = automatorCtx.logs.length
  const totalEchecs = automatorCtx.logs.filter(l => l.statut === 'echec').length
  const tauxSucces = totalExecs > 0 ? Math.round(((totalExecs - totalEchecs) / totalExecs) * 100) : 0

  const LINE_COLORS = [colors.accent, '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

  const PIE_COLORS = [colors.accent, '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#F97316']

  const performanceTimeline = useMemo(() => {
    const isAdminKey = (k: string) => k === 'system' || k === 'Admin'
    const responsableName = (createdBy: string) =>
      isAdminKey(createdBy) ? `Admin (${adminName})` : `Agent (${createdBy})`

    const responsables = new Set<string>()
    automatorCtx.logs.forEach(l => {
      const auto = automatorCtx.automators.find(a => a.id === l.automatorId)
      if (auto) responsables.add(responsableName(auto.createdBy))
    })

    const days: Record<string, any>[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dayStr = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
      const dayFull = d.toISOString().slice(0, 10)

      const dayData: Record<string, any> = { jour: dayStr }
      responsables.forEach(r => { dayData[r] = 0 })

      automatorCtx.logs.forEach(l => {
        if (l.executeLe.slice(0, 10) !== dayFull) return
        const auto = automatorCtx.automators.find(a => a.id === l.automatorId)
        if (!auto) return
        const name = responsableName(auto.createdBy)
        if (dayData[name] !== undefined) dayData[name]++
      })

      days.push(dayData)
    }
    return days
  }, [automatorCtx.automators, automatorCtx.logs, adminName])

  const responsableKeys = useMemo(() => {
    if (performanceTimeline.length === 0) return []
    return Object.keys(performanceTimeline[0]).filter(k => k !== 'jour')
  }, [performanceTimeline])

  const responsableTotals = useMemo(() => {
    const isAdminKey = (k: string) => k === 'system' || k === 'Admin'
    const totals: Record<string, number> = {}
    automatorCtx.automators.forEach(a => {
      const name = isAdminKey(a.createdBy) ? `Admin (${adminName})` : `Agent (${a.createdBy})`
      totals[name] = (totals[name] || 0) + 1
    })
    return totals
  }, [automatorCtx.automators, adminName])

  const recentAutomations = useMemo(() => {
    return [...automatorCtx.automators].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return dateB - dateA
    }).slice(0, 5)
  }, [automatorCtx.automators])

  const categoryChartData = useMemo(() => {
    const counts: Record<string, number> = {}
    automatorCtx.automators.forEach(a => {
      const ev = a.eventId ? getEventById(a.eventId) : undefined
      const cfg = CLIENT_TYPE_CONFIG.find(c => c.key === (ev?.clientType || 'tous'))
      const label = cfg?.label || ev?.clientType || 'Autre'
      counts[label] = (counts[label] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [automatorCtx.automators])

  const executionChartData = useMemo(() => {
    const days: { jour: string; succes: number; echec: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dayStr = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
      const dayFull = d.toISOString().slice(0, 10)
      const logs = automatorCtx.logs.filter(l => {
        const lDate = l.executeLe.slice(0, 10)
        return lDate === dayFull
      })
      days.push({
        jour: dayStr,
        succes: logs.filter(l => l.statut === 'succes').length,
        echec: logs.filter(l => l.statut === 'echec').length,
      })
    }
    return days
  }, [automatorCtx.logs])



  const statutOptions = [
    { value: 'all', label: 'Tous statuts' },
    { value: 'actif', label: 'Actif' },
    { value: 'inactif', label: 'Inactif' },
  ]
  const agentOptions = [
    { value: 'all', label: 'Tous responsables' },
    ...ALL_AGENTS
      .filter(a => a !== 'system')
      .map(a => ({ value: a, label: a === 'Admin' ? `Admin (${adminName})` : a })),
  ]

  const startWizard = () => {
    setSelectedEvent(null); setFilterClientType('tous'); setRecipient('both')
    setNiveau('agence'); setSelectedAgent(''); setPriority('haute')
    setPeriode('toujours'); setHeureDebut('09:00'); setHeureFin('18:00'); setLimite('illimite'); setNombreMax(10); setActifParDefaut(true)
    setAgentEmail(true); setAgentSms(false); setAgentApp(true)
    setClientEmail(true); setClientSms(true); setClientApp(false)
    setSendFrequence('chaque'); setLangues(['fr', 'en', 'es'])
    setWizardStep(1); setShowWizard(true)
  }

  const scrollToEvent = (eventId: string) => {
    setTimeout(() => {
      const el = document.querySelector(`[data-event-id="${eventId}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 150)
  }

  const openEditWizard = (a: Automator) => {
    setSelectedEvent(null); setFilterClientType('tous'); setRecipient('both')
    setNiveau('agence'); setSelectedAgent(''); setPriority('haute')
    setPeriode('toujours'); setHeureDebut('09:00'); setHeureFin('18:00'); setLimite('illimite'); setNombreMax(10); setActifParDefaut(true)
    setAgentEmail(true); setAgentSms(false); setAgentApp(true)
    setClientEmail(true); setClientSms(true); setClientApp(false)
    setSendFrequence('chaque'); setLangues(['fr', 'en', 'es'])
    setWizardStep(1); setShowWizard(true)

    setEditTarget(a)

    const ev = a.eventId ? getEventById(a.eventId) : undefined
    const isSystem = a.createdBy === 'system'
    const isAgentCreated = a.createdBy && a.createdBy !== 'Admin' && a.createdBy !== 'system' && ALL_AGENTS.includes(a.createdBy)

    if (isSystem) {
      setNiveau('personnel')
      setFilterClientType('admin')
      setRecipient('agent')
    } else if (isAgentCreated) {
      setNiveau('agent_specifique')
      setSelectedAgent(a.createdBy)
      setRecipient('agent')
      if (ev) setFilterClientType(ev.clientType)
    } else if (a.niveau === 'utilisateur') {
      setNiveau('personnel')
      setFilterClientType('admin')
      setRecipient('agent')
    } else {
      setRecipient(deriveRecipient(a))
      if (ev) setFilterClientType(ev.clientType)
    }

    if (ev) {
      setSelectedEvent(ev)
      scrollToEvent(ev.id)
    }
  }

  const handleRecipientChange = (r: RecipientType) => {
    setRecipient(r)
    if (r === 'agent') {
      setFilterClientType('admin' as ClientType)
    } else {
      setFilterClientType('tous')
    }
    if (selectedEvent && selectedEvent.defaultRecipient !== r) setSelectedEvent(null)
  }

  const selectEvent = (e: AutomatorEvent) => {
    setSelectedEvent(e)
    setWizardStep(2)
  }

  const toggleLangue = (l: string) => {
    if (langues.includes(l)) {
      if (langues.length > 1) setLangues(langues.filter(x => x !== l))
    } else {
      setLangues([...langues, l])
    }
  }

  const recipientEvents = useMemo(() => {
    if (niveau === 'personnel') {
      return EVENTS.filter(e => e.clientType === 'admin')
    }
    return EVENTS.filter(e => e.defaultRecipient === recipient)
  }, [recipient, niveau])

  const availableClientTypes = useMemo(() => {
    if (niveau === 'personnel') {
      return CLIENT_TYPE_CONFIG.filter((ct: { key: ClientType; label: string; color: string }) => ct.key === 'admin')
    }
    const types = new Set<ClientType>(recipientEvents.map(e => e.clientType))
    return CLIENT_TYPE_CONFIG.filter((ct: { key: ClientType; label: string; color: string }) => ct.key === 'tous' || types.has(ct.key))
  }, [recipientEvents, niveau])

  const filteredEvents = useMemo(() => {
    if (filterClientType === 'tous') return recipientEvents
    return recipientEvents.filter(e => e.clientType === filterClientType)
  }, [recipientEvents, filterClientType])

  const niveauRecipientLabel = () => {
    if (niveau === 'agence') return 'tous les agents de l\'agence'
    if (niveau === 'agent_specifique') return selectedAgent || 'un agent spécifique'
    return 'vous'
  }

  const SVG_W = 760, SVG_H = 270, SVG_ML = { t: 40, r: 20, b: 38, l: 48 }

  const svgArea = (data: any[], keys: string[], colors: string[], opts: { title: string; gid: string; labelKey?: string; width?: number }) => {
    const { title, gid, labelKey = 'jour', width } = opts
    const w = width || SVG_W
    const cw = w - SVG_ML.l - SVG_ML.r, ch = SVG_H - SVG_ML.t - SVG_ML.b
    let maxVal = 5
    data.forEach(d => keys.forEach(k => { const v = Number(d[k]); if (v > maxVal) maxVal = v }))
    maxVal = Math.ceil(maxVal / 5) * 5 || 5
    const x = (i: number) => SVG_ML.l + (i / Math.max(data.length - 1, 1)) * cw
    const y = (v: number) => SVG_ML.t + ch - (v / maxVal) * ch
    const yTicks: number[] = []
    for (let v = 0; v <= maxVal; v += Math.max(Math.ceil(maxVal / 4), 1)) yTicks.push(v)
    if (yTicks[yTicks.length - 1] !== maxVal) yTicks.push(maxVal)

    const baseY = y(0), lastX = x(data.length - 1), firstX = x(0)
    let grads = '', paths = ''
    keys.forEach((k, i) => {
      const c = colors[i % colors.length], g = `${gid}-${i}`
      const pts = data.map((d, j) => `${j === 0 ? 'M' : 'L'}${x(j)},${y(Number(d[k]) || 0)}`).join(' ')
      const line = data.map((d, j) => `${j === 0 ? 'M' : 'L'}${x(j)},${y(Number(d[k]) || 0)}`).join(' ')
      grads += `<linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stop-color="${c}" stop-opacity="0.3"/><stop offset="95%" stop-color="${c}" stop-opacity="0"/></linearGradient>`
      paths += `<path d="${pts} L${lastX},${baseY} L${firstX},${baseY} Z" fill="url(#${g})"/><path d="${line}" fill="none" stroke="${c}" stroke-width="2" stroke-linejoin="round"/>`
    })

    const grids = yTicks.map(t => `<line x1="${SVG_ML.l}" y1="${y(t)}" x2="${w - SVG_ML.r}" y2="${y(t)}" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4,4"/>`).join('')
    const xLabels = data.map((d, i) => `<text x="${x(i)}" y="${SVG_H - 8}" text-anchor="middle" font-size="11" fill="#94a3b8">${d[labelKey]}</text>`).join('')
    const yLabels = yTicks.map(t => `<text x="${SVG_ML.l - 8}" y="${y(t) + 4}" text-anchor="end" font-size="11" fill="#94a3b8">${t}</text>`).join('')
    const axes = `<line x1="${SVG_ML.l}" y1="${SVG_ML.t}" x2="${SVG_ML.l}" y2="${SVG_ML.t + ch}" stroke="#e2e8f0" stroke-width="1"/><line x1="${SVG_ML.l}" y1="${SVG_ML.t + ch}" x2="${w - SVG_ML.r}" y2="${SVG_ML.t + ch}" stroke="#e2e8f0" stroke-width="1"/>`

    const lw = keys.length * 150
    const ls = (w - lw) / 2
    const legend = keys.map((k, i) => `<rect x="${ls + i * 150}" y="12" width="12" height="12" rx="2" fill="${colors[i % colors.length]}"/><text x="${ls + i * 150 + 18}" y="22" font-size="11" fill="#64748b">${k}</text>`).join('')

    return `<h3 style="font-size:14px;font-weight:600;color:#1e293b;margin:0 0 6px">${title}</h3>
      <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${SVG_H}" viewBox="0 0 ${w} ${SVG_H}" style="display:block;max-width:100%">
        <defs>${grads}</defs>${grids}${axes}${xLabels}${yLabels}${paths}${legend}
      </svg>`
  }

  const svgPie = (data: { name: string; value: number }[], colors: string[], title: string) => {
    const cx = 190, cy = SVG_H / 2 + 10, r = 95
    const total = data.reduce((s, d) => s + d.value, 0) || 1
    let cur = -Math.PI / 2, slices = ''
    data.forEach((d, i) => {
      const a = (d.value / total) * 2 * Math.PI
      const s = cur, e = cur + a
      cur = e
      const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s)
      const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e)
      const large = a > Math.PI ? 1 : 0
      slices += `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z" fill="${colors[i % colors.length]}" stroke="#fff" stroke-width="2"/>`
    })

    const lx = 330
    const legend = data.map((d, i) => {
      const ly = 20 + i * 26
      return `<rect x="${lx}" y="${ly}" width="14" height="14" rx="3" fill="${colors[i % colors.length]}"/>
        <text x="${lx + 22}" y="${ly + 11}" font-size="12" fill="#64748b">${d.name}</text>
        <text x="${SVG_W - 20}" y="${ly + 11}" text-anchor="end" font-size="12" fill="#334155" font-weight="bold">${d.value}</text>`
    }).join('')

    return `<h3 style="font-size:14px;font-weight:600;color:#1e293b;margin:0 0 6px">${title}</h3>
      <svg xmlns="http://www.w3.org/2000/svg" width="${SVG_W}" height="${SVG_H + 20}" viewBox="0 0 ${SVG_W} ${SVG_H + 20}" style="display:block;max-width:100%">
        ${slices}${legend}
      </svg>`
  }

  const rapportColors = [colors.accent, '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

  const generateRapportHtml = () => {
    const allLogs = automatorCtx.logs
    const total = allLogs.length
    const echecs = allLogs.filter(l => l.statut === 'echec').length
    const succes = allLogs.filter(l => l.statut === 'succes').length
    const attente = allLogs.filter(l => l.statut !== 'succes' && l.statut !== 'echec').length
    const taux = total > 0 ? Math.round(((total - echecs) / total) * 100) : 0
    const actifs = automatorCtx.automators.filter(a => a.actif).length
    const inactifs = automatorCtx.automators.filter(a => !a.actif).length
    const now = new Date()

    const dateStr = now.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

    const sideW = Math.round((SVG_W - 24) / 2)
    const evoChart = svgArea(executionChartData, ['succes', 'echec'], ['#10B981', '#EF4444'], { title: 'Évolution des exécutions (7 jours)', gid: 'evo', width: sideW })

    const perfChart = svgArea(performanceTimeline, responsableKeys, rapportColors, { title: 'Performance par responsable (7 jours)', gid: 'perf', width: sideW })

    const catChart = svgPie(categoryChartData, PIE_COLORS, 'Répartition par catégorie')

    const statsCards = `
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
        <div class="sc total"><p class="sv">${automatorCtx.automators.length}</p><p class="sl">Automations</p></div>
        <div class="sc actif"><p class="sv">${actifs}</p><p class="sl">Actifs</p></div>
        <div class="sc inactif"><p class="sv">${inactifs}</p><p class="sl">Inactifs</p></div>
        <div class="sc taux"><p class="sv">${taux}%</p><p class="sl">Taux succès</p></div>
        <div class="sc executions"><p class="sv">${total}</p><p class="sl">Exécutions</p></div>
        <div class="sc echec"><p class="sv">${echecs}</p><p class="sl">Échecs</p></div>
        <div class="sc attente"><p class="sv">${attente}</p><p class="sl">En attente</p></div>
        <div class="sc notif"><p class="sv">${automatorCtx.triggeredNotifications.length}</p><p class="sl">Notifications</p></div>
      </div>`

    const autoRows = automatorCtx.automators.map(a => {
      const isAdminAuto = a.createdBy === 'system' || a.createdBy === 'Admin'
      const resp = isAdminAuto ? `Admin (${adminName})` : `Agent (${a.createdBy})`
      const ev = a.eventId ? getEventById(a.eventId) : undefined
      const evName = ev ? ev.label : '—'
      return `<tr><td>#${a.id}</td><td>${evName}</td><td>${resp}</td><td><span class="badge ${a.actif ? 'ok' : 'no'}">${a.actif ? 'Actif' : 'Inactif'}</span></td><td>${a.frequence || '—'}</td></tr>`
    }).join('')

    const recentLogs = allLogs.slice(-50).reverse()
    const logRows = recentLogs.map(l => {
      const auto = automatorCtx.automators.find(a => a.id === l.automatorId)
      const cls = l.statut === 'succes' ? 'ok' : l.statut === 'echec' ? 'ko' : 'wait'
      const lbl = l.statut === 'succes' ? 'Succès' : l.statut === 'echec' ? 'Échec' : 'En attente'
      return `<tr><td>${new Date(l.executeLe).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
        <td>#${l.automatorId} — ${auto ? getAutomatorEventName(auto) : '—'}</td>
        <td>${l.evenement}</td>
        <td>${l.destinataire}</td>
        <td><span class="badge ${cls}">${lbl}</span></td></tr>`
    }).join('')

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Rapport Automator</title>
      <script>window.onload=function(){setTimeout(function(){window.print()},500)}<\/script>
      <style>
        @page { margin:10mm 12mm }
        * { box-sizing:border-box }
        body { font-family:'Segoe UI',Arial,sans-serif; color:#1e293b; margin:0; padding:0; background:#f8fafc }
        .header { background:linear-gradient(135deg,${colors.accent},${colors.accentHover}); padding:30px 35px; border-radius:0 0 18px 18px; margin-bottom:24px }
        .header h1 { color:#fff; font-size:24px; font-weight:700; margin:0 0 4px; letter-spacing:-0.3px }
        .header .meta { color:rgba(255,255,255,0.8); font-size:12px; margin:0 }
        .content { padding:0 10px }
        .section { background:#fff; border-radius:12px; box-shadow:0 1px 4px rgba(0,0,0,0.06); padding:18px 20px; margin-bottom:18px }
        .sc { padding:14px 16px; border-radius:10px; text-align:center }
        .sc.total { background:#f0f4ff; border:1px solid #dbeafe }
        .sc.actif { background:#f0fdf4; border:1px solid #bbf7d0 }
        .sc.inactif { background:#fef2f2; border:1px solid #fecaca }
        .sc.taux { background:#eef2ff; border:1px solid #c7d2fe }
        .sc.executions { background:#fff7ed; border:1px solid #fed7aa }
        .sc.echec { background:#fef2f2; border:1px solid #fecaca }
        .sc.attente { background:#fefce8; border:1px solid #fde68a }
        .sc.notif { background:#faf5ff; border:1px solid #e9d5ff }
        .sv { font-size:22px; font-weight:700; margin:0 }
        .sl { font-size:9px; text-transform:uppercase; letter-spacing:0.5px; margin:2px 0 0; color:#64748b }
        .sc.total .sv { color:${colors.accent} } .sc.actif .sv { color:#10B981 } .sc.inactif .sv { color:#EF4444 } .sc.taux .sv { color:${colors.accent} }
        .sc.executions .sv { color:#F97316 } .sc.echec .sv { color:#EF4444 } .sc.attente .sv { color:#EAB308 } .sc.notif .sv { color:${colors.accent} }
        table { width:100%; border-collapse:separate; border-spacing:0; border-radius:10px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.04) }
        thead th { padding:10px 14px; background:#f8fafc; border-bottom:2px solid #e2e8f0; font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; color:#64748b; text-align:left }
        tbody td { padding:9px 14px; font-size:11px; color:#334155; border-bottom:1px solid #f1f5f9 }
        tbody tr:last-child td { border-bottom:none }
        tbody tr:hover { background:#f8fafc }
        .badge { display:inline-block; padding:2px 10px; border-radius:20px; font-size:10px; font-weight:500 }
        .badge.ok { background:#dcfce7; color:#166534 }
        .badge.no { background:#fee2e2; color:#991b1b }
        .badge.ko { background:#fee2e2; color:#991b1b }
        .badge.wait { background:#fef3c7; color:#92400e }
        .footer { margin-top:28px; padding-top:14px; border-top:1px solid #e2e8f0; font-size:10px; color:#94a3b8; text-align:center }
        .section, .chart-wrap { page-break-inside:avoid; break-inside:avoid; overflow:hidden }
      </style></head><body>
      <div class="header"><h1>Rapport Automator</h1><p class="meta">${automatorCtx.automators.length} automation(s) · ${total} exécution(s) · Généré le ${dateStr} à ${timeStr}</p></div>
      <div class="content">
        <div class="section">${statsCards}</div>
        <div style="display:flex;gap:18px;margin-bottom:18px">
          <div class="section chart-wrap" style="flex:1;margin-bottom:0">${evoChart}</div>
          <div class="section chart-wrap" style="flex:1;margin-bottom:0">${perfChart}</div>
        </div>
        <div class="section chart-wrap">${catChart}</div>
        <div class="section"><h3 style="font-size:14px;font-weight:600;color:#1e293b;margin:0 0 10px">Liste des automators</h3>
          <table><thead><tr><th>ID</th><th>Événement</th><th>Responsable</th><th>Statut</th><th>Fréquence</th></tr></thead><tbody>${autoRows}</tbody></table>
        </div>
        <div class="section"><h3 style="font-size:14px;font-weight:600;color:#1e293b;margin:0 0 10px">Dernières exécutions (50)</h3>
          <table><thead><tr><th>Date</th><th>Automator</th><th>Événement</th><th>Destinataire</th><th>Statut</th></tr></thead><tbody>${logRows}</tbody></table>
        </div>
        <div class="footer">Rapport généré automatiquement · CRM Automator</div>
      </div>
    </body></html>`
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center shadow-lg shadow-accent/20">
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">AUTOMATOR - {currentUser?.role === 'gerant' ? 'Gérant' : 'ADMIN'}</h1>
            <p className="text-sm text-text-secondary">Vue d'ensemble des automatisations {currentUser?.role === 'gerant' ? '(Gérant)' : '(Administrateur)'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={startWizard} icon={<Plus size={14} />}>Nouvel automator</Button>
        </div>
      </div>

      {/* Global Stats */}
      <Card className="p-5 border-l-4 border-l-accent">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-4 text-text">
          <Activity size={14} className="text-accent" />
          Statistiques globales
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Zap} label="Total automations" value={automatorCtx.automators.length} color="accent" />
          <StatCard icon={CheckCircle} label="Actifs" value={automatorCtx.automators.filter(a => a.actif).length} color="emerald" />
          <StatCard icon={XCircle} label="Inactifs" value={automatorCtx.automators.filter(a => !a.actif).length} color="red" />
          <StatCard icon={TrendingUp} label="Taux succès" value={`${tauxSucces}%`} color="indigo" />
          <StatCard icon={Activity} label="Exécutions" value={totalExecs} color="amber" />
          <StatCard icon={AlertTriangle} label="Échecs" value={totalEchecs} color="red" />
          <StatCard icon={Bell} label="Notifications CRM" value={automatorCtx.triggeredNotifications.length} color="purple" />
          <StatCard icon={Clock} label="En attente" value={automatorCtx.totalPending} color="amber" />
        </div>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium">Évolution des exécutions</p>
              <p className="text-xs text-text-secondary">7 derniers jours</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-text-secondary">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Succès
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Échec
              </span>
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={executionChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSucces" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorEchec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" opacity={0.3} />
                <XAxis dataKey="jour" tick={{ fontSize: 11, fill: 'var(--color-text-secondary, #6b7280)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-secondary, #6b7280)' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="succes" name="Succès" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorSucces)" />
                <Area type="monotone" dataKey="echec" name="Échec" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorEchec)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-medium mb-1">Répartition par catégorie</p>
          <p className="text-xs text-text-secondary mb-3">Automations actifs</p>
          <div className="h-52">
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </RePieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-text-secondary text-xs">Aucune donnée</div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {categoryChartData.map((entry, i) => (
              <div key={entry.name} className="flex items-center gap-2 text-xs text-text-secondary">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="truncate">{entry.name}</span>
                <span className="ml-auto font-medium text-text">{entry.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-3 p-5">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
            <Users size={14} className="text-accent" />
            Performance responsables
          </h3>
          <div className="flex flex-wrap items-center gap-3 mb-4 text-xs text-text-secondary">
            {responsableKeys.map((key, i) => (
              <span key={key} className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: LINE_COLORS[i % LINE_COLORS.length] }} />
                {key}
                <span className="font-medium text-text">({responsableTotals[key] || 0})</span>
              </span>
            ))}
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceTimeline} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  {responsableKeys.map((key, i) => (
                    <linearGradient key={key} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={LINE_COLORS[i % LINE_COLORS.length]} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={LINE_COLORS[i % LINE_COLORS.length]} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
                <XAxis dataKey="jour" tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                {responsableKeys.map((key, i) => (
                  <Area key={key} type="monotone" dataKey={key} stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeWidth={2} fillOpacity={1} fill={`url(#grad-${i})`} name={key} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Notifications CRM déclenchées */}
      {automatorCtx.triggeredNotifications.length > 0 && (
        <Card className="p-5 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-text">
              <Bell size={14} className="text-purple-500" />
              Notifications déclenchées
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-purple-500 text-white">
                {automatorCtx.unreadCount > 0 ? automatorCtx.unreadCount : automatorCtx.triggeredNotifications.length}
              </span>
            </h3>
            {automatorCtx.unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={automatorCtx.markAllAsRead}>
                Tout marquer lu
              </Button>
            )}
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {automatorCtx.triggeredNotifications.map(n => (
              <div key={n.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                  n.read ? 'border-border/30 bg-background/50' : n.channel === 'email' ? 'border-blue-200 bg-blue-50/30' : 'border-purple-200 bg-purple-50/30'
                } hover:border-accent/30 hover:bg-accent/5`}
                onClick={() => {
                  automatorCtx.markAsRead(n.id)
                  if (n.channel === 'email' && n.emailHtml) {
                    setPreviewChannel('email')
                    setEmailPreviewHtml(n.emailHtml)
                    setEmailPreviewTitle(n.title)
                  } else if (n.channel === 'crm' && n.crmHtml) {
                    setPreviewChannel('crm')
                    setEmailPreviewHtml(n.crmHtml)
                    setEmailPreviewTitle(n.title)
                  }
                }}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  n.read ? 'bg-gray-100' : n.channel === 'email' ? 'bg-blue-100' : 'bg-purple-100'
                }`}>
                  {n.channel === 'email'
                    ? <Mail size={14} className={n.read ? 'text-gray-400' : 'text-blue-600'} />
                    : <Bell size={14} className={n.read ? 'text-gray-400' : 'text-purple-600'} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-text">{n.title}</span>
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium ${
                      n.channel === 'email' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {n.channel === 'email' ? <Mail size={8} /> : <Smartphone size={8} />}
                      {n.channel === 'email' ? 'Email' : 'CRM'}
                    </span>
                    {n.clientNom && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-indigo-50 text-indigo-700">
                        {n.clientNom}
                      </span>
                    )}
                    {n.clientType && n.clientType !== 'admin' && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-gray-100 text-gray-600">
                        {n.clientType}
                      </span>
                    )}
                    {n.eventId === 'admin_nouvelle_propriete_ajoutee' && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        Propriété
                      </span>
                    )}
                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />}
                  </div>
                  {n.channel === 'crm' && n.eventId === 'admin_nouvelle_propriete_ajoutee' ? (
                    <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">{n.message}</p>
                  ) : n.channel === 'crm' ? (
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-text-secondary">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                      {n.clientNom} &middot; {n.clientType} &middot; {n.bienTitre}
                    </div>
                  ) : (
                    <p className="text-[11px] text-text-secondary mt-0.5 line-clamp-2 whitespace-pre-line">{n.message}</p>
                  )}
                  <span className="text-[10px] text-text-tertiary mt-1 block">
                    {new Date(n.dateTriggered).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    {n.channel === 'email' && n.emailHtml ? ` · Cliquer pour voir l'email` : n.channel === 'crm' && n.crmHtml ? ` · Cliquer pour voir` : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Message preview modal */}
      {emailPreviewHtml && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => { setEmailPreviewHtml(null); setPreviewChannel('email') }}>
          <div className="bg-card rounded-2xl border border-border/50 shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-border/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {previewChannel === 'email'
                  ? <Mail size={16} className="text-blue-500" />
                  : <Bell size={16} className="text-purple-500" />
                }
                <div>
                  <p className="text-xs font-semibold text-text-secondary/50 uppercase tracking-wider">Aperçu {previewChannel === 'email' ? "de l'email" : 'CRM'}</p>
                  <p className="text-sm font-medium text-text mt-0.5">{emailPreviewTitle}</p>
                </div>
              </div>
              <button onClick={() => { setEmailPreviewHtml(null); setPreviewChannel('email') }} className="p-1.5 rounded-lg hover:bg-background text-text-secondary hover:text-text transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="rounded-lg border border-border/30 overflow-hidden bg-white">
                <iframe
                  srcDoc={emailPreviewHtml}
                  className="w-full border-0"
                  style={{ minHeight: '500px' }}
                  title="Aperçu du message"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <Card className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="relative col-span-1 lg:col-span-2">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary/60" />
            <input type="text" placeholder="Référence, modèle ou créateur..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1) }}
              className="w-full h-8 pl-8 pr-8 text-xs rounded-lg border border-border bg-background text-text placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
            {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary/60"><X size={12} /></button>}
          </div>
          <Select value={filterStatut} onChange={(val) => { setFilterStatut(val); setPage(1) }} options={statutOptions} className="h-8 w-full" />
          <Select value={filterAgent} onChange={(val) => { setFilterAgent(val); setPage(1) }} options={agentOptions} className="h-8 w-full" />
          <Select value={filterDestinataire} onChange={(val) => { setFilterDestinataire(val); setPage(1) }}
            options={[
              { value: 'all', label: 'Tous destinataires' },
              { value: 'admin', label: 'Admin' },
              { value: 'agent', label: 'Agent' },
              { value: 'client', label: 'Client' },
              { value: 'both', label: 'Agent + Client' },
            ]} className="h-8 w-full" />
          <Select value={filterTypeClient} onChange={(val) => { setFilterTypeClient(val); setPage(1) }}
            options={[
              { value: 'all', label: 'Tous types' },
              ...Array.from(REAL_CLIENT_TYPES).map(ct => {
                const cfg = CLIENT_TYPE_CONFIG.find(c => c.key === ct)
                return { value: ct, label: cfg?.label || ct }
              }),
            ]} className="h-8 w-full" />
        </div>
        <div className="flex justify-end mt-3">
          <Button variant="ghost" size="sm" onClick={() => {
            setSearchTerm(''); setFilterStatut('all'); setFilterAgent('all'); setFilterDestinataire('all'); setFilterTypeClient('all'); setPage(1)
          }}>
            Réinitialiser
          </Button>
        </div>
      </Card>

      {/* Quick actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={startWizard} icon={<Plus size={14} />}>Nouvel automator</Button>
        <Button variant="outline" icon={<Download size={14} />} onClick={() => {
          const blob = new Blob([generateRapportHtml()], { type: 'text/html' })
          window.open(URL.createObjectURL(blob), '_blank')
        }}>Exporter rapport</Button>
        <Button variant="outline" icon={<BarChart2 size={14} />} onClick={() => setShowAllLogs(true)}>Voir tous les logs</Button>
      </div>

      {/* Automations Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium flex items-center gap-2">
            <Zap size={14} className="text-accent" />
            Automations
            <span className="text-xs font-normal text-text-secondary">({filtered.length})</span>
          </p>
          <div className="flex items-center gap-3 text-xs text-text-secondary">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />{automatorCtx.automators.filter(a => a.actif).length} actifs</span>
            <span className="w-px h-3 bg-border/50" />
            <span>{automatorCtx.automators.length} total</span>
          </div>
        </div>
        {paginated.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center">
                <Zap size={20} className="text-text-secondary/40" />
              </div>
              <p className="text-sm text-text-secondary">Aucun resultat</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginated.map((a, i) => {
              const ev = a.eventId ? getEventById(a.eventId) : undefined
              const evCat = ev?.clientType === 'contacts' ? 'contacts' : 'contrats'
              const CatIcon = CATEGORIE_ICONS[evCat] || Zap
              const ctConfig = CLIENT_TYPE_CONFIG.find(c => c.key === (ev?.clientType || 'tous'))
              const CtIcon = ev ? CLIENT_TYPE_ICONS[ev.clientType] : null
              const dernierLog = automatorCtx.logs.filter(l => l.automatorId === a.id).sort((x, y) => new Date(y.executeLe).getTime() - new Date(x.executeLe).getTime())[0]
              const execResultOk = dernierLog?.statut === 'succes'
              const execResultFail = dernierLog?.statut === 'echec'
              const activeNotifs = a.notifications.filter(n => n.actif)
              const recipientType: RecipientType = a.notifications.some(n => n.destinataires.includes('agent'))
                ? a.notifications.some(n => n.destinataires.includes('contact'))
                  ? 'both'
                  : 'agent'
                : 'client'
              const isAdminAuto = a.createdBy === 'system' || a.createdBy === 'Admin'
              return (
                <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className={`group relative bg-card rounded-xl border border-border/50 overflow-hidden hover:shadow-lg hover:border-border transition-all duration-300 ${a.actif ? 'border-l-[3px] border-l-emerald-500' : 'border-l-[3px] border-l-text-secondary/20'}`}>
                  {/* Card header */}
                  <div className="px-4 pt-4 pb-3">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${a.actif ? 'bg-accent/10' : 'bg-background'}`}>
                          <CatIcon size={16} className={a.actif ? 'text-accent' : 'text-text-secondary/50'} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-text truncate">{getAutomatorEventName(a)}</p>
                          <p className="text-[10px] text-text-secondary/50 font-mono">#{a.id}</p>
                        </div>
                      </div>
                      <button onClick={() => setShowActionMenu(showActionMenu === a.id ? null : a.id)}
                        className="p-1 rounded-lg hover:bg-background text-text-secondary hover:text-text transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0">
                        <MoreVertical size={14} />
                      </button>
                    </div>
                    {/* Event description */}
                    <p className="text-xs text-text-secondary mb-3 leading-relaxed">{getAutomatorEventName(a)}</p>
                    {/* Badges row */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Category/Client type badge */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-md bg-background border border-border/50">
                        {CtIcon && <CtIcon size={9} className={`${ctConfig?.color || 'text-text-secondary'}`} />}
                        {ctConfig?.label || '—'}
                      </span>
                      {/* Recipient badge */}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-md ${
                        isAdminAuto ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        recipientType === 'agent' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        recipientType === 'client' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}>
                        {isAdminAuto ? 'Admin' : recipientType === 'agent' ? 'Agent' : recipientType === 'client' ? 'Client' : 'Agent + Client'}
                      </span>
                      {a.delegationType && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                          <UserCheck size={9} />
                          Délégué{a.delegationType === 'all' ? ' à tous' : a.delegatedTo ? ` à ${a.delegatedTo}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Channel badges */}
                  <div className="px-4 pb-3">
                    <div className="flex items-center gap-1.5">
                      {activeNotifs.length > 0 ? activeNotifs.map((n, ni) => {
                        const DotIcon = CANAL_ICONES[n.canal].icon
                        const canalLabel = n.canal === 'email' ? 'Email'
                          : n.canal === 'application_mobile' && n.destinataires.some(d => d === 'agent') ? 'CRM Square Immo'
                          : n.canal === 'application_mobile' ? 'Squaremeter web app'
                          : n.canal === 'sms' ? 'SMS'
                          : 'CRM Square Immo'
                        return (
                          <span key={ni} className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-md bg-background border border-border/50 text-text-secondary">
                            <DotIcon size={9} />
                            {canalLabel}
                          </span>
                        )
                      }) : (
                        <span className="text-[10px] text-text-secondary/40">Aucun canal actif</span>
                      )}
                    </div>
                  </div>
                  {/* Divider */}
                  <div className="h-px bg-border/30 mx-4" />
                  {/* Footer: status + execution + actions */}
                  <div className="px-4 py-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Status */}
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${a.actif ? 'bg-emerald-500 animate-pulse' : 'bg-text-secondary/30'}`} />
                        <span className={`text-[11px] font-medium ${a.actif ? 'text-emerald-600' : 'text-text-secondary/50'}`}>
                          {a.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                      <span className="w-px h-3 bg-border/30" />
                      {/* Frequency */}
                      <span className="text-[10px] text-text-secondary">{a.frequence}</span>
                    </div>
                    {/* Last execution */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {dernierLog ? (
                        <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${execResultOk ? 'text-emerald-600' : execResultFail ? 'text-red-500' : 'text-amber-600'}`}>
                          {execResultOk ? <CheckCircle size={10} /> : execResultFail ? <XCircle size={10} /> : <Clock size={10} />}
                          {LOG_STATUT_LABELS[dernierLog.statut]}
                        </span>
                      ) : (
                        <span className="text-[10px] text-text-secondary/40">—</span>
                      )}
                    </div>
                  </div>
                  {/* Action buttons (visible on hover) */}
                  <div className="h-0 group-hover:h-auto overflow-hidden transition-all duration-300">
                    <div className="px-4 pb-3 flex items-center gap-1.5 border-t border-border/30 pt-2.5">
                      <button onClick={() => openEditWizard(a)} className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium rounded-lg border border-border/30 hover:border-accent/30 hover:bg-accent/5 transition-all text-text-secondary hover:text-text">
                        <Edit3 size={11} /> Modifier
                      </button>
                      <button onClick={() => setDetailTarget(a)} className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium rounded-lg border border-border/30 hover:border-accent/30 hover:bg-accent/5 transition-all text-text-secondary hover:text-text">
                        <Eye size={11} /> Detail
                      </button>
                      <button onClick={() => { setShowLogsFor(a); setLogDetail(null) }} className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium rounded-lg border border-border/30 hover:border-accent/30 hover:bg-accent/5 transition-all text-text-secondary hover:text-text">
                        <BarChart2 size={11} /> Logs
                      </button>
                      <div className="flex-1" />
                      <button onClick={() => setDeleteTarget(a.id)} className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium rounded-lg border border-red-200 hover:bg-red-50 transition-all text-red-500">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                  {/* Action menu modal */}
                  {showActionMenu === a.id && (
                    <>
                      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setShowActionMenu(null)} />
                      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                        <div className="pointer-events-auto w-full max-w-sm mx-4 bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                          <div className="px-5 py-4 border-b border-border/30 flex items-center justify-between">
                            <div>
                              <p className="text-xs font-semibold text-text-secondary/50 uppercase tracking-wider">Automation #{a.id}</p>
                              <p className="text-sm font-medium text-text mt-0.5">{getAutomatorEventName(a)}</p>
                            </div>
                            <button onClick={() => setShowActionMenu(null)} className="p-1.5 rounded-lg hover:bg-background text-text-secondary hover:text-text transition-colors">
                              <X size={16} />
                            </button>
                          </div>
                          <div className="p-4 space-y-3">
                            <div>
                              <p className="text-[10px] font-semibold text-text-secondary/40 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Edit3 size={11} /> Gestion</p>
                              <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => { setShowActionMenu(null); openEditWizard(a) }} className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border border-border/30 hover:border-accent/30 hover:bg-accent/5 transition-all text-text">
                                  <Activity size={16} className="text-text-secondary" />
                                  <span className="text-[11px] font-medium">Modifier</span>
                                </button>
                                <button onClick={() => { setShowActionMenu(null); setDetailTarget(a) }} className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border border-border/30 hover:border-accent/30 hover:bg-accent/5 transition-all text-text">
                                  <Eye size={16} className="text-text-secondary" />
                                  <span className="text-[11px] font-medium">Detail</span>
                                </button>
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold text-text-secondary/40 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Zap size={11} /> Execution</p>
                              <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => setShowActionMenu(null)} className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border border-border/30 hover:border-accent/30 hover:bg-accent/5 transition-all text-text">
                                  <ToggleLeft size={16} className="text-text-secondary" />
                                  <span className="text-[11px] font-medium">{a.actif ? 'Desact.' : 'Activer'}</span>
                                </button>
                                <button onClick={() => { setShowActionMenu(null); setShowLogsFor(a); setLogDetail(null) }} className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border border-border/30 hover:border-accent/30 hover:bg-accent/5 transition-all text-text">
                                  <BarChart2 size={16} className="text-text-secondary" />
                                  <span className="text-[11px] font-medium">Logs</span>
                                </button>
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold text-text-secondary/40 uppercase tracking-wider mb-2 flex items-center gap-1.5"><AlertTriangle size={11} /> Risques</p>
                              <button onClick={() => { setDeleteTarget(a.id); setShowActionMenu(null) }} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-red-200 hover:bg-red-50 transition-all text-red-500 text-xs font-medium">
                                <Trash2 size={14} />
                                Supprimer definitivement
                              </button>
                            </div>
                          </div>
                          <div className="px-5 py-3 bg-background/80 border-t border-border/30 flex items-center gap-4 text-[10px] text-text-secondary/60">
                            <span><span className="font-medium text-text-secondary/80">Destinataire :</span> {a.createdBy === 'system' ? `Admin spécifique (${adminName})` : a.createdBy && a.createdBy !== 'Admin' && a.createdBy !== 'system' && ALL_AGENTS.includes(a.createdBy) ? `Agent spécifique (${a.createdBy})` : a.niveau === 'utilisateur' ? 'Admin uniquement' : recipientType === 'agent' ? 'Agent' : recipientType === 'client' ? 'Client' : 'Agent + Client'}</span>
                            <span className="w-px h-3 bg-border/50" />
                            <span><span className="font-medium text-text-secondary/80">{REAL_CLIENT_TYPES.has(ev?.clientType || 'tous') ? 'Type' : 'Cate'} :</span> {ctConfig?.label || '—'}</span>
                            <span className="w-px h-3 bg-border/50" />
                            <span className="truncate"><span className="font-medium text-text-secondary/80">Evenement :</span> {getAutomatorEventName(a)}</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
        {/* Pagination + Summary */}
        <Card>
          <div className="px-5 py-3 flex items-center justify-between text-xs text-text-secondary">
            <div className="flex items-center gap-4">
              <span>{filtered.length} automation{filtered.length > 1 ? 's' : ''}</span>
              <span className="w-px h-3 bg-border/50" />
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />{filtered.filter(a => a.actif).length} actif{filtered.filter(a => a.actif).length > 1 ? 's' : ''}</span>
              <span className="w-px h-3 bg-border/50" />
              <span className="flex items-center gap-1"><BarChart2 size={11} />{totalExecs} executions</span>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${page === p ? 'bg-accent text-white shadow-sm' : 'text-text-secondary hover:bg-background border border-border/30 hover:border-accent/30'}`}>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Wizard modal */}
      <AnimatePresence>
        {showWizard && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-8 bg-black/40 backdrop-blur-sm overflow-y-auto"
            onClick={() => setShowWizard(false)}>
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }}
              onClick={e => e.stopPropagation()}
              className="bg-card rounded-xl border border-border/50 shadow-modal w-full max-w-3xl mx-4 my-4 max-h-[90vh] overflow-y-auto scrollbar-thin">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                <div className="flex items-center gap-3 text-sm">
                  <Shield size={15} className="text-accent mr-1" />
                  <span className="text-text font-semibold">NOUVEL AUTOMATOR - {currentUser?.role === 'gerant' ? 'GÉRANT' : 'ADMIN'}</span>
                  <span className="w-px h-4 bg-border/50" />
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${wizardStep >= 1 ? 'bg-accent text-white' : 'bg-background text-text-secondary'}`}>1</span>
                  <span className={wizardStep >= 1 ? 'text-text' : 'text-text-secondary'}>Niveau & Déclencheur</span>
                  <ChevronRight size={14} className="text-text-secondary/40" />
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${wizardStep >= 2 ? 'bg-accent text-white' : 'bg-background text-text-secondary'}`}>2</span>
                  <span className={wizardStep >= 2 ? 'text-text' : 'text-text-secondary'}>Notifications</span>
                  <ChevronRight size={14} className="text-text-secondary/40" />
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${wizardStep >= 3 ? 'bg-accent text-white' : 'bg-background text-text-secondary'}`}>3</span>
                  <span className={wizardStep >= 3 ? 'text-text' : 'text-text-secondary'}>Synthèse</span>
                </div>
                <button onClick={() => setShowWizard(false)} className="p-1.5 rounded-lg hover:bg-background text-text-secondary"><X size={16} /></button>
              </div>

              <div className="p-6">
                {/* ═══ STEP 1: Niveau, Destinataire, Déclencheur + Paramètres avancés ═══ */}
                {wizardStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-base font-semibold flex items-center gap-2 mb-1">
                        <Zap size={18} className="text-accent" />
                        Étape 1 : Niveau, destinataire et déclencheur
                      </h2>
                      <p className="text-xs text-text-secondary">Configurez le niveau, le destinataire et l'événement déclencheur</p>
                    </div>

                    {/* Niveau de l'automation (Admin only) */}
                    <div className="p-4 rounded-xl border border-border/50 bg-gradient-to-b from-amber-50/20 to-transparent">
                      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Shield size={13} /> Niveau de l'automation
                      </p>
                      <p className="text-xs text-text-secondary mb-3">Cette automation s'applique à :</p>
                      <div className="space-y-2">
                        {(['agence', 'agent_specifique', 'personnel'] as NiveauChoice[]).map(n => {
                          const isSelected = niveau === n
                          return (
                            <button key={n} onClick={() => { setNiveau(n); if (n === 'personnel') { setFilterClientType('admin' as ClientType); setRecipient('agent') } if (n === 'agent_specifique') { setRecipient('agent') } }}
                              className={`w-full text-left p-3 rounded-lg border transition-all flex items-center gap-3 ${
                                isSelected ? 'border-accent bg-accent/5 ring-1 ring-accent/30' : 'border-border/50 hover:border-accent/30'
                              }`}>
                              <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-accent' : 'border-text-secondary/30'}`}>
                                {isSelected && <span className="w-2 h-2 rounded-full bg-accent" />}
                              </span>
                              <span className="text-sm text-text">{niveauLabel(n)}</span>
                            </button>
                          )
                        })}
                      </div>
                      {niveau === 'agent_specifique' && (
                        <div className="mt-3">
                          <Select
                            value={selectedAgent}
                            onChange={setSelectedAgent}
                            options={[
                              { value: '', label: 'Sélectionner un agent...' },
                              ...ALL_AGENTS.map(a => ({ value: a, label: a })),
                            ]}
                            className="h-8"
                            placeholder="Sélectionner un agent..."
                          />
                        </div>
                      )}
                    </div>

                    {/* Destinataire de la notification */}
                    {niveau !== 'personnel' && (
                    <div className="p-4 rounded-xl border border-border/50">
                      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Send size={13} /> Destinataire de la notification
                      </p>
                      <p className="text-xs text-text-secondary mb-3">Ce déclencheur doit envoyer une notification à :</p>
                      <div className="grid grid-cols-3 gap-3">
                        {(['agent', 'client', 'both'] as RecipientType[]).map(r => {
                          const Icon = recipientIcon(r)
                          const isSelected = recipient === r
                          const isDisabled = niveau === 'agent_specifique' && r !== 'agent'
                          return (
                            <button key={r} onClick={() => !isDisabled && handleRecipientChange(r)}
                              disabled={isDisabled}
                              className={`p-3 rounded-xl border text-left transition-all ${
                                isDisabled ? 'opacity-40 cursor-not-allowed border-border/30' :
                                isSelected ? 'border-accent bg-accent/5 ring-1 ring-accent/30' : 'border-border/50 hover:border-accent/30 hover:bg-accent/5'
                              }`}>
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                                isSelected ? 'bg-accent text-white' : 'bg-background text-text-secondary'
                              }`}>
                                <Icon size={16} />
                              </div>
                              <p className={`text-xs font-medium ${isSelected ? 'text-accent' : 'text-text'}`}>{recipientLabel(r, selectedEvent?.clientType === 'admin')}</p>
                              <p className="text-[10px] text-text-secondary/60 mt-0.5">
                                {r === 'agent' ? 'Notification interne' : r === 'client' ? 'Notification client' : 'Les deux'}
                              </p>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    )}

                    {/* Catégorie d'événement */}
                    <div>
                      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Sliders size={13} /> Catégorie d'événement
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {availableClientTypes.map(ct => {
                          const Icon = CLIENT_TYPE_ICONS[ct.key]
                          const isActive = filterClientType === ct.key
                          return (
                            <button key={ct.key} onClick={() => { setFilterClientType(ct.key); if (ct.key === 'admin') setNiveau('personnel') }}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                isActive ? 'bg-accent text-white shadow-sm' : 'bg-background border border-border/50 text-text-secondary hover:border-accent/30 hover:text-text'
                              }`}>
                              {Icon && <Icon size={13} />}
                              {ct.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Événements disponibles */}
                    <div>
                      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Activity size={13} /> Événements disponibles pour {CLIENT_TYPE_CONFIG.find(ct => ct.key === filterClientType)?.label || filterClientType}
                        <span className="text-text-secondary/40 font-normal normal-case">({filteredEvents.length})</span>
                      </p>
                          <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin pr-1 events-scroll-container">
                            {filteredEvents.map(evt => {
                          const RecipIcon = recipientIcon(evt.defaultRecipient)
                          const isSelected = selectedEvent?.id === evt.id
                          return (
                            <button key={evt.id} data-event-id={evt.id} onClick={() => selectEvent(evt)}
                              className={`w-full text-left p-3 rounded-xl border transition-all ${
                                isSelected ? 'border-accent bg-accent/5 ring-1 ring-accent/30' : 'border-border/50 hover:border-accent/30 hover:bg-accent/5'
                              }`}>
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <p className={`text-sm font-medium flex items-center gap-1.5 ${isSelected ? 'text-accent' : 'text-text'}`}>
                                    <Activity size={13} className={isSelected ? 'text-accent' : 'text-text-secondary'} />
                                    {evt.label}
                                  </p>
                                  <p className="text-xs text-text-secondary mt-0.5">{evt.description}</p>
                                  <p className="text-[10px] text-text-secondary/40 mt-1">
                                    Destinataire suggéré : {evt.clientType === 'admin' ? 'Admin (Système)' : recipientLabel(evt.defaultRecipient)}
                                  </p>
                                </div>
                                <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full border ${
                                  evt.clientType === 'admin' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                                  evt.defaultRecipient === 'agent' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                  evt.defaultRecipient === 'client' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  'bg-purple-50 text-purple-700 border-purple-200'
                                }`}>
                                  {evt.clientType === 'admin' ? <Shield size={10} /> : <RecipIcon size={10} />}
                                  {evt.clientType === 'admin' ? 'Admin (Système)' : recipientLabel(evt.defaultRecipient)}
                                </span>
                              </div>
                            </button>
                          )
                        })}
                        {filteredEvents.length === 0 && (
                          <div className="py-8 text-center text-text-secondary/60 text-xs">
                            Aucun événement disponible pour cette combinaison
                          </div>
                        )}
                      </div>
                    </div>



                    <div className="flex justify-between pt-3 border-t border-border/30">
                      <Button variant="ghost" onClick={() => setShowWizard(false)}>Annuler</Button>
                      <Button onClick={() => { if (selectedEvent) setWizardStep(2) }}
                        disabled={!selectedEvent}>
                        Suivant <ChevronRight size={14} />
                      </Button>
                    </div>
                  </div>
                )}

                {/* ═══ STEP 2: Configuration des notifications ═══ */}
                {wizardStep === 2 && selectedEvent && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-base font-semibold flex items-center gap-2 mb-1">
                        <Bell size={18} className="text-accent" />
                        Étape 2 : Configurez les notifications
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary bg-background rounded-lg px-3 py-2 border border-border/50">
                        <span className="font-medium text-text">{selectedEvent.label}</span>
                        <span className="w-px h-3 bg-border/50" />
                        <span className="inline-flex items-center gap-1">{CLIENT_TYPE_CONFIG.find(ct => ct.key === selectedEvent.clientType)?.label}</span>
                        <span className="w-px h-3 bg-border/50" />
                        <span>Niveau : {niveauLabel(niveau)}</span>
                        <span className="w-px h-3 bg-border/50" />
                        <span className="inline-flex items-center gap-1">
                          {(() => { const Icon = recipientIcon(recipient); return <Icon size={12} /> })()}
                          {recipientLabel(recipient, selectedEvent?.clientType === 'admin')}
                        </span>
                      </div>
                    </div>

                    {/* Notification pour l'agent */}
                    {(recipient === 'agent' || recipient === 'both') && (
                      <div className="p-5 rounded-xl border border-border/50 bg-gradient-to-b from-blue-50/30 to-transparent">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                            <User size={14} className="text-blue-700" />
                          </div>
                          <p className="text-sm font-semibold text-text">
                            Notification pour {(() => {
                              if (selectedEvent?.clientType === 'admin') return `l'admin`;
                              if (niveau === 'agence') return `tous les agents de l'agence`;
                              if (niveau === 'agent_specifique') return selectedAgent || `l'agent sélectionné`;
                              return `l'agent`;
                            })()}
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 text-xs font-medium"><Bell size={13} className="text-blue-600" /> Canaux :</label>
                            {[
                              { key: 'agentEmail', label: 'Email', icon: Mail, state: agentEmail, setter: setAgentEmail },
                              { key: 'agentCrm', label: 'CRM Square Immo', icon: Smartphone, state: agentSms, setter: setAgentSms },
                            ].map(ch => (
                              <button key={ch.key} onClick={() => ch.setter(!ch.state)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all ${
                                  ch.state ? 'bg-accent text-white shadow-sm' : 'bg-background border border-border/50 text-text-secondary'
                                }`}>
                                <ch.icon size={12} />
                                {ch.label}
                              </button>
                            ))}
                          </div>

                          <div>
                            <p className="text-[11px] text-text-secondary mb-1">Message :</p>
                            <div className="p-3 rounded-lg bg-background border border-border/50 text-xs text-text font-mono leading-relaxed whitespace-pre-line">
                              {selectedEvent.agentTemplate.emailMessage}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Notification pour le client */}
                    {(recipient === 'client' || recipient === 'both') && (
                      <div className="p-5 rounded-xl border border-border/50 bg-gradient-to-b from-emerald-50/30 to-transparent">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <Users size={14} className="text-emerald-700" />
                          </div>
                          <p className="text-sm font-semibold text-text">Notification pour le client</p>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 text-xs font-medium"><Bell size={13} className="text-emerald-600" /> Canaux :</label>
                            {[
                              { key: 'clientEmail', label: 'Email', icon: Mail, state: clientEmail, setter: setClientEmail },
                              { key: 'clientWebapp', label: 'Squaremeter web app', icon: Eye, state: clientSms, setter: setClientSms },
                            ].map(ch => (
                              <button key={ch.key} onClick={() => ch.setter(!ch.state)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all ${
                                  ch.state ? 'bg-accent text-white shadow-sm' : 'bg-background border border-border/50 text-text-secondary'
                                }`}>
                                <ch.icon size={12} />
                                {ch.label}
                              </button>
                            ))}
                          </div>

                          <div>
                            <p className="text-[11px] text-text-secondary mb-1">Message :</p>
                            <div className="p-3 rounded-lg bg-background border border-border/50 text-xs text-text font-mono leading-relaxed whitespace-pre-line">
                              {selectedEvent.clientTemplate?.emailMessage || selectedEvent.agentTemplate.emailMessage}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between pt-3 border-t border-border/30">
                      <Button variant="ghost" onClick={() => setWizardStep(1)} icon={<ChevronLeft size={14} />}>Précédent</Button>
                      <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => setShowWizard(false)}>Annuler</Button>
                        <Button onClick={() => setWizardStep(3)}>Suivant <ChevronRight size={14} /></Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ═══ STEP 3: Récapitulatif ═══ */}
                {wizardStep === 3 && selectedEvent && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-base font-semibold flex items-center gap-2 mb-1">
                        <BookOpen size={18} className="text-accent" />
                        Étape 3 : Récapitulatif
                      </h2>
                      <p className="text-xs text-text-secondary">Vérifiez les paramètres avant d'ajouter l'automation</p>
                    </div>

                    <div className="p-5 rounded-xl bg-background border border-border/50 space-y-4">
                      <p className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
                        <Sliders size={13} /> Synthèse
                      </p>

                      <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                        <div className="p-3 rounded-lg bg-card border border-border/30">
                          <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">Événement</p>
                          <p className="text-xs font-medium text-text flex items-center gap-1.5">
                            <Activity size={12} className="text-accent" />
                            {selectedEvent.label}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-card border border-border/30">
                          <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">Client type</p>
                          <p className="text-xs font-medium text-text flex items-center gap-1.5">
                            {(() => { const Icon = CLIENT_TYPE_ICONS[selectedEvent.clientType]; return Icon ? <Icon size={12} className={CLIENT_TYPE_COLORS[selectedEvent.clientType]} /> : null })()}
                            {CLIENT_TYPE_CONFIG.find(ct => ct.key === selectedEvent.clientType)?.label}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-card border border-border/30">
                          <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">Niveau</p>
                          <p className="text-xs font-medium text-text">{niveauLabel(niveau)}</p>
                          {niveau === 'agent_specifique' && selectedAgent && (
                            <p className="text-[10px] text-text-secondary mt-0.5">{selectedAgent}</p>
                          )}
                        </div>
                        <div className="p-3 rounded-lg bg-card border border-border/30">
                          <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">Destinataire</p>
                          <p className="text-xs font-medium text-text flex items-center gap-1.5">
                            {(() => { const Icon = recipientIcon(recipient); return <Icon size={12} className="text-accent" /> })()}
                            {recipientLabel(recipient, selectedEvent?.clientType === 'admin')}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-card border border-border/30">
                          <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">Priorité</p>
                          <p className="text-xs font-medium text-text capitalize">{priority}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-card border border-border/30">
                          <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">Période</p>
                          <p className="text-xs font-medium text-text capitalize">{periode === 'toujours' ? 'Toujours' : 'Plage horaire'}</p>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-card border border-border/30">
                        <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-2">Notifications activées :</p>
                        <div className="flex flex-wrap gap-2">
                          {(recipient === 'agent' || recipient === 'both') && [
                            { label: 'Email agent', state: agentEmail },
                            { label: 'CRM Square Immo', state: agentSms },
                          ].map(ch => (
                            <span key={ch.label} className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded border ${
                              ch.state ? 'bg-accent/10 text-accent border-accent/20' : 'bg-text-secondary/5 text-text-secondary/40 border-border'
                            }`}>
                              {ch.state ? <Check size={9} /> : <X size={9} />} {ch.label}
                            </span>
                          ))}
                          {(recipient === 'client' || recipient === 'both') && [
                            { label: 'Email client', state: clientEmail },
                            { label: 'Squaremeter web app', state: clientSms },
                          ].map(ch => (
                            <span key={ch.label} className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded border ${
                              ch.state ? 'bg-accent/10 text-accent border-accent/20' : 'bg-text-secondary/5 text-text-secondary/40 border-border'
                            }`}>
                              {ch.state ? <Check size={9} /> : <X size={9} />} {ch.label}
                            </span>
                          ))}
                        </div>
                      </div>

                      {langues.length > 0 && (
                        <div className="p-3 rounded-lg bg-card border border-border/30">
                          <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">Langues</p>
                          <div className="flex flex-wrap gap-1">
                            {langues.map(l => {
                              const langInfo = LANGUES_DISPO.find(ld => ld.key === l)
                              return (
                                <span key={l} className="px-2 py-0.5 text-[10px] rounded bg-accent/10 text-accent border border-accent/20">
                                  {langInfo?.label || l}
                                </span>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Aperçu de l'email pour le client */}
                    {recipient !== 'agent' && selectedEvent.clientTemplate && (
                      <div className="p-5 rounded-xl border border-accent/20 bg-accent/5 space-y-2">
                        <p className="text-xs font-semibold text-accent flex items-center gap-1.5">
                          <Mail size={12} /> Aperçu de l'email pour le client
                        </p>
                        <p className="text-[11px] text-text font-medium">
                          Objet : {selectedEvent.clientTemplate.emailObjet
                            .replace('{{client.prenom}}', 'Jean')
                            .replace('{{client.nom}}', 'Dupont')
                            .replace('{{prospect.nom}}', 'Jean Dupont')
                          }
                        </p>
                        <div className="text-xs text-text leading-relaxed whitespace-pre-line bg-card p-3 rounded-lg border border-border/50">
                          {selectedEvent.clientTemplate.emailMessage
                            .replace(/\{\{client\.prenom\}\}/g, 'Jean')
                            .replace(/\{\{client\.nom\}\}/g, 'Dupont')
                            .replace(/\{\{bien\.titre\}\}/g, 'Ma Villa Méditerranéenne')
                            .replace(/\{\{bien\.prix\}\}/g, '2 500 000')
                            .replace(/\{\{bien\.surface\}\}/g, '420')
                            .replace(/\{\{bien\.pieces\}\}/g, '6')
                            .replace(/\{\{bien\.chambres\}\}/g, '5')
                            .replace(/\{\{bien\.adresse\}\}/g, '12 Rue de la Liberté, Casablanca')
                            .replace(/\{\{score\}\}/g, '92')
                            .replace(/\{\{lien_client\}\}/g, 'https://espace.squaremeter.ma/bien/123')
                            .replace(/\{\{visite\.date\}\}/g, '15/06/2026')
                            .replace(/\{\{visite\.heure\}\}/g, '14h30')
                            .replace(/\{\{rdv\.date\}\}/g, '15/06/2026')
                            .replace(/\{\{rdv\.heure\}\}/g, '14h30')
                            .replace(/\{\{rdv\.adresse\}\}/g, '12 Rue de la Liberté, Casablanca')
                            .replace(/\{\{rdv\.sujet\}\}/g, 'Visite villa')
                            .replace(/\{\{prospect\.nom\}\}/g, 'Jean Dupont')
                            .replace(/\{\{prospect\.email\}\}/g, 'jean.dupont@email.com')
                            .replace(/\{\{prospect\.origine\}\}/g, 'Site web')
                            .replace(/\{\{offre\.montant\}\}/g, '2 400 000')
                            .replace(/\{\{bail\.date_entree\}\}/g, '01/08/2026')
                            .replace(/\{\{bail\.loyer\}\}/g, '12 000')
                            .replace(/\{\{extranet\.action_type\}\}/g, 'Document ajouté')
                            .replace(/\{\{client\.email\}\}/g, 'jean.dupont@email.com')
                            .replace(/\{\{lien_agent\}\}/g, 'https://espace.squaremeter.ma/agent/123')
                          }
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between pt-3 border-t border-border/30">
                      <Button variant="ghost" onClick={() => setWizardStep(2)} icon={<ChevronLeft size={14} />}>Précédent</Button>
                      <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => setShowWizard(false)}>Annuler</Button>
                        <Button onClick={() => {
                          if (!selectedEvent) return
                          const notifications: AddAutomatorInput['notifications'] = []
                          if (recipient === 'agent' || recipient === 'both') {
                            if (agentEmail) notifications.push({ canal: 'email', actif: true, langue: langues[0] || 'fr', messageTemplate: selectedEvent.agentTemplate.emailMessage, destinataires: ['agent'] })
                            if (agentSms) notifications.push({ canal: 'application_mobile', actif: true, langue: langues[0] || 'fr', messageTemplate: selectedEvent.agentTemplate.smsMessage, destinataires: ['agent'] })
                          }
                          if (recipient === 'client' || recipient === 'both') {
                            if (clientEmail && selectedEvent.clientTemplate) notifications.push({ canal: 'email', actif: true, langue: langues[0] || 'fr', messageTemplate: selectedEvent.clientTemplate.emailMessage, destinataires: ['contact'] })
                            if (clientSms && selectedEvent.clientTemplate) notifications.push({ canal: 'application_mobile', actif: true, langue: langues[0] || 'fr', messageTemplate: selectedEvent.clientTemplate.smsMessage, destinataires: ['contact'] })
                          }
                          const isAgentRecipient = recipient === 'agent' || recipient === 'both'
                          const delegationType = niveau === 'agent_specifique' ? 'specific' as const : niveau === 'agence' && isAgentRecipient ? 'all' as const : null
                          const input: AddAutomatorInput & { delegatedBy?: string; delegatedTo?: string; delegationType?: string } = {
                            modeleId: 0,
                            eventId: selectedEvent.id,
                            niveau: (niveau === 'personnel' ? 'utilisateur' : 'agence') as AutomatorNiveau,
                            niveauLabel: niveauLabel(niveau),
                            createdBy: selectedAgent || 'Admin',
                            delegatedBy: delegationType ? adminName : undefined,
                            delegatedTo: delegationType === 'specific' ? selectedAgent : delegationType === 'all' ? 'all' : undefined,
                            delegationType: delegationType || undefined,
                            actif: actifParDefaut,
                            frequence: sendFrequence === 'chaque' ? 'À chaque événement' : sendFrequence === 'quotidien' ? 'Quotidien' : 'Hebdomadaire',
                            notifications,
                          }
                          automatorCtx.addAutomator(input).then((created: Automator | undefined) => {
                            if (created && delegationType) {
                              const evLabel = selectedEvent?.label || 'Automation'
                              const msg = `Automation « ${evLabel} » assignée par ${adminName}`
                              const targets = delegationType === 'all'
                                ? ALL_AGENTS.filter(n => n !== 'system' && n !== 'Admin')
                                : [selectedAgent]
                              targets.forEach((agentName: string) => {
                                api.post('/notifications', {
                                  userId: agentName,
                                  senderName: adminName,
                                  type: 'automator_delegated',
                                  message: msg,
                                  propertyId: String(created.id),
                                  propertyRef: evLabel,
                                }).catch(() => {})
                              })
                            }
                          }).catch(() => {})
                          setShowWizard(false)
                          setWizardStep(1)
                          setSelectedEvent(null)
                        }}>AJOUTER L'AUTOMATOR</Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logs modal */}
      <AnimatePresence>
        {showLogsFor && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black/40 backdrop-blur-sm overflow-y-auto"
            onClick={() => { setShowLogsFor(null); setLogDetail(null) }}>
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }}
              onClick={e => e.stopPropagation()}
              className="bg-card rounded-xl border border-border/50 shadow-modal w-full max-w-4xl mx-4 my-4 max-h-[85vh] overflow-y-auto scrollbar-thin">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                <div>
                  <h2 className="text-base font-semibold flex items-center gap-2">
                    <BarChart2 size={16} className="text-accent" />
                    Logs d'execution &mdash; #{showLogsFor.id} ({getAutomatorEventName(showLogsFor)})
                  </h2>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    Cree par {showLogsFor.createdBy} &middot; {automatorCtx.logs.filter((l: any) => l.automatorId === showLogsFor.id).length} executions &middot; {tauxSucces}% succes
                  </p>
                </div>
                <button onClick={() => { setShowLogsFor(null); setLogDetail(null) }} className="p-1.5 rounded-lg hover:bg-background text-text-secondary"><X size={16} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => {
                      if (logDateFilter === 'mois') {
                        setLogDateFilter('all')
                        setLogDateDebut('')
                        setLogDateFin('')
                        setLogHeureDebut('')
                        setLogHeureFin('')
                      } else {
                        setLogDateFilter('mois')
                        const now = new Date()
                        const debut = new Date(now.getFullYear(), now.getMonth() - 1, 1)
                        const fin = new Date(now.getFullYear(), now.getMonth(), 0)
                        setLogDateDebut(debut.toISOString().slice(0, 10))
                        setLogDateFin(fin.toISOString().slice(0, 10))
                        setLogHeureDebut('00:00')
                        setLogHeureFin('23:59')
                      }
                    }}
                      className={`px-3 py-1 rounded-lg border text-xs font-medium transition-colors ${logDateFilter === 'mois' ? 'bg-accent/10 text-accent border-accent' : 'bg-background text-text-secondary border-border hover:border-accent/50'}`}>
                      Dernier mois
                    </button>
                    <div className="relative">
                      <button onClick={() => setLogStatutFilter(logStatutFilter === 'all' ? 'succes' : logStatutFilter === 'succes' ? 'echec' : 'all')}
                        className={`px-3 py-1 rounded-lg border text-xs font-medium transition-colors ${logStatutFilter !== 'all' ? 'bg-accent/10 text-accent border-accent' : 'bg-background text-text-secondary border-border hover:border-accent/50'}`}>
                        {logStatutFilter === 'all' ? 'Tous statuts' : logStatutFilter === 'succes' ? 'Succès' : 'Échec'}
                      </button>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" icon={<Download size={12} />} onClick={() => {
                    const logs = automatorCtx.logs.filter((l: any) => {
                      if (l.automatorId !== showLogsFor.id) return false
                      if (logStatutFilter !== 'all' && l.statut !== logStatutFilter) return false
                      const d = new Date(l.executeLe)
                      if (logDateFilter === 'mois') {
                        const moisPass = new Date()
                        moisPass.setMonth(moisPass.getMonth() - 1)
                        if (d < moisPass) return false
                      }
                      if (logDateDebut) {
                        const debut = new Date(logDateDebut + (logHeureDebut ? `T${logHeureDebut}` : 'T00:00:00'))
                        if (d < debut) return false
                      }
                      if (logDateFin) {
                        const fin = new Date(logDateFin + (logHeureFin ? `T${logHeureFin}` : 'T23:59:59'))
                        if (d > fin) return false
                      }
                      return true
                    })
                    const rows = logs.map(l => {
                      const badgeClass = l.statut === 'succes' ? 'succes' : l.statut === 'echec' ? 'echec' : 'attente'
                      const badgeLabel = l.statut === 'succes' ? 'Succès' : l.statut === 'echec' ? 'Échec' : 'En attente'
                      return `<tr>
                        <td style="padding:10px 14px;font-size:11px;color:#334155;border-bottom:1px solid #f1f5f9">${new Date(l.executeLe).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                        <td style="padding:10px 14px;font-size:11px;color:#334155;border-bottom:1px solid #f1f5f9">${l.evenement}</td>
                        <td style="padding:10px 14px;font-size:11px;color:#334155;border-bottom:1px solid #f1f5f9">${l.destinataire}</td>
                        <td style="padding:10px 14px;font-size:11px;color:#334155;border-bottom:1px solid #f1f5f9"><span class="badge ${badgeClass}">${badgeLabel}</span></td>
                      </tr>`
                    }).join('')
                    const succesCount = logs.filter((l: any) => l.statut === 'succes').length
                    const echecCount = logs.filter((l: any) => l.statut === 'echec').length
                    const attenteCount = logs.filter((l: any) => l.statut === 'en_attente' || (l.statut !== 'succes' && l.statut !== 'echec')).length
                    const nowPdf = new Date()
                    const dateStr = nowPdf.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
                    const timeStr = nowPdf.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                    const pdfHtmlSingle = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Logs - ${getAutomatorEventName(showLogsFor)}</title>
                        <script>window.onload=function(){setTimeout(function(){window.print()},400)}<\/script>
                        <style>
                          @page { margin:12mm 15mm }
                          body { font-family:'Segoe UI',Arial,sans-serif; color:#1a1a2e; margin:0; padding:0 }
                          .header-bar { background:linear-gradient(135deg,${colors.accent},${colors.accentHover}); padding:28px 35px; border-radius:0 0 16px 16px }
                          .header-bar h1 { color:#fff; font-size:22px; font-weight:600; margin:0 0 4px; letter-spacing:-0.3px }
                          .header-bar .meta { color:rgba(255,255,255,0.8); font-size:12px; margin:0 }
                          .content { padding:28px 35px }
                          .stats-row { display:flex; gap:14px; margin-bottom:24px }
                          .stat-card { flex:1; padding:14px 18px; border-radius:10px; text-align:center }
                          .stat-card.total { background:#f0f4ff; border:1px solid #dbeafe }
                          .stat-card.succes { background:#f0fdf4; border:1px solid #bbf7d0 }
                          .stat-card.echec { background:#fef2f2; border:1px solid #fecaca }
                          .stat-card .num { font-size:22px; font-weight:700; margin:0 }
                          .stat-card .lbl { font-size:10px; text-transform:uppercase; letter-spacing:0.5px; margin:2px 0 0 }
                          .stat-card.total .num { color:${colors.accent} }
                          .stat-card.total .lbl { color:${colors.accent} }
                          .stat-card.succes .num { color:#10B981 }
                          .stat-card.succes .lbl { color:#059669 }
                          .stat-card.echec .num { color:#EF4444 }
                          .stat-card.echec .lbl { color:#DC2626 }
                          table { width:100%; border-collapse:separate; border-spacing:0; border-radius:10px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,0.06) }
                          thead th { padding:11px 14px; background:#f8fafc; border-bottom:2px solid #e2e8f0; font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; color:#64748b; text-align:left }
                          tbody td { padding:10px 14px; font-size:11px; color:#334155; border-bottom:1px solid #f1f5f9 }
                          tbody tr:last-child td { border-bottom:none }
                          tbody tr:hover { background:#f8fafc }
                          .badge { display:inline-block; padding:2px 10px; border-radius:20px; font-size:10px; font-weight:500 }
                          .badge.succes { background:#dcfce7; color:#166534 }
                          .badge.echec { background:#fee2e2; color:#991b1b }
                          .badge.attente { background:#fef3c7; color:#92400e }
                          .footer { margin-top:30px; padding-top:14px; border-top:1px solid #e2e8f0; font-size:10px; color:#94a3b8; text-align:center }
                        </style></head><body>
                        <div class="header-bar">
                          <h1>Rapport d'exécution — ${getAutomatorEventName(showLogsFor)}</h1>
                          <p class="meta">Automator #${showLogsFor.id} · Créé par ${showLogsFor.createdBy} · ${logs.length} exécution(s)</p>
                        </div>
                        <div class="content">
                          <div class="stats-row">
                            <div class="stat-card total"><p class="num">${logs.length}</p><p class="lbl">Total</p></div>
                            <div class="stat-card succes"><p class="num">${succesCount}</p><p class="lbl">Succès</p></div>
                            <div class="stat-card echec"><p class="num">${echecCount}</p><p class="lbl">Échecs</p></div>
                          </div>
                          <table><thead><tr>
                            <th>Date</th><th>Événement</th><th>Destinataire</th><th>Statut</th>
                          </tr></thead><tbody>${rows}</tbody></table>
                          <div class="footer">Généré le ${dateStr} à ${timeStr}</div>
                        </div>
                      </body></html>`
                    const blob = new Blob([pdfHtmlSingle], { type: 'text/html' })
                    const url = URL.createObjectURL(blob)
                    window.open(url, '_blank')
                  }}>Exporter</Button>
                </div>
                <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-background border border-border/50">
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-text-secondary whitespace-nowrap">Du</label>
                    <DatePicker value={logDateDebut} onChange={e => setLogDateDebut(e.target.value)} className="h-7 text-xs" />
                    <TimePicker value={logHeureDebut} onChange={e => setLogHeureDebut(e.target.value)} className="h-7 text-xs" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-text-secondary whitespace-nowrap">Au</label>
                    <DatePicker value={logDateFin} onChange={e => setLogDateFin(e.target.value)} className="h-7 text-xs" />
                    <TimePicker value={logHeureFin} onChange={e => setLogHeureFin(e.target.value)} className="h-7 text-xs" />
                  </div>
                  {(logDateDebut || logDateFin || logHeureDebut || logHeureFin) && (
                    <button onClick={() => { setLogDateDebut(''); setLogDateFin(''); setLogHeureDebut(''); setLogHeureFin('') }}
                      className="text-[10px] text-text-secondary hover:text-text underline">Effacer</button>
                  )}
                </div>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-background border-b border-border text-[11px]">
                        <th className="text-left px-3 py-2 font-medium text-text-secondary">Date</th>
                        <th className="text-left px-3 py-2 font-medium text-text-secondary">Evenement</th>
                <th className="text-left px-3 py-2 font-medium text-text-secondary">Destinataire</th>
                        <th className="text-left px-3 py-2 font-medium text-text-secondary">Statut</th>
                        <th className="text-right px-3 py-2 font-medium text-text-secondary">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {automatorCtx.logs.filter((l: any) => {
                        if (l.automatorId !== showLogsFor.id) return false
                        if (logStatutFilter !== 'all' && l.statut !== logStatutFilter) return false
                        const d = new Date(l.executeLe)
                        if (logDateFilter === 'mois') {
                          const moisPass = new Date()
                          moisPass.setMonth(moisPass.getMonth() - 1)
                          if (d < moisPass) return false
                        }
                        if (logDateDebut) {
                          const debut = new Date(logDateDebut + (logHeureDebut ? `T${logHeureDebut}` : 'T00:00:00'))
                          if (d < debut) return false
                        }
                        if (logDateFin) {
                          const fin = new Date(logDateFin + (logHeureFin ? `T${logHeureFin}` : 'T23:59:59'))
                          if (d > fin) return false
                        }
                        return true
                      }).map(log => (
                        <tr key={log.id} className="hover:bg-background/50 transition-colors">
                          <td className="px-3 py-2 text-xs text-text">
                            {new Date(log.executeLe).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td className="px-3 py-2 text-xs text-text">{log.evenement}</td>
                          <td className="px-3 py-2 text-xs text-text-secondary">{log.destinataire}</td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex items-center gap-1 text-xs ${log.statut === 'succes' ? 'text-emerald-600' : log.statut === 'echec' ? 'text-red-600' : 'text-amber-600'}`}>
                              {log.statut === 'succes' ? <CheckCircle size={12} /> : log.statut === 'echec' ? <XCircle size={12} /> : <Clock size={12} />}
                              {LOG_STATUT_LABELS[log.statut]}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button onClick={() => setLogDetail(logDetail?.id === log.id ? null : log)}
                              className="px-2 py-1 text-[10px] rounded bg-background border border-border text-text-secondary hover:text-text transition-colors">
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {logDetail && (
                  <div className="p-4 rounded-xl bg-background border border-border/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-text-secondary">Detail de l'execution</p>
                      <button onClick={() => setLogDetail(null)} className="text-text-secondary/60 hover:text-text"><X size={12} /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                      <div><span className="text-text-secondary">Date :</span> <span className="text-text">{new Date(logDetail.executeLe).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span></div>
                      <div><span className="text-text-secondary">Automator :</span> <span className="text-text">#{showLogsFor.id} &mdash; {getAutomatorEventName(showLogsFor)}</span></div>
                      <div><span className="text-text-secondary">Cree par :</span> <span className="text-text">{showLogsFor.createdBy}</span></div>
                      <div><span className="text-text-secondary">Destinataire :</span> <span className="text-text">{logDetail.destinataire}</span></div>
                      <div className="col-span-2"><span className="text-text-secondary">Evenement :</span> <span className="text-text">{logDetail.evenement}</span></div>
                    </div>
                    <div className="pt-2 border-t border-border/30">
                      <p className="text-[11px] text-text-secondary mb-1">Notifications envoyees :</p>
                      <div className="text-xs text-text font-mono whitespace-pre-line bg-card p-2.5 rounded-lg border border-border leading-relaxed">
                        {logDetail.contenu || '\u2014'}
                      </div>
                    </div>
                    {logDetail.messageErreur && (
                      <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                        <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                        <span>Erreur : {logDetail.messageErreur}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail modal */}
      <AnimatePresence>
        {detailTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-12 bg-black/40 backdrop-blur-sm overflow-y-auto"
            onClick={() => { setDetailTarget(null) }}>
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }}
              onClick={e => e.stopPropagation()}
              className="bg-card rounded-xl border border-border/50 shadow-modal w-full max-w-2xl mx-4 my-4 max-h-[85vh] overflow-y-auto scrollbar-thin">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Eye size={16} className="text-accent" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold">Detail de l'automator &mdash; #{detailTarget.id}</h2>
                    <p className="text-xs text-text-secondary">
                      {getAutomatorEventName(detailTarget)}
                      {(() => { const ev = detailTarget.eventId ? getEventById(detailTarget.eventId) : undefined; return ev ? ` (${CLIENT_TYPE_CONFIG.find((c: any) => c.key === ev.clientType)?.label || ev.clientType})` : '' })()}
                    </p>
                  </div>
                </div>
                <button onClick={() => setDetailTarget(null)} className="p-1.5 rounded-lg hover:bg-background text-text-secondary"><X size={16} /></button>
              </div>
              <div className="p-6 space-y-6">
                {/* Informations Generales */}
                <div className="rounded-xl border border-border/50 overflow-hidden">
                  <div className="px-5 py-3 bg-background border-b border-border/50 flex items-center gap-2">
                    <FileText size={14} className="text-text-secondary" />
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Informations generales</p>
                  </div>
                  <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                    <div>
                      <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-0.5">Reference</p>
                      <p className="font-mono font-semibold">#{detailTarget.id}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-0.5">Statut</p>
                      <div className="flex items-center gap-2">
                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${detailTarget.actif ? 'bg-emerald-500' : 'bg-text-secondary/30'}`} />
                        <span className={`font-medium ${detailTarget.actif ? 'text-emerald-600' : 'text-text-secondary'}`}>
                          {detailTarget.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-0.5">Modele</p>
                      <p className="font-medium">{getAutomatorEventName(detailTarget)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-0.5">{(() => { const ev = detailTarget.eventId ? getEventById(detailTarget.eventId) : undefined; return (ev && REAL_CLIENT_TYPES.has(ev.clientType)) ? 'Type de client' : 'Catégorie' })()}</p>
                      <p className="font-medium">{(() => { const ev = detailTarget.eventId ? getEventById(detailTarget.eventId) : undefined; const cfg = ev ? CLIENT_TYPE_CONFIG.find(c => c.key === ev.clientType) : undefined; return cfg?.label || '—' })()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-0.5">Destinataire</p>
                      <p className="font-medium">{(() => { const r: RecipientType = detailTarget.notifications.some((n: any) => n.destinataires.includes('agent')) ? detailTarget.notifications.some((n: any) => n.destinataires.includes('contact')) ? 'both' : 'agent' : 'client'; const ev = detailTarget.eventId ? getEventById(detailTarget.eventId) : undefined; const isAdmin = detailTarget.createdBy === 'system' || detailTarget.createdBy === 'Admin'; return r === 'agent' ? (isAdmin ? 'Admin uniquement' : 'Agent uniquement') : r === 'client' ? 'Client uniquement' : r === 'both' ? 'Agent + Client' : '—' })()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-0.5">Frequence</p>
                      <p className="font-medium">{detailTarget.frequence}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-0.5">Cree par</p>
                      <p className="font-medium">{detailTarget.createdBy === 'system' || detailTarget.createdBy === 'Admin' ? `Admin (${adminName})` : detailTarget.createdBy}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-0.5">Derniere execution</p>
                      <p className="font-medium">{detailTarget.derniereExecution ? new Date(detailTarget.derniereExecution).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '\u2014'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-0.5">Cree le</p>
                      <p className="font-medium">{new Date(detailTarget.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-0.5">Niveau</p>
                      <p className="font-medium">{detailTarget.createdBy === 'system' ? `Admin uniquement (${adminName})` : detailTarget.niveauLabel}</p>
                    </div>
                  </div>
                </div>

                {/* Notifications */}
                <div className="rounded-xl border border-border/50 overflow-hidden">
                  <div className="px-5 py-3 bg-background border-b border-border/50 flex items-center gap-2">
                    <Bell size={14} className="text-text-secondary" />
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Notifications</p>
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <p className="text-xs font-medium text-text mb-2 flex items-center gap-1.5">
                        <User size={12} className="text-blue-600" />
                        Agent
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        {(['email', 'sms', 'application_mobile'] as NotificationCanal[]).map(canal => {
                          const info = CANAL_ICONES[canal]
                          const Icon = info.icon
                          const notif = detailTarget.notifications.find((n: any) => n.canal === canal && n.destinataires.includes('agent'))
                          const isActive = notif?.actif ?? false
                          return (
                            <div key={canal} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${
                              isActive ? 'bg-accent/5 border-accent/20' : 'bg-background border-border/30 text-text-secondary/50'
                            }`}>
                              <Icon size={13} className={isActive ? 'text-accent' : 'text-text-secondary/40'} />
                              <span className={isActive ? 'text-text' : ''}>{info.label}</span>
                              <span className="ml-auto">
                                {isActive ? <Check size={11} className="text-emerald-500" /> : <X size={11} className="text-text-secondary/30" />}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    {(() => {
                      const r: RecipientType = detailTarget.notifications.some((n: any) => n.destinataires.includes('agent')) ? detailTarget.notifications.some((n: any) => n.destinataires.includes('contact')) ? 'both' : 'agent' : 'client'
                      const clientType = (() => { const ev = detailTarget.eventId ? getEventById(detailTarget.eventId) : undefined; return ev?.clientType || '' })()
                      const cfg = clientType ? CLIENT_TYPE_CONFIG.find((c: any) => c.key === clientType) : undefined
                      return (r === 'client' || r === 'both') && (
                        <div>
                          <p className="text-xs font-medium text-text mb-2 flex items-center gap-1.5">
                            <Users size={12} className="text-emerald-600" />
                            Client{clientType ? ` (${REAL_CLIENT_TYPES.has(clientType) ? cfg?.label : 'Catégorie : ' + (cfg?.label || clientType)})` : ''}
                          </p>
                          <div className="grid grid-cols-3 gap-3">
                            {(['email', 'sms', 'application_mobile'] as NotificationCanal[]).map(canal => {
                              const info = CANAL_ICONES[canal]
                              const Icon = info.icon
                              const notif = detailTarget.notifications.find((n: any) => n.canal === canal && n.destinataires.includes('contact'))
                              const isActive = notif?.actif ?? false
                              return (
                                <div key={canal} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${
                                  isActive ? 'bg-accent/5 border-accent/20' : 'bg-background border-border/30 text-text-secondary/50'
                                }`}>
                                  <Icon size={13} className={isActive ? 'text-accent' : 'text-text-secondary/40'} />
                                  <span className={isActive ? 'text-text' : ''}>{info.label}</span>
                                  <span className="ml-auto">
                                    {isActive ? <Check size={11} className="text-emerald-500" /> : <X size={11} className="text-text-secondary/30" />}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>

                {/* Apercu du message */}
                <div className="rounded-xl border border-accent/20 overflow-hidden">
                  <div className="px-5 py-3 bg-accent/5 border-b border-accent/20 flex items-center gap-2">
                    <Mail size={14} className="text-accent" />
                    <p className="text-xs font-semibold text-accent uppercase tracking-wider">Apercu du message (Client)</p>
                  </div>
                  <div className="p-5 space-y-2">
                    <p className="text-xs font-medium text-text">
                      Objet : {(() => {
                        const notif = detailTarget.notifications.find((n: any) => n.canal === 'email' && n.destinataires.includes('contact'))
                        return notif?.objetTemplate
                          ?.replace(/\{\{_target\.contact\.nom\}\}/g, 'Dupont')
                          ?.replace(/\{\{_target\.contact\.prenom\}\}/g, 'Jean')
                          ?.replace(/\{\{_target\.produit\.titre\}\}/g, 'Ma Villa Mediterraneenne')
                          ?.replace(/\{\{_target\.email\}\}/g, 'jean.dupont@email.com')
                          ?.replace(/\{\{_target\.mot_de_passe_temporaire\}\}/g, 'Temp123!')
                          ?.replace(/\{\{_target\.lien_connexion\}\}/g, 'https://espace.squaremeter.ma')
                          ?.replace(/\{\{_target\.start_at\|date\("d\/m\/Y"\)\}\}/g, '15/06/2026')
                          ?.replace(/\{\{_target\.start_at\|date\("H:i"\)\}\}/g, '14h30')
                          ?.replace(/\{\{_target\.property\.address\}\}/g, '12 Rue de la Liberte')
                          || 'Identifiants extranet Square Meter'
                      })()}
                    </p>
                    <div className="text-xs text-text leading-relaxed whitespace-pre-line bg-card p-4 rounded-lg border border-border/50">
                      {(() => {
                        const notif = detailTarget.notifications.find((n: any) => n.canal === 'email' && n.destinataires.includes('contact'))
                        return notif?.messageTemplate
                          ?.replace(/\{\{_target\.contact\.nom\}\}/g, 'Dupont')
                          ?.replace(/\{\{_target\.contact\.prenom\}\}/g, 'Jean')
                          ?.replace(/\{\{_target\.contact\.firstname\}\}/g, 'Jean')
                          ?.replace(/\{\{_target\.produit\.titre\}\}/g, 'Ma Villa Mediterraneenne')
                          ?.replace(/\{\{_target\.email\}\}/g, 'jean.dupont@email.com')
                          ?.replace(/\{\{_target\.mot_de_passe_temporaire\}\}/g, 'Temp123!')
                          ?.replace(/\{\{_target\.lien_connexion\}\}/g, 'https://espace.squaremeter.ma')
                          ?.replace(/\{\{_target\.start_at\|date\("d\/m\/Y"\)\}\}/g, '15/06/2026')
                          ?.replace(/\{\{_target\.start_at\|date\("H:i"\)\}\}/g, '14h30')
                          ?.replace(/\{\{_target\.property\.address\}\}/g, '12 Rue de la Liberte')
                          ?.replace(/\{\{_target\.prospect\.nom\}\}/g, 'Jean Dupont')
                          ?.replace(/\{\{_target\.prospect\.email\}\}/g, 'jean.dupont@email.com')
                          ?.replace(/\{\{_target\.prospect\.origine\}\}/g, 'Site web')
                          ?.replace(/\{\{_target\.agent\.nom\}\}/g, detailTarget.createdBy || 'Agent')
                          ?.replace(/\{\{_target\.contact\.age\}\}/g, '35')
                          || 'Message non disponible'
                      })()}
                    </div>
                  </div>
                </div>

                {/* Statistiques d'execution */}
                <div className="rounded-xl border border-border/50 overflow-hidden">
                  <div className="px-5 py-3 bg-background border-b border-border/50 flex items-center gap-2">
                    <BarChart2 size={14} className="text-text-secondary" />
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Statistiques d'execution</p>
                  </div>
                  <div className="p-5">
                    {(() => {
                      const logs = automatorCtx.logs.filter((l: any) => l.automatorId === detailTarget.id)
                      const total = logs.length
                      const success = logs.filter((l: any) => l.statut === 'succes').length
                      const failed = logs.filter((l: any) => l.statut === 'echec').length
                      const pending = logs.filter((l: any) => l.statut === 'en_attente').length
                      const rate = total > 0 ? Math.round((success / total) * 100) : 0
                      const lastFail = logs.filter((l: any) => l.statut === 'echec').sort((a: any, b: any) => new Date(b.executeLe).getTime() - new Date(a.executeLe).getTime())[0]
                      return (
                        <div className="space-y-3">
                          <div className="grid grid-cols-4 gap-3">
                            <div className="p-3 rounded-lg bg-background border border-border/30 text-center">
                              <p className="text-lg font-bold text-text">{total}</p>
                              <p className="text-[10px] text-text-secondary">Total</p>
                            </div>
                            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
                              <p className="text-lg font-bold text-emerald-700">{success}</p>
                              <p className="text-[10px] text-emerald-600">Succes</p>
                            </div>
                            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-center">
                              <p className="text-lg font-bold text-red-700">{failed}</p>
                              <p className="text-[10px] text-red-600">Echecs</p>
                            </div>
                            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-center">
                              <p className="text-lg font-bold text-amber-700">{rate}%</p>
                              <p className="text-[10px] text-amber-600">Taux succes</p>
                            </div>
                          </div>
                          {lastFail && (
                            <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200 flex items-center gap-2">
                              <XCircle size={12} />
                              Dernier echec : {new Date(lastFail.executeLe).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} &mdash; {lastFail.messageErreur || 'Erreur inconnue'}
                            </div>
                          )}
                          {pending > 0 && (
                            <div className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200 flex items-center gap-2">
                              <Clock size={12} />
                              {pending} execution{pending > 1 ? 's' : ''} en attente
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                </div>

                <div className="flex justify-end pt-2 gap-2">
                  <Button variant="ghost" onClick={() => { const a = detailTarget; setDetailTarget(null); setShowLogsFor(a); setLogDetail(null) }} icon={<BarChart2 size={14} />}>Voir les logs</Button>
                  <Button onClick={() => setDetailTarget(null)}>Fermer</Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* All logs modal */}
      <AnimatePresence>
        {showAllLogs && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-10 bg-black/40 backdrop-blur-sm overflow-y-auto"
            onClick={() => { setShowAllLogs(false); setAllLogsDetail(null); setAllLogsPage(1); setAllLogsSearch(''); setAllLogsAutomator('all'); setAllLogsStatut('all'); setAllLogsDateDebut(''); setAllLogsDateFin(''); setAllLogsHeureDebut(''); setAllLogsHeureFin('') }}>
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }}
              onClick={e => e.stopPropagation()}
              className="bg-card rounded-xl border border-border/50 shadow-modal w-full max-w-5xl mx-4 my-4 max-h-[90vh] overflow-y-auto scrollbar-thin">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 sticky top-0 bg-card z-10">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <BarChart2 size={16} className="text-accent" />
                  Tous les logs d'exécution
                </h2>
                <button onClick={() => { setShowAllLogs(false); setAllLogsDetail(null); setAllLogsPage(1); setAllLogsSearch(''); setAllLogsAutomator('all'); setAllLogsStatut('all'); setAllLogsDateDebut(''); setAllLogsDateFin(''); setAllLogsHeureDebut(''); setAllLogsHeureFin('') }} className="p-1.5 rounded-lg hover:bg-background text-text-secondary"><X size={16} /></button>
              </div>
              <div className="p-6 space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary/60" />
                      <input type="text" placeholder="Rechercher..." value={allLogsSearch} onChange={e => { setAllLogsSearch(e.target.value); setAllLogsPage(1) }}
                        className="w-80 h-8 pl-8 pr-3 text-xs rounded-lg border border-border bg-background text-text placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
                    </div>
                    <Select value={allLogsAutomator} onChange={(val) => { setAllLogsAutomator(val); setAllLogsPage(1) }}
                      options={[
                        { value: 'all', label: 'Tous les automators' },
                        ...automatorCtx.automators.map(a => ({ value: a.id.toString(), label: `#${a.id} — ${getAutomatorEventName(a)}` })),
                      ]} className="h-8" />
                    <Select value={allLogsStatut} onChange={(val) => { setAllLogsStatut(val); setAllLogsPage(1) }}
                      options={[
                        { value: 'all', label: 'Tous statuts' },
                        { value: 'succes', label: 'Succès' },
                        { value: 'echec', label: 'Échec' },
                        { value: 'en_attente', label: 'En attente' },
                      ]} className="h-8" />
                    <button onClick={() => { setAllLogsSearch(''); setAllLogsAutomator('all'); setAllLogsStatut('all'); setAllLogsDateDebut(''); setAllLogsDateFin(''); setAllLogsHeureDebut(''); setAllLogsHeureFin(''); setAllLogsPage(1) }}
                      className="h-8 px-3 text-xs rounded-lg border border-border bg-background text-text-secondary hover:text-text hover:border-accent/50 transition-colors">
                      Réinitialiser
                    </button>
                  </div>
                  <Button variant="outline" size="sm" icon={<Download size={12} />} onClick={() => {
                    const filteredExport = automatorCtx.logs.filter((l: any) => {
                      if (allLogsAutomator !== 'all' && l.automatorId !== Number(allLogsAutomator)) return false
                      if (allLogsStatut !== 'all' && l.statut !== allLogsStatut) return false
                      if (allLogsSearch) {
                        const q = allLogsSearch.toLowerCase()
                        const auto = automatorCtx.automators.find(a => a.id === l.automatorId)
                        const evName = auto ? getAutomatorEventName(auto).toLowerCase() : ''
                        if (!l.evenement.toLowerCase().includes(q) && !evName.includes(q) && !l.destinataire.toLowerCase().includes(q)) return false
                      }
                      const d = new Date(l.executeLe)
                      if (allLogsDateDebut) {
                        const debut = new Date(allLogsDateDebut + (allLogsHeureDebut ? `T${allLogsHeureDebut}` : 'T00:00:00'))
                        if (d < debut) return false
                      }
                      if (allLogsDateFin) {
                        const fin = new Date(allLogsDateFin + (allLogsHeureFin ? `T${allLogsHeureFin}` : 'T23:59:59'))
                        if (d > fin) return false
                      }
                      return true
                    })
                    const succesCount = filteredExport.filter((l: any) => l.statut === 'succes').length
                    const echecCount = filteredExport.filter((l: any) => l.statut === 'echec').length
                    const attenteCount = filteredExport.filter((l: any) => l.statut === 'en_attente' || (l.statut !== 'succes' && l.statut !== 'echec')).length
                    const rows = filteredExport.map(l => {
                      const badgeClass = l.statut === 'succes' ? 'succes' : l.statut === 'echec' ? 'echec' : 'attente'
                      const badgeLabel = l.statut === 'succes' ? 'Succès' : l.statut === 'echec' ? 'Échec' : 'En attente'
                      const auto = automatorCtx.automators.find(a => a.id === l.automatorId)
                      return `<tr>
                        <td style="padding:10px 14px;font-size:11px;color:#334155;border-bottom:1px solid #f1f5f9">${new Date(l.executeLe).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                        <td style="padding:10px 14px;font-size:11px;color:#334155;border-bottom:1px solid #f1f5f9">#${l.automatorId} — ${auto ? getAutomatorEventName(auto) : '—'}</td>
                        <td style="padding:10px 14px;font-size:11px;color:#334155;border-bottom:1px solid #f1f5f9">${l.evenement}</td>
                        <td style="padding:10px 14px;font-size:11px;color:#334155;border-bottom:1px solid #f1f5f9">${l.destinataire}</td>
                        <td style="padding:10px 14px;font-size:11px;color:#334155;border-bottom:1px solid #f1f5f9"><span class="badge ${badgeClass}">${badgeLabel}</span></td>
                      </tr>`
                    }).join('')
                    const now = new Date()
                    const pdfHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Rapport général des logs</title>
                        <script>window.onload=function(){setTimeout(function(){window.print()},400)}<\/script>
                        <style>
                          @page { margin:12mm 15mm }
                          body { font-family:'Segoe UI',Arial,sans-serif; color:#1a1a2e; margin:0; padding:0 }
                          .header-bar { background:linear-gradient(135deg,${colors.accent},${colors.accentHover}); padding:28px 35px; border-radius:0 0 16px 16px }
                          .header-bar h1 { color:#fff; font-size:22px; font-weight:600; margin:0 0 4px; letter-spacing:-0.3px }
                          .header-bar .meta { color:rgba(255,255,255,0.8); font-size:12px; margin:0 }
                          .content { padding:28px 35px }
                          .stats-row { display:flex; gap:14px; margin-bottom:24px }
                          .stat-card { flex:1; padding:14px 18px; border-radius:10px; text-align:center }
                          .stat-card.total { background:#f0f4ff; border:1px solid #dbeafe }
                          .stat-card.succes { background:#f0fdf4; border:1px solid #bbf7d0 }
                          .stat-card.echec { background:#fef2f2; border:1px solid #fecaca }
                          .stat-card .num { font-size:22px; font-weight:700; margin:0 }
                          .stat-card .lbl { font-size:10px; text-transform:uppercase; letter-spacing:0.5px; margin:2px 0 0 }
                          .stat-card.total .num { color:${colors.accent} } .stat-card.total .lbl { color:${colors.accent} }
                          .stat-card.succes .num { color:#10B981 } .stat-card.succes .lbl { color:#059669 }
                          .stat-card.echec .num { color:#EF4444 } .stat-card.echec .lbl { color:#DC2626 }
                          table { width:100%; border-collapse:separate; border-spacing:0; border-radius:10px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,0.06) }
                          thead th { padding:11px 14px; background:#f8fafc; border-bottom:2px solid #e2e8f0; font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; color:#64748b; text-align:left }
                          tbody td { padding:10px 14px; font-size:11px; color:#334155; border-bottom:1px solid #f1f5f9 }
                          tbody tr:last-child td { border-bottom:none }
                          tbody tr:hover { background:#f8fafc }
                          .badge { display:inline-block; padding:2px 10px; border-radius:20px; font-size:10px; font-weight:500 }
                          .badge.succes { background:#dcfce7; color:#166534 }
                          .badge.echec { background:#fee2e2; color:#991b1b }
                          .badge.attente { background:#fef3c7; color:#92400e }
                          .footer { margin-top:30px; padding-top:14px; border-top:1px solid #e2e8f0; font-size:10px; color:#94a3b8; text-align:center }
                        </style></head><body>
                        <div class="header-bar"><h1>Rapport général des logs d'exécution</h1><p class="meta">${filteredExport.length} exécution(s) · Généré le ${now.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })} à ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p></div>
                        <div class="content">
                          <div class="stats-row">
                            <div class="stat-card total"><p class="num">${filteredExport.length}</p><p class="lbl">Total</p></div>
                            <div class="stat-card succes"><p class="num">${succesCount}</p><p class="lbl">Succès</p></div>
                            <div class="stat-card echec"><p class="num">${echecCount}</p><p class="lbl">Échecs</p></div>
                          </div>
                          <table><thead><tr><th>Date</th><th>Automator</th><th>Événement</th><th>Destinataire</th><th>Statut</th></tr></thead><tbody>${rows}</tbody></table>
                           <div class="footer">Rapport généré automatiquement</div>
                        </div>
                      </body></html>`
                    const blob = new Blob([pdfHtml], { type: 'text/html' })
                    const url = URL.createObjectURL(blob)
                    window.open(url, '_blank')
                  }}>Exporter</Button>
                </div>
                <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-background border border-border/50">
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-text-secondary whitespace-nowrap">Du</label>
                    <DatePicker value={allLogsDateDebut} onChange={e => setAllLogsDateDebut(e.target.value)} className="h-7 text-xs" />
                    <TimePicker value={allLogsHeureDebut} onChange={e => setAllLogsHeureDebut(e.target.value)} className="h-7 text-xs" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-text-secondary whitespace-nowrap">Au</label>
                    <DatePicker value={allLogsDateFin} onChange={e => setAllLogsDateFin(e.target.value)} className="h-7 text-xs" />
                    <TimePicker value={allLogsHeureFin} onChange={e => setAllLogsHeureFin(e.target.value)} className="h-7 text-xs" />
                  </div>
                  {(allLogsDateDebut || allLogsDateFin || allLogsHeureDebut || allLogsHeureFin) && (
                    <button onClick={() => { setAllLogsDateDebut(''); setAllLogsDateFin(''); setAllLogsHeureDebut(''); setAllLogsHeureFin('') }}
                      className="text-[10px] text-text-secondary hover:text-text underline">Effacer</button>
                  )}
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-background border-b border-border text-[11px]">
                        <th className="text-left px-3 py-2 font-medium text-text-secondary">Date</th>
                        <th className="text-left px-3 py-2 font-medium text-text-secondary">Automator</th>
                        <th className="text-left px-3 py-2 font-medium text-text-secondary">Événement</th>
                        <th className="text-left px-3 py-2 font-medium text-text-secondary">Destinataire</th>
                        <th className="text-left px-3 py-2 font-medium text-text-secondary">Statut</th>
                        <th className="text-right px-3 py-2 font-medium text-text-secondary">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {(() => {
                        const ALL_LOGS_PAGE_SIZE = 25
                        const filteredLogs = automatorCtx.logs.filter((l: any) => {
                          if (allLogsAutomator !== 'all' && l.automatorId !== Number(allLogsAutomator)) return false
                          if (allLogsStatut !== 'all' && l.statut !== allLogsStatut) return false
                          if (allLogsSearch) {
                            const q = allLogsSearch.toLowerCase()
                            const auto = automatorCtx.automators.find(a => a.id === l.automatorId)
                            const evName = auto ? getAutomatorEventName(auto).toLowerCase() : ''
                            if (!l.evenement.toLowerCase().includes(q) && !evName.includes(q) && !l.destinataire.toLowerCase().includes(q)) return false
                          }
                          const d = new Date(l.executeLe)
                          if (allLogsDateDebut) {
                            const debut = new Date(allLogsDateDebut + (allLogsHeureDebut ? `T${allLogsHeureDebut}` : 'T00:00:00'))
                            if (d < debut) return false
                          }
                          if (allLogsDateFin) {
                            const fin = new Date(allLogsDateFin + (allLogsHeureFin ? `T${allLogsHeureFin}` : 'T23:59:59'))
                            if (d > fin) return false
                          }
                          return true
                        })
                        const totalPages = Math.max(1, Math.ceil(filteredLogs.length / ALL_LOGS_PAGE_SIZE))
                        const safePage = Math.min(allLogsPage, totalPages)
                        const paginatedLogs = filteredLogs.slice((safePage - 1) * ALL_LOGS_PAGE_SIZE, safePage * ALL_LOGS_PAGE_SIZE)
                        return paginatedLogs.map(l => {
                          const auto = automatorCtx.automators.find(a => a.id === l.automatorId)
                          return (
                            <tr key={l.id} className="hover:bg-background/50 transition-colors">
                              <td className="px-3 py-2 text-xs text-text whitespace-nowrap">
                                {new Date(l.executeLe).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="px-3 py-2 text-xs">
                                <span className="text-accent font-medium">#{l.automatorId}</span>
                                <span className="text-text-secondary ml-1">{auto ? getAutomatorEventName(auto) : '—'}</span>
                              </td>
                              <td className="px-3 py-2 text-xs text-text">{l.evenement}</td>
                              <td className="px-3 py-2 text-xs text-text-secondary">{l.destinataire}</td>
                              <td className="px-3 py-2">
                                <span className={`inline-flex items-center gap-1 text-xs ${l.statut === 'succes' ? 'text-emerald-600' : l.statut === 'echec' ? 'text-red-600' : 'text-amber-600'}`}>
                                  {l.statut === 'succes' ? <CheckCircle size={12} /> : l.statut === 'echec' ? <XCircle size={12} /> : <Clock size={12} />}
                                  {LOG_STATUT_LABELS[l.statut]}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-right">
                                <button onClick={() => setAllLogsDetail(allLogsDetail?.id === l.id ? null : l)}
                                  className="px-2 py-1 text-[10px] rounded bg-background border border-border text-text-secondary hover:text-text transition-colors">
                                  Détails
                                </button>
                              </td>
                            </tr>
                          )
                        })
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {(() => {
                  const ALL_LOGS_PAGE_SIZE = 25
                  const filteredLogs = automatorCtx.logs.filter((l: any) => {
                    if (allLogsAutomator !== 'all' && l.automatorId !== Number(allLogsAutomator)) return false
                    if (allLogsStatut !== 'all' && l.statut !== allLogsStatut) return false
                    if (allLogsSearch) {
                      const q = allLogsSearch.toLowerCase()
                      const auto = automatorCtx.automators.find(a => a.id === l.automatorId)
                      const evName = auto ? getAutomatorEventName(auto).toLowerCase() : ''
                      if (!l.evenement.toLowerCase().includes(q) && !evName.includes(q) && !l.destinataire.toLowerCase().includes(q)) return false
                    }
                    const d = new Date(l.executeLe)
                    if (allLogsDateDebut) {
                      const debut = new Date(allLogsDateDebut + (allLogsHeureDebut ? `T${allLogsHeureDebut}` : 'T00:00:00'))
                      if (d < debut) return false
                    }
                    if (allLogsDateFin) {
                      const fin = new Date(allLogsDateFin + (allLogsHeureFin ? `T${allLogsHeureFin}` : 'T23:59:59'))
                      if (d > fin) return false
                    }
                    return true
                  })
                  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / ALL_LOGS_PAGE_SIZE))
                  const safePage = Math.min(allLogsPage, totalPages)
                  if (totalPages <= 1) return null
                  return (
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-xs text-text-secondary">{filteredLogs.length} résultat(s)</p>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setAllLogsPage(Math.max(1, safePage - 1))} disabled={safePage <= 1}
                          className="px-2 py-1 text-xs rounded border border-border bg-background text-text-secondary disabled:opacity-30 hover:text-text transition-colors">Précédent</button>
                        <span className="px-2 py-1 text-xs text-text-secondary">{safePage} / {totalPages}</span>
                        <button onClick={() => setAllLogsPage(Math.min(totalPages, safePage + 1))} disabled={safePage >= totalPages}
                          className="px-2 py-1 text-xs rounded border border-border bg-background text-text-secondary disabled:opacity-30 hover:text-text transition-colors">Suivant</button>
                      </div>
                    </div>
                  )
                })()}

                {/* Log detail */}
                {allLogsDetail && (
                  <div className="p-4 rounded-xl bg-background border border-border/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-text-secondary">Détail de l'exécution</p>
                      <button onClick={() => setAllLogsDetail(null)} className="text-text-secondary/60 hover:text-text"><X size={12} /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                      <div><span className="text-text-secondary">Date :</span> <span className="text-text">{new Date(allLogsDetail.executeLe).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span></div>
                      <div><span className="text-text-secondary">Automator :</span> <span className="text-text">#{allLogsDetail.automatorId}</span></div>
                      <div><span className="text-text-secondary">Destinataire :</span> <span className="text-text">{allLogsDetail.destinataire}</span></div>
                      <div><span className="text-text-secondary">Statut :</span> <span className={`font-medium ${allLogsDetail.statut === 'succes' ? 'text-emerald-600' : allLogsDetail.statut === 'echec' ? 'text-red-600' : 'text-amber-600'}`}>{LOG_STATUT_LABELS[allLogsDetail.statut as LogStatut]}</span></div>
                      <div className="col-span-2"><span className="text-text-secondary">Événement :</span> <span className="text-text">{allLogsDetail.evenement}</span></div>
                    </div>
                    <div className="pt-2 border-t border-border/30">
                      <p className="text-[11px] text-text-secondary mb-1">Notifications envoyées :</p>
                      <div className="text-xs text-text font-mono whitespace-pre-line bg-card p-2.5 rounded-lg border border-border leading-relaxed">
                        {allLogsDetail.contenu || '\u2014'}
                      </div>
                    </div>
                    {allLogsDetail.messageErreur && (
                      <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                        <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                        <span>Erreur : {allLogsDetail.messageErreur}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget !== null) automatorCtx.deleteAutomator(deleteTarget) }}
        title="Supprimer l'automation"
        message={`Êtes-vous sûr de vouloir supprimer définitivement l'automation #${deleteTarget} ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
      />
    </div>
  )
}
