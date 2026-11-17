import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ClientHeader } from '../../../components/modules/clients/ClientHeader'
import { ClientInfos } from '../../../components/modules/clients/ClientInfos'
import { BuyerDetailTabs } from '../../../components/modules/clients/ClientInfos/BuyerDetailTabs'
import { SellerDetailTabs } from '../../../components/modules/clients/ClientInfos/SellerDetailTabs'
import { BailleurDetailTabs } from '../../../components/modules/clients/ClientInfos/BailleurDetailTabs'
import { LocataireDetailTabs } from '../../../components/modules/clients/ClientInfos/LocataireDetailTabs'
import { VoyageurDetailTabs } from '../../../components/modules/clients/ClientInfos/VoyageurDetailTabs'
import { Select } from '../../../components/ui/Select'
import { Input } from '../../../components/ui/Input'
import { Textarea } from '../../../components/ui/Textarea'
import { useToast } from '../../../components/ui/Toast'
import { api } from '../../../services/api'
import { deleteClient, duplicateClient } from '../../../services/clientService'
import { BuyerFormModal } from '../../../components/modules/clients/BuyerFormModal'
import { SellerFormModal } from '../../../components/modules/clients/SellerFormModal'
import { BailleurFormModal } from '../../../components/modules/clients/BailleurFormModal'
import { LocataireFormModal } from '../../../components/modules/clients/LocataireFormModal'
import { VoyageurFormModal } from '../../../components/modules/clients/VoyageurFormModal'
import type { Client } from '../../../types/client'
import {
  Repeat, Trash2, RefreshCw, AlertTriangle, Shield, Copy, Heart, Edit3,
  ArrowLeft, Check, Share2,
} from 'react-feather'
import { triggerMandatExpireNotification } from '../../../services/automatorTrigger'
import { useStageTheme, useStageAccent, STAGE_HUES, type StageHue } from '../../../components/dashboard/Stage'
import StageModal, { useStageModalButtons } from '../../../components/modules/calendar/StageModal'
import { stagePillStyle } from '../../../components/modules/prospects/ProspectDetailStage'
import { getClientStatusHue, getClientInitials } from '../../../components/modules/clients/ClientCard'
import { cn } from '../../../lib/utils'

const DANGER_HUE: StageHue = {
  a: '#FB7185',
  b: '#E11D48',
  glow: 'rgba(244,63,94,0.45)',
  line: '#F43F5E',
}

const STATUS_BY_TYPE: Record<string, string[]> = {
  Acheteur: ['En qualification', 'En recherche', 'En negociation', 'En compromis', 'Vendu / Achete', 'Inactif', 'Perdu'],
  Vendeur: ['En attente de signature', 'En mandat', 'En negociation', 'En compromis', 'Vendu', 'Inactif', 'Perdu'],
  Bailleur: ['En attente de signature', 'En mandat', 'En location', 'Inactif', 'Perdu'],
  Locataire: ['En recherche', 'En visite', 'En dossier', 'Bail signe', 'Installe', 'Inactif', 'Perdu'],
  Voyageur: ['En recherche', 'Reservation en cours', 'Confirme', 'En sejour', 'Termine', 'Annule', 'Inactif'],
}

const typeToRoute: Record<string, string> = {
  Acheteur: 'acheteur', Vendeur: 'vendeur', Bailleur: 'bailleur', Locataire: 'locataire', Voyageur: 'voyageur',
}

const getRoleBadge = (role?: string, position?: string) => {
  if (role === 'agent') return { label: position || 'Agent', hue: STAGE_HUES.emerald }
  if (role === 'gerant') return { label: 'Gérant', hue: STAGE_HUES.amber }
  if (role === 'admin') return { label: 'Admin', hue: STAGE_HUES.violet }
  return null
}

