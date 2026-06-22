import { useState } from 'react'
import Card from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { BackLink } from '../../../components/ui/BackLink'
import { Users, Plus, MoreHorizontal } from 'react-feather'
import { motion } from 'framer-motion'

const isAdmin = true

const teamMembers = [
  { name: 'Myriam ABABOU', initials: 'MA', email: 'myriam@squaremeter.com', role: 'Admin', active: true },
  { name: 'Karim Eloui', initials: 'KE', email: 'karim@squaremeter.com', role: 'Agent', active: true },
  { name: 'Yasmine AATIC', initials: 'YA', email: 'yasmine@squaremeter.com', role: 'Agent', active: true },
  { name: 'Dimitri DJEDJE', initials: 'DD', email: 'dimitri@squaremeter.com', role: 'Agent', active: false },
]

const roleCards = [
  { title: 'Admin', description: 'Accès total à toutes les fonctionnalités', permissions: ['Gestion des utilisateurs', 'Configuration', 'Facturation', 'Toutes les données'] },
  { title: 'Agent', description: 'Gestion des clients, biens et transactions', permissions: ['Clients', 'Biens immobiliers', 'Transactions', 'Calendrier'] },
  { title: 'Stagiaire', description: 'Consultation uniquement', permissions: ['Consultation des clients', 'Consultation des biens', 'Consultation des transactions'] },
]

const activityData = [
  { name: 'Myriam A.', initials: 'MA', actions: 47 },
  { name: 'Karim E.', initials: 'KE', actions: 32 },
  { name: 'Yasmine A.', initials: 'YA', actions: 28 },
]

export default function EquipePage() {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <BackLink />
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Gestion de l'équipe</h1>
        {isAdmin && <Badge variant="primary">Admin</Badge>}
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold">Membres</h3>
          <Button variant="default" icon={<Plus size={14} />}>Inviter un membre</Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30 text-left text-xs text-text-secondary">
                <th className="pb-3 font-medium w-12"></th>
                <th className="pb-3 font-medium">Nom</th>
                <th className="pb-3 font-medium">Email</th>
                <th className="pb-3 font-medium">Rôle</th>
                <th className="pb-3 font-medium">Statut</th>
                <th className="pb-3 font-medium w-12"></th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((member, i) => (
                <tr key={i} className="border-b border-border/20 hover:bg-background/50 transition-colors">
                  <td className="py-3">
                    <div className="w-8 h-8 rounded-full bg-accent-light text-accent flex items-center justify-center text-xs font-semibold">
                      {member.initials}
                    </div>
                  </td>
                  <td className="py-3 text-sm font-medium">{member.name}</td>
                  <td className="py-3 text-sm text-text-secondary">{member.email}</td>
                  <td className="py-3">
                    <span className="text-sm">{member.role}</span>
                  </td>
                  <td className="py-3">
                    {member.active ? (
                      <Badge variant="success">Actif</Badge>
                    ) : (
                      <Badge variant="default">Inactif</Badge>
                    )}
                  </td>
                  <td className="py-3">
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal size={14} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-5">Rôles et permissions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          {roleCards.map((role) => (
            <div key={role.title} className="p-4 rounded-xl border border-border/50">
              <h4 className="font-semibold text-sm mb-1">{role.title}</h4>
              <p className="text-xs text-text-secondary mb-3">{role.description}</p>
              <ul className="space-y-1.5">
                {role.permissions.map((p) => (
                  <li key={p} className="text-xs text-text-secondary flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-accent" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <Button variant="outline">Gérer les rôles</Button>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-5">Activité de l'équipe — 7 derniers jours</h3>
        <div className="space-y-4">
          {activityData.map((member) => {
            const maxActions = Math.max(...activityData.map((a) => a.actions))
            const pct = Math.round((member.actions / maxActions) * 100)
            return (
              <div key={member.name} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-accent-light text-accent flex items-center justify-center text-xs font-semibold shrink-0">
                  {member.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium">{member.name}</span>
                    <span className="text-xs text-text-secondary">{member.actions} actions</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-background overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </motion.div>
  )
}
