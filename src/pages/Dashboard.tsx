import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users, Home, DollarSign, AlertTriangle, Clock, Edit3, Target, FileText,
  BarChart2, TrendingUp, Filter, Calendar, Globe, ChevronRight, UserPlus,
  ArrowUpRight, ArrowDownRight, Eye, Phone, Award, Grid
} from 'react-feather'
import {
  Stage, StageTabs, StageTabSwap, StageStatCard, StagePanel, StageBadge,
  StageButton, StageLinkRow, StageAreaChart, StageBarChart, StageDonut3D,
  ShimmerProgress, OrbIcon, TiltCard, STAGE_HUES, SLATE_HUE,
  useStageTheme, type StageHue,
} from '../components/dashboard/Stage'
import { AnimatedNumber } from '../components/dashboard'

type Period = 'week' | 'month' | 'quarter' | 'year'

const tabs = [
  { id: 'overview', label: "Vue d'ensemble", icon: Grid },
  { id: 'performance', label: 'Performance', icon: TrendingUp },
  { id: 'pipeline', label: 'Pipeline', icon: Filter },
  { id: 'agenda', label: 'Agenda', icon: Calendar },
  { id: 'activite', label: 'Activité', icon: Globe },
]

const periods: { key: Period; label: string }[] = [
  { key: 'week', label: 'Cette semaine' },
  { key: 'month', label: 'Ce mois' },
  { key: 'quarter', label: 'Ce trimestre' },
  { key: 'year', label: 'Cette année' },
]

const subtitles: Record<string, string> = {
  overview: 'Vue globale de votre activité',
  performance: 'Analyse de votre performance',
  pipeline: 'Suivi de votre cycle de vente',
  agenda: 'Vos prochains rendez-vous',
  activite: 'Suivi de votre activité et de vos clients',
}

interface AlertItem {
  icon: React.ComponentType<{ size?: number | string; className?: string }>
  text: string
  variant: 'error' | 'warning'
}

const alertData: AlertItem[] = [
  { icon: Target, text: '7 Croisements à faire', variant: 'error' },
  { icon: FileText, text: '3 Demandes incomplètes', variant: 'error' },
  { icon: Home, text: '1 Produit en attente de correction', variant: 'warning' },
  { icon: Clock, text: '14 Mandats expirés', variant: 'error' },
  { icon: AlertTriangle, text: '5 Mandats expirent bientôt', variant: 'warning' },
  { icon: Edit3, text: '2 Signatures de documents attendues', variant: 'error' },
]

const activityData = [
  { label: 'L', appels: 6, visites: 2, signatures: 1 },
  { label: 'M', appels: 8, visites: 1, signatures: 1 },
  { label: 'M', appels: 7, visites: 3, signatures: 2 },
  { label: 'J', appels: 10, visites: 1, signatures: 0 },
  { label: 'V', appels: 8, visites: 3, signatures: 2 },
  { label: 'S', appels: 4, visites: 2, signatures: 1 },
  { label: 'D', appels: 2, visites: 0, signatures: 1 },
]

const salesData = [
  { label: 'Jan', ventes: 4 },
  { label: 'Fév', ventes: 6 },
  { label: 'Mar', ventes: 8 },
  { label: 'Avr', ventes: 10 },
  { label: 'Mai', ventes: 9 },
  { label: 'Juin', ventes: 12 },
]

const indigoHue: StageHue = { a: '#818CF8', b: '#4338CA', glow: 'rgba(129,140,248,0.5)', line: '#818CF8' }
const orangeHue: StageHue = { a: '#FB923C', b: '#C2410C', glow: 'rgba(251,146,60,0.45)', line: '#FB923C' }

const funnelStages = [
  { label: 'Prospects', value: 47, trend: '+12%', hue: STAGE_HUES.violet },
  { label: 'En qualification', value: 32, trend: '+8%', hue: indigoHue },
  { label: 'En recherche', value: 18, trend: '+15%', hue: STAGE_HUES.sky },
  { label: 'En négociation', value: 8, trend: '+33%', hue: STAGE_HUES.amber },
  { label: 'En compromis', value: 5, trend: '+66%', hue: orangeHue },
  { label: 'Vendus', value: 12, trend: '+20%', hue: STAGE_HUES.emerald },
]

