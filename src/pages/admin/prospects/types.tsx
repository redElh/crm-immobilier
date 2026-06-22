import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import { Dialog } from '../../../components/ui/Dialog';
import {
  Search, Sliders, X, MoreVertical, User, Edit3, Repeat, Trash2,
  RefreshCw, Eye, Phone, Mail, MapPin, AlertTriangle, TrendingUp,
  Users, Shield, Calendar, ArrowUp, ArrowDown, CheckCircle, UserPlus,
  Clock, DollarSign, Home, MessageSquare, Plus
} from 'react-feather';
import { AGENTS, ORIGINS, allProspects, getProspectById } from './mockData';
import type { AdminProspect } from './mockData';
import type { Prospect } from '../../../types/prospect';
import { ProspectFormModal } from '../../../components/modules/prospects/ProspectFormModal';

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

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [originFilter, setOriginFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const [actionProspect, setActionProspect] = useState<AdminProspect | null>(null);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [reassignNote, setReassignNote] = useState('');
  const [sendNotification, setSendNotification] = useState(false);

  const filteredProspects = useMemo(() => {
    return allProspects
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
  }, [searchTerm, statusFilter, agentFilter, originFilter, typeFilter, dateRange]);

  const totalPages = Math.max(1, Math.ceil(filteredProspects.length / PAGE_SIZE));
  const paginatedProspects = filteredProspects.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const getAgentName = (agentId: string) => {
    if (!agentId) return 'Non assigne';
    const agent = AGENTS.find(a => a.id === agentId);
    return agent ? agent.name : 'Non assigne';
  };

  const getAgentInitials = (agentId: string) => {
    if (!agentId) return 'NA';
    const agent = AGENTS.find(a => a.id === agentId);
    return agent ? agent.initials : 'NA';
  };

  const getAgentColor = (agentId: string) => {
    if (!agentId) return 'bg-gray-400';
    const agent = AGENTS.find(a => a.id === agentId);
    return agent ? agent.color : 'bg-gray-400';
  };

  const kpiData = useMemo(() => {
    const total = allProspects.length;
    const nouveaux = allProspects.filter(p => p.status === 'Nouveau').length;
    const contactes = allProspects.filter(p => p.status === 'Contacté').length;
    const qualifies = allProspects.filter(p => p.status === 'Qualifié').length;
    const enAttente = allProspects.filter(p => p.status === 'En attente').length;
    const perdus = allProspects.filter(p => p.status === 'Perdu').length;
    const convertis = allProspects.filter(p => p.status === 'Converti').length;
    const tauxConv = total > 0 ? ((convertis / total) * 100).toFixed(1) : '0';
    return { total, nouveaux, contactes, qualifies, enAttente, perdus, convertis, tauxConv };
  }, []);

  const statsByAgent = useMemo(() => {
    const stats: Record<string, { total: number; nouveaux: number; contactes: number; qualifies: number; convertis: number }> = {};
    [...AGENTS.map(a => a.id), ''].forEach(id => { stats[id] = { total: 0, nouveaux: 0, contactes: 0, qualifies: 0, convertis: 0 }; });

    allProspects.forEach(p => {
      const id = p.agentId || '';
      if (!stats[id]) stats[id] = { total: 0, nouveaux: 0, contactes: 0, qualifies: 0, convertis: 0 };
      stats[id].total++;
      if (p.status === 'Nouveau') stats[id].nouveaux++;
      if (p.status === 'Contacté') stats[id].contactes++;
      if (p.status === 'Qualifié') stats[id].qualifies++;
      if (p.status === 'Converti') stats[id].convertis++;
    });
    return stats;
  }, []);

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

  const agentOptions = [
    { value: 'all', label: 'Tous les agents' },
    ...AGENTS.map(a => ({ value: a.id, label: a.name })),
    { value: '__none__', label: 'Non assignes' },
  ];

  const dateRangeOptions = [
    { value: 'all', label: 'Toutes dates' },
    { value: '7', label: '7 derniers jours' },
    { value: '30', label: '30 derniers jours' },
    { value: '90', label: '90 derniers jours' },
  ];

  const handleReassign = () => {
    setShowReassignDialog(false);
    setSelectedAgent('');
    setReassignNote('');
    setSendNotification(false);
  };

  const handleDelete = () => {
    if (deleteConfirm !== 'SUPPRIMER') return;
    setShowDeleteDialog(false);
    setDeleteConfirm('');
    setDeleteReason('');
  };

  const handleStatusChange = () => {
    setShowStatusDialog(false);
    setNewStatus('');
  };

  const handleAddProspect = (_data: Omit<Prospect, 'id' | 'createdAt' | 'updatedAt'>) => {
    setIsModalOpen(false);
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
        <Button variant="default" icon={<Plus size={14} />} onClick={() => setIsModalOpen(true)}>
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
                <Select options={agentOptions} value={agentFilter} onValueChange={(v) => setAgentFilter(v)} placeholder="Agent" />
                <Select options={originOptions} value={originFilter} onValueChange={setOriginFilter} placeholder="Origine" />
                <Select options={TYPE_OPTIONS} value={typeFilter} onValueChange={setTypeFilter} placeholder="Type d'interet" />
                <Select options={dateRangeOptions} value={dateRange} onValueChange={setDateRange} placeholder="Date de creation" />
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Statistics by Agent */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border/40 flex items-center gap-2">
          <Users size={14} className="text-text-secondary" />
          <span className="text-sm font-medium">Statistiques par agent</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Agent</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Total</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Nouveaux</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Contactes</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Qualifies</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Convertis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {AGENTS.map(agent => {
                const s = statsByAgent[agent.id] || { total: 0, nouveaux: 0, contactes: 0, qualifies: 0, convertis: 0 };
                return (
                  <tr key={agent.id} className="hover:bg-background/50 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full ${agent.color} flex items-center justify-center text-white text-[10px] font-bold`}>
                          {agent.initials}
                        </div>
                        <span className="text-sm font-medium">{agent.name}</span>
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
              <tr className="hover:bg-background/50 transition-colors">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-white text-[10px] font-bold">NA</div>
                    <span className="text-sm text-text-secondary">Non assignes</span>
                  </div>
                </td>
                <td className="text-center px-4 py-2.5 font-semibold">{statsByAgent['']?.total || 0}</td>
                <td className="text-center px-4 py-2.5">{statsByAgent['']?.nouveaux || 0}</td>
                <td className="text-center px-4 py-2.5">{statsByAgent['']?.contactes || 0}</td>
                <td className="text-center px-4 py-2.5">{statsByAgent['']?.qualifies || 0}</td>
                <td className="text-center px-4 py-2.5">{statsByAgent['']?.convertis || 0}</td>
              </tr>
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
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden lg:table-cell">Agent</th>
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
                          <button
                            className="text-sm font-medium truncate block max-w-[200px] hover:text-accent transition-colors text-left"
                            onClick={() => navigate(`/admin/prospects/${prospect.id}`)}
                          >
                            {prospect.civility} {prospect.firstName} {prospect.lastName}
                          </button>
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
                    <td className="px-4 py-3 text-center relative">
                      <div className="relative">
                        <button
                          className="p-1.5 rounded-lg hover:bg-background text-text-secondary hover:text-text transition-all opacity-0 group-hover:opacity-100"
                          onClick={() => setShowActionMenu(showActionMenu === prospect.id ? null : prospect.id)}
                        >
                          <MoreVertical size={14} />
                        </button>
                        {showActionMenu === prospect.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowActionMenu(null)} />
                            <div className="absolute right-0 top-full mt-1 w-56 bg-card rounded-xl border border-border/50 shadow-dropdown py-1 z-20">
                              <button
                                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-background transition-colors text-left"
                                onClick={() => { navigate(`/admin/prospects/${prospect.id}`); setShowActionMenu(null); }}
                              >
                                <Eye size={14} /> Voir la fiche complete
                              </button>
                              <button
                                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-background transition-colors text-left"
                                onClick={() => { setShowActionMenu(null); }}
                              >
                                <Edit3 size={14} /> Modifier
                              </button>
                              <div className="border-t border-border/40 my-1" />
                              <button
                                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-background transition-colors text-left"
                                onClick={() => { setActionProspect(prospect); setSelectedAgent(prospect.agentId); setShowReassignDialog(true); setShowActionMenu(null); }}
                              >
                                <Repeat size={14} /> Reaffecter a un agent
                              </button>
                              <button
                                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-background transition-colors text-left"
                                onClick={() => { setActionProspect(prospect); setNewStatus(prospect.status); setShowStatusDialog(true); setShowActionMenu(null); }}
                              >
                                <RefreshCw size={14} /> Changer le statut
                              </button>
                              <div className="border-t border-border/40 my-1" />
                              <button
                                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-error hover:bg-error/5 transition-colors text-left"
                                onClick={() => { setActionProspect(prospect); setDeleteConfirm(''); setDeleteReason(''); setShowDeleteDialog(true); setShowActionMenu(null); }}
                              >
                                <Trash2 size={14} /> Supprimer le prospect
                              </button>
                            </div>
                          </>
                        )}
                      </div>
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

      {/* Add Prospect Modal */}
      {isModalOpen && (
        <ProspectFormModal onClose={() => setIsModalOpen(false)} onSubmit={handleAddProspect} />
      )}

      {/* Reassign Dialog */}
      <Dialog isOpen={showReassignDialog} onClose={() => setShowReassignDialog(false)} title="Reaffecter un prospect" size="lg">
        {actionProspect && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-background border border-border/50">
              <p className="text-sm font-medium">{actionProspect.civility} {actionProspect.firstName} {actionProspect.lastName}</p>
              <p className="text-xs text-text-secondary">{actionProspect.email} · {actionProspect.phone}</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-1.5">Agent actuel :</p>
              <div className="flex items-center gap-2 text-sm">
                {actionProspect.agentId ? (
                  <>
                    <div className={`w-6 h-6 rounded-full ${getAgentColor(actionProspect.agentId)} flex items-center justify-center text-white text-[10px] font-bold`}>
                      {getAgentInitials(actionProspect.agentId)}
                    </div>
                    <span>{getAgentName(actionProspect.agentId)}</span>
                  </>
                ) : (
                  <span className="text-text-secondary italic">Non assigne</span>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nouvel agent responsable</label>
              <select
                className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
              >
                <option value="">Selectionner un agent</option>
                {AGENTS.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
                <option value="">Non assigne</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Note pour l'agent</label>
              <textarea
                className="w-full h-20 px-3 py-2 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none"
                placeholder="Je vous confie ce prospect pour le suivi..."
                value={reassignNote}
                onChange={(e) => setReassignNote(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-border text-accent focus:ring-accent/20"
                checked={sendNotification}
                onChange={(e) => setSendNotification(e.target.checked)}
              />
              Envoyer une notification a l'agent
            </label>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowReassignDialog(false)}>Annuler</Button>
              <Button variant="default" onClick={handleReassign} disabled={!selectedAgent}>Reaffecter</Button>
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
                <option value="">Selectionner un motif</option>
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

      {/* Change Status Dialog */}
      <Dialog isOpen={showStatusDialog} onClose={() => setShowStatusDialog(false)} title="Changer le statut" size="md">
        {actionProspect && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-background border border-border/50">
              <p className="text-sm font-medium">{actionProspect.civility} {actionProspect.firstName} {actionProspect.lastName}</p>
              <p className="text-xs text-text-secondary">{actionProspect.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Statut actuel</label>
              <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border ${STATUS_COLORS[actionProspect.status] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                {actionProspect.status}
              </span>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nouveau statut</label>
              <select
                className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                {STATUS_OPTIONS.filter(s => s.value !== 'all').map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowStatusDialog(false)}>Annuler</Button>
              <Button variant="default" onClick={handleStatusChange} disabled={newStatus === actionProspect.status}>
                Changer le statut
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
