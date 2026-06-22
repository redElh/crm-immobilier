import { useState } from 'react'
import { motion } from 'framer-motion'
import Card from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import {
  Users, Shield, Activity, TrendingUp, ArrowUpRight, ArrowDownRight,
  Calendar, Home, DollarSign, FileText, Settings, AlertTriangle,
  Target, Edit3, Clock, Award, BarChart2, Globe,
  CheckCircle, Crosshair, Zap, UserPlus, Download,
  ChevronRight, Layout, Monitor
} from 'react-feather'

type Period = 'today' | 'week' | 'month' | 'quarter' | 'year'

const periods: { key: Period; label: string }[] = [
  { key: 'today', label: "Aujourd'hui" },
  { key: 'week', label: 'Cette semaine' },
  { key: 'month', label: 'Ce mois' },
  { key: 'quarter', label: 'Ce trimestre' },
  { key: 'year', label: 'Cette année' },
]

const kpiCards = [
  { icon: Users, label: 'Agents', value: '12', trend: '+8%', trendUp: true, iconBg: 'bg-blue-50', iconColor: 'text-blue-600', vs: 'vs mois dernier' },
  { icon: Crosshair, label: 'Prospects', value: '156', trend: '+12%', trendUp: true, iconBg: 'bg-accent-light', iconColor: 'text-accent', vs: 'vs mois dernier' },
  { icon: Home, label: 'Biens en stock', value: '89', trend: '-3%', trendUp: false, iconBg: 'bg-amber-50', iconColor: 'text-amber-600', vs: 'vs mois dernier' },
  { icon: TrendingUp, label: 'Ventes ce mois', value: '12', trend: '+20%', trendUp: true, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', vs: 'vs mois dernier' },
  { icon: DollarSign, label: 'CA ce mois', value: '342 500', trend: '+15%', trendUp: true, iconBg: 'bg-violet-50', iconColor: 'text-violet-600', vs: 'vs mois dernier' },
]

const agentRankings = [
  { rank: 1, name: 'Myriam ABABOU', initials: 'MA', ventes: 8, volume: 45, ca: 112000, tauxConv: 28, trend: 'up', trendVal: '+12%' },
  { rank: 2, name: 'Karim Eloui', initials: 'KE', ventes: 5, volume: 38, ca: 75000, tauxConv: 22, trend: 'up', trendVal: '+5%' },
  { rank: 3, name: 'Yasmine AATIC', initials: 'YA', ventes: 4, volume: 32, ca: 52000, tauxConv: 18, trend: 'down', trendVal: '-2%' },
  { rank: 4, name: 'Dimitri DJEDJE', initials: 'DD', ventes: 3, volume: 28, ca: 40000, tauxConv: 15, trend: 'flat', trendVal: '0%' },
  { rank: 5, name: 'Hayat OUAKRIM', initials: 'HO', ventes: 2, volume: 22, ca: 30000, tauxConv: 12, trend: 'up', trendVal: '+3%' },
]

const alerts = [
  { icon: FileText, text: '14 Mandats expirés', priority: 'Haute', variant: 'error' as const },
  { icon: Target, text: '7 Croisements a faire', priority: 'Haute', variant: 'error' as const },
  { icon: Clock, text: '3 Prospects non contactés (+7j)', priority: 'Haute', variant: 'error' as const },
  { icon: Home, text: '2 Biens sans photo principale', priority: 'Haute', variant: 'error' as const },
  { icon: Users, text: '1 Agent inactif (30j)', priority: 'Moyenne', variant: 'warning' as const },
  { icon: Edit3, text: '2 Signatures de documents attendues', priority: 'Haute', variant: 'error' as const },
]

const barData = [
  { day: 'L', calls: 6, visits: 2, signatures: 1 },
  { day: 'M', calls: 8, visits: 1, signatures: 1 },
  { day: 'M', calls: 7, visits: 3, signatures: 2 },
  { day: 'J', calls: 10, visits: 1, signatures: 0 },
  { day: 'V', calls: 8, visits: 3, signatures: 2 },
  { day: 'S', calls: 4, visits: 2, signatures: 1 },
  { day: 'D', calls: 2, visits: 0, signatures: 1 },
]

const pipelineStages = [
  { label: 'Prospects', value: 156, trend: '+18%' },
  { label: 'En qualification', value: 98, trend: '+12%' },
  { label: 'En recherche', value: 56, trend: '+8%' },
  { label: 'En négociation', value: 24, trend: '+20%' },
  { label: 'En compromis', value: 12, trend: '+33%' },
  { label: 'Vendus', value: 28, trend: '+22%' },
]

const portalData = [
  { name: 'Mubawab', clics: 142, prospects: 12, pct: 45, color: 'bg-blue-500' },
  { name: 'Properstar', clics: 98, prospects: 8, pct: 30, color: 'bg-emerald-500' },
  { name: 'Green-Acres', clics: 45, prospects: 3, pct: 15, color: 'bg-amber-500' },
  { name: 'Avito', clics: 32, prospects: 2, pct: 10, color: 'bg-violet-500' },
]

const propertyTypeData = [
  { type: 'Residentiel', ventes: 8, ca: 220000, duree: 45, rotation: 12 },
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
  { time: '14h30', type: 'Visite', agent: 'Myriam', client: 'Villa Marrakech', badgeVariant: 'primary' as const },
  { time: '10h00', type: 'Appel proposition', agent: 'Karim', client: 'Proposition commerciale', badgeVariant: 'success' as const },
  { time: '16h00', type: 'Signature mandat', agent: 'Yasmine', client: 'Mandat de vente', badgeVariant: 'warning' as const },
  { time: '11h30', type: 'Visite terrain', agent: 'Dimitri', client: 'Terrain Rabat', badgeVariant: 'primary' as const },
  { time: '09h00', type: 'Réunion équipe', agent: 'Toute l\'agence', client: 'Réunion hebdomadaire', badgeVariant: 'secondary' as const },
]

const modulePcts = [
  { name: 'Prospects', pct: 35, color: 'bg-accent' },
  { name: 'Clients', pct: 20, color: 'bg-emerald-500' },
  { name: 'Biens', pct: 18, color: 'bg-amber-500' },
  { name: 'Contrats', pct: 12, color: 'bg-violet-500' },
  { name: 'Documents', pct: 10, color: 'bg-blue-500' },
  { name: 'Autre', pct: 5, color: 'bg-slate-400' },
]

const maxBarTotal = Math.max(...barData.map(d => d.calls + d.visits + d.signatures), 1)
const maxPortalPct = Math.max(...portalData.map(p => p.pct), 1)

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.03 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0, 0, 0.58, 1] as [number, number, number, number] } },
}

