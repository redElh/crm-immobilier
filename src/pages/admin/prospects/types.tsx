import { useNavigate, useParams } from 'react-router-dom';
import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Badge } from '../../../components/ui/Badge';
import {
  Search, Sliders, X, User, Edit3, Repeat, Trash2, Copy, ChevronLeft, ChevronRight,
  RefreshCw, Eye, Phone, Mail, MapPin, AlertTriangle, TrendingUp,
  Users, Calendar, ArrowUp, ArrowDown, CheckCircle, UserPlus, UserX,
  Clock, DollarSign, Home, MessageSquare, Plus, Activity, PieChart, Bell,
} from 'react-feather';
import { ORIGINS } from './mockData';
import type { AdminProspect } from './mockData';
import type { Prospect } from '../../../types/prospect';
import { ProspectFormModal } from '../../../components/modules/prospects/ProspectFormModal';
import { ProspectDraftSection } from '../../../components/modules/prospects/ProspectDraftSection';
import { ProspectAssignModal } from '../../../components/modules/prospects/ProspectAssignModal';
import { QualificationPocket } from '../../../components/modules/prospects/QualificationPocket';
import { api } from '../../../services/api';
import { fetchProspects, deleteProspect as apiDeleteProspect, duplicateProspect } from '../../../services/prospectService';
import { cn } from '../../../lib/utils';
import {
  StagePanel, StageBadge, StageButton, OrbIcon, AnimatedNumber,
  TiltCard, ShimmerProgress, STAGE_HUES, SLATE_HUE, GERANT_MAUVE_HUE,
  useStageTheme, useStageAccent, type StageHue,
} from '../../../components/dashboard/Stage';
import StageModal, { useStageModalButtons } from '../../../components/modules/calendar/StageModal';
import { getStatusHue, getStatusLabel, TYPE_META } from '../../../components/modules/prospects/ProspectCard';
import { stagePillStyle } from '../../../components/modules/prospects/ProspectDetailStage';
import { AdminStatCard } from '../../../components/dashboard/AdminStatCard';
import { ProspectFunnel3D } from '../../../components/dashboard/three/ProspectFunnel3D';
import { Donut3D } from '../../../components/dashboard/three/Donut3D';
import { useToast } from '../../../components/ui/Toast';
import { RegistreActionsMenu } from '../../../components/ui/RegistreActionsMenu';
import { useNotifications } from '../../../contexts/NotificationContext';

const PAGE_SIZE = 8;

const DANGER_HUE: StageHue = {
  a: '#FB7185',
  b: '#E11D48',
  glow: 'rgba(244,63,94,0.45)',
  line: '#F43F5E',
};

function ProspectSummaryCard({
  prospect, hue, isDark, isGerant,
}: {
  prospect: AdminProspect;
  hue: StageHue;
  isDark: boolean;
  isGerant: boolean;
}) {
  const initials = `${prospect.firstName?.[0] || ''}${prospect.lastName?.[0] || ''}`.toUpperCase() || '?';
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl border p-3.5',
        isDark
          ? 'border-white/[0.08] bg-white/[0.04]'
          : isGerant
            ? 'border-[#905D5D]/15 bg-white/70'
            : 'border-orange-900/10 bg-white/70',
      )}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-extrabold text-white"
        style={{
          backgroundImage: `linear-gradient(145deg, ${hue.a}, ${hue.b})`,
          boxShadow: `0 10px 22px -10px ${hue.glow}, inset 0 1px 0 rgba(255,255,255,0.35)`,
        }}
      >
        {initials}
      </span>
      <div className="min-w-0">
        <p className={cn('truncate text-sm font-bold', isDark ? 'text-white' : 'text-slate-900')}>
          {prospect.civility} {prospect.firstName} {prospect.lastName}
        </p>
        <p className={cn('truncate text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>
          {prospect.email} · {prospect.phone}
        </p>
      </div>
    </div>
  );
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'Nouveau', label: 'Nouveau' },
  { value: 'Contacté', label: 'Contacte' },
  { value: 'Qualifié', label: 'Qualifie' },
  { value: 'En attente', label: 'En attente' },
  { value: 'Perdu', label: 'Perdu' },
  { value: 'Converti', label: 'Converti' },
];

const TYPE_OPTIONS = [
  { value: 'all', label: 'Tous les types' },
  { value: 'Acheter', label: 'Acheter' },
  { value: 'Louer', label: 'Louer' },
  { value: 'Vendre', label: 'Vendre' },
  { value: 'Faire estimer', label: 'Faire estimer' },
];

const AGENT_HUES: StageHue[] = [
  STAGE_HUES.violet, STAGE_HUES.sky, STAGE_HUES.emerald, STAGE_HUES.amber, STAGE_HUES.fuchsia,
];

const agentHueFor = (id: string | number | null | undefined): StageHue => {
  if (!id) return SLATE_HUE;
  const str = String(id);
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  return AGENT_HUES[hash % AGENT_HUES.length];
};

type ChipIcon = React.ComponentType<{ size?: number | string; className?: string }>;

function HueChip({
  hue, label, isDark, icon: Icon, className,
}: {
  hue: StageHue;
  label: string;
  isDark: boolean;
  icon?: ChipIcon;
  className?: string;
}) {
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold backdrop-blur-md', className)}
      style={stagePillStyle(hue, isDark)}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: hue.line, boxShadow: `0 0 6px ${hue.glow}` }} />
      {Icon ? <Icon size={10} /> : null}
      {label}
    </span>
  );
}

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