const statusRepartition = [
  { label: 'En recherche', pct: 38, hue: STAGE_HUES.sky },
  { label: 'En qualification', pct: 25, hue: indigoHue },
  { label: 'En négociation', pct: 17, hue: STAGE_HUES.amber },
  { label: 'En compromis', pct: 12, hue: orangeHue },
  { label: 'Vendus', pct: 8, hue: STAGE_HUES.emerald },
]

const avatarPalette = [STAGE_HUES.violet, STAGE_HUES.sky, STAGE_HUES.emerald, STAGE_HUES.amber, STAGE_HUES.fuchsia]

/* ---------------------------------------------------------------------
   Theme token helper — consumed by tab components (inside Stage provider)
--------------------------------------------------------------------- */

function useT() {
  const dark = useStageTheme() === 'dark'
  return {
    dark,
    heading: dark ? 'text-white' : 'text-slate-900',
    body: dark ? 'text-slate-200' : 'text-slate-700',
    muted: dark ? 'text-slate-400' : 'text-slate-500',
    faint: dark ? 'text-slate-500' : 'text-slate-400',
    accent: dark ? 'text-indigo-300' : 'text-teal-700',
    up: dark
      ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
      : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700',
    down: dark
      ? 'border-rose-400/30 bg-rose-400/10 text-rose-300'
      : 'border-rose-500/25 bg-rose-500/10 text-rose-600',
    tile: dark
      ? 'border border-white/10 bg-white/[0.04]'
      : 'border border-teal-900/10 bg-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_30px_-18px_rgba(13,148,136,0.35)]',
    hoverRow: dark ? 'hover:bg-white/[0.04]' : 'hover:bg-teal-900/[0.05]',
    ring: dark ? 'border-[#0B1022]' : 'border-white',
    divider: dark ? 'bg-white/15' : 'bg-teal-900/15',
    chevron: dark ? 'text-indigo-400/50' : 'text-teal-700/40',
  }
}

function AvatarOrb({ initials, index }: { initials: string; index: number }) {
  const hue = avatarPalette[index % avatarPalette.length]
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
      style={{
        backgroundImage: `linear-gradient(135deg, ${hue.a}, ${hue.b})`,
        boxShadow: `inset 0 1px 1px rgba(255,255,255,0.5), inset 0 -4px 8px rgba(0,0,0,0.3), 0 6px 16px -4px ${hue.glow}`,
      }}
    >
      {initials}
    </span>
  )
}

const negociationClients = [
  { initials: 'HE', name: 'Hassan El Fassi', property: 'Villa Argana', price: '2 500 000 MAD' },
  { initials: 'PM', name: 'Pierre Martin', property: 'Villa Marrakech', price: '4 500 000 MAD' },
  { initials: 'AB', name: 'Ahmed Benali', property: 'Appartement Casa', price: '850 000 MAD' },
]

interface Appointment {
  time: string
  type: string
  variant: 'violet' | 'ok' | 'warn' | 'neutral'
  client: string
  context: string
}

const todayAppointments: Appointment[] = [
  { time: '14:30', type: 'Visite', variant: 'violet', client: 'Sophie Martin', context: 'Villa Marrakech' },
  { time: '10:00', type: 'Appel', variant: 'ok', client: 'Ahmed Benali', context: 'Proposition commerciale' },
  { time: '16:00', type: 'Signature', variant: 'warn', client: 'Mme Dupont', context: 'Mandat de vente' },
  { time: '11:30', type: 'Visite', variant: 'violet', client: 'Leila Benbrahim', context: 'Terrain Rabat' },
  { time: '09:00', type: 'Réunion', variant: 'neutral', client: 'Toute l\'agence', context: 'Réunion hebdomadaire' },
]

const weekAppointments = [
  { day: 'Demain', time: '10:00', type: 'Visite', client: 'Client X' },
  { day: 'Mercredi', time: '14:00', type: 'Appel', client: 'Client Y' },
  { day: 'Jeudi', time: '09:30', type: 'Signature', client: 'Client Z' },
]

