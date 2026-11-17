import { Fragment, useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { Select } from '../../../components/ui/Select'
import { useToast } from '../../../components/ui/Toast'
import { api } from '../../../services/api'
import { cn } from '../../../lib/utils'
import {
  Users, Shield, UserCheck, UserX, Search,
  Eye, Edit3, Trash2, Mail, Lock,
  MoreHorizontal, Plus, Filter, X, ToggleLeft, ToggleRight,
  ChevronLeft, ChevronRight, CheckCircle,
  RefreshCw, ArrowLeft, Clock, Star, Phone, Activity,
} from 'react-feather'
import {
  StagePanel, StageBadge, StageButton, STAGE_HUES,
  useStageTheme, useStageAccent, OrbIcon, AnimatedNumber, ShimmerProgress,
  type StageHue
} from '../../../components/dashboard/Stage'
import { AdminStatCard } from '../../../components/dashboard/AdminStatCard'
import { ResendCredentialsDialog } from '../../../components/ui/ResendCredentialsDialog'
import { UserFormModal, AGENT_POSITIONS, type UserFormData, type UserFormErrors } from './UserFormModal'

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
const ITEMS_PER_PAGE = 5

const roleLabels: Record<string, string> = {
  admin: 'Administrateur',
  gerant: 'Gérant',
  agent: 'Agent',
}

const ROLE_HUES: Record<string, StageHue> = {
  admin: STAGE_HUES.amber,
  gerant: STAGE_HUES.violet,
  agent: STAGE_HUES.sky,
}

type StageBadgeVariant = 'neutral' | 'violet' | 'ok' | 'warn' | 'danger'

function getRoleHue(role: string): StageHue {
  return ROLE_HUES[role] || STAGE_HUES.sky
}

function getStatusMeta(status: string): { label: string; variant: StageBadgeVariant } {
  if (status === 'actif') return { label: 'Actif', variant: 'ok' }
  if (status === 'inactif') return { label: 'Inactif', variant: 'warn' }
  if (status === 'suspendu') return { label: 'Suspendu', variant: 'danger' }
  return { label: status || '—', variant: 'neutral' }
}

function getRoleLabel(user: UserData): string {
  if (user.role === 'admin') return 'Administrateur'
  if (user.role === 'gerant') return 'Gérant'
  if (user.role === 'agent' && user.position) return user.position
  return 'Agent'
}

function getInitials(user: UserData): string {
  const first = user.first_name?.trim()?.[0] || ''
  const last = user.last_name?.trim()?.[0] || ''
  return (first + last).toUpperCase() || '?'
}

function formatLastLogin(value: string | null): string {
  if (!value) return 'Jamais connecté'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatRelativeLogin(value: string | null): string {
  if (!value) return 'Jamais connecté'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const minutes = Math.floor((Date.now() - date.getTime()) / 60_000)
  if (minutes < 1) return "À l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'hier'
  if (days < 7) return `il y a ${days} j`
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

function FilterChip({ label, onClear, isDark }: { label: string; onClear: () => void; isDark: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold',
        isDark
          ? 'border-white/10 bg-white/[0.05] text-slate-300'
          : 'border-orange-900/10 bg-white/80 text-slate-600'
      )}
    >
      {label}
      <button
        type="button"
        onClick={onClear}
        aria-label={`Retirer le filtre ${label}`}
        className="transition-colors hover:text-rose-500"
      >
        <X size={10} />
      </button>
    </span>
  )
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
  const theme = useStageTheme()
  const dark = theme === 'dark'

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

  const firstDangerIndex = actions.findIndex(action => action.danger)

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
          className="pop-glass z-50 max-h-[360px] w-60 overflow-y-auto rounded-2xl py-1 scrollbar-thin"
        >
          <div className={cn('border-b px-4 pb-2.5 pt-2', dark ? 'border-white/10' : 'border-orange-900/10')}>
            <p className={cn('truncate text-xs font-bold', dark ? 'text-white' : 'text-slate-900')}>
              {user.first_name} {user.last_name}
            </p>
            <p className={cn('mt-0.5 truncate text-[10px]', dark ? 'text-slate-500' : 'text-slate-400')}>
              {user.email}
            </p>
          </div>
          {actions.map((action, i) => (
            <Fragment key={i}>
              {i === firstDangerIndex && firstDangerIndex > 0 && (
                <div className={cn('my-1 border-t', dark ? 'border-white/10' : 'border-orange-900/10')} />
              )}
              <button
                onClick={() => { action.onClick(); onClose() }}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] font-medium transition-colors',
                  action.danger
                    ? dark
                      ? 'text-rose-300 hover:bg-rose-500/10'
                      : 'text-rose-600 hover:bg-rose-500/10'
                    : dark
                      ? 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                      : 'text-slate-600 hover:bg-orange-900/[0.04] hover:text-orange-900'
                )}
              >
                <action.icon size={14} />
                {action.label}
              </button>
            </Fragment>
          ))}
        </motion.div>
      </>
    </AnimatePresence>
  )
}

