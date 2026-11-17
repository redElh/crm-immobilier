import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  TrendingUp, Briefcase, Home, Users, Shield, Target, Layers, Activity,
  Calendar, DollarSign, Award, RefreshCw, Zap, Clock, UserPlus, PieChart,
  ArrowRight,
} from 'react-feather'
import {
  useStageTheme, useStageAccent, STAGE_HUES, AnimatedNumber,
  StagePanel, StageBadge, StageButton, StageTabs, StageTab,
  ShimmerProgress, StageLinkRow, TiltCard,
  SLATE_HUE, type StageHue,
} from '../../../components/dashboard/Stage'
import { AdminStatCard } from '../../../components/dashboard/AdminStatCard'
import { RevenueBars3D } from '../../../components/dashboard/three/RevenueBars3D'
import { PipelineOrbit3D } from '../../../components/dashboard/three/PipelineOrbit3D'
import { TrendCurve3D } from '../../../components/dashboard/three/TrendCurve3D'
import { Donut3D } from '../../../components/dashboard/three/Donut3D'
import { AgendaCalendar3D } from '../../../components/dashboard/three/AgendaCalendar3D'
import { Bars3D, formatCompactValue } from '../../../components/dashboard/three/Bars3D'
import {
  ETAPE_HUES, ORANGE_HUE,
} from '../../../components/modules/registre/RegistreStage'
import { RED_HUE } from '../../../components/modules/prospects/ProspectCard'
import { TRANSACTION_ETAPE_LABELS, type Transaction, type TransactionEtape } from '../../../types/transactions'
import { fetchRegistre } from '../../../services/registreService'
import { fetchContracts } from '../../../services/contractService'
import { fetchProperties } from '../../../services/propertyService'
import { fetchProspects } from '../../../services/prospectService'
import { fetchCalendarEvents } from '../../../services/calendarService'
import { api } from '../../../services/api'
import type { Prospect } from '../../../types/prospect'

const PERIODS: { id: 3 | 6 | 12; label: string }[] = [
  { id: 3, label: '3 mois' },
  { id: 6, label: '6 mois' },
  { id: 12, label: '12 mois' },
]

const MONTH_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

const ACTIVE_ETAPES: TransactionEtape[] = ['actif', 'signe', 'en_attente', 'reservation']
const DEAD_ETAPES: TransactionEtape[] = ['annule', 'resilie', 'expire']

const PROSPECT_FUNNEL: Prospect['status'][] = ['Nouveau', 'Contacté', 'Qualifié', 'En attente', 'Converti', 'Perdu']

const FUNNEL_HUES: Record<Prospect['status'], StageHue> = {
  Nouveau: STAGE_HUES.sky,
  Contacté: STAGE_HUES.amber,
  Qualifié: STAGE_HUES.fuchsia,
  'En attente': ORANGE_HUE,
  Converti: STAGE_HUES.emerald,
  Perdu: RED_HUE,
}

function parseAmount(raw: string | undefined): number {
  if (!raw) return 0
  const clean = String(raw).replace(/[\s\u00A0']/g, '')
  if (clean.includes('€')) return 0
  const m = clean.match(/(\d+(?:[.,]\d+)?)/)
  if (!m) return 0
  return parseFloat(m[1].replace(',', '.'))
}

function formatMADCompact(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(abs >= 10_000_000 ? 1 : 2).replace('.', ',')} M`
  if (abs >= 1_000) return `${Math.round(value / 1_000).toLocaleString('fr-FR')} K`
  return `${Math.round(value).toLocaleString('fr-FR')}`
}

function formatMADFull(value: number): string {
  return `${Math.round(value).toLocaleString('fr-FR')} MAD`
}

function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count > 1 ? pluralForm : singular}`
}

const CONTRACT_STATUS_ORDER = ['en_cours', 'confirme_actif', 'finalise_termine', 'paye'] as const
const CONTRACT_STATUS_LABELS: Record<string, string> = {
  en_cours: 'En cours',
  confirme_actif: 'Confirmés',
  finalise_termine: 'Finalisés',
  paye: 'Payés',
}
const CONTRACT_STATUS_HUES: Record<string, StageHue> = {
  en_cours: STAGE_HUES.sky,
  confirme_actif: STAGE_HUES.emerald,
  finalise_termine: STAGE_HUES.violet,
  paye: STAGE_HUES.amber,
}

function mountDate(t: Transaction): Date | null {
  const src = t.dateContrat || t.dateContracted || t.dateReservation
  if (!src) return null
  const d = new Date(src)
  return Number.isNaN(d.getTime()) ? null : d
}

const initialsOf = (name: string): string =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase() || '').join('') || '?'

