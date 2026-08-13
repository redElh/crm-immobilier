import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Eye, Search, X, ChevronDown, Send, Mail, Calendar,
  BarChart2, Activity, User, Users, Clock, Smartphone,
  Globe, CheckCircle, XCircle, Star, Circle, Radio,
  ChevronRight, TrendingUp, TrendingDown, BarChart,
} from 'react-feather'
import {
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart as RePieChart, Pie,
} from 'recharts'
import Card from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import {
  mockClients, allLogs, getClientLogs, getPropertyViews, STATUS_COLORS,
  computeActivityBadge, ACTIVITY_BADGE_CONFIG,
} from '../../types/extranet'
import type { ExtranetClient, ClientType, ActionType, AccessStatus, ConnectionLog, PropertyView } from '../../types/extranet'

const CURRENT_AGENT = 'Karim Eloui'

const CLIENT_TYPES: ClientType[] = ['Vendeur', 'Acheteur', 'Bailleur', 'Locataire', 'Voyageur']
const ACTION_LABELS: Record<ActionType, string> = {
  Connexion: 'Connexion',
  Visite: 'Visite',
  Proposition: 'Proposition',
  Telechargement: 'Telechargement',
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

function formatDate(d: string) {
  if (!d) return '\u2014'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function formatDateShort(d: string) {
  if (!d) return '\u2014'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatTimeAgo(d: string) {
  if (!d) return 'Jamais'
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "A l'instant"
  if (mins < 60) return `il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  return `il y a ${days}j`
}

function formatTime(d: string) {
  if (!d) return '\u2014'
  return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
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

function ClientActivityBar({ percentage }: { percentage: number }) {
  const color = percentage >= 70 ? '#10B981' : percentage >= 40 ? '#F59E0B' : '#EF4444'
  return (
    <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border/50 rounded-lg shadow-lg p-3 text-xs">
        <p className="font-medium text-text mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-text-secondary" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function AgentExtranetPage() {
  const [search, setSearch] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<ClientType[]>(CLIENT_TYPES)
  const [selectedStatuses, setSelectedStatuses] = useState<AccessStatus[]>(['actif', 'inactif', 'bloque'])
  const [showFilters, setShowFilters] = useState(true)

  const [detailClient, setDetailClient] = useState<ExtranetClient | null>(null)
  const [detailLogs, setDetailLogs] = useState<ConnectionLog[]>([])
  const [detailProperties, setDetailProperties] = useState<PropertyView[]>([])

  const [reminderClient, setReminderClient] = useState<ExtranetClient | null>(null)
  const [sendToAgent, setSendToAgent] = useState(false)

  const agentClients = useMemo(() => {
    return mockClients.filter(c => c.agent === CURRENT_AGENT)
  }, [])

  const filtered = useMemo(() => {
    return agentClients.filter(c => {
      if (search) {
        const q = search.toLowerCase()
        if (!c.name.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q) && !c.product.toLowerCase().includes(q)) return false
      }
      if (!selectedTypes.includes(c.type)) return false
      if (!selectedStatuses.includes(c.status)) return false
      return true
    })
  }, [search, selectedTypes, selectedStatuses, agentClients])

  const activeClients = useMemo(() => filtered.filter(c => c.status === 'actif'), [filtered])
  const inactiveClients = useMemo(() => filtered.filter(c => c.status !== 'actif'), [filtered])

  const stats = useMemo(() => {
    const totalConns = agentClients.reduce((s, c) => s + c.totalConnections, 0)
    const actifs = agentClients.filter(c => c.status === 'actif').length
    const inactifs = agentClients.filter(c => c.status === 'inactif' || c.status === 'bloque').length
    const avgActivity = agentClients.length > 0
      ? Math.round(agentClients.reduce((s, c) => s + (c.activityPercentage || 0), 0) / agentClients.length)
      : 0
    return { totalConns, actifs, inactifs, avgActivity }
  }, [agentClients])

  const repartitionData = useMemo(() => {
    const total = agentClients.length
    if (total === 0) return []
    return CLIENT_TYPES.map(type => {
      const count = agentClients.filter(c => c.type === type).length
      return {
        name: type,
        value: count,
        percentage: Math.round((count / total) * 100),
        fill: CLIENT_TYPE_COLORS[type],
      }
    }).filter(r => r.value > 0)
  }, [agentClients])

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

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Eye size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">SQUAREPEEK</h1>
            <p className="text-sm text-text-secondary">Espionnage commercial &middot; Suivi des activites de vos clients sur Squaremeter</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/5 border border-accent/20 text-xs text-accent font-medium">
          <User size={12} />
          Agent: {CURRENT_AGENT}
        </div>
      </div>

      {/* Personal Stats */}
      <Card className="p-5 border-l-4 border-l-indigo-500">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-4 text-text">
          <BarChart size={14} className="text-indigo-500" />
          Statistiques personnelles
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Clients actifs" value={stats.actifs} sub={`sur ${agentClients.length} clients`} color="emerald" trend={{ value: '+20%', up: true }} />
          <StatCard icon={Activity} label="Connexions ce mois" value={stats.totalConns} sub="Tous clients" color="indigo" trend={{ value: '+30%', up: true }} />
          <StatCard icon={BarChart2} label="Activite moyenne" value={`${stats.avgActivity}%`} sub="Taux d'engagement" color="amber" trend={{ value: '+8%', up: true }} />
          <StatCard icon={Users} label="Clients inactifs" value={stats.inactifs} sub="Sans activite recente" color="red" trend={{ value: '-10%', up: false }} />
        </div>
      </Card>

      {/* Active Clients List */}
      <Card className="p-5 border-l-4 border-l-emerald-500">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-4 text-text">
          <Radio size={14} className="text-emerald-500" />
          Mes clients actives ({activeClients.length})
        </h3>
        <div className="space-y-3">
          {activeClients.length === 0 ? (
            <p className="text-sm text-text-secondary/60 py-8 text-center">Aucun client actif</p>
          ) : (
            activeClients.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-xl border border-border/50 hover:border-emerald-500/30 hover:shadow-md transition-all duration-300 bg-card"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="relative mt-0.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      {c.isLive && (
                        <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-text">{c.name}</p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium text-white" style={{ backgroundColor: CLIENT_TYPE_COLORS[c.type] }}>
                          {c.type}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5">
                        Derniere connexion : {formatTimeAgo(c.lastDate)}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-text-secondary/70">
                        <span className="flex items-center gap-1"><Smartphone size={11} /> {c.lastBrowser}/{c.lastOs}</span>
                        <span className="flex items-center gap-1"><Globe size={11} /> {c.lastIp}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button size="sm" variant="outline" icon={<Eye size={12} />} onClick={() => openDetail(c)}>
                      Voir details
                    </Button>
                    <Button size="sm" variant="outline" icon={<Mail size={12} />} onClick={() => setReminderClient(c)}>
                      Contacter
                    </Button>
                  </div>
                </div>

                {/* Activity details */}
                <div className="mt-3 pt-3 border-t border-border/30">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-text-secondary flex items-center gap-1">
                      <BarChart2 size={10} /> Activite : {c.activityPercentage || 0}%
                    </span>
                    <span className="text-[10px] text-text-secondary/60">
                      {c.pagesConsulted || 0} pages &middot; {c.propertiesViewed || 0} biens consultes
                    </span>
                  </div>
                  <ClientActivityBar percentage={c.activityPercentage || 0} />
                  {c.isLive && c.currentActivity && (
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
                      <Radio size={10} className="animate-pulse" />
                      En direct : {c.currentActivity}
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </Card>

      {/* Inactive Clients */}
      {inactiveClients.length > 0 && (
        <Card className="p-5 border-l-4 border-l-amber-500">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-4 text-text">
            <Clock size={14} className="text-amber-500" />
            Clients inactifs ({inactiveClients.length})
          </h3>
          <div className="space-y-2">
            {inactiveClients.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-background/50 hover:bg-background transition-colors cursor-pointer"
                onClick={() => openDetail(c)}
              >
                <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text">{c.name}</p>
                  <p className="text-[10px] text-text-secondary/60">{c.type} &middot; {c.product}</p>
                </div>
                <span className="text-[10px] text-text-secondary/60">{c.totalConnections} connexions</span>
                <ChevronRight size={14} className="text-text-secondary/40" />
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Activity by Client Type - Recharts */}
      <Card className="p-5 border-l-4 border-l-violet-500">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-4 text-text">
          <BarChart size={14} className="text-violet-500" />
          Activite par type de client
        </h3>
        {repartitionData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={repartitionData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#374151' }} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Clients" radius={[0, 6, 6, 0]} animationDuration={1200} animationBegin={200}>
                  {repartitionData.map((entry, index) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-text-secondary/60 py-8 text-center">Aucune donnee</p>
        )}
      </Card>

      {/* Filters */}
      <Card className="overflow-hidden">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-text"
        >
          <span className="flex items-center gap-2"><Search size={15} className="text-accent" /> Filtres</span>
          <ChevronDown size={15} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="px-5 pb-4 space-y-4 border-t border-border/50 pt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-text-secondary w-24">Type client :</span>
                  {CLIENT_TYPES.map(t => (
                    <button key={t} onClick={() => setSelectedTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
                      className={`px-3 py-1 text-xs rounded-lg border transition-all ${selectedTypes.includes(t) ? 'bg-accent text-white border-accent' : 'bg-card text-text-secondary border-border hover:border-accent/50'}`}>
                      {t}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-text-secondary w-24">Statut acces :</span>
                  {(['actif', 'inactif', 'bloque'] as AccessStatus[]).map(s => (
                    <button key={s} onClick={() => setSelectedStatuses(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                      className={`px-3 py-1 text-xs rounded-lg border capitalize transition-all ${selectedStatuses.includes(s) ? 'bg-accent text-white border-accent' : 'bg-card text-text-secondary border-border hover:border-accent/50'}`}>
                      {s}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-text-secondary w-24">Recherche :</span>
                  <div className="relative flex-1 max-w-sm">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-secondary/60" />
                    <input type="text" placeholder="Nom, email ou produit..." value={search} onChange={e => setSearch(e.target.value)}
                      className="w-full h-8 pl-8 pr-8 text-xs rounded-lg border border-border bg-background text-text placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
                    {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary/60"><X size={12} /></button>}
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button variant="ghost" size="sm" onClick={() => {
                    setSearch(''); setSelectedTypes([...CLIENT_TYPES]); setSelectedStatuses(['actif', 'inactif', 'bloque'])
                  }}>
                    Reinitialiser
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

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
                      <p className="text-[10px] text-text-secondary/60 uppercase tracking-wider mt-1">Temps moyen</p>
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
                              <td className="px-3 py-2 text-[11px] text-text-secondary">{log.browser}/{log.os}</td>
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
                  <Button size="sm" variant="ghost" onClick={closeDetail}>Fermer</Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Send reminder dialog */}
      <Dialog isOpen={!!reminderClient} onClose={() => setReminderClient(null)} title="Envoyer un message" size="lg">
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
              <span className="text-sm text-text-secondary">M'envoyer une copie</span>
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="md" onClick={() => setReminderClient(null)}>Annuler</Button>
              <Button size="md" icon={<Send size={13} />}>Envoyer</Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
