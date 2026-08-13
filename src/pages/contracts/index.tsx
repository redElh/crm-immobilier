import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, Search, X, Home, User, Briefcase, Tag, CheckCircle, Shield, Clock, DollarSign, Lock } from 'react-feather'
import { Badge } from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { DatePicker } from '../../components/ui/DatePicker'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { ContractActionsMenu } from '../../components/ui/ContractActionsMenu'
import { useToast } from '../../components/ui/Toast'
import { fetchContracts, deleteContract } from '../../services/contractService'
import { api } from '../../services/api'
import { useMyPermissions, permissionAllowed } from '../../hooks/useMyPermissions'
import {
  CONTRACT_TYPE_LABELS,
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
  contractFilters,
} from '../../types/contract'
import type { ContractType, ContractStatus } from '../../types/contract'

export default function ContractsPage() {
  const navigate = useNavigate()
  const { agentId } = useParams()
  const { toast } = useToast()
  const perms = useMyPermissions()
  const canViewDetails = permissionAllowed(perms, 'contrats-info-privees')
  const canDeleteContract = permissionAllowed(perms, 'contrats-supprimer')
  const basePath = agentId ? `/${agentId}` : ''
  const [contracts, setContracts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<ContractType | ''>('')
  const [filterStatus, setFilterStatus] = useState<ContractStatus | ''>('')
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    api.get<any>('/auth/me').then(setCurrentUser).catch(() => {})
  }, [])

  useEffect(() => {
    if (!currentUser) return
    setLoading(true)
    fetchContracts({ agent_id: String(currentUser.id) })
      .then(data => setContracts(Array.isArray(data) ? data : []))
      .catch(() => setContracts([]))
      .finally(() => setLoading(false))
  }, [currentUser])

  const currentUserName = currentUser
    ? [currentUser.first_name, currentUser.last_name].filter(Boolean).join(' ') || currentUser.email
    : ''

  const handleDelete = async () => {
    if (!deleteTarget || !canDeleteContract) return
    setDeleting(true)
    try {
      await deleteContract(deleteTarget.id)
      setContracts(prev => prev.filter(c => c.id !== deleteTarget.id))
      toast('success', `Contrat ${deleteTarget.reference || ''} supprimé`)
    } catch {
      toast('error', 'Erreur lors de la suppression du contrat')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const filtered = useMemo(() => {
    return contracts.filter(c => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matchesSearch =
          c.reference?.toLowerCase().includes(q) ||
          c.clientName?.toLowerCase().includes(q) ||
          c.propertyTitle?.toLowerCase().includes(q) ||
          c.propertyRef?.toLowerCase().includes(q) ||
          c.agentName?.toLowerCase().includes(q)
        if (!matchesSearch) return false
      }
      if (filterType && c.contractType !== filterType) return false
      if (filterStatus && c.status !== filterStatus) return false
      if (dateRange.from && c.createdAt && new Date(c.createdAt).toISOString().slice(0, 10) < dateRange.from) return false
      if (dateRange.to && c.createdAt && new Date(c.createdAt).toISOString().slice(0, 10) > dateRange.to) return false
      return true
    })
  }, [contracts, searchQuery, filterType, filterStatus, dateRange])

  const clearFilters = () => {
    setSearchQuery('')
    setFilterType('')
    setFilterStatus('')
    setDateRange({ from: '', to: '' })
  }

  const hasActiveFilters = searchQuery || filterType || filterStatus || dateRange.from || dateRange.to

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(p)

  const formatDate = (d: string) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('fr-FR')
  }

  const kpiData = useMemo(() => {
    const total = contracts.length
    const ventes = contracts.filter(c => c.contractType === 'vente').length
    const locations = contracts.filter(c => c.contractType === 'location_classique').length
    const saisonniers = contracts.filter(c => c.contractType === 'location_saisonniere').length
    const actifs = contracts.filter(c => c.status === 'confirme_actif').length
    const termines = contracts.filter(c => c.status === 'finalise_termine').length
    const enCours = contracts.filter(c => c.status === 'en_cours').length
    const caTotal = contracts.reduce((s, c) => s + (c.amount || 0), 0)
    return { total, ventes, locations, saisonniers, actifs, termines, enCours, caTotal }
  }, [contracts])

  const kpiCards = [
    { label: 'Total contrats', value: kpiData.total, icon: FileText, color: 'text-accent', bg: 'bg-accent-light' },
    { label: 'Ventes', value: kpiData.ventes, icon: Home, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Locations classiques', value: kpiData.locations, icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Locations saisonnières', value: kpiData.saisonniers, icon: Tag, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Confirmés / Actifs', value: kpiData.actifs, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Finalisés / Terminés', value: kpiData.termines, icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'En cours', value: kpiData.enCours, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'CA total', value: formatPrice(kpiData.caTotal), icon: DollarSign, color: 'text-accent', bg: 'bg-accent-light' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contrats - Vue d'ensemble</h1>
          <p className="text-sm text-text-secondary mt-1">
            {kpiData.total} contrats enregistrés · {kpiData.actifs} actifs · {kpiData.termines} terminés · {kpiData.enCours} en cours
          </p>
        </div>
      </div>

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
            </motion.div>
          )
        })}
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/60" />
            <input
              type="text"
              placeholder="Rechercher (réf., client, bien...)"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-8 text-sm rounded-lg border border-border bg-background text-text placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary/60 hover:text-text">
                <X size={14} />
              </button>
            )}
          </div>

          <Select
            value={filterType}
            onChange={(val: string) => setFilterType(val as ContractType | '')}
            options={[{ value: '', label: 'Tous types' }, ...contractFilters.types]}
            className="min-w-[140px]"
          />

          <Select
            value={filterStatus}
            onChange={(val: string) => setFilterStatus(val as ContractStatus | '')}
            options={[{ value: '', label: 'Tous statuts' }, ...contractFilters.statuses]}
            className="min-w-[140px]"
          />

          {currentUser && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/5 border border-accent/20 text-xs text-accent font-medium">
              <User size={12} />
              Agent: {currentUserName}
            </div>
          )}

          <div className="flex items-center gap-2">
            <DatePicker
              value={dateRange.from}
              onChange={e => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="w-[140px]"
            />
            <span className="text-text-secondary text-sm">-</span>
            <DatePicker
              value={dateRange.to}
              onChange={e => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="w-[140px]"
            />
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-accent hover:text-accent/80 transition-colors flex items-center gap-1"
            >
              <X size={12} /> Réinitialiser
            </button>
          )}
        </div>
      </Card>

      <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-background border-b border-border/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Référence</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Statut</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Partie A</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Partie B</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Bien</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary">Montant</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Créé le</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Agent</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center text-text-secondary">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent/20 border-t-accent mx-auto mb-3" />
                    <p className="text-sm">Chargement des contrats...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center text-text-secondary">
                    <FileText size={32} className="mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Aucun contrat trouvé</p>
                    <p className="text-xs text-text-secondary/60 mt-1">Les contrats sont générés automatiquement lors des transactions</p>
                  </td>
                </tr>
              ) : (
                filtered.map((c, index) => (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02, duration: 0.2 }}
                    className={`transition-colors ${canViewDetails ? 'hover:bg-background/50 cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                    onClick={() => canViewDetails && navigate(`/contracts/${c.id}`)}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-text-secondary">{c.reference}</span>
                      {!canViewDetails && (
                        <span className="ml-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-background border border-border/60 text-text-secondary">
                          <Lock size={9} /> Verrouillé
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-text">{CONTRACT_TYPE_LABELS[c.contractType as keyof typeof CONTRACT_TYPE_LABELS] ?? c.contractType}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={CONTRACT_STATUS_COLORS[c.status as keyof typeof CONTRACT_STATUS_COLORS] ?? ''}>
                        {CONTRACT_STATUS_LABELS[c.status as keyof typeof CONTRACT_STATUS_LABELS] ?? c.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User size={12} className="text-text-secondary/60 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-text truncate max-w-[140px]">{c.clientName || '—'}</p>
                          {c.clientType && (
                            <span className="text-[10px] text-text-secondary/60">{c.clientType}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-text-secondary/60 text-xs">—</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Home size={12} className="text-text-secondary/60 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-text truncate max-w-[160px]">{c.propertyTitle || '—'}</p>
                          {c.propertyRef && <p className="text-[10px] text-text-secondary/60 font-mono">{c.propertyRef}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-text text-sm">
                      {c.amount ? (
                        <>
                          {formatPrice(c.amount)}
                          {c.contractType === 'location_classique' && <span className="text-[10px] text-text-secondary/60">/mois</span>}
                          {c.contractType === 'location_saisonniere' && <span className="text-[10px] text-text-secondary/60 ml-0.5">/séjour</span>}
                        </>
                      ) : (
                        <span className="text-text-secondary/60">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">
                      {formatDate(c.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{currentUserName || '—'}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <ContractActionsMenu
                        contract={c}
                        basePath={basePath}
                        onDelete={(contract) => setDeleteTarget(contract)}
                      />
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-border/50 flex items-center justify-between text-xs text-text-secondary/60">
          <span>{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</span>
          <div className="flex items-center gap-4">
            <span>Confirmés / Actifs: {filtered.filter(c => c.status === 'confirme_actif').length}</span>
            <span>En cours: {filtered.filter(c => c.status === 'en_cours').length}</span>
            <span>Finalisés / Terminés: {filtered.filter(c => c.status === 'finalise_termine').length}</span>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer le contrat"
        message={deleteTarget ? `Cette action est irréversible. Le contrat ${deleteTarget.reference || ''} sera définitivement supprimé.` : ''}
        confirmLabel={deleting ? 'Suppression...' : 'Supprimer'}
      />
    </div>
  )
}
