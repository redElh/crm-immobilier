import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { api } from '../../../services/api'
import {
  Users, Shield, TrendingUp, ArrowUpRight, ArrowDownRight,
  Calendar, Home, DollarSign, FileText, Settings, AlertTriangle,
  Target, Edit3, Clock, Award, BarChart2, Globe,
  CheckCircle, Zap, UserPlus, Download,
  ChevronRight, Layout, Monitor, Grid, Filter, Crosshair
} from 'react-feather'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import {
  DashboardTabs, TabContent, StatCard, DashboardPanel,
  DashboardLinkRow, BarChartCard, TrendChart, DonutCard,
  AnimatedNumber, useThemeColors
} from '../../../components/dashboard'
import type { DashboardTab } from '../../../components/dashboard'

type Period = 'today' | 'week' | 'month' | 'quarter' | 'year'

const tabs: DashboardTab[] = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: Grid },
  { id: 'team', label: 'Équipe', icon: Users },
  { id: 'performance', label: 'Performance', icon: TrendingUp },
  { id: 'pipeline', label: 'Pipeline', icon: Filter },
  { id: 'market', label: 'Marché', icon: Globe },
  { id: 'crm', label: 'CRM', icon: Monitor },
]

const subtitles: Record<string, string> = {
  overview: 'Vue globale de votre agence - Square Meter',
  team: 'Performance et activité de vos agents',
  performance: 'Analyse financière et répartition',
  pipeline: 'Suivi global du cycle de vente',
  market: 'Portails partenaires et performance par type de bien',
  crm: 'Santé et activité des modules CRM',
}

const periods: { key: Period; label: string }[] = [
  { key: 'today', label: "Aujourd'hui" },
  { key: 'week', label: 'Cette semaine' },
  { key: 'month', label: 'Ce mois' },
  { key: 'quarter', label: 'Ce trimestre' },
  { key: 'year', label: 'Cette année' },
]

const ROSE_TAUPE = '#905D5D'

function gColor(isGerant: boolean, color: string): string {
  return isGerant && (color === '#f59e0b' || color === '#f97316') ? ROSE_TAUPE : color
}

interface AlertItem {
  icon: React.ComponentType<{ size?: number | string; className?: string }>
  text: string
  variant: 'error' | 'warning'
}

const alerts: AlertItem[] = [
  { icon: FileText, text: '14 Mandats expirés', variant: 'error' },
  { icon: Target, text: '7 Croisements à faire', variant: 'error' },
  { icon: Clock, text: '3 Prospects non contactés (+7j)', variant: 'error' },
  { icon: Home, text: '2 Biens sans photo principale', variant: 'error' },
  { icon: Users, text: '1 Agent inactif (30j)', variant: 'warning' },
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
  { label: 'Jan', ventes: 6, ca: 210 },
  { label: 'Fév', ventes: 8, ca: 245 },
  { label: 'Mar', ventes: 7, ca: 230 },
  { label: 'Avr', ventes: 10, ca: 280 },
  { label: 'Mai', ventes: 9, ca: 298 },
  { label: 'Juin', ventes: 12, ca: 343 },
]

const agentRankings = [
  { rank: 1, name: 'Myriam ABABOU', initials: 'MA', ventes: 8, volume: 45, ca: 112000, tauxConv: 28, trend: 'up', trendVal: '+12%' },
  { rank: 2, name: 'Karim Eloui', initials: 'KE', ventes: 5, volume: 38, ca: 75000, tauxConv: 22, trend: 'up', trendVal: '+5%' },
  { rank: 3, name: 'Yasmine AATIC', initials: 'YA', ventes: 4, volume: 32, ca: 52000, tauxConv: 18, trend: 'down', trendVal: '-2%' },
  { rank: 4, name: 'Dimitri DJEDJE', initials: 'DD', ventes: 3, volume: 28, ca: 40000, tauxConv: 15, trend: 'flat', trendVal: '0%' },
  { rank: 5, name: 'Hayat OUAKRIM', initials: 'HO', ventes: 2, volume: 22, ca: 30000, tauxConv: 12, trend: 'up', trendVal: '+3%' },
]

