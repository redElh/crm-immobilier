import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, Briefcase, MapPin, Sun, Star, TrendingUp, Tag, CheckCircle,
  ChevronRight, ArrowLeft, Plus, RefreshCw, Activity, Layers, PieChart,
  Clock, AlertTriangle, Shield, Key, Calendar, Zap,
} from 'react-feather'
import { cn } from '../../../lib/utils'
import {
  StagePanel, StageBadge, StageButton, OrbIcon, AnimatedNumber,
  TiltCard, STAGE_HUES, SLATE_HUE,
  useStageTheme, useStageAccent, type StageHue,
} from '../../../components/dashboard/Stage'
import { AdminStatCard } from '../../../components/dashboard/AdminStatCard'
import { CitySkyline3D } from '../../../components/dashboard/three/CitySkyline3D'
import { TypeMonoliths3D } from '../../../components/dashboard/three/TypeMonoliths3D'
import { DraftSection } from '../../../components/modules/properties/DraftSection'
import { PropertyTypeChooserAdmin } from '../../../components/modules/properties/PropertyTypeChooserAdmin'
import { PropertyAssignModal } from '../../../components/modules/properties/PropertyAssignModal'
import { getDraftCount } from '../../../services/draftStorage'
import { fetchProperties } from '../../../services/propertyService'
import { api } from '../../../services/api'
import { STATUS_LABELS, TRANSACTION_TYPE_LABELS } from '../../../types/property'

type IconComponent = React.ComponentType<{ size?: number | string; className?: string }>

const SOLD_STATUSES = ['sold', 'rented', 'sold_or_rented']
const PROMISE_STATUSES = ['under_compromise', 'under_promise']
const NEGOTIATION_STATUSES = ['negotiation']
const AVAILABLE_STATUSES = ['for_sale', 'for_rent', 'for_sale_or_rent', 'available']
const EXIT_STATUSES = [...SOLD_STATUSES, 'withdrawn', 'unavailable']

const MONTH_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

const PERIODS: { id: 3 | 6 | 12; label: string }[] = [
  { id: 3, label: '3 mois' },
  { id: 6, label: '6 mois' },
  { id: 12, label: '12 mois' },
]

interface TypeMeta {
  type: string
  title: string
  tagline: string
  icon: IconComponent
  hue: StageHue
  transactionKeys: readonly string[]
}

interface TypeRow {
  meta: TypeMeta
  rows: PropertyRow[]
  count: number
  ventes: number
  locations: number
  mandats: number
  promises: number
  sold: number
  negociations: number
  venteActive: number
  locationActive: number
  urbanisme: number
  confidentielles: number
  disponibles: number
  reservees: number
  occupees: number
  buckets: number[]
  drafts: number
}

interface TypeCardContent {
  pill: string
  stats: { label: string; value: number }[]
  meterLabel: string
  meterPct: number
}

function resolveTypeCard(row: TypeRow): TypeCardContent {
  const safePct = (part: number) => (row.count > 0 ? Math.round((part / row.count) * 100) : 0)
  switch (row.meta.type) {
    case 'residential':
      return {
        pill: 'Vente + Location',
        stats: [
          { label: 'Ventes actives', value: row.venteActive },
          { label: 'Loc. actives', value: row.locationActive },
          { label: 'Sous promesse', value: row.promises },
        ],
        meterLabel: 'Part à vendre',
        meterPct: safePct(row.ventes),
      }
    case 'commercial':
      return {
        pill: 'Vente + Location',
        stats: [
          { label: 'Ventes actives', value: row.venteActive },
          { label: 'Loc. actives', value: row.locationActive },
          { label: 'En négo', value: row.negociations },
        ],
        meterLabel: 'Part à vendre',
        meterPct: safePct(row.ventes),
      }
    case 'land':
      return {
        pill: 'Vente uniquement',
        stats: [
          { label: 'Ventes actives', value: row.venteActive },
          { label: 'En urbanisme', value: row.urbanisme },
          { label: 'Sous promesse', value: row.promises },
        ],
        meterLabel: "Taux d'écoulement",
        meterPct: safePct(row.sold),
      }
    case 'vacation':
      return {
        pill: 'Location saisonnière',
        stats: [
          { label: 'Disponibles', value: row.disponibles },
          { label: 'Réservées', value: row.reservees },
          { label: 'Occupées', value: row.occupees },
        ],
        meterLabel: "Taux d'occupation",
        meterPct: safePct(row.occupees + row.reservees),
      }
    case 'luxury':
      return {
        pill: 'Vente + Location',
        stats: [
          { label: 'En vente', value: row.ventes },
          { label: 'Sous promesse', value: row.promises },
          { label: 'Confidentielles', value: row.confidentielles },
        ],
        meterLabel: 'Confidentialité',
        meterPct: safePct(row.confidentielles),
      }
    default:
      return {
        pill: 'Registre',
        stats: [
          { label: 'Actifs', value: row.venteActive + row.locationActive },
          { label: 'Mandats', value: row.mandats },
          { label: 'Sous promesse', value: row.promises },
        ],
        meterLabel: 'Part du parc',
        meterPct: 0,
      }
  }
}

const TYPE_META: TypeMeta[] = [
  { type: 'residential', title: 'Résidentiel', tagline: 'Appartements, maisons, villas', icon: Home, hue: STAGE_HUES.sky, transactionKeys: ['vente', 'location_ld'] },
  { type: 'commercial', title: 'Commercial', tagline: 'Bureaux, locaux, boutiques', icon: Briefcase, hue: STAGE_HUES.violet, transactionKeys: ['vente', 'location_ld'] },
  { type: 'land', title: 'Terrains', tagline: 'Constructibles & agricoles', icon: MapPin, hue: STAGE_HUES.emerald, transactionKeys: ['vente'] },
  { type: 'vacation', title: 'Vacances', tagline: 'Saisonnier & résidences', icon: Sun, hue: STAGE_HUES.amber, transactionKeys: ['location_saisonniere'] },
  { type: 'luxury', title: 'Luxe', tagline: 'Biens haut de gamme', icon: Star, hue: STAGE_HUES.fuchsia, transactionKeys: ['vente', 'location_ld'] },
]

interface PropertyRow {
  id: string
  reference?: string
  title?: string
  propertyType?: string
  transactionType?: string
  status?: string
  price?: number
  loyerHC?: number
  city?: string
  district?: string
  location?: string
  surface?: number
  images?: string[]
  completion?: number | string
  mandateType?: string
  mandateStartDate?: string
  mandateEndDate?: string
  createdAt?: string
  updatedAt?: string
}

function asArray(p: unknown): unknown[] {
  return Array.isArray(p) ? p : []
}

