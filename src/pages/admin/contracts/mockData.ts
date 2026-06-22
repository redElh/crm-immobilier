import { mockContracts, CONTRACT_TYPE_LABELS, CONTRACT_STATUS_LABELS, CONTRACT_STATUS_COLORS, contractFilters } from '../../../types/contract'
import type { Contract, ContractType, ContractStatus } from '../../../types/contract'

export interface AdminAgent {
  id: string
  name: string
  initials: string
  color: string
}

export const ADMIN_AGENTS: AdminAgent[] = [
  { id: 'agent-1', name: 'Karim Eloui', initials: 'KE', color: 'bg-purple-500' },
  { id: 'agent-2', name: 'Myriam Ababou', initials: 'MA', color: 'bg-blue-500' },
  { id: 'agent-3', name: 'Hayat Ouakrim', initials: 'HO', color: 'bg-emerald-500' },
]

export { mockContracts, CONTRACT_TYPE_LABELS, CONTRACT_STATUS_LABELS, CONTRACT_STATUS_COLORS, contractFilters }
export type { Contract, ContractType, ContractStatus }
export type { Contract as AdminContract }
