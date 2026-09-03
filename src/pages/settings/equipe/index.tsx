import { API_ORIGIN } from '../../../utils/config'
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '../../../components/ui/Badge'
import { useToast } from '../../../components/ui/Toast'
import {
  Users, Plus, MoreHorizontal, Search, Shield, UserCheck, UserX,
  Eye, Trash2, Lock, CheckCircle, Mail,
  ChevronLeft, ChevronRight, RefreshCw, ArrowLeft
} from 'react-feather'
import { getAuthToken } from '../../../utils/auth'
import {
  Stage,
  StageBadge,
  StageButton,
  OrbIcon,
  STAGE_HUES,
  useStageTheme,
} from '../../../components/dashboard/Stage'

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
const roleBadgeColors: Record<string, 'primary' | 'default' | 'warning'> = { admin: 'primary', gerant: 'warning', agent: 'default' }
interface MenuPosition { top: number; right: number }

function ActionMenu({ user, position, onClose, onReactivate, onDelete, onResetPassword, onResendCredentials, adminId }: {
  user: UserData; position: MenuPosition; onClose: () => void
  onReactivate: (id: number) => void; onDelete: (id: number) => void; onResetPassword: (id: number) => void
  onResendCredentials: (id: number) => void
  adminId: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const theme = useStageTheme()
  const isDark = theme === 'dark'
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])
  const actions = [
    { icon: Eye, label: 'Voir le profil', onClick: () => window.location.href = `/admin/${adminId}/users/${user.id}` },
    { icon: Lock, label: 'Réinitialiser le mot de passe', onClick: () => onResetPassword(user.id) },
    { icon: Mail, label: 'Renvoyer les identifiants', onClick: () => onResendCredentials(user.id) },
    ...(user.status === 'inactif' || user.status === 'suspendu' ? [{ icon: CheckCircle, label: 'Réactiver le compte', onClick: () => onReactivate(user.id) }] : []),
    { icon: Trash2, label: 'Supprimer', onClick: () => onDelete(user.id), danger: true },
  ]
  return (
    <AnimatePresence>
      <>
        <motion.div className="fixed inset-0 z-40" onClick={onClose} />
        <motion.div ref={ref} initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.96 }} transition={{ duration: 0.12 }} style={{ position: 'fixed', top: position.top, right: position.right }} className={`w-56 rounded-2xl border py-1 z-50 max-h-[300px] overflow-y-auto scrollbar-thin ${isDark ? 'bg-[#111832] border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.5)]' : 'bg-white border-slate-200 shadow-xl'}`}>
          {actions.map((action, i) => (
            <button key={i} onClick={() => { action.onClick(); onClose() }} className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors ${action.danger ? 'text-rose-500 hover:bg-rose-500/10' : isDark ? 'text-slate-300 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>
              <action.icon size={14} />{action.label}
            </button>
          ))}
        </motion.div>
      </>
    </AnimatePresence>
  )
}

