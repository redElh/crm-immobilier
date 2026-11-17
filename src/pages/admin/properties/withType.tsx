import { useNavigate, useParams } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import type { Property } from '../../../types/property';
import {
  PROPERTY_TYPE_LABELS, TRANSACTION_TYPE_LABELS, STATUS_LABELS
} from '../../../types/property';
import {
  Search, Plus, Sliders, X, User,
  Edit3, Copy, Repeat, Trash2, RefreshCw, Eye,
  MapPin, Maximize2, Grid, CheckCircle, AlertTriangle, Hash, Bell,
  FileText, Users, Shield, Calendar, Home,
  ArrowLeft, ChevronRight, TrendingUp, Activity, DollarSign,
} from 'react-feather';
import { AGENTS, ADMINS } from './mockData';
import type { AdminProperty, MandatStatus } from './mockData';
import { DraftSection } from '../../../components/modules/properties/DraftSection';
import { PropertyAssignModal } from '../../../components/modules/properties/PropertyAssignModal';
import { fetchProperties, duplicateProperty, deleteProperty, reassignProperty } from '../../../services/propertyService'
import { api } from '../../../services/api'
import { useToast } from '../../../components/ui/Toast'
import { ConfidentialProvider } from '../../../components/modules/confidentiality/ConfidentialContext';
import { ConfidentialBanner } from '../../../components/modules/confidentiality/ConfidentialBanner';
import { cn } from '../../../lib/utils';
import {
  StagePanel, StageBadge, StageButton, ShimmerProgress, STAGE_HUES, SLATE_HUE, GERANT_MAUVE_HUE,
  useStageTheme, useStageAccent, TiltCard, type StageHue,
} from '../../../components/dashboard/Stage';
import { AdminStatCard } from '../../../components/dashboard/AdminStatCard';
import { stagePillStyle } from '../../../components/modules/prospects/ProspectDetailStage';
import StageModal, { useStageModalButtons } from '../../../components/modules/calendar/StageModal';
import { RegistreActionsMenu, type RegistreAction } from '../../../components/ui/RegistreActionsMenu';

const CITY_GROUPS: Record<string, string[]> = {
  Essaouira: [
    'Argana', 'Azlef', 'Douar Laraab', 'Erraounak', 'Ghazoua', 'Medina',
    'Ounagha', 'Arbaa Ida Ougourd', 'Sidi Kaouki', 'Sidi Magdoul',
    'Sidi Ahmed Essayeh', 'Tidzi',
  ],
};

const TOP_CITIES = ['Essaouira', 'Marrakech', 'Agadir'];

const PAGE_SIZE = 6;

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

const AGENT_HUES: StageHue[] = [
  STAGE_HUES.violet, STAGE_HUES.sky, STAGE_HUES.emerald, STAGE_HUES.amber, STAGE_HUES.fuchsia,
];

const DANGER_HUE: StageHue = {
  a: '#FB7185',
  b: '#E11D48',
  glow: 'rgba(244,63,94,0.45)',
  line: '#F43F5E',
};

const agentHueFor = (id: string | number | null | undefined): StageHue => {
  if (!id) return SLATE_HUE;
  const str = String(id);
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  return AGENT_HUES[hash % AGENT_HUES.length];
};