function ClientSummaryCard({ client, isDark, hue }: { client: Client; isDark: boolean; hue: StageHue }) {
  const statusKey = (client.statutMetier || client.status || '').trim() || '—'
  const statusHue = getClientStatusHue(statusKey) || hue
  return (
    <div className={cn('flex items-center gap-3 rounded-2xl border p-3', isDark ? 'border-white/[0.08] bg-white/[0.03]' : 'border-slate-200/70 bg-white/70')}>
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
        style={{ background: `linear-gradient(145deg, ${hue.a}, ${hue.b})`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35), 0 8px 18px -8px ${hue.glow}` }}
      >
        {getClientInitials(client.name || 'Client')}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>{client.name || 'Client'}</p>
        <p className={cn('truncate text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>
          {[client.type, client.phone].filter(Boolean).join(' · ') || '—'}
        </p>
      </div>
      <span className="shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold" style={stagePillStyle(statusHue, isDark)}>
        {statusKey}
      </span>
    </div>
  )
}

export default function AdminClientPage() {
  const { id, adminId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const highlightActivityId = searchParams.get('tab') === 'notes_activite' ? Number(searchParams.get('activityId')) || undefined : undefined
  const { toast } = useToast()

  const [client, setClient] = useState<Client | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const lastKnownMandatRef = useRef<string | undefined>(undefined)

  const [showReassignDialog, setShowReassignDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState('')
  const [reassignNote, setReassignNote] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteReason, setDeleteReason] = useState('')
  const [newStatus, setNewStatus] = useState('')
  const [liked, setLiked] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [dataRefreshKey, setDataRefreshKey] = useState(0)
  const [isGerant, setIsGerant] = useState(false)

  const stageTheme = useStageTheme()
  const isDark = stageTheme === 'dark'
  const stageAccent = useStageAccent()
  const btns = useStageModalButtons()

  useEffect(() => {
    api.get<any>('/auth/me')
      .then(u => u && setIsGerant(u.role === 'gerant'))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      api.get<Client>(`/clients/${id}`),
      api.get<any[]>('/admin/users'),
    ]).then(([c, u]) => {
      setClient(c)
      setUsers(Array.isArray(u) ? u : [])
    }).catch(() => {
      setClient(null)
    }).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!client) return
    if (lastKnownMandatRef.current === undefined) {
      lastKnownMandatRef.current = client.statutMandat
      return
    }
    if (client.statutMandat === 'Expire' && lastKnownMandatRef.current !== 'Expire') {
      lastKnownMandatRef.current = 'Expire'
      const clientParts = (client.name || '').split(' ')
      const prenom = clientParts[0] || ''
      const nom = clientParts.slice(1).join(' ') || ''
      const agentUser = client.agentId
        ? users.find((u: any) => String(u.id) === client.agentId)
          || users.find((u: any) => `${u.first_name || ''} ${u.last_name || ''}`.trim().toLowerCase() === client.agentId!.toLowerCase())
        : undefined
      try {
        triggerMandatExpireNotification({
          bienTitre: `${(client as any).propertyType || 'Bien'} - ${client.area || ''}`.trim(),
          bienAdresse: client.area,
          clientPrenom: prenom,
          clientNom: nom,
          clientType: (client.type || 'Vendeur').toLowerCase(),
          mandatType: (client as any).typeMandat || 'Mandat standard',
          mandatNumero: (client as any).numeroMandat,
          dateExpiration: client.dateExpiration ? new Date(client.dateExpiration).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR'),
          agentNom: (agentUser ? `${agentUser.first_name || ''} ${agentUser.last_name || ''}`.trim() : null) || client.agentDesigne || 'Non assigne',
        })
      } catch (e) {
        console.error('triggerMandatExpireNotification failed:', e)
      }
    } else {
      lastKnownMandatRef.current = client.statutMandat
    }
  }, [client, users])

  const findPerson = (agentId: string) => {
    if (!agentId) return undefined
    const normalized = agentId.toLowerCase()
    const person = users.find((u: any) => String(u.id) === agentId)
      || users.find((u: any) => {
        const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim().toLowerCase()
        const reverseName = `${u.last_name || ''} ${u.first_name || ''}`.trim().toLowerCase()
        return fullName === normalized || reverseName === normalized
      })
    if (!person) return undefined
    const initials = `${(person.first_name || '')[0] || ''}${(person.last_name || '')[0] || ''}`.toUpperCase() || '?'
    return {
      name: `${person.first_name || ''} ${person.last_name || ''}`.trim(),
      initials,
      role: person.role as string | undefined,
      position: person.position as string | undefined,
    }
  }

  const getAgentName = (agentId?: string) => {
    if (!agentId) return 'Non assigné'
    const person = findPerson(agentId)
    return person ? person.name : client?.agentDesigne || 'Non assigné'
  }

  const getAgentInitials = (agentId?: string) => {
    if (!agentId) return 'NA'
    const person = findPerson(agentId)
    return person ? person.initials : (client?.agentDesigne || 'NA').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="relative flex h-12 w-12 items-center justify-center">
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full"
            style={{ background: isDark ? 'rgba(139,124,255,0.2)' : 'rgba(45,212,191,0.25)' }}
          />
          <span
            className="relative inline-flex h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: isDark ? 'rgba(139,124,255,0.8)' : 'rgba(20,184,166,0.8)', borderTopColor: 'transparent' }}
          />
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className={cn('mb-4 flex h-16 w-16 items-center justify-center rounded-2xl', isDark ? 'bg-white/[0.04] text-slate-500' : 'bg-slate-100 text-slate-400')}>
          <AlertTriangle size={26} />
        </div>
        <h2 className={cn('text-lg font-semibold', isDark ? 'text-white' : 'text-slate-900')}>Client non trouvé</h2>
        <p className={cn('mt-1 max-w-sm text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>
          Ce client n&apos;existe plus ou vous n&apos;avez pas les droits pour le consulter.
        </p>
        <button
          type="button"
          onClick={() => navigate(adminId ? `/admin/${adminId}/clients` : '/admin/clients')}
          className={cn('mt-6 inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition-all', isDark ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10' : 'border-slate-200/80 bg-white/70 text-slate-600 hover:bg-white')}
        >
          <ArrowLeft size={14} /> Retour aux clients
        </button>
      </div>
    )
  }

  const handleDelete = async () => {
    if (deleteConfirm !== 'SUPPRIMER' || !client) return
    try {
      await deleteClient(String(client.id))
      toast('success', `${client.name || 'Client'} supprimé`)
      navigate(client.type && adminId ? `/admin/${adminId}/clients/type/${typeToRoute[client.type] || ''}` : adminId ? `/admin/${adminId}/clients` : '/admin/clients')
    } catch (err: any) {
      toast('error', err.message || 'Erreur lors de la suppression')
    }
    setShowDeleteDialog(false)
    setDeleteConfirm('')
    setDeleteReason('')
  }

  const handleStatusChange = async () => {
    if (!client || newStatus === (client.statutMetier || client.status)) return
    try {
      await api.put(`/clients/${client.id}`, { statutMetier: newStatus })
      setClient({ ...client, statutMetier: newStatus } as Client)
      setDataRefreshKey(k => k + 1)
      toast('success', 'Statut mis à jour')
    } catch (err: any) {
      toast('error', err.message || 'Erreur lors du changement de statut')
    }
    setShowStatusDialog(false)
  }

  const handleReassign = async () => {
    if (!client || !selectedAgent) return
    try {
      const agentUser = users.find((u: any) => String(u.id) === selectedAgent)
      const agentName = agentUser ? `${agentUser.first_name || ''} ${agentUser.last_name || ''}`.trim() : ''
      await api.put(`/clients/${client.id}`, { agentId: selectedAgent, agentDesigne: agentName })
      setClient({ ...client, agentId: selectedAgent, agentDesigne: agentName } as Client)
      setDataRefreshKey(k => k + 1)
      toast('success', 'Client réaffecté avec succès')
    } catch (err: any) {
      toast('error', err.message || 'Erreur lors de la réaffectation')
    }
    setShowReassignDialog(false)
    setSelectedAgent('')
    setReassignNote('')
  }

  const handleDuplicate = async () => {
    if (!client) return
    try {
      const duplicated = await duplicateClient(String(client.id))
      toast('success', `${duplicated.name || 'Client'} dupliqué avec succès`)
      navigate(adminId && duplicated.type ? `/admin/${adminId}/clients/type/${typeToRoute[duplicated.type] || ''}/${duplicated.id}` : `/admin/clients/${duplicated.id}`)
    } catch (err: any) {
      toast('error', err.message || 'Erreur lors de la duplication')
    }
  }

  const handleUpdateClient = async (clientData: Omit<Client, 'id'>) => {
    try {
      await api.put(`/clients/${client.id}`, clientData)
      const refreshed = await api.get<Client>(`/clients/${client.id}`)
      setClient(refreshed)
      setDataRefreshKey(k => k + 1)

      const newStatutMandat = (clientData as any).statutMandat
      const newDateExpiration = (clientData as any).dateExpiration

      const isDateReached = newDateExpiration && new Date(newDateExpiration) <= new Date()
      if (newStatutMandat === 'Expire' || newStatutMandat?.toLowerCase() === 'expire' || isDateReached) {
        try {
          const clientParts = (client.name || '').split(' ')
          const prenom = clientParts[0] || ''
          const nom = clientParts.slice(1).join(' ') || ''
          lastKnownMandatRef.current = 'Expire'
          const agentUser = client.agentId ? users.find((u: any) => String(u.id) === client.agentId) : undefined
          await triggerMandatExpireNotification({
            bienTitre: `${(client as any).propertyType || 'Bien'} - ${client.area || ''}`.trim(),
            bienAdresse: client.area,
            clientPrenom: prenom,
            clientNom: nom,
            clientType: (client.type || 'Vendeur').toLowerCase(),
            mandatType: (clientData as any).typeMandat || 'Mandat standard',
            mandatNumero: (clientData as any).numeroMandat,
            dateExpiration: newDateExpiration ? new Date(newDateExpiration).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR'),
            agentNom: getAgentName(client.agentId),
            agentEmail: agentUser?.email || undefined,
            bienConcerneId: (client as any).bienConcerneId || (clientData as any).bienConcerneId,
            agentId: client.agentId,
          })
        } catch (triggerErr) {
          console.error('triggerMandatExpireNotification failed:', triggerErr)
        }
      }

      toast('success', `${client.type || 'Client'} modifié avec succès`)
    } catch (err) {
      console.error('Failed to update client:', err)
      toast('error', `Erreur lors de la modification`)
    }
    setShowEditModal(false)
  }

  const enhancedClient = {
    ...client,
    email: client.email || `${(client.name || '').replace(' ', '.').toLowerCase()}@example.com`,
    area: client.area || 'Maroc',
    minSurface: client.minSurface || 50,
    rooms: client.rooms || '3',
    specificCriteria: (client as any).criteres || [],
    comments: client.notes || '',
    contribution: client.contribution || 0,
    financingType: (client as any).financingType || '',
    loanDuration: (client as any).loanDuration || 0,
    documents: (client as any).documents || [],
    lastContact: (client as any).lastContact || new Date().toISOString(),
    events: (client as any).events || [],
  }

  const accent = stageAccent
  const ink = isDark ? accent.a : accent.b
  const statusLabel = client.statutMetier || client.status
  const backRoute = adminId && client.type ? `/admin/${adminId}/clients/type/${typeToRoute[client.type] || ''}` : adminId ? `/admin/${adminId}/clients` : '/admin/clients'

  const person = findPerson(client.agentId || '')
  const roleBadge = getRoleBadge(person?.role, person?.position)

  const primaryBtn = 'inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-xs font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95'
  const glassBtn = `inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold backdrop-blur-md transition-all duration-200 hover:scale-[1.02] active:scale-95 ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10 hover:text-white' : 'border-slate-200/80 bg-white/70 text-slate-600 shadow-sm hover:bg-white hover:text-slate-900'}`
  const roseBtn = `inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold backdrop-blur-md transition-all duration-200 hover:scale-[1.02] active:scale-95 ${isDark ? 'border-rose-400/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:text-rose-200' : 'border-rose-200/80 bg-rose-50/70 text-rose-600 shadow-sm hover:bg-rose-50 hover:text-rose-700'}`
  const adminBtn = `inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-bold backdrop-blur-md transition-all duration-200 hover:scale-[1.02] active:scale-95 ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10 hover:text-white' : 'border-slate-200/80 bg-white/70 text-slate-600 shadow-sm hover:bg-white hover:text-slate-900'}`
  const adminDangerBtn = `inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-bold backdrop-blur-md transition-all duration-200 hover:scale-[1.02] active:scale-95 ${isDark ? 'border-rose-400/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:text-rose-200' : 'border-rose-200/80 bg-rose-50/70 text-rose-600 shadow-sm hover:bg-rose-50 hover:text-rose-700'}`

  return (
    <div className="space-y-5 animate-fade-in pb-10">
      {/* ── Top action bar: Retour + quick actions ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <motion.button
          type="button"
          onClick={() => navigate(backRoute)}
          whileHover="hover"
          whileTap={{ scale: 0.96 }}
          title="Retour aux clients"
          className={`group/back relative flex h-9 shrink-0 items-center gap-2 overflow-hidden rounded-xl border pl-2.5 pr-4 text-xs font-bold backdrop-blur-md transition-all ${
            isDark
              ? 'border-white/10 bg-white/[0.04] text-slate-400 hover:border-violet-400/30 hover:bg-white/10 hover:text-white'
              : 'border-slate-200/80 bg-white/70 text-slate-500 shadow-sm hover:border-slate-300 hover:bg-white hover:text-slate-900'
          }`}
        >
          <motion.span
            className="flex h-6 w-6 items-center justify-center rounded-lg"
            style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.05)' }}
            variants={{ hover: { x: -3 } }}
            transition={{ type: 'spring', stiffness: 500, damping: 28 }}
          >
            <ArrowLeft size={14} style={{ color: isDark ? accent.a : ink }} />
          </motion.span>
          <span>Retour aux clients</span>
          <motion.span
            className="absolute inset-x-3 bottom-1 h-[2px] origin-left rounded-full"
            style={{ background: `linear-gradient(90deg, ${accent.a}, ${accent.b})` }}
            initial={{ scaleX: 0, opacity: 0 }}
            variants={{ hover: { scaleX: 1, opacity: 0.8 } }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          />
        </motion.button>

        <div className="flex flex-wrap items-center gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.85 }}
            title="J'aime"
            onClick={() => setLiked(!liked)}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/20 hover:bg-white/10 hover:text-white' : 'border-slate-200/80 bg-white/70 text-slate-500 shadow-sm hover:bg-white hover:text-slate-900'}`}
          >
            <Heart size={15} fill={liked ? 'currentColor' : 'none'} className={liked ? 'text-rose-500' : ''} />
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowEditModal(true)}
            className={primaryBtn}
            style={{
              backgroundImage: `linear-gradient(145deg, ${accent.a} 0%, ${accent.b} 100%)`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.4), 0 10px 26px -10px ${accent.glow}`,
            }}
          >
            <Edit3 size={14} />
            Modifier
          </motion.button>
          <button type="button" className={glassBtn}>
            <Share2 size={14} />
            Partager
          </button>
          <button
            type="button"
            onClick={() => { setDeleteConfirm(''); setDeleteReason(''); setShowDeleteDialog(true) }}
            className={roseBtn}
          >
            <Trash2 size={14} />
            Supprimer
          </button>
        </div>
      </motion.div>

      {/* ── Admin actions ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        className="stage-glass relative overflow-hidden !rounded-[20px] px-3.5 py-2.5"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="mr-1 inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em]"
            style={{ color: isDark ? accent.a : ink }}
          >
            <Shield size={13} /> Actions administrateur
          </span>
          <button
            type="button"
            className={adminBtn}
            onClick={() => {
              const rawId = String(client.agentId || '')
              const matchedUser = users.find((u: any) => String(u.id) === rawId)
                || users.find((u: any) => {
                  const full = `${u.first_name || ''} ${u.last_name || ''}`.trim()
                  return full.toLowerCase() === rawId.toLowerCase()
                })
              setSelectedAgent(matchedUser ? String(matchedUser.id) : '')
              setReassignNote('')
              setShowReassignDialog(true)
            }}
          >
            <Repeat size={13} /> Réaffecter
          </button>
          <button
            type="button"
            className={adminBtn}
            onClick={() => { setNewStatus(client.statutMetier || client.status || ''); setShowStatusDialog(true) }}
          >
            <RefreshCw size={13} /> Changer le statut
          </button>
          <button type="button" className={adminBtn} onClick={handleDuplicate}>
            <Copy size={13} /> Dupliquer
          </button>
          <button
            type="button"
            className={adminDangerBtn}
            onClick={() => { setDeleteConfirm(''); setDeleteReason(''); setShowDeleteDialog(true) }}
          >
            <Trash2 size={13} /> Supprimer
          </button>
          {client.originalClientId && (
            <span
              className="ml-auto inline-flex items-center rounded-full px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em]"
              style={stagePillStyle(STAGE_HUES.amber, isDark)}
            >
              Copie
            </span>
          )}
        </div>
      </motion.div>

      {/* ── Stage hero header ── */}
      <ClientHeader key={dataRefreshKey} client={enhancedClient} isGerant={isGerant} />

      {/* ── Client detail tabs (type-specific) ── */}
      <div>
        {client.type === 'Acheteur' ? (
          <BuyerDetailTabs key={dataRefreshKey} client={enhancedClient} adminId={adminId} highlightActivityId={highlightActivityId} isGerant={isGerant} />
        ) : client.type === 'Vendeur' ? (
          <SellerDetailTabs key={dataRefreshKey} client={enhancedClient} adminId={adminId} highlightActivityId={highlightActivityId} isGerant={isGerant} />
        ) : client.type === 'Bailleur' ? (
          <BailleurDetailTabs key={dataRefreshKey} client={enhancedClient} highlightActivityId={highlightActivityId} isGerant={isGerant} />
        ) : client.type === 'Locataire' ? (
          <LocataireDetailTabs key={dataRefreshKey} client={enhancedClient} adminId={adminId} highlightActivityId={highlightActivityId} isGerant={isGerant} />
        ) : client.type === 'Voyageur' ? (
          <VoyageurDetailTabs key={dataRefreshKey} client={enhancedClient} adminId={adminId} highlightActivityId={highlightActivityId} isGerant={isGerant} />
        ) : (
          <ClientInfos key={dataRefreshKey} client={enhancedClient} isGerant={isGerant} />
        )}
      </div>

      {/* Reassign Modal */}
      <StageModal
        open={showReassignDialog}
        onClose={() => setShowReassignDialog(false)}
        eyebrow="Administration"
        title="Réaffecter un client"
        subtitle={[client.type, client.phone].filter(Boolean).join(' · ')}
        icon={Repeat}
        hue={accent}
        accent={accent.a}
        maxWidth="max-w-lg"
        centered
        bodyClassName="space-y-4 pt-1"
        footer={
          <>
            <button type="button" onClick={() => setShowReassignDialog(false)} className={btns.ghost}>
              Annuler
            </button>
            <button
              type="button"
              onClick={handleReassign}
              disabled={!selectedAgent}
              className={cn(btns.primary, !selectedAgent && 'pointer-events-none opacity-40')}
            >
              <Repeat size={14} /> Réaffecter
            </button>
          </>
        }
      >
        <ClientSummaryCard client={client} isDark={isDark} hue={accent} />

        <div>
          <p className={cn('mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em]', isDark ? 'text-slate-400/85' : 'text-slate-500')}>
            Responsable actuel
          </p>
          <div
            className={cn(
              'flex items-center gap-3 rounded-2xl border p-3',
              isDark ? 'border-white/[0.08] bg-white/[0.03]' : 'border-slate-200/70 bg-white/70',
            )}
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-extrabold text-white"
              style={{
                background: person
                  ? `linear-gradient(145deg, ${accent.a}, ${accent.b})`
                  : isDark
                    ? 'rgba(148,163,184,0.25)'
                    : 'rgba(148,163,184,0.35)',
                boxShadow: person ? `0 6px 16px -6px ${accent.glow}` : undefined,
              }}
            >
              {getAgentInitials(client.agentId)}
            </div>
            <div className="min-w-0 flex-1">
              <p className={cn('truncate text-sm font-bold', isDark ? 'text-white' : 'text-slate-900')}>
                {getAgentName(client.agentId)}
              </p>
              {!client.agentId && (
                <p className={cn('text-[11px]', isDark ? 'text-slate-500' : 'text-slate-400')}>Aucun responsable</p>
              )}
            </div>
            {roleBadge && (
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.08em]"
                style={stagePillStyle(roleBadge.hue, isDark)}
              >
                {roleBadge.label}
              </span>
            )}
          </div>
        </div>

        <Select
          label="Nouveau responsable"
          placeholder="Sélectionner un responsable"
          value={selectedAgent}
          onValueChange={setSelectedAgent}
          options={[
            { value: '', label: 'Non assigné' },
            ...users.filter((u: any) => u.status !== 'supprimé').map((u: any) => ({
              value: String(u.id),
              label: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
            })),
          ]}
        />

        <Textarea
          label="Note pour le responsable"
          placeholder="Je vous confie ce client pour le suivi..."
          value={reassignNote}
          onChange={(e) => setReassignNote(e.target.value)}
          rows={3}
        />
      </StageModal>

      {/* Delete Confirmation Modal */}
      <StageModal
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        eyebrow="Zone sensible"
        title="Supprimer le client"
        subtitle={[client.type, client.phone].filter(Boolean).join(' · ')}
        icon={Trash2}
        hue={DANGER_HUE}
        accent={DANGER_HUE.a}
        maxWidth="max-w-lg"
        centered
        bodyClassName="space-y-4 pt-1"
        footer={
          <>
            <button type="button" onClick={() => setShowDeleteDialog(false)} className={btns.ghost}>
              Annuler
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteConfirm !== 'SUPPRIMER'}
              className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-xl border px-4 text-sm font-semibold transition-all duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40',
                isDark
                  ? 'border-rose-500/30 bg-rose-500/15 text-rose-200 hover:bg-rose-500/25'
                  : 'border-rose-500 bg-rose-500 text-white shadow-[0_10px_24px_-10px_rgba(244,63,94,0.7)] hover:bg-rose-600',
              )}
            >
              <Trash2 size={14} /> Confirmer la suppression
            </button>
          </>
        }
      >
        <ClientSummaryCard client={client} isDark={isDark} hue={DANGER_HUE} />

        <div
          className={cn(
            'flex items-start gap-2.5 rounded-2xl border p-3.5',
            isDark ? 'border-rose-400/25 bg-rose-500/10' : 'border-rose-200/80 bg-rose-50/80',
          )}
        >
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-rose-500" />
          <div className={cn('space-y-1 text-xs', isDark ? 'text-rose-200' : 'text-rose-700')}>
            <p className="font-bold">Attention :</p>
            <ul className="list-inside list-disc space-y-0.5">
              <li>Cette action est IRRÉVERSIBLE</li>
              <li>Tous les documents associés seront supprimés</li>
              <li>Tous les mandats liés seront supprimés</li>
              <li>L&apos;historique du client sera effacé</li>
            </ul>
          </div>
        </div>

        <Input
          label="Confirmation"
          placeholder='Tapez "SUPPRIMER" pour confirmer'
          value={deleteConfirm}
          onChange={(e) => setDeleteConfirm(e.target.value)}
        />

        <Select
          label="Motif de suppression (optionnel)"
          placeholder="Sélectionner un motif"
          value={deleteReason}
          onValueChange={setDeleteReason}
          options={[
            { value: '', label: 'Sélectionner un motif' },
            { value: 'doublon', label: 'Erreur de saisie - Doublon' },
            { value: 'retire', label: 'Client retiré' },
            { value: 'decede', label: 'Client décédé' },
            { value: 'autre', label: 'Autre' },
          ]}
        />
      </StageModal>

      {/* Change Status Modal */}
      <StageModal
        open={showStatusDialog}
        onClose={() => setShowStatusDialog(false)}
        eyebrow="Cycle de vie"
        title="Changer le statut"
        subtitle={`${client.name || 'Client'} · ${client.type || ''}`}
        icon={RefreshCw}
        hue={accent}
        accent={accent.a}
        maxWidth="max-w-lg"
        centered
        bodyClassName="space-y-4 pt-1"
        footer={
          <>
            <button type="button" onClick={() => setShowStatusDialog(false)} className={btns.ghost}>
              Annuler
            </button>
            <button
              type="button"
              onClick={handleStatusChange}
              disabled={newStatus === statusLabel}
              className={cn(btns.primary, newStatus === statusLabel && 'pointer-events-none opacity-40')}
            >
              <RefreshCw size={14} /> Changer le statut
            </button>
          </>
        }
      >
        <ClientSummaryCard client={client} isDark={isDark} hue={accent} />

        <div>
          <p className={cn('mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em]', isDark ? 'text-slate-400/85' : 'text-slate-500')}>
            Statut actuel
          </p>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.08em]"
            style={stagePillStyle(getClientStatusHue(statusLabel || '') || accent, isDark)}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: (getClientStatusHue(statusLabel || '') || accent).line }}
            />
            {statusLabel}
          </span>
        </div>

        <div>
          <p className={cn('mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em]', isDark ? 'text-slate-400/85' : 'text-slate-500')}>
            Nouveau statut
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(STATUS_BY_TYPE[client.type || ''] || []).map((s) => {
              const hue = getClientStatusHue(s) || accent
              const selected = newStatus === s
              return (
                <motion.button
                  key={s}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setNewStatus(s)}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition-all duration-200',
                    !selected &&
                      (isDark
                        ? 'border-white/[0.08] bg-white/[0.03] text-slate-300 hover:border-white/15 hover:bg-white/[0.06]'
                        : 'border-slate-200/70 bg-white/70 text-slate-600 hover:border-slate-300 hover:bg-white'),
                  )}
                  style={selected ? stagePillStyle(hue, isDark) : undefined}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: hue.line, boxShadow: `0 0 8px ${hue.glow}` }}
                    />
                    {s}
                  </span>
                  {selected && <Check size={13} />}
                </motion.button>
              )
            })}
          </div>
        </div>
      </StageModal>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && client.type === 'Acheteur' && (
          <BuyerFormModal onClose={() => setShowEditModal(false)} onSubmit={handleUpdateClient} client={client} isGerant={isGerant} />
        )}
        {showEditModal && client.type === 'Vendeur' && (
          <SellerFormModal onClose={() => setShowEditModal(false)} onSubmit={handleUpdateClient} client={client} isGerant={isGerant} />
        )}
        {showEditModal && client.type === 'Bailleur' && (
          <BailleurFormModal onClose={() => setShowEditModal(false)} onSubmit={handleUpdateClient} client={client} isGerant={isGerant} />
        )}
        {showEditModal && client.type === 'Locataire' && (
          <LocataireFormModal onClose={() => setShowEditModal(false)} onSubmit={handleUpdateClient} client={client} isGerant={isGerant} />
        )}
        {showEditModal && client.type === 'Voyageur' && (
          <VoyageurFormModal onClose={() => setShowEditModal(false)} onSubmit={handleUpdateClient} client={client} isGerant={isGerant} />
        )}
      </AnimatePresence>
    </div>
  )
}
