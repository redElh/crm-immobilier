import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
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
import { ConfidentialProvider } from '../../components/modules/confidentiality/ConfidentialContext'
import { ConfidentialBanner } from '../../components/modules/confidentiality/ConfidentialBanner'
import { ConfidentialValue } from '../../components/modules/confidentiality/ConfidentialField'
import { api } from '../../services/api'
import { fetchPropertyById, deleteProperty } from '../../services/propertyService'
import { PROPERTY_TYPE_LABELS, TRANSACTION_TYPE_LABELS, STATUS_LABELS } from '../../types/property'
import {
  Info, FileText, Users, Clock, Map as MapIcon, Heart, Globe, Sun, Image as ImageIcon, Key, User,
  Edit3, ExternalLink, Phone, Mail, MessageSquare, BookOpen, Trash2, AlertTriangle,
  Briefcase, Grid as GridIcon, MapPin, Home, List, Percent, Lock,
  ArrowLeft, Maximize2, Droplet, Layers,
} from 'react-feather'
import {
  Stage, OrbIcon, StageBadge, StageButton, ShimmerProgress, AnimatedNumber,
  STAGE_HUES, SLATE_HUE, useStageTheme,
} from '../../components/dashboard/Stage'
import type { StageHue } from '../../components/dashboard/Stage'
import { useToast } from '../../components/ui/Toast'
import { useMyPermissions, permissionAllowed } from '../../hooks/useMyPermissions'
import { usePermission, useRestriction } from '../../hooks/usePermission'
import { PermissionValue } from '../../components/modules/confidentiality/PermissionLocked'
import { PropertyCompletionModal } from '../../components/modules/properties/PropertyCompletionModal'

/* ---------------------------------------------------------------------
   Hue maps — semantic color language shared with the properties hub
--------------------------------------------------------------------- */

const TYPE_HUE_MAP: Record<string, StageHue> = {
  residential: STAGE_HUES.violet,
  commercial: STAGE_HUES.sky,
  land: STAGE_HUES.emerald,
  vacation: STAGE_HUES.amber,
  luxury: STAGE_HUES.fuchsia,
}

const STATUS_HUE_MAP: Record<string, StageHue> = {
  draft: STAGE_HUES.sky,
  active: STAGE_HUES.violet,
  negotiation: STAGE_HUES.amber,
  compromise: STAGE_HUES.fuchsia,
  sold: STAGE_HUES.emerald,
  rented: STAGE_HUES.emerald,
  sold_or_rented: STAGE_HUES.emerald,
  archived: SLATE_HUE,
}

const TRANS_HUE_MAP: Record<string, StageHue> = {
  vente: STAGE_HUES.emerald,
  location_ld: STAGE_HUES.sky,
  location_saisonniere: STAGE_HUES.amber,
}

/* ---------------------------------------------------------------------
   SpecCell — glass key-figure chip
--------------------------------------------------------------------- */

