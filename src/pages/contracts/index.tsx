import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, useSpring, useMotionValue, useReducedMotion } from 'framer-motion'
import {
  FileText, X, Home, User, Briefcase, Sun, Key, CheckCircle,
  Shield, Clock, DollarSign, Lock, Sliders, ArrowUp, ArrowDown, TrendingUp, RefreshCw,
} from 'react-feather'
import { Select } from '../../components/ui/Select'
import { SearchInput } from '../../components/ui/SearchInput'
import { DatePicker } from '../../components/ui/DatePicker'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { ContractActionsMenu } from '../../components/ui/ContractActionsMenu'
import { useToast } from '../../components/ui/Toast'
import { fetchContracts, deleteContract } from '../../services/contractService'
import { api } from '../../services/api'
import { useMyPermissions, permissionAllowed } from '../../hooks/useMyPermissions'
import {
  mockContracts,
  toDemoContractRow,
  CONTRACT_TYPE_LABELS,
  CONTRACT_STATUS_LABELS,
  contractFilters,
} from '../../types/contract'
import type { ContractType, ContractStatus } from '../../types/contract'
import {
  Stage, useStageTheme, STAGE_HUES, SLATE_HUE, StageHue, OrbIcon,
  StageBadge, AnimatedNumber, GlowSparkline, StageButton,
} from '../../components/dashboard/Stage'

const RED_HUE: StageHue = { a: '#F87171', b: '#B91C1C', glow: 'rgba(248,113,113,0.40)', line: '#F87171' }

const TYPE_HUE_MAP: Record<ContractType, StageHue> = {
  vente: STAGE_HUES.sky,
  location_classique: STAGE_HUES.emerald,
  location_saisonniere: STAGE_HUES.violet,
}

const TYPE_ICONS = { vente: TrendingUp, location_classique: Key, location_saisonniere: Sun }

const STATUS_HUE_MAP: Record<ContractStatus, StageHue> = {
  en_cours: STAGE_HUES.amber,
  confirme_actif: STAGE_HUES.emerald,
  paye: STAGE_HUES.violet,
  occupe: STAGE_HUES.sky,
  finalise_termine: SLATE_HUE,
  annule: RED_HUE,
}

const ROLE_HUE_MAP: Record<string, StageHue> = {
  Vendeur: STAGE_HUES.violet,
  Acheteur: STAGE_HUES.sky,
  Bailleur: STAGE_HUES.emerald,
  Locataire: STAGE_HUES.amber,
  Voyageur: STAGE_HUES.fuchsia,
}

/* Staged pill with hue dot — same language as the list-page chips */
const HuePill = ({ hue, label, isDark }: { hue: StageHue; label: string; isDark: boolean }) => (
  <span
    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm"
    style={{
      color: isDark ? hue.line : hue.b,
      borderColor: `${hue.line}44`,
      background: isDark ? `${hue.line}1A` : `${hue.line}12`,
    }}
  >
    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: hue.line, boxShadow: `0 0 6px ${hue.glow}` }} />
    {label}
  </span>
)

