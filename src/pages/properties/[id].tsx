import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Dialog } from '../../components/ui/Dialog'
import { PropertyGallery } from '../../components/modules/properties/PropertyGallery'
import { PropertyMediaGallery } from '../../components/modules/properties/PropertyMediaGallery'
import { PropertyDetails } from '../../components/modules/properties/PropertyDetails'
import { PropertyDocuments } from '../../components/modules/properties/PropertyDocuments'
import { PropertyTimeline } from '../../components/modules/properties/PropertyTimeline'
import { PropertyMatching } from '../../components/modules/properties/PropertyMatching'
import { PropertySeasonal } from '../../components/modules/properties/PropertySeasonal'

import { PropertyPlanMap } from '../../components/modules/properties/PropertyPlanMap'
import { PropertyTransfer } from '../../components/modules/properties/PropertyTransfer'
import { PropertySocial } from '../../components/modules/properties/PropertySocial'
import { PropertyKeys } from '../../components/modules/properties/PropertyKeys'
import { PropertyTransactionsTab } from '../../components/modules/properties/PropertyTransactionsTab'
import { PropertyContractsTab } from '../../components/modules/properties/PropertyContractsTab'
import PropertyInterior from '../../components/modules/properties/PropertyInterior'
import PropertyExterior from '../../components/modules/properties/PropertyExterior'
import PropertyEquipment from '../../components/modules/properties/PropertyEquipment'
import PropertyProximities from '../../components/modules/properties/PropertyProximities'
import PropertyCommercial from '../../components/modules/properties/PropertyCommercial'
import PropertyLand from '../../components/modules/properties/PropertyLand'
import PropertyOwnerDetail from '../../components/modules/properties/PropertyOwnerDetail'
import PropertyInventory from '../../components/modules/properties/PropertyInventory'
import { BackLink } from '../../components/ui/BackLink'
import { ConfidentialProvider, useConfidential } from '../../components/modules/confidentiality/ConfidentialContext'
import { ConfidentialBanner } from '../../components/modules/confidentiality/ConfidentialBanner'
import { ConfidentialValue } from '../../components/modules/confidentiality/ConfidentialField'
import { api } from '../../services/api'
import { fetchPropertyById } from '../../services/propertyService'
import { PROPERTY_TYPE_LABELS, TRANSACTION_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS } from '../../types/property'
import {
  Info, DollarSign, FileText, Users, Clock, Map, Heart, Globe, Sun, Image as ImageIcon, Key, User,
  Edit3, ExternalLink, Phone, Mail, MessageSquare, BookOpen, Trash2, AlertTriangle,
  Briefcase, Grid as GridIcon, MapPin, Home, ChevronDown, List, Percent, Lock
} from 'react-feather'
import { CompletionRing } from '../../components/ui/CompletionRing'
import { deleteProperty } from '../../services/propertyService'
import { useToast } from '../../components/ui/Toast'
import { useMyPermissions, permissionAllowed } from '../../hooks/useMyPermissions'
import { usePermission, useRestriction } from '../../hooks/usePermission'
import { PermissionValue } from '../../components/modules/confidentiality/PermissionLocked'
import { PropertyCompletionModal } from '../../components/modules/properties/PropertyCompletionModal'

interface TabItem {
  id: string
  label: string
  icon: React.ReactNode
}

