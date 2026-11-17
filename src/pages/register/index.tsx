import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  FileText, Download, Printer, X, Eye, Edit3, Send, CheckCircle, Clock, Home,
  AlertTriangle, Lock, BookOpen, User, RefreshCw, XCircle, Sliders, Pause,
} from 'react-feather'
import { Select } from '../../components/ui/Select'
import { SearchInput } from '../../components/ui/SearchInput'
import { DatePicker } from '../../components/ui/DatePicker'
import { RegistreActionsMenu } from '../../components/ui/RegistreActionsMenu'
import { RegistreDetailModal } from '../../components/ui/RegistreDetailModal'
import { RegistreEditModal } from '../../components/ui/RegistreEditModal'
import { RegistreContratModal } from '../../components/ui/RegistreContratModal'
import { RegistreEnvoyerModal } from '../../components/ui/RegistreEnvoyerModal'
import { PdfViewerModal } from '../../components/ui/PdfViewerModal'
import { CsvPreviewModal } from '../../components/ui/CsvPreviewModal'
import { PrintPreviewModal } from '../../components/ui/PrintPreviewModal'
import { fetchRegistre } from '../../services/registreService'
import { api } from '../../services/api'
import { usePermission, useRestriction } from '../../hooks/usePermission'
import { generateContratHtml, generateContratCsv } from '../../utils/generateContratPdf'
import {
  transactionFilters,
} from '../../types/transactions'
import type { MandatType, TransactionEtape, Transaction } from '../../types/transactions'
import {
  Stage, useStageTheme, STAGE_HUES, SLATE_HUE, OrbIcon,
  StageBadge, AnimatedNumber, GlowSparkline, StageButton,
} from '../../components/dashboard/Stage'
import {
  useRegistreAccent, HuePill, StagedRegistreCard, ORANGE_HUE,
} from '../../components/modules/registre/RegistreStage'
import { RED_HUE } from '../../components/modules/prospects/ProspectCard'

