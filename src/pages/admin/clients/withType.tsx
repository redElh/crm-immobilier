import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import {
  Search, Sliders, X, User, Edit3, Copy, Repeat, Trash2,
  Eye, Phone, Mail, MapPin, CheckCircle, AlertTriangle, Bell,
  Users, Shield, Calendar, Star, Home, Briefcase, Sun, Plus,
  UserCheck, DollarSign, TrendingUp, Activity, ArrowLeft,
  ChevronRight, RefreshCw
} from 'react-feather';
import { CITIES } from './mockData';
import type { AdminClient } from './mockData';
import type { Client } from '../../../types/client';
import { BuyerFormModal } from '../../../components/modules/clients/BuyerFormModal';
import { SellerFormModal } from '../../../components/modules/clients/SellerFormModal';
import { BailleurFormModal } from '../../../components/modules/clients/BailleurFormModal';
import { LocataireFormModal } from '../../../components/modules/clients/LocataireFormModal';
import { VoyageurFormModal } from '../../../components/modules/clients/VoyageurFormModal';
import { ClientFormModal } from '../../../components/modules/clients/ClientFormModal';
import { ClientDraftSection } from '../../../components/modules/clients/ClientDraftSection';
import { ClientAssignModal } from '../../../components/modules/clients/ClientAssignModal';
import { getClientStatusHue, getClientInitials } from '../../../components/modules/clients/ClientCard';
import { api } from '../../../services/api';
import { deleteClient, fetchClients, duplicateClient } from '../../../services/clientService';
import { useToast } from '../../../components/ui/Toast';
import { triggerMandatExpireNotification } from '../../../services/automatorTrigger';
import { cn } from '../../../lib/utils';
import {
  StagePanel, StageBadge, StageButton, ShimmerProgress, STAGE_HUES, SLATE_HUE, GERANT_MAUVE_HUE,
  useStageTheme, useStageAccent, TiltCard, type StageHue
} from '../../../components/dashboard/Stage';
import { AdminStatCard } from '../../../components/dashboard/AdminStatCard';
import { stagePillStyle } from '../../../components/modules/prospects/ProspectDetailStage';
import StageModal, { useStageModalButtons } from '../../../components/modules/calendar/StageModal';
import { RegistreActionsMenu, type RegistreAction } from '../../../components/ui/RegistreActionsMenu';

const STATUS_BY_TYPE: Record<string, string[]> = {
  acheteur: ['En qualification', 'En recherche', 'En negociation', 'En compromis', 'Vendu / Achete', 'Inactif', 'Perdu'],
  vendeur: ['En attente de signature', 'En mandat', 'En negociation', 'En compromis', 'Vendu', 'Inactif', 'Perdu'],
  bailleur: ['En attente de signature', 'En mandat', 'En negociation', 'En location', 'Loue', 'Inactif', 'Perdu'],
  locataire: ['En recherche', 'En visite', 'En dossier', 'Bail signe', 'Installe', 'Inactif', 'Perdu'],
  voyageur: ['En recherche', 'Reservation en cours', 'Confirme', 'Paye', 'En sejour', 'Termine', 'Annule', 'Inactif'],
};

const typeLabels: Record<string, string> = {
  acheteur: 'Acheteurs', vendeur: 'Vendeurs', bailleur: 'Bailleurs', locataire: 'Locataires', voyageur: 'Voyageurs',
};

const typeKpiConfig: Record<string, { label: string; icon: any; hue: any; unit?: string }[]> = {
  acheteur: [
    { label: 'Total acheteurs', icon: Users, hue: STAGE_HUES.violet, unit: 'clients' },
    { label: 'Actifs', icon: UserCheck, hue: STAGE_HUES.emerald, unit: 'clients' },
    { label: 'En négociation', icon: Star, hue: STAGE_HUES.amber, unit: 'clients' },
    { label: 'Biens proposés', icon: Home, hue: STAGE_HUES.sky, unit: 'biens' },
  ],
  vendeur: [
    { label: 'Total vendeurs', icon: Home, hue: STAGE_HUES.violet, unit: 'clients' },
    { label: 'Actifs (mandat)', icon: UserCheck, hue: STAGE_HUES.emerald, unit: 'clients' },
    { label: 'En négociation', icon: Star, hue: STAGE_HUES.amber, unit: 'clients' },
    { label: 'Biens en stock', icon: Briefcase, hue: STAGE_HUES.sky, unit: 'biens' },
  ],
  bailleur: [
    { label: 'Total bailleurs', icon: Briefcase, hue: STAGE_HUES.emerald, unit: 'clients' },
    { label: 'Baux actifs', icon: CheckCircle, hue: STAGE_HUES.violet, unit: 'baux' },
    { label: 'En location', icon: Home, hue: STAGE_HUES.sky, unit: 'biens' },
    { label: 'Locations ce mois', icon: Calendar, hue: STAGE_HUES.fuchsia, unit: 'locations' },
  ],
  locataire: [
    { label: 'Total locataires', icon: Users, hue: STAGE_HUES.amber, unit: 'clients' },
    { label: 'Actifs', icon: UserCheck, hue: STAGE_HUES.emerald, unit: 'clients' },
    { label: 'Baux signés', icon: CheckCircle, hue: STAGE_HUES.sky, unit: 'baux' },
    { label: 'Biens proposés', icon: Home, hue: STAGE_HUES.violet, unit: 'biens' },
  ],
  voyageur: [
    { label: 'Total voyageurs', icon: Sun, hue: STAGE_HUES.fuchsia, unit: 'clients' },
    { label: 'Actifs', icon: UserCheck, hue: STAGE_HUES.emerald, unit: 'clients' },
    { label: 'Réservations confirmées', icon: CheckCircle, hue: STAGE_HUES.violet, unit: 'résas' },
    { label: 'Séjours terminés ce mois', icon: Calendar, hue: STAGE_HUES.sky, unit: 'séjours' },
  ],
};

