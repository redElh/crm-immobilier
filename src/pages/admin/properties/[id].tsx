import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Select } from '../../../components/ui/Select'
import { Input } from '../../../components/ui/Input'
import { Textarea } from '../../../components/ui/Textarea'
import { PropertyGallery } from '../../../components/modules/properties/PropertyGallery'
import { PropertyMediaGallery } from '../../../components/modules/properties/PropertyMediaGallery'
import { PropertyDetails } from '../../../components/modules/properties/PropertyDetails'
import { PropertyDocuments } from '../../../components/modules/properties/PropertyDocuments'
import { PropertyTimeline } from '../../../components/modules/properties/PropertyTimeline'
import { PropertyMatching } from '../../../components/modules/properties/PropertyMatching'
import { PropertySeasonal } from '../../../components/modules/properties/PropertySeasonal'
import { PropertyPlanMap } from '../../../components/modules/properties/PropertyPlanMap'
import { PropertyTransfer } from '../../../components/modules/properties/PropertyTransfer'
import { PropertySocial } from '../../../components/modules/properties/PropertySocial'
import { PropertyKeys } from '../../../components/modules/properties/PropertyKeys'
import { PropertyTransactionsTab } from '../../../components/modules/properties/PropertyTransactionsTab'
import { PropertyContractsTab } from '../../../components/modules/properties/PropertyContractsTab'
import PropertyInterior from '../../../components/modules/properties/PropertyInterior'
import PropertyExterior from '../../../components/modules/properties/PropertyExterior'
import PropertyEquipment from '../../../components/modules/properties/PropertyEquipment'
import PropertyProximities from '../../../components/modules/properties/PropertyProximities'
import PropertyCommercial from '../../../components/modules/properties/PropertyCommercial'
import PropertyLand from '../../../components/modules/properties/PropertyLand'
import PropertyOwnerDetail from '../../../components/modules/properties/PropertyOwnerDetail'
import PropertyInventory from '../../../components/modules/properties/PropertyInventory'
import { PROPERTY_TYPE_LABELS, TRANSACTION_TYPE_LABELS, STATUS_LABELS } from '../../../types/property'
import {
  Info, DollarSign, FileText, Users, Clock, Map, Heart, Globe, Sun, Image as ImageIcon, Key,
  Edit3, ExternalLink, Phone, Mail, MessageSquare, BookOpen, Repeat, Trash2, RefreshCw,
  AlertTriangle, ChevronDown, Shield, CheckCircle, User, ArrowLeft,
  Briefcase, Grid as GridIcon, MapPin, Home, List, Percent, Maximize2, Droplet, Layers, Activity
} from 'react-feather'
import { AGENTS, ADMINS } from './mockData';
import { ConfidentialProvider } from '../../../components/modules/confidentiality/ConfidentialContext';
import { ConfidentialBanner } from '../../../components/modules/confidentiality/ConfidentialBanner';
import { ConfidentialValue } from '../../../components/modules/confidentiality/ConfidentialField';
import { PermissionValue } from '../../../components/modules/confidentiality/PermissionLocked';
import { usePermission } from '../../../hooks/usePermission';
import { api } from '../../../services/api'
import { fetchPropertyById, deleteProperty, reassignProperty } from '../../../services/propertyService'
import { useToast } from '../../../components/ui/Toast'
import { PropertyCompletionModal } from '../../../components/modules/properties/PropertyCompletionModal'
import {
  STAGE_HUES, SLATE_HUE, useStageTheme, useStageAccent, OrbIcon,
  StageButton, StageBadge, ShimmerProgress, type StageHue,
} from '../../../components/dashboard/Stage'
import StageModal, { useStageModalButtons } from '../../../components/modules/calendar/StageModal'
import { stagePillStyle } from '../../../components/modules/prospects/ProspectDetailStage'
import { cn } from '../../../lib/utils'

const STATUS_BY_TYPE: Record<string, string[]> = {
  residential: ['for_sale', 'for_rent', 'mandate_pending', 'negotiation', 'under_compromise', 'signing', 'sold', 'rented', 'withdrawn'],
  commercial: ['for_sale_or_rent', 'negotiation', 'under_promise', 'sold_or_rented', 'withdrawn'],
  land: ['for_sale', 'under_promise', 'urbanism', 'sold', 'withdrawn'],
  vacation: ['available', 'option', 'reserved', 'occupied', 'unavailable', 'withdrawn'],
  luxury: ['for_sale_or_rent', 'confidential', 'negotiation', 'sold_or_rented', 'withdrawn'],
};

const STATUS_BY_TRANSACTION: Record<string, string[]> = {
  vente: ['for_sale', 'mandate_pending', 'negotiation', 'under_compromise', 'sold', 'withdrawn'],
  location_ld: ['for_rent', 'mandate_pending', 'signing', 'rented', 'withdrawn'],
  location_saisonniere: ['available', 'option', 'reserved', 'occupied', 'unavailable', 'withdrawn'],
};

const TYPE_HUE_MAP: Record<string, StageHue> = {
  residential: STAGE_HUES.sky,
  commercial: STAGE_HUES.amber,
  land: STAGE_HUES.emerald,
  vacation: STAGE_HUES.fuchsia,
  luxury: STAGE_HUES.violet,
};

const STATUS_HUE_MAP: Record<string, StageHue> = {
  for_sale: STAGE_HUES.emerald,
  for_rent: STAGE_HUES.emerald,
  for_sale_or_rent: STAGE_HUES.emerald,
  mandate_pending: STAGE_HUES.amber,
  negotiation: STAGE_HUES.amber,
  under_compromise: STAGE_HUES.fuchsia,
  under_promise: STAGE_HUES.fuchsia,
  signing: STAGE_HUES.amber,
  sold: STAGE_HUES.sky,
  rented: STAGE_HUES.violet,
  sold_or_rented: STAGE_HUES.sky,
  available: STAGE_HUES.emerald,
  option: STAGE_HUES.amber,
  reserved: STAGE_HUES.fuchsia,
  occupied: STAGE_HUES.violet,
  unavailable: SLATE_HUE,
  confidential: SLATE_HUE,
  urbanism: STAGE_HUES.amber,
  withdrawn: { a: '#F87171', b: '#B91C1C', glow: 'rgba(248,113,113,0.4)', line: '#F87171' },
};

