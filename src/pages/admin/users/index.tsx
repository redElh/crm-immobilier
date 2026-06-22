import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Card from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { BackLink } from '../../../components/ui/BackLink'
import { Select } from '../../../components/ui/Select'
import {
  Users, Shield, UserCheck, UserX, Search,
  ChevronDown, Edit3, Eye, Trash2, Mail, Lock,
  Activity, MoreHorizontal, Plus, Filter,
  X, ToggleLeft, ToggleRight, Clock, BarChart2,
  ChevronLeft, ChevronRight, CheckCircle, AlertTriangle,
  Camera, ArrowUpRight, ArrowDownRight, UserPlus
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
  created_at: string
  last_login?: string
}

const roles = ['Tous', 'admin', 'agent', 'manager', 'stagiaire']
const statuses = ['Tous', 'Actif', 'Inactif']
const ITEMS_PER_PAGE = 5

const mockUsers: UserData[] = [
  { id: 1, first_name: 'Myriam', last_name: 'ABABOU', email: 'myriam@squaremeter.com', phone: '+212 6 12 34 56 78', role: 'admin', is_active: true, created_at: '2025-01-15', last_login: '13/06/2026 09:30' },
  { id: 2, first_name: 'Karim', last_name: 'Eloui', email: 'karim@squaremeter.com', phone: '+212 6 23 45 67 89', role: 'agent', is_active: true, created_at: '2025-02-20', last_login: '13/06/2026 08:15' },
  { id: 3, first_name: 'Yasmine', last_name: 'AATIC', email: 'yasmine@squaremeter.com', phone: '+212 6 34 56 78 90', role: 'agent', is_active: true, created_at: '2025-03-10', last_login: '12/06/2026 17:45' },
  { id: 4, first_name: 'Dimitri', last_name: 'DJEDJE', email: 'dimitri@squaremeter.com', phone: '+212 6 45 67 89 01', role: 'agent', is_active: false, created_at: '2025-04-05', last_login: '01/06/2026 10:00' },
  { id: 5, first_name: 'Hayat', last_name: 'OUAKRIM', email: 'hayat@squaremeter.com', phone: '+212 6 56 78 90 12', role: 'agent', is_active: true, created_at: '2025-05-12', last_login: '10/06/2026 14:30' },
  { id: 6, first_name: 'Sophie', last_name: 'Martin', email: 'sophie@squaremeter.com', phone: '+212 6 67 89 01 23', role: 'manager', is_active: true, created_at: '2025-06-01', last_login: '13/06/2026 11:00' },
  { id: 7, first_name: 'Ahmed', last_name: 'Benali', email: 'ahmed@squaremeter.com', phone: '+212 6 78 90 12 34', role: 'agent', is_active: true, created_at: '2025-06-15', last_login: '11/06/2026 09:00' },
  { id: 8, first_name: 'Leila', last_name: 'Benbrahim', email: 'leila@squaremeter.com', phone: '+212 6 89 01 23 45', role: 'stagiaire', is_active: true, created_at: '2025-07-01', last_login: '12/06/2026 16:00' },
  { id: 9, first_name: 'Thomas', last_name: 'Dupont', email: 'thomas@squaremeter.com', phone: '+212 6 90 12 34 56', role: 'agent', is_active: false, created_at: '2025-07-20', last_login: '20/05/2026 13:00' },
  { id: 10, first_name: 'Nadia', last_name: 'Bennani', email: 'nadia@squaremeter.com', phone: '+212 6 01 23 45 67', role: 'admin', is_active: true, created_at: '2025-08-10', last_login: '12/06/2026 18:00' },
  { id: 11, first_name: 'Omar', last_name: 'Idrissi', email: 'omar@squaremeter.com', phone: '+212 6 11 22 33 44', role: 'agent', is_active: true, created_at: '2025-09-05', last_login: '10/06/2026 11:30' },
  { id: 12, first_name: 'Fatima', last_name: 'Zahra', email: 'fatima@squaremeter.com', phone: '+212 6 22 33 44 55', role: 'stagiaire', is_active: true, created_at: '2025-10-01', last_login: '09/06/2026 15:45' },
]

const roleColors: Record<string, { bg: string, text: string }> = {
  admin: { bg: 'bg-amber-100', text: 'text-amber-700' },
  agent: { bg: 'bg-accent-light', text: 'text-accent' },
  manager: { bg: 'bg-violet-100', text: 'text-violet-700' },
  stagiaire: { bg: 'bg-blue-100', text: 'text-blue-700' },
}

const roleBadgeColors: Record<string, 'primary' | 'default' | 'secondary' | 'success'> = {
  admin: 'primary',
  agent: 'default',
  manager: 'secondary',
  stagiaire: 'default',
}

interface CreateFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  role: string
  position: string
  sendEmail: boolean
  requirePasswordChange: boolean
}

