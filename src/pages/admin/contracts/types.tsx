import { useNavigate } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Download, Printer, Search, X, Sliders, MoreVertical,
  Eye, Edit3, Trash2, AlertTriangle, Calendar, DollarSign,
  Users, Shield, ArrowUp, ArrowDown, Home, CheckCircle,
  Clock, Briefcase, Tag, RefreshCw, User, PieChart
} from 'react-feather'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import Card from '../../../components/ui/Card'
import { Select } from '../../../components/ui/Select'
import { DatePicker } from '../../../components/ui/DatePicker'
import { Dialog } from '../../../components/ui/Dialog'
import {
  mockContracts, ADMIN_AGENTS,
  CONTRACT_TYPE_LABELS, CONTRACT_STATUS_LABELS, CONTRACT_STATUS_COLORS,
  contractFilters,
} from './mockData'
import type { Contract, ContractType, ContractStatus } from './mockData'

const PAGE_SIZE = 8

const TYPE_LABELS_SHORT: Record<ContractType, string> = {
  vente: 'Vente',
  location_classique: 'Location',
  location_saisonniere: 'Saisonnier',
}

const getContractMontant = (c: Contract): number => {
  if (c.type === 'vente') return c.prixVente || 0
  if (c.type === 'location_classique') return c.loyerMensuelHC || 0
  if (c.type === 'location_saisonniere') return c.prixTotalSejour || 0
  return 0
}

const formatPrice = (p: number, devise = 'MAD') =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: devise, maximumFractionDigits: 0 }).format(p)

const computeDelai = (c: Contract): number | null => {
  if (c.status === 'finalise_termine') {
    if (c.type === 'vente' && c.dateActe) {
      const start = new Date(c.dateCreation)
      const end = new Date(c.dateActe)
      return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    }
    const lastHist = c.history[c.history.length - 1]
    if (lastHist) {
      const start = new Date(c.dateCreation)
      const end = new Date(lastHist.date)
      return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    }
  }
  if (c.type === 'vente' && c.dateCompromis) {
    const start = new Date(c.dateCreation)
    const end = new Date(c.dateCompromis)
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  }
  if (c.type === 'location_classique' && c.status === 'confirme_actif' && c.dateDebutBail) {
    const start = new Date(c.dateCreation)
    const end = new Date(c.dateDebutBail)
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  }
  return null
}

const CONTRACT_STATUS_OPTIONS: { value: ContractStatus; label: string }[] = [
  { value: 'en_cours', label: 'En cours' },
  { value: 'confirme_actif', label: 'Confirmé / Actif' },
  { value: 'finalise_termine', label: 'Finalisé / Terminé' },
  { value: 'annule', label: 'Annulé' },
]

