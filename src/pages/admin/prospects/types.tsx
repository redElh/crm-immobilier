import { useNavigate, useParams } from 'react-router-dom';
import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import { Dialog } from '../../../components/ui/Dialog';
import {
  Search, Sliders, X, MoreVertical, User, Edit3, Repeat, Trash2, Copy, ChevronLeft,
  RefreshCw, Eye, Phone, Mail, MapPin, AlertTriangle, TrendingUp,
  Users, Shield, Calendar, ArrowUp, ArrowDown, CheckCircle, UserPlus, UserX,
  Clock, DollarSign, Home, MessageSquare, Plus
} from 'react-feather';
import { ORIGINS } from './mockData';
import type { AdminProspect } from './mockData';
import type { Prospect } from '../../../types/prospect';
import { ProspectFormModal } from '../../../components/modules/prospects/ProspectFormModal';
import { ProspectDraftSection } from '../../../components/modules/prospects/ProspectDraftSection';
import { QualificationPocket } from '../../../components/modules/prospects/QualificationPocket';
import { api } from '../../../services/api';
import { fetchProspects, deleteProspect as apiDeleteProspect, duplicateProspect } from '../../../services/prospectService';
import { useToast } from '../../../components/ui/Toast';
import { useNotifications } from '../../../contexts/NotificationContext';

const PAGE_SIZE = 8;

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'Nouveau', label: 'Nouveau' },
  { value: 'Contacté', label: 'Contacte' },
  { value: 'Qualifié', label: 'Qualifie' },
  { value: 'En attente', label: 'En attente' },
  { value: 'Perdu', label: 'Perdu' },
  { value: 'Converti', label: 'Converti' },
];

const STATUS_COLORS: Record<string, string> = {
  Nouveau: 'bg-blue-50 text-blue-700 border-blue-200',
  'Contacté': 'bg-amber-50 text-amber-700 border-amber-200',
  'Qualifié': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'En attente': 'bg-orange-50 text-orange-700 border-orange-200',
  Perdu: 'bg-red-50 text-red-700 border-red-200',
  Converti: 'bg-violet-50 text-violet-700 border-violet-200',
};