const formatPrice = (p: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(p);

const getDisplayPrice = (p: any) => {
  if (p?.transactionType === 'location_ld') return p?.loyerHC || 0;
  if (p?.transactionType === 'location_saisonniere') return p?.seasonalPriceMin || p?.price || 0;
  if (p?.prixNetVendeur && p?.honorairesPct && p?.honorairesType === 'inclus') {
    return Math.round(Number(p.prixNetVendeur) * (1 + Number(p.honorairesPct) / 100));
  }
  return p?.prixNetVendeur || p?.price || 0;
};

function StageMixBar({
  segments, isDark, className,
}: {
  segments: { value: number; hue: StageHue }[];
  isDark: boolean;
  className?: string;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  return (
    <div
      className={cn('flex h-1.5 w-full overflow-hidden rounded-full', className)}
      style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.08)' }}
    >
      {total > 0 && segments.map((s, i) =>
        s.value > 0 ? (
          <span
            key={i}
            style={{
              width: `${(s.value / total) * 100}%`,
              background: `linear-gradient(90deg, ${s.hue.b}, ${s.hue.line})`,
              boxShadow: isDark ? `0 0 8px ${s.hue.glow}` : undefined,
            }}
            title={`${s.value}`}
          />
        ) : null,
      )}
    </div>
  );
}

function getOwnerName(property: any) {
  return property?.owner?.name
    || [property?.owner?.firstName, property?.owner?.lastName].filter(Boolean).join(' ')
    || [property?.owner_firstName, property?.owner_lastName].filter(Boolean).join(' ')
    || 'Non renseigné';
}

function PropertySummaryCard({ property, isDark, hue, isGerant = false }: { property: any; isDark: boolean; hue: StageHue; isGerant?: boolean }) {
  const statusKey = STATUS_LABELS[property.status] || property.status || '—';
  const statusHue = STATUS_HUE_MAP[property.status] || hue;
  const price = property.prixSurDemande ? 'Prix sur demande' : formatPrice(getDisplayPrice(property));
  return (
    <div className={cn(
      'flex items-center gap-3 rounded-2xl border p-3.5',
      isDark
        ? 'border-white/[0.08] bg-white/[0.04]'
        : isGerant
          ? 'border-[#905D5D]/15 bg-white/70'
          : 'border-orange-900/10 bg-white/70',
    )}>
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

function StagePropertyCard({
  property, onClick, actions, isDark, hue, index = 0, agentName, isGerant,
}: {
  property: any;
  onClick: () => void;
  actions: RegistreAction[];
  isDark: boolean;
  hue: StageHue;
  index?: number;
  agentName?: string;
  isGerant?: boolean;
}) {
  const statusKey = STATUS_LABELS[property.status] || property.status || '—';
  const statusHue = STATUS_HUE_MAP[property.status] || hue;
  const transHue = property.transactionType === 'vente'
    ? STAGE_HUES.emerald
    : property.transactionType === 'location_saisonniere'
      ? STAGE_HUES.amber
      : STAGE_HUES.sky;
  const ink = isDark ? hue.a : hue.b;
  const statusStyle: React.CSSProperties = isDark
    ? { background: `${statusHue.a}2E`, color: '#fff', border: `1px solid ${statusHue.a}5C`, boxShadow: `0 2px 12px ${statusHue.glow}, inset 0 1px 0 rgba(255,255,255,0.14)` }
    : { background: `${statusHue.a}1C`, color: statusHue.b, border: `1px solid ${statusHue.a}42`, boxShadow: `0 2px 10px ${statusHue.glow}, inset 0 1px 0 rgba(255,255,255,0.7)` };
  const price = property.prixSurDemande ? 'Prix sur demande' : formatPrice(getDisplayPrice(property));
  const surface = property.surface ? `${property.surface} m²` : null;
  const rooms = Number(property.rooms || property.bedrooms || 0) > 0 ? `${property.rooms || property.bedrooms} pièces` : null;
  const ownerName = getOwnerName(property);

  return (
    <motion.div
      layout
      className="h-full"
      initial={{ opacity: 0, y: 28, scale: 0.96, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.55, delay: Math.min(index * 0.05, 0.4), ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="group relative h-full cursor-pointer" style={{ perspective: 1000 }}>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-2 rounded-[26px] opacity-60 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: `radial-gradient(60% 55% at 50% 0%, ${hue.glow}, transparent 70%)`, filter: 'blur(18px)' }}
        />
        <TiltCard className="h-full !rounded-[20px]" onClick={onClick}>
          <div className="absolute inset-x-0 top-0 z-10 h-[3px]" style={{ background: `linear-gradient(90deg, ${hue.a}, ${hue.b})`, boxShadow: `0 0 14px ${hue.glow}` }} />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background: isDark
                ? `radial-gradient(120% 85% at 50% 0%, ${hue.a}26, transparent 62%), radial-gradient(80% 60% at 100% 100%, ${hue.b}14, transparent 60%)`
                : `radial-gradient(120% 85% at 50% 0%, ${hue.a}1F, transparent 62%), radial-gradient(80% 60% at 100% 100%, ${hue.a}10, transparent 60%)`,
            }}
          />
          <div className="relative flex h-full flex-col">
            <div className="flex flex-1 flex-col px-4 pb-3 pt-4">
              <div className="flex items-start gap-3">
                <div className="relative shrink-0">
                  <div
                    className="flex select-none items-center justify-center overflow-hidden text-[15px] font-extrabold tracking-tight"
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 16,
                      background: `linear-gradient(145deg, ${hue.a}, ${hue.b})`,
                      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35), 0 10px 22px -10px ${hue.glow}`,
                    }}
                  >
                    {property.images?.[0]
                      ? <img src={property.images[0]} alt="" className="h-full w-full object-cover" />
                      : <Home size={19} />}
                  </div>
                  <span
                    className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 text-white"
                    style={{ borderColor: isDark ? '#0B1022' : '#ffffff', background: `linear-gradient(145deg, ${hue.a}, ${hue.b})`, boxShadow: `0 2px 8px ${hue.glow}` }}
                  >
                    <Home size={9} />
                  </span>
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <h3 className={`truncate text-[15px] font-extrabold leading-snug tracking-[-0.2px] ${isDark ? 'text-white' : 'text-slate-900'}`}>{property.title || 'Bien sans titre'}</h3>
                  <div className={`mt-1 flex min-w-0 items-center gap-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <span className="inline-flex min-w-0 items-center gap-1 truncate">
                      <Hash size={11} className="shrink-0" style={{ color: ink }} />
                      <span className="truncate font-medium">{property.reference || '—'}</span>
                    </span>
                    <span className="inline-flex min-w-0 items-center gap-1 truncate">
                      <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>·</span>
                      <MapPin size={11} className="shrink-0 opacity-60" />
                      <span className="truncate">{property.city || '—'}</span>
                    </span>
                  </div>
                </div>
                <RegistreActionsMenu
                  alwaysVisible
                  isGerant={isGerant}
                  actions={actions}
                  className="shrink-0"
                />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] backdrop-blur-md" style={statusStyle}>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: statusHue.line }} />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: statusHue.line, boxShadow: `0 0 8px ${statusHue.glow}` }} />
                  </span>
                  <span className="max-w-[160px] truncate">{statusKey}</span>
                </span>
                <span
                  className="inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold"
                  style={isDark ? { background: `${transHue.a}14`, color: transHue.a, border: `1px solid ${transHue.a}30` } : { background: `${transHue.a}12`, color: transHue.b, border: `1px solid ${transHue.a}30` }}
                >
                  {TRANSACTION_TYPE_LABELS[property.transactionType as keyof typeof TRANSACTION_TYPE_LABELS] || property.transactionType}
                </span>
                {property.originalPropertyId && (
                  <span className={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${isDark ? 'border-amber-400/25 bg-amber-400/10 text-amber-300' : 'border-amber-300/60 bg-amber-50 text-amber-700'}`}>Copie</span>
                )}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-1.5">
                <div className={`flex min-w-0 items-center gap-1.5 rounded-xl border px-2 py-[7px] backdrop-blur-sm ${isDark ? 'border-white/[0.07] bg-white/[0.04]' : 'border-slate-200/70 bg-white/75 shadow-[0_1px_2px_rgba(15,23,42,0.05)]'}`}>
                  <Maximize2 size={12} className="shrink-0" style={{ color: ink }} />
                  <span className={`truncate text-[11px] font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{surface || '—'}</span>
                </div>
                <div className={`flex min-w-0 items-center gap-1.5 rounded-xl border px-2 py-[7px] backdrop-blur-sm ${isDark ? 'border-white/[0.07] bg-white/[0.04]' : 'border-slate-200/70 bg-white/75 shadow-[0_1px_2px_rgba(15,23,42,0.05)]'}`}>
                  <Grid size={12} className="shrink-0" style={{ color: ink }} />
                  <span className={`truncate text-[11px] font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{rooms || '—'}</span>
                </div>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <span
                  className="inline-flex max-w-full items-center truncate rounded-lg px-2 py-1 text-[10px] font-bold"
                  style={isDark ? { background: `${hue.a}1E`, color: hue.a, border: `1px solid ${hue.a}36` } : { background: `${hue.a}14`, color: ink, border: `1px solid ${hue.a}36` }}
                >
                  <DollarSign size={10} className="mr-1 shrink-0" />
                  <span className="truncate">{price}</span>
                </span>
                <span className={`inline-flex items-center rounded-lg border px-2 py-1 text-[10px] font-semibold ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-300' : 'border-slate-200/80 bg-white/60 text-slate-500'}`}>
                  {PROPERTY_TYPE_LABELS[property.propertyType as keyof typeof PROPERTY_TYPE_LABELS] || property.propertyType}
                </span>
                <span className={`inline-flex max-w-full items-center gap-1 truncate rounded-lg border px-2 py-1 text-[10px] font-semibold ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-300' : 'border-slate-200/80 bg-white/60 text-slate-500'}`}>
                  <User size={10} className="shrink-0 opacity-60" />
                  <span className="truncate">{agentName || 'Non assigné'}</span>
                </span>
              </div>
              <div className="flex-1" style={{ minHeight: 12 }} />
            </div>
            <div className={`mt-auto flex items-center justify-between gap-2 border-t px-4 py-2.5 backdrop-blur-md ${isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-orange-900/10 bg-white/60'}`}>
              <span className="group/btn inline-flex cursor-pointer items-center gap-1 text-xs font-bold transition-all duration-200 hover:gap-1.5" style={{ color: ink }} onClick={(e) => { e.stopPropagation(); onClick(); }}>
                Voir fiche
                <ChevronRight size={13} strokeWidth={2.5} className="transition-transform duration-200 group-hover/btn:translate-x-0.5" />
              </span>
              <span className={`max-w-[55%] truncate text-[10px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{ownerName}</span>
            </div>
          </div>
        </TiltCard>
      </div>
    </motion.div>
  );
}

export default function AdminPropertiesPageWithType() {
  const navigate = useNavigate();
  const { type, adminId } = useParams<{ type: string; adminId: string }>();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [mandatStatutFilter, setMandatStatutFilter] = useState<string>('all');
  const [mandatTypeFilter, setMandatTypeFilter] = useState<string>('all');
  const [transactionFilter, setTransactionFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [citySubFilter, setCitySubFilter] = useState<string>('all');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [surfaceMin, setSurfaceMin] = useState('');
  const [surfaceMax, setSurfaceMax] = useState('');
  const [dateRange, setDateRange] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const [actionProperty, setActionProperty] = useState<any | null>(null);
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [reassignNote, setReassignNote] = useState('');
  const [sendNotification, setSendNotification] = useState(false);
  const [allProperties, setAllProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [isGerant, setIsGerant] = useState(false);
  const accent = useStageAccent();
  const btns = useStageModalButtons();
  const theme = useStageTheme();
  const isDark = theme === 'dark';
  const gradientTitle = isDark
    ? 'bg-clip-text text-transparent bg-gradient-to-r from-[#F43F5E] via-[#FB7185] to-[#8B7CFF]'
    : 'bg-clip-text text-transparent bg-gradient-to-r from-[#EA580C] via-[#F97316] to-[#FBBF24]';
  const ghostBtn = cn(
    btns.ghost,
    isDark
      ? ''
      : isGerant
        ? '!border-[#905D5D]/15 !text-[#7D5050]/70 hover:!bg-white hover:!text-[#7D5050]'
        : '!border-orange-900/12 !text-orange-900/70 hover:!bg-white hover:!text-orange-900',
  );
  const interfaceHue = isGerant ? GERANT_MAUVE_HUE : accent;
  const fieldLabel = cn(
    'mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em]',
    isDark ? 'text-slate-400' : isGerant ? 'text-[#905D5D]/65' : 'text-orange-900/55',
  );
  const glassLight = isDark ? '' : '!text-orange-900/70 hover:!text-orange-900';

  useEffect(() => {
    api.get<any>('/auth/me')
      .then(u => {
        if (!u) return;
        setCurrentUser(u);
        setIsGerant(u.role === 'gerant');
      })
      .catch(() => {});
  }, []);

  const refreshProperties = () => {
    setLoading(true);
    fetchProperties()
      .then(setAllProperties)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refreshProperties();
  }, []);

  useEffect(() => {
    api.get<any[]>('/admin/users').then(setUsers).catch(() => {});
  }, []);

  const handleAssignProperty = (personId: string) => {
    setShowAssignModal(false);
    if (!type) return;
    const person = users.find(u => String(u.id) === String(personId));
    const isSelf = !personId || (!!currentUser && String(personId) === String(currentUser.id));
    const qs = isSelf ? '' : `?assignedTo=${personId}&assignedType=${person?.role === 'agent' ? 'agent' : 'admin'}`;
    navigate(`/admin/${adminId}/properties/type/${type}/add${qs}`);
  };

  const propertiesForType = useMemo(() => {
    if (!allProperties.length) return [];
    return type ? allProperties.filter((p: any) => p.propertyType === type) : allProperties;
  }, [type, allProperties]);

  const typeLabel = ({ residential: 'Residentiel', commercial: 'Commercial', land: 'Terrains', vacation: 'Vacances', luxury: 'Luxe' } as Record<string, string>)[type || ''] || '';

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

  const TRANSACTION_BY_TYPE: Record<string, string[]> = {
    residential: ['vente', 'location_ld'],
    commercial: ['vente', 'location_ld'],
    land: ['vente'],
    vacation: ['location_saisonniere'],
    luxury: ['vente', 'location_ld'],
  };

  const filteredProperties = useMemo(() => {
    return propertiesForType
      .filter(p =>
        !searchTerm ||
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.reference.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(p => statusFilter === 'all' || p.status === statusFilter)
      .filter(p => agentFilter === 'all' || p.agentId === agentFilter)
      .filter(p => mandatStatutFilter === 'all' || (p.mandate_statutMandat || p.mandateStatus) === mandatStatutFilter)
      .filter(p => mandatTypeFilter === 'all' || p.mandateType === mandatTypeFilter)
      .filter(p => transactionFilter === 'all' || p.transactionType === transactionFilter)
      .filter(p => {
        if (cityFilter === 'all') return true;
        if (cityFilter === 'Essaouira') return citySubFilter === 'all' || p.city === citySubFilter;
        return p.city === cityFilter;
      })
      .filter(p => !priceMin || p.price >= Number(priceMin))
      .filter(p => !priceMax || p.price <= Number(priceMax))
      .filter(p => !surfaceMin || p.surface >= Number(surfaceMin))
      .filter(p => !surfaceMax || p.surface <= Number(surfaceMax))
      .filter(p => {
        if (dateRange === 'all') return true;
        const created = new Date(p.createdAt);
        const now = new Date();
        const diff = now.getTime() - created.getTime();
        const days = diff / (1000 * 60 * 60 * 24);
        if (dateRange === '7') return days <= 7;
        if (dateRange === '30') return days <= 30;
        if (dateRange === '90') return days <= 90;
        return true;
      });
  }, [propertiesForType, searchTerm, statusFilter, agentFilter, mandatStatutFilter, mandatTypeFilter, transactionFilter, cityFilter, citySubFilter, priceMin, priceMax, surfaceMin, surfaceMax, dateRange]);

  const totalPages = Math.max(1, Math.ceil(filteredProperties.length / PAGE_SIZE));
  const paginatedProperties = filteredProperties.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const COLORS = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500', 'bg-cyan-500', 'bg-pink-500'];

  const findPerson = (agentId: string) => {
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

  const getAgentName = (agentId: string) => {
    if (!agentId) return 'Non assigne';
    const person = findPerson(agentId);
    return person ? person.name : 'Ancien agent';
  };

  const getAgentInitials = (agentId: string) => {
    if (!agentId) return 'NA';
    const person = findPerson(agentId);
    return person ? person.initials : agentId.slice(0, 2).toUpperCase();
  };

  const getAgentColor = (agentId: string) => {
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

  const getRoleBadge = (person?: { role?: string; position?: string }, isGerant = false) => {
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

  const statsByAgent = useMemo(() => {
    const stats: Record<string, { total: number; enVente: number; enLocation: number; vendus: number }> = {};

    propertiesForType.forEach((p: any) => {
      const id = p.agentId || '';
      if (!stats[id]) stats[id] = { total: 0, enVente: 0, enLocation: 0, vendus: 0 };
      stats[id].total++;
      if (p.transactionType === 'vente' || p.status === 'for_sale') stats[id].enVente++;
      if (p.transactionType === 'location_ld' || p.transactionType === 'location_saisonniere') stats[id].enLocation++;
      if (p.status === 'sold' || p.status === 'rented' || p.status === 'sold_or_rented') stats[id].vendus++;
    });
    return stats;
  }, [propertiesForType]);

  const totalStats = useMemo(() => {
    const vals = Object.values(statsByAgent);
    return {
      total: vals.reduce((s, v) => s + v.total, 0),
      enVente: vals.reduce((s, v) => s + v.enVente, 0),
      enLocation: vals.reduce((s, v) => s + v.enLocation, 0),
      vendus: vals.reduce((s, v) => s + v.vendus, 0),
    };
  }, [statsByAgent]);

  const statsRows = useMemo(() => {
    const rows: Array<{
      id: string
      person?: { name: string; initials: string; color: string; role?: string; position?: string }
      stats: { total: number; enVente: number; enLocation: number; vendus: number }
    }> = [];
    const seen = new Set<string>();
    const zeros = { total: 0, enVente: 0, enLocation: 0, vendus: 0 };

    const addPerson = (id: string, person?: any) => {
      if (!id || seen.has(id)) return;
      seen.add(id);
      rows.push({ id, person, stats: statsByAgent[id] || zeros });
    };

    users
      .filter((u: any) => u.status !== 'supprimé')
      .forEach((u: any) => {
        const id = String(u.id);
        const name = `${u.first_name || ''} ${u.last_name || ''}`.trim() || '?';
        const initials = `${(u.first_name || '')[0]}${(u.last_name || '')[0]}`.toUpperCase() || '?';
        const color = COLORS[Math.abs(Number(u.id) || String(u.id).length) % COLORS.length];
        addPerson(id, { name, initials, color, role: u.role, position: u.position });
      });

    Object.keys(statsByAgent).forEach(id => addPerson(id, undefined));

    return rows;
  }, [users, statsByAgent]);

  const activeFiltersCount = [
    statusFilter !== 'all',
    agentFilter !== 'all',
    mandatStatutFilter !== 'all',
    mandatTypeFilter !== 'all',
    transactionFilter !== 'all',
    cityFilter !== 'all',
    citySubFilter !== 'all',
    priceMin !== '',
    priceMax !== '',
    surfaceMin !== '',
    surfaceMax !== '',
    dateRange !== 'all',
  ].filter(Boolean).length;

  const resetFilters = () => {
    setStatusFilter('all'); setAgentFilter('all'); setMandatStatutFilter('all');
    setMandatTypeFilter('all'); setTransactionFilter('all'); setCityFilter('all'); setCitySubFilter('all');
    setPriceMin(''); setPriceMax(''); setSurfaceMin(''); setSurfaceMax(''); setDateRange('all');
  };

  const statusOptions = useMemo(() => {
    const statuses = type ? (STATUS_BY_TYPE[type] || Object.keys(STATUS_LABELS)) : Object.keys(STATUS_LABELS);
    return [
      { value: 'all', label: 'Tous les statuts' },
      ...statuses.map(v => ({ value: v, label: STATUS_LABELS[v] || v })),
    ];
  }, [type]);

  const agentOptions = useMemo(() => [
    { value: 'all', label: 'Tous les intervenants' },
    ...users.map(u => ({ value: String(u.id), label: `${u.first_name || ''} ${u.last_name || ''}`.trim() })),
    ...AGENTS.map(a => ({ value: a.id, label: a.name })),
    { value: '__none__', label: 'Non assignes' },
  ], [users]);

  const mandatStatusOptions = [
    { value: 'all', label: 'Tous les mandats' },
    { value: 'Non défini', label: 'Non défini' },
    { value: 'En attente de signature', label: 'En attente de signature' },
    { value: 'actif', label: 'Actif' },
    { value: 'expire', label: 'Expiré' },
    { value: 'resilie', label: 'Résilié' },
    { value: 'termine', label: 'Terminé' },
  ];

  const mandatTypeOptions = [
    { value: 'all', label: 'Tout type de mandat' },
    { value: 'exclusif', label: 'Exclusif' },
    { value: 'simple', label: 'Simple' },
    { value: 'co_exclusif', label: 'Co-exclusif' },
  ];

  const transactionOptions = useMemo(() => {
    if (!type) return [{ value: 'all', label: 'Toutes les transactions' }, ...Object.entries(TRANSACTION_TYPE_LABELS).map(([value, label]) => ({ value, label }))];
    const transactions = TRANSACTION_BY_TYPE[type] || [];
    return [{ value: 'all', label: 'Toutes les transactions' }, ...transactions.map(v => ({ value: v, label: TRANSACTION_TYPE_LABELS[v as keyof typeof TRANSACTION_TYPE_LABELS] || v }))];
  }, [type]);

  const cityOptions = [
    { value: 'all', label: 'Toutes les villes' },
    ...TOP_CITIES.map(c => ({
      value: c,
      label: CITY_GROUPS[c] ? `${c} ▸` : c,
    })),
  ];

  const subCityOptions = cityFilter === 'Essaouira'
    ? [{ value: 'all', label: 'Toutes les localités' }, ...CITY_GROUPS['Essaouira'].map(c => ({ value: c, label: c }))]
    : [];

  const dateRangeOptions = [
    { value: 'all', label: 'Toutes dates' },
    { value: '7', label: '7 derniers jours' },
    { value: '30', label: '30 derniers jours' },
    { value: '90', label: '90 derniers jours' },
  ];

  const mandateStatusBadge = (status: MandatStatus, isGerant = false) => {
    const variants: Record<string, string> = {
      'Non défini': 'bg-gray-50 text-gray-700 border-gray-200',
      'En attente de signature': isGerant ? 'bg-[#E7D5D5] text-[#905D5D] border-[#E0C6C6]' : 'bg-amber-50 text-amber-700 border-amber-200',
      actif: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      expire: 'bg-red-50 text-red-700 border-red-200',
      resilie: 'bg-red-50 text-red-700 border-red-200',
      termine: 'bg-gray-50 text-gray-700 border-gray-200',
    };
    const labels: Record<string, string> = {
      'Non défini': 'Non défini',
      'En attente de signature': 'En attente de signature',
      actif: 'Actif',
      expire: 'Expiré',
      resilie: 'Résilié',
      termine: 'Terminé',
    };
    return { class: variants[status] || '', label: labels[status] || status };
  };

  const handleReassign = async () => {
    if (!actionProperty || !selectedAgent) return;
    try {
      const updated = await reassignProperty(actionProperty.id, selectedAgent, reassignNote);
      setAllProperties(prev => prev.map(p =>
        p.id === actionProperty.id ? { ...p, ...updated } : p
      ));
      setShowReassignDialog(false);
      setSelectedAgent('');
      setReassignNote('');
      setSendNotification(false);
      toast('success', 'Bien réaffecté avec succès');
    } catch (e: any) {
      toast('error', e.message || 'Erreur lors de la réaffectation');
    }
  };

  const { toast } = useToast()

  const handleDelete = async () => {
    if (deleteConfirm !== 'SUPPRIMER' || !actionProperty) return;
    try {
      await deleteProperty(actionProperty.id);
      setAllProperties(prev => prev.filter(p => p.id !== actionProperty.id));
      setShowDeleteDialog(false);
      setDeleteConfirm('');
      setDeleteReason('');
      const removed = actionProperty;
      setActionProperty(null);
      toast('success', `Bien ${removed.reference} supprimé avec succès`);
    } catch (e: any) {
      toast('error', e.message || 'Erreur lors de la suppression');
    }
  };

  const handleStatusChange = async () => {
    if (!actionProperty || newStatus === actionProperty.status) return;
    try {
      const updated = await api.patch<any>(`/properties/${actionProperty.id}/status`, { status: newStatus });
      setAllProperties(prev => prev.map(p =>
        p.id === actionProperty.id ? { ...p, ...updated } : p
      ));
      setShowStatusDialog(false);
      setNewStatus('');
      toast('success', 'Statut mis à jour avec succès');
    } catch (e: any) {
      toast('error', e.message || 'Erreur lors de la mise à jour du statut');
    }
  };

  const summaryStats = useMemo(() => {
    const total = propertiesForType.length;
    const enVente = propertiesForType.filter(p => p.transactionType === 'vente').length;
    const locationLd = propertiesForType.filter(p => p.transactionType === 'location_ld').length;
    const locationSaison = propertiesForType.filter(p => p.transactionType === 'location_saisonniere').length;
    const enLocation = locationLd + locationSaison;
    const vendus = propertiesForType.filter(p => p.status === 'sold' || p.status === 'rented' || p.status === 'sold_or_rented').length;
    const soldVendus = propertiesForType.filter(p => p.status === 'sold' || p.status === 'sold_or_rented').length;
    const soldLoues = propertiesForType.filter(p => p.status === 'rented' || p.status === 'sold_or_rented').length;
    const disponibles = propertiesForType.filter(p => ['for_sale', 'for_rent', 'for_sale_or_rent', 'available'].includes(p.status)).length;
    const sousPromesse = propertiesForType.filter(p => ['under_compromise', 'under_promise'].includes(p.status)).length;
    const negociation = propertiesForType.filter(p => p.status === 'negotiation').length;
    const mandats = propertiesForType.filter(p => (p.mandateType || '').trim().length > 0).length;
    const now = new Date();
    const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const currentMonth = monthKey(now);
    const previousDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonth = monthKey(previousDate);
    const addedThisMonth = propertiesForType.filter(p => p.createdAt?.startsWith(currentMonth)).length;
    const addedPreviousMonth = propertiesForType.filter(p => p.createdAt?.startsWith(previousMonth)).length;
    const addTrend = addedPreviousMonth > 0
      ? Math.round(((addedThisMonth - addedPreviousMonth) / addedPreviousMonth) * 100)
      : addedThisMonth > 0 ? 100 : 0;
    return {
      total, enVente, enLocation, locationLd, locationSaison, vendus, soldVendus, soldLoues,
      disponibles, sousPromesse, negociation, mandats, sansMandat: total - mandats,
      addedThisMonth, addTrend,
    };
  }, [propertiesForType]);

  const sparkBuckets = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const offset = 5 - i;
      const start = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - offset + 1, 1);
      return propertiesForType.filter(p => {
        if (!p.createdAt) return false;
        const d = new Date(p.createdAt);
        return !Number.isNaN(d.getTime()) && d >= start && d < end;
      }).length;
    });
  }, [propertiesForType]);

  const metrics = [
    { key: 'enVente', label: 'En vente', hue: STAGE_HUES.emerald },
    { key: 'enLocation', label: 'En location', hue: STAGE_HUES.sky },
    { key: 'vendus', label: 'Signés', hue: STAGE_HUES.amber },
  ];

  const buildPropertyActions = (property: AdminProperty): RegistreAction[] => {
    if (isOtherAdmin(property.agentId)) {
      return [
        { icon: <Eye size={14} />, label: 'Voir la fiche complète', onClick: () => navigate(`/admin/${adminId}/properties/${property.id}`) },
        {
          icon: <></>,
          label: '',
          content: <div className={cn('px-3 py-2 text-xs italic', isDark ? 'text-slate-500' : 'text-slate-400')}>Lecture seule</div>,
          onClick: () => {},
        },
      ];
    }

    return [
      { icon: <Eye size={14} />, label: 'Voir la fiche complète', onClick: () => navigate(`/admin/${adminId}/properties/${property.id}`) },
      { icon: <Edit3 size={14} />, label: 'Modifier', onClick: () => navigate(`/admin/${adminId}/properties/type/${type}/edit/${property.id}`) },
      {
        icon: <Copy size={14} />,
        label: 'Dupliquer',
        onClick: async () => {
          try {
            const duplicated = await duplicateProperty(property.id);
            setAllProperties(prev => [duplicated, ...prev]);
            toast('success', `Bien ${duplicated.reference} dupliqué avec succès`);
          } catch (e: any) {
            toast('error', e.message || 'Erreur lors de la duplication');
          }
        },
      },
      { separator: true, icon: <></>, label: '', onClick: () => {} },
      {
        icon: <Repeat size={14} />,
        label: 'Réaffecter à un agent',
        onClick: () => {
          setActionProperty(property);
          setSelectedAgent(property.agentId);
          setSendNotification(false);
          setShowReassignDialog(true);
        },
      },
      {
        icon: <RefreshCw size={14} />,
        label: 'Changer le statut',
        onClick: () => {
          setActionProperty(property);
          setNewStatus(property.status);
          setShowStatusDialog(true);
        },
      },
      { separator: true, icon: <></>, label: '', onClick: () => {} },
      {
        icon: <Trash2 size={14} />,
        label: 'Supprimer le bien',
        variant: 'danger',
        onClick: () => {
          setActionProperty(property);
          setDeleteConfirm('');
          setDeleteReason('');
          setShowDeleteDialog(true);
        },
      },
    ];
  };

  return (
    <ConfidentialProvider>
    <div className="space-y-5 pb-24 animate-fade-in">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className={cn('flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[3px]', isDark ? 'text-slate-400' : 'text-teal-900/50')}>
              <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Square Immo · Patrimoine · {typeLabel || 'Biens'}
            </p>
            <h1 className={cn('mt-2 text-4xl font-black tracking-[-2px] sm:text-5xl', gradientTitle)}>
              {typeLabel ? `${typeLabel.toUpperCase()} 360` : 'PATRIMOINE 360'}
            </h1>
            <p className={cn('mt-1.5 text-sm', isDark ? 'text-slate-400' : 'text-teal-900/60')}>
              Analyse complète du portefeuille {typeLabel ? typeLabel.toLowerCase() : 'immobilier'} — volumes, statuts et performance.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StageButton variant="glass" size="md" icon={<ArrowLeft size={14} />} onClick={() => navigate(`/admin/${adminId}/properties`)} className={glassLight}>
              Retour
            </StageButton>
            <StageButton variant="glass" size="md" icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />} onClick={refreshProperties} disabled={loading} className={glassLight}>
              Actualiser
            </StageButton>
            <StageButton size="md" icon={<Plus size={14} />} onClick={() => setShowAssignModal(true)}>
              Ajouter un bien
            </StageButton>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold" style={stagePillStyle(accent, isDark)}>
            <TrendingUp size={12} />
            {filteredProperties.length} filtrés / {propertiesForType.length} total
          </span>
          {activeFiltersCount > 0 && (
            <button onClick={resetFilters} className={cn('inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition-colors', isDark ? 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10' : 'border-orange-900/10 bg-white/70 text-orange-700 hover:bg-white')}>
              <X size={12} /> Réinitialiser ({activeFiltersCount})
            </button>
          )}
        </div>
      </motion.div>

      {allProperties.length > 0 && <ConfidentialBanner isGerant={isGerant} />}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          icon={Home}
          label="Portefeuille"
          value={summaryStats.total}
          unit="biens"
          detail={`${summaryStats.enVente} en vente · ${summaryStats.enLocation} en location`}
          trend={`${summaryStats.addTrend >= 0 ? '+' : ''}${summaryStats.addTrend}%`}
          trendUp={summaryStats.addTrend >= 0}
          hue={accent}
          spark={sparkBuckets}
          facts={[
            { label: 'Avec mandat', value: summaryStats.mandats },
            { label: 'Sans mandat', value: summaryStats.sansMandat },
          ]}
          delay={0}
        />
        <AdminStatCard
          icon={TrendingUp}
          label="En vente"
          value={summaryStats.enVente}
          unit="biens"
          detail={`${summaryStats.total > 0 ? Math.round((summaryStats.enVente / summaryStats.total) * 100) : 0}% du portefeuille`}
          hue={STAGE_HUES.emerald}
          spark={sparkBuckets}
          facts={[
            { label: 'Sous promesse', value: summaryStats.sousPromesse },
            { label: 'En négo', value: summaryStats.negociation },
          ]}
          delay={0.06}
        />
        <AdminStatCard
          icon={MapPin}
          label="En location"
          value={summaryStats.enLocation}
          unit="biens"
          detail={`${summaryStats.locationLd} longue durée · ${summaryStats.locationSaison} saison`}
          hue={STAGE_HUES.sky}
          spark={sparkBuckets}
          facts={[
            { label: 'Longue durée', value: summaryStats.locationLd },
            { label: 'Saisonnière', value: summaryStats.locationSaison },
          ]}
          delay={0.12}
        />
        <AdminStatCard
          icon={CheckCircle}
          label="Signés"
          value={summaryStats.vendus}
          unit="biens"
          detail={`${summaryStats.soldVendus} vendus · ${summaryStats.soldLoues} loués`}
          hue={STAGE_HUES.fuchsia}
          spark={sparkBuckets}
          facts={[
            { label: 'Vendus', value: summaryStats.soldVendus },
            { label: 'Loués', value: summaryStats.soldLoues },
          ]}
          delay={0.18}
        />
      </div>

      <StagePanel
        title="Statistiques par intervenant"
        icon={Users}
        hue={accent}
        action={
          <StageBadge variant="neutral">
            {statsRows.length} intervenant{statsRows.length > 1 ? 's' : ''}
          </StageBadge>
        }
      >
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {metrics.map(m => {
            const total = (totalStats as any)[m.key] || 0;
            return (
              <span
                key={m.key}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-semibold',
                  isDark ? 'border-white/[0.07] bg-white/[0.03] text-slate-400' : 'border-slate-200/70 bg-white/70 text-slate-500',
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.hue.line, boxShadow: `0 0 6px ${m.hue.glow}` }} />
                {m.label}
                <b className={cn('tabular-nums', isDark ? 'text-slate-200' : 'text-slate-800')}>{total}</b>
              </span>
            );
          })}
        </div>

        <div className={cn('overflow-hidden rounded-2xl border', isDark ? 'border-white/[0.07] bg-white/[0.015]' : 'border-slate-200/70 bg-white/60')}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className={cn('border-b', isDark ? 'border-white/[0.07] bg-white/[0.03]' : 'border-slate-200/70 bg-slate-50/70')}>
                  <th className={cn('px-4 py-2.5 text-left text-[9.5px] font-extrabold uppercase tracking-[0.14em]', isDark ? 'text-slate-400' : 'text-slate-500')}>Intervenant</th>
                  <th className={cn('px-4 py-2.5 text-center text-[9.5px] font-extrabold uppercase tracking-[0.14em]', isDark ? 'text-slate-400' : 'text-slate-500')}>Total</th>
                  {metrics.map(m => (
                    <th key={m.key} className={cn('px-4 py-2.5 text-center text-[9.5px] font-extrabold uppercase tracking-[0.14em]', isDark ? 'text-slate-400' : 'text-slate-500')}>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.hue.line, boxShadow: `0 0 5px ${m.hue.glow}` }} />
                        {m.label}
                      </span>
                    </th>
                  ))}
                  <th className={cn('px-4 py-2.5 text-center text-[9.5px] font-extrabold uppercase tracking-[0.14em]', isDark ? 'text-slate-400' : 'text-slate-500')}>Taux signés</th>
                </tr>
              </thead>
              <tbody>
                {statsRows.map(({ id, person, stats: s }) => {
                  const hue = agentHueFor(id);
                  const badge = getRoleBadge(person, isGerant);
                  const rate = s.total > 0 ? Math.round((s.vendus / s.total) * 100) : 0;
                  return (
                    <tr key={id} className={cn('group/row border-b transition-colors duration-200 last:border-0', isDark ? 'border-white/[0.05] hover:bg-white/[0.04]' : 'border-slate-100 hover:bg-white')}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold text-white"
                            style={{ backgroundImage: `linear-gradient(145deg, ${hue.a}, ${hue.b})`, boxShadow: `0 6px 16px -8px ${hue.glow}, inset 0 1px 0 rgba(255,255,255,0.35)` }}
                          >
                            {person?.initials || id.slice(0, 2).toUpperCase()}
                            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2" style={{ background: hue.line, borderColor: isDark ? '#0B1024' : '#fff' }} />
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={cn('truncate text-[13px] font-bold', isDark ? 'text-white' : 'text-slate-900')}>{person?.name || id}</span>
                              {badge && (
                                <span className="rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider" style={stagePillStyle(hue, isDark)}>
                                  {badge.label}
                                </span>
                              )}
                            </div>
                            <span className={cn('text-[10px] font-medium capitalize', isDark ? 'text-slate-500' : 'text-slate-400')}>
                              {person?.position || person?.role || 'Intervenant'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={cn('text-center text-sm font-extrabold tabular-nums', isDark ? 'text-white' : 'text-slate-900')}>{s.total || 0}</div>
                        <StageMixBar
                          className="mx-auto mt-1 max-w-[88px]"
                          isDark={isDark}
                          segments={metrics.map(m => ({ value: (s as any)[m.key] || 0, hue: m.hue }))}
                        />
                      </td>
                      {metrics.map(m => (
                        <td key={m.key} className={cn('px-4 py-3 text-center text-xs font-semibold tabular-nums', isDark ? 'text-slate-300' : 'text-slate-700')}>
                          {(s as any)[m.key] || 0}
                        </td>
                      ))}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-14">
                            <ShimmerProgress pct={rate} colorFrom={hue.a} colorTo={hue.b} glow={hue.glow} height={5} />
                          </div>
                          <span className={cn('min-w-[32px] text-right text-[11px] font-bold tabular-nums', isDark ? 'text-slate-200' : 'text-slate-700')}>{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                <tr className={isDark ? 'bg-white/[0.04]' : 'bg-slate-900/[0.03]'}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold text-white"
                        style={{ backgroundImage: `linear-gradient(145deg, ${accent.a}, ${accent.b})`, boxShadow: `0 6px 16px -8px ${accent.glow}` }}
                      >
                        <Users size={13} />
                      </span>
                      <span className={cn('text-[12px] font-extrabold uppercase tracking-[0.12em]', isDark ? 'text-white' : 'text-slate-900')}>Total équipe</span>
                    </div>
                  </td>
                  <td className={cn('px-4 py-3 text-center text-sm font-extrabold tabular-nums', isDark ? 'text-white' : 'text-slate-900')}>{totalStats.total}</td>
                  {metrics.map(m => (
                    <td key={m.key} className={cn('px-4 py-3 text-center text-xs font-bold tabular-nums', isDark ? 'text-slate-200' : 'text-slate-800')}>
                      {(totalStats as any)[m.key] || 0}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center">
                      <span className={cn('rounded-full px-2 py-1 text-[11px] font-extrabold tabular-nums', isDark ? 'bg-white/[0.06] text-white' : 'bg-white text-slate-900')}>
                        {totalStats.total > 0 ? Math.round((totalStats.vendus / totalStats.total) * 100) : 0}%
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </StagePanel>

      <StagePanel
        title="Recherche et filtres"
        icon={Search}
        hue={accent}
        action={
          <div className="flex items-center gap-1.5">
            {activeFiltersCount > 0 && (
              <StageBadge variant="ok">{activeFiltersCount} filtre{activeFiltersCount > 1 ? 's' : ''}</StageBadge>
            )}
            <span className="hidden sm:inline-flex">
              <StageBadge variant="neutral">{filteredProperties.length} résultat{filteredProperties.length > 1 ? 's' : ''}</StageBadge>
            </span>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <div className="group relative flex-1">
              <div
                className={cn(
                  'relative flex h-12 items-center gap-2.5 rounded-2xl border px-2.5 transition-all duration-300 focus-within:ring-2',
                  isDark
                    ? 'border-white/[0.08] bg-white/[0.04] focus-within:border-white/[0.16] focus-within:ring-white/[0.05]'
                    : 'border-orange-900/10 bg-white/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] focus-within:border-orange-600/30 focus-within:ring-orange-500/[0.08]',
                )}
                style={{ boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.05)' : 'inset 0 1px 0 rgba(255,255,255,0.9)' }}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-transform duration-300 group-focus-within:scale-105"
                  style={{
                    background: `linear-gradient(145deg, ${accent.a}26, ${accent.b}18)`,
                    borderColor: `${accent.a}38`,
                    color: isDark ? accent.a : accent.b,
                    boxShadow: `0 6px 16px -8px ${accent.glow}`,
                  }}
                >
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  placeholder="Rechercher par titre, référence, ville ou localisation..."
                  className={cn(
                    'h-full min-w-0 flex-1 bg-transparent text-sm font-medium outline-none',
                    isDark ? 'text-white placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400',
                  )}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm ? (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors',
                      isDark ? 'text-slate-400 hover:bg-white/[0.08] hover:text-white' : 'text-slate-400 hover:bg-slate-900/[0.06] hover:text-slate-700',
                    )}
                    aria-label="Effacer la recherche"
                  >
                    <X size={13} />
                  </button>
                ) : (
                  <kbd
                    className={cn(
                      'hidden shrink-0 items-center rounded-md border px-1.5 py-0.5 text-[9px] font-bold sm:inline-flex',
                      isDark ? 'border-white/[0.08] bg-white/[0.04] text-slate-500' : 'border-orange-900/10 bg-orange-50/60 text-orange-900/40',
                    )}
                  >
                    {typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform) ? '⌘K' : 'Ctrl K'}
                  </kbd>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StageButton
                variant={showFilters || activeFiltersCount > 0 ? 'primary' : 'glass'}
                size="md"
                icon={<Sliders size={14} />}
                onClick={() => setShowFilters(!showFilters)}
                className={cn('!h-12 flex-1 !rounded-2xl px-4 sm:flex-none', !(showFilters || activeFiltersCount > 0) ? glassLight : '')}
              >
                Filtres
                {activeFiltersCount > 0 && (
                  <span className="ml-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/25 px-1 text-[10px] font-extrabold">
                    {activeFiltersCount}
                  </span>
                )}
              </StageButton>
              {(activeFiltersCount > 0 || searchTerm) && (
                <StageButton
                  variant="glass"
                  size="md"
                  icon={<X size={14} />}
                  onClick={() => { resetFilters(); setSearchTerm(''); }}
                  className={cn('!h-12 !rounded-2xl px-3', glassLight)}
                >
                  Effacer
                </StageButton>
              )}
            </div>
          </div>

          {(activeFiltersCount > 0 || searchTerm) && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className={cn('mr-0.5 text-[10px] font-bold uppercase tracking-[0.14em]', isDark ? 'text-slate-500' : 'text-slate-400')}>
                Actifs
              </span>
              {searchTerm && (
                <button type="button" onClick={() => setSearchTerm('')} className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors" style={stagePillStyle(accent, isDark)}>
                  «{searchTerm.length > 18 ? `${searchTerm.slice(0, 18)}…` : searchTerm}»
                  <X size={10} />
                </button>
              )}
              {statusFilter !== 'all' && (
                <button type="button" onClick={() => setStatusFilter('all')} className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all hover:brightness-95" style={stagePillStyle(accent, isDark)}>
                  <span className={cn('text-[9px] font-bold uppercase tracking-wide', isDark ? 'opacity-60' : 'opacity-70')}>Statut</span>
                  {statusOptions.find(o => o.value === statusFilter)?.label || statusFilter}
                  <X size={10} className="opacity-70" />
                </button>
              )}
              {agentFilter !== 'all' && (
                <button type="button" onClick={() => setAgentFilter('all')} className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all hover:brightness-95" style={stagePillStyle(accent, isDark)}>
                  <span className={cn('text-[9px] font-bold uppercase tracking-wide', isDark ? 'opacity-60' : 'opacity-70')}>Agent</span>
                  {agentOptions.find(o => o.value === agentFilter)?.label || agentFilter}
                  <X size={10} className="opacity-70" />
                </button>
              )}
              {mandatStatutFilter !== 'all' && (
                <button type="button" onClick={() => setMandatStatutFilter('all')} className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all hover:brightness-95" style={stagePillStyle(accent, isDark)}>
                  <span className={cn('text-[9px] font-bold uppercase tracking-wide', isDark ? 'opacity-60' : 'opacity-70')}>Mandat</span>
                  {mandatStatusOptions.find(o => o.value === mandatStatutFilter)?.label || mandatStatutFilter}
                  <X size={10} className="opacity-70" />
                </button>
              )}
              {mandatTypeFilter !== 'all' && (
                <button type="button" onClick={() => setMandatTypeFilter('all')} className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all hover:brightness-95" style={stagePillStyle(accent, isDark)}>
                  <span className={cn('text-[9px] font-bold uppercase tracking-wide', isDark ? 'opacity-60' : 'opacity-70')}>Type mandat</span>
                  {mandatTypeOptions.find(o => o.value === mandatTypeFilter)?.label || mandatTypeFilter}
                  <X size={10} className="opacity-70" />
                </button>
              )}
              {transactionFilter !== 'all' && (
                <button type="button" onClick={() => setTransactionFilter('all')} className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all hover:brightness-95" style={stagePillStyle(accent, isDark)}>
                  <span className={cn('text-[9px] font-bold uppercase tracking-wide', isDark ? 'opacity-60' : 'opacity-70')}>Transaction</span>
                  {transactionOptions.find(o => o.value === transactionFilter)?.label || transactionFilter}
                  <X size={10} className="opacity-70" />
                </button>
              )}
              {cityFilter !== 'all' && (
                <button type="button" onClick={() => { setCityFilter('all'); setCitySubFilter('all'); }} className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all hover:brightness-95" style={stagePillStyle(accent, isDark)}>
                  <span className={cn('text-[9px] font-bold uppercase tracking-wide', isDark ? 'opacity-60' : 'opacity-70')}>Ville</span>
                  {cityFilter}
                  <X size={10} className="opacity-70" />
                </button>
              )}
              {citySubFilter !== 'all' && (
                <button type="button" onClick={() => setCitySubFilter('all')} className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all hover:brightness-95" style={stagePillStyle(accent, isDark)}>
                  <span className={cn('text-[9px] font-bold uppercase tracking-wide', isDark ? 'opacity-60' : 'opacity-70')}>Localité</span>
                  {citySubFilter}
                  <X size={10} className="opacity-70" />
                </button>
              )}
              {priceMin !== '' && (
                <button type="button" onClick={() => setPriceMin('')} className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all hover:brightness-95" style={stagePillStyle(accent, isDark)}>
                  <span className={cn('text-[9px] font-bold uppercase tracking-wide', isDark ? 'opacity-60' : 'opacity-70')}>Prix min</span>
                  {priceMin}
                  <X size={10} className="opacity-70" />
                </button>
              )}
              {priceMax !== '' && (
                <button type="button" onClick={() => setPriceMax('')} className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all hover:brightness-95" style={stagePillStyle(accent, isDark)}>
                  <span className={cn('text-[9px] font-bold uppercase tracking-wide', isDark ? 'opacity-60' : 'opacity-70')}>Prix max</span>
                  {priceMax}
                  <X size={10} className="opacity-70" />
                </button>
              )}
              {surfaceMin !== '' && (
                <button type="button" onClick={() => setSurfaceMin('')} className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all hover:brightness-95" style={stagePillStyle(accent, isDark)}>
                  <span className={cn('text-[9px] font-bold uppercase tracking-wide', isDark ? 'opacity-60' : 'opacity-70')}>Surface min</span>
                  {surfaceMin}
                  <X size={10} className="opacity-70" />
                </button>
              )}
              {surfaceMax !== '' && (
                <button type="button" onClick={() => setSurfaceMax('')} className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all hover:brightness-95" style={stagePillStyle(accent, isDark)}>
                  <span className={cn('text-[9px] font-bold uppercase tracking-wide', isDark ? 'opacity-60' : 'opacity-70')}>Surface max</span>
                  {surfaceMax}
                  <X size={10} className="opacity-70" />
                </button>
              )}
              {dateRange !== 'all' && (
                <button type="button" onClick={() => setDateRange('all')} className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all hover:brightness-95" style={stagePillStyle(accent, isDark)}>
                  <span className={cn('text-[9px] font-bold uppercase tracking-wide', isDark ? 'opacity-60' : 'opacity-70')}>Date</span>
                  {dateRangeOptions.find(o => o.value === dateRange)?.label || dateRange}
                  <X size={10} className="opacity-70" />
                </button>
              )}
            </div>
          )}
        </div>
      </StagePanel>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0, filter: 'blur(6px)' }}
            animate={{ opacity: 1, height: 'auto', filter: 'blur(0px)' }}
            exit={{ opacity: 0, height: 0, filter: 'blur(4px)' }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <StagePanel
              title="Filtres avancés"
              icon={Sliders}
              hue={accent}
              action={
                <StageButton variant="glass" size="sm" icon={<X size={12} />} onClick={resetFilters} disabled={activeFiltersCount === 0} className={glassLight}>
                  Réinitialiser
                </StageButton>
              }
            >
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  { key: 'status', label: 'Statut', icon: Activity, control: <Select options={statusOptions} value={statusFilter} onValueChange={setStatusFilter} placeholder="Statut" /> },
                  { key: 'agent', label: 'Responsable', icon: User, control: <Select options={agentOptions} value={agentFilter} onValueChange={setAgentFilter} placeholder="Responsable" /> },
                  { key: 'mandat', label: 'Mandat', icon: Shield, control: <Select options={mandatStatusOptions} value={mandatStatutFilter} onValueChange={setMandatStatutFilter} placeholder="Mandat" /> },
                  { key: 'mandatType', label: 'Type de mandat', icon: FileText, control: <Select options={mandatTypeOptions} value={mandatTypeFilter} onValueChange={setMandatTypeFilter} placeholder="Type de mandat" /> },
                  { key: 'transaction', label: 'Transaction', icon: Repeat, control: <Select options={transactionOptions} value={transactionFilter} onValueChange={setTransactionFilter} placeholder="Transaction" /> },
                  { key: 'city', label: 'Ville', icon: MapPin, control: <Select options={cityOptions} value={cityFilter} onValueChange={(v) => { setCityFilter(v); setCitySubFilter('all'); }} placeholder="Ville" /> },
                  ...(cityFilter === 'Essaouira' && subCityOptions.length > 0
                    ? [{ key: 'subcity', label: 'Localité', icon: MapPin, control: <Select options={subCityOptions} value={citySubFilter} onValueChange={setCitySubFilter} placeholder="Localité" /> }]
                    : []),
                  { key: 'date', label: 'Date de création', icon: Calendar, control: <Select options={dateRangeOptions} value={dateRange} onValueChange={setDateRange} placeholder="Date de création" /> },
                  {
                    key: 'price',
                    label: 'Prix',
                    icon: DollarSign,
                    control: (
                      <div className="flex items-center gap-1.5">
                        <Input type="number" placeholder="Min" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} />
                        <span className="text-xs text-slate-400">–</span>
                        <Input type="number" placeholder="Max" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} />
                      </div>
                    ),
                  },
                  {
                    key: 'surface',
                    label: 'Surface',
                    icon: Maximize2,
                    control: (
                      <div className="flex items-center gap-1.5">
                        <Input type="number" placeholder="Min" value={surfaceMin} onChange={(e) => setSurfaceMin(e.target.value)} />
                        <span className="text-xs text-slate-400">–</span>
                        <Input type="number" placeholder="Max" value={surfaceMax} onChange={(e) => setSurfaceMax(e.target.value)} />
                      </div>
                    ),
                  },
                ].map(field => {
                  const FieldIcon = field.icon;
                  return (
                    <div
                      key={field.key}
                      className={cn(
                        'rounded-2xl border p-2.5 transition-colors duration-200',
                        isDark ? 'border-white/[0.06] bg-white/[0.03]' : 'border-orange-900/10 bg-white/60',
                      )}
                    >
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <span
                          className="flex h-5 w-5 items-center justify-center rounded-md border"
                          style={{
                            background: `${accent.a}14`,
                            borderColor: `${accent.a}30`,
                            color: isDark ? accent.a : accent.b,
                          }}
                        >
                          <FieldIcon size={10} />
                        </span>
                        <label className={cn('text-[10px] font-bold uppercase tracking-[0.12em]', isDark ? 'text-slate-400' : 'text-slate-500')}>
                          {field.label}
                        </label>
                      </div>
                      {field.control}
                    </div>
                  );
                })}
              </div>
              <div className={cn('mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-[11px] font-medium', isDark ? 'border-white/[0.06] text-slate-500' : 'border-orange-900/10 text-slate-400')}>
                <span className="inline-flex items-center gap-1.5">
                  <span className="live-dot inline-block h-1.5 w-1.5 rounded-full" style={{ background: accent.line, boxShadow: `0 0 6px ${accent.glow}` }} />
                  Les filtres s'appliquent instantanément
                </span>
                <span>
                  <b className={isDark ? 'text-slate-300' : 'text-slate-600'}>{filteredProperties.length}</b> bien{filteredProperties.length > 1 ? 's' : ''} correspondant{filteredProperties.length > 1 ? 's' : ''}
                </span>
              </div>
            </StagePanel>
          </motion.div>
        )}
      </AnimatePresence>

      <DraftSection propertyType={type} adminSlug={adminId} />

      {/* Property List */}
      <StagePanel
        title={`Liste des biens • ${filteredProperties.length} sur ${propertiesForType.length}`}
        icon={Home}
        hue={accent}
        action={<StageBadge variant="neutral">{PAGE_SIZE} par page</StageBadge>}
      >
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: accent.line, borderTopColor: 'transparent' }} />
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="py-14 text-center">
            <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${isDark ? 'bg-white/5 text-slate-500' : 'bg-orange-50 text-orange-700'}`}>
              <Search size={22} />
            </div>
            <p className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Aucun bien trouvé</p>
            <p className={`mt-1 text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {propertiesForType.length > 0 ? 'Essayez de modifier vos filtres' : 'Les biens apparaissent ici une fois ajoutés'}
            </p>
            {(activeFiltersCount > 0 || searchTerm) && (
              <button
                onClick={() => { resetFilters(); setSearchTerm(''); }}
                className={`mt-3 inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold ${isDark ? 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10' : 'border-orange-900/10 bg-white text-orange-700 hover:bg-orange-50'}`}
              >
                <X size={12} /> Effacer les filtres
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid auto-rows-fr grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
              {paginatedProperties.map((property, i) => (
                <StagePropertyCard
                  key={property.id}
                  index={i}
                  property={property}
                  hue={accent}
                  isDark={isDark}
                  agentName={property.agentId ? getAgentName(property.agentId) : undefined}
                  onClick={() => navigate(`/admin/${adminId}/properties/${property.id}`)}
                  actions={buildPropertyActions(property)}
                  isGerant={isGerant}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className={cn('mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4', isDark ? 'border-white/[0.06]' : 'border-orange-900/10')}>
                <p className={cn('text-xs font-medium', isDark ? 'text-slate-500' : 'text-slate-400')}>
                  Affichage <b className={isDark ? 'text-slate-300' : 'text-slate-600'}>{(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filteredProperties.length)}</b> sur {filteredProperties.length} biens
                </p>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-all',
                        p === page
                          ? 'text-white'
                          : isDark ? 'text-slate-400 hover:bg-white/[0.06] hover:text-white' : 'text-slate-500 hover:bg-white hover:text-slate-800',
                      )}
                      style={p === page ? { backgroundImage: `linear-gradient(145deg, ${accent.a}, ${accent.b})`, boxShadow: `0 8px 18px -8px ${accent.glow}` } : undefined}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </StagePanel>

      {/* Reassign Dialog */}
      <StageModal
        open={showReassignDialog}
        onClose={() => setShowReassignDialog(false)}
        title="Réaffecter un bien"
        eyebrow="Attribution"
        subtitle={actionProperty ? [actionProperty.reference, actionProperty.city].filter(Boolean).join(' · ') : undefined}
        icon={Repeat}
        hue={interfaceHue}
        maxWidth="max-w-xl"
        centered
        footer={actionProperty ? (
          <>
            <button className={ghostBtn} onClick={() => setShowReassignDialog(false)}>Annuler</button>
            <button className={cn(btns.primary, isGerant && 'btn-gerant-pill')} onClick={handleReassign} disabled={!selectedAgent}>Réaffecter</button>
          </>
        ) : undefined}
      >
        {actionProperty && (
          <div className="space-y-4">
            <PropertySummaryCard property={actionProperty} isDark={isDark} hue={interfaceHue} isGerant={isGerant} />
            <div>
              <p className={fieldLabel}>Responsable actuel</p>
              <div className="flex items-center gap-2 text-sm">
                {actionProperty.agentId ? (
                  <>
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ background: `linear-gradient(145deg, ${agentHueFor(actionProperty.agentId).a}, ${agentHueFor(actionProperty.agentId).b})` }}
                    >
                      {getAgentInitials(actionProperty.agentId)}
                    </div>
                    <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>{getAgentName(actionProperty.agentId)}</span>
                  </>
                ) : (
                  <span className="italic text-slate-400">Non assigné</span>
                )}
              </div>
            </div>
            <div>
              <label className={fieldLabel}>Nouveau responsable</label>
              <Select
                placeholder="Sélectionner un agent"
                value={selectedAgent}
                onValueChange={setSelectedAgent}
                options={users
                  .filter((u: any) => u.status !== 'supprimé')
                  .map((u: any) => ({
                    value: String(u.id),
                    label: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
                  }))}
              />
            </div>
            <div>
              <label className={fieldLabel}>Note pour l'agent</label>
              <Textarea
                placeholder="Je vous confie ce bien pour le suivi..."
                value={reassignNote}
                onChange={(e) => setReassignNote(e.target.value)}
              />
            </div>
            <label
              className={cn(
                'flex cursor-pointer items-center justify-between gap-3 rounded-2xl border p-3.5 transition-all duration-200',
                isDark
                  ? 'border-white/[0.08] bg-white/[0.04] hover:border-white/[0.14] hover:bg-white/[0.06]'
                  : isGerant
                    ? 'border-[#905D5D]/15 bg-white/70 hover:border-[#905D5D]/30 hover:bg-white'
                    : 'border-orange-900/10 bg-white/70 hover:border-orange-500/25 hover:bg-white',
              )}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors',
                    isDark
                      ? 'border-white/10 bg-white/[0.05] text-slate-300'
                      : isGerant
                        ? 'border-[#905D5D]/15 bg-[#905D5D]/10 text-[#7D5050]'
                        : 'border-orange-900/10 bg-orange-500/10 text-orange-700',
                  )}
                  style={!isDark && sendNotification ? { borderColor: `${interfaceHue.line}33`, background: `${interfaceHue.line}1A`, color: interfaceHue.line } : undefined}
                >
                  <Bell size={15} />
                </span>
                <span className="min-w-0">
                  <span className={cn('block text-xs font-bold', isDark ? 'text-slate-200' : 'text-slate-800')}>Notifier le nouvel agent</span>
                  <span className="mt-0.5 block text-[11px] text-slate-500">Envoyer une notification lors de la réaffectation.</span>
                </span>
              </span>
              <span
                className={cn(
                  'relative h-5 w-9 shrink-0 rounded-full transition-all duration-300',
                  sendNotification ? '' : isDark ? 'bg-white/15' : 'bg-slate-900/15',
                )}
                style={sendNotification ? {
                  backgroundImage: `linear-gradient(90deg, ${interfaceHue.a}, ${interfaceHue.b})`,
                  boxShadow: `0 0 14px -4px ${interfaceHue.glow}, inset 0 1px 0 rgba(255,255,255,0.35)`,
                } : undefined}
              >
                <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-300', sendNotification ? 'translate-x-[18px]' : 'translate-x-0.5')} />
              </span>
              <input
                type="checkbox"
                className="sr-only"
                checked={sendNotification}
                onChange={(e) => setSendNotification(e.target.checked)}
              />
            </label>
          </div>
        )}
      </StageModal>

      {/* Delete Confirmation Dialog */}
      <StageModal
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="Supprimer le bien"
        eyebrow="Zone sensible"
        subtitle={actionProperty ? [actionProperty.reference, actionProperty.city].filter(Boolean).join(' · ') : undefined}
        icon={Trash2}
        hue={DANGER_HUE}
        maxWidth="max-w-xl"
        centered
        footer={actionProperty ? (
          <>
            <button className={ghostBtn} onClick={() => setShowDeleteDialog(false)}>Annuler</button>
            <button
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/20 bg-gradient-to-br from-rose-400 to-rose-600 px-4 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(244,63,94,0.7)] transition-all hover:brightness-110 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40"
              onClick={handleDelete}
              disabled={deleteConfirm !== 'SUPPRIMER'}
            >
              Confirmer la suppression
            </button>
          </>
        ) : undefined}
      >
        {actionProperty && (
          <div className="space-y-4">
            <PropertySummaryCard property={actionProperty} isDark={isDark} hue={DANGER_HUE} isGerant={isGerant} />
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
              <label className={fieldLabel}>Confirmation</label>
              <Input
                placeholder='Tapez "SUPPRIMER" pour confirmer'
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
              />
            </div>
            <div>
              <label className={fieldLabel}>Motif de suppression (optionnel)</label>
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
        )}
      </StageModal>

      {/* Change Status Dialog */}
      <StageModal
        open={showStatusDialog}
        onClose={() => setShowStatusDialog(false)}
        title="Changer le statut"
        eyebrow="Cycle de vie"
        subtitle={actionProperty ? `${actionProperty.title || 'Bien'} · ${actionProperty.reference || ''}` : undefined}
        icon={Activity}
        hue={interfaceHue}
        maxWidth="max-w-lg"
        centered
        footer={actionProperty ? (
          <>
            <button className={ghostBtn} onClick={() => setShowStatusDialog(false)}>Annuler</button>
            <button className={cn(btns.primary, isGerant && 'btn-gerant-pill')} onClick={handleStatusChange} disabled={newStatus === actionProperty.status}>Changer le statut</button>
          </>
        ) : undefined}
      >
        {actionProperty && (
          <div className="space-y-4">
            <PropertySummaryCard property={actionProperty} isDark={isDark} hue={interfaceHue} isGerant={isGerant} />
            <div>
              <p className={fieldLabel}>Nouveau statut</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {(STATUS_BY_TRANSACTION[actionProperty.transactionType] || Object.keys(STATUS_LABELS)).map(s => {
                  const statusHue = STATUS_HUE_MAP[s] || interfaceHue;
                  const active = newStatus === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setNewStatus(s)}
                      className={cn(
                        'rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-all duration-200 active:scale-[0.98]',
                        active ? 'border-transparent' : isDark ? 'border-white/[0.06] bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]' : 'border-orange-900/10 bg-white/70 text-slate-600 hover:bg-white',
                      )}
                      style={active ? stagePillStyle(statusHue, isDark) : undefined}
                    >
                      {STATUS_LABELS[s] || s}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </StageModal>

      <PropertyAssignModal
        open={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        users={users}
        currentUser={currentUser}
        onAssign={handleAssignProperty}
      />
    </div>
    </ConfidentialProvider>
  );
}