const connections = [
  { initials: 'SM', name: 'Sophie Martin', property: 'Villa Marrakech', time: 'il y a 10 min', live: true, dotColor: '#34D399' },
  { initials: 'PD', name: 'Pierre Dubois', property: 'Appartement Casa', time: 'il y a 45 min', live: true, dotColor: '#34D399' },
  { initials: 'LB', name: 'Leila Benbrahim', property: 'Terrain Rabat', time: 'il y a 2h', live: true, dotColor: '#FBBF24' },
  { initials: 'YA', name: 'Youssef Amrani', property: 'Bureau Tanger', time: 'il y a 1j', live: false, dotColor: '#FB7185' },
]

const leads = [
  { initials: 'SM', name: 'Sophie Martin', property: 'Villa Marrakech', time: 'il y a 15 min' },
  { initials: 'AB', name: 'Ahmed Benali', property: 'Appartement Casa', time: 'il y a 2h' },
  { initials: 'LB', name: 'Leila Benbrahim', property: 'Terrain Rabat', time: 'il y a 5h' },
  { initials: 'YA', name: 'Youssef Amrani', property: 'Bureau Tanger', time: 'il y a 1j' },
]

const recentDocuments = [
  { type: 'Mandat de vente', client: 'Villa Argana', status: 'Signé', variant: 'ok' as const, time: 'il y a 2h' },
  { type: 'DPE', client: 'Appartement Centre', status: 'Téléchargé', variant: 'neutral' as const, time: 'il y a 5h' },
  { type: 'Contrat location', client: 'Résidence Oasis', status: 'En attente', variant: 'warn' as const, time: 'il y a 1j' },
  { type: 'Compromis vente', client: 'Villa Marrakech', status: 'Signé', variant: 'ok' as const, time: 'il y a 2j' },
]

const rankMedals: Record<number, StageHue> = {
  1: { a: '#FDE68A', b: '#B45309', glow: 'rgba(251,191,36,0.55)', line: '#FCD34D' },
  2: { a: '#E2E8F0', b: '#475569', glow: 'rgba(203,213,225,0.45)', line: '#CBD5E1' },
  3: { a: '#FDBA74', b: '#9A3412', glow: 'rgba(251,146,60,0.5)', line: '#FDBA74' },
}

const rankings: { rank: number; label: string; value: number; suffix?: string; agents: number; hue: StageHue }[] = [
  { rank: 1, label: 'Ventes', value: 12, agents: 8, hue: STAGE_HUES.emerald },
  { rank: 2, label: 'Appels', value: 45, agents: 8, hue: STAGE_HUES.sky },
  { rank: 3, label: 'Visites', value: 12, agents: 8, hue: STAGE_HUES.violet },
  { rank: 1, label: 'Honoraires', value: 342, suffix: 'K', agents: 8, hue: STAGE_HUES.amber },
]

const extranetStats = [
  { label: 'Connexions cette semaine', value: 124, trend: '+18%', hue: STAGE_HUES.violet },
  { label: 'Clients actifs', value: 12, trend: '+12%', hue: STAGE_HUES.emerald },
  { label: 'Documents consultés', value: 45, trend: '+8%', hue: STAGE_HUES.amber },
]

function TabIntro({ title, subtitle }: { title: string; subtitle: string }) {
  const t = useT()
  return (
    <div>
      <h2 className={`text-xl font-bold tracking-[-0.3px] ${t.heading}`}>{title}</h2>
      <p className={`mt-0.5 text-sm ${t.muted}`}>{subtitle}</p>
    </div>
  )
}

/* --------------------------------------------------------------------- */