function StageUserRow({
  user,
  index,
  isDark,
  isSelf,
  onMenu,
}: {
  user: UserData
  index: number
  isDark: boolean
  isSelf: boolean
  onMenu: (e: React.MouseEvent) => void
}) {
  const hue = getRoleHue(user.role)
  const status = getStatusMeta(user.status)
  const roleBadgeStyle = isDark
    ? { color: hue.a, backgroundColor: `${hue.a}1F`, borderColor: `${hue.a}42` }
    : { color: hue.b, backgroundColor: `${hue.a}14`, borderColor: `${hue.a}38` }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.3), ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'group relative grid flex-1 grid-cols-1 gap-3 overflow-hidden rounded-2xl border p-3 transition-all duration-200 lg:min-h-[64px] lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)_auto_auto] lg:items-center lg:gap-4',
        isDark
          ? 'border-white/[0.06] bg-white/[0.03] hover:border-white/[0.14] hover:bg-white/[0.055]'
          : 'border-slate-200/70 bg-white/70 shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:border-orange-300/70 hover:bg-white'
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-[3px] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{ backgroundImage: `linear-gradient(180deg, ${hue.a}, ${hue.b})` }}
      />

      <div className="flex min-w-0 items-center gap-3">
        <div
          className="orb-icon relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-[11px] font-extrabold"
          style={{ '--orb-a': hue.a, '--orb-b': hue.b, '--orb-glow': hue.glow } as React.CSSProperties}
        >
          {getInitials(user)}
          {user.status === 'actif' && (
            <span
              className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2"
              style={{ borderColor: isDark ? '#0D0A18' : '#FFFFFF', backgroundColor: '#34D399' }}
            />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <p className={cn('truncate text-[13.5px] font-extrabold tracking-[-0.2px]', isDark ? 'text-white' : 'text-slate-900')}>
              {user.first_name} {user.last_name}
            </p>
            {user.is_owner && (
              <StageBadge variant="warn" className="!px-1.5 !py-0.5 !text-[9px]">
                <Star size={9} /> Propriétaire
              </StageBadge>
            )}
            {isSelf && (
              <StageBadge variant="violet" className="!px-1.5 !py-0.5 !text-[9px]">Vous</StageBadge>
            )}
          </div>
          <div className={cn('mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px]', isDark ? 'text-slate-400' : 'text-slate-500')}>
            <Mail size={11} className="shrink-0 opacity-70" />
            <span className="truncate" title={user.email}>{user.email}</span>
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-1.5 lg:pl-1">
        <StageBadge variant="neutral" style={roleBadgeStyle}>{getRoleLabel(user)}</StageBadge>
        {user.phone && (
          <span
            className={cn(
              'inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
              isDark
                ? 'border-white/[0.08] bg-white/[0.03] text-slate-300'
                : 'border-slate-200/80 bg-white/80 text-slate-600'
            )}
          >
            <Phone size={9} className="shrink-0 opacity-60" />
            <span className="truncate">{user.phone}</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 lg:justify-end">
        <StageBadge variant={status.variant}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {status.label}
        </StageBadge>
        {user.days_since_last_login !== null && user.days_since_last_login > 0 && (
          <span className={cn('text-[10px] font-semibold tabular-nums', isDark ? 'text-slate-500' : 'text-slate-400')}>
            {user.days_since_last_login}j
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 lg:justify-end">
        <div className="text-left lg:text-right">
          <p className={cn('text-[8.5px] font-bold uppercase tracking-[0.16em]', isDark ? 'text-slate-500' : 'text-slate-400')}>
            Dernière connexion
          </p>
          <p className={cn('mt-0.5 inline-flex items-center gap-1 text-[10.5px] font-semibold tabular-nums', isDark ? 'text-slate-300' : 'text-slate-600')}>
            <Clock size={10} className="shrink-0 opacity-60" />
            {formatLastLogin(user.last_login_at)}
          </p>
        </div>
        <button
          type="button"
          onClick={onMenu}
          aria-label={`Actions pour ${user.first_name} ${user.last_name}`}
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95',
            isDark
              ? 'border-white/10 bg-white/[0.05] text-slate-400 hover:border-white/20 hover:bg-white/10 hover:text-white'
              : 'border-slate-200/80 bg-white text-slate-500 shadow-sm hover:bg-white hover:text-slate-900'
          )}
        >
          <MoreHorizontal size={16} />
        </button>
      </div>
    </motion.div>
  )
}

export default function AdminUsersPage() {
  const { adminId } = useParams<{ adminId: string }>()
  const navigate = useNavigate()
  const theme = useStageTheme()
  const isDark = theme === 'dark'
  const accent = useStageAccent()

  const [users, setUsers] = useState<UserData[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('Tous')
  const [statusFilter, setStatusFilter] = useState('Tous')
  const [positionFilter, setPositionFilter] = useState('Tous')
  const [showFilters, setShowFilters] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [savingUser, setSavingUser] = useState(false)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [menuTarget, setMenuTarget] = useState<{ user: UserData; position: MenuPosition } | null>(null)
  const [resendTarget, setResendTarget] = useState<UserData | null>(null)
  const [resending, setResending] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [formData, setFormData] = useState<UserFormData>({
    firstName: '', lastName: '', email: '', phone: '',
    password: '', confirmPassword: '', role: 'agent', position: AGENT_POSITIONS[0].value,
    sendEmail: true, requirePasswordChange: true
  })
  const [formErrors, setFormErrors] = useState<UserFormErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: number; role: string } | null>(null)

  const { toast } = useToast()

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
    adminsOnly: users.filter(u => u.role === 'admin').length,
    gerantsOnly: users.filter(u => u.role === 'gerant').length,
    agents: users.filter(u => u.role === 'agent').length,
    actifs: users.filter(u => u.status === 'actif').length,
    inactifs: users.filter(u => u.status === 'inactif' || u.status === 'suspendu').length,
    inactifsOnly: users.filter(u => u.status === 'inactif').length,
    suspendusOnly: users.filter(u => u.status === 'suspendu').length,
  }

  const activeAgents = users.filter(u => u.role === 'agent' && u.status === 'actif').length
  const activationRate = stats.total > 0 ? Math.round((stats.actifs / stats.total) * 100) : 0
  const neverConnected = users.filter(u => !u.last_login_at).length
  const distinctPositions = new Set(
    users.filter(u => u.role === 'agent' && u.position).map(u => u.position)
  ).size

  const recentConnections = users
    .filter(u => u.last_login_at && !Number.isNaN(new Date(u.last_login_at).getTime()))
    .sort((a, b) => new Date(b.last_login_at as string).getTime() - new Date(a.last_login_at as string).getTime())
    .slice(0, 5)

  const statusTabs = [
    { value: 'Tous', label: 'Tous', count: stats.total },
    { value: 'Actif', label: 'Actifs', count: stats.actifs },
    { value: 'Inactif', label: 'Inactifs', count: stats.inactifsOnly },
    { value: 'Suspendu', label: 'Suspendus', count: stats.suspendusOnly },
  ]

  const buildSpark = (predicate: (u: UserData) => boolean) => {
    const now = new Date()
    return Array.from({ length: 6 }, (_, i) => {
      const end = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 1)
      return users.filter(u => {
        if (!predicate(u)) return false
        const created = new Date(u.created_at)
        return !Number.isNaN(created.getTime()) && created.getTime() < end.getTime()
      }).length
    })
  }

  const sparkTotal = buildSpark(() => true)
  const sparkAdmins = buildSpark(u => u.role === 'admin' || u.role === 'gerant')
  const sparkAgents = buildSpark(u => u.role === 'agent')
  const sparkActifs = buildSpark(u => u.status === 'actif')
  const sparkInactifs = buildSpark(u => u.status === 'inactif' || u.status === 'suspendu')

  const activeFiltersCount =
    (roleFilter !== 'Tous' ? 1 : 0) +
    (positionFilter !== 'Tous' ? 1 : 0)

  const resetFilters = () => {
    setRoleFilter('Tous')
    setPositionFilter('Tous')
    setStatusFilter('Tous')
    setSearch('')
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

  const handleResendCredentials = (id: number) => {
    const target = users.find(u => String(u.id) === String(id))
    if (!target) return
    setResendTarget(target)
  }

  const confirmResendCredentials = async () => {
    if (!resendTarget || resending) return
    setResending(true)
    try {
      await api.post(`/admin/users/${resendTarget.id}/resend-credentials`)
      toast('success', `Identifiants renvoyés par email à ${resendTarget.first_name} ${resendTarget.last_name}.`)
      setResendTarget(null)
    } catch (err) {
      console.error('Error resending credentials:', err)
      toast('error', 'Erreur lors du renvoi des identifiants.')
    } finally {
      setResending(false)
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

  const closeUserModal = () => {
    if (savingUser) return
    setShowCreateModal(false)
    setEditingUser(null)
    setFormErrors({})
  }

  const validateUserForm = () => {
    const errors: UserFormErrors = {}
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
    setSavingUser(true)

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
    } finally {
      setSavingUser(false)
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    if (!validateUserForm()) return
    setSavingUser(true)

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
    } finally {
      setSavingUser(false)
    }
  }

  const labelClass = cn(
    'mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em]',
    isDark ? 'text-slate-400/85' : 'text-orange-900/60'
  )

  const gradientTitle = isDark
    ? 'bg-clip-text text-transparent bg-gradient-to-r from-[#F43F5E] via-[#FB7185] to-[#8B7CFF]'
    : 'bg-clip-text text-transparent bg-gradient-to-r from-[#EA580C] via-[#F97316] to-[#FBBF24]'

  return (
    <div className="space-y-5 pb-24">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className={cn('flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[3px]', isDark ? 'text-slate-400' : 'text-teal-900/50')}>
              <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Square Immo · Espace administrateur · Temps réel
            </p>
            <h1 className={cn('mt-2 text-4xl font-black tracking-[-2px] sm:text-5xl', gradientTitle)}>
              ÉQUIPE & ACCÈS
            </h1>
            <p className={cn('mt-1.5 text-sm', isDark ? 'text-slate-400' : 'text-teal-900/60')}>
              Pilotez les comptes, rôles et permissions de l'agence — {stats.total} compte{stats.total !== 1 ? 's' : ''}, {stats.actifs} actif{stats.actifs !== 1 ? 's' : ''} sur la plateforme.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StageButton variant="glass" size="md" icon={<ArrowLeft size={14} />} onClick={() => navigate(`/admin/${adminId}`)}>
              Dashboard
            </StageButton>
            <StageButton
              variant="glass"
              size="md"
              icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
              onClick={fetchUsers}
              disabled={loading}
            >
              Actualiser
            </StageButton>
            <StageButton size="md" icon={<Plus size={14} />} onClick={openCreateModal}>
              Ajouter un utilisateur
            </StageButton>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <AdminStatCard
          icon={Users}
          label="Total comptes"
          value={stats.total}
          unit="comptes"
          detail={`${stats.actifs} actifs · ${stats.inactifs} inactifs`}
          hue={accent}
          spark={sparkTotal}
          facts={[
            { label: 'Actifs', value: stats.actifs },
            { label: 'Inactifs', value: stats.inactifs },
          ]}
          delay={0}
        />
        <AdminStatCard
          icon={Shield}
          label="Encadrement"
          value={stats.admins}
          unit="comptes"
          detail="Admins & gérants"
          hue={STAGE_HUES.amber}
          spark={sparkAdmins}
          facts={[
            { label: 'Admins', value: stats.adminsOnly },
            { label: 'Gérants', value: stats.gerantsOnly },
          ]}
          delay={0.06}
        />
        <AdminStatCard
          icon={UserCheck}
          label="Agents"
          value={stats.agents}
          unit="agents"
          detail={`${distinctPositions} sous-rôles`}
          hue={STAGE_HUES.sky}
          spark={sparkAgents}
          facts={[
            { label: 'Actifs', value: activeAgents },
            { label: 'À relancer', value: stats.agents - activeAgents },
          ]}
          delay={0.12}
        />
        <AdminStatCard
          icon={Activity}
          label="Comptes actifs"
          value={stats.actifs}
          unit="actifs"
          detail={`${activationRate}% du répertoire`}
          hue={STAGE_HUES.emerald}
          spark={sparkActifs}
          facts={[
            { label: 'Taux', value: `${activationRate}%` },
            { label: 'Jamais connectés', value: neverConnected },
          ]}
          delay={0.18}
        />
        <AdminStatCard
          icon={UserX}
          label="Comptes inactifs"
          value={stats.inactifs}
          unit="à relancer"
          detail="Inactifs & suspendus"
          hue={STAGE_HUES.fuchsia}
          spark={sparkInactifs}
          facts={[
            { label: 'Inactifs', value: stats.inactifsOnly },
            { label: 'Suspendus', value: stats.suspendusOnly },
          ]}
          delay={0.24}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-full lg:col-span-2">
          <StagePanel
            title="Répertoire de l'équipe"
            icon={Users}
            hue={accent}
            outerClassName="h-full"
            badge={
              <StageBadge variant="neutral">
                {filteredUsers.length} compte{filteredUsers.length !== 1 ? 's' : ''}
              </StageBadge>
            }
          >
          <div className="flex h-full min-h-0 flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search size={14} className={cn('absolute left-3 top-1/2 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-orange-900/40')} />
                <input
                  type="text"
                  placeholder="Rechercher par nom ou email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={cn(
                    'h-10 w-full rounded-xl border pl-9 pr-9 text-sm outline-none transition-all',
                    isDark
                      ? 'border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500 focus:border-violet-400/40'
                      : 'border-orange-900/10 bg-white/80 text-slate-900 placeholder:text-slate-400 focus:border-orange-400/50'
                  )}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    aria-label="Effacer la recherche"
                    className={cn('absolute right-3 top-1/2 -translate-y-1/2 transition-colors', isDark ? 'text-slate-500 hover:text-slate-200' : 'text-slate-400 hover:text-slate-700')}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className={cn(
                      'inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-all sm:flex-none',
                      isDark
                        ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10 hover:text-white'
                        : 'border-orange-900/10 bg-white/70 text-slate-600 hover:bg-white hover:text-slate-900'
                    )}
                  >
                    <X size={12} /> Réinitialiser ({activeFiltersCount})
                  </button>
                )}
                  <button
                    type="button"
                    onClick={() => setShowFilters(v => !v)}
                    aria-expanded={showFilters}
                    className={cn(
                    'inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold backdrop-blur-md transition-all sm:flex-none',
                    showFilters || activeFiltersCount > 0
                      ? isDark
                        ? 'border-rose-400/30 bg-rose-500/15 text-rose-200'
                        : 'border-orange-400/40 bg-orange-500/10 text-orange-800'
                      : isDark
                        ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10'
                        : 'border-orange-900/10 bg-white/80 text-slate-600 hover:bg-white'
                  )}
                >
                  <Filter size={14} />
                  Filtres
                  {activeFiltersCount > 0 && (
                    <span
                      className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white"
                      style={{ backgroundImage: `linear-gradient(145deg, ${accent.a}, ${accent.b})` }}
                    >
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="stage-glass flex flex-wrap items-center gap-1 rounded-2xl p-1.5">
              {statusTabs.map(tab => {
                const active = statusFilter === tab.value
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setStatusFilter(tab.value)}
                    aria-pressed={active}
                    className={cn(
                      'relative flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold transition-colors',
                      active
                        ? 'text-white'
                        : isDark
                          ? 'text-slate-400 hover:text-slate-200'
                          : 'text-slate-500 hover:text-teal-900'
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="users-status-pill"
                        className="absolute inset-0 rounded-xl border border-white/20"
                        style={{
                          backgroundImage: `linear-gradient(145deg, ${accent.a} 0%, ${accent.b} 60%, ${accent.b} 100%)`,
                          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.4), 0 8px 20px -8px ${accent.glow}`,
                        }}
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                    <span
                      className={cn(
                        'relative z-10 rounded-full px-1.5 py-0.5 text-[9px] font-extrabold tabular-nums',
                        active
                          ? 'bg-white/20 text-white'
                          : isDark
                            ? 'bg-white/[0.06] text-slate-400'
                            : 'bg-slate-900/[0.05] text-slate-500'
                      )}
                    >
                      {tab.count}
                    </span>
                  </button>
                )
              })}
            </div>

            {(roleFilter !== 'Tous' || positionFilter !== 'Tous') && (
              <div className="flex flex-wrap items-center gap-1.5">
                {roleFilter !== 'Tous' && (
                  <FilterChip
                    label={`Rôle : ${roleLabels[roleFilter] || roleFilter}`}
                    isDark={isDark}
                    onClear={() => handleRoleFilterChange('Tous')}
                  />
                )}
                {positionFilter !== 'Tous' && (
                  <FilterChip
                    label={`Sous-rôle : ${positionFilter}`}
                    isDark={isDark}
                    onClear={() => setPositionFilter('Tous')}
                  />
                )}
              </div>
            )}

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className={cn(
                    'grid grid-cols-1 gap-3 rounded-2xl border p-3',
                    roleFilter === 'agent' && 'sm:grid-cols-2',
                    isDark ? 'border-white/[0.07] bg-white/[0.02]' : 'border-orange-900/[0.07] bg-white/50'
                  )}>
                    <div>
                      <label className={labelClass}>Rôle</label>
                      <Select
                        value={roleFilter}
                        onChange={handleRoleFilterChange}
                        options={roles.map(r => ({ value: r, label: r === 'Tous' ? 'Tous les rôles' : (roleLabels[r] || r) }))}
                      />
                    </div>
                    {roleFilter === 'agent' && (
                      <div>
                        <label className={labelClass}>Sous-rôle</label>
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
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className={cn(
              'hidden gap-4 px-3 pb-1 lg:grid lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)_auto_auto]',
              isDark ? 'text-slate-500' : 'text-slate-400'
            )}>
              <span className="text-[9px] font-bold uppercase tracking-[0.16em]">Membre</span>
              <span className="text-[9px] font-bold uppercase tracking-[0.16em]">Rôle & contact</span>
              <span className="text-[9px] font-bold uppercase tracking-[0.16em]">Statut</span>
              <span className="pr-11 text-right text-[9px] font-bold uppercase tracking-[0.16em]">Dernière connexion</span>
            </div>

            {loading ? (
              <div className="flex min-h-0 flex-1 flex-col gap-2">
                {[0, 1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className={cn(
                      'min-h-[64px] flex-1 animate-pulse rounded-2xl border',
                      isDark ? 'border-white/[0.06] bg-white/[0.03]' : 'border-orange-900/[0.06] bg-white/50'
                    )}
                  />
                ))}
              </div>
            ) : paginatedUsers.length > 0 ? (
              <div className="flex min-h-0 flex-1 flex-col gap-2">
                {paginatedUsers.map((user, index) => (
                  <StageUserRow
                    key={user.id}
                    user={user}
                    index={index}
                    isDark={isDark}
                    isSelf={currentUser?.id != null && String(currentUser.id) === String(user.id)}
                    onMenu={(e) => {
                      if (menuTarget?.user.id === user.id) {
                        setMenuTarget(null)
                      } else {
                        const rect = e.currentTarget.getBoundingClientRect()
                        const menuHeight = 360
                        let top = rect.bottom + 4
                        if (top + menuHeight > window.innerHeight) {
                          top = Math.max(8, rect.top - menuHeight - 4)
                        }
                        setMenuTarget({
                          user,
                          position: { top, right: window.innerWidth - rect.right }
                        })
                      }
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className={cn(
                'flex min-h-0 flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-6 py-12 text-center',
                isDark ? 'border-white/10 bg-white/[0.02]' : 'border-orange-900/15 bg-white/40'
              )}>
                <OrbIcon icon={UserX} hue={STAGE_HUES.fuchsia} size={44} radius={14} />
                <div>
                  <p className={cn('text-sm font-bold', isDark ? 'text-white' : 'text-slate-900')}>
                    Aucun utilisateur trouvé
                  </p>
                  <p className={cn('mt-1 text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>
                    Ajustez vos filtres ou ajoutez un nouveau membre à l'équipe.
                  </p>
                </div>
                <StageButton variant="glass" size="sm" icon={<X size={13} />} onClick={resetFilters}>
                  Réinitialiser les filtres
                </StageButton>
              </div>
            )}

            {totalPages > 1 && (
              <div className={cn(
                'mt-auto flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between',
                isDark ? 'border-white/[0.08]' : 'border-orange-900/[0.08]'
              )}>
                <p className={cn('text-[11px] font-medium', isDark ? 'text-slate-500' : 'text-slate-400')}>
                  Affichage {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} sur {filteredUsers.length} utilisateur{filteredUsers.length !== 1 ? 's' : ''}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-xl border transition-all disabled:pointer-events-none disabled:opacity-30',
                      isDark
                        ? 'border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/10 hover:text-white'
                        : 'border-orange-900/10 bg-white/70 text-slate-500 hover:bg-white hover:text-slate-900'
                    )}
                  >
                    <ChevronLeft size={15} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-xl border text-xs font-bold transition-all',
                        page === currentPage
                          ? 'text-white'
                          : isDark
                            ? 'border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/10 hover:text-white'
                            : 'border-orange-900/10 bg-white/70 text-slate-500 hover:bg-white hover:text-slate-900'
                      )}
                      style={page === currentPage
                        ? {
                            backgroundImage: `linear-gradient(145deg, ${accent.a}, ${accent.b})`,
                            borderColor: 'transparent',
                            boxShadow: `0 6px 18px -6px ${accent.glow}`,
                          }
                        : undefined}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-xl border transition-all disabled:pointer-events-none disabled:opacity-30',
                      isDark
                        ? 'border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/10 hover:text-white'
                        : 'border-orange-900/10 bg-white/70 text-slate-500 hover:bg-white hover:text-slate-900'
                    )}
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </StagePanel>
        </div>

        <div className="flex h-full flex-col gap-4">
          <StagePanel
            title="Répartition de l'équipe"
            icon={Shield}
            hue={STAGE_HUES.violet}
            badge={<StageBadge variant="neutral">{stats.total} comptes</StageBadge>}
          >
            <div className="space-y-3">
              <div className={cn(
                'relative overflow-hidden rounded-2xl border p-3.5',
                isDark ? 'border-white/[0.07] bg-white/[0.035]' : 'border-slate-200/70 bg-white/65'
              )}>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full opacity-70"
                  style={{ background: `radial-gradient(circle, ${STAGE_HUES.emerald.glow}, transparent 70%)` }}
                />
                <div className="relative flex items-center gap-3">
                  <div
                    className="relative flex h-[86px] w-[86px] shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: `conic-gradient(${STAGE_HUES.emerald.a} ${activationRate * 3.6}deg, ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.07)'} ${activationRate * 3.6}deg)`,
                      boxShadow: `0 16px 32px -22px ${STAGE_HUES.emerald.glow}`,
                    }}
                  >
                    <div className={cn('absolute inset-[7px] rounded-full', isDark ? 'bg-[#0D0A18]' : 'bg-white')} />
                    <div className="relative z-10 text-center">
                      <p className={cn('text-[20px] font-black leading-none tracking-[-0.8px]', isDark ? 'text-white' : 'text-slate-900')}>
                        <AnimatedNumber value={activationRate} suffix="%" />
                      </p>
                      <p className={cn('mt-0.5 text-[7.5px] font-bold uppercase tracking-[1.1px]', isDark ? 'text-slate-500' : 'text-teal-900/45')}>
                        actifs
                      </p>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-[9px] font-extrabold uppercase tracking-[1.5px]', isDark ? 'text-slate-500' : 'text-teal-900/45')}>
                      Taux d'activation
                    </p>
                    <p className={cn('mt-1 text-[13px] font-bold', isDark ? 'text-white' : 'text-slate-900')}>
                      {stats.actifs} sur {stats.total} comptes
                    </p>
                    <p className={cn('mt-0.5 text-[10px] font-semibold', isDark ? 'text-slate-500' : 'text-teal-900/45')}>
                      {stats.inactifs} à relancer · {neverConnected} jamais connectés
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Admins & gérants', value: stats.admins, hue: STAGE_HUES.amber },
                  { label: 'Agents', value: stats.agents, hue: STAGE_HUES.sky },
                  { label: 'Comptes actifs', value: stats.actifs, hue: STAGE_HUES.emerald },
                  { label: 'Comptes inactifs', value: stats.inactifs, hue: STAGE_HUES.fuchsia },
                ].map(row => {
                  const pct = stats.total > 0 ? Math.round((row.value / stats.total) * 100) : 0
                  return (
                    <div key={row.label}>
                      <div className="flex items-center justify-between gap-2 text-[10.5px] font-semibold">
                        <span className="flex min-w-0 items-center gap-1.5">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: row.hue.line, boxShadow: `0 0 6px ${row.hue.glow}` }} />
                          <span className={cn('truncate', isDark ? 'text-slate-400' : 'text-slate-600')}>{row.label}</span>
                        </span>
                        <span className={cn('shrink-0 tabular-nums', isDark ? 'text-slate-200' : 'text-slate-800')}>
                          {row.value} <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>({pct}%)</span>
                        </span>
                      </div>
                      <div className="mt-1.5">
                        <ShimmerProgress pct={pct} colorFrom={row.hue.a} colorTo={row.hue.b} glow={row.hue.glow} height={5} />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className={cn(
                'rounded-xl border p-2.5',
                isDark ? 'border-white/[0.06] bg-white/[0.03]' : 'border-slate-200/70 bg-white/60'
              )}>
                <div className="flex items-center justify-between gap-2 text-[10px] font-semibold">
                  <span className={isDark ? 'text-slate-500' : 'text-teal-900/45'}>Comptes à relancer</span>
                  <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>{stats.inactifs}</span>
                </div>
              </div>
            </div>
          </StagePanel>

          <StagePanel
            title="Dernières connexions"
            icon={Clock}
            hue={STAGE_HUES.sky}
            outerClassName="flex-1"
            badge={
              <StageBadge variant={recentConnections.length > 0 ? 'ok' : 'neutral'}>
                {recentConnections.length} récente{recentConnections.length !== 1 ? 's' : ''}
              </StageBadge>
            }
          >
            <div className="flex h-full min-h-0 flex-col">
              <div className="flex-1 space-y-1">
              {recentConnections.map(u => {
                const hue = getRoleHue(u.role)
                const status = getStatusMeta(u.status)
                return (
                  <div
                    key={u.id}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition-colors',
                      isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-orange-900/[0.04]'
                    )}
                  >
                    <span
                      className="orb-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[10px] font-extrabold"
                      style={{ '--orb-a': hue.a, '--orb-b': hue.b, '--orb-glow': hue.glow } as React.CSSProperties}
                    >
                      {getInitials(u)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn('block truncate text-[12px] font-bold', isDark ? 'text-slate-200' : 'text-slate-800')}>
                        {u.first_name} {u.last_name}
                      </span>
                      <span className={cn('block truncate text-[9.5px] font-semibold', isDark ? 'text-slate-500' : 'text-teal-900/45')}>
                        {getRoleLabel(u)} · {formatRelativeLogin(u.last_login_at)}
                      </span>
                    </span>
                    <StageBadge variant={status.variant} className="!px-1.5 !py-0.5 !text-[9px]">
                      {status.label}
                    </StageBadge>
                  </div>
                )
              })}
              {recentConnections.length === 0 && (
                <div className={cn(
                  'flex min-h-[90px] flex-col items-center justify-center rounded-xl border border-dashed px-4 text-center',
                  isDark ? 'border-white/10' : 'border-slate-300/70'
                )}>
                  <p className={cn('text-[12px] font-bold', isDark ? 'text-slate-400' : 'text-slate-500')}>
                    Aucune connexion enregistrée
                  </p>
                  <p className={cn('mt-1 text-[10.5px]', isDark ? 'text-slate-500' : 'text-teal-900/45')}>
                    Les prochaines connexions apparaîtront ici.
                  </p>
                </div>
              )}
              </div>
              <div className={cn(
                'mt-auto rounded-xl border p-2.5',
                isDark ? 'border-white/[0.06] bg-white/[0.03]' : 'border-slate-200/70 bg-white/60'
              )}>
                <div className="flex items-center justify-between gap-2 text-[10px] font-semibold">
                  <span className={isDark ? 'text-slate-500' : 'text-teal-900/45'}>Jamais connectés</span>
                  <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>
                    {neverConnected} compte{neverConnected !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          </StagePanel>
        </div>
      </div>

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

        <ResendCredentialsDialog
          open={!!resendTarget}
          onClose={() => { if (!resending) setResendTarget(null) }}
          onConfirm={confirmResendCredentials}
          pending={resending}
          user={resendTarget ? {
            first_name: resendTarget.first_name,
            last_name: resendTarget.last_name,
            email: resendTarget.email,
            roleLabel: getRoleLabel(resendTarget),
          } : null}
        />

        <UserFormModal
          open={showCreateModal}
          editingUser={editingUser}
          formData={formData}
          formErrors={formErrors}
          showPassword={showPassword}
          showConfirmPassword={showConfirmPassword}
          savingUser={savingUser}
          isDark={isDark}
          accent={accent}
          onClose={closeUserModal}
          onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
          setFormData={setFormData}
          setFormErrors={setFormErrors}
          setShowPassword={setShowPassword}
          setShowConfirmPassword={setShowConfirmPassword}
        />
    </div>
  )
}
