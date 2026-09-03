import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Search, Plus, X, Hash, Briefcase, Users, Clock, Calendar, DollarSign, Tag, Shield } from 'react-feather'
import { Badge } from '../../ui/Badge'
import { Button } from '../../ui/Button'
import { Select } from '../../ui/Select'
import {
  getPropertyTransactions,
  MANDAT_TYPE_LABELS,
  TRANSACTION_ETAPE_LABELS,
  TRANSACTION_ETAPE_COLORS,
  transactionFilters,
} from '../../../types/transactions'
import type { MandatType, TransactionEtape } from '../../../types/transactions'
import { TransactionActions } from '../transactions/TransactionActionDialogs'
import { useStageChrome } from '../calendar/useStageChrome'
import { useStageFormClasses } from '../calendar/StageModal'
import {
  OrbIcon,
  TiltCard,
  StageBadge,
  StageButton,
  STAGE_HUES,
  SLATE_HUE,
} from '../../dashboard/Stage'

const roleColor = (role: string, isGerant: boolean) => {
  switch (role) {
    case 'Vendeur': case 'Propriétaire': return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
    case 'Acheteur': case 'Acquéreur': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    case 'Locataire': return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
    case 'Bailleur': return isGerant ? 'bg-[#905D5D]/10 text-[#905D5D] border-[#905D5D]/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'
    case 'Voyageur': return 'bg-pink-500/10 text-pink-500 border-pink-500/20'
    default: return 'bg-text-secondary/10 text-text-secondary border-text-secondary/20'
  }
}

const TYPE_HUE: Record<string, typeof STAGE_HUES[keyof typeof STAGE_HUES]> = {
  simple: STAGE_HUES.violet,
  co_exclusif: STAGE_HUES.sky,
  exclusif: STAGE_HUES.amber,
  exclusif_agence: STAGE_HUES.fuchsia,
  delegation: SLATE_HUE,
  confrere: SLATE_HUE,
  recherche_achat: STAGE_HUES.sky,
  location_gestion: STAGE_HUES.emerald,
  recherche_location: STAGE_HUES.emerald,
  location_saisonniere: STAGE_HUES.violet,
}

const ETAPE_VARIANT: Record<string, 'ok' | 'warn' | 'neutral' | 'danger' | 'violet'> = {
  reservation: 'warn',
  signe: 'ok',
  annule: 'danger',
  cloture: 'neutral',
  actif: 'ok',
  en_attente: 'warn',
  expire: 'neutral',
  resilie: 'danger',
}

const ETAPE_HUE: Record<string, typeof STAGE_HUES[keyof typeof STAGE_HUES]> = {
  reservation: STAGE_HUES.amber,
  signe: STAGE_HUES.emerald,
  annule: SLATE_HUE,
  cloture: STAGE_HUES.sky,
  actif: STAGE_HUES.emerald,
  en_attente: STAGE_HUES.amber,
  expire: SLATE_HUE,
  resilie: STAGE_HUES.fuchsia,
}