export default function AdminContractsPage() {
  const navigate = useNavigate()

  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterAgent, setFilterAgent] = useState<string>('all')
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)

  const [actionContract, setActionContract] = useState<Contract | null>(null)
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [editMontant, setEditMontant] = useState('')
  const [editDateCreation, setEditDateCreation] = useState('')
  const [editNewStatus, setEditNewStatus] = useState<ContractStatus | ''>('')
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteReason, setDeleteReason] = useState('')
  const [statusNewValue, setStatusNewValue] = useState<ContractStatus | ''>('')

  const filtered = useMemo(() => {
    return mockContracts
      .filter(c =>
        !searchTerm ||
        c.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.partieA.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.partieB.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.propertyRef.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(c => filterType === 'all' || c.type === filterType)
      .filter(c => filterStatus === 'all' || c.status === filterStatus)
      .filter(c => filterAgent === 'all' || c.agentId === filterAgent)
      .filter(c => {
        if (dateRange.from && c.dateCreation < dateRange.from) return false
        if (dateRange.to && c.dateCreation > dateRange.to) return false
        return true
      })
  }, [searchTerm, filterType, filterStatus, filterAgent, dateRange])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const kpiData = useMemo(() => {
    const total = mockContracts.length
    const ventes = mockContracts.filter(c => c.type === 'vente').length
    const locations = mockContracts.filter(c => c.type === 'location_classique').length
    const saisonniers = mockContracts.filter(c => c.type === 'location_saisonniere').length
    const actifs = mockContracts.filter(c => c.status === 'confirme_actif').length
    const termines = mockContracts.filter(c => c.status === 'finalise_termine').length
    const enCours = mockContracts.filter(c => c.status === 'en_cours').length
    const caTotal = mockContracts.reduce((s, c) => {
      if (c.type === 'vente') return s + (c.prixVente || 0)
      if (c.type === 'location_classique') return s + (c.loyerMensuelHC || 0) * 12
      if (c.type === 'location_saisonniere') return s + (c.prixTotalSejour || 0)
      return s
    }, 0)
    return { total, ventes, locations, saisonniers, actifs, termines, enCours, caTotal }
  }, [])

  const delaiMoyen = useMemo(() => {
    const delais = mockContracts.map(computeDelai).filter((d): d is number => d !== null)
    if (delais.length === 0) return null
    return Math.round(delais.reduce((s, d) => s + d, 0) / delais.length)
  }, [])

  const statsByAgent = useMemo(() => {
    const stats: Record<string, { total: number; ventes: number; locations: number; saisonniers: number; actifs: number; termines: number }> = {}
    ADMIN_AGENTS.forEach(a => { stats[a.id] = { total: 0, ventes: 0, locations: 0, saisonniers: 0, actifs: 0, termines: 0 } })
    mockContracts.forEach(c => {
      const id = c.agentId
      if (!stats[id]) stats[id] = { total: 0, ventes: 0, locations: 0, saisonniers: 0, actifs: 0, termines: 0 }
      stats[id].total++
      if (c.type === 'vente') stats[id].ventes++
      if (c.type === 'location_classique') stats[id].locations++
      if (c.type === 'location_saisonniere') stats[id].saisonniers++
      if (c.status === 'confirme_actif') stats[id].actifs++
      if (c.status === 'finalise_termine') stats[id].termines++
    })
    return stats
  }, [])

  const totalStats = useMemo(() => {
    const vals = Object.values(statsByAgent)
    return {
      total: vals.reduce((s, v) => s + v.total, 0),
      ventes: vals.reduce((s, v) => s + v.ventes, 0),
      locations: vals.reduce((s, v) => s + v.locations, 0),
      saisonniers: vals.reduce((s, v) => s + v.saisonniers, 0),
      actifs: vals.reduce((s, v) => s + v.actifs, 0),
      termines: vals.reduce((s, v) => s + v.termines, 0),
    }
  }, [statsByAgent])

  const repartition = useMemo(() => {
    const total = mockContracts.length
    if (total === 0) return []
    return [
      { label: 'Vente', value: kpiData.ventes, pct: Math.round((kpiData.ventes / total) * 100), color: 'bg-blue-500' },
      { label: 'Location classique', value: kpiData.locations, pct: Math.round((kpiData.locations / total) * 100), color: 'bg-emerald-500' },
      { label: 'Location saisonnière', value: kpiData.saisonniers, pct: Math.round((kpiData.saisonniers / total) * 100), color: 'bg-amber-500' },
    ]
  }, [kpiData])

  const activeFiltersCount = [
    filterType !== 'all', filterStatus !== 'all', filterAgent !== 'all',
    dateRange.from || dateRange.to,
  ].filter(Boolean).length

  const resetFilters = () => {
    setFilterType('all'); setFilterStatus('all'); setFilterAgent('all')
    setDateRange({ from: '', to: '' })
  }

  const getAgentInfo = (agentId: string) =>
    ADMIN_AGENTS.find(a => a.id === agentId) || null

  const typeOptions = [
    { value: 'all', label: 'Tous types' },
    ...contractFilters.types.map(t => ({ value: t.value, label: t.label })),
  ]

  const statusOptions = [
    { value: 'all', label: 'Tous statuts' },
    ...contractFilters.statuses.map(s => ({ value: s.value, label: s.label })),
  ]

  const agentOptions = [
    { value: 'all', label: 'Tous agents' },
    ...ADMIN_AGENTS.map(a => ({ value: a.id, label: a.name })),
  ]

  const kpiCards = [
    { label: 'Total contrats', value: kpiData.total, evolution: '+15%', up: true, icon: FileText, color: 'text-accent', bg: 'bg-accent-light' },
    { label: 'Ventes', value: kpiData.ventes, evolution: '+10%', up: true, icon: Home, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Locations classiques', value: kpiData.locations, evolution: '+20%', up: true, icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Locations saisonnières', value: kpiData.saisonniers, evolution: '+5%', up: true, icon: Tag, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Confirmés / Actifs', value: kpiData.actifs, evolution: '+8%', up: true, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Finalisés / Terminés', value: kpiData.termines, evolution: '+3%', up: true, icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'En cours', value: kpiData.enCours, evolution: '-2%', up: false, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'CA total', value: formatPrice(kpiData.caTotal), evolution: '+12%', up: true, icon: DollarSign, color: 'text-accent', bg: 'bg-accent-light' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contrats - Vue d'ensemble</h1>
          <p className="text-sm text-text-secondary mt-1">
            {kpiData.total} contrats enregistres · {kpiData.actifs} actifs · {kpiData.termines} termines · {kpiData.enCours} en cours
            {delaiMoyen !== null && ` · Delai moyen ${delaiMoyen} jours`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<Printer size={14} />}>Imprimer</Button>
          <Button variant="outline" size="sm" icon={<Download size={14} />}>Exporter CSV</Button>
          <Button variant="outline" size="sm" icon={<FileText size={14} />}>Exporter PDF</Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => {
          const Icon = kpi.icon
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-xl border border-border/50 shadow-card p-4 hover:shadow-card-hover transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">{kpi.label}</p>
                <div className={`p-2 rounded-lg ${kpi.bg}`}>
                  <Icon size={14} className={kpi.color} />
                </div>
              </div>
              <p className="text-2xl font-bold">{kpi.value}</p>
              <div className={`flex items-center gap-1 mt-1 text-xs ${kpi.up ? 'text-emerald-600' : 'text-red-500'}`}>
                {kpi.up ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                <span>{kpi.evolution}</span>
                <span className="text-text-secondary/50 ml-1">vs mois dernier</span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Rechercher par reference, client ou bien..."
            className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1) }}
          />
        </div>
        <div className="flex gap-2">
          <button
            className={`btn-secondary h-9 px-3 flex items-center gap-2 text-sm rounded-lg border border-border bg-card hover:bg-background transition-all ${showFilters || activeFiltersCount > 0 ? 'ring-2 ring-accent/20 border-accent' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Sliders size={14} />
            Filtres
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Filtres avances</span>
                <button className="btn-ghost text-xs flex items-center gap-1" onClick={resetFilters}>
                  <X size={12} /> Reinitialiser
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Select options={typeOptions} value={filterType} onValueChange={(v) => { setFilterType(v); setPage(1) }} placeholder="Type de contrat" />
                <Select options={statusOptions} value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1) }} placeholder="Statut" />
                <Select options={agentOptions} value={filterAgent} onValueChange={(v) => { setFilterAgent(v); setPage(1) }} placeholder="Agent" />
                <div className="flex items-center gap-2">
                  <DatePicker
                    value={dateRange.from}
                    onChange={e => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                    className="flex-1"
                  />
                  <span className="text-text-secondary text-xs">-</span>
                  <DatePicker
                    value={dateRange.to}
                    onChange={e => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Statistics by Agent */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border/40 flex items-center gap-2">
          <Users size={14} className="text-text-secondary" />
          <span className="text-sm font-medium">Statistiques par agent</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Agent</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Total</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Ventes</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Locations</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Saisonniers</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Actifs</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Termines</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {ADMIN_AGENTS.map(agent => {
                const s = statsByAgent[agent.id] || { total: 0, ventes: 0, locations: 0, saisonniers: 0, actifs: 0, termines: 0 }
                return (
                  <tr key={agent.id} className="hover:bg-background/50 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full ${agent.color} flex items-center justify-center text-white text-[10px] font-bold`}>
                          {agent.initials}
                        </div>
                        <span className="text-sm font-medium">{agent.name}</span>
                      </div>
                    </td>
                    <td className="text-center px-4 py-2.5 font-semibold">{s.total}</td>
                    <td className="text-center px-4 py-2.5">{s.ventes}</td>
                    <td className="text-center px-4 py-2.5">{s.locations}</td>
                    <td className="text-center px-4 py-2.5">{s.saisonniers}</td>
                    <td className="text-center px-4 py-2.5 text-emerald-600 font-medium">{s.actifs}</td>
                    <td className="text-center px-4 py-2.5 text-blue-600 font-medium">{s.termines}</td>
                  </tr>
                )
              })}
              <tr className="bg-background/30 font-semibold">
                <td className="px-4 py-2.5 text-sm">TOTAL</td>
                <td className="text-center px-4 py-2.5">{totalStats.total}</td>
                <td className="text-center px-4 py-2.5">{totalStats.ventes}</td>
                <td className="text-center px-4 py-2.5">{totalStats.locations}</td>
                <td className="text-center px-4 py-2.5">{totalStats.saisonniers}</td>
                <td className="text-center px-4 py-2.5 text-emerald-600">{totalStats.actifs}</td>
                <td className="text-center px-4 py-2.5 text-blue-600">{totalStats.termines}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Contracts Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <div className="max-w-xs mx-auto">
                <Search size={32} className="text-text-secondary/20 mx-auto mb-3" />
                <p className="text-text-secondary font-medium">Aucun contrat trouve</p>
                <p className="text-xs text-text-secondary/60 mt-1">Essayez de modifier vos filtres</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-background border-b border-border/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider w-10">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Reference</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Statut</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden lg:table-cell">Parties</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden xl:table-cell">Bien</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Montant</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden md:table-cell">Agent</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden xl:table-cell">Delai</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider w-12">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {paginated.map((c, index) => {
                  const agent = getAgentInfo(c.agentId)
                  const delai = computeDelai(c)
                  return (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02, duration: 0.2 }}
                      className="hover:bg-background/50 transition-colors group"
                    >
                      <td className="px-4 py-3 text-xs text-text-secondary/50">
                        {(page - 1) * PAGE_SIZE + index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          className="font-mono text-xs text-accent hover:underline text-left"
                          onClick={() => navigate(`/admin/contracts/${c.id}`)}
                        >
                          {c.reference}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium text-text">{CONTRACT_TYPE_LABELS[c.type]}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-md border ${CONTRACT_STATUS_COLORS[c.status]}`}>
                          {CONTRACT_STATUS_LABELS[c.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="text-xs">
                          <span className="text-text-secondary">{c.partieA.name}</span>
                          <span className="text-text-secondary/40 mx-1">→</span>
                          <span className="text-text">{c.partieB.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <div>
                          <p className="text-xs text-text truncate max-w-[160px]">{c.propertyTitle}</p>
                          <p className="text-[10px] text-text-secondary/60 font-mono">{c.propertyRef}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-text text-xs">
                        {formatPrice(getContractMontant(c), c.devise)}
                        {c.type === 'location_classique' && <span className="text-text-secondary/60 text-[10px]">/mois</span>}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-1.5">
                          {agent && (
                            <div className={`w-5 h-5 rounded-full ${agent.color} flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0`}>
                              {agent.initials}
                            </div>
                          )}
                          <span className="text-xs text-text-secondary">{c.agentPrincipal}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center hidden xl:table-cell">
                        {delai !== null ? (
                          <span className="text-xs text-text-secondary">{delai} j</span>
                        ) : (
                          <span className="text-xs text-text-secondary/40">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center relative">
                        <div className="relative">
                          <button
                            className="p-1.5 rounded-lg hover:bg-background text-text-secondary hover:text-text transition-all opacity-0 group-hover:opacity-100"
                            onClick={() => setShowActionMenu(showActionMenu === c.id ? null : c.id)}
                          >
                            <MoreVertical size={14} />
                          </button>
                          {showActionMenu === c.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setShowActionMenu(null)} />
                              <div className="absolute right-0 top-full mt-1 w-56 bg-card rounded-xl border border-border/50 shadow-dropdown py-1 z-20">
                                <button
                                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-background transition-colors text-left"
                                  onClick={() => { navigate(`/admin/contracts/${c.id}`); setShowActionMenu(null) }}
                                >
                                  <Eye size={14} /> Voir le detail
                                </button>
                                <button
                                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-background transition-colors text-left"
                                  onClick={() => {
                                    setActionContract(c)
                                    setEditMontant(String(getContractMontant(c)))
                                    setEditDateCreation(c.dateCreation)
                                    setEditNewStatus(c.status)
                                    setShowEditDialog(true)
                                    setShowActionMenu(null)
                                  }}
                                >
                                  <Edit3 size={14} /> Modifier
                                </button>
                                <button
                                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-background transition-colors text-left"
                                  onClick={() => {
                                    setActionContract(c)
                                    setStatusNewValue(c.status)
                                    setShowStatusDialog(true)
                                    setShowActionMenu(null)
                                  }}
                                >
                                  <RefreshCw size={14} /> Changer le statut
                                </button>
                                <div className="border-t border-border/40 my-1" />
                                <button
                                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-error hover:bg-error/5 transition-colors text-left"
                                  onClick={() => {
                                    setActionContract(c)
                                    setDeleteConfirm('')
                                    setDeleteReason('')
                                    setShowDeleteDialog(true)
                                    setShowActionMenu(null)
                                  }}
                                >
                                  <Trash2 size={14} /> Supprimer le contrat
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 bg-background/20">
            <p className="text-xs text-text-secondary">
              Affichage {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} sur {filtered.length} contrats
            </p>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                    p === page
                      ? 'bg-accent text-white'
                      : 'text-text-secondary hover:text-text hover:bg-background'
                  }`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Répartition par type */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border/40 flex items-center gap-2">
          <PieChart size={14} className="text-text-secondary" />
          <span className="text-sm font-medium">Repartition par type</span>
        </div>
        <div className="p-5 space-y-4">
          {repartition.map(r => (
            <div key={r.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-text">{r.label}</span>
                <span className="text-sm font-semibold text-text">{r.value} contrat{r.value > 1 ? 's' : ''} ({r.pct}%)</span>
              </div>
              <div className="w-full h-3 rounded-full bg-background overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${r.pct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className={`h-full rounded-full ${r.color}`}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Edit Dialog */}
      <Dialog isOpen={showEditDialog} onClose={() => setShowEditDialog(false)} title="Modifier le contrat" size="md">
        {actionContract && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-background border border-border/50">
              <p className="text-sm font-medium">{actionContract.reference} · {CONTRACT_TYPE_LABELS[actionContract.type]}</p>
              <p className="text-xs text-text-secondary">{actionContract.partieA.name} → {actionContract.partieB.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Montant</label>
                <input
                  type="text"
                  className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                  value={editMontant}
                  onChange={(e) => setEditMontant(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Statut</label>
                <Select options={CONTRACT_STATUS_OPTIONS} value={editNewStatus} onValueChange={(v) => setEditNewStatus(v as ContractStatus)} className="w-full" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Date de creation</label>
              <DatePicker
                className="w-full"
                value={editDateCreation}
                onChange={(e) => setEditDateCreation(e.target.value)}
              />
            </div>
            {actionContract.type === 'vente' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Date offre</label>
                  <DatePicker
                    className="w-full"
                    defaultValue={actionContract.dateOffre || ''}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Date compromis</label>
                  <DatePicker
                    className="w-full"
                    defaultValue={actionContract.dateCompromis || ''}
                  />
                </div>
              </div>
            )}
            {actionContract.type === 'location_classique' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Debut du bail</label>
                  <DatePicker
                    className="w-full"
                    defaultValue={actionContract.dateDebutBail || ''}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Fin du bail</label>
                  <DatePicker
                    className="w-full"
                    defaultValue={actionContract.dateFinBail || ''}
                  />
                </div>
              </div>
            )}
            {actionContract.type === 'location_saisonniere' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Arrivee</label>
                  <DatePicker
                    className="w-full"
                    defaultValue={actionContract.dateArrivee || ''}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Depart</label>
                  <DatePicker
                    className="w-full"
                    defaultValue={actionContract.dateDepart || ''}
                  />
                </div>
              </div>
            )}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowEditDialog(false)}>Annuler</Button>
              <Button variant="default" onClick={() => setShowEditDialog(false)}>Enregistrer</Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Change Status Dialog */}
      <Dialog isOpen={showStatusDialog} onClose={() => setShowStatusDialog(false)} title="Changer le statut" size="md">
        {actionContract && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-background border border-border/50">
              <p className="text-sm font-medium">{actionContract.reference} · {CONTRACT_TYPE_LABELS[actionContract.type]}</p>
              <p className="text-xs text-text-secondary">{actionContract.partieA.name} → {actionContract.partieB.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Statut actuel</label>
              <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border ${CONTRACT_STATUS_COLORS[actionContract.status]}`}>
                {CONTRACT_STATUS_LABELS[actionContract.status]}
              </span>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nouveau statut</label>
              <Select options={CONTRACT_STATUS_OPTIONS} value={statusNewValue} onValueChange={(v) => setStatusNewValue(v as ContractStatus)} className="w-full" />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowStatusDialog(false)}>Annuler</Button>
              <Button variant="default" onClick={() => setShowStatusDialog(false)} disabled={statusNewValue === actionContract.status}>
                Changer le statut
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog isOpen={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} title="Supprimer le contrat" size="lg">
        {actionContract && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-background border border-border/50">
              <p className="text-sm font-medium">{actionContract.reference} · {CONTRACT_TYPE_LABELS[actionContract.type]}</p>
              <p className="text-xs text-text-secondary">{actionContract.partieA.name} → {actionContract.partieB.name} · {actionContract.agentPrincipal}</p>
            </div>
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-red-700 space-y-1">
                  <p className="font-medium">Attention :</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Cette action est IRREVERSIBLE</li>
                    <li>Le contrat sera definitivement supprime</li>
                    <li>Tous les documents associes seront effaces</li>
                    <li>L'historique sera perdu</li>
                  </ul>
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Confirmation</label>
              <input
                type="text"
                className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-error/20 focus:border-error transition-all"
                placeholder='Tapez "SUPPRIMER" pour confirmer'
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Motif de suppression (optionnel)</label>
              <Select options={[
                { value: '', label: 'Selectionner un motif' },
                { value: 'doublon', label: 'Erreur de saisie - Doublon' },
                { value: 'annule', label: 'Contrat annule' },
                { value: 'remplace', label: 'Contrat remplace' },
                { value: 'autre', label: 'Autre' },
              ]} value={deleteReason} onValueChange={(v) => setDeleteReason(v)} className="w-full" />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>Annuler</Button>
              <Button variant="danger" onClick={() => { setShowDeleteDialog(false); setDeleteConfirm('') }} disabled={deleteConfirm !== 'SUPPRIMER'}>
                Confirmer la suppression
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
