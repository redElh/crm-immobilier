import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Lock, Search, X, User, Calendar, Hash, TrendingUp, Key, Sun, Briefcase, Eye, Trash2, Shield } from 'react-feather'
import { Badge } from '../../ui/Badge'
import { ContractActionsMenu } from '../../ui/ContractActionsMenu'
import { ConfirmDialog } from '../../ui/ConfirmDialog'
import { useToast } from '../../ui/Toast'
import {
  getPropertyContracts,
  CONTRACT_TYPE_LABELS,
  CONTRACT_TYPE_CONFIG,
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
  partyRoleColor,
} from '../../../types/contract'
import type { ContractType, ContractStatus } from '../../../types/contract'
import { fetchContracts, deleteContract } from '../../../services/contractService'
import { useMyPermissions, permissionAllowed } from '../../../hooks/useMyPermissions'
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

interface PropertyContractRow {
  id: string
  reference: string
  type: ContractType
  status: ContractStatus
  notes?: string
  dateCreation: string
  partieA: { name: string; type: string }
  partieB: { name: string; type: string }
  documents: any[]
}

const TYPE_HUE_MAP: Record<string, typeof STAGE_HUES[keyof typeof STAGE_HUES]> = {
  vente: STAGE_HUES.sky,
  location_classique: STAGE_HUES.emerald,
  location_saisonniere: STAGE_HUES.violet,
}

const STATUS_VARIANT: Record<string, 'ok' | 'warn' | 'neutral' | 'danger' | 'violet'> = {
  en_cours: 'warn',
  confirme_actif: 'ok',
  paye: 'violet',
  occupe: 'neutral',
  finalise_termine: 'ok',
  annule: 'danger',
}

const STATUS_HUE: Record<string, typeof STAGE_HUES[keyof typeof STAGE_HUES]> = {
  en_cours: STAGE_HUES.amber,
  confirme_actif: STAGE_HUES.emerald,
  paye: STAGE_HUES.violet,
  occupe: STAGE_HUES.sky,
  finalise_termine: STAGE_HUES.emerald,
  annule: SLATE_HUE,
}

