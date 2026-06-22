import { useState } from 'react'
import { motion } from 'framer-motion'
import Card from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import {
  Calendar, Users, Home, DollarSign, TrendingUp, AlertTriangle,
  BarChart2, ChevronRight, Clock, UserPlus, FileText, Globe,
  ArrowUpRight, ArrowDownRight, Edit3, Target
} from 'react-feather'

type Period = 'week' | 'month' | 'quarter' | 'year'

interface KpiData {
  icon: typeof Users
  label: string
  value: string
  trend: string
  trendUp: boolean
  iconBg: string
  iconColor: string
}

interface AlertData {
  icon: typeof AlertTriangle
  text: string
  badge: string
  badgeVariant: 'error' | 'warning'
}

interface StageData {
  value: number
  label: string
  trend: string
}

interface AppointmentData {
  time: string
  type: string
  client: string
  context: string
  badgeVariant: 'primary' | 'success' | 'warning' | 'secondary'
}

interface LeadData {
  initials: string
  initialBg: string
  name: string
  property: string
  time: string
}

interface DocumentData {
  type: string
  client: string
  status: string
  statusVariant: 'success' | 'default' | 'warning'
  time: string
}

interface BarDayData {
  day: string
  calls: number
  visits: number
  signatures: number
}

const periods: { key: Period; label: string }[] = [
  { key: 'week', label: 'Cette semaine' },
  { key: 'month', label: 'Ce mois' },
  { key: 'quarter', label: 'Ce trimestre' },
  { key: 'year', label: 'Cette année' },
]

const kpiData: KpiData[] = [
  { icon: Users, label: 'Prospects', value: '47', trend: '+12%', trendUp: true, iconBg: 'bg-accent-light', iconColor: 'text-accent' },
  { icon: Users, label: 'Contacts', value: '156', trend: '+5%', trendUp: true, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
  { icon: Home, label: 'Biens en stock', value: '89', trend: '-3%', trendUp: false, iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
  { icon: DollarSign, label: 'Ventes ce mois', value: '12', trend: '+20%', trendUp: true, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  { icon: DollarSign, label: 'Honoraires ce mois', value: '342 500 MAD', trend: '+15%', trendUp: true, iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
]

const alertData: AlertData[] = [
  { icon: Target, text: '7 Croisements a faire', badge: 'Haute', badgeVariant: 'error' },
  { icon: FileText, text: '3 Demandes incompletes', badge: 'Haute', badgeVariant: 'error' },
  { icon: Home, text: '1 Produits en attente de correction', badge: 'Moyenne', badgeVariant: 'warning' },
  { icon: Clock, text: '14 Mandats expires', badge: 'Haute', badgeVariant: 'error' },
  { icon: AlertTriangle, text: '5 Mandats expirent bientot', badge: 'Moyenne', badgeVariant: 'warning' },
  { icon: Edit3, text: '2 Signatures de documents attendues', badge: 'Haute', badgeVariant: 'error' },
]

const barData: BarDayData[] = [
  { day: 'L', calls: 6, visits: 2, signatures: 1 },
  { day: 'M', calls: 8, visits: 1, signatures: 1 },
  { day: 'M', calls: 7, visits: 3, signatures: 2 },
  { day: 'J', calls: 10, visits: 1, signatures: 0 },
  { day: 'V', calls: 8, visits: 3, signatures: 2 },
  { day: 'S', calls: 4, visits: 2, signatures: 1 },
  { day: 'D', calls: 2, visits: 0, signatures: 1 },
]

const stageData: StageData[] = [
  { value: 47, label: 'Prospects', trend: '+12%' },
  { value: 32, label: 'En qualification', trend: '+8%' },
  { value: 18, label: 'En recherche', trend: '+15%' },
  { value: 8, label: 'En negociation', trend: '+33%' },
  { value: 5, label: 'En compromis', trend: '+66%' },
  { value: 12, label: 'Vendus', trend: '+20%' },
]

const appointmentData: AppointmentData[] = [
  { time: '14h30', type: 'Visite', client: 'Sophie Martin', context: 'Villa Marrakech', badgeVariant: 'primary' },
  { time: '10h00', type: 'Appel proposition', client: 'Ahmed Benali', context: 'Proposition commerciale', badgeVariant: 'success' },
  { time: '16h00', type: 'Signature mandat', client: 'Mme Dupont', context: 'Mandat de vente', badgeVariant: 'warning' },
  { time: '11h30', type: 'Visite terrain', client: 'Leila Benbrahim', context: 'Terrain Rabat', badgeVariant: 'primary' },
  { time: '09h00', type: 'Reunion equipe', client: 'Toute l\'agence', context: 'Reunion hebdomadaire', badgeVariant: 'secondary' },
]

const leadData: LeadData[] = [
  { initials: 'SM', initialBg: 'bg-accent-light text-accent', name: 'Sophie Martin', property: 'Villa Marrakech', time: 'il y a 15min' },
  { initials: 'AB', initialBg: 'bg-emerald-50 text-emerald-600', name: 'Ahmed Benali', property: 'Appartement Casa', time: 'il y a 2h' },
  { initials: 'LB', initialBg: 'bg-amber-50 text-amber-600', name: 'Leila Benbrahim', property: 'Terrain Rabat', time: 'il y a 5h' },
  { initials: 'YA', initialBg: 'bg-violet-50 text-violet-600', name: 'Youssef Amrani', property: 'Bureau Tanger', time: 'il y a 1j' },
]

const documentData: DocumentData[] = [
  { type: 'Mandat vente', client: 'Villa Argana', status: 'Signe', statusVariant: 'success', time: '2h' },
  { type: 'DPE', client: 'Appartement Centre', status: 'Telecharge', statusVariant: 'default', time: '5h' },
  { type: 'Contrat location', client: 'Residence Oasis', status: 'En attente', statusVariant: 'warning', time: '1j' },
  { type: 'Compromis vente', client: 'Villa Marrakech', status: 'Signe', statusVariant: 'success', time: '2j' },
]

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0, 0, 0.58, 1] as [number, number, number, number] } },
}

