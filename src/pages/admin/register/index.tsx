import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  FileText, Download, Printer, Search, X, Sliders,
  Eye, Edit3, Trash2, AlertTriangle, Calendar, DollarSign,
  Users, Shield, ArrowUp, ArrowDown, Plus, Home, CheckCircle,
  Clock, User, Briefcase, Tag, RefreshCw, Send
} from 'react-feather'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import Card from '../../../components/ui/Card'
import { Select } from '../../../components/ui/Select'
import { DatePicker } from '../../../components/ui/DatePicker'
import { Dialog } from '../../../components/ui/Dialog'
import { RegistreActionsMenu } from '../../../components/ui/RegistreActionsMenu'
import { RegistreDetailModal } from '../../../components/ui/RegistreDetailModal'
import { RegistreEditModal } from '../../../components/ui/RegistreEditModal'
import { RegistreContratModal } from '../../../components/ui/RegistreContratModal'
import { RegistreEnvoyerModal } from '../../../components/ui/RegistreEnvoyerModal'
import { PdfViewerModal } from '../../../components/ui/PdfViewerModal'
import { CsvPreviewModal } from '../../../components/ui/CsvPreviewModal'
import {
  transactionFilters,
  MANDAT_TYPE_LABELS,
  TRANSACTION_ETAPE_LABELS,
  TRANSACTION_ETAPE_COLORS,
  CLIENT_TYPE_LABELS,
  CLIENT_TYPE_COLORS,
} from '../../../types/transactions'
import type { MandatType, TransactionEtape, Transaction } from '../../../types/transactions'
import { fetchRegistre, deleteRegistreEntry } from '../../../services/registreService'
import { api } from '../../../services/api'
import { generateContratPdf, generateContratHtml, generateContratCsv } from '../../../utils/generateContratPdf'

const PAGE_SIZE = 8

const ETAPE_STATUT_MAP: Record<TransactionEtape, string> = {
  actif: 'Actif',
  en_attente: 'En attente',
  signe: 'Actif',
  reservation: 'Reserve',
  cloture: 'Termine',
  expire: 'Expire',
  annule: 'Annule',
  resilie: 'Resilie',
}

