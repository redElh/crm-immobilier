import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, X, ChevronRight, ChevronLeft, MoreVertical, Activity, ToggleLeft, Trash2,
  BarChart2, Zap, Mail, MessageSquare, Smartphone, Calendar, Crosshair, FileText, Globe, Users,
  Check, CheckCircle, XCircle, Clock, Play, Eye,
  User, UserCheck, ShoppingCart, TrendingUp, Key, Home, MapPin, Bell, Send, Sliders, Search, Copy,
  BookOpen, Edit3, AlertTriangle,
} from 'react-feather'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell,
} from 'recharts'
import Card from '../../components/ui/Card'
import { FilterDropdown } from '../../components/ui/FilterDropdown'
import { Button } from '../../components/ui/Button'
import { api } from '../../services/api'
import {
  mockModeles,
  getModeleById, getEventById, LOG_STATUT_LABELS,
  EVENTS as sharedEvents, CLIENT_TYPE_CONFIG as sharedClientTypes, REAL_CLIENT_TYPES,
} from '../../types/automator'
import type { Automator, NotificationCanal, AutomatorCategorie, AutomatorLog, RecipientType, ClientType, AutomatorEvent, NotificationTemplate } from '../../types/automator'
import { useAutomator, AddAutomatorInput } from '../../contexts/AutomatorContext'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { allContacts } from '../admin/contacts/mockData'
import { mockPropertiesList } from '../../data/mockProperties'

const CANAL_ICONES: Record<NotificationCanal, { icon: any; label: string }> = {
  email: { icon: Mail, label: 'Email' },
  sms: { icon: MessageSquare, label: 'SMS' },
  push: { icon: Smartphone, label: 'Push' },
  application_mobile: { icon: Smartphone, label: 'CRM Square Immo' },
}

