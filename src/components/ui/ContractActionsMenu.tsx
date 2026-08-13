import { useNavigate } from 'react-router-dom'
import { Eye, Trash2, Lock } from 'react-feather'
import { RegistreActionsMenu } from './RegistreActionsMenu'
import type { RegistreAction } from './RegistreActionsMenu'
import { useMyPermissions, permissionAllowed } from '../../hooks/useMyPermissions'

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
  const perms = useMyPermissions()
  const canViewDetails = permissionAllowed(perms, 'contrats-info-privees')
  const canDeleteContract = permissionAllowed(perms, 'contrats-supprimer')

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

  if (canDeleteContract && onDelete) {
    actions.push({
      separator: true,
      icon: <Trash2 size={14} />,
      label: 'Supprimer',
      variant: 'danger',
      onClick: () => onDelete(contract),
    })
  }

  return <RegistreActionsMenu actions={actions} alwaysVisible />
}