export default function AdminRegisterPage() {
  const navigate = useNavigate()

  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterEtape, setFilterEtape] = useState<string>('all')
  const [filterAgent, setFilterAgent] = useState<string>('all')
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)

  const [actionTxn, setActionTxn] = useState<Transaction | null>(null)
  const [editTxn, setEditTxn] = useState<Transaction | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [detailTxn, setDetailTxn] = useState<Transaction | null>(null)
  const [contratTxn, setContratTxn] = useState<Transaction | null>(null)
  const [envoyerTxn, setEnvoyerTxn] = useState<Transaction | null>(null)
  const [pdfHtml, setPdfHtml] = useState('')
  const [pdfFilename, setPdfFilename] = useState('')
  const [csvContent, setCsvContent] = useState('')
  const [csvFilename, setCsvFilename] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteReason, setDeleteReason] = useState('')
  const [entries, setEntries] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRegistre()
    api.get<any[]>('/admin/users').then(setUsers).catch(() => {})
  }, [])

  const loadRegistre = async () => {
    setLoading(true)
    try {
      const data = await fetchRegistre()
      setEntries(Array.isArray(data) ? data : [])
    } catch {
      setEntries([])
    } finally {
      setLoading(false)
    }
  }

  const fetchPdfData = async (txn: Transaction) => {
    const [client, property, contracts] = await Promise.all([
      txn.clientId ? api.get<any>(`/clients/${txn.clientId}`) : null,
      txn.propertyId ? api.get<any>(`/properties/${txn.propertyId}`) : null,
      txn.clientId ? api.get<any[]>(`/contracts?client_id=${txn.clientId}`) : [],
    ])
    const contract = Array.isArray(contracts) ? contracts.find((c: any) => c.propertyId === txn.propertyId || c.property_id === txn.propertyId) || null : null
    let counterpartClient: any = null
    if (txn.clientType === 'Voyageur' && property?.ownerId) {
      try { counterpartClient = await api.get<any>(`/clients/${property.ownerId}`) } catch {}
    }
    return { transaction: txn, client, property, contract, counterpartClient }
  }

  const activeUsers = useMemo(() =>
    users.filter((u: any) => u.status !== 'supprimé'),
  [users])

  const getUserName = (u: any) => `${u.first_name || ''} ${u.last_name || ''}`.trim() || String(u.id)

  const findUserById = (agentId: string | number | null | undefined) => {
    if (agentId == null || agentId === '') return undefined
    return activeUsers.find(u => String(u.id) === String(agentId))
  }

  const resolveAgentKey = (t: any) => {
    const byId = findUserById(t.agentId)
    if (byId) return getUserName(byId)
    const byName = activeUsers.find(u => getUserName(u) === t.agentName)
    if (byName) return getUserName(byName)
    return t.agentName || 'Non assigné'
  }

  const getRoleBadge = (user?: any) => {
    if (!user) return null
    if (user.role === 'agent') {
      return { label: user.position || 'Agent', cls: 'bg-emerald-100 text-emerald-700' }
    }
    if (user.role === 'gerant') {
      return { label: 'Gérant', cls: 'bg-orange-100 text-orange-700' }
    }
    if (user.role === 'admin') {
      return { label: 'Admin', cls: 'bg-indigo-100 text-indigo-700' }
    }
    return null
  }

  const uniqueAgents = useMemo(() => {
    const names = new Set(entries.map(t => resolveAgentKey(t)))
    activeUsers.forEach(u => names.add(getUserName(u)))
    return Array.from(names).sort()
  }, [entries, activeUsers])

  const filtered = useMemo(() => {
    return entries.filter(t => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matchesSearch =
          t.reference.toLowerCase().includes(q) ||
          t.clientName.toLowerCase().includes(q) ||
          t.propertyTitle?.toLowerCase().includes(q) ||
          t.propertyRef?.toLowerCase().includes(q)
        if (!matchesSearch) return false
      }
      if (filterType !== 'all' && t.type !== filterType) return false
      if (filterEtape !== 'all' && t.etape !== filterEtape) return false
      if (filterAgent !== 'all' && resolveAgentKey(t) !== filterAgent) return false
      if (dateRange.from && t.dateContrat < dateRange.from) return false
      if (dateRange.to && t.dateContrat > dateRange.to) return false
      return true
    })
  }, [searchQuery, filterType, filterEtape, filterAgent, dateRange, entries, activeUsers])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginatedTxns = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const kpiData = useMemo(() => {
    const total = entries.length
    const actifs = entries.filter(t => t.etape === 'actif' || t.etape === 'signe').length
    const expires = entries.filter(t => t.etape === 'expire').length
    const reserves = entries.filter(t => t.etape === 'reservation').length
    const termines = entries.filter(t => t.etape === 'cloture').length
    const annules = entries.filter(t => t.etape === 'annule').length
    const resilies = entries.filter(t => t.etape === 'resilie').length
    return { total, actifs, expires, reserves, termines, annules, resilies }
  }, [entries])

  const statsByAgent = useMemo(() => {
    const stats: Record<string, { total: number; actifs: number; reserves: number; termines: number }> = {}
    uniqueAgents.forEach(name => { stats[name] = { total: 0, actifs: 0, reserves: 0, termines: 0 } })
    entries.forEach(t => {
      const key = resolveAgentKey(t)
      if (!stats[key]) stats[key] = { total: 0, actifs: 0, reserves: 0, termines: 0 }
      stats[key].total++
      if (t.etape === 'actif' || t.etape === 'signe') stats[key].actifs++
      if (t.etape === 'reservation') stats[key].reserves++
      if (t.etape === 'cloture') stats[key].termines++
    })
    return stats
  }, [uniqueAgents, entries])

  const totalStats = useMemo(() => {
    const vals = Object.values(statsByAgent)
    return {
      total: vals.reduce((s, v) => s + v.total, 0),
      actifs: vals.reduce((s, v) => s + v.actifs, 0),
      reserves: vals.reduce((s, v) => s + v.reserves, 0),
      termines: vals.reduce((s, v) => s + v.termines, 0),
    }
  }, [statsByAgent])

  const activeFiltersCount = [
    filterType !== 'all', filterEtape !== 'all', filterAgent !== 'all',
    dateRange.from || dateRange.to,
  ].filter(Boolean).length

  const resetFilters = () => {
    setFilterType('all'); setFilterEtape('all'); setFilterAgent('all')
    setDateRange({ from: '', to: '' })
  }

  const typeOptions = [
    { value: 'all', label: 'Tous types' },
    ...transactionFilters.types.map(t => ({ value: t.value, label: t.label })),
  ]

  const etapeOptions = [
    { value: 'all', label: 'Tous statuts' },
    ...transactionFilters.etapes.map(e => ({ value: e.value, label: e.label })),
  ]

  const agentOptions = [
    { value: 'all', label: 'Tous agents' },
    ...uniqueAgents.map(a => ({ value: a, label: a })),
  ]

  const statutBadge = (etape: TransactionEtape) => {
    switch (etape) {
      case 'actif': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'signe': return 'bg-green-50 text-green-700 border-green-200'
      case 'reservation': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'cloture': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'expire': return 'bg-gray-50 text-gray-500 border-gray-200'
      case 'annule': return 'bg-red-50 text-red-600 border-red-200'
      case 'resilie': return 'bg-rose-50 text-rose-600 border-rose-200'
      default: return 'bg-gray-50 text-gray-500 border-gray-200'
    }
  }

  const kpiCards = [
    { label: 'Total mandats', value: kpiData.total, evolution: '+8%', up: true, icon: FileText, color: 'text-accent', bg: 'bg-accent-light' },
    { label: 'Actifs', value: kpiData.actifs, evolution: '+12%', up: true, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Reserves', value: kpiData.reserves, evolution: '+5%', up: true, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Termines', value: kpiData.termines, evolution: '+3%', up: true, icon: Home, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Resilies', value: kpiData.resilies, evolution: '+1%', up: true, icon: X, color: 'text-rose-500', bg: 'bg-rose-50' },
    { label: 'Expires', value: kpiData.expires, evolution: '-2%', up: false, icon: AlertTriangle, color: 'text-gray-500', bg: 'bg-gray-50' },
    { label: 'Annules', value: kpiData.annules, evolution: '0%', up: true, icon: X, color: 'text-red-500', bg: 'bg-red-50' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Registre des mandats</h1>
          <p className="text-sm text-text-secondary mt-1">
            {kpiData.total} transactions enregistrees · {kpiData.actifs} actives · {kpiData.reserves} reservees · {kpiData.termines} terminees · {kpiData.expires} expirees · {kpiData.annules} annulees · {kpiData.resilies} resiliees
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">
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
            placeholder="Rechercher par client, produit ou reference..."
            className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
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
                <Select options={typeOptions} value={filterType} onValueChange={setFilterType} placeholder="Type de mandat" />
                <Select options={etapeOptions} value={filterEtape} onValueChange={setFilterEtape} placeholder="Statut" />
                <Select options={agentOptions} value={filterAgent} onValueChange={setFilterAgent} placeholder="Agent" />
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
          <span className="text-sm font-medium">Statistiques</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Intervenant</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Total mandats</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Actifs</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Reserves</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Termines</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {uniqueAgents.map(name => {
                const s = statsByAgent[name] || { total: 0, actifs: 0, reserves: 0, termines: 0 }
                const user = activeUsers.find(u => getUserName(u) === name)
                return (
                  <tr key={name} className="hover:bg-background/50 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent text-[10px] font-bold">
                          {(name.split(' ').map((n: string) => n[0]).join('') as string).slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium">{name}</span>
                        {(() => {
                          const badge = getRoleBadge(user)
                          return badge ? (
                            <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold rounded-full uppercase tracking-wider ${badge.cls}`}>
                              {badge.label}
                            </span>
                          ) : null
                        })()}
                      </div>
                    </td>
                    <td className="text-center px-4 py-2.5 font-semibold">{s.total}</td>
                    <td className="text-center px-4 py-2.5 text-emerald-600 font-medium">{s.actifs}</td>
                    <td className="text-center px-4 py-2.5 text-amber-600 font-medium">{s.reserves}</td>
                    <td className="text-center px-4 py-2.5 text-blue-600 font-medium">{s.termines}</td>
                  </tr>
                )
              })}
              <tr className="bg-background/30 font-semibold">
                <td className="px-4 py-2.5 text-sm">TOTAL</td>
                <td className="text-center px-4 py-2.5">{totalStats.total}</td>
                <td className="text-center px-4 py-2.5 text-emerald-600">{totalStats.actifs}</td>
                <td className="text-center px-4 py-2.5 text-amber-600">{totalStats.reserves}</td>
                <td className="text-center px-4 py-2.5 text-blue-600">{totalStats.termines}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          {loading ? (
            <div className="p-12 text-center">
              <div className="max-w-xs mx-auto">
                <RefreshCw size={32} className="text-text-secondary/20 mx-auto mb-3 animate-spin" />
                <p className="text-text-secondary font-medium">Chargement du registre...</p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <div className="max-w-xs mx-auto">
                <Search size={32} className="text-text-secondary/20 mx-auto mb-3" />
                <p className="text-text-secondary font-medium">Aucune transaction trouvee</p>
                <p className="text-xs text-text-secondary/60 mt-1">Essayez de modifier vos filtres</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-background border-b border-border/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Reference</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Client</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden md:table-cell">Type client</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden lg:table-cell">Produit</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Statut</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden xl:table-cell">Contracte le</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Montant</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden lg:table-cell">Géré par</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider w-12">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {paginatedTxns.map((txn, index) => (
                  <motion.tr
                    key={txn.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02, duration: 0.2 }}
                    className="hover:bg-background/50 transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-text-secondary">{txn.reference}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-text">{(MANDAT_TYPE_LABELS as any)[txn.type] || txn.type}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-text">{txn.clientName}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-lg border ${CLIENT_TYPE_COLORS[txn.clientType] || 'bg-text-secondary/10 text-text-secondary border-text-secondary/20'}`}>
                        {CLIENT_TYPE_LABELS[txn.clientType] || txn.clientType || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {txn.propertyTitle ? (
                        <div>
                          <p className="text-sm text-text">{txn.propertyTitle}</p>
                          {txn.propertyRef && (
                            <p className="text-[10px] text-text-secondary/60 font-mono">{txn.propertyRef}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-text-secondary/60 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-md border ${statutBadge(txn.etape)}`}>
                        {(TRANSACTION_ETAPE_LABELS as any)[txn.etape] || txn.etape}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs hidden xl:table-cell">
                      {new Date(txn.dateContrat).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-text">{txn.montant}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
  <div className="flex flex-col">
    <span className="text-text-secondary text-xs">{resolveAgentKey(txn)}</span>
    {(() => {
      const badge = getRoleBadge(findUserById(txn.agentId))
      return badge ? (
        <span className={`inline-flex items-center px-1 py-0.5 text-[8px] font-semibold rounded-full uppercase tracking-wider ${badge.cls}`}>
          {badge.label}
        </span>
      ) : null
    })()}
  </div>
</td>
                    <td className="px-4 py-3 text-center">
                       <RegistreActionsMenu
                        actions={[
                          { icon: <Eye size={14} />, label: 'Voir les détails', onClick: () => { setDetailTxn(txn) } },
                          { icon: <Edit3 size={14} />, label: 'Modifier', onClick: () => {
                            setEditTxn(txn)
                          }},
                          { icon: <FileText size={14} />, label: 'Voir le contrat', onClick: () => { setContratTxn(txn) } },
                          { icon: <Send size={14} />, label: 'Envoyer au client', onClick: () => { setEnvoyerTxn(txn) } },
                          { icon: <Download size={14} />, label: 'Exporter en PDF', onClick: async () => {
                            try {
                              const data = await fetchPdfData(txn)
                              setPdfHtml(generateContratHtml(data))
                              setPdfFilename(`mandat_${txn.reference || txn.id}`)
                            } catch {}
                          } },
                          { icon: <Printer size={14} />, label: 'Imprimer', onClick: async () => {
                            try {
                              const data = await fetchPdfData(txn)
                              generateContratPdf(data)
                            } catch {}
                          } },
                          { icon: <Download size={14} />, label: 'Exporter en CSV', onClick: async () => {
                            try {
                              const data = await fetchPdfData(txn)
                              setCsvContent(generateContratCsv(data))
                              setCsvFilename(`mandat_${txn.reference || txn.id}.csv`)
                            } catch {}
                          } },
                           { separator: true, icon: <></>, label: '', onClick: () => {} },
                           { icon: <Trash2 size={14} />, label: 'Supprimer', variant: 'danger', onClick: () => {
                            setActionTxn(txn)
                            setDeleteConfirm('')
                            setDeleteReason('')
                            setShowDeleteDialog(true)
                          }},
                        ]}
                      />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 bg-background/20">
            <p className="text-xs text-text-secondary">
              Affichage {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} sur {filtered.length} transactions
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

      {/* Edit Modal */}
      <RegistreEditModal
        isOpen={!!editTxn}
        onClose={() => setEditTxn(null)}
        transaction={editTxn}
        onSaved={() => loadRegistre()}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog isOpen={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} title="Supprimer la transaction" size="lg">
        {actionTxn && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-background border border-border/50">
              <p className="text-sm font-medium">{actionTxn.reference} · {actionTxn.clientName}</p>
              <p className="text-xs text-text-secondary">{MANDAT_TYPE_LABELS[actionTxn.type]} · {resolveAgentKey(actionTxn)}</p>
            </div>
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-red-700 space-y-1">
                  <p className="font-medium">Attention :</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Cette action est IRREVERSIBLE</li>
                    <li>La transaction sera definitivement supprimee</li>
                    <li>Les mandats lies seront impactes</li>
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
                { value: 'annule', label: 'Transaction annulee' },
                { value: 'modifie', label: 'Transaction remplacee' },
                { value: 'autre', label: 'Autre' },
              ]} value={deleteReason} onValueChange={(v) => setDeleteReason(v)} className="w-full" />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>Annuler</Button>
              <Button variant="danger" onClick={async () => {
                if (!actionTxn) return
                try {
                  await deleteRegistreEntry(actionTxn.id)
                  setShowDeleteDialog(false)
                  setDeleteConfirm('')
                  await loadRegistre()
                } catch {
                  // silently fail
                }
              }} disabled={deleteConfirm !== 'SUPPRIMER'}>
                Confirmer la suppression
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      <RegistreDetailModal
        isOpen={!!detailTxn}
        onClose={() => setDetailTxn(null)}
        transaction={detailTxn}
      />

      <RegistreContratModal
        isOpen={!!contratTxn}
        onClose={() => setContratTxn(null)}
        transaction={contratTxn}
      />

      <RegistreEnvoyerModal
        isOpen={!!envoyerTxn}
        onClose={() => setEnvoyerTxn(null)}
        transaction={envoyerTxn}
      />

      <PdfViewerModal
        isOpen={!!pdfHtml}
        onClose={() => { setPdfHtml(''); setPdfFilename('') }}
        html={pdfHtml}
        filename={pdfFilename}
      />

      <CsvPreviewModal
        isOpen={!!csvContent}
        onClose={() => { setCsvContent(''); setCsvFilename('') }}
        csv={csvContent}
        filename={csvFilename}
      />
    </div>
  )
}