interface MenuPosition {
  top: number
  right: number
}

interface ActionMenuProps {
  user: UserData
  position: MenuPosition
  onClose: () => void
  onToggleStatus: (id: number) => void
  onDelete: (id: number) => void
  onResetPassword: (id: number) => void
}

function ActionMenu({ user, position, onClose, onToggleStatus, onDelete, onResetPassword }: ActionMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  const actions = [
    { icon: Edit3, label: 'Modifier', onClick: () => {} },
    { icon: Eye, label: 'Voir le profil', onClick: () => window.location.href = `/admin/users/${user.id}` },
    { icon: user.is_active ? ToggleLeft : ToggleRight, label: user.is_active ? 'Désactiver' : 'Activer', onClick: () => onToggleStatus(user.id) },
    { icon: Mail, label: 'Renvoyer les identifiants', onClick: () => {} },
    { icon: Lock, label: 'Réinitialiser le mot de passe', onClick: () => onResetPassword(user.id) },
    { icon: Activity, label: "Voir l'activité", onClick: () => window.location.href = `/admin/users/${user.id}` },
    { icon: UserX, label: "Bloquer l'accès", onClick: () => onToggleStatus(user.id) },
    { icon: Trash2, label: 'Supprimer', onClick: () => onDelete(user.id), danger: true },
  ]

  return (
    <AnimatePresence>
      <>
        <motion.div
          className="fixed inset-0 z-40"
          onClick={onClose}
        />
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
                action.danger
                  ? 'text-error hover:bg-error/5'
                  : 'text-text-secondary hover:text-text hover:bg-background'
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

function getPasswordStrength(pw: string): { label: string; color: string; width: string } {
  if (!pw) return { label: '', color: '', width: '0%' }
  const score = Math.min(
    (pw.length >= 8 ? 1 : 0) +
    (/[a-z]/.test(pw) ? 1 : 0) +
    (/[A-Z]/.test(pw) ? 1 : 0) +
    (/[0-9]/.test(pw) ? 1 : 0) +
    (/[^a-zA-Z0-9]/.test(pw) ? 1 : 0),
    5
  )
  if (score <= 2) return { label: 'Faible', color: 'bg-error', width: '40%' }
  if (score <= 3) return { label: 'Moyen', color: 'bg-amber-500', width: '60%' }
  if (score <= 4) return { label: 'Fort', color: 'bg-emerald-500', width: '80%' }
  return { label: 'Très fort', color: 'bg-emerald-600', width: '100%' }
}

export default function AdminUsersPage() {
  const [users] = useState<UserData[]>(mockUsers)
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>(mockUsers)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('Tous')
  const [statusFilter, setStatusFilter] = useState('Tous')
  const [showFilters, setShowFilters] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [menuTarget, setMenuTarget] = useState<{ user: UserData; position: MenuPosition } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [formData, setFormData] = useState<CreateFormData>({
    firstName: '', lastName: '', email: '', phone: '',
    password: '', confirmPassword: '', role: 'agent',
    position: '', sendEmail: true, requirePasswordChange: true
  })

  useEffect(() => {
    let result = [...users]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(u =>
        u.first_name.toLowerCase().includes(q) ||
        u.last_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      )
    }
    if (roleFilter !== 'Tous') result = result.filter(u => u.role === roleFilter)
    if (statusFilter === 'Actif') result = result.filter(u => u.is_active)
    if (statusFilter === 'Inactif') result = result.filter(u => !u.is_active)
    setFilteredUsers(result)
    setCurrentPage(1)
  }, [search, roleFilter, statusFilter, users])

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    agents: users.filter(u => u.role === 'agent').length,
    inactifs: users.filter(u => !u.is_active).length,
  }

  const handleToggleStatus = (id: number) => {
    setFilteredUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: !u.is_active } : u))
  }

  const handleDelete = (id: number) => {
    if (window.confirm('Supprimer cet utilisateur ?')) {
      setFilteredUsers(prev => prev.filter(u => u.id !== id))
    }
  }

  const handleResetPassword = (id: number) => {
    alert('Un email de réinitialisation a été envoyé.')
  }

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      alert('Les mots de passe ne correspondent pas.')
      return
    }
    alert('Utilisateur créé avec succès.')
    setShowCreateModal(false)
    setFormData({ firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '', role: 'agent', position: '', sendEmail: true, requirePasswordChange: true })
  }

  const pwStrength = getPasswordStrength(formData.password)

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <BackLink to="/admin" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Users size={20} className="text-amber-700" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Gestion des utilisateurs</h1>
            <p className="text-sm text-text-secondary mt-0.5">Gérez les administrateurs et les agents de votre agence</p>
          </div>
        </div>
        <Button variant="default" icon={<Plus size={14} />} onClick={() => setShowCreateModal(true)}>
          Ajouter un utilisateur
        </Button>
      </div>

      {/* Stats */}
      <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
      </motion.div>

      {/* Search + Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/60" />
            <input
              type="text"
              placeholder="Rechercher par nom, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-border/50 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
              showFilters || roleFilter !== 'Tous' || statusFilter !== 'Tous'
                ? 'border-accent bg-accent-light text-accent'
                : 'border-border/50 text-text-secondary hover:text-text hover:bg-background'
            }`}
          >
            <Filter size={14} />
            Filtres
            {(roleFilter !== 'Tous' || statusFilter !== 'Tous') && (
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            )}
          </button>
        </div>
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap items-end gap-4 pt-4 mt-3 border-t border-border/30">
                <div>
                  <label className="block text-xs text-text-secondary mb-1.5 font-medium">Rôle</label>
                  <Select
                    value={roleFilter}
                    onChange={(val) => setRoleFilter(val)}
                    options={roles.map(r => ({ value: r, label: r === 'Tous' ? 'Tous les rôles' : r }))}
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1.5 font-medium">Statut</label>
                  <Select
                    value={statusFilter}
                    onChange={(val) => setStatusFilter(val)}
                    options={statuses.map(s => ({ value: s, label: s === 'Tous' ? 'Tous les statuts' : s }))}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setRoleFilter('Tous'); setStatusFilter('Tous'); setSearch('') }}
                >
                  Réinitialiser
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Users Table */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">
            {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''}
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30 text-left text-xs text-text-secondary">
                <th className="pb-3 font-medium">Utilisateur</th>
                <th className="pb-3 font-medium">Email</th>
                <th className="pb-3 font-medium">Rôle</th>
                <th className="pb-3 font-medium">Statut</th>
                <th className="pb-3 font-medium">Dernière connexion</th>
                <th className="pb-3 font-medium w-12"></th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user) => {
                const roleColor = roleColors[user.role] || roleColors.agent
                return (
                  <tr key={user.id} className="border-b border-border/20 hover:bg-background/50 transition-colors group">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full ${roleColor.bg} ${roleColor.text} flex items-center justify-center text-xs font-semibold flex-shrink-0`}>
                          {user.first_name[0]}{user.last_name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{user.first_name} {user.last_name}</p>
                          <p className="text-xs text-text-secondary/60">{user.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-text-secondary text-xs">{user.email}</td>
                    <td className="py-3">
                      <Badge variant={roleBadgeColors[user.role] || 'default'} size="sm">
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-text-secondary/40'}`} />
                        <span className={`text-xs font-medium ${user.is_active ? 'text-emerald-600' : 'text-text-secondary'}`}>
                          {user.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-xs text-text-secondary">
                      {user.last_login || '-'}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={(e) => {
                          if (menuTarget?.user.id === user.id) {
                            setMenuTarget(null)
                          } else {
                            const rect = e.currentTarget.getBoundingClientRect()
                            const menuHeight = 300
                            let top = rect.bottom + 4
                            if (top + menuHeight > window.innerHeight) {
                              top = rect.top - menuHeight - 4
                            }
                            setMenuTarget({
                              user,
                              position: { top, right: window.innerWidth - rect.right }
                            })
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-background text-text-secondary hover:text-text transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                )
              })}
              {paginatedUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-text-secondary text-sm">
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 mt-3 border-t border-border/30">
            <p className="text-xs text-text-secondary">
              Affichage {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} sur {filteredUsers.length} utilisateurs
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg hover:bg-background text-text-secondary hover:text-text disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                    page === currentPage
                      ? 'bg-accent text-white'
                      : 'text-text-secondary hover:text-text hover:bg-background'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg hover:bg-background text-text-secondary hover:text-text disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Floating Action Menu */}
      {menuTarget && (
        <ActionMenu
          user={menuTarget.user}
          position={menuTarget.position}
          onClose={() => setMenuTarget(null)}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDelete}
          onResetPassword={handleResetPassword}
        />
      )}

      {/* Create User Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-2xl mx-4"
            >
              <Card className="p-0 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                      <UserPlus size={16} className="text-amber-700" />
                    </div>
                    <h2 className="font-semibold">Ajouter un utilisateur</h2>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-1.5 rounded-lg hover:bg-background text-text-secondary hover:text-text transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleCreateUser} className="p-6 space-y-6">
                  {/* Photo */}
                  <div>
                    <p className="text-xs text-text-secondary uppercase tracking-wider font-medium mb-3">Photo de profil</p>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-background border-2 border-dashed border-border/60 flex items-center justify-center text-text-secondary/40">
                        <Camera size={22} />
                      </div>
                      <Button type="button" variant="outline" size="sm">Télécharger une photo</Button>
                    </div>
                  </div>

                  {/* Personal Info */}
                  <div>
                    <p className="text-xs text-text-secondary uppercase tracking-wider font-medium mb-3">Informations personnelles</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-text-secondary mb-1">Prénom <span className="text-error">*</span></label>
                        <input
                          type="text" required
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-lg border border-border/50 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-text-secondary mb-1">Nom <span className="text-error">*</span></label>
                        <input
                          type="text" required
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-lg border border-border/50 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-text-secondary mb-1">Email <span className="text-error">*</span></label>
                        <input
                          type="email" required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-lg border border-border/50 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-text-secondary mb-1">Téléphone</label>
                        <input
                          type="text"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-lg border border-border/50 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Professional Info */}
                  <div>
                    <p className="text-xs text-text-secondary uppercase tracking-wider font-medium mb-3">Informations professionnelles</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm text-text-secondary mb-1">Agence <span className="text-error">*</span></label>
                        <Select value="M2 Square Meter" onChange={() => {}} options={[{ value: 'M2 Square Meter', label: 'M2 Square Meter' }]} />
                      </div>
                      <div>
                        <label className="block text-sm text-text-secondary mb-1">Poste</label>
                        <input
                          type="text"
                          value={formData.position}
                          onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                          placeholder="Agent Commercial"
                          className="w-full px-3 py-2.5 rounded-lg border border-border/50 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                      </div>
                    </div>
                    <div>
                      <p className="block text-sm text-text-secondary mb-2">Rôle <span className="text-error">*</span></p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { value: 'admin', label: 'Administrateur', desc: 'Accès total' },
                          { value: 'manager', label: 'Manager', desc: 'Supervision équipe' },
                          { value: 'agent', label: 'Agent', desc: 'Gestion opérationnelle' },
                          { value: 'stagiaire', label: 'Stagiaire', desc: 'Consultation seule' },
                        ].map((opt) => (
                          <label
                            key={opt.value}
                            className={`p-3 rounded-xl border cursor-pointer transition-all ${
                              formData.role === opt.value
                                ? 'border-accent bg-accent-light/30 ring-1 ring-accent/20'
                                : 'border-border/50 hover:border-border hover:bg-background'
                            }`}
                          >
                            <input
                              type="radio"
                              name="role"
                              value={opt.value}
                              checked={formData.role === opt.value}
                              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                              className="sr-only"
                            />
                            <p className="text-sm font-medium">{opt.label}</p>
                            <p className="text-xs text-text-secondary mt-0.5">{opt.desc}</p>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Security */}
                  <div>
                    <p className="text-xs text-text-secondary uppercase tracking-wider font-medium mb-3">Sécurité</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="block text-sm text-text-secondary mb-1">Mot de passe <span className="text-error">*</span></label>
                        <input
                          type="password" required
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-lg border border-border/50 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-text-secondary mb-1">Confirmer <span className="text-error">*</span></label>
                        <input
                          type="password" required
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-lg border border-border/50 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                      </div>
                    </div>
                    {formData.password && (
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex-1 h-1.5 bg-border/60 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-300 ${pwStrength.color}`} style={{ width: pwStrength.width }} />
                        </div>
                        <span className={`text-xs font-medium ${
                          pwStrength.label === 'Faible' ? 'text-error' :
                          pwStrength.label === 'Moyen' ? 'text-amber-600' :
                          'text-emerald-600'
                        }`}>
                          {pwStrength.label}
                        </span>
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2.5 text-sm text-text-secondary cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.sendEmail}
                          onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
                          className="rounded border-border/50 accent-accent"
                        />
                        Envoyer les identifiants par email à l'utilisateur
                      </label>
                      <label className="flex items-center gap-2.5 text-sm text-text-secondary cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.requirePasswordChange}
                          onChange={(e) => setFormData({ ...formData, requirePasswordChange: e.target.checked })}
                          className="rounded border-border/50 accent-accent"
                        />
                        Exiger un changement de mot de passe à la première connexion
                      </label>
                    </div>
                  </div>

                  {/* Permissions (shown when admin role) */}
                  {formData.role === 'admin' && (
                    <div>
                      <p className="text-xs text-text-secondary uppercase tracking-wider font-medium mb-3">Permissions</p>
                      <div className="p-4 rounded-xl bg-background border border-border/50 space-y-2.5">
                        {[
                          'Accès à tous les modules',
                          'Gestion des utilisateurs',
                          'Gestion de l\'agence',
                          'Export des données',
                          'Paramètres système',
                        ].map((perm) => (
                          <label key={perm} className="flex items-center gap-2.5 text-sm text-text cursor-pointer">
                            <input type="checkbox" defaultChecked className="rounded border-border/50 accent-accent" />
                            {perm}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/50">
                    <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>Annuler</Button>
                    <Button type="submit" variant="default" icon={<UserPlus size={14} />}>
                      Créer l'utilisateur
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
