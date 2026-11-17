import { useEffect, useMemo, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { FileText, Search, TrendingUp, Calendar, DollarSign, Home, RefreshCw, Tag, X } from 'react-feather'
import { Select } from '../../ui/Select'
import {
  MANDAT_TYPE_LABELS,
  TRANSACTION_ETAPE_LABELS,
  transactionFilters,
} from '../../../types/transactions'
import { fetchTransactions } from '../../../services/transactionService'
import { TransactionActions } from '../transactions/TransactionActionDialogs'
import { useStageFormClasses } from '../calendar/StageModal'
import {
  useDetailAccent,
  StagePill,
  RED_STAGE_HUE,
  SLATE_STAGE_HUE,
  DETAIL_TYPE_HUE,
} from './ClientInfos/ClientDetailStage'
import { STAGE_HUES, type StageHue } from '../../dashboard/Stage'

const etapeHue = (etape: string): StageHue => {
  switch (etape) {
    case 'signe':
    case 'actif':
      return STAGE_HUES.emerald
    case 'reservation':
    case 'en_attente':
      return STAGE_HUES.amber
    case 'cloture':
      return STAGE_HUES.sky
    case 'annule':
    case 'resilie':
      return RED_STAGE_HUE
    case 'expire':
      return SLATE_STAGE_HUE
    default:
      return SLATE_STAGE_HUE
  }
}

const roleHue = (role: string): StageHue => {
  return DETAIL_TYPE_HUE[role] || SLATE_STAGE_HUE
}

export const ClientTransactionsTab = ({ clientId, clientName, clientType, isGerant = false }: {
  clientId: string
  clientName: string
  clientType: string
  isGerant?: boolean
}) => {
  const { isDark, accent, ink } = useDetailAccent(clientType, isGerant)
  const { input: stageInput } = useStageFormClasses()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>(
    clientType === 'Acheteur' ? 'recherche_achat'
      : clientType === 'Bailleur' ? 'location_gestion'
      : clientType === 'Locataire' ? 'recherche_location'
      : 'all'
  )
  const [filterEtape, setFilterEtape] = useState<string>('all')

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true)
    fetchTransactions({ client_id: clientId }).then(setTransactions).catch(() => setTransactions([])).finally(() => setLoading(false));
  }, [clientId]);

  useEffect(() => {
    load()
  }, [load]);

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!t.reference.toLowerCase().includes(q) &&
            !(MANDAT_TYPE_LABELS as any)[t.type]?.toLowerCase().includes(q) &&
            !(TRANSACTION_ETAPE_LABELS as any)[t.etape]?.toLowerCase().includes(q) &&
            !(t.propertyTitle || '').toLowerCase().includes(q)) return false
      }
      if (filterType !== 'all' && t.type !== filterType) return false
      if (filterEtape !== 'all' && t.etape !== filterEtape) return false
      return true
    })
  }, [transactions, searchQuery, filterType, filterEtape])

  const typeOptions = clientType === 'Acheteur'
    ? [{ value: 'recherche_achat', label: 'Recherche achat' }]
    : clientType === 'Bailleur'
    ? [{ value: 'location_gestion', label: 'Location gestion' }]
    : clientType === 'Locataire'
    ? [{ value: 'recherche_location', label: 'Recherche location' }]
    : [
        { value: 'all', label: 'Tous les types' },
        ...transactionFilters.types,
      ]

  const etapeOptions = [
    { value: 'all', label: 'Tous les statuts' },
    ...transactionFilters.etapes,
  ]

  const actifCount = transactions.filter(t => t.etape === 'actif' || t.etape === 'signe').length
  const attenteCount = transactions.filter(t => t.etape === 'en_attente' || t.etape === 'reservation').length
  const hasActiveFilters = searchQuery !== '' || filterEtape !== 'all' || (filterType !== 'all' && typeOptions.length > 1)
  const resetFilters = () => {
    setSearchQuery('')
    setFilterEtape('all')
    if (typeOptions.length > 1) setFilterType('all')
  }

  return (
    <div className="space-y-5">
      {/* Hero Header — staged */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={`relative overflow-hidden rounded-2xl border p-4 backdrop-blur-sm sm:p-5 ${isDark ? 'border-white/[0.07] bg-white/[0.03]' : 'border-slate-200/70 bg-white/70 shadow-sm'}`}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(80% 120% at 100% 0%, ${accent.a}1F, transparent 60%)` }}
        />
        <div className="relative flex flex-col gap-4 xl:flex-row xl:items-center xl:gap-6">
          {/* Left — title + counts */}
          <div className="flex min-w-0 items-start gap-3 xl:w-[290px] xl:shrink-0">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border"
              style={isDark
                ? { background: `${accent.a}14`, borderColor: `${accent.a}30`, color: accent.a }
                : { background: `${accent.a}12`, borderColor: `${accent.a}30`, color: ink }}
            >
              <TrendingUp size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className={`text-sm font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Transactions</h3>
              <p className={`mt-0.5 truncate text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{clientName}</span>
                <span className="mx-1.5 opacity-40">—</span>
                {transactions.length} transaction{transactions.length > 1 ? 's' : ''} liée{transactions.length > 1 ? 's' : ''}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-extrabold tabular-nums backdrop-blur-md ${isDark ? 'border-white/10 bg-white/[0.04]' : 'border-slate-200/80 bg-white/70'}`}
                  style={{ color: isDark ? accent.a : accent.b }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent.line, boxShadow: `0 0 6px ${accent.glow}` }} />
                  {filtered.length}
                  <span className={`text-[10px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>affichée{filtered.length > 1 ? 's' : ''}</span>
                </span>
                {actifCount > 0 && (
                  <StagePill label={`${actifCount} actif${actifCount > 1 ? 's' : ''}`} hue={STAGE_HUES.emerald} isDark={isDark} />
                )}
                {attenteCount > 0 && (
                  <StagePill label={`${attenteCount} en attente`} hue={STAGE_HUES.amber} isDark={isDark} />
                )}
              </div>
            </div>
          </div>
          {/* Divider */}
          <div aria-hidden="true" className={`hidden w-px self-stretch xl:block ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
          {/* Center — filters */}
          <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: isDark ? '#8B7CFF' : '#0D9488' }} />
              <input
                type="text"
                placeholder="Référence, bien, étape..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={stageInput('h-9 pl-9 pr-9')}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Effacer la recherche"
                  className={`absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:bg-white/10 hover:text-white' : 'text-teal-900/40 hover:bg-teal-900/5 hover:text-teal-900'}`}
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <Select options={typeOptions} value={filterType} onValueChange={setFilterType} placeholder="Type" className="w-full sm:w-[150px] sm:shrink-0" />
            <div className="flex items-center gap-2">
              <Select options={etapeOptions} value={filterEtape} onValueChange={setFilterEtape} placeholder="Statut" className="w-full flex-1 sm:w-[150px] sm:flex-none" />
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  title="Réinitialiser les filtres"
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-bold backdrop-blur-md transition-all duration-200 hover:scale-[1.02] active:scale-95 ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/10 hover:text-white' : 'border-slate-200/80 bg-white text-slate-500 shadow-sm hover:text-slate-900'}`}
                >
                  <X size={12} />
                  <span className="hidden 2xl:inline">Réinitialiser</span>
                </button>
              )}
            </div>
          </div>
          {/* Divider */}
          <div aria-hidden="true" className={`hidden w-px self-stretch xl:block ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
          {/* Right — action */}
          <div className="flex shrink-0 items-center gap-2 xl:ml-0">
            <button
              type="button"
              onClick={load}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold backdrop-blur-md transition-all duration-200 hover:scale-[1.02] active:scale-95 sm:w-auto xl:w-auto ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10 hover:text-white' : 'border-slate-200/80 bg-white text-slate-600 shadow-sm hover:bg-white hover:text-slate-900'}`}
            >
              <RefreshCw size={14} /> Actualiser
            </button>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative mb-4 h-14 w-14">
            <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: `${accent.a}30` }} />
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent" style={{ borderTopColor: accent.a }} />
            <div className="absolute inset-2 animate-spin rounded-full border-2 border-transparent" style={{ borderTopColor: `${accent.a}99`, animationDirection: 'reverse', animationDuration: '1.5s' }} />
            <TrendingUp size={16} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color: ink }} />
          </div>
          <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Chargement...</p>
          <p className={`mt-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Récupération des transactions liées</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div
            className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border backdrop-blur-sm ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-500' : 'border-slate-200/70 bg-white/70 text-slate-400 shadow-sm'}`}
          >
            <FileText size={22} />
          </div>
          <p className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
            {transactions.length === 0 ? 'Aucune transaction pour ce client' : 'Aucun résultat'}
          </p>
          <p className={`mt-1 max-w-xs text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {transactions.length === 0
              ? "Les transactions apparaîtront automatiquement à la signature d'un mandat"
              : 'Essayez de modifier ou réinitialiser les filtres'}
          </p>
          {hasActiveFilters && transactions.length > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              className={`mt-3 inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold backdrop-blur-md transition-all duration-200 hover:scale-[1.02] active:scale-95 ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10 hover:text-white' : 'border-slate-200/80 bg-white text-slate-600 shadow-sm hover:text-slate-900'}`}
            >
              <X size={14} /> Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t, i) => {
            const h = etapeHue(t.etape)
            const rH = roleHue(t.role)
            const dateLabel = t.dateContracted ? new Date(t.dateContracted).toLocaleDateString('fr-FR') : '—'
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.4), duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className={`group overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 ${
                  isDark
                    ? 'border-white/[0.07] bg-white/[0.03] hover:border-white/[0.14] hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7)]'
                    : 'border-slate-200/70 bg-white/75 shadow-[0_1px_2px_rgba(15,23,42,0.05)] hover:shadow-[0_18px_44px_-20px_rgba(13,148,136,0.35)]'
                }`}
              >
                <div className="flex gap-3 p-4">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border"
                    style={isDark
                      ? { background: `${accent.a}14`, borderColor: `${accent.a}30`, color: accent.a }
                      : { background: `${accent.a}12`, borderColor: `${accent.a}30`, color: ink }}
                  >
                    <Home size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className={`font-mono text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.reference}</span>
                      <span className={`hidden h-3 w-px sm:block ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                      <span className={`truncate text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                        {t.propertyTitle || 'Sans bien lié'}
                      </span>
                    </div>
                    {t.propertyRef && (
                      <p className={`mt-0.5 font-mono text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t.propertyRef}</p>
                    )}
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <span
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold"
                        style={isDark
                          ? { background: `${accent.a}1E`, color: accent.a, border: `1px solid ${accent.a}36` }
                          : { background: `${accent.a}14`, color: ink, border: `1px solid ${accent.a}36` }}
                      >
                        <Tag size={10} />{(MANDAT_TYPE_LABELS as any)[t.type] || t.type}
                      </span>
                      <StagePill label={t.role} hue={rH} isDark={isDark} />
                      <StagePill label={(TRANSACTION_ETAPE_LABELS as any)[t.etape] || t.etape} hue={h} isDark={isDark} />
                    </div>
                    <div className={`mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar size={11} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                        {dateLabel}
                      </span>
                      <span className="inline-flex items-center gap-1.5 tabular-nums">
                        <DollarSign size={11} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                        <span className={`text-xs font-extrabold tabular-nums ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{t.montant}</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-start">
                    <div className="flex items-center justify-end gap-1">
                      <TransactionActions transaction={t} />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  )
}