const pipelineStages = [
  { label: 'Prospects', value: 156, trend: '+18%', color: '#8b5cf6' },
  { label: 'En qualification', value: 98, trend: '+12%', color: '#6366f1' },
  { label: 'En recherche', value: 56, trend: '+8%', color: '#3b82f6' },
  { label: 'En négociation', value: 24, trend: '+20%', color: '#f59e0b' },
  { label: 'En compromis', value: 12, trend: '+33%', color: '#f97316' },
  { label: 'Vendus', value: 28, trend: '+22%', color: '#10b981' },
]

const statusRepartition = [
  { label: 'En recherche', pct: 36, color: '#3b82f6' },
  { label: 'En qualification', pct: 27, color: '#6366f1' },
  { label: 'En négociation', pct: 16, color: '#f59e0b' },
  { label: 'En compromis', pct: 8, color: '#f97316' },
  { label: 'Vendus', pct: 13, color: '#10b981' },
]

const portalData = [
  { name: 'Mubawab', clics: 142, prospects: 12, pct: 45, color: '#3b82f6' },
  { name: 'Properstar', clics: 98, prospects: 8, pct: 30, color: '#10b981' },
  { name: 'Green-Acres', clics: 45, prospects: 3, pct: 15, color: '#f59e0b' },
  { name: 'Avito', clics: 32, prospects: 2, pct: 10, color: '#8b5cf6' },
]

const propertyTypeData = [
  { type: 'Résidentiel', ventes: 8, ca: 220000, duree: 45, rotation: 12 },
  { type: 'Luxe', ventes: 3, ca: 180000, duree: 90, rotation: 6 },
  { type: 'Commercial', ventes: 2, ca: 75000, duree: 60, rotation: 8 },
  { type: 'Terrains', ventes: 1, ca: 25000, duree: 30, rotation: 15 },
  { type: 'Saisonnier', ventes: 0, ca: 0, duree: 0, rotation: 45 },
]

const crmModules = [
  { name: 'Prospects', total: 156, actif: 98, inactif: 58, remplissage: 62, alerte: 'Non contactés', alerteType: 'warning' as const },
  { name: 'Clients', total: 89, actif: 56, inactif: 33, remplissage: 70, alerte: 'OK', alerteType: 'info' as const },
  { name: 'Biens', total: 48, actif: 42, inactif: 6, remplissage: 87, alerte: 'Bon', alerteType: 'success' as const },
  { name: 'Mandats', total: 32, actif: 18, inactif: 14, remplissage: 56, alerte: 'Expirés', alerteType: 'warning' as const },
  { name: 'Documents', total: 124, actif: 98, inactif: 26, remplissage: 79, alerte: 'OK', alerteType: 'info' as const },
]

const recentUsers = [
  { name: 'Sophie Martin', initials: 'SM', action: 'Créé il y a 10min', color: 'bg-accent-light text-accent' },
  { name: 'Karim Eloui', initials: 'KE', action: 'Activé il y a 1h', color: 'bg-emerald-50 text-emerald-600' },
  { name: 'Yasmine AATIC', initials: 'YA', action: 'Mis à jour il y a 3h', color: 'bg-amber-50 text-amber-600' },
]

const appointmentData = [
  { time: '14h30', type: 'Visite', agent: 'Myriam', client: 'Villa Marrakech', variant: 'primary' as const },
  { time: '10h00', type: 'Appel proposition', agent: 'Karim', client: 'Proposition commerciale', variant: 'success' as const },
  { time: '16h00', type: 'Signature mandat', agent: 'Yasmine', client: 'Mandat de vente', variant: 'warning' as const },
  { time: '11h30', type: 'Visite terrain', agent: 'Dimitri', client: 'Terrain Rabat', variant: 'primary' as const },
  { time: '09h00', type: 'Réunion équipe', agent: 'Toute l\'agence', client: 'Réunion hebdomadaire', variant: 'secondary' as const },
]

const modulePcts = [
  { name: 'Prospects', value: 35, color: '#2c8264' },
  { name: 'Clients', value: 20, color: '#10b981' },
  { name: 'Biens', value: 18, color: '#f59e0b' },
  { name: 'Contrats', value: 12, color: '#8b5cf6' },
  { name: 'Documents', value: 10, color: '#3b82f6' },
  { name: 'Autre', value: 5, color: '#94a3b8' },
]