const PartyAvatar = ({ name, role, isDark }: { name: string; role?: string; isDark: boolean }) => {
  const hue = (role && ROLE_HUE_MAP[role.trim()]) || SLATE_HUE
  const initials = (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase() || '—'
  return (
    <span
      title={name || undefined}
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[9px] font-extrabold tracking-wide"
      style={{
        background: isDark ? `${hue.line}26` : `${hue.line}14`,
        borderColor: `${hue.line}44`,
        color: isDark ? hue.line : hue.b,
        boxShadow: `0 0 10px ${hue.glow}`,
      }}
    >
      {initials}
    </span>
  )
}

/* Premium glass contract card: tilt + glare + hue hairline */
function StagedContractCard({
  c, index, isDark, canViewDetails, basePath, onOpen, onDelete,
}: {
  c: any
  index: number
  isDark: boolean
  canViewDetails: boolean
  basePath: string
  onOpen: () => void
  onDelete: (contract: any) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const rx = useSpring(useMotionValue(0), { stiffness: 240, damping: 20 })
  const ry = useSpring(useMotionValue(0), { stiffness: 240, damping: 20 })

  const contractType = (c.contractType || c.type) as ContractType
  const typeHue = TYPE_HUE_MAP[contractType] || SLATE_HUE
  const TypeIcon = TYPE_ICONS[contractType] || FileText
  const statusHue = STATUS_HUE_MAP[c.status as ContractStatus] || SLATE_HUE
  const partyAName = c.partieA?.name || c.clientName || ''
  const partyARole = c.partieA?.type || c.clientType || ''
  const partyBName = c.partieB?.name || ''
  const partyBRole = c.partieB?.type || ''
  const agentName = c.agentName || c.agentPrincipal
  const createdLabel = c.createdAt ? new Date(c.createdAt).toLocaleDateString('fr-FR') : '—'

  const onMove = (e: React.MouseEvent) => {
    if (reduce || !ref.current || !window.matchMedia?.('(pointer: fine)').matches) return
    const rect = ref.current.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    ry.set((px - 0.5) * 5)
    rx.set(-(py - 0.5) * 5)
    ref.current.style.setProperty('--glare-x', `${px * 100}%`)
    ref.current.style.setProperty('--glare-y', `${py * 100}%`)
  }

  const onLeave = () => { rx.set(0); ry.set(0) }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={() => canViewDetails && onOpen()}
      initial={{ opacity: 0, y: 24, scale: 0.96, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      transition={{ delay: Math.min(index * 0.05, 0.45), duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className={`stage-glass tilt-card group relative overflow-hidden rounded-2xl ${canViewDetails ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
    >
      <div className="tilt-glare" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
        style={{ background: `linear-gradient(90deg, transparent, ${typeHue.line}CC 30%, ${typeHue.line}CC 70%, transparent)` }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(58% 85% at 100% 0%, ${typeHue.glow}, transparent 70%)`, opacity: 0.16 }}
      />

      <div className="relative flex items-start gap-3 p-4 pb-3">
        <OrbIcon icon={TypeIcon} hue={typeHue} size={40} radius={13} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className={`font-mono text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{c.reference}</span>
            {!canViewDetails && (
              <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-300' : 'border-slate-200/80 bg-white text-slate-500'}`}>
                <Lock size={9} /> Verrouillé
              </span>
            )}
          </div>
          <p className={`mt-1 truncate text-[15px] font-extrabold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {c.propertyTitle || 'Sans bien lié'}
          </p>
          {c.propertyRef && (
            <p className={`mt-0.5 font-mono text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{c.propertyRef}</p>
          )}
        </div>
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          <ContractActionsMenu contract={c} basePath={basePath} onDelete={onDelete} />
        </div>
      </div>

      <div className="relative flex flex-wrap items-center gap-1.5 px-4">
        <HuePill hue={typeHue} label={CONTRACT_TYPE_LABELS[contractType] ?? contractType} isDark={isDark} />
        <HuePill hue={statusHue} label={CONTRACT_STATUS_LABELS[c.status as ContractStatus] ?? c.status} isDark={isDark} />
      </div>

      <div className="relative mt-3 flex min-w-0 items-center gap-2 px-4">
        <PartyAvatar name={partyAName} role={partyARole} isDark={isDark} />
        <span className={`truncate text-[11px] font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{partyAName || '—'}</span>
        <span className={`shrink-0 text-[11px] ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>↔</span>
        <PartyAvatar name={partyBName} role={partyBRole} isDark={isDark} />
        {partyBName ? (
          <span className={`truncate text-[11px] font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{partyBName}</span>
        ) : (
          <span className={`text-[11px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>—</span>
        )}
      </div>

      <div className={`relative mt-4 flex items-center justify-between gap-3 border-t px-4 py-3 text-[11px] font-medium ${isDark ? 'border-white/[0.06]' : 'border-slate-200/70'}`}>
        <span className={`flex min-w-0 items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <User size={11} className="shrink-0" />
          <span className="truncate">Agent : {agentName || '—'}</span>
          <span className="hidden truncate sm:inline"><span className="opacity-40">·</span> {createdLabel}</span>
        </span>
        <span className={`shrink-0 truncate text-[13px] font-extrabold tabular-nums ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
          {c.amount ? (
            <>
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(c.amount)}
              {contractType === 'location_classique' && <span className={`ml-0.5 text-[10px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>/mois</span>}
              {contractType === 'location_saisonniere' && <span className={`ml-0.5 text-[10px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>/séjour</span>}
            </>
          ) : (
            <span className="opacity-60">—</span>
          )}
        </span>
      </div>
    </motion.div>
  )
}

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
  const [refreshing, setRefreshing] = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<ContractType | ''>('')
  const [filterStatus, setFilterStatus] = useState<ContractStatus | ''>('')
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)
  const theme = useStageTheme()
  const isDark = theme === 'dark'

  useEffect(() => {
    api.get<any>('/auth/me').then(setCurrentUser).catch(() => {})
  }, [])

  useEffect(() => {
    if (!currentUser) return
    setLoading(true)
    const demoRows = () => mockContracts.map(toDemoContractRow)
    fetchContracts({ agent_id: String(currentUser.id) })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setContracts(data)
        } else {
          setContracts(demoRows())
        }
      })
      .catch(() => setContracts(demoRows()))
      .finally(() => {
        setLoading(false)
        setRefreshing(false)
      })
  }, [currentUser, refreshTick])

  const currentUserName = currentUser
    ? [currentUser.first_name, currentUser.last_name].filter(Boolean).join(' ') || currentUser.email
    : ''

  const handleRefresh = () => {
    if (refreshing) return
    setRefreshing(true)
    setRefreshTick(t => t + 1)
  }

  const handleDelete = async () => {
    if (!deleteTarget || !canDeleteContract) return
    setDeleting(true)
    if (!/^\d+$/.test(String(deleteTarget.id))) {
      setContracts(prev => prev.filter(c => c.id !== deleteTarget.id))
      toast('success', `Contrat ${deleteTarget.reference || ''} supprimé`)
      setDeleting(false)
      setDeleteTarget(null)
      return
    }
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
          c.partieA?.name?.toLowerCase().includes(q) ||
          c.partieB?.name?.toLowerCase().includes(q) ||
          c.propertyTitle?.toLowerCase().includes(q) ||
          c.propertyRef?.toLowerCase().includes(q) ||
          c.agentPrincipal?.toLowerCase().includes(q) ||
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

  const hasActiveFilters = !!(searchQuery || filterType || filterStatus || dateRange.from || dateRange.to)

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(p)

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
    { icon: FileText, label: 'Total contrats', value: kpiData.total, trend: '+12%', up: true, hue: STAGE_HUES.violet, spark: [2, 4, 3, 6, 5, 8] },
    { icon: Home, label: 'Ventes', value: kpiData.ventes, trend: '+8%', up: true, hue: STAGE_HUES.sky, spark: [1, 3, 2, 5, 4, 7] },
    { icon: Briefcase, label: 'Locations classiques', value: kpiData.locations, trend: '+5%', up: true, hue: STAGE_HUES.emerald, spark: [1, 2, 3, 2, 4, 5] },
    { icon: Sun, label: 'Locations saisonnières', value: kpiData.saisonniers, trend: '+15%', up: true, hue: STAGE_HUES.fuchsia, spark: [1, 1, 2, 3, 2, 4] },
    { icon: CheckCircle, label: 'Confirmés / Actifs', value: kpiData.actifs, trend: '+6%', up: true, hue: STAGE_HUES.emerald, spark: [1, 2, 2, 4, 3, 5] },
    { icon: Shield, label: 'Finalisés / Terminés', value: kpiData.termines, trend: '+3%', up: true, hue: SLATE_HUE, spark: [1, 1, 2, 1, 2, 2] },
    { icon: Clock, label: 'En cours', value: kpiData.enCours, trend: '-4%', up: false, hue: STAGE_HUES.amber, spark: [2, 2, 1, 3, 2, 1] },
    { icon: DollarSign, label: 'CA total', value: formatPrice(kpiData.caTotal), trend: '+22%', up: true, hue: STAGE_HUES.violet, spark: [2, 3, 4, 5, 7, 9] },
  ]

  const typeOptions = [
    { value: '', label: 'Tous les types' },
    ...contractFilters.types,
  ]

  const statusOptions = [
    { value: '', label: 'Tous les statuts' },
    ...contractFilters.statuses,
  ]

  return (
    <Stage theme={theme}>
      <div className="space-y-6 animate-fade-in">
        {/* Header hero */}
        <div className="stage-glass relative overflow-hidden p-5 sm:p-6">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.18), transparent 70%)' }} />
          <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full pointer-events-none opacity-40" style={{ background: 'radial-gradient(circle, rgba(124,92,255,0.20), transparent 70%)' }} />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.9)]" /></span>
                <p className={`text-[10px] font-bold uppercase tracking-[0.22em] ${isDark ? 'text-slate-400/80' : 'text-teal-900/50'}`}>Contrats · Vue d'ensemble</p>
              </div>
              <h1 className={`mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'bg-gradient-to-r from-white via-sky-100 to-sky-300 bg-clip-text text-transparent' : 'bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-600 bg-clip-text text-transparent'}`}>Contrats - Vue d'ensemble</h1>
              <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-teal-900/60'}`}>
                {kpiData.total} contrats · {kpiData.actifs} actifs · {kpiData.enCours} en cours · CA {formatPrice(kpiData.caTotal)}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: 'rgba(124,92,255,0.18)', background: 'rgba(124,92,255,0.10)', color: isDark ? '#C7CBFF' : '#5B4BD4' }}>
                  <FileText size={12} />{kpiData.total} total
                </span>
                {kpiData.actifs > 0 && <span className="inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold" style={{ borderColor: 'rgba(16,185,129,0.18)', background: 'rgba(16,185,129,0.10)', color: '#059669' }}><CheckCircle size={12} />{kpiData.actifs} actifs</span>}
                {kpiData.enCours > 0 && <span className="inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold" style={{ borderColor: 'rgba(251,191,36,0.20)', background: 'rgba(251,191,36,0.10)', color: isDark ? '#FDE68A' : '#B45309' }}><Clock size={12} />{kpiData.enCours} en cours</span>}
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
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-4 gap-3">
          {kpiCards.map((k, i) => {
            const Icon = k.icon
            const trendColor = k.up ? (isDark ? '#6EE7B7' : '#059669') : (isDark ? '#FDA4AF' : '#E11D48')
            return (
              <motion.div
                key={k.label}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -2 }}
                className="stage-glass group relative overflow-hidden rounded-xl p-3"
              >
                <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full pointer-events-none opacity-30" style={{ background: `radial-gradient(circle, ${k.hue.glow}, transparent 70%)` }} />
                <div className="relative flex items-center gap-2.5">
                  <OrbIcon icon={Icon} hue={k.hue} size={30} radius={9} />
                  <div className="min-w-0 flex-1">
                    <p className={`text-[9px] font-bold uppercase tracking-[1.4px] ${isDark ? 'text-slate-400' : 'text-teal-900/60'}`}>{k.label}</p>
                    <div className="flex items-baseline gap-0.5">
                      {typeof k.value === 'number' ? (
                        <AnimatedNumber
                          value={k.value}
                          className={isDark ? 'text-[20px] font-extrabold leading-none tracking-[-0.5px] text-white' : 'text-[20px] font-extrabold leading-none tracking-[-0.5px] text-slate-900'}
                        />
                      ) : (
                        <span className={`text-[17px] font-extrabold leading-none tracking-[-0.5px] ${isDark ? 'text-white' : 'text-slate-900'}`}>{k.value}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between gap-1">
                  <span
                    className="inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[9px] font-bold"
                    style={{ color: trendColor, borderColor: `${trendColor}33`, backgroundColor: `${trendColor}14` }}
                  >
                    {k.up ? <ArrowUp size={9} strokeWidth={3} /> : <ArrowDown size={9} strokeWidth={3} />}
                    {k.trend}
                  </span>
                  <div className="flex-1 -mb-1">
                    <GlowSparkline data={k.spark} color={k.hue.line} height={18} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Search + Filters + Liste */}
        <div className="stage-glass overflow-hidden rounded-2xl">
          <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, transparent, ${isDark ? 'rgba(56,189,248,0.9)' : 'rgba(20,184,166,0.9)'} 18%, ${isDark ? '#38BDF8' : '#14B8A6'} 50%, transparent)` }} />
          <div className="space-y-4 px-5 pb-4 pt-5" style={{ background: isDark ? 'radial-gradient(90% 140% at 0% 0%, rgba(56,189,248,0.07), transparent 65%)' : 'radial-gradient(90% 140% at 0% 0%, rgba(20,184,166,0.06), transparent 65%)' }}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <OrbIcon icon={Sliders} hue={isDark ? STAGE_HUES.sky : { a: '#2DD4BF', b: '#0D9488', glow: 'rgba(13,148,136,0.35)', line: '#14B8A6' }} size={26} radius={8} />
                <div>
                  <p className={`text-sm font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Recherche & filtres</p>
                  <p className={`text-[11px] leading-tight ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <AnimatedNumber value={filtered.length} className="inline font-semibold" /> contrat{filtered.length !== 1 ? 's' : ''} sur {contracts.length}
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
                label="Type de contrat"
                className="!h-10"
                options={typeOptions}
                value={filterType}
                onValueChange={(val) => setFilterType(val as ContractType | '')}
              />
              <Select
                label="Statut"
                className="!h-10"
                options={statusOptions}
                value={filterStatus}
                onValueChange={(val) => setFilterStatus(val as ContractStatus | '')}
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
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400/20" />
                <span className="relative inline-flex h-8 w-8 animate-spin rounded-full border-2 border-sky-400/80 border-t-transparent" />
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="max-w-sm p-10 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.03)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)'}` }}>
                  <FileText size={22} className={isDark ? 'text-white/20' : 'text-slate-400/60'} />
                </div>
                <h3 className={`mb-1 text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Aucun contrat trouvé</h3>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Essayez de modifier vos filtres — les contrats sont générés lors des transactions</p>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <div className="mb-3 flex items-center justify-between gap-3 px-5">
                <div className="flex items-center gap-2.5">
                  <OrbIcon icon={FileText} hue={isDark ? STAGE_HUES.sky : { a: '#2DD4BF', b: '#0D9488', glow: 'rgba(13,148,136,0.35)', line: '#14B8A6' }} size={26} radius={8} />
                  <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Liste des contrats</span>
                </div>
                <StageBadge variant="neutral">
                  <AnimatedNumber value={filtered.length} className="inline font-bold" /> contrat{filtered.length !== 1 ? 's' : ''}
                </StageBadge>
              </div>
              <div className="grid grid-cols-1 gap-4 pb-5 px-5 md:grid-cols-2 2xl:grid-cols-3">
                {filtered.map((c, index) => (
                  <StagedContractCard
                    key={c.id}
                    c={c}
                    index={index}
                    isDark={isDark}
                    canViewDetails={canViewDetails}
                    basePath={basePath}
                    onOpen={() => navigate(`${basePath}/contracts/${c.id}`)}
                    onDelete={(contract) => setDeleteTarget(contract)}
                  />
                ))}
              </div>
            </div>
          )}
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
    </Stage>
  )
}