const TYPE_METRICS: Record<string, { key: string; label: string; hue: StageHue }[]> = {
  acheteur: [
    { key: 'actifs', label: 'Actifs', hue: STAGE_HUES.emerald },
    { key: 'enNegoc', label: 'En négoc.', hue: STAGE_HUES.amber },
    { key: 'enCompromis', label: 'En compromis', hue: STAGE_HUES.sky },
    { key: 'vendusAchetes', label: 'Achetés', hue: STAGE_HUES.violet },
    { key: 'proposesStock', label: 'Proposés', hue: STAGE_HUES.fuchsia },
  ],
  vendeur: [
    { key: 'actifs', label: 'Actifs', hue: STAGE_HUES.emerald },
    { key: 'enNegoc', label: 'En négoc.', hue: STAGE_HUES.amber },
    { key: 'enCompromis', label: 'En compromis', hue: STAGE_HUES.sky },
    { key: 'vendusAchetes', label: 'Vendus', hue: STAGE_HUES.violet },
    { key: 'proposesStock', label: 'En stock', hue: STAGE_HUES.fuchsia },
  ],
  bailleur: [
    { key: 'actifs', label: 'Actifs', hue: STAGE_HUES.emerald },
    { key: 'bauxActifs', label: 'Baux actifs', hue: STAGE_HUES.violet },
    { key: 'locations', label: 'Locations', hue: STAGE_HUES.sky },
    { key: 'enLocation', label: 'En location', hue: STAGE_HUES.amber },
    { key: 'proposesStock', label: 'Biens', hue: STAGE_HUES.fuchsia },
  ],
  locataire: [
    { key: 'actifs', label: 'Actifs', hue: STAGE_HUES.emerald },
    { key: 'enDossier', label: 'En dossier', hue: STAGE_HUES.violet },
    { key: 'bauxSignes', label: 'Baux signés', hue: STAGE_HUES.sky },
    { key: 'installes', label: 'Installés', hue: STAGE_HUES.amber },
    { key: 'proposesStock', label: 'Proposés', hue: STAGE_HUES.fuchsia },
  ],
  voyageur: [
    { key: 'actifs', label: 'Actifs', hue: STAGE_HUES.emerald },
    { key: 'reservations', label: 'Réservations', hue: STAGE_HUES.violet },
    { key: 'sejourEnCours', label: 'Séjour en cours', hue: STAGE_HUES.sky },
    { key: 'sejoursTermines', label: 'Terminés', hue: STAGE_HUES.amber },
  ],
};

const AGENT_HUES: StageHue[] = [
  STAGE_HUES.violet, STAGE_HUES.sky, STAGE_HUES.emerald, STAGE_HUES.amber, STAGE_HUES.fuchsia,
];

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

