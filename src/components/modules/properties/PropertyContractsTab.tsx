import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, Lock } from 'react-feather'
import { Badge } from '../../ui/Badge'
import { ContractActionsMenu } from '../../ui/ContractActionsMenu'
import { ConfirmDialog } from '../../ui/ConfirmDialog'
import { useToast } from '../../ui/Toast'
import {
  getPropertyContracts,
  CONTRACT_TYPE_LABELS,
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
  partyRoleColor,
} from '../../../types/contract'
import type { ContractType, ContractStatus } from '../../../types/contract'
import { fetchContracts, deleteContract } from '../../../services/contractService'
import { useMyPermissions, permissionAllowed } from '../../../hooks/useMyPermissions'

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

  const mapRows = (data: any[]) => (Array.isArray(data) ? data : []).map((c: any) => ({
    id: c.id,
    reference: c.reference,
    type: (c.contractType || c.type) as ContractType,
    status: c.status as ContractStatus,
    notes: c.notes || '',
    dateCreation: c.dateCreation || c.createdAt || c.startDate || '',
    partieA: { name: c.clientName || '—', type: c.clientType || '' },
    partieB: { name: '', type: '' },
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
        <div className={`animate-spin rounded-full h-8 w-8 border-2 border-t-2 mb-3 ${isGerant ? 'border-[#905D5D]/20 border-t-[#905D5D]' : 'border-accent/20 border-t-accent'}`} />
        <p className="text-sm">Chargement des contrats...</p>
      </div>
    )
  }

  if (contracts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
        <FileText size={32} className="mb-3 opacity-40" />
        <p className="text-sm">Aucun contrat pour ce bien</p>
        <p className="text-xs text-text-secondary/60 mt-1">Les contrats seront générés automatiquement lors des transactions</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-secondary">
          {contracts.length} contrat{contracts.length !== 1 ? 's' : ''} lié{contracts.length !== 1 ? 's' : ''} à <span className="font-medium text-text">{propertyTitle}</span>
        </p>
      </div>

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
            {contracts.map((c, i) => (
              <motion.tr
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.2 }}
                className={`transition-colors ${canViewDetails ? 'hover:bg-background/50 cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                onClick={() => canViewDetails && navigate(`${basePath}/contracts/${c.id}`)}
              >
                <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                  {c.reference}
                  {!canViewDetails && (
                    <span className="ml-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-background border border-border/60 text-text-secondary">
                      <Lock size={9} /> Verrouillé
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs font-medium text-text">{CONTRACT_TYPE_LABELS[c.type] ?? c.type}</td>
                <td className="px-4 py-3">
                  <Badge className={CONTRACT_STATUS_COLORS[c.status] ?? ''}>
                    {CONTRACT_STATUS_LABELS[c.status] ?? c.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-text truncate max-w-[120px]">{c.partieA.name}</span>
                    {c.partieA.type && (
                      <span className={`inline-block px-1.5 py-0.5 text-[10px] font-medium rounded border ${partyRoleColor(c.partieA.type)}`}>
                        {c.partieA.type}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-text truncate max-w-[120px]">{c.partieB.name || '—'}</span>
                    {c.partieB.type && (
                      <span className={`inline-block px-1.5 py-0.5 text-[10px] font-medium rounded border ${partyRoleColor(c.partieB.type)}`}>
                        {c.partieB.type}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-text-secondary">
                  {c.dateCreation ? new Date(c.dateCreation).toLocaleDateString('fr-FR') : '—'}
                </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <ContractActionsMenu
                      contract={c}
                      basePath={basePath}
                      onDelete={(contract) => setDeleteTarget(contract)}
                    />
                  </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
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