export default function AdminProspectsPage() {
  const navigate = useNavigate();
  const { adminId } = useParams<{ adminId: string }>();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [originFilter, setOriginFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const searchRef = useRef<HTMLInputElement>(null);

  const [actionProspect, setActionProspect] = useState<AdminProspect | null>(null);
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftId, setDraftId] = useState<string | undefined>();
  const [draftChange, setDraftChange] = useState(0);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [reassignNote, setReassignNote] = useState('');
  const [sendNotification, setSendNotification] = useState(false);
  const [prospects, setProspects] = useState<AdminProspect[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProspect, setEditingProspect] = useState<AdminProspect | null>(null);
  const [qualifiedRefresh, setQualifiedRefresh] = useState(0);
  const [pocketPresent, setPocketPresent] = useState(false);

  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const userId = adminId || 'admin';
  const theme = useStageTheme();
  const accent = useStageAccent();
  const btns = useStageModalButtons();
  const isDark = theme === 'dark';
  const isGerant = currentUser?.role === 'gerant';
  const interfaceHue = isGerant ? GERANT_MAUVE_HUE : accent;
  const ghostBtn = cn(
    btns.ghost,
    isDark
      ? ''
      : isGerant
        ? '!border-[#905D5D]/15 !text-[#7D5050]/70 hover:!bg-white hover:!text-[#7D5050]'
        : '!border-orange-900/12 !text-orange-900/70 hover:!bg-white hover:!text-orange-900',
  );
  const fieldLabel = cn(
    'mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em]',
    isDark ? 'text-slate-400' : isGerant ? 'text-[#905D5D]/65' : 'text-orange-900/55',
  );

  useEffect(() => {
    api.get<any[]>('/admin/users').then(setUsers).catch(() => {});
    api.get<any>('/auth/me').then(setCurrentUser).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchProspects()
      .then(data => {
        const list = (Array.isArray(data) ? data : []).map((p: Prospect) => ({
          ...p,
          agentId: String(p.agentId || ''),
          mandateStatus: 'actif' as const,
        } as AdminProspect));
        setProspects(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const COLORS = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500', 'bg-cyan-500', 'bg-pink-500'];

  const findPerson = (agentId: string | number | null | undefined) => {
    if (!agentId) return undefined;
    const id = String(agentId);
    const user = users.find(u => String(u.id) === id && u.status !== 'supprimé');
    if (user) {
      const initials = `${(user.first_name || '')[0]}${(user.last_name || '')[0]}`.toUpperCase() || '?';
      const color = COLORS[Math.abs(Number(user.id) || user.id.length) % COLORS.length];
      return { name: `${user.first_name || ''} ${user.last_name || ''}`.trim(), initials, color, role: user.role, position: user.position };
    }
    return undefined;
  };

  const filteredProspects = useMemo(() => {
    return prospects
      .filter(p =>
        !searchTerm ||
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone.includes(searchTerm)
      )
      .filter(p => statusFilter === 'all' || p.status === statusFilter)
      .filter(p => agentFilter === 'all' || (agentFilter === '__none__' ? !p.agentId : p.agentId === agentFilter))
      .filter(p => originFilter === 'all' || p.origin === originFilter)
      .filter(p => typeFilter === 'all' || p.type === typeFilter)
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
  }, [prospects, searchTerm, statusFilter, agentFilter, originFilter, typeFilter, dateRange]);

  const totalPages = Math.max(1, Math.ceil(filteredProspects.length / PAGE_SIZE));
  const paginatedProspects = filteredProspects.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(p => Math.min(p, totalPages));
  }, [totalPages]);

  const getAgentName = (agentId: string | number | null | undefined) => {
    if (!agentId) return 'Non assigne';
    const person = findPerson(agentId);
    return person ? person.name : 'Ancien responsable';
  };

  const getAgentInitials = (agentId: string | number | null | undefined) => {
    if (!agentId) return 'NA';
    const person = findPerson(agentId);
    return person ? person.initials : String(agentId).slice(0, 2).toUpperCase();
  };

  const getAgentColor = (agentId: string | number | null | undefined) => {
    if (!agentId) return 'bg-gray-400';
    const person = findPerson(agentId);
    return person ? person.color : 'bg-violet-400';
  };

  const getRoleBadge = (person?: { role?: string; position?: string }) => {
    if (!person) return null;
    if (person.role === 'agent') {
      return { label: person.position || 'Agent', cls: 'bg-emerald-100 text-emerald-700' };
    }
    if (person.role === 'gerant') {
      return { label: 'Gérant', cls: 'bg-orange-100 text-orange-700' };
    }
    if (person.role === 'admin') {
      return { label: 'Admin', cls: 'bg-indigo-100 text-indigo-700' };
    }
    return null;
  };

  const kpiData = useMemo(() => {
    const total = prospects.length;
    const nouveaux = prospects.filter(p => p.status === 'Nouveau').length;
    const contactes = prospects.filter(p => p.status === 'Contacté').length;
    const qualifies = prospects.filter(p => p.status === 'Qualifié').length;
    const enAttente = prospects.filter(p => p.status === 'En attente').length;
    const perdus = prospects.filter(p => p.status === 'Perdu').length;
    const convertis = prospects.filter(p => p.status === 'Converti').length;
    const tauxConv = total > 0 ? ((convertis / total) * 100).toFixed(1) : '0';
    return { total, nouveaux, contactes, qualifies, enAttente, perdus, convertis, tauxConv };
  }, [prospects]);

  const statsByAgent = useMemo(() => {
    const stats: Record<string, { total: number; nouveaux: number; contactes: number; qualifies: number; convertis: number }> = {};
    prospects.forEach(p => {
      const id = String(p.agentId || '');
      if (!stats[id]) stats[id] = { total: 0, nouveaux: 0, contactes: 0, qualifies: 0, convertis: 0 };
      stats[id].total++;
      if (p.status === 'Nouveau') stats[id].nouveaux++;
      if (p.status === 'Contacté') stats[id].contactes++;
      if (p.status === 'Qualifié') stats[id].qualifies++;
      if (p.status === 'Converti') stats[id].convertis++;
    });
    return stats;
  }, [prospects]);

  const totalStats = useMemo(() => {
    const vals = Object.values(statsByAgent);
    return {
      total: vals.reduce((s, v) => s + v.total, 0),
      nouveaux: vals.reduce((s, v) => s + v.nouveaux, 0),
      contactes: vals.reduce((s, v) => s + v.contactes, 0),
      qualifies: vals.reduce((s, v) => s + v.qualifies, 0),
      convertis: vals.reduce((s, v) => s + v.convertis, 0),
    };
  }, [statsByAgent]);

  const activeFiltersCount = [
    statusFilter !== 'all', agentFilter !== 'all', originFilter !== 'all',
    typeFilter !== 'all', dateRange !== 'all',
  ].filter(Boolean).length;

  const resetFilters = () => {
    setStatusFilter('all'); setAgentFilter('all'); setOriginFilter('all');
    setTypeFilter('all'); setDateRange('all');
  };

  const originOptions = [
    { value: 'all', label: 'Toutes les origines' },
    ...ORIGINS.map(o => ({ value: o, label: o })),
  ];

  const agentOptions = useMemo(() => [
    { value: 'all', label: 'Tous les intervenants' },
    ...users.filter((u: any) => u.status !== 'supprimé').map((u: any) => ({
      value: String(u.id),
      label: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
    })),
    { value: '__none__', label: 'Non assigns' },
  ], [users]);

  const dateRangeOptions = [
    { value: 'all', label: 'Toutes dates' },
    { value: '7', label: '7 derniers jours' },
    { value: '30', label: '30 derniers jours' },
    { value: '90', label: '90 derniers jours' },
  ];

  const filterChips = useMemo(() => {
    const chips: { key: string; label: string; value: string; clear: () => void }[] = [];
    if (statusFilter !== 'all') chips.push({ key: 'status', label: 'Statut', value: STATUS_OPTIONS.find(o => o.value === statusFilter)?.label || statusFilter, clear: () => setStatusFilter('all') });
    if (agentFilter !== 'all') {
      const found = agentOptions.find(o => o.value === agentFilter);
      chips.push({ key: 'agent', label: 'Responsable', value: found?.label || agentFilter, clear: () => setAgentFilter('all') });
    }
    if (originFilter !== 'all') chips.push({ key: 'origin', label: 'Origine', value: originFilter, clear: () => setOriginFilter('all') });
    if (typeFilter !== 'all') chips.push({ key: 'type', label: 'Type', value: typeFilter, clear: () => setTypeFilter('all') });
    if (dateRange !== 'all') chips.push({ key: 'date', label: 'Période', value: dateRangeOptions.find(o => o.value === dateRange)?.label || dateRange, clear: () => setDateRange('all') });
    return chips;
  }, [statusFilter, agentFilter, originFilter, typeFilter, dateRange, agentOptions]);

  const keyboardHint = useMemo(
    () => (typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform) ? '⌘ K' : 'Ctrl K'),
    [],
  );

  const teamAgents = users.filter((u: any) => u.status !== 'supprimé');

  const statTotals = useMemo(() => {
    const counts = { nouveau: 0, contacte: 0, qualifie: 0, converti: 0, autre: 0 };
    Object.values(statsByAgent).forEach(s => {
      counts.nouveau += s.nouveaux;
      counts.contacte += s.contactes;
      counts.qualifie += s.qualifies;
      counts.converti += s.convertis;
      counts.autre += s.total - s.nouveaux - s.contactes - s.qualifies - s.convertis;
    });
    return counts;
  }, [statsByAgent]);

  const handleReassign = async () => {
    if (!actionProspect || !selectedAgent) return;
    try {
      await api.put(`/prospects/${actionProspect.id}`, { agentId: selectedAgent } as any);
      setProspects(prev => prev.map(p => p.id === actionProspect.id ? { ...p, agentId: selectedAgent } : p));
      toast('success', 'Prospect réaffecté avec succès');
    } catch (e: any) {
      toast('error', e.message || 'Erreur lors de la réaffectation');
    }
    setShowReassignDialog(false);
    setSelectedAgent('');
    setReassignNote('');
    setSendNotification(false);
    setActionProspect(null);
  };

  const handleDelete = async () => {
    if (deleteConfirm !== 'SUPPRIMER' || !actionProspect) return;
    try {
      await apiDeleteProspect(String(actionProspect.id));
      setProspects(prev => prev.filter(p => p.id !== actionProspect.id));
      toast('success', 'Prospect supprimé avec succès');
    } catch (e: any) {
      toast('error', e.message || 'Erreur lors de la suppression');
    }
    setShowDeleteDialog(false);
    setDeleteConfirm('');
    setDeleteReason('');
    setActionProspect(null);
  };

  const handleAddProspect = async (data: Omit<Prospect, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const payload = { ...data, agentId: selectedAgent || currentUser?.id || null };
      const created = await api.post<any>('/prospects', payload as any);
      setProspects(prev => [{ ...created, agentId: String(created.agentId || ''), mandateStatus: 'actif' } as AdminProspect, ...prev]);
      toast('success', 'Prospect ajouté avec succès');
      if (selectedAgent && currentUser && String(selectedAgent) !== String(currentUser.id)) {
        addNotification({
          userId: String(selectedAgent),
          senderName: `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || 'Admin',
          type: 'prospect_assigned',
          message: `Un nouveau prospect "${data.firstName} ${data.lastName}" vous a été assigné par l'administrateur.`,
          propertyId: String(created.id),
          propertyRef: `${data.firstName} ${data.lastName}`,
        });
      }
    } catch (e: any) {
      toast('error', e.message || "Erreur lors de l'ajout");
    }
    setIsModalOpen(false);
    setSelectedAgent('');
  };

  const kpiCards = [
    { label: 'Total prospects', value: kpiData.total, evolution: '+18%', up: true, icon: Users, color: 'text-accent', bg: 'bg-accent-light' },
    { label: 'Nouveaux', value: kpiData.nouveaux, evolution: '+25%', up: true, icon: UserPlus, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Contactes', value: kpiData.contactes, evolution: '+10%', up: true, icon: Phone, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Qualifies', value: kpiData.qualifies, evolution: '+8%', up: true, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'En attente', value: kpiData.enAttente, evolution: '-5%', up: false, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Perdus', value: kpiData.perdus, evolution: '0%', up: true, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Convertis', value: kpiData.convertis, evolution: '+15%', up: true, icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Taux conv.', value: `${kpiData.tauxConv}%`, evolution: '+2%', up: true, icon: DollarSign, color: 'text-accent', bg: 'bg-accent-light' },
  ];

  const gradientTitle = isDark
    ? 'bg-clip-text text-transparent bg-gradient-to-r from-[#F43F5E] via-[#FB7185] to-[#8B7CFF]'
    : 'bg-clip-text text-transparent bg-gradient-to-r from-[#EA580C] via-[#F97316] to-[#FBBF24]'

  const pipelineStages = [
    { label: 'Nouveau', count: kpiData.nouveaux, hue: STAGE_HUES.sky },
    { label: 'Contacté', count: kpiData.contactes, hue: STAGE_HUES.amber },
    { label: 'Qualifié', count: kpiData.qualifies, hue: STAGE_HUES.emerald },
    { label: 'En attente', count: kpiData.enAttente, hue: STAGE_HUES.amber },
    { label: 'Perdu', count: kpiData.perdus, hue: SLATE_HUE },
    { label: 'Converti', count: kpiData.convertis, hue: STAGE_HUES.violet },
  ]

  const statusDonut = pipelineStages.map(s => ({ name: s.label, value: s.count, hue: s.hue }))

  return (
    <div className="space-y-5 pb-24">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className={cn('flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[3px]', isDark ? 'text-slate-400' : 'text-teal-900/50')}>
              <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Square Immo · Prospects · Temps réel
            </p>
            <h1 className={cn('mt-2 text-4xl font-black tracking-[-2px] sm:text-5xl', gradientTitle)}>
              PROSPECTS 360
            </h1>
            <p className={cn('mt-1.5 text-sm', isDark ? 'text-slate-400' : 'text-teal-900/60')}>
              Analyse complète du pipeline de prospection — statuts, origines et conversion.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StageButton variant="glass" size="md" icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />} onClick={() => { setLoading(true); fetchProspects().then((d: any) => setProspects(Array.isArray(d) ? d.map((p: Prospect) => ({ ...p, agentId: String(p.agentId || ''), mandateStatus: 'actif' } as AdminProspect)) : [])).catch(() => {}).finally(() => setLoading(false)) }} disabled={loading}>
              Actualiser
            </StageButton>
            <StageButton size="md" icon={<Plus size={14} />} onClick={() => setShowAssignModal(true)}>
              Nouveau prospect
            </StageButton>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard icon={Users} label="Total prospects" value={kpiData.total} unit="prospects" detail={`${kpiData.nouveaux} nouveaux`} hue={accent} facts={[{ label: 'Nouveaux', value: kpiData.nouveaux }, { label: 'Convertis', value: kpiData.convertis }]} delay={0} />
        <AdminStatCard icon={UserPlus} label="Nouveaux" value={kpiData.nouveaux} unit="prospects" detail={`${kpiData.contactes} contactés`} hue={STAGE_HUES.sky} facts={[{ label: 'Contactés', value: kpiData.contactes }, { label: 'Qualifiés', value: kpiData.qualifies }]} delay={0.06} />
        <AdminStatCard icon={CheckCircle} label="Qualifiés" value={kpiData.qualifies} unit="prospects" detail={`${kpiData.enAttente} en attente`} hue={STAGE_HUES.emerald} facts={[{ label: 'En attente', value: kpiData.enAttente }, { label: 'Perdus', value: kpiData.perdus }]} delay={0.12} />
        <AdminStatCard icon={TrendingUp} label="Taux conv." value={Number(kpiData.tauxConv)} decimals={1} unit="%" detail={`${kpiData.convertis} convertis`} hue={STAGE_HUES.violet} facts={[{ label: 'Convertis', value: kpiData.convertis }, { label: 'Total', value: kpiData.total }]} delay={0.18} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <StagePanel title="Pipeline des prospects" icon={Activity} hue={accent} outerClassName="lg:col-span-2" className="min-h-[380px]" badge={<StageBadge variant="neutral">{kpiData.total} prospects</StageBadge>}>
          <div className="flex h-full flex-col">
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <StageBadge variant="neutral">{kpiData.nouveaux} nouveaux</StageBadge>
              <StageBadge variant="ok">{kpiData.qualifies} qualifiés</StageBadge>
              <StageBadge variant="violet">{kpiData.convertis} convertis</StageBadge>
            </div>
            <ProspectFunnel3D stages={pipelineStages} isDark={isDark} accent={accent} className="mt-2 min-h-[300px] w-full flex-1" />
            <div className="mt-1.5 flex shrink-0 items-center justify-between gap-2">
              <span className={cn('text-[10px] font-semibold', isDark ? 'text-slate-500' : 'text-slate-400')}>
                Fichier actuel · <b className={isDark ? 'text-slate-300' : 'text-slate-700'}>{kpiData.total} prospects</b>
              </span>
              <span className={cn('hidden text-[10px] font-semibold sm:block', isDark ? 'text-slate-500' : 'text-slate-400')}>
                {kpiData.nouveaux} nouveaux · {kpiData.qualifies} qualifiés · {kpiData.convertis} convertis
              </span>
            </div>
          </div>
        </StagePanel>

        <StagePanel title="Répartition par statut" icon={PieChart} hue={STAGE_HUES.violet} badge={<StageBadge variant="neutral">{kpiData.total} prospects</StageBadge>}>
          <div className="flex h-full flex-col">
            <Donut3D slices={statusDonut} centerValue={String(kpiData.total)} centerLabel="prospects" isDark={isDark} height={260} className="w-full" />
            <div className="mt-3 space-y-1.5">
              {pipelineStages.map(s => {
                const share = kpiData.total > 0 ? Math.round((s.count / kpiData.total) * 100) : 0
                return (
                  <div key={s.label} className={cn('flex items-center gap-2 rounded-xl border px-2.5 py-1.5', isDark ? 'border-white/[0.05] bg-white/[0.02]' : 'border-slate-200/60 bg-white/60')}>
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.hue.line, boxShadow: `0 0 6px ${s.hue.glow}` }} />
                    <span className={cn('min-w-0 flex-1 truncate text-[11px] font-bold', isDark ? 'text-slate-300' : 'text-slate-600')}>{s.label}</span>
                    <span className={cn('text-[11px] font-extrabold tabular-nums', isDark ? 'text-slate-200' : 'text-slate-800')}>{s.count}</span>
                    <span className={cn('w-8 text-right text-[9.5px] font-semibold tabular-nums', isDark ? 'text-slate-500' : 'text-slate-400')}>{share}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        </StagePanel>
      </div>

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
              <StageBadge variant="neutral">
                {filteredProspects.length} résultat{filteredProspects.length > 1 ? 's' : ''}
              </StageBadge>
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
                    : 'border-slate-200/80 bg-white/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] focus-within:border-teal-600/30 focus-within:ring-teal-500/[0.08]',
                )}
                style={{
                  boxShadow: isDark
                    ? 'inset 0 1px 0 rgba(255,255,255,0.05)'
                    : 'inset 0 1px 0 rgba(255,255,255,0.9)',
                }}
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
                  ref={searchRef}
                  type="text"
                  placeholder="Rechercher par nom, email ou téléphone..."
                  className={cn(
                    'h-full min-w-0 flex-1 bg-transparent text-sm font-medium outline-none',
                    isDark ? 'text-white placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400',
                  )}
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
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
                      isDark ? 'border-white/[0.08] bg-white/[0.04] text-slate-500' : 'border-slate-200/80 bg-slate-50 text-slate-400',
                    )}
                  >
                    {keyboardHint}
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
                className="!h-12 flex-1 !rounded-2xl px-4 sm:flex-none"
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
                  onClick={() => { resetFilters(); setSearchTerm(''); setPage(1); }}
                  className="!h-12 !rounded-2xl px-3"
                >
                  Effacer
                </StageButton>
              )}
            </div>
          </div>

          {(filterChips.length > 0 || searchTerm) && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className={cn('mr-0.5 text-[10px] font-bold uppercase tracking-[0.14em]', isDark ? 'text-slate-500' : 'text-slate-400')}>
                Actifs
              </span>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors"
                  style={stagePillStyle(accent, isDark)}
                >
                  «{searchTerm.length > 18 ? `${searchTerm.slice(0, 18)}…` : searchTerm}»
                  <X size={10} />
                </button>
              )}
              {filterChips.map(chip => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={chip.clear}
                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all hover:brightness-95"
                  style={stagePillStyle(accent, isDark)}
                >
                  <span className={cn('text-[9px] font-bold uppercase tracking-wide', isDark ? 'opacity-60' : 'opacity-70')}>{chip.label}</span>
                  {chip.value}
                  <X size={10} className="opacity-70" />
                </button>
              ))}
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
                <StageButton
                  variant="glass"
                  size="sm"
                  icon={<X size={12} />}
                  onClick={resetFilters}
                  disabled={activeFiltersCount === 0}
                >
                  Réinitialiser
                </StageButton>
              }
            >
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  { key: 'status', label: 'Statut', icon: Activity, control: <Select options={STATUS_OPTIONS} value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }} placeholder="Statut" /> },
                  { key: 'agent', label: 'Responsable', icon: User, control: <Select options={agentOptions} value={agentFilter} onValueChange={(v) => { setAgentFilter(v); setPage(1); }} placeholder="Responsable" /> },
                  { key: 'origin', label: 'Origine', icon: MapPin, control: <Select options={originOptions} value={originFilter} onValueChange={(v) => { setOriginFilter(v); setPage(1); }} placeholder="Origine" /> },
                  { key: 'type', label: "Type d'intérêt", icon: Home, control: <Select options={TYPE_OPTIONS} value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }} placeholder="Type d'intérêt" /> },
                  { key: 'date', label: 'Date de création', icon: Calendar, control: <Select options={dateRangeOptions} value={dateRange} onValueChange={(v) => { setDateRange(v); setPage(1); }} placeholder="Date de création" /> },
                ].map(field => {
                  const FieldIcon = field.icon;
                  return (
                    <div
                      key={field.key}
                      className={cn(
                        'rounded-2xl border p-2.5 transition-colors duration-200',
                        isDark ? 'border-white/[0.06] bg-white/[0.03]' : 'border-slate-200/60 bg-white/60',
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
              <div className={cn('mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-[11px] font-medium', isDark ? 'border-white/[0.06] text-slate-500' : 'border-slate-200/70 text-slate-400')}>
                <span className="inline-flex items-center gap-1.5">
                  <span className="live-dot inline-block h-1.5 w-1.5 rounded-full" style={{ background: accent.line, boxShadow: `0 0 6px ${accent.glow}` }} />
                  Les filtres s'appliquent instantanément
                </span>
                <span>
                  <b className={isDark ? 'text-slate-300' : 'text-slate-600'}>{filteredProspects.length}</b> prospect{filteredProspects.length > 1 ? 's' : ''} correspondant{filteredProspects.length > 1 ? 's' : ''}
                </span>
              </div>
            </StagePanel>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Statistics */}
      <StagePanel
        title="Statistiques par intervenant"
        icon={Users}
        hue={accent}
        action={
          <StageBadge variant="neutral">
            {teamAgents.length + (statsByAgent[''] ? 1 : 0)} intervenant{(teamAgents.length + (statsByAgent[''] ? 1 : 0)) > 1 ? 's' : ''}
          </StageBadge>
        }
      >
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {[
            { label: 'Nouveaux', count: statTotals.nouveau, hue: getStatusHue('Nouveau') || SLATE_HUE },
            { label: 'Contactés', count: statTotals.contacte, hue: getStatusHue('Contacté') || SLATE_HUE },
            { label: 'Qualifiés', count: statTotals.qualifie, hue: getStatusHue('Qualifié') || SLATE_HUE },
            { label: 'Convertis', count: statTotals.converti, hue: getStatusHue('Converti') || SLATE_HUE },
            { label: 'Autres', count: statTotals.autre, hue: SLATE_HUE },
          ].map(item => (
            <span
              key={item.label}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-semibold',
                isDark ? 'border-white/[0.07] bg-white/[0.03] text-slate-400' : 'border-slate-200/70 bg-white/70 text-slate-500',
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: item.hue.line, boxShadow: `0 0 6px ${item.hue.glow}` }} />
              {item.label}
              <b className={cn('tabular-nums', isDark ? 'text-slate-200' : 'text-slate-800')}>{item.count}</b>
            </span>
          ))}
        </div>

        <div className={cn('overflow-hidden rounded-2xl border', isDark ? 'border-white/[0.07] bg-white/[0.015]' : 'border-slate-200/70 bg-white/60')}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className={cn('border-b', isDark ? 'border-white/[0.07] bg-white/[0.03]' : 'border-slate-200/70 bg-slate-50/70')}>
                  {[
                    { label: 'Intervenant', align: 'text-left' },
                    { label: 'Total', align: 'text-center' },
                    { label: 'Nouveaux', align: 'text-center', dot: getStatusHue('Nouveau') },
                    { label: 'Contactés', align: 'text-center', dot: getStatusHue('Contacté') },
                    { label: 'Qualifiés', align: 'text-center', dot: getStatusHue('Qualifié') },
                    { label: 'Convertis', align: 'text-center', dot: getStatusHue('Converti') },
                    { label: 'Taux conv.', align: 'text-center' },
                  ].map(col => (
                    <th
                      key={col.label}
                      className={cn(
                        'px-4 py-2.5 text-[9.5px] font-extrabold uppercase tracking-[0.14em]',
                        col.align,
                        isDark ? 'text-slate-400' : 'text-slate-500',
                      )}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {col.dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: col.dot.line, boxShadow: `0 0 5px ${col.dot.glow}` }} />}
                        {col.label}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teamAgents.map((user: any) => {
                  const uid = String(user.id);
                  const s = statsByAgent[uid] || { total: 0, nouveaux: 0, contactes: 0, qualifies: 0, convertis: 0 };
                  const person = findPerson(uid);
                  const hue = agentHueFor(uid);
                  const badge = getRoleBadge(person);
                  const rate = s.total > 0 ? Math.round((s.convertis / s.total) * 100) : 0;
                  const conversionHue = getStatusHue('Converti') || hue;
                  return (
                    <tr
                      key={uid}
                      className={cn(
                        'group/row border-b transition-colors duration-200 last:border-0',
                        isDark ? 'border-white/[0.05] hover:bg-white/[0.04]' : 'border-slate-100 hover:bg-white',
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold text-white"
                            style={{
                              backgroundImage: `linear-gradient(145deg, ${hue.a}, ${hue.b})`,
                              boxShadow: `0 6px 16px -8px ${hue.glow}, inset 0 1px 0 rgba(255,255,255,0.35)`,
                            }}
                          >
                            {person?.initials || uid.slice(0, 2).toUpperCase()}
                            <span
                              className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2"
                              style={{ background: hue.line, borderColor: isDark ? '#0B1024' : '#fff' }}
                            />
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={cn('truncate text-[13px] font-bold', isDark ? 'text-white' : 'text-slate-900')}>{person?.name || uid}</span>
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
                        <div className={cn('text-center text-sm font-extrabold tabular-nums', isDark ? 'text-white' : 'text-slate-900')}>{s.total}</div>
                        <StageMixBar
                          className="mx-auto mt-1 max-w-[88px]"
                          isDark={isDark}
                          segments={[
                            { value: s.nouveaux, hue: getStatusHue('Nouveau') || SLATE_HUE },
                            { value: s.contactes, hue: getStatusHue('Contacté') || SLATE_HUE },
                            { value: s.qualifies, hue: getStatusHue('Qualifié') || SLATE_HUE },
                            { value: s.convertis, hue: getStatusHue('Converti') || SLATE_HUE },
                            { value: Math.max(0, s.total - s.nouveaux - s.contactes - s.qualifies - s.convertis), hue: SLATE_HUE },
                          ]}
                        />
                      </td>
                      {[s.nouveaux, s.contactes, s.qualifies, s.convertis].map((value, i) => (
                        <td key={i} className={cn('px-4 py-3 text-center text-xs font-semibold tabular-nums', isDark ? 'text-slate-300' : 'text-slate-700')}>{value}</td>
                      ))}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-14">
                            <ShimmerProgress
                              pct={rate}
                              colorFrom={conversionHue.a}
                              colorTo={conversionHue.b}
                              glow={conversionHue.glow}
                              height={5}
                            />
                          </div>
                          <span className={cn('min-w-[32px] text-right text-[11px] font-bold tabular-nums', isDark ? 'text-slate-200' : 'text-slate-700')}>{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {statsByAgent[''] && (() => {
                  const s = statsByAgent[''];
                  const rate = s.total > 0 ? Math.round((s.convertis / s.total) * 100) : 0;
                  const conversionHue = getStatusHue('Converti') || SLATE_HUE;
                  return (
                    <tr className={cn('border-b transition-colors duration-200', isDark ? 'border-white/[0.05] hover:bg-white/[0.04]' : 'border-slate-100 hover:bg-white')}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
                            style={{ backgroundImage: `linear-gradient(145deg, ${SLATE_HUE.a}, ${SLATE_HUE.b})`, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)' }}
                          >
                            <UserX size={13} />
                          </span>
                          <div>
                            <span className={cn('text-[13px] font-bold italic', isDark ? 'text-slate-400' : 'text-slate-500')}>Non assigné</span>
                            <p className={cn('text-[10px] font-medium', isDark ? 'text-slate-600' : 'text-slate-400')}>Sans responsable</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={cn('text-center text-sm font-extrabold tabular-nums', isDark ? 'text-white' : 'text-slate-900')}>{s.total}</div>
                        <StageMixBar
                          className="mx-auto mt-1 max-w-[88px]"
                          isDark={isDark}
                          segments={[
                            { value: s.nouveaux, hue: getStatusHue('Nouveau') || SLATE_HUE },
                            { value: s.contactes, hue: getStatusHue('Contacté') || SLATE_HUE },
                            { value: s.qualifies, hue: getStatusHue('Qualifié') || SLATE_HUE },
                            { value: s.convertis, hue: getStatusHue('Converti') || SLATE_HUE },
                            { value: Math.max(0, s.total - s.nouveaux - s.contactes - s.qualifies - s.convertis), hue: SLATE_HUE },
                          ]}
                        />
                      </td>
                      {[s.nouveaux, s.contactes, s.qualifies, s.convertis].map((value, i) => (
                        <td key={i} className={cn('px-4 py-3 text-center text-xs font-semibold tabular-nums', isDark ? 'text-slate-300' : 'text-slate-700')}>{value}</td>
                      ))}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-14">
                            <ShimmerProgress pct={rate} colorFrom={conversionHue.a} colorTo={conversionHue.b} glow={conversionHue.glow} height={5} />
                          </div>
                          <span className={cn('min-w-[32px] text-right text-[11px] font-bold tabular-nums', isDark ? 'text-slate-200' : 'text-slate-700')}>{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })()}

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
                  {[totalStats.nouveaux, totalStats.contactes, totalStats.qualifies, totalStats.convertis].map((value, i) => (
                    <td key={i} className={cn('px-4 py-3 text-center text-xs font-bold tabular-nums', isDark ? 'text-slate-200' : 'text-slate-800')}>{value}</td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center">
                      <span className={cn('rounded-full px-2 py-1 text-[11px] font-extrabold tabular-nums', isDark ? 'bg-white/[0.06] text-white' : 'bg-white text-slate-900')}>
                        {totalStats.total > 0 ? Math.round((totalStats.convertis / totalStats.total) * 100) : 0}%
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </StagePanel>

      {/* Prospects Table */}
      <StagePanel
        title="Registre des prospects"
        icon={Users}
        hue={accent}
        action={
          <div className="flex items-center gap-1.5">
            <StageBadge variant="neutral">
              {filteredProspects.length} prospect{filteredProspects.length > 1 ? 's' : ''}
            </StageBadge>
            {activeFiltersCount > 0 && (
              <StageButton variant="glass" size="sm" icon={<X size={12} />} onClick={() => { resetFilters(); setSearchTerm(''); setPage(1); }}>
                Tout effacer
              </StageButton>
            )}
          </div>
        }
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-medium', isDark ? 'text-slate-500' : 'text-slate-400')}>
            <span className="live-dot inline-block h-1.5 w-1.5 rounded-full" style={{ background: accent.line, boxShadow: `0 0 6px ${accent.glow}` }} />
            Cliquez sur un prospect pour ouvrir sa fiche 360°
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { label: 'Nouveau', hue: getStatusHue('Nouveau') || SLATE_HUE },
              { label: 'Qualifié', hue: getStatusHue('Qualifié') || SLATE_HUE },
              { label: 'Converti', hue: getStatusHue('Converti') || SLATE_HUE },
            ].map(s => (
              <span key={s.label} className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold', isDark ? 'border-white/[0.07] text-slate-400' : 'border-slate-200/70 text-slate-500')}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.hue.line, boxShadow: `0 0 5px ${s.hue.glow}` }} />
                {s.label}
              </span>
            ))}
          </div>
        </div>

        <div className={cn('overflow-hidden rounded-2xl border', isDark ? 'border-white/[0.07] bg-white/[0.015]' : 'border-slate-200/70 bg-white/60')}>
          <div className="overflow-x-auto">
            {filteredProspects.length > 0 ? (
              <table className="w-full min-w-[880px] text-sm">
                <thead>
                  <tr className={cn('border-b', isDark ? 'border-white/[0.07] bg-white/[0.03]' : 'border-slate-200/70 bg-slate-50/70')}>
                    {[
                      { label: '#', cls: 'w-12 text-left' },
                      { label: 'Prospect', cls: 'text-left' },
                      { label: 'Contact', cls: 'text-left hidden md:table-cell' },
                      { label: 'Géré par', cls: 'text-left hidden lg:table-cell' },
                      { label: 'Origine', cls: 'text-left hidden xl:table-cell' },
                      { label: 'Type', cls: 'text-left' },
                      { label: 'Statut', cls: 'text-left' },
                      { label: 'Actions', cls: 'w-16 text-center' },
                    ].map(col => (
                      <th key={col.label} className={cn('px-4 py-3 text-[9.5px] font-extrabold uppercase tracking-[0.14em]', col.cls, isDark ? 'text-slate-400' : 'text-slate-500')}>
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedProspects.map((prospect, index) => {
                    const agentHue = agentHueFor(prospect.agentId);
                    const statusHue = getStatusHue(prospect.status) || accent;
                    const typeMeta = TYPE_META[prospect.type];
                    const TypeIcon = typeMeta?.icon || Home;
                    const typeHue = typeMeta?.hue || SLATE_HUE;
                    const initials = `${prospect.firstName?.[0] || ''}${prospect.lastName?.[0] || ''}`.toUpperCase() || '?';
                    return (
                      <tr
                        key={prospect.id}
                        className={cn(
                          'group/row border-b transition-colors duration-200 last:border-0',
                          isDark ? 'border-white/[0.05] hover:bg-white/[0.04]' : 'border-slate-100 hover:bg-white',
                        )}
                      >
                        <td className="px-4 py-3">
                          <span className={cn('inline-flex h-6 min-w-6 items-center justify-center rounded-lg border px-1 text-[10px] font-bold tabular-nums', isDark ? 'border-white/[0.07] bg-white/[0.03] text-slate-500' : 'border-slate-200/70 bg-white text-slate-400')}>
                            {(page - 1) * PAGE_SIZE + index + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span
                              className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-extrabold text-white transition-transform duration-300 group-hover/row:scale-105"
                              style={{
                                backgroundImage: `linear-gradient(145deg, ${agentHue.a}, ${agentHue.b})`,
                                boxShadow: `0 8px 18px -10px ${agentHue.glow}, inset 0 1px 0 rgba(255,255,255,0.35)`,
                              }}
                            >
                              {initials}
                              <span
                                className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2"
                                style={{ background: statusHue.line, borderColor: isDark ? '#0B1024' : '#fff', boxShadow: `0 0 6px ${statusHue.glow}` }}
                              />
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <button
                                  className={cn('max-w-[190px] truncate text-left text-[13px] font-bold transition-opacity hover:opacity-75', isDark ? 'text-white' : 'text-slate-900')}
                                  onClick={() => navigate(`/admin/${adminId}/prospects/${prospect.id}`)}
                                >
                                  {prospect.civility} {prospect.firstName} {prospect.lastName}
                                </button>
                                <span
                                  className="shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider"
                                  style={stagePillStyle(prospect.originalProspectId ? (getStatusHue('En attente') || SLATE_HUE) : (getStatusHue('Qualifié') || SLATE_HUE), isDark)}
                                >
                                  {prospect.originalProspectId ? 'Copie' : 'Original'}
                                </span>
                              </div>
                              <div className={cn('mt-0.5 flex items-center gap-1.5 text-[10.5px] font-medium', isDark ? 'text-slate-500' : 'text-slate-400')}>
                                <Calendar size={10} />
                                <span>{new Date(prospect.createdAt).toLocaleDateString('fr-FR')}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="hidden px-4 py-3 md:table-cell">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className={cn('flex h-4 w-4 items-center justify-center rounded', isDark ? 'bg-white/[0.05] text-slate-500' : 'bg-slate-900/[0.05] text-slate-400')}>
                                <Phone size={9} />
                              </span>
                              <span className={cn('text-[11px] font-medium', isDark ? 'text-slate-300' : 'text-slate-600')}>{prospect.phone}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className={cn('flex h-4 w-4 items-center justify-center rounded', isDark ? 'bg-white/[0.05] text-slate-500' : 'bg-slate-900/[0.05] text-slate-400')}>
                                <Mail size={9} />
                              </span>
                              <span className={cn('max-w-[160px] truncate text-[11px] font-medium', isDark ? 'text-slate-400' : 'text-slate-500')}>{prospect.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="hidden px-4 py-3 lg:table-cell">
                          {prospect.agentId ? (
                            <div className="flex items-center gap-1.5">
                              <span
                                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-extrabold text-white"
                                style={{
                                  backgroundImage: `linear-gradient(145deg, ${agentHue.a}, ${agentHue.b})`,
                                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.3)`,
                                }}
                              >
                                {getAgentInitials(prospect.agentId)}
                              </span>
                              <span className={cn('max-w-[110px] truncate text-[11px] font-semibold', isDark ? 'text-slate-300' : 'text-slate-700')}>
                                {getAgentName(prospect.agentId)}
                              </span>
                              {(() => {
                                const badge = getRoleBadge(findPerson(prospect.agentId));
                                return badge ? (
                                  <span className="rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider" style={stagePillStyle(agentHue, isDark)}>
                                    {badge.label}
                                  </span>
                                ) : null;
                              })()}
                            </div>
                          ) : (
                            <span className={cn('text-[11px] font-medium italic', isDark ? 'text-slate-500' : 'text-slate-400')}>Non assigné</span>
                          )}
                        </td>
                        <td className="hidden px-4 py-3 xl:table-cell">
                          <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-medium', isDark ? 'text-slate-400' : 'text-slate-500')}>
                            <MapPin size={10} style={{ color: accent.line }} />
                            {prospect.origin}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <HueChip hue={typeHue} label={typeMeta?.label || prospect.type} icon={TypeIcon} isDark={isDark} />
                        </td>
                        <td className="px-4 py-3">
                          <HueChip hue={statusHue} label={getStatusLabel(prospect.status)} isDark={isDark} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <RegistreActionsMenu
                            isGerant={isGerant}
                            actions={[
                              { icon: <Eye size={14} />, label: 'Voir la fiche complète', onClick: () => navigate(`/admin/${adminId}/prospects/${prospect.id}`) },
                              { icon: <Edit3 size={14} />, label: 'Modifier', onClick: () => setEditingProspect(prospect) },
                              {
                                icon: <Copy size={14} />,
                                label: 'Dupliquer',
                                onClick: async () => {
                                  try {
                                    const duplicated = await duplicateProspect(String(prospect.id));
                                    setProspects(prev => [{ ...duplicated, agentId: String(duplicated.agentId || ''), mandateStatus: 'actif' } as AdminProspect, ...prev]);
                                    toast('success', `${prospect.firstName} ${prospect.lastName} dupliqué avec succès`);
                                  } catch (e: any) {
                                    toast('error', e.message || 'Erreur lors de la duplication');
                                  }
                                },
                              },
                              { separator: true, icon: <></>, label: '', onClick: () => {} },
                              {
                                icon: <Repeat size={14} />,
                                label: 'Réaffecter à un intervenant',
                                onClick: () => {
                                  setActionProspect(prospect);
                                  setSelectedAgent(String(prospect.agentId || ''));
                                  setSendNotification(false);
                                  setShowReassignDialog(true);
                                },
                              },
                              { separator: true, icon: <></>, label: '', onClick: () => {} },
                              {
                                icon: <Trash2 size={14} />,
                                label: 'Supprimer',
                                variant: 'danger',
                                onClick: () => {
                                  setActionProspect(prospect);
                                  setDeleteConfirm('');
                                  setDeleteReason('');
                                  setShowDeleteDialog(true);
                                },
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                <span
                  className="flex h-14 w-14 items-center justify-center rounded-2xl border"
                  style={{
                    background: `${accent.a}14`,
                    borderColor: `${accent.a}30`,
                    color: isDark ? accent.a : accent.b,
                    boxShadow: `0 12px 30px -18px ${accent.glow}`,
                  }}
                >
                  <Search size={22} />
                </span>
                <p className={cn('mt-3 text-sm font-extrabold', isDark ? 'text-white' : 'text-slate-900')}>Aucun prospect trouvé</p>
                <p className={cn('mt-1 max-w-xs text-xs leading-relaxed', isDark ? 'text-slate-400' : 'text-slate-500')}>
                  Ajustez vos filtres ou réinitialisez la recherche pour afficher vos prospects.
                </p>
                {(activeFiltersCount > 0 || searchTerm) && (
                  <div className="mt-4">
                    <StageButton variant="glass" size="md" icon={<X size={13} />} onClick={() => { resetFilters(); setSearchTerm(''); setPage(1); }}>
                      Réinitialiser les filtres
                    </StageButton>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pagination */}
          {filteredProspects.length > 0 && (
            <div className={cn('flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between', isDark ? 'border-white/[0.07] bg-white/[0.02]' : 'border-slate-200/70 bg-slate-50/60')}>
              <p className={cn('text-[11px] font-medium', isDark ? 'text-slate-400' : 'text-slate-500')}>
                Affichage <b className={isDark ? 'text-slate-200' : 'text-slate-700'}>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredProspects.length)}</b> sur <b className={isDark ? 'text-slate-200' : 'text-slate-700'}>{filteredProspects.length}</b> prospects
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-bold transition-all disabled:opacity-35',
                    isDark ? 'border-white/[0.07] bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]' : 'border-slate-200/80 bg-white text-slate-500 hover:bg-slate-50',
                  )}
                  aria-label="Page précédente"
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    type="button"
                    className={cn(
                      'flex h-8 min-w-8 items-center justify-center rounded-lg border px-1.5 text-xs font-bold transition-all',
                      p === page
                        ? 'border-white/20 text-white'
                        : isDark
                          ? 'border-transparent text-slate-400 hover:bg-white/[0.06] hover:text-white'
                          : 'border-transparent text-slate-500 hover:bg-slate-900/[0.05] hover:text-slate-900',
                    )}
                    style={p === page ? {
                      backgroundImage: `linear-gradient(145deg, ${accent.a}, ${accent.b})`,
                      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.4), 0 8px 20px -8px ${accent.glow}`,
                    } : undefined}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-bold transition-all disabled:opacity-35',
                    isDark ? 'border-white/[0.07] bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]' : 'border-slate-200/80 bg-white text-slate-500 hover:bg-slate-50',
                  )}
                  aria-label="Page suivante"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </StagePanel>

      <StageModal
        open={showReassignDialog}
        onClose={() => setShowReassignDialog(false)}
        title="Réaffecter un prospect"
        eyebrow="Attribution"
        subtitle={actionProspect ? `${actionProspect.civility || ''} ${actionProspect.firstName} ${actionProspect.lastName}`.trim() : undefined}
        icon={Repeat}
        hue={interfaceHue}
        maxWidth="max-w-xl"
        centered
        footer={actionProspect ? (
          <>
            <button className={ghostBtn} onClick={() => setShowReassignDialog(false)}>Annuler</button>
            <button
              className={cn(btns.primary, isGerant && 'btn-gerant-pill')}
              onClick={handleReassign}
              disabled={!selectedAgent}
            >
              Réaffecter
            </button>
          </>
        ) : undefined}
      >
        {actionProspect && (
          <div className="space-y-4">
            <ProspectSummaryCard prospect={actionProspect} hue={interfaceHue} isDark={isDark} isGerant={isGerant} />
            <div>
              <p className={fieldLabel}>Responsable actuel</p>
              <div className="flex items-center gap-2 text-sm">
                {actionProspect.agentId ? (
                  <>
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white ${getAgentColor(actionProspect.agentId)}`}>
                      {getAgentInitials(actionProspect.agentId)}
                    </div>
                    <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>{getAgentName(actionProspect.agentId)}</span>
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
              <Textarea
                placeholder="Je vous confie ce prospect pour le suivi..."
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
        title="Supprimer le prospect"
        eyebrow="Zone sensible"
        subtitle={actionProspect ? `${actionProspect.civility || ''} ${actionProspect.firstName} ${actionProspect.lastName}`.trim() : undefined}
        icon={Trash2}
        hue={DANGER_HUE}
        maxWidth="max-w-xl"
        centered
        footer={actionProspect ? (
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
        {actionProspect && (
          <div className="space-y-4">
            <ProspectSummaryCard prospect={actionProspect} hue={DANGER_HUE} isDark={isDark} isGerant={isGerant} />
            <div className={cn('rounded-2xl border p-3.5', isDark ? 'border-rose-400/25 bg-rose-500/10' : 'border-rose-200 bg-rose-50')}>
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={16} className={cn('mt-0.5 shrink-0', isDark ? 'text-rose-300' : 'text-rose-500')} />
                <div className={cn('space-y-1 text-xs', isDark ? 'text-rose-200/85' : 'text-rose-700')}>
                  <p className="font-semibold">Attention — action irréversible</p>
                  <ul className="list-inside list-disc space-y-0.5">
                    <li>Cette action est IRREVERSIBLE</li>
                    <li>Tous les documents associés seront supprimés</li>
                    <li>L'historique du prospect sera effacé</li>
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
                  { value: 'converti', label: 'Déjà converti en client' },
                  { value: 'retire', label: 'Prospect retiré' },
                  { value: 'autre', label: 'Autre' },
                ]}
              />
            </div>
          </div>
        )}
      </StageModal>

      <ProspectAssignModal
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

      {/* Add Prospect Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <ProspectFormModal onClose={() => { setIsModalOpen(false); setSelectedAgent(''); setDraftId(undefined); }} onSubmit={handleAddProspect} userId={userId} draftId={draftId} onDraftChange={() => setDraftChange(c => c + 1)} />
        )}
      </AnimatePresence>

      {/* Edit Prospect Modal */}
      <AnimatePresence>
        {editingProspect && (
          <ProspectFormModal
            prospect={editingProspect as unknown as Prospect}
            onClose={() => setEditingProspect(null)}
            onSubmit={(data) => {
              setEditingProspect(null);
              toast('success', 'Prospect modifié avec succès');
            }}
            userId={userId}
          />
        )}
      </AnimatePresence>

      <ProspectDraftSection
        userId={userId}
        draftChange={draftChange}
        shiftUp={pocketPresent}
        onResume={(draft) => {
          setDraftId(draft.id);
          setIsModalOpen(true);
        }}
      />

      <QualificationPocket
        onConvert={() => {}}
        refreshTrigger={qualifiedRefresh}
        onStatusReverted={() => {}}
        onPresenceChange={setPocketPresent}
      />
    </div>
  );
}
