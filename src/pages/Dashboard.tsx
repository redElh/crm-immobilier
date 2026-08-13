import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users, Home, DollarSign, AlertTriangle, Clock, Edit3, Target, FileText,
  BarChart2, TrendingUp, Filter, Calendar, Globe, ChevronRight, UserPlus,
  ArrowUpRight, ArrowDownRight, Eye, Phone, Award, Grid
} from 'react-feather'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import {
  DashboardTabs, TabContent, StatCard, DashboardPanel,
  DashboardLinkRow, BarChartCard, TrendChart, AnimatedNumber, useThemeColors
} from '../components/dashboard'
import type { DashboardTab } from '../components/dashboard'

type Period = 'week' | 'month' | 'quarter' | 'year'

const tabs: DashboardTab[] = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: Grid },
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

const funnelStages = [
  { label: 'Prospects', value: 47, trend: '+12%', color: '#8b5cf6' },
  { label: 'En qualification', value: 32, trend: '+8%', color: '#6366f1' },
  { label: 'En recherche', value: 18, trend: '+15%', color: '#3b82f6' },
  { label: 'En négociation', value: 8, trend: '+33%', color: '#f59e0b' },
  { label: 'En compromis', value: 5, trend: '+66%', color: '#f97316' },
  { label: 'Vendus', value: 12, trend: '+20%', color: '#10b981' },
]

const statusRepartition = [
  { label: 'En recherche', pct: 38, color: '#3b82f6' },
  { label: 'En qualification', pct: 25, color: '#6366f1' },
  { label: 'En négociation', pct: 17, color: '#f59e0b' },
  { label: 'En compromis', pct: 12, color: '#f97316' },
  { label: 'Vendus', pct: 8, color: '#10b981' },
]

const negociationClients = [
  { initials: 'HE', bg: 'bg-violet-50 text-violet-600', name: 'Hassan El Fassi', property: 'Villa Argana', price: '2 500 000 MAD' },
  { initials: 'PM', bg: 'bg-blue-50 text-blue-600', name: 'Pierre Martin', property: 'Villa Marrakech', price: '4 500 000 MAD' },
  { initials: 'AB', bg: 'bg-emerald-50 text-emerald-600', name: 'Ahmed Benali', property: 'Appartement Casa', price: '850 000 MAD' },
]

interface Appointment {
  time: string
  type: string
  variant: 'primary' | 'success' | 'warning' | 'secondary'
  client: string
  context: string
}

const todayAppointments: Appointment[] = [
  { time: '14:30', type: 'Visite', variant: 'primary', client: 'Sophie Martin', context: 'Villa Marrakech' },
  { time: '10:00', type: 'Appel', variant: 'success', client: 'Ahmed Benali', context: 'Proposition commerciale' },
  { time: '16:00', type: 'Signature', variant: 'warning', client: 'Mme Dupont', context: 'Mandat de vente' },
  { time: '11:30', type: 'Visite', variant: 'primary', client: 'Leila Benbrahim', context: 'Terrain Rabat' },
  { time: '09:00', type: 'Réunion', variant: 'secondary', client: 'Toute l\'agence', context: 'Réunion hebdomadaire' },
]

const weekAppointments = [
  { day: 'Demain', time: '10:00', type: 'Visite', client: 'Client X' },
  { day: 'Mercredi', time: '14:00', type: 'Appel', client: 'Client Y' },
  { day: 'Jeudi', time: '09:30', type: 'Signature', client: 'Client Z' },
]

const connections = [
  { initials: 'SM', bg: 'bg-emerald-50 text-emerald-600', name: 'Sophie Martin', property: 'Villa Marrakech', time: 'il y a 10 min', dot: 'bg-emerald-500' },
  { initials: 'PD', bg: 'bg-blue-50 text-blue-600', name: 'Pierre Dubois', property: 'Appartement Casa', time: 'il y a 45 min', dot: 'bg-emerald-500' },
  { initials: 'LB', bg: 'bg-amber-50 text-amber-600', name: 'Leila Benbrahim', property: 'Terrain Rabat', time: 'il y a 2h', dot: 'bg-amber-500' },
  { initials: 'YA', bg: 'bg-red-50 text-red-600', name: 'Youssef Amrani', property: 'Bureau Tanger', time: 'il y a 1j', dot: 'bg-red-500' },
]