const maxBarTotal = Math.max(...barData.map(d => d.calls + d.visits + d.signatures), 1)

export default function Dashboard() {
  const [period, setPeriod] = useState<Period>('month')

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Section 1 — Header + Period Filter */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tableau de bord</h1>
          <p className="text-sm text-text-secondary mt-1">Bienvenue, Karim ! Voici votre activite du jour</p>
        </div>
        <div className="flex items-center gap-1 bg-card rounded-lg border border-border/50 p-1 shadow-sm">
          <Calendar size={15} className="text-text-secondary ml-1" />
          {periods.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
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

      {/* Section 2 — KPI Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {kpiData.map((kpi, i) => {
          const Icon = kpi.icon
          const TrendIcon = kpi.trendUp ? ArrowUpRight : ArrowDownRight
          return (
            <Card key={i} className="p-5 group hover:shadow-card-hover transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-lg ${kpi.iconBg} ${kpi.iconColor}`}>
                  <Icon size={18} />
                </div>
                <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                  kpi.trendUp ? 'text-emerald-600' : 'text-error'
                }`}>
                  <TrendIcon size={12} />
                  {kpi.trend}
                </span>
              </div>
              <p className="text-2xl font-semibold tracking-tight">{kpi.value}</p>
              <p className="text-sm text-text-secondary mt-0.5">{kpi.label}</p>
            </Card>
          )
        })}
      </motion.div>

      {/* Section 3 — Actions Requises + Prochains Rendez-vous */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Actions */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-text" />
              <h2 className="font-semibold">Actions requises</h2>
            </div>
            <Badge variant="error" size="sm">6 en cours</Badge>
          </div>
          <div className="space-y-1">
            {alertData.map((alert, i) => {
              const AlertIcon = alert.icon
              return (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-background transition-colors group cursor-default">
                  <div className="w-7 h-7 rounded-md bg-error/5 text-error flex items-center justify-center flex-shrink-0">
                    <AlertIcon size={13} />
                  </div>
                  <span className="flex-1 text-sm">{alert.text}</span>
                  <Badge variant={alert.badgeVariant} size="sm">{alert.badge}</Badge>
                </div>
              )
            })}
          </div>
          <button className="mt-4 text-sm text-accent hover:text-accent-hover font-medium transition-colors">
            Voir toutes les actions
            <ChevronRight size={14} className="inline ml-0.5" />
          </button>
        </Card>

        {/* Prochains rendez-vous */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-text" />
              <h2 className="font-semibold">Prochains rendez-vous</h2>
            </div>
            <Badge variant="primary" size="sm">Aujourd'hui</Badge>
          </div>
          <div className="space-y-1">
            {appointmentData.map((apt, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-background transition-colors">
                <div className="w-14 flex-shrink-0">
                  <span className="text-xs font-semibold text-text">{apt.time}</span>
                </div>
                <Badge variant={apt.badgeVariant} size="sm">{apt.type}</Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{apt.client}</p>
                </div>
                <span className="text-xs text-text-secondary hidden sm:block truncate max-w-[140px]">{apt.context}</span>
              </div>
            ))}
          </div>
          <button className="mt-4 text-sm text-accent hover:text-accent-hover font-medium transition-colors">
            Voir tout le calendrier
            <ChevronRight size={14} className="inline ml-0.5" />
          </button>
        </Card>
      </motion.div>

      {/* Section 4 — Cycle de Vente */}
      <motion.div variants={itemVariants}>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={16} className="text-text" />
            <h2 className="font-semibold">Cycle de vente</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {stageData.map((stage, i) => (
              <div key={stage.label} className="relative">
                <Card className="p-4 text-center hover:shadow-card-hover transition-shadow">
                  <div className="w-12 h-12 rounded-full bg-accent-light text-accent flex items-center justify-center text-lg font-bold mx-auto mb-2">
                    {stage.value}
                  </div>
                  <p className="text-sm text-text-secondary">{stage.label}</p>
                  <span className="text-xs font-medium text-emerald-600 inline-flex items-center gap-0.5 mt-1">
                    <ArrowUpRight size={10} />
                    {stage.trend}
                  </span>
                </Card>
                {i < stageData.length - 1 && (
                  <ChevronRight
                    size={18}
                    className="hidden lg:block absolute -right-2.5 top-1/2 -translate-y-1/2 text-text-secondary/30 z-10"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-5 pt-4 border-t border-border/30">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-secondary">Taux de conversion global :</span>
              <span className="font-semibold text-emerald-600 inline-flex items-center gap-0.5">
                25.5%
                <ArrowUpRight size={12} />
                +5%
              </span>
            </div>
            <div className="w-px h-4 bg-border/50" />
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-secondary">Delai moyen vente :</span>
              <span className="font-semibold text-accent inline-flex items-center gap-0.5">
                45 jours
                <ArrowDownRight size={12} className="text-emerald-600" />
                <span className="text-emerald-600">-3 jours</span>
              </span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Section 5 — Activite recente */}
      <motion.div variants={itemVariants}>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 size={16} className="text-text" />
              <h2 className="font-semibold">Activite recente</h2>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="flex items-end justify-between h-[160px] pt-2 pb-1 px-1">
            {barData.map((day) => {
              const total = day.calls + day.visits + day.signatures
              const colPct = (total / maxBarTotal) * 100
              const callsPct = total > 0 ? (day.calls / total) * 100 : 0
              const visitsPct = total > 0 ? (day.visits / total) * 100 : 0
              const sigsPct = total > 0 ? (day.signatures / total) * 100 : 0
              return (
                <div key={day.day} className="flex flex-col items-center gap-1.5 flex-1 h-full justify-end">
                  <div
                    className="w-[70%] max-w-[32px] flex flex-col justify-end rounded-sm overflow-hidden transition-all duration-300 hover:opacity-80"
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

          {/* Legend */}
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

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-accent-light/50 rounded-lg p-3 text-center">
              <p className="text-lg font-semibold text-accent">45</p>
              <p className="text-[11px] text-text-secondary">appels cette semaine</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3 text-center">
              <p className="text-lg font-semibold text-emerald-600">12</p>
              <p className="text-[11px] text-text-secondary">visites terrain</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <p className="text-lg font-semibold text-amber-600">8</p>
              <p className="text-[11px] text-text-secondary">documents signes</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Section 6 — Performance Financiere */}
      <motion.div variants={itemVariants}>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-5">
            <DollarSign size={16} className="text-text" />
            <h2 className="font-semibold">Performance financiere</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chiffre d'affaires */}
            <div className="bg-background rounded-xl p-5">
              <p className="text-xs text-text-secondary uppercase tracking-wider font-medium mb-1">Chiffre d'affaires</p>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-bold tracking-tight">342 500 MAD</span>
                <span className="text-sm font-medium text-emerald-600 inline-flex items-center gap-0.5">
                  <ArrowUpRight size={13} />
                  +15%
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-text-secondary mt-0.5">
                <span>Mois dernier: 298 000 MAD</span>
                <span className="w-1 h-1 rounded-full bg-text-secondary/30" />
                <span className="text-error/70">-3,2%</span>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-text-secondary">Objectif: 400 000 MAD</span>
                  <span className="font-semibold">85%</span>
                </div>
                <div className="w-full h-2.5 bg-border/60 rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: '85%' }} />
                </div>
              </div>
            </div>

            {/* Repartition par type */}
            <div className="bg-background rounded-xl p-5">
              <p className="text-xs text-text-secondary uppercase tracking-wider font-medium mb-4">Repartition par type</p>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm bg-accent" />
                      <span>Vente</span>
                    </div>
                    <span className="font-semibold">78%</span>
                  </div>
                  <div className="w-full h-2 bg-border/60 rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: '78%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
                      <span>Location</span>
                    </div>
                    <span className="font-semibold">15%</span>
                  </div>
                  <div className="w-full h-2 bg-border/60 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full transition-all duration-500" style={{ width: '15%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
                      <span>Saisonnier</span>
                    </div>
                    <span className="font-semibold">7%</span>
                  </div>
                  <div className="w-full h-2 bg-border/60 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: '7%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Section 7 — Derniers Leads + Derniers Documents */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Derniers Leads */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UserPlus size={16} className="text-text" />
              <h2 className="font-semibold">Derniers leads</h2>
            </div>
            <Badge variant="primary" size="sm">4 nouveaux</Badge>
          </div>
          <div className="space-y-2">
            {leadData.map((lead, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-background transition-colors">
                <div className={`w-9 h-9 rounded-full ${lead.initialBg} flex items-center justify-center text-xs font-semibold flex-shrink-0`}>
                  {lead.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{lead.name}</p>
                  <p className="text-xs text-text-secondary truncate">{lead.property}</p>
                </div>
                <span className="text-xs text-text-secondary/60 flex-shrink-0">{lead.time}</span>
              </div>
            ))}
          </div>
          <button className="mt-4 text-sm text-accent hover:text-accent-hover font-medium transition-colors">
            Voir tous les prospects
            <ChevronRight size={14} className="inline ml-0.5" />
          </button>
        </Card>

        {/* Derniers Documents */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-text" />
              <h2 className="font-semibold">Derniers documents</h2>
            </div>
            <Badge variant="primary" size="sm">4 recents</Badge>
          </div>
          <div className="space-y-2">
            {documentData.map((doc, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-background transition-colors">
                <div className="w-8 h-8 rounded-lg bg-accent-light text-accent flex items-center justify-center flex-shrink-0">
                  <FileText size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{doc.type}</p>
                  <p className="text-xs text-text-secondary truncate">{doc.client}</p>
                </div>
                <Badge variant={doc.statusVariant} size="sm">{doc.status}</Badge>
                <span className="text-xs text-text-secondary/60 flex-shrink-0 w-6 text-right">{doc.time}</span>
              </div>
            ))}
          </div>
          <button className="mt-4 text-sm text-accent hover:text-accent-hover font-medium transition-colors">
            Voir tous les documents
            <ChevronRight size={14} className="inline ml-0.5" />
          </button>
        </Card>
      </motion.div>

      {/* Section 8 — Activite Extranet */}
      <motion.div variants={itemVariants}>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-5">
            <Globe size={16} className="text-text" />
            <h2 className="font-semibold">Activite Extranet</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
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
              <p className="text-xs text-text-secondary mt-0.5">Clients actifs</p>
            </div>
            <div className="bg-background rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">45</p>
              <p className="text-xs text-text-secondary mt-0.5">Documents consultes</p>
            </div>
          </div>

          <div className="border-t border-border/30 pt-4">
            <p className="text-xs text-text-secondary uppercase tracking-wider font-medium mb-3">Dernieres connexions</p>
            <div className="space-y-2">
              {[
                { name: 'Sophie Martin', property: 'Villa Marrakech', time: 'il y a 10min', initials: 'SM', color: 'bg-accent-light text-accent' },
                { name: 'Pierre Dubois', property: 'Appartement Casa', time: 'il y a 45min', initials: 'PD', color: 'bg-emerald-50 text-emerald-600' },
                { name: 'Leila Benbrahim', property: 'Terrain Rabat', time: 'il y a 2h', initials: 'LB', color: 'bg-amber-50 text-amber-600' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-background transition-colors">
                  <div className={`w-8 h-8 rounded-full ${item.color} flex items-center justify-center text-xs font-semibold`}>
                    {item.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-text-secondary">{item.property}</p>
                  </div>
                  <span className="text-xs text-text-secondary/60">{item.time}</span>
                </div>
              ))}
            </div>
          </div>

          <button className="mt-4 text-sm text-accent hover:text-accent-hover font-medium transition-colors">
            Voir le detail extranet
            <ChevronRight size={14} className="inline ml-0.5" />
          </button>
        </Card>
      </motion.div>
    </motion.div>
  )
}
