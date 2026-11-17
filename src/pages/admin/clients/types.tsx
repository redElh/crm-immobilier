import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Search, Home, Briefcase, Sun, TrendingUp, Tag, CheckCircle,
  ChevronRight, ArrowLeft, Plus, RefreshCw, Activity, Layers, PieChart,
  Clock, AlertTriangle, Shield, Key, Calendar, Zap, UserCheck, UserX,
  MapPin, UserPlus, X
} from 'react-feather'
import { cn } from '../../../lib/utils'
import {
  StagePanel, StageBadge, StageButton, OrbIcon, AnimatedNumber,
  TiltCard, STAGE_HUES, SLATE_HUE,
  useStageTheme, useStageAccent, type StageHue,
} from '../../../components/dashboard/Stage'
import { AdminStatCard } from '../../../components/dashboard/AdminStatCard'
import { Bars3D } from '../../../components/dashboard/three/Bars3D'
import { Donut3D } from '../../../components/dashboard/three/Donut3D'
import { fetchClients, createClient } from '../../../services/clientService'
import { api } from '../../../services/api'
import { useMyPermissions, permissionAllowed } from '../../../hooks/useMyPermissions'
import { useToast } from '../../../components/ui/Toast'
import { useStageChrome } from '../../../components/modules/calendar/useStageChrome'
import { ClientTypeChooserAdmin } from '../../../components/modules/clients/ClientTypeChooserAdmin'
import { ClientAssignModal } from '../../../components/modules/clients/ClientAssignModal'
import { BuyerFormModal } from '../../../components/modules/clients/BuyerFormModal'
import { SellerFormModal } from '../../../components/modules/clients/SellerFormModal'
import { BailleurFormModal } from '../../../components/modules/clients/BailleurFormModal'
import { LocataireFormModal } from '../../../components/modules/clients/LocataireFormModal'
import { VoyageurFormModal } from '../../../components/modules/clients/VoyageurFormModal'
import { ClientFormModal } from '../../../components/modules/clients/ClientFormModal'
import type { Client } from '../../../types/client'

type IconComponent = React.ComponentType<{ size?: number | string; className?: string }>

interface ClientTypeMeta {
  type: string
  title: string
  tagline: string
  icon: IconComponent
  hue: StageHue
}

interface ClientTypeRow {
  meta: ClientTypeMeta
  rows: any[]
  count: number
  actifs: number
  negoc: number
  nouveaux: number
  mandats: number
}

const CLIENT_TYPE_META: ClientTypeMeta[] = [
  { type: 'acheteur', title: 'Acheteurs', tagline: 'Recherche & acquisition', icon: Search, hue: STAGE_HUES.sky },
  { type: 'vendeur', title: 'Vendeurs', tagline: 'Mise en vente', icon: Home, hue: STAGE_HUES.violet },
  { type: 'bailleur', title: 'Bailleurs', tagline: 'Mise en location', icon: Briefcase, hue: STAGE_HUES.emerald },
  { type: 'locataire', title: 'Locataires', tagline: 'Location longue durée', icon: Users, hue: STAGE_HUES.amber },
  { type: 'voyageur', title: 'Voyageurs', tagline: 'Séjour & vacances', icon: Sun, hue: STAGE_HUES.fuchsia },
]

const MONTH_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

const PERIODS: { id: 3 | 6 | 12; label: string }[] = [
  { id: 3, label: '3 mois' },
  { id: 6, label: '6 mois' },
  { id: 12, label: '12 mois' },
]

function parseDate(value?: string | null): Date | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function monthBuckets(items: any[], months: number, field: 'createdAt' | 'updatedAt') {
  const now = new Date()
  return Array.from({ length: months }, (_, i) => {
    const offset = months - 1 - i
    const start = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    const end = new Date(now.getFullYear(), now.getMonth() - offset + 1, 1)
    const value = items.filter(c => {
      const d = parseDate(c[field])
      return d !== null && d >= start && d < end
    }).length
    return { label: MONTH_SHORT[start.getMonth()], value }
  })
}