const TYPE_OPTIONS = [
  { value: 'all', label: 'Tous les types' },
  { value: 'Acheter', label: 'Acheter' },
  { value: 'Louer', label: 'Louer' },
  { value: 'Vendre', label: 'Vendre' },
  { value: 'Faire estimer', label: 'Faire estimer' },
];

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
  const [prospects, setProspects] = useState<AdminProspect[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProspect, setEditingProspect] = useState<AdminProspect | null>(null);
  const [draftCount, setDraftCount] = useState(0);
  const [qualifiedRefresh, setQualifiedRefresh] = useState(0);

  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [menuTarget, setMenuTarget] = useState<{ prospect: AdminProspect; bounds: DOMRect } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignStep, setAssignStep] = useState<'choose' | 'agent' | 'admin'>('choose');
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const userId = adminId || 'admin';

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
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuTarget(null);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Prospects - Vue d'ensemble</h1>
          <p className="text-sm text-text-secondary mt-1">
            {kpiData.total} prospects · {kpiData.nouveaux} nouveaux · {kpiData.qualifies} qualifies · {kpiData.convertis} convertis
          </p>
        </div>
        <Button variant="default" icon={<Plus size={14} />} onClick={() => { setShowAssignModal(true); setAssignStep('choose'); }}>
          Nouveau prospect
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-xl border border-border/50 shadow-card p-4 hover:shadow-card-hover transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">{kpi.label}</p>
                <div className={`p-2 rounded-lg ${kpi.bg}`}>
                  <Icon size={14} className={kpi.color} />
                </div>
              </div>
              <p className="text-2xl font-bold">{kpi.value}</p>
              <div className={`flex items-center gap-1 mt-1 text-xs ${kpi.up ? 'text-emerald-600' : 'text-red-500'}`}>
                {kpi.up ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                <span>{kpi.evolution}</span>
                <span className="text-text-secondary/50 ml-1">vs mois dernier</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Rechercher par nom, email ou telephone..."
            className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button
            className={`btn-secondary h-9 px-3 flex items-center gap-2 text-sm rounded-lg border border-border bg-card hover:bg-background transition-all ${showFilters || activeFiltersCount > 0 ? 'ring-2 ring-accent/20 border-accent' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Sliders size={14} />
            Filtres
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Filtres avances</span>
                <button className="btn-ghost text-xs flex items-center gap-1" onClick={resetFilters}>
                  <X size={12} /> Reinitialiser
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                <Select options={STATUS_OPTIONS} value={statusFilter} onValueChange={setStatusFilter} placeholder="Statut" />
                <Select options={agentOptions} value={agentFilter} onValueChange={(v) => setAgentFilter(v)} placeholder="Responsable" />
                <Select options={originOptions} value={originFilter} onValueChange={setOriginFilter} placeholder="Origine" />
                <Select options={TYPE_OPTIONS} value={typeFilter} onValueChange={setTypeFilter} placeholder="Type d'interet" />
                <Select options={dateRangeOptions} value={dateRange} onValueChange={setDateRange} placeholder="Date de creation" />
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Statistics */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border/40 flex items-center gap-2">
          <Users size={14} className="text-text-secondary" />
          <span className="text-sm font-medium">Statistiques</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Intervenant</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Total</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Nouveaux</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Contactes</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Qualifies</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Convertis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {users.filter((u: any) => u.status !== 'supprimé').map((user: any) => {
                const uid = String(user.id);
                const s = statsByAgent[uid] || { total: 0, nouveaux: 0, contactes: 0, qualifies: 0, convertis: 0 };
                const person = findPerson(uid);
                return (
                  <tr key={uid} className="hover:bg-background/50 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full ${person?.color || 'bg-gray-400'} flex items-center justify-center text-white text-[10px] font-bold`}>
                          {person?.initials || uid.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium">{person?.name || uid}</span>
                        {(() => {
                          const badge = getRoleBadge(person);
                          return badge ? (
                            <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold rounded-full uppercase tracking-wider ${badge.cls}`}>
                              {badge.label}
                            </span>
                          ) : null;
                        })()}
                      </div>
                    </td>
                    <td className="text-center px-4 py-2.5 font-semibold">{s.total}</td>
                    <td className="text-center px-4 py-2.5">{s.nouveaux}</td>
                    <td className="text-center px-4 py-2.5">{s.contactes}</td>
                    <td className="text-center px-4 py-2.5">{s.qualifies}</td>
                    <td className="text-center px-4 py-2.5">{s.convertis}</td>
                  </tr>
                );
              })}
              {statsByAgent[''] && (
                <tr className="hover:bg-background/50 transition-colors">
                  <td className="px-4 py-2.5">
                    <span className="text-sm text-text-secondary/50 italic">Non assigne</span>
                  </td>
                  <td className="text-center px-4 py-2.5 font-semibold">{statsByAgent[''].total}</td>
                  <td className="text-center px-4 py-2.5">{statsByAgent[''].nouveaux}</td>
                  <td className="text-center px-4 py-2.5">{statsByAgent[''].contactes}</td>
                  <td className="text-center px-4 py-2.5">{statsByAgent[''].qualifies}</td>
                  <td className="text-center px-4 py-2.5">{statsByAgent[''].convertis}</td>
                </tr>
              )}
              <tr className="bg-background/30 font-semibold">
                <td className="px-4 py-2.5 text-sm">TOTAL</td>
                <td className="text-center px-4 py-2.5">{totalStats.total}</td>
                <td className="text-center px-4 py-2.5">{totalStats.nouveaux}</td>
                <td className="text-center px-4 py-2.5">{totalStats.contactes}</td>
                <td className="text-center px-4 py-2.5">{totalStats.qualifies}</td>
                <td className="text-center px-4 py-2.5">{totalStats.convertis}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Prospects Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          {filteredProspects.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-background/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider w-10">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Prospect</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden md:table-cell">Contact</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden lg:table-cell">Géré par</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden xl:table-cell">Origine</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Statut</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider w-12">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {paginatedProspects.map((prospect, index) => (
                  <tr key={prospect.id} className="hover:bg-background/50 transition-colors group">
                    <td className="px-4 py-3 text-xs text-text-secondary/50">
                      {(page - 1) * PAGE_SIZE + index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full ${getAgentColor(prospect.agentId)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                          {prospect.firstName[0]}{prospect.lastName[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <button
                              className="text-sm font-medium truncate max-w-[200px] hover:text-accent transition-colors text-left"
                              onClick={() => navigate(`/admin/${adminId}/prospects/${prospect.id}`)}
                            >
                              {prospect.civility} {prospect.firstName} {prospect.lastName}
                            </button>
                            {prospect.originalProspectId ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 text-[8px] font-semibold rounded-full bg-orange-100 text-orange-700 border border-orange-200 flex-shrink-0">
                                Copie
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 text-[8px] font-semibold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex-shrink-0">
                                Original
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-text-secondary/60 mt-0.5">
                            <Calendar size={10} />
                            <span className="truncat">{new Date(prospect.createdAt).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <Phone size={11} className="text-text-secondary/40 flex-shrink-0" />
                          <span className="text-xs text-text-secondary">{prospect.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Mail size={11} className="text-text-secondary/40 flex-shrink-0" />
                          <span className="text-xs text-text-secondary truncate max-w-[160px]">{prospect.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {prospect.agentId ? (
                        <div className="flex items-center gap-1.5">
                          <div className={`w-5 h-5 rounded-full ${getAgentColor(prospect.agentId)} flex items-center justify-center text-white text-[8px] font-bold`}>
                            {getAgentInitials(prospect.agentId)}
                          </div>
                          <span className="text-xs">{getAgentName(prospect.agentId)}</span>
                          {(() => {
                            const badge = getRoleBadge(findPerson(prospect.agentId));
                            return badge ? (
                              <span className={`inline-flex items-center px-1 py-0.5 text-[8px] font-semibold rounded-full uppercase tracking-wider ${badge.cls}`}>
                                {badge.label}
                              </span>
                            ) : null;
                          })()}
                        </div>
                      ) : (
                        <span className="text-xs text-text-secondary/50 italic">Non assigne</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-xs text-text-secondary">{prospect.origin}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium">{prospect.type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-md border ${STATUS_COLORS[prospect.status] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                        {prospect.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        className="p-1.5 rounded-lg hover:bg-background text-text-secondary hover:text-text transition-all opacity-0 group-hover:opacity-100"
                        onClick={(e) => { e.stopPropagation(); setMenuTarget(menuTarget?.prospect.id === prospect.id ? null : { prospect, bounds: e.currentTarget.getBoundingClientRect() }); }}
                      >
                        <MoreVertical size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center">
              <div className="max-w-xs mx-auto">
                <Search size={32} className="text-text-secondary/20 mx-auto mb-3" />
                <p className="text-text-secondary font-medium">Aucun prospect trouve</p>
                <p className="text-xs text-text-secondary/60 mt-1">
                  Essayez de modifier vos filtres
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredProspects.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 bg-background/20">
            <p className="text-xs text-text-secondary">
              Affichage {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filteredProspects.length)} sur {filteredProspects.length} prospects
            </p>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                    p === page
                      ? 'bg-accent text-white'
                      : 'text-text-secondary hover:text-text hover:bg-background'
                  }`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Reassign Dialog */}
      <Dialog isOpen={showReassignDialog} onClose={() => setShowReassignDialog(false)} title="Réaffecter un prospect" size="lg">
        {actionProspect && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-background border border-border/50">
              <p className="text-sm font-medium">{actionProspect.civility} {actionProspect.firstName} {actionProspect.lastName}</p>
              <p className="text-xs text-text-secondary">{actionProspect.email} · {actionProspect.phone}</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-1.5">Responsable actuel :</p>
              <div className="flex items-center gap-2 text-sm">
                {actionProspect.agentId ? (
                  <>
                    <div className={`w-6 h-6 rounded-full ${getAgentColor(actionProspect.agentId)} flex items-center justify-center text-white text-[10px] font-bold`}>
                      {getAgentInitials(actionProspect.agentId)}
                    </div>
                    <span>{getAgentName(actionProspect.agentId)}</span>
                  </>
                ) : (
                  <span className="text-text-secondary italic">Non assigné</span>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nouveau responsable</label>
              <Select
                placeholder="Sélectionner un responsable"
                value={selectedAgent}
                onValueChange={(v) => setSelectedAgent(v)}
                options={[
                  { value: '', label: 'Non assigné' },
                  ...users.filter((u: any) => u.status !== 'supprimé').map((u: any) => ({
                    value: String(u.id),
                    label: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
                  })),
                ]}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Note pour le responsable</label>
              <textarea
                className="w-full h-20 px-3 py-2 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none"
                placeholder="Je vous confie ce prospect pour le suivi..."
                value={reassignNote}
                onChange={(e) => setReassignNote(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowReassignDialog(false)}>Annuler</Button>
              <Button variant="default" onClick={handleReassign} disabled={!selectedAgent}>Réaffecter</Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog isOpen={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} title="Supprimer le prospect" size="lg">
        {actionProspect && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-background border border-border/50">
              <p className="text-sm font-medium">{actionProspect.civility} {actionProspect.firstName} {actionProspect.lastName}</p>
              <p className="text-xs text-text-secondary">{actionProspect.email} · {actionProspect.phone}</p>
            </div>
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-red-700 space-y-1">
                  <p className="font-medium">Attention :</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Cette action est IRREVERSIBLE</li>
                    <li>Tous les documents associes seront supprimes</li>
                    <li>L'historique du prospect sera efface</li>
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
                className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
              >
                <option value="">Sélectionner un motif</option>
                <option value="doublon">Erreur de saisie - Doublon</option>
                <option value="converti">Deja converti en client</option>
                <option value="retire">Prospect retire</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>Annuler</Button>
              <Button variant="danger" onClick={handleDelete} disabled={deleteConfirm !== 'SUPPRIMER'}>
                Confirmer la suppression
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Floating Action Menu */}
      <AnimatePresence>
        {menuTarget && (() => {
          const { prospect, bounds } = menuTarget;
          const viewportH = window.innerHeight;
          const spaceBelow = viewportH - bounds.bottom;
          const menuH = 280;
          const top = spaceBelow >= menuH ? bounds.bottom + 4 : bounds.top - menuH - 4;
          const right = window.innerWidth - bounds.right;
          return (
            <>
              <motion.div
                className="fixed inset-0 z-40"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setMenuTarget(null)}
              />
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.12 }}
                style={{ position: 'fixed', top, right }}
                className="w-56 bg-card rounded-xl border border-border/50 shadow-dropdown py-1 z-50"
              >
                <button
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-background transition-colors text-left"
                  onClick={() => { setMenuTarget(null); navigate(`/admin/${adminId}/prospects/${prospect.id}`); }}
                >
                  <Eye size={14} /> Voir la fiche complète
                </button>
                <button
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-background transition-colors text-left"
                  onClick={() => { setMenuTarget(null); setEditingProspect(prospect); }}
                >
                  <Edit3 size={14} /> Modifier
                </button>
                <button
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-background transition-colors text-left"
                  onClick={async () => {
                    setMenuTarget(null);
                    try {
                      const duplicated = await duplicateProspect(String(prospect.id));
                      setProspects(prev => [{ ...duplicated, agentId: String(duplicated.agentId || ''), mandateStatus: 'actif' } as AdminProspect, ...prev]);
                      toast('success', `${prospect.firstName} ${prospect.lastName} dupliqué avec succès`);
                    } catch (e: any) {
                      toast('error', e.message || 'Erreur lors de la duplication');
                    }
                  }}
                >
                  <Copy size={14} /> Dupliquer
                </button>
                <div className="border-t border-border/40 my-1" />
                <button
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-background transition-colors text-left"
                  onClick={() => { setMenuTarget(null); setActionProspect(prospect); setSelectedAgent(String(prospect.agentId || '')); setShowReassignDialog(true); }}
                >
                  <Repeat size={14} /> Réaffecter à un intervenant
                </button>
                <div className="border-t border-border/40 my-1" />
                <button
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-error hover:bg-error/5 transition-colors text-left"
                  onClick={() => { setMenuTarget(null); setActionProspect(prospect); setDeleteConfirm(''); setDeleteReason(''); setShowDeleteDialog(true); }}
                >
                  <Trash2 size={14} /> Supprimer
                </button>
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>

      {/* Attribution Dialog */}
      <Dialog isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Attribution du prospect" size="sm">
        {assignStep === 'choose' ? (
          <div className="space-y-3">
            <p className="text-sm text-text-secondary mb-4">Souhaitez-vous confier ce prospect à un agent, un admin ou le gérer vous-même ?</p>
            <button
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border/40 bg-background/50 hover:bg-background hover:border-accent/30 transition-all text-left group"
              onClick={() => setAssignStep('agent')}
            >
              <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-500 group-hover:scale-105 transition-transform">
                <Users size={16} />
              </div>
              <div>
                <div className="text-sm font-medium text-text">Confier à un agent</div>
                <div className="text-xs text-text-secondary">Le prospect sera rattaché à un agent immobilier</div>
              </div>
            </button>
            <button
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border/40 bg-background/50 hover:bg-background hover:border-accent/30 transition-all text-left group"
              onClick={() => setAssignStep('admin')}
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:scale-105 transition-transform">
                <Shield size={16} />
              </div>
              <div>
                <div className="text-sm font-medium text-text">Confier à un admin</div>
                <div className="text-xs text-text-secondary">Le prospect sera géré par un autre administrateur</div>
              </div>
            </button>
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/30" /></div>
              <div className="relative flex justify-center"><span className="bg-card px-3 text-xs text-text-secondary/50">ou</span></div>
            </div>
            <button
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-accent/20 bg-accent/5 hover:bg-accent/10 transition-all text-left group"
              onClick={() => { setShowAssignModal(false); setSelectedAgent(currentUser ? String(currentUser.id) : ''); setIsModalOpen(true); }}
            >
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent group-hover:scale-105 transition-transform">
                <User size={16} />
              </div>
              <div>
                <div className="text-sm font-medium text-accent">Je gère moi-même</div>
                <div className="text-xs text-text-secondary">Ajouter le prospect directement en tant qu'admin</div>
              </div>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              className="text-xs text-text-secondary hover:text-text flex items-center gap-1 transition-colors mb-2"
              onClick={() => setAssignStep('choose')}
            >
              <ChevronLeft size={14} />
              Retour
            </button>
            <p className="text-sm text-text-secondary mb-1">
              {assignStep === 'agent' ? 'Sélectionnez un agent' : 'Sélectionnez un admin'}
            </p>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {(assignStep === 'agent'
                ? users.filter((u: any) => u.role === 'agent').map((u: any) => ({
                    id: String(u.id), name: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
                    initials: `${(u.first_name || '')[0]}${(u.last_name || '')[0]}`.toUpperCase() || '?',
                    color: COLORS[Math.abs(Number(u.id) || u.id.length) % COLORS.length],
                  }))
                : users.filter((u: any) => (u.role === 'admin' || u.role === 'gerant') && String(u.id) !== String(currentUser?.id)).map((u: any) => ({
                    id: String(u.id), name: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
                    initials: `${(u.first_name || '')[0]}${(u.last_name || '')[0]}`.toUpperCase() || '?',
                    color: 'bg-indigo-500',
                  }))
              ).map((person) => (
                <button
                  key={person.id}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border border-border/30 hover:border-accent/30 hover:bg-background/50 transition-all text-left group"
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedAgent(person.id);
                    setIsModalOpen(true);
                  }}
                >
                  <div className={`w-8 h-8 rounded-full ${person.color} text-white text-xs font-semibold flex items-center justify-center`}>
                    {person.initials}
                  </div>
                  <span className="text-sm font-medium text-text">{person.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </Dialog>

      {/* Add Prospect Modal */}
      {isModalOpen && (
        <ProspectFormModal onClose={() => { setIsModalOpen(false); setSelectedAgent(''); setDraftId(undefined); }} onSubmit={handleAddProspect} userId={userId} draftId={draftId} onDraftChange={() => setDraftChange(c => c + 1)} />
      )}

      {/* Edit Prospect Modal */}
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

      <ProspectDraftSection
        userId={userId}
        draftChange={draftChange}
        onCountChange={setDraftCount}
        onResume={(draft) => {
          setDraftId(draft.id);
          setIsModalOpen(true);
        }}
      />

      <QualificationPocket
        onConvert={() => {}}
        refreshTrigger={qualifiedRefresh}
        onStatusReverted={() => {}}
        offset={draftCount > 0}
      />
    </div>
  );
}
