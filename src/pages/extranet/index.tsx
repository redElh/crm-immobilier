import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Eye, BarChart2, Users, Calendar, Clock, PieChart, Download,
  Search, X, ChevronDown, Mail, Lock, Unlock, Slash, User,
  Award, Send, RefreshCw, MoreVertical, Activity, Smartphone,
  Globe, CheckCircle, XCircle, Star, Circle, TrendingUp,
  TrendingDown, Radio, Target, Briefcase, FileText, ChevronLeft,
  ChevronRight,
} from 'react-feather'
import {
  AreaChart, Area, BarChart as ReBarChart, Bar, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import Card from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Dialog } from '../../components/ui/Dialog'
import { Select } from '../../components/ui/Select'
import { DatePicker } from '../../components/ui/DatePicker'
import {
  mockClients, AGENTS, allLogs, generateActivityDays, getClientLogs, getPropertyViews,
  STATUS_COLORS, STATUS_BG, computeActivityBadge, ACTIVITY_BADGE_CONFIG,
} from '../../types/extranet'
import type { ExtranetClient, ClientType, ActionType, AccessStatus, ConnectionLog, ActivityBadge, PropertyView } from '../../types/extranet'

const ACTIONS: ActionType[] = ['Connexion', 'Visite', 'Proposition', 'Telechargement']
const CLIENT_TYPES: ClientType[] = ['Vendeur', 'Acheteur', 'Bailleur', 'Locataire', 'Voyageur']
const ACTION_LABELS: Record<ActionType, string> = {
  Connexion: 'Connexion',
  Visite: 'Visite',
  Proposition: 'Proposition',
  Telechargement: 'Telechargement',
}

