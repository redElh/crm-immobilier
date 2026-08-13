import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, User, Users, Home, DollarSign, Calendar, Clock, Download,
  Trash2, Phone, Mail, MapPin, Shield, Send, RefreshCw, MessageSquare,
  Zap, Layout, Link2, Copy, ArrowRight, Upload, ExternalLink,
  ChevronLeft, ChevronRight, Filter, CheckCircle, Share2, Lock,
} from 'react-feather'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import { BackLink } from '../../components/ui/BackLink'
import { Dialog } from '../../components/ui/Dialog'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Select } from '../../components/ui/Select'
import { Input } from '../../components/ui/Input'
import { DatePicker } from '../../components/ui/DatePicker'
import { Textarea } from '../../components/ui/Textarea'
import { InfoField } from '../../components/ui/InfoField'
import { useToast } from '../../components/ui/Toast'
import { DocumentCategorySection } from '../../components/modules/documents/DocumentCategorySection'
import {
  mockContracts,
  CONTRACT_TYPE_LABELS,
  CONTRACT_TYPE_CONFIG,
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
  VENTE_ETAPE_LABELS,
  VENTE_ETAPE_COLORS,
  partyRoleColor,
} from '../../types/contract'
import type { Contract, ContractStatus, ContractDocument, ContractHistoryEntry } from '../../types/contract'
import {
  fetchContractById,
  updateContract,
  deleteContract,
  fetchContractHistory,
  uploadContractFiles,
  updateContractDocuments,
  deleteContractDocument,
  sendContractToProprietaire,
} from '../../services/contractService'
import { api } from '../../services/api'
import { generateContratPdf, buildContractPdfData } from '../../utils/generateContratPdf'
import { resolveMediaUrl, downloadMedia } from '../../utils/mediaUrl'
import { useMyPermissions, permissionAllowed } from '../../hooks/useMyPermissions'

interface TabItem {
  id: string
  label: string
  icon: React.ReactNode
}

