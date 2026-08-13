import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, Printer, Search, X, Eye, Edit3, Send, CheckCircle, Clock, Home, AlertTriangle, ArrowUp, ArrowDown, Lock } from 'react-feather'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import { Select } from '../../components/ui/Select'
import { DatePicker } from '../../components/ui/DatePicker'
import { RegistreActionsMenu } from '../../components/ui/RegistreActionsMenu'
import { RegistreDetailModal } from '../../components/ui/RegistreDetailModal'
import { RegistreEditModal } from '../../components/ui/RegistreEditModal'
import { RegistreContratModal } from '../../components/ui/RegistreContratModal'
import { RegistreEnvoyerModal } from '../../components/ui/RegistreEnvoyerModal'
import { PdfViewerModal } from '../../components/ui/PdfViewerModal'
import { CsvPreviewModal } from '../../components/ui/CsvPreviewModal'
import { fetchRegistre } from '../../services/registreService'
import { api } from '../../services/api'
import { usePermission, useRestriction } from '../../hooks/usePermission'
import { generateContratPdf, generateContratHtml, generateContratCsv } from '../../utils/generateContratPdf'
import {
  transactionFilters,
  MANDAT_TYPE_LABELS,
  TRANSACTION_ETAPE_LABELS,
  TRANSACTION_ETAPE_COLORS,
  CLIENT_TYPE_LABELS,
  CLIENT_TYPE_COLORS,
} from '../../types/transactions'
import type { MandatType, TransactionEtape, Transaction } from '../../types/transactions'

