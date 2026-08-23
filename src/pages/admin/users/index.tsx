import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams } from 'react-router-dom'
import Card from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { BackLink } from '../../../components/ui/BackLink'
import { Select } from '../../../components/ui/Select'
import { useToast } from '../../../components/ui/Toast'
import {
  Users, Shield, UserCheck, UserX, Search,
  Eye, EyeOff, Edit3, Trash2, Mail, Lock,
  Activity, MoreHorizontal, Plus, Filter,
  X, ToggleLeft, ToggleRight,
  ChevronLeft, ChevronRight, CheckCircle,
  UserPlus, RefreshCw
} from 'react-feather'
import { api } from '../../../services/api'
import { PhoneInput } from '../../../components/ui/PhoneInput'

interface UserData {
  id: number
  first_name: string
  last_name: string
  email: string
  phone: string
  role: string
  position: string
  is_owner: boolean
  is_active: boolean
  status: string
  last_login_at: string | null
  last_activity_at: string | null
  require_password_change: boolean
  created_at: string
  days_since_last_login: number | null
  inactivity_level: { level: string; days: number | null }
}

const roles = ['Tous', 'admin', 'gerant', 'agent']
const statuses = ['Tous', 'Actif', 'Inactif', 'Suspendu']
const ITEMS_PER_PAGE = 5

const roleLabels: Record<string, string> = {
  admin: 'Administrateur',
  gerant: 'Gérant',
  agent: 'Agent',
}

const roleColors: Record<string, { bg: string, text: string }> = {
  admin: { bg: 'bg-amber-100', text: 'text-amber-700' },
  gerant: { bg: 'bg-orange-100', text: 'text-orange-700' },
  agent: { bg: 'bg-accent-light', text: 'text-accent' },
}

const roleBadgeColors: Record<string, 'primary' | 'default' | 'warning' | 'secondary' | 'success'> = {
  admin: 'primary',
  gerant: 'warning',
  agent: 'default',
}

const AGENT_POSITIONS = [
  { value: 'Responsable agence', label: 'Responsable agence' },
  { value: 'Responsable secteur', label: 'Responsable secteur' },
  { value: 'Commercial', label: 'Commercial' },
  { value: 'Secrétariat', label: 'Secrétariat' },
  { value: 'Stagiaire', label: 'Stagiaire' },
  { value: 'Traducteur', label: 'Traducteur' },
  { value: 'Conciergerie', label: 'Conciergerie' },
]

function getRoleLabel(user: UserData): string {
  if (user.role === 'admin') return 'Administrateur'
  if (user.role === 'gerant') return 'Gérant'
  if (user.role === 'agent' && user.position) return user.position
  return 'Agent'
}

const ADMIN_BUTTON_CLASSES = 'bg-amber-600 hover:bg-amber-700 border-amber-600 hover:border-amber-700 text-white shadow-[0_10px_24px_rgba(217,119,6,0.35)]'
const GERANT_BUTTON_CLASSES = 'bg-[#905D5D] hover:bg-[#7D5050] border-[#905D5D] hover:border-[#7D5050] text-white shadow-[0_10px_24px_rgba(144,93,93,0.35)]'