export default function PropertyPage() {
  const { id, agentId } = useParams<{ id: string; agentId?: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const perms = useMyPermissions()
  const canReadContracts = permissionAllowed(perms, 'contrats-lecture')
  const canRead = usePermission('biens-lecture')
  const restricted = useRestriction('biens-info-privees')
  const canWrite = usePermission('biens-ecriture')
  const canSeeTransfert = usePermission('biens-transfert')
  const canExport = usePermission('biens-commercial-export')
  const canSeeAddress = usePermission('biens-afficher-adresse')
  const canSeeName = usePermission('biens-afficher-nom-contact')
  const canSeeCoords = usePermission('biens-afficher-coordonnees-contact')
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '')
    return hash || 'informations'
  })
  const [showExtra, setShowExtra] = useState(() => localStorage.getItem('showExtra') === 'true')

  useEffect(() => {
    localStorage.setItem('showExtra', String(showExtra))
  }, [showExtra])

  useEffect(() => {
    window.location.hash = activeTab
  }, [activeTab])
  const [liked, setLiked] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showVariables, setShowVariables] = useState(false)
  const [previewText, setPreviewText] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [property, setProperty] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentAgentName, setCurrentAgentName] = useState('')
  const [currentUserId, setCurrentUserId] = useState('')
  const [showCompletionModal, setShowCompletionModal] = useState(false)

  useEffect(() => {
    api.get<any>('/auth/me')
      .then(u => u && (setCurrentUserId(String(u.id)), setCurrentAgentName(`${u.first_name || ''} ${u.last_name || ''}`.trim())))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchPropertyById(id)
      .then((p) => {
        if (currentUserId && p.agentId && String(p.agentId) !== currentUserId) {
          navigate('/properties', { replace: true });
          return;
        }
        setProperty(p);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, currentUserId]);

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
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-20 text-text-secondary">Bien non trouvé</div>
    );
  }

  if (!canRead || restricted) {
    return (
      <div className="text-center py-20">
        <div className="mx-auto w-12 h-12 rounded-full bg-card border border-border/50 flex items-center justify-center mb-3">
          <Lock size={20} className="text-text-secondary" />
        </div>
        <p className="text-text-secondary font-medium">Accès restreint</p>
        <p className="text-xs text-text-secondary/60 mt-1">
          Vous n'avez pas le droit de consulter ce bien
        </p>
      </div>
    );
  }

  const statusLabel = STATUS_LABELS[property.status as keyof typeof STATUS_LABELS]
  const statusColor = STATUS_COLORS[property.status as keyof typeof STATUS_COLORS]
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
    ...(property.propertyType === 'vacation' ? [
      { id: 'saisonnier', label: 'Saisonnier', icon: <Sun size={15} /> } as TabItem,
    ] : []),
  ]
  const extraTabs: TabItem[] = [
    { id: 'proprietaire', label: 'Propriétaire', icon: <User size={15} /> },
    ...(property.furnishing === 'meuble' ? [{ id: 'inventaire', label: 'Inventaire', icon: <List size={15} /> }] : []),
    { id: 'interieur', label: 'Intérieur', icon: <Home size={15} /> },
    { id: 'exterieur', label: 'Extérieur', icon: <Sun size={15} /> },
    { id: 'equipements', label: 'Équipements', icon: <GridIcon size={15} /> },
    { id: 'proximites', label: 'Proximités', icon: <MapPin size={15} /> },
  ]
  const restTabs: TabItem[] = [
    ...(property.propertyType === 'commercial' ? [{ id: 'commercial', label: 'Commercial', icon: <Briefcase size={15} /> } as TabItem] : []),
    ...(property.propertyType === 'land' ? [{ id: 'terrain', label: 'Terrain', icon: <MapPin size={15} /> } as TabItem] : []),
    { id: 'documents', label: 'Documents', icon: <FileText size={15} /> },
    { id: 'historique', label: 'Historique', icon: <Clock size={15} /> },
    ...((['vente', 'location_ld', 'location_saisonniere'].includes(property.transactionType)) ? [{ id: 'matching', label: 'Matching', icon: <Users size={15} /> } as TabItem] : []),
    ...(canSeeTransfert ? [{ id: 'transfert', label: 'Transfert', icon: <Globe size={15} /> } as TabItem] : []),
    { id: 'cles', label: 'Clés', icon: <Key size={15} /> },
    { id: 'transactions', label: 'Transactions', icon: <BookOpen size={15} /> },
    ...(canReadContracts ? [{ id: 'contrats', label: 'Contrats', icon: <FileText size={15} /> } as TabItem] : []),
  ]
  const tabs = [...mainTabs, ...extraTabs, ...restTabs]

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
          {canWrite && (
            <Button variant="outline" size="sm" icon={<Edit3 size={14} />}
              onClick={() => navigate(`/${agentId}/properties/type/${property.propertyType}/edit/${id}`)}>
              Modifier
            </Button>
          )}
          {canExport && (
            <Button variant="default" size="sm" icon={<ExternalLink size={14} />}>
              Partager
            </Button>
          )}
          {canWrite && (
            <Button variant="ghost" size="sm" icon={<Trash2 size={14} />}
              className="text-error hover:bg-error/5"
              onClick={() => { setDeleteConfirm(''); setShowDeleteDialog(true) }}>
              Supprimer
            </Button>
          )}
        </div>
      </div>

      {/* Hero section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Gallery */}
        <div className="lg:col-span-3 space-y-4">
          <PropertyMediaGallery property={property} editable={canWrite} variant="carousel" onUpdated={(p) => setProperty(p)} />
          <ConfidentialBanner />
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
                    <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold rounded-full uppercase tracking-wider bg-orange-100 text-orange-700 shrink-0">
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
                  canWrite ? (
                    <button
                      type="button"
                      onClick={() => setShowCompletionModal(true)}
                      title="Modifier la complétion"
                      className="transition-transform hover:scale-105"
                    >
                      <CompletionRing percent={completion} size={32} strokeWidth={3} />
                    </button>
                  ) : (
                    <span title="Complétion">
                      <CompletionRing percent={completion} size={32} strokeWidth={3} />
                    </span>
                  )
                ) : (
                  canWrite ? (
                    <button
                      type="button"
                      onClick={() => setShowCompletionModal(true)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-dashed border-border/70 text-text-secondary text-[11px] font-medium hover:border-accent/50 hover:text-accent transition-colors"
                      title="Définir la complétion"
                    >
                      <Percent size={12} />
                      Complétion
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-dashed border-border/70 text-text-secondary text-[11px] font-medium">
                      <Percent size={12} />
                      Complétion
                    </span>
                  )
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
                <span className="text-2xl font-bold text-accent">Prix sur demande</span>
              ) : isSeasonal && (property.seasonalPriceMin || property.seasonalPriceMax) ? (
                <>
                  <span className="text-2xl font-bold text-accent">
                    <ConfidentialValue>
                      {property.seasonalPriceMin ? formatPrice(property.seasonalPriceMin) : '?'} ~ {property.seasonalPriceMax ? formatPrice(property.seasonalPriceMax) : '?'}
                    </ConfidentialValue>
                  </span>
                  <span className="text-sm text-text-secondary">/nuit</span>
                </>
              ) : (
                <>
                  <span className="text-2xl font-bold text-accent">
                    <ConfidentialValue>{formatPrice(displayPrice)}</ConfidentialValue>
                  </span>
                  {property.transactionType === 'location_ld' && <span className="text-sm text-text-secondary">/mois</span>}
                </>
              )}
            </div>

            {property.priceEstimate && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 mb-4">
                <DollarSign size={14} className="text-amber-600" />
                <div>
                  <p className="text-xs text-amber-700">
                    Estimation: <strong><ConfidentialValue>{formatPrice(property.priceEstimate)}</ConfidentialValue></strong>
                  </p>
                  <p className="text-[10px] text-amber-600/70">
                    <ConfidentialValue>
                      {property.priceEstimate > property.price
                        ? 'Sous-estimé par rapport au marché'
                        : 'Sur-estimé par rapport au marché'}
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
              <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center flex-shrink-0">
                <span className="text-accent font-bold text-sm">
                  {ownerInitials}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  <PermissionValue allowed={canSeeName && canSeeCoords}>
                    <ConfidentialValue>{ownerDisplayName}</ConfidentialValue>
                  </PermissionValue>
                </p>
                <p className="text-xs text-text-secondary truncate">
                  <PermissionValue allowed={canSeeCoords}>
                    <ConfidentialValue>{property.owner?.phone ?? property.owner_phone ?? ''}</ConfidentialValue>
                  </PermissionValue>
                </p>
                <p className="text-xs text-text-secondary truncate">
                  <PermissionValue allowed={canSeeCoords}>
                    <ConfidentialValue>{property.owner?.email ?? property.owner_email ?? ''}</ConfidentialValue>
                  </PermissionValue>
                </p>
              </div>
              <div className="flex gap-1">
                <button className="btn-ghost p-1.5"><Phone size={14} /></button>
                <button className="btn-ghost p-1.5"><Mail size={14} /></button>
                <button className="btn-ghost p-1.5"><MessageSquare size={14} /></button>
              </div>
            </div>
          </Card>

          {/* Agent handler card */}
          <Card className="p-4 border-accent/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-violet-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-accent font-medium uppercase tracking-wider">Agent responsable</p>
                <p className="text-sm font-medium">
                  {currentAgentName || 'Non assigne'}
                </p>
              </div>
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
                ? 'bg-accent/10 text-accent border-accent/30'
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
        {/* Scrollable tab bar */}
        <div className="overflow-x-auto scrollbar-thin border-b border-border/40">
          <div className="flex px-1 min-w-max items-stretch">
            {mainTabs.map(tab => (
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
            {restTabs.map(tab => (
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
        {showExtra && (
          <div className="flex flex-wrap gap-1.5 px-4 py-3 border-b border-border/30 bg-background/30">
            {extraTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-all ${
                  activeTab === tab.id
                    ? 'bg-accent/10 text-accent border-accent/30'
                    : 'text-text-secondary border-border/40 hover:bg-card hover:text-text'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Tab content */}
        <div className={`p-5 ${!canWrite ? 'pointer-events-none select-none' : ''}`}>
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
                    <PropertyDetails property={property} showPreview={showPreview} showVariables={showVariables} previewText={previewText} />
                  </div>
                  <div className="space-y-4">
                    <PropertySocial property={property} onShowPreviewChange={setShowPreview} onShowVariablesChange={setShowVariables} onPreviewTextChange={setPreviewText} />
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
                    />
                  </div>
                </div>
              )}
              {activeTab === 'plan' && <PropertyPlanMap property={property} />}
              {activeTab === 'saisonnier' && <PropertySeasonal property={property} />}
              {activeTab === 'documents' && <PropertyDocuments property={property} />}
              {activeTab === 'historique' && <PropertyTimeline propertyId={property.id} events={property.timeline} property={property} currentAgent={currentAgentName} />}
              {activeTab === 'proprietaire' && <PropertyOwnerDetail property={property} />}
              {activeTab === 'inventaire' && <PropertyInventory property={property} />}
              {activeTab === 'interieur' && <PropertyInterior property={property} />}
              {activeTab === 'exterieur' && <PropertyExterior property={property} />}
              {activeTab === 'equipements' && <PropertyEquipment property={property} />}
              {activeTab === 'proximites' && <PropertyProximities property={property} />}
              {activeTab === 'commercial' && <PropertyCommercial property={property} />}
              {activeTab === 'terrain' && <PropertyLand property={property} />}
              {activeTab === 'matching' && <PropertyMatching property={property} agentId={agentId} />}
              {activeTab === 'transfert' && <PropertyTransfer property={property} />}
              {activeTab === 'cles' && <PropertyKeys property={property} onUpdated={(p) => setProperty(p)} />}
              {activeTab === 'transactions' && (
                <PropertyTransactionsTab
                  propertyId={property.id}
                  propertyTitle={property.title}
                  propertyRef={property.reference}
                />
              )}
              {activeTab === 'contrats' && (
                <PropertyContractsTab
                  propertyId={property.id}
                  propertyTitle={property.title}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>

      {/* Delete Dialog */}
      <Dialog isOpen={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} title="Supprimer le bien" size="lg">
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-background border border-border/50">
            <p className="text-sm font-medium">{property.reference} · {property.title}</p>
            <p className="text-xs text-text-secondary">{property.location}</p>
          </div>
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-red-700 space-y-1">
                <p className="font-medium">Attention : cette action est IRREVERSIBLE.</p>
                <p>Le bien sera definitivement supprime.</p>
              </div>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Confirmation</label>
            <input type="text"
              className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-error/20 focus:border-error transition-all"
              placeholder='Tapez "SUPPRIMER" pour confirmer'
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
            />
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
                navigate('/properties', { replace: true });
              } catch (e: any) {
                toast('error', e.message || 'Erreur lors de la suppression');
              }
            }} disabled={deleteConfirm !== 'SUPPRIMER'}>
              Confirmer la suppression
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
    </ConfidentialProvider>
  )
}
