import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { BackLink } from '../../../components/ui/BackLink';
import { Dialog } from '../../../components/ui/Dialog';
import {
  Search, Sliders, X, MoreVertical, User, Edit3, Copy, Repeat, Trash2,
  Eye, Phone, Mail, MapPin, CheckCircle, AlertTriangle,
  Users, Shield, Calendar, Star, Home, Briefcase, Sun, Plus,
  ArrowUp, ArrowDown, UserCheck, FileText, DollarSign, TrendingUp, Layers, Zap, Activity, Filter, ArrowLeft, ChevronDown
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
import { api } from '../../../services/api';
import { deleteClient, fetchClients, duplicateClient } from '../../../services/clientService';
import { useToast } from '../../../components/ui/Toast';
import { triggerMandatExpireNotification } from '../../../services/automatorTrigger';
import { useStageChrome } from '../../../components/modules/calendar/useStageChrome';
import {
  Stage, StageStatCard, StagePanel, StageBadge, STAGE_HUES, useStageTheme, ShimmerProgress, AnimatedNumber, OrbIcon, TiltCard
} from '../../../components/dashboard/Stage';

const GERANT_BUTTON_CLASSES = 'bg-[#905D5D] hover:bg-[#7D5050] border-[#905D5D] hover:border-[#7D5050] text-white shadow-[0_10px_24px_rgba(144,93,93,0.35)]'

const STATUS_BY_TYPE: Record<string, string[]> = {
  acheteur: ['En qualification', 'En recherche', 'En negociation', 'En compromis', 'Vendu / Achete', 'Inactif', 'Perdu'],
  vendeur: ['En attente de signature', 'En mandat', 'En negociation', 'En compromis', 'Vendu', 'Inactif', 'Perdu'],
  bailleur: ['En attente de signature', 'En mandat', 'En negociation', 'En location', 'Loue', 'Inactif', 'Perdu'],
  locataire: ['En recherche', 'En visite', 'En dossier', 'Bail signe', 'Installe', 'Inactif', 'Perdu'],
  voyageur: ['En recherche', 'Reservation en cours', 'Confirme', 'Paye', 'En sejour', 'Termine', 'Annule', 'Inactif'],
};

const STATUS_COLORS: Record<string, string> = {
  'En qualification': 'bg-blue-50 text-blue-700 border-blue-200',
  'En recherche': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'En negociation': 'bg-amber-50 text-amber-700 border-amber-200',
  'En compromis': 'bg-violet-50 text-violet-700 border-violet-200',
  'Vendu / Achete': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Vendu': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'En attente de signature': 'bg-orange-50 text-orange-700 border-orange-200',
  'En mandat': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'En location': 'bg-teal-50 text-teal-700 border-teal-200',
  'En visite': 'bg-purple-50 text-purple-700 border-purple-200',
  'En dossier': 'bg-pink-50 text-pink-700 border-pink-200',
  'Bail signe': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Installe': 'bg-green-50 text-green-700 border-green-200',
  'Reservation en cours': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Confirme': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'En sejour': 'bg-blue-50 text-blue-700 border-blue-200',
  'Termine': 'bg-gray-50 text-gray-700 border-gray-200',
  'Annule': 'bg-red-50 text-red-700 border-red-200',
  'Inactif': 'bg-gray-50 text-gray-500 border-gray-200',
  'Perdu': 'bg-red-50 text-red-600 border-red-200',
  'Loue': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Paye': 'bg-blue-50 text-blue-700 border-blue-200',
  'Actif': 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const typeLabels: Record<string, string> = {
  acheteur: 'Acheteurs', vendeur: 'Vendeurs', bailleur: 'Bailleurs', locataire: 'Locataires', voyageur: 'Voyageurs',
};

const buildTypeSummary = (type: string, clients: any[]) => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const total = clients.length;
  const actifs = clients.filter(c => c.status === 'Actif' || c.statutMetier === 'En mandat' || c.statutMetier === 'En recherche').length;
  const enNegoc = clients.filter(c => c.statutMetier === 'En negociation' || c.status === 'En négociation').length;
  const enCompromis = clients.filter(c => c.statutMetier === 'En compromis').length;
  const nouveauCeMois = clients.filter(c => c.createdAt?.startsWith(currentMonth)).length;
  const biensProposes = clients.reduce((sum: number, c: any) => sum + (c.pieces || 0), 0);
  const enDossier = clients.filter(c => c.statutMetier === 'En dossier').length;
  const bauxSignes = clients.filter(c => c.statutMetier === 'Bail signe').length;
  const installes = clients.filter(c => c.statutMetier === 'Installe').length;
  const reservations = clients.filter(c => c.statutMetier === 'Confirme').length;
  const sejourEnCours = clients.filter(c => c.statutMetier === 'En cours' || c.statutMetier === 'Occupe').length;
  const sejoursTermines = clients.filter(c => c.statutMetier === 'Termine').length;
  const summaries: Record<string, string> = {
    acheteur: `${total} client${total !== 1 ? 's' : ''} · ${actifs} actif${actifs !== 1 ? 's' : ''} · ${enNegoc} en négociation · ${enCompromis} en compromis · ${nouveauCeMois} ce mois · ${biensProposes} biens proposés`,
    vendeur: `${total} client${total !== 1 ? 's' : ''} · ${actifs} actif${actifs !== 1 ? 's' : ''} · ${enNegoc} en négociation · ${enCompromis} en compromis · ${nouveauCeMois} vendu${nouveauCeMois !== 1 ? 's' : ''} ce mois · ${biensProposes} biens en stock`,
    bailleur: `${total} client${total !== 1 ? 's' : ''} · ${actifs} actif${actifs !== 1 ? 's' : ''} · ${bauxSignes} baux actifs · ${nouveauCeMois} location${nouveauCeMois !== 1 ? 's' : ''} ce mois · ${biensProposes} biens en location`,
    locataire: `${total} client${total !== 1 ? 's' : ''} · ${actifs} actif${actifs !== 1 ? 's' : ''} · ${enDossier} en dossier · ${bauxSignes} baux signés · ${installes} installés · ${biensProposes} biens proposés`,
    voyageur: `${total} client${total !== 1 ? 's' : ''} · ${actifs} actif${actifs !== 1 ? 's' : ''} · ${reservations} réservations confirmées · ${sejourEnCours} séjour en cours · ${sejoursTermines} séjours terminés ce mois`,
  };
  return summaries[type] || '';
};

const typeKpiConfig: Record<string, { label: string; icon: any; hue: any }[]> = {
  acheteur: [
    { label: 'Total acheteurs', icon: Users, hue: STAGE_HUES.violet },
    { label: 'Actifs', icon: UserCheck, hue: STAGE_HUES.emerald },
    { label: 'En négociation', icon: Star, hue: STAGE_HUES.amber },
    { label: 'En compromis', icon: FileText, hue: STAGE_HUES.sky },
    { label: 'Acheteurs ce mois', icon: Calendar, hue: STAGE_HUES.fuchsia },
    { label: 'Biens proposés', icon: Home, hue: STAGE_HUES.emerald },
  ],
  vendeur: [
    { label: 'Total vendeurs', icon: Home, hue: STAGE_HUES.violet },
    { label: 'Actifs (mandat)', icon: UserCheck, hue: STAGE_HUES.emerald },
    { label: 'En négociation', icon: Star, hue: STAGE_HUES.amber },
    { label: 'En compromis', icon: FileText, hue: STAGE_HUES.sky },
    { label: 'Vendus ce mois', icon: Calendar, hue: STAGE_HUES.fuchsia },
    { label: 'Biens en stock', icon: Briefcase, hue: STAGE_HUES.amber },
  ],
  bailleur: [
    { label: 'Total bailleurs', icon: Briefcase, hue: STAGE_HUES.emerald },
    { label: 'Actifs (mandat)', icon: UserCheck, hue: STAGE_HUES.emerald },
    { label: 'Baux actifs', icon: CheckCircle, hue: STAGE_HUES.violet },
    { label: 'Locations ce mois', icon: Calendar, hue: STAGE_HUES.sky },
    { label: 'Biens en location', icon: Home, hue: STAGE_HUES.amber },
    { label: 'Revenus mensuels', icon: TrendingUp, hue: STAGE_HUES.fuchsia },
  ],
  locataire: [
    { label: 'Total locataires', icon: Users, hue: STAGE_HUES.amber },
    { label: 'Actifs', icon: UserCheck, hue: STAGE_HUES.emerald },
    { label: 'En dossier', icon: FileText, hue: STAGE_HUES.violet },
    { label: 'Baux signés', icon: CheckCircle, hue: STAGE_HUES.sky },
    { label: 'Locataires installés', icon: UserCheck, hue: STAGE_HUES.fuchsia },
    { label: 'Biens proposés', icon: Home, hue: STAGE_HUES.emerald },
  ],
  voyageur: [
    { label: 'Total voyageurs', icon: Sun, hue: STAGE_HUES.fuchsia },
    { label: 'Actifs', icon: UserCheck, hue: STAGE_HUES.emerald },
    { label: 'Réservations confirmées', icon: CheckCircle, hue: STAGE_HUES.violet },
    { label: 'Séjour en cours', icon: Calendar, hue: STAGE_HUES.sky },
    { label: 'Séjours terminés ce mois', icon: Calendar, hue: STAGE_HUES.amber },
  ],
};

const CLIENT_COLORS = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500', 'bg-cyan-500', 'bg-pink-500'];
const HONORIFICS = new Set(['m', 'mme', 'mlle', 'mr', 'mrs', 'dr', 'pr', 'maitre', 'me']);
const getClientInitials = (name?: string) => {
  if (!name) return '??';
  const words = name.trim().split(/\s+/).filter(Boolean);
  const meaningful = words.filter(w => !HONORIFICS.has(w.replace(/\.$/, '').toLowerCase()));
  const src = meaningful.length > 0 ? meaningful : words;
  return src.slice(0, 2).map(w => w[0].toUpperCase()).join('') || '??';
};
const getClientColor = (name?: string) => {
  const s = (name || '').trim();
  if (!s) return 'bg-gray-400';
  const seed = s.split('').reduce((a, ch) => a + ch.charCodeAt(0), 0);
  return CLIENT_COLORS[seed % CLIENT_COLORS.length];
};

function StageClientCard({ client, onClick, onMenu, isDark, hue }: { client: any; onClick: () => void; onMenu: (e: React.MouseEvent) => void; isDark: boolean; hue: any }) {
  const statusKey = (client.statutMetier || client.status || '').trim();
  const badgeClass = STATUS_COLORS[statusKey] || 'bg-slate-100 text-slate-600 border-slate-200';
  const [hovered, setHovered] = useState(false);
  const tiltRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const applyTilt = (x: number, y: number) => {
    const el = tiltRef.current;
    if (!el) return;
    el.style.transform = `rotateX(${(y - 0.5) * -8}deg) rotateY(${(x - 0.5) * 8}deg)`;
  };
  const handleMove = (e: React.MouseEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => applyTilt((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height));
  };
  const handleLeave = () => {
    setHovered(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (tiltRef.current) tiltRef.current.style.transform = 'rotateX(0deg) rotateY(0deg)';
  };
  return (
    <div
      className="group relative h-full cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleLeave}
      onMouseMove={handleMove}
      onClick={onClick}
      style={{ perspective: 900 }}
    >
      <div className="absolute -inset-2 rounded-[22px] -z-10 pointer-events-none" style={{ background: `radial-gradient(ellipse at center, ${hue.glow} 0%, transparent 65%)`, opacity: hovered ? 0.28 : 0.12, transition: 'opacity 0.3s' }} />
      <div
        ref={tiltRef}
        className="relative flex h-full flex-col overflow-hidden rounded-2xl border"
        style={{
          transformStyle: 'preserve-3d', transition: 'transform 0.15s ease-out',
          background: isDark ? 'linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))' : 'linear-gradient(145deg, rgba(255,255,255,0.92), rgba(255,255,255,0.58))',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
          boxShadow: isDark ? `inset 0 1px 0 rgba(255,255,255,0.07), 0 12px 32px -12px ${hue.glow}` : `inset 0 1px 0 rgba(255,255,255,0.9), 0 12px 32px -16px ${hue.glow}`,
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${hue.a}, ${hue.b})`, opacity: hovered ? 1 : 0.7 }} />
        <div className="p-4 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0" style={{ transform: 'translateZ(14px)' }}>
                <div className={`w-11 h-11 rounded-xl ${getClientColor(client.name)} flex items-center justify-center text-white text-xs font-extrabold shadow-lg`} style={{ boxShadow: `0 8px 20px -8px ${hue.glow}, inset 0 1px 0 rgba(255,255,255,0.35)` }}>{getClientInitials(client.name)}</div>
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white text-[8px] font-bold text-white" style={{ background: `linear-gradient(145deg, ${hue.a}, ${hue.b})` }}>
                  <CheckCircle size={8} />
                </span>
              </div>
              <div className="min-w-0">
                <h3 className={`truncate text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{client.name || 'Sans nom'}</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${badgeClass}`}>{statusKey || '—'}</span>
                  {(client as any).originalClientId && <span className="rounded-full bg-orange-100 text-orange-700 px-1.5 py-0.5 text-[8px] font-bold uppercase">Copie</span>}
                </div>
              </div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onMenu(e); }} className={`flex h-8 w-8 items-center justify-center rounded-xl border backdrop-blur-md transition-colors ${isDark ? 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
              <MoreVertical size={14} />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${isDark ? 'bg-white/5 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
              <Phone size={11} /> {client.phone || '—'}
            </span>
            <span className={`truncate text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{client.email || ''}</span>
          </div>
        </div>
        <div className={`mx-4 h-px ${isDark ? 'bg-white/5' : 'bg-slate-100'}`} />
        <div className="flex-1 p-4 pt-3 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1.5 ${isDark ? 'bg-white/5 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
              <MapPin size={11} className="opacity-60" /> {client.secteur || client.area || '—'}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1.5 ${isDark ? 'bg-white/5 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
              <Home size={11} className="opacity-60" /> {client.propertyType || '—'}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {client.budget ? <span className="rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/15 px-2 py-1 text-[10px] font-semibold">{Number(client.budget).toLocaleString('fr-FR')} {(client as any).devise || 'MAD'}</span> : null}
            {client.pieces ? <span className={`rounded-full px-2 py-1 text-[10px] font-medium border ${isDark ? 'bg-white/5 text-slate-300 border-white/10' : 'bg-white text-slate-600 border-slate-200'}`}>{client.pieces} pièces</span> : null}
            {client.statutMetier ? <span className="rounded-full bg-violet-500/10 text-violet-600 border border-violet-500/15 px-2 py-1 text-[10px] font-semibold">{client.statutMetier}</span> : null}
          </div>
        </div>
        <div className={`flex items-center justify-between border-t px-4 py-2.5 ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50/50 border-slate-100'}`}>
          <span className={`inline-flex items-center gap-1 text-xs font-medium ${isDark ? 'text-violet-300' : 'text-violet-600'}`}>
            Voir fiche <ChevronDown size={12} className="rotate-[-90deg]" />
          </span>
          <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{client.lastContact ? new Date(client.lastContact).toLocaleDateString('fr-FR') : ''}</span>
        </div>
      </div>
    </div>
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
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignStep, setAssignStep] = useState<'choose' | 'agent' | 'admin'>('choose');
  const [isGerant, setIsGerant] = useState(false);
  const { staged, dark } = useStageChrome();
  const theme = useStageTheme();
  const isDark = theme === 'dark';
  useEffect(() => {
    api.get<any[]>('/admin/users').then(setUsers).catch(() => {});
    api.get<any>('/auth/me').then(u => { setCurrentUser(u); if (u) setIsGerant(u.role === 'gerant'); }).catch(() => {});
  }, []);
  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuTarget(null); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);
  const [actionClient, setActionClient] = useState<AdminClient | null>(null);
  const [menuTarget, setMenuTarget] = useState<{ client: AdminClient; bounds: DOMRect } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
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
  useEffect(() => { fetchClients().then(data => setApiClients(Array.isArray(data) ? data : [])).catch(() => {}); }, []);
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
  const typeSummary = useMemo(() => buildTypeSummary(type || '', clientsForType), [type, clientsForType]);
  const kpiValues = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const total = clientsForType.length;
    const actifs = clientsForType.filter(c => c.status === 'Actif' || c.statutMetier === 'En mandat' || c.statutMetier === 'En recherche').length;
    const enNegoc = clientsForType.filter(c => c.statutMetier === 'En negociation' || c.status === 'En négociation').length;
    const enCompromis = clientsForType.filter(c => c.statutMetier === 'En compromis').length;
    const vendusAchetes = clientsForType.filter(c => c.statutMetier === 'Vendu / Achete' || c.statutMetier === 'Vendu').length;
    const proposesStock = clientsForType.reduce((sum, c) => sum + (c.pieces || 0), 0);
    const bauxActifs = clientsForType.filter(c => c.statutMetier === 'Bail signe').length;
    const locations = clientsForType.filter(c => c.createdAt?.startsWith(currentMonth) && (c.statutMetier === 'Bail signe' || c.type === 'Bailleur')).length;
    const enLocation = clientsForType.filter(c => c.statutMetier === 'En location').length;
    const enDossier = clientsForType.filter(c => c.statutMetier === 'En dossier').length;
    const bauxSignes = clientsForType.filter(c => c.statutMetier === 'Bail signe').length;
    const installes = clientsForType.filter(c => c.statutMetier === 'Installe').length;
    const reservations = clientsForType.filter(c => c.statutMetier === 'Confirme').length;
    const sejourEnCours = clientsForType.filter(c => c.statutMetier === 'En cours' || c.statutMetier === 'Occupe').length;
    const sejoursTermines = clientsForType.filter(c => c.statutMetier === 'Termine').length;
    const nouveauCeMois = clientsForType.filter(c => c.createdAt?.startsWith(currentMonth)).length;
    const values = [total, actifs, enNegoc, enCompromis, vendusAchetes, proposesStock, bauxActifs, locations, enLocation, 0, enDossier, bauxSignes, installes, reservations, sejourEnCours, sejoursTermines, nouveauCeMois];
    const map: Record<string, number[]> = {
      acheteur: [total, actifs, enNegoc, enCompromis, nouveauCeMois, proposesStock],
      vendeur: [total, actifs, enNegoc, enCompromis, vendusAchetes, proposesStock],
      bailleur: [total, actifs, bauxActifs, locations, enLocation, 0],
      locataire: [total, actifs, enDossier, bauxSignes, installes, proposesStock],
      voyageur: [total, actifs, reservations, sejourEnCours, sejoursTermines],
    };
    return map[type || ''] || [];
  }, [type, clientsForType]);
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
  const getAgentColor = (agentId: string) => {
    if (!agentId) return 'bg-gray-400';
    const person = findPerson(agentId);
    return person ? person.color : 'bg-violet-400';
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
  const typeIconMap: Record<string, React.ReactNode> = {
    acheteur: <Search size={22} />, vendeur: <Home size={22} />, bailleur: <Briefcase size={22} />, locataire: <Users size={22} />, voyageur: <Sun size={22} />,
  };
  const typeColorMap: Record<string, string> = {
    acheteur: 'text-accent', vendeur: 'text-violet-600', bailleur: 'text-emerald-600', locataire: 'text-amber-600', voyageur: 'text-rose-600',
  };
  const typeBgMap: Record<string, string> = {
    acheteur: 'bg-accent-light', vendeur: 'bg-violet-50', bailleur: 'bg-emerald-50', locataire: 'bg-amber-50', voyageur: 'bg-rose-50',
  };
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
  useEffect(() => { if (resumeDraftId) { setShowAssignModal(false); setIsModalOpen(true); } }, [resumeDraftId]);

  const heroHue = (() => {
    const map: Record<string, any> = { acheteur: STAGE_HUES.violet, vendeur: STAGE_HUES.sky, bailleur: STAGE_HUES.emerald, locataire: STAGE_HUES.amber, voyageur: STAGE_HUES.fuchsia };
    return map[type || ''] || STAGE_HUES.violet;
  })();

  return (
    <Stage theme={theme}>
      <div className="space-y-6 animate-fade-in">
        {/* Retour — Stage ghost */}
        <button
          onClick={() => navigate(-1)}
          className={`group inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold backdrop-blur-md transition-all ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/10' : 'border-teal-900/10 bg-white/60 text-teal-900/60 hover:text-teal-900 hover:border-teal-900/20 hover:bg-white'}`}
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
          Retour
        </button>

        {/* Hero — holographic */}
        <div className="stage-glass relative overflow-hidden p-5 sm:p-6">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, ${heroHue.glow.replace(/[\d.]+\)$/, '0.18)')}, transparent 70%)` }} />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <div className="hidden sm:flex h-14 w-14 items-center justify-center rounded-2xl text-white shrink-0" style={{ background: `linear-gradient(145deg, ${heroHue.a}, ${heroHue.b})`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.45), 0 12px 28px -10px ${heroHue.glow}` }}>
                {typeIconMap[type || ''] || <Users size={22} />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" /></span>
                  <p className={`text-[10px] font-bold uppercase tracking-[0.22em] ${isDark ? 'text-slate-400/80' : 'text-teal-900/50'}`}>Clients — {typeLabel}</p>
                </div>
                <h1 className={`mt-1 text-2xl font-extrabold tracking-tight ${isDark ? 'bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent' : 'bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-600 bg-clip-text text-transparent'}`}>Clients — {typeLabel}</h1>
                <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-teal-900/60'} truncate`}>{typeSummary}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StageBadge variant={clientsForType.length > 0 ? 'ok' : 'neutral'}>{clientsForType.length} clients</StageBadge>
              {/* Nouveau client — Stage primary */}
              <button
                onClick={() => { setShowAssignModal(true); setAssignStep('choose'); }}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95"
                style={{
                  backgroundImage: isDark ? 'linear-gradient(145deg, #8B7CFF 0%, #6C5ECF 60%, #5646C9 100%)' : 'linear-gradient(145deg, #2DD4BF 0%, #14B8A6 60%, #0D9488 100%)',
                  boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.4), 0 10px 26px -8px rgba(124,92,255,0.65)' : 'inset 0 1px 0 rgba(255,255,255,0.5), 0 10px 26px -10px rgba(13,148,136,0.6)',
                }}
              >
                <Plus size={14} />
                Nouveau client
              </button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: heroHue.a + '22', background: heroHue.a + '14', color: heroHue.a }}>
              <TrendingUp size={12} />
              {filteredClients.length} filtrés / {clientsForType.length} total
            </span>
            {activeFiltersCount > 0 && (
              <button onClick={resetFilters} className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${isDark ? 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10' : 'border-teal-900/10 bg-white/70 text-teal-700 hover:bg-white'}`}>
                <X size={12} /> Réinitialiser ({activeFiltersCount})
              </button>
            )}
          </div>
        </div>

        {/* Recherche & Filtres — Stage glass */}
        <div className="stage-glass p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={14} className={isDark ? 'text-violet-300' : 'text-teal-600'} />
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Recherche & filtres</h3>
            {activeFiltersCount > 0 && <span className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-violet-500 px-1.5 text-[10px] font-bold text-white">{activeFiltersCount}</span>}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1 relative">
              <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-teal-900/40'}`} />
              <input
                type="text"
                placeholder="Rechercher par nom, téléphone ou email..."
                className={`w-full h-10 pl-9 pr-3 text-sm rounded-xl border focus:outline-none transition-all ${isDark ? 'bg-white/[0.04] border-white/10 text-white placeholder:text-slate-500 focus:border-violet-400/40' : 'bg-white border-teal-900/10 text-slate-900 placeholder:text-slate-400 focus:border-teal-500/30'}`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              className={`inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-semibold backdrop-blur-md transition-all ${showFilters || activeFiltersCount > 0 ? (isDark ? 'bg-violet-500/15 border-violet-400/30 text-violet-200' : 'bg-teal-500/10 border-teal-500/20 text-teal-700') : (isDark ? 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/10' : 'bg-white border-teal-900/10 text-slate-600 hover:bg-teal-50')}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Sliders size={14} />
              Filtres avancés
              <ChevronDown size={12} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
          {activeFiltersCount > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {statusFilter !== 'all' && <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${isDark ? 'bg-violet-500/10 border-violet-400/20 text-violet-200' : 'bg-violet-50 border-violet-200 text-violet-700'}`}>Statut: {statusFilter} <button onClick={() => setStatusFilter('all')} className="ml-1 hover:text-red-500"><X size={10} /></button></span>}
              {agentFilter !== 'all' && <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${isDark ? 'bg-emerald-500/10 border-emerald-400/20 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>Agent <button onClick={() => setAgentFilter('all')} className="ml-1 hover:text-red-500"><X size={10} /></button></span>}
              {cityFilter !== 'all' && <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${isDark ? 'bg-sky-500/10 border-sky-400/20 text-sky-200' : 'bg-sky-50 border-sky-200 text-sky-700'}`}>{cityFilter} <button onClick={() => setCityFilter('all')} className="ml-1 hover:text-red-500"><X size={10} /></button></span>}
            </div>
          )}
          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <div className={`mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 rounded-xl border p-3 ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-teal-50/50 border-teal-900/5'}`}>
                  <Select options={statusOptions} value={statusFilter} onValueChange={setStatusFilter} placeholder="Statut" />
                  <Select options={agentOptions} value={agentFilter} onValueChange={(v) => setAgentFilter(v)} placeholder="Agent" />
                  <Select options={mandatStatusOptions} value={mandatStatutFilter} onValueChange={setMandatStatutFilter} placeholder="Mandat" />
                  <Select options={cityOptions} value={cityFilter} onValueChange={setCityFilter} placeholder="Secteur" />
                  <Select options={dateRangeOptions} value={dateRange} onValueChange={setDateRange} placeholder="Date de création" />
                  <div className="flex items-center gap-2">
                    <input type="number" placeholder="Budget min" className={`w-full h-9 px-3 text-sm rounded-xl border focus:outline-none ${isDark ? 'bg-white/[0.04] border-white/10 text-white placeholder:text-slate-500 focus:border-violet-400/30' : 'bg-white border-teal-900/10 text-slate-900 placeholder:text-slate-400 focus:border-teal-500/30'}`} value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} />
                    <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>-</span>
                    <input type="number" placeholder="Budget max" className={`w-full h-9 px-3 text-sm rounded-xl border focus:outline-none ${isDark ? 'bg-white/[0.04] border-white/10 text-white placeholder:text-slate-500 focus:border-violet-400/30' : 'bg-white border-teal-900/10 text-slate-900 placeholder:text-slate-400 focus:border-teal-500/30'}`} value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* KPI Cards — StageStatCard */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {(typeKpiConfig[type || ''] || []).map((kpi, i) => (
            <StageStatCard key={kpi.label} icon={kpi.icon} label={kpi.label} value={kpiValues[i] ?? 0} hue={kpi.hue} delay={i * 0.04} spark={[2, 4, 3, 6, 5, 8]} />
          ))}
        </div>

        {/* Statistics — StagePanel */}
        <StagePanel title="Répartition par intervenant" icon={Users} hue={heroHue}>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${isDark ? 'border-white/10' : 'border-teal-900/10'}`}>
                  <th className={`text-left px-3 py-2.5 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-teal-900/50'}`}>Intervenant</th>
                  {type === 'acheteur' && (<>
                    <th className={`text-center px-3 py-2.5 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-teal-900/50'}`}>Total</th>
                    <th className={`text-center px-3 py-2.5 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-teal-900/50'}`}>Actifs</th>
                    <th className={`text-center px-3 py-2.5 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-teal-900/50'}`}>En négoc.</th>
                    <th className={`text-center px-3 py-2.5 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-teal-900/50'}`}>En compromis</th>
                    <th className={`text-center px-3 py-2.5 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-teal-900/50'}`}>Achetés</th>
                    <th className={`text-center px-3 py-2.5 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-teal-900/50'}`}>Proposés</th>
                  </>)}
                  {type === 'vendeur' && (<>
                    <th className={`text-center px-3 py-2.5 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-teal-900/50'}`}>Total</th>
                    <th className={`text-center px-3 py-2.5 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-teal-900/50'}`}>Actifs</th>
                    <th className={`text-center px-3 py-2.5 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-teal-900/50'}`}>En négoc.</th>
                    <th className={`text-center px-3 py-2.5 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-teal-900/50'}`}>En compromis</th>
                    <th className={`text-center px-3 py-2.5 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-teal-900/50'}`}>Vendus</th>
                    <th className={`text-center px-3 py-2.5 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-teal-900/50'}`}>En stock</th>
                  </>)}
                  {type === 'bailleur' && (<>
                    <th className={`text-center px-3 py-2.5 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-teal-900/50'}`}>Total</th>
                    <th className={`text-center px-3 py-2.5 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-teal-900/50'}`}>Actifs</th>
                    <th className={`text-center px-3 py-2.5 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-teal-900/50'}`}>Baux actifs</th>
                    <th className={`text-center px-3 py-2.5 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-teal-900/50'}`}>Locations</th>
                    <th className={`text-center px-3 py-2.5 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-teal-900/50'}`}>En location</th>
                    <th className={`text-center px-3 py-2.5 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-teal-900/50'}`}>Revenus</th>
                  </>)}
                  {type === 'locataire' && (<>
                    <th className={`text-center px-3 py-2.5 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-teal-900/50'}`}>Total</th>
                    <th className={`text-center px-3 py-2.5 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-teal-900/50'}`}>Actifs</th>
                    <th className={`text-center px-3 py-2.5 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-teal-900/50'}`}>En dossier</th>
                    <th className={`text-center px-3 py-2.5 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-teal-900/50'}`}>Baux signés</th>
                    <th className={`text-center px-3 py-2.5 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-teal-900/50'}`}>Installés</th>
                    <th className={`text-center px-3 py-2.5 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-teal-900/50'}`}>Proposés</th>
                  </>)}
                  {type === 'voyageur' && (<>
                    <th className={`text-center px-3 py-2.5 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-teal-900/50'}`}>Total</th>
                    <th className={`text-center px-3 py-2.5 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-teal-900/50'}`}>Actifs</th>
                    <th className={`text-center px-3 py-2.5 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-teal-900/50'}`}>Réservations</th>
                    <th className={`text-center px-3 py-2.5 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-teal-900/50'}`}>Séjour en cours</th>
                    <th className={`text-center px-3 py-2.5 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-teal-900/50'}`}>Séjours terminés</th>
                  </>)}
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-teal-900/5'}`}>
                {statsByAgent.map(({ user, s }: any) => {
                  const userId = String(user.id);
                  const initials = `${(user.first_name || '')[0]}${(user.last_name || '')[0]}`.toUpperCase() || '?';
                  const color = COLORS[Math.abs(Number(user.id) || userId.length) % COLORS.length];
                  const name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
                  const badge = getRoleBadge({ role: user.role, position: user.position });
                  return (
                    <tr key={userId} className={`transition-colors ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-teal-50/50'}`}>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-full ${color} flex items-center justify-center text-white text-[10px] font-bold shadow-sm`}>{initials}</div>
                          <span className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{name}</span>
                          {badge && <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider ${badge.cls}`}>{badge.label}</span>}
                        </div>
                      </td>
                      {type === 'acheteur' && (<>
                        <td className={`text-center px-3 py-2.5 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{s.total || 0}</td>
                        <td className="text-center px-3 py-2.5">{s.actifs || 0}</td>
                        <td className="text-center px-3 py-2.5">{s.enNegoc || 0}</td>
                        <td className="text-center px-3 py-2.5">{s.enCompromis || 0}</td>
                        <td className="text-center px-3 py-2.5">{s.vendusAchetes || 0}</td>
                        <td className="text-center px-3 py-2.5">{s.proposesStock || 0}</td>
                      </>)}
                      {type === 'vendeur' && (<>
                        <td className={`text-center px-3 py-2.5 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{s.total || 0}</td>
                        <td className="text-center px-3 py-2.5">{s.actifs || 0}</td>
                        <td className="text-center px-3 py-2.5">{s.enNegoc || 0}</td>
                        <td className="text-center px-3 py-2.5">{s.enCompromis || 0}</td>
                        <td className="text-center px-3 py-2.5">{s.vendusAchetes || 0}</td>
                        <td className="text-center px-3 py-2.5">{s.proposesStock || 0}</td>
                      </>)}
                      {type === 'bailleur' && (<>
                        <td className={`text-center px-3 py-2.5 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{s.total || 0}</td>
                        <td className="text-center px-3 py-2.5">{s.actifs || 0}</td>
                        <td className="text-center px-3 py-2.5">{s.bauxActifs || 0}</td>
                        <td className="text-center px-3 py-2.5">{s.locations || 0}</td>
                        <td className="text-center px-3 py-2.5">{s.enLocation || 0}</td>
                        <td className="text-center px-3 py-2.5">{s.revenus ? `${s.revenus} €` : '0 €'}</td>
                      </>)}
                      {type === 'locataire' && (<>
                        <td className={`text-center px-3 py-2.5 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{s.total || 0}</td>
                        <td className="text-center px-3 py-2.5">{s.actifs || 0}</td>
                        <td className="text-center px-3 py-2.5">{s.enDossier || 0}</td>
                        <td className="text-center px-3 py-2.5">{s.bauxSignes || 0}</td>
                        <td className="text-center px-3 py-2.5">{s.installes || 0}</td>
                        <td className="text-center px-3 py-2.5">{s.proposesStock || 0}</td>
                      </>)}
                      {type === 'voyageur' && (<>
                        <td className={`text-center px-3 py-2.5 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{s.total || 0}</td>
                        <td className="text-center px-3 py-2.5">{s.actifs || 0}</td>
                        <td className="text-center px-3 py-2.5">{s.reservations || 0}</td>
                        <td className="text-center px-3 py-2.5">{s.sejourEnCours || 0}</td>
                        <td className="text-center px-3 py-2.5">{s.sejoursTermines || 0}</td>
                      </>)}
                    </tr>
                  );
                })}
                <tr className={`${isDark ? 'bg-white/[0.04] border-t border-white/10' : 'bg-teal-50/60 border-t border-teal-900/10'} font-bold`}>
                  <td className={`px-3 py-2.5 text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>TOTAL</td>
                  {type === 'acheteur' && (<>
                    <td className={`text-center px-3 py-2.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{tableTotals.total}</td>
                    <td className="text-center px-3 py-2.5">{tableTotals.actifs}</td>
                    <td className="text-center px-3 py-2.5">{tableTotals.enNegoc}</td>
                    <td className="text-center px-3 py-2.5">{tableTotals.enCompromis}</td>
                    <td className="text-center px-3 py-2.5">{tableTotals.vendusAchetes}</td>
                    <td className="text-center px-3 py-2.5">{tableTotals.proposesStock}</td>
                  </>)}
                  {type === 'vendeur' && (<>
                    <td className={`text-center px-3 py-2.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{tableTotals.total}</td>
                    <td className="text-center px-3 py-2.5">{tableTotals.actifs}</td>
                    <td className="text-center px-3 py-2.5">{tableTotals.enNegoc}</td>
                    <td className="text-center px-3 py-2.5">{tableTotals.enCompromis}</td>
                    <td className="text-center px-3 py-2.5">{tableTotals.vendusAchetes}</td>
                    <td className="text-center px-3 py-2.5">{tableTotals.proposesStock}</td>
                  </>)}
                  {type === 'bailleur' && (<>
                    <td className={`text-center px-3 py-2.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{tableTotals.total}</td>
                    <td className="text-center px-3 py-2.5">{tableTotals.actifs}</td>
                    <td className="text-center px-3 py-2.5">{tableTotals.bauxActifs}</td>
                    <td className="text-center px-3 py-2.5">{tableTotals.locations}</td>
                    <td className="text-center px-3 py-2.5">{tableTotals.enLocation}</td>
                    <td className="text-center px-3 py-2.5">{tableTotals.revenus ? `${tableTotals.revenus} €` : '0 €'}</td>
                  </>)}
                  {type === 'locataire' && (<>
                    <td className={`text-center px-3 py-2.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{tableTotals.total}</td>
                    <td className="text-center px-3 py-2.5">{tableTotals.actifs}</td>
                    <td className="text-center px-3 py-2.5">{tableTotals.enDossier}</td>
                    <td className="text-center px-3 py-2.5">{tableTotals.bauxSignes}</td>
                    <td className="text-center px-3 py-2.5">{tableTotals.installes}</td>
                    <td className="text-center px-3 py-2.5">{tableTotals.proposesStock}</td>
                  </>)}
                  {type === 'voyageur' && (<>
                    <td className={`text-center px-3 py-2.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{tableTotals.total}</td>
                    <td className="text-center px-3 py-2.5">{tableTotals.actifs}</td>
                    <td className="text-center px-3 py-2.5">{tableTotals.reservations}</td>
                    <td className="text-center px-3 py-2.5">{tableTotals.sejourEnCours}</td>
                    <td className="text-center px-3 py-2.5">{tableTotals.sejoursTermines}</td>
                  </>)}
                </tr>
              </tbody>
            </table>
          </div>
        </StagePanel>

        {/* Client List — Stage holographic cards */}
        <StagePanel title={`Liste des clients • ${filteredClients.length} sur ${clientsForType.length}`} icon={Users} hue={heroHue}>
          {filteredClients.length === 0 ? (
            <div className="py-14 text-center">
              <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${isDark ? 'bg-white/5 text-slate-500' : 'bg-teal-50 text-teal-700'}`}>
                <Search size={22} />
              </div>
              <p className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Aucun client trouvé</p>
              <p className={`mt-1 text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{clientsForType.length > 0 ? 'Essayez de modifier vos filtres' : 'Les clients apparaissent ici une fois ajoutés'}</p>
              {activeFiltersCount > 0 && <button onClick={resetFilters} className={`mt-3 inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold ${isDark ? 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10' : 'border-teal-900/10 bg-white text-teal-700 hover:bg-teal-50'}`}><X size={12} /> Effacer les filtres</button>}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredClients.map((c) => (
                <StageClientCard
                  key={c.id}
                  client={c}
                  hue={heroHue}
                  isDark={isDark}
                  onClick={() => navigate(`/admin/${adminId}/clients/type/${type}/${c.id}`)}
                  onMenu={(e) => setMenuTarget(menuTarget?.client.id === c.id ? null : { client: c as AdminClient, bounds: e.currentTarget.getBoundingClientRect() })}
                />
              ))}
            </div>
          )}
        </StagePanel>

        {/* Floating Action Menu */}
        <AnimatePresence>
          {menuTarget && (() => {
            const { client, bounds } = menuTarget;
            const viewportH = window.innerHeight;
            const spaceBelow = viewportH - bounds.bottom;
            const menuH = 220;
            const top = spaceBelow >= menuH ? bounds.bottom + 4 : bounds.top - menuH - 4;
            const right = window.innerWidth - bounds.right;
            return (
              <>
                <motion.div className="fixed inset-0 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMenuTarget(null)} />
                <motion.div
                  ref={menuRef}
                  initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.96 }} transition={{ duration: 0.12 }}
                  style={{ position: 'fixed', top, right }}
                  className={`w-56 rounded-2xl border py-1 z-50 backdrop-blur-xl ${isDark ? 'bg-[#0F172A]/90 border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.5)]' : 'bg-white/95 border-teal-900/10 shadow-[0_20px_60px_rgba(13,148,136,0.18)]'}`}
                >
                  <button className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-colors text-left ${isDark ? 'text-slate-200 hover:bg-white/5' : 'text-slate-700 hover:bg-teal-50'}`} onClick={() => { setMenuTarget(null); navigate(`/admin/${adminId}/clients/type/${type}/${client.id}`); }}>
                    <Eye size={14} /> Voir la fiche complète
                  </button>
                  <button className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-colors text-left ${isDark ? 'text-slate-200 hover:bg-white/5' : 'text-slate-700 hover:bg-teal-50'}`} onClick={() => { setMenuTarget(null); setEditingClient(client); setIsModalOpen(true); }}>
                    <Edit3 size={14} /> Modifier
                  </button>
                  <button className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-colors text-left ${isDark ? 'text-slate-200 hover:bg-white/5' : 'text-slate-700 hover:bg-teal-50'}`} onClick={async () => { setMenuTarget(null); try { const duplicated = await duplicateClient(String(client.id)); const updated = await fetchClients(); setApiClients(Array.isArray(updated) ? updated : []); toast('success', `${client.name || 'Client'} dupliqué avec succès`); } catch (e: any) { toast('error', e.message || 'Erreur lors de la duplication'); } }}>
                    <Copy size={14} /> Dupliquer
                  </button>
                  <div className={`h-px my-1 ${isDark ? 'bg-white/5' : 'bg-teal-900/5'}`} />
                  <button className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-colors text-left ${isDark ? 'text-slate-200 hover:bg-white/5' : 'text-slate-700 hover:bg-teal-50'}`} onClick={() => { setMenuTarget(null); setActionClient(client); const rawId = String((client as any).agentId || ''); const matchedUser = users.find((u: any) => String(u.id) === rawId) || users.find((u: any) => { const full = `${u.first_name || ''} ${u.last_name || ''}`.trim(); return full.toLowerCase() === rawId.toLowerCase(); }); setSelectedAgent(matchedUser ? String(matchedUser.id) : ''); setShowReassignDialog(true); }}>
                    <Repeat size={14} /> Réaffecter à un agent
                  </button>
                  <div className={`h-px my-1 ${isDark ? 'bg-white/5' : 'bg-teal-900/5'}`} />
                  <button className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-colors text-left ${isDark ? 'text-rose-300 hover:bg-rose-500/10' : 'text-red-600 hover:bg-red-50'}`} onClick={() => { setMenuTarget(null); setActionClient(client); setDeleteConfirm(''); setDeleteReason(''); setShowDeleteDialog(true); }}>
                    <Trash2 size={14} /> Supprimer
                  </button>
                </motion.div>
              </>
            );
          })()}
        </AnimatePresence>

        {/* Dialogs */}
        <Dialog isOpen={showReassignDialog} onClose={() => setShowReassignDialog(false)} title="Réaffecter un client" size="lg">
          {actionClient && (
            <div className="space-y-4">
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-white/[0.04] border-white/10' : 'bg-teal-50 border-teal-900/10'}`}>
                <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{actionClient.name}</p>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{actionClient.type} · {actionClient.phone}</p>
              </div>
              <div>
                <p className={`text-xs mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Responsable actuel :</p>
                <div className="flex items-center gap-2 text-sm">
                  {actionClient.agentId ? (<><div className={`w-6 h-6 rounded-full ${getAgentColor(actionClient.agentId)} flex items-center justify-center text-white text-[10px] font-bold`}>{getAgentInitials(actionClient.agentId)}</div><span className={isDark ? 'text-slate-200' : 'text-slate-700'}>{getAgentName(actionClient.agentId)}</span></>) : <span className="text-slate-400 italic">Non assigné</span>}
                </div>
              </div>
              <div>
                <label className={`text-sm font-medium mb-1.5 block ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Nouvel responsable</label>
                <Select placeholder="Sélectionner un responsable" value={selectedAgent} onValueChange={(v) => setSelectedAgent(v)} options={users.map((u: any) => ({ value: String(u.id), label: `${u.first_name || ''} ${u.last_name || ''}`.trim() }))} />
              </div>
              <div>
                <label className={`text-sm font-medium mb-1.5 block ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Note pour le responsable</label>
                <textarea className={`w-full h-20 px-3 py-2 text-sm rounded-xl border focus:outline-none resize-none ${isDark ? 'bg-white/[0.04] border-white/10 text-white placeholder:text-slate-500 focus:border-violet-400/30' : 'bg-white border-teal-900/10 text-slate-900 placeholder:text-slate-400 focus:border-teal-500/30'}`} placeholder="Je vous confie ce client pour le suivi..." value={reassignNote} onChange={(e) => setReassignNote(e.target.value)} />
              </div>
              <label className={`flex items-center gap-2 text-sm cursor-pointer ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                <input type="checkbox" className="w-4 h-4 rounded border" checked={sendNotification} onChange={(e) => setSendNotification(e.target.checked)} />
                Envoyer une notification au nouveau responsable
              </label>
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={() => setShowReassignDialog(false)}>Annuler</Button>
                <Button variant="default" className={isGerant ? GERANT_BUTTON_CLASSES : ''} onClick={handleReassign} disabled={!selectedAgent}>Réaffecter</Button>
              </div>
            </div>
          )}
        </Dialog>

        <Dialog isOpen={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} title="Supprimer le client" size="lg">
          {actionClient && (
            <div className="space-y-4">
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-white/[0.04] border-white/10' : 'bg-teal-50 border-teal-900/10'}`}>
                <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{actionClient.name}</p>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{actionClient.type} · {actionClient.phone}</p>
              </div>
              <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-red-700 space-y-1">
                    <p className="font-semibold">Attention :</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>Cette action est IRREVERSIBLE</li>
                      <li>Tous les documents associés seront supprimés</li>
                      <li>Tous les mandats liés seront supprimés</li>
                      <li>L'historique du client sera effacé</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Confirmation</label>
                <input type="text" className="w-full h-10 px-3 text-sm rounded-xl border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-error/20 focus:border-error" placeholder='Tapez "SUPPRIMER" pour confirmer' value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Motif de suppression (optionnel)</label>
                <select className={`w-full h-10 px-3 text-sm rounded-xl border bg-card focus:outline-none ${isDark ? 'bg-white/[0.04] border-white/10 text-white focus:border-violet-400/30' : 'bg-white border-teal-900/10 text-slate-900 focus:border-teal-500/30'}`} value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)}>
                  <option value="">Sélectionner un motif</option>
                  <option value="doublon">Erreur de saisie - Doublon</option>
                  <option value="retire">Client retiré</option>
                  <option value="decede">Client décédé</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>Annuler</Button>
                <Button variant="danger" onClick={handleDelete} disabled={deleteConfirm !== 'SUPPRIMER'}>Confirmer la suppression</Button>
              </div>
            </div>
          )}
        </Dialog>

        <Dialog isOpen={showStatusDialog} onClose={() => setShowStatusDialog(false)} title="Changer le statut" size="md">
          {actionClient && (
            <div className="space-y-4">
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-white/[0.04] border-white/10' : 'bg-teal-50 border-teal-900/10'}`}>
                <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{actionClient.name}</p>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{actionClient.type} · {actionClient.phone}</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Statut actuel</label>
                <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border ${STATUS_COLORS[actionClient.statutMetier || actionClient.status] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>{actionClient.statutMetier || actionClient.status}</span>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Nouveau statut</label>
                <select className={`w-full h-10 px-3 text-sm rounded-xl border bg-card focus:outline-none ${isDark ? 'bg-white/[0.04] border-white/10 text-white focus:border-violet-400/30' : 'bg-white border-teal-900/10 text-slate-900 focus:border-teal-500/30'}`} value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                  {(STATUS_BY_TYPE[type || ''] || []).map(s => (<option key={s} value={s}>{s}</option>))}
                </select>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={() => setShowStatusDialog(false)}>Annuler</Button>
                <Button variant="default" className={isGerant ? GERANT_BUTTON_CLASSES : ''} onClick={handleStatusChange} disabled={newStatus === (actionClient.statutMetier || actionClient.status)}>Changer le statut</Button>
              </div>
            </div>
          )}
        </Dialog>

        <Dialog isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Attribution du client" size="sm">
          {assignStep === 'choose' ? (
            <div className="space-y-3">
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'} mb-4`}>Souhaitez-vous confier ce client à un agent, un admin ou le gérer vous-même ?</p>
              <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left group ${isDark ? 'bg-white/[0.04] border-white/10 hover:bg-white/[0.06] hover:border-violet-400/30' : 'bg-white border-teal-900/10 hover:bg-teal-50 hover:border-teal-500/20'}`} onClick={() => setAssignStep('agent')}>
                <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500 group-hover:scale-105 transition-transform"><Users size={16} /></div>
                <div><div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Confier à un agent</div><div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Le client sera rattaché à un agent immobilier</div></div>
              </button>
              <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left group ${isDark ? 'bg-white/[0.04] border-white/10 hover:bg-white/[0.06] hover:border-violet-400/30' : 'bg-white border-teal-900/10 hover:bg-teal-50 hover:border-teal-500/20'}`} onClick={() => setAssignStep('admin')}>
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:scale-105 transition-transform"><Shield size={16} /></div>
                <div><div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Confier à un admin</div><div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Le client sera géré par un autre administrateur</div></div>
              </button>
              <div className="relative py-1"><div className="absolute inset-0 flex items-center"><div className={`w-full border-t ${isDark ? 'border-white/10' : 'border-teal-900/10'}`} /></div><div className="relative flex justify-center"><span className={`px-3 text-xs ${isDark ? 'bg-[#0B1022] text-slate-500' : 'bg-white text-slate-400'}`}>ou</span></div></div>
              <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left group ${isGerant ? 'border-[#905D5D]/20 bg-[#905D5D]/5 hover:bg-[#905D5D]/10 hover:border-[#905D5D]/30' : isDark ? 'border-violet-500/20 bg-violet-500/5 hover:bg-violet-500/10' : 'border-teal-500/20 bg-teal-50 hover:bg-teal-100'}`} onClick={() => { setShowAssignModal(false); setSelectedAgent(currentUser ? String(currentUser.id) : ''); setIsModalOpen(true); }}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D]' : isDark ? 'bg-violet-500/10 text-violet-300' : 'bg-teal-500/10 text-teal-600'}`}><User size={16} /></div>
                <div><div className={`text-sm font-semibold ${isGerant ? 'text-[#905D5D]' : isDark ? 'text-violet-300' : 'text-teal-700'}`}>Je gère moi-même</div><div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Ajouter le client directement en tant qu'admin</div></div>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <button className={`text-xs flex items-center gap-1 transition-colors mb-2 ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`} onClick={() => setAssignStep('choose')}>
                <ArrowLeft size={14} />
                Retour
              </button>
              <p className={`text-sm mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{assignStep === 'agent' ? 'Sélectionnez un agent' : 'Sélectionnez un admin'}</p>
              <div className="space-y-1.5 max-h-64 overflow-y-auto scrollbar-thin">
                {(assignStep === 'agent' ? users.filter(u => u.role === 'agent').map(u => ({ id: String(u.id), name: `${u.first_name || ''} ${u.last_name || ''}`.trim(), initials: `${(u.first_name || '')[0]}${(u.last_name || '')[0]}`.toUpperCase() || '?', color: COLORS[Math.abs(Number(u.id) || u.id.length) % COLORS.length] })) : users.filter(u => (u.role === 'admin' || u.role === 'gerant') && String(u.id) !== String(currentUser?.id)).map(u => ({ id: String(u.id), name: `${u.first_name || ''} ${u.last_name || ''}`.trim(), initials: `${(u.first_name || '')[0]}${(u.last_name || '')[0]}`.toUpperCase() || '?', color: 'bg-indigo-500' }))).map((person) => (
                  <button key={person.id} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all text-left group ${isDark ? 'bg-white/[0.04] border-white/10 hover:bg-white/[0.06] hover:border-violet-400/20' : 'bg-white border-teal-900/10 hover:bg-teal-50 hover:border-teal-500/20'}`} onClick={() => { setShowAssignModal(false); setSelectedAgent(person.id); setIsModalOpen(true); }}>
                    <div className={`w-8 h-8 rounded-full ${person.color} text-white text-xs font-semibold flex items-center justify-center`}>{person.initials}</div>
                    <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{person.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </Dialog>

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

        {currentUser && (
          <ClientDraftSection key={draftVersion} userId={String(currentUser.id)} clientType={clientTypeKey[type || '']} onResume={(draft) => setResumeDraftId(draft.id)} isGerant={isGerant} />
        )}
      </div>
    </Stage>
  );
}