const CATEGORIE_ICONS: Record<AutomatorCategorie, any> = {
  calendrier: Calendar,
  contrats: FileText,
  extranet: Eye,
  contacts: Users,
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
      if (progress < 1) {
        ref.current = requestAnimationFrame(animate)
      }
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

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#F43F5E', '#06B6D4', '#EC4899', '#14B8A6', '#F97316', '#6366F1']

const MODELE_TO_CLIENT_TYPE: Record<number, ClientType> = {
  1: 'calendrier', 2: 'calendrier',
  5: 'contrats', 6: 'contrats', 7: 'contrats', 8: 'contrats',
  9: 'extranet', 10: 'extranet', 11: 'contacts',
}

const ICON_MAP: Record<string, any> = {
  tous: Sliders, acheteur: ShoppingCart, vendeur: TrendingUp, bailleur: Key,
  locataire: Home, voyageur: MapPin, contacts: Users,
  calendrier: Calendar, contrats: FileText, extranet: Eye,
}

const CLIENT_TYPE_CONFIG = sharedClientTypes
  .filter(ct => ct.key !== 'admin')
  .map(ct => ({ ...ct, icon: ICON_MAP[ct.key] || Sliders }))

const EVENTS = sharedEvents.filter(e => e.clientType !== 'admin')

function getAutomatorEventName(a: { eventId?: string; modeleId: number }): string {
  if (a.eventId) {
    const ev = getEventById(a.eventId)
    if (ev) return ev.label
  }
  return getModeleById(a.modeleId)?.nom || '—'
}

type WizardStep = 1 | 2 | 3

export default function AutomatorPage() {
  const automatorCtx = useAutomator()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showWizard, setShowWizard] = useState(false)
  const [wizardStep, setWizardStep] = useState<WizardStep>(1)
  const [showLogsFor, setShowLogsFor] = useState<Automator | null>(null)
  const [emailPreviewHtml, setEmailPreviewHtml] = useState<string | null>(null)
  const [emailPreviewTitle, setEmailPreviewTitle] = useState<string>('')
  const [previewChannel, setPreviewChannel] = useState<'email' | 'crm'>('email')
  const [showActionMenu, setShowActionMenu] = useState<number | null>(null)
  const [logDetail, setLogDetail] = useState<AutomatorLog | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  // Search / filter
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'actif' | 'inactif'>('all')
  const [filterCategory, setFilterCategory] = useState<ClientType | 'all'>('all')
  const [filterRecipient, setFilterRecipient] = useState<'all' | RecipientType>('all')
  const [filterFrequency, setFilterFrequency] = useState<'all' | string>('all')
  const [detailTarget, setDetailTarget] = useState<any>(null)

  // Wizard state
  const [recipient, setRecipient] = useState<RecipientType>('both')
  const [filterClientType, setFilterClientType] = useState<ClientType>('tous')
  const [selectedEvent, setSelectedEvent] = useState<AutomatorEvent | null>(null)

  const [agentEmail, setAgentEmail] = useState(true)
  const [agentSms, setAgentSms] = useState(false)
  const [agentApp, setAgentApp] = useState(true)
  const [clientEmail, setClientEmail] = useState(true)
  const [clientSms, setClientSms] = useState(true)
  const [clientApp, setClientApp] = useState(false)

  useEffect(() => {
    api.get<any>('/auth/me').then(setCurrentUser).catch(() => {})
    api.post('/automators/seed').catch(() => {})
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const highlightId = params.get('highlight')
    if (!highlightId || automatorCtx.automators.length === 0) return
    const el = document.querySelector(`[data-automator-id="${highlightId}"]`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('ring-2', 'ring-accent', 'ring-offset-2', 'rounded-xl')
      setTimeout(() => el.classList.remove('ring-2', 'ring-accent', 'ring-offset-2', 'rounded-xl'), 3000)
    }
  }, [automatorCtx.automators])

  const agentName = currentUser
    ? [currentUser.first_name, currentUser.last_name].filter(Boolean).join(' ') || currentUser.email || ''
    : ''

  const myAutomators = useMemo(() => {
    return automatorCtx.automators.filter(a => {
      if (!a.eventId) return false
      const ev = getEventById(a.eventId)
      if (ev?.clientType === 'admin') return false
      if (a.createdBy === agentName) return true
      if (a.delegatedTo === 'all') return true
      if (a.delegatedTo && a.delegatedTo === agentName) return true
      return false
    })
  }, [automatorCtx.automators, agentName])

  const eventsByRecipient = useMemo(() => {
    return EVENTS.filter(e => e.defaultRecipient === recipient)
  }, [recipient])

  const availableClientTypes = useMemo(() => {
    const types = new Set(eventsByRecipient.map(e => e.clientType))
    return CLIENT_TYPE_CONFIG.filter(ct => ct.key === 'tous' || types.has(ct.key))
  }, [eventsByRecipient])

  const filteredEvents = useMemo(() => {
    if (filterClientType === 'tous') return eventsByRecipient
    return eventsByRecipient.filter(e => e.clientType === filterClientType)
  }, [eventsByRecipient, filterClientType])

  const extendedAutomators = useMemo(() => {
    return myAutomators.map(a => {
      const ev = a.eventId ? getEventById(a.eventId) : undefined
      const clientType = ev?.clientType || 'tous'
      const logs = automatorCtx.logs.filter(l => l.automatorId === a.id)
      const recipientType: RecipientType = a.notifications.some(n => n.destinataires.includes('agent'))
        ? a.notifications.some(n => n.destinataires.includes('contact'))
          ? 'both'
          : 'agent'
        : 'client'
      return { ...a, clientType, recipientType, eventLabel: getAutomatorEventName(a), totalRuns: logs.length, successRate: logs.length > 0 ? Math.round((logs.filter(l => l.statut === 'succes').length / logs.length) * 100) : 0 }
    }) as (Automator & { clientType: ClientType; recipientType: RecipientType; eventLabel: string; totalRuns: number; successRate: number })[]
  }, [myAutomators, automatorCtx.logs])

  const filteredAutomators = useMemo(() => {
    return extendedAutomators.filter(a => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!a.eventLabel.toLowerCase().includes(q) && !a.niveauLabel.toLowerCase().includes(q) && !`#${a.id}`.includes(q)) return false
      }
      if (filterStatus === 'actif' && !a.actif) return false
      if (filterStatus === 'inactif' && a.actif) return false
      if (filterCategory !== 'all' && a.clientType !== filterCategory) return false
      if (filterRecipient !== 'all' && a.recipientType !== filterRecipient) return false
      if (filterFrequency !== 'all' && a.frequence !== filterFrequency) return false
      return true
    })
  }, [extendedAutomators, searchQuery, filterStatus, filterCategory, filterRecipient, filterFrequency])

  const recipientCounts = useMemo(() => {
    const counts = { agent: 0, client: 0, both: 0 }
    extendedAutomators.forEach(a => { counts[a.recipientType]++ })
    return counts
  }, [extendedAutomators])

  const frequencyOptions = useMemo(() => {
    return Array.from(new Set(extendedAutomators.map(a => a.frequence)))
  }, [extendedAutomators])

  const startWizard = () => {
    setSelectedEvent(null); setFilterClientType('tous'); setRecipient('both')
    setWizardStep(1); setShowWizard(true)
    setAgentEmail(true); setAgentSms(false); setAgentApp(true)
    setClientEmail(true); setClientSms(true); setClientApp(false)
  }

  const scrollToEvent = (eventId: string) => {
    setTimeout(() => {
      const el = document.querySelector(`[data-event-id="${eventId}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 150)
  }

  const openEditWizard = (a: Automator) => {
    setSelectedEvent(null); setFilterClientType('tous'); setRecipient('both')
    setWizardStep(1); setShowWizard(true)
    setAgentEmail(true); setAgentSms(false); setAgentApp(true)
    setClientEmail(true); setClientSms(true); setClientApp(false)

    const ev = a.eventId ? getEventById(a.eventId) : undefined
    const ext = extendedAutomators.find(x => x.id === a.id)

    if (ext) setRecipient(ext.recipientType)
    if (ev) {
      setFilterClientType(ev.clientType)
      setSelectedEvent(ev)
      scrollToEvent(ev.id)
    }
  }

  const handleRecipientChange = (r: RecipientType) => {
    setRecipient(r)
    setFilterClientType('tous')
    if (selectedEvent && selectedEvent.defaultRecipient !== r) setSelectedEvent(null)
  }

  const selectEvent = (e: AutomatorEvent) => {
    setSelectedEvent(e)
    setWizardStep(2)
  }

  const recipientIcon = (r: RecipientType) => {
    switch (r) {
      case 'agent': return User
      case 'client': return UserCheck
      case 'both': return Users
    }
  }

  const recipientLabel = (r: RecipientType) => {
    switch (r) {
      case 'agent': return 'Moi uniquement'
      case 'client': return 'Le client uniquement'
      case 'both': return 'Moi et le client'
    }
  }

  const totalExecutions = useMemo(() => {
    return automatorCtx.logs.length
  }, [automatorCtx.logs])

  const successRate = useMemo(() => {
    if (automatorCtx.logs.length > 0) {
      return Math.round((automatorCtx.logs.filter(l => l.statut === 'succes').length / automatorCtx.logs.length) * 100)
    }
    return 0
  }, [automatorCtx.logs])

  const executionChartData = useMemo(() => {
    const days: { jour: string; succes: number; echec: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dayStr = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
      const dayFull = d.toISOString().slice(0, 10)
      const logs = automatorCtx.logs.filter(l => {
        const lDate = l.executeLe.slice(0, 10)
        return lDate === dayFull && myAutomators.some(a => a.id === l.automatorId)
      })
      days.push({
        jour: dayStr,
        succes: logs.filter(l => l.statut === 'succes').length,
        echec: logs.filter(l => l.statut === 'echec').length,
      })
    }
    return days
  }, [myAutomators, automatorCtx.logs])

  const categoryChartData = useMemo(() => {
    const counts: Record<string, number> = {}
    extendedAutomators.forEach(a => {
      const cfg = CLIENT_TYPE_CONFIG.find(c => c.key === a.clientType)
      const label = cfg?.label || a.clientType
      counts[label] = (counts[label] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [extendedAutomators])

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Zap size={20} className="text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Automator</h1>
            <p className="text-sm text-text-secondary">Automatisez vos actions recurrentes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/5 border border-accent/20 text-xs text-accent font-medium">
            <Users size={12} />
            {agentName}
          </div>
          <Button onClick={startWizard} icon={<Plus size={14} />}>Nouvel automator</Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Zap} label="Total automators" value={myAutomators.length} color="accent" />
        <StatCard icon={CheckCircle} label="Automators actifs" value={myAutomators.filter(a => a.actif).length} color="emerald" />
        <StatCard icon={BarChart2} label="Executions totales" value={totalExecutions} color="indigo" />
        <StatCard icon={Activity} label="Taux de succes" value={`${successRate}%`} color="amber" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area Chart: 7-day evolution */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium">Evolution des executions</p>
              <p className="text-xs text-text-secondary">7 derniers jours</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-text-secondary">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Succes
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Echec
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
                <Area type="monotone" dataKey="succes" name="Succes" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorSucces)" />
                <Area type="monotone" dataKey="echec" name="Echec" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorEchec)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pie Chart: Category distribution */}
        <Card className="p-5">
          <p className="text-sm font-medium mb-1">Repartition par categorie</p>
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
              <div className="h-full flex items-center justify-center text-text-secondary text-xs">Aucune donnee</div>
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
      </div>

      {/* Notifications déclenchées */}
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
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                  n.channel === 'email' ? 'cursor-pointer' : ''
                } ${n.read ? 'border-border/30 bg-background/50' : n.channel === 'email' ? 'border-blue-200 bg-blue-50/30' : 'border-purple-200 bg-purple-50/30'}`}
                onClick={() => {
                  if (n.channel !== 'email') return
                  automatorCtx.markAsRead(n.id)
                  if (n.emailHtml) {
                    setPreviewChannel('email')
                    setEmailPreviewHtml(n.emailHtml)
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
                    {n.channel === 'email' && n.emailHtml ? ` · Cliquer pour voir l'email` : ''}
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

      {/* Destinataires summary bar */}
      <Card>
        <div className="px-5 py-3 flex items-center gap-4 text-xs text-text-secondary flex-wrap">
          <span className="font-medium text-text flex items-center gap-1.5"><Users size={13} className="text-text-secondary" /> Destinataires :</span>
          <span className="inline-flex items-center gap-1.5">
            <User size={12} className="text-blue-600" />
            Agent ({recipientCounts.agent})
          </span>
          <span className="w-px h-3 bg-border/50" />
          <span className="inline-flex items-center gap-1.5">
            <UserCheck size={12} className="text-emerald-600" />
            Client ({recipientCounts.client})
          </span>
          <span className="w-px h-3 bg-border/50" />
          <span className="inline-flex items-center gap-1.5">
            <Users size={12} className="text-purple-600" />
            Agent + Client ({recipientCounts.both})
          </span>
        </div>
      </Card>

      {/* Search & Filters */}
      <Card className="p-5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/40" />
            <input type="text" placeholder="Rechercher par modele, evenement, type de client..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-background border border-border/50 text-text placeholder:text-text-secondary/40 focus:outline-none focus:ring-1 focus:ring-accent/30 transition-shadow" />
          </div>
          <FilterDropdown
            options={[
              { value: 'all', label: 'Tous les types' },
              ...CLIENT_TYPE_CONFIG.filter(ct => ct.key !== 'tous').map(ct => ({ value: ct.key, label: ct.label })),
            ]}
            value={filterCategory}
            onChange={v => setFilterCategory(v as ClientType | 'all')}
            className="w-36"
            label=""
          />
          <FilterDropdown
            options={[
              { value: 'all', label: 'Tous les statuts' },
              { value: 'actif', label: 'Actif' },
              { value: 'inactif', label: 'Inactif' },
            ]}
            value={filterStatus}
            onChange={v => setFilterStatus(v as 'all' | 'actif' | 'inactif')}
            className="w-36"
            label=""
          />
          <FilterDropdown
            options={[
              { value: 'all', label: 'Tous les destinataires' },
              { value: 'agent', label: 'Agent' },
              { value: 'client', label: 'Client' },
              { value: 'both', label: 'Agent + Client' },
            ]}
            value={filterRecipient}
            onChange={v => setFilterRecipient(v as 'all' | RecipientType)}
            className="w-40"
            label=""
          />
          <FilterDropdown
            options={[
              { value: 'all', label: 'Toutes les frequences' },
              ...frequencyOptions.map(f => ({ value: f, label: f })),
            ]}
            value={filterFrequency}
            onChange={setFilterFrequency}
            className="w-36"
            label=""
          />
          <button onClick={() => { setSearchQuery(''); setFilterStatus('all'); setFilterCategory('all'); setFilterRecipient('all'); setFilterFrequency('all') }}
            className="px-3 py-1.5 text-xs rounded-lg border border-border/50 text-text-secondary hover:bg-background transition-colors">
            Reinitialiser
          </button>
        </div>
      </Card>

      {/* Automations Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium flex items-center gap-2">
            <Zap size={14} className="text-accent" />
            Mes automations
            <span className="text-xs font-normal text-text-secondary">({filteredAutomators.length})</span>
          </p>
          <Button onClick={startWizard} icon={<Plus size={14} />}>Nouvel automator</Button>
        </div>
        {filteredAutomators.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center">
                <Zap size={20} className="text-text-secondary/40" />
              </div>
              <p className="text-sm text-text-secondary">Aucune automation</p>
              <Button onClick={startWizard} icon={<Plus size={14} />} variant="ghost">Creer un automator</Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredAutomators.map((a, i) => {
              const ev = a.eventId ? getEventById(a.eventId) : undefined
              const evCat = ev?.clientType === 'contacts' ? 'contacts' : 'contrats'
              const CatIcon = CATEGORIE_ICONS[evCat] || Zap
              const ctConfig = CLIENT_TYPE_CONFIG.find(c => c.key === (ev?.clientType || a.clientType))
              const CtIcon = ctConfig?.icon || null
              const dernierLog = automatorCtx.logs.filter(l => l.automatorId === a.id).sort((x, y) => new Date(y.executeLe).getTime() - new Date(x.executeLe).getTime())[0]
              const execResultOk = dernierLog?.statut === 'succes'
              const execResultFail = dernierLog?.statut === 'echec'
              const activeNotifs = a.notifications.filter(n => n.actif)
              return (
                <motion.div key={a.id} data-automator-id={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
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
                      <button onClick={() => setShowActionMenu(showActionMenu === (a as Automator).id ? null : (a as Automator).id)}
                        className="p-1 rounded-lg hover:bg-background text-text-secondary hover:text-text transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0">
                        <MoreVertical size={14} />
                      </button>
                    </div>
                    {/* Event description */}
                    <p className="text-xs text-text-secondary mb-3 leading-relaxed">{a.eventLabel}</p>
                    {/* Badges row */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Category/Client type badge */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-md bg-background border border-border/50">
                        {CtIcon && <CtIcon size={9} className={`${ctConfig?.color || 'text-text-secondary'}`} />}
                        {ctConfig?.label || '—'}
                      </span>
                      {/* Recipient badge */}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-md ${
                        a.recipientType === 'agent' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        a.recipientType === 'client' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}>
                        {a.recipientType === 'agent' ? 'Agent' : a.recipientType === 'client' ? 'Client' : 'Agent + Client'}
                      </span>
                      {a.delegationType && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                          <UserCheck size={9} />
                          Délégué{a.delegatedBy ? ` par ${a.delegatedBy}` : ''}
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
                      <button onClick={() => setDetailTarget(a)} className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium rounded-lg border border-border/30 hover:border-accent/30 hover:bg-accent/5 transition-all text-text-secondary hover:text-text">
                        <Eye size={11} /> Detail
                      </button>
                      <button onClick={() => setShowLogsFor(a)} className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium rounded-lg border border-border/30 hover:border-accent/30 hover:bg-accent/5 transition-all text-text-secondary hover:text-text">
                        <BarChart2 size={11} /> Logs
                      </button>
                      <button onClick={() => openEditWizard(a)} className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium rounded-lg border border-border/30 hover:border-accent/30 hover:bg-accent/5 transition-all text-text-secondary hover:text-text">
                        <Edit3 size={11} /> Modifier
                      </button>
                      <div className="flex-1" />
                      <button onClick={() => setDeleteTarget((a as Automator).id)} className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium rounded-lg border border-red-200 hover:bg-red-50 transition-all text-red-500">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                  {/* Action menu modal */}
                  {showActionMenu === (a as Automator).id && (
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
                                <button onClick={() => { setShowActionMenu(null) }} className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border border-border/30 hover:border-accent/30 hover:bg-accent/5 transition-all text-text">
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
                              <button onClick={() => { setDeleteTarget((a as Automator).id); setShowActionMenu(null) }} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-red-200 hover:bg-red-50 transition-all text-red-500 text-xs font-medium">
                                <Trash2 size={14} />
                                Supprimer definitivement
                              </button>
                            </div>
                          </div>
                          <div className="px-5 py-3 bg-background/80 border-t border-border/30 flex items-center gap-4 text-[10px] text-text-secondary/60">
                            <span><span className="font-medium text-text-secondary/80">Destinataire :</span> {a.recipientType === 'agent' ? 'Agent' : a.recipientType === 'client' ? 'Client' : 'Agent + Client'}</span>
                            <span className="w-px h-3 bg-border/50" />
                            <span><span className="font-medium text-text-secondary/80">{REAL_CLIENT_TYPES.has(a.clientType) ? 'Type' : 'Cate'} :</span> {ctConfig?.label || '—'}</span>
                            <span className="w-px h-3 bg-border/50" />
                            <span className="truncate"><span className="font-medium text-text-secondary/80">Evenement :</span> {a.eventLabel}</span>
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
        {/* Summary bar */}
        <Card>
          <div className="px-5 py-3 flex items-center justify-between text-xs text-text-secondary">
            <div className="flex items-center gap-4">
              <span>{filteredAutomators.length} automation{filteredAutomators.length > 1 ? 's' : ''}</span>
              <span className="w-px h-3 bg-border/50" />
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />{filteredAutomators.filter(a => a.actif).length} actif{filteredAutomators.filter(a => a.actif).length > 1 ? 's' : ''}</span>
              <span className="w-px h-3 bg-border/50" />
              <span className="flex items-center gap-1"><BarChart2 size={11} />{totalExecutions} executions</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Legend */}
      <Card>
        <div className="px-5 py-3">
          <div className="flex items-center gap-6 text-xs text-text-secondary flex-wrap">
            <span className="font-medium text-text">Legende :</span>
            <span className="inline-flex items-center gap-1.5"><User size={12} className="text-blue-600" /> Agent</span>
            <span className="inline-flex items-center gap-1.5"><UserCheck size={12} className="text-emerald-600" /> Client</span>
            <span className="inline-flex items-center gap-1.5"><Users size={12} className="text-purple-600" /> Agent + Client</span>
            <span className="w-px h-3 bg-border/50" />
            {CLIENT_TYPE_CONFIG.filter(ct => ct.key !== 'tous').map(ct => {
              const Icon = ct.icon
              return (
                <span key={ct.key} className="inline-flex items-center gap-1.5">
                  <Icon size={11} className={ct.color} /> {ct.label}
                </span>
              )
            })}
            <span className="w-px h-3 bg-border/50" />
            <span className="inline-flex items-center gap-1.5"><CheckCircle size={10} className="text-emerald-600" /> Succes</span>
            <span className="inline-flex items-center gap-1.5"><XCircle size={10} className="text-red-500" /> Echec</span>
            <span className="inline-flex items-center gap-1.5"><Clock size={10} className="text-amber-600" /> En attente</span>
          </div>
        </div>
      </Card>

      {/* Wizard modal */}
      <AnimatePresence>
        {showWizard && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-8 bg-black/40 backdrop-blur-sm overflow-y-auto"
            onClick={() => setShowWizard(false)}>
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }}
              onClick={e => e.stopPropagation()}
              className="bg-card rounded-xl border border-border/50 shadow-modal w-full max-w-3xl mx-4 my-4 max-h-[90vh] overflow-y-auto scrollbar-thin">
              {/* Wizard header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                <div className="flex items-center gap-3 text-sm">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${wizardStep >= 1 ? 'bg-accent text-white' : 'bg-background text-text-secondary'}`}>1</span>
                  <span className={wizardStep >= 1 ? 'text-text' : 'text-text-secondary'}>Declencheur</span>
                  <ChevronRight size={14} className="text-text-secondary/40" />
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${wizardStep >= 2 ? 'bg-accent text-white' : 'bg-background text-text-secondary'}`}>2</span>
                  <span className={wizardStep >= 2 ? 'text-text' : 'text-text-secondary'}>Notifications</span>
                  <ChevronRight size={14} className="text-text-secondary/40" />
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${wizardStep >= 3 ? 'bg-accent text-white' : 'bg-background text-text-secondary'}`}>3</span>
                  <span className={wizardStep >= 3 ? 'text-text' : 'text-text-secondary'}>Synthese</span>
                </div>
                <button onClick={() => setShowWizard(false)} className="p-1.5 rounded-lg hover:bg-background text-text-secondary"><X size={16} /></button>
              </div>

              <div className="p-6">
                {/* ═══ STEP 1: Trigger & Recipient ═══ */}
                {wizardStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-base font-semibold flex items-center gap-2 mb-1">
                        <Zap size={18} className="text-accent" />
                        Choisissez le declencheur et le destinataire
                      </h2>
                      <p className="text-xs text-text-secondary">Configurez l'evenement qui declenchera l'automation et qui recevra la notification</p>
                    </div>

                    {/* Recipient selection */}
                    <div>
                      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Send size={13} /> Destinataire
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        {(['agent', 'client', 'both'] as RecipientType[]).map(r => {
                          const Icon = recipientIcon(r)
                          const isSelected = recipient === r
                          return (
                            <button key={r} onClick={() => handleRecipientChange(r)}
                              className={`p-3 rounded-xl border text-left transition-all ${
                                isSelected ? 'border-accent bg-accent/5 ring-1 ring-accent/30' : 'border-border/50 hover:border-accent/30 hover:bg-accent/5'
                              }`}>
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                                isSelected ? 'bg-accent text-white' : 'bg-background text-text-secondary'
                              }`}>
                                <Icon size={16} />
                              </div>
                              <p className={`text-xs font-medium ${isSelected ? 'text-accent' : 'text-text'}`}>{recipientLabel(r)}</p>
                              <p className="text-[10px] text-text-secondary/60 mt-0.5">
                                {r === 'agent' ? 'Notification interne' : r === 'client' ? 'Notification client' : 'Les deux'}
                              </p>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Category filter */}
                    <div>
                      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Sliders size={13} /> Categorie d'evenement
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {availableClientTypes.map(ct => {
                          const Icon = ct.icon
                          const isActive = filterClientType === ct.key
                          return (
                            <button key={ct.key} onClick={() => setFilterClientType(ct.key)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                isActive ? 'bg-accent text-white shadow-sm' : 'bg-background border border-border/50 text-text-secondary hover:border-accent/30 hover:text-text'
                              }`}>
                              <Icon size={13} />
                              {ct.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Events list */}
                    <div>
                      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Activity size={13} /> Evenements disponibles
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
                                </div>
                                <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full border ${
                                  evt.defaultRecipient === 'agent' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                  evt.defaultRecipient === 'client' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  'bg-purple-50 text-purple-700 border-purple-200'
                                }`}>
                                  <RecipIcon size={10} />
                                  {recipientLabel(evt.defaultRecipient)}
                                </span>
                              </div>
                            </button>
                          )
                        })}
                        {filteredEvents.length === 0 && (
                          <div className="py-8 text-center text-text-secondary/60 text-xs">
                            Aucun evenement disponible pour cette combinaison
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between pt-4 border-t border-border/30">
                      <Button variant="ghost" onClick={() => setShowWizard(false)}>Annuler</Button>
                    </div>
                  </div>
                )}

                {/* ═══ STEP 2: Notification configuration ═══ */}
                {wizardStep === 2 && selectedEvent && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-base font-semibold flex items-center gap-2 mb-1">
                        <Bell size={18} className="text-accent" />
                        Configurez les notifications
                      </h2>
                      <div className="flex items-center gap-3 text-xs text-text-secondary bg-background rounded-lg px-3 py-2 border border-border/50">
                        <span className="font-medium text-text">{selectedEvent.label}</span>
                        <span className="w-px h-3 bg-border/50" />
                        <span className="inline-flex items-center gap-1">
                          {(() => { const Icon = recipientIcon(recipient); return <Icon size={12} /> })()}
                          {recipientLabel(recipient)}
                        </span>
                      </div>
                    </div>

                    {/* Agent notification section */}
                    {(recipient === 'agent' || recipient === 'both') && (
                      <div className="p-5 rounded-xl border border-border/50 bg-gradient-to-b from-blue-50/30 to-transparent">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                            <User size={14} className="text-blue-700" />
                          </div>
                          <p className="text-sm font-semibold text-text">Notification pour l'agent</p>
                        </div>

                        <div className="space-y-3">
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

                          {agentEmail && (
                            <div>
                              <p className="text-[11px] text-text-secondary mb-1 flex items-center gap-1"><Mail size={10} /> Message email :</p>
                              <div className="p-3 rounded-lg bg-background border border-border/50 text-xs text-text font-mono leading-relaxed whitespace-pre-line">
                                {selectedEvent.agentTemplate.emailMessage}
                              </div>
                            </div>
                          )}
                          {agentSms && (
                            <div>
                              <p className="text-[11px] text-text-secondary mb-1 flex items-center gap-1"><Smartphone size={10} /> Notification CRM :</p>
                              <div className="p-3 rounded-lg bg-background border border-border/50 text-xs text-text leading-relaxed whitespace-pre-line">
                                {selectedEvent.agentTemplate.smsMessage}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Client notification section */}
                    {(recipient === 'client' || recipient === 'both') && (
                      <div className="p-5 rounded-xl border border-border/50 bg-gradient-to-b from-emerald-50/30 to-transparent">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <UserCheck size={14} className="text-emerald-700" />
                          </div>
                          <p className="text-sm font-semibold text-text">Notification pour le client</p>
                        </div>

                        <div className="space-y-3">
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

                          {recipient === 'both' && selectedEvent.clientTemplate && clientEmail && (
                            <div>
                              <p className="text-[11px] text-text-secondary mb-1 flex items-center gap-1"><Mail size={10} /> Message email pour le client :</p>
                              <div className="p-3 rounded-lg bg-background border border-border/50 text-xs text-text font-mono leading-relaxed whitespace-pre-line">
                                {selectedEvent.clientTemplate.emailMessage}
                              </div>
                            </div>
                          )}
                          {recipient === 'both' && selectedEvent.clientTemplate && clientSms && (
                            <div>
                              <p className="text-[11px] text-text-secondary mb-1 flex items-center gap-1"><Eye size={10} /> Notification app mobile :</p>
                              <div className="p-3 rounded-lg bg-background border border-border/50 text-xs text-text leading-relaxed whitespace-pre-line">
                                {selectedEvent.clientTemplate.smsMessage}
                              </div>
                            </div>
                          )}
                          {recipient === 'client' && clientEmail && (
                            <div>
                              <p className="text-[11px] text-text-secondary mb-1 flex items-center gap-1"><Mail size={10} /> Message email :</p>
                              <div className="p-3 rounded-lg bg-background border border-border/50 text-xs text-text font-mono leading-relaxed whitespace-pre-line">
                                {selectedEvent.clientTemplate?.emailMessage || selectedEvent.agentTemplate.emailMessage}
                              </div>
                            </div>
                          )}
                          {recipient === 'client' && clientSms && (
                            <div>
                              <p className="text-[11px] text-text-secondary mb-1 flex items-center gap-1"><Eye size={10} /> Notification app mobile :</p>
                              <div className="p-3 rounded-lg bg-background border border-border/50 text-xs text-text leading-relaxed whitespace-pre-line">
                                {selectedEvent.clientTemplate?.smsMessage || selectedEvent.agentTemplate.smsMessage}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between pt-4 border-t border-border/30">
                      <Button variant="ghost" onClick={() => setWizardStep(1)} icon={<ChevronLeft size={14} />}>Precedent</Button>
                      <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => setShowWizard(false)}>Annuler</Button>
                        <Button onClick={() => setWizardStep(3)}>Suivant <ChevronRight size={14} /></Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ═══ STEP 3: Summary ═══ */}
                {wizardStep === 3 && selectedEvent && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-base font-semibold flex items-center gap-2 mb-1">
                        <BookOpen size={18} className="text-accent" />
                        Recapitulatif
                      </h2>
                      <p className="text-xs text-text-secondary">Verifiez les parametres avant d'ajouter l'automation</p>
                    </div>

                    <div className="p-5 rounded-xl bg-background border border-border/50 space-y-3">
                      <p className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
                        <Sliders size={13} /> Synthese
                      </p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="p-3 rounded-lg bg-card border border-border/30">
                          <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">Evenement</p>
                          <p className="text-xs font-medium text-text flex items-center gap-1.5">
                            <Activity size={12} className="text-accent" />
                            {selectedEvent.label}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-card border border-border/30">
                          <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">Destinataire</p>
                          <p className="text-xs font-medium text-text flex items-center gap-1.5">
                            {(() => { const Icon = recipientIcon(recipient); return <Icon size={12} className="text-accent" /> })()}
                            {recipientLabel(recipient)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {(recipient === 'agent' || recipient === 'both') && (
                          <div className="p-3 rounded-lg bg-card border border-border/30">
                            <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1">
                              <User size={11} /> Notification agent
                            </p>
                            <div className="flex gap-1">
                              {[
                                { label: 'Email', state: agentEmail },
                                { label: 'CRM Square Immo', state: agentSms },
                              ].map(ch => (
                                <span key={ch.label} className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] rounded ${
                                  ch.state ? 'bg-accent/10 text-accent' : 'bg-text-secondary/5 text-text-secondary/40'
                                }`}>
                                  {ch.label}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {(recipient === 'client' || recipient === 'both') && (
                          <div className="p-3 rounded-lg bg-card border border-border/30">
                            <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1">
                              <UserCheck size={11} /> Notification client
                            </p>
                            <div className="flex gap-1">
                              {[
                                { label: 'Email', state: clientEmail },
                                { label: 'Squaremeter web app', state: clientSms },
                              ].map(ch => (
                                <span key={ch.label} className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] rounded ${
                                  ch.state ? 'bg-accent/10 text-accent' : 'bg-text-secondary/5 text-text-secondary/40'
                                }`}>
                                  {ch.label}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Email preview */}
                    {recipient !== 'agent' && selectedEvent.clientTemplate && (
                      <div className="p-5 rounded-xl border border-accent/20 bg-accent/5">
                        <p className="text-xs font-semibold text-accent flex items-center gap-1.5 mb-3">
                          <Mail size={13} /> Apercu de l'email pour le client
                        </p>
                        <p className="text-[11px] text-text font-medium mb-2">Objet : {selectedEvent.clientTemplate.emailObjet.replace('{{client.prenom}}', 'Jean').replace('{{client.nom}}', 'Dupont')}</p>
                        <div className="text-xs text-text leading-relaxed whitespace-pre-line bg-card p-3 rounded-lg border border-border/50">
                          {selectedEvent.clientTemplate.emailMessage
                            .replace(/\{\{client\.prenom\}\}/g, 'Jean')
                            .replace(/\{\{client\.nom\}\}/g, 'Dupont')
                            .replace(/\{\{bien\.titre\}\}/g, 'Ma Villa Mediterraneenne')
                            .replace(/\{\{bien\.prix\}\}/g, '2 500 000')
                            .replace(/\{\{bien\.surface\}\}/g, '420')
                            .replace(/\{\{bien\.pieces\}\}/g, '6')
                            .replace(/\{\{bien\.chambres\}\}/g, '5')
                            .replace(/\{\{bien\.adresse\}\}/g, '12 Rue de la Liberte, Casablanca')
                            .replace(/\{\{score\}\}/g, '92')
                            .replace(/\{\{lien_client\}\}/g, 'https://espace.squaremeter.ma/bien/123')
                            .replace(/\{\{visite\.date\}\}/g, '15/06/2026')
                            .replace(/\{\{visite\.heure\}\}/g, '14h30')
                            .replace(/\{\{rdv\.date\}\}/g, '15/06/2026')
                            .replace(/\{\{rdv\.heure\}\}/g, '14h30')
                            .replace(/\{\{rdv\.adresse\}\}/g, '12 Rue de la Liberte, Casablanca')
                            .replace(/\{\{rdv\.sujet\}\}/g, 'Visite villa')
                          }
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between pt-4 border-t border-border/30">
                      <Button variant="ghost" onClick={() => setWizardStep(2)} icon={<ChevronLeft size={14} />}>Precedent</Button>
                      <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => setShowWizard(false)}>Annuler</Button>
                        <Button onClick={() => {
                          if (!selectedEvent) return
                          const notifications: AddAutomatorInput['notifications'] = []
                          if (recipient === 'agent' || recipient === 'both') {
                            if (agentEmail) notifications.push({ canal: 'email', actif: true, langue: 'fr', messageTemplate: selectedEvent.agentTemplate.emailMessage, destinataires: ['agent'] })
                            if (agentSms) notifications.push({ canal: 'application_mobile', actif: true, langue: 'fr', messageTemplate: selectedEvent.agentTemplate.smsMessage, destinataires: ['agent'] })
                          }
                          if (recipient === 'client' || recipient === 'both') {
                            if (clientEmail && selectedEvent.clientTemplate) notifications.push({ canal: 'email', actif: true, langue: 'fr', messageTemplate: selectedEvent.clientTemplate.emailMessage, destinataires: ['contact'] })
                            if (clientSms && selectedEvent.clientTemplate) notifications.push({ canal: 'application_mobile', actif: true, langue: 'fr', messageTemplate: selectedEvent.clientTemplate.smsMessage, destinataires: ['contact'] })
                          }
                          automatorCtx.addAutomator({
                            modeleId: 0,
                            eventId: selectedEvent.id,
                            niveau: 'utilisateur',
                            niveauLabel: agentName || 'Agent',
                            createdBy: agentName || 'Agent',
                            actif: true,
                            frequence: 'À chaque événement',
                            notifications,
                          })
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
              className="bg-card rounded-xl border border-border/50 shadow-modal w-full max-w-3xl mx-4 my-4 max-h-[80vh] overflow-y-auto scrollbar-thin">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <BarChart2 size={16} className="text-accent" />
                  Logs d'execution &mdash; #{showLogsFor.id}
                </h2>
                <button onClick={() => { setShowLogsFor(null); setLogDetail(null) }} className="p-1.5 rounded-lg hover:bg-background text-text-secondary"><X size={16} /></button>
              </div>
              <div className="p-6 space-y-5">
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-background border-b border-border text-[11px]">
                        <th className="text-left px-3 py-2 font-medium text-text-secondary">Date</th>
                        <th className="text-left px-3 py-2 font-medium text-text-secondary">Evenement</th>
                        <th className="text-left px-3 py-2 font-medium text-text-secondary">Destinataire</th>
                        <th className="text-left px-3 py-2 font-medium text-text-secondary">Statut</th>
                        <th className="text-right px-3 py-2 font-medium text-text-secondary">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {automatorCtx.logs.filter((l: any) => l.automatorId === showLogsFor.id).map(log => (
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
                  <div className="p-4 rounded-xl bg-background border border-border/50 space-y-2">
                    <p className="text-xs font-semibold text-text-secondary">Detail de l'execution</p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div><span className="text-text-secondary">Date :</span> <span className="text-text">{new Date(logDetail.executeLe).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span></div>
                      <div><span className="text-text-secondary">Automator :</span> <span className="text-text">#{showLogsFor.id} &mdash; {getAutomatorEventName(showLogsFor)}</span></div>
                      <div><span className="text-text-secondary">Evenement :</span> <span className="text-text">{logDetail.evenement}</span></div>
                      <div><span className="text-text-secondary">Destinataire :</span> <span className="text-text">{logDetail.destinataire}</span></div>
                    </div>
                    <div className="pt-2 border-t border-border/30">
                      <p className="text-[11px] text-text-secondary mb-1">Notifications envoyees :</p>
                      <div className="text-xs text-text font-mono whitespace-pre-line bg-card p-2 rounded-lg border border-border">
                        {logDetail.contenu || '\u2014'}
                      </div>
                    </div>
                    {logDetail.messageErreur && (
                      <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                        Erreur : {logDetail.messageErreur}
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
                      {detailTarget.clientType ? ` (${CLIENT_TYPE_CONFIG.find((c: any) => c.key === detailTarget.clientType)?.label || detailTarget.clientType})` : ''}
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
                      <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-0.5">{REAL_CLIENT_TYPES.has(detailTarget.clientType) ? 'Type de client' : 'Catégorie'}</p>
                      <p className="font-medium">{(() => { const cfg = CLIENT_TYPE_CONFIG.find((c: any) => c.key === detailTarget.clientType); return cfg?.label || '\u2014' })()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-0.5">Destinataire</p>
                      <p className="font-medium">
                        {detailTarget.recipientType === 'agent' ? 'Agent uniquement' :
                         detailTarget.recipientType === 'client' ? 'Client uniquement' :
                         detailTarget.recipientType === 'both' ? 'Agent + Client' : '\u2014'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-0.5">Frequence</p>
                      <p className="font-medium">{detailTarget.frequence}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-text-secondary uppercase tracking-wider mb-0.5">Cree par</p>
                      <p className="font-medium">{detailTarget.createdBy}</p>
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
                      <p className="font-medium">{detailTarget.niveauLabel}</p>
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
                    {(detailTarget.recipientType === 'client' || detailTarget.recipientType === 'both') && (
                      <div>
                        <p className="text-xs font-medium text-text mb-2 flex items-center gap-1.5">
                          <UserCheck size={12} className="text-emerald-600" />
                          Client{detailTarget.clientType ? ` (${(() => { const cfg = CLIENT_TYPE_CONFIG.find((c: any) => c.key === detailTarget.clientType); return REAL_CLIENT_TYPES.has(detailTarget.clientType) ? cfg?.label : 'Catégorie : ' + (cfg?.label || detailTarget.clientType) })()})` : ''}
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
                    )}
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
                          ?.replace(/\{\{_target\.agent\.nom\}\}/g, agentName)
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
                  <Button variant="ghost" onClick={() => { setDetailTarget(null); setShowLogsFor(detailTarget); setLogDetail(null) }} icon={<BarChart2 size={14} />}>Voir les logs</Button>
                  <Button onClick={() => setDetailTarget(null)}>Fermer</Button>
                </div>
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
