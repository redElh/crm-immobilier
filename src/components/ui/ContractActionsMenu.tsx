import { useNavigate } from 'react-router-dom'
import { Eye, Trash2, Lock, Download, RefreshCw, MessageSquare } from 'react-feather'
import { RegistreActionsMenu } from './RegistreActionsMenu'
import type { RegistreAction } from './RegistreActionsMenu'
import { useToast } from './Toast'
import { useMyPermissions, permissionAllowed } from '../../hooks/useMyPermissions'
import { normalizeContract } from '../../types/contract'
import { generateContratPdf, buildContractPdfData } from '../../utils/generateContratPdf'

interface ContractActionsMenuProps {
  contract: any
  basePath?: string
  onDelete?: (contract: any) => void
}

export function ContractActionsMenu({
  contract,
  basePath = '',
  onDelete,
}: ContractActionsMenuProps) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const perms = useMyPermissions()
  const canViewDetails = permissionAllowed(perms, 'contrats-info-privees')
  const canWrite = permissionAllowed(perms, 'contrats-ecriture')
  const canDeleteContract = permissionAllowed(perms, 'contrats-supprimer')

  const agentName = contract?.agentName || contract?.agentPrincipal || 'Agent'

  const handlePdf = () => {
    try {
      generateContratPdf(buildContractPdfData(normalizeContract(contract), agentName))
    } catch {
      toast('error', 'Erreur lors de la génération du PDF du contrat')
    }
  }

  const actions: RegistreAction[] = []

  if (canViewDetails) {
    actions.push({
      icon: <Eye size={14} />,
      label: 'Voir le détail',
      onClick: () => navigate(`${basePath}/contracts/${contract.id}`),
    })
  } else {
    actions.push({
      icon: <Lock size={14} />,
      label: 'Verrouillé',
      disabled: true,
      onClick: () => {},
    })
  }

  actions.push({
    icon: <Download size={14} />,
    label: 'Télécharger le contrat (PDF)',
    onClick: handlePdf,
  })

  /* Statut / note: deep-link shortcuts — the detail page auto-opens the
     matching dialog from the ?action= URL param. */
  if (canWrite) {
    actions.push({
      icon: <RefreshCw size={14} />,
      label: 'Changer le statut',
      onClick: () => navigate(`${basePath}/contracts/${contract.id}?action=status`),
    })
    actions.push({
      icon: <MessageSquare size={14} />,
      label: 'Ajouter une note',
      onClick: () => navigate(`${basePath}/contracts/${contract.id}?action=note`),
    })
  }

  if (canDeleteContract && onDelete) {
    actions.push({
      separator: true,
      icon: <Trash2 size={14} />,
      label: 'Supprimer',
      variant: 'danger',
      onClick: () => onDelete(contract),
    })
  }

  return <RegistreActionsMenu actions={actions} width={248} alwaysVisible />
}