export default function RegisterPage() {
  const canRead = usePermission('registre-lecture')
  const canWrite = usePermission('registre-ecriture')
  const canExport = usePermission('registre-general-export')
  const menuLocked = useRestriction('registre-info-privees')
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<MandatType | ''>('')
  const [filterEtape, setFilterEtape] = useState<TransactionEtape | ''>('')
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [detailTxn, setDetailTxn] = useState<Transaction | null>(null)
  const [editTxn, setEditTxn] = useState<Transaction | null>(null)
  const [contratTxn, setContratTxn] = useState<Transaction | null>(null)
  const [envoyerTxn, setEnvoyerTxn] = useState<Transaction | null>(null)
  const [pdfHtml, setPdfHtml] = useState('')
  const [pdfFilename, setPdfFilename] = useState('')
  const [csvContent, setCsvContent] = useState('')
  const [csvFilename, setCsvFilename] = useState('')

  useEffect(() => {
    api.get<any>('/auth/me').then(setCurrentUser).catch(() => {})
  }, [])

  useEffect(() => {
    if (!currentUser) return
    loadRegistre()
  }, [currentUser])

  const loadRegistre = async () => {
    setLoading(true)
    try {
      const data = await fetchRegistre({ agent_id: String(currentUser.id) })
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
      if (filterType && t.type !== filterType) return false
      if (filterEtape && t.etape !== filterEtape) return false
      if (dateRange.from && t.dateContrat < dateRange.from) return false
      if (dateRange.to && t.dateContrat > dateRange.to) return false
      return true
    })
  }, [entries, searchQuery, filterType, filterEtape, dateRange])

  const clearFilters = () => {
    setSearchQuery('')
    setFilterType('')
    setFilterEtape('')
    setDateRange({ from: '', to: '' })
  }

  const hasActiveFilters = searchQuery || filterType || filterEtape || dateRange.from || dateRange.to

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

  const kpiCards = [
    { label: 'Total mandats', value: kpiData.total, evolution: '', up: true, icon: FileText, color: 'text-accent', bg: 'bg-accent-light' },
    { label: 'Actifs', value: kpiData.actifs, evolution: '', up: true, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Reserves', value: kpiData.reserves, evolution: '', up: true, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Termines', value: kpiData.termines, evolution: '', up: true, icon: Home, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Resilies', value: kpiData.resilies, evolution: '', up: true, icon: X, color: 'text-rose-500', bg: 'bg-rose-50' },
    { label: 'Expires', value: kpiData.expires, evolution: '', up: false, icon: AlertTriangle, color: 'text-gray-500', bg: 'bg-gray-50' },
    { label: 'Annules', value: kpiData.annules, evolution: '', up: true, icon: X, color: 'text-red-500', bg: 'bg-red-50' },
  ]

  if (!canRead) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-border/40 flex items-center justify-center mb-4">
          <Lock size={28} className="text-text-secondary" />
        </div>
        <h2 className="text-lg font-semibold">Registre inaccessible</h2>
        <p className="text-sm text-text-secondary mt-1 max-w-sm">
          Vous n'avez pas la permission de consulter le registre. Contactez votre administrateur.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Registre des mandats</h1>
          <p className="text-sm text-text-secondary mt-1">
            {kpiData.total} transactions enregistrées · {kpiData.actifs} actives · {kpiData.reserves} réservées · {kpiData.termines} terminées · {kpiData.expires} expirées · {kpiData.annules} annulées · {kpiData.resilies} résiliées
          </p>
        </div>
      </div>

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
            </motion.div>
          )
        })}
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
            Agent: {currentUser ? [currentUser.first_name, currentUser.last_name].filter(Boolean).join(' ') || currentUser.email : '...'}
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
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Type client</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Produit</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Étape</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Contracté le</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary">Montant</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Agent</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center text-text-secondary">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent/20 border-t-accent mx-auto mb-3" />
                    <p className="text-sm">Chargement du registre...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
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
                    className="hover:bg-background/50 transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-text-secondary">{transaction.reference}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-text">
                        {(MANDAT_TYPE_LABELS as any)[transaction.type] || transaction.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-text">{transaction.clientName}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-lg border ${CLIENT_TYPE_COLORS[transaction.clientType] || 'bg-text-secondary/10 text-text-secondary border-text-secondary/20'}`}>
                        {CLIENT_TYPE_LABELS[transaction.clientType] || transaction.clientType || '—'}
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
                      <Badge className={(TRANSACTION_ETAPE_COLORS as any)[transaction.etape]}>
                        {(TRANSACTION_ETAPE_LABELS as any)[transaction.etape] || transaction.etape}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">
                      {transaction.dateContrat
                        ? new Date(transaction.dateContrat).toLocaleDateString('fr-FR')
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-text">
                      {transaction.montant
                        ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(Number(transaction.montant))
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{transaction.agentName}</td>
                    <td className="px-4 py-3 text-center">
                      {menuLocked ? (
                        <button
                          type="button"
                          disabled
                          title="Actions verrouillées"
                          className="p-1.5 rounded-lg text-text-secondary/40 cursor-not-allowed opacity-60 blur-[1px]"
                        >
                          <Lock size={14} />
                        </button>
                      ) : (
                        <RegistreActionsMenu
                          actions={[
                            { icon: <Eye size={14} />, label: 'Voir les détails', onClick: () => { setDetailTxn(transaction) } },
                            ...(canWrite
                              ? [{ icon: <Edit3 size={14} />, label: 'Modifier', onClick: () => { setEditTxn(transaction) } }]
                              : []),
                            { icon: <FileText size={14} />, label: 'Voir le contrat', onClick: () => { setContratTxn(transaction) } },
                            ...(canWrite
                              ? [{ icon: <Send size={14} />, label: 'Envoyer au client', onClick: () => { setEnvoyerTxn(transaction) } }]
                              : []),
                            ...(canExport
                              ? [{ icon: <Download size={14} />, label: 'Exporter en PDF', onClick: async () => {
                                try {
                                  const data = await fetchPdfData(transaction)
                                  setPdfHtml(generateContratHtml(data))
                                  setPdfFilename(`mandat_${transaction.reference || transaction.id}`)
                                } catch {}
                              } }]
                              : []),
                            { icon: <Printer size={14} />, label: 'Imprimer', onClick: async () => {
                              try {
                                const data = await fetchPdfData(transaction)
                                generateContratPdf(data)
                              } catch {}
                            } },
                            ...(canExport
                              ? [{ icon: <Download size={14} />, label: 'Exporter en CSV', onClick: async () => {
                                try {
                                  const data = await fetchPdfData(transaction)
                                  setCsvContent(generateContratCsv(data))
                                  setCsvFilename(`mandat_${transaction.reference || transaction.id}.csv`)
                                } catch {}
                              } }]
                              : []),
                            { separator: true, icon: <></>, label: '', onClick: () => {} },
                          ]}
                        />
                      )}
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
            <span>Résiliés: {filtered.filter(t => t.etape === 'resilie').length}</span>
          </div>
        </div>
      </div>

      <RegistreDetailModal
        isOpen={!!detailTxn}
        onClose={() => setDetailTxn(null)}
        transaction={detailTxn}
      />

      <RegistreEditModal
        isOpen={!!editTxn}
        onClose={() => setEditTxn(null)}
        transaction={editTxn}
        onSaved={() => loadRegistre()}
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