function formatCurrency(val: number): string {
  return val.toLocaleString('fr-FR') + ' MAD'
}

export default function AdminDashboard() {
  const [period, setPeriod] = useState<Period>('month')

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Shield size={20} className="text-amber-700" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Administration</h1>
            <p className="text-sm text-text-secondary mt-0.5">Vue d'ensemble de votre agence - Square Meter</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-card rounded-lg border border-border/50 p-1 shadow-sm">
          <Calendar size={14} className="text-text-secondary ml-1" />
          {periods.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                period === p.key
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-text-secondary hover:text-text hover:bg-background'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* KPI Stratégiques */}
      <motion.div variants={itemVariants}>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={16} className="text-text" />
            <h2 className="font-semibold">KPI Stratégiques</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {kpiCards.map((kpi, i) => {
              const Icon = kpi.icon
              const TrendIcon = kpi.trendUp ? ArrowUpRight : ArrowDownRight
              return (
                <div key={i} className="p-4 rounded-xl border border-border/50 hover:shadow-card-hover transition-all group">
                  <div className="flex items-start justify-between mb-2">
                    <div className={`p-2.5 rounded-lg ${kpi.iconBg} ${kpi.iconColor}`}>
                      <Icon size={18} />
                    </div>
                    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                      kpi.trendUp ? 'text-emerald-600' : 'text-error'
                    }`}>
                      <TrendIcon size={11} />
                      {kpi.trend}
                    </span>
                  </div>
                  <p className="text-2xl font-semibold tracking-tight">{kpi.value}</p>
                  <p className="text-sm text-text-secondary mt-0.5">{kpi.label}</p>
                  <p className="text-[11px] text-text-secondary/60 mt-0.5">{kpi.vs}</p>
                </div>
              )
            })}
          </div>
        </Card>
      </motion.div>

      {/* Performance de l'Équipe */}
      <motion.div variants={itemVariants}>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award size={16} className="text-text" />
              <h2 className="font-semibold">Performance de l'Équipe</h2>
            </div>
            <Badge variant="primary" size="sm">Ce mois</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 text-left text-xs text-text-secondary">
                  <th className="pb-3 font-medium w-8">#</th>
                  <th className="pb-3 font-medium">Agent</th>
                  <th className="pb-3 font-medium text-right">Ventes</th>
                  <th className="pb-3 font-medium text-right">Volume</th>
                  <th className="pb-3 font-medium text-right">CA généré</th>
                  <th className="pb-3 font-medium text-right">Taux conv.</th>
                  <th className="pb-3 font-medium text-right">Tendance</th>
                </tr>
              </thead>
              <tbody>
                {agentRankings.map((agent) => (
                  <tr key={agent.rank} className="border-b border-border/20 hover:bg-background/50 transition-colors">
                    <td className="py-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                        agent.rank === 1 ? 'bg-amber-100 text-amber-700' :
                        agent.rank === 2 ? 'bg-slate-100 text-slate-600' :
                        agent.rank === 3 ? 'bg-orange-100 text-orange-700' :
                        'bg-background text-text-secondary'
                      }`}>
                        {agent.rank}
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                          agent.rank <= 3 ? 'bg-accent-light text-accent' : 'bg-background text-text-secondary'
                        }`}>
                          {agent.initials}
                        </div>
                        <span className="font-medium">{agent.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-right font-medium">{agent.ventes}</td>
                    <td className="py-3 text-right text-text-secondary">{agent.volume}</td>
                    <td className="py-3 text-right font-medium">{formatCurrency(agent.ca)}</td>
                    <td className="py-3 text-right">
                      <span className={`font-medium ${
                        agent.tauxConv >= 20 ? 'text-emerald-600' : agent.tauxConv >= 15 ? 'text-amber-600' : 'text-text-secondary'
                      }`}>
                        {agent.tauxConv}%
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                        agent.trend === 'up' ? 'text-emerald-600' :
                        agent.trend === 'down' ? 'text-error' : 'text-text-secondary'
                      }`}>
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
          <button className="mt-4 text-sm text-accent hover:text-accent-hover font-medium transition-colors inline-flex items-center gap-1">
            Voir le detail des performances
            <ChevronRight size={14} />
          </button>
        </Card>
      </motion.div>

      {/* Alertes + Activité Récente */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-text" />
              <h2 className="font-semibold">Alertes et Actions</h2>
            </div>
            <Badge variant="error" size="sm">{alerts.length} alertes</Badge>
          </div>
          <div className="space-y-1">
            {alerts.map((alert, i) => {
              const AlertIcon = alert.icon
              return (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-background transition-colors group cursor-default">
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                    alert.variant === 'error' ? 'bg-error/5 text-error' : 'bg-amber-50 text-amber-600'
                  }`}>
                    <AlertIcon size={13} />
                  </div>
                  <span className="flex-1 text-sm">{alert.text}</span>
                  <Badge variant={alert.variant} size="sm">{alert.priority}</Badge>
                </div>
              )
            })}
          </div>
          <button className="mt-4 text-sm text-accent hover:text-accent-hover font-medium transition-colors inline-flex items-center gap-1">
            Voir toutes les alertes
            <ChevronRight size={14} />
          </button>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-text" />
              <h2 className="font-semibold">Activité Récente</h2>
            </div>
            <Badge variant="primary" size="sm">7 derniers jours</Badge>
          </div>
          <div className="flex items-end justify-between h-[140px] pt-2 pb-1 px-1">
            {barData.map((day) => {
              const total = day.calls + day.visits + day.signatures
              const colPct = (total / maxBarTotal) * 100
              const callsPct = total > 0 ? (day.calls / total) * 100 : 0
              const visitsPct = total > 0 ? (day.visits / total) * 100 : 0
              const sigsPct = total > 0 ? (day.signatures / total) * 100 : 0
              return (
                <div key={day.day} className="flex flex-col items-center gap-1.5 flex-1 h-full justify-end">
                  <div
                    className="w-[70%] max-w-[28px] flex flex-col justify-end rounded-sm overflow-hidden transition-all duration-300 hover:opacity-80"
                    style={{ height: `${colPct}%` }}
                  >
                    {day.signatures > 0 && (
                      <div className="w-full bg-amber-400" style={{ height: `${sigsPct}%` }} />
                    )}
                    {day.visits > 0 && (
                      <div className="w-full bg-emerald-400" style={{ height: `${visitsPct}%` }} />
                    )}
                    {day.calls > 0 && (
                      <div className="w-full bg-accent" style={{ height: `${callsPct}%` }} />
                    )}
                  </div>
                  <span className="text-[11px] text-text-secondary font-medium">{day.day}</span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-center gap-5 mt-3 pt-3 border-t border-border/30">
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <span className="w-2.5 h-2.5 rounded-sm bg-accent" />
              Appels
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
              Visites
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
              Signatures
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-accent-light/50 rounded-lg p-3 text-center">
              <p className="text-lg font-semibold text-accent">156</p>
              <p className="text-[11px] text-text-secondary">appels cette semaine</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3 text-center">
              <p className="text-lg font-semibold text-emerald-600">42</p>
              <p className="text-[11px] text-text-secondary">visites terrain</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <p className="text-lg font-semibold text-amber-600">28</p>
              <p className="text-[11px] text-text-secondary">documents signés</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Pipeline Global */}
      <motion.div variants={itemVariants}>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={16} className="text-text" />
            <h2 className="font-semibold">Pipeline Global</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {pipelineStages.map((stage, i) => (
              <div key={stage.label} className="relative">
                <div className="p-4 rounded-xl border border-border/50 bg-card text-center hover:shadow-card-hover transition-all">
                  <div className="w-12 h-12 rounded-full bg-accent-light text-accent flex items-center justify-center text-lg font-bold mx-auto mb-2">
                    {stage.value}
                  </div>
                  <p className="text-sm text-text-secondary">{stage.label}</p>
                  <span className="text-xs font-medium text-emerald-600 inline-flex items-center gap-0.5 mt-1">
                    <ArrowUpRight size={10} />
                    {stage.trend}
                  </span>
                </div>
                {i < pipelineStages.length - 1 && (
                  <ChevronRight
                    size={16}
                    className="hidden lg:block absolute -right-2.5 top-1/2 -translate-y-1/2 text-text-secondary/20 z-10"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-5 pt-4 border-t border-border/30">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-secondary">Taux de conversion global :</span>
              <span className="font-semibold text-emerald-600 inline-flex items-center gap-0.5">
                17.9%
                <ArrowUpRight size={12} />
                +4%
              </span>
            </div>
            <div className="w-px h-4 bg-border/50" />
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-secondary">Délai moyen vente :</span>
              <span className="font-semibold text-accent inline-flex items-center gap-0.5">
                42 jours
                <ArrowDownRight size={12} className="text-emerald-600" />
                <span className="text-emerald-600">-5 jours</span>
              </span>
            </div>
            <div className="w-px h-4 bg-border/50" />
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-secondary">Objectif mensuel :</span>
              <span className="font-semibold text-accent">35 / 30</span>
              <Badge variant="success" size="sm">Atteint</Badge>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Performance Financière + Répartition par Module */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-5">
            <DollarSign size={16} className="text-text" />
            <h2 className="font-semibold">Performance Financière</h2>
          </div>
          <div className="bg-background rounded-xl p-5 mb-5">
            <p className="text-xs text-text-secondary uppercase tracking-wider font-medium mb-2">Chiffre d'affaires</p>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-bold tracking-tight">342 500 MAD</span>
              <span className="text-sm font-medium text-emerald-600 inline-flex items-center gap-0.5">
                <ArrowUpRight size={13} />
                +15%
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-text-secondary mt-1">
              <span>Objectif: 400 000 MAD</span>
              <span className="w-1 h-1 rounded-full bg-text-secondary/30" />
              <span className="text-error/70">Écart: -57 500 MAD</span>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-text-secondary">Progression</span>
                <span className="font-semibold">85%</span>
              </div>
              <div className="w-full h-2.5 bg-border/60 rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: '85%' }} />
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs text-text-secondary uppercase tracking-wider font-medium mb-3">Répartition par agent</p>
            <div className="space-y-3">
              {agentRankings.map((agent) => (
                <div key={agent.name} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-28 truncate">{agent.name.split(' ')[0]}</span>
                  <div className="flex-1 h-2 bg-border/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        agent.rank === 1 ? 'bg-accent' :
                        agent.rank === 2 ? 'bg-emerald-500' :
                        agent.rank === 3 ? 'bg-amber-500' :
                        'bg-violet-400'
                      }`}
                      style={{ width: `${agent.tauxConv * 3}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-text-secondary w-12 text-right">{agent.tauxConv}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-5">
            <BarChart2 size={16} className="text-text" />
            <h2 className="font-semibold">Répartition par Module</h2>
          </div>
          <div className="space-y-4">
            {modulePcts.map((mod) => (
              <div key={mod.name}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-sm ${mod.color}`} />
                    <span>{mod.name}</span>
                  </div>
                  <span className="font-semibold">{mod.pct}%</span>
                </div>
                <div className="w-full h-2 bg-border/60 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${mod.color}`} style={{ width: `${mod.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-border/30">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Taux d'utilisation global</span>
              <span className="font-semibold text-emerald-600">82%</span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Activité Extranet & Portals */}
      <motion.div variants={itemVariants}>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-text" />
              <h2 className="font-semibold">Activité Extranet & Portails</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div className="bg-background rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-accent">124</p>
              <p className="text-xs text-text-secondary mt-0.5">Connexions cette semaine</p>
              <span className="text-xs font-medium text-emerald-600 inline-flex items-center gap-0.5 mt-1">
                <ArrowUpRight size={10} />
                +18%
              </span>
            </div>
            <div className="bg-background rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">23</p>
              <p className="text-xs text-text-secondary mt-0.5">Clients actifs sur extranet</p>
            </div>
          </div>
          <div className="border-t border-border/30 pt-4">
            <p className="text-xs text-text-secondary uppercase tracking-wider font-medium mb-3">Portails partenaires</p>
            <div className="space-y-3">
              {portalData.map((portal) => (
                <div key={portal.name} className="flex items-center gap-4">
                  <span className="text-sm font-medium w-28">{portal.name}</span>
                  <div className="flex-1 h-2 bg-border/60 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${portal.color}`} style={{ width: `${portal.pct}%` }} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-secondary w-32 text-right">
                    <span>{portal.clics} clics</span>
                    <span className="text-accent font-medium">{portal.prospects} prospects</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button className="mt-4 text-sm text-accent hover:text-accent-hover font-medium transition-colors inline-flex items-center gap-1">
            Voir le detail des portails
            <ChevronRight size={14} />
          </button>
        </Card>
      </motion.div>

      {/* Performance par Type de Bien */}
      <motion.div variants={itemVariants}>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Layout size={16} className="text-text" />
            <h2 className="font-semibold">Performance par Type de Bien</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 text-left text-xs text-text-secondary">
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium text-right">Ventes</th>
                  <th className="pb-3 font-medium text-right">CA généré</th>
                  <th className="pb-3 font-medium text-right">Durée moyenne vente</th>
                  <th className="pb-3 font-medium text-right">Taux rotation</th>
                </tr>
              </thead>
              <tbody>
                {propertyTypeData.map((pt) => (
                  <tr key={pt.type} className="border-b border-border/20 hover:bg-background/50 transition-colors">
                    <td className="py-3 font-medium">{pt.type}</td>
                    <td className="py-3 text-right">{pt.ventes}</td>
                    <td className="py-3 text-right font-medium">{pt.ca > 0 ? formatCurrency(pt.ca) : '-'}</td>
                    <td className="py-3 text-right">{pt.duree > 0 ? `${pt.duree} jours` : '-'}</td>
                    <td className="py-3 text-right">
                      <span className={`font-medium ${
                        pt.rotation >= 15 ? 'text-emerald-600' : pt.rotation >= 8 ? 'text-amber-600' : 'text-text-secondary'
                      }`}>
                        {pt.rotation}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      {/* Vue d'ensemble CRM */}
      <motion.div variants={itemVariants}>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Monitor size={16} className="text-text" />
              <h2 className="font-semibold">Vue d'ensemble du CRM</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-text-secondary">Santé: 85%</span>
              </div>
              <Badge variant="success" size="sm">Bon</Badge>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 text-left text-xs text-text-secondary">
                  <th className="pb-3 font-medium">Module</th>
                  <th className="pb-3 font-medium text-right">Total</th>
                  <th className="pb-3 font-medium text-right">Actif</th>
                  <th className="pb-3 font-medium text-right">Inactif</th>
                  <th className="pb-3 font-medium text-right">Taux remplissage</th>
                  <th className="pb-3 font-medium text-right">Alerte</th>
                </tr>
              </thead>
              <tbody>
                {crmModules.map((mod) => (
                  <tr key={mod.name} className="border-b border-border/20 hover:bg-background/50 transition-colors">
                    <td className="py-3 font-medium">{mod.name}</td>
                    <td className="py-3 text-right">{mod.total}</td>
                    <td className="py-3 text-right text-emerald-600">{mod.actif}</td>
                    <td className="py-3 text-right text-text-secondary">{mod.inactif}</td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className={`font-medium ${
                          mod.remplissage >= 80 ? 'text-emerald-600' :
                          mod.remplissage >= 60 ? 'text-amber-600' : 'text-error'
                        }`}>
                          {mod.remplissage}%
                        </span>
                        <div className="w-16 h-1.5 bg-border/60 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              mod.remplissage >= 80 ? 'bg-emerald-500' :
                              mod.remplissage >= 60 ? 'bg-amber-500' : 'bg-error'
                            }`}
                            style={{ width: `${mod.remplissage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                        mod.alerteType === 'warning' ? 'text-amber-600' :
                        mod.alerteType === 'success' ? 'text-emerald-600' : 'text-text-secondary'
                      }`}>
                        {mod.alerteType === 'warning' && <AlertTriangle size={10} />}
                        {mod.alerteType === 'success' && <CheckCircle size={10} />}
                        {mod.alerte}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/30 text-xs text-text-secondary">
            <span>Santé globale du CRM: <span className="font-semibold text-emerald-600">85% (Bon)</span></span>
            <span className="w-px h-3 bg-border/50" />
            <span>Dernière sauvegarde: 13/06/2026 02:00</span>
          </div>
        </Card>
      </motion.div>

      {/* Derniers Utilisateurs + Prochains Rendez-vous */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UserPlus size={16} className="text-text" />
              <h2 className="font-semibold">Derniers Utilisateurs</h2>
            </div>
            <Badge variant="primary" size="sm">{recentUsers.length} nouveaux</Badge>
          </div>
          <div className="space-y-2">
            {recentUsers.map((user) => (
              <div key={user.name} className="flex items-center gap-3 p-3 rounded-lg hover:bg-background transition-colors">
                <div className={`w-9 h-9 rounded-full ${user.color} flex items-center justify-center text-xs font-semibold`}>
                  {user.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-text-secondary">{user.action}</p>
                </div>
              </div>
            ))}
          </div>
          <a href="/admin/users" className="mt-4 text-sm text-accent hover:text-accent-hover font-medium transition-colors inline-flex items-center gap-1">
            Voir tous les utilisateurs
            <ChevronRight size={14} />
          </a>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-text" />
              <h2 className="font-semibold">Prochains Rendez-vous</h2>
            </div>
            <Badge variant="primary" size="sm">Aujourd'hui</Badge>
          </div>
          <div className="space-y-1">
            {appointmentData.map((apt, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-background transition-colors">
                <div className="w-12 flex-shrink-0">
                  <span className="text-xs font-semibold text-text">{apt.time}</span>
                </div>
                <Badge variant={apt.badgeVariant} size="sm">{apt.type}</Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{apt.agent} - {apt.client}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-4 text-sm text-accent hover:text-accent-hover font-medium transition-colors inline-flex items-center gap-1">
            Voir tout le calendrier
            <ChevronRight size={14} />
          </button>
        </Card>
      </motion.div>

      {/* Actions Rapides */}
      <motion.div variants={itemVariants}>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} className="text-text" />
            <h2 className="font-semibold">Actions Rapides</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { icon: UserPlus, label: 'Ajouter un agent', color: 'bg-accent-light text-accent' },
              { icon: Users, label: 'Inviter un collaborateur', color: 'bg-emerald-50 text-emerald-600' },
              { icon: Download, label: 'Exporter le rapport', color: 'bg-violet-50 text-violet-600' },
              { icon: Settings, label: 'Configurer l\'agence', color: 'bg-amber-50 text-amber-600' },
              { icon: FileText, label: 'Voir les logs système', color: 'bg-blue-50 text-blue-600' },
            ].map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.label}
                  className="inline-flex items-center gap-2.5 px-4 py-3 rounded-xl border border-border/50 bg-card hover:shadow-card-hover hover:border-border transition-all text-sm font-medium group"
                >
                  <div className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center`}>
                    <Icon size={15} />
                  </div>
                  <span>{action.label}</span>
                </button>
              )
            })}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}
