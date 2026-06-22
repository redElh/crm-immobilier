import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, Printer, Search, X } from 'react-feather'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import { Select } from '../../components/ui/Select'
import { DatePicker } from '../../components/ui/DatePicker'
import {
  mockTransactions,
  transactionFilters,
  MANDAT_TYPE_LABELS,
  TRANSACTION_ETAPE_LABELS,
  TRANSACTION_ETAPE_COLORS,
} from '../../types/transactions'
import type { MandatType, TransactionEtape, Transaction } from '../../types/transactions'

const CURRENT_AGENT = 'Karim Eloui'

export default function RegisterPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<MandatType | ''>('')
  const [filterEtape, setFilterEtape] = useState<TransactionEtape | ''>('')
  const [filterAgent, setFilterAgent] = useState(CURRENT_AGENT)
  const [dateRange, setDateRange] = useState({ from: '', to: '' })

  const filtered = useMemo(() => {
    return mockTransactions.filter(t => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matchesSearch =
          t.reference.toLowerCase().includes(q) ||
          t.clientName.toLowerCase().includes(q) ||
          t.propertyTitle?.toLowerCase().includes(q) ||
          t.propertyRef?.toLowerCase().includes(q)
        if (!matchesSearch) return false
      }
      if (filterType && t.type !== filterType) return false
      if (filterEtape && t.etape !== filterEtape) return false
      if (t.agentName !== CURRENT_AGENT) return false
      if (dateRange.from && t.dateContracted < dateRange.from) return false
      if (dateRange.to && t.dateContracted > dateRange.to) return false
      return true
    })
  }, [searchQuery, filterType, filterEtape, filterAgent, dateRange])

  const clearFilters = () => {
    setSearchQuery('')
    setFilterType('')
    setFilterEtape('')
    setDateRange({ from: '', to: '' })
  }

  const hasActiveFilters = searchQuery || filterType || filterEtape || dateRange.from || dateRange.to

  const roleColor = (role: string) => {
    switch (role) {
      case 'Vendeur': case 'Propriétaire': return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
      case 'Acheteur': case 'Acquéreur': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'Locataire': return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
      case 'Bailleur': return 'bg-orange-500/10 text-orange-500 border-orange-500/20'
      case 'Voyageur': return 'bg-pink-500/10 text-pink-500 border-pink-500/20'
      default: return 'bg-text-secondary/10 text-text-secondary border-text-secondary/20'
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Registre des mandats</h1>
          <p className="text-sm text-text-secondary mt-1">
            {filtered.length} transaction{filtered.length !== 1 ? 's' : ''} enregistrée{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<Printer size={14} />}>Imprimer</Button>
          <Button variant="outline" size="sm" icon={<Download size={14} />}>Exporter</Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/60" />
            <input
              type="text"
              placeholder="Rechercher..."
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

          {/* Type filter */}
          <Select
            value={filterType}
            onChange={(val: string) => setFilterType(val as MandatType | '')}
            options={[{ value: '', label: 'Tous types' }, ...transactionFilters.types]}
            className="min-w-[140px]"
          />

          {/* Étape filter */}
          <Select
            value={filterEtape}
            onChange={(val: string) => setFilterEtape(val as TransactionEtape | '')}
            options={[{ value: '', label: 'Toutes étapes' }, ...transactionFilters.etapes]}
            className="min-w-[140px]"
          />

          {/* Current agent info */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/5 border border-accent/20 text-xs text-accent font-medium">
            <FileText size={12} />
            Agent: {CURRENT_AGENT}
          </div>

          {/* Date range */}
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

      {/* Table */}
      <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-background border-b border-border/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Référence</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Client</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Rôle</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Produit</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Étape</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Contracté le</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary">Montant</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Agent</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center text-text-secondary">
                    <FileText size={32} className="mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Aucune transaction trouvée</p>
                    <p className="text-xs text-text-secondary/60 mt-1">Essayez de modifier vos filtres</p>
                  </td>
                </tr>
              ) : (
                filtered.map((transaction, index) => (
                  <motion.tr
                    key={transaction.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02, duration: 0.2 }}
                    className="hover:bg-background/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-text-secondary">{transaction.reference}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-text">
                        {MANDAT_TYPE_LABELS[transaction.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-text">{transaction.clientName}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-lg border ${roleColor(transaction.role)}`}>
                        {transaction.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {transaction.propertyTitle ? (
                        <div>
                          <p className="text-sm text-text">{transaction.propertyTitle}</p>
                          {transaction.propertyRef && (
                            <p className="text-[10px] text-text-secondary/60 font-mono">{transaction.propertyRef}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-text-secondary/60 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={TRANSACTION_ETAPE_COLORS[transaction.etape]}>
                        {TRANSACTION_ETAPE_LABELS[transaction.etape]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">
                      {new Date(transaction.dateContracted).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-text">
                      {transaction.montant}
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{transaction.agentName}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" icon={<FileText size={13} />} />
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer stats */}
        <div className="px-4 py-3 border-t border-border/50 flex items-center justify-between text-xs text-text-secondary/60">
          <span>{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</span>
          <div className="flex items-center gap-4">
            <span>Actifs: {filtered.filter(t => t.etape === 'actif' || t.etape === 'signe').length}</span>
            <span>Réservations: {filtered.filter(t => t.etape === 'reservation').length}</span>
            <span>Clôturés: {filtered.filter(t => t.etape === 'cloture').length}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