const ADDITIONS_IN_MONTHS = (items: any[], months: number, back = 0) => {
  const now = new Date()
  const end = new Date(now.getFullYear(), now.getMonth() - back + 1, 1)
  const start = new Date(now.getFullYear(), now.getMonth() - back - months + 1, 1)
  return items.filter(c => {
    const d = parseDate(c.createdAt)
    return d !== null && d >= start && d < end
  }).length
}

function daysUntil(iso?: string | null): number | null {
  const d = parseDate(iso)
  if (!d) return null
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startOfTarget = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  return Math.round((startOfTarget - startOfToday) / 86_400_000)
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

function pct(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0
}

const isActif = (c: any) =>
  c.status === 'Actif' || c.statutMetier === 'En mandat' || c.statutMetier === 'En recherche'
const isNegoc = (c: any) =>
  c.statutMetier === 'En negociation' || c.status === 'En négociation'
const isQualif = (c: any) =>
  c.statutMetier === 'En qualification'
const isInactif = (c: any) =>
  c.status === 'Inactif' || c.statutMetier === 'Inactif'

export default function AdminClientTypesPage() {
  const navigate = useNavigate()
  const { adminId } = useParams<{ adminId: string }>()
  const userId = adminId || 'unknown'
  const theme = useStageTheme()
  const accent = useStageAccent()
  const isDark = theme === 'dark'
  const { dark } = useStageChrome()
  const perms = useMyPermissions()
  const canWrite = permissionAllowed(perms, 'clients-ecriture')
  const permsLoaded = perms !== null
  const { toast } = useToast()

  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<3 | 6 | 12>(6)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [isGerant, setIsGerant] = useState(false)
  const [chooserOpen, setChooserOpen] = useState(false)
  const [pendingType, setPendingType] = useState<string | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<any | null>(null)

  useEffect(() => {
    api.get<any>('/auth/me').then(u => { setCurrentUser(u); if (u) setIsGerant(u.role === 'gerant'); }).catch(() => {});
    api.get<any[]>('/admin/users').then(setUsers).catch(() => {});
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchClients()
      .then((rows: any) => setClients(Array.isArray(rows) ? rows : []))
      .catch(() => setClients([]))
      .finally(() => setLoading(false))
  }, [])

  const handleCreateClient = async (newClient: Omit<Client, 'id'>) => {
    const typeName = newClient.type || 'Client'
    try {
      const payload = { ...newClient, agentId: selectedAgent || (currentUser ? String(currentUser.id) : '') }
      await api.post('/clients', payload)
      fetchClients().then((rows: any) => setClients(Array.isArray(rows) ? rows : [])).catch(() => {})
      toast('success', `${typeName} ajouté avec succès`)
    } catch (err) {
      console.error('Failed to create client:', err)
      toast('error', `Erreur lors de la création du ${typeName.toLowerCase()}`)
    }
    setIsModalOpen(false); setPendingType(null); setEditingClient(null); setSelectedAgent('');
  };

  const refresh = () => {
    setLoading(true)
    fetchClients()
      .then((rows: any) => setClients(Array.isArray(rows) ? rows : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const goToType = (type: string) => navigate(`/admin/${adminId}/clients/type/${type}`)

  const assignmentInfo = useMemo(() => {
    if (!selectedAgent) return undefined
    const person = users.find((u: any) => String(u.id) === String(selectedAgent))
    if (!person) return undefined
    const name = `${person.first_name || ''} ${person.last_name || ''}`.trim() || person.email || ''
    return { assignedType: person.role === 'agent' ? ('agent' as const) : ('admin' as const), assignedName: name }
  }, [selectedAgent, users])

  const stats = useMemo(() => {
    const rows = clients
    const total = rows.length
    const actifs = rows.filter(isActif).length
    const negoc = rows.filter(isNegoc).length
    const qualif = rows.filter(isQualif).length
    const inactifs = rows.filter(isInactif).length
    const prospects = rows.filter(c => isQualif(c) || isNegoc(c)).length
    const currentMonth = new Date().toISOString().slice(0, 7)
    const nouveauxCeMois = rows.filter(c => c.createdAt?.startsWith(currentMonth)).length

    const buckets = monthBuckets(rows, period, 'createdAt')
    const addedWindow = ADDITIONS_IN_MONTHS(rows, period, 0)
    const addedPrevWindow = ADDITIONS_IN_MONTHS(rows, period, period)
    const addsMoM = addedPrevWindow === 0
      ? (addedWindow > 0 ? 100 : 0)
      : Math.round(((addedWindow - addedPrevWindow) / addedPrevWindow) * 100)

    const byTypeRows: ClientTypeRow[] = CLIENT_TYPE_META.map(meta => {
      const tRows = rows.filter(c => c.type === meta.title.slice(0, -1))
      return {
        meta,
        rows: tRows,
        count: tRows.length,
        actifs: tRows.filter(isActif).length,
        negoc: tRows.filter(isNegoc).length,
        nouveaux: tRows.filter(c => c.createdAt?.startsWith(currentMonth)).length,
        mandats: tRows.filter(c => (c.mandateType || c.mandateStatus || '').toString().trim().length > 0).length,
      }
    })

    const secteurCounts = new Map<string, number>()
    rows.forEach(c => {
      const s = (c.secteur || '').trim()
      if (!s) return
      secteurCounts.set(s, (secteurCounts.get(s) || 0) + 1)
    })
    const secteurs = Array.from(secteurCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
    const topSecteurs = secteurs.slice(0, 6)

    const expiring = rows
      .filter(c => {
        const d = daysUntil(c.mandateEndDate)
        return d !== null && d <= 45
      })
      .map(c => ({ client: c, days: daysUntil(c.mandateEndDate) as number }))
      .sort((a, b) => a.days - b.days)
      .slice(0, 5)

    const recent = [...rows]
      .sort((a, b) => (parseDate(b.updatedAt)?.getTime() || 0) - (parseDate(a.updatedAt)?.getTime() || 0))
      .slice(0, 6)

    const statusGroups = [
      { label: 'Actifs', count: actifs, hue: STAGE_HUES.emerald },
      { label: 'En négociation', count: negoc, hue: STAGE_HUES.sky },
      { label: 'En qualification', count: qualif, hue: STAGE_HUES.amber },
      { label: 'Inactifs', count: inactifs, hue: SLATE_HUE },
    ]

    const pipelineStages = statusGroups.map(g => ({ label: g.label, count: g.count, hue: g.hue }))

    return {
      total, actifs, negoc, qualif, inactifs, prospects, nouveauxCeMois,
      buckets, addedWindow, addsMoM, byTypeRows, topSecteurs, expiring, recent, statusGroups, pipelineStages,
    }
  }, [clients, period])

  const gradientTitle = isDark
    ? 'bg-clip-text text-transparent bg-gradient-to-r from-[#F43F5E] via-[#FB7185] to-[#8B7CFF]'
    : 'bg-clip-text text-transparent bg-gradient-to-r from-[#EA580C] via-[#F97316] to-[#FBBF24]'

  const typeShare = (count: number) => pct(count, stats.total)

  const donutSlices = stats.byTypeRows.map(r => ({ name: r.meta.title, value: r.count, hue: r.meta.hue }))

  return (
    <>
    <div className="space-y-5 pb-24">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className={cn('flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[3px]', isDark ? 'text-slate-400' : 'text-teal-900/50')}>
              <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Square Immo · Clientèle · Temps réel
            </p>
            <h1 className={cn('mt-2 text-4xl font-black tracking-[-2px] sm:text-5xl', gradientTitle)}>
              CLIENTÈLE 360
            </h1>
            <p className={cn('mt-1.5 text-sm', isDark ? 'text-slate-400' : 'text-teal-900/60')}>
              Analyse complète du fichier clients — volumes, statuts, types et activité.
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
                      layoutId="clientele-period-pill"
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
              Ajouter un client
            </StageButton>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <AdminStatCard
          icon={Users}
          label="Fichier clients"
          value={stats.total}
          unit="clients"
          detail={`${stats.actifs} actifs · ${stats.negoc} en négo`}
          trend={`${stats.addsMoM >= 0 ? '+' : ''}${stats.addsMoM}%`}
          trendUp={stats.addsMoM >= 0}
          hue={accent}
          spark={stats.buckets.map(b => b.value)}
          facts={[
            { label: 'Actifs', value: stats.actifs },
            { label: 'Inactifs', value: stats.inactifs },
          ]}
          delay={0}
        />
        <AdminStatCard
          icon={UserCheck}
          label="Actifs"
          value={stats.actifs}
          unit="clients"
          detail={`${stats.prospects} prospects`}
          hue={STAGE_HUES.emerald}
          spark={stats.buckets.map(b => b.value)}
          facts={[
            { label: 'En négo', value: stats.negoc },
            { label: 'Qualifiés', value: stats.qualif },
          ]}
          delay={0.06}
        />
        <AdminStatCard
          icon={TrendingUp}
          label="En négociation"
          value={stats.negoc}
          unit="clients"
          detail={`${stats.qualif} en qualification`}
          hue={STAGE_HUES.sky}
          spark={stats.buckets.map(b => b.value)}
          facts={[
            { label: 'Qualifiés', value: stats.qualif },
            { label: 'Inactifs', value: stats.inactifs },
          ]}
          delay={0.12}
        />
        <AdminStatCard
          icon={Tag}
          label="Prospects"
          value={stats.prospects}
          unit="clients"
          detail={`${stats.nouveauxCeMois} nouveaux ce mois`}
          hue={STAGE_HUES.amber}
          spark={stats.buckets.map(b => b.value)}
          facts={[
            { label: 'Nouveaux', value: stats.nouveauxCeMois },
            { label: 'Actifs', value: stats.actifs },
          ]}
          delay={0.18}
        />
        <AdminStatCard
          icon={CheckCircle}
          label="Nouveaux ce mois"
          value={stats.nouveauxCeMois}
          unit="clients"
          detail={`${stats.total} au total`}
          hue={STAGE_HUES.fuchsia}
          spark={stats.buckets.map(b => b.value)}
          facts={[
            { label: 'Ajouts', value: stats.addedWindow },
            { label: 'Mois préc.', value: stats.addedWindow - 0 },
          ]}
          delay={0.24}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <StagePanel
          title="Répartition par type"
          icon={PieChart}
          hue={STAGE_HUES.violet}
          outerClassName="lg:col-span-2"
          className="min-h-[380px]"
          badge={<StageBadge variant="neutral">{stats.total} clients</StageBadge>}
        >
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2">
              <StageBadge variant="neutral">{stats.byTypeRows.length} types</StageBadge>
              <StageBadge variant="ok">{stats.actifs} actifs</StageBadge>
              <StageBadge variant="violet">{stats.prospects} prospects</StageBadge>
            </div>
            <Donut3D
              slices={donutSlices}
              centerValue={String(stats.total)}
              centerLabel="clients"
              isDark={isDark}
              height={300}
              className="mt-2 w-full"
            />
            <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
              {stats.byTypeRows.map(({ meta, count }) => {
                const share = typeShare(count)
                return (
                  <button
                    key={meta.type}
                    type="button"
                    onClick={() => goToType(meta.type)}
                    className={cn(
                      'group flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-left transition-all',
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

        <StagePanel
          title="Pulsation du fichier"
          icon={Activity}
          hue={accent}
          className="min-h-[380px]"
          badge={<StageBadge variant="neutral">{stats.total} clients</StageBadge>}
        >
          <div className="flex h-full flex-col">
            <div className="flex flex-wrap items-center gap-2">
              <StageBadge variant="neutral">{stats.actifs} actifs</StageBadge>
              <StageBadge variant="ok">{stats.negoc} en négo</StageBadge>
              <StageBadge variant="violet">{stats.prospects} prospects</StageBadge>
            </div>
            <Bars3D
              data={stats.statusGroups.map(g => ({ label: g.label, value: g.count, hue: g.hue, meta: `${g.count} client${g.count > 1 ? 's' : ''}` }))}
              hue={accent}
              isDark={isDark}
              className="mt-2 w-full flex-1 min-h-[220px]"
              showValues
              showLabels={false}
              scale={1.5}
              hint="glisser pour orbiter · cliquer pour épingler"
            />
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <span className={cn('text-[10px] font-semibold', isDark ? 'text-slate-500' : 'text-slate-400')}>
                Fichier actuel · <b className={isDark ? 'text-slate-300' : 'text-slate-700'}>{stats.total} clients</b>
              </span>
              <span className={cn('hidden text-[10px] font-semibold sm:block', isDark ? 'text-slate-500' : 'text-slate-400')}>
                {stats.actifs} actifs · {stats.negoc} en négo · {stats.inactifs} inactifs
              </span>
            </div>
          </div>
        </StagePanel>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <OrbIcon icon={Layers} hue={accent} size={30} radius={10} />
            <div>
              <h2 className={cn('text-[13px] font-extrabold uppercase tracking-[0.18em]', isDark ? 'text-white' : 'text-slate-900')}>Types de clients</h2>
              <p className={cn('text-[10px]', isDark ? 'text-slate-500' : 'text-slate-400')}>Cliquez sur un type pour ouvrir le registre complet</p>
            </div>
          </div>
          <StageBadge variant="neutral">{CLIENT_TYPE_META.length} segments</StageBadge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {stats.byTypeRows.map((row, index) => {
            const { meta, count, actifs, negoc, nouveaux } = row
            const Icon = meta.icon
            const share = typeShare(count)
            const max = Math.max(count, 1)
            return (
              <TiltCard
                key={meta.type}
                onClick={() => goToType(meta.type)}
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
                    {meta.tagline}
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
                    <p className={cn('mt-1 text-[7.5px] font-extrabold uppercase tracking-[0.18em]', isDark ? 'text-slate-500' : 'text-slate-400')}>clients</p>
                  </div>
                </div>

                <div className={cn(
                  'relative mt-3 grid grid-cols-3 divide-x rounded-2xl border py-2',
                  isDark ? 'divide-white/[0.06] border-white/[0.06] bg-white/[0.02]' : 'divide-slate-200/60 border-slate-200/70 bg-white/50',
                )}>
                  {[
                    { label: 'Actifs', value: actifs },
                    { label: 'En négo', value: negoc },
                    { label: 'Nouveaux', value: nouveaux },
                  ].map(s => (
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
                      Part du fichier
                    </span>
                    <span className={cn('text-[10.5px] font-extrabold tabular-nums', isDark ? 'text-slate-200' : 'text-slate-700')}>
                      {share}%
                    </span>
                  </div>
                  <div className={cn('mt-1.5 h-2 overflow-hidden rounded-full', isDark ? 'bg-white/[0.07]' : 'bg-slate-900/[0.07]')}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundImage: `linear-gradient(90deg, ${meta.hue.a}, ${meta.hue.b})`, boxShadow: `0 0 10px ${meta.hue.glow}` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(share, share > 0 ? 3 : 0)}%` }}
                      transition={{ duration: 0.95, delay: 0.15 + index * 0.07, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </div>

                <div className="relative mt-auto flex items-end justify-between gap-2 border-t pt-3" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)' }}>
                  <div className="min-w-0">
                    <div className="flex h-10 items-end gap-[3px]" aria-hidden="true">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <motion.span
                          key={i}
                          className="w-[5px] rounded-full"
                          style={{ height: `${Math.max(12, (i + 1) / 6 * 100)}%`, background: meta.hue.line, opacity: 0.3 + (i / 6) * 0.7, transformOrigin: 'bottom' }}
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{ duration: 0.6, delay: 0.22 + i * 0.055 + index * 0.05 }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <p className={cn('text-right text-[8px] font-semibold leading-tight', isDark ? 'text-slate-500' : 'text-slate-400')}>
                      {count} client{count > 1 ? 's' : ''}
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
          title="Statuts du fichier"
          icon={Layers}
          hue={STAGE_HUES.amber}
          badge={<StageBadge variant="neutral">{stats.actifs} actifs</StageBadge>}
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
              Parts calculées sur {stats.total} client{stats.total > 1 ? 's' : ''} au fichier.
            </p>
          </div>
        </StagePanel>

        <StagePanel
          title="Secteurs clés"
          icon={MapPin}
          hue={STAGE_HUES.sky}
          badge={<StageBadge variant="neutral">{stats.topSecteurs.length} secteur{stats.topSecteurs.length > 1 ? 's' : ''}</StageBadge>}
        >
          {stats.topSecteurs.length === 0 ? (
            <EmptyState icon={MapPin} title="Secteurs non renseignés" detail="Renseignez le secteur des clients pour activer cette analyse." isDark={isDark} />
          ) : (
            <div className="space-y-2">
              {stats.topSecteurs.map((s, i) => {
                const share = pct(s.count, Math.max(stats.total, 1))
                const maxCount = stats.topSecteurs[0]?.count || 1
                return (
                  <div
                    key={s.name}
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
                          <p className={cn('truncate text-[11.5px] font-bold', isDark ? 'text-slate-100' : 'text-slate-800')}>{s.name}</p>
                          <p className={cn('shrink-0 text-[10px] font-extrabold tabular-nums', isDark ? 'text-slate-300' : 'text-slate-700')}>
                            {s.count} <span className={cn('text-[8px] font-semibold', isDark ? 'text-slate-500' : 'text-slate-400')}>· {share}%</span>
                          </p>
                        </div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className={cn('h-1.5 flex-1 overflow-hidden rounded-full', isDark ? 'bg-white/[0.06]' : 'bg-slate-900/[0.06]')}>
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundImage: `linear-gradient(90deg, ${STAGE_HUES.sky.a}, ${STAGE_HUES.sky.b})`, boxShadow: `0 0 10px ${STAGE_HUES.sky.glow}` }}
                              initial={{ width: 0 }}
                              animate={{ width: `${(s.count / maxCount) * 100}%` }}
                              transition={{ duration: 0.85, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
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
              : <StageBadge variant="ok">Fichier sain</StageBadge>
          }
        >
          {stats.expiring.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="Aucun mandat n'expire"
              detail="Tous les mandats actifs dépassent 45 jours d'échéance."
              isDark={isDark}
              tone="ok"
            />
          ) : (
            <div className="space-y-2">
              {stats.expiring.map(({ client, days }) => {
                const urgency = days < 0 ? STAGE_HUES.fuchsia : days <= 14 ? STAGE_HUES.amber : STAGE_HUES.sky
                const label = days < 0 ? `Expiré · ${Math.abs(days)} j` : days === 0 ? "Aujourd'hui" : `J-${days}`
                return (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => navigate(`/admin/${adminId}/clients/${client.id}`)}
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
                        {client.name || 'Client sans nom'}
                      </span>
                      <span className={cn('mt-0.5 block truncate text-[9px] font-semibold', isDark ? 'text-slate-500' : 'text-slate-400')}>
                        {client.type || '—'} · {client.secteur || 'Secteur non renseigné'} · fin {client.mandateEndDate ? new Date(client.mandateEndDate).toLocaleDateString('fr-FR') : '—'}
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
              icon={Users}
              title="Aucun client pour l'instant"
              detail="Ajoutez votre premier client — il apparaîtra ici avec ses derniers mouvements."
              isDark={isDark}
              action={
                <StageButton size="sm" icon={<Plus size={12} />} onClick={() => setChooserOpen(true)}>
                  Ajouter un client
                </StageButton>
              }
            />
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {stats.recent.map((c, i) => {
                const meta = CLIENT_TYPE_META.find(t => t.type === (c.type || '').toLowerCase()) || CLIENT_TYPE_META[0]
                const Icon = meta.icon
                const statusLabel = c.status || c.statutMetier || '—'
                return (
                  <motion.button
                    key={c.id}
                    type="button"
                    onClick={() => navigate(`/admin/${adminId}/clients/${c.id}`)}
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
                        {c.name || 'Client sans nom'}
                      </span>
                      <span className={cn('mt-0.5 block truncate text-[9.5px] font-medium', isDark ? 'text-slate-500' : 'text-slate-400')}>
                        {c.type || '—'} · {c.secteur || c.area || 'Localisation non renseignée'} · {c.status || c.statutMetier || '—'}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span className={cn('text-[9px] font-semibold tabular-nums', isDark ? 'text-slate-500' : 'text-slate-400')}>
                        {relTime(c.updatedAt)}
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
          title="Santé du fichier"
          icon={Shield}
          hue={STAGE_HUES.violet}
          outerClassName="lg:col-span-2"
          badge={<StageBadge variant="neutral">{stats.prospects} prospects</StageBadge>}
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
              Parts calculées sur {stats.total} client{stats.total > 1 ? 's' : ''} au fichier.
            </p>
          </div>
        </StagePanel>
      </div>
    </div>

    {canWrite && (
      <>
        <AnimatePresence>
          {chooserOpen && (
            <ClientTypeChooserAdmin
              stats={Object.fromEntries(stats.byTypeRows.map(r => [r.meta.type, { total: r.count, actifs: r.actifs, enNegociation: r.negoc }]))}
              onClose={() => setChooserOpen(false)}
              onSelect={(type) => {
                setPendingType(type);
                setChooserOpen(false);
                setShowAssignModal(true);
              }}
            />
          )}
        </AnimatePresence>
        <ClientAssignModal
          open={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          users={users}
          currentUser={currentUser}
          onAssign={(agentId) => {
            setShowAssignModal(false);
            setSelectedAgent(agentId);
            setIsModalOpen(true);
          }}
        />
        <AnimatePresence>
          {isModalOpen && (() => {
            const handleClose = () => { setIsModalOpen(false); setPendingType(null); setEditingClient(null); setSelectedAgent(''); };
            const modalType = pendingType || '';
            const clientTypeLabel = ({ acheteur: 'Acheteur', vendeur: 'Vendeur', bailleur: 'Bailleur', locataire: 'Locataire', voyageur: 'Voyageur' } as Record<string, 'Acheteur' | 'Vendeur' | 'Bailleur' | 'Locataire' | 'Voyageur'>)[modalType] || 'Acheteur';
            const commonProps = { onClose: handleClose, onSubmit: handleCreateClient, key: 'new' };
            if (clientTypeLabel === 'Acheteur') return <BuyerFormModal {...commonProps} assignmentInfo={assignmentInfo} userId={currentUser ? String(currentUser.id) : undefined} isGerant={isGerant} />;
            if (clientTypeLabel === 'Vendeur') return <SellerFormModal {...commonProps} assignmentInfo={assignmentInfo} userId={currentUser ? String(currentUser.id) : undefined} isGerant={isGerant} />;
            if (clientTypeLabel === 'Bailleur') return <BailleurFormModal {...commonProps} assignmentInfo={assignmentInfo} userId={currentUser ? String(currentUser.id) : undefined} isGerant={isGerant} />;
            if (clientTypeLabel === 'Locataire') return <LocataireFormModal {...commonProps} assignmentInfo={assignmentInfo} userId={currentUser ? String(currentUser.id) : undefined} isGerant={isGerant} />;
            if (clientTypeLabel === 'Voyageur') return <VoyageurFormModal {...commonProps} assignmentInfo={assignmentInfo} userId={currentUser ? String(currentUser.id) : undefined} isGerant={isGerant} />;
            return <ClientFormModal onClose={handleClose} onSubmit={handleCreateClient} clientType={clientTypeLabel} isGerant={isGerant} />;
          })()}
        </AnimatePresence>
      </>
    )}
    </>
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