function getRoleColor(role: string, isGerant: boolean): { bg: string; text: string } {
  const base = roleColors[role] || roleColors.agent
  if (!isGerant) return base
  return { bg: 'bg-[#E7D5D5]', text: 'text-[#905D5D]' }
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

interface FormErrors {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  confirmPassword?: string
}

interface MenuPosition {
  top: number
  right: number
}

interface ActionMenuProps {
  user: UserData
  position: MenuPosition
  currentUserId?: number
  currentUserRole?: string
  onClose: () => void
  onEdit: (user: UserData) => void
  onToggleStatus: (id: number) => void
  onReactivate: (id: number) => void
  onDelete: (id: number) => void
  onResetPassword: (id: number) => void
  onResendCredentials: (id: number) => void
  adminId: string
}

function ActionMenu({ user, position, currentUserId, currentUserRole, onClose, onEdit, onToggleStatus, onReactivate, onDelete, onResetPassword, onResendCredentials, adminId }: ActionMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  const isSelf = currentUserId != null && String(currentUserId) === String(user.id)
  const isOwner = user.is_owner

  const actions = [
    ...(user.role === 'admin' || !(isOwner && !isSelf)
      ? [{ icon: Edit3, label: 'Modifier', onClick: () => onEdit(user) }]
      : []),
    { icon: Eye, label: 'Voir le profil', onClick: () => window.location.href = `/admin/${adminId}/users/${user.id}` },
    ...(user.role === 'agent' || user.role === 'gerant'
      ? [{ icon: Shield, label: 'Droits', onClick: () => window.location.href = `/admin/${adminId}/users/${user.id}/droits` }]
      : []),
    { icon: Lock, label: 'Réinitialiser le mot de passe', onClick: () => onResetPassword(user.id) },
    { icon: Mail, label: 'Renvoyer les identifiants', onClick: () => onResendCredentials(user.id) },
    ...(!isOwner && (user.status === 'inactif' || user.status === 'suspendu')
      ? [{ icon: CheckCircle, label: 'Réactiver le compte', onClick: () => onReactivate(user.id) }]
      : []),
    ...((user.role === 'admin' || !isOwner) && !isSelf
      ? [{ icon: user.is_active ? ToggleLeft : ToggleRight, label: user.is_active ? 'Désactiver' : 'Activer', onClick: () => onToggleStatus(user.id) }]
      : []),
    ...(!isOwner && !isSelf && user.role !== 'admin'
      ? [{ icon: Trash2, label: 'Supprimer', onClick: () => onDelete(user.id), danger: true }]
      : []),
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
  const { adminId } = useParams<{ adminId: string }>()
  const [users, setUsers] = useState<UserData[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('Tous')
  const [statusFilter, setStatusFilter] = useState('Tous')
  const [positionFilter, setPositionFilter] = useState('Tous')
  const [showFilters, setShowFilters] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [menuTarget, setMenuTarget] = useState<{ user: UserData; position: MenuPosition } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [formData, setFormData] = useState<CreateFormData>({
    firstName: '', lastName: '', email: '', phone: '',
    password: '', confirmPassword: '', role: 'agent', position: AGENT_POSITIONS[0].value,
    sendEmail: true, requirePasswordChange: true
  })
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: number; role: string } | null>(null)

  const { toast } = useToast()

  const isGerant = currentUser?.role === 'gerant'

  useEffect(() => {
    const load = async () => {
      try {
        const u = await api.get<any>('/auth/me')
        if (u?.id) setCurrentUser({ id: u.id, role: u.role })
      } catch (_) {}
    }
    load()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await api.get<UserData[]>('/admin/users')
      setUsers(data)
    } catch (err) {
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

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
    if (positionFilter !== 'Tous') result = result.filter(u => u.role === 'agent' && u.position === positionFilter)
    if (statusFilter === 'Actif') result = result.filter(u => u.status === 'actif')
    if (statusFilter === 'Inactif') result = result.filter(u => u.status === 'inactif')
    if (statusFilter === 'Suspendu') result = result.filter(u => u.status === 'suspendu')
    setFilteredUsers(result)
    setCurrentPage(1)
  }, [search, roleFilter, positionFilter, statusFilter, users])

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin' || u.role === 'gerant').length,
    agents: users.filter(u => u.role === 'agent').length,
    inactifs: users.filter(u => u.status === 'inactif' || u.status === 'suspendu').length,
  }

  const handleToggleStatus = async (id: number) => {
    try {
      await api.patch(`/admin/users/${id}/toggle-status`)
      await fetchUsers()
    } catch (err) {
      console.error('Error toggling status:', err)
    }
  }

  const handleReactivate = async (id: number) => {
    try {
      await api.patch(`/admin/users/${id}/reactivate`)
      await fetchUsers()
    } catch (err) {
      console.error('Error reactivating user:', err)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Supprimer cet utilisateur ?')) return
    try {
      await api.del(`/admin/users/${id}`)
      await fetchUsers()
    } catch (err) {
      console.error('Error deleting user:', err)
    }
  }

  const handleResetPassword = async (id: number) => {
    try {
      await api.post('/admin/forgot-password', { email: users.find(u => u.id === id)?.email })
      toast('success', 'Un email de réinitialisation a été envoyé.')
    } catch (err) {
      console.error('Error sending reset email:', err)
      toast('error', 'Erreur lors de l\'envoi de l\'email de réinitialisation.')
    }
  }

  const handleResendCredentials = async (id: number) => {
    const target = users.find(u => String(u.id) === String(id))
    if (!window.confirm(`Renvoyer les identifiants à ${target?.first_name || ''} ${target?.last_name || ''} ? Un nouveau mot de passe sera généré et l'ancien sera invalidé.`)) return
    try {
      await api.post(`/admin/users/${id}/resend-credentials`)
      toast('success', `Identifiants renvoyés par email à ${target?.first_name || ''} ${target?.last_name || ''}.`)
    } catch (err) {
      console.error('Error resending credentials:', err)
      toast('error', 'Erreur lors du renvoi des identifiants.')
    }
  }

  const handleRoleFilterChange = (val: string) => {
    setRoleFilter(val)
    if (val !== 'agent') setPositionFilter('Tous')
  }

  const openCreateModal = () => {
    setEditingUser(null)
    setShowPassword(false)
    setShowConfirmPassword(false)
    setFormData({
      firstName: '', lastName: '', email: '', phone: '',
      password: '', confirmPassword: '', role: 'agent', position: AGENT_POSITIONS[0].value,
      sendEmail: true, requirePasswordChange: true
    })
    setFormErrors({})
    setShowCreateModal(true)
  }

  const openEditModal = (user: UserData) => {
    setEditingUser(user)
    setShowPassword(false)
    setShowConfirmPassword(false)
    setFormData({
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      phone: user.phone || '',
      password: '',
      confirmPassword: '',
      role: user.role,
      position: user.role === 'agent' ? (user.position || AGENT_POSITIONS[0].value) : '',
      sendEmail: false,
      requirePasswordChange: false
    })
    setFormErrors({})
    setShowCreateModal(true)
  }

  const validateUserForm = () => {
    const errors: FormErrors = {}
    if (!formData.firstName.trim()) errors.firstName = 'Le prénom est requis'
    if (!formData.lastName.trim()) errors.lastName = 'Le nom est requis'
    if (!formData.email.trim()) {
      errors.email = 'L\'email est requis'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email invalide'
    }
    if (!editingUser) {
      if (!formData.password) {
        errors.password = 'Le mot de passe est requis'
      } else if (!formData.confirmPassword) {
        errors.confirmPassword = 'Veuillez confirmer le mot de passe'
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Les mots de passe ne correspondent pas'
      }
    } else if (formData.password) {
      if (formData.password.length < 6) {
        errors.password = 'Le mot de passe doit contenir au moins 6 caractères'
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Les mots de passe ne correspondent pas'
      }
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateUserForm()) return

    try {
      await api.post('/admin/users', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
        ...(formData.role === 'agent' ? { position: formData.position } : {}),
      })
      toast('success', 'Utilisateur créé avec succès. Un email avec ses identifiants lui a été envoyé.')
      setShowCreateModal(false)
      setEditingUser(null)
      setFormData({ firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '', role: 'agent', position: AGENT_POSITIONS[0].value, sendEmail: true, requirePasswordChange: true })
      setFormErrors({})
      await fetchUsers()
    } catch (err) {
      console.error('Error creating user:', err)
      toast('error', err instanceof Error ? err.message : 'Erreur lors de la création de l\'utilisateur.')
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    if (!validateUserForm()) return

    try {
      await api.put(`/admin/users/${editingUser.id}`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        is_active: editingUser.is_active,
        position: formData.role === 'agent' ? formData.position : '',
        ...(formData.password ? { password: formData.password } : {}),
      })
      toast('success', 'Utilisateur modifié avec succès.')
      setShowCreateModal(false)
      setEditingUser(null)
      setFormData({ firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '', role: 'agent', position: AGENT_POSITIONS[0].value, sendEmail: true, requirePasswordChange: true })
      setFormErrors({})
      await fetchUsers()
    } catch (err) {
      console.error('Error updating user:', err)
      toast('error', err instanceof Error ? err.message : 'Erreur lors de la modification de l\'utilisateur.')
    }
  }

  const pwStrength = getPasswordStrength(formData.password)

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <BackLink to={`/admin/${adminId}`} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isGerant ? 'bg-[#E7D5D5]' : 'bg-amber-100'}`}>
            <Users size={20} className={isGerant ? 'text-[#905D5D]' : 'text-amber-700'} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Gestion des utilisateurs</h1>
            <p className="text-sm text-text-secondary mt-0.5">Gérez les administrateurs et les agents de votre agence</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<RefreshCw size={14} />} onClick={fetchUsers} />
          <Button variant="default" className={isGerant ? GERANT_BUTTON_CLASSES : ADMIN_BUTTON_CLASSES} icon={<Plus size={14} />} onClick={openCreateModal}>
            Ajouter un utilisateur
          </Button>
        </div>
      </div>

      {/* Stats */}
      <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Total', value: stats.total, color: isGerant ? 'bg-[#E7D5D5] text-[#905D5D]' : 'bg-accent-light text-accent' },
          { icon: Shield, label: 'Admin', value: stats.admins, color: isGerant ? 'bg-[#E7D5D5] text-[#905D5D]' : 'bg-amber-50 text-amber-600' },
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
              showFilters || roleFilter !== 'Tous' || statusFilter !== 'Tous' || positionFilter !== 'Tous'
                ? isGerant ? 'border-[#905D5D] bg-[#E7D5D5] text-[#905D5D]' : 'border-accent bg-accent-light text-accent'
                : 'border-border/50 text-text-secondary hover:text-text hover:bg-background'
            }`}
          >
            <Filter size={14} />
            Filtres
            {(roleFilter !== 'Tous' || statusFilter !== 'Tous' || positionFilter !== 'Tous') && (
              <span className={`w-1.5 h-1.5 rounded-full ${isGerant ? 'bg-[#905D5D]' : 'bg-accent'}`} />
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
              <div className="flex flex-wrap items-end gap-4 pt-4 pb-3 mt-3 border-t border-border/30 px-3">
                <div className="w-44">
                  <label className="block text-xs text-text-secondary mb-1.5 font-medium">Rôle</label>
                  <Select
                    value={roleFilter}
                    onChange={handleRoleFilterChange}
                    options={roles.map(r => ({ value: r, label: r === 'Tous' ? 'Tous les rôles' : (roleLabels[r] || r) }))}
                  />
                </div>
                {roleFilter === 'agent' && (
                  <div className="w-52">
                    <label className="block text-xs text-text-secondary mb-1.5 font-medium">Sous-rôle</label>
                    <Select
                      value={positionFilter}
                      onChange={setPositionFilter}
                      options={[
                        { value: 'Tous', label: 'Tous les sous-rôles' },
                        ...AGENT_POSITIONS.map(p => ({ value: p.value, label: p.label })),
                      ]}
                    />
                  </div>
                )}
                <div className="w-40">
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
                  onClick={() => { setRoleFilter('Tous'); setPositionFilter('Tous'); setStatusFilter('Tous'); setSearch('') }}
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
            {loading ? 'Chargement...' : `${filteredUsers.length} utilisateur${filteredUsers.length > 1 ? 's' : ''}`}
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
                const roleColor = getRoleColor(user.role, isGerant)
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
                        {getRoleLabel(user)}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        {user.status === 'actif' && (
                          <><span className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-xs font-medium text-emerald-600">Actif</span></>
                        )}
                        {user.status === 'inactif' && (
                          <><span className={`w-2 h-2 rounded-full ${isGerant ? 'bg-[#905D5D]' : 'bg-amber-500'}`} /><span className={`text-xs font-medium ${isGerant ? 'text-[#905D5D]' : 'text-amber-600'}`}>Inactif</span></>
                        )}
                        {user.status === 'suspendu' && (
                          <><span className="w-2 h-2 rounded-full bg-red-500" /><span className="text-xs font-medium text-red-600">Suspendu</span></>
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
                      ? isGerant ? 'bg-[#905D5D] text-white' : 'bg-accent text-white'
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
          adminId={adminId!}
          currentUserId={currentUser?.id}
          currentUserRole={currentUser?.role}
          onClose={() => setMenuTarget(null)}
          onEdit={openEditModal}
          onToggleStatus={handleToggleStatus}
          onReactivate={handleReactivate}
          onDelete={handleDelete}
          onResetPassword={handleResetPassword}
          onResendCredentials={handleResendCredentials}
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
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isGerant ? 'bg-[#E7D5D5]' : 'bg-amber-100'}`}>
                      {editingUser ? <Edit3 size={16} className={isGerant ? 'text-[#905D5D]' : 'text-amber-700'} /> : <UserPlus size={16} className={isGerant ? 'text-[#905D5D]' : 'text-amber-700'} />}
                    </div>
                    <h2 className="font-semibold">{editingUser ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}</h2>
                  </div>
                  <button
                    onClick={() => { setShowCreateModal(false); setEditingUser(null); setFormErrors({}) }}
                    className="p-1.5 rounded-lg hover:bg-background text-text-secondary hover:text-text transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="p-6 space-y-6">
                  {/* Personal Info */}
                  <div>
                    <p className="text-xs text-text-secondary uppercase tracking-wider font-medium mb-3">Informations personnelles</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-text-secondary mb-1">Prénom <span className="text-error">*</span></label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => { setFormData({ ...formData, firstName: e.target.value }); setFormErrors({ ...formErrors, firstName: undefined }) }}
                          className={`w-full px-3 py-2.5 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 ${formErrors.firstName ? 'border-error' : 'border-border/50'}`}
                        />
                        {formErrors.firstName && <p className="text-xs text-error mt-1">{formErrors.firstName}</p>}
                      </div>
                      <div>
                        <label className="block text-sm text-text-secondary mb-1">Nom <span className="text-error">*</span></label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => { setFormData({ ...formData, lastName: e.target.value }); setFormErrors({ ...formErrors, lastName: undefined }) }}
                          className={`w-full px-3 py-2.5 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 ${formErrors.lastName ? 'border-error' : 'border-border/50'}`}
                        />
                        {formErrors.lastName && <p className="text-xs text-error mt-1">{formErrors.lastName}</p>}
                      </div>
                      <div>
                        <label className="block text-sm text-text-secondary mb-1">Email <span className="text-error">*</span></label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setFormErrors({ ...formErrors, email: undefined }) }}
                          className={`w-full px-3 py-2.5 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 ${formErrors.email ? 'border-error' : 'border-border/50'}`}
                        />
                        {formErrors.email && <p className="text-xs text-error mt-1">{formErrors.email}</p>}
                      </div>
                      <div>
                        <label className="block text-sm text-text-secondary mb-1">Téléphone</label>
                        <PhoneInput
                          value={formData.phone || ''}
                          onChange={(v) => setFormData({ ...formData, phone: v })}
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
                    </div>
                    <div>
                      <p className="block text-sm text-text-secondary mb-2">Rôle <span className="text-error">*</span></p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {[
                          { value: 'admin', label: 'Administrateur', desc: 'Propriétaire original unique. Ne peut pas être supprimé ni retiré.' },
                          { value: 'gerant', label: 'Gérant', desc: 'Comme l\'admin : peut tout faire et supprimer tout utilisateur, sauf l\'administrateur d\'origine.' },
                          { value: 'agent', label: 'Agent', desc: 'Interface agent avec un rôle spécifique.' },
                        ].map((opt) => (
                          <label
                            key={opt.value}
                            className={`p-3 rounded-xl border cursor-pointer transition-all ${
                              formData.role === opt.value
                                ? isGerant ? 'border-[#905D5D] bg-[#E7D5D5]/30 ring-1 ring-[#905D5D]/20' : 'border-accent bg-accent-light/30 ring-1 ring-accent/20'
                                : 'border-border/50 hover:border-border hover:bg-background'
                            }`}
                          >
                            <input
                              type="radio"
                              name="role"
                              value={opt.value}
                              checked={formData.role === opt.value}
                              onChange={(e) => setFormData({
                                ...formData,
                                role: e.target.value,
                                position: e.target.value === 'agent' ? formData.position || AGENT_POSITIONS[0].value : ''
                              })}
                              className="sr-only"
                            />
                            <p className="text-sm font-medium">{opt.label}</p>
                            <p className="text-xs text-text-secondary mt-0.5 leading-snug">{opt.desc}</p>
                          </label>
                        ))}
                      </div>

                      {formData.role === 'agent' && (
                        <div className="mt-3">
                          <p className="text-xs text-text-secondary font-medium mb-2">Sous-rôle de l'agent <span className="text-error">*</span></p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {AGENT_POSITIONS.map((pos) => (
                              <label
                                key={pos.value}
                                className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all text-sm ${
                                  formData.position === pos.value
                                    ? isGerant ? 'border-[#905D5D] bg-[#E7D5D5]/30 ring-1 ring-[#905D5D]/20' : 'border-accent bg-accent-light/30 ring-1 ring-accent/20'
                                    : 'border-border/50 hover:border-border hover:bg-background'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="position"
                                  value={pos.value}
                                  checked={formData.position === pos.value}
                                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                  className="sr-only"
                                />
                                <span className={`w-2.5 h-2.5 rounded-full border-2 flex-shrink-0 ${
                                  formData.position === pos.value ? (isGerant ? 'border-[#905D5D] bg-[#905D5D]' : 'border-accent bg-accent') : 'border-border'
                                }`} />
                                {pos.label}
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Security */}
                  <div>
                    <p className="text-xs text-text-secondary uppercase tracking-wider font-medium mb-3">Sécurité</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="block text-sm text-text-secondary mb-1">
                          Mot de passe {!editingUser && <span className="text-error">*</span>}
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder={editingUser ? 'Laisser vide pour ne pas modifier' : ''}
                            value={formData.password}
                            onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setFormErrors({ ...formErrors, password: undefined }) }}
                            className={`w-full px-3 py-2.5 pr-10 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 ${formErrors.password ? 'border-error' : 'border-border/50'}`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text transition-colors"
                            tabIndex={-1}
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {formErrors.password && <p className="text-xs text-error mt-1">{formErrors.password}</p>}
                      </div>
                      <div>
                        <label className="block text-sm text-text-secondary mb-1">
                          Confirmer {!editingUser && <span className="text-error">*</span>}
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={formData.confirmPassword}
                            onChange={(e) => { setFormData({ ...formData, confirmPassword: e.target.value }); setFormErrors({ ...formErrors, confirmPassword: undefined }) }}
                            className={`w-full px-3 py-2.5 pr-10 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 ${formErrors.confirmPassword ? 'border-error' : 'border-border/50'}`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text transition-colors"
                            tabIndex={-1}
                          >
                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {formErrors.confirmPassword && <p className="text-xs text-error mt-1">{formErrors.confirmPassword}</p>}
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
                    {!editingUser && (
                      <div className="space-y-2">
                        <label className="flex items-center gap-2.5 text-sm text-text-secondary cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.sendEmail}
                            onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
                            className={`rounded border-border/50 ${isGerant ? 'accent-[#905D5D]' : 'accent-accent'}`}
                          />
                          Envoyer les identifiants par email à l'utilisateur
                        </label>
                        <label className="flex items-center gap-2.5 text-sm text-text-secondary cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.requirePasswordChange}
                            onChange={(e) => setFormData({ ...formData, requirePasswordChange: e.target.checked })}
                            className={`rounded border-border/50 ${isGerant ? 'accent-[#905D5D]' : 'accent-accent'}`}
                          />
                          Exiger un changement de mot de passe à la première connexion
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Permissions (shown for admin & gerant roles) */}
                  {(formData.role === 'admin' || formData.role === 'gerant') && (
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
                            <input type="checkbox" defaultChecked className={`rounded border-border/50 ${isGerant ? 'accent-[#905D5D]' : 'accent-accent'}`} />
                            {perm}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/50">
                    <Button type="button" variant="outline" onClick={() => { setShowCreateModal(false); setEditingUser(null); setFormErrors({}) }}>Annuler</Button>
                    <Button type="submit" variant="default" className={isGerant ? GERANT_BUTTON_CLASSES : ADMIN_BUTTON_CLASSES} icon={editingUser ? <Edit3 size={14} /> : <UserPlus size={14} />}>
                      {editingUser ? 'Enregistrer les modifications' : 'Créer l\'utilisateur'}
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
