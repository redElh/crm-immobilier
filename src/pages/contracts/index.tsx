import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, Search, X, ChevronRight, Home, User } from 'react-feather'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import { Select } from '../../components/ui/Select'
import { DatePicker } from '../../components/ui/DatePicker'
import {
  mockContracts,
  contractFilters,
  CONTRACT_TYPE_LABELS,
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
  VENTE_ETAPE_LABELS,
  VENTE_ETAPE_COLORS,
  partyRoleColor,
} from '../../types/contract'
import type { ContractType, ContractStatus, Contract } from '../../types/contract'

const CURRENT_AGENT = 'Karim Eloui'

export default function ContractsPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<ContractType | ''>('')
  const [filterStatus, setFilterStatus] = useState<ContractStatus | ''>('')
  const [dateRange, setDateRange] = useState({ from: '', to: '' })

  const filtered = useMemo(() => {
    return mockContracts.filter(c => {
      if (c.agentPrincipal !== CURRENT_AGENT) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matchesSearch =
          c.reference.toLowerCase().includes(q) ||
          c.partieA.name.toLowerCase().includes(q) ||
          c.partieB.name.toLowerCase().includes(q) ||
          c.propertyTitle.toLowerCase().includes(q) ||
          c.propertyRef.toLowerCase().includes(q)
        if (!matchesSearch) return false
      }
      if (filterType && c.type !== filterType) return false
      if (filterStatus && c.status !== filterStatus) return false
      if (dateRange.from && c.dateCreation < dateRange.from) return false
      if (dateRange.to && c.dateCreation > dateRange.to) return false
      return true
    })
  }, [searchQuery, filterType, filterStatus, dateRange])

  const clearFilters = () => {
    setSearchQuery('')
    setFilterType('')
    setFilterStatus('')
    setDateRange({ from: '', to: '' })
  }

  const hasActiveFilters = searchQuery || filterType || filterStatus || dateRange.from || dateRange.to

  const totalAmount = (c: Contract) => {
    if (c.type === 'vente') return c.prixVente
    if (c.type === 'location_classique') return c.loyerMensuelHC
    if (c.type === 'location_saisonniere') return c.prixTotalSejour
    return undefined
  }

  const formatPrice = (p: number, devise: string) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: devise, maximumFractionDigits: 0 }).format(p)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Contrats</h1>
          <p className="text-sm text-text-secondary mt-1">
            {filtered.length} contrat{filtered.length !== 1 ? 's' : ''} enregistré{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
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

          {/* Current agent info */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/5 border border-accent/20 text-xs text-accent font-medium">
            <User size={12} />
            Agent: {CURRENT_AGENT}
          </div>

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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center text-text-secondary">
                    <FileText size={32} className="mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Aucun contrat trouvé</p>
                    <p className="text-xs text-text-secondary/60 mt-1">Les contrats sont générés automatiquement lors des transactions</p>
                  </td>
                </tr>
              ) : (
                filtered.map((contract, index) => {
                  const amount = totalAmount(contract)
                  return (
                    <motion.tr
                      key={contract.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02, duration: 0.2 }}
                      className="hover:bg-background/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/contracts/${contract.id}`)}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-text-secondary">{contract.reference}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium text-text">{CONTRACT_TYPE_LABELS[contract.type]}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={CONTRACT_STATUS_COLORS[contract.status]}>
                          {CONTRACT_STATUS_LABELS[contract.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User size={12} className="text-text-secondary/60 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm text-text truncate max-w-[140px]">{contract.partieA.name}</p>
                            <span className={`inline-block px-1.5 py-0.5 text-[10px] font-medium rounded border ${partyRoleColor(contract.partieA.type)}`}>
                              {contract.partieA.type}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User size={12} className="text-text-secondary/60 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm text-text truncate max-w-[140px]">{contract.partieB.name}</p>
                            <span className={`inline-block px-1.5 py-0.5 text-[10px] font-medium rounded border ${partyRoleColor(contract.partieB.type)}`}>
                              {contract.partieB.type}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Home size={12} className="text-text-secondary/60 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm text-text truncate max-w-[160px]">{contract.propertyTitle}</p>
                            <p className="text-[10px] text-text-secondary/60 font-mono">{contract.propertyRef}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-text text-sm">
                        {amount ? formatPrice(amount, contract.devise) : <span className="text-text-secondary/60">—</span>}
                        {contract.type === 'location_classique' && <span className="text-[10px] text-text-secondary/60">/mois</span>}
                        {contract.type === 'location_saisonniere' && <span className="text-[10px] text-text-secondary/60 ml-0.5">/séjour</span>}
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-xs">
                        {new Date(contract.dateCreation).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-xs">{contract.agentPrincipal}</td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" icon={<ChevronRight size={14} />} onClick={(e) => { e.stopPropagation(); navigate(`/contracts/${contract.id}`) }} />
                      </td>
                    </motion.tr>
                  )
                })
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
    </div>
  )
}