const TRANS_HUE_MAP: Record<string, StageHue> = {
  vente: STAGE_HUES.emerald,
  location_ld: STAGE_HUES.sky,
  location_saisonniere: STAGE_HUES.amber,
};

const DANGER_HUE: StageHue = {
  a: '#FB7185',
  b: '#E11D48',
  glow: 'rgba(244,63,94,0.45)',
  line: '#F43F5E',
};

function SpecCell({
  icon: Icon, hue, label, value,
}: {
  icon: any;
  hue: StageHue;
  label: string;
  value: string;
}) {
  return (
    <div className="stage-glass flex items-center gap-2.5 px-3 py-2.5">
      <OrbIcon icon={Icon} hue={hue} size={30} radius={9} />
      <div className="min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
        <p className="truncate text-sm font-extrabold" style={{ color: 'var(--text-primary)' }}>{value}</p>
      </div>
    </div>
  );
}

function PropertySummaryCard({ property, isDark, hue }: { property: any; isDark: boolean; hue: StageHue }) {
  const statusKey = STATUS_LABELS[property.status as keyof typeof STATUS_LABELS] || property.status || '—';
  const statusHue = STATUS_HUE_MAP[property.status] || hue;
  const price = property.prixSurDemande
    ? 'Prix sur demande'
    : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(property.prixNetVendeur || property.price || 0);
  return (
    <div className={cn('flex items-center gap-3 rounded-2xl border p-3', isDark ? 'border-white/[0.08] bg-white/[0.03]' : 'border-orange-900/10 bg-white/70')}>
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl text-sm font-bold text-white"
        style={{ background: `linear-gradient(145deg, ${hue.a}, ${hue.b})`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35), 0 8px 18px -8px ${hue.glow}` }}
      >
        {property.images?.[0]
          ? <img src={property.images[0]} alt="" className="h-full w-full object-cover" />
          : <Home size={16} />}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>{property.title || 'Bien sans titre'}</p>
        <p className={cn('truncate text-xs', isDark ? 'text-slate-400' : 'text-orange-900/55')}>
          {[property.reference, property.city, price].filter(Boolean).join(' · ')}
        </p>
      </div>
      <span className="shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold" style={stagePillStyle(statusHue, isDark)}>
        {statusKey}
      </span>
    </div>
  );
}

interface TabItem {
  id: string
  label: string
  icon: React.ReactNode
}

export default function AdminPropertyPage() {
  const { id, adminId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const canSeeName = usePermission('biens-afficher-nom-contact')
  const canSeeCoords = usePermission('biens-afficher-coordonnees-contact')
  const canWrite = usePermission('biens-ecriture')
  const canSeeTransfert = usePermission('biens-transfert')
  const canExport = usePermission('biens-commercial-export')
  const [activeTab, setActiveTab] = useState('informations')
  const [showExtra, setShowExtra] = useState(() => localStorage.getItem('showExtra') === 'true')

  useEffect(() => {
    localStorage.setItem('showExtra', String(showExtra))
  }, [showExtra])
  const [liked, setLiked] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showVariables, setShowVariables] = useState(false)
  const [previewText, setPreviewText] = useState('')

  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [reassignNote, setReassignNote] = useState('');
  const [sendNotification, setSendNotification] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [property, setProperty] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [currentAgent, setCurrentAgent] = useState('')
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [isGerant, setIsGerant] = useState(false);
  const theme = useStageTheme();
  const isDark = theme === 'dark';
  const accent = useStageAccent();
  const btns = useStageModalButtons();
  const ghostBtn = cn(btns.ghost, isDark ? '' : '!border-orange-900/12 !text-orange-900/70 hover:!bg-white hover:!text-orange-900');

  useEffect(() => {
    api.get<any>('/auth/me')
      .then(u => {
        if (!u) return;
        setCurrentAgent(`${u.first_name || ''} ${u.last_name || ''}`.trim())
        setIsGerant(u.role === 'gerant')
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    api.get<any[]>('/admin/users').then(setUsers).catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchPropertyById(id)
      .then(setProperty)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const COLORS = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500', 'bg-cyan-500', 'bg-pink-500'];

  const findPerson = (agentId?: string) => {
    if (!agentId) return undefined;
    const user = users.find(u => String(u.id) === agentId && u.status !== 'supprimé');
    if (user) {
      const initials = `${(user.first_name || '')[0]}${(user.last_name || '')[0]}`.toUpperCase() || '?';
      const color = COLORS[Math.abs(Number(user.id) || user.id.length) % COLORS.length];
      return { name: `${user.first_name || ''} ${user.last_name || ''}`.trim(), initials, color, role: user.role, position: user.position };
    }
    const agent = AGENTS.find(a => a.id === agentId);
    if (agent) return { ...agent, role: 'agent' };
    const admin = ADMINS.find(a => a.id === agentId);
    if (admin) return { ...admin, role: 'admin' };
    return undefined;
  };

  const getAgentName = (agentId?: string) => {
    if (!agentId) return 'Non assigne';
    const person = findPerson(agentId);
    return person ? person.name : 'Ancien agent';
  };

  const isOtherAdmin = (agentId?: string) => {
    if (!agentId || agentId === adminId) return false;
    if (ADMINS.some(a => a.id === agentId)) return true;
    const user = users.find(u => String(u.id) === agentId);
    return user ? user.role === 'admin' : false;
  };

  const handleStatusChange = async () => {
    if (!property || newStatus === property.status) return;
    try {
      const updated = await api.patch<any>(`/properties/${property.id}/status`, { status: newStatus });
      setProperty((prev: any) => ({ ...prev, ...updated }));
      setShowStatusDialog(false);
      toast('success', 'Statut mis à jour avec succès');
    } catch (e: any) {
      toast('error', e.message || 'Erreur lors de la mise à jour du statut');
    }
  };

  const handleReassign = async () => {
    if (!selectedAgent || !id) return;
    try {
      const updated = await reassignProperty(id, selectedAgent, reassignNote);
      setProperty((prev: any) => ({ ...prev, ...updated }));
      setShowReassignDialog(false);
      setSelectedAgent('');
      setReassignNote('');
      setSendNotification(false);
      toast('success', 'Bien réaffecté avec succès');
    } catch (e: any) {
      toast('error', e.message || 'Erreur lors de la réaffectation');
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm !== 'SUPPRIMER' || !id) return;
    try {
      await deleteProperty(id);
      setShowDeleteDialog(false);
      setDeleteConfirm('');
      toast('success', 'Bien supprimé avec succès');
      navigate(`/admin/${adminId}/properties`, { replace: true });
    } catch (e: any) {
      toast('error', e.message || 'Erreur lors de la suppression');
    }
  };

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(p)
  const isSeasonal = property?.transactionType === 'location_saisonniere'
  const displayPrice = property?.transactionType === 'location_ld'
    ? (property?.loyerHC || 0)
    : isSeasonal
      ? (property?.seasonalPriceMin || 0)
      : (property?.prixNetVendeur && property?.honorairesPct && property?.honorairesType === 'inclus'
        ? Math.round(Number(property.prixNetVendeur) * (1 + Number(property.honorairesPct) / 100))
        : (property?.prixNetVendeur || property?.price || 0))

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <motion.div
          className="h-11 w-11 rounded-full border-[3px]"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
          style={{ borderColor: `${accent.a}30`, borderTopColor: accent.a, filter: `drop-shadow(0 0 14px ${accent.glow})` }}
        />
        <p className={cn('text-xs font-semibold uppercase tracking-[0.22em]', isDark ? 'text-slate-500' : 'text-orange-900/45')}>
          Chargement du dossier…
        </p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <OrbIcon icon={AlertTriangle} hue={STAGE_HUES.amber} size={52} radius={16} />
        <p className={cn('mt-1 font-bold', isDark ? 'text-white' : 'text-slate-900')}>Bien introuvable</p>
        <StageButton variant="glass" icon={<ArrowLeft size={14} />} onClick={() => navigate(`/admin/${adminId}/properties`)}>
          Retour aux biens
        </StageButton>
      </div>
    );
  }

  const statusLabel = STATUS_LABELS[property.status as keyof typeof STATUS_LABELS]
  const typeLabel = PROPERTY_TYPE_LABELS[property.propertyType as keyof typeof PROPERTY_TYPE_LABELS]
  const transactionLabel = TRANSACTION_TYPE_LABELS[property.transactionType as keyof typeof TRANSACTION_TYPE_LABELS]
  const completion = property.completion

  const ink = isDark ? accent.a : accent.b
  const typeHue = TYPE_HUE_MAP[property.propertyType] || accent
  const statusHue = STATUS_HUE_MAP[property.status] || SLATE_HUE
  const transHue = TRANS_HUE_MAP[property.transactionType] || accent
  const completionHue = completion == null ? null
    : completion >= 80 ? STAGE_HUES.emerald
      : completion >= 50 ? STAGE_HUES.amber
        : DANGER_HUE
  const canManage = !isOtherAdmin(property.agentId)
  const agentPerson = property.agentId ? findPerson(property.agentId) : undefined
  const agentRoleHue = agentPerson?.role === 'agent'
    ? STAGE_HUES.emerald
    : agentPerson?.role === 'gerant'
      ? STAGE_HUES.amber
      : STAGE_HUES.violet
  const agentRoleLabel = agentPerson?.role === 'admin'
    ? 'Admin responsable'
    : agentPerson?.role === 'gerant'
      ? 'Gérant responsable'
      : 'Agent responsable'

  const ownerType = property.ownerType;
  let ownerDisplayName = property.owner?.name || '';
  let ownerInitials = '';
  if (ownerType === 'societe') {
    ownerDisplayName = property.company?.name || property.owner?.name || '';
    ownerInitials = ownerDisplayName.split(' ').filter(Boolean).map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  } else {
    const firstName = property.owner_firstName || property.owner?.firstName || '';
    const lastName = property.owner_lastName || property.owner?.lastName || '';
    ownerDisplayName = [firstName, lastName].filter(Boolean).join(' ') || property.owner?.name || '';
    ownerInitials = ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase();
    if (!ownerInitials) ownerInitials = ownerDisplayName.split(' ').filter(Boolean).map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  }

  const mainTabs: TabItem[] = [
    { id: 'informations', label: 'Informations', icon: <Info size={15} /> },
    { id: 'media', label: 'Photos/Médias', icon: <ImageIcon size={15} /> },
    { id: 'plan', label: 'Plan/Carte', icon: <Map size={15} /> },
    ...(property.propertyType === 'vacation' ? [{ id: 'saisonnier', label: 'Saisonnier', icon: <Sun size={15} /> } as TabItem] : []),
  ]
  const extraTabs: TabItem[] = [
    { id: 'proprietaire', label: 'Propriétaire', icon: <User size={15} /> },
    ...(property.furnishing === 'meuble' ? [{ id: 'inventaire', label: 'Inventaire', icon: <List size={15} /> }] : []),
    { id: 'interieur', label: 'Interieur', icon: <Home size={15} /> },
    { id: 'exterieur', label: 'Exterieur', icon: <Sun size={15} /> },
    { id: 'equipements', label: 'Equipements', icon: <GridIcon size={15} /> },
    { id: 'proximites', label: 'Proximites', icon: <MapPin size={15} /> },
  ]
  const restTabs: TabItem[] = [
    ...(property.propertyType === 'commercial' ? [{ id: 'commercial', label: 'Commercial', icon: <Briefcase size={15} /> } as TabItem] : []),
    ...(property.propertyType === 'land' ? [{ id: 'terrain', label: 'Terrain', icon: <MapPin size={15} /> } as TabItem] : []),
    { id: 'documents', label: 'Documents', icon: <FileText size={15} /> },
    { id: 'historique', label: 'Historique', icon: <Clock size={15} /> },
    ...((['vente', 'location_ld', 'location_saisonniere'].includes(property.transactionType)) ? [{ id: 'matching', label: 'Matching', icon: <Users size={15} /> } as TabItem] : []),
    ...(canSeeTransfert ? [{ id: 'transfert', label: 'Transfert', icon: <Globe size={15} /> } as TabItem] : []),
    { id: 'cles', label: 'Cles', icon: <Key size={15} /> },
    { id: 'transactions', label: 'Transactions', icon: <BookOpen size={15} /> },
    { id: 'contrats', label: 'Contrats', icon: <FileText size={15} /> },
  ]

  return (
    <ConfidentialProvider>
    <div className="space-y-5 animate-fade-in pb-10">
      {/* Top bar */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <motion.button
          type="button"
          onClick={() => navigate(`/admin/${adminId}/properties`)}
          whileHover="hover"
          whileTap={{ scale: 0.96 }}
          title="Retour aux biens"
          className={cn(
            'group/back relative flex h-9 shrink-0 items-center gap-2 overflow-hidden rounded-xl border pl-2.5 pr-4 text-xs font-bold backdrop-blur-md transition-all',
            isDark
              ? 'border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/20 hover:bg-white/10 hover:text-white'
              : 'border-orange-900/10 bg-white/70 text-orange-900/55 shadow-sm hover:border-orange-900/20 hover:bg-white hover:text-orange-900',
          )}
        >
          <motion.span
            className="flex h-6 w-6 items-center justify-center rounded-lg"
            style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.05)' }}
            variants={{ hover: { x: -3 } }}
            transition={{ type: 'spring', stiffness: 500, damping: 28 }}
          >
            <ArrowLeft size={14} style={{ color: ink }} />
          </motion.span>
          <span>Retour aux biens</span>
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
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-xl border backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95',
              isDark
                ? 'border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/20 hover:bg-white/10 hover:text-white'
                : 'border-orange-900/10 bg-white/70 text-orange-900/50 shadow-sm hover:bg-white hover:text-orange-900',
            )}
          >
            <Heart size={15} fill={liked ? 'currentColor' : 'none'} className={liked ? 'text-rose-500' : ''} />
          </motion.button>
          {canWrite && (
            <StageButton
              variant="primary"
              size="md"
              icon={<Edit3 size={13} />}
              onClick={() => navigate(`/admin/${adminId}/properties/type/${property.propertyType}/edit/${id}`)}
            >
              Modifier
            </StageButton>
          )}
          {canExport && (
            <StageButton variant="glass" size="md" icon={<ExternalLink size={13} />}>
              Partager
            </StageButton>
          )}
          <button
            type="button"
            onClick={() => { setDeleteConfirm(''); setDeleteReason(''); setShowDeleteDialog(true) }}
            className={cn(
              'inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold backdrop-blur-md transition-all duration-200 hover:scale-[1.02] active:scale-95',
              isDark
                ? 'border-rose-400/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:text-rose-200'
                : 'border-rose-200/80 bg-rose-50/70 text-rose-600 shadow-sm hover:bg-rose-50 hover:text-rose-700',
            )}
          >
            <Trash2 size={13} /> Supprimer
          </button>
        </div>
      </motion.div>

      {/* Admin actions bar */}
      {canManage && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="stage-glass relative overflow-hidden !rounded-[20px] px-3.5 py-2.5"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="mr-1 inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em]"
              style={{ color: ink }}
            >
              <Shield size={13} /> Actions administrateur
            </span>
            {[
              { label: 'Réaffecter', icon: Repeat, onClick: () => { setSelectedAgent(property.agentId || ''); setShowReassignDialog(true) } },
              { label: 'Changer le statut', icon: RefreshCw, onClick: () => { setNewStatus(property.status); setShowStatusDialog(true) } },
            ].map(({ label, icon: Icon, onClick }) => (
              <button
                key={label}
                type="button"
                onClick={onClick}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-bold backdrop-blur-md transition-all duration-200 hover:scale-[1.02] active:scale-95',
                  isDark
                    ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10 hover:text-white'
                    : 'border-orange-900/10 bg-white/70 text-orange-900/65 shadow-sm hover:bg-white hover:text-orange-900',
                )}
              >
                <Icon size={13} /> {label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => { setDeleteConfirm(''); setDeleteReason(''); setShowDeleteDialog(true) }}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-bold backdrop-blur-md transition-all duration-200 hover:scale-[1.02] active:scale-95',
                isDark
                  ? 'border-rose-400/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:text-rose-200'
                  : 'border-rose-200/80 bg-rose-50/70 text-rose-600 shadow-sm hover:bg-rose-50 hover:text-rose-700',
              )}
            >
              <Trash2 size={13} /> Supprimer
            </button>
            <span
              className="ml-auto inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em]"
              style={stagePillStyle(statusHue, isDark)}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusHue.line }} />
              {statusLabel}
            </span>
          </div>
        </motion.div>
      )}

      {/* Hero section */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        {/* Gallery */}
        <motion.div
          className="space-y-3 lg:col-span-3"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <PropertyMediaGallery property={property} editable={canWrite} variant="carousel" onUpdated={(p) => setProperty(p)} />
          <ConfidentialBanner isGerant={isGerant} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SpecCell icon={Maximize2} hue={typeHue} label="Surface" value={`${property.surface || 0} m²`} />
            <SpecCell icon={Home} hue={STAGE_HUES.sky} label="Chambres" value={`${(property as any).bedrooms_total ?? property.bedrooms ?? 0}`} />
            <SpecCell icon={Droplet} hue={STAGE_HUES.fuchsia} label="Salles de bain" value={`${(property as any).bathroom_count ?? property.bathrooms ?? 0}`} />
            {property.sleepingCapacity ? (
              <SpecCell icon={Users} hue={STAGE_HUES.emerald} label="Couchages" value={`${property.sleepingCapacity}`} />
            ) : property.landSize ? (
              <SpecCell icon={Layers} hue={STAGE_HUES.emerald} label="Terrain" value={`${property.landSize} m²`} />
            ) : (
              <SpecCell icon={GridIcon} hue={SLATE_HUE} label="Type" value={typeLabel || '—'} />
            )}
          </div>
        </motion.div>

        {/* Quick info card */}
        <motion.div
          className="space-y-3 lg:col-span-2"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="stage-glass relative overflow-hidden p-5">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full"
              style={{ background: `radial-gradient(circle, ${accent.glow.replace(/[\d.]+\)$/, '0.18)')}, transparent 70%)` }}
            />
            <div className="relative flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className={cn('font-mono text-[11px] font-semibold tracking-wider', isDark ? 'text-slate-500' : 'text-orange-900/45')}>
                  {property.reference}
                </span>
                {property.originalPropertyId ? (
                  <StageBadge variant="warn">Copie</StageBadge>
                ) : (
                  <StageBadge variant="violet">Original</StageBadge>
                )}
              </div>
              <span
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{
                  color: statusHue.line,
                  borderColor: `${statusHue.a}44`,
                  backgroundColor: `${statusHue.a}14`,
                  boxShadow: `0 0 14px ${statusHue.glow}`,
                }}
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ backgroundColor: statusHue.line }} />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusHue.line, boxShadow: `0 0 6px ${statusHue.line}` }} />
                </span>
                {statusLabel}
              </span>
            </div>

            <h1
              className="relative mt-2.5 bg-clip-text text-[22px] font-extrabold leading-tight tracking-[-0.4px] text-transparent"
              style={{ backgroundImage: `linear-gradient(100deg, ${accent.a}, ${accent.b})` }}
            >
              {property.title}
            </h1>

            <div className="relative mt-2 flex items-center gap-1.5">
              <MapPin size={13} style={{ color: typeHue.a }} />
              <span className={cn('text-sm font-medium', isDark ? 'text-slate-300' : 'text-slate-600')}>
                {property.city}{property.district ? `, ${property.district}` : ''}
              </span>
            </div>

            <div className="relative mt-4 border-t pt-4" style={{ borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)' }}>
              {property.prixSurDemande ? (
                <p
                  className="bg-clip-text text-[26px] font-extrabold tracking-tight text-transparent"
                  style={{ backgroundImage: `linear-gradient(100deg, ${accent.a}, ${accent.b})` }}
                >
                  Prix sur demande
                </p>
              ) : isSeasonal && (property.seasonalPriceMin || property.seasonalPriceMax) ? (
                <p className="flex items-baseline gap-1.5">
                  <ConfidentialValue>
                    <span
                      className="bg-clip-text text-[26px] font-extrabold tracking-tight text-transparent"
                      style={{ backgroundImage: `linear-gradient(100deg, ${accent.a}, ${accent.b})` }}
                    >
                      {property.seasonalPriceMin ? formatPrice(property.seasonalPriceMin) : '?'} ~ {property.seasonalPriceMax ? formatPrice(property.seasonalPriceMax) : '?'}
                    </span>
                  </ConfidentialValue>
                  <span className={cn('text-sm font-semibold', isDark ? 'text-slate-400' : 'text-slate-500')}>/nuit</span>
                </p>
              ) : (
                <p className="flex items-baseline gap-1.5">
                  <ConfidentialValue>
                    <span
                      className="bg-clip-text text-[28px] font-extrabold tracking-tight text-transparent"
                      style={{ backgroundImage: `linear-gradient(100deg, ${accent.a}, ${accent.b})` }}
                    >
                      {formatPrice(displayPrice)}
                    </span>
                  </ConfidentialValue>
                  {property.transactionType === 'location_ld' && (
                    <span className={cn('text-sm font-semibold', isDark ? 'text-slate-400' : 'text-slate-500')}>/mois</span>
                  )}
                </p>
              )}
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <StageBadge variant="neutral">{typeLabel}</StageBadge>
                <span
                  className="inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                  style={{
                    color: transHue.line,
                    borderColor: `${transHue.a}38`,
                    backgroundColor: `${transHue.a}12`,
                  }}
                >
                  {transactionLabel}
                </span>
              </div>
            </div>

            {property.priceEstimate && (
              <div
                className="relative mt-3.5 flex items-start gap-2.5 rounded-xl border p-3"
                style={{
                  borderColor: isDark ? 'rgba(251,191,36,0.25)' : 'rgba(180,83,9,0.20)',
                  background: isDark ? 'rgba(251,191,36,0.07)' : 'rgba(254,243,199,0.55)',
                }}
              >
                <OrbIcon icon={Percent} hue={STAGE_HUES.amber} size={30} radius={9} />
                <div className="min-w-0">
                  <p className={cn('text-xs font-semibold', isDark ? 'text-amber-200' : 'text-amber-800')}>
                    Estimation&nbsp;: <ConfidentialValue>{formatPrice(property.priceEstimate)}</ConfidentialValue>
                  </p>
                  <p className={cn('mt-0.5 text-[10px]', isDark ? 'text-amber-300/60' : 'text-amber-700/70')}>
                    <ConfidentialValue>
                      {property.priceEstimate > property.price
                        ? 'Sous-estimé par rapport au marché'
                        : 'Sur-estimé par rapport au marché'}
                    </ConfidentialValue>
                  </p>
                </div>
              </div>
            )}

            <div className="relative mt-4 border-t pt-4" style={{ borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)' }}>
              {completion != null && completionHue ? (
                <button
                  type="button"
                  onClick={canWrite ? () => setShowCompletionModal(true) : undefined}
                  className={cn('group block w-full text-left', canWrite ? 'cursor-pointer' : 'cursor-default')}
                  title={canWrite ? 'Modifier la complétion' : undefined}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className={cn('text-[10px] font-bold uppercase tracking-[0.18em]', isDark ? 'text-slate-500' : 'text-orange-900/45')}>
                      Dossier de complétion
                    </span>
                    <span className="text-sm font-extrabold tabular-nums" style={{ color: completionHue.a }}>{completion}%</span>
                  </div>
                  <ShimmerProgress pct={completion} colorFrom={completionHue.a} colorTo={completionHue.b} glow={completionHue.glow} height={7} />
                </button>
              ) : canWrite ? (
                <button
                  type="button"
                  onClick={() => setShowCompletionModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-dashed px-2.5 py-1.5 text-[11px] font-semibold transition-colors"
                  style={{
                    borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.18)',
                    color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(15,23,42,0.45)',
                  }}
                >
                  <Percent size={12} /> Définir la complétion
                </button>
              ) : (
                <span
                  className="inline-flex items-center gap-1.5 rounded-lg border border-dashed px-2.5 py-1.5 text-[11px] font-semibold"
                  style={{
                    borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.18)',
                    color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(15,23,42,0.35)',
                  }}
                >
                  <Percent size={12} /> Complétion non définie
                </span>
              )}
            </div>
          </div>

          {/* Owner quick card */}
          <div className="stage-glass p-4">
            <p className={cn('mb-2.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em]', isDark ? 'text-slate-500' : 'text-orange-900/45')}>
              <User size={11} /> Propriétaire{ownerType === 'societe' ? ' · Société' : ''}
            </p>
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-sm font-extrabold"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${typeHue.a}26, ${typeHue.b}14)`,
                  borderColor: `${typeHue.a}33`,
                  color: typeHue.a,
                  boxShadow: `0 4px 14px ${typeHue.glow}`,
                }}
              >
                {ownerInitials || '—'}
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn('truncate text-sm font-bold', isDark ? 'text-white' : 'text-slate-900')}>
                  <ConfidentialValue><PermissionValue allowed={canSeeName && canSeeCoords}>{ownerDisplayName || 'Non renseigné'}</PermissionValue></ConfidentialValue>
                </p>
                <p className={cn('truncate text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>
                  <ConfidentialValue><PermissionValue allowed={canSeeCoords}>{property.owner?.phone ?? property.owner_phone ?? ''}</PermissionValue></ConfidentialValue>
                </p>
                <p className={cn('truncate text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>
                  <ConfidentialValue><PermissionValue allowed={canSeeCoords}>{property.owner?.email || property.owner_email || ''}</PermissionValue></ConfidentialValue>
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                {[Phone, Mail, MessageSquare].map((Icon, i) => (
                  <button
                    key={i}
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-lg border transition-all hover:scale-110',
                      isDark ? 'border-white/10 text-slate-400 hover:bg-white/10 hover:text-white' : 'border-orange-900/10 text-orange-900/50 hover:bg-orange-900/5 hover:text-orange-900',
                    )}
                  >
                    <Icon size={13} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Agent card */}
          <div className="stage-glass flex items-center gap-3 p-4">
            <OrbIcon icon={User} hue={agentRoleHue} size={40} radius={12} />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: agentRoleHue.a }}>
                {agentRoleLabel}
              </p>
              <div className="flex items-center gap-1.5">
                <p className={cn('truncate text-sm font-bold', isDark ? 'text-white' : 'text-slate-900')}>
                  {getAgentName(property.agentId)}
                </p>
                {agentPerson && (
                  <span className="shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em]" style={stagePillStyle(agentRoleHue, isDark)}>
                    {agentPerson.role === 'agent' ? (agentPerson.position || 'Agent') : agentPerson.role === 'gerant' ? 'Gérant' : 'Admin'}
                  </span>
                )}
              </div>
              {property.agentId && (
                <p className={cn('truncate text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>
                  Mandat&nbsp;: {property.mandateType || 'N/A'} · {property.mandateStatus === 'actif' ? 'Actif' : property.mandateStatus}
                </p>
              )}
            </div>
            {canManage && (
              <button
                type="button"
                onClick={() => { setSelectedAgent(property.agentId || ''); setShowReassignDialog(true) }}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1.5 text-[11px] font-bold transition-all hover:scale-[1.02] active:scale-95',
                  isDark ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10 hover:text-white' : 'border-orange-900/10 bg-white/70 text-orange-900/60 hover:bg-white hover:text-orange-900',
                )}
              >
                <Repeat size={12} /> Changer
              </button>
            )}
          </div>

          <button
            onClick={() => setShowExtra(v => !v)}
            className={cn(
              'inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition-all',
              showExtra
                ? 'text-white'
                : isDark ? 'border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/[0.07] hover:text-white' : 'border-orange-900/10 bg-white/70 text-orange-900/55 hover:bg-white hover:text-orange-900',
            )}
            style={showExtra ? {
              backgroundImage: `linear-gradient(145deg, ${accent.a}, ${accent.b})`,
              borderColor: 'transparent',
              boxShadow: `0 8px 20px -10px ${accent.glow}`,
            } : undefined}
          >
            <ChevronDown size={13} className={`transition-transform ${showExtra ? 'rotate-180' : ''}`} />
            Plus d'infos
          </button>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="stage-glass overflow-hidden !rounded-[24px]">
        <div className="scrollbar-thin overflow-x-auto border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)' }}>
          <div className="flex w-full items-center justify-between gap-1 px-2 py-2">
            {[...mainTabs, ...restTabs].map(tab => {
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'relative flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition-colors duration-200',
                    active
                      ? 'text-white'
                      : isDark ? 'text-slate-400 hover:bg-white/[0.05] hover:text-white' : 'text-orange-900/50 hover:bg-orange-900/[0.04] hover:text-orange-900',
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="adminPropTab"
                      className="absolute inset-0 rounded-xl"
                      style={{ backgroundImage: `linear-gradient(145deg, ${accent.a}, ${accent.b})`, boxShadow: `0 8px 20px -10px ${accent.glow}` }}
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative flex items-center gap-1.5">{tab.icon}{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
        {showExtra && (
          <div
            className="flex flex-wrap gap-1.5 border-b px-3 py-2.5"
            style={{
              borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)',
              background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(15,23,42,0.015)',
            }}
          >
            {extraTabs.map(tab => {
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-all',
                    active
                      ? 'text-white'
                      : isDark ? 'border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.07] hover:text-white' : 'border-orange-900/10 bg-white/60 text-orange-900/55 hover:bg-white hover:text-orange-900',
                  )}
                  style={active ? {
                    backgroundImage: `linear-gradient(145deg, ${accent.a}, ${accent.b})`,
                    borderColor: 'transparent',
                    boxShadow: `0 6px 16px -10px ${accent.glow}`,
                  } : undefined}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              )
            })}
          </div>
        )}

        <div className="p-4 sm:p-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {activeTab === 'informations' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  <div className="lg:col-span-2 space-y-5">
                    <PropertyDetails property={property} showPreview={showPreview} showVariables={showVariables} previewText={previewText} isGerant={isGerant} />
                  </div>
                  <div className="space-y-4">
                    <PropertySocial property={property} onShowPreviewChange={setShowPreview} onShowVariablesChange={setShowVariables} onPreviewTextChange={setPreviewText} isGerant={isGerant} />
                  </div>
                </div>
              )}
              {activeTab === 'media' && (
                <div className="space-y-5">
                  <div>
                    <h3 className={cn('mb-4 text-[11px] font-bold uppercase tracking-[0.18em]', isDark ? 'text-slate-500' : 'text-orange-900/45')}>
                      Galerie photos & vidéos
                    </h3>
                    <PropertyMediaGallery
                      property={property}
                      editable={canWrite}
                      variant="carousel"
                      onUpdated={(p) => setProperty(p)}
                      isGerant={isGerant}
                    />
                  </div>
                </div>
              )}
              {activeTab === 'plan' && <PropertyPlanMap property={property} />}
              {activeTab === 'saisonnier' && <PropertySeasonal property={property} isGerant={isGerant} />}
              {activeTab === 'documents' && <PropertyDocuments property={property} isGerant={isGerant} />}
              {activeTab === 'historique' && <PropertyTimeline propertyId={property.id} events={property.timeline} property={property} isAdmin={true} currentAgent={currentAgent} isGerant={isGerant} />}
              {activeTab === 'proprietaire' && <PropertyOwnerDetail property={property} isGerant={isGerant} />}
              {activeTab === 'inventaire' && <PropertyInventory property={property} isGerant={isGerant} />}
              {activeTab === 'interieur' && <PropertyInterior property={property} />}
              {activeTab === 'exterieur' && <PropertyExterior property={property} />}
              {activeTab === 'equipements' && <PropertyEquipment property={property} />}
              {activeTab === 'proximites' && <PropertyProximities property={property} />}
              {activeTab === 'commercial' && <PropertyCommercial property={property} />}
              {activeTab === 'terrain' && <PropertyLand property={property} />}
              {activeTab === 'matching' && <PropertyMatching property={property} adminId={adminId} isGerant={isGerant} />}
              {activeTab === 'transfert' && <PropertyTransfer property={property} isGerant={isGerant} />}
              {activeTab === 'cles' && <PropertyKeys property={property} onUpdated={(p) => setProperty(p)} isGerant={isGerant} />}
              {activeTab === 'transactions' && (
                <PropertyTransactionsTab
                  propertyId={property.id}
                  propertyTitle={property.title}
                  propertyRef={property.reference}
                  isGerant={isGerant}
                />
              )}
              {activeTab === 'contrats' && (
                <PropertyContractsTab
                  propertyId={property.id}
                  propertyTitle={property.title}
                  isGerant={isGerant}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Reassign Dialog */}
      <StageModal
        open={showReassignDialog}
        onClose={() => setShowReassignDialog(false)}
        title="Réaffecter un bien"
        eyebrow="Attribution"
        subtitle={[property.reference, property.city].filter(Boolean).join(' · ')}
        icon={Repeat}
        hue={accent}
        maxWidth="max-w-xl"
        centered
        footer={
          <>
            <button type="button" className={ghostBtn} onClick={() => setShowReassignDialog(false)}>Annuler</button>
            <button type="button" className={btns.primary} onClick={handleReassign} disabled={!selectedAgent} style={{ opacity: selectedAgent ? 1 : 0.5 }}>
              <Repeat size={14} /> Réaffecter
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <PropertySummaryCard property={property} isDark={isDark} hue={accent} />
          <div>
            <p className={cn('mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em]', isDark ? 'text-slate-400' : 'text-orange-900/55')}>
              Responsable actuel
            </p>
            <div className="flex items-center gap-2 text-sm">
              {property.agentId ? (
                <>
                  <OrbIcon icon={User} hue={agentRoleHue} size={24} radius={7} />
                  <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>{getAgentName(property.agentId)}</span>
                </>
              ) : (
                <span className="italic text-slate-400">Non assigné</span>
              )}
            </div>
          </div>
          <div>
            <label className={cn('mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em]', isDark ? 'text-slate-400' : 'text-orange-900/55')}>
              Nouveau responsable
            </label>
            <Select
              placeholder="Sélectionner un agent"
              value={selectedAgent}
              onValueChange={(v) => setSelectedAgent(v)}
              options={users.map((u: any) => ({
                value: String(u.id),
                label: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
              }))}
            />
          </div>
          <div>
            <label className={cn('mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em]', isDark ? 'text-slate-400' : 'text-orange-900/55')}>
              Note pour l'agent
            </label>
            <Textarea
              placeholder="Je vous confie ce bien pour le suivi..."
              value={reassignNote}
              onChange={(e) => setReassignNote(e.target.value)}
            />
          </div>
          <label className={cn('flex cursor-pointer items-center gap-2 text-sm', isDark ? 'text-slate-300' : 'text-slate-600')}>
            <input type="checkbox" className="h-4 w-4 rounded border" checked={sendNotification} onChange={(e) => setSendNotification(e.target.checked)} />
            Envoyer une notification à l'agent
          </label>
        </div>
      </StageModal>

      {/* Delete Confirmation Dialog */}
      <StageModal
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="Supprimer le bien"
        eyebrow="Zone sensible"
        subtitle={[property.reference, property.city].filter(Boolean).join(' · ')}
        icon={Trash2}
        hue={DANGER_HUE}
        accent={DANGER_HUE.a}
        maxWidth="max-w-xl"
        centered
        footer={
          <>
            <button type="button" className={ghostBtn} onClick={() => setShowDeleteDialog(false)}>Annuler</button>
            <button
              type="button"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/20 bg-gradient-to-br from-rose-400 to-rose-600 px-4 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(244,63,94,0.7)] transition-all hover:brightness-110 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40"
              onClick={handleDelete}
              disabled={deleteConfirm !== 'SUPPRIMER'}
            >
              <Trash2 size={14} /> Confirmer la suppression
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <PropertySummaryCard property={property} isDark={isDark} hue={DANGER_HUE} />
          <div className={cn('rounded-2xl border p-3.5', isDark ? 'border-rose-400/25 bg-rose-500/10' : 'border-rose-200 bg-rose-50')}>
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={16} className={cn('mt-0.5 shrink-0', isDark ? 'text-rose-300' : 'text-rose-500')} />
              <div className={cn('space-y-1 text-xs', isDark ? 'text-rose-200/85' : 'text-rose-700')}>
                <p className="font-semibold">Attention — action irréversible</p>
                <ul className="list-inside list-disc space-y-0.5">
                  <li>Cette action est IRREVERSIBLE</li>
                  <li>Tous les documents associés seront supprimés</li>
                  <li>Tous les mandats liés seront supprimés</li>
                  <li>L'historique du bien sera effacé</li>
                </ul>
              </div>
            </div>
          </div>
          <div>
            <label className={cn('mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em]', isDark ? 'text-slate-400' : 'text-orange-900/55')}>
              Confirmation
            </label>
            <Input
              placeholder='Tapez "SUPPRIMER" pour confirmer'
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
            />
          </div>
          <div>
            <label className={cn('mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em]', isDark ? 'text-slate-400' : 'text-orange-900/55')}>
              Motif de suppression (optionnel)
            </label>
            <Select
              value={deleteReason}
              onValueChange={setDeleteReason}
              placeholder="Sélectionner un motif"
              options={[
                { value: 'doublon', label: 'Erreur de saisie - Doublon' },
                { value: 'vendu', label: 'Bien vendu hors agence' },
                { value: 'retire', label: 'Bien retiré par le propriétaire' },
                { value: 'autre', label: 'Autre' },
              ]}
            />
          </div>
        </div>
      </StageModal>

      {/* Change Status Dialog */}
      <StageModal
        open={showStatusDialog}
        onClose={() => setShowStatusDialog(false)}
        title="Changer le statut"
        eyebrow="Cycle de vie"
        subtitle={`${property.title || 'Bien'} · ${property.reference || ''}`}
        icon={Activity}
        hue={accent}
        maxWidth="max-w-lg"
        centered
        footer={
          <>
            <button type="button" className={ghostBtn} onClick={() => setShowStatusDialog(false)}>Annuler</button>
            <button
              type="button"
              className={btns.primary}
              onClick={handleStatusChange}
              disabled={newStatus === property.status}
              style={{ opacity: newStatus === property.status ? 0.5 : 1 }}
            >
              Changer le statut
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <PropertySummaryCard property={property} isDark={isDark} hue={accent} />
          <div>
            <p className={cn('mb-2 text-[11px] font-bold uppercase tracking-[0.14em]', isDark ? 'text-slate-400' : 'text-orange-900/55')}>
              Nouveau statut
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(STATUS_BY_TRANSACTION[property.transactionType] || Object.keys(STATUS_LABELS)).map(s => {
                const statusHue = STATUS_HUE_MAP[s] || accent
                const selected = newStatus === s
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setNewStatus(s)}
                    className={cn(
                      'rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-all duration-200 active:scale-[0.98]',
                      selected ? 'border-transparent' : isDark ? 'border-white/[0.06] bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]' : 'border-orange-900/10 bg-white/70 text-slate-600 hover:bg-white',
                    )}
                    style={selected ? stagePillStyle(statusHue, isDark) : undefined}
                  >
                    {STATUS_LABELS[s] || s}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </StageModal>

      <PropertyCompletionModal
        property={property}
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        onSaved={(updated) => setProperty(updated)}
      />
    </div>
    </ConfidentialProvider>
  )
}