function relativeDayLabel(date: Date): string {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const diff = Math.round((startOfTarget - startOfToday) / 86_400_000)
  if (diff === 0) return "Aujourd'hui"
  if (diff === 1) return 'Demain'
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

const insetPill = (isDark: boolean): string =>
  isDark
    ? 'inset 0 1px 0 rgba(255,255,255,0.35), 0 10px 26px -8px rgba(190,18,60,0.7)'
    : 'inset 0 1px 0 rgba(255,255,255,0.5), 0 10px 26px -10px rgba(249,115,22,0.6)'

const accentBadge = (isDark: boolean): 'danger' | 'warn' => (isDark ? 'danger' : 'warn')

function toArray<T = Record<string, unknown>>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[]
  if (payload && typeof payload === 'object') {
    const obj = payload as { data?: unknown; users?: unknown; items?: unknown; results?: unknown }
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (Array.isArray(obj.users)) return obj.users as T[]
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.results)) return obj.results as T[]
  }
  return []
}



  const tabs: StageTab[] = [
    { id: 'overview', label: "Vue d'ensemble", icon: Activity },
    { id: 'equipe', label: 'Équipe', icon: Users },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'pipeline', label: 'Pipeline', icon: Layers },
    { id: 'activite', label: 'Activité', icon: Calendar },
  ]

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const theme = useStageTheme()
  const isDark = theme === 'dark'
  const accent = useStageAccent()
  const [period, setPeriod] = useState<3 | 6 | 12>(6)
  const [tab, setTabState] = useState(() => {
    const savedTab = searchParams.get('tab')
    return savedTab && tabs.some(t => t.id === savedTab) ? savedTab : 'overview'
  })
  
  const setTab = useCallback((tabId: string) => {
    setTabState(tabId)
    setSearchParams(prev => { 
      prev.set('tab', tabId) 
      return prev 
    }, { replace: true })
  }, [setSearchParams])
  const [loading, setLoading] = useState(true)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const [partial, setPartial] = useState(false)

  const [userName, setUserName] = useState('')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [properties, setProperties] = useState<Record<string, unknown>[]>([])
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [users, setUsers] = useState<Record<string, unknown>[]>([])
  const [events, setEvents] = useState<Array<{ id: string; title: string; type: string; start: Date; end?: Date; agentNames?: string[] }>>([])
  const [contracts, setContracts] = useState<Record<string, unknown>[]>([])

  const refresh = useCallback(async () => {
    setLoading(true)
    const results = await Promise.allSettled([
      fetchRegistre(),
      fetchProperties(),
      fetchProspects(),
      fetchCalendarEvents(),
      api.get('/admin/users'),
      fetchContracts(),
    ])
    let ok = 0

    const [reg, props, prosp, cal, usr, con] = results
    if (reg.status === 'fulfilled') { setTransactions(toArray<Transaction>(reg.value)); ok++ }
    if (props.status === 'fulfilled') { setProperties(toArray(props.value)); ok++ }
    if (prosp.status === 'fulfilled') { setProspects(toArray<Prospect>(prosp.value)); ok++ }
    if (cal.status === 'fulfilled') {
      const raw = toArray<{ id?: unknown; title?: unknown; type?: unknown; start?: unknown; agentNames?: unknown }>(cal.value)
      setEvents(
        raw
          .map(e => ({
            id: String(e.id ?? Math.random()),
            title: String(e.title ?? 'Rendez-vous'),
            type: String(e.type ?? ''),
            start: new Date(e.start as string | Date),
            agentNames: Array.isArray(e.agentNames) ? e.agentNames.map(String) : undefined,
          }))
          .filter(e => !Number.isNaN(e.start.getTime()))
      )
      ok++
    }
    if (usr.status === 'fulfilled') { setUsers(toArray(usr.value)); ok++ }
    if (con.status === 'fulfilled') { setContracts(toArray(con.value)); ok++ }

    setPartial(ok < results.length)
    setUpdatedAt(new Date())
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
    api.get<Record<string, unknown>>('/auth/me').then(u => {
      setUserName(String(u.first_name || u.firstName || ''))
    }).catch(() => {})
  }, [refresh])

  /* ------------------------- aggregations ------------------------- */

  const monthBuckets = useMemo(() => {
    const now = new Date()
    const months: { key: string; label: string }[] = []
    for (let i = period - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: MONTH_SHORT[d.getMonth()] })
    }
    return months
  }, [period])

  const byMonth = useMemo(() => {
    const map = new Map<string, { ca: number; deals: number }>()
    for (const b of monthBuckets) map.set(b.key, { ca: 0, deals: 0 })
    for (const t of transactions) {
      const d = mountDate(t)
      if (!d) continue
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (map.has(key)) {
        const b = map.get(key)!
        b.ca += parseAmount(t.montant)
        b.deals += 1
      }
    }
    return monthBuckets.map(b => ({ label: b.label, ...map.get(b.key)! }))
  }, [transactions, monthBuckets])

  const trendSeries = useMemo(
    () => byMonth.map(m => ({ label: m.label, ca: Math.round(m.ca / 1000), mandats: m.deals })),
    [byMonth]
  )

  const trendSeriesConfig = useMemo(
    () => [
      { dataKey: 'ca', name: 'CA', hue: accent, unit: 'K MAD' },
      { dataKey: 'mandats', name: 'Mandats', hue: STAGE_HUES.sky },
    ],
    [accent]
  )

  const caTotal = useMemo(
    () => transactions.reduce((sum, t) => (DEAD_ETAPES.includes(t.etape) ? sum : sum + parseAmount(t.montant)), 0),
    [transactions]
  )
  const caYear = useMemo(() => {
    const year = new Date().getFullYear()
    return transactions.reduce((sum, t) => {
      if (DEAD_ETAPES.includes(t.etape)) return sum
      const d = mountDate(t)
      return d && d.getFullYear() === year ? sum + parseAmount(t.montant) : sum
    }, 0)
  }, [transactions])
  const mandatsActifs = useMemo(() => transactions.filter(t => ACTIVE_ETAPES.includes(t.etape)).length, [transactions])
  const mandatsWindow = useMemo(() => byMonth.reduce((s, m) => s + m.deals, 0), [byMonth])
  const caWindow = useMemo(() => byMonth.reduce((s, m) => s + m.ca, 0), [byMonth])

  const caMom = useMemo(() => {
    if (byMonth.length < 2) return 0
    const last = byMonth[byMonth.length - 1]?.ca ?? 0
    const prev = byMonth[byMonth.length - 2]?.ca ?? 0
    if (prev === 0) return last > 0 ? 100 : 0
    return Math.round(((last - prev) / prev) * 100)
  }, [byMonth])

  const stats = useMemo(() => {
    const byAgent = new Map<string, { name: string; deals: number; ca: number; actifs: number }>()
    for (const t of transactions) {
      const key = t.agentName || '—'
      if (!byAgent.has(key)) byAgent.set(key, { name: key, deals: 0, ca: 0, actifs: 0 })
      const a = byAgent.get(key)!
      a.deals += 1
      a.ca += parseAmount(t.montant)
      if (ACTIVE_ETAPES.includes(t.etape)) a.actifs += 1
    }
    return Array.from(byAgent.values()).sort((x, y) => y.ca - x.ca)
  }, [transactions])

  const bestCa = stats[0]?.ca || 0
  const shareOf = (ca: number) => (caTotal > 0 ? Math.round((ca / caTotal) * 100) : 0)
  const top3Share = caTotal > 0 ? Math.round((stats.slice(0, 3).reduce((s, a) => s + a.ca, 0) / caTotal) * 100) : 0
  const leadGap = stats.length > 1 ? stats[0].ca - stats[1].ca : 0
  const dealsPerContributor = stats.length > 0 ? transactions.length / stats.length : 0

  const etapeSlices = useMemo(() => {
    const order: TransactionEtape[] = ['actif', 'signe', 'reservation', 'en_attente', 'cloture']
    const counts = new Map<TransactionEtape, number>()
    for (const e of order) counts.set(e, 0)
    for (const t of transactions) {
      const e = DEAD_ETAPES.includes(t.etape) || !counts.has(t.etape) ? null : t.etape
      if (e) counts.set(e, (counts.get(e) || 0) + 1)
    }
    return order
      .filter(e => (counts.get(e) || 0) > 0)
      .map(e => ({ name: TRANSACTION_ETAPE_LABELS[e], value: counts.get(e)!, hue: ETAPE_HUES[e] || SLATE_HUE }))
  }, [transactions])

  const etapeTotal = etapeSlices.reduce((s, x) => s + x.value, 0)

  const orbitStages = useMemo(
    () => etapeSlices.map(s => ({ label: s.name, count: s.value, hue: s.hue })),
    [etapeSlices]
  )

  const funnelData = useMemo(() => {
    const counts = new Map<Prospect['status'], number>()
    for (const p of prospects) {
      const s = PROSPECT_FUNNEL.includes(p.status) ? p.status : null
      if (s) counts.set(s, (counts.get(s) || 0) + 1)
    }
    return PROSPECT_FUNNEL.map(s => ({ label: s, value: counts.get(s) || 0 }))
  }, [prospects])

  const prospectsVivants = useMemo(
    () => prospects.filter(p => p.status !== 'Perdu' && p.status !== 'Converti').length,
    [prospects]
  )
  const tauxConversion = useMemo(() => {
    if (prospects.length === 0) return 0
    return Math.round((prospects.filter(p => p.status === 'Converti').length / prospects.length) * 100)
  }, [prospects])

  const agentsActifsCount = useMemo(
    () => users.filter(u => String(u.role || '') === 'agent' && Boolean(u.is_active)).length,
    [users]
  )

  const contractCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const c of contracts) {
      const s = String(c.status || c.statut || '')
      if (CONTRACT_STATUS_LABELS[s]) counts.set(s, (counts.get(s) || 0) + 1)
    }
    return counts
  }, [contracts])

  const contractLegend = useMemo(
    () => CONTRACT_STATUS_ORDER.map(k => ({
      key: k,
      name: CONTRACT_STATUS_LABELS[k],
      value: contractCounts.get(k) || 0,
      hue: CONTRACT_STATUS_HUES[k],
    })),
    [contractCounts]
  )

  const contractSlices = useMemo(
    () => contractLegend.filter(c => c.value > 0).map(c => ({ name: c.name, value: c.value, hue: c.hue })),
    [contractLegend]
  )

  const contractsTotal = useMemo(
    () => contractLegend.reduce((sum, c) => sum + c.value, 0),
    [contractLegend]
  )

  const propertiesWithMandat = useMemo(() => {
    const ids = new Set<string>()
    for (const t of transactions) if (t.propertyId) ids.add(String(t.propertyId))
    return ids.size
  }, [transactions])

  const mandatsSignes = useMemo(() => transactions.filter(t => t.etape === 'signe').length, [transactions])
  const mandatsPipeline = useMemo(
    () => transactions.filter(t => t.etape === 'reservation' || t.etape === 'en_attente').length,
    [transactions]
  )
  const activeUsers = useMemo(() => users.filter(u => Boolean(u.is_active)), [users])

  const prospectsNouveaux = useMemo(() => {
    const start = monthBuckets[0]?.key
    if (!start) return 0
    return prospects.filter(p => {
      const d = new Date(p.createdAt)
      if (Number.isNaN(d.getTime())) return false
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` >= start
    }).length
  }, [prospects, monthBuckets])

  const bestMonth = useMemo(
    () => byMonth.reduce(
      (best, m) => (m.ca > best.ca ? m : best),
      { label: '—', ca: 0, deals: 0 }
    ),
    [byMonth]
  )

  const upcoming = useMemo(() => {
    const now = new Date()
    return events
      .filter(e => e.start.getTime() >= now.getTime() - 6 * 3600_000)
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .slice(0, 7)
  }, [events])

  const caMoyen = mandatsWindow > 0 ? Math.round(caWindow / mandatsWindow) : 0

  /* ------------------------- performance / activity ------------------------- */

  const annualTarget = 50_000_000
  const monthsElapsed = new Date().getMonth() + 1
  const objectivePct = annualTarget > 0 ? Math.round((caYear / annualTarget) * 100) : 0
  const objectiveBarPct = Math.min(100, Math.max(0, objectivePct))
  const remainingToGoal = Math.max(0, annualTarget - caYear)
  const annualizedRunRate = Math.round((caYear / Math.max(monthsElapsed, 1)) * 12)
  const goalReached = caYear >= annualTarget
  const expectedProgress = Math.round((monthsElapsed / 12) * 100)
  const paceGap = annualizedRunRate - annualTarget

  const contractsClosed = contractLegend
    .filter(c => c.key === 'finalise_termine' || c.key === 'paye')
    .reduce((sum, c) => sum + c.value, 0)
  const contractCompletionPct = contractsTotal > 0 ? Math.round((contractsClosed / contractsTotal) * 100) : 0

  const funnelBars = useMemo(
    () => funnelData.map(f => {
      const status = f.label as Prospect['status']
      return {
        label: f.label,
        value: f.value,
        hue: FUNNEL_HUES[status],
        meta: prospects.length > 0 ? `${Math.round((f.value / prospects.length) * 100)}% du total` : undefined,
      }
    }),
    [funnelData, prospects.length]
  )

  const recentTransactions = useMemo(
    () => transactions
      .slice()
      .sort((a, b) => (mountDate(b)?.getTime() || 0) - (mountDate(a)?.getTime() || 0))
      .slice(0, 6),
    [transactions]
  )

  const todayEvents = useMemo(() => {
    const now = new Date()
    return events.filter(e =>
      e.start.getFullYear() === now.getFullYear() &&
      e.start.getMonth() === now.getMonth() &&
      e.start.getDate() === now.getDate()
    ).length
  }, [events])

  const weekEvents = useMemo(() => {
    const now = Date.now()
    return events.filter(e => {
      const t = e.start.getTime()
      return t >= now && t <= now + 7 * 86_400_000
    }).length
  }, [events])

  const agendaAgents = useMemo(
    () => new Set(events.flatMap(e => e.agentNames ?? [])).size,
    [events]
  )

  const nextEvent = upcoming[0] ?? null
  const nextEventRelative = nextEvent ? relativeDayLabel(nextEvent.start) : null
  const agendaRest = upcoming.slice(nextEvent ? 1 : 0, 6)

  const weekDays = useMemo(() => {
    const now = new Date()
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7))
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)
      const count = events.filter(e =>
        e.start.getFullYear() === day.getFullYear() &&
        e.start.getMonth() === day.getMonth() &&
        e.start.getDate() === day.getDate()
      ).length
      return {
        key: `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`,
        label: day.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', ''),
        date: day.getDate(),
        today: day.getFullYear() === now.getFullYear() && day.getMonth() === now.getMonth() && day.getDate() === now.getDate(),
        count,
      }
    })
  }, [events])
  const weekEventCount = weekDays.reduce((total, d) => total + d.count, 0)

  /* ------------------------- render ------------------------- */

  const quickLinks = [
    { icon: Users, label: 'Gestion des utilisateurs', hint: 'Comptes, rôles & activation', to: './users', hue: STAGE_HUES.violet },
    { icon: Briefcase, label: 'Registre des mandats', hint: 'Portefeuille & transactions', to: './registre', hue: STAGE_HUES.sky },
    { icon: Layers, label: 'Suivi des contrats', hint: 'Statuts & pièces signées', to: './contrats', hue: STAGE_HUES.emerald },
    { icon: UserPlus, label: 'Prospects & qualification', hint: 'Vivier, relances & conversion', to: './prospects', hue: STAGE_HUES.fuchsia },
  ]

  /* ------------------------- render ------------------------- */

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <span
          className="orb-icon h-14 w-14 rounded-2xl"
          style={{ ['--orb-a' as string]: accent.a, ['--orb-b' as string]: accent.b }}
        />
        <span className={`text-xs font-bold uppercase tracking-[2px] ${isDark ? 'text-slate-400' : 'text-teal-900/50'}`}>
          Orchestration des données…
        </span>
      </div>
    )
  }

  const gradientTitle = isDark
    ? 'bg-clip-text text-transparent bg-gradient-to-r from-[#F43F5E] via-[#FB7185] to-[#8B7CFF]'
    : 'bg-clip-text text-transparent bg-gradient-to-r from-[#EA580C] via-[#F97316] to-[#FBBF24]'

  return (
    <div className="space-y-5">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className={`flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[3px] ${isDark ? 'text-slate-400' : 'text-teal-900/50'}`}>
              <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Square Immo · Vue globale · Temps réel
            </p>
            <h1 className={`mt-2 text-4xl font-black tracking-[-2px] sm:text-5xl ${gradientTitle}`}>
              MISSION CONTROL
            </h1>
            <p className={`mt-1.5 text-sm ${isDark ? 'text-slate-400' : 'text-teal-900/60'}`}>
              Bonjour {userName || 'Gérant'} — pilotage unifié de toute l'agence&nbsp;: portefeuille, équipe, pipeline et agenda.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="stage-glass flex items-center gap-1 rounded-2xl p-1.5">
              {PERIODS.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriod(p.id)}
                  className={`relative rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
                    period === p.id ? 'text-white' : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-teal-900'
                  }`}
                >
                  {period === p.id && (
                    <motion.span
                      layoutId="admin-period-pill"
                      className="absolute inset-0 rounded-xl border border-white/25"
                      style={{
                        backgroundImage: isDark
                          ? 'linear-gradient(145deg, #F43F5E 0%, #C2266B 55%, #6D28D9 100%)'
                          : 'linear-gradient(145deg, #FDBA74 0%, #F97316 55%, #C2410C 100%)',
                        boxShadow: insetPill(isDark),
                      }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{p.label}</span>
                </button>
              ))}
            </div>
            <StageButton variant="glass" onClick={refresh} className="shrink-0">
              <RefreshCw size={13} /> Actualiser
            </StageButton>
          </div>
        </div>
      </motion.div>

      {/* KPI deck */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <AdminStatCard
          icon={DollarSign}
          label="CA période"
          value={caWindow / 1_000_000}
          decimals={2}
          unit="MAD"
          trend={`${caMom >= 0 ? '+' : ''}${caMom}%`}
          trendUp={caMom >= 0}
          detail={`${period} derniers mois · agence`}
          hue={accent}
          spark={trendSeries.map(m => m.ca)}
          facts={[
            { label: 'Moy. / mois', value: `${formatMADCompact(caWindow / Math.max(period, 1))} MAD` },
            { label: 'Total agence', value: `${formatMADCompact(caTotal)} MAD` },
          ]}
          action={<StageBadge variant={accentBadge(isDark)}>Live</StageBadge>}
          delay={0}
        />
        <AdminStatCard
          icon={Briefcase}
          label="Mandats actifs"
          value={mandatsActifs}
          unit="en cours"
          detail={`${mandatsWindow} conclus sur ${period} mois`}
          hue={STAGE_HUES.sky}
          spark={trendSeries.map(m => m.mandats)}
          facts={[
            { label: 'Signés', value: mandatsSignes },
            { label: 'En pipeline', value: mandatsPipeline },
          ]}
          delay={0.06}
        />
        <AdminStatCard
          icon={Home}
          label="Biens au portefeuille"
          value={properties.length}
          unit="biens"
          detail={`${propertiesWithMandat} rattachés à un mandat`}
          hue={STAGE_HUES.emerald}
          spark={[...Array(Math.min(period, 6))].map((_, i) => Math.max(1, Math.round(properties.length * (0.45 + (i / Math.max(period - 1, 1)) * 0.55))))}
          facts={[
            { label: 'Avec mandat', value: propertiesWithMandat },
            { label: 'Sans mandat', value: Math.max(0, properties.length - propertiesWithMandat) },
          ]}
          delay={0.12}
        />
        <AdminStatCard
          icon={UserPlus}
          label="Prospects vivants"
          value={prospectsVivants}
          suffix=""
          unit={`/ ${prospects.length}`}
          detail={`${tauxConversion}% de conversion`}
          hue={STAGE_HUES.fuchsia}
          spark={[...funnelData.map(f => f.value)]}
          facts={[
            { label: 'Nouveaux', value: prospectsNouveaux },
            { label: 'Qualifiés', value: funnelData.find(f => f.label === 'Qualifié')?.value ?? 0 },
          ]}
          delay={0.18}
        />
        <AdminStatCard
          icon={Shield}
          label="Équipe active"
          value={agentsActifsCount}
          unit="agents"
          detail={`${stats.length} contributeurs au CA`}
          hue={STAGE_HUES.violet}
          spark={stats.slice(0, 6).map(s => s.deals)}
          facts={[
            { label: 'Comptes actifs', value: activeUsers.length },
            { label: 'Contributeurs', value: stats.length },
          ]}
          delay={0.24}
        />
      </div>

      {/* Tabs */}
      <StageTabs tabs={tabs} activeId={tab} onChange={setTab} />

      {partial && (
        <StageBadge variant="warn" className="mx-1">
          Certaines sources sont indisponibles — les indicateurs affichés restent cohérents.
        </StageBadge>
      )}

      {tab === 'overview' && (
        <motion.div
          key={`overview-${period}`}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-4"
        >
          <div className="grid items-stretch gap-4 lg:grid-cols-3">
            <StagePanel
              title="Chiffre d'affaires — scène 3D"
              icon={TrendingUp} hue={accent}
              badge={<StageBadge variant={accentBadge(isDark)}>{period} mois · {mandatsWindow} mandats</StageBadge>}
              outerClassName="h-full lg:col-span-2"
              className="h-full min-h-[436px]"
            >
              <div className="flex h-full min-h-0 flex-col">
                <div className="flex flex-wrap items-center gap-2">
                  <StageBadge variant="neutral">Total · {(caWindow / 1_000_000).toFixed(2)} M MAD</StageBadge>
                  <StageBadge variant="ok">Moy. · {Math.round(caWindow / period / 1000)} K / mois</StageBadge>
                  <StageBadge variant="neutral">Panier · {mandatsWindow > 0 ? formatMADFull(caWindow / mandatsWindow) : '—'}</StageBadge>
                  <StageBadge variant={caMom >= 0 ? 'ok' : 'danger'}>
                    {caMom >= 0 ? '▲' : '▼'} {Math.abs(caMom)}% vs mois préc.
                  </StageBadge>
                </div>
                <RevenueBars3D
                  data={byMonth}
                  hue={accent}
                  isDark={isDark}
                  height={300}
                  className="mt-3 w-full shrink-0"
                />
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-semibold ${isDark ? 'text-slate-500' : 'text-teal-900/50'}`}>
                    Meilleur mois · <b className={isDark ? 'text-slate-300' : 'text-slate-700'}>{bestMonth.label}</b> à {formatMADFull(bestMonth.ca)}
                  </span>
                  <span className={`hidden text-[10px] font-semibold sm:block ${isDark ? 'text-slate-500' : 'text-teal-900/50'}`}>
                    {byMonth.reduce((s, m) => s + m.deals, 0)} mandats sur la fenêtre
                  </span>
                </div>
              </div>
            </StagePanel>

            <StagePanel
              title="Portefeuille par étape"
              icon={PieChart}
              hue={STAGE_HUES.violet}
              outerClassName="h-full"
              className="h-full min-h-[436px]"
              badge={<StageBadge variant="neutral">{etapeSlices.length} étapes</StageBadge>}
            >
              <div className="flex h-full min-h-0 flex-col">
                <Donut3D
                  slices={etapeSlices}
                  centerValue={String(etapeTotal)}
                  centerLabel="Mandats suivis"
                  isDark={isDark}
                  height={282}
                  emptyLabel="Aucun mandat enregistré"
                />
                <div className="mt-auto grid grid-cols-2 gap-1.5 pt-3">
                  {etapeSlices.length === 0 && (
                    <p className={`col-span-2 text-center text-[11px] ${isDark ? 'text-slate-500' : 'text-teal-900/50'}`}>
                      Le portefeuille se remplira dès le premier mandat.
                    </p>
                  )}
                  {etapeSlices.map(s => {
                    const pct = etapeTotal > 0 ? Math.round((s.value / etapeTotal) * 100) : 0
                    return (
                      <div
                        key={s.name}
                        className={`flex min-w-0 items-center gap-2 rounded-lg border px-2 py-1.5 ${
                          isDark ? 'border-white/[0.06] bg-white/[0.035]' : 'border-slate-200/60 bg-white/55'
                        }`}
                      >
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.hue.line, boxShadow: `0 0 8px ${s.hue.glow}` }} />
                        <span className={`min-w-0 flex-1 truncate text-[10.5px] font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{s.name}</span>
                        <span className={`text-[11px] font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{s.value}</span>
                        <span className={`text-[9px] font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </StagePanel>
          </div>

          <StagePanel title="Dynamique du portefeuille" icon={Activity} hue={accent} className="h-full min-h-[432px]">
            <div className="flex h-full min-h-0 flex-col">
              <div className="flex flex-wrap items-center gap-2">
                <StageBadge variant="neutral">CA fenêtre · {(caWindow / 1_000_000).toFixed(2)} M MAD</StageBadge>
                <StageBadge variant="violet">Apogée · {bestMonth.label}</StageBadge>
                <StageBadge variant={caMom >= 0 ? 'ok' : 'danger'}>
                  {caMom >= 0 ? '▲' : '▼'} {Math.abs(caMom)}% MoM
                </StageBadge>
                <span className={`ml-auto text-[10px] font-semibold ${isDark ? 'text-slate-500' : 'text-teal-900/50'}`}>
                  deux échelles normalisées pour lire CA et mandats ensemble
                </span>
              </div>
              <TrendCurve3D
                data={trendSeries}
                series={trendSeriesConfig}
                isDark={isDark}
                height={300}
                className="mt-3 w-full shrink-0"
              />
            </div>
          </StagePanel>
        </motion.div>
      )}

      {tab === 'equipe' && (
        <motion.div
          key="equipe"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="grid items-stretch gap-4 lg:grid-cols-3">
            <StagePanel
              title="Podium des vendeurs"
              icon={Award} hue={STAGE_HUES.amber}
              badge={<StageBadge variant="neutral">{stats.length} contributeurs</StageBadge>}
              outerClassName="h-full lg:col-span-2"
              className="h-full min-h-[604px]"
            >
              <div className="flex h-full min-h-0 flex-col">
                <div className="grid gap-3 sm:grid-cols-3">
                  {[0, 1, 2].map(i => {
                    const a = stats[i]
                    if (!a) {
                      return (
                        <TiltCard key={`empty-${i}`} className="flex min-h-[178px] flex-col items-center justify-center p-4 opacity-60">
                          <span className="orb-icon flex h-11 w-11 items-center justify-center rounded-2xl text-[11px] font-extrabold" style={{ ['--orb-a' as string]: '#64748B', ['--orb-b' as string]: '#1E293B', ['--orb-glow' as string]: 'rgba(100,116,139,0.35)' }}>
                            —
                          </span>
                          <p className={`mt-3 text-[12px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Place libre</p>
                          <p className={`text-center text-[10px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Le prochain mandat signé prend la tête.</p>
                        </TiltCard>
                      )
                    }
                    const pct = shareOf(a.ca)
                    return (
                      <TiltCard key={a.name} className="flex h-full min-h-[178px] flex-col p-4">
                        <div className="flex items-start justify-between">
                          <span
                            className="orb-icon flex h-11 w-11 items-center justify-center rounded-2xl text-[13px] font-extrabold"
                            style={{ ['--orb-a' as string]: i === 0 ? '#FBBF24' : i === 1 ? '#CBD5E1' : '#F97316', ['--orb-b' as string]: i === 0 ? '#B45309' : i === 1 ? '#64748B' : '#C2410C', ['--orb-glow' as string]: i === 0 ? 'rgba(251,191,36,0.5)' : 'rgba(148,163,184,0.35)' }}
                          >
                            {initialsOf(a.name)}
                          </span>
                          <StageBadge variant={i === 0 ? 'warn' : i === 1 ? 'neutral' : 'violet'}>
                            {i === 0 ? '№1' : i === 1 ? '№2' : '№3'}
                          </StageBadge>
                        </div>
                        <p className={`mt-3 truncate text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{a.name}</p>
                        <p className={`text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-teal-900/50'}`}>
                          {a.deals} mandats · {a.actifs} actifs
                        </p>
                        <p className={`mt-2 text-2xl font-extrabold tracking-[-0.5px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          <AnimatedNumber value={a.ca} suffix=" MAD" />
                        </p>
                        <div className="mt-auto pt-3">
                          <ShimmerProgress pct={pct} colorFrom={accent.a} colorTo={accent.b} glow={accent.glow} intense />
                        </div>
                        <div className="mt-1.5 flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-bold uppercase tracking-[1.1px] ${isDark ? 'text-slate-500' : 'text-teal-900/40'}`}>
                            {pct}% du CA global
                          </span>
                          <span className={`text-[10px] font-semibold ${isDark ? 'text-slate-500' : 'text-teal-900/40'}`}>
                            {a.actifs} actifs
                          </span>
                        </div>
                      </TiltCard>
                    )
                  })}
                </div>

                <div className="mt-4 flex flex-1 flex-col justify-center">
                  {stats.length > 3 ? (
                    <div className="space-y-2">
                      {stats.slice(3, 9).map((a, i) => (
                        <div
                          key={a.name}
                          className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
                            isDark ? 'border-white/[0.06] bg-white/[0.03]' : 'border-slate-200/70 bg-white/70'
                          }`}
                        >
                          <span className={`w-5 text-center text-xs font-extrabold ${isDark ? 'text-slate-500' : 'text-teal-900/40'}`}>{i + 4}</span>
                          <span className="min-w-0 flex-1">
                            <span className={`block truncate text-[13px] font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{a.name}</span>
                            <span className={`text-[10px] font-semibold ${isDark ? 'text-slate-500' : 'text-teal-900/40'}`}>{a.deals} mandats · {a.actifs} actifs</span>
                          </span>
                          <span className="hidden w-32 sm:block">
                            <ShimmerProgress pct={bestCa ? Math.round((a.ca / bestCa) * 100) : 0} colorFrom={STAGE_HUES.sky.a} colorTo={STAGE_HUES.sky.b} glow={STAGE_HUES.sky.glow} height={6} />
                          </span>
                          <span className={`w-32 text-right font-mono text-[13px] font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            {a.ca.toLocaleString('fr-FR')} MAD
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : stats.length > 0 ? (
                    <div className={`rounded-xl border p-3 ${isDark ? 'border-white/[0.06] bg-white/[0.03]' : 'border-slate-200/70 bg-white/60'}`}>
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-[8.5px] font-bold uppercase tracking-[1.2px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                          Lecture du classement
                        </p>
                        <span className={`text-[11px] font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{top3Share}% du CA</span>
                      </div>
                      <div className="mt-2">
                        <ShimmerProgress pct={top3Share} colorFrom={accent.a} colorTo={accent.b} glow={accent.glow} height={5} />
                      </div>
                      <div className="mt-3 space-y-1.5">
                        {[
                          { label: 'Concentration du podium', value: `${top3Share}%` },
                          { label: 'Écart n°1 / n°2', value: stats.length > 1 ? `${formatMADCompact(leadGap)} MAD` : '—' },
                          { label: 'Panier moyen agence', value: `${formatMADCompact(caMoyen)} MAD` },
                          { label: 'Mandats / contributeur', value: dealsPerContributor.toFixed(1).replace('.', ',') },
                        ].map(row => (
                          <div key={row.label} className="flex items-center justify-between gap-2 text-[10.5px]">
                            <span className={`font-semibold ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}>{row.label}</span>
                            <span className={`font-extrabold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{row.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className={`flex min-h-[48px] items-center justify-center rounded-xl border border-dashed px-3 text-[11px] ${
                      isDark ? 'border-white/10 text-slate-500' : 'border-slate-300/70 text-slate-400'
                    }`}>
                      Le podium s'animera au premier mandat signé.
                    </div>
                  )}
                </div>

                <div className={`mt-4 grid grid-cols-3 gap-2 rounded-xl border p-2.5 ${isDark ? 'border-white/[0.06] bg-white/[0.03]' : 'border-slate-200/70 bg-white/60'}`}>
                  {[
                    { label: 'CA agence', value: `${formatMADCompact(caTotal)} MAD` },
                    { label: 'Mandats suivis', value: transactions.length.toLocaleString('fr-FR') },
                    { label: 'Contributeurs', value: stats.length.toLocaleString('fr-FR') },
                  ].map(s => (
                    <div key={s.label} className="min-w-0">
                      <p className={`truncate text-[8.5px] font-bold uppercase tracking-[1px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{s.label}</p>
                      <p className={`mt-0.5 truncate text-[12px] font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </StagePanel>

            <StagePanel
              title="Équipe & comptes"
              icon={Users}
              hue={STAGE_HUES.violet}
              outerClassName="h-full"
              className="h-full min-h-[604px]"
              badge={<StageBadge variant="neutral">{activeUsers.length} actifs</StageBadge>}
            >
              <div className="flex h-full min-h-0 flex-col">
                <div className="space-y-3">
                  <StatTile label="Agents actifs" value={agentsActifsCount} sub={`sur ${users.length} comptes`} isDark={isDark} hue={STAGE_HUES.violet} />
                  <StatTile label="Contributions au CA" value={stats.length} sub="agents avec mandats suivis" isDark={isDark} hue={accent} />
                </div>

                <div className="mt-4 space-y-2.5">
                  {activeUsers.slice(0, 6).map(u => {
                    const name = `${u.first_name || u.firstName || ''} ${u.last_name || u.lastName || ''}`.trim()
                    const role = String(u.role || 'agent')
                    return (
                      <div key={String(u.id)} className="flex items-center gap-2.5">
                        <span
                          className="orb-icon flex h-8 w-8 items-center justify-center rounded-xl text-[10px] font-extrabold"
                          style={{ ['--orb-a' as string]: role === 'agent' ? STAGE_HUES.sky.a : STAGE_HUES.violet.a, ['--orb-b' as string]: role === 'agent' ? STAGE_HUES.sky.b : STAGE_HUES.violet.b }}
                        >
                          {initialsOf(name || 'A')}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block truncate text-[12px] font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            {name || '—'}
                          </span>
                          <span className={`text-[10px] font-semibold uppercase tracking-[1px] ${isDark ? 'text-slate-500' : 'text-teal-900/40'}`}>
                            {role}
                          </span>
                        </span>
                        <StageBadge variant={role === 'admin' || role === 'gerant' ? 'violet' : 'neutral'}>
                          {role === 'admin' || role === 'gerant' ? 'Gérance' : 'Agent'}
                        </StageBadge>
                      </div>
                    )
                  })}
                  {activeUsers.length === 0 && (
                    <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}>Aucun compte actif.</p>
                  )}
                </div>

                <div className={`mt-4 rounded-xl border p-3 ${isDark ? 'border-white/[0.06] bg-white/[0.03]' : 'border-slate-200/70 bg-white/60'}`}>
                  <p className={`text-[8.5px] font-bold uppercase tracking-[1.2px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Répartition des rôles</p>
                  <div className="mt-2 space-y-2">
                    {[
                      { label: 'Agents', value: activeUsers.filter(u => String(u.role) === 'agent').length, hue: STAGE_HUES.sky },
                      { label: 'Gérance', value: activeUsers.filter(u => String(u.role) !== 'agent').length, hue: STAGE_HUES.violet },
                    ].map(r => (
                      <div key={r.label}>
                        <div className="flex items-center justify-between text-[10px] font-semibold">
                          <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{r.label}</span>
                          <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>{r.value}</span>
                        </div>
                        <div className="mt-1">
                          <ShimmerProgress
                            pct={activeUsers.length > 0 ? Math.round((r.value / activeUsers.length) * 100) : 0}
                            colorFrom={r.hue.a}
                            colorTo={r.hue.b}
                            glow={r.hue.glow}
                            height={4}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-auto pt-4">
                  <StageLinkRow label="Gérer les comptes" onClick={() => navigate('./users')} />
                </div>
              </div>
            </StagePanel>
          </div>
        </motion.div>
      )}

      {tab === 'performance' && (
        <motion.div
          key="performance"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-4"
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <AdminStatCard
              icon={Target}
              label="CA moyen / mandat"
              value={caMoyen}
              unit="MAD"
              detail={`${mandatsWindow} mandats sur ${period} mois`}
              hue={accent}
              spark={trendSeries.map(m => m.ca)}
              facts={[
                { label: 'CA fenêtre', value: `${formatMADCompact(caWindow)} MAD` },
                { label: 'Meilleur mois', value: bestMonth.label },
              ]}
              action={<StageBadge variant={accentBadge(isDark)}>Panier</StageBadge>}
              delay={0}
            />
            <AdminStatCard
              icon={Zap}
              label="Taux de conversion"
              value={tauxConversion}
              suffix="%"
              detail="prospects → clients"
              hue={STAGE_HUES.fuchsia}
              spark={funnelData.map(f => f.value)}
              facts={[
                { label: 'Prospects', value: prospects.length },
                { label: 'Convertis', value: funnelData.find(f => f.label === 'Converti')?.value ?? 0 },
              ]}
              action={<StageBadge variant="violet">Vivier</StageBadge>}
              delay={0.06}
            />
            <AdminStatCard
              icon={TrendingUp}
              label="Croissance MoM"
              value={caMom}
              suffix="%"
              detail="dernier mois vs précédent"
              trend={`${caMom >= 0 ? '+' : ''}${caMom}%`}
              trendUp={caMom >= 0}
              hue={STAGE_HUES.emerald}
              spark={byMonth.map(m => m.ca)}
              facts={[
                { label: 'Dernier mois', value: `${formatMADCompact(byMonth[byMonth.length - 1]?.ca ?? 0)} MAD` },
                { label: 'Mois préc.', value: `${formatMADCompact(byMonth[byMonth.length - 2]?.ca ?? 0)} MAD` },
              ]}
              delay={0.12}
            />
            <AdminStatCard
              icon={Briefcase}
              label="Mandats signés"
              value={mandatsWindow}
              unit={`sur ${period} mois`}
              detail={`${mandatsSignes} signés au total`}
              hue={STAGE_HUES.sky}
              spark={trendSeries.map(m => m.mandats)}
              facts={[
                { label: 'Signés', value: mandatsSignes },
                { label: 'En pipeline', value: mandatsPipeline },
              ]}
              action={<StageBadge variant="neutral">{transactions.length} dossiers</StageBadge>}
              delay={0.18}
            />
          </div>

          <div className="grid items-stretch gap-4 lg:grid-cols-2">
            <StagePanel
              title="Objectif annuel"
              icon={Target}
              hue={accent}
              outerClassName="h-full"
              className="h-full min-h-[456px]"
              badge={<StageBadge variant={goalReached ? 'ok' : 'neutral'}>{goalReached ? 'Franchi' : `${objectiveBarPct}% réalisé`}</StageBadge>}
            >
              <div className="flex h-full min-h-0 flex-col justify-between gap-3">
                <div className={`relative overflow-hidden rounded-2xl border p-4 ${isDark ? 'border-white/[0.07] bg-white/[0.035]' : 'border-slate-200/70 bg-white/60'}`}>
                  <div className="flex items-center gap-4">
                    <div
                      className="relative flex h-[104px] w-[104px] shrink-0 items-center justify-center rounded-full"
                      style={{
                        background: `conic-gradient(${accent.a} ${objectiveBarPct * 3.6}deg, ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.07)'} ${objectiveBarPct * 3.6}deg)`,
                        boxShadow: `0 16px 36px -22px ${accent.glow}`,
                      }}
                    >
                      <div className={`absolute inset-[8px] rounded-full ${isDark ? 'bg-[#0B1020]' : 'bg-white'}`} />
                      <div className="relative z-10 text-center">
                        <p className={`text-[24px] font-black leading-none tracking-[-1px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          <AnimatedNumber value={objectivePct} suffix="%" />
                        </p>
                        <p className={`mt-1 text-[8px] font-bold uppercase tracking-[1.2px] ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}>
                          réalisé
                        </p>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[9px] font-extrabold uppercase tracking-[1.6px] ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}>
                        CA cumulé {new Date().getFullYear()}
                      </p>
                      <p className={`mt-1 truncate text-[27px] font-black leading-tight tracking-[-1px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {formatMADCompact(caYear)} <span className="text-[13px] font-bold">MAD</span>
                      </p>
                      <p className={`text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-teal-900/55'}`}>
                        sur {formatMADFull(annualTarget)}
                      </p>
                      <div className="mt-3">
                        <ShimmerProgress pct={objectiveBarPct} colorFrom={accent.a} colorTo={accent.b} glow={accent.glow} height={9} intense />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    { label: 'Reste', value: goalReached ? '0' : formatMADCompact(remainingToGoal), unit: 'MAD', hue: accent },
                    { label: 'Rythme annualisé', value: formatMADCompact(annualizedRunRate), unit: 'MAD', hue: STAGE_HUES.sky },
                    { label: 'Temps écoulé', value: `${expectedProgress}%`, unit: 'de l\'année', hue: STAGE_HUES.violet },
                  ].map(t => (
                    <div key={t.label} className={`min-w-0 rounded-xl border px-2.5 py-2 ${isDark ? 'border-white/[0.06] bg-white/[0.03]' : 'border-slate-200/70 bg-white/70'}`}>
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: t.hue.line, boxShadow: `0 0 6px ${t.hue.glow}` }} />
                        <p className={`truncate text-[8px] font-bold uppercase tracking-[0.9px] ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}>{t.label}</p>
                      </div>
                      <p className={`mt-1 truncate text-[14px] font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.value}</p>
                      <p className={`text-[8.5px] font-semibold ${isDark ? 'text-slate-500' : 'text-teal-900/40'}`}>{t.unit}</p>
                    </div>
                  ))}
                </div>

                <div className={`rounded-xl border p-3 ${isDark ? 'border-white/[0.06] bg-white/[0.03]' : 'border-slate-200/70 bg-white/60'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-[1.1px] ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}>
                      {goalReached ? 'Objectif franchi' : 'Reste à conquérir'}
                    </span>
                    <span className={`text-[12px] font-extrabold ${goalReached ? (isDark ? 'text-emerald-300' : 'text-emerald-700') : isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {goalReached ? `+${formatMADCompact(caYear - annualTarget)} MAD` : formatMADFull(remainingToGoal)}
                    </span>
                  </div>
                  <p className={`mt-1.5 text-[10.5px] leading-relaxed ${isDark ? 'text-slate-500' : 'text-teal-900/50'}`}>
                    {goalReached
                      ? 'Cap dépassé — la dynamique du portefeuille sécurise la fin de l\'exercice.'
                      : `Rythme annualisé ${formatMADCompact(annualizedRunRate)} MAD, soit ${paceGap >= 0 ? '+' : ''}${formatMADCompact(paceGap)} MAD vs la cible.`}
                  </p>
                </div>
              </div>
            </StagePanel>

            <StagePanel
              title="Contrats par statut"
              icon={Layers}
              hue={STAGE_HUES.emerald}
              outerClassName="h-full"
              className="h-full min-h-[456px]"
              badge={<StageBadge variant="neutral">{contractsTotal} contrats</StageBadge>}
            >
              <div className="flex h-full min-h-0 flex-col">
                <Donut3D
                  slices={contractSlices}
                  centerValue={contractsTotal.toLocaleString('fr-FR')}
                  centerLabel="Contrats"
                  isDark={isDark}
                  height={238}
                  emptyLabel="Aucun contrat catalogué"
                />
                <div className="mt-3 grid grid-cols-2 gap-1.5">
                  {contractLegend.map(c => {
                    const pct = contractsTotal > 0 ? Math.round((c.value / contractsTotal) * 100) : 0
                    return (
                      <div
                        key={c.key}
                        className={`flex min-w-0 items-center gap-2 rounded-lg border px-2 py-1.5 ${isDark ? 'border-white/[0.06] bg-white/[0.035]' : 'border-slate-200/60 bg-white/55'}`}
                      >
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c.hue.line, boxShadow: `0 0 8px ${c.hue.glow}` }} />
                        <span className={`min-w-0 flex-1 truncate text-[10.5px] font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{c.name}</span>
                        <span className={`text-[11px] font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{c.value}</span>
                        <span className={`text-[9px] font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{pct}%</span>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-auto pt-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-[1.1px] ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}>
                      Finalisés ou payés
                    </span>
                    <span className={`text-[12px] font-extrabold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {contractsClosed} / {contractsTotal} · {contractCompletionPct}%
                    </span>
                  </div>
                  <div className="mt-2">
                    <ShimmerProgress
                      pct={contractCompletionPct}
                      colorFrom={STAGE_HUES.emerald.a}
                      colorTo={STAGE_HUES.emerald.b}
                      glow={STAGE_HUES.emerald.glow}
                      height={6}
                    />
                  </div>
                </div>
              </div>
            </StagePanel>
          </div>

          <StagePanel
            title="Évolution ventes & CA"
            icon={TrendingUp}
            hue={accent}
            className="h-full min-h-[452px]"
            badge={<StageBadge variant="neutral">2 séries normalisées</StageBadge>}
          >
            <div className="flex h-full min-h-0 flex-col">
              <div className="flex flex-wrap items-center gap-2">
                <StageBadge variant="neutral">CA fenêtre · {(caWindow / 1_000_000).toFixed(2)} M MAD</StageBadge>
                <StageBadge variant="ok">{mandatsWindow} mandats conclus</StageBadge>
                <StageBadge variant="violet">Panier moyen · {formatMADFull(caMoyen)}</StageBadge>
                <StageBadge variant={caMom >= 0 ? 'ok' : 'danger'}>
                  {caMom >= 0 ? '▲' : '▼'} {Math.abs(caMom)}% MoM
                </StageBadge>
              </div>
              <TrendCurve3D
                data={trendSeries}
                series={trendSeriesConfig}
                isDark={isDark}
                height={320}
                className="mt-3 w-full shrink-0"
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <span className={`text-[10px] font-semibold ${isDark ? 'text-slate-500' : 'text-teal-900/50'}`}>
                  Meilleur mois · <b className={isDark ? 'text-slate-300' : 'text-slate-700'}>{bestMonth.label}</b> à {formatMADFull(bestMonth.ca)}
                </span>
                <span className={`text-[10px] font-semibold ${isDark ? 'text-slate-500' : 'text-teal-900/50'}`}>
                  Échelles indépendantes · CA en K MAD
                </span>
              </div>
            </div>
          </StagePanel>
        </motion.div>
      )}

      {tab === 'pipeline' && (
        <motion.div
          key="pipeline"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-4"
        >
          <div className="grid items-stretch gap-4 lg:grid-cols-3">
            <StagePanel
              title="Le pipeline vivant — orbites 3D"
              icon={Layers}
              hue={accent}
              badge={<StageBadge variant={accentBadge(isDark)}>système temps réel</StageBadge>}
              outerClassName="h-full lg:col-span-2"
              className="h-full min-h-[566px]"
            >
              <div className="flex h-full min-h-0 flex-col">
                <div className="flex flex-wrap gap-2">
                  <StageBadge variant="neutral">{etapeTotal} mandats en orbite</StageBadge>
                  <StageBadge variant="ok">{etapeSlices.length} étapes actives</StageBadge>
                  <StageBadge variant="violet">{transactions.length} dossiers historiques</StageBadge>
                </div>
                <PipelineOrbit3D
                  stages={orbitStages}
                  isDark={isDark}
                  height={390}
                  className="mt-3 w-full shrink-0"
                />
                <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  {etapeSlices.map(s => {
                    const pct = etapeTotal > 0 ? Math.round((s.value / etapeTotal) * 100) : 0
                    return (
                      <div
                        key={s.name}
                        className={`flex min-w-0 items-center gap-2 rounded-lg border px-2 py-1.5 ${isDark ? 'border-white/[0.06] bg-white/[0.035]' : 'border-slate-200/60 bg-white/55'}`}
                      >
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.hue.line, boxShadow: `0 0 8px ${s.hue.glow}` }} />
                        <span className={`min-w-0 flex-1 truncate text-[10.5px] font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{s.name}</span>
                        <span className={`text-[11px] font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{s.value}</span>
                        <span className={`text-[9px] font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{pct}%</span>
                      </div>
                    )
                  })}
                  {etapeSlices.length === 0 && (
                    <p className={`col-span-full text-[11px] ${isDark ? 'text-slate-500' : 'text-teal-900/50'}`}>
                      Le système s'animera dès le premier mandat actif.
                    </p>
                  )}
                </div>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
                  <span className={`text-[10px] font-semibold ${isDark ? 'text-slate-500' : 'text-teal-900/50'}`}>
                    Cœur du système · <b className={isDark ? 'text-slate-300' : 'text-slate-700'}>{etapeTotal} mandats suivis</b>
                  </span>
                  <span className={`text-[10px] font-semibold ${isDark ? 'text-slate-500' : 'text-teal-900/50'}`}>
                    Une orbite par étape · satellites proportionnels au volume
                  </span>
                </div>
              </div>
            </StagePanel>

            <StagePanel
              title="Entonnoir prospects"
              icon={UserPlus}
              hue={STAGE_HUES.fuchsia}
              outerClassName="h-full"
              className="h-full min-h-[566px]"
              badge={<StageBadge variant="neutral">{prospects.length} prospects</StageBadge>}
            >
              <div className="flex h-full min-h-0 flex-col">
                <div className="flex flex-wrap gap-2">
                  <StageBadge variant="violet">{prospectsVivants} vivants</StageBadge>
                  <StageBadge variant="ok">{tauxConversion}% convertis</StageBadge>
                </div>
                <Bars3D
                  data={funnelBars}
                  hue={STAGE_HUES.fuchsia}
                  isDark={isDark}
                  height={352}
                  className="mt-3 w-full shrink-0"
                  valueFormatter={formatCompactValue}
                  hint=""
                />
                <div className="mt-3 grid grid-cols-2 gap-1.5">
                  {funnelData.map(f => {
                    const pct = prospects.length > 0 ? Math.round((f.value / prospects.length) * 100) : 0
                    const hue = FUNNEL_HUES[f.label as Prospect['status']]
                    return (
                      <div
                        key={f.label}
                        className={`flex min-w-0 items-center gap-2 rounded-lg border px-2 py-1.5 ${isDark ? 'border-white/[0.06] bg-white/[0.035]' : 'border-slate-200/60 bg-white/55'}`}
                      >
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: hue.line, boxShadow: `0 0 8px ${hue.glow}` }} />
                        <span className={`min-w-0 flex-1 truncate text-[10.5px] font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{f.label}</span>
                        <span className={`text-[11px] font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{f.value}</span>
                        <span className={`text-[9px] font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{pct}%</span>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-auto pt-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-[1.1px] ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}>
                      Conversion globale
                    </span>
                    <span className={`text-[12px] font-extrabold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {funnelData.find(f => f.label === 'Converti')?.value ?? 0} / {prospects.length} · {tauxConversion}%
                    </span>
                  </div>
                  <div className="mt-2">
                    <ShimmerProgress
                      pct={tauxConversion}
                      colorFrom={STAGE_HUES.fuchsia.a}
                      colorTo={STAGE_HUES.fuchsia.b}
                      glow={STAGE_HUES.fuchsia.glow}
                      height={6}
                    />
                  </div>
                </div>
              </div>
            </StagePanel>
          </div>

          <StagePanel
            title="Flux récent — derniers mandats"
            icon={Clock}
            hue={STAGE_HUES.sky}
            badge={<StageBadge variant="neutral">{recentTransactions.length} dossiers</StageBadge>}
          >
            <div className="grid gap-2 sm:grid-cols-2">
              {recentTransactions.map(t => {
                const d = mountDate(t)
                const hue = ETAPE_HUES[t.etape] || SLATE_HUE
                return (
                  <div
                    key={t.id}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${isDark ? 'border-white/[0.06] bg-white/[0.03]' : 'border-slate-200/70 bg-white/70'}`}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: `linear-gradient(145deg, ${hue.a}, ${hue.b})`, boxShadow: `0 8px 18px -10px ${hue.glow}` }}
                    >
                      <Briefcase size={13} color="#fff" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-[13px] font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{t.clientName}</span>
                      <span className={`block truncate text-[10px] font-semibold ${isDark ? 'text-slate-500' : 'text-teal-900/40'}`}>
                        {TRANSACTION_ETAPE_LABELS[t.etape]} · {t.agentName || '—'} · {d ? d.toLocaleDateString('fr-FR') : '—'}
                      </span>
                    </span>
                    <span className={`shrink-0 text-right font-mono text-[12px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {formatMADCompact(parseAmount(t.montant))} MAD
                    </span>
                  </div>
                )
              })}
            </div>
            {recentTransactions.length === 0 && (
              <div className={`flex min-h-[120px] flex-col items-center justify-center rounded-xl border border-dashed px-4 text-center ${isDark ? 'border-white/10' : 'border-slate-300/70'}`}>
                <p className={`text-[12px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Aucun mandat récent</p>
                <p className={`mt-1 text-[10.5px] ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}>Le flux s'alimentera dès la première transaction.</p>
              </div>
            )}
            <StageLinkRow label="Ouvrir le registre des mandats" onClick={() => navigate('./registre')} />
          </StagePanel>
        </motion.div>
      )}

      {tab === 'activite' && (
        <motion.div
          key="activite"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="grid items-stretch gap-4 lg:grid-cols-3"
        >
          <StagePanel
            title="Prochains rendez-vous"
            icon={Calendar}
            hue={STAGE_HUES.emerald}
            badge={<StageBadge variant="neutral">{upcoming.length} à venir</StageBadge>}
            outerClassName="h-full lg:col-span-2"
            className="h-full min-h-[560px]"
          >
            <div className="flex h-full min-h-0 flex-col">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Aujourd'hui", value: todayEvents, hue: STAGE_HUES.emerald },
                  { label: '7 prochains jours', value: weekEvents, hue: accent },
                  { label: 'Agents mobilisés', value: agendaAgents, hue: STAGE_HUES.violet },
                ].map(s => (
                  <div key={s.label} className={`min-w-0 rounded-xl border px-2.5 py-2 ${isDark ? 'border-white/[0.06] bg-white/[0.03]' : 'border-slate-200/70 bg-white/70'}`}>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: s.hue.line, boxShadow: `0 0 6px ${s.hue.glow}` }} />
                      <p className={`truncate text-[8px] font-bold uppercase tracking-[0.9px] ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}>{s.label}</p>
                    </div>
                    <p className={`mt-1 text-[19px] font-black leading-none tracking-[-0.5px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      <AnimatedNumber value={s.value} />
                    </p>
                  </div>
                ))}
              </div>

              {nextEvent && (
                <div
                  className={`relative mt-3 overflow-hidden rounded-2xl border p-3.5 ${isDark ? 'border-white/[0.08]' : 'border-slate-200/80'}`}
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${accent.glow}, transparent 72%)`,
                    boxShadow: `0 18px 36px -30px ${accent.glow}`,
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full opacity-70"
                    style={{ background: `radial-gradient(circle, ${accent.glow}, transparent 70%)` }}
                  />
                  <div className="relative flex items-center gap-3">
                    <span
                      className="orb-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                      style={{ ['--orb-a' as string]: accent.a, ['--orb-b' as string]: accent.b, ['--orb-glow' as string]: accent.glow }}
                    >
                      <Calendar size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[8.5px] font-extrabold uppercase tracking-[1.5px] ${isDark ? 'text-slate-400' : 'text-teal-900/50'}`}>
                        Prochain rendez-vous
                      </p>
                      <p className={`mt-0.5 truncate text-[14px] font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{nextEvent.title}</p>
                      <p className={`truncate text-[10.5px] font-semibold ${isDark ? 'text-slate-400' : 'text-teal-900/55'}`}>
                        {nextEventRelative} · {nextEvent.start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        {nextEvent.agentNames?.length ? ` · ${nextEvent.agentNames.join(', ')}` : ''}
                      </p>
                    </div>
                    <StageBadge variant={accentBadge(isDark)}>À venir</StageBadge>
                  </div>
                </div>
              )}

              <div className="mt-3 flex-1">
                <AgendaCalendar3D
                  events={upcoming.map(e => ({ id: e.id, title: e.title, type: e.type, start: e.start, end: e.end, agentNames: e.agentNames }))}
                  isDark={isDark}
                  height={420}
                  className="h-full"
                  hue={accent}
                />
              </div>

              <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
                <StageLinkRow label="Voir tout l'agenda" onClick={() => navigate('./calendar')} />
                <span className={`text-[10px] font-semibold ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}>
                  {plural(events.length, 'événement')} {events.length > 1 ? 'synchronisés' : 'synchronisé'}
                </span>
              </div>
            </div>
          </StagePanel>

          <StagePanel
            title="Accès rapides"
            icon={Zap}
            hue={STAGE_HUES.amber}
            outerClassName="h-full"
            className="h-full min-h-[560px]"
            badge={<StageBadge variant="neutral">{plural(events.length, 'événement')}</StageBadge>}
          >
            <div className="flex h-full min-h-0 flex-col">
              <div
                className={`relative overflow-hidden rounded-2xl border p-3.5 ${isDark ? 'border-white/[0.07] bg-white/[0.035]' : 'border-slate-200/70 bg-white/60'}`}
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full opacity-70"
                  style={{ background: `radial-gradient(circle, ${STAGE_HUES.amber.glow}, transparent 70%)` }}
                />
                <div className="relative flex items-start gap-3">
                  <span
                    className="orb-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ ['--orb-a' as string]: STAGE_HUES.amber.a, ['--orb-b' as string]: STAGE_HUES.amber.b, ['--orb-glow' as string]: STAGE_HUES.amber.glow }}
                  >
                    <Zap size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[8.5px] font-extrabold uppercase tracking-[1.5px] ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}>
                      Prochaine échéance
                    </p>
                    <p className={`mt-0.5 truncate text-[12.5px] font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {nextEvent ? nextEvent.title : 'Aucun rendez-vous'}
                    </p>
                    <p className={`truncate text-[10px] font-semibold ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}>
                      {nextEvent
                        ? `${nextEventRelative} · ${nextEvent.start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
                        : 'Planifiez votre prochain rendez-vous.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                {[
                  { label: 'Agenda total', value: events.length, hue: STAGE_HUES.emerald },
                  { label: 'Agents mobilisés', value: agendaAgents, hue: STAGE_HUES.violet },
                ].map(s => (
                  <div key={s.label} className={`min-w-0 rounded-xl border px-2.5 py-2 ${isDark ? 'border-white/[0.06] bg-white/[0.03]' : 'border-slate-200/70 bg-white/70'}`}>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: s.hue.line, boxShadow: `0 0 6px ${s.hue.glow}` }} />
                      <p className={`truncate text-[8px] font-bold uppercase tracking-[0.9px] ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}>{s.label}</p>
                    </div>
                    <p className={`mt-1 text-[17px] font-black leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      <AnimatedNumber value={s.value} />
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-2">
                {quickLinks.map(({ icon: Icon, label, hint, to, hue }) => (
                  <button
                    key={to}
                    type="button"
                    onClick={() => navigate(to)}
                    className={`group flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all duration-200 ${
                      isDark
                        ? 'border-white/[0.06] bg-white/[0.025] hover:border-white/[0.14] hover:bg-white/[0.055]'
                        : 'border-slate-200/70 bg-white/60 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <span
                      className="orb-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                      style={{ ['--orb-a' as string]: hue.a, ['--orb-b' as string]: hue.b, ['--orb-glow' as string]: hue.glow }}
                    >
                      <Icon size={13} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-[12px] font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{label}</span>
                      <span className={`block truncate text-[9.5px] font-semibold ${isDark ? 'text-slate-500' : 'text-teal-900/40'}`}>{hint}</span>
                    </span>
                    <ArrowRight
                      size={13}
                      className={`shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
                    />
                  </button>
                ))}
              </div>

              <div className="mt-auto pt-4">
                <div className={`rounded-xl border p-3 ${isDark ? 'border-white/[0.06] bg-white/[0.03]' : 'border-slate-200/70 bg-white/60'}`}>
                  <p className={`text-[8.5px] font-bold uppercase tracking-[1.2px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    Dernière synchronisation
                  </p>
                  <p className={`mt-1 text-[15px] font-black tracking-[-0.3px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {updatedAt ? updatedAt.toLocaleTimeString('fr-FR') : '—'}
                  </p>
                  <p className={`mt-0.5 text-[9.5px] font-semibold leading-relaxed ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}>
                    {plural(transactions.length, 'mandat')} · {plural(prospects.length, 'prospect')} · {plural(events.length, 'événement')}
                  </p>
                </div>
                <StageLinkRow label="Ouvrir l'agenda" onClick={() => navigate('./calendar')} />
              </div>
            </div>
          </StagePanel>
        </motion.div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Local tiles                                                          */
/* ------------------------------------------------------------------ */

function StatTile({ label, value, sub, isDark, hue }: { label: string; value: number; sub: string; isDark: boolean; hue: StageHue }) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3.5 ${
        isDark ? 'border-white/[0.07] bg-white/[0.04]' : 'border-slate-200/70 bg-white/75'
      }`}
    >
      <p className={`text-[10px] font-extrabold uppercase tracking-[1.6px] ${isDark ? 'text-slate-500' : 'text-teal-900/40'}`}>
        {label}
      </p>
      <p className={`mt-1 text-2xl font-extrabold tracking-[-0.5px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
        <AnimatedNumber value={value} />
      </p>
      <div className="mt-2 flex items-center gap-2">
        <span className="h-1 w-1 rounded-full" style={{ background: hue.line, boxShadow: `0 0 6px ${hue.glow}` }} />
        <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-teal-900/50'}`}>{sub}</span>
      </div>
    </div>
  )
}