export default function RegisterPage() {
  const canRead = usePermission('registre-lecture')
  const canWrite = usePermission('registre-ecriture')
  const canExport = usePermission('registre-general-export')
  const menuLocked = useRestriction('registre-info-privees')
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)
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
  const [printHtml, setPrintHtml] = useState('')
  const [printFilename, setPrintFilename] = useState('')
  const theme = useStageTheme()
  const isDark = theme === 'dark'
  const { accent, ink } = useRegistreAccent()

  useEffect(() => {
    api.get<any>('/auth/me').then(setCurrentUser).catch(() => {})
  }, [])

  useEffect(() => {
    if (!currentUser) return
    loadRegistre().finally(() => setRefreshing(false))
  }, [currentUser, refreshTick])

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

  const handleRefresh = () => {
    if (refreshing) return
    setRefreshing(true)
    setRefreshTick(t => t + 1)
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
          t.reference?.toLowerCase().includes(q) ||
          t.clientName?.toLowerCase().includes(q) ||
          t.propertyTitle?.toLowerCase().includes(q) ||
          t.propertyRef?.toLowerCase().includes(q) ||
          t.agentName?.toLowerCase().includes(q)
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

  const hasActiveFilters = !!(searchQuery || filterType || filterEtape || dateRange.from || dateRange.to)

  const kpiData = useMemo(() => {
    const total = entries.length
    const actifs = entries.filter(t => t.etape === 'actif' || t.etape === 'signe').length
    const enAttente = entries.filter(t => t.etape === 'en_attente').length
    const expires = entries.filter(t => t.etape === 'expire').length
    const reserves = entries.filter(t => t.etape === 'reservation').length
    const termines = entries.filter(t => t.etape === 'cloture').length
    const annules = entries.filter(t => t.etape === 'annule').length
    const resilies = entries.filter(t => t.etape === 'resilie').length
    return { total, actifs, enAttente, expires, reserves, termines, annules, resilies }
  }, [entries])

  const pct = (n: number) => (kpiData.total > 0 ? Math.round((n / kpiData.total) * 100) : 0)

  const kpiCards = [
    { icon: BookOpen, label: 'Total mandats', value: kpiData.total, hue: STAGE_HUES.violet, spark: [2, 4, 3, 6, 5, 8] },
    { icon: CheckCircle, label: 'Actifs & signés', value: kpiData.actifs, hue: STAGE_HUES.emerald, spark: [1, 3, 2, 5, 4, 7] },
    { icon: Clock, label: 'Réservations', value: kpiData.reserves, hue: STAGE_HUES.amber, spark: [1, 2, 1, 3, 2, 4] },
    { icon: Pause, label: 'En attente', value: kpiData.enAttente, hue: STAGE_HUES.sky, spark: [2, 1, 3, 2, 1, 3] },
    { icon: Home, label: 'Clôturés', value: kpiData.termines, hue: SLATE_HUE, spark: [1, 2, 3, 2, 4, 3] },
    { icon: AlertTriangle, label: 'Expirés', value: kpiData.expires, hue: ORANGE_HUE, spark: [2, 1, 2, 1, 2, 1] },
    { icon: X, label: 'Résiliés', value: kpiData.resilies, hue: RED_HUE, spark: [1, 1, 2, 1, 1, 1] },
    { icon: XCircle, label: 'Annulés', value: kpiData.annules, hue: RED_HUE, spark: [1, 2, 1, 1, 2, 1] },
  ]

  const buildCardActions = (transaction: Transaction) => (
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
            setPrintHtml(generateContratHtml(data))
            setPrintFilename(`contrat_${transaction.reference || transaction.id}`)
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
  )

  const currentUserName = currentUser
    ? [currentUser.first_name, currentUser.last_name].filter(Boolean).join(' ') || currentUser.email
    : ''

  if (!canRead) {
    return (
      <Stage theme={theme}>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-border/40 flex items-center justify-center mb-4">
            <Lock size={28} className="text-text-secondary" />
          </div>
          <h2 className="text-lg font-semibold">Registre inaccessible</h2>
          <p className="text-sm text-text-secondary mt-1 max-w-sm">
            Vous n'avez pas la permission de consulter le registre. Contactez votre administrateur.
          </p>
        </div>
      </Stage>
    )
  }

  return (
    <Stage theme={theme}>
      <div className="space-y-6 animate-fade-in">
        {/* Header hero */}
        <div className="stage-glass relative overflow-hidden p-5 sm:p-6">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.16), transparent 70%)' }} />
          <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full pointer-events-none opacity-40" style={{ background: 'radial-gradient(circle, rgba(124,92,255,0.20), transparent 70%)' }} />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(139,124,255,0.9)]" /></span>
                <p className={`text-[10px] font-bold uppercase tracking-[0.22em] ${isDark ? 'text-slate-400/80' : 'text-teal-900/50'}`}>Registre · Vue d'ensemble</p>
              </div>
              <h1 className={`mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'bg-gradient-to-r from-white via-violet-100 to-violet-300 bg-clip-text text-transparent' : 'bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-600 bg-clip-text text-transparent'}`}>Registre des mandats</h1>
              <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-teal-900/60'}`}>
                {kpiData.total} mandats enregistrés · {kpiData.actifs} actifs · {kpiData.reserves} réservés · {kpiData.termines} clôturés · {kpiData.expires} expirés
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: 'rgba(124,92,255,0.18)', background: 'rgba(124,92,255,0.10)', color: isDark ? '#C7CBFF' : '#5B4BD4' }}>
                  <BookOpen size={12} />{kpiData.total} total
                </span>
                {kpiData.actifs > 0 && <span className="inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold" style={{ borderColor: 'rgba(16,185,129,0.18)', background: 'rgba(16,185,129,0.10)', color: '#059669' }}><CheckCircle size={12} />{kpiData.actifs} actifs</span>}
                {kpiData.reserves > 0 && <span className="inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold" style={{ borderColor: 'rgba(251,191,36,0.20)', background: 'rgba(251,191,36,0.10)', color: isDark ? '#FDE68A' : '#B45309' }}><Clock size={12} />{kpiData.reserves} réservations</span>}
                {kpiData.termines > 0 && <span className="inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold" style={{ borderColor: 'rgba(148,163,184,0.30)', background: 'rgba(148,163,184,0.12)', color: isDark ? '#CBD5E1' : '#475569' }}><Home size={12} />{kpiData.termines} clôturés</span>}
                {menuLocked && (
                  <span className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold ${isDark ? 'border-white/10 bg-white/[0.05] text-slate-300' : 'border-slate-200/80 bg-white/70 text-slate-500'}`}>
                    <Lock size={12} /> Informations privées verrouillées
                  </span>
                )}
                {currentUserName && (
                  <span className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold ${isDark ? 'border-white/10 bg-white/[0.05] text-slate-300' : 'border-teal-900/10 bg-white/70 text-teal-800'}`}>
                    <User size={12} />Agent : {currentUserName}
                  </span>
                )}
              </div>
            </div>
            <StageButton
              variant="glass"
              size="md"
              icon={<RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />}
              onClick={handleRefresh}
              disabled={refreshing}
              className="shrink-0"
            >
              {refreshing ? 'Actualisation...' : 'Actualiser'}
            </StageButton>
          </div>
        </div>

        {/* KPI Cards — compact premium strip */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
          {kpiCards.map((k, i) => (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -2 }}
              className="stage-glass group relative flex h-full min-w-0 flex-col overflow-hidden rounded-xl p-3"
            >
              <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full pointer-events-none opacity-30" style={{ background: `radial-gradient(circle, ${k.hue.glow}, transparent 70%)` }} />
              <div className="relative flex min-w-0 items-center gap-2.5">
                <OrbIcon icon={k.icon} hue={k.hue} size={30} radius={9} />
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-[9px] font-bold uppercase leading-tight tracking-[1.4px] ${isDark ? 'text-slate-400' : 'text-teal-900/60'}`}>{k.label}</p>
                  <div className="mt-0.5 flex items-baseline gap-0.5">
                    <AnimatedNumber
                      value={k.value}
                      className={isDark ? 'text-[20px] font-extrabold leading-none tracking-[-0.5px] text-white' : 'text-[20px] font-extrabold leading-none tracking-[-0.5px] text-slate-900'}
                    />
                  </div>
                </div>
              </div>
              <div className="relative mt-auto pt-2.5">
                <div className="flex h-[18px] items-center justify-between gap-1">
                  <span
                    className="inline-flex shrink-0 items-center gap-0.5 self-start rounded-full border px-1.5 py-0.5 text-[9px] font-bold"
                    style={{ color: isDark ? '#94A3B8' : '#475569', borderColor: 'rgba(148,163,184,0.35)', backgroundColor: 'rgba(148,163,184,0.10)' }}
                  >
                    {pct(k.value)}%
                  </span>
                  <div className="min-w-0 flex-1">
                    <GlowSparkline data={k.spark} color={k.hue.line} height={18} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Search + Filters + Liste */}
        <div className="stage-glass overflow-hidden rounded-2xl">
          <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, transparent, ${isDark ? 'rgba(139,124,255,0.9)' : 'rgba(20,184,166,0.9)'} 18%, ${isDark ? '#8B7CFF' : '#14B8A6'} 50%, transparent)` }} />
          <div className="space-y-4 px-5 pb-4 pt-5" style={{ background: isDark ? 'radial-gradient(90% 140% at 0% 0%, rgba(139,124,255,0.07), transparent 65%)' : 'radial-gradient(90% 140% at 0% 0%, rgba(20,184,166,0.06), transparent 65%)' }}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <OrbIcon icon={Sliders} hue={accent} size={26} radius={8} />
                <div>
                  <p className={`text-sm font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Recherche & filtres</p>
                  <p className={`text-[11px] leading-tight ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <AnimatedNumber value={filtered.length} className="inline font-semibold" /> mandat{filtered.length !== 1 ? 's' : ''} sur {entries.length}
                  </p>
                </div>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border px-3.5 text-xs font-semibold backdrop-blur-md transition-all ${isDark ? 'border-white/10 bg-white/[0.06] text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white' : 'border-teal-900/10 bg-white/80 text-teal-700 shadow-[0_4px_14px_-8px_rgba(13,148,136,0.5)] hover:border-teal-900/20 hover:bg-teal-50'}`}
                >
                  <X size={12} /> Réinitialiser
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
              <div>
                <label className={`block mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] ${isDark ? 'text-slate-400/85' : 'text-teal-900/55'}`}>Recherche</label>
                <SearchInput
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Réf., client, bien, agent..."
                />
              </div>
              <Select
                label="Type de mandat"
                className="!h-10"
                options={[{ value: '', label: 'Tous les types' }, ...transactionFilters.types]}
                value={filterType}
                onChange={(val: string) => setFilterType(val as MandatType | '')}
              />
              <Select
                label="Étape"
                className="!h-10"
                options={[{ value: '', label: 'Toutes les étapes' }, ...transactionFilters.etapes]}
                value={filterEtape}
                onChange={(val: string) => setFilterEtape(val as TransactionEtape | '')}
              />
              <div>
                <label className={`block mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] ${isDark ? 'text-slate-400/85' : 'text-teal-900/55'}`}>Période</label>
                <div className="flex items-center gap-2">
                  <DatePicker value={dateRange.from} onChange={e => setDateRange(prev => ({ ...prev, from: e.target.value }))} placeholder="Date de début" className="w-[145px] !h-10" />
                  <span className={`${isDark ? 'text-slate-500' : 'text-slate-400'} text-xs`}>—</span>
                  <DatePicker value={dateRange.to} onChange={e => setDateRange(prev => ({ ...prev, to: e.target.value }))} placeholder="Date de fin" className="w-[145px] !h-10" />
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="relative flex h-12 w-12 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400/20" />
                <span className="relative inline-flex h-8 w-8 animate-spin rounded-full border-2 border-violet-400/80 border-t-transparent" />
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="max-w-sm p-10 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.03)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)'}` }}>
                  <BookOpen size={22} className={isDark ? 'text-white/20' : 'text-slate-400/60'} />
                </div>
                <h3 className={`mb-1 text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Aucun mandat trouvé</h3>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Essayez de modifier vos filtres — les mandats s'ajoutent au registre à chaque transaction</p>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-3 px-5">
                <div className="flex items-center gap-2.5">
                  <OrbIcon icon={BookOpen} hue={accent} size={26} radius={8} />
                  <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Liste des mandats</span>
                </div>
                <StageBadge variant="neutral">
                  <AnimatedNumber value={filtered.length} className="inline font-bold" /> mandat{filtered.length !== 1 ? 's' : ''}
                </StageBadge>
              </div>
              <div className="mb-3 flex flex-wrap items-center gap-1.5 px-5">
                <HuePill hue={STAGE_HUES.emerald} label={`${filtered.filter(t => t.etape === 'actif' || t.etape === 'signe').length} actifs`} isDark={isDark} />
                <HuePill hue={STAGE_HUES.amber} label={`${filtered.filter(t => t.etape === 'reservation').length} réservations`} isDark={isDark} />
                <HuePill hue={SLATE_HUE} label={`${filtered.filter(t => t.etape === 'cloture').length} clôturés`} isDark={isDark} />
                <HuePill hue={ORANGE_HUE} label={`${filtered.filter(t => t.etape === 'en_attente' || t.etape === 'expire').length} en attente / expirés`} isDark={isDark} />
                <HuePill hue={RED_HUE} label={`${filtered.filter(t => t.etape === 'resilie' || t.etape === 'annule').length} résiliés / annulés`} isDark={isDark} />
              </div>
              <div className="grid grid-cols-1 items-stretch gap-4 p-5 pb-5 md:grid-cols-2 2xl:grid-cols-3">
                {filtered.map((transaction, index) => (
                  <StagedRegistreCard
                    key={transaction.id}
                    t={transaction}
                    index={index}
                    isDark={isDark}
                    menuLocked={menuLocked}
                    onOpen={() => setDetailTxn(transaction)}
                    actions={buildCardActions(transaction)}
                  />
                ))}
              </div>
            </div>
          )}
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
          title={`Export PDF · ${pdfFilename}`}
        />

        <CsvPreviewModal
          isOpen={!!csvContent}
          onClose={() => { setCsvContent(''); setCsvFilename('') }}
          csv={csvContent}
          filename={csvFilename}
          title={`Export CSV · ${csvFilename}`}
        />

        <PrintPreviewModal
          isOpen={!!printHtml}
          onClose={() => { setPrintHtml(''); setPrintFilename('') }}
          html={printHtml}
          filename={printFilename}
          title={`Impression du contrat`}
        />
      </div>
    </Stage>
  )
}
