import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Search, Plus } from 'react-feather'
import { Badge } from '../../ui/Badge'
import { Button } from '../../ui/Button'
import { Select } from '../../ui/Select'
import {
  getPropertyTransactions,
  MANDAT_TYPE_LABELS,
  TRANSACTION_ETAPE_LABELS,
  TRANSACTION_ETAPE_COLORS,
  transactionFilters,
} from '../../../types/transactions'
import type { MandatType, TransactionEtape } from '../../../types/transactions'
import { TransactionActions } from '../transactions/TransactionActionDialogs'

const roleColor = (role: string, isGerant: boolean) => {
  switch (role) {
    case 'Vendeur': case 'Propriétaire': return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
    case 'Acheteur': case 'Acquéreur': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    case 'Locataire': return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
    case 'Bailleur': return isGerant ? 'bg-[#905D5D]/10 text-[#905D5D] border-[#905D5D]/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'
    case 'Voyageur': return 'bg-pink-500/10 text-pink-500 border-pink-500/20'
    default: return 'bg-text-secondary/10 text-text-secondary border-text-secondary/20'
  }
}

export const PropertyTransactionsTab = ({ propertyId, propertyTitle, propertyRef, isGerant = false }: {
  propertyId: string
  propertyTitle: string
  propertyRef: string
  isGerant?: boolean
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterEtape, setFilterEtape] = useState<string>('all')

  const transactions = useMemo(() => getPropertyTransactions(propertyId), [propertyId])

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!t.reference.toLowerCase().includes(q) &&
            !t.clientName.toLowerCase().includes(q) &&
            !MANDAT_TYPE_LABELS[t.type].toLowerCase().includes(q) &&
            !TRANSACTION_ETAPE_LABELS[t.etape].toLowerCase().includes(q)) return false
      }
      if (filterType !== 'all' && t.type !== filterType) return false
      if (filterEtape !== 'all' && t.etape !== filterEtape) return false
      return true
    })
  }, [transactions, searchQuery, filterType, filterEtape])

  const typeOptions = [
    { value: 'all', label: 'Tous les types' },
    ...transactionFilters.types,
  ]

  const etapeOptions = [
    { value: 'all', label: 'Tous les statuts' },
    ...transactionFilters.etapes,
  ]

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
        <FileText size={32} className="mb-3 opacity-40" />
        <p className="text-sm">Aucune transaction pour ce bien</p>
        <p className="text-xs text-text-secondary/60 mt-1">Les transactions apparaitront automatiquement a la signature d'un mandat</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-xs text-text-secondary">
          {filtered.length} transaction{filtered.length !== 1 ? 's' : ''} liee{filtered.length !== 1 ? 's' : ''} a <span className="font-medium text-text">{propertyTitle}</span>
        </p>
        <Button variant="outline" size="sm" icon={<Plus size={14} />}>
          Nouvelle transaction
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/60" />
          <input
            type="text"
            placeholder="Rechercher par client, type, statut..."
            className={`w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 transition-all ${isGerant ? 'focus:ring-[#905D5D]/20 focus:border-[#905D5D]' : 'focus:ring-accent/20 focus:border-accent'}`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select options={typeOptions} value={filterType} onValueChange={setFilterType} placeholder="Tous les types" className="min-w-[140px]" />
        <Select options={etapeOptions} value={filterEtape} onValueChange={setFilterEtape} placeholder="Tous les statuts" className="min-w-[140px]" />
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-background border-b border-border">
              <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Ref.</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Type</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Client</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Role</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Etape</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Date</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary">Montant</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((t, i) => (
              <motion.tr
                key={t.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.2 }}
                className="hover:bg-background/50 transition-colors"
              >
                <td className="px-4 py-3 font-mono text-xs text-text-secondary">{t.reference}</td>
                <td className="px-4 py-3 text-xs font-medium text-text">{MANDAT_TYPE_LABELS[t.type]}</td>
                <td className="px-4 py-3 font-medium text-text text-sm">{t.clientName}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-lg border ${roleColor(t.role, isGerant)}`}>
                    {t.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge className={TRANSACTION_ETAPE_COLORS[t.etape]}>
                    {TRANSACTION_ETAPE_LABELS[t.etape]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-text-secondary">
                  {t.dateContracted ? new Date(t.dateContracted).toLocaleDateString('fr-FR') : '—'}
                </td>
                <td className="px-4 py-3 text-right font-medium text-text text-sm">{t.montant}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <TransactionActions transaction={t} />
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
