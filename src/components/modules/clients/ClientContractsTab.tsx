import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, Home, User, Lock, Search, Calendar, DollarSign, Tag, RefreshCw, X } from 'react-feather'
import { ContractActionsMenu } from '../../../components/ui/ContractActionsMenu'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { useToast } from '../../../components/ui/Toast'
import { Select } from '../../ui/Select'
import {
  CONTRACT_TYPE_LABELS,
  CONTRACT_STATUS_LABELS,
  contractFilters,
  getDemoContractsForClient,
  toDemoContractRow,
} from '../../../types/contract'
import { fetchContractsByClient, deleteContract } from '../../../services/contractService'
import { api } from '../../../services/api'
import { useMyPermissions, permissionAllowed } from '../../../hooks/useMyPermissions'
import { useStageFormClasses } from '../calendar/StageModal'
import {
  useDetailAccent,
  StagePill,
  RED_STAGE_HUE,
  SLATE_STAGE_HUE,
  DETAIL_TYPE_HUE,
} from './ClientInfos/ClientDetailStage'
import { STAGE_HUES, type StageHue } from '../../dashboard/Stage'

const formatPrice = (p: number, devise = 'MAD') =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: devise, maximumFractionDigits: 0 }).format(p)

const statusHue = (status: string): StageHue => {
  switch (status) {
    case 'confirme_actif':
      return STAGE_HUES.emerald
    case 'en_cours':
      return STAGE_HUES.amber
    case 'paye':
      return STAGE_HUES.violet
    case 'occupe':
      return STAGE_HUES.sky
    case 'finalise_termine':
      return SLATE_STAGE_HUE
    case 'annule':
      return RED_STAGE_HUE
    default:
      return SLATE_STAGE_HUE
  }
}

const roleHue = (role?: string): StageHue => {
  if (!role) return SLATE_STAGE_HUE
  return DETAIL_TYPE_HUE[role] || SLATE_STAGE_HUE
}