const STATUS_META: Record<ContractStatus, { label: string; dot: string; badge: string; badgeBg: string }> = {
  en_cours: { label: 'En cours', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200', badgeBg: 'bg-amber-50' },
  confirme_actif: { label: 'Confirmé / Actif', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', badgeBg: 'bg-emerald-50' },
  paye: { label: 'Payé', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', badgeBg: 'bg-emerald-50' },
  occupe: { label: 'Occupé', dot: 'bg-sky-500', badge: 'bg-sky-50 text-sky-700 border-sky-200', badgeBg: 'bg-sky-50' },
  finalise_termine: { label: 'Finalisé / Terminé', dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 border-blue-200', badgeBg: 'bg-blue-50' },
  annule: { label: 'Annulé', dot: 'bg-red-500', badge: 'bg-red-50 text-red-700 border-red-200', badgeBg: 'bg-red-50' },
}

const STATUS_DESCRIPTIONS: Record<ContractStatus, string> = {
  en_cours: 'Le contrat est en cours de traitement ou d’attente de signature.',
  confirme_actif: 'Le contrat est confirmé et actif.',
  paye: 'Le paiement a été intégralement encaissé.',
  occupe: 'Le bien est actuellement occupé (séjour en cours).',
  finalise_termine: 'Le contrat est finalisé et le séjour est terminé.',
  annule: 'Le contrat a été annulé.',
}

const STATUS_ORDER: ContractStatus[] = ['en_cours', 'confirme_actif', 'paye', 'occupe', 'finalise_termine', 'annule']

const isImageDoc = (doc: ContractDocument) => {
  const t = (doc.type || '').toLowerCase()
  const u = (doc.url || '').toLowerCase()
  return t.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg|jfif)$/.test(u)
}

function normalizeContract(raw: any): Contract {
  const type = raw.type || raw.contractType
  return {
    id: raw.id,
    reference: raw.reference || `${CONTRACT_TYPE_CONFIG[type as Contract['type']]?.shortLabel || 'CTR'}-${String(raw.id).padStart(3, '0')}`,
    type,
    status: raw.status,
    etape: raw.etape,
    partieA: raw.partieA || {
      id: raw.clientId || '',
      name: raw.clientName || '—',
      type: raw.clientType || '',
      phone: '',
      email: '',
      role: raw.clientType || '',
    },
    partieB: raw.partieB || {
      id: '',
      name: '',
      type: '',
      phone: '',
      email: '',
      role: 'Partie B',
    },
    agentPrincipal: raw.agentPrincipal || raw.agentName || '—',
    agentId: raw.agentId || '',
    propertyId: raw.propertyId || raw.property_id || '',
    propertyTitle: raw.propertyTitle || raw.property_title || raw.propertyName || 'Bien associé',
    propertyRef: raw.propertyRef || raw.property_ref || '',
    propertyAddress: raw.propertyAddress || raw.property_address || '',
    propertyTypeLabel: raw.propertyTypeLabel || raw.propertyType || '',
    dateCreation: raw.dateCreation || raw.createdAt || '',
    dateOffre: raw.dateOffre,
    dateReservation: raw.dateReservation,
    dateCompromis: raw.dateCompromis,
    dateActe: raw.dateActe,
    dateDebutBail: raw.dateDebutBail,
    dateFinBail: raw.dateFinBail,
    dateArrivee: raw.dateArrivee || raw.startDate,
    dateDepart: raw.dateDepart || raw.endDate,
    prixVente: raw.prixVente,
    montantNetVendeur: raw.montantNetVendeur,
    honorairesTTC: raw.honorairesTTC,
    sequestre: raw.sequestre,
    conditionPaiementHonoraires: raw.conditionPaiementHonoraires,
    loyerMensuelHC: raw.loyerMensuelHC,
    chargesMensuelles: raw.chargesMensuelles,
    depotGarantie: raw.depotGarantie,
    honorairesLocation: raw.honorairesLocation,
    prixTotalSejour: raw.prixTotalSejour || raw.amount || raw.montant,
    acompteVerse: raw.acompteVerse,
    soldeRestant: raw.soldeRestant,
    caution: raw.caution,
    devise: raw.devise || 'MAD',
    documents: raw.documents || [],
    history: raw.history || [],
    notes: raw.notes,
    createdAt: raw.createdAt || raw.dateCreation || '',
    updatedAt: raw.updatedAt || '',
  }
}

export default function ContractDetailPage({ basePath: basePathProp, showResponsible = false }: { basePath?: string; showResponsible?: boolean } = {}) {
  const { id, agentId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { toast } = useToast()
  const perms = useMyPermissions()
  const canWrite = permissionAllowed(perms, 'contrats-ecriture')
  const canExport = permissionAllowed(perms, 'contrats-general-export')
  const historyLocked = !!perms && perms['contrats-general-lock'] === true
  const actionParam = searchParams.get('action')

  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('resume')

  const [statusDialog, setStatusDialog] = useState(false)
  const [newStatus, setNewStatus] = useState<ContractStatus | ''>('')
  const [statusSaving, setStatusSaving] = useState(false)
  const [noteDialog, setNoteDialog] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [noteSaving, setNoteSaving] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [sendDialog, setSendDialog] = useState(false)
  const [sendSubject, setSendSubject] = useState('')
  const [sendMessage, setSendMessage] = useState('')
  const [sendSaving, setSendSaving] = useState(false)

  const [historyItems, setHistoryItems] = useState<ContractHistoryEntry[]>([])
  const [historyTotal, setHistoryTotal] = useState(0)
  const [historyPage, setHistoryPage] = useState(1)
  const [historyPages, setHistoryPages] = useState(0)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyAction, setHistoryAction] = useState('')
  const [historyFrom, setHistoryFrom] = useState('')
  const [historyTo, setHistoryTo] = useState('')

  const [docUploading, setDocUploading] = useState(false)
  const [docError, setDocError] = useState('')
  const [previewDoc, setPreviewDoc] = useState<ContractDocument | null>(null)
  const [docToDelete, setDocToDelete] = useState<ContractDocument | null>(null)
  const [docDeleting, setDocDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [users, setUsers] = useState<any[]>([])

  const basePath = basePathProp ?? (agentId ? `/${agentId}` : '')
  const contractsPath = `${basePath}/contracts`

  const currentUserName = currentUser
    ? [currentUser.first_name, currentUser.last_name].filter(Boolean).join(' ') || currentUser.email
    : ''

  const agentDisplayName = showResponsible
    ? contract?.agentPrincipal || '—'
    : currentUserName || contract?.agentPrincipal || '—'

  useEffect(() => {
    api.get<any>('/auth/me').then(setCurrentUser).catch(() => setCurrentUser(null))
  }, [])

  useEffect(() => {
    if (!showResponsible) return
    api.get<any[]>('/admin/users').then(setUsers).catch(() => {})
  }, [showResponsible])

  const responsibleUser = useMemo(() => {
    if (!showResponsible || !contract?.agentId) return undefined
    const u = users.find(x => String(x.id) === String(contract.agentId) && x.status !== 'supprimé')
    if (!u) return undefined
    const name = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || '—'
    const initials = `${(u.first_name || '')[0]}${(u.last_name || '')[0]}`.toUpperCase() || '?'
    const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-orange-500', 'bg-sky-500', 'bg-rose-500']
    const color = colors[Math.abs(Number(u.id) || name.length) % colors.length]
    return { ...u, name, initials, color }
  }, [showResponsible, contract?.agentId, users])

  const getRoleBadge = (user?: any) => {
    if (!user) return null
    if (user.role === 'agent') {
      return { label: user.position || 'Agent', cls: 'bg-emerald-100 text-emerald-700' }
    }
    if (user.role === 'gerant') {
      return { label: 'Gérant', cls: 'bg-orange-100 text-orange-700' }
    }
    if (user.role === 'admin') {
      return { label: 'Admin', cls: 'bg-indigo-100 text-indigo-700' }
    }
    return null
  }

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setNotFound(false)
    fetchContractById(id!)
      .then(res => { if (mounted) setContract(normalizeContract(res)) })
      .catch(() => {
        const mock = mockContracts.find(c => c.id === id)
        if (!mounted) return
        if (mock) setContract(normalizeContract(mock))
        else setNotFound(true)
      })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [id])

  // Auto-open the status/note dialog when arriving from an action menu shortcut.
  // The action is consumed once; the URL param is cleared only after the dialog closes.
  const consumedActionRef = useRef(false)
  useEffect(() => {
    if (!contract || !actionParam || consumedActionRef.current || !canWrite) return
    consumedActionRef.current = true
    if (actionParam === 'status') {
      setNewStatus(contract.status)
      setStatusDialog(true)
    } else if (actionParam === 'note') {
      setNoteText(contract.notes || '')
      setNoteDialog(true)
    }
  }, [contract, actionParam, canWrite])

  useEffect(() => {
    if (consumedActionRef.current && actionParam && !statusDialog && !noteDialog) {
      setSearchParams({}, { replace: true })
    }
  }, [consumedActionRef, actionParam, statusDialog, noteDialog, setSearchParams])

  const typeCfg = contract ? CONTRACT_TYPE_CONFIG[contract.type] : null
  const TypeIcon = typeCfg?.icon

  const loadHistory = useCallback(() => {
    if (!id) return
    setHistoryLoading(true)
    fetchContractHistory(
      id,
      {
        page: historyPage,
        action: historyAction || undefined,
        from: historyFrom || undefined,
        to: historyTo || undefined,
      },
    )
      .then(res => {
        setHistoryItems(res.items || [])
        setHistoryTotal(res.total || 0)
        setHistoryPages(res.pages || 0)
      })
      .catch(() => {
        setHistoryItems([])
        setHistoryTotal(0)
        setHistoryPages(0)
      })
      .finally(() => setHistoryLoading(false))
  }, [id, historyPage, historyAction, historyFrom, historyTo])

  useEffect(() => { if (id) loadHistory() }, [loadHistory])

  const money = useMemo(() => {
    const currency = contract?.devise || 'MAD'
    return (n?: number) =>
      n == null || Number.isNaN(n)
        ? '—'
        : new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
  }, [contract?.devise])

  const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'

  const formatRelativeDate = (d: string) => {
    const date = new Date(d)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return "Aujourd'hui"
    if (days === 1) return 'Hier'
    if (days < 30) return `Il y a ${days} jours`
    return date.toLocaleDateString('fr-FR')
  }

  const mainAmount = useMemo(() => {
    if (!contract) return { label: 'Montant', value: undefined as number | undefined, unit: '' }
    if (contract.type === 'vente') return { label: 'Prix de vente', value: contract.prixVente, unit: '' }
    if (contract.type === 'location_classique') return { label: 'Loyer mensuel', value: contract.loyerMensuelHC, unit: '/mois' }
    return { label: 'Total du séjour', value: contract.prixTotalSejour, unit: '' }
  }, [contract])

  const mainDate = useMemo(() => {
    if (!contract) return { label: 'Date', value: '' }
    if (contract.type === 'vente') {
      if (contract.etape === 'acte_authentique') return { label: 'Acte authentique', value: contract.dateActe || '' }
      if (contract.etape === 'compromis') return { label: 'Compromis', value: contract.dateCompromis || '' }
      if (contract.etape === 'reservation') return { label: 'Réservation', value: contract.dateReservation || '' }
      return { label: 'Offre', value: contract.dateOffre || '' }
    }
    if (contract.type === 'location_classique') return { label: 'Début du bail', value: contract.dateDebutBail || '' }
    return { label: 'Arrivée', value: contract.dateArrivee || '' }
  }, [contract])

  const propertyPath = contract?.propertyId ? `${basePath}/properties/${contract.propertyId}` : null
  const clientPath = (party: Contract['partieA']) =>
    party?.id ? `${basePath}/clients/type/${(party.type || 'client').toLowerCase()}/${party.id}` : null

  // ---- Actions ----

  const handleDownload = () => {
    if (!contract) return
    try {
      generateContratPdf(buildContractPdfData(contract, agentDisplayName))
    } catch {
      toast('error', 'Erreur lors de la génération du PDF du contrat')
    }
  }

  const handleSendToClient = () => {
    toast('info', 'L\'envoi du contrat au client sera disponible prochainement')
  }

  const handleShare = () => {
    if (!navigator.clipboard?.writeText) return toast('info', 'Impossible de copier le lien automatiquement')
    navigator.clipboard.writeText(window.location.href)
      .then(() => toast('success', 'Lien du contrat copié dans le presse-papiers'))
      .catch(() => toast('info', 'Impossible de copier le lien automatiquement'))
  }

  const handleSendToProprietaire = () => {
    if (!contract) return
    setSendSubject(`Contrat ${contract.reference} — CRM Immobilier`)
    setSendMessage(`Bonjour,\n\nVeuillez trouver ci-joint le contrat ${contract.reference} concernant ${contract.propertyTitle}.\n\nCordialement,\nCRM Immobilier`)
    setSendDialog(true)
  }

  const handleSendProprietaireConfirm = async () => {
    if (!contract || !sendSubject.trim()) return
    setSendSaving(true)
    try {
      const res = await sendContractToProprietaire(contract.id, {
        subject: sendSubject,
        message: sendMessage,
      })
      toast('success', res.message || 'Contrat envoyé au propriétaire')
      setSendDialog(false)
    } catch {
      toast('error', "Échec de l'envoi : aucune adresse e-mail valide pour le propriétaire")
    } finally {
      setSendSaving(false)
    }
  }

  const openStatusDialog = () => {
    if (!contract) return
    if (!canWrite) return toast('error', 'Vous n\'avez pas le droit de modifier le statut du contrat')
    setNewStatus(contract.status)
    setStatusDialog(true)
  }

  const handleStatusChange = async () => {
    if (!contract || !newStatus || newStatus === contract.status) { setStatusDialog(false); return }
    setStatusSaving(true)
    try {
      await updateContract(contract.id, { status: newStatus })
      setContract({ ...contract, status: newStatus, updatedAt: new Date().toISOString() })
      toast('success', `Statut mis à jour : ${CONTRACT_STATUS_LABELS[newStatus]}`)
      setStatusDialog(false)
      setHistoryPage(1)
      loadHistory()
    } catch {
      toast('error', 'Erreur lors de la mise à jour du statut')
    } finally {
      setStatusSaving(false)
    }
  }

  const openNoteDialog = () => {
    if (!contract) return
    if (!canWrite) return toast('error', 'Vous n\'avez pas le droit de modifier la note du contrat')
    setNoteText(contract.notes || '')
    setNoteDialog(true)
  }

  const handleSaveNote = async () => {
    if (!contract) return
    setNoteSaving(true)
    try {
      await updateContract(contract.id, { notes: noteText })
      setContract({ ...contract, notes: noteText, updatedAt: new Date().toISOString() })
      toast('success', 'Note enregistrée')
      setNoteDialog(false)
      setHistoryPage(1)
      loadHistory()
    } catch {
      toast('error', "Erreur lors de l'enregistrement de la note")
    } finally {
      setNoteSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!contract) return
    setDeleting(true)
    try {
      await deleteContract(contract.id)
      toast('success', 'Contrat supprimé')
      navigate(contractsPath)
    } catch {
      toast('error', 'Erreur lors de la suppression du contrat')
      setDeleting(false)
    }
  }

  // ---- Documents ----

  const pickFiles = () => fileInputRef.current?.click()

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length || !contract) return
    setDocError('')
    setDocUploading(true)
    try {
      const res = await uploadContractFiles(contract.id, files)
      const uploaded: ContractDocument[] = (res.files || []).map((f: any) => ({
        id: String(f.id),
        name: f.name || f.filename || 'Document',
        type: f.mimetype || 'application/octet-stream',
        date: new Date().toISOString(),
        url: f.url,
        category: 'contrat',
        size: f.size,
      }))
      const merged = [...(contract.documents || []), ...uploaded]
      setContract({ ...contract, documents: merged })
      await updateContractDocuments(contract.id, { documents: merged })
      toast('success', `${uploaded.length} document${uploaded.length > 1 ? 's' : ''} ajouté${uploaded.length > 1 ? 's' : ''}`)
    } catch {
      setDocError('L\'upload a échoué. Vérifiez le type et la taille des fichiers (max 20 Mo, images et documents).')
    } finally {
      setDocUploading(false)
    }
  }

  const handleDocDownload = async (d: ContractDocument) => {
    if (d?.url && !d.url.startsWith('#')) {
      try {
        await downloadMedia(d.url, d.name || 'document')
      } catch {
        toast('error', 'Échec du téléchargement du document')
      }
    } else {
      toast('info', 'Document non téléchargeable')
    }
  }

  const handleDocView = (d: ContractDocument) => {
    if (!d?.url || d.url.startsWith('#')) return toast('info', 'Document non disponible')
    setPreviewDoc(d)
  }

  const handleDocDelete = async () => {
    if (!contract || !docToDelete) return
    setDocDeleting(true)
    try {
      await deleteContractDocument(contract.id, docToDelete.id)
      const merged = (contract.documents || []).filter(x => x.id !== docToDelete.id)
      setContract({ ...contract, documents: merged })
      toast('success', 'Document supprimé')
      setDocToDelete(null)
    } catch {
      toast('error', 'Erreur lors de la suppression du document')
    } finally {
      setDocDeleting(false)
    }
  }

  // ---- Render helpers ----

  const renderKeyDates = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <InfoBox label="Création" value={fmtDate(contract?.dateCreation)} />
      {contract?.type === 'vente' && (
        <>
          <InfoBox label="Offre" value={fmtDate(contract?.dateOffre)} />
          <InfoBox label="Réservation" value={fmtDate(contract?.dateReservation)} />
          <InfoBox label="Compromis" value={fmtDate(contract?.dateCompromis)} />
          {contract?.dateActe && <InfoBox label="Acte authentique" value={fmtDate(contract?.dateActe)} />}
        </>
      )}
      {contract?.type === 'location_classique' && (
        <>
          <InfoBox label="Début du bail" value={fmtDate(contract?.dateDebutBail)} />
          <InfoBox label="Fin du bail" value={fmtDate(contract?.dateFinBail)} />
        </>
      )}
      {contract?.type === 'location_saisonniere' && (
        <>
          <InfoBox label="Arrivée" value={fmtDate(contract?.dateArrivee)} />
          <InfoBox label="Départ" value={fmtDate(contract?.dateDepart)} />
        </>
      )}
    </div>
  )

  const renderResume = () => {
    if (!contract || !typeCfg) return null
    return (
      <div className="space-y-7">
        <div>
          <SectionHeader icon={<FileText size={14} />} title="Informations" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <InfoField label="Référence" value={<span className="font-mono text-[13px]">{contract.reference}</span>} icon={<Copy size={11} />} />
            <InfoField label="Type" value={CONTRACT_TYPE_LABELS[contract.type]} icon={<TypeIcon size={11} />} highlight />
            <InfoField label="Statut" value={STATUS_META[contract.status].label} icon={<Shield size={11} />} />
            <InfoField label="Agent responsable" value={agentDisplayName} icon={<User size={11} />} />
            <InfoField label="Créé le" value={fmtDate(contract.createdAt || contract.dateCreation)} icon={<Calendar size={11} />} />
            <InfoField label="Dernière mise à jour" value={fmtDate(contract.updatedAt)} icon={<Clock size={11} />} />
          </div>
        </div>

        <div>
          <SectionHeader icon={<Calendar size={14} />} title="Dates clés" />
          {renderKeyDates()}
        </div>

        <div>
          <SectionHeader icon={<Users size={14} />} title="Parties" />
          <div className="grid grid-cols-1 gap-4">
            <PartyCard
              label={contract.partieA.role}
              name={contract.partieA.name}
              type={contract.partieA.type}
              phone={contract.partieA.phone}
              email={contract.partieA.email}
              onClickLink={() => { const p = clientPath(contract.partieA); if (p) navigate(p) }}
            />
            <PartyCard
              label={contract.partieB.role}
              name={contract.partieB.name}
              type={contract.partieB.type}
              phone={contract.partieB.phone}
              email={contract.partieB.email}
              placeholder={!contract.partieB.name}
              onClickLink={() => { const p = clientPath(contract.partieB); if (p) navigate(p) }}
            />
          </div>
        </div>

        <div>
          <SectionHeader icon={<Home size={14} />} title="Bien concerné" />
          <div className="p-4 rounded-xl bg-background border border-border/50 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center flex-shrink-0">
              <Home size={16} className="text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-text">{contract.propertyTitle}</p>
              <div className="flex items-center gap-1.5 text-xs text-text-secondary mt-0.5">
                <MapPin size={11} />
                <span>{contract.propertyAddress || '—'}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                {contract.propertyTypeLabel && <Badge variant="outline">{contract.propertyTypeLabel}</Badge>}
                {contract.propertyRef && <span className="text-[11px] text-text-secondary/60 font-mono">{contract.propertyRef}</span>}
              </div>
            </div>
            {propertyPath && (
              <Button variant="ghost" size="sm" icon={<ArrowRight size={13} />} iconPosition="right" onClick={() => navigate(propertyPath)}>
                Voir le bien
              </Button>
            )}
          </div>
        </div>

        <div>
          <SectionHeader icon={<Link2 size={14} />} title="Liens vers les autres modules" />
          <div className="flex flex-wrap gap-2">
            <ModuleLink icon={<FileText size={13} />} label="Registre des mandats" onClick={() => navigate(`${basePath}/register`)} />
            {propertyPath && <ModuleLink icon={<Home size={13} />} label="Fiche bien" onClick={() => navigate(propertyPath)} />}
            {clientPath(contract.partieA) && <ModuleLink icon={<User size={13} />} label="Fiche partie A" onClick={() => clientPath(contract.partieA) && navigate(clientPath(contract.partieA)!)} />}
            {clientPath(contract.partieB) && <ModuleLink icon={<User size={13} />} label="Fiche partie B" onClick={() => clientPath(contract.partieB) && navigate(clientPath(contract.partieB)!)} />}
          </div>
        </div>
      </div>
    )
  }

  const renderParties = () => {
    if (!contract) return null
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <PartyDetailCard
            title={contract.partieA.role}
            subtitle="Partie A"
            party={contract.partieA}
            onClickLink={() => { const p = clientPath(contract.partieA); if (p) navigate(p) }}
          />
          <PartyDetailCard
            title={contract.partieB.role}
            subtitle="Partie B"
            party={contract.partieB}
            placeholder={!contract.partieB.name}
            onClickLink={() => { const p = clientPath(contract.partieB); if (p) navigate(p) }}
          />
        </div>
        <div className="p-4 rounded-xl bg-background border border-border/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center flex-shrink-0">
              <User size={16} className="text-accent" />
            </div>
            <div>
              <p className="text-xs text-text-secondary">Agent principal</p>
              <p className="font-medium text-text">{agentDisplayName}</p>
            </div>
          </div>
          <Badge variant="outline">Mandat exclusif</Badge>
        </div>
      </div>
    )
  }

  const renderFinancier = () => {
    if (!contract) return null
    return (
      <div className="space-y-6">
        {contract.type === 'vente' && (
          <>
            <SectionHeader icon={<DollarSign size={14} />} title="Détails financiers — Vente" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <InfoField label="Prix de vente" value={money(contract.prixVente)} icon={<DollarSign size={11} />} highlight />
              <InfoField label="Montant net vendeur" value={money(contract.montantNetVendeur)} icon={<DollarSign size={11} />} />
              <InfoField
                label="Honoraires TTC"
                value={money(contract.honorairesTTC)}
                icon={<DollarSign size={11} />}
                helperText={contract.prixVente && contract.honorairesTTC ? `${((contract.honorairesTTC / contract.prixVente) * 100).toFixed(2)}% du prix de vente` : undefined}
              />
              {contract.sequestre != null && <InfoField label="Séquestre" value={money(contract.sequestre)} icon={<Shield size={11} />} />}
              {contract.conditionPaiementHonoraires && (
                <InfoField label="Paiement des honoraires" value={contract.conditionPaiementHonoraires} icon={<Clock size={11} />} />
              )}
            </div>
          </>
        )}
        {contract.type === 'location_classique' && (
          <>
            <SectionHeader icon={<DollarSign size={14} />} title="Détails financiers — Location classique" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <InfoField label="Loyer mensuel HC" value={money(contract.loyerMensuelHC)} icon={<DollarSign size={11} />} highlight />
              <InfoField label="Charges mensuelles" value={money(contract.chargesMensuelles)} icon={<DollarSign size={11} />} />
              <InfoField
                label="Loyer total CC"
                value={money(contract.loyerMensuelHC != null && contract.chargesMensuelles != null ? contract.loyerMensuelHC + contract.chargesMensuelles : undefined)}
                icon={<DollarSign size={11} />}
              />
              <InfoField
                label="Dépôt de garantie"
                value={money(contract.depotGarantie)}
                icon={<Shield size={11} />}
                helperText={contract.depotGarantie != null && contract.loyerMensuelHC ? `${(contract.depotGarantie / contract.loyerMensuelHC).toFixed(1)} mois de loyer` : undefined}
              />
              <InfoField label="Honoraires de location" value={money(contract.honorairesLocation)} icon={<DollarSign size={11} />} />
            </div>
          </>
        )}
        {contract.type === 'location_saisonniere' && (
          <>
            <SectionHeader icon={<DollarSign size={14} />} title="Détails financiers — Location saisonnière" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <InfoField label="Prix total du séjour" value={money(contract.prixTotalSejour)} icon={<DollarSign size={11} />} highlight />
              <InfoField
                label="Tarif / nuit"
                value={money(contract.prixTotalSejour && contract.dateArrivee && contract.dateDepart ? contract.prixTotalSejour / Math.max(1, Math.floor((new Date(contract.dateDepart).getTime() - new Date(contract.dateArrivee).getTime()) / (1000 * 60 * 60 * 24))) : undefined)}
                icon={<DollarSign size={11} />}
              />
              <InfoField
                label="Acompte versé"
                value={money(contract.acompteVerse)}
                icon={<DollarSign size={11} />}
                helperText={contract.acompteVerse != null && contract.prixTotalSejour ? `${((contract.acompteVerse / contract.prixTotalSejour) * 100).toFixed(0)}% du total` : undefined}
              />
              <InfoField label="Solde restant" value={money(contract.soldeRestant)} icon={<DollarSign size={11} />} />
              <InfoField label="Caution" value={money(contract.caution)} icon={<Shield size={11} />} />
            </div>
          </>
        )}
        {contract.notes && (
          <div>
            <SectionHeader icon={<MessageSquare size={14} />} title="Notes" />
            <p className="text-sm text-text/80 p-3 rounded-xl bg-background border border-border/50">{contract.notes}</p>
          </div>
        )}
      </div>
    )
  }

  const renderDocuments = () => (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" icon={<Upload size={14} />} loading={docUploading} onClick={pickFiles}>
          {docUploading ? 'Upload en cours...' : 'Ajouter un document'}
        </Button>
      </div>
      {docError && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {docError}
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        className="hidden"
        onChange={handleFilesSelected}
      />
      {contract && (
        <DocumentCategorySection
          title="Documents du contrat"
          description="Pièces justificatives et contrats signés"
          icon={<Shield size={16} />}
          documents={contract.documents.map(d => ({ ...d, category: d.category || 'contrat' }))}
          onAdd={pickFiles}
          onDownload={handleDocDownload}
          onDelete={(d: any) => setDocToDelete(d as ContractDocument)}
          onView={handleDocView}
          emptyMessage="Aucun document lié à ce contrat"
          defaultOpen={true}
        />
      )}
    </div>
  )

  const HISTORY_ACTIONS = ['Contrat créé', 'Changement de statut', 'Modification de la note']

  const renderHistorique = () => (
    <div className="space-y-4">
      {historyLocked && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-background border border-border/50 text-sm">
          <Lock size={14} className="text-error" />
          <span className="text-xs text-text-secondary">L'historique du contrat est verrouillé par l'administrateur.</span>
        </div>
      )}
      <div className="relative">
        <div className={`space-y-4 ${historyLocked ? 'blur-sm select-none pointer-events-none' : ''}`}>
      {/* Filters */}
      <div className="p-3 rounded-xl bg-background border border-border/50 flex flex-wrap items-end gap-3">
        <div className="w-48">
          <label className="text-[11px] font-medium text-text-secondary mb-1 block">Action</label>
          <Select
            value={historyAction}
            onValueChange={(val) => { setHistoryAction(val); setHistoryPage(1) }}
            options={[{ value: '', label: 'Toutes les actions' }, ...HISTORY_ACTIONS.map(a => ({ value: a, label: a }))]}
          />
        </div>
        <div className="w-44">
          <label className="text-[11px] font-medium text-text-secondary mb-1 block">Du</label>
          <DatePicker value={historyFrom} placeholder="Date de début" onChange={e => { setHistoryFrom(e.target.value); setHistoryPage(1) }} />
        </div>
        <div className="w-44">
          <label className="text-[11px] font-medium text-text-secondary mb-1 block">Au</label>
          <DatePicker value={historyTo} placeholder="Date de fin" onChange={e => { setHistoryTo(e.target.value); setHistoryPage(1) }} />
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={<Filter size={13} />}
          onClick={() => { setHistoryAction(''); setHistoryFrom(''); setHistoryTo(''); setHistoryPage(1) }}
        >
          Réinitialiser
        </Button>
        <div className="ml-auto text-xs text-text-secondary">
          {historyTotal} entrée{historyTotal > 1 ? 's' : ''}
        </div>
      </div>

      {/* List */}
      {historyLoading ? (
        <div className="flex items-center justify-center py-16 text-text-secondary">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent/20 border-t-accent" />
        </div>
      ) : historyItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
          <Clock size={32} className="mb-3 opacity-40" />
          <p className="text-sm">Aucun historique pour ces critères</p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-0">
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
          {historyItems.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.2 }}
              className="relative pb-5 last:pb-0"
            >
              <div className="absolute -left-[21px] top-1 w-[10px] h-[10px] rounded-full border-2 border-accent bg-card" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-text">{entry.action}</p>
                  {entry.details && <p className="text-xs text-text-secondary mt-0.5">{entry.details}</p>}
                  <p className="text-[11px] text-text-secondary/60 mt-1">par {entry.agent}</p>
                </div>
                <span className="text-[11px] text-text-secondary/60 whitespace-nowrap">{formatRelativeDate(entry.date)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {historyPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-text-secondary">
            Page {historyPage} sur {historyPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<ChevronLeft size={14} />}
              disabled={historyPage <= 1}
              onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<ChevronRight size={14} />}
              iconPosition="right"
              disabled={historyPage >= historyPages}
              onClick={() => setHistoryPage(p => Math.min(historyPages, p + 1))}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
        </div>
        {historyLocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 text-text-secondary">
            <Lock size={28} className="mb-2 opacity-50" />
            <p className="text-sm font-medium">Historique verrouillé</p>
            <p className="text-xs text-text-secondary/60 mt-1">Contenu masqué par l'administrateur</p>
          </div>
        )}
      </div>
    </div>
  )

  const renderNotes = () => (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" icon={<MessageSquare size={14} />} disabled={!canWrite} onClick={openNoteDialog}>
          {contract?.notes ? 'Modifier la note' : 'Ajouter une note'}
        </Button>
      </div>
      {contract?.notes ? (
        <div className="p-4 rounded-xl bg-background border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare size={14} className="text-accent" />
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Note interne</span>
          </div>
          <p className="text-sm text-text/90 leading-relaxed whitespace-pre-wrap">{contract.notes}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
          <MessageSquare size={32} className="mb-3 opacity-40" />
          <p className="text-sm">Aucune note pour ce contrat</p>
          <p className="text-xs text-text-secondary/60 mt-1">Ajoutez une note interne pour votre suivi</p>
        </div>
      )}
    </div>
  )

  // ---- Page states ----

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <BackLink to={contractsPath} />
        <div className="flex flex-col items-center justify-center py-24 text-text-secondary">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-accent/20 border-t-accent mb-4" />
          <p className="text-sm">Chargement du contrat...</p>
        </div>
      </div>
    )
  }

  if (notFound || !contract || !typeCfg) {
    return (
      <div className="space-y-6 animate-fade-in">
        <BackLink to={contractsPath} />
        <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
          <FileText size={48} className="mb-4 opacity-30" />
          <p className="text-lg font-medium">Contrat non trouvé</p>
          <p className="text-sm text-text-secondary/60 mt-1">Ce contrat n'existe pas ou a été supprimé</p>
          <Button variant="outline" className="mt-6" onClick={() => navigate(contractsPath)}>
            Retour aux contrats
          </Button>
        </div>
      </div>
    )
  }

  const tabs: TabItem[] = [
    { id: 'resume', label: 'Résumé', icon: <Layout size={15} /> },
    { id: 'parties', label: 'Parties', icon: <Users size={15} /> },
    { id: 'financier', label: 'Financier', icon: <DollarSign size={15} /> },
    { id: 'documents', label: 'Documents', icon: <FileText size={15} /> },
    { id: 'historique', label: 'Historique', icon: <Clock size={15} /> },
    { id: 'notes', label: 'Notes', icon: <MessageSquare size={15} /> },
  ]

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <BackLink to={contractsPath} />
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <Clock size={12} />
          Mis à jour le {fmtDate(contract.updatedAt)}
        </div>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-card">
        <div className={`absolute inset-0 bg-gradient-to-br ${typeCfg.gradient} via-transparent to-transparent pointer-events-none`} />
        <div className="relative p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl ${typeCfg.accentBg} flex items-center justify-center shrink-0`}>
                <TypeIcon size={22} className={typeCfg.accent} />
              </div>
              <div>
                <p className={`text-[11px] font-mono tracking-wider ${typeCfg.accent}`}>CONTRAT {contract.reference}</p>
                <h1 className="text-xl md:text-2xl font-bold mt-1">{typeCfg.label}</h1>
                <div className="flex items-center gap-2 mt-2 text-sm text-text-secondary flex-wrap">
                  <span className="flex items-center gap-1.5"><User size={13} />{contract.partieA.name}</span>
                  {contract.partieB.name && (
                    <>
                      <span className="text-text-secondary/40">→</span>
                      <span className="flex items-center gap-1.5"><User size={13} />{contract.partieB.name}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={STATUS_META[contract.status].badge} size="md">
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_META[contract.status].dot} mr-1.5`} />
                {STATUS_META[contract.status].label}
              </Badge>
              {contract.type === 'vente' && contract.etape && (
                <Badge className={VENTE_ETAPE_COLORS[contract.etape]} size="md">
                  {VENTE_ETAPE_LABELS[contract.etape]}
                </Badge>
              )}
            </div>
          </div>

          {/* Summary strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
            <StatCard icon={<TypeIcon size={16} />} label="Type" value={CONTRACT_TYPE_LABELS[contract.type]} accent={typeCfg.accent} accentBg={typeCfg.accentBg} />
            <StatCard icon={<Shield size={16} />} label="Statut" value={STATUS_META[contract.status].label} dot={STATUS_META[contract.status].dot} />
            <StatCard icon={<DollarSign size={16} />} label={mainAmount.label} value={money(mainAmount.value)} unit={mainAmount.unit} accent="text-accent" accentBg="bg-accent-light" />
            <StatCard icon={<Calendar size={16} />} label={mainDate.label} value={fmtDate(mainDate.value || undefined)} accent="text-text-secondary" accentBg="bg-background" />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-card rounded-xl border border-border/50 shadow-card p-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary mr-2 flex items-center gap-1.5 px-2">
          <Zap size={13} /> Actions
        </span>
        <div className="w-px h-6 bg-border/50 mr-1" />
        <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={handleDownload}>Télécharger le contrat (PDF)</Button>
        <Button variant="outline" size="sm" icon={<Send size={14} />} onClick={handleSendToClient}>Envoyer au client</Button>
        <Button variant="outline" size="sm" icon={<Send size={14} />} onClick={handleSendToProprietaire}>Envoyer au propriétaire</Button>
        {canExport && <Button variant="outline" size="sm" icon={<Share2 size={14} />} onClick={handleShare}>Partager</Button>}
        <Button variant="outline" size="sm" icon={<RefreshCw size={14} />} disabled={!canWrite} onClick={openStatusDialog}>Changer le statut</Button>
        <Button variant="outline" size="sm" icon={<MessageSquare size={14} />} disabled={!canWrite} onClick={openNoteDialog}>{contract?.notes ? 'Modifier la note' : 'Ajouter une note'}</Button>
        <div className="w-px h-6 bg-border/50 mx-1" />
        <Button variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={() => setDeleteDialog(true)}>Supprimer le contrat</Button>
      </div>

      {/* Responsible agent (admin / gérant) */}
      {showResponsible && (
        <div className="bg-card rounded-xl border border-border/50 shadow-card p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${responsibleUser?.color || 'bg-indigo-500'} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
              {responsibleUser?.initials || 'NA'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-secondary">En charge du contrat</p>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-text">{responsibleUser?.name || contract.agentPrincipal || 'Non assigné'}</p>
                {(() => {
                  const badge = getRoleBadge(responsibleUser)
                  return badge ? (
                    <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold rounded-full uppercase tracking-wider ${badge.cls}`}>
                      {badge.label}
                    </span>
                  ) : null
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin border-b border-border/40">
          <div className="flex px-1 min-w-max">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-accent border-accent'
                    : 'text-text-secondary border-transparent hover:text-text hover:border-border'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'resume' && renderResume()}
              {activeTab === 'parties' && renderParties()}
              {activeTab === 'financier' && renderFinancier()}
              {activeTab === 'documents' && renderDocuments()}
              {activeTab === 'historique' && renderHistorique()}
              {activeTab === 'notes' && renderNotes()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Status dialog */}
      <Dialog isOpen={statusDialog} onClose={() => setStatusDialog(false)} title="Changer le statut du contrat">
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-background border border-border/50 text-sm">
            <span className="text-text-secondary">Statut actuel :</span>
            <Badge className={STATUS_META[contract.status].badge}>
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_META[contract.status].dot} mr-1.5`} />
              {STATUS_META[contract.status].label}
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {STATUS_ORDER.map(s => {
              const meta = STATUS_META[s]
              const selected = newStatus === s
              const current = contract.status === s
              return (
                <button
                  key={s}
                  onClick={() => setNewStatus(s)}
                  disabled={!canWrite}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selected
                      ? 'border-accent bg-accent/5 ring-1 ring-accent/20'
                      : 'border-border/60 bg-card hover:border-accent/40'
                  } ${current ? 'opacity-70' : ''} ${!canWrite ? 'opacity-50 pointer-events-none cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-medium text-text">
                      <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </span>
                    {selected && <CheckCircle size={16} className="text-accent" />}
                  </div>
                  <p className="text-[11px] text-text-secondary/70 mt-1.5 leading-relaxed">
                    {STATUS_DESCRIPTIONS[s]}
                  </p>
                </button>
              )
            })}
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setStatusDialog(false)}>Annuler</Button>
            <Button variant="primary" size="sm" loading={statusSaving} disabled={!canWrite || !newStatus || newStatus === contract.status} onClick={handleStatusChange}>
              Enregistrer
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Note dialog */}
      <Dialog isOpen={noteDialog} onClose={() => setNoteDialog(false)} title={contract.notes ? 'Modifier la note' : 'Ajouter une note'} size="md">
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-background border border-border/50 text-sm">
            <MessageSquare size={14} className="text-accent" />
            <p className="text-xs text-text-secondary">La note sera ajoutée à l'historique du contrat et visible dans l'onglet Notes.</p>
          </div>
          <Textarea
            label="Note interne"
            placeholder="Ex : en attente de la signature du compromis..."
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            rows={6}
            maxLength={2000}
            disabled={!canWrite}
          />
          <div className="flex items-center justify-between gap-2">
            <span className={`text-[11px] ${noteText.length > 1900 ? 'text-error' : 'text-text-secondary/60'}`}>
              {noteText.length} / 2000 caractères
            </span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setNoteDialog(false)}>Annuler</Button>
              <Button variant="primary" size="sm" loading={noteSaving} disabled={!canWrite || noteText === (contract.notes || '')} onClick={handleSaveNote}>
                Enregistrer la note
              </Button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Send to propriétaire dialog */}
      <Dialog isOpen={sendDialog} onClose={() => setSendDialog(false)} title="Envoyer le contrat au propriétaire" size="md">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-background border border-border/50">
            <div className="w-9 h-9 rounded-xl bg-accent-light flex items-center justify-center flex-shrink-0">
              <User size={15} className="text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-text">{contract.partieB.name || 'Propriétaire'}</p>
              <p className="text-xs text-text-secondary flex items-center gap-1.5 mt-0.5">
                <Mail size={11} />
                {contract.partieB.email || 'Aucun e-mail renseigné'}
              </p>
            </div>
          </div>
          <Input
            label="Objet"
            value={sendSubject}
            onChange={e => setSendSubject(e.target.value)}
            placeholder="Objet de l'e-mail"
          />
          <Textarea
            label="Message"
            value={sendMessage}
            onChange={e => setSendMessage(e.target.value)}
            rows={6}
            placeholder="Message accompagnant le contrat..."
          />
          <p className="text-[11px] text-text-secondary/70">
            Le contrat <span className="font-mono text-text-secondary">{contract.reference}</span> sera joint à l'e-mail sous forme de PDF généré automatiquement.
          </p>
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSendDialog(false)}>Annuler</Button>
            <Button
              variant="primary"
              size="sm"
              loading={sendSaving}
              icon={<Send size={14} />}
              disabled={!sendSubject.trim() || !contract.partieB.email}
              onClick={handleSendProprietaireConfirm}
            >
              Envoyer
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Document preview */}
      <Dialog isOpen={!!previewDoc} onClose={() => setPreviewDoc(null)} title={previewDoc?.name || 'Aperçu'} size="3xl">
        <div className="space-y-4">
          <div className="rounded-xl border border-border/50 bg-background overflow-hidden flex items-center justify-center p-2 min-h-[40vh]">
            {previewDoc?.url && isImageDoc(previewDoc) ? (
              <img
                src={resolveMediaUrl(previewDoc.url)}
                alt={previewDoc.name}
                className="max-h-[60vh] max-w-full object-contain rounded-lg"
              />
            ) : previewDoc?.url ? (
              <iframe
                src={resolveMediaUrl(previewDoc.url)}
                title={previewDoc.name}
                className="w-full h-[60vh] rounded-lg bg-white border border-border/40"
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
                <FileText size={32} className="mb-3 opacity-40" />
                <p className="text-sm">Aperçu non disponible pour ce type de fichier</p>
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" icon={<ExternalLink size={13} />} onClick={() => { const u = previewDoc && resolveMediaUrl(previewDoc.url); if (u) window.open(u, '_blank') }}>
              Ouvrir dans un onglet
            </Button>
            <Button variant="outline" size="sm" icon={<Download size={13} />} onClick={() => previewDoc && handleDocDownload(previewDoc)}>
              Télécharger
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Document delete confirmation */}
      <ConfirmDialog
        isOpen={!!docToDelete}
        onClose={() => setDocToDelete(null)}
        onConfirm={handleDocDelete}
        title="Supprimer le document"
        message={`Le document « ${docToDelete?.name || ''} » sera définitivement supprimé de ce contrat.`}
        confirmLabel={docDeleting ? 'Suppression...' : 'Supprimer'}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Supprimer le contrat"
        message={`Cette action est irréversible. Le contrat ${contract.reference} et ses documents seront supprimés. Pour une location saisonnière, la réservation liée sera annulée (les jours redeviennent disponibles), le voyageur sera remis en « En recherche / Brouillon » et le registre lié sera supprimé.`}
        confirmLabel={deleting ? 'Suppression...' : 'Supprimer'}
      />
    </div>
  )
}

// ---- Sub-components ----

const SectionHeader = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
  <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
    <span className="text-accent">{icon}</span>
    {title}
  </h3>
)

const StatCard = ({ icon, label, value, unit, accent = 'text-accent', accentBg = 'bg-accent-light', dot }: {
  icon: React.ReactNode; label: string; value: string; unit?: string; accent?: string; accentBg?: string; dot?: string
}) => (
  <div className="p-3 rounded-xl bg-background border border-border/50 flex items-center gap-3">
    <div className={`w-9 h-9 rounded-lg ${accentBg} flex items-center justify-center shrink-0`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] text-text-secondary/70 uppercase tracking-wider truncate">{label}</p>
      <p className="text-sm font-bold text-text truncate flex items-center gap-1.5">
        {dot && <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />}
        {value}
        {unit && <span className="text-[10px] text-text-secondary/60 font-normal">{unit}</span>}
      </p>
    </div>
  </div>
)

const InfoBox = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className="p-3 rounded-xl bg-background border border-border/50">
    <p className="text-[11px] text-text-secondary/60 mb-0.5">{label}</p>
    <p className={`text-sm font-medium ${highlight ? 'text-accent' : 'text-text'}`}>{value}</p>
  </div>
)

const PartyCard = ({ label, name, type, phone, email, placeholder = false, onClickLink }: {
  label: string; name: string; type: string; phone: string; email: string; placeholder?: boolean; onClickLink?: () => void
}) => (
  <div className={`p-4 rounded-xl flex items-center gap-3 ${placeholder ? 'bg-background/50 border border-dashed border-border' : 'bg-background border border-border/50'}`}>
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${placeholder ? 'bg-background' : 'bg-accent-light'}`}>
      <User size={16} className={placeholder ? 'text-text-secondary/40' : 'text-accent'} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <p className={`font-medium ${placeholder ? 'text-text-secondary/70' : 'text-text'}`}>{name || 'Non renseignée'}</p>
        {type && (
          <span className={`inline-block px-1.5 py-0.5 text-[10px] font-medium rounded border ${partyRoleColor(type)}`}>
            {type}
          </span>
        )}
      </div>
      <p className="text-xs text-text-secondary/60">{label}</p>
      {!placeholder && (
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-text-secondary flex items-center gap-1">
            <Phone size={10} /> {phone || '—'}
          </span>
          <span className="text-xs text-text-secondary flex items-center gap-1">
            <Mail size={10} /> {email || '—'}
          </span>
        </div>
      )}
    </div>
    {onClickLink && !placeholder && (
      <button onClick={onClickLink} className="text-xs text-accent hover:text-accent/80 flex items-center gap-1 shrink-0">
        Fiche <ArrowRight size={12} />
      </button>
    )}
  </div>
)