function formatDate(d: string) {
  if (!d) return '\u2014'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function formatDateShort(d: string) {
  if (!d) return '\u2014'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatTime(d: string) {
  if (!d) return '\u2014'
  return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const ACTION_COLORS: Record<ActionType, string> = {
  Connexion: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  Visite: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  Proposition: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  Telechargement: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
}

const CLIENT_TYPE_COLORS: Record<ClientType, string> = {
  Vendeur: '#3B82F6',
  Acheteur: '#10B981',
  Bailleur: '#F59E0B',
  Locataire: '#8B5CF6',
  Voyageur: '#F43F5E',
}

const CLIENT_TYPE_BG: Record<ClientType, string> = {
  Vendeur: 'bg-blue-500',
  Acheteur: 'bg-emerald-500',
  Bailleur: 'bg-amber-500',
  Locataire: 'bg-violet-500',
  Voyageur: 'bg-rose-500',
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

function StatCard({ icon: Icon, label, value, sub, trend, color = 'accent' }: {
  icon: any; label: string; value: string | number; sub?: string; trend?: { value: string; up: boolean }; color?: string
}) {
  const colorMap: Record<string, string> = {
    accent: 'bg-accent/10 text-accent',
    emerald: 'bg-emerald-500/10 text-emerald-500',
    indigo: 'bg-indigo-500/10 text-indigo-500',
    amber: 'bg-amber-500/10 text-amber-500',
    red: 'bg-red-500/10 text-red-500',
    violet: 'bg-violet-500/10 text-violet-500',
    blue: 'bg-blue-500/10 text-blue-500',
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
        {sub && <p className="text-[10px] text-text-secondary/60 mt-0.5 truncate">{sub}</p>}
        {trend && (
          <p className={`text-[11px] font-medium mt-0.5 flex items-center gap-1 ${trend.up ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {trend.value}
          </p>
        )}
      </div>
    </Card>
  )
}

interface ActionMenuProps {
  client: ExtranetClient
  onClose: () => void
  onViewDetails: (c: ExtranetClient) => void
  onSendReminder: (c: ExtranetClient) => void
  onBlockToggle: (c: ExtranetClient) => void
  onResetPassword: (c: ExtranetClient) => void
}

function ActionMenu({ client, onClose, onViewDetails, onSendReminder, onBlockToggle, onResetPassword }: ActionMenuProps) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -4 }}
        transition={{ duration: 0.12 }}
        className="absolute right-0 top-full mt-1 z-50 w-56 bg-card border border-border/50 rounded-xl shadow-dropdown py-1 overflow-hidden"
      >
        <button onClick={() => { onViewDetails(client); onClose() }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-text hover:bg-background transition-colors">
          <Eye size={14} className="text-text-secondary" />
          Voir details
        </button>
        <button onClick={() => { onSendReminder(client); onClose() }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-text hover:bg-background transition-colors">
          <Mail size={14} className="text-text-secondary" />
          Envoyer un rappel
        </button>
        <button onClick={() => { onResetPassword(client); onClose() }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-text hover:bg-background transition-colors">
          <RefreshCw size={14} className="text-text-secondary" />
          Reinitialiser mot de passe
        </button>
        <div className="h-px bg-border/50 my-1" />
        <button onClick={() => { onBlockToggle(client); onClose() }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
          {client.status === 'bloque' ? (
            <><Unlock size={14} /> Reactiver l'acces</>
          ) : (
            <><Slash size={14} /> Bloquer l'acces</>
          )}
        </button>
      </motion.div>
    </>
  )
}

const ChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border/50 rounded-lg shadow-lg p-3 text-xs">
        <p className="font-medium text-text mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

const PieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border/50 rounded-lg shadow-lg p-3 text-xs">
        <p className="font-medium text-text">{payload[0].name}</p>
        <p className="text-text-secondary">{payload[0].value} clients ({payload[0].payload.percentage}%)</p>
      </div>
    )
  }
  return null
}

export default function ExtranetPage() {
  const [search, setSearch] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<ClientType[]>(CLIENT_TYPES)
  const [selectedStatuses, setSelectedStatuses] = useState<AccessStatus[]>(['actif', 'inactif', 'bloque'])
  const [selectedActions, setSelectedActions] = useState<ActionType[]>(ACTIONS)
  const [selectedAgent, setSelectedAgent] = useState('')
  const [period, setPeriod] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(true)
  const [actionMenuClient, setActionMenuClient] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const [detailClient, setDetailClient] = useState<ExtranetClient | null>(null)
  const [detailLogs, setDetailLogs] = useState<ConnectionLog[]>([])
  const [detailProperties, setDetailProperties] = useState<PropertyView[]>([])

  const [reminderClient, setReminderClient] = useState<ExtranetClient | null>(null)
  const [sendToAgent, setSendToAgent] = useState(false)

  const [blockConfirmClient, setBlockConfirmClient] = useState<ExtranetClient | null>(null)

  const toggleFilter = <T,>(arr: T[], val: T, setter: (v: T[]) => void) => {
    setter(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])
  }

  const filtered = useMemo(() => {
    return mockClients.filter(c => {
      if (search) {
        const q = search.toLowerCase()
        if (!c.name.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q) && !c.product.toLowerCase().includes(q)) return false
      }
      if (!selectedTypes.includes(c.type)) return false
      if (!selectedStatuses.includes(c.status)) return false
      if (selectedAgent && c.agent !== selectedAgent) return false
      if (period === 'today') {
        const today = new Date().toISOString().slice(0, 10)
        if (c.lastDate && c.lastDate.slice(0, 10) !== today && c.totalConnections > 0) return false
      }
      if (period === 'week') {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        if (c.lastDate && new Date(c.lastDate) < weekAgo) return false
      }
      if (period === 'month') {
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        if (c.lastDate && new Date(c.lastDate) < monthAgo) return false
      }
      if (dateFrom && c.lastDate && c.lastDate < dateFrom) return false
      if (dateTo && c.lastDate && c.lastDate > dateTo) return false
      return true
    })
  }, [search, selectedTypes, selectedStatuses, selectedActions, selectedAgent, period, dateFrom, dateTo])

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const connexionsThisMonth = allLogs.filter(l => l.date >= monthStart).length
  const clientsActifs = mockClients.filter(c => c.status === 'actif').length
  const clientsInactifs = mockClients.filter(c => c.status === 'inactif').length
  const todayStart = new Date().toISOString().slice(0, 10)
  const connexionsToday = allLogs.filter(l => l.date.startsWith(todayStart)).length

  const avgTimeOnSite = useMemo(() => {
    const activeClients = mockClients.filter(c => (c.avgTimeOnSite || 0) > 0)
    if (activeClients.length === 0) return 0
    return Math.round(activeClients.reduce((s, c) => s + (c.avgTimeOnSite || 0), 0) / activeClients.length)
  }, [])

  const totalBiensConsultes = useMemo(() =>
    mockClients.reduce((s, c) => s + (c.propertiesViewed || 0), 0), [])

  const demandesGenerees = useMemo(() =>
    mockClients.filter(c => c.lastAction === 'Proposition').length, [])

  const tauxActivation = Math.round((clientsActifs / mockClients.length) * 100)

  const activityDays = useMemo(() => generateActivityDays(), [])

  const chartData = useMemo(() =>
    activityDays.map(d => ({
      name: d.shortDay,
      Connexions: d.connexions,
      Visites: d.visites,
      Propositions: d.propositions,
      Telechargements: d.telechargements,
    })), [activityDays])

  const totalThisWeek = activityDays.reduce((s, d) => s + d.connexions + d.visites + d.propositions + d.telechargements, 0)

  const repartitionData = useMemo(() => {
    const total = mockClients.length
    if (total === 0) return []
    return CLIENT_TYPES.map(type => {
      const count = mockClients.filter(c => c.type === type).length
      return {
        name: type,
        value: count,
        percentage: Math.round((count / total) * 100),
        fill: CLIENT_TYPE_COLORS[type],
      }
    }).filter(r => r.value > 0)
  }, [])

  const topClients = useMemo(() => {
    return [...mockClients]
      .filter(c => c.totalConnections > 0)
      .sort((a, b) => b.totalConnections - a.totalConnections)
      .slice(0, 5)
      .map((c, i) => ({ rank: i + 1, ...c }))
  }, [])

  const topClientsBarData = useMemo(() =>
    topClients.map(c => ({ name: c.name.split(' ')[0], connexions: c.totalConnections })), [topClients])

  const openDetail = useCallback((c: ExtranetClient) => {
    setDetailClient(c)
    setDetailLogs(getClientLogs(c.id))
    setDetailProperties(getPropertyViews(c.id))
  }, [])

  const closeDetail = useCallback(() => {
    setDetailClient(null)
    setDetailLogs([])
    setDetailProperties([])
  }, [])

  const exportCsv = useCallback(() => {
    const headers = ['Contact', 'Email', 'Type', 'Produit', 'Statut', 'Acces', 'Derniere action', 'Derniere date', 'Agent', 'Activite']
    const rows = filtered.map(c => [
      `"${c.name}"`, `"${c.email}"`, `"${c.type}"`, `"${c.product}"`,
      `"${c.status}"`, c.totalConnections.toString(), `"${c.lastAction}"`,
      `"${formatDateShort(c.lastDate)}"`, `"${c.agent}"`,
      `"${ACTIVITY_BADGE_CONFIG[computeActivityBadge(c.totalConnections, c.status)].label}"`,
    ].join(','))
    const csv = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'squarepeek_connexions.csv'; a.click()
    URL.revokeObjectURL(url)
  }, [filtered])

  const totalConns = filtered.reduce((s, c) => s + c.totalConnections, 0)
  const ITEMS_PER_PAGE = 10
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginatedClients = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Eye size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">SQUAREPEEK &mdash; ADMIN</h1>
            <p className="text-sm text-text-secondary">Analyse globale des activites clients sur Squaremeter</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<Download size={13} />} onClick={exportCsv}>
            Exporter CSV
          </Button>
        </div>
      </div>

      {/* Global Stats - Row 1 */}
      <Card className="p-5 border-l-4 border-l-indigo-500">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-4 text-text">
          <BarChart2 size={14} className="text-indigo-500" />
          Statistiques globales
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total clients" value={mockClients.length} sub="Tous confondus" color="indigo" trend={{ value: '+15%', up: true }} />
          <StatCard icon={Activity} label="Clients actifs" value={clientsActifs} sub={`sur ${mockClients.length}`} color="emerald" trend={{ value: '+20%', up: true }} />
          <StatCard icon={BarChart2} label="Connexions ce mois" value={connexionsThisMonth} sub="Tous clients" color="amber" trend={{ value: '+35%', up: true }} />
          <StatCard icon={Clock} label="Temps moyen sur site" value={`${avgTimeOnSite} min`} sub="Duree moyenne" color="violet" trend={{ value: '+4 min', up: true }} />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          <StatCard icon={Target} label="Taux d'activation" value={`${tauxActivation}%`} sub="Clients actifs / total" color="emerald" trend={{ value: '+5%', up: true }} />
          <StatCard icon={Briefcase} label="Biens Consultes" value={totalBiensConsultes} sub="Total sur la plateforme" color="blue" trend={{ value: '+18%', up: true }} />
          <StatCard icon={FileText} label="Demandes generees" value={demandesGenerees} sub="Propositions envoyees" color="accent" trend={{ value: '+12%', up: true }} />
        </div>
      </Card>

      {/* Connection Evolution Chart */}
      <Card className="p-5 border-l-4 border-l-emerald-500">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Activity size={14} className="text-emerald-500" />
            Evolution des connexions (7 derniers jours)
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-lg">
            <TrendingUp size={12} />
            +35% vs semaine derniere
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorConnexions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorVisites" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPropositions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Area type="monotone" dataKey="Connexions" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#colorConnexions)" animationDuration={1500} />
              <Area type="monotone" dataKey="Visites" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorVisites)" animationDuration={1500} animationBegin={300} />
              <Area type="monotone" dataKey="Propositions" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#colorPropositions)" animationDuration={1500} animationBegin={600} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-text-secondary">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500" /> Connexions</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Visites</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Propositions</span>
          <span className="ml-auto font-medium">Total: {totalThisWeek} actions cette semaine</span>
        </div>
      </Card>

      {/* Filters */}
      <Card className="overflow-hidden">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-text"
        >
          <span className="flex items-center gap-2"><Search size={15} className="text-accent" /> Filtres et recherche</span>
          <ChevronDown size={15} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="px-5 pb-4 space-y-4 border-t border-border/50 pt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-text-secondary w-24">Recherche :</span>
                  <div className="relative flex-1 max-w-sm">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary/60" />
                    <input type="text" placeholder="Nom, email ou produit..." value={search} onChange={e => setSearch(e.target.value)}
                      className="w-full h-8 pl-8 pr-8 text-xs rounded-lg border border-border bg-background text-text placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
                    {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary/60"><X size={12} /></button>}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-text-secondary w-24">Type client :</span>
                  {CLIENT_TYPES.map(t => (
                    <button key={t} onClick={() => toggleFilter(selectedTypes, t, setSelectedTypes)}
                      className={`px-3 py-1 text-xs rounded-lg border transition-all ${selectedTypes.includes(t) ? 'bg-accent text-white border-accent' : 'bg-card text-text-secondary border-border hover:border-accent/50'}`}>
                      {t}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-text-secondary w-24">Periode :</span>
                  {[
                    { value: 'all', label: 'Tout' },
                    { value: 'today', label: "Aujourd'hui" },
                    { value: 'week', label: 'Cette semaine' },
                    { value: 'month', label: 'Ce mois' },
                  ].map(p => (
                    <button key={p.value} onClick={() => setPeriod(p.value)}
                      className={`px-3 py-1 text-xs rounded-lg border transition-all ${period === p.value ? 'bg-accent text-white border-accent' : 'bg-card text-text-secondary border-border hover:border-accent/50'}`}>
                      {p.label}
                    </button>
                  ))}
                  <DatePicker value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-[140px]" />
                  <span className="text-text-secondary text-xs">-</span>
                  <DatePicker value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-[140px]" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-text-secondary w-24">Agent :</span>
                  <Select
                    value={selectedAgent}
                    onChange={(val: string) => setSelectedAgent(val)}
                    options={[{ value: '', label: 'Tous les agents' }, ...AGENTS.map(a => ({ value: a, label: a }))]}
                    className="min-w-[140px]"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-text-secondary w-24">Statut acces :</span>
                  {(['actif', 'inactif', 'bloque'] as AccessStatus[]).map(s => (
                    <button key={s} onClick={() => toggleFilter(selectedStatuses, s, setSelectedStatuses)}
                      className={`px-3 py-1 text-xs rounded-lg border capitalize transition-all ${selectedStatuses.includes(s) ? 'bg-accent text-white border-accent' : 'bg-card text-text-secondary border-border hover:border-accent/50'}`}>
                      {s}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-text-secondary w-24">Action :</span>
                  {ACTIONS.map(a => (
                    <button key={a} onClick={() => toggleFilter(selectedActions, a, setSelectedActions)}
                      className={`px-3 py-1 text-xs rounded-lg border transition-all ${selectedActions.includes(a) ? 'bg-accent text-white border-accent' : 'bg-card text-text-secondary border-border hover:border-accent/50'}`}>
                      {ACTION_LABELS[a]}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <Button variant="ghost" size="sm" onClick={() => {
                    setSearch(''); setSelectedTypes([...CLIENT_TYPES]); setSelectedStatuses(['actif', 'inactif', 'bloque'])
                    setSelectedActions([...ACTIONS]); setSelectedAgent(''); setPeriod('all'); setDateFrom(''); setDateTo('')
                  }}>
                    Reinitialiser
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Connections Table */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
          <p className="text-sm font-medium flex items-center gap-2">
            <Activity size={14} className="text-accent" />
            Tableau des connexions
            <span className="text-xs text-text-secondary font-normal">({filtered.length} client{filtered.length > 1 ? 's' : ''})</span>
          </p>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-background border-b border-border/50 text-[11px]">
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary">Contact</th>
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary">Produit</th>
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary">Type</th>
                <th className="text-center px-4 py-2.5 font-medium text-text-secondary">Acces</th>
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary">Activite</th>
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary">Derniere action</th>
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary">Agent</th>
                <th className="w-10 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {paginatedClients.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-16 text-center text-text-secondary text-sm">Aucun resultat</td></tr>
              ) : (
                paginatedClients.map((c, i) => {
                  const badge = computeActivityBadge(c.totalConnections, c.status)
                  const badgeCfg = ACTIVITY_BADGE_CONFIG[badge]
                  const isMenuOpen = actionMenuClient === c.id
                  return (
                    <motion.tr key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      className="hover:bg-background/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {c.status === 'actif' ? (
                            <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                          ) : c.status === 'inactif' ? (
                            <Clock size={14} className="text-amber-400 flex-shrink-0" />
                          ) : (
                            <XCircle size={14} className="text-red-500 flex-shrink-0" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-text">{c.name}</p>
                            <p className="text-[10px] text-text-secondary/60 font-mono">{c.lastIp}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-text">{c.product}</p>
                        {c.lastBrowser !== '-' && <p className="text-[10px] text-text-secondary/60 flex items-center gap-1"><Smartphone size={9} /> {c.lastBrowser}/{c.lastOs}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] px-2 py-0.5 rounded-md font-medium text-white ${CLIENT_TYPE_BG[c.type]}`}>
                          {c.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-semibold ${STATUS_COLORS[c.status]}`}>{c.totalConnections}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${badgeCfg.color} ${badgeCfg.bg}`}>
                          {badgeCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {c.lastDate ? (
                          <div>
                            <p className="text-sm text-text">{formatDate(c.lastDate)}</p>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${ACTION_COLORS[c.lastAction]}`}>
                              {ACTION_LABELS[c.lastAction]}
                            </span>
                          </div>
                        ) : (
                          <span className="text-text-secondary/60 text-xs">Jamais</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary">{c.agent}</td>
                      <td className="px-4 py-3 text-right relative">
                        <button onClick={e => { e.stopPropagation(); setActionMenuClient(isMenuOpen ? null : c.id) }}
                          className="p-1.5 rounded-lg hover:bg-background text-text-secondary hover:text-text transition-all">
                          <MoreVertical size={14} />
                        </button>
                        {isMenuOpen && (
                          <ActionMenu
                            client={c}
                            onClose={() => setActionMenuClient(null)}
                            onViewDetails={openDetail}
                            onSendReminder={setReminderClient}
                            onBlockToggle={setBlockConfirmClient}
                            onResetPassword={() => {}}
                          />
                        )}
                      </td>
                    </motion.tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 border-t border-border/30 flex items-center justify-between text-[10px] text-text-secondary/60">
          <span>{filtered.length} client{filtered.length > 1 ? 's' : ''} &middot; {totalConns} connexions</span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={12} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-5 h-5 rounded text-[10px] font-medium transition-colors ${currentPage === page ? 'bg-accent text-white' : 'hover:bg-background'}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={12} />
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Bottom grid: Top clients + Repartition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Active Clients with Recharts */}
        <Card className="p-5 border-l-4 border-l-amber-500">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
            <Award size={14} className="text-amber-500" />
            Top clients les plus actifs
          </h3>
          {topClientsBarData.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart data={topClientsBarData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#6B7280' }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#374151' }} width={70} />
                  <Tooltip content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const client = topClients.find(c => c.name.startsWith(payload[0].payload.name))
                      return (
                        <div className="bg-card border border-border/50 rounded-lg shadow-lg p-3 text-xs">
                          <p className="font-medium text-text">{client?.name || payload[0].payload.name}</p>
                          <p className="text-text-secondary">{payload[0].value} connexions</p>
                          {client && <p className="text-text-secondary/60">Agent: {client.agent}</p>}
                        </div>
                      )
                    }
                    return null
                  }} />
                  <Bar dataKey="connexions" name="Connexions" radius={[0, 6, 6, 0]} animationDuration={1200} animationBegin={200}>
                    {topClientsBarData.map((_, index) => (
                      <Cell key={index} fill={index === 0 ? '#F59E0B' : index === 1 ? '#94A3B8' : index === 2 ? '#B45309' : '#6366F1'} />
                    ))}
                  </Bar>
                </ReBarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-text-secondary/60 py-8 text-center">Aucune donnee</p>
          )}
          {/* Ranked list below chart */}
          <div className="mt-4 space-y-2">
            {topClients.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-background transition-colors">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white ${
                  i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-amber-700' : 'bg-indigo-400'
                }`}>
                  {c.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-text truncate">{c.name}</p>
                  <p className="text-[10px] text-text-secondary/60">{c.type} &middot; Agent: {c.agent}</p>
                </div>
                <span className="text-xs font-bold text-accent">{c.totalConnections}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Client Type Repartition - Recharts Pie */}
        <Card className="p-5 border-l-4 border-l-violet-500">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
            <PieChart size={14} className="text-violet-500" />
            Repartition par type de client
          </h3>
          {repartitionData.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={repartitionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    animationDuration={1200}
                    animationBegin={200}
                    label={({ name, percent }: any) => `${name} ${Math.round(percent * 100)}%`}
                    labelLine={false}
                  >
                    {repartitionData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-text-secondary/60 py-8 text-center">Aucune donnee</p>
          )}
          {/* Legend */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {repartitionData.map(r => (
              <div key={r.name} className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: r.fill }} />
                <span className="text-text font-medium">{r.name}</span>
                <span className="text-text-secondary ml-auto">{r.value} ({r.percentage}%)</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {detailClient && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black/40 backdrop-blur-sm"
            onClick={closeDetail}>
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }}
              onClick={e => e.stopPropagation()}
              className="bg-card rounded-xl border border-border/50 shadow-xl w-full max-w-3xl mx-4 max-h-[80vh] overflow-y-auto scrollbar-thin">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                <div>
                  <h2 className="text-base font-semibold flex items-center gap-2">
                    <Eye size={16} className="text-indigo-500" />
                    SQUAREPEEK &mdash; Detail Client
                  </h2>
                  <p className="text-xs text-text-secondary mt-0.5">{detailClient.name} &middot; {detailClient.type}</p>
                </div>
                <button onClick={closeDetail} className="p-1.5 rounded-lg hover:bg-background text-text-secondary hover:text-text transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="p-6 space-y-5">
                {/* Global Activity Stats */}
                <Card className="p-4 border-l-4 border-l-indigo-500">
                  <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Activity size={12} className="text-indigo-500" />
                    Activite globale
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 rounded-lg bg-background">
                      <p className="text-xl font-bold text-text"><AnimatedCounter value={detailClient.totalConnections} /></p>
                      <p className="text-[10px] text-text-secondary/60 uppercase tracking-wider mt-1">Connexions totales</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-background">
                      <p className="text-xl font-bold text-text">{detailClient.avgTimeOnSite || 0} min</p>
                      <p className="text-[10px] text-text-secondary/60 uppercase tracking-wider mt-1">Temps moyen sur site</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-background">
                      <p className="text-xl font-bold text-text"><AnimatedCounter value={detailClient.pagesConsulted || 0} /></p>
                      <p className="text-[10px] text-text-secondary/60 uppercase tracking-wider mt-1">Pages consultees</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-background">
                      <p className="text-xl font-bold text-text"><AnimatedCounter value={detailClient.propertiesViewed || 0} /></p>
                      <p className="text-[10px] text-text-secondary/60 uppercase tracking-wider mt-1">Biens consultes</p>
                    </div>
                  </div>
                </Card>

                {/* Connection History */}
                <div>
                  <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Clock size={12} className="text-accent" />
                    Historique des connexions
                  </h3>
                  {detailLogs.length === 0 ? (
                    <p className="text-sm text-text-secondary/60 py-4 text-center">Aucun historique de connexion</p>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-background border-b border-border text-[11px]">
                            <th className="text-left px-3 py-2 font-medium text-text-secondary">Date</th>
                            <th className="text-left px-3 py-2 font-medium text-text-secondary">Duree</th>
                            <th className="text-left px-3 py-2 font-medium text-text-secondary">Pages</th>
                            <th className="text-left px-3 py-2 font-medium text-text-secondary">Action</th>
                            <th className="text-left px-3 py-2 font-medium text-text-secondary">Appareil</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {detailLogs.slice(0, 10).map(log => (
                            <tr key={log.id} className="hover:bg-background/50">
                              <td className="px-3 py-2 text-xs text-text">
                                {new Date(log.date).toLocaleDateString('fr-FR')} {formatTime(log.date)}
                              </td>
                              <td className="px-3 py-2 text-xs text-text-secondary">{log.duration || '-'} min</td>
                              <td className="px-3 py-2 text-xs text-text-secondary">{log.pagesViewed || '-'}</td>
                              <td className="px-3 py-2">
                                <span className={`text-[11px] px-2 py-0.5 rounded border ${ACTION_COLORS[log.action]}`}>
                                  {ACTION_LABELS[log.action]}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-[11px] text-text-secondary flex items-center gap-1">
                                <Smartphone size={10} /> {log.browser}/{log.os}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Properties Consulted */}
                {detailProperties.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Globe size={12} className="text-accent" />
                      Biens consultes par le client
                    </h3>
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-background border-b border-border text-[11px]">
                            <th className="text-left px-3 py-2 font-medium text-text-secondary">Bien</th>
                            <th className="text-center px-3 py-2 font-medium text-text-secondary">Vues</th>
                            <th className="text-left px-3 py-2 font-medium text-text-secondary">Derniere vue</th>
                            <th className="text-center px-3 py-2 font-medium text-text-secondary">Favori</th>
                            <th className="text-center px-3 py-2 font-medium text-text-secondary">Contact demande</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {detailProperties.map(pv => (
                            <tr key={pv.id} className="hover:bg-background/50">
                              <td className="px-3 py-2 text-xs font-medium text-text">{pv.propertyName}</td>
                              <td className="px-3 py-2 text-xs text-text-secondary text-center">{pv.views}</td>
                              <td className="px-3 py-2 text-xs text-text-secondary">{formatDateShort(pv.lastViewed)}</td>
                              <td className="px-3 py-2 text-center">
                                {pv.isFavorite ? (
                                  <Star size={13} className="text-amber-500 fill-amber-500 inline" />
                                ) : (
                                  <Circle size={13} className="text-text-secondary/30 inline" />
                                )}
                              </td>
                              <td className="px-3 py-2 text-center">
                                {pv.contactRequested ? (
                                  <CheckCircle size={13} className="text-emerald-500 inline" />
                                ) : (
                                  <XCircle size={13} className="text-text-secondary/30 inline" />
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border/30">
                  <Button size="sm" icon={<Mail size={13} />} onClick={() => { closeDetail(); setReminderClient(detailClient) }}>
                    Envoyer un message
                  </Button>
                  <Button size="sm" variant="outline" icon={<Calendar size={13} />}>
                    Programmer un rappel
                  </Button>
                  <Button size="sm" variant="outline" icon={<BarChart2 size={13} />}>
                    Voir les statistiques
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={detailClient.status === 'bloque' ? <Unlock size={13} /> : <Slash size={13} />}
                    className={detailClient.status === 'bloque' ? 'text-emerald-600' : 'text-red-500'}
                    onClick={() => { closeDetail(); setBlockConfirmClient(detailClient) }}
                  >
                    {detailClient.status === 'bloque' ? "Reactiver l'acces" : "Bloquer l'acces"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={closeDetail}>Fermer</Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Send reminder dialog */}
      <Dialog isOpen={!!reminderClient} onClose={() => setReminderClient(null)} title="Envoyer un rappel de connexion" size="lg">
        {reminderClient && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-background border border-border/50 text-sm">
              <div>
                <span className="text-[10px] text-text-secondary/60 uppercase tracking-wider">Client</span>
                <p className="text-text font-medium">{reminderClient.name}</p>
              </div>
              <div>
                <span className="text-[10px] text-text-secondary/60 uppercase tracking-wider">Type</span>
                <p className="text-text font-medium">{reminderClient.type}</p>
              </div>
              <div>
                <span className="text-[10px] text-text-secondary/60 uppercase tracking-wider">Derniere connexion</span>
                <p className="text-text font-medium">{reminderClient.lastDate ? formatDateShort(reminderClient.lastDate) : 'Jamais'}</p>
              </div>
              <div>
                <span className="text-[10px] text-text-secondary/60 uppercase tracking-wider">Statut</span>
                <p className={`text-sm font-medium capitalize ${STATUS_COLORS[reminderClient.status]}`}>{reminderClient.status}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-text-secondary mb-2">Message :</p>
              <div className="p-4 rounded-lg bg-background border border-border/50 text-sm text-text leading-relaxed">
                <p>Bonjour {reminderClient.name},</p>
                <br />
                <p>Nous avons remarque que vous n'avez pas encore active votre espace client.</p>
                <p>Connectez-vous des maintenant pour :</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Consulter les informations de votre bien</li>
                  <li>Acceder a vos documents</li>
                  <li>Suivre vos transactions</li>
                </ul>
                <br />
                <p>Lien de connexion : <span className="text-accent font-medium">https://espace.squaremeter.ma</span></p>
                <br />
                <p>Cordialement,</p>
                <p>L'equipe Square Meter</p>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={sendToAgent} onChange={e => setSendToAgent(e.target.checked)}
                className="rounded border-border text-accent focus:ring-accent/20" />
              <span className="text-sm text-text-secondary">Envoyer une copie a l'agent responsable ({reminderClient.agent})</span>
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="md" onClick={() => setReminderClient(null)}>Annuler</Button>
              <Button size="md" icon={<Send size={13} />}>Envoyer</Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Block/Reactivate confirm dialog */}
      <Dialog
        isOpen={!!blockConfirmClient}
        onClose={() => setBlockConfirmClient(null)}
        title={blockConfirmClient?.status === 'bloque' ? "Reactiver l'acces" : "Bloquer l'acces"}
        size="sm"
      >
        {blockConfirmClient && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              {blockConfirmClient.status === 'bloque'
                ? `Voulez-vous vraiment reactiver l'acces de ${blockConfirmClient.name} ?`
                : `Voulez-vous vraiment bloquer l'acces de ${blockConfirmClient.name} ?`
              }
            </p>
            <p className="text-xs text-text-secondary/60">
              Client: {blockConfirmClient.name} &middot; {blockConfirmClient.type} &middot; Agent: {blockConfirmClient.agent}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="md" onClick={() => setBlockConfirmClient(null)}>Annuler</Button>
              <Button
                size="md"
                variant={blockConfirmClient.status === 'bloque' ? 'default' : 'danger'}
                icon={blockConfirmClient.status === 'bloque' ? <Unlock size={13} /> : <Slash size={13} />}
              >
                {blockConfirmClient.status === 'bloque' ? 'Reactiver' : 'Bloquer'}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
