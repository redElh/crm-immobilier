import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { Dialog } from '../../../components/ui/Dialog'
import { Select } from '../../../components/ui/Select'
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
import { BackLink } from '../../../components/ui/BackLink'
import { PROPERTY_TYPE_LABELS, TRANSACTION_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS } from '../../../types/property'
import {
  Info, DollarSign, FileText, Users, Clock, Map, Heart, Globe, Sun, Image as ImageIcon, Key,
  Edit3, ExternalLink, Phone, Mail, MessageSquare, BookOpen, Repeat, Trash2, RefreshCw,
  AlertTriangle, ChevronDown, Shield, CheckCircle, User,
  Briefcase, Grid as GridIcon, MapPin, Home, List, Percent
} from 'react-feather'
import { AGENTS, ADMINS } from './mockData';
import { CompletionRing } from '../../../components/ui/CompletionRing';
import { ConfidentialProvider } from '../../../components/modules/confidentiality/ConfidentialContext';
import { ConfidentialBanner } from '../../../components/modules/confidentiality/ConfidentialBanner';
import { ConfidentialValue } from '../../../components/modules/confidentiality/ConfidentialField';
import { PermissionValue } from '../../../components/modules/confidentiality/PermissionLocked';
import { usePermission } from '../../../hooks/usePermission';
import { api } from '../../../services/api'
import { fetchPropertyById, deleteProperty, reassignProperty } from '../../../services/propertyService'
import { useToast } from '../../../components/ui/Toast'
import { PropertyCompletionModal } from '../../../components/modules/properties/PropertyCompletionModal'

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

const GERANT_STATUS_OVERRIDES: Record<string, string> = {
  mandate_pending: 'bg-[#E7D5D5] text-[#905D5D] border-[#E0C6C6]',
  negotiation: 'bg-[#E7D5D5] text-[#905D5D] border-[#E0C6C6]',
  under_compromise: 'bg-[#F0E2E2] text-[#7D5050] border-[#E0C6C6]',
  under_promise: 'bg-[#F0E2E2] text-[#7D5050] border-[#E0C6C6]',
  signing: 'bg-[#E7D5D5] text-[#905D5D] border-[#E0C6C6]',
  option: 'bg-[#E7D5D5] text-[#905D5D] border-[#E0C6C6]',
  urbanism: 'bg-[#E7D5D5] text-[#905D5D] border-[#E0C6C6]',
};
const statusColorCls = (status: string, isGerant: boolean) =>
  isGerant && GERANT_STATUS_OVERRIDES[status] ? GERANT_STATUS_OVERRIDES[status] : STATUS_COLORS[status];