const PartyDetailCard = ({ title, subtitle, party, placeholder = false, onClickLink }: {
  title: string; subtitle: string; party: Contract['partieA']; placeholder?: boolean; onClickLink?: () => void
}) => (
  <Card className={`p-5 ${placeholder ? 'opacity-80' : ''}`}>
    <div className="flex items-center justify-between mb-4">
      <div>
        <p className="text-sm font-medium text-text">{title}</p>
        <p className="text-xs text-text-secondary">{subtitle}</p>
      </div>
      {!placeholder && (
        <span className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded-lg border ${partyRoleColor(party.type)}`}>
          {party.type || '—'}
        </span>
      )}
    </div>
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
        <div className="w-9 h-9 rounded-full bg-accent-light flex items-center justify-center flex-shrink-0">
          <span className="text-accent font-bold text-xs">{(party.name || '?').split(' ').map(n => n[0]).slice(0, 2).join('')}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-text">{party.name || 'Non renseignée'}</p>
          <p className="text-xs text-text-secondary/60">{party.role}</p>
        </div>
      </div>
      {!placeholder && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 text-text-secondary">
              <Phone size={12} />
              <span>{party.phone || '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-text-secondary">
              <Mail size={12} />
              <span className="truncate">{party.email || '—'}</span>
            </div>
          </div>
          {onClickLink && (
            <button onClick={onClickLink} className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent/80">
              Voir la fiche client <ArrowRight size={12} />
            </button>
          )}
        </>
      )}
    </div>
  </Card>
)

const ModuleLink = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-background border border-border/50 text-xs font-medium text-text hover:border-accent/40 hover:text-accent transition-all"
  >
    {icon}
    {label}
  </button>
)
