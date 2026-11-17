import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, User, Users, Home, DollarSign, Calendar, Clock, Download,
  Trash2, Phone, Mail, MapPin, Shield, Send, RefreshCw, MessageSquare,
  Zap, Link2, Copy, ArrowRight, Upload, ExternalLink, ArrowLeft,
  ChevronLeft, ChevronRight, Filter, CheckCircle, Share2, Lock, Loader,
  Eye, AlertTriangle, Printer,
} from 'react-feather'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { Input } from '../../components/ui/Input'
import { DatePicker } from '../../components/ui/DatePicker'
import { Textarea } from '../../components/ui/Textarea'
import { useToast } from '../../components/ui/Toast'
import StageModal, { useStageModalButtons } from '../../components/modules/calendar/StageModal'
import { cn } from '../../lib/utils'
import { useStageTheme, Stage, SLATE_HUE, OrbIcon } from '../../components/dashboard/Stage'
import { StageField, StageSection, StageEmpty, stagePillStyle } from '../../components/modules/prospects/ProspectDetailStage'
import { RED_HUE } from '../../components/modules/prospects/ProspectCard'
import {
  useContractAccent, contractPrimaryStyle, statusHue, partyRoleMeta,
  StagePill, ContractHeader, ContractTabsShell,
} from '../../components/modules/contracts/ContractDetailStage'
import { getDocTypeLabel } from '../../types/document'
import {
  mockContracts,
  normalizeContract,
  CONTRACT_TYPE_LABELS,
  CONTRACT_TYPE_CONFIG,
  CONTRACT_STATUS_LABELS,
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
import { generateContratHtml, buildContractPdfData } from '../../utils/generateContratPdf'
import { exportHtmlToPdfFromFrame } from '../../utils/htmlToPdf'
import { resolveMediaUrl, downloadMedia } from '../../utils/mediaUrl'
import { useMyPermissions, permissionAllowed } from '../../hooks/useMyPermissions'

interface TabItem {
  id: string
  slug: string
  label: string
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

/* Byte count (uploads send a number) or already-formatted label. */
const fmtDocSize = (s?: string | number): string | null => {
  if (s == null || s === '') return null
  const n = typeof s === 'string' ? Number(s) : s
  if (Number.isFinite(n) && n > 0) {
    return n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} Ko` : `${(n / (1024 * 1024)).toFixed(n / (1024 * 1024) < 10 ? 1 : 0).replace('.', ',')} Mo`
  }
  return String(s)
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
  const theme = useStageTheme()
  const isDark = theme === 'dark'
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

  const [pdfViewerOpen, setPdfViewerOpen] = useState(false)
  const [pdfBuilding, setPdfBuilding] = useState(false)
  const [pdfSaving, setPdfSaving] = useState(false)
  const [pdfDocHtml, setPdfDocHtml] = useState('')
  const pdfFrameRef = useRef<HTMLIFrameElement>(null)

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

  const { accent, ink } = useContractAccent(contract?.type)
  const primaryBtnStyle = contractPrimaryStyle(accent, isDark)

  /* Staged modal chrome — premium StageModal skin + shared notices. */
  const stageBtns = useStageModalButtons()
  const modalSectionTitle = 'mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em]'
  const modalNotice = `flex items-start gap-2 rounded-xl border px-3 py-2.5 text-[11px] font-medium ${
    isDark ? 'border-amber-400/25 bg-amber-400/10 text-amber-200' : 'border-amber-200/80 bg-amber-50/80 text-amber-800'
  }`
  const modalDangerNotice = `flex items-start gap-2 rounded-xl border px-3 py-2.5 text-[11px] font-medium ${
    isDark ? 'border-rose-400/25 bg-rose-500/10 text-rose-200' : 'border-rose-200/80 bg-rose-50/80 text-rose-700'
  }`
  const modalDangerPanel = `flex items-start gap-3 rounded-2xl border p-4 ${
    isDark ? 'border-rose-500/20 bg-rose-500/[0.07]' : 'border-rose-200/80 bg-rose-50/80'
  }`
  /* Destructive pill: same shape as the stage primary, rose identity. */
  const stageDangerPrimary = `inline-flex h-9 items-center gap-1.5 rounded-xl border px-4 text-sm font-semibold text-white transition-all duration-200 active:scale-[0.97] hover:brightness-110 ${
    isDark
      ? 'border-rose-400/40 bg-gradient-to-r from-rose-500 to-red-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.30),0_10px_26px_-8px_rgba(225,29,72,0.55)]'
      : 'border-white/25 bg-gradient-to-r from-rose-500 to-rose-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.40),0_10px_26px_-10px_rgba(244,63,94,0.55)]'
  }`

  /* Glass chrome shared by all staged blocks on the page. */
  const glassPanel = `border backdrop-blur-sm ${
    isDark
      ? 'border-white/[0.07] bg-white/[0.04]'
      : 'border-slate-200/70 bg-white/75 shadow-[0_1px_2px_rgba(15,23,42,0.05)]'
  }`
  const glassBtn = `inline-flex items-center gap-2 rounded-xl border px-3.5 h-9 text-xs font-bold transition-all active:scale-[0.97] ${
    isDark
      ? 'border-white/10 bg-white/[0.05] text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white'
      : 'border-slate-200/80 bg-white/70 text-slate-600 shadow-sm hover:bg-white hover:text-slate-900'
  }`
  const dangerBtn = `inline-flex items-center gap-2 rounded-xl border px-3.5 h-9 text-xs font-bold transition-all active:scale-[0.97] ${
    isDark
      ? 'border-rose-400/30 bg-rose-500/10 text-rose-300 hover:border-rose-400/50 hover:bg-rose-500/20'
      : 'border-rose-200/80 bg-rose-50/80 text-rose-500 shadow-sm hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600'
  }`
  const moduleBtn = `inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all active:scale-[0.97] ${
    isDark
      ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/25 hover:bg-white/10 hover:text-white'
      : 'border-slate-200/80 bg-white/70 text-slate-600 shadow-sm hover:bg-white hover:text-slate-900'
  }`

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
      return { label: user.position || 'Agent', hue: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' }
    }
    if (user.role === 'gerant') {
      return { label: 'Gérant', hue: 'bg-orange-500/15 text-orange-500 border-orange-500/30' }
    }
    if (user.role === 'admin') {
      return { label: 'Admin', hue: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' }
    }
    return null
  }

  const demoContract = useMemo(() => (id ? mockContracts.find(c => c.id === id) : undefined), [id])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setNotFound(false)
    if (!id || !/^\d+$/.test(id)) {
      // Demo contract (mock data ids like "c1"): skip the API entirely so the
      // backend never receives a non-numeric id.
      if (!mounted) return
      if (demoContract) setContract(normalizeContract(demoContract))
      else setNotFound(true)
      setLoading(false)
      return
    }
    fetchContractById(id)
      .then(res => { if (mounted) setContract(normalizeContract(res)) })
      .catch(() => {
        const mock = demoContract
        if (!mounted) return
        if (mock) setContract(normalizeContract(mock))
        else setNotFound(true)
      })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [id, demoContract])

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
    const numeric = /^\d+$/.test(id)
    setHistoryLoading(true)
    if (!numeric) {
      // Demo contract: build the history client-side from the mock entries so
      // filters and pagination keep working without hitting the backend.
      const fromTime = historyFrom ? new Date(`${historyFrom}T00:00:00`).getTime() : null
      const toTime = historyTo ? new Date(`${historyTo}T23:59:59.999`).getTime() : null
      const filtered = (demoContract?.history || []).filter(e => {
        const ts = new Date(e.date).getTime()
        if (historyAction && e.action !== historyAction) return false
        if (fromTime != null && ts < fromTime) return false
        if (toTime != null && ts > toTime) return false
        return true
      })
      const pageSize = 10
      const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
      const start = (historyPage - 1) * pageSize
      setHistoryItems(filtered.slice(start, start + pageSize))
      setHistoryTotal(filtered.length)
      setHistoryPages(pages)
      setHistoryLoading(false)
      return
    }
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
  }, [id, demoContract, historyPage, historyAction, historyFrom, historyTo])

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

  const propertyPath = contract?.propertyId ? `${basePath}/properties/${contract.propertyId}` : null
  const clientPath = (party: Contract['partieA']) =>
    party?.id ? `${basePath}/clients/type/${(party.type || 'client').toLowerCase()}/${party.id}` : null

  const backBtn = (
    <motion.button
      type="button"
      onClick={() => navigate(contractsPath)}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover="hover"
      whileTap={{ scale: 0.96 }}
      title="Retour aux contrats"
      className={`group/back relative flex h-9 shrink-0 items-center gap-2 overflow-hidden rounded-xl border pl-2.5 pr-4 text-xs font-bold backdrop-blur-md transition-all ${
        isDark
          ? 'border-white/10 bg-white/[0.05] text-slate-300 hover:border-white/30 hover:bg-white/10 hover:text-white'
          : 'border-slate-200/80 bg-white/70 text-slate-600 shadow-sm hover:border-teal-500/40 hover:bg-white hover:text-teal-900'
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
      <span>Retour aux contrats</span>
      <motion.span
        className="absolute inset-x-3 bottom-1 h-[2px] origin-left rounded-full"
        style={{ background: `linear-gradient(90deg, ${accent.a}, ${accent.b})` }}
        initial={{ scaleX: 0, opacity: 0 }}
        variants={{ hover: { scaleX: 1, opacity: 0.8 } }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      />
    </motion.button>
  )

  // ---- Actions ----

  const handleDownload = () => {
    if (!contract || pdfBuilding) return
    /* In-app PDF viewer: the contract document is assembled and rendered
       inside a staged modal (iframe srcDoc) — no hijacked browser tab.
       Build first so the modal opens with its loading skeleton already up. */
    setPdfViewerOpen(true)
    setPdfDocHtml('')
    setPdfBuilding(true)
    // Let the modal spring + skeleton paint before the CPU-bound assembly
    // blocks the main thread for a beat.
    window.setTimeout(() => {
      try {
        setPdfDocHtml(generateContratHtml(buildContractPdfData(contract, agentDisplayName), { scrollTheme: isDark ? 'dark' : 'light' }))
      } catch {
        setPdfViewerOpen(false)
        toast('error', 'Erreur lors de la génération du PDF du contrat')
      } finally {
        setPdfBuilding(false)
      }
    }, 420)
  }

  /* The print dialog carries "Imprimer" for the ghost action. */
  const handlePdfPrint = () => {
    if (!pdfDocHtml || !pdfFrameRef.current?.contentWindow) {
      return toast('info', 'Document en cours de génération...')
    }
    pdfFrameRef.current.contentWindow.focus()
    pdfFrameRef.current.contentWindow.print()
  }

  /* True file download: rasterizes the displayed document into an
     A4 multipage PDF (WYSIWYG with the in-app preview). */
  const handlePdfDownload = async () => {
    if (!pdfDocHtml || pdfSaving || pdfBuilding || !contract) return
    setPdfSaving(true)
    try {
      await exportHtmlToPdfFromFrame(pdfFrameRef.current, {
        downloadName: `Contrat-${contract.reference}.pdf`,
      })
      toast('success', 'Contrat téléchargé au format PDF')
    } catch {
      toast('error', 'Erreur lors de la génération du PDF du contrat')
    } finally {
      setPdfSaving(false)
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
    <StageSection icon={Calendar} title="Dates clés" accent={accent} ink={ink} isDark={isDark} delay={0.04}>
      <StageField icon={Calendar} label="Création" value={fmtDate(contract?.dateCreation)} accent={accent} ink={ink} isDark={isDark} delay={0.02} />
      {contract?.type === 'vente' && (
        <>
          <StageField icon={Calendar} label="Offre" value={fmtDate(contract?.dateOffre)} accent={accent} ink={ink} isDark={isDark} delay={0.04} />
          <StageField icon={Calendar} label="Réservation" value={fmtDate(contract?.dateReservation)} accent={accent} ink={ink} isDark={isDark} delay={0.06} />
          <StageField icon={Calendar} label="Compromis" value={fmtDate(contract?.dateCompromis)} accent={accent} ink={ink} isDark={isDark} delay={0.08} />
          <StageField icon={Calendar} label="Acte authentique" value={fmtDate(contract?.dateActe)} accent={accent} ink={ink} isDark={isDark} delay={0.1} />
        </>
      )}
      {contract?.type === 'location_classique' && (
        <>
          <StageField icon={Calendar} label="Début du bail" value={fmtDate(contract?.dateDebutBail)} accent={accent} ink={ink} isDark={isDark} delay={0.04} />
          <StageField icon={Calendar} label="Fin du bail" value={fmtDate(contract?.dateFinBail)} accent={accent} ink={ink} isDark={isDark} delay={0.06} />
        </>
      )}
      {contract?.type === 'location_saisonniere' && (
        <>
          <StageField icon={Calendar} label="Arrivée" value={fmtDate(contract?.dateArrivee)} accent={accent} ink={ink} isDark={isDark} delay={0.04} />
          <StageField icon={Calendar} label="Départ" value={fmtDate(contract?.dateDepart)} accent={accent} ink={ink} isDark={isDark} delay={0.06} />
        </>
      )}
    </StageSection>
  )

  const StagedPartyCard = ({ party, delay }: { party: Contract['partieA']; delay: number }) => {
    const meta = partyRoleMeta(party.role)
    const RoleIcon = meta.icon
    const empty = !party.name
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={`flex items-center gap-3 rounded-2xl p-3.5 ${glassPanel} ${empty ? 'border-dashed' : ''}`}
        style={empty && isDark ? { borderColor: 'rgba(255,255,255,0.12)' } : undefined}
      >
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-xs font-extrabold"
          style={isDark
            ? { background: `${meta.hue.a}18`, borderColor: `${meta.hue.a}38`, color: '#fff' }
            : { background: `${meta.hue.a}12`, borderColor: `${meta.hue.a}3A`, color: meta.hue.b }}
        >
          {empty ? <User size={14} className={isDark ? 'text-slate-400' : 'text-slate-500'} /> : (party.name || '?').split(' ').map(n => n[0]).slice(0, 2).join('')}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className={`truncate text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {party.name || 'Non renseignée'}
            </p>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]"
              style={stagePillStyle(meta.hue, isDark)}
            >
              <RoleIcon size={9} /> {party.role}
            </span>
          </div>
          {!empty && (
            <div className={`mt-0.5 flex flex-wrap items-center gap-3 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span className="flex items-center gap-1"><Phone size={10} /> {party.phone || '—'}</span>
              <span className="flex items-center gap-1"><Mail size={10} /> <span className="max-w-[220px] truncate">{party.email || '—'}</span></span>
            </div>
          )}
        </div>
        {!empty && clientPath(party) && (
          <button
            type="button"
            onClick={() => { const p = clientPath(party); if (p) navigate(p) }}
            className="flex shrink-0 items-center gap-1 text-xs font-bold transition-all hover:gap-1.5"
            style={{ color: isDark ? accent.a : ink }}
          >
            Fiche <ArrowRight size={12} />
          </button>
        )}
      </motion.div>
    )
  }

  const StagedPartyDetailCard = ({ title, subtitle, party, delay }: { title: string; subtitle: string; party: Contract['partieA']; delay: number }) => {
    const meta = partyRoleMeta(party.role)
    const RoleIcon = meta.icon
    const empty = !party.name
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={`rounded-2xl p-4 sm:p-5 ${glassPanel} ${empty ? 'border-dashed' : ''}`}
        style={empty && isDark ? { borderColor: 'rgba(255,255,255,0.12)' } : undefined}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <p className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</p>
            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{subtitle}</p>
          </div>
          <StagePill hue={meta.hue} isDark={isDark} icon={RoleIcon}>{party.role}</StagePill>
        </div>
        <div className={`flex items-center gap-3 rounded-xl border p-3 ${isDark ? 'border-white/[0.06] bg-white/[0.03]' : 'border-slate-200/60 bg-white/60'}`}>
          <span
            className="orb-icon select-none flex h-10 w-10 items-center justify-center text-xs font-extrabold text-white"
            style={{ width: 40, height: 40, borderRadius: 12, '--orb-a': meta.hue.a, '--orb-b': meta.hue.b, '--orb-glow': meta.hue.glow } as React.CSSProperties}
          >
            {empty ? '?' : (party.name || '?').split(' ').map(n => n[0]).slice(0, 2).join('')}
          </span>
          <div className="min-w-0">
            <p className={`truncate text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{party.name || 'Non renseignée'}</p>
            <p className={`truncate text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{party.type || party.role}</p>
          </div>
        </div>
        {!empty && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <StageField icon={Phone} label="Téléphone" value={party.phone || '—'} accent={accent} ink={ink} isDark={isDark} delay={0} />
            <StageField icon={Mail} label="Email" value={party.email || '—'} accent={accent} ink={ink} isDark={isDark} delay={0} />
          </div>
        )}
        {!empty && clientPath(party) && (
          <button
            type="button"
            onClick={() => { const p = clientPath(party); if (p) navigate(p) }}
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold transition-all hover:gap-2"
            style={{ color: isDark ? accent.a : ink }}
          >
            Voir la fiche client <ArrowRight size={12} />
          </button>
        )}
      </motion.div>
    )
  }

  const renderResume = () => {
    if (!contract || !typeCfg) return null
    return (
      <div className="space-y-6">
        <StageSection icon={TypeIcon || FileText} title="Informations" accent={accent} ink={ink} isDark={isDark} delay={0.02}>
          <StageField icon={Copy} label="Référence" value={<span className="font-mono text-[13px]">{contract.reference}</span>} accent={accent} ink={ink} isDark={isDark} delay={0.02} />
          <StageField icon={TypeIcon || FileText} label="Type" value={CONTRACT_TYPE_LABELS[contract.type]} accent={accent} ink={ink} isDark={isDark} delay={0.04} />
          <StageField icon={Shield} label="Statut" value={CONTRACT_STATUS_LABELS[contract.status]} accent={accent} ink={ink} isDark={isDark} delay={0.06} />
          <StageField icon={User} label="Agent responsable" value={agentDisplayName} accent={accent} ink={ink} isDark={isDark} delay={0.08} />
          <StageField icon={Calendar} label="Créé le" value={fmtDate(contract.createdAt || contract.dateCreation)} accent={accent} ink={ink} isDark={isDark} delay={0.1} />
          <StageField icon={Clock} label="Dernière mise à jour" value={fmtDate(contract.updatedAt)} accent={accent} ink={ink} isDark={isDark} delay={0.12} />
        </StageSection>

        {renderKeyDates()}

        <StageSection icon={Users} title="Parties" accent={accent} ink={ink} isDark={isDark} delay={0.06}>
          <div className="md:col-span-2 space-y-2.5">
            <StagedPartyCard party={contract.partieA} delay={0.02} />
            <StagedPartyCard party={contract.partieB} delay={0.06} />
          </div>
        </StageSection>

        <StageSection icon={Home} title="Bien concerné" accent={accent} ink={ink} isDark={isDark} delay={0.1}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={`md:col-span-2 flex items-start gap-3 rounded-2xl p-3.5 ${glassPanel}`}
          >
            <span
              className="orb-icon select-none flex shrink-0 items-center justify-center text-white"
              style={{ width: 40, height: 40, borderRadius: 12, '--orb-a': accent.a, '--orb-b': accent.b, '--orb-glow': accent.glow } as React.CSSProperties}
            >
              <Home size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <p className={`truncate text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{contract.propertyTitle}</p>
              <div className={`mt-0.5 flex items-center gap-1.5 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <MapPin size={11} />
                <span className="truncate">{contract.propertyAddress || '—'}</span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {contract.propertyTypeLabel && <StagePill hue={accent} isDark={isDark}>{contract.propertyTypeLabel}</StagePill>}
                {contract.propertyRef && <span className={`font-mono text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{contract.propertyRef}</span>}
              </div>
            </div>
            {propertyPath && (
              <button type="button" className={moduleBtn} onClick={() => navigate(propertyPath)}>
                <ArrowRight size={12} /> Voir le bien
              </button>
            )}
          </motion.div>
        </StageSection>

        <StageSection icon={Link2} title="Liens vers les autres modules" accent={accent} ink={ink} isDark={isDark} delay={0.14}>
          <div className="md:col-span-2 flex flex-wrap gap-2">
            <button type="button" className={moduleBtn} onClick={() => navigate(`${basePath}/register`)}>
              <FileText size={13} /> Registre des mandats
            </button>
            {propertyPath && (
              <button type="button" className={moduleBtn} onClick={() => navigate(propertyPath)}>
                <Home size={13} /> Fiche bien
              </button>
            )}
            {clientPath(contract.partieA) && (
              <button type="button" className={moduleBtn} onClick={() => { const p = clientPath(contract.partieA); if (p) navigate(p) }}>
                <User size={13} /> Fiche partie A
              </button>
            )}
            {clientPath(contract.partieB) && (
              <button type="button" className={moduleBtn} onClick={() => { const p = clientPath(contract.partieB); if (p) navigate(p) }}>
                <User size={13} /> Fiche partie B
              </button>
            )}
          </div>
        </StageSection>
      </div>
    )
  }

  const renderParties = () => {
    if (!contract) return null
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <StagedPartyDetailCard title={contract.partieA.role} subtitle="Partie A" party={contract.partieA} delay={0.02} />
          <StagedPartyDetailCard title={contract.partieB.role} subtitle="Partie B" party={contract.partieB} delay={0.06} />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className={`flex items-center justify-between gap-3 rounded-2xl p-4 ${glassPanel}`}
        >
          <div className="flex items-center gap-3">
            <span
              className="orb-icon select-none flex shrink-0 items-center justify-center text-white text-xs font-extrabold"
              style={{ width: 40, height: 40, borderRadius: 12, '--orb-a': accent.a, '--orb-b': accent.b, '--orb-glow': accent.glow } as React.CSSProperties}
            >
              <User size={16} />
            </span>
            <div>
              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Agent principal</p>
              <p className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{agentDisplayName}</p>
            </div>
          </div>
          <StagePill hue={SLATE_HUE} isDark={isDark}>Mandat exclusif</StagePill>
        </motion.div>
      </div>
    )
  }

  const renderFinancier = () => {
    if (!contract) return null
    return (
      <div className="space-y-6">
        {contract.type === 'vente' && (
          <StageSection icon={DollarSign} title="Détails financiers — Vente" accent={accent} ink={ink} isDark={isDark} delay={0.02}>
            <StageField icon={DollarSign} label="Prix de vente" value={money(contract.prixVente)} accent={accent} ink={ink} isDark={isDark} delay={0.02} />
            <StageField icon={DollarSign} label="Montant net vendeur" value={money(contract.montantNetVendeur)} accent={accent} ink={ink} isDark={isDark} delay={0.04} />
            <StageField
              icon={DollarSign}
              label="Honoraires TTC"
              value={money(contract.honorairesTTC)}
              accent={accent}
              ink={ink}
              isDark={isDark}
              delay={0.06}
            />
            {contract.sequestre != null && <StageField icon={Shield} label="Séquestre" value={money(contract.sequestre)} accent={accent} ink={ink} isDark={isDark} delay={0.08} />}
            {contract.conditionPaiementHonoraires && <StageField icon={Clock} label="Paiement des honoraires" value={contract.conditionPaiementHonoraires} accent={accent} ink={ink} isDark={isDark} delay={0.1} />}
          </StageSection>
        )}
        {contract.type === 'location_classique' && (
          <StageSection icon={DollarSign} title="Détails financiers — Location classique" accent={accent} ink={ink} isDark={isDark} delay={0.02}>
            <StageField icon={DollarSign} label="Loyer mensuel HC" value={money(contract.loyerMensuelHC)} accent={accent} ink={ink} isDark={isDark} delay={0.02} />
            <StageField icon={DollarSign} label="Charges mensuelles" value={money(contract.chargesMensuelles)} accent={accent} ink={ink} isDark={isDark} delay={0.04} />
            <StageField
              icon={DollarSign}
              label="Loyer total CC"
              value={money(contract.loyerMensuelHC != null && contract.chargesMensuelles != null ? contract.loyerMensuelHC + contract.chargesMensuelles : undefined)}
              accent={accent}
              ink={ink}
              isDark={isDark}
              delay={0.06}
            />
            <StageField
              icon={Shield}
              label="Dépôt de garantie"
              value={money(contract.depotGarantie)}
              accent={accent}
              ink={ink}
              isDark={isDark}
              delay={0.08}
            />
            <StageField icon={DollarSign} label="Honoraires de location" value={money(contract.honorairesLocation)} accent={accent} ink={ink} isDark={isDark} delay={0.1} />
          </StageSection>
        )}
        {contract.type === 'location_saisonniere' && (
          <StageSection icon={DollarSign} title="Détails financiers — Location saisonnière" accent={accent} ink={ink} isDark={isDark} delay={0.02}>
            <StageField icon={DollarSign} label="Prix total du séjour" value={money(contract.prixTotalSejour)} accent={accent} ink={ink} isDark={isDark} delay={0.02} />
            <StageField
              icon={DollarSign}
              label="Tarif / nuit"
              value={money(contract.prixTotalSejour && contract.dateArrivee && contract.dateDepart ? contract.prixTotalSejour / Math.max(1, Math.floor((new Date(contract.dateDepart).getTime() - new Date(contract.dateArrivee).getTime()) / (1000 * 60 * 60 * 24))) : undefined)}
              accent={accent}
              ink={ink}
              isDark={isDark}
              delay={0.04}
            />
            <StageField
              icon={DollarSign}
              label="Acompte versé"
              value={money(contract.acompteVerse)}
              accent={accent}
              ink={ink}
              isDark={isDark}
              delay={0.06}
            />
            <StageField icon={DollarSign} label="Solde restant" value={money(contract.soldeRestant)} accent={accent} ink={ink} isDark={isDark} delay={0.08} />
            <StageField icon={Shield} label="Caution" value={money(contract.caution)} accent={accent} ink={ink} isDark={isDark} delay={0.1} />
          </StageSection>
        )}
        {contract.notes && (
          <StageSection icon={MessageSquare} title="Notes" accent={accent} ink={ink} isDark={isDark} delay={0.06}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04, duration: 0.4 }}
              className={`md:col-span-2 rounded-2xl p-3.5 ${glassPanel}`}
            >
              <div className="mb-1.5 flex items-center gap-2">
                <MessageSquare size={13} style={{ color: isDark ? accent.a : ink }} />
                <span className={`text-[10px] font-extrabold uppercase tracking-[0.14em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Note interne</span>
              </div>
              <p className={`whitespace-pre-wrap text-sm font-semibold leading-relaxed ${isDark ? 'text-white/90' : 'text-slate-800'}`}>{contract.notes}</p>
            </motion.div>
          </StageSection>
        )}
      </div>
    )
  }

  const renderDocuments = () => {
    const docs = contract?.documents || []
    const docRowAction =
      'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-all duration-200 active:scale-95 ' +
      (isDark
        ? 'border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-white/20 hover:bg-white/[0.08] hover:text-white'
        : 'border-slate-200/70 bg-white/70 text-slate-500 hover:border-teal-500/30 hover:bg-white hover:text-teal-900')
    const docRowActionDanger =
      'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-all duration-200 active:scale-95 ' +
      (isDark
        ? 'border-rose-400/25 bg-rose-500/[0.06] text-rose-300/90 hover:border-rose-400/50 hover:bg-rose-500/15 hover:text-rose-300'
        : 'border-rose-200/80 bg-rose-50/80 text-rose-400 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600')

    return (
      <div className="space-y-3">
        {/* Header — orb + count + add action */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl p-3.5 ${glassPanel}`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <OrbIcon icon={Shield} hue={accent} size={38} radius={12} />
            <div className="min-w-0">
              <p className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Documents du contrat</p>
              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {docs.length} pièce{docs.length > 1 ? 's' : ''} joint{docs.length > 1 ? 'e' : ''}
                {docs.length > 1 ? 's' : ''} · contrats signés et justificatifs
              </p>
            </div>
          </div>
          <button type="button" className={glassBtn} onClick={pickFiles} disabled={docUploading}>
            {docUploading ? <Loader size={14} className="animate-spin" /> : <Upload size={14} />}
            {docUploading ? 'Upload en cours...' : 'Ajouter un document'}
          </button>
        </motion.div>

        {docError && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={cn(
              'flex items-start gap-2 rounded-xl border px-3 py-2.5 text-[13px] font-medium',
              isDark ? 'border-rose-400/25 bg-rose-500/10 text-rose-200' : 'border-rose-200/80 bg-rose-50/80 text-rose-700',
            )}
          >
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-rose-400" />
            <p>{docError}</p>
          </motion.div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          className="hidden"
          onChange={handleFilesSelected}
        />

        {docs.length === 0 ? (
          <StageEmpty
            icon={FileText}
            title="Aucun document lié à ce contrat"
            hint="Ajoutez le contrat scanné et ses pièces justificatives (PDF ou images)."
            accent={accent}
            ink={ink}
            isDark={isDark}
            action={
              <button type="button" className={glassBtn} onClick={pickFiles}>
                <Upload size={14} /> Ajouter un document
              </button>
            }
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden rounded-2xl"
          >
            <div className={glassPanel}>
              <div className={isDark ? 'divide-y divide-white/[0.05]' : 'divide-y divide-slate-100'}>
                {docs.map((doc, i) => {
                  const sizeLabel = fmtDocSize(doc.size)
                  return (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className={`group flex items-center gap-3 px-4 py-3 transition-colors duration-200 ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-white/70'}`}
                    >
                      {isImageDoc(doc) && doc.url && !doc.url.startsWith('#') ? (
                        <button
                          type="button"
                          onClick={() => handleDocView(doc)}
                          title="Aperçu"
                          className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border transition-all duration-200 hover:scale-105"
                          style={{ borderColor: isDark ? `${accent.a}38` : `${accent.a}30`, boxShadow: `0 2px 10px -4px ${accent.glow}` }}
                        >
                          <img
                            src={resolveMediaUrl(doc.url)}
                            alt={doc.name}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                        </button>
                      ) : (
                        <span
                          className={cn(
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
                            isDark ? 'border-white/[0.08] bg-white/[0.05]' : 'border-slate-200/80 bg-white/80',
                          )}
                          style={{ boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.06)' : 'inset 0 1px 0 rgba(255,255,255,0.9)' }}
                        >
                          <FileText size={15} style={{ color: isDark ? accent.a : ink }} />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => handleDocView(doc)}
                          className={`block w-full max-w-full truncate text-left text-sm font-bold transition-colors ${isDark ? 'text-white hover:text-sky-400' : 'text-slate-900 hover:text-teal-900'} ${previewDoc?.id === doc.id ? 'underline decoration-2 underline-offset-4' : ''}`}
                          style={{ textDecorationColor: isDark ? accent.a : ink }}
                        >
                          {doc.name}
                        </button>
                        <div className={`mt-0.5 flex items-center gap-2 text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          <span className="truncate">{getDocTypeLabel(doc.type)}</span>
                          {sizeLabel && (
                            <>
                              <span className="opacity-40">·</span>
                              <span className="whitespace-nowrap">{sizeLabel}</span>
                            </>
                          )}
                          <span className="opacity-40">·</span>
                          <span className="whitespace-nowrap">{new Date(doc.date).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity duration-200 md:opacity-0 md:group-hover:opacity-100">
                        <button type="button" onClick={() => handleDocView(doc)} className={docRowAction} title="Voir">
                          <Eye size={13} />
                        </button>
                        <button type="button" onClick={() => handleDocDownload(doc)} className={docRowAction} title="Télécharger">
                          <Download size={13} />
                        </button>
                        <button type="button" onClick={() => setDocToDelete(doc)} className={docRowActionDanger} title="Supprimer">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    )
  }

  const HISTORY_ACTIONS = ['Contrat créé', 'Changement de statut', 'Modification de la note']

  const stageSelectLabel = `text-[10px] font-bold uppercase tracking-[0.12em] mb-1 block ${isDark ? 'text-slate-500' : 'text-slate-400'}`

  const renderHistorique = () => (
    <div className="space-y-3">
      {historyLocked && (
        <div className={`flex items-center gap-2 p-3 rounded-2xl border text-sm backdrop-blur-sm ${glassPanel}`}>
          <Lock size={14} className="text-error" />
          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>L'historique du contrat est verrouillé par l'administrateur.</span>
        </div>
      )}
      <div className="relative">
        <div className={`space-y-3 ${historyLocked ? 'blur-sm select-none pointer-events-none' : ''}`}>
          {/* Filters */}
          <div className={`p-3 rounded-2xl flex flex-wrap items-end gap-3 ${glassPanel}`}>
            <div>
              <label className={stageSelectLabel}>Action</label>
              <Select
                value={historyAction}
                onValueChange={(val: string) => { setHistoryAction(val); setHistoryPage(1) }}
                options={[{ value: '', label: 'Toutes les actions' }, ...HISTORY_ACTIONS.map(a => ({ value: a, label: a }))]}
              />
            </div>
            <div className="w-44">
              <label className={stageSelectLabel}>Du</label>
              <DatePicker value={historyFrom} placeholder="Date de début" onChange={e => { setHistoryFrom(e.target.value); setHistoryPage(1) }} />
            </div>
            <div className="w-44">
              <label className={stageSelectLabel}>Au</label>
              <DatePicker value={historyTo} placeholder="Date de fin" onChange={e => { setHistoryTo(e.target.value); setHistoryPage(1) }} />
            </div>
            <button
              type="button"
              className={glassBtn}
              onClick={() => { setHistoryAction(''); setHistoryFrom(''); setHistoryTo(''); setHistoryPage(1) }}
            >
              <Filter size={13} /> Réinitialiser
            </button>
            <div className={`ml-auto text-xs font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {historyTotal} entrée{historyTotal > 1 ? 's' : ''}
            </div>
          </div>

          {/* List */}
          {historyLoading ? (
            <div className="flex items-center justify-center py-16">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-solid" style={{ borderColor: isDark ? `${accent.a}33` : 'rgba(13,148,136,0.25)', borderTopColor: accent.a }} />
            </div>
          ) : historyItems.length === 0 ? (
            <StageEmpty
              icon={Clock}
              title="Aucun historique pour ces critères"
              hint="Les mouvements du contrat apparaîtront ici dès qu'il sera créé ou modifié."
              accent={accent}
              ink={ink}
              isDark={isDark}
            />
          ) : (
            <div className="relative pl-6 space-y-0">
              <div
                className="absolute left-[11px] top-2 bottom-2 w-px"
                style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(13,148,136,0.18)' }}
              />
              {historyItems.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.25 }}
                  className="relative pb-3 last:pb-0"
                >
                  <span
                    className="absolute -left-[21px] top-4 h-[10px] w-[10px] rounded-full border-2"
                    style={{
                      background: isDark ? '#0B1022' : '#ffffff',
                      borderColor: accent.a,
                      boxShadow: `0 0 6px ${accent.glow}`,
                    }}
                  />
                  <div className={`flex items-start justify-between gap-4 rounded-2xl p-3 ${glassPanel}`}>
                    <div className="min-w-0">
                      <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{entry.action}</p>
                      {entry.details && <p className={`mt-0.5 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{entry.details}</p>}
                      <p className={`mt-1 text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>par {entry.agent}</p>
                    </div>
                    <span className={`whitespace-nowrap text-[11px] font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{formatRelativeDate(entry.date)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {historyPages > 1 && (
            <div className="flex items-center justify-between pt-1">
              <span className={`text-xs font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Page {historyPage} sur {historyPages}
              </span>
              <div className="flex items-center gap-2">
                <button type="button" className={glassBtn} disabled={historyPage <= 1} onClick={() => setHistoryPage(p => Math.max(1, p - 1))}>
                  <ChevronLeft size={14} /> Précédent
                </button>
                <button type="button" className={glassBtn} disabled={historyPage >= historyPages} onClick={() => setHistoryPage(p => Math.min(historyPages, p + 1))}>
                  Suivant <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
        {historyLocked && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
            <Lock size={28} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
            <p className={`mt-2 text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Historique verrouillé</p>
            <p className={`mt-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Contenu masqué par l'administrateur</p>
          </div>
        )}
      </div>
    </div>
  )

  const renderNotes = () => (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button type="button" className={glassBtn} disabled={!canWrite} onClick={openNoteDialog}>
          <MessageSquare size={14} /> {contract?.notes ? 'Modifier la note' : 'Ajouter une note'}
        </button>
      </div>
      {contract?.notes ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className={`rounded-2xl p-4 ${glassPanel}`}
        >
          <div className="mb-2 flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg border"
              style={isDark
                ? { background: `${accent.a}14`, borderColor: `${accent.a}30`, color: accent.a }
                : { background: `${accent.a}12`, borderColor: `${accent.a}30`, color: ink }}
            >
              <MessageSquare size={13} />
            </span>
            <span className={`text-[10px] font-extrabold uppercase tracking-[0.14em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Note interne</span>
          </div>
          <p className={`whitespace-pre-wrap text-sm font-semibold leading-relaxed ${isDark ? 'text-white/90' : 'text-slate-800'}`}>{contract.notes}</p>
        </motion.div>
      ) : (
        <StageEmpty
          icon={MessageSquare}
          title="Aucune note pour ce contrat"
          hint="Ajoutez une note interne pour suivre vos échanges et avancement."
          accent={accent}
          ink={ink}
          isDark={isDark}
          action={canWrite ? (
            <button type="button" className={glassBtn} onClick={openNoteDialog}>
              <MessageSquare size={14} /> Ajouter une note
            </button>
          ) : (
            <span className={`text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              <Lock size={11} className="mr-1 inline" /> Autorisation « contrats-ecriture » requise
            </span>
          )}
        />
      )}
    </div>
  )

  // ---- Page states ----

  if (loading) {
    return (
      <Stage theme={theme}>
        <div className="animate-fade-in space-y-4">
          {backBtn}
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative flex h-12 w-12 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400/20" />
              <span className="relative inline-flex h-8 w-8 animate-spin rounded-full border-2 border-sky-400/80 border-t-transparent" />
            </div>
            <p className="mt-4 text-sm font-semibold text-text-secondary">Chargement du contrat...</p>
          </div>
        </div>
      </Stage>
    )
  }

  if (notFound || !contract || !typeCfg) {
    return (
      <Stage theme={theme}>
        <div className="animate-fade-in space-y-4">
          {backBtn}
          <StageEmpty
            icon={FileText}
            title="Contrat non trouvé"
            hint="Ce contrat n'existe pas ou a été supprimé."
            accent={accent}
            ink={ink}
            isDark={isDark}
            action={
              <Button variant="outline" onClick={() => navigate(contractsPath)}>
                Retour aux contrats
              </Button>
            }
          />
        </div>
      </Stage>
    )
  }

  // Staged modal accessories (safe: contract is resolved past the guards).
  const modalAccent = isDark ? accent.a : '#14B8A6'
  const selStatusHue = statusHue(newStatus || contract.status)
  const noOwnerEmail = !contract.partieB.email

  const tabs: TabItem[] = [
    { id: 'resume', slug: 'resume', label: 'Résumé' },
    { id: 'parties', slug: 'parties', label: 'Parties' },
    { id: 'financier', slug: 'financier', label: 'Financier' },
    { id: 'documents', slug: 'documents', label: 'Documents' },
    { id: 'historique', slug: 'historique', label: 'Historique' },
    { id: 'notes', slug: 'notes', label: 'Notes' },
  ]

  return (
    <Stage theme={theme}>
      <div className="animate-fade-in space-y-4 pb-8">
        {/* Top action bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {backBtn}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold backdrop-blur-md ${
              isDark ? 'border-white/10 bg-white/[0.05] text-slate-400' : 'border-slate-200/80 bg-white/70 text-slate-500 shadow-sm'
            }`}
          >
            <Clock size={12} />
            Mis à jour le {fmtDate(contract.updatedAt)}
          </motion.div>
        </div>

        {/* Hero header */}
        <ContractHeader contract={contract} agentName={agentDisplayName} />

        {/* Actions rail */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className={`flex flex-wrap items-center gap-2 rounded-2xl border p-3 backdrop-blur-sm ${isDark ? 'border-white/[0.07] bg-white/[0.03]' : 'border-slate-200/70 bg-white/70 shadow-[0_1px_2px_rgba(15,23,42,0.05)]'}`}
        >
          <span className={`flex items-center gap-1.5 px-1 text-[10px] font-extrabold uppercase tracking-[0.14em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            <Zap size={12} /> Actions
          </span>
          <span className={`h-6 w-px ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
          <button type="button" className={glassBtn} onClick={handleDownload} disabled={pdfBuilding}>
            {pdfBuilding ? <Loader size={14} className="animate-spin" /> : <Download size={14} />}
            {pdfBuilding ? 'Génération du contrat...' : 'Télécharger le contrat (PDF)'}
          </button>
          <button type="button" className={glassBtn} onClick={handleSendToClient}>
            <Send size={14} /> Envoyer au client
          </button>
          <button type="button" className={glassBtn} onClick={handleSendToProprietaire}>
            <Send size={14} /> Envoyer au propriétaire
          </button>
          {canExport && (
            <button type="button" className={glassBtn} onClick={handleShare}>
              <Share2 size={14} /> Partager
            </button>
          )}
          <button type="button" className={glassBtn} disabled={!canWrite} onClick={openStatusDialog}>
            <RefreshCw size={14} /> Changer le statut
          </button>
          <button type="button" className={glassBtn} disabled={!canWrite} onClick={openNoteDialog}>
            <MessageSquare size={14} /> {contract?.notes ? 'Modifier la note' : 'Ajouter une note'}
          </button>
          <span className={`mx-1 h-6 w-px ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
          <button type="button" className={dangerBtn} onClick={() => setDeleteDialog(true)}>
            <Trash2 size={14} /> Supprimer le contrat
          </button>
        </motion.div>

        {/* Responsible agent (admin / gérant) */}
        {showResponsible && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className={`flex items-center gap-3 rounded-2xl border p-4 backdrop-blur-sm ${glassPanel}`}
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white ${responsibleUser?.color || 'bg-indigo-500'}`}>
              {responsibleUser?.initials || 'NA'}
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>En charge du contrat</p>
              <div className="flex flex-wrap items-center gap-2">
                <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{responsibleUser?.name || contract.agentPrincipal || 'Non assigné'}</p>
                {(() => {
                  const badge = getRoleBadge(responsibleUser)
                  return badge ? (
                    <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${badge.hue}`}>
                      {badge.label}
                    </span>
                  ) : null
                })()}
              </div>
            </div>
          </motion.div>
        )}

        {/* Staged tabs shell */}
        <ContractTabsShell tabs={tabs} activeTab={activeTab} onChange={setActiveTab} accent={accent}>
          {activeTab === 'resume' && renderResume()}
          {activeTab === 'parties' && renderParties()}
          {activeTab === 'financier' && renderFinancier()}
          {activeTab === 'documents' && renderDocuments()}
          {activeTab === 'historique' && renderHistorique()}
          {activeTab === 'notes' && renderNotes()}
        </ContractTabsShell>

        {/* Status dialog — staged */}
        <StageModal
          open={statusDialog}
          onClose={() => setStatusDialog(false)}
          eyebrow="Pipeline du contrat"
          title="Changer le statut"
          subtitle={`Contrat ${contract.reference}`}
          icon={RefreshCw}
          hue={selStatusHue}
          accent={modalAccent}
          badge={
            <StagePill hue={statusHue(contract.status)} isDark={isDark} pulse>
              {CONTRACT_STATUS_LABELS[contract.status]}
            </StagePill>
          }
          maxWidth="max-w-xl"
          centered
          bodyClassName="pt-2"
          footer={
            <>
              <button type="button" className={stageBtns.ghost} onClick={() => setStatusDialog(false)}>
                Annuler
              </button>
              <button
                type="button"
                disabled={statusSaving}
                onClick={handleStatusChange}
                className={cn(
                  stageBtns.primary,
                  (!canWrite || !newStatus || newStatus === contract.status) && !statusSaving && 'pointer-events-none opacity-40',
                )}
              >
                {statusSaving ? (
                  <><Loader size={14} className="animate-spin" /> Enregistrement...</>
                ) : (
                  <><CheckCircle size={14} /> Enregistrer</>
                )}
              </button>
            </>
          }
        >
          <motion.div
            initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4"
          >
            <p className={modalSectionTitle} style={{ color: isDark ? selStatusHue.a : ink }}>
              <span className="h-px w-4 bg-gradient-to-r from-current to-transparent" />
              Nouveau statut
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {STATUS_ORDER.map((s, i) => {
                const hue = statusHue(s)
                const selected = newStatus === s
                const current = contract.status === s
                return (
                  <motion.button
                    key={s}
                    type="button"
                    onClick={() => setNewStatus(s)}
                    disabled={!canWrite}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 + i * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className={`relative overflow-hidden rounded-2xl border p-3 text-left backdrop-blur-sm transition-all duration-200 ${
                      !selected
                        ? isDark
                          ? 'border-white/[0.08] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
                          : 'border-slate-200/70 bg-white/75 shadow-[0_1px_2px_rgba(15,23,42,0.05)] hover:border-teal-500/40 hover:bg-white'
                        : ''
                    } ${current && !selected ? 'opacity-70' : ''} ${!canWrite ? 'opacity-50 pointer-events-none cursor-not-allowed' : ''}`}
                    style={selected
                      ? (isDark
                        ? { borderColor: `${hue.a}66`, background: `${hue.a}14`, boxShadow: `0 10px 28px -12px ${hue.glow}, inset 0 1px 0 rgba(255,255,255,0.14)` }
                        : { borderColor: `${hue.a}55`, background: `${hue.a}12`, boxShadow: `0 10px 26px -14px ${hue.glow}, inset 0 1px 0 rgba(255,255,255,0.9)` })
                      : undefined}
                  >
                    <span
                      className="pointer-events-none absolute inset-x-0 top-0 h-px transition-opacity duration-300"
                      style={{ background: `linear-gradient(90deg, transparent, ${hue.line}, transparent)`, opacity: selected ? 0.7 : 0 }}
                    />
                    <div className="flex items-center justify-between gap-2">
                      <span className={`flex items-center gap-2 text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {selected ? (
                          <motion.span
                            initial={{ scale: 0, rotate: -90 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                            className="relative flex h-1.5 w-1.5"
                          >
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: hue.line }} />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: hue.line }} />
                          </motion.span>
                        ) : (
                          <span className="h-2 w-2 rounded-full" style={{ background: hue.line, boxShadow: `0 0 6px ${hue.glow}` }} />
                        )}
                        {CONTRACT_STATUS_LABELS[s]}
                      </span>
                      {current && !selected && (
                        <span className={cn(
                          'rounded-full border px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.08em]',
                          isDark ? 'border-white/10 bg-white/[0.06] text-slate-400' : 'border-slate-200/80 bg-white/80 text-slate-500',
                        )}>
                          Actuel
                        </span>
                      )}
                      {selected && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 480, damping: 20, delay: 0.05 }}
                        >
                          <CheckCircle size={16} style={{ color: isDark ? hue.a : hue.b }} />
                        </motion.span>
                      )}
                    </div>
                    <p className={`mt-1.5 text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {STATUS_DESCRIPTIONS[s]}
                    </p>
                  </motion.button>
                )
              })}
            </div>
            <div className={modalNotice}>
              <Clock size={14} className="mt-0.5 shrink-0 text-amber-500" />
              <p>Le changement de statut sera horodaté et consigné dans l'historique du contrat.</p>
            </div>
          </motion.div>
        </StageModal>

        {/* Note dialog — staged */}
        <StageModal
          open={noteDialog}
          onClose={() => setNoteDialog(false)}
          eyebrow="Suivi interne"
          title={contract.notes ? 'Modifier la note' : 'Ajouter une note'}
          subtitle={`Contrat ${contract.reference}`}
          icon={MessageSquare}
          hue={accent}
          accent={modalAccent}
          maxWidth="max-w-lg"
          centered
          bodyClassName="pt-2"
          footer={
            <>
              <button type="button" className={stageBtns.ghost} onClick={() => setNoteDialog(false)}>
                Annuler
              </button>
              <button
                type="button"
                disabled={noteSaving}
                onClick={handleSaveNote}
                className={cn(
                  stageBtns.primary,
                  !noteSaving && (!canWrite || noteText === (contract.notes || '')) && 'pointer-events-none opacity-40',
                )}
              >
                {noteSaving ? (
                  <><Loader size={14} className="animate-spin" /> Enregistrement...</>
                ) : (
                  <><MessageSquare size={14} /> Enregistrer la note</>
                )}
              </button>
            </>
          }
        >
          <motion.div
            initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-3.5"
          >
            <p className={modalSectionTitle} style={{ color: isDark ? accent.a : ink }}>
              <span className="h-px w-4 bg-gradient-to-r from-current to-transparent" />
              Contenu de la note
            </p>
            <Textarea
              placeholder="Ex : en attente de la signature du compromis..."
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              rows={7}
              maxLength={2000}
              disabled={!canWrite}
            />
            <div className="flex items-center gap-2.5">
              <div className={`h-1 flex-1 overflow-hidden rounded-full ${isDark ? 'bg-white/[0.06]' : 'bg-teal-900/10'}`}>
                <span
                  className="block h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (noteText.length / 2000) * 100)}%`,
                    background: noteText.length > 1900
                      ? 'linear-gradient(90deg, #FB7185, #DC2626)'
                      : `linear-gradient(90deg, ${isDark ? accent.a : '#2DD4BF'}, ${isDark ? accent.b : '#0D9488'})`,
                    boxShadow: noteText.length > 1900 ? '0 0 10px rgba(248,113,113,0.5)' : `0 0 10px ${accent.glow}`,
                  }}
                />
              </div>
              <span
                className={`text-[11px] font-semibold tabular-nums ${
                  noteText.length > 1900 ? (isDark ? 'text-rose-400' : 'text-rose-500') : isDark ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {noteText.length} / 2000
              </span>
            </div>
            <div className={modalNotice}>
              <Clock size={14} className="mt-0.5 shrink-0 text-amber-500" />
              <p>La note sera horodatée dans l'historique du contrat et visible dans l'onglet Notes.</p>
            </div>
          </motion.div>
        </StageModal>

        {/* Send to propriétaire dialog — staged */}
        <StageModal
          open={sendDialog}
          onClose={() => setSendDialog(false)}
          eyebrow="Envoi par e-mail"
          title="Envoyer au propriétaire"
          subtitle={contract.propertyTitle}
          icon={Send}
          hue={accent}
          accent={modalAccent}
          maxWidth="max-w-lg"
          centered
          bodyClassName="pt-2"
          footer={
            <>
              <button type="button" className={stageBtns.ghost} onClick={() => setSendDialog(false)}>
                Annuler
              </button>
              <button
                type="button"
                disabled={sendSaving}
                onClick={handleSendProprietaireConfirm}
                className={cn(
                  stageBtns.primary,
                  !sendSaving && (!sendSubject.trim() || noOwnerEmail) && 'pointer-events-none opacity-40',
                )}
              >
                {sendSaving ? (
                  <><Loader size={14} className="animate-spin" /> Envoi en cours...</>
                ) : (
                  <><Send size={14} /> Envoyer</>
                )}
              </button>
            </>
          }
        >
          <motion.div
            initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4"
          >
            <p className={modalSectionTitle} style={{ color: isDark ? accent.a : ink }}>
              <span className="h-px w-4 bg-gradient-to-r from-current to-transparent" />
              Destinataire
            </p>
            <div
              className={cn(
                'flex items-center gap-3 rounded-2xl border p-3.5',
                isDark ? 'border-white/[0.07] bg-white/[0.04]' : 'border-slate-200/70 bg-white/75 shadow-[0_1px_2px_rgba(15,23,42,0.05)]',
              )}
            >
              <OrbIcon icon={User} hue={partyRoleMeta(contract.partieB.role).hue} size={40} radius={12} />
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {contract.partieB.name || 'Propriétaire'}
                </p>
                <p className={cn('mt-0.5 flex items-center gap-1.5 text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>
                  <Mail size={11} className={`shrink-0 ${noOwnerEmail ? 'text-rose-400' : ''}`} />
                  <span className="truncate">{contract.partieB.email || 'Aucun e-mail renseigné'}</span>
                </p>
              </div>
              <StagePill hue={partyRoleMeta(contract.partieB.role).hue} isDark={isDark} icon={partyRoleMeta(contract.partieB.role).icon}>
                {contract.partieB.role || 'Propriétaire'}
              </StagePill>
            </div>
            {noOwnerEmail && (
              <div className={modalDangerNotice}>
                <Mail size={14} className="mt-0.5 shrink-0 text-rose-400" />
                <p>Renseignez l'adresse e-mail du propriétaire sur sa fiche client pour pouvoir envoyer le contrat.</p>
              </div>
            )}
            <p className={modalSectionTitle} style={{ color: isDark ? accent.a : ink }}>
              <span className="h-px w-4 bg-gradient-to-r from-current to-transparent" />
              Message
            </p>
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
              className="stage-scroll-slim"
            />
            <div className={modalNotice}>
              <FileText size={14} className="mt-0.5 shrink-0 text-amber-500" />
              <p>
                Le contrat <span className="font-mono font-bold">{contract.reference}</span> sera joint à l'e-mail sous forme de PDF généré automatiquement.
              </p>
            </div>
          </motion.div>
        </StageModal>

        {/* PDF generation modal — staged in-app viewer with print/save actions */}
        <StageModal
          open={pdfViewerOpen}
          onClose={() => setPdfViewerOpen(false)}
          eyebrow="Génération du document"
          title="Télécharger le contrat (PDF)"
          subtitle={`Contrat ${contract.reference} · ${CONTRACT_TYPE_LABELS[contract.type]}`}
          icon={FileText}
          hue={accent}
          accent={modalAccent}
          maxWidth="max-w-4xl"
          centered
          bodyClassName="pt-2"
          footer={
            <>
              <button type="button" className={cn(stageBtns.ghost, 'mr-auto')} onClick={() => setPdfViewerOpen(false)}>
                Fermer
              </button>
              <button
                type="button"
                disabled={pdfBuilding || !pdfDocHtml || pdfSaving}
                onClick={handlePdfPrint}
                className={cn(stageBtns.ghost, (pdfBuilding || !pdfDocHtml || pdfSaving) && 'pointer-events-none opacity-40')}
              >
                <Printer size={14} /> Imprimer
              </button>
              <button
                type="button"
                disabled={pdfBuilding || !pdfDocHtml || pdfSaving}
                onClick={handlePdfDownload}
                className={cn(stageBtns.primary, (pdfBuilding || !pdfDocHtml || pdfSaving) && 'pointer-events-none opacity-40')}
              >
                {pdfSaving ? (
                  <><Loader size={14} className="animate-spin" /> Génération du PDF...</>
                ) : (
                  <><Download size={14} /> Enregistrer en PDF</>
                )}
              </button>
            </>
          }
        >
          <motion.div
            initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-3"
          >
            <div
              className={cn(
                'overflow-hidden rounded-2xl border',
                isDark ? 'border-white/[0.07] bg-white/[0.02]' : 'border-slate-200/70 bg-slate-50/80',
              )}
            >
              {pdfBuilding || !pdfDocHtml ? (
                <div className="flex h-[65vh] flex-col items-center justify-center gap-4">
                  <div className="relative flex h-12 w-12 items-center justify-center">
                    <span
                      className="absolute inline-flex h-full w-full animate-ping rounded-full"
                      style={{ background: `${accent.a}22` }}
                    />
                    <span
                      className="relative inline-flex h-9 w-9 animate-spin rounded-full border-2 border-solid border-t-transparent"
                      style={{ borderColor: isDark ? `${accent.a}55` : 'rgba(13,148,136,0.25)', borderTopColor: isDark ? accent.a : '#14B8A6' }}
                    />
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Génération du document...</p>
                    <p className={`mt-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      Assemblage des données du contrat en document imprimable.
                    </p>
                  </div>
                </div>
              ) : (
                <iframe
                  ref={pdfFrameRef}
                  srcDoc={pdfDocHtml}
                  title={`Contrat ${contract.reference}`}
                  className="h-[65vh] w-full border-0 bg-white"
                />
              )}
            </div>
            <div className={modalNotice}>
              <Printer size={14} className="mt-0.5 shrink-0 text-amber-500" />
              <p>
                « Enregistrer en PDF » télécharge directement un fichier A4 conforme à l'aperçu. Utilisez « Imprimer » pour passer par la boîte d'impression du navigateur.
              </p>
            </div>
          </motion.div>
        </StageModal>

        {/* Document preview — staged */}
        <StageModal
          open={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          eyebrow="Aperçu du document"
          title={previewDoc?.name || 'Aperçu'}
          subtitle={previewDoc
            ? `${getDocTypeLabel(previewDoc.type)}${fmtDocSize(previewDoc.size) ? ` · ${fmtDocSize(previewDoc.size)}` : ''}`
            : undefined}
          icon={Eye}
          hue={accent}
          accent={modalAccent}
          maxWidth="max-w-3xl"
          centered
          bodyClassName="pt-2"
          footer={
            <>
              <button type="button" className={cn(stageBtns.ghost, 'mr-auto')} onClick={() => setPreviewDoc(null)}>
                Fermer
              </button>
              <button
                type="button"
                className={stageBtns.ghost}
                onClick={() => { const u = previewDoc && resolveMediaUrl(previewDoc.url); if (u) window.open(u, '_blank') }}
              >
                <ExternalLink size={14} /> Ouvrir dans un onglet
              </button>
              <button type="button" className={stageBtns.primary} onClick={() => previewDoc && handleDocDownload(previewDoc)}>
                <Download size={14} /> Télécharger
              </button>
            </>
          }
        >
          <motion.div
            initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className={cn(
                'flex min-h-[45vh] items-center justify-center overflow-hidden rounded-2xl border p-2',
                isDark ? 'border-white/[0.07] bg-white/[0.02]' : 'border-slate-200/70 bg-slate-50/80',
              )}
            >
              {previewDoc?.url && isImageDoc(previewDoc) ? (
                <img
                  src={resolveMediaUrl(previewDoc.url)}
                  alt={previewDoc.name}
                  className="max-h-[60vh] max-w-full rounded-xl object-contain"
                />
              ) : previewDoc?.url ? (
                <iframe
                  src={resolveMediaUrl(previewDoc.url)}
                  title={previewDoc.name}
                  className="h-[60vh] w-full rounded-xl bg-white"
                />
              ) : (
                <div className={`flex flex-col items-center justify-center py-12 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <FileText size={32} className="mb-3 opacity-40" />
                  <p className="text-sm font-semibold">Aperçu non disponible pour ce type de fichier</p>
                </div>
              )}
            </div>
          </motion.div>
        </StageModal>

        {/* Document delete confirmation — staged */}
        <StageModal
          open={!!docToDelete}
          onClose={() => setDocToDelete(null)}
          eyebrow="Action irréversible"
          title="Supprimer le document"
          subtitle={docToDelete?.name}
          icon={Trash2}
          hue={RED_HUE}
          accent="#FB7185"
          maxWidth="max-w-md"
          centered
          bodyClassName="pt-2"
          footer={
            <>
              <button type="button" className={stageBtns.ghost} onClick={() => setDocToDelete(null)} disabled={docDeleting}>
                Annuler
              </button>
              <button
                type="button"
                disabled={docDeleting}
                onClick={handleDocDelete}
                className={stageDangerPrimary}
              >
                {docDeleting ? (
                  <><Loader size={14} className="animate-spin" /> Suppression...</>
                ) : (
                  <><Trash2 size={14} /> Supprimer</>
                )}
              </button>
            </>
          }
        >
          {docToDelete && (
            <motion.div
              initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className={modalDangerPanel}
            >
              <OrbIcon icon={FileText} hue={RED_HUE} size={38} radius={12} />
              <div className="min-w-0">
                <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Voulez-vous vraiment supprimer <strong>{docToDelete.name}</strong> ?
                </p>
                <p className={`mt-1 text-xs leading-relaxed ${isDark ? 'text-rose-200/70' : 'text-rose-700/80'}`}>
                  Le document sera définitivement retiré de ce contrat. Cette action est irréversible.
                </p>
              </div>
            </motion.div>
          )}
        </StageModal>

        {/* Delete contract confirmation — staged */}
        <StageModal
          open={deleteDialog}
          onClose={() => setDeleteDialog(false)}
          eyebrow="Action irréversible"
          title="Supprimer le contrat"
          subtitle={`Contrat ${contract.reference} · ${CONTRACT_TYPE_LABELS[contract.type]}`}
          icon={AlertTriangle}
          hue={RED_HUE}
          accent="#FB7185"
          maxWidth="max-w-md"
          centered
          bodyClassName="pt-2"
          footer={
            <>
              <button type="button" className={stageBtns.ghost} onClick={() => setDeleteDialog(false)} disabled={deleting}>
                Annuler
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className={stageDangerPrimary}
              >
                {deleting ? (
                  <><Loader size={14} className="animate-spin" /> Suppression...</>
                ) : (
                  <><Trash2 size={14} /> Supprimer définitivement</>
                )}
              </button>
            </>
          }
        >
          <motion.div
            initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-3"
          >
            <div className={modalDangerPanel}>
              <OrbIcon icon={Trash2} hue={RED_HUE} size={38} radius={12} />
              <div className="min-w-0">
                <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Voulez-vous vraiment supprimer le contrat <span className="font-mono">{contract.reference}</span> ?
                </p>
                <p className={`mt-1 text-xs leading-relaxed ${isDark ? 'text-rose-200/70' : 'text-rose-700/80'}`}>
                  Cette action est irréversible — toutes les données liées disparaîtront.
                </p>
              </div>
            </div>
            <ul className="space-y-1.5 px-1" role="list">
              {[
                'Le contrat et ses documents seront définitivement supprimés.',
                'Pour une location saisonnière : réservation annulée, les jours redeviennent disponibles et le voyageur repasse en « En recherche / Brouillon ».',
                'Le registre des mandats lié au contrat sera supprimé.',
              ].map((line, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.07, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className={cn('flex items-start gap-2 text-xs leading-relaxed', isDark ? 'text-slate-300' : 'text-slate-600')}
                >
                  <span
                    className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: RED_HUE.line, boxShadow: `0 0 6px ${RED_HUE.glow}` }}
                  />
                  <span>{line}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </StageModal>
      </div>
    </Stage>
  )
}