function ClientSummaryCard({ client, isDark, hue, isGerant = false }: { client: any; isDark: boolean; hue: StageHue; isGerant?: boolean }) {
  const statusKey = (client.statutMetier || client.status || '').trim() || '—';
  const statusHue = getClientStatusHue(statusKey) || hue;
  const initials = getClientInitials(client.name || 'Client');
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
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
        style={{ background: `linear-gradient(145deg, ${hue.a}, ${hue.b})`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35), 0 8px 18px -8px ${hue.glow}` }}
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>{client.name || 'Client'}</p>
        <p className={cn('truncate text-xs', isDark ? 'text-slate-400' : 'text-orange-900/55')}>
          {[client.type, client.phone].filter(Boolean).join(' · ') || '—'}
        </p>
      </div>
      <span className="shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold" style={stagePillStyle(statusHue, isDark)}>
        {statusKey}
      </span>
    </div>
  );
}

/* Premium Stage client card — accent identity in both themes.
   Status badge = per-status convenient color (all types).
   Orb avatar, chip details, halo + lift. Footer pinned to bottom. */
function StageClientCard({ client, onClick, actions, isDark, hue, index = 0, isGerant }: { client: any; onClick: () => void; actions: RegistreAction[]; isDark: boolean; hue: StageHue; index?: number; isGerant?: boolean }) {
  const statusKey = (client.statutMetier || client.status || '').trim() || '—';
  const accent = hue;
  const ink = isDark ? hue.a : hue.b;
  const statusHue = getClientStatusHue(statusKey) || accent;
  const badgeStyle: React.CSSProperties = isDark
    ? { background: `${statusHue.a}2E`, color: '#fff', border: `1px solid ${statusHue.a}5C`, boxShadow: `0 2px 12px ${statusHue.glow}, inset 0 1px 0 rgba(255,255,255,0.14)` }
    : { background: `${statusHue.a}1C`, color: statusHue.b, border: `1px solid ${statusHue.a}42`, boxShadow: `0 2px 10px ${statusHue.glow}, inset 0 1px 0 rgba(255,255,255,0.7)` };
  const devise = (client as any).devise || 'MAD';
  const fmt = (v?: number) => (v != null ? Number(v).toLocaleString('fr-FR') : null);
  const money = client.budget != null
    ? `${fmt(client.budget)} ${devise}`
    : (client.prixMin != null || client.prixMax != null)
      ? `${fmt(client.prixMin) || '?'} ~ ${fmt(client.prixMax) || '?'} ${devise}`
      : client.loyerHC != null
        ? `${fmt(client.loyerHC)} ${devise}/mois`
        : client.tarifNuit != null
          ? `${fmt(client.tarifNuit)} ${devise}/nuit`
          : client.budgetTotal != null
            ? `Total ${fmt(client.budgetTotal)} ${devise}`
            : null;
  const units = client.pieces
    ? `${client.pieces} pièces`
    : client.chambres
      ? `${client.chambres} ch.`
      : client.nbPersonnes || client.nbVoyageurs
        ? `${client.nbPersonnes || client.nbVoyageurs} pers.`
        : null;
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
          style={{ background: `radial-gradient(60% 55% at 50% 0%, ${accent.glow}, transparent 70%)`, filter: 'blur(18px)' }}
        />
        <TiltCard className="h-full !rounded-[20px]" onClick={onClick}>
          <div className="absolute inset-x-0 top-0 z-10 h-[3px]" style={{ background: `linear-gradient(90deg, ${accent.a}, ${accent.b})`, boxShadow: `0 0 14px ${accent.glow}` }} />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background: isDark
                ? `radial-gradient(120% 85% at 50% 0%, ${accent.a}26, transparent 62%), radial-gradient(80% 60% at 100% 100%, ${accent.b}14, transparent 60%)`
                : `radial-gradient(120% 85% at 50% 0%, ${accent.a}1F, transparent 62%), radial-gradient(80% 60% at 100% 100%, ${accent.a}10, transparent 60%)`,
            }}
          />
          <div className="relative flex h-full flex-col">
            <div className="flex flex-1 flex-col px-4 pb-3 pt-4">
              <div className="flex items-start gap-3">
                <div className="relative shrink-0">
                  <div
                    className="orb-icon select-none text-[15px] font-extrabold tracking-tight"
                    style={{ width: 50, height: 50, borderRadius: 16, '--orb-a': accent.a, '--orb-b': accent.b, '--orb-glow': accent.glow } as React.CSSProperties}
                  >
                    {getClientInitials(client.name)}
                  </div>
                  <span
                    className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 text-white"
                    style={{ borderColor: isDark ? '#0B1022' : '#ffffff', background: `linear-gradient(145deg, ${accent.a}, ${accent.b})`, boxShadow: `0 2px 8px ${accent.glow}` }}
                  >
                    <CheckCircle size={9} />
                  </span>
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <h3 className={`truncate text-[15px] font-extrabold leading-snug tracking-[-0.2px] ${isDark ? 'text-white' : 'text-slate-900'}`}>{client.name || 'Sans nom'}</h3>
                  <div className={`mt-1 flex min-w-0 items-center gap-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <span className="inline-flex min-w-0 items-center gap-1 truncate">
                      <Phone size={11} className="shrink-0" style={{ color: ink }} />
                      <span className="truncate font-medium">{client.phone || '—'}</span>
                    </span>
                    {client.email && (
                      <span className="inline-flex min-w-0 items-center gap-1 truncate">
                        <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>·</span>
                        <Mail size={11} className="shrink-0 opacity-60" />
                        <span className="truncate">{client.email}</span>
                      </span>
                    )}
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
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] backdrop-blur-md" style={badgeStyle}>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: statusHue.line }} />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: statusHue.line, boxShadow: `0 0 8px ${statusHue.glow}` }} />
                  </span>
                  <span className="max-w-[160px] truncate">{statusKey}</span>
                </span>
                {client.type && (
                  <span
                    className="inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold"
                    style={isDark ? { background: `${accent.a}14`, color: accent.a, border: `1px solid ${accent.a}30` } : { background: `${accent.a}12`, color: ink, border: `1px solid ${accent.a}30` }}
                  >
                    {client.type}
                  </span>
                )}
                {(client as any).originalClientId && (
                  <span className={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${isDark ? 'border-amber-400/25 bg-amber-400/10 text-amber-300' : 'border-amber-300/60 bg-amber-50 text-amber-700'}`}>Copie</span>
                )}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-1.5">
                <div className={`flex min-w-0 items-center gap-1.5 rounded-xl border px-2 py-[7px] backdrop-blur-sm ${isDark ? 'border-white/[0.07] bg-white/[0.04]' : 'border-slate-200/70 bg-white/75 shadow-[0_1px_2px_rgba(15,23,42,0.05)]'}`}>
                  <MapPin size={12} className="shrink-0" style={{ color: ink }} />
                  <span className={`truncate text-[11px] font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{client.secteur || client.area || '—'}</span>
                </div>
                <div className={`flex min-w-0 items-center gap-1.5 rounded-xl border px-2 py-[7px] backdrop-blur-sm ${isDark ? 'border-white/[0.07] bg-white/[0.04]' : 'border-slate-200/70 bg-white/75 shadow-[0_1px_2px_rgba(15,23,42,0.05)]'}`}>
                  <Home size={12} className="shrink-0" style={{ color: ink }} />
                  <span className={`truncate text-[11px] font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{client.propertyType || '—'}</span>
                </div>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {money && (
                  <span
                    className="inline-flex max-w-full items-center truncate rounded-lg px-2 py-1 text-[10px] font-bold"
                    style={isDark ? { background: `${accent.a}1E`, color: accent.a, border: `1px solid ${accent.a}36` } : { background: `${accent.a}14`, color: ink, border: `1px solid ${accent.a}36` }}
                  >
                    <DollarSign size={10} className="mr-1 shrink-0" />
                    <span className="truncate">{money}</span>
                  </span>
                )}
                {units && (
                  <span className={`inline-flex items-center rounded-lg border px-2 py-1 text-[10px] font-semibold ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-300' : 'border-slate-200/80 bg-white/60 text-slate-500'}`}>{units}</span>
                )}
                {client.agentDesigne || client.agentId ? (
                  <span className={`inline-flex max-w-full items-center gap-1 truncate rounded-lg border px-2 py-1 text-[10px] font-semibold ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-300' : 'border-slate-200/80 bg-white/60 text-slate-500'}`}>
                    <User size={10} className="shrink-0 opacity-60" />
                    <span className="truncate">{client.agentDesigne || 'Assigné'}</span>
                  </span>
                ) : null}
              </div>
              {/* spacer pushes footer to the bottom so all cards align */}
              <div className="flex-1" style={{ minHeight: 12 }} />
            </div>
            <div className={`mt-auto flex items-center justify-between gap-2 border-t px-4 py-2.5 backdrop-blur-md ${isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-orange-900/10 bg-white/60'}`}>
              <span className="group/btn inline-flex cursor-pointer items-center gap-1 text-xs font-bold transition-all duration-200 hover:gap-1.5" style={{ color: ink }} onClick={(e) => { e.stopPropagation(); onClick(); }}>
                Voir fiche
                <ChevronRight size={13} strokeWidth={2.5} className="transition-transform duration-200 group-hover/btn:translate-x-0.5" />
              </span>
              <span className={`text-[10px] font-medium tabular-nums ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{client.lastContact ? new Date(client.lastContact).toLocaleDateString('fr-FR') : ''}</span>
            </div>
          </div>
        </TiltCard>
      </div>
    </motion.div>
  );
}

export default function AdminClientsPageWithType() {
  const navigate = useNavigate();
  const { type, adminId } = useParams<{ type: string; adminId: string }>();
  const location = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [mandatStatutFilter, setMandatStatutFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [dateRange, setDateRange] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isGerant, setIsGerant] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
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
    api.get<any[]>('/admin/users').then(setUsers).catch(() => {});
    api.get<any>('/auth/me').then(u => { setCurrentUser(u); if (u) setIsGerant(u.role === 'gerant'); }).catch(() => {});
  }, []);
  const [actionClient, setActionClient] = useState<AdminClient | null>(null);
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<AdminClient | null>(null);
  const [resumeDraftId, setResumeDraftId] = useState<string | undefined>(undefined);
  const [draftVersion, setDraftVersion] = useState(0);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [reassignNote, setReassignNote] = useState('');
  const [sendNotification, setSendNotification] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | undefined>(undefined);
  const [apiClients, setApiClients] = useState<AdminClient[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const refreshClients = () => {
    setLoadingClients(true);
    fetchClients()
      .then(data => setApiClients(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoadingClients(false));
  };
  useEffect(() => { refreshClients(); }, []);
  useEffect(() => {
    const state = location.state as any;
    if (state?.editingClient) { setEditingClient(state.editingClient); setIsModalOpen(true); window.history.replaceState({}, ''); }
    if (sessionStorage.getItem('openNewClientModal') === '1') {
      sessionStorage.removeItem('openNewClientModal');
      const contactId = sessionStorage.getItem('selectedContactId') || undefined;
      if (contactId) sessionStorage.removeItem('selectedContactId');
      setSelectedContactId(contactId); setIsModalOpen(true);
    }
  }, [location.state]);
  const clientsForType = useMemo(() => {
    const typeTitle = (typeLabels[type || ''] || '').replace(/s$/, '').toLowerCase();
    return apiClients.filter(c => (c.type || '').toLowerCase() === typeTitle);
  }, [type, apiClients]);
  const typeLabel = typeLabels[type || ''] || '';
  const metrics = TYPE_METRICS[type || ''] || [];
  const kpiValues = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const total = clientsForType.length;
    const actifs = clientsForType.filter(c => c.status === 'Actif' || c.statutMetier === 'En mandat' || c.statutMetier === 'En recherche').length;
    const enNegoc = clientsForType.filter(c => c.statutMetier === 'En negociation' || c.status === 'En négociation').length;
    const proposesStock = clientsForType.reduce((sum, c) => sum + (c.pieces || 0), 0);
    const bauxActifs = clientsForType.filter(c => c.statutMetier === 'Bail signe').length;
    const locations = clientsForType.filter(c => c.createdAt?.startsWith(currentMonth) && (c.statutMetier === 'Bail signe' || c.type === 'Bailleur')).length;
    const enLocation = clientsForType.filter(c => c.statutMetier === 'En location').length;
    const bauxSignes = clientsForType.filter(c => c.statutMetier === 'Bail signe').length;
    const reservations = clientsForType.filter(c => c.statutMetier === 'Confirme').length;
    const sejoursTermines = clientsForType.filter(c => c.statutMetier === 'Termine').length;
    const map: Record<string, number[]> = {
      acheteur: [total, actifs, enNegoc, proposesStock],
      vendeur: [total, actifs, enNegoc, proposesStock],
      bailleur: [total, bauxActifs, enLocation, locations],
      locataire: [total, actifs, bauxSignes, proposesStock],
      voyageur: [total, actifs, reservations, sejoursTermines],
    };
    return map[type || ''] || [];
  }, [type, clientsForType]);
  const sparkBuckets = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const offset = 5 - i;
      const start = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - offset + 1, 1);
      return clientsForType.filter(c => {
        if (!c.createdAt) return false;
        const d = new Date(c.createdAt);
        return !Number.isNaN(d.getTime()) && d >= start && d < end;
      }).length;
    });
  }, [clientsForType]);
  const COLORS = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500', 'bg-cyan-500', 'bg-pink-500'];
  const findPerson = (agentId: string) => {
    if (!agentId) return undefined;
    const byId = users.find(u => String(u.id) === agentId);
    if (byId) {
      const initials = `${(byId.first_name || '')[0]}${(byId.last_name || '')[0]}`.toUpperCase() || '?';
      const color = COLORS[Math.abs(Number(byId.id) || byId.id.length) % COLORS.length];
      return { name: `${byId.first_name || ''} ${byId.last_name || ''}`.trim(), initials, color, role: byId.role, position: byId.position };
    }
    const byName = users.find(u => {
      const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
      return fullName.toLowerCase() === agentId.toLowerCase() || `${u.last_name || ''} ${u.first_name || ''}`.trim().toLowerCase() === agentId.toLowerCase();
    });
    if (byName) {
      const initials = `${(byName.first_name || '')[0]}${(byName.last_name || '')[0]}`.toUpperCase() || '?';
      const color = COLORS[Math.abs(Number(byName.id) || byName.id.length) % COLORS.length];
      return { name: `${byName.first_name || ''} ${byName.last_name || ''}`.trim(), initials, color, role: byName.role, position: byName.position };
    }
    if (currentUser && String(currentUser.id) === agentId) {
      const initials = `${(currentUser.first_name || '')[0]}${(currentUser.last_name || '')[0]}`.toUpperCase() || '?';
      return { name: `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim(), initials, color: 'bg-indigo-500', role: 'admin', position: currentUser.position };
    }
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
  const getRoleBadge = (person?: { role?: string; position?: string }, isGerant = false) => {
    if (!person) return null;
    if (person.role === 'agent') return { label: person.position || 'Agent', cls: 'bg-emerald-100 text-emerald-700' };
    if (person.role === 'gerant') return { label: 'Gérant', cls: isGerant ? 'bg-[#E7D5D5] text-[#905D5D]' : 'bg-orange-100 text-orange-700' };
    if (person.role === 'admin') return { label: 'Admin', cls: 'bg-indigo-100 text-indigo-700' };
    return null;
  };
  const computeStats = (clientList: any[]) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const activeByType: Record<string, Set<string>> = {
      acheteur: new Set(['En qualification', 'En recherche', 'En negociation', 'En compromis']),
      vendeur: new Set(['En attente de signature', 'En mandat', 'En negociation', 'En compromis']),
      bailleur: new Set(['En attente de signature', 'En mandat', 'En negociation', 'En location']),
      locataire: new Set(['En recherche', 'En visite', 'En dossier', 'Bail signe', 'Installe']),
      voyageur: new Set(['En recherche', 'Reservation en cours', 'Confirme', 'Paye', 'En sejour']),
    };
    const total = clientList.length;
    const actifs = clientList.filter(c => activeByType[(c.type || '').toLowerCase()]?.has(c.statutMetier || '')).length;
    const enNegoc = clientList.filter(c => c.statutMetier === 'En negociation').length;
    const enCompromis = clientList.filter(c => c.statutMetier === 'En compromis').length;
    const vendusAchetes = clientList.filter(c => c.statutMetier === 'Vendu / Achete' || c.statutMetier === 'Vendu').length;
    const proposesStock = clientList.reduce((sum, c) => sum + (c.pieces || 0), 0);
    const bauxActifs = clientList.filter(c => c.statutMetier === 'Bail signe').length;
    const locations = clientList.filter(c => c.createdAt?.startsWith(currentMonth)).length;
    const enLocation = clientList.filter(c => c.statutMetier === 'En location').length;
    const enDossier = clientList.filter(c => c.statutMetier === 'En dossier').length;
    const bauxSignes = clientList.filter(c => c.statutMetier === 'Bail signe').length;
    const installes = clientList.filter(c => c.statutMetier === 'Installe').length;
    const reservations = clientList.filter(c => c.statutMetier === 'Confirme').length;
    const sejourEnCours = clientList.filter(c => c.statutMetier === 'En cours' || c.statutMetier === 'Occupe').length;
    const sejoursTermines = clientList.filter(c => c.statutMetier === 'Termine').length;
    return { total, actifs, enNegoc, enCompromis, vendusAchetes, proposesStock, bauxActifs, locations, enLocation, revenus: 0, enDossier, bauxSignes, installes, reservations, sejourEnCours, sejoursTermines };
  };
  const statsByAgent = useMemo(() => {
    return users.filter((u: any) => u.status !== 'supprimé').map((user: any) => {
      const userId = String(user.id);
      const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim().toLowerCase();
      const myClients = clientsForType.filter(c => {
        const agentName = (c.agentDesigne || '').trim().toLowerCase();
        const agentIdStr = String(c.agentId || '').trim();
        return agentName === userName || agentIdStr === userId;
      });
      return { user, s: computeStats(myClients) };
    });
  }, [users, clientsForType]);
  const tableTotals = useMemo(() => {
    const sum = (fn: (row: any) => number) => statsByAgent.reduce((acc, row) => acc + (fn(row.s) || 0), 0);
    return {
      total: sum(s => s.total), actifs: sum(s => s.actifs), enNegoc: sum(s => s.enNegoc), enCompromis: sum(s => s.enCompromis),
      vendusAchetes: sum(s => s.vendusAchetes), proposesStock: sum(s => s.proposesStock), bauxActifs: sum(s => s.bauxActifs),
      locations: sum(s => s.locations), enLocation: sum(s => s.enLocation), enDossier: sum(s => s.enDossier), bauxSignes: sum(s => s.bauxSignes),
      installes: sum(s => s.installes), reservations: sum(s => s.reservations), sejourEnCours: sum(s => s.sejourEnCours), sejoursTermines: sum(s => s.sejoursTermines), revenus: sum(s => s.revenus),
    };
  }, [statsByAgent]);
  const filteredClients = useMemo(() => {
    const now = new Date();
    return clientsForType.filter(c => {
      const name = (c.name || '').toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      const q = searchTerm.toLowerCase();
      const matchesSearch = !q || name.includes(q) || phone.includes(q) || email.includes(q);
      const matchesStatus = statusFilter === 'all' || c.statutMetier === statusFilter || c.status === statusFilter;
      const matchesAgent = (() => {
        if (agentFilter === 'all') return true;
        if (agentFilter === '__none__') return !c.agentId;
        const agentUser = users.find((u: any) => String(u.id) === agentFilter);
        const agentUserName = agentUser ? `${agentUser.first_name || ''} ${agentUser.last_name || ''}`.trim().toLowerCase() : '';
        return String(c.agentId) === agentFilter || ((c.agentDesigne || '').toLowerCase() === agentUserName && agentUserName !== '');
      })();
      const matchesMandat = mandatStatutFilter === 'all' || ((c as any).mandatStatus || (c as any).mandateStatus || '').toLowerCase() === mandatStatutFilter;
      const matchesCity = cityFilter === 'all' || (c.secteur || c.area || '').toLowerCase() === cityFilter.toLowerCase();
      let matchesBudget = true;
      if (budgetMin) matchesBudget = matchesBudget && (c.budget || 0) >= Number(budgetMin);
      if (budgetMax) matchesBudget = matchesBudget && (c.budget || 0) <= Number(budgetMax);
      let matchesDate = true;
      if (dateRange !== 'all' && c.createdAt) {
        const days = Number(dateRange);
        const created = new Date(c.createdAt);
        const diff = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        matchesDate = diff <= days;
      }
      return matchesSearch && matchesStatus && matchesAgent && matchesMandat && matchesCity && matchesBudget && matchesDate;
    });
  }, [clientsForType, searchTerm, statusFilter, agentFilter, mandatStatutFilter, cityFilter, budgetMin, budgetMax, dateRange, users]);
  const activeFiltersCount = [statusFilter !== 'all', agentFilter !== 'all', mandatStatutFilter !== 'all', cityFilter !== 'all', budgetMin !== '', budgetMax !== '', dateRange !== 'all'].filter(Boolean).length;
  const resetFilters = () => { setStatusFilter('all'); setAgentFilter('all'); setMandatStatutFilter('all'); setCityFilter('all'); setBudgetMin(''); setBudgetMax(''); setDateRange('all'); };
  const statusOptions = useMemo(() => {
    const statuses = type ? (STATUS_BY_TYPE[type] || []) : [];
    return [{ value: 'all', label: 'Tous les statuts' }, ...statuses.map(v => ({ value: v, label: v }))];
  }, [type]);
  const agentOptions = [{ value: 'all', label: 'Tous les agents' }, ...users.filter((u: any) => u.role === 'agent').map((u: any) => ({ value: String(u.id), label: `${u.first_name || ''} ${u.last_name || ''}`.trim() })), { value: '__none__', label: 'Non assignes' }];
  const mandatStatusOptions = [{ value: 'all', label: 'Tous les mandats' }, { value: 'actif', label: 'Actif' }, { value: 'expire', label: 'Expire' }, { value: 'en_attente', label: 'En attente' }, { value: 'termine', label: 'Termine' }];
  const dateRangeOptions = [{ value: 'all', label: 'Toutes dates' }, { value: '7', label: '7 derniers jours' }, { value: '30', label: '30 derniers jours' }, { value: '90', label: '90 derniers jours' }];
  const cityOptions = [{ value: 'all', label: 'Tous les secteurs' }, ...CITIES.map(c => ({ value: c, label: c }))];
  const handleReassign = () => { setShowReassignDialog(false); setSelectedAgent(''); setReassignNote(''); setSendNotification(false); };
  const handleDelete = async () => {
    if (deleteConfirm !== 'SUPPRIMER' || !actionClient) return;
    const typeName = (actionClient as any).type || 'Client';
    try {
      await deleteClient(String(actionClient.id));
      const updated = await api.get<AdminClient[]>('/clients');
      setApiClients(Array.isArray(updated) ? updated : []);
      toast('success', `${typeName} supprimé`);
    } catch (err) { console.error('Failed to delete client:', err); toast('error', `Erreur lors de la suppression du ${typeName.toLowerCase()}`); }
    setShowDeleteDialog(false); setDeleteConfirm(''); setDeleteReason(''); setActionClient(null);
  };
  const handleStatusChange = () => { setShowStatusDialog(false); setNewStatus(''); };
  const clientTypeKey: Record<string, 'Acheteur' | 'Vendeur' | 'Bailleur' | 'Locataire' | 'Voyageur'> = {
    acheteur: 'Acheteur', vendeur: 'Vendeur', bailleur: 'Bailleur', locataire: 'Locataire', voyageur: 'Voyageur',
  };
  const handleAddClient = async (clientData: Omit<Client, 'id'>) => {
    const typeName = clientData.type || 'Client';
    try {
      const payload = { ...clientData, agentId: selectedAgent || '' };
      await api.post('/clients', payload);
      const updated = await api.get<AdminClient[]>('/clients');
      setApiClients(Array.isArray(updated) ? updated : []);
      toast('success', `${typeName} ajouté avec succès`);
    } catch (err) { console.error('Failed to create client:', err); toast('error', `Erreur lors de la création du ${typeName.toLowerCase()}`); }
    setIsModalOpen(false); setEditingClient(null);
  };
  const handleUpdateClient = async (clientData: Omit<Client, 'id'>) => {
    if (!editingClient) return;
    const typeName = clientData.type || 'Client';
    try {
      await api.put(`/clients/${editingClient.id}`, clientData);
      const updated = await api.get<AdminClient[]>('/clients');
      setApiClients(Array.isArray(updated) ? updated : []);
      const newStatutMandat = (clientData as any).statutMandat;
      const newDateExpiration = (clientData as any).dateExpiration;
      const isDateReached = newDateExpiration && new Date(newDateExpiration) <= new Date()
      if (newStatutMandat === 'Expire' || newStatutMandat?.toLowerCase() === 'expire' || isDateReached) {
        const clientParts = (editingClient.name || '').split(' ');
        const prenom = clientParts[0] || '';
        const nom = clientParts.slice(1).join(' ') || '';
        const agentUser = editingClient.agentId ? users.find((u: any) => String(u.id) === editingClient.agentId) : undefined
        try {
          await triggerMandatExpireNotification({
            bienTitre: `${(editingClient as any).propertyType || 'Bien'} - ${editingClient.area || ''}`.trim(),
            bienAdresse: editingClient.area,
            clientPrenom: prenom, clientNom: nom, clientType: (editingClient.type || 'Vendeur').toLowerCase(),
            mandatType: (clientData as any).typeMandat || 'Mandat standard', mandatNumero: (clientData as any).numeroMandat,
            dateExpiration: newDateExpiration ? new Date(newDateExpiration).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR'),
            agentNom: getAgentName(editingClient.agentId || ''), agentEmail: agentUser?.email || undefined,
            bienConcerneId: (editingClient as any).bienConcerneId || (clientData as any).bienConcerneId, agentId: editingClient.agentId,
          })
        } catch (e) { console.error('triggerMandatExpireNotification failed:', e) }
      }
      toast('success', `${typeName} modifié avec succès`);
    } catch (err) { console.error('Failed to update client:', err); toast('error', `Erreur lors de la modification du ${typeName.toLowerCase()}`); }
    setIsModalOpen(false); setEditingClient(null);
  };
  const assignmentInfo = useMemo(() => {
    if (!selectedAgent) return undefined;
    const person = findPerson(selectedAgent);
    if (!person) return undefined;
    return { assignedType: person.role === 'agent' ? 'agent' as const : 'admin' as const, assignedName: person.name };
  }, [selectedAgent]);
  useEffect(() => { if (resumeDraftId) { setIsModalOpen(true); } }, [resumeDraftId]);

  const buildClientActions = (client: AdminClient): RegistreAction[] => [
    { icon: <Eye size={14} />, label: 'Voir la fiche complète', onClick: () => navigate(`/admin/${adminId}/clients/type/${type}/${client.id}`) },
    { icon: <Edit3 size={14} />, label: 'Modifier', onClick: () => { setEditingClient(client); setIsModalOpen(true); } },
    {
      icon: <Copy size={14} />,
      label: 'Dupliquer',
      onClick: async () => {
        try {
          await duplicateClient(String(client.id));
          const updated = await fetchClients();
          setApiClients(Array.isArray(updated) ? updated : []);
          toast('success', `${client.name || 'Client'} dupliqué avec succès`);
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
        setActionClient(client);
        const rawId = String((client as any).agentId || '');
        const matchedUser = users.find((u: any) => String(u.id) === rawId) || users.find((u: any) => {
          const full = `${u.first_name || ''} ${u.last_name || ''}`.trim();
          return full.toLowerCase() === rawId.toLowerCase();
        });
        setSelectedAgent(matchedUser ? String(matchedUser.id) : '');
        setSendNotification(false);
        setShowReassignDialog(true);
      },
    },
    {
      icon: <Activity size={14} />,
      label: 'Changer le statut',
      onClick: () => {
        setActionClient(client);
        setNewStatus(client.statutMetier || client.status || '');
        setShowStatusDialog(true);
      },
    },
    { separator: true, icon: <></>, label: '', onClick: () => {} },
    {
      icon: <Trash2 size={14} />,
      label: 'Supprimer',
      variant: 'danger',
      onClick: () => {
        setActionClient(client);
        setDeleteConfirm('');
        setDeleteReason('');
        setShowDeleteDialog(true);
      },
    },
  ];

  return (
    <div className="space-y-5 pb-24 animate-fade-in">
        {/* Hero — premium */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <p className={cn('flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[3px]', isDark ? 'text-slate-400' : 'text-teal-900/50')}>
                <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Square Immo · Clientèle · {typeLabel}
              </p>
              <h1 className={cn('mt-2 text-4xl font-black tracking-[-2px] sm:text-5xl', gradientTitle)}>
                {typeLabel.toUpperCase()} 360
              </h1>
              <p className={cn('mt-1.5 text-sm', isDark ? 'text-slate-400' : 'text-teal-900/60')}>
                Analyse complète du fichier {typeLabel.toLowerCase()} — volumes, statuts et activité.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StageButton variant="glass" size="md" icon={<ArrowLeft size={14} />} onClick={() => navigate(-1)} className={glassLight}>
                Retour
              </StageButton>
              <StageButton variant="glass" size="md" icon={<RefreshCw size={14} className={loadingClients ? 'animate-spin' : ''} />} onClick={refreshClients} disabled={loadingClients} className={glassLight}>
                Actualiser
              </StageButton>
              <StageButton size="md" icon={<Plus size={14} />} onClick={() => setShowAssignModal(true)}>
                Nouveau client
              </StageButton>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold" style={stagePillStyle(accent, isDark)}>
              <TrendingUp size={12} />
              {filteredClients.length} filtrés / {clientsForType.length} total
            </span>
            {activeFiltersCount > 0 && (
              <button onClick={resetFilters} className={cn('inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition-colors', isDark ? 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10' : 'border-orange-900/10 bg-white/70 text-orange-700 hover:bg-white')}>
                <X size={12} /> Réinitialiser ({activeFiltersCount})
              </button>
            )}
          </div>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {(typeKpiConfig[type || ''] || []).map((kpi, i, arr) => {
            const value = kpiValues[i] ?? 0;
            const total = kpiValues[0] ?? 0;
            const nextLabel = arr[i + 1]?.label.toLowerCase();
            const pct = total > 0 ? Math.round((value / total) * 100) : 0;
            return (
              <AdminStatCard
                key={kpi.label}
                icon={kpi.icon}
                label={kpi.label}
                value={value}
                unit={kpi.unit}
                detail={i === 0 && nextLabel ? `${kpiValues[1] ?? 0} ${nextLabel}` : `${total} au total`}
                trend={i > 0 ? `${pct}%` : undefined}
                trendUp
                hue={i === 0 ? accent : kpi.hue}
                spark={sparkBuckets}
                facts={i === 0
                  ? [{ label: 'Filtrés', value: filteredClients.length }, { label: 'Actifs', value: kpiValues[1] ?? 0 }]
                  : [{ label: 'Part', value: `${pct}%` }, { label: 'Total', value: total }]}
                delay={i * 0.06}
              />
            );
          })}
        </div>

        {/* Statistics — StagePanel */}
        <StagePanel
          title="Statistiques par intervenant"
          icon={Users}
          hue={accent}
          action={
            <StageBadge variant="neutral">
              {statsByAgent.length} intervenant{statsByAgent.length > 1 ? 's' : ''}
            </StageBadge>
          }
        >
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            {metrics.slice(0, 5).map(m => {
              const total = (tableTotals as any)[m.key] || 0;
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
              <table className="w-full min-w-[760px] text-sm">
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
                    <th className={cn('px-4 py-2.5 text-center text-[9.5px] font-extrabold uppercase tracking-[0.14em]', isDark ? 'text-slate-400' : 'text-slate-500')}>Taux actifs</th>
                  </tr>
                </thead>
                <tbody>
                  {statsByAgent.map(({ user, s }: any) => {
                    const uid = String(user.id);
                    const person = findPerson(uid);
                    const hue = agentHueFor(user.id);
                    const badge = getRoleBadge({ role: user.role, position: user.position });
                    const name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
                    const rate = s.total > 0 ? Math.round((s.actifs / s.total) * 100) : 0;
                    return (
                      <tr key={uid} className={cn('group/row border-b transition-colors duration-200 last:border-0', isDark ? 'border-white/[0.05] hover:bg-white/[0.04]' : 'border-slate-100 hover:bg-white')}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold text-white"
                              style={{ backgroundImage: `linear-gradient(145deg, ${hue.a}, ${hue.b})`, boxShadow: `0 6px 16px -8px ${hue.glow}, inset 0 1px 0 rgba(255,255,255,0.35)` }}
                            >
                              {person?.initials || uid.slice(0, 2).toUpperCase()}
                              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2" style={{ background: hue.line, borderColor: isDark ? '#0B1024' : '#fff' }} />
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className={cn('truncate text-[13px] font-bold', isDark ? 'text-white' : 'text-slate-900')}>{name || person?.name || uid}</span>
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
                    <td className={cn('px-4 py-3 text-center text-sm font-extrabold tabular-nums', isDark ? 'text-white' : 'text-slate-900')}>{tableTotals.total}</td>
                    {metrics.map(m => (
                      <td key={m.key} className={cn('px-4 py-3 text-center text-xs font-bold tabular-nums', isDark ? 'text-slate-200' : 'text-slate-800')}>
                        {(tableTotals as any)[m.key] || 0}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        <span className={cn('rounded-full px-2 py-1 text-[11px] font-extrabold tabular-nums', isDark ? 'bg-white/[0.06] text-white' : 'bg-white text-slate-900')}>
                          {tableTotals.total > 0 ? Math.round((tableTotals.actifs / tableTotals.total) * 100) : 0}%
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </StagePanel>

        {/* Search + Filter bar */}
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
                <StageBadge variant="neutral">{filteredClients.length} résultat{filteredClients.length > 1 ? 's' : ''}</StageBadge>
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
                    placeholder="Rechercher par nom, téléphone ou email..."
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
                    {statusFilter}
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
                    {mandatStatutFilter}
                    <X size={10} className="opacity-70" />
                  </button>
                )}
                {cityFilter !== 'all' && (
                  <button type="button" onClick={() => setCityFilter('all')} className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all hover:brightness-95" style={stagePillStyle(accent, isDark)}>
                    <span className={cn('text-[9px] font-bold uppercase tracking-wide', isDark ? 'opacity-60' : 'opacity-70')}>Secteur</span>
                    {cityFilter}
                    <X size={10} className="opacity-70" />
                  </button>
                )}
                {budgetMin !== '' && (
                  <button type="button" onClick={() => setBudgetMin('')} className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all hover:brightness-95" style={stagePillStyle(accent, isDark)}>
                    <span className={cn('text-[9px] font-bold uppercase tracking-wide', isDark ? 'opacity-60' : 'opacity-70')}>Min</span>
                    {budgetMin}
                    <X size={10} className="opacity-70" />
                  </button>
                )}
                {budgetMax !== '' && (
                  <button type="button" onClick={() => setBudgetMax('')} className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all hover:brightness-95" style={stagePillStyle(accent, isDark)}>
                    <span className={cn('text-[9px] font-bold uppercase tracking-wide', isDark ? 'opacity-60' : 'opacity-70')}>Max</span>
                    {budgetMax}
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

        {/* Advanced Filters Panel */}
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
                    { key: 'city', label: 'Secteur', icon: MapPin, control: <Select options={cityOptions} value={cityFilter} onValueChange={setCityFilter} placeholder="Secteur" /> },
                    { key: 'date', label: 'Date de création', icon: Calendar, control: <Select options={dateRangeOptions} value={dateRange} onValueChange={setDateRange} placeholder="Date de création" /> },
                    {
                      key: 'budget',
                      label: 'Budget',
                      icon: DollarSign,
                      control: (
                        <div className="flex items-center gap-1.5">
                          <Input type="number" placeholder="Min" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} />
                          <span className="text-xs text-slate-400">–</span>
                          <Input type="number" placeholder="Max" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} />
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
                    <b className={isDark ? 'text-slate-300' : 'text-slate-600'}>{filteredClients.length}</b> client{filteredClients.length > 1 ? 's' : ''} correspondant{filteredClients.length > 1 ? 's' : ''}
                  </span>
                </div>
              </StagePanel>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Client List — Stage holographic cards */}
        <StagePanel title={`Liste des clients • ${filteredClients.length} sur ${clientsForType.length}`} icon={Users} hue={accent}>
          {filteredClients.length === 0 ? (
            <div className="py-14 text-center">
              <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${isDark ? 'bg-white/5 text-slate-500' : 'bg-orange-50 text-orange-700'}`}>
                <Search size={22} />
              </div>
              <p className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Aucun client trouvé</p>
              <p className={`mt-1 text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{clientsForType.length > 0 ? 'Essayez de modifier vos filtres' : 'Les clients apparaissent ici une fois ajoutés'}</p>
              {activeFiltersCount > 0 && <button onClick={resetFilters} className={`mt-3 inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold ${isDark ? 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10' : 'border-orange-900/10 bg-white text-orange-700 hover:bg-orange-50'}`}><X size={12} /> Effacer les filtres</button>}
            </div>
          ) : (
            <div className="grid auto-rows-fr grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredClients.map((c, i) => (
                <StageClientCard
                  key={c.id}
                  index={i}
                  client={c}
                  hue={accent}
                  isDark={isDark}
                  onClick={() => navigate(`/admin/${adminId}/clients/type/${type}/${c.id}`)}
                  actions={buildClientActions(c as AdminClient)}
                  isGerant={isGerant}
                />
              ))}
            </div>
          )}
        </StagePanel>

        {/* Dialogs */}
        <StageModal
          open={showReassignDialog}
          onClose={() => setShowReassignDialog(false)}
          title="Réaffecter un client"
          eyebrow="Attribution"
          subtitle={actionClient ? [actionClient.type, actionClient.phone].filter(Boolean).join(' · ') : undefined}
          icon={Repeat}
          hue={interfaceHue}
          maxWidth="max-w-xl"
          centered
          footer={actionClient ? (
            <>
              <button className={ghostBtn} onClick={() => setShowReassignDialog(false)}>Annuler</button>
              <button className={cn(btns.primary, isGerant && 'btn-gerant-pill')} onClick={handleReassign} disabled={!selectedAgent}>Réaffecter</button>
            </>
          ) : undefined}
        >
          {actionClient && (
            <div className="space-y-4">
              <ClientSummaryCard client={actionClient} isDark={isDark} hue={interfaceHue} isGerant={isGerant} />
              <div>
                <p className={fieldLabel}>Responsable actuel</p>
                <div className="flex items-center gap-2 text-sm">
                  {actionClient.agentId ? (
                    <>
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                        style={{ background: `linear-gradient(145deg, ${agentHueFor(actionClient.agentId).a}, ${agentHueFor(actionClient.agentId).b})` }}
                      >
                        {getAgentInitials(actionClient.agentId)}
                      </div>
                      <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>{getAgentName(actionClient.agentId)}</span>
                    </>
                  ) : (
                    <span className="italic text-slate-400">Non assigné</span>
                  )}
                </div>
              </div>
              <div>
                <label className={fieldLabel}>Nouveau responsable</label>
                <Select
                  placeholder="Sélectionner un responsable"
                  value={selectedAgent}
                  onValueChange={setSelectedAgent}
                  options={users
                    .filter((u: any) => u.status !== 'supprimé')
                    .map((u: any) => ({ value: String(u.id), label: `${u.first_name || ''} ${u.last_name || ''}`.trim() }))}
                />
              </div>
              <div>
                <label className={fieldLabel}>Note pour le responsable</label>
                <Textarea placeholder="Je vous confie ce client pour le suivi..." value={reassignNote} onChange={(e) => setReassignNote(e.target.value)} />
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
                    <span className={cn('block text-xs font-bold', isDark ? 'text-slate-200' : 'text-slate-800')}>Notifier le nouveau responsable</span>
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

        <StageModal
          open={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          title="Supprimer le client"
          eyebrow="Zone sensible"
          subtitle={actionClient ? [actionClient.type, actionClient.phone].filter(Boolean).join(' · ') : undefined}
          icon={Trash2}
          hue={DANGER_HUE}
          maxWidth="max-w-xl"
          centered
          footer={actionClient ? (
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
          {actionClient && (
            <div className="space-y-4">
              <ClientSummaryCard client={actionClient} isDark={isDark} hue={DANGER_HUE} isGerant={isGerant} />
              <div className={cn('rounded-2xl border p-3.5', isDark ? 'border-rose-400/25 bg-rose-500/10' : 'border-rose-200 bg-rose-50')}>
                <div className="flex items-start gap-2.5">
                  <AlertTriangle size={16} className={cn('mt-0.5 shrink-0', isDark ? 'text-rose-300' : 'text-rose-500')} />
                  <div className={cn('space-y-1 text-xs', isDark ? 'text-rose-200/85' : 'text-rose-700')}>
                    <p className="font-semibold">Attention — action irréversible</p>
                    <ul className="list-inside list-disc space-y-0.5">
                      <li>Cette action est IRREVERSIBLE</li>
                      <li>Tous les documents associés seront supprimés</li>
                      <li>Tous les mandats liés seront supprimés</li>
                      <li>L'historique du client sera effacé</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div>
                <label className={fieldLabel}>Confirmation</label>
                <Input placeholder='Tapez "SUPPRIMER" pour confirmer' value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} />
              </div>
              <div>
                <label className={fieldLabel}>Motif de suppression (optionnel)</label>
                <Select
                  value={deleteReason}
                  onValueChange={setDeleteReason}
                  placeholder="Sélectionner un motif"
                  options={[
                    { value: 'doublon', label: 'Erreur de saisie - Doublon' },
                    { value: 'retire', label: 'Client retiré' },
                    { value: 'decede', label: 'Client décédé' },
                    { value: 'autre', label: 'Autre' },
                  ]}
                />
              </div>
            </div>
          )}
        </StageModal>

        <StageModal
          open={showStatusDialog}
          onClose={() => setShowStatusDialog(false)}
          title="Changer le statut"
          eyebrow="Cycle de vie"
          subtitle={actionClient ? `${actionClient.name || 'Client'} · ${actionClient.type || ''}` : undefined}
          icon={Activity}
          hue={interfaceHue}
          maxWidth="max-w-lg"
          centered
          footer={actionClient ? (
            <>
              <button className={ghostBtn} onClick={() => setShowStatusDialog(false)}>Annuler</button>
              <button className={cn(btns.primary, isGerant && 'btn-gerant-pill')} onClick={handleStatusChange} disabled={newStatus === (actionClient.statutMetier || actionClient.status)}>Changer le statut</button>
            </>
          ) : undefined}
        >
          {actionClient && (
            <div className="space-y-4">
              <ClientSummaryCard client={actionClient} isDark={isDark} hue={interfaceHue} isGerant={isGerant} />
              <div>
                <p className={fieldLabel}>Nouveau statut</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {(STATUS_BY_TYPE[type || ''] || []).map(s => {
                    const statusHue = getClientStatusHue(s) || interfaceHue;
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
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </StageModal>

        <ClientAssignModal
          open={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          users={users}
          currentUser={currentUser}
          onAssign={(agentId) => {
            setShowAssignModal(false);
            setSelectedAgent(agentId);
            setIsModalOpen(true);
          }}
        />

        <AnimatePresence>
          {isModalOpen && (() => {
            const handleClose = () => { setIsModalOpen(false); setResumeDraftId(undefined); setEditingClient(null); };
            const handleSubmit = editingClient ? handleUpdateClient : handleAddClient;
            const modalType = editingClient ? (editingClient.type || '').toLowerCase() : (type || '');
            const clientTypeLabel = clientTypeKey[modalType] || clientTypeKey[type || ''] || 'Acheteur';
            const commonProps = { onClose: handleClose, onSubmit: handleSubmit, client: editingClient || undefined, key: editingClient?.id || 'new', selectedContactId };
            if (clientTypeLabel === 'Acheteur') return <BuyerFormModal {...commonProps} assignmentInfo={assignmentInfo} draftId={resumeDraftId} userId={currentUser ? String(currentUser.id) : undefined} onDraftChange={() => setDraftVersion(v => v + 1)} isGerant={isGerant} />;
            if (clientTypeLabel === 'Vendeur') return <SellerFormModal {...commonProps} assignmentInfo={assignmentInfo} draftId={resumeDraftId} userId={currentUser ? String(currentUser.id) : undefined} onDraftChange={() => setDraftVersion(v => v + 1)} isGerant={isGerant} />;
            if (clientTypeLabel === 'Bailleur') return <BailleurFormModal {...commonProps} assignmentInfo={assignmentInfo} draftId={resumeDraftId} userId={currentUser ? String(currentUser.id) : undefined} onDraftChange={() => setDraftVersion(v => v + 1)} isGerant={isGerant} />;
            if (clientTypeLabel === 'Locataire') return <LocataireFormModal {...commonProps} assignmentInfo={assignmentInfo} draftId={resumeDraftId} userId={currentUser ? String(currentUser.id) : undefined} onDraftChange={() => setDraftVersion(v => v + 1)} isGerant={isGerant} />;
            if (clientTypeLabel === 'Voyageur') return <VoyageurFormModal {...commonProps} assignmentInfo={assignmentInfo} draftId={resumeDraftId} userId={currentUser ? String(currentUser.id) : undefined} onDraftChange={() => setDraftVersion(v => v + 1)} isGerant={isGerant} />;
            return <ClientFormModal onClose={handleClose} onSubmit={handleSubmit} clientType={clientTypeLabel} isGerant={isGerant} />;
          })()}
        </AnimatePresence>

        {currentUser && (
          <ClientDraftSection key={draftVersion} userId={String(currentUser.id)} clientType={clientTypeKey[type || '']} onResume={(draft) => setResumeDraftId(draft.id)} isGerant={isGerant} />
        )}
      </div>
  );
}