export default function EquipePage() {
  const { adminId } = useParams<{ adminId: string }>()
  const theme = useStageTheme()
  const isDark = theme === 'dark'
  const navigate = useNavigate()
  const { toast } = useToast()
  const token = getAuthToken()
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [menuTarget, setMenuTarget] = useState<{ user: UserData; position: MenuPosition } | null>(null)

  const fetchUsers = async () => {
    try { setLoading(true); const res = await fetch(`${API}/users`, { headers: { Authorization: `Bearer ${token}` } }); if (!res.ok) throw new Error('Failed'); setUsers(await res.json()) } catch (err) { console.error(err) } finally { setLoading(false) }
  }
  useEffect(() => { fetchUsers() }, [])
  const filtered = users.filter(u => {
    if (!search) return true
    const q = search.toLowerCase()
    return u.first_name.toLowerCase().includes(q) || u.last_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  })
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
  const stats = { total: users.length, admins: users.filter(u => u.role === 'admin').length, agents: users.filter(u => u.role === 'agent').length, inactifs: users.filter(u => u.status === 'inactif' || u.status === 'suspendu').length }
  const handleReactivate = async (id: number) => { try { const res = await fetch(`${API}/users/${id}/reactivate`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } }); if (!res.ok) throw new Error('Failed'); toast('success', 'Compte réactivé'); await fetchUsers() } catch { toast('error', 'Erreur') } }
  const handleDelete = async (id: number) => { if (!window.confirm('Supprimer définitivement cet utilisateur ?')) return; try { const res = await fetch(`${API}/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); if (!res.ok) throw new Error('Failed'); toast('success', 'Utilisateur supprimé'); await fetchUsers() } catch { toast('error', 'Erreur') } }
  const handleResetPassword = async (id: number) => { try { const res = await fetch(`${API_ORIGIN}/api/admin/forgot-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: users.find(u => u.id === id)?.email }) }); if (!res.ok) throw new Error('Failed'); toast('success', 'Email envoyé') } catch { toast('error', 'Erreur') } }
  const handleResendCredentials = async (id: number) => { const target = users.find(u => String(u.id) === String(id)); if (!window.confirm(`Renvoyer les identifiants à ${target?.first_name} ${target?.last_name} ?`)) return; try { const res = await fetch(`${API}/users/${id}/resend-credentials`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }); if (!res.ok) throw new Error('Failed'); toast('success', `Identifiants renvoyés à ${target?.first_name}`) } catch { toast('error', 'Erreur') } }

  return (
    <Stage theme={theme}>
      <div className="space-y-6">
        <button onClick={() => navigate(-1)} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors w-fit ${isDark ? 'border-white/10 text-slate-300 hover:bg-white/5' : 'border-teal-900/10 text-slate-600 hover:bg-white'}`}><ArrowLeft size={13} /> Retour</button>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            <OrbIcon icon={Users} hue={STAGE_HUES.violet} size={48} radius={14} />
            <div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" /></span>
                <p className={`text-[10px] font-bold uppercase tracking-[0.24em] ${isDark ? 'text-slate-400/80' : 'text-teal-900/50'}`}>Paramètres · Équipe</p>
              </div>
              <h1 className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Gestion de l'équipe</h1>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Membres, rôles et permissions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StageButton variant="glass" icon={<RefreshCw size={14} />} onClick={fetchUsers}>Actualiser</StageButton>
            {adminId && <StageButton variant="primary" icon={<Plus size={14} />} onClick={() => window.location.href = `/admin/${adminId}/users`}>Ajouter un membre</StageButton>}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Users, label: 'Total', value: stats.total, hue: STAGE_HUES.violet },
            { icon: Shield, label: 'Admin', value: stats.admins, hue: STAGE_HUES.amber },
            { icon: UserCheck, label: 'Agents', value: stats.agents, hue: STAGE_HUES.emerald },
            { icon: UserX, label: 'Inactifs', value: stats.inactifs, hue: { a: '#FB7185', b: '#BE123C', glow: 'rgba(251,113,133,0.5)', line: '#FB7185' } as any },
          ].map(stat => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="stage-glass p-4 flex items-center gap-3">
                <OrbIcon icon={Icon} hue={stat.hue} size={40} radius={11} />
                <div><p className={`text-lg font-extrabold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{stat.value}</p><p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{stat.label}</p></div>
              </div>
            )
          })}
        </div>

        <div className="stage-glass p-5">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Rechercher par nom, email..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1) }} className={`w-full pl-9 pr-4 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${isDark ? 'bg-white/[0.04] border-white/10 text-white placeholder:text-slate-500 focus:border-violet-400/40 focus:ring-violet-400/20' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-teal-400/40 focus:ring-teal-400/20'}`} />
            </div>
            <StageBadge variant="neutral" className="ml-auto">{loading ? 'Chargement...' : `${filtered.length} membre${filtered.length > 1 ? 's' : ''}`}</StageBadge>
          </div>

          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead><tr className={`border-b text-left text-xs ${isDark ? 'border-white/5 text-slate-500' : 'border-slate-100 text-slate-400'}`}><th className="pb-3 w-12"></th><th className="pb-3 font-bold uppercase tracking-wider">Nom</th><th className="pb-3 font-bold uppercase tracking-wider">Email</th><th className="pb-3 font-bold uppercase tracking-wider">Rôle</th><th className="pb-3 font-bold uppercase tracking-wider">Statut</th><th className="pb-3 font-bold uppercase tracking-wider">Dernière connexion</th><th className="pb-3 w-12"></th></tr></thead>
              <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-50'}`}>
                {paginated.map(user => {
                  const initials = `${user.first_name[0] || ''}${user.last_name[0] || ''}`
                  return (
                    <tr key={user.id} className={`${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50'} transition-colors group`}>
                      <td className="py-3"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow">{initials}</div></td>
                      <td className={`py-3 text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.first_name} {user.last_name}</td>
                      <td className={`py-3 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{user.email}</td>
                      <td className="py-3"><Badge variant={roleBadgeColors[user.role] || 'default'} size="sm">{user.role === 'admin' ? 'Administrateur' : user.role === 'gerant' ? 'Gérant' : 'Agent'}</Badge></td>
                      <td className="py-3"><div className="flex items-center gap-1.5">{user.status === 'actif' && <><span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" /><span className="text-xs font-semibold text-emerald-600">Actif</span></>}{user.status === 'inactif' && <><span className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-xs font-semibold text-amber-600">Inactif</span></>}{user.status === 'suspendu' && <><span className="w-2 h-2 rounded-full bg-rose-500" /><span className="text-xs font-semibold text-rose-600">Suspendu</span></>}{user.status === 'supprimé' && <><span className="w-2 h-2 rounded-full bg-slate-400" /><span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Supprimé</span></>}{user.days_since_last_login !== null && user.days_since_last_login > 0 && <span className="text-[10px] text-slate-400 ml-1">{user.days_since_last_login}j</span>}</div></td>
                      <td className={`py-3 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{user.last_login_at ? new Date(user.last_login_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                      <td className="py-3"><button onClick={e => { if (menuTarget?.user.id === user.id) { setMenuTarget(null); return } const rect = e.currentTarget.getBoundingClientRect(); const mh = 300; let top = rect.bottom + 4; if (top + mh > window.innerHeight) top = rect.top - mh - 4; setMenuTarget({ user, position: { top, right: window.innerWidth - rect.right } }) }} className={`p-1.5 rounded-xl transition-colors opacity-0 group-hover:opacity-100 ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}><MoreHorizontal size={16} /></button></td>
                    </tr>
                  )
                })}
                {paginated.length === 0 && <tr><td colSpan={7} className={`py-10 text-center text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Aucun membre trouvé</td></tr>}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className={`flex items-center justify-between pt-4 mt-3 border-t ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Affichage {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} sur {filtered.length}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className={`p-1.5 rounded-lg border transition-colors disabled:opacity-30 ${isDark ? 'border-white/10 text-slate-400 hover:bg-white/5' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}><ChevronLeft size={15} /></button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${page === currentPage ? 'text-white shadow' : isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`} style={page === currentPage ? { backgroundImage: isDark ? 'linear-gradient(135deg, #8B7CFF, #6C5ECF)' : 'linear-gradient(135deg, #2DD4BF, #0D9488)' } : undefined}>{page}</button>)}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className={`p-1.5 rounded-lg border transition-colors disabled:opacity-30 ${isDark ? 'border-white/10 text-slate-400 hover:bg-white/5' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}><ChevronRight size={15} /></button>
              </div>
            </div>
          )}
        </div>

        <div className="stage-glass p-6">
          <h3 className={`text-sm font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Rôles et permissions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: 'Administrateur', desc: 'Accès total à toutes les fonctionnalités', perms: ['Gestion des utilisateurs', 'Configuration', 'Toutes les données'], hue: STAGE_HUES.amber },
              { title: 'Agent', desc: 'Gestion des clients, biens et transactions', perms: ['Clients', 'Biens immobiliers', 'Transactions', 'Calendrier'], hue: STAGE_HUES.emerald },
            ].map(role => (
              <div key={role.title} className={`p-4 rounded-2xl border ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/40'}`}>
                <div className="flex items-center gap-2 mb-1"><span className="h-2 w-2 rounded-full" style={{ background: role.hue.line, boxShadow: `0 0 8px ${role.hue.glow}` }} /><h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{role.title}</h4></div>
                <p className={`text-xs mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{role.desc}</p>
                <ul className="space-y-1.5">{role.perms.map(p => <li key={p} className={`text-xs flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}><span className="w-1 h-1 rounded-full" style={{ background: role.hue.line }} /> {p}</li>)}</ul>
              </div>
            ))}
          </div>
        </div>

        {menuTarget && <ActionMenu user={menuTarget.user} position={menuTarget.position} adminId={adminId!} onClose={() => setMenuTarget(null)} onReactivate={handleReactivate} onDelete={handleDelete} onResetPassword={handleResetPassword} onResendCredentials={handleResendCredentials} />}
      </div>
    </Stage>
  )
}
