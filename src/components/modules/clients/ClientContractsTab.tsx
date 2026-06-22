import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, ChevronRight, Home } from 'react-feather'
import { Badge } from '../../ui/Badge'
import { Button } from '../../ui/Button'
import {
  getClientContracts,
  CONTRACT_TYPE_LABELS,
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
  partyRoleColor,
} from '../../../types/contract'

export const ClientContractsTab = ({ clientId, clientName }: { clientId: string; clientName: string }) => {
  const navigate = useNavigate()
  const contracts = useMemo(() => getClientContracts(clientId), [clientId])

  if (contracts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
        <FileText size={32} className="mb-3 opacity-40" />
        <p className="text-sm">Aucun contrat pour ce client</p>
        <p className="text-xs text-text-secondary/60 mt-1">Les contrats sont générés automatiquement lors des transactions</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-secondary">
          {contracts.length} contrat{contracts.length !== 1 ? 's' : ''} lié{contracts.length !== 1 ? 's' : ''} à <span className="font-medium text-text">{clientName}</span>
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-background border-b border-border">
              <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Réf.</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Type</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Statut</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Rôle</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Bien</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-text-secondary">Créé le</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-text-secondary">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {contracts.map((c, i) => {
              const role = c.partieA.id === clientId ? c.partieA.type : c.partieB.type
              return (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.2 }}
                  className="hover:bg-background/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/contracts/${c.id}`)}
                >
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">{c.reference}</td>
                  <td className="px-4 py-3 text-xs font-medium text-text">{CONTRACT_TYPE_LABELS[c.type]}</td>
                  <td className="px-4 py-3">
                    <Badge className={CONTRACT_STATUS_COLORS[c.status]}>
                      {CONTRACT_STATUS_LABELS[c.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-lg border ${partyRoleColor(role)}`}>
                      {role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Home size={12} className="text-text-secondary/60 shrink-0" />
                      <span className="text-sm text-text truncate max-w-[150px]">{c.propertyTitle}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-secondary">
                    {new Date(c.dateCreation).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" icon={<ChevronRight size={13} />} onClick={(e) => { e.stopPropagation(); navigate(`/contracts/${c.id}`) }} />
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