export const PropertyTransactionsTab = ({ propertyId, propertyTitle, propertyRef, isGerant = false }: {
  propertyId: string
  propertyTitle: string
  propertyRef: string
  isGerant?: boolean
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterEtape, setFilterEtape] = useState<string>('all')

  const { staged, dark } = useStageChrome()
  const { input } = useStageFormClasses()
  const ctrl = (extra?: string) => (staged ? input(extra) : undefined)

  const transactions = useMemo(() => getPropertyTransactions(propertyId), [propertyId])

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!t.reference.toLowerCase().includes(q) &&
            !t.clientName.toLowerCase().includes(q) &&
            !MANDAT_TYPE_LABELS[t.type].toLowerCase().includes(q) &&
            !TRANSACTION_ETAPE_LABELS[t.etape].toLowerCase().includes(q)) return false
      }
      if (filterType !== 'all' && t.type !== filterType) return false
      if (filterEtape !== 'all' && t.etape !== filterEtape) return false
      return true
    })
  }, [transactions, searchQuery, filterType, filterEtape])

  const typeOptions = [
    { value: 'all', label: 'Tous les types' },
    ...transactionFilters.types,
  ]

  const etapeOptions = [
    { value: 'all', label: 'Tous les statuts' },
    ...transactionFilters.etapes,
  ]

  const stats = useMemo(() => {
    const byType: Record<string, number> = {}
    const byEtape: Record<string, number> = {}
    for (const t of transactions) {
      byType[t.type] = (byType[t.type] || 0) + 1
      byEtape[t.etape] = (byEtape[t.etape] || 0) + 1
    }
    return { total: transactions.length, byType, byEtape }
  }, [transactions])

  if (transactions.length === 0) {
    if (staged) {
      return (
        <div className="stage-glass flex flex-col items-center justify-center gap-3 py-14 text-center">
          <OrbIcon icon={FileText} hue={SLATE_HUE} size={48} radius={15} />
          <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>Aucune transaction pour ce bien</p>
          <p className={`max-w-sm text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Les transactions apparaîtront automatiquement à la signature d'un mandat</p>
          <p className={`mt-1 font-mono text-[11px] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{propertyRef || propertyTitle}</p>
        </div>
      )
    }
    return (
      <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
        <FileText size={32} className="mb-3 opacity-40" />
        <p className="text-sm">Aucune transaction pour ce bien</p>
        <p className="text-xs text-text-secondary/60 mt-1">Les transactions apparaitront automatiquement a la signature d'un mandat</p>
      </div>
    )
  }

  if (!staged) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-xs text-text-secondary">
            {filtered.length} transaction{filtered.length !== 1 ? 's' : ''} liee{filtered.length !== 1 ? 's' : ''} a <span className="font-medium text-text">{propertyTitle}</span>
          </p>
          <Button variant="outline" size="sm" icon={<Plus size={14} />}>
            Nouvelle transaction
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/60" />
            <input
              type="text"
              placeholder="Rechercher par client, type, statut..."
              className={`w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 transition-all ${isGerant ? 'focus:ring-[#905D5D]/20 focus:border-[#905D5D]' : 'focus:ring-accent/20 focus:border-accent'}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select options={typeOptions} value={filterType} onValueChange={setFilterType} placeholder="Tous les types" className="min-w-[140px]" />
          <Select options={etapeOptions} value={filterEtape} onValueChange={setFilterEtape} placeholder="Tous les statuts" className="min-w-[140px]" />
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-background border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Ref.</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Client</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Role</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Etape</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Date</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary">Montant</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((t, i) => (
                <motion.tr
                  key={t.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.2 }}
                  className="hover:bg-background/50 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">{t.reference}</td>
                  <td className="px-4 py-3 text-xs font-medium text-text">{MANDAT_TYPE_LABELS[t.type]}</td>
                  <td className="px-4 py-3 font-medium text-text text-sm">{t.clientName}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-lg border ${roleColor(t.role, isGerant)}`}>
                      {t.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={TRANSACTION_ETAPE_COLORS[t.etape]}>
                      {TRANSACTION_ETAPE_LABELS[t.etape]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-secondary">
                    {t.dateContracted ? new Date(t.dateContracted).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-text text-sm">{t.montant}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <TransactionActions transaction={t} />
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // ── Modern staged variant ─────────────────────────────────────────
  const typeIcon = (t: string) => {
    if (t === 'exclusif' || t === 'exclusif_agence') return Tag
    if (t === 'location_saisonniere') return Calendar
    if (t === 'location_gestion' || t === 'recherche_location') return Briefcase
    return FileText
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="stage-glass p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <OrbIcon icon={Briefcase} hue={STAGE_HUES.amber} size={40} radius={12} />
            <div className="min-w-0">
              <h2 className={`text-[15px] font-bold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>Transactions du bien</h2>
              <p className={`truncate text-xs mt-0.5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                <span className="font-semibold">{propertyTitle}</span>
                <span className={`mx-1.5 ${dark ? 'text-slate-600' : 'text-slate-300'}`}>·</span>
                {filtered.length} transaction{filtered.length !== 1 ? 's' : ''} {searchQuery || filterType !== 'all' || filterEtape !== 'all' ? `sur ${transactions.length}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StageBadge variant="neutral">{stats.total} total</StageBadge>
            {(searchQuery || filterType !== 'all' || filterEtape !== 'all') && <StageBadge variant="violet">{filtered.length} filtrés</StageBadge>}
            <StageButton variant="primary" size="sm" icon={<Plus size={13} />}>Nouvelle transaction</StageButton>
          </div>
        </div>

        <div className="mt-4 flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${dark ? 'text-slate-500' : 'text-teal-900/35'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher par client, type, statut…"
              className={ctrl('h-9 pl-9 pr-9')}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors ${dark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}>
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Select options={typeOptions} value={filterType} onValueChange={setFilterType} placeholder="Tous les types" className={ctrl('h-9 min-w-[150px]')} />
            <Select options={etapeOptions} value={filterEtape} onValueChange={setFilterEtape} placeholder="Tous les statuts" className={ctrl('h-9 min-w-[150px]')} />
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, hue: STAGE_HUES.violet, icon: Briefcase },
          { label: 'Actifs', value: stats.byEtape['actif'] || 0, hue: STAGE_HUES.emerald, icon: Shield },
          { label: 'Signés', value: stats.byEtape['signe'] || 0, hue: STAGE_HUES.sky, icon: Tag },
          { label: 'En attente', value: stats.byEtape['en_attente'] || 0, hue: STAGE_HUES.amber, icon: Clock },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
            <TiltCard className="flex items-center gap-3 p-3">
              <OrbIcon icon={s.icon} hue={s.hue} size={34} radius={11} />
              <div className="min-w-0">
                <p className={`truncate text-[9px] font-bold uppercase tracking-[0.16em] ${dark ? 'text-slate-500' : 'text-teal-900/45'}`}>{s.label}</p>
                <p className={`text-lg font-extrabold leading-tight tabular-nums ${dark ? 'text-white' : 'text-slate-900'}`}>{s.value}</p>
              </div>
            </TiltCard>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {filtered.length === 0 && (searchQuery || filterType !== 'all' || filterEtape !== 'all') && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`stage-glass flex flex-col items-center justify-center gap-2 py-10 text-center ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
            <Search size={18} className={dark ? 'text-slate-500' : 'text-teal-900/30'} />
            <p className="text-sm font-medium">Aucune transaction ne correspond aux filtres</p>
            <StageButton variant="glass" size="sm" onClick={() => { setSearchQuery(''); setFilterType('all'); setFilterEtape('all') }}>Réinitialiser</StageButton>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((t, idx) => {
          const tHue = TYPE_HUE[t.type] || STAGE_HUES.violet
          const eHue = ETAPE_HUE[t.etape] || SLATE_HUE
          const eVariant = ETAPE_VARIANT[t.etape] || 'neutral'
          const IconT = typeIcon(t.type)
          return (
            <motion.div key={t.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
              <TiltCard className="group relative flex flex-col overflow-hidden p-4">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${tHue.line}55, transparent)` }} />

                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <OrbIcon icon={IconT} hue={tHue} size={36} radius={11} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-mono text-xs font-bold tracking-wide ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{t.reference}</span>
                      </div>
                      <p className={`truncate text-xs font-semibold ${dark ? 'text-white' : 'text-slate-800'}`}>{MANDAT_TYPE_LABELS[t.type]}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <StageBadge variant={eVariant as any}>{TRANSACTION_ETAPE_LABELS[t.etape]}</StageBadge>
                    <span onClick={e => e.stopPropagation()}>
                      <TransactionActions transaction={t} />
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="rounded-xl border p-2.5"
                    style={{
                      borderColor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)',
                      background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.55)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                    }}
                  >
                    <p className={`mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] ${dark ? 'text-slate-500' : 'text-teal-900/45'}`}>
                      <Users size={10} /> Client
                    </p>
                    <p className={`truncate text-sm font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>{t.clientName}</p>
                    <span className={`mt-1 inline-block rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${roleColor(t.role, isGerant)}`}>{t.role}</span>
                  </div>
                  <div
                    className="rounded-xl border p-2.5"
                    style={{
                      borderColor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)',
                      background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.55)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                    }}
                  >
                    <p className={`mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] ${dark ? 'text-slate-500' : 'text-teal-900/45'}`}>
                      <DollarSign size={10} /> Montant
                    </p>
                    <p className={`truncate text-sm font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{t.montant}</p>
                    <span className={`inline-flex items-center gap-1 text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <Calendar size={10} /> {t.dateContracted ? new Date(t.dateContracted).toLocaleDateString('fr-FR') : '—'}
                    </span>
                  </div>
                </div>

                <div className={`mt-3 flex items-center gap-2 border-t pt-3 text-xs ${dark ? 'border-white/5 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                  <span className="inline-flex items-center gap-1">
                    <Hash size={11} className={dark ? 'text-slate-500' : 'text-slate-400'} />
                    <span className="font-mono text-[11px]">{t.reference}</span>
                  </span>
                  <span className={`h-1 w-1 rounded-full ${dark ? 'bg-white/20' : 'bg-slate-300'}`} />
                  <span className="inline-flex items-center gap-1">
                    <Clock size={11} className={dark ? 'text-slate-500' : 'text-slate-400'} />
                    {TRANSACTION_ETAPE_LABELS[t.etape]}
                  </span>
                </div>

                <div className="tilt-glare" aria-hidden="true" />
              </TiltCard>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