const leads = [
  { initials: 'SM', bg: 'bg-accent-light text-accent', name: 'Sophie Martin', property: 'Villa Marrakech', time: 'il y a 15 min' },
  { initials: 'AB', bg: 'bg-emerald-50 text-emerald-600', name: 'Ahmed Benali', property: 'Appartement Casa', time: 'il y a 2h' },
  { initials: 'LB', bg: 'bg-amber-50 text-amber-600', name: 'Leila Benbrahim', property: 'Terrain Rabat', time: 'il y a 5h' },
  { initials: 'YA', bg: 'bg-violet-50 text-violet-600', name: 'Youssef Amrani', property: 'Bureau Tanger', time: 'il y a 1j' },
]

const recentDocuments = [
  { type: 'Mandat de vente', client: 'Villa Argana', status: 'Signé', variant: 'success' as const, time: 'il y a 2h' },
  { type: 'DPE', client: 'Appartement Centre', status: 'Téléchargé', variant: 'default' as const, time: 'il y a 5h' },
  { type: 'Contrat location', client: 'Résidence Oasis', status: 'En attente', variant: 'warning' as const, time: 'il y a 1j' },
  { type: 'Compromis vente', client: 'Villa Marrakech', status: 'Signé', variant: 'success' as const, time: 'il y a 2j' },
]

const rankings = [
  { rank: 1, label: 'Ventes', value: 12, agents: 8, color: '#10b981' },
  { rank: 2, label: 'Appels', value: 45, agents: 8, color: '#3b82f6' },
  { rank: 3, label: 'Visites', value: 12, agents: 8, color: '#8b5cf6' },
  { rank: 1, label: 'Honoraires', value: 342, suffix: 'K', agents: 8, color: '#f59e0b' },
]

const extranetStats = [
  { label: 'Connexions cette semaine', value: 124, trend: '+18%', color: 'text-accent', dot: 'bg-accent' },
  { label: 'Clients actifs', value: 12, trend: '+12%', color: 'text-emerald-600', dot: 'bg-emerald-500' },
  { label: 'Documents consultés', value: 45, trend: '+8%', color: 'text-amber-600', dot: 'bg-amber-500' },
]

function TabIntro({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mt-0.5 text-sm text-text-secondary">{subtitle}</p>
    </div>
  )
}