function parseDate(value?: string | null): Date | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function monthBuckets(items: PropertyRow[], months: number, field: 'createdAt' | 'updatedAt') {
  const now = new Date()
  return Array.from({ length: months }, (_, i) => {
    const offset = months - 1 - i
    const start = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    const end = new Date(now.getFullYear(), now.getMonth() - offset + 1, 1)
    const value = items.filter(p => {
      const d = parseDate(p[field])
      return d !== null && d >= start && d < end
    }).length
    return { label: MONTH_SHORT[start.getMonth()], value }
  })
}

const SOLD_IN_MONTH = (items: PropertyRow[], monthOffset: number) => {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1)
  const end = new Date(now.getFullYear(), now.getMonth() - monthOffset + 1, 1)
  return items.filter(p => {
    if (!SOLD_STATUSES.includes(p.status || '')) return false
    const d = parseDate(p.updatedAt)
    return d !== null && d >= start && d < end
  }).length
}

const ADDITIONS_IN_MONTHS = (items: PropertyRow[], months: number, back = 0) => {
  const now = new Date()
  const end = new Date(now.getFullYear(), now.getMonth() - back + 1, 1)
  const start = new Date(now.getFullYear(), now.getMonth() - back - months + 1, 1)
  return items.filter(p => {
    const d = parseDate(p.createdAt)
    return d !== null && d >= start && d < end
  }).length
}