const quickActions = [
  { icon: UserPlus, label: 'Ajouter un agent', color: 'bg-accent-light text-accent' },
  { icon: Users, label: 'Inviter un collaborateur', color: 'bg-emerald-50 text-emerald-600' },
  { icon: Download, label: 'Exporter le rapport', color: 'bg-violet-50 text-violet-600' },
  { icon: Settings, label: 'Configurer l\'agence', color: 'bg-amber-50 text-amber-600' },
  { icon: FileText, label: 'Voir les logs système', color: 'bg-blue-50 text-blue-600' },
]

function formatCurrency(val: number): string {
  return val.toLocaleString('fr-FR') + ' MAD'
}

function TabIntro({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mt-0.5 text-sm text-text-secondary">{subtitle}</p>
    </div>
  )
}

function OverviewTab({ isGerant }: { isGerant: boolean }) {
  const colors = useThemeColors()
  const accent = isGerant ? ROSE_TAUPE : colors.accent
  return (
    <>
      <TabIntro title="Vue d'ensemble" subtitle={subtitles.overview} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={Users} label="Agents" value={12} trend="+8%" iconBg="bg-blue-50" iconColor="text-blue-600" spark={[8, 9, 8, 10, 11, 12]} sparkColor="#3b82f6" />
        <StatCard icon={Crosshair} label="Prospects" value={156} trend="+12%" iconBg={isGerant ? 'bg-[#E7D5D5]' : 'bg-accent-light'} iconColor={isGerant ? 'text-[#905D5D]' : 'text-accent'} spark={[120, 130, 128, 140, 148, 156]} sparkColor={accent} delay={0.05} />
        <StatCard icon={Home} label="Biens en stock" value={89} trend="-3%" trendUp={false} iconBg={isGerant ? 'bg-[#E7D5D5]' : 'bg-amber-50'} iconColor={isGerant ? 'text-[#905D5D]' : 'text-amber-600'} spark={[95, 92, 94, 91, 90, 89]} sparkColor={gColor(isGerant, '#f59e0b')} delay={0.1} />
        <StatCard icon={TrendingUp} label="Ventes ce mois" value={12} trend="+20%" iconBg="bg-emerald-50" iconColor="text-emerald-600" spark={[6, 8, 7, 10, 9, 12]} sparkColor="#10b981" delay={0.15} />
        <StatCard icon={DollarSign} label="CA ce mois" value={342} suffix="K" trend="+15%" iconBg="bg-violet-50" iconColor="text-violet-600" spark={[210, 245, 230, 280, 298, 343]} sparkColor="#8b5cf6" delay={0.2} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <DashboardPanel title="Alertes et Actions" icon={AlertTriangle} badge={<Badge variant="error">{alerts.length} alertes</Badge>}>
          <div className="space-y-1">
            {alerts.map((alert, i) => {
              const AlertIcon = alert.icon
              return (
                <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-background">
                  <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md ${alert.variant === 'error' ? 'bg-error/5 text-error' : isGerant ? 'bg-[#E7D5D5] text-[#905D5D]' : 'bg-amber-50 text-amber-600'}`}>
                    <AlertIcon size={13} />
                  </div>
                  <span className="flex-1 text-sm">{alert.text}</span>
                  <Badge variant={alert.variant}>{alert.variant === 'error' ? 'Haute' : 'Moyenne'}</Badge>
                </div>
              )
            })}
          </div>
          <DashboardLinkRow label="Voir toutes les alertes" />
        </DashboardPanel>

        <DashboardPanel title="Activité Récente" icon={BarChart2} badge={<Badge variant="primary">7 derniers jours</Badge>}>
          <BarChartCard
            data={activityData}
            series={[
              { dataKey: 'appels', name: 'Appels', color: accent, stackId: 'a' },
              { dataKey: 'visites', name: 'Visites', color: '#10b981', stackId: 'a' },
              { dataKey: 'signatures', name: 'Signatures', color: gColor(isGerant, '#f59e0b'), stackId: 'a', radius: true },
            ]}
            height={180}
          />
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: '156', label: 'appels cette semaine' },
              { value: '42', label: 'visites terrain' },
              { value: '28', label: 'documents signés' },
            ].map(s => (
              <div key={s.label} className="rounded-lg bg-background p-3 text-center">
                <p className="text-lg font-semibold" style={{ color: accent }}>{s.value}</p>
                <p className="text-[11px] text-text-secondary">{s.label}</p>
              </div>
            ))}
          </div>
        </DashboardPanel>
      </div>
    </>
  )
}

function TeamTab({ isGerant }: { isGerant: boolean }) {
  const colors = useThemeColors()
  const accent = isGerant ? ROSE_TAUPE : colors.accent
  return (
    <>
      <TabIntro title="Équipe" subtitle={subtitles.team} />
      <DashboardPanel title="Performance de l'Équipe" icon={Award} badge={<Badge variant="primary">Ce mois</Badge>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30 text-left text-xs text-text-secondary">
                <th className="w-8 pb-3 font-medium">#</th>
                <th className="pb-3 font-medium">Agent</th>
                <th className="pb-3 text-right font-medium">Ventes</th>
                <th className="pb-3 text-right font-medium">Volume</th>
                <th className="pb-3 text-right font-medium">CA généré</th>
                <th className="pb-3 text-right font-medium">Taux conv.</th>
                <th className="pb-3 text-right font-medium">Tendance</th>
              </tr>
            </thead>
            <tbody>
              {agentRankings.map(agent => (
                <tr key={agent.rank} className="border-b border-border/20 transition-colors hover:bg-background/50">
                  <td className="py-3">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                        agent.rank === 1 ? (isGerant ? 'bg-[#E7D5D5] text-[#905D5D]' : 'bg-amber-100 text-amber-700')
                        : agent.rank === 2 ? 'bg-slate-100 text-slate-600'
                        : agent.rank === 3 ? (isGerant ? 'bg-[#F0E2E2] text-[#905D5D]' : 'bg-orange-100 text-orange-700')
                        : 'bg-background text-text-secondary'
                      }`}
                    >
                      {agent.rank}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${agent.rank <= 3 ? (isGerant ? 'bg-[#E7D5D5] text-[#905D5D]' : 'bg-accent-light text-accent') : 'bg-background text-text-secondary'}`}>
                        {agent.initials}
                      </div>
                      <span className="font-medium">{agent.name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-right font-medium">{agent.ventes}</td>
                  <td className="py-3 text-right text-text-secondary">{agent.volume}</td>
                  <td className="py-3 text-right font-medium">{formatCurrency(agent.ca)}</td>
                  <td className="py-3 text-right">
                    <span className={`font-medium ${agent.tauxConv >= 20 ? 'text-emerald-600' : agent.tauxConv >= 15 ? (isGerant ? 'text-[#905D5D]' : 'text-amber-600') : 'text-text-secondary'}`}>
                      {agent.tauxConv}%
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${agent.trend === 'up' ? 'text-emerald-600' : agent.trend === 'down' ? 'text-error' : 'text-text-secondary'}`}>
                      {agent.trend === 'up' && <ArrowUpRight size={12} />}
                      {agent.trend === 'down' && <ArrowDownRight size={12} />}
                      {agent.trendVal}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <DashboardLinkRow label="Voir le détail des performances" />
      </DashboardPanel>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <DashboardPanel title="Répartition CA par agent" icon={DollarSign}>
          <div className="space-y-4">
            {agentRankings.map(agent => {
              const pct = (agent.ca / 112000) * 100
              return (
                <div key={agent.name} className="flex items-center gap-3">
                  <span className="w-24 truncate text-sm font-medium">{agent.name.split(' ')[0]}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-border/60">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: agent.rank === 1 ? accent : agent.rank === 2 ? '#10b981' : agent.rank === 3 ? gColor(isGerant, '#f59e0b') : '#8b5cf6' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, ease: [0, 0, 0.58, 1] }}
                    />
                  </div>
                  <span className="w-20 flex-shrink-0 text-right text-xs font-medium text-text-secondary">{formatCurrency(agent.ca)}</span>
                </div>
              )
            })}
          </div>
        </DashboardPanel>

        <DashboardPanel title="Derniers Utilisateurs" icon={UserPlus} badge={<Badge variant="primary">{recentUsers.length} nouveaux</Badge>}>
          <div className="space-y-2">
            {recentUsers.map(user => (
              <div key={user.name} className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-background">
                <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${isGerant && (user.color.includes('amber') || user.color.includes('accent-light')) ? 'bg-[#E7D5D5] text-[#905D5D]' : user.color}`}>
                  {user.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{user.name}</p>
                  <p className="truncate text-xs text-text-secondary">{user.action}</p>
                </div>
                <Button variant="outline" size="sm">Voir</Button>
              </div>
            ))}
          </div>
          <DashboardLinkRow label="Voir tous les utilisateurs" />
        </DashboardPanel>
      </div>
    </>
  )
}

function PerformanceTab({ isGerant }: { isGerant: boolean }) {
  const colors = useThemeColors()
  const accent = isGerant ? ROSE_TAUPE : colors.accent
  return (
    <>
      <TabIntro title="Performance" subtitle={subtitles.performance} />

      <DashboardPanel title="Performance Financière" icon={DollarSign}>
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
            <div className="mt-1 flex items-center gap-3 text-sm text-text-secondary">
              <span>Objectif : 400 000 MAD</span>
              <span className="h-1 w-1 rounded-full bg-text-secondary/30" />
              <span className="text-error/70">Écart : -57 500 MAD</span>
            </div>
            <div className="mt-5">
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="text-text-secondary">Progression</span>
                <span className="font-semibold">85%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-border/60">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: accent }}
                  initial={{ width: 0 }}
                  animate={{ width: '85%' }}
                  transition={{ duration: 1.2, ease: [0, 0, 0.58, 1] }}
                />
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-background p-4">
            <p className="mb-2 text-xs uppercase tracking-wider text-text-secondary">Répartition par module</p>
            <DonutCard
              data={modulePcts.map(m => ({ ...m, color: gColor(isGerant, m.color) }))}
              height={190}
              centerValue="82%"
              centerLabel="Utilisation"
            />
            <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
              {modulePcts.map(m => (
                <span key={m.name} className="flex items-center gap-1.5 text-xs text-text-secondary">
                  <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: gColor(isGerant, m.color) }} />
                  {m.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </DashboardPanel>

      <DashboardPanel title="Évolution des ventes et du CA" icon={TrendingUp} badge={<Badge variant="success">Tendance +15%</Badge>}>
        <TrendChart
          data={salesData}
          series={[
            { dataKey: 'ca', name: 'CA (K MAD)', color: accent },
            { dataKey: 'ventes', name: 'Ventes', color: gColor(isGerant, '#f59e0b') },
          ]}
          height={250}
        />
      </DashboardPanel>

      <DashboardPanel title="Santé du CRM" icon={Monitor} badge={<Badge variant="success">Bon</Badge>}>
        <div className="space-y-3.5">
          {crmModules.map(mod => (
            <div key={mod.name}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className={`font-medium ${mod.remplissage >= 80 ? 'text-emerald-600' : mod.remplissage >= 60 ? (isGerant ? 'text-[#905D5D]' : 'text-amber-600') : 'text-error'}`}>
                    {mod.name}
                  </span>
                </span>
                <span className="flex items-center gap-2 text-xs text-text-secondary">
                  {mod.actif} actifs / {mod.total} total
                  <span className={`inline-flex items-center gap-1 font-medium ${mod.alerteType === 'warning' ? (isGerant ? 'text-[#905D5D]' : 'text-amber-600') : mod.alerteType === 'success' ? 'text-emerald-600' : 'text-text-secondary'}`}>
                    {mod.alerteType === 'warning' && <AlertTriangle size={10} />}
                    {mod.alerteType === 'success' && <CheckCircle size={10} />}
                    {mod.alerte}
                  </span>
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-border/60">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: mod.remplissage >= 80 ? '#10b981' : mod.remplissage >= 60 ? gColor(isGerant, '#f59e0b') : '#ef4444' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${mod.remplissage}%` }}
                  transition={{ duration: 1, ease: [0, 0, 0.58, 1] }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-4 border-t border-border/30 pt-3 text-xs text-text-secondary">
          <span>Santé globale du CRM : <span className="font-semibold text-emerald-600">85% (Bon)</span></span>
          <span className="h-3 w-px bg-border/50" />
          <span>Dernière sauvegarde : 13/06/2026 02:00</span>
        </div>
      </DashboardPanel>
    </>
  )
}

function PipelineTab({ isGerant }: { isGerant: boolean }) {
  const colors = useThemeColors()
  const accent = isGerant ? ROSE_TAUPE : colors.accent
  const stages = pipelineStages.map(s => ({ ...s, color: gColor(isGerant, s.color) }))
  const status = statusRepartition.map(s => ({ ...s, color: gColor(isGerant, s.color) }))
  return (
    <>
      <TabIntro title="Pipeline" subtitle={subtitles.pipeline} />

      <DashboardPanel title="Pipeline Global" icon={Filter}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {stages.map((stage, i) => (
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
              {i < stages.length - 1 && (
                <ChevronRight size={18} className="absolute -right-2.5 top-1/2 z-10 hidden -translate-y-1/2 text-text-secondary/30 lg:block" />
              )}
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-border/30 pt-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-text-secondary">Taux de conversion global :</span>
            <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-600">
              17,9%
              <ArrowUpRight size={12} />
              +4%
            </span>
          </div>
          <div className="h-4 w-px bg-border/50" />
          <div className="flex items-center gap-2">
            <span className="text-text-secondary">Délai moyen vente :</span>
            <span className="font-semibold" style={{ color: accent }}>42 jours</span>
            <span className="inline-flex items-center gap-0.5 text-emerald-600">
              <ArrowDownRight size={12} />
              -5 jours
            </span>
          </div>
          <div className="h-4 w-px bg-border/50" />
          <div className="flex items-center gap-2">
            <span className="text-text-secondary">Objectif mensuel :</span>
            <span className="font-semibold" style={{ color: accent }}>35 / 30</span>
            <Badge variant="success">Atteint</Badge>
          </div>
        </div>
      </DashboardPanel>

      <DashboardPanel title="Répartition par statut" icon={BarChart2}>
        <div className="space-y-3.5">
          {status.map(item => (
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
    </>
  )
}

function MarketTab({ isGerant }: { isGerant: boolean }) {
  const colors = useThemeColors()
  const accent = isGerant ? ROSE_TAUPE : colors.accent
  const portals = portalData.map(p => ({ ...p, color: gColor(isGerant, p.color) }))
  return (
    <>
      <TabIntro title="Marché" subtitle={subtitles.market} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Connexions cette semaine', value: 124, trend: '+18%', color: accent },
          { label: 'Clients actifs extranet', value: 23, trend: '+8%', color: '#059669' },
          { label: 'Leads portails', value: 25, trend: '+14%', color: '#7c3aed' },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-border/50 bg-card p-5 text-center shadow-card transition-all duration-200 hover:shadow-card-hover">
            <p className="text-3xl font-bold tracking-tight" style={{ color: stat.color }}>
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

      <DashboardPanel title="Portails partenaires" icon={Globe}>
        <div className="space-y-3.5">
          {portals.map(portal => (
            <div key={portal.name} className="flex items-center gap-4">
              <span className="w-28 text-sm font-medium">{portal.name}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-border/60">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: portal.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${portal.pct}%` }}
                  transition={{ duration: 1, ease: [0, 0, 0.58, 1] }}
                />
              </div>
              <div className="flex w-32 flex-shrink-0 items-center justify-end gap-3 text-xs text-text-secondary">
                <span>{portal.clics} clics</span>
                <span className="font-medium" style={{ color: accent }}>{portal.prospects} prospects</span>
              </div>
            </div>
          ))}
        </div>
        <DashboardLinkRow label="Voir le détail des portails" />
      </DashboardPanel>

      <DashboardPanel title="Performance par Type de Bien" icon={Layout}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30 text-left text-xs text-text-secondary">
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 text-right font-medium">Ventes</th>
                <th className="pb-3 text-right font-medium">CA généré</th>
                <th className="pb-3 text-right font-medium">Durée moyenne vente</th>
                <th className="pb-3 text-right font-medium">Taux rotation</th>
              </tr>
            </thead>
            <tbody>
              {propertyTypeData.map(pt => (
                <tr key={pt.type} className="border-b border-border/20 transition-colors hover:bg-background/50">
                  <td className="py-3 font-medium">{pt.type}</td>
                  <td className="py-3 text-right">{pt.ventes}</td>
                  <td className="py-3 text-right font-medium">{pt.ca > 0 ? formatCurrency(pt.ca) : '-'}</td>
                  <td className="py-3 text-right">{pt.duree > 0 ? `${pt.duree} jours` : '-'}</td>
                  <td className="py-3 text-right">
                    <span className={`font-medium ${pt.rotation >= 15 ? 'text-emerald-600' : pt.rotation >= 8 ? (isGerant ? 'text-[#905D5D]' : 'text-amber-600') : 'text-text-secondary'}`}>
                      {pt.rotation}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardPanel>
    </>
  )
}

function CrmTab({ isGerant }: { isGerant: boolean }) {
  const colors = useThemeColors()
  const accent = isGerant ? ROSE_TAUPE : colors.accent
  return (
    <>
      <TabIntro title="CRM" subtitle={subtitles.crm} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <DashboardPanel title="Vue d'ensemble du CRM" icon={Monitor} badge={<Badge variant="success">Santé 85%</Badge>}>
          <div className="space-y-3.5">
            {crmModules.map(mod => (
              <div key={mod.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">{mod.name}</span>
                  <span className="text-xs text-text-secondary">{mod.total} total</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-border/60">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: accent }}
                    initial={{ width: 0 }}
                    animate={{ width: `${mod.remplissage}%` }}
                    transition={{ duration: 1, ease: [0, 0, 0.58, 1] }}
                  />
                </div>
              </div>
            ))}
          </div>
          <DashboardLinkRow label="Gérer les modules CRM" />
        </DashboardPanel>

        <DashboardPanel title="Prochains Rendez-vous" icon={Calendar} badge={<Badge variant="primary">Aujourd'hui</Badge>}>
          <div className="space-y-1">
            {appointmentData.map(apt => (
              <div key={apt.time + apt.client} className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-background">
                <span className="w-12 flex-shrink-0 text-xs font-semibold">{apt.time}</span>
                <Badge variant={apt.variant}>{apt.type}</Badge>
                <p className="flex-1 truncate text-sm font-medium">{apt.agent} - {apt.client}</p>
              </div>
            ))}
          </div>
          <DashboardLinkRow label="Voir tout le calendrier" />
        </DashboardPanel>
      </div>

      <DashboardPanel title="Actions Rapides" icon={Zap}>
        <div className="flex flex-wrap gap-3">
          {quickActions.map(action => {
            const Icon = action.icon
            return (
              <button
                key={action.label}
                className="group inline-flex items-center gap-2.5 rounded-xl border border-border/50 bg-card px-4 py-3 text-sm font-medium transition-all hover:border-border hover:shadow-card-hover"
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isGerant && (action.color.includes('amber') || action.color.includes('accent-light')) ? 'bg-[#E7D5D5] text-[#905D5D]' : action.color}`}>
                  <Icon size={15} />
                </div>
                <span>{action.label}</span>
              </button>
            )
          })}
        </div>
      </DashboardPanel>
    </>
  )
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [period, setPeriod] = useState<Period>('month')
  const [isGerant, setIsGerant] = useState(false)

  useEffect(() => {
    api.get<any>('/auth/me').then(user => {
      if (user?.role === 'gerant') setIsGerant(true)
    }).catch(() => {})
  }, [])

  const content: Record<string, React.ReactNode> = {
    overview: <OverviewTab isGerant={isGerant} />,
    team: <TeamTab isGerant={isGerant} />,
    performance: <PerformanceTab isGerant={isGerant} />,
    pipeline: <PipelineTab isGerant={isGerant} />,
    market: <MarketTab isGerant={isGerant} />,
    crm: <CrmTab isGerant={isGerant} />,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${isGerant ? 'bg-[#E7D5D5] text-[#905D5D]' : 'bg-amber-100 text-amber-700'}`}>
              <Shield size={19} />
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Administration</h1>
              <p className="text-sm text-text-secondary">Vue d'ensemble de votre agence - Square Meter</p>
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
                    ? 'text-white shadow-sm'
                    : 'text-text-secondary hover:bg-background hover:text-text'
                }`}
                style={period === p.key ? { backgroundColor: isGerant ? ROSE_TAUPE : undefined } : undefined}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <DashboardTabs tabs={tabs} activeId={activeTab} onChange={setActiveTab} columns={6} accentColor={isGerant ? ROSE_TAUPE : undefined} />
      </div>

      <TabContent tabId={activeTab}>
        {content[activeTab]}
      </TabContent>
    </div>
  )
}