function OverviewTab() {
  const colors = useThemeColors()
  return (
    <>
      <TabIntro title="Vue d'ensemble" subtitle={subtitles.overview} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={Users} label="Prospects" value={47} trend="+12%" iconBg="bg-accent-light" iconColor="text-accent" spark={[3, 5, 4, 7, 6, 8]} sparkColor={colors.accent} delay={0} />
        <StatCard icon={Users} label="Contacts" value={156} trend="+8%" iconBg="bg-blue-50" iconColor="text-blue-600" spark={[12, 15, 14, 18, 17, 20]} sparkColor="#3b82f6" delay={0.05} />
        <StatCard icon={Home} label="Biens" value={89} trend="-3%" trendUp={false} iconBg="bg-amber-50" iconColor="text-amber-600" spark={[9, 8, 9, 7, 8, 6]} sparkColor="#f59e0b" delay={0.1} />
        <StatCard icon={DollarSign} label="Ventes" value={12} trend="+20%" iconBg="bg-emerald-50" iconColor="text-emerald-600" spark={[1, 2, 1, 3, 2, 4]} sparkColor="#10b981" delay={0.15} />
        <StatCard icon={DollarSign} label="Honoraires" value={342} suffix="K" trend="+15%" iconBg="bg-violet-50" iconColor="text-violet-600" spark={[20, 25, 22, 28, 30, 34]} sparkColor="#8b5cf6" delay={0.2} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <DashboardPanel title="Actions requises" icon={AlertTriangle} badge={<Badge variant="error">6 en cours</Badge>}>
          <div className="space-y-1">
            {alertData.map((alert, i) => {
              const AlertIcon = alert.icon
              return (
                <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-background">
                  <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md ${alert.variant === 'error' ? 'bg-error/5 text-error' : 'bg-amber-50 text-amber-600'}`}>
                    <AlertIcon size={13} />
                  </div>
                  <span className="flex-1 text-sm">{alert.text}</span>
                  <Badge variant={alert.variant}>{alert.variant === 'error' ? 'Haute' : 'Moyenne'}</Badge>
                </div>
              )
            })}
          </div>
          <DashboardLinkRow label="Voir toutes les actions" />
        </DashboardPanel>

        <DashboardPanel title="Activité récente" icon={BarChart2} badge={<Badge variant="primary">Cette semaine</Badge>}>
          <BarChartCard
            data={activityData}
            series={[
              { dataKey: 'appels', name: 'Appels', color: colors.accent, stackId: 'a' },
              { dataKey: 'visites', name: 'Visites', color: '#10b981', stackId: 'a' },
              { dataKey: 'signatures', name: 'Signatures', color: '#f59e0b', stackId: 'a', radius: true },
            ]}
            height={180}
          />
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: '45', label: 'appels' },
              { value: '12', label: 'visites' },
              { value: '8', label: 'documents signés' },
            ].map(s => (
              <div key={s.label} className="rounded-lg bg-background p-3 text-center">
                <p className="text-lg font-semibold text-accent">{s.value}</p>
                <p className="text-[11px] text-text-secondary">{s.label}</p>
              </div>
            ))}
          </div>
        </DashboardPanel>
      </div>
    </>
  )
}

function PerformanceTab() {
  const colors = useThemeColors()
  return (
    <>
      <TabIntro title="Performance" subtitle={subtitles.performance} />

      <DashboardPanel title="Performance financière" icon={DollarSign}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-text-secondary">Chiffre d'affaires — ce mois</p>
            <div className="mt-1 flex items-baseline gap-2">
              <AnimatedNumber value={342500} suffix=" MAD" className="text-3xl font-bold tracking-tight" />
              <span className="inline-flex items-center gap-0.5 text-sm font-medium text-emerald-600">
                <ArrowUpRight size={13} />
                +15%
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm text-text-secondary">
              <span>Mois dernier : 298 000 MAD</span>
            </div>
            <div className="mt-5">
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="text-text-secondary">Objectif : 400 000 MAD</span>
                <span className="font-semibold">85%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-border/60">
                <motion.div
                  className="h-full rounded-full bg-accent"
                  initial={{ width: 0 }}
                  animate={{ width: '85%' }}
                  transition={{ duration: 1.2, ease: [0, 0, 0.58, 1] }}
                />
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-background p-4">
            <p className="mb-2 text-xs uppercase tracking-wider text-text-secondary">Répartition par type</p>
            {[
              { label: 'Vente', pct: 78, color: colors.accent },
              { label: 'Location', pct: 15, color: '#10b981' },
              { label: 'Saisonnier', pct: 7, color: '#f59e0b' },
            ].map(item => (
              <div key={item.label} className="mb-3 last:mb-0">
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                    {item.label}
                  </span>
                  <span className="font-semibold">{item.pct}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-border/60">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: item.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.pct}%` }}
                    transition={{ duration: 1, ease: [0, 0, 0.58, 1] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </DashboardPanel>

      <DashboardPanel title="Évolution des ventes" icon={TrendingUp} badge={<Badge variant="success">Tendance +15%</Badge>}>
        <TrendChart
          data={salesData}
          series={[{ dataKey: 'ventes', name: 'Ventes', color: colors.accent }]}
          height={240}
        />
        <div className="mt-3 flex items-center justify-center gap-2 text-sm text-text-secondary">
          <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
            <ArrowUpRight size={13} />
            +15%
          </span>
          par rapport au mois dernier
        </div>
      </DashboardPanel>

      <DashboardPanel title="Classement personnel" icon={Award} badge={<Badge variant="primary">Ce mois</Badge>}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {rankings.map(rank => (
            <div key={rank.label} className="rounded-xl bg-background p-4">
              <div className="flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold" style={{ backgroundColor: `${rank.color}1a`, color: rank.color }}>
                  {rank.rank}er
                </span>
                <Badge variant="outline">{rank.rank === 1 ? '1er' : rank.rank === 2 ? '2ème' : '3ème'} / {rank.agents} agents</Badge>
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-tight">
                <AnimatedNumber value={rank.value} suffix={rank.suffix || ''} />
              </p>
              <p className="text-[13px] text-text-secondary">{rank.label}</p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border/60">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: rank.color }}
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1, ease: [0, 0, 0.58, 1] }}
                />
              </div>
            </div>
          ))}
        </div>
      </DashboardPanel>
    </>
  )
}

function PipelineTab() {
  return (
    <>
      <TabIntro title="Pipeline" subtitle={subtitles.pipeline} />

      <DashboardPanel title="Cycle de vente" icon={Filter}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {funnelStages.map((stage, i) => (
            <div key={stage.label} className="relative">
              <div className="rounded-xl border border-border/50 bg-background p-4 text-center transition-all duration-200 hover:shadow-card-hover">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold" style={{ backgroundColor: `${stage.color}1a`, color: stage.color }}>
                  {stage.value}
                </div>
                <p className="text-[13px] font-medium">{stage.label}</p>
                <span className="mt-1 inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600">
                  <ArrowUpRight size={10} />
                  {stage.trend}
                </span>
              </div>
              {i < funnelStages.length - 1 && (
                <ChevronRight size={18} className="absolute -right-2.5 top-1/2 z-10 hidden -translate-y-1/2 text-text-secondary/30 lg:block" />
              )}
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-border/30 pt-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-text-secondary">Taux de conversion :</span>
            <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-600">
              25,5%
              <ArrowUpRight size={12} />
              +5%
            </span>
          </div>
          <div className="h-4 w-px bg-border/50" />
          <div className="flex items-center gap-2">
            <span className="text-text-secondary">Délai moyen vente :</span>
            <span className="font-semibold text-accent">45 jours</span>
            <span className="inline-flex items-center gap-0.5 text-emerald-600">
              <ArrowDownRight size={12} />
              -3 jours
            </span>
          </div>
        </div>
      </DashboardPanel>

      <DashboardPanel title="Répartition par statut" icon={BarChart2}>
        <div className="space-y-3.5">
          {statusRepartition.map(item => (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                  {item.label}
                </span>
                <span className="font-semibold">{item.pct}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-border/60">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: item.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${item.pct}%` }}
                  transition={{ duration: 1, ease: [0, 0, 0.58, 1] }}
                />
              </div>
            </div>
          ))}
        </div>
      </DashboardPanel>

      <DashboardPanel title="Derniers clients en négociation" icon={UserPlus} badge={<Badge variant="warning">3 en cours</Badge>}>
        <div className="space-y-2">
          {negociationClients.map(client => (
            <div key={client.name} className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-background">
              <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${client.bg}`}>
                {client.initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{client.name}</p>
                <p className="truncate text-xs text-text-secondary">{client.property}</p>
              </div>
              <span className="hidden text-sm font-semibold sm:block">{client.price}</span>
              <Button variant="outline" size="sm" icon={<Eye size={13} />}>Voir</Button>
            </div>
          ))}
        </div>
      </DashboardPanel>
    </>
  )
}

function AgendaTab() {
  return (
    <>
      <TabIntro title="Agenda" subtitle={subtitles.agenda} />

      <DashboardPanel title="Aujourd'hui" icon={Calendar} badge={<Badge variant="primary">5 rendez-vous</Badge>}>
        <div className="space-y-1">
          {todayAppointments.map(apt => (
            <div key={apt.time + apt.client} className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-background">
              <span className="w-12 flex-shrink-0 text-sm font-semibold">{apt.time}</span>
              <Badge variant={apt.variant}>{apt.type}</Badge>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{apt.client}</p>
                <p className="truncate text-xs text-text-secondary">{apt.context}</p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                <Button variant="outline" size="sm" icon={<Eye size={13} />}>Voir</Button>
                <Button variant="primary" size="sm" icon={<Phone size={13} />}>Contacter</Button>
              </div>
            </div>
          ))}
        </div>
        <DashboardLinkRow label="Voir tout le calendrier" />
      </DashboardPanel>

      <DashboardPanel title="Cette semaine" icon={Calendar} badge={<Badge variant="secondary">8 rendez-vous</Badge>}>
        <div className="space-y-2">
          {weekAppointments.map((apt, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-background">
              <span className="w-16 flex-shrink-0 text-xs font-semibold text-text-secondary">{apt.day}</span>
              <span className="w-12 flex-shrink-0 text-sm font-semibold">{apt.time}</span>
              <Badge variant="secondary">{apt.type}</Badge>
              <p className="flex-1 truncate text-sm font-medium">{apt.client}</p>
            </div>
          ))}
        </div>
        <DashboardLinkRow label="Voir le planning de la semaine" />
      </DashboardPanel>
    </>
  )
}

function ActiviteTab() {
  return (
    <>
      <TabIntro title="Activité" subtitle={subtitles.activite} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {extranetStats.map(stat => (
          <div key={stat.label} className="rounded-xl border border-border/50 bg-card p-5 text-center shadow-card transition-all duration-200 hover:shadow-card-hover">
            <p className={`text-3xl font-bold tracking-tight ${stat.color}`}>
              <AnimatedNumber value={stat.value} />
            </p>
            <p className="mt-1 text-[13px] text-text-secondary">{stat.label}</p>
            <span className="mt-1.5 inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600">
              <ArrowUpRight size={11} />
              {stat.trend}
            </span>
          </div>
        ))}
      </div>

      <DashboardPanel title="Dernières connexions" icon={Globe}>
        <div className="space-y-2">
          {connections.map(c => (
            <div key={c.name} className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-background">
              <span className="relative flex-shrink-0">
                <span className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ${c.bg}`}>{c.initials}</span>
                <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${c.dot}`} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c.name}</p>
                <p className="truncate text-xs text-text-secondary">{c.property}</p>
              </div>
              <span className="flex-shrink-0 text-xs text-text-secondary/60">{c.time}</span>
            </div>
          ))}
        </div>
        <DashboardLinkRow label="Voir le détail extranet" />
      </DashboardPanel>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <DashboardPanel title="Derniers leads" icon={UserPlus} badge={<Badge variant="primary">4 nouveaux</Badge>}>
          <div className="space-y-2">
            {leads.map(lead => (
              <div key={lead.name} className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-background">
                <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${lead.bg}`}>{lead.initials}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{lead.name}</p>
                  <p className="truncate text-xs text-text-secondary">{lead.property}</p>
                </div>
                <span className="flex-shrink-0 text-xs text-text-secondary/60">{lead.time}</span>
              </div>
            ))}
          </div>
          <DashboardLinkRow label="Voir tous les prospects" />
        </DashboardPanel>

        <DashboardPanel title="Derniers documents" icon={FileText} badge={<Badge variant="secondary">4 récents</Badge>}>
          <div className="space-y-2">
            {recentDocuments.map(doc => (
              <div key={doc.type + doc.client} className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-background">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-accent-light text-accent">
                  <FileText size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{doc.type}</p>
                  <p className="truncate text-xs text-text-secondary">{doc.client}</p>
                </div>
                <Badge variant={doc.variant}>{doc.status}</Badge>
                <span className="flex-shrink-0 text-xs text-text-secondary/60">{doc.time}</span>
              </div>
            ))}
          </div>
          <DashboardLinkRow label="Voir tous les documents" />
        </DashboardPanel>
      </div>
    </>
  )
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [period, setPeriod] = useState<Period>('month')

  const content: Record<string, React.ReactNode> = {
    overview: <OverviewTab />,
    performance: <PerformanceTab />,
    pipeline: <PipelineTab />,
    agenda: <AgendaTab />,
    activite: <ActiviteTab />,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-light text-accent">
              <Home size={19} />
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">DASHBOARD</h1>
              <p className="text-sm text-text-secondary">Bienvenue, Karim ! Voici votre activité du jour</p>
            </div>
          </div>
          <div className="flex items-center gap-1 self-start rounded-xl border border-border/50 bg-card p-1 shadow-card sm:self-auto">
            <Calendar size={15} className="ml-1.5 text-text-secondary" />
            {periods.map(p => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPeriod(p.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  period === p.key
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-text-secondary hover:text-text hover:bg-background'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <DashboardTabs tabs={tabs} activeId={activeTab} onChange={setActiveTab} />
      </div>

      <TabContent tabId={activeTab}>
        {content[activeTab]}
      </TabContent>
    </div>
  )
}