function OverviewTab() {
  const t = useT()
  return (
    <>
      <TabIntro title="Vue d'ensemble" subtitle={subtitles.overview} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StageStatCard icon={Users} label="Prospects" value={47} trend="+12%" hue={STAGE_HUES.violet} spark={[3, 5, 4, 7, 6, 8]} delay={0} />
        <StageStatCard icon={Users} label="Contacts" value={156} trend="+8%" hue={STAGE_HUES.sky} spark={[12, 15, 14, 18, 17, 20]} delay={0.05} />
        <StageStatCard icon={Home} label="Biens" value={89} trend="-3%" trendUp={false} hue={STAGE_HUES.amber} spark={[9, 8, 9, 7, 8, 6]} delay={0.1} />
        <StageStatCard icon={DollarSign} label="Ventes" value={12} trend="+20%" hue={STAGE_HUES.emerald} spark={[1, 2, 1, 3, 2, 4]} delay={0.15} />
        <StageStatCard icon={DollarSign} label="Honoraires" value={342} suffix="K" trend="+15%" hue={STAGE_HUES.fuchsia} spark={[20, 25, 22, 28, 30, 34]} delay={0.2} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <StagePanel title="Actions requises" icon={AlertTriangle} hue={STAGE_HUES.fuchsia} badge={<StageBadge variant="danger">6 en cours</StageBadge>}>
          <div className="space-y-1">
            {alertData.map((alert, i) => {
              const AlertIcon = alert.icon
              return (
                <div key={i} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${t.hoverRow}`}>
                  <OrbIcon
                    icon={AlertIcon}
                    hue={alert.variant === 'error'
                      ? { a: '#FB7185', b: '#BE123C', glow: 'rgba(251,113,133,0.5)', line: '#FB7185' }
                      : STAGE_HUES.amber}
                    size={30}
                    radius={9}
                  />
                  <span className={`flex-1 text-sm ${t.body}`}>{alert.text}</span>
                  <StageBadge variant={alert.variant === 'error' ? 'danger' : 'warn'}>
                    {alert.variant === 'error' ? 'Haute' : 'Moyenne'}
                  </StageBadge>
                </div>
              )
            })}
          </div>
          <StageLinkRow label="Voir toutes les actions" />
        </StagePanel>

        <StagePanel title="Activité récente" icon={BarChart2} badge={<StageBadge variant="violet">Cette semaine</StageBadge>}>
          <StageBarChart
            data={activityData}
            series={[
              { dataKey: 'appels', name: 'Appels', hue: STAGE_HUES.violet },
              { dataKey: 'visites', name: 'Visites', hue: STAGE_HUES.emerald },
              { dataKey: 'signatures', name: 'Signatures', hue: STAGE_HUES.amber },
            ]}
            height={180}
          />
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { value: '45', label: 'appels', hue: STAGE_HUES.violet },
              { value: '12', label: 'visites', hue: STAGE_HUES.emerald },
              { value: '8', label: 'documents signés', hue: STAGE_HUES.amber },
            ].map(s => (
              <div
                key={s.label}
                className={`rounded-xl p-3 text-center ${t.tile}`}
              >
                <p className="text-lg font-extrabold tabular-nums" style={{ color: s.hue.line, textShadow: t.dark ? `0 0 18px ${s.hue.glow}` : 'none' }}>
                  {s.value}
                </p>
                <p className={`text-[11px] ${t.muted}`}>{s.label}</p>
              </div>
            ))}
          </div>
        </StagePanel>
      </div>
    </>
  )
}

/* --------------------------------------------------------------------- */

function PerformanceTab() {
  const t = useT()
  return (
    <>
      <TabIntro title="Performance" subtitle={subtitles.performance} />

      <StagePanel title="Performance financière" icon={DollarSign} hue={STAGE_HUES.emerald} badge={<StageBadge variant="ok">Ce mois</StageBadge>}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left — CA + objective breakdown */}
          <div className="flex flex-col">
            <p className={`text-[11px] font-semibold uppercase tracking-[1.6px] ${t.muted}`}>Chiffre d'affaires — ce mois</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-2">
              <AnimatedNumber
                value={342500}
                suffix=" MAD"
                className={t.dark
                  ? 'bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent'
                  : 'bg-gradient-to-r from-teal-900 via-teal-600 to-emerald-500 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent'}
              />
              <span className={`inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-xs font-bold ${t.up}`}>
                <ArrowUpRight size={13} />
                +15%
              </span>
            </div>
            <div className={`mt-1 text-sm ${t.muted}`}>
              Mois dernier : 298 000 MAD
            </div>

            {/* Objective progress */}
            <div className={`mt-5 rounded-2xl p-4 ${t.tile}`}>
              <div className="mb-2.5 flex items-center justify-between text-sm">
                <span className={t.muted}>Objectif mensuel</span>
                <span className={`font-extrabold tabular-nums ${t.heading}`}>85%</span>
              </div>
              <ShimmerProgress pct={85} colorFrom={STAGE_HUES.violet.a} colorTo={STAGE_HUES.violet.b} glow={STAGE_HUES.violet.glow} />
              <p className={`mt-2.5 text-xs ${t.faint}`}>
                Reste <span className={`font-bold ${t.accent}`}>57 500 MAD</span> pour atteindre les 400 000 MAD
              </p>
            </div>

            {/* Quick facts */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className={`rounded-2xl px-4 py-3 ${t.tile}`}>
                <p className={`text-[10px] font-semibold uppercase tracking-[1.4px] ${t.faint}`}>Ventes signées</p>
                <p className="mt-0.5 text-xl font-extrabold tabular-nums" style={{ color: STAGE_HUES.emerald.line }}>12</p>
              </div>
              <div className={`rounded-2xl px-4 py-3 ${t.tile}`}>
                <p className={`text-[10px] font-semibold uppercase tracking-[1.4px] ${t.faint}`}>Panier moyen</p>
                <p className="mt-0.5 text-xl font-extrabold tabular-nums" style={{ color: STAGE_HUES.sky.line }}>28 542 MAD</p>
              </div>
            </div>
          </div>

          {/* Right — 3D donut + legend */}
          <div className="flex flex-col items-center justify-center">
            <StageDonut3D
              slices={[
                { name: 'Atteint', value: 85, hue: STAGE_HUES.violet },
                { name: 'Restant', value: 15, hue: SLATE_HUE },
              ]}
              centerValue="85%"
              centerLabel="Objectif mensuel"
              size={270}
            />
            <div className={`mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs ${t.muted}`}>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STAGE_HUES.violet.line, boxShadow: `0 0 8px ${STAGE_HUES.violet.glow}` }} />
                Atteint · <b className={t.dark ? 'text-slate-200' : 'text-slate-800'}>342 500 MAD</b>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SLATE_HUE.line }} />
                Restant · <b className={t.dark ? 'text-slate-200' : 'text-slate-800'}>57 500 MAD</b>
              </span>
            </div>
          </div>
        </div>
      </StagePanel>

      <StagePanel title="Évolution des ventes" icon={TrendingUp} hue={STAGE_HUES.sky} badge={<StageBadge variant="ok">Tendance +15%</StageBadge>}>
        <StageAreaChart
          data={salesData}
          series={[{ dataKey: 'ventes', name: 'Ventes', hue: STAGE_HUES.violet }]}
          height={250}
        />
        <div className={`mt-3 flex items-center justify-center gap-2 text-sm ${t.muted}`}>
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-bold ${t.up}`}>
            <ArrowUpRight size={13} />
            +15%
          </span>
          par rapport au mois dernier
        </div>
      </StagePanel>

      <StagePanel title="Classement personnel" icon={Award} hue={STAGE_HUES.amber} badge={<StageBadge variant="violet">Ce mois</StageBadge>}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {rankings.map(rank => {
            const medal = rankMedals[rank.rank]
            return (
              <div
                key={rank.label}
                className={`rounded-2xl p-4 transition-all duration-300 ${t.tile} ${t.dark ? 'hover:border-white/20' : 'hover:border-teal-900/25'}`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-extrabold text-white"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${medal.a}, ${medal.b})`,
                      boxShadow: `inset 0 1px 1px rgba(255,255,255,0.6), 0 8px 18px -4px ${medal.glow}`,
                    }}
                  >
                    {rank.rank}
                  </span>
                  <StageBadge variant="neutral">{rank.rank === 1 ? '1er' : rank.rank === 2 ? '2ème' : '3ème'} / {rank.agents}</StageBadge>
                </div>
                <p className={`mt-3 text-[26px] font-extrabold tracking-tight ${t.heading}`}>
                  <AnimatedNumber value={rank.value} suffix={rank.suffix || ''} />
                </p>
                <p className={`text-[13px] ${t.muted}`}>{rank.label}</p>
                <div className="mt-3">
                  <ShimmerProgress pct={100} colorFrom={rank.hue.a} colorTo={rank.hue.b} glow={rank.hue.glow} height={6} />
                </div>
              </div>
            )
          })}
        </div>
      </StagePanel>
    </>
  )
}

/* --------------------------------------------------------------------- */

function PipelineTab() {
  const t = useT()
  return (
    <>
      <TabIntro title="Pipeline" subtitle={subtitles.pipeline} />

      <StagePanel title="Cycle de vente" icon={Filter} hue={indigoHue}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {funnelStages.map((stage, i) => (
            <div key={stage.label} className="relative">
              <TiltCard className="h-full p-4 text-center">
                <div
                  className="mx-auto mb-2.5 flex h-12 w-12 items-center justify-center rounded-full text-lg font-extrabold text-white"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${stage.hue.a}, ${stage.hue.b})`,
                    boxShadow: `inset 0 1px 1px rgba(255,255,255,0.55), inset 0 -5px 10px rgba(0,0,0,0.3), 0 10px 22px -6px ${stage.hue.glow}`,
                  }}
                >
                  {stage.value}
                </div>
                <p className={`text-[13px] font-semibold ${t.body}`}>{stage.label}</p>
                <span className={`mt-1 inline-flex items-center gap-0.5 text-xs font-bold ${t.dark ? 'text-emerald-300' : 'text-emerald-600'}`}>
                  <ArrowUpRight size={11} />
                  {stage.trend}
                </span>
              </TiltCard>
              {i < funnelStages.length - 1 && (
                <ChevronRight size={18} className={`absolute -right-2.5 top-1/2 z-10 hidden -translate-y-1/2 lg:block ${t.chevron}`} />
              )}
            </div>
          ))}
        </div>
        <div className={`mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl px-4 py-3.5 text-sm ${t.tile}`}>
          <div className="flex items-center gap-2">
            <span className={t.muted}>Taux de conversion :</span>
            <span className={`inline-flex items-center gap-0.5 font-extrabold ${t.dark ? 'text-emerald-300' : 'text-emerald-600'}`}>
              25,5%
              <ArrowUpRight size={12} />
              +5%
            </span>
          </div>
          <div className={`h-4 w-px ${t.divider}`} />
          <div className="flex items-center gap-2">
            <span className={t.muted}>Délai moyen vente :</span>
            <span className={`font-extrabold ${t.accent}`}>45 jours</span>
            <span className={`inline-flex items-center gap-0.5 font-semibold ${t.dark ? 'text-emerald-300' : 'text-emerald-600'}`}>
              <ArrowDownRight size={12} />
              -3 jours
            </span>
          </div>
        </div>
      </StagePanel>

      <StagePanel title="Répartition par statut" icon={BarChart2} hue={STAGE_HUES.sky}>
        <div className="space-y-4">
          {statusRepartition.map(item => (
            <div key={item.label}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className={`flex items-center gap-2 ${t.body}`}>
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: item.hue.line, boxShadow: t.dark ? `0 0 8px ${item.hue.glow}` : 'none' }}
                  />
                  {item.label}
                </span>
                <span className={`font-bold tabular-nums ${t.heading}`}>{item.pct}%</span>
              </div>
              <ShimmerProgress pct={item.pct} colorFrom={item.hue.a} colorTo={item.hue.b} glow={item.hue.glow} />
            </div>
          ))}
        </div>
      </StagePanel>

      <StagePanel title="Derniers clients en négociation" icon={UserPlus} hue={STAGE_HUES.fuchsia} badge={<StageBadge variant="warn">3 en cours</StageBadge>}>
        <div className="space-y-2">
          {negociationClients.map((client, i) => (
            <div key={client.name} className={`flex items-center gap-3 rounded-xl p-3 transition-colors ${t.hoverRow}`}>
              <AvatarOrb initials={client.initials} index={i} />
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-semibold ${t.heading}`}>{client.name}</p>
                <p className={`truncate text-xs ${t.muted}`}>{client.property}</p>
              </div>
              <span className={`hidden text-sm font-bold tabular-nums sm:block ${t.heading}`}>{client.price}</span>
              <StageButton variant="glass" icon={<Eye size={13} />}>Voir</StageButton>
            </div>
          ))}
        </div>
      </StagePanel>
    </>
  )
}