export const PropertyContractsTab = ({ propertyId, propertyTitle, isGerant = false }: { propertyId: string; propertyTitle: string; isGerant?: boolean }) => {
  const navigate = useNavigate()
  const { adminId, agentId } = useParams()
  const { toast } = useToast()
  const perms = useMyPermissions()
  const canViewDetails = permissionAllowed(perms, 'contrats-info-privees')
  const canDeleteContract = permissionAllowed(perms, 'contrats-supprimer')
  const basePath = adminId ? `/admin/${adminId}` : agentId ? `/${agentId}` : ''
  const [contracts, setContracts] = useState<PropertyContractRow[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<PropertyContractRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState('')

  const { staged, dark } = useStageChrome()
  const { input, label } = useStageFormClasses()
  const ctrl = (extra?: string) => (staged ? input(extra) : undefined)

  const mapRows = (data: any[]) => (Array.isArray(data) ? data : []).map((c: any) => ({
    id: c.id,
    reference: c.reference,
    type: (c.contractType || c.type) as ContractType,
    status: c.status as ContractStatus,
    notes: c.notes || '',
    dateCreation: c.dateCreation || c.createdAt || c.startDate || '',
    partieA: { name: c.clientName || c.partieA?.name || '—', type: c.clientType || c.partieA?.type || '' },
    partieB: { name: c.partieB?.name || '', type: c.partieB?.type || '' },
    documents: c.documents || [],
  }))

  const load = useCallback(() => {
    setLoading(true)
    fetchContracts({ property_id: propertyId })
      .then((data: any[]) => {
        const rows = mapRows(data)
        if (rows.length === 0) {
          const mock = getPropertyContracts(propertyId)
          if (mock.length > 0) {
            setContracts(mock.map((c: any) => ({
              id: c.id,
              reference: c.reference,
              type: c.type as ContractType,
              status: c.status as ContractStatus,
              notes: c.notes || '',
              dateCreation: c.dateCreation,
              partieA: { name: c.partieA.name, type: c.partieA.type },
              partieB: { name: c.partieB.name, type: c.partieB.type },
              documents: c.documents || [],
            })))
            return
          }
        }
        setContracts(rows)
      })
      .catch(() => {
        const mock = getPropertyContracts(propertyId)
        setContracts(mock.map((c: any) => ({
          id: c.id,
          reference: c.reference,
          type: c.type as ContractType,
          status: c.status as ContractStatus,
          notes: c.notes || '',
          dateCreation: c.dateCreation,
          partieA: { name: c.partieA.name, type: c.partieA.type },
          partieB: { name: c.partieB.name, type: c.partieB.type },
          documents: c.documents || [],
        })))
      })
      .finally(() => setLoading(false))
  }, [propertyId])

  useEffect(() => {
    load()
  }, [load])

  const handleDelete = async () => {
    if (!deleteTarget || !canDeleteContract) return
    setDeleting(true)
    try {
      await deleteContract(deleteTarget.id)
      setContracts(prev => prev.filter(x => x.id !== deleteTarget.id))
      toast('success', `Contrat ${deleteTarget.reference || ''} supprimé`)
      setDeleteTarget(null)
    } catch {
      toast('error', 'Erreur lors de la suppression du contrat')
    } finally {
      setDeleting(false)
    }
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return contracts
    const q = search.toLowerCase()
    return contracts.filter(c =>
      c.reference.toLowerCase().includes(q) ||
      (CONTRACT_TYPE_LABELS[c.type] ?? c.type).toLowerCase().includes(q) ||
      (CONTRACT_STATUS_LABELS[c.status] ?? c.status).toLowerCase().includes(q) ||
      c.partieA.name.toLowerCase().includes(q) ||
      c.partieB.name.toLowerCase().includes(q)
    )
  }, [contracts, search])

  const stats = useMemo(() => {
    const byStatus: Record<string, number> = {}
    const byType: Record<string, number> = {}
    for (const c of contracts) {
      byStatus[c.status] = (byStatus[c.status] || 0) + 1
      byType[c.type] = (byType[c.type] || 0) + 1
    }
    return { total: contracts.length, byStatus, byType }
  }, [contracts])

  // ── Staged loading ────────────────────────────────────────────────
  if (loading) {
    if (staged) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-14">
          <motion.div
            className="h-10 w-10 rounded-full border-[3px] border-violet-400/30 border-t-violet-400"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
            style={{ filter: 'drop-shadow(0 0 12px rgba(139,124,255,0.55))' }}
          />
          <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${dark ? 'text-slate-500' : 'text-teal-900/50'}`}>Chargement des contrats…</p>
        </div>
      )
    }
    return (
      <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
        <div className={`animate-spin rounded-full h-8 w-8 border-2 border-t-2 mb-3 ${isGerant ? 'border-[#905D5D]/20 border-t-[#905D5D]' : 'border-accent/20 border-t-accent'}`} />
        <p className="text-sm">Chargement des contrats...</p>
      </div>
    )
  }

  // ── Staged empty ──────────────────────────────────────────────────
  if (contracts.length === 0) {
    if (staged) {
      return (
        <div className="stage-glass flex flex-col items-center justify-center gap-3 py-14 text-center">
          <OrbIcon icon={FileText} hue={SLATE_HUE} size={48} radius={15} />
          <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>Aucun contrat pour ce bien</p>
          <p className={`max-w-sm text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Les contrats seront générés automatiquement lors des transactions</p>
          <p className={`mt-1 font-mono text-[11px] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{propertyTitle}</p>
        </div>
      )
    }
    return (
      <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
        <FileText size={32} className="mb-3 opacity-40" />
        <p className="text-sm">Aucun contrat pour ce bien</p>
        <p className="text-xs text-text-secondary/60 mt-1">Les contrats seront générés automatiquement lors des transactions</p>
      </div>
    )
  }

  // ── Legacy fallback (admin shell) ─────────────────────────────────
  if (!staged) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-text-secondary">
            {filtered.length} contrat{filtered.length !== 1 ? 's' : ''} lié{filtered.length !== 1 ? 's' : ''} à <span className="font-medium text-text">{propertyTitle}</span>
          </p>
        </div>
        {contracts.length !== filtered.length && (
          <div className="relative max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/60" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/40" />
          </div>
        )}
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-background border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Réf.</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Statut</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Partie A</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Partie B</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Créé le</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c, i) => (
                <motion.tr key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03, duration: 0.2 }} className={`transition-colors ${canViewDetails ? 'hover:bg-background/50 cursor-pointer' : 'cursor-not-allowed opacity-60'}`} onClick={() => canViewDetails && navigate(`${basePath}/contracts/${c.id}`)}>
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                    {c.reference}
                    {!canViewDetails && <span className="ml-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-background border border-border/60 text-text-secondary"><Lock size={9} /> Verrouillé</span>}
                  </td>
                  <td className="px-4 py-3 text-xs font-medium text-text">{CONTRACT_TYPE_LABELS[c.type] ?? c.type}</td>
                  <td className="px-4 py-3"><Badge className={CONTRACT_STATUS_COLORS[c.status] ?? ''}>{CONTRACT_STATUS_LABELS[c.status] ?? c.status}</Badge></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-1.5"><span className="text-sm text-text truncate max-w-[120px]">{c.partieA.name}</span>{c.partieA.type && <span className={`inline-block px-1.5 py-0.5 text-[10px] font-medium rounded border ${partyRoleColor(c.partieA.type)}`}>{c.partieA.type}</span>}</div></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-1.5"><span className="text-sm text-text truncate max-w-[120px]">{c.partieB.name || '—'}</span>{c.partieB.type && <span className={`inline-block px-1.5 py-0.5 text-[10px] font-medium rounded border ${partyRoleColor(c.partieB.type)}`}>{c.partieB.type}</span>}</div></td>
                  <td className="px-4 py-3 text-xs text-text-secondary">{c.dateCreation ? new Date(c.dateCreation).toLocaleDateString('fr-FR') : '—'}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap"><ContractActionsMenu contract={c} basePath={basePath} onDelete={setDeleteTarget} /></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Supprimer le contrat" message={`Cette action est irréversible. Le contrat ${deleteTarget?.reference || ''} sera définitivement supprimé.`} confirmLabel={deleting ? 'Suppression...' : 'Supprimer'} />
      </div>
    )
  }

  // ── Modern staged variant ─────────────────────────────────────────
  const typeIcon = (t: ContractType) => {
    const cfg = CONTRACT_TYPE_CONFIG[t]
    return cfg?.icon || FileText
  }

  return (
    <div className="space-y-4">
      {/* Header — stage-glass command bar */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="stage-glass p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <OrbIcon icon={FileText} hue={STAGE_HUES.violet} size={40} radius={12} />
            <div className="min-w-0">
              <h2 className={`text-[15px] font-bold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>Contrats du bien</h2>
              <p className={`truncate text-xs mt-0.5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                <span className="font-semibold">{propertyTitle}</span>
                <span className={`mx-1.5 ${dark ? 'text-slate-600' : 'text-slate-300'}`}>·</span>
                {filtered.length} contrat{filtered.length !== 1 ? 's' : ''} {search ? `sur ${contracts.length}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StageBadge variant="neutral">{stats.total} total</StageBadge>
            {filtered.length !== contracts.length && <StageBadge variant="violet">{filtered.length} filtrés</StageBadge>}
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${dark ? 'text-slate-500' : 'text-teal-900/35'}`} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher réf., type, partie…"
              className={ctrl('h-9 pl-9 pr-9')}
            />
            {search && (
              <button onClick={() => setSearch('')} className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors ${dark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}>
                <X size={14} />
              </button>
            )}
          </div>
          <div className={`flex items-center gap-2 text-xs ${dark ? 'text-slate-400' : 'text-teal-900/55'}`}>
            <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: STAGE_HUES.violet.line, boxShadow: `0 0 6px ${STAGE_HUES.violet.line}` }} />
            {Object.keys(stats.byStatus).length} statuts · {Object.keys(stats.byType).length} types
          </div>
        </div>
      </motion.div>

      {/* Stats strip — TiltCards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, hue: STAGE_HUES.violet, icon: FileText },
          { label: 'En cours', value: stats.byStatus['en_cours'] || 0, hue: STAGE_HUES.amber, icon: Calendar },
          { label: 'Confirmés', value: stats.byStatus['confirme_actif'] || 0, hue: STAGE_HUES.emerald, icon: Shield },
          { label: 'Terminés', value: (stats.byStatus['finalise_termine'] || 0) + (stats.byStatus['paye'] || 0), hue: STAGE_HUES.sky, icon: Briefcase },
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
        {filtered.length === 0 && search && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`stage-glass flex flex-col items-center justify-center gap-2 py-10 text-center ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
            <Search size={18} className={dark ? 'text-slate-500' : 'text-teal-900/30'} />
            <p className="text-sm font-medium">Aucun contrat ne correspond à « {search} »</p>
            <StageButton variant="glass" size="sm" onClick={() => setSearch('')}>Effacer la recherche</StageButton>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contracts — glass cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((c, idx) => {
          const tHue = TYPE_HUE_MAP[c.type] || STAGE_HUES.violet
          const sHue = STATUS_HUE[c.status] || SLATE_HUE
          const sVariant = STATUS_VARIANT[c.status] || 'neutral'
          const IconT = typeIcon(c.type)
          return (
            <motion.div key={c.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
              <TiltCard
                className={`group relative flex flex-col overflow-hidden p-4 ${canViewDetails ? 'cursor-pointer' : 'cursor-not-allowed opacity-85'}`}
                onClick={() => canViewDetails && navigate(`${basePath}/contracts/${c.id}`)}
              >
                {/* top accent line */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${tHue.line}55, transparent)` }} />

                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <OrbIcon icon={IconT} hue={tHue} size={36} radius={11} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`font-mono text-xs font-bold tracking-wide ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{c.reference}</span>
                        {!canViewDetails && (
                          <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${dark ? 'border-white/10 bg-white/[0.04] text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                            <Lock size={9} /> Verrouillé
                          </span>
                        )}
                      </div>
                      <p className={`truncate text-xs font-semibold ${dark ? 'text-white' : 'text-slate-800'}`}>{CONTRACT_TYPE_LABELS[c.type] ?? c.type}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <StageBadge variant={sVariant as any}>{CONTRACT_STATUS_LABELS[c.status] ?? c.status}</StageBadge>
                    <span onClick={e => e.stopPropagation()}><ContractActionsMenu contract={c} basePath={basePath} onDelete={setDeleteTarget} /></span>
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
                      <User size={10} /> Partie A
                    </p>
                    <p className={`truncate text-sm font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>{c.partieA.name}</p>
                    {c.partieA.type ? <span className={`mt-1 inline-block rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${partyRoleColor(c.partieA.type)}`}>{c.partieA.type}</span> : <span className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>—</span>}
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
                      <User size={10} /> Partie B
                    </p>
                    <p className={`truncate text-sm font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>{c.partieB.name || '—'}</p>
                    {c.partieB.type ? <span className={`mt-1 inline-block rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${partyRoleColor(c.partieB.type)}`}>{c.partieB.type}</span> : null}
                  </div>
                </div>

                <div className={`mt-3 flex flex-wrap items-center gap-2 border-t pt-3 text-xs ${dark ? 'border-white/5 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                  <span className="inline-flex items-center gap-1">
                    <Calendar size={11} className={dark ? 'text-slate-500' : 'text-slate-400'} />
                    {c.dateCreation ? new Date(c.dateCreation).toLocaleDateString('fr-FR') : '—'}
                  </span>
                  <span className={`h-1 w-1 rounded-full ${dark ? 'bg-white/20' : 'bg-slate-300'}`} />
                  <span className="inline-flex items-center gap-1">
                    <Hash size={11} className={dark ? 'text-slate-500' : 'text-slate-400'} />
                    <span className="font-mono text-[11px]">{c.reference}</span>
                  </span>
                  {c.documents?.length ? (
                    <>
                      <span className={`h-1 w-1 rounded-full ${dark ? 'bg-white/20' : 'bg-slate-300'}`} />
                      <span className="inline-flex items-center gap-1">
                        <FileText size={11} className={dark ? 'text-slate-500' : 'text-slate-400'} />
                        {c.documents.length} doc{c.documents.length > 1 ? 's' : ''}
                      </span>
                    </>
                  ) : null}
                </div>

                {c.notes && (
                  <p className={`mt-2 line-clamp-2 text-xs leading-relaxed ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{c.notes}</p>
                )}

                {/* hover sheen */}
                <div className="tilt-glare" aria-hidden="true" />
              </TiltCard>
            </motion.div>
          )
        })}
      </div>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Supprimer le contrat" message={`Cette action est irréversible. Le contrat ${deleteTarget?.reference || ''} sera définitivement supprimé.`} confirmLabel={deleting ? 'Suppression...' : 'Supprimer'} />
    </div>
  )
}