export const ClientContractsTab = ({ clientId, clientName, clientType, isGerant = false }: { clientId: string; clientName: string; clientType?: string; isGerant?: boolean }) => {
  const navigate = useNavigate()
  const { adminId, agentId } = useParams()
  const { toast } = useToast()
  const perms = useMyPermissions()
  const canViewDetails = permissionAllowed(perms, 'contrats-info-privees')
  const canDeleteContract = permissionAllowed(perms, 'contrats-supprimer')
  const basePath = adminId ? `/admin/${adminId}` : agentId ? `/${agentId}` : ''
  const [contracts, setContracts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const { isDark, accent, ink } = useDetailAccent(clientType, isGerant)
  const { input: stageInput } = useStageFormClasses()

  useEffect(() => {
    api.get<any>('/auth/me').then(setCurrentUser).catch(() => {})
  }, [])

  const mapDemoRows = useCallback(() => {
    return getDemoContractsForClient(clientId, clientName, clientType).map(toDemoContractRow)
  }, [clientId, clientName, clientType])

  const load = useCallback(() => {
    setLoading(true)
    fetchContractsByClient(clientId)
      .then((rows) => {
        if (Array.isArray(rows) && rows.length > 0) {
          setContracts(rows)
        } else {
          setContracts(mapDemoRows())
        }
      })
      .catch(() => setContracts(mapDemoRows()))
      .finally(() => setLoading(false))
  }, [clientId, mapDemoRows])

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
    return contracts.filter(c => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const inRef = (c.reference || '').toLowerCase().includes(q)
        const inBien = (c.propertyTitle || '').toLowerCase().includes(q) || (c.propertyRef || '').toLowerCase().includes(q)
        const inParties = (c.partieA?.name || c.clientName || '').toLowerCase().includes(q) || (c.partieB?.name || '').toLowerCase().includes(q)
        const inType = ((CONTRACT_TYPE_LABELS as any)[c.contractType] || c.contractType || '').toLowerCase().includes(q)
        const inStatus = ((CONTRACT_STATUS_LABELS as any)[c.status] || c.status || '').toLowerCase().includes(q)
        if (!inRef && !inBien && !inParties && !inType && !inStatus) return false
      }
      if (filterType !== 'all' && c.contractType !== filterType) return false
      if (filterStatus !== 'all' && c.status !== filterStatus) return false
      return true
    })
  }, [contracts, searchQuery, filterType, filterStatus])

  const typeOptions = [
    { value: 'all', label: 'Tous les types' },
    ...contractFilters.types,
  ]

  const statusOptions = [
    { value: 'all', label: 'Tous les statuts' },
    ...contractFilters.statuses,
  ]

  const actifCount = contracts.filter(c => c.status === 'confirme_actif').length
  const enCoursCount = contracts.filter(c => c.status === 'en_cours').length
  const hasActiveFilters = searchQuery !== '' || filterType !== 'all' || filterStatus !== 'all'
  const resetFilters = () => {
    setSearchQuery('')
    setFilterType('all')
    setFilterStatus('all')
  }

  const currentUserName = currentUser
    ? [currentUser.first_name, currentUser.last_name].filter(Boolean).join(' ') || currentUser.email
    : ''

  return (
    <div className="space-y-5">
      {/* Hero Header — staged */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={`relative overflow-hidden rounded-2xl border p-4 backdrop-blur-sm sm:p-5 ${isDark ? 'border-white/[0.07] bg-white/[0.03]' : 'border-slate-200/70 bg-white/70 shadow-sm'}`}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(80% 120% at 100% 0%, ${accent.a}1F, transparent 60%)` }}
        />
        <div className="relative flex flex-col gap-4 xl:flex-row xl:items-center xl:gap-6">
          {/* Left — title + counts */}
          <div className="flex min-w-0 items-start gap-3 xl:w-[290px] xl:shrink-0">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border"
              style={isDark
                ? { background: `${accent.a}14`, borderColor: `${accent.a}30`, color: accent.a }
                : { background: `${accent.a}12`, borderColor: `${accent.a}30`, color: ink }}
            >
              <FileText size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className={`text-sm font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Contrats</h3>
              <p className={`mt-0.5 truncate text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{clientName}</span>
                <span className="mx-1.5 opacity-40">—</span>
                {contracts.length} contrat{contracts.length > 1 ? 's' : ''} lié{contracts.length > 1 ? 's' : ''}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-extrabold tabular-nums backdrop-blur-md ${isDark ? 'border-white/10 bg-white/[0.04]' : 'border-slate-200/80 bg-white/70'}`}
                  style={{ color: isDark ? accent.a : accent.b }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent.line, boxShadow: `0 0 6px ${accent.glow}` }} />
                  {filtered.length}
                  <span className={`text-[10px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>affiché{filtered.length > 1 ? 's' : ''}</span>
                </span>
                {actifCount > 0 && (
                  <StagePill label={`${actifCount} actif${actifCount > 1 ? 's' : ''}`} hue={STAGE_HUES.emerald} isDark={isDark} />
                )}
                {enCoursCount > 0 && (
                  <StagePill label={`${enCoursCount} en cours`} hue={STAGE_HUES.amber} isDark={isDark} />
                )}
              </div>
            </div>
          </div>
          {/* Divider */}
          <div aria-hidden="true" className={`hidden w-px self-stretch xl:block ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
          {/* Center — filters */}
          <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: isDark ? '#8B7CFF' : '#0D9488' }} />
              <input
                type="text"
                placeholder="Référence, bien, partie, statut..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={stageInput('h-9 pl-9 pr-9')}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Effacer la recherche"
                  className={`absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:bg-white/10 hover:text-white' : 'text-teal-900/40 hover:bg-teal-900/5 hover:text-teal-900'}`}
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <Select options={typeOptions} value={filterType} onValueChange={setFilterType} placeholder="Type" className="w-full sm:w-[170px] sm:shrink-0" />
            <div className="flex items-center gap-2">
              <Select options={statusOptions} value={filterStatus} onValueChange={setFilterStatus} placeholder="Statut" className="w-full flex-1 sm:w-[170px] sm:flex-none" />
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  title="Réinitialiser les filtres"
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-bold backdrop-blur-md transition-all duration-200 hover:scale-[1.02] active:scale-95 ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/10 hover:text-white' : 'border-slate-200/80 bg-white text-slate-500 shadow-sm hover:text-slate-900'}`}
                >
                  <X size={12} />
                  <span className="hidden 2xl:inline">Réinitialiser</span>
                </button>
              )}
            </div>
          </div>
          {/* Divider */}
          <div aria-hidden="true" className={`hidden w-px self-stretch xl:block ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
          {/* Right — action */}
          <div className="flex shrink-0 items-center gap-2 xl:ml-0">
            <button
              type="button"
              onClick={load}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold backdrop-blur-md transition-all duration-200 hover:scale-[1.02] active:scale-95 sm:w-auto xl:w-auto ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10 hover:text-white' : 'border-slate-200/80 bg-white text-slate-600 shadow-sm hover:bg-white hover:text-slate-900'}`}
            >
              <RefreshCw size={14} /> Actualiser
            </button>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative mb-4 h-14 w-14">
            <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: `${accent.a}30` }} />
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent" style={{ borderTopColor: accent.a }} />
            <div className="absolute inset-2 animate-spin rounded-full border-2 border-transparent" style={{ borderTopColor: `${accent.a}99`, animationDirection: 'reverse', animationDuration: '1.5s' }} />
            <FileText size={16} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color: ink }} />
          </div>
          <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Chargement...</p>
          <p className={`mt-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Récupération des contrats liés</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div
            className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border backdrop-blur-sm ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-500' : 'border-slate-200/70 bg-white/70 text-slate-400 shadow-sm'}`}
          >
            <FileText size={22} />
          </div>
          <p className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
            {contracts.length === 0 ? 'Aucun contrat trouvé' : 'Aucun résultat'}
          </p>
          <p className={`mt-1 max-w-xs text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {contracts.length === 0
              ? 'Les contrats sont générés automatiquement lors des transactions'
              : 'Essayez de modifier ou réinitialiser les filtres'}
          </p>
          {hasActiveFilters && contracts.length > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              className={`mt-3 inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold backdrop-blur-md transition-all duration-200 hover:scale-[1.02] active:scale-95 ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10 hover:text-white' : 'border-slate-200/80 bg-white text-slate-600 shadow-sm hover:text-slate-900'}`}
            >
              <X size={14} /> Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c, index) => {
            const h = statusHue(c.status)
            const parties = {
              A: { name: c.partieA?.name || c.clientName, type: c.partieA?.type || c.clientType },
              B: { name: c.partieB?.name || '—', type: c.partieB?.type },
            }
            const dateLabel = c.createdAt ? new Date(c.createdAt).toLocaleDateString('fr-FR') : '—'
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.04, 0.4), duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => canViewDetails && navigate(`${basePath}/contracts/${c.id}`)}
                className={`group overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 ${
                  isDark
                    ? 'border-white/[0.07] bg-white/[0.03] hover:border-white/[0.14] hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7)]'
                    : 'border-slate-200/70 bg-white/75 shadow-[0_1px_2px_rgba(15,23,42,0.05)] hover:shadow-[0_18px_44px_-20px_rgba(13,148,136,0.35)]'
                } ${canViewDetails ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
              >
                <div className="flex gap-3 p-4">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border"
                    style={isDark
                      ? { background: `${accent.a}14`, borderColor: `${accent.a}30`, color: accent.a }
                      : { background: `${accent.a}12`, borderColor: `${accent.a}30`, color: ink }}
                  >
                    <Home size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className={`font-mono text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{c.reference}</span>
                      {!canViewDetails && (
                        <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-300' : 'border-slate-200/80 bg-white text-slate-500'}`}>
                          <Lock size={9} /> Verrouillé
                        </span>
                      )}
                      <span className={`hidden h-3 w-px sm:block ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                      <span className={`truncate text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                        {c.propertyTitle ?? 'Sans bien lié'}
                      </span>
                    </div>
                    {c.propertyRef && (
                      <p className={`mt-0.5 font-mono text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{c.propertyRef}</p>
                    )}
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <span
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold"
                        style={isDark
                          ? { background: `${accent.a}1E`, color: accent.a, border: `1px solid ${accent.a}36` }
                          : { background: `${accent.a}14`, color: ink, border: `1px solid ${accent.a}36` }}
                      >
                        <Tag size={10} />{(CONTRACT_TYPE_LABELS as any)[c.contractType] ?? c.contractType}
                      </span>
                      <StagePill label={(CONTRACT_STATUS_LABELS as any)[c.status] ?? c.status} hue={h} isDark={isDark} />
                      {parties.A.type && (
                        <StagePill label={parties.A.type} hue={roleHue(parties.A.type)} isDark={isDark} dot={false} />
                      )}
                      {parties.B.type && (
                        <StagePill label={parties.B.type} hue={roleHue(parties.B.type)} isDark={isDark} dot={false} />
                      )}
                    </div>
                    <div className={`mt-2 flex flex-col gap-1.5 text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span className="inline-flex min-w-0 items-center gap-1.5">
                          <User size={11} className={`shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                          <span className="truncate">{parties.A.name}</span>
                          <span className="opacity-40">↔</span>
                          <span className="truncate">{parties.B.name}</span>
                        </span>
                      </span>
                      <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar size={11} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                          {dateLabel}
                        </span>
                        <span className="inline-flex items-center gap-1.5 tabular-nums">
                          <DollarSign size={11} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                          {c.amount ? (
                            <span className={`text-xs font-extrabold tabular-nums ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                              {formatPrice(c.amount)}
                              {c.contractType === 'location_classique' && <span className={`text-[10px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>/mois</span>}
                              {c.contractType === 'location_saisonniere' && <span className={`ml-0.5 text-[10px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>/séjour</span>}
                            </span>
                          ) : (
                            <span>—</span>
                          )}
                        </span>
                        {(currentUserName || c.agentPrincipal) && (
                          <span className="truncate">Agent : {currentUserName || c.agentPrincipal}</span>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-start" onClick={(e) => e.stopPropagation()}>
                    <ContractActionsMenu
                      contract={c}
                      basePath={basePath}
                      onDelete={(contract) => setDeleteTarget(contract)}
                    />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer le contrat"
        message={`Cette action est irréversible. Le contrat ${deleteTarget?.reference || ''} sera définitivement supprimé.`}
        confirmLabel={deleting ? 'Suppression...' : 'Supprimer'}
      />
    </div>
  )
}