/* --------------------------------------------------------------------- */

function AgendaTab() {
  const t = useT()
  return (
    <>
      <TabIntro title="Agenda" subtitle={subtitles.agenda} />

      <StagePanel title="Aujourd'hui" icon={Calendar} hue={STAGE_HUES.emerald} badge={<StageBadge variant="violet">5 rendez-vous</StageBadge>}>
        <div className="space-y-1">
          {todayAppointments.map(apt => (
            <div key={apt.time + apt.client} className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${t.hoverRow}`}>
              <span className={`w-12 shrink-0 text-sm font-extrabold tabular-nums ${t.accent}`}>{apt.time}</span>
              <StageBadge variant={apt.variant}>{apt.type}</StageBadge>
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-semibold ${t.heading}`}>{apt.client}</p>
                <p className={`truncate text-xs ${t.muted}`}>{apt.context}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2 opacity-90 transition-opacity group-hover:opacity-100">
                <StageButton variant="glass" icon={<Eye size={13} />}>Voir</StageButton>
                <StageButton variant="primary" icon={<Phone size={13} />}>Contacter</StageButton>
              </div>
            </div>
          ))}
        </div>
        <StageLinkRow label="Voir tout le calendrier" />
      </StagePanel>

      <StagePanel title="Cette semaine" icon={Calendar} badge={<StageBadge variant="neutral">8 rendez-vous</StageBadge>}>
        <div className="space-y-2">
          {weekAppointments.map((apt, i) => (
            <div key={i} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${t.hoverRow}`}>
              <span className={`w-16 shrink-0 text-xs font-semibold uppercase tracking-wider ${t.faint}`}>{apt.day}</span>
              <span className={`w-12 shrink-0 text-sm font-extrabold tabular-nums ${t.accent}`}>{apt.time}</span>
              <StageBadge variant="neutral">{apt.type}</StageBadge>
              <p className={`flex-1 truncate text-sm font-semibold ${t.heading}`}>{apt.client}</p>
            </div>
          ))}
        </div>
        <StageLinkRow label="Voir le planning de la semaine" />
      </StagePanel>
    </>
  )
}

/* --------------------------------------------------------------------- */

function ActiviteTab() {
  const t = useT()
  return (
    <>
      <TabIntro title="Activité" subtitle={subtitles.activite} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {extranetStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
          >
            <TiltCard className="p-5 text-center">
              <p className="text-[32px] font-extrabold tracking-tight" style={{ color: stat.hue.line, textShadow: t.dark ? `0 0 26px ${stat.hue.glow}` : 'none' }}>
                <AnimatedNumber value={stat.value} />
              </p>
              <p className={`mt-1 text-[13px] ${t.muted}`}>{stat.label}</p>
              <span className={`mt-2 inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-xs font-bold ${t.up}`}>
                <ArrowUpRight size={11} />
                {stat.trend}
              </span>
            </TiltCard>
          </motion.div>
        ))}
      </div>

      <StagePanel title="Dernières connexions" icon={Globe} hue={STAGE_HUES.sky}>
        <div className="space-y-2">
          {connections.map((c, i) => (
            <div key={c.name} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${t.hoverRow}`}>
              <span className="relative shrink-0">
                <AvatarOrb initials={c.initials} index={i} />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 ${t.ring} ${c.live ? 'live-dot' : ''}`}
                  style={{ backgroundColor: c.dotColor, color: c.dotColor }}
                />
              </span>
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-semibold ${t.heading}`}>{c.name}</p>
                <p className={`truncate text-xs ${t.muted}`}>{c.property}</p>
              </div>
              <span className={`shrink-0 text-xs ${t.faint}`}>{c.time}</span>
            </div>
          ))}
        </div>
        <StageLinkRow label="Voir le détail extranet" />
      </StagePanel>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <StagePanel title="Derniers leads" icon={UserPlus} hue={STAGE_HUES.violet} badge={<StageBadge variant="violet">4 nouveaux</StageBadge>}>
          <div className="space-y-2">
            {leads.map((lead, i) => (
              <div key={lead.name} className={`flex items-center gap-3 rounded-xl p-3 transition-colors ${t.hoverRow}`}>
                <AvatarOrb initials={lead.initials} index={i + 1} />
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-semibold ${t.heading}`}>{lead.name}</p>
                  <p className={`truncate text-xs ${t.muted}`}>{lead.property}</p>
                </div>
                <span className={`shrink-0 text-xs ${t.faint}`}>{lead.time}</span>
              </div>
            ))}
          </div>
          <StageLinkRow label="Voir tous les prospects" />
        </StagePanel>

        <StagePanel title="Derniers documents" icon={FileText} hue={indigoHue} badge={<StageBadge variant="neutral">4 récents</StageBadge>}>
          <div className="space-y-2">
            {recentDocuments.map(doc => (
              <div key={doc.type + doc.client} className={`flex items-center gap-3 rounded-xl p-3 transition-colors ${t.hoverRow}`}>
                <OrbIcon icon={FileText} hue={indigoHue} size={34} radius={10} />
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-semibold ${t.heading}`}>{doc.type}</p>
                  <p className={`truncate text-xs ${t.muted}`}>{doc.client}</p>
                </div>
                <StageBadge variant={doc.variant}>{doc.status}</StageBadge>
                <span className={`shrink-0 text-xs ${t.faint}`}>{doc.time}</span>
              </div>
            ))}
          </div>
          <StageLinkRow label="Voir tous les documents" />
        </StagePanel>
      </div>
    </>
  )
}