const GERANT_BUTTON_CLASSES = 'bg-[#905D5D] hover:bg-[#7D5050] border-[#905D5D] hover:border-[#7D5050] text-white shadow-[0_10px_24px_rgba(144,93,93,0.35)]'

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
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [property, setProperty] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [currentAgent, setCurrentAgent] = useState('')
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [isGerant, setIsGerant] = useState(false);

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

  const getAgentInitials = (agentId?: string) => {
    if (!agentId) return 'NA';
    const person = findPerson(agentId);
    return person ? person.initials : agentId.slice(0, 2).toUpperCase();
  };

  const getAgentColor = (agentId?: string) => {
    if (!agentId) return 'bg-gray-400';
    const person = findPerson(agentId);
    return person ? person.color : 'bg-violet-400';
  };

  const isOtherAdmin = (agentId?: string) => {
    if (!agentId || agentId === adminId) return false;
    if (ADMINS.some(a => a.id === agentId)) return true;
    const user = users.find(u => String(u.id) === agentId);
    return user ? user.role === 'admin' : false;
  };

  const getRoleBadge = (person?: { role?: string; position?: string } | null, isGerant = false) => {
    if (!person) return null;
    if (person.role === 'agent') {
      return { label: person.position || 'Agent', cls: 'bg-emerald-100 text-emerald-700' };
    }
    if (person.role === 'gerant') {
      return { label: 'Gérant', cls: isGerant ? 'bg-[#E7D5D5] text-[#905D5D]' : 'bg-orange-100 text-orange-700' };
    }
    if (person.role === 'admin') {
      return { label: 'Admin', cls: 'bg-indigo-100 text-indigo-700' };
    }
    return null;
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
      <div className="flex items-center justify-center py-20">
        <div className={`w-6 h-6 border-2 border-t-transparent rounded-full animate-spin ${isGerant ? 'border-[#905D5D]' : 'border-accent'}`} />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-20 text-text-secondary">Bien non trouvé</div>
    );
  }

  const statusLabel = STATUS_LABELS[property.status as keyof typeof STATUS_LABELS]
  const statusColor = statusColorCls(property.status as string, isGerant)
  const typeLabel = PROPERTY_TYPE_LABELS[property.propertyType as keyof typeof PROPERTY_TYPE_LABELS]
  const transactionLabel = TRANSACTION_TYPE_LABELS[property.transactionType as keyof typeof TRANSACTION_TYPE_LABELS]
  const completion = property.completion

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
  const tabs = [...mainTabs, ...extraTabs, ...restTabs]

  if (!property) {
    return (
      <div className="text-center py-20 text-text-secondary">Bien non trouvé</div>
    );
  }

  return (
    <ConfidentialProvider>
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <BackLink />
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={<Heart size={14} />}
            className={liked ? 'text-red-500' : ''}
            onClick={() => setLiked(!liked)}
          />
          <Button variant="outline" size="sm" icon={<Edit3 size={14} />}
            onClick={() => navigate(`/admin/${adminId}/properties/type/${property.propertyType}/edit/${id}`)}>
            Modifier
          </Button>
          {canExport && (
            <Button variant="default" size="sm" icon={<ExternalLink size={14} />} className={isGerant ? GERANT_BUTTON_CLASSES : ''}>
              Partager
            </Button>
          )}
          <Button variant="ghost" size="sm" icon={<Trash2 size={14} />}
            className="text-error hover:bg-error/5"
            onClick={() => { setDeleteConfirm(''); setDeleteReason(''); setShowDeleteDialog(true) }}>
            Supprimer
          </Button>
        </div>
      </div>

      {/* Admin actions bar */}
      {!isOtherAdmin(property.agentId) && (
      <Card className={`p-3 ${isGerant ? 'border-[#905D5D]/20 bg-[#905D5D]/5' : 'border-accent/20 bg-accent/5'}`}>
        <div className="flex items-center gap-2 flex-wrap">
          <Shield size={14} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
          <span className={`text-xs font-medium mr-2 ${isGerant ? 'text-[#905D5D]' : 'text-accent'}`}>Actions Administrateur :</span>
          <Button variant="outline" size="sm" icon={<Repeat size={12} />}
            onClick={() => { setSelectedAgent(property.agentId || ''); setShowReassignDialog(true); }}>
            Reaffecter
          </Button>
          <Button variant="outline" size="sm" icon={<RefreshCw size={12} />}
            onClick={() => { setNewStatus(property.status); setShowStatusDialog(true); }}>
            Changer le statut
          </Button>
          <Button variant="ghost" size="sm" icon={<Trash2 size={12} />}
            className="text-error hover:bg-error/5"
            onClick={() => { setDeleteConfirm(''); setDeleteReason(''); setShowDeleteDialog(true); }}>
            Supprimer
          </Button>
        </div>
      </Card>
      )}

      {/* Hero section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Gallery */}
        <div className="lg:col-span-3 space-y-4">
          <PropertyMediaGallery property={property} editable={canWrite} variant="carousel" onUpdated={(p) => setProperty(p)} />
          <ConfidentialBanner isGerant={isGerant} />
        </div>

        {/* Quick info card */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-[11px] text-text-secondary/60 font-mono">{property.reference}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <h1 className="text-xl font-bold leading-snug">{property.title}</h1>
                    {property.originalPropertyId ? (
                      <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold rounded-full uppercase tracking-wider shrink-0 ${isGerant ? 'bg-[#F0E2E2] text-[#7D5050]' : 'bg-orange-100 text-orange-700'}`}>
                        Copie
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold rounded-full uppercase tracking-wider bg-blue-100 text-blue-700 shrink-0">
                        Original
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {completion != null ? (
                    <button
                      type="button"
                      onClick={() => setShowCompletionModal(true)}
                      title="Modifier la complétion"
                      className="transition-transform hover:scale-105"
                    >
                      <CompletionRing percent={completion} size={32} strokeWidth={3} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowCompletionModal(true)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border border-dashed border-border/70 text-text-secondary text-[11px] font-medium transition-colors ${isGerant ? 'hover:border-[#905D5D]/50 hover:text-[#905D5D]' : 'hover:border-accent/50 hover:text-accent'}`}
                      title="Définir la complétion"
                    >
                      <Percent size={12} />
                      Complétion
                    </button>
                  )}
                  <Badge className={statusColor}>{statusLabel}</Badge>
                </div>
              </div>

            <div className="flex items-center gap-2 text-sm text-text-secondary mb-3">
              <Map size={13} />
              <span>{property.city}{property.district ? `, ${property.district}` : ''}</span>
            </div>

            <div className="flex items-baseline gap-2 mb-4">
              {property.prixSurDemande ? (
                <span className={`text-2xl font-bold ${isGerant ? 'text-[#905D5D]' : 'text-accent'}`}><ConfidentialValue>Prix sur demande</ConfidentialValue></span>
              ) : isSeasonal && (property.seasonalPriceMin || property.seasonalPriceMax) ? (
                <>
                  <span className={`text-2xl font-bold ${isGerant ? 'text-[#905D5D]' : 'text-accent'}`}>
                    <ConfidentialValue>
                      {property.seasonalPriceMin ? formatPrice(property.seasonalPriceMin) : '?'} ~ {property.seasonalPriceMax ? formatPrice(property.seasonalPriceMax) : '?'}
                    </ConfidentialValue>
                  </span>
                  <span className="text-sm text-text-secondary">/nuit</span>
                </>
              ) : (
                <>
                  <span className={`text-2xl font-bold ${isGerant ? 'text-[#905D5D]' : 'text-accent'}`}><ConfidentialValue>{formatPrice(displayPrice)}</ConfidentialValue></span>
                  {property.transactionType === 'location_ld' && <span className="text-sm text-text-secondary">/mois</span>}
                </>
              )}
            </div>

            {property.priceEstimate && (
              <div className={`flex items-center gap-2 p-3 rounded-lg border mb-4 ${isGerant ? 'bg-[#E7D5D5] border-[#E0C6C6]' : 'bg-amber-50 border-amber-200'}`}>
                <DollarSign size={14} className={isGerant ? 'text-[#905D5D]' : 'text-amber-600'} />
                <div>
                  <p className={`text-xs ${isGerant ? 'text-[#7D5050]' : 'text-amber-700'}`}>
                    Estimation: <strong><ConfidentialValue>{formatPrice(property.priceEstimate)}</ConfidentialValue></strong>
                  </p>
                  <p className={`text-[10px] ${isGerant ? 'text-[#905D5D]/70' : 'text-amber-600/70'}`}>
                    <ConfidentialValue>
                      {property.priceEstimate > property.price
                        ? 'Sous-estime par rapport au marche'
                        : 'Sur-estime par rapport au marche'}
                    </ConfidentialValue>
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 text-sm text-text-secondary flex-wrap">
              <span>{property.surface} m²</span>
              <span>{((property as any).bathroom_count ?? property.bathrooms)} sdb</span>
              <span>{((property as any).bedrooms_total ?? property.bedrooms)} chambres</span>
              {property.sleepingCapacity && <span>{property.sleepingCapacity} couchages</span>}
              {property.landSize && <span>Terrain {property.landSize} m²</span>}
            </div>
          </Card>

          {/* Owner quick card */}
          <Card className="p-4">
            <p className="text-[11px] text-text-secondary/60 font-medium mb-2 flex items-center gap-1.5">
              <User size={12} /> Propriétaire{ownerType === 'societe' ? ' (Société)' : ''}
            </p>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isGerant ? 'bg-[#E7D5D5]' : 'bg-accent-light'}`}>
                <span className={`font-bold text-sm ${isGerant ? 'text-[#905D5D]' : 'text-accent'}`}>
                  {ownerInitials}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium"><ConfidentialValue><PermissionValue allowed={canSeeName && canSeeCoords}>{ownerDisplayName}</PermissionValue></ConfidentialValue></p>
                <p className="text-xs text-text-secondary truncate"><ConfidentialValue><PermissionValue allowed={canSeeCoords}>{property.owner?.phone ?? property.owner_phone ?? ''}</PermissionValue></ConfidentialValue></p>
                <p className="text-xs text-text-secondary truncate"><ConfidentialValue><PermissionValue allowed={canSeeCoords}>{property.owner?.email || property.owner_email || ''}</PermissionValue></ConfidentialValue></p>
              </div>
              <div className="flex gap-1">
                <button className="btn-ghost p-1.5"><Phone size={14} /></button>
                <button className="btn-ghost p-1.5"><Mail size={14} /></button>
                <button className="btn-ghost p-1.5"><MessageSquare size={14} /></button>
              </div>
            </div>
          </Card>

          {/* Agent card (admin only) */}
          <Card className={`p-4 ${isGerant ? 'border-[#905D5D]/20' : 'border-accent/20'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${property.agentId ? getAgentColor(property.agentId) : 'bg-gray-400'} flex items-center justify-center flex-shrink-0`}>
                <span className="text-white font-bold text-sm">
                  {property.agentId ? getAgentInitials(property.agentId) : 'NA'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                {(() => {
                  const person = property.agentId ? findPerson(property.agentId) : null;
                  const roleLabel = person?.role === 'admin' ? 'Admin responsable' : 'Agent responsable';
                  return <p className={`text-xs font-medium uppercase tracking-wider ${isGerant ? 'text-[#905D5D]' : 'text-accent'}`}>{roleLabel}</p>;
                })()}
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium">{getAgentName(property.agentId)}</p>
                  {(() => {
                    const person = property.agentId ? findPerson(property.agentId) : null;
                    const badge = getRoleBadge(person, isGerant);
                    return badge ? (
                      <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold rounded-full uppercase tracking-wider ${badge.cls}`}>
                        {badge.label}
                      </span>
                    ) : null;
                  })()}
                </div>
                {property.agentId && (
                  <p className="text-xs text-text-secondary">
                    Mandat: {property.mandateType || 'N/A'} · {property.mandateStatus === 'actif' ? 'Actif' : property.mandateStatus}
                  </p>
                )}
              </div>
              <Button variant="ghost" size="sm" icon={<Repeat size={12} />}
                onClick={() => { setSelectedAgent(property.agentId || ''); setShowReassignDialog(true); }}>
                Changer
              </Button>
            </div>
          </Card>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3 text-center">
              <p className="text-xs text-text-secondary">Type</p>
              <p className="text-sm font-semibold mt-0.5">{typeLabel}</p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-xs text-text-secondary">Transaction</p>
              <p className="text-sm font-semibold mt-0.5">{transactionLabel}</p>
            </Card>
          </div>
          <button
            onClick={() => setShowExtra(v => !v)}
            className={`w-full inline-flex items-center justify-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg border transition-all ${
              showExtra
                ? isGerant ? 'bg-[#905D5D]/10 text-[#905D5D] border-[#905D5D]/30' : 'bg-accent/10 text-accent border-accent/30'
                : 'bg-card text-text-secondary border-border/40 hover:bg-card hover:text-text'
            }`}
          >
            <ChevronDown size={13} className={`transition-transform ${showExtra ? 'rotate-180' : ''}`} />
            Plus d'infos
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin border-b border-border/40">
          <div className="flex px-1 min-w-max items-stretch">
            {mainTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? isGerant ? 'text-[#905D5D] border-[#905D5D]' : 'text-accent border-accent'
                    : 'text-text-secondary border-transparent hover:text-text hover:border-border'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
            {restTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? isGerant ? 'text-[#905D5D] border-[#905D5D]' : 'text-accent border-accent'
                    : 'text-text-secondary border-transparent hover:text-text hover:border-border'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        {showExtra && (
          <div className="flex flex-wrap gap-1.5 px-4 py-3 border-b border-border/30 bg-background/30">
            {extraTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-all ${
                  activeTab === tab.id
                    ? isGerant ? 'bg-[#905D5D]/10 text-[#905D5D] border-[#905D5D]/30' : 'bg-accent/10 text-accent border-accent/30'
                    : 'text-text-secondary border-border/40 hover:bg-card hover:text-text'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <div className="p-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
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
                  <div className="bg-card rounded-xl border border-border/50 shadow-card p-5">
                    <h3 className="font-semibold mb-4">Galerie photos & vidéos</h3>
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
      <Dialog isOpen={showReassignDialog} onClose={() => setShowReassignDialog(false)} title="Reaffecter un bien" size="lg">
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-background border border-border/50">
            <p className="text-sm font-medium">{property.title}</p>
            <p className="text-xs text-text-secondary">#{property.reference}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary mb-1.5">Responsable actuel :</p>
            <div className="flex items-center gap-2 text-sm">
              {property.agentId ? (
                <>
                  <div className={`w-6 h-6 rounded-full ${getAgentColor(property.agentId)} flex items-center justify-center text-white text-[10px] font-bold`}>
                    {getAgentInitials(property.agentId)}
                  </div>
                  <span>{getAgentName(property.agentId)}</span>
                </>
              ) : (
                <span className="text-text-secondary italic">Non assigne</span>
              )}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Nouveau responsable</label>
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
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowReassignDialog(false)}>Annuler</Button>
            <Button variant="default" className={isGerant ? GERANT_BUTTON_CLASSES : ''} onClick={async () => {
              if (!selectedAgent || !id) return;
              try {
                const updated = await reassignProperty(id, selectedAgent);
                setProperty((prev: any) => ({ ...prev, ...updated }));
                setShowReassignDialog(false);
                setSelectedAgent('');
                toast('success', 'Bien réaffecté avec succès');
              } catch (e: any) {
                toast('error', e.message || 'Erreur lors de la réaffectation');
              }
            }} disabled={!selectedAgent}>Reaffecter</Button>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog isOpen={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} title="Supprimer le bien" size="lg">
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-background border border-border/50">
            <p className="text-sm font-medium">{property.title}</p>
            <p className="text-xs text-text-secondary">#{property.reference}</p>
          </div>
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-red-700 space-y-1">
                <p className="font-medium">Attention :</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Cette action est IRREVERSIBLE</li>
                  <li>Tous les documents associes seront supprimes</li>
                  <li>Tous les mandats lies seront supprimes</li>
                  <li>L'historique du bien sera efface</li>
                </ul>
              </div>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Confirmation</label>
            <input
              type="text"
              className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-error/20 focus:border-error transition-all"
              placeholder='Tapez "SUPPRIMER" pour confirmer'
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Motif de suppression (optionnel)</label>
            <select
              className={`w-full h-10 px-3 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 transition-all ${isGerant ? 'focus:ring-[#905D5D]/20 focus:border-[#905D5D]' : 'focus:ring-accent/20 focus:border-accent'}`}
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
            >
              <option value="">Selectionner un motif</option>
              <option value="doublon">Erreur de saisie - Doublon</option>
              <option value="vendu">Bien vendu hors agence</option>
              <option value="retire">Bien retire par le proprietaire</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>Annuler</Button>
            <Button variant="danger" onClick={async () => {
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
            }} disabled={deleteConfirm !== 'SUPPRIMER'}>
              Confirmer la suppression
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Change Status Dialog */}
      <Dialog isOpen={showStatusDialog} onClose={() => setShowStatusDialog(false)} title="Changer le statut" size="md">
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-background border border-border/50">
            <p className="text-sm font-medium">{property.title}</p>
            <p className="text-xs text-text-secondary">#{property.reference}</p>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Statut actuel</label>
            <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border ${statusColor}`}>
              {statusLabel}
            </span>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Nouveau statut</label>
            <Select
              placeholder="Sélectionner un statut"
              value={newStatus}
              onValueChange={(v) => setNewStatus(v)}
              options={(STATUS_BY_TRANSACTION[property.transactionType] || Object.keys(STATUS_LABELS)).map(s => ({
                value: s,
                label: STATUS_LABELS[s] || s,
              }))}
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowStatusDialog(false)}>Annuler</Button>
            <Button variant="default" className={isGerant ? GERANT_BUTTON_CLASSES : ''} onClick={handleStatusChange} disabled={newStatus === property.status}>
              Changer le statut
            </Button>
          </div>
        </div>
      </Dialog>

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
