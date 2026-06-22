import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe, BarChart2, Users, Calendar, Clock, PieChart, Download,
  Search, X, ChevronDown, Mail, Lock, Unlock, Slash, Eye, User,
  Award, Send, RefreshCw,
  MoreVertical, Activity,
} from 'react-feather'
import Card from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Dialog } from '../../components/ui/Dialog'
import { Select } from '../../components/ui/Select'
import { DatePicker } from '../../components/ui/DatePicker'
import {
  mockClients, AGENTS, allLogs, generateActivityDays, getClientLogs,
  STATUS_COLORS, STATUS_BG, computeActivityBadge, ACTIVITY_BADGE_CONFIG,
} from '../../types/extranet'
import type { ExtranetClient, ClientType, ActionType, AccessStatus, ConnectionLog, ActivityBadge } from '../../types/extranet'

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
  Vendeur: 'bg-blue-500',
  Acheteur: 'bg-emerald-500',
  Bailleur: 'bg-amber-500',
  Locataire: 'bg-violet-500',
  Voyageur: 'bg-rose-500',
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
          <Send size={14} className="text-text-secondary" />
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

function StatCard({ icon: Icon, label, value, sub, trend }: { icon: any; label: string; value: string; sub?: string; trend?: { value: string; up: boolean } }) {
  return (
    <Card className="p-4 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
        <Icon size={20} className="text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-bold text-text">{value}</p>
        <p className="text-xs text-text-secondary truncate">{label}</p>
        {sub && <p className="text-[10px] text-text-secondary/60 mt-0.5 truncate">{sub}</p>}
        {trend && (
          <p className={`text-[11px] font-medium mt-0.5 flex items-center gap-1 ${trend.up ? 'text-emerald-600' : 'text-red-500'}`}>
            <span>{trend.up ? '\u2191' : '\u2193'}</span>
            {trend.value}
          </p>
        )}
      </div>
    </Card>
  )
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

  const [detailClient, setDetailClient] = useState<ExtranetClient | null>(null)
  const [detailLogs, setDetailLogs] = useState<ConnectionLog[]>([])

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

  const activityDays = useMemo(() => generateActivityDays(), [])

  const maxVal = useMemo(() => Math.max(1, ...activityDays.flatMap(d => [d.connexions, d.visites, d.propositions, d.telechargements])), [activityDays])

  const repartition = useMemo(() => {
    const total = mockClients.length
    if (total === 0) return []
    return CLIENT_TYPES.map(type => {
      const count = mockClients.filter(c => c.type === type).length
      return {
        type,
        count,
        percentage: Math.round((count / total) * 100),
        color: CLIENT_TYPE_COLORS[type],
      }
    }).filter(r => r.count > 0)
  }, [])

  const topClients = useMemo(() => {
    return [...mockClients]
      .filter(c => c.totalConnections > 0)
      .sort((a, b) => b.totalConnections - a.totalConnections)
      .slice(0, 5)
      .map((c, i) => ({ rank: i + 1, ...c }))
  }, [])

  const openDetail = useCallback((c: ExtranetClient) => {
    setDetailClient(c)
    setDetailLogs(getClientLogs(c.id))
  }, [])

  const closeDetail = useCallback(() => {
    setDetailClient(null)
    setDetailLogs([])
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
    a.href = url; a.download = 'extranet_connexions.csv'; a.click()
    URL.revokeObjectURL(url)
  }, [filtered])

  const totalConns = filtered.reduce((s, c) => s + c.totalConnections, 0)
  const totalThisWeek = activityDays.reduce((s, d) => s + d.connexions + d.visites + d.propositions + d.telechargements, 0)

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Globe size={20} className="text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Surveillance Extranet</h1>
            <p className="text-sm text-text-secondary">Suivi des connexions des clients sur leur espace personnel</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<Download size={13} />} onClick={exportCsv}>
            Exporter CSV
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={BarChart2} label="Connexions ce mois" value={connexionsThisMonth.toString()} sub="Tous clients confondus" trend={{ value: '+18%', up: true }} />
        <StatCard icon={Users} label="Clients actifs" value={clientsActifs.toString()} sub={`sur ${mockClients.length} clients`} trend={{ value: '+12%', up: true }} />
        <StatCard icon={Calendar} label="Aujourd'hui" value={connexionsToday.toString()} sub="Dernieres 24h" trend={{ value: '-5%', up: false }} />
        <StatCard icon={Users} label="Clients inactifs" value={clientsInactifs.toString()} sub="Sans connexion" />
        <StatCard icon={Clock} label="Temps moyen sur site" value="12 min" sub="Duree moyenne par session" trend={{ value: '+2 min', up: true }} />
        <StatCard icon={PieChart} label="Taux d'activation" value={`${Math.round((clientsActifs / mockClients.length) * 100)}%`} sub="Clients actifs / total" trend={{ value: '+5%', up: true }} />
      </div>

      {/* Activity graph */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <BarChart2 size={14} className="text-accent" />
            Evolution des connexions (7 derniers jours)
          </h3>
          <span className="text-xs text-text-secondary/60">
            Total: {totalThisWeek} actions cette semaine
          </span>
        </div>
        <div className="space-y-3">
          {[
            { key: 'connexions' as const, label: 'Connexions', color: 'bg-indigo-500' },
            { key: 'visites' as const, label: 'Visites', color: 'bg-emerald-500' },
            { key: 'propositions' as const, label: 'Propositions', color: 'bg-amber-500' },
            { key: 'telechargements' as const, label: 'Telechargements', color: 'bg-violet-500' },
          ].map(row => {
            const vals = activityDays.map(d => d[row.key])
            const total = vals.reduce((a, b) => a + b, 0)
            return (
              <div key={row.key} className="flex items-center gap-3">
                <span className="text-xs text-text-secondary w-28 shrink-0">{row.label} :</span>
                <div className="flex-1 flex items-center gap-0.5 h-5">
                  {vals.map((v, i) => (
                    <div key={i} className="flex-1 h-full flex items-end">
                      <div
                        className={`w-full ${row.color} rounded-sm transition-all min-h-[4px]`}
                        style={{ height: `${Math.max(8, (v / maxVal) * 100)}%` }}
                      />
                    </div>
                  ))}
                </div>
                <span className="text-xs font-semibold text-text w-8 text-right">{total}</span>
              </div>
            )
          })}
        </div>
        <div className="flex gap-2 mt-3 text-[10px] text-text-secondary/60">
          {activityDays.map(d => (
            <span key={d.day} className="flex-1 text-center">{d.shortDay}</span>
          ))}
        </div>
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

      {/* Table */}
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
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-16 text-center text-text-secondary text-sm">Aucun resultat</td></tr>
              ) : (
                filtered.map((c, i) => {
                  const badge = computeActivityBadge(c.totalConnections, c.status)
                  const badgeCfg = ACTIVITY_BADGE_CONFIG[badge]
                  const isMenuOpen = actionMenuClient === c.id
                  return (
                    <motion.tr key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      className="hover:bg-background/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${c.status === 'actif' ? 'bg-emerald-500' : c.status === 'inactif' ? 'bg-amber-400' : 'bg-red-500'}`} />
                          <div>
                            <p className="text-sm font-medium text-text">{c.name}</p>
                            <p className="text-[10px] text-text-secondary/60 font-mono">{c.lastIp}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-text">{c.product}</p>
                        {c.lastBrowser !== '-' && <p className="text-[10px] text-text-secondary/60">{c.lastBrowser}/{c.lastOs}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] px-2 py-0.5 rounded-md font-medium text-white ${CLIENT_TYPE_COLORS[c.type]}`}>
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
        </div>
      </Card>

      {/* Bottom grid: Repartition + Top clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Repartition by type */}
        <Card className="p-5">
          <h3 className="text-sm font-medium flex items-center gap-2 mb-4">
            <PieChart size={14} className="text-accent" />
            Repartition par type de client
          </h3>
          <div className="space-y-3">
            {repartition.map(r => (
              <div key={r.type}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-text font-medium">{r.type}</span>
                  <span className="text-text-secondary">{r.count} clients ({r.percentage}%)</span>
                </div>
                <div className="h-2.5 bg-background rounded-full overflow-hidden">
                  <div className={`h-full ${r.color} rounded-full transition-all`} style={{ width: `${r.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top clients */}
        <Card className="p-5">
          <h3 className="text-sm font-medium flex items-center gap-2 mb-4">
            <Award size={14} className="text-accent" />
            Clients les plus actifs
          </h3>
          <div className="space-y-3">
            {topClients.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-background transition-colors">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white ${
                  i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-amber-700' : 'bg-text-secondary/30'
                }`}>
                  {c.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">{c.name}</p>
                  <p className="text-[10px] text-text-secondary/60">{c.type} &middot; Agent: {c.agent}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-accent">{c.totalConnections}</p>
                  <p className="text-[9px] text-text-secondary/60">connexions</p>
                </div>
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
                <h2 className="text-base font-semibold">Details des connexions &mdash; {detailClient.name}</h2>
                <button onClick={closeDetail} className="p-1.5 rounded-lg hover:bg-background text-text-secondary hover:text-text transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-background border border-border/50">
                  <div>
                    <p className="text-[10px] text-text-secondary/60 uppercase tracking-wider">Email</p>
                    <p className="text-sm text-text mt-0.5">{detailClient.email}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-secondary/60 uppercase tracking-wider">Statut</p>
                    <p className={`text-sm font-medium mt-0.5 ${STATUS_COLORS[detailClient.status]} capitalize`}>
                      {detailClient.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-secondary/60 uppercase tracking-wider">Activation</p>
                    <p className="text-sm text-text mt-0.5">{detailClient.activationDate ? formatDateShort(detailClient.activationDate) : '\u2014'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-secondary/60 uppercase tracking-wider">Total connexions</p>
                    <p className="text-sm font-semibold text-text mt-0.5">{detailClient.totalConnections}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Historique detaille</h3>
                  {detailLogs.length === 0 ? (
                    <p className="text-sm text-text-secondary/60 py-4 text-center">Aucun historique de connexion</p>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-background border-b border-border text-[11px]">
                            <th className="text-left px-3 py-2 font-medium text-text-secondary">Date</th>
                            <th className="text-left px-3 py-2 font-medium text-text-secondary">Action</th>
                            <th className="text-left px-3 py-2 font-medium text-text-secondary">IP</th>
                            <th className="text-left px-3 py-2 font-medium text-text-secondary">Appareil</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {detailLogs.map(log => (
                            <tr key={log.id} className="hover:bg-background/50">
                              <td className="px-3 py-2 text-xs text-text">
                                {new Date(log.date).toLocaleDateString('fr-FR')} {formatTime(log.date)}
                              </td>
                              <td className="px-3 py-2">
                                <span className={`text-[11px] px-2 py-0.5 rounded border ${ACTION_COLORS[log.action]}`}>
                                  {ACTION_LABELS[log.action]}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-[11px] text-text-secondary font-mono">{log.ip}</td>
                              <td className="px-3 py-2 text-[11px] text-text-secondary">{log.userAgent}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-border/30">
                  <Button size="sm" icon={<Send size={13} />} onClick={() => { closeDetail(); setReminderClient(detailClient) }}>
                    Envoyer un rappel
                  </Button>
                  <Button size="sm" variant="outline" icon={<RefreshCw size={13} />}>
                    Reinitialiser mot de passe
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={detailClient.status === 'bloque' ? <Unlock size={13} /> : <Slash size={13} />}
                    className={detailClient.status === 'bloque' ? 'text-emerald-600' : 'text-error'}
                    onClick={() => { closeDetail(); setBlockConfirmClient(detailClient) }}
                  >
                    {detailClient.status === 'bloque' ? "Reactivier l'acces" : "Bloquer l'acces"}
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