/* --------------------------------------------------------------------- */

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [period, setPeriod] = useState<Period>('month')
  const theme = useStageTheme()
  const dark = theme === 'dark'

  const content: Record<string, React.ReactNode> = {
    overview: <OverviewTab />,
    performance: <PerformanceTab />,
    pipeline: <PipelineTab />,
    agenda: <AgendaTab />,
    activite: <ActiviteTab />,
  }

  return (
    <Stage theme={theme}>
      {/* Header */}
      <div className="relative flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-emerald-400 text-emerald-400" />
              <span className={`text-[10px] font-bold uppercase tracking-[3px] ${dark ? 'text-slate-500' : 'text-teal-900/50'}`}>
                Espace agent · Temps réel
              </span>
            </div>
            <h1 className={`bg-gradient-to-r bg-clip-text text-3xl font-extrabold tracking-[-1px] text-transparent ${
              dark
                ? 'from-white via-indigo-100 to-indigo-400'
                : 'from-teal-900 via-teal-600 to-emerald-500'
            }`}>
              DASHBOARD
            </h1>
            <p className={`mt-0.5 text-sm ${dark ? 'text-slate-400' : 'text-teal-900/70'}`}>
              Bienvenue, Karim ! Voici votre activité du jour
            </p>
          </div>

          <div className="self-start sm:self-auto">
            {/* Period switch */}
            <div className="stage-glass rounded-2xl p-1.5">
              <div className="flex items-center gap-1">
                {periods.map(p => {
                  const active = period === p.key
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setPeriod(p.key)}
                      className={`relative rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                        active
                          ? 'text-white'
                          : dark
                            ? 'text-slate-400 hover:text-slate-200'
                            : 'text-slate-500 hover:text-teal-900'
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="stage-period-pill"
                          className="absolute inset-0 rounded-xl border border-white/20"
                          style={{
                            backgroundImage: dark
                              ? 'linear-gradient(145deg, #8B7CFF 0%, #6C5ECF 60%, #5646C9 100%)'
                              : 'linear-gradient(145deg, #2DD4BF 0%, #14B8A6 60%, #0D9488 100%)',
                            boxShadow: dark
                              ? 'inset 0 1px 0 rgba(255,255,255,0.4), 0 8px 20px -6px rgba(124,92,255,0.6)'
                              : 'inset 0 1px 0 rgba(255,255,255,0.5), 0 8px 20px -8px rgba(13,148,136,0.55)',
                          }}
                          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        />
                      )}
                      <span className="relative z-10">{p.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <StageTabs tabs={tabs} activeId={activeTab} onChange={setActiveTab} />
      </div>

      <StageTabSwap tabId={activeTab}>
        {content[activeTab]}
      </StageTabSwap>
    </Stage>
  )
}