function fmtCompactMAD(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(abs >= 10_000_000 ? 1 : 2).replace('.', ',')} M`
  if (abs >= 1_000) return `${Math.round(value / 1_000).toLocaleString('fr-FR')} K`
  return `${Math.round(value).toLocaleString('fr-FR')}`
}

function fmtFullMAD(value: number): string {
  return `${Math.round(value).toLocaleString('fr-FR')} MAD`
}

function relTime(iso?: string | null): string {
  const d = parseDate(iso)
  if (!d) return '—'
  const minutes = Math.floor((Date.now() - d.getTime()) / 60_000)
  if (minutes < 1) return "à l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'hier'
  if (days < 7) return `il y a ${days} j`
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

function daysUntil(iso?: string | null): number | null {
  const d = parseDate(iso)
  if (!d) return null
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startOfTarget = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  return Math.round((startOfTarget - startOfToday) / 86_400_000)
}

function completionOf(p: PropertyRow): number {
  const n = Number(p.completion)
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0
}

function pct(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0
}

function Gauge({
  label,
  pct: value,
  hue,
  isDark,
  detail,
}: {
  label: string
  pct: number
  hue: StageHue
  isDark: boolean
  detail: string
}) {
  const R = 34
  const C = 2 * Math.PI * R
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <svg width="96" height="96" viewBox="0 0 96 96" className="absolute inset-0">
          <circle
            cx="48" cy="48" r={R} fill="none"
            stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)'}
            strokeWidth="9"
          />
          <motion.circle
            cx="48" cy="48" r={R} fill="none"
            stroke={hue.line}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: C * (1 - Math.max(0, Math.min(100, value)) / 100) }}
            transition={{ duration: 1.15, ease: [0.22, 1, 0.36, 1] }}
            transform="rotate(-90 48 48)"
            style={{ filter: `drop-shadow(0 0 6px ${hue.glow})` }}
          />
        </svg>
        <div className="relative z-10 text-center">
          <span className={cn('text-lg font-black tabular-nums leading-none', isDark ? 'text-white' : 'text-slate-900')}>
            <AnimatedNumber value={value} suffix="%" />
          </span>
        </div>
      </div>
      <p className={cn('text-[9px] font-extrabold uppercase tracking-[0.18em]', isDark ? 'text-slate-500' : 'text-slate-400')}>{label}</p>
      <p className={cn('-mt-0.5 text-[9px] font-semibold', isDark ? 'text-slate-600' : 'text-slate-400')}>{detail}</p>
    </div>
  )
}

export default function AdminPropertyTypesPage() {
  const navigate = useNavigate()
  const { adminId } = useParams<{ adminId: string }>()
  const userId = adminId || 'unknown'
  const theme = useStageTheme()
  const accent = useStageAccent()
  const isDark = theme === 'dark'

  const [properties, setProperties] = useState<PropertyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<3 | 6 | 12>(6)
  const [chooserOpen, setChooserOpen] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [pendingType, setPendingType] = useState<string | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    setLoading(true)
    fetchProperties()
      .then((rows: any) => setProperties(Array.isArray(rows) ? rows : []))
      .catch(() => setProperties([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    api.get<any>('/auth/me').then(setCurrentUser).catch(() => {})
    api.get<any[]>('/admin/users').then(list => setUsers(Array.isArray(list) ? list : [])).catch(() => {})
  }, [])

  const refresh = () => {
    setLoading(true)
    fetchProperties()
      .then((rows: any) => setProperties(Array.isArray(rows) ? rows : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const goToType = (type: string) => navigate(`/admin/${adminId}/properties/type/${type}`)
  const goToDetail = (id: string) => navigate(`/admin/${adminId}/properties/${id}`)
  const addPropertyOfType = (type: string) => {
    setPendingType(type)
    setChooserOpen(false)
    setShowAssignModal(true)
  }

  const handleAssignProperty = (personId: string) => {
    setShowAssignModal(false)
    if (!pendingType) return
    const person = users.find(u => String(u.id) === String(personId))
    const isSelf = !!currentUser && String(personId) === String(currentUser.id)
    const qs = !personId || isSelf
      ? ''
      : `?assignedTo=${personId}&assignedType=${person?.role === 'agent' ? 'agent' : 'admin'}`
    navigate(`/admin/${adminId}/properties/type/${pendingType}/add${qs}`)
  }

  const stats = useMemo(() => {
    const rows = properties
    const total = rows.length
    const byType = (t: string) => rows.filter(p => p.propertyType === t)
    const venteCount = rows.filter(p => p.transactionType === 'vente').length
    const ldCount = rows.filter(p => p.transactionType === 'location_ld').length
    const saisonCount = rows.filter(p => p.transactionType === 'location_saisonniere').length
    const locationCount = ldCount + saisonCount
    const soldCount = rows.filter(p => SOLD_STATUSES.includes(p.status || '')).length
    const soldVendus = rows.filter(p => p.status === 'sold' || p.status === 'sold_or_rented').length
    const soldLoues = rows.filter(p => p.status === 'rented' || p.status === 'sold_or_rented').length
    const promiseCount = rows.filter(p => PROMISE_STATUSES.includes(p.status || '')).length
    const negotiationCount = rows.filter(p => NEGOTIATION_STATUSES.includes(p.status || '')).length
    const availableCount = rows.filter(p => AVAILABLE_STATUSES.includes(p.status || '')).length
    const mandatePendingCount = rows.filter(p => p.status === 'mandate_pending').length
    const signingCount = rows.filter(p => p.status === 'signing').length

    const saleValue = rows
      .filter(p => p.transactionType === 'vente')
      .reduce((s, p) => s + (Number(p.price) || 0), 0)
    const masseLocative = rows
      .filter(p => p.transactionType !== 'vente')
      .reduce((s, p) => s + (Number(p.loyerHC) || Number(p.price) || 0), 0)
    const venteRows = rows.filter(p => p.transactionType === 'vente' && Number(p.price) > 0)
    const avgTicket = venteRows.length
      ? venteRows.reduce((s, p) => s + Number(p.price), 0) / venteRows.length
      : 0
    const maxPrice = venteRows.reduce((m, p) => Math.max(m, Number(p.price) || 0), 0)

    const withMandat = rows.filter(p => (p.mandateType || '').trim().length > 0).length
    const sansMandat = total - withMandat
    const withPhotos = rows.filter(p => asArray(p.images).length > 0).length
    const avgCompletion = total
      ? Math.round(rows.reduce((s, p) => s + completionOf(p), 0) / total)
      : 0

    const soldThisMonth = SOLD_IN_MONTH(rows, 0)
    const soldLastMonth = SOLD_IN_MONTH(rows, 1)
    const addedWindow = ADDITIONS_IN_MONTHS(rows, period, 0)
    const addedPrevWindow = ADDITIONS_IN_MONTHS(rows, period, period)
    const addsMoM = addedPrevWindow === 0
      ? (addedWindow > 0 ? 100 : 0)
      : Math.round(((addedWindow - addedPrevWindow) / addedPrevWindow) * 100)

    const vendusCeMoisDelta = soldLastMonth === 0
      ? (soldThisMonth > 0 ? 100 : 0)
      : Math.round(((soldThisMonth - soldLastMonth) / soldLastMonth) * 100)

    const byTypeRows: TypeRow[] = TYPE_META.map(meta => {
      const tRows = byType(meta.type)
      const buckets = monthBuckets(tRows, 6, 'createdAt').map(b => b.value)
      const isExit = (p: PropertyRow) => EXIT_STATUSES.includes(p.status || '')
      return {
        meta,
        rows: tRows,
        count: tRows.length,
        ventes: tRows.filter(p => p.transactionType === 'vente').length,
        locations: tRows.filter(p => p.transactionType !== 'vente').length,
        mandats: tRows.filter(p => (p.mandateType || '').trim().length > 0).length,
        promises: tRows.filter(p => PROMISE_STATUSES.includes(p.status || '')).length,
        sold: tRows.filter(p => SOLD_STATUSES.includes(p.status || '')).length,
        negociations: tRows.filter(p => NEGOTIATION_STATUSES.includes(p.status || '')).length,
        venteActive: tRows.filter(p => p.transactionType === 'vente' && !isExit(p)).length,
        locationActive: tRows.filter(p => p.transactionType !== 'vente' && !isExit(p)).length,
        urbanisme: tRows.filter(p => p.status === 'urbanism').length,
        confidentielles: tRows.filter(p => p.status === 'confidential').length,
        disponibles: tRows.filter(p => AVAILABLE_STATUSES.includes(p.status || '')).length,
        reservees: tRows.filter(p => p.status === 'option' || p.status === 'reserved').length,
        occupees: tRows.filter(p => p.status === 'occupied').length,
        buckets,
        drafts: getDraftCount(userId, meta.type),
      }
    })

    const buckets = monthBuckets(rows, period, 'createdAt')
    const bestMonth = buckets.reduce((best, b) => (b.value > best.value ? b : best), buckets[0])

    const cityCounts = new Map<string, { count: number; priceSum: number; priceN: number }>()
    rows.forEach(p => {
      const city = (p.city || '').trim()
      if (!city) return
      const entry = cityCounts.get(city) || { count: 0, priceSum: 0, priceN: 0 }
      entry.count += 1
      const price = Number(p.price) || 0
      if (price > 0) { entry.priceSum += price; entry.priceN += 1 }
      cityCounts.set(city, entry)
    })
    const cities = Array.from(cityCounts.entries())
      .map(([city, v]) => ({ city, count: v.count, avgPrice: v.priceN ? v.priceSum / v.priceN : 0 }))
      .sort((a, b) => b.count - a.count)
    const topCities = cities.slice(0, 5)
    const otherCities = cities.slice(5).reduce((s, c) => s + c.count, 0)
    const unlocated = total - cities.reduce((s, c) => s + c.count, 0)

    const statusGroups = [
      { label: 'Disponibles', count: availableCount, hue: STAGE_HUES.emerald },
      { label: 'En attente de mandat', count: mandatePendingCount, hue: SLATE_HUE },
      { label: 'En négociation', count: negotiationCount, hue: STAGE_HUES.sky },
      { label: 'Sous promesse', count: promiseCount, hue: STAGE_HUES.fuchsia },
      { label: 'En signature', count: signingCount, hue: STAGE_HUES.violet },
      { label: 'Vendus / Loués', count: soldCount, hue: STAGE_HUES.amber },
    ]

    const expiring = rows
      .filter(p => {
        if (EXIT_STATUSES.includes(p.status || '')) return false
        if (!(p.mandateType || '').trim()) return false
        const d = daysUntil(p.mandateEndDate)
        return d !== null && d <= 45
      })
      .map(p => ({ property: p, days: daysUntil(p.mandateEndDate) as number }))
      .sort((a, b) => a.days - b.days)
      .slice(0, 5)

    const recent = [...rows]
      .sort((a, b) => (parseDate(b.updatedAt)?.getTime() || 0) - (parseDate(a.updatedAt)?.getTime() || 0))
      .slice(0, 6)

    const pipelineValue = rows
      .filter(p => PROMISE_STATUSES.includes(p.status || '') || NEGOTIATION_STATUSES.includes(p.status || ''))
      .reduce((s, p) => s + (Number(p.price) || 0), 0)

    return {
      total, venteCount, ldCount, saisonCount, locationCount,
      soldCount, soldVendus, soldLoues,
      promiseCount, negotiationCount, availableCount, mandatePendingCount, signingCount,
      saleValue, masseLocative, avgTicket, maxPrice,
      withMandat, sansMandat, withPhotos, avgCompletion,
      soldThisMonth, soldLastMonth, addedWindow, addsMoM, vendusCeMoisDelta,
      byTypeRows, buckets, bestMonth, topCities, otherCities, unlocated,
      statusGroups, expiring, recent, pipelineValue,
    }
  }, [properties, period, userId])

  const gradientTitle = isDark
    ? 'bg-clip-text text-transparent bg-gradient-to-r from-[#F43F5E] via-[#FB7185] to-[#8B7CFF]'
    : 'bg-clip-text text-transparent bg-gradient-to-r from-[#EA580C] via-[#F97316] to-[#FBBF24]'

  const explorerLink = (type: string) => () => goToType(type)

  const typeShare = (count: number) => pct(count, stats.total)

  return (
    <div className="space-y-5 pb-24">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className={cn('flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[3px]', isDark ? 'text-slate-400' : 'text-teal-900/50')}>
              <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Square Immo · Patrimoine · Temps réel
            </p>
            <h1 className={cn('mt-2 text-4xl font-black tracking-[-2px] sm:text-5xl', gradientTitle)}>
              PATRIMOINE 360
            </h1>
            <p className={cn('mt-1.5 text-sm', isDark ? 'text-slate-400' : 'text-teal-900/60')}>
              Analyse complète du portefeuille — volumes, valeur, statuts et performance par type de bien.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StageButton variant="glass" size="md" icon={<ArrowLeft size={14} />} onClick={() => navigate(`/admin/${adminId}`)}>
              Dashboard
            </StageButton>
            <div className="stage-glass flex items-center gap-1 rounded-2xl p-1.5">
              {PERIODS.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriod(p.id)}
                  aria-pressed={period === p.id}
                  className={cn(
                    'relative rounded-xl px-3 py-2 text-[11px] font-bold transition-colors',
                    period === p.id
                      ? 'text-white'
                      : isDark
                        ? 'text-slate-400 hover:text-white'
                        : 'text-slate-500 hover:text-orange-900',
                  )}
                >
                  {period === p.id && (
                    <motion.span
                      layoutId="patrimoine-period-pill"
                      className="absolute inset-0 rounded-xl border border-white/20"
                      style={{
                        backgroundImage: `linear-gradient(145deg, ${accent.a} 0%, ${accent.b} 100%)`,
                        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35), 0 8px 20px -8px ${accent.glow}`,
                      }}
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10">{p.label}</span>
                </button>
              ))}
            </div>
            <StageButton
              variant="glass"
              size="md"
              icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
              onClick={refresh}
              disabled={loading}
            >
              Actualiser
            </StageButton>
            <StageButton size="md" icon={<Plus size={14} />} onClick={() => setChooserOpen(true)}>
              Ajouter un bien
            </StageButton>
          </div>
        </div>
      </motion.div>

      <DraftSection adminSlug={adminId} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <AdminStatCard
          icon={Home}
          label="Portefeuille"
          value={stats.total}
          unit="biens"
          detail={`${stats.soldCount} signés · ${stats.promiseCount} sous promesse`}
          trend={`${stats.addsMoM >= 0 ? '+' : ''}${stats.addsMoM}%`}
          trendUp={stats.addsMoM >= 0}
          hue={accent}
          spark={stats.buckets.map(b => b.value)}
          facts={[
            { label: 'Avec mandat', value: stats.withMandat },
            { label: 'Sans mandat', value: stats.sansMandat },
          ]}
          delay={0}
        />
        <AdminStatCard
          icon={TrendingUp}
          label="Valeur · vente"
          value={stats.saleValue / 1_000_000}
          decimals={2}
          unit="M MAD"
          detail={`Masse locative ${fmtCompactMAD(stats.masseLocative)} MAD/mois`}
          hue={STAGE_HUES.emerald}
          spark={stats.buckets.map(b => b.value)}
          facts={[
            { label: 'Ticket moyen', value: `${fmtCompactMAD(stats.avgTicket)} MAD` },
            { label: 'Prix max', value: `${fmtCompactMAD(stats.maxPrice)} MAD` },
          ]}
          delay={0.06}
        />
        <AdminStatCard
          icon={Tag}
          label="En vente"
          value={stats.venteCount}
          unit="biens"
          detail={`${stats.promiseCount} sous promesse · ${stats.negotiationCount} en négo`}
          hue={STAGE_HUES.sky}
          spark={stats.buckets.map(b => b.value)}
          facts={[
            { label: 'Sous promesse', value: stats.promiseCount },
            { label: 'En négo', value: stats.negotiationCount },
          ]}
          delay={0.12}
        />
        <AdminStatCard
          icon={Calendar}
          label="En location"
          value={stats.locationCount}
          unit="biens"
          detail={`${stats.saisonCount} saisonnière${stats.saisonCount > 1 ? 's' : ''} · ${stats.ldCount} longue durée`}
          hue={STAGE_HUES.amber}
          spark={stats.buckets.map(b => b.value)}
          facts={[
            { label: 'Location LD', value: stats.ldCount },
            { label: 'Saisonnière', value: stats.saisonCount },
          ]}
          delay={0.18}
        />
        <AdminStatCard
          icon={CheckCircle}
          label="Signés ce mois"
          value={stats.soldThisMonth}
          unit="biens"
          detail={`${stats.soldLastMonth} le mois dernier`}
          trend={`${stats.vendusCeMoisDelta >= 0 ? '+' : ''}${stats.vendusCeMoisDelta}%`}
          trendUp={stats.vendusCeMoisDelta >= 0}
          hue={STAGE_HUES.fuchsia}
          spark={stats.buckets.map(b => b.value)}
          facts={[
            { label: 'Vendus', value: stats.soldVendus },
            { label: 'Loués', value: stats.soldLoues },
          ]}
          delay={0.24}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <StagePanel
          title="La ville du portefeuille"
          icon={Activity}
          hue={accent}
          outerClassName="lg:col-span-2"
          className="min-h-[380px]"
          badge={<StageBadge variant={stats.addsMoM >= 0 ? 'ok' : 'danger'}>{stats.addsMoM >= 0 ? '▲' : '▼'} {Math.abs(stats.addsMoM)}% vs fenêtre préc.</StageBadge>}
        >
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2">
              <StageBadge variant="neutral">{stats.addedWindow} ajout{stats.addedWindow > 1 ? 's' : ''} sur {period} mois</StageBadge>
              <StageBadge variant="ok">Pipeline · {fmtCompactMAD(stats.pipelineValue)} MAD</StageBadge>
              <StageBadge variant="violet">Meilleur mois · {stats.bestMonth?.label ?? '—'}</StageBadge>
            </div>
            <CitySkyline3D
              data={stats.buckets.map(b => ({ label: b.label, value: b.value }))}
              hue={accent}
              isDark={isDark}
              className="mt-2 w-full h-[320px]"
              hint="votre ville grandit — survolez un immeuble"
            />
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <span className={cn('text-[10px] font-semibold', isDark ? 'text-slate-500' : 'text-slate-400')}>
                Parc actuel · <b className={isDark ? 'text-slate-300' : 'text-slate-700'}>{stats.total} biens</b>
              </span>
              <span className={cn('hidden text-[10px] font-semibold sm:block', isDark ? 'text-slate-500' : 'text-slate-400')}>
                {stats.availableCount} disponibles · {stats.promiseCount} sous promesse · {stats.signingCount} en signature
              </span>
            </div>
          </div>
        </StagePanel>

        <StagePanel
          title="Répartition par type"
          icon={PieChart}
          hue={STAGE_HUES.violet}
          badge={<StageBadge variant="neutral">{stats.total} biens</StageBadge>}
        >
          <div className="flex h-full flex-col">
            <TypeMonoliths3D
              slices={stats.byTypeRows.map(({ meta, count }) => ({
                name: meta.title,
                value: count,
                hue: meta.hue,
              }))}
              isDark={isDark}
              height={186}
              className="w-full"
              hint="survolez un monolithe"
              accent={accent}
            />
            <div className="mt-3 space-y-1.5">
              {stats.byTypeRows.map(({ meta, count }) => {
                const share = typeShare(count)
                return (
                  <button
                    key={meta.type}
                    type="button"
                    onClick={explorerLink(meta.type)}
                    className={cn(
                      'group flex w-full items-center gap-2 rounded-xl border px-2.5 py-1.5 text-left transition-all',
                      isDark
                        ? 'border-white/[0.05] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.05]'
                        : 'border-slate-200/60 bg-white/60 hover:border-orange-300/60 hover:bg-white',
                    )}
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: meta.hue.line, boxShadow: `0 0 6px ${meta.hue.glow}` }} />
                    <span className={cn('min-w-0 flex-1 truncate text-[11px] font-bold', isDark ? 'text-slate-300 group-hover:text-white' : 'text-slate-600 group-hover:text-slate-900')}>
                      {meta.title}
                    </span>
                    <span className={cn('text-[11px] font-extrabold tabular-nums', isDark ? 'text-slate-200' : 'text-slate-800')}>{count}</span>
                    <span className={cn('w-8 text-right text-[9.5px] font-semibold tabular-nums', isDark ? 'text-slate-500' : 'text-slate-400')}>{share}%</span>
                  </button>
                )
              })}
            </div>
          </div>
        </StagePanel>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <OrbIcon icon={Layers} hue={accent} size={30} radius={10} />
            <div>
              <h2 className={cn('text-[13px] font-extrabold uppercase tracking-[0.18em]', isDark ? 'text-white' : 'text-slate-900')}>Types de biens</h2>
              <p className={cn('text-[10px]', isDark ? 'text-slate-500' : 'text-slate-400')}>Cliquez sur un type pour ouvrir le registre complet</p>
            </div>
          </div>
          <StageBadge variant="neutral">{TYPE_META.length} segments</StageBadge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {stats.byTypeRows.map((row, index) => {
            const { meta, count, mandats, buckets: spark, drafts } = row
            const Icon = meta.icon
            const content = resolveTypeCard(row)
            const max = Math.max(...spark, 1)
            const share = typeShare(count)
            return (
              <TiltCard
                key={meta.type}
                onClick={explorerLink(meta.type)}
                className="group relative cursor-pointer p-4"
                contentClassName="flex h-full flex-col"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-12 -top-14 h-36 w-36 rounded-full opacity-60 blur-2xl"
                  style={{ background: `radial-gradient(circle, ${meta.hue.glow}, transparent 70%)` }}
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3 top-1.5 text-[46px] font-black leading-none tracking-[-0.06em]"
                  style={{ color: 'transparent', WebkitTextStroke: `1.15px ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(15,23,42,0.13)'}` }}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>

                <div className="relative flex items-center gap-2">
                  <OrbIcon icon={Icon} hue={meta.hue} size={34} radius={11} />
                  <span className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.14em]',
                    isDark ? 'border-white/10 bg-white/[0.04] text-slate-300' : 'border-slate-200/80 bg-white/80 text-slate-500',
                  )}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.hue.line, boxShadow: `0 0 6px ${meta.hue.glow}` }} />
                    {content.pill}
                  </span>
                </div>

                <div className="relative mt-2.5 flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <p className={cn('text-[13.5px] font-extrabold tracking-[-0.2px]', isDark ? 'text-white' : 'text-slate-900')}>{meta.title}</p>
                    <p className={cn('mt-0.5 truncate text-[9px] leading-snug', isDark ? 'text-slate-500' : 'text-slate-400')}>{meta.tagline}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={cn('text-[30px] font-black leading-none tracking-[-1px] tabular-nums', isDark ? 'text-white' : 'text-slate-900')}>
                      <AnimatedNumber value={count} />
                    </p>
                    <p className={cn('mt-1 text-[7.5px] font-extrabold uppercase tracking-[0.18em]', isDark ? 'text-slate-500' : 'text-slate-400')}>biens</p>
                  </div>
                </div>

                <div className={cn(
                  'relative mt-3 grid grid-cols-3 divide-x rounded-2xl border py-2',
                  isDark ? 'divide-white/[0.06] border-white/[0.06] bg-white/[0.02]' : 'divide-slate-200/60 border-slate-200/70 bg-white/50',
                )}>
                  {content.stats.map(s => (
                    <div key={s.label} className="min-w-0 px-1.5 text-center">
                      <p className={cn('text-[17px] font-extrabold tabular-nums leading-none', isDark ? 'text-slate-100' : 'text-slate-800')}>
                        <AnimatedNumber value={s.value} />
                      </p>
                      <p className={cn('mt-1 truncate text-[6.5px] font-extrabold uppercase leading-tight tracking-[0.12em]', isDark ? 'text-slate-500' : 'text-slate-400')}>
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="relative mt-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[8px] font-extrabold uppercase tracking-[0.16em]" style={{ color: meta.hue.line }}>
                      {content.meterLabel}
                    </span>
                    <span className={cn('text-[10.5px] font-extrabold tabular-nums', isDark ? 'text-slate-200' : 'text-slate-700')}>
                      {content.meterPct}%
                    </span>
                  </div>
                  <div className={cn('mt-1.5 h-2 overflow-hidden rounded-full', isDark ? 'bg-white/[0.07]' : 'bg-slate-900/[0.07]')}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundImage: `linear-gradient(90deg, ${meta.hue.a}, ${meta.hue.b})`, boxShadow: `0 0 10px ${meta.hue.glow}` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(content.meterPct, content.meterPct > 0 ? 3 : 0)}%` }}
                      transition={{ duration: 0.95, delay: 0.15 + index * 0.07, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </div>

                <div className="relative mt-auto flex items-end justify-between gap-2 border-t pt-3" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)' }}>
                  <div className="min-w-0">
                    <div className="flex h-10 items-end gap-[3px]" aria-hidden="true">
                      {spark.map((v, i) => (
                        <motion.span
                          key={i}
                          className="w-[5px] rounded-full"
                          style={{ height: `${Math.max(12, (v / max) * 100)}%`, background: meta.hue.line, opacity: 0.3 + (v / max) * 0.7, boxShadow: v > 0 ? `0 0 6px ${meta.hue.glow}` : undefined, transformOrigin: 'bottom' }}
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{ duration: 0.6, delay: 0.22 + i * 0.055 + index * 0.05 }}
                        />
                      ))}
                    </div>
                    <p className={cn('mt-1.5 text-[7px] font-bold uppercase tracking-[0.16em]', isDark ? 'text-slate-600' : 'text-slate-400')}>
                      {share}% du parc · 6 mois
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <p className={cn('text-right text-[8px] font-semibold leading-tight', isDark ? 'text-slate-500' : 'text-slate-400')}>
                      {mandats} mandat{mandats > 1 ? 's' : ''}
                      {drafts > 0 && <span className="block text-amber-500">{drafts} brouillon{drafts > 1 ? 's' : ''}</span>}
                    </p>
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-full border transition-transform duration-300 group-hover:scale-110"
                      style={{
                        borderColor: `${meta.hue.a}42`,
                        background: `${meta.hue.a}14`,
                        color: meta.hue.line,
                        boxShadow: `0 6px 16px -10px ${meta.hue.glow}`,
                      }}
                    >
                      <ChevronRight size={15} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </TiltCard>
            )
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <StagePanel
          title="Statuts du parc"
          icon={Layers}
          hue={STAGE_HUES.amber}
          badge={<StageBadge variant="neutral">{stats.availableCount} disponibles</StageBadge>}
        >
          <div className="space-y-2.5">
            {stats.statusGroups.map(group => {
              const share = pct(group.count, stats.total)
              return (
                <div key={group.label}>
                  <div className="flex items-center justify-between gap-2 text-[10.5px] font-semibold">
                    <span className={cn('flex min-w-0 items-center gap-1.5', isDark ? 'text-slate-400' : 'text-slate-600')}>
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: group.hue.line, boxShadow: `0 0 6px ${group.hue.glow}` }} />
                      <span className="truncate">{group.label}</span>
                    </span>
                    <span className={cn('shrink-0 tabular-nums', isDark ? 'text-slate-200' : 'text-slate-800')}>
                      {group.count} <span className={cn('text-[9px]', isDark ? 'text-slate-500' : 'text-slate-400')}>· {share}%</span>
                    </span>
                  </div>
                  <div className={cn('mt-1 h-2 overflow-hidden rounded-full', isDark ? 'bg-white/[0.06]' : 'bg-slate-900/[0.06]')}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundImage: `linear-gradient(90deg, ${group.hue.a}, ${group.hue.b})`, boxShadow: `0 0 12px ${group.hue.glow}` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(share, group.count > 0 ? 3 : 0)}%` }}
                      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </div>
              )
            })}
            <p className={cn('pt-1 text-[9px] font-medium', isDark ? 'text-slate-600' : 'text-slate-400')}>
              Parts calculées sur {stats.total} bien{stats.total > 1 ? 's' : ''} au portefeuille.
            </p>
          </div>
        </StagePanel>

        <StagePanel
          title="Parc par ville"
          icon={MapPin}
          hue={STAGE_HUES.sky}
          badge={<StageBadge variant="neutral">{stats.topCities.length} ville{stats.topCities.length > 1 ? 's' : ''}</StageBadge>}
        >
          {stats.topCities.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="Villes non renseignées"
              detail="Renseignez la ville des biens pour activer cette analyse géographique."
              isDark={isDark}
            />
          ) : (
            <div className="space-y-2">
              {stats.topCities.map((city, i) => {
                const share = pct(city.count, Math.max(stats.total, 1))
                const maxCount = stats.topCities[0]?.count || 1
                return (
                  <div
                    key={city.city}
                    className={cn(
                      'group rounded-2xl border px-3 py-2 transition-all',
                      isDark ? 'border-white/[0.05] bg-white/[0.02]' : 'border-slate-200/60 bg-white/55',
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={cn('w-6 shrink-0 text-[11px] font-black tabular-nums', isDark ? 'text-slate-600' : 'text-slate-300')}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className={cn('truncate text-[11.5px] font-bold', isDark ? 'text-slate-100' : 'text-slate-800')}>{city.city}</p>
                          <p className={cn('shrink-0 text-[10px] font-extrabold tabular-nums', isDark ? 'text-slate-300' : 'text-slate-700')}>
                            {city.count} <span className={cn('text-[8px] font-semibold', isDark ? 'text-slate-500' : 'text-slate-400')}>· {share}%</span>
                          </p>
                        </div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className={cn('h-1.5 flex-1 overflow-hidden rounded-full', isDark ? 'bg-white/[0.06]' : 'bg-slate-900/[0.06]')}>
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundImage: `linear-gradient(90deg, ${STAGE_HUES.sky.a}, ${STAGE_HUES.sky.b})`, boxShadow: `0 0 10px ${STAGE_HUES.sky.glow}` }}
                              initial={{ width: 0 }}
                              animate={{ width: `${(city.count / maxCount) * 100}%` }}
                              transition={{ duration: 0.85, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                            />
                          </div>
                          {city.avgPrice > 0 && (
                            <span className={cn('shrink-0 text-[8.5px] font-semibold tabular-nums', isDark ? 'text-slate-500' : 'text-slate-400')}>
                              moy. {fmtCompactMAD(city.avgPrice)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              {stats.otherCities > 0 && (
                <p className={cn('px-1 pt-1 text-[9px] font-semibold', isDark ? 'text-slate-500' : 'text-slate-400')}>
                  + {stats.otherCities} bien{stats.otherCities > 1 ? 's' : ''} répartis sur d'autres villes{stats.unlocated > 0 ? ` · ${stats.unlocated} sans ville renseignée` : ''}.
                </p>
              )}
            </div>
          )}
        </StagePanel>

        <StagePanel
          title="Mandats qui expirent"
          icon={Clock}
          hue={STAGE_HUES.fuchsia}
          badge={
            stats.expiring.length > 0
              ? <StageBadge variant="warn">{stats.expiring.length} à traiter</StageBadge>
              : <StageBadge variant="ok">Portefeuille sain</StageBadge>
          }
        >
          {stats.expiring.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="Aucun mandat n'expire"
              detail="Tous les mandats actifs dépassent 45 jours d'échéance. Le portefeuille est sain."
              isDark={isDark}
              tone="ok"
            />
          ) : (
            <div className="space-y-2">
              {stats.expiring.map(({ property, days }) => {
                const urgency = days < 0 ? STAGE_HUES.fuchsia : days <= 14 ? STAGE_HUES.amber : STAGE_HUES.sky
                const label = days < 0 ? `Expiré · ${Math.abs(days)} j` : days === 0 ? "Aujourd'hui" : `J-${days}`
                return (
                  <button
                    key={property.id}
                    type="button"
                    onClick={() => goToDetail(property.id)}
                    className={cn(
                      'group flex w-full items-center gap-2.5 rounded-2xl border px-3 py-2 text-left transition-all',
                      isDark
                        ? 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.05]'
                        : 'border-slate-200/60 bg-white/60 hover:border-orange-300/60 hover:bg-white',
                    )}
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border"
                      style={{ color: urgency.line, borderColor: `${urgency.a}3D`, backgroundColor: `${urgency.a}14` }}
                    >
                      <AlertTriangle size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn('block truncate text-[11px] font-bold', isDark ? 'text-slate-100' : 'text-slate-800')}>
                        {property.title || property.reference || 'Bien sans titre'}
                      </span>
                      <span className={cn('mt-0.5 block truncate text-[9px] font-semibold', isDark ? 'text-slate-500' : 'text-slate-400')}>
                        {property.reference || '—'} · {property.city || 'Ville non renseignée'} · fin {property.mandateEndDate ? new Date(property.mandateEndDate).toLocaleDateString('fr-FR') : '—'}
                      </span>
                    </span>
                    <span
                      className="shrink-0 rounded-full border px-2 py-0.5 text-[8.5px] font-extrabold uppercase tracking-[0.1em] tabular-nums"
                      style={{ color: urgency.line, borderColor: `${urgency.a}45`, backgroundColor: `${urgency.a}14` }}
                    >
                      {label}
                    </span>
                    <ChevronRight size={13} className={cn('shrink-0 transition-transform duration-200 group-hover:translate-x-0.5', isDark ? 'text-slate-600 group-hover:text-slate-300' : 'text-slate-300 group-hover:text-slate-600')} />
                  </button>
                )
              })}
            </div>
          )}
        </StagePanel>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <StagePanel
          title="Activité récente"
          icon={Zap}
          hue={STAGE_HUES.emerald}
          outerClassName="lg:col-span-3"
          badge={<StageBadge variant="neutral">{stats.recent.length} derniers mouvements</StageBadge>}
        >
          {stats.recent.length === 0 ? (
            <EmptyState
              icon={Home}
              title="Aucun bien pour l'instant"
              detail="Ajoutez votre premier bien — il apparaîtra ici avec ses derniers mouvements."
              isDark={isDark}
              action={
                <StageButton size="sm" icon={<Plus size={12} />} onClick={() => setChooserOpen(true)}>
                  Ajouter un bien
                </StageButton>
              }
            />
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {stats.recent.map((p, i) => {
                const meta = TYPE_META.find(t => t.type === p.propertyType) || TYPE_META[0]
                const Icon = meta.icon
                const statusLabel = STATUS_LABELS[(p.status || '') as keyof typeof STATUS_LABELS] || p.status || '—'
                return (
                  <motion.button
                    key={p.id}
                    type="button"
                    onClick={() => goToDetail(p.id)}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className={cn(
                      'group flex w-full items-center gap-3 py-2.5 text-left transition-colors',
                      isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50/60',
                    )}
                  >
                    <OrbIcon icon={Icon} hue={meta.hue} size={34} radius={11} />
                    <span className="min-w-0 flex-1">
                      <span className={cn('block truncate text-[12px] font-bold leading-snug', isDark ? 'text-slate-100 group-hover:text-white' : 'text-slate-800 group-hover:text-slate-950')}>
                        {p.title || 'Bien sans titre'}
                      </span>
                      <span className={cn('mt-0.5 block truncate text-[9.5px] font-medium', isDark ? 'text-slate-500' : 'text-slate-400')}>
                        {p.reference || '—'} · {p.city || p.location || 'Localisation non renseignée'} · {fmtFullMAD(Number(p.price) || 0)}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span className={cn('text-[9px] font-semibold tabular-nums', isDark ? 'text-slate-500' : 'text-slate-400')}>
                        {relTime(p.updatedAt)}
                      </span>
                      <span className={cn(
                        'rounded-full border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em]',
                        isDark ? 'border-white/10 bg-white/[0.04] text-slate-400' : 'border-slate-200/80 bg-white/80 text-slate-500',
                      )}>
                        {statusLabel}
                      </span>
                    </span>
                    <ChevronRight size={14} className={cn('shrink-0 transition-transform duration-200 group-hover:translate-x-0.5', isDark ? 'text-slate-600 group-hover:text-slate-300' : 'text-slate-300 group-hover:text-slate-600')} />
                  </motion.button>
                )
              })}
            </div>
          )}
        </StagePanel>

        <StagePanel
          title="Santé du portefeuille"
          icon={Shield}
          hue={accent}
          outerClassName="lg:col-span-2"
          badge={<StageBadge variant={stats.avgCompletion >= 70 ? 'ok' : stats.avgCompletion >= 40 ? 'warn' : 'danger'}>{stats.avgCompletion}% complété</StageBadge>}
        >
          <div className="flex flex-col">
            <div className="grid grid-cols-3 gap-2">
              <Gauge
                label="Complétion"
                pct={stats.avgCompletion}
                hue={accent}
                isDark={isDark}
                detail="fiches biens"
              />
              <Gauge
                label="Photos"
                pct={pct(stats.withPhotos, stats.total)}
                hue={STAGE_HUES.sky}
                isDark={isDark}
                detail={`${stats.withPhotos}/${stats.total} avec visuels`}
              />
              <Gauge
                label="Mandats"
                pct={pct(stats.withMandat, stats.total)}
                hue={STAGE_HUES.emerald}
                isDark={isDark}
                detail={`${stats.withMandat}/${stats.total} renseignés`}
              />
            </div>
            <div className={cn(
              'mt-4 space-y-2 rounded-2xl border p-3',
              isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-slate-200/60 bg-white/50',
            )}>
              <p className={cn('text-[9px] font-extrabold uppercase tracking-[0.18em]', isDark ? 'text-slate-500' : 'text-slate-400')}>
                Points d'attention
              </p>
              <InsightLine
                ok={stats.total - stats.withPhotos === 0}
                text={stats.total - stats.withPhotos === 0
                  ? 'Tous les biens ont au moins une photo.'
                  : `${stats.total - stats.withPhotos} bien${stats.total - stats.withPhotos > 1 ? 's' : ''} sans photo — pénalisés en vitrine.`}
                isDark={isDark}
              />
              <InsightLine
                ok={stats.sansMandat === 0}
                text={stats.sansMandat === 0
                  ? 'Tous les biens sont rattachés à un mandat.'
                  : `${stats.sansMandat} bien${stats.sansMandat > 1 ? 's' : ''} sans mandat renseigné.`}
                isDark={isDark}
              />
              <InsightLine
                ok={stats.expiring.length === 0}
                text={stats.expiring.length === 0
                  ? "Aucun mandat n'expire dans les 45 jours."
                  : `${stats.expiring.length} mandat${stats.expiring.length > 1 ? 's' : ''} à renouveler sous 45 jours.`}
                isDark={isDark}
              />
            </div>
          </div>
        </StagePanel>
      </div>

      <StagePanel
        title="Matrice statuts × types"
        icon={Key}
        hue={STAGE_HUES.violet}
        badge={<StageBadge variant="neutral">cliquez sur une ligne pour explorer</StageBadge>}
      >
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className={cn('border-b text-left', isDark ? 'border-white/[0.07]' : 'border-slate-200/70')}>
                <th className={cn('pb-2 pr-4 text-[9px] font-extrabold uppercase tracking-[0.18em]', isDark ? 'text-slate-500' : 'text-slate-400')}>Type de bien</th>
                <th className={cn('pb-2 pr-4 text-[9px] font-extrabold uppercase tracking-[0.18em]', isDark ? 'text-slate-500' : 'text-slate-400')}>Transactions</th>
                <th className={cn('pb-2 pr-4 text-[9px] font-extrabold uppercase tracking-[0.18em]', isDark ? 'text-slate-500' : 'text-slate-400')}>Distribution des statuts</th>
                <th className={cn('pb-2 text-right text-[9px] font-extrabold uppercase tracking-[0.18em]', isDark ? 'text-slate-500' : 'text-slate-400')}>Part du parc</th>
              </tr>
            </thead>
            <tbody className={cn('divide-y', isDark ? 'divide-white/[0.05]' : 'divide-slate-100')}>
              {stats.byTypeRows.map(({ meta, rows, count }) => {
                const Icon = meta.icon
                const statusCounts = new Map<string, number>()
                rows.forEach(p => {
                  const s = p.status || ''
                  if (!s) return
                  statusCounts.set(s, (statusCounts.get(s) || 0) + 1)
                })
                const topStatuses = Array.from(statusCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4)
                const restCount = Array.from(statusCounts.values()).slice(4).reduce((s, n) => s + n, 0)
                const share = typeShare(count)
                return (
                  <tr
                    key={meta.type}
                    onClick={explorerLink(meta.type)}
                    className={cn(
                      'group cursor-pointer transition-colors',
                      isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-900/[0.04]',
                    )}
                  >
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2.5">
                        <OrbIcon icon={Icon} hue={meta.hue} size={30} radius={10} />
                        <div>
                          <p className={cn('text-[12px] font-extrabold leading-tight', isDark ? 'text-white' : 'text-slate-900')}>{meta.title}</p>
                          <p className={cn('text-[9px] font-semibold tabular-nums', isDark ? 'text-slate-500' : 'text-slate-400')}>{count} bien{count > 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4">
                      <div className="flex flex-wrap gap-1">
                        {meta.transactionKeys.map(tk => (
                          <span
                            key={tk}
                            className={cn(
                              'rounded-full border px-2 py-0.5 text-[9px] font-bold',
                              isDark ? 'border-white/10 bg-white/[0.04] text-slate-300' : 'border-slate-200/80 bg-white/80 text-slate-600',
                            )}
                          >
                            {TRANSACTION_TYPE_LABELS[tk as keyof typeof TRANSACTION_TYPE_LABELS] || tk}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 pr-4">
                      {topStatuses.length === 0 ? (
                        <span className={cn('text-[10px] italic', isDark ? 'text-slate-600' : 'text-slate-400')}>Aucun bien — distribution vide</span>
                      ) : (
                        <div className="flex flex-wrap items-center gap-1">
                          {topStatuses.map(([status, n]) => (
                            <span
                              key={status}
                              className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold"
                              style={{
                                color: isDark ? '#C9CFE8' : '#334155',
                                borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.10)',
                                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.04)',
                              }}
                            >
                              {STATUS_LABELS[status] || status}
                              <b className="tabular-nums">×{n}</b>
                            </span>
                          ))}
                          {restCount > 0 && (
                            <span className={cn('text-[9px] font-bold', isDark ? 'text-slate-500' : 'text-slate-400')}>+{restCount} autres</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center justify-end gap-2">
                        <span className={cn('w-8 text-right text-[10.5px] font-extrabold tabular-nums', isDark ? 'text-slate-200' : 'text-slate-700')}>{share}%</span>
                        <ChevronRight size={13} className={cn('transition-transform duration-200 group-hover:translate-x-0.5', isDark ? 'text-slate-600 group-hover:text-slate-300' : 'text-slate-300 group-hover:text-slate-500')} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </StagePanel>

      <AnimatePresence>
        {chooserOpen && (
          <PropertyTypeChooserAdmin
            stats={Object.fromEntries(stats.byTypeRows.map(r => [
              r.meta.type,
              { total: r.count, actifs: r.venteActive + r.locationActive, enNegociation: r.negociations },
            ]))}
            onClose={() => setChooserOpen(false)}
            onSelect={addPropertyOfType}
          />
        )}
      </AnimatePresence>

      <PropertyAssignModal
        open={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        users={users}
        currentUser={currentUser}
        onAssign={handleAssignProperty}
      />
    </div>
  )
}



function EmptyState({
  icon: Icon,
  title,
  detail,
  isDark,
  action,
  tone = 'neutral',
}: {
  icon: IconComponent
  title: string
  detail: string
  isDark: boolean
  action?: React.ReactNode
  tone?: 'neutral' | 'ok'
}) {
  const hue = tone === 'ok' ? STAGE_HUES.emerald : STAGE_HUES.sky
  return (
    <div className={cn(
      'flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-6 py-8 text-center',
      isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200/80 bg-white/40',
    )}>
      <OrbIcon icon={Icon} hue={hue} size={44} radius={13} />
      <div>
        <p className={cn('text-[12px] font-extrabold', isDark ? 'text-white' : 'text-slate-900')}>{title}</p>
        <p className={cn('mt-1 max-w-[260px] text-[10.5px] leading-snug', isDark ? 'text-slate-400' : 'text-slate-500')}>{detail}</p>
      </div>
      {action}
    </div>
  )
}

function InsightLine({ ok, text, isDark }: { ok: boolean; text: string; isDark: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <span
        className={cn(
          'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
          ok
            ? (isDark ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300' : 'border-emerald-600/20 bg-emerald-500/10 text-emerald-700')
            : (isDark ? 'border-amber-400/25 bg-amber-400/10 text-amber-300' : 'border-amber-600/20 bg-amber-500/10 text-amber-700'),
        )}
      >
        {ok ? <CheckCircle size={9} /> : <AlertTriangle size={9} />}
      </span>
      <span className={cn('text-[10.5px] font-medium leading-snug', isDark ? 'text-slate-300' : 'text-slate-600')}>{text}</span>
    </div>
  )
}
