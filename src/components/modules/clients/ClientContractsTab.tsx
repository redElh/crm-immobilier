import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, Home, User, Lock } from 'react-feather'
import { Badge } from '../../../components/ui/Badge'
import Card from '../../../components/ui/Card'
import { ContractActionsMenu } from '../../../components/ui/ContractActionsMenu'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { useToast } from '../../../components/ui/Toast'
import {
  CONTRACT_TYPE_LABELS,
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
  partyRoleColor,
} from '../../../types/contract'
import { fetchContractsByClient, deleteContract } from '../../../services/contractService'
import { api } from '../../../services/api'
import { useMyPermissions, permissionAllowed } from '../../../hooks/useMyPermissions'

const formatPrice = (p: number, devise = 'MAD') =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: devise, maximumFractionDigits: 0 }).format(p)

export const ClientContractsTab = ({ clientId, clientName, isGerant = false }: { clientId: string; clientName: string; isGerant?: boolean }) => {
  const navigate = useNavigate()
  const { adminId, agentId } = useParams()
  const { toast } = useToast()
  const perms = useMyPermissions()
  const canViewDetails = permissionAllowed(perms, 'contrats-info-privees')
  const canDeleteContract = permissionAllowed(perms, 'contrats-supprimer')
  const basePath = adminId ? `/admin/${adminId}` : agentId ? `/${agentId}` : ''
  const [contracts, setContracts] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    api.get<any>('/auth/me').then(setCurrentUser).catch(() => {})
  }, [])

  const load = useCallback(() => {
    fetchContractsByClient(clientId).then(setContracts).catch(() => setContracts([]))
  }, [clientId])

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

  const currentUserName = currentUser
    ? [currentUser.first_name, currentUser.last_name].filter(Boolean).join(' ') || currentUser.email
    : ''

  if (contracts.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
        <div className="px-4 py-16 text-center text-text-secondary">
          <FileText size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Aucun contrat trouvé</p>
          <p className="text-xs text-text-secondary/60 mt-1">Les contrats sont générés automatiquement lors des transactions</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-background border-b border-border/50">
              <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Référence</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Type</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Statut</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Partie A</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Partie B</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Bien</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary">Montant</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Créé le</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Agent</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {contracts.map((c, index) => {
              const parties = {
                A: { name: c.partieA?.name || c.clientName, type: c.partieA?.type || c.clientType },
                B: { name: c.partieB?.name || '—', type: c.partieB?.type },
              }
              return (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02, duration: 0.2 }}
                  className={`transition-colors ${canViewDetails ? 'hover:bg-background/50 cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                  onClick={() => canViewDetails && navigate(`${basePath}/contracts/${c.id}`)}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-text-secondary">{c.reference}</span>
                    {!canViewDetails && (
                      <span className="ml-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-background border border-border/60 text-text-secondary">
                        <Lock size={9} /> Verrouillé
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-text">{CONTRACT_TYPE_LABELS[c.contractType as keyof typeof CONTRACT_TYPE_LABELS] ?? c.contractType}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={CONTRACT_STATUS_COLORS[c.status as keyof typeof CONTRACT_STATUS_COLORS] ?? ''}>
                      {CONTRACT_STATUS_LABELS[c.status as keyof typeof CONTRACT_STATUS_LABELS] ?? c.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <User size={12} className="text-text-secondary/60 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-text truncate max-w-[140px]">{parties.A.name}</p>
                        {parties.A.type && (
                          <span className={`inline-block px-1.5 py-0.5 text-[10px] font-medium rounded border ${partyRoleColor(parties.A.type)}`}>
                            {parties.A.type}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <User size={12} className="text-text-secondary/60 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-text truncate max-w-[140px]">{parties.B.name}</p>
                        {parties.B.type && (
                          <span className={`inline-block px-1.5 py-0.5 text-[10px] font-medium rounded border ${partyRoleColor(parties.B.type)}`}>
                            {parties.B.type}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Home size={12} className="text-text-secondary/60 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-text truncate max-w-[160px]">{c.propertyTitle ?? '—'}</p>
                        {c.propertyRef && <p className="text-[10px] text-text-secondary/60 font-mono">{c.propertyRef}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-text text-sm">
                    {c.amount ? (
                      <>
                        {formatPrice(c.amount)}
                        {c.contractType === 'location_classique' && <span className="text-[10px] text-text-secondary/60">/mois</span>}
                        {c.contractType === 'location_saisonniere' && <span className="text-[10px] text-text-secondary/60 ml-0.5">/séjour</span>}
                      </>
                    ) : (
                      <span className="text-text-secondary/60">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs">
                    {new Date(c.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs">{currentUserName || '—'}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <ContractActionsMenu
                      contract={c}
                      basePath={basePath}
                      onDelete={(contract) => setDeleteTarget(contract)}
                    />
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-border/50 flex items-center justify-between text-xs text-text-secondary/60">
        <span>{contracts.length} résultat{contracts.length !== 1 ? 's' : ''}</span>
        <div className="flex items-center gap-4">
          <span>Confirmés / Actifs: {contracts.filter(c => c.status === 'confirme_actif').length}</span>
          <span>En cours: {contracts.filter(c => c.status === 'en_cours').length}</span>
          <span>Finalisés / Terminés: {contracts.filter(c => c.status === 'finalise_termine').length}</span>
        </div>
      </div>

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
