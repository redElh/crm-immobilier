import { API_ORIGIN } from '../../../utils/config'
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Card from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { BackLink } from '../../../components/ui/BackLink'
import { useToast } from '../../../components/ui/Toast'
import {
  Users, Plus, MoreHorizontal, Search, Shield, UserCheck, UserX,
  Eye, Trash2, Lock, CheckCircle, Mail,
  ChevronLeft, ChevronRight, RefreshCw
} from 'react-feather'
import { getAuthToken } from '../../../utils/auth'

interface UserData {
  id: number
  first_name: string
  last_name: string
  email: string
  phone: string
  role: string
  is_active: boolean
  status: string
  last_login_at: string | null
  require_password_change: boolean
  created_at: string
  days_since_last_login: number | null
  inactivity_level: { level: string; days: number | null }
}

const ITEMS_PER_PAGE = 8
const API = `${API_ORIGIN}/api/admin`

const roleBadgeColors: Record<string, 'primary' | 'default' | 'warning'> = {
  admin: 'primary',
  gerant: 'warning',
  agent: 'default',
}

interface MenuPosition { top: number; right: number }

function ActionMenu({ user, position, onClose, onReactivate, onDelete, onResetPassword, onResendCredentials, adminId }: {
  user: UserData; position: MenuPosition; onClose: () => void
  onReactivate: (id: number) => void; onDelete: (id: number) => void; onResetPassword: (id: number) => void
  onResendCredentials: (id: number) => void
  adminId: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const actions = [
    { icon: Eye, label: 'Voir le profil', onClick: () => window.location.href = `/admin/${adminId}/users/${user.id}` },
    { icon: Lock, label: 'Réinitialiser le mot de passe', onClick: () => onResetPassword(user.id) },
    { icon: Mail, label: 'Renvoyer les identifiants', onClick: () => onResendCredentials(user.id) },
    ...(user.status === 'inactif' || user.status === 'suspendu'
      ? [{ icon: CheckCircle, label: 'Réactiver le compte', onClick: () => onReactivate(user.id) }]
      : []),
    { icon: Trash2, label: 'Supprimer', onClick: () => onDelete(user.id), danger: true },
  ]

  return (
    <AnimatePresence>
      <>
        <motion.div className="fixed inset-0 z-40" onClick={onClose} />
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.12 }}
          style={{ position: 'fixed', top: position.top, right: position.right }}
          className="w-56 bg-card rounded-xl border border-border/50 shadow-dropdown py-1 z-50 max-h-[300px] overflow-y-auto scrollbar-thin"
        >
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={() => { action.onClick(); onClose() }}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                action.danger ? 'text-error hover:bg-error/5' : 'text-text-secondary hover:text-text hover:bg-background'
              }`}
            >
              <action.icon size={14} />
              {action.label}
            </button>
          ))}
        </motion.div>
      </>
    </AnimatePresence>
  )
}

export default function EquipePage() {
  const { adminId } = useParams<{ adminId: string }>()
  const { toast } = useToast()
  const token = getAuthToken()
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [menuTarget, setMenuTarget] = useState<{ user: UserData; position: MenuPosition } | null>(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API}/users`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Failed to fetch')
      setUsers(await res.json())
    } catch (err) {
      console.error('Error fetching users:', err)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchUsers() }, [])

  const filtered = users.filter(u => {
    if (!search) return true
    const q = search.toLowerCase()
    return u.first_name.toLowerCase().includes(q) ||
      u.last_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
  })

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    agents: users.filter(u => u.role === 'agent').length,
    inactifs: users.filter(u => u.status === 'inactif' || u.status === 'suspendu').length,
  }

  const handleReactivate = async (id: number) => {
    try {
      const res = await fetch(`${API}/users/${id}/reactivate`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Failed')
      toast('success', 'Compte réactivé avec succès')
      await fetchUsers()
    } catch { toast('error', 'Erreur lors de la réactivation') }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Supprimer définitivement cet utilisateur ?')) return
    try {
      const res = await fetch(`${API}/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error('Failed')
      toast('success', 'Utilisateur supprimé')
      await fetchUsers()
    } catch { toast('error', 'Erreur lors de la suppression') }
  }

  const handleResetPassword = async (id: number) => {
    try {
      const res = await fetch(`${API_ORIGIN}/api/admin/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: users.find(u => u.id === id)?.email })
      })
      if (!res.ok) throw new Error('Failed')
      toast('success', 'Email de réinitialisation envoyé')
    } catch { toast('error', 'Erreur lors de l\'envoi') }
  }

  const handleResendCredentials = async (id: number) => {
    const target = users.find(u => String(u.id) === String(id))
    if (!window.confirm(`Renvoyer les identifiants à ${target?.first_name || ''} ${target?.last_name || ''} ? Un nouveau mot de passe sera généré et l'ancien sera invalidé.`)) return
    try {
      const res = await fetch(`${API}/users/${id}/resend-credentials`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed')
      toast('success', `Identifiants renvoyés par email à ${target?.first_name || ''} ${target?.last_name || ''}.`)
    } catch { toast('error', 'Erreur lors du renvoi des identifiants') }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <BackLink />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Users size={20} className="text-amber-700" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Gestion de l'équipe</h1>
            <p className="text-sm text-text-secondary mt-0.5">Membres, rôles et permissions</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<RefreshCw size={14} />} onClick={fetchUsers} />
          <Button variant="default" icon={<Plus size={14} />} onClick={() => window.location.href = `/admin/${adminId}/users`}>
            Ajouter un membre
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Total', value: stats.total, color: 'bg-accent-light text-accent' },
          { icon: Shield, label: 'Admin', value: stats.admins, color: 'bg-amber-50 text-amber-600' },
          { icon: UserCheck, label: 'Agents', value: stats.agents, color: 'bg-emerald-50 text-emerald-600' },
          { icon: UserX, label: 'Inactifs', value: stats.inactifs, color: 'bg-red-50 text-red-600' },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-lg font-semibold leading-tight">{stat.value}</p>
                  <p className="text-xs text-text-secondary">{stat.label}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Members table */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/60" />
            <input
              type="text"
              placeholder="Rechercher par nom, email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-border/50 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <span className="text-xs text-text-secondary ml-auto">
            {loading ? 'Chargement...' : `${filtered.length} membre${filtered.length > 1 ? 's' : ''}`}
          </span>
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
                <th className="pb-3 font-medium">Dernière connexion</th>
                <th className="pb-3 font-medium w-12"></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((user) => {
                const initials = `${user.first_name[0] || ''}${user.last_name[0] || ''}`
                return (
                  <tr key={user.id} className="border-b border-border/20 hover:bg-background/50 transition-colors group">
                    <td className="py-3">
                      <div className="w-8 h-8 rounded-full bg-accent-light text-accent flex items-center justify-center text-xs font-semibold">
                        {initials}
                      </div>
                    </td>
                    <td className="py-3 text-sm font-medium">{user.first_name} {user.last_name}</td>
                    <td className="py-3 text-sm text-text-secondary">{user.email}</td>
                    <td className="py-3">
                      <Badge variant={roleBadgeColors[user.role] || 'default'} size="sm">
                        {user.role === 'admin' ? 'Administrateur' : user.role === 'gerant' ? 'Gérant' : 'Agent'}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        {user.status === 'actif' && (
                          <><span className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-xs font-medium text-emerald-600">Actif</span></>
                        )}
                        {user.status === 'inactif' && (
                          <><span className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-xs font-medium text-amber-600">Inactif</span></>
                        )}
                        {user.status === 'suspendu' && (
                          <><span className="w-2 h-2 rounded-full bg-red-500" /><span className="text-xs font-medium text-red-600">Suspendu</span></>
                        )}
                        {user.status === 'supprimé' && (
                          <><span className="w-2 h-2 rounded-full bg-gray-500" /><span className="text-xs font-medium text-gray-500">Supprimé</span></>
                        )}
                        {user.days_since_last_login !== null && user.days_since_last_login > 0 && (
                          <span className="text-[10px] text-text-secondary/60 ml-1">{user.days_since_last_login}j</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-xs text-text-secondary">
                      {user.last_login_at
                        ? new Date(user.last_login_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : '-'}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={(e) => {
                          if (menuTarget?.user.id === user.id) { setMenuTarget(null); return }
                          const rect = e.currentTarget.getBoundingClientRect()
                          const mh = 300
                          let top = rect.bottom + 4
                          if (top + mh > window.innerHeight) top = rect.top - mh - 4
                          setMenuTarget({ user, position: { top, right: window.innerWidth - rect.right } })
                        }}
                        className="p-1.5 rounded-lg hover:bg-background text-text-secondary hover:text-text transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                )
              })}
              {paginated.length === 0 && (
                <tr><td colSpan={7} className="py-10 text-center text-text-secondary text-sm">Aucun membre trouvé</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 mt-3 border-t border-border/30">
            <p className="text-xs text-text-secondary">
              Affichage {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} sur {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="p-1.5 rounded-lg hover:bg-background text-text-secondary hover:text-text disabled:opacity-30 disabled:pointer-events-none transition-colors">
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button key={page} onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${page === currentPage ? 'bg-accent text-white' : 'text-text-secondary hover:text-text hover:bg-background'}`}>
                  {page}
                </button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg hover:bg-background text-text-secondary hover:text-text disabled:opacity-30 disabled:pointer-events-none transition-colors">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Roles & Permissions */}
      <Card className="p-6">
        <h3 className="font-semibold mb-5">Rôles et permissions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'Administrateur', desc: 'Accès total à toutes les fonctionnalités', perms: ['Gestion des utilisateurs', 'Configuration', 'Toutes les données'] },
            { title: 'Agent', desc: 'Gestion des clients, biens et transactions', perms: ['Clients', 'Biens immobiliers', 'Transactions', 'Calendrier'] },
          ].map((role) => (
            <div key={role.title} className="p-4 rounded-xl border border-border/50">
              <h4 className="font-semibold text-sm mb-1">{role.title}</h4>
              <p className="text-xs text-text-secondary mb-3">{role.desc}</p>
              <ul className="space-y-1.5">
                {role.perms.map((p) => (
                  <li key={p} className="text-xs text-text-secondary flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-accent" /> {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {/* Floating action menu */}
      {menuTarget && (
        <ActionMenu
          user={menuTarget.user}
          position={menuTarget.position}
          adminId={adminId!}
          onClose={() => setMenuTarget(null)}
          onReactivate={handleReactivate}
          onDelete={handleDelete}
          onResetPassword={handleResetPassword}
          onResendCredentials={handleResendCredentials}
        />
      )}
    </motion.div>
  )
}