function SpecCell({
  icon: Icon, hue, label, value, suffix, delay = 0,
}: {
  icon: React.ComponentType<{ size?: number | string; className?: string }>
  hue: StageHue
  label: string
  value: React.ReactNode
  suffix?: string
  delay?: number
}) {
  const theme = useStageTheme()
  const isDark = theme === 'dark'
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className="stage-glass group flex items-center gap-3 p-3 transition-transform duration-300 hover:-translate-y-0.5"
    >
      <OrbIcon icon={Icon} hue={hue} size={36} radius={11} />
      <div className="min-w-0">
        <p className={`text-[9px] font-bold uppercase tracking-[1.4px] ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}>
          {label}
        </p>
        <p className={`text-[15px] font-extrabold leading-tight tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {value}
          {suffix && <span className={`ml-0.5 text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{suffix}</span>}
        </p>
      </div>
    </motion.div>
  )
}

/* ---------------------------------------------------------------------
   Page
--------------------------------------------------------------------- */

export default function PropertyPage() {
  const { id, agentId } = useParams<{ id: string; agentId?: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const theme = useStageTheme()
  const isDark = theme === 'dark'

  const perms = useMyPermissions()
  const canReadContracts = permissionAllowed(perms, 'contrats-lecture')
  const canRead = usePermission('biens-lecture')
  const restricted = useRestriction('biens-info-privees')
  const canWrite = usePermission('biens-ecriture')
  const canSeeTransfert = usePermission('biens-transfert')
  const canExport = usePermission('biens-commercial-export')
  const canSeeName = usePermission('biens-afficher-nom-contact')
  const canSeeCoords = usePermission('biens-afficher-coordonnees-contact')

  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '')
    return hash || 'informations'
  })
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
    let cancelled = false
    setLoading(true);
    fetchPropertyById(id)
      .then((p) => {
        if (cancelled) return;
        setProperty(p);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) });
    return () => { cancelled = true }
  }, [id]);

  useEffect(() => {
    if (!property || !currentUserId || !property.agentId || String(property.agentId) === currentUserId) return;
    navigate('/properties', { replace: true });
  }, [property, currentUserId, navigate]);

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(p)

  /* ---------------- Tabs (hooks must run before early returns) -------- */

  interface TabDef { id: string; label: string; icon: any }
  const tabs: TabDef[] = useMemo(() => {
    return [
      { id: 'informations', label: 'Informations', icon: Info },
      { id: 'media', label: 'Photos / Médias', icon: ImageIcon },
      { id: 'plan', label: 'Plan / Carte', icon: MapIcon },
      ...(property?.propertyType === 'vacation' ? [{ id: 'saisonnier', label: 'Saisonnier', icon: Sun }] : []),
      { id: 'proprietaire', label: 'Propriétaire', icon: User },
      ...(property?.furnishing === 'meuble' ? [{ id: 'inventaire', label: 'Inventaire', icon: List }] : []),
      { id: 'interieur', label: 'Intérieur', icon: Home },
      { id: 'exterieur', label: 'Extérieur', icon: Sun },
      { id: 'equipements', label: 'Équipements', icon: GridIcon },
      { id: 'proximites', label: 'Proximités', icon: MapPin },
      ...(property?.propertyType === 'commercial' ? [{ id: 'commercial', label: 'Commercial', icon: Briefcase }] : []),
      ...(property?.propertyType === 'land' ? [{ id: 'terrain', label: 'Terrain', icon: MapPin }] : []),
      { id: 'documents', label: 'Documents', icon: FileText },
      { id: 'historique', label: 'Historique', icon: Clock },
      ...((['vente', 'location_ld', 'location_saisonniere'].includes(property?.transactionType)) ? [{ id: 'matching', label: 'Matching', icon: Users }] : []),
      ...(canSeeTransfert ? [{ id: 'transfert', label: 'Transfert', icon: Globe }] : []),
      { id: 'cles', label: 'Clés', icon: Key },
      { id: 'transactions', label: 'Transactions', icon: BookOpen },
      ...(canReadContracts ? [{ id: 'contrats', label: 'Contrats', icon: FileText }] : []),
    ]
  }, [property?.propertyType, property?.furnishing, property?.transactionType, canSeeTransfert, canReadContracts])

  useEffect(() => {
    if (property && !tabs.some(t => t.id === activeTab)) setActiveTab('informations')
  }, [tabs, property])

  /* ---------------- Loading / guards ---------------- */

  if (loading) {
    return (
      <Stage theme={theme}>
        <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
          <motion.div
            className="h-12 w-12 rounded-full border-[3px] border-indigo-400/30 border-t-indigo-400"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
            style={{ filter: 'drop-shadow(0 0 14px rgba(139,124,255,0.6))' }}
          />
          <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${isDark ? 'text-slate-500' : 'text-teal-900/50'}`}>
            Chargement du dossier…
          </p>
        </div>
      </Stage>
    );
  }

  if (!property) {
    return (
      <Stage theme={theme}>
        <div className="flex h-[60vh] flex-col items-center justify-center gap-2 text-center">
          <OrbIcon icon={AlertTriangle} hue={STAGE_HUES.amber} size={52} radius={16} />
          <p className={`mt-2 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Bien introuvable</p>
          <StageButton variant="glass" icon={<ArrowLeft size={14} />} onClick={() => navigate('/properties')}>
            Retour au portefeuille
          </StageButton>
        </div>
      </Stage>
    );
  }

  if (!canRead || restricted) {
    return (
      <Stage theme={theme}>
        <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-center">
          <OrbIcon icon={Lock} hue={SLATE_HUE} size={52} radius={16} />
          <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Accès restreint</p>
          <p className={`max-w-xs text-sm ${isDark ? 'text-slate-400' : 'text-teal-900/55'}`}>
            Vous n'avez pas le droit de consulter ce bien.
          </p>
        </div>
      </Stage>
    );
  }

  /* ---------------- Derived data ---------------- */

  const statusLabel = STATUS_LABELS[property.status as keyof typeof STATUS_LABELS]
  const typeLabel = PROPERTY_TYPE_LABELS[property.propertyType as keyof typeof PROPERTY_TYPE_LABELS]
  const transactionLabel = TRANSACTION_TYPE_LABELS[property.transactionType as keyof typeof TRANSACTION_TYPE_LABELS]

  const typeHue = TYPE_HUE_MAP[property.propertyType] || STAGE_HUES.violet
  const statusHue = STATUS_HUE_MAP[property.status] || SLATE_HUE
  const transHue = TRANS_HUE_MAP[property.transactionType] || STAGE_HUES.violet

  const completion: number | null | undefined = property.completion
  const completionHue = completion == null ? null
    : completion >= 80 ? STAGE_HUES.emerald
    : completion >= 50 ? STAGE_HUES.amber
    : { a: '#F87171', b: '#B91C1C', glow: 'rgba(248,113,113,0.40)', line: '#F87171' }

  const isSeasonal = property.transactionType === 'location_saisonniere'
  const displayPrice = property.transactionType === 'location_ld'
    ? (property.loyerHC || 0)
    : isSeasonal
      ? (property.seasonalPriceMin || 0)
      : (property.prixNetVendeur && property.honorairesPct && property.honorairesType === 'inclus'
        ? Math.round(Number(property.prixNetVendeur) * (1 + Number(property.honorairesPct) / 100))
        : (property.prixNetVendeur || property.price || 0))

  const ownerType = property.ownerType
  let ownerDisplayName = property.owner?.name || ''
  let ownerInitials = ''
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

  /* ---------------- Tabs ---------------- */

  return (
    <ConfidentialProvider>
      <Stage theme={theme}>
        <div className="space-y-5 animate-fade-in pb-8">

          {/* ── Command bar ─────────────────────────────────────────── */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <button
              onClick={() => navigate(-1)}
              className={`group inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold backdrop-blur-md transition-all ${
                isDark
                  ? 'border-white/10 bg-white/[0.04] text-slate-400 hover:text-white hover:border-white/25'
                  : 'border-teal-900/10 bg-white/60 text-teal-900/60 hover:text-teal-900 hover:border-teal-900/25'
              }`}
            >
              <ArrowLeft size={13} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
              Portefeuille
            </button>

            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setLiked(!liked)}
                aria-label="Favori"
                className="stage-glass flex h-8 w-8 items-center justify-center rounded-xl"
                style={liked ? {
                  borderColor: 'rgba(248,113,133,0.45)',
                  boxShadow: '0 0 16px rgba(248,113,133,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
                } : undefined}
              >
                <Heart size={14} style={{ color: liked ? '#FB7185' : undefined }} fill={liked ? '#FB7185' : 'none'} className={!liked ? (isDark ? 'text-slate-400' : 'text-teal-900/50') : ''} />
              </motion.button>

              {canWrite && (
                <StageButton variant="primary" onClick={() => navigate(`/${agentId}/properties/type/${property.propertyType}/edit/${id}`)} icon={<Edit3 size={13} />}>
                  Modifier
                </StageButton>
              )}
              {canExport && (
                <StageButton variant="glass" icon={<ExternalLink size={13} />}>Partager</StageButton>
              )}
              {canWrite && (
                <button
                  type="button"
                  onClick={() => { setDeleteConfirm(''); setShowDeleteDialog(true) }}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border backdrop-blur-md transition-all duration-200 hover:scale-105"
                  style={{
                    borderColor: 'rgba(251,113,133,0.28)',
                    backgroundColor: 'rgba(251,113,133,0.08)',
                    color: '#FDA4AF',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
                  }}
                  aria-label="Supprimer"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>

          {/* ── Hero ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Cinematic gallery */}
            <motion.div
              className="lg:col-span-3 space-y-3"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <PropertyMediaGallery property={property} editable={canWrite} variant="carousel" onUpdated={(p) => setProperty(p)} />
              <ConfidentialBanner />

              {/* Key figures strip */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SpecCell icon={Maximize2} hue={typeHue} label="Surface" value={<AnimatedNumber value={Number(property.surface) || 0} />} suffix="m²" delay={0.05} />
                <SpecCell icon={Home} hue={STAGE_HUES.sky} label="Chambres" value={<AnimatedNumber value={Number((property as any).bedrooms_total ?? property.bedrooms) || 0} />} delay={0.1} />
                <SpecCell icon={Droplet} hue={STAGE_HUES.fuchsia} label="Salles de bain" value={<AnimatedNumber value={Number((property as any).bathroom_count ?? property.bathrooms) || 0} />} delay={0.15} />
                {property.sleepingCapacity ? (
                  <SpecCell icon={Users} hue={STAGE_HUES.emerald} label="Couchages" value={<AnimatedNumber value={Number(property.sleepingCapacity)} />} delay={0.2} />
                ) : property.landSize ? (
                  <SpecCell icon={Layers} hue={STAGE_HUES.emerald} label="Terrain" value={<AnimatedNumber value={Number(property.landSize)} />} suffix="m²" delay={0.2} />
                ) : (
                  <SpecCell icon={GridIcon} hue={SLATE_HUE} label="Pièces" value="—" delay={0.2} />
                )}
              </div>
            </motion.div>

            {/* Mission dossier panel */}
            <motion.div
              className="lg:col-span-2 space-y-4"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="stage-glass relative overflow-hidden p-5">
                {/* corner glow */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full"
                  style={{ background: `radial-gradient(circle, ${typeHue.glow.replace(/[\d.]+\)$/, '0.18)')}, transparent 70%)` }}
                />

                {/* eyebrow */}
                <div className="relative flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={`font-mono text-[11px] font-semibold tracking-wider ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}>
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

                {/* title */}
                <h1 className={`relative mt-2.5 text-[22px] font-extrabold leading-tight tracking-[-0.4px] ${
                  isDark
                    ? 'bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent'
                    : 'bg-gradient-to-r from-slate-900 via-slate-800 to-teal-700 bg-clip-text text-transparent'
                }`}>
                  {property.title}
                </h1>

                {/* location */}
                <div className="relative mt-2 flex items-center gap-1.5">
                  <MapPin size={13} style={{ color: typeHue.a }} />
                  <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {property.city}{property.district ? `, ${property.district}` : ''}
                  </span>
                </div>

                {/* price */}
                <div className="relative mt-4 border-t pt-4" style={{ borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)' }}>
                  {property.prixSurDemande ? (
                    <p
                      className="bg-clip-text text-[26px] font-extrabold tracking-tight text-transparent"
                      style={{ backgroundImage: `linear-gradient(100deg, ${typeHue.a}, ${typeHue.b})` }}
                    >
                      Prix sur demande
                    </p>
                  ) : isSeasonal && (property.seasonalPriceMin || property.seasonalPriceMax) ? (
                    <p className="flex items-baseline gap-1.5">
                      <ConfidentialValue>
                        <span
                          className="bg-clip-text text-[26px] font-extrabold tracking-tight text-transparent"
                          style={{ backgroundImage: `linear-gradient(100deg, ${typeHue.a}, ${typeHue.b})` }}
                        >
                          {property.seasonalPriceMin ? formatPrice(property.seasonalPriceMin) : '?'} ~ {property.seasonalPriceMax ? formatPrice(property.seasonalPriceMax) : '?'}
                        </span>
                      </ConfidentialValue>
                      <span className={`text-sm font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>/nuit</span>
                    </p>
                  ) : (
                    <p className="flex items-baseline gap-1.5">
                      <ConfidentialValue>
                        <AnimatedNumber
                          value={displayPrice}
                          className="bg-clip-text text-[28px] font-extrabold tracking-tight text-transparent"
                          style={{ backgroundImage: `linear-gradient(100deg, ${typeHue.a}, ${typeHue.b})` }}
                          suffix=" MAD"
                        />
                      </ConfidentialValue>
                      {property.transactionType === 'location_ld' && (
                        <span className={`text-sm font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>/mois</span>
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

                {/* estimate alert */}
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
                      <p className={`text-xs font-semibold ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                        Estimation&nbsp;: <ConfidentialValue>{formatPrice(property.priceEstimate)}</ConfidentialValue>
                      </p>
                      <p className={`mt-0.5 text-[10px] ${isDark ? 'text-amber-300/60' : 'text-amber-700/70'}`}>
                        <ConfidentialValue>
                          {property.priceEstimate > property.price
                            ? 'Sous-estimé par rapport au marché'
                            : 'Sur-estimé par rapport au marché'}
                        </ConfidentialValue>
                      </p>
                    </div>
                  </div>
                )}

                {/* completion */}
                <div className="relative mt-4 border-t pt-4" style={{ borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)' }}>
                  {completion != null && completionHue ? (
                    <button
                      type="button"
                      onClick={canWrite ? () => setShowCompletionModal(true) : undefined}
                      className={`group block w-full text-left ${canWrite ? 'cursor-pointer' : 'cursor-default'}`}
                      title={canWrite ? 'Modifier la complétion' : undefined}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className={`text-[10px] font-bold uppercase tracking-[0.18em] ${isDark ? 'text-slate-500' : 'text-teal-900/45'} transition-colors group-hover:${isDark ? 'text-slate-300' : 'text-teal-900'}`}>
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
                      <Percent size={12} />
                      Définir la complétion
                    </button>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-lg border border-dashed px-2.5 py-1.5 text-[11px] font-semibold"
                      style={{
                        borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.18)',
                        color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(15,23,42,0.35)',
                      }}
                    >
                      <Percent size={12} />
                      Complétion non définie
                    </span>
                  )}
                </div>
              </div>

              {/* Owner glass card */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="stage-glass p-4"
              >
                <p className={`mb-2.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] ${isDark ? 'text-slate-500' : 'text-teal-900/45'}`}>
                  <User size={11} />
                  Propriétaire{ownerType === 'societe' ? ' · Société' : ''}
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
                    {ownerInitials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      <PermissionValue allowed={canSeeName && canSeeCoords}>
                        <ConfidentialValue>{ownerDisplayName}</ConfidentialValue>
                      </PermissionValue>
                    </p>
                    <p className={`truncate text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <PermissionValue allowed={canSeeCoords}>
                        <ConfidentialValue>{property.owner?.phone ?? property.owner_phone ?? ''}</ConfidentialValue>
                      </PermissionValue>
                    </p>
                    <p className={`truncate text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <PermissionValue allowed={canSeeCoords}>
                        <ConfidentialValue>{property.owner?.email ?? property.owner_email ?? ''}</ConfidentialValue>
                      </PermissionValue>
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                    {[Phone, Mail, MessageSquare].map((Icon, i) => (
                      <button
                        key={i}
                        className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-all hover:scale-110 ${isDark ? 'border-white/10 text-slate-400 hover:bg-white/10 hover:text-white' : 'border-teal-900/10 text-teal-900/50 hover:bg-teal-900/5 hover:text-teal-900'}`}
                      >
                        <Icon size={13} />
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Agent handler card */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="stage-glass flex items-center gap-3 p-4"
              >
                <OrbIcon icon={User} hue={STAGE_HUES.fuchsia} size={40} radius={12} />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: STAGE_HUES.fuchsia.a }}>
                    Agent responsable
                  </p>
                  <p className={`truncate text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {currentAgentName || 'Non assigné'}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* ── Tab rail ────────────────────────────────────────────── */}
          <div
            className="stage-glass overflow-x-auto scrollbar-thin rounded-2xl p-1.5"
            style={{
              transform: 'translateZ(0)',
              willChange: 'scroll-position',
              WebkitOverflowScrolling: 'touch' as any,
            }}
          >
            <div className="flex min-w-max gap-1">
              {tabs.map(tab => {
                const Icon = tab.icon
                const active = tab.id === activeTab
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-colors duration-200 ${
                      active
                        ? 'text-white'
                        : isDark
                          ? 'text-slate-400 hover:text-slate-200'
                          : 'text-slate-500 hover:text-teal-900'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="pd-tab-pill"
                        className="absolute inset-0 rounded-xl border border-white/20"
                        style={{
                          backgroundImage: `linear-gradient(145deg, ${typeHue.a}, ${typeHue.b})`,
                          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.4), 0 8px 22px -8px ${typeHue.glow}`,
                        }}
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                    {!active && (
                      <span className={`absolute inset-0 rounded-xl transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-teal-900/5'}`} />
                    )}
                    <Icon size={14} className="relative z-10" />
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Tab content — blur + rise swap ─────────────────────── */}
          <div className={canWrite ? '' : 'pointer-events-none select-none'}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(6px)' }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <div
                  className="stage-glass rounded-2xl p-5 scrollbar-thin"
                  style={{
                    overscrollBehavior: 'contain',
                    WebkitOverflowScrolling: 'touch' as any,
                    transform: 'translateZ(0)',
                    willChange: 'scroll-position',
                    scrollBehavior: 'smooth' as any,
                  }}
                >
                  {activeTab === 'informations' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                      <div className="lg:col-span-2">
                        <PropertyDetails property={property} showPreview={showPreview} showVariables={showVariables} previewText={previewText} />
                      </div>
                      <div>
                        <PropertySocial property={property} onShowPreviewChange={setShowPreview} onShowVariablesChange={setShowVariables} onPreviewTextChange={setPreviewText} />
                      </div>
                    </div>
                  )}
                  {activeTab === 'media' && (
                    <PropertyMediaGallery
                      property={property}
                      editable={canWrite}
                      variant="carousel"
                      onUpdated={(p) => setProperty(p)}
                    />
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
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </Stage>

      {/* Delete Dialog */}
      <Dialog isOpen={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} title="Supprimer le bien" size="lg">
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-background border border-border/50">
            <p className="text-sm font-medium">{property.reference} · {property.title}</p>
            <p className="text-xs text-text-secondary">{property.city}{property.district ? `, ${property.district}` : ''}</p>
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
