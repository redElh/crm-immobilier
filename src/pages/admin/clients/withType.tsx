import { useNavigate, useParams } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import { BackLink } from '../../../components/ui/BackLink';
import { Dialog } from '../../../components/ui/Dialog';
import {
  Search, Sliders, X, MoreVertical, User, Edit3, Copy, Repeat, Trash2,
  RefreshCw, Eye, Phone, Mail, MapPin, CheckCircle, AlertTriangle,
  Users, Shield, Calendar, Star, Home, Briefcase, Sun, ChevronDown, Plus
} from 'react-feather';
import { AGENTS, CITIES, allClients, getClientsByType } from './mockData';
import type { AdminClient, MandatStatus } from './mockData';
import { AddClientButton } from '../../../components/modules/clients/AddClientButton';
import { BuyerFormModal } from '../../../components/modules/clients/BuyerFormModal';
import { SellerFormModal } from '../../../components/modules/clients/SellerFormModal';
import { BailleurFormModal } from '../../../components/modules/clients/BailleurFormModal';
import { LocataireFormModal } from '../../../components/modules/clients/LocataireFormModal';
import { VoyageurFormModal } from '../../../components/modules/clients/VoyageurFormModal';
import { ClientFormModal } from '../../../components/modules/clients/ClientFormModal';

const PAGE_SIZE = 6;

const STATUS_BY_TYPE: Record<string, string[]> = {
  acheteur: ['En qualification', 'En recherche', 'En negociation', 'En compromis', 'Vendu / Achete', 'Inactif', 'Perdu'],
  vendeur: ['En attente de signature', 'En mandat', 'En negociation', 'En compromis', 'Vendu', 'Inactif', 'Perdu'],
  bailleur: ['En attente de signature', 'En mandat', 'En location', 'Inactif', 'Perdu'],
  locataire: ['En recherche', 'En visite', 'En dossier', 'Bail signe', 'Installe', 'Inactif', 'Perdu'],
  voyageur: ['En recherche', 'Reservation en cours', 'Confirme', 'En sejour', 'Termine', 'Annule', 'Inactif'],
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
  'Actif': 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const typeLabels: Record<string, string> = {
  acheteur: 'Acheteurs', vendeur: 'Vendeurs', bailleur: 'Bailleurs', locataire: 'Locataires', voyageur: 'Voyageurs',
};

const mandateStatusBadge = (status: MandatStatus) => {
  const variants: Record<string, string> = {
    actif: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    expire: 'bg-red-50 text-red-700 border-red-200',
    en_attente: 'bg-amber-50 text-amber-700 border-amber-200',
    termine: 'bg-gray-50 text-gray-700 border-gray-200',
  };
  const labels: Record<string, string> = {
    actif: 'Actif', expire: 'Expire', en_attente: 'En attente', termine: 'Termine',
  };
  return { class: variants[status] || '', label: labels[status] || status };
};

export default function AdminClientsPageWithType() {
  const navigate = useNavigate();
  const { type } = useParams<{ type: string }>();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [mandatStatutFilter, setMandatStatutFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [dateRange, setDateRange] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const [actionClient, setActionClient] = useState<AdminClient | null>(null);
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

  const clientsForType = useMemo(() => type ? getClientsByType(type) : allClients, [type]);

  const typeLabel = typeLabels[type || ''] || '';

  const filteredClients = useMemo(() => {
    return clientsForType
      .filter(c =>
        !searchTerm ||
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .filter(c => statusFilter === 'all' || c.statutMetier === statusFilter)
      .filter(c => agentFilter === 'all' || (agentFilter === '__none__' ? !c.agentId : c.agentId === agentFilter))
      .filter(c => mandatStatutFilter === 'all' || c.mandateStatus === mandatStatutFilter)
      .filter(c => cityFilter === 'all' || c.secteur === cityFilter)
      .filter(c => !budgetMin || (c.budget || 0) >= Number(budgetMin))
      .filter(c => !budgetMax || (c.budget || 0) <= Number(budgetMax))
      .filter(c => {
        if (dateRange === 'all') return true;
        const created = new Date(c.createdAt);
        const now = new Date();
        const diff = now.getTime() - created.getTime();
        const days = diff / (1000 * 60 * 60 * 24);
        if (dateRange === '7') return days <= 7;
        if (dateRange === '30') return days <= 30;
        if (dateRange === '90') return days <= 90;
        return true;
      });
  }, [clientsForType, searchTerm, statusFilter, agentFilter, mandatStatutFilter, cityFilter, budgetMin, budgetMax, dateRange]);

  const totalPages = Math.max(1, Math.ceil(filteredClients.length / PAGE_SIZE));
  const paginatedClients = filteredClients.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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

  const statsByAgent = useMemo(() => {
    const stats: Record<string, { total: number; actifs: number; sousContrat: number; inactifs: number }> = {};
    [...AGENTS.map(a => a.id), ''].forEach(id => { stats[id] = { total: 0, actifs: 0, sousContrat: 0, inactifs: 0 }; });

    clientsForType.forEach(c => {
      const id = c.agentId || '';
      if (!stats[id]) stats[id] = { total: 0, actifs: 0, sousContrat: 0, inactifs: 0 };
      stats[id].total++;
      if (c.status === 'Actif' || c.statutMetier === 'En mandat' || c.statutMetier === 'En recherche' || c.statutMetier === 'En negociation') stats[id].actifs++;
      if (c.statutMetier === 'En compromis' || c.statutMetier === 'Vendu / Achete' || c.statutMetier === 'Vendu' || c.statutMetier === 'Bail signe' || c.statutMetier === 'Confirme') stats[id].sousContrat++;
      if (c.status === 'Inactif' || c.statutMetier === 'Inactif' || c.statutMetier === 'Perdu' || c.statutMetier === 'Annule' || c.statutMetier === 'Termine') stats[id].inactifs++;
    });
    return stats;
  }, [clientsForType]);

  const totalStats = useMemo(() => {
    const vals = Object.values(statsByAgent);
    return {
      total: vals.reduce((s, v) => s + v.total, 0),
      actifs: vals.reduce((s, v) => s + v.actifs, 0),
      sousContrat: vals.reduce((s, v) => s + v.sousContrat, 0),
      inactifs: vals.reduce((s, v) => s + v.inactifs, 0),
    };
  }, [statsByAgent]);

  const activeFiltersCount = [
    statusFilter !== 'all', agentFilter !== 'all', mandatStatutFilter !== 'all',
    cityFilter !== 'all', budgetMin !== '', budgetMax !== '', dateRange !== 'all',
  ].filter(Boolean).length;

  const resetFilters = () => {
    setStatusFilter('all'); setAgentFilter('all'); setMandatStatutFilter('all');
    setCityFilter('all'); setBudgetMin(''); setBudgetMax(''); setDateRange('all');
  };

  const statusOptions = useMemo(() => {
    const statuses = type ? (STATUS_BY_TYPE[type] || []) : [];
    return [
      { value: 'all', label: 'Tous les statuts' },
      ...statuses.map(v => ({ value: v, label: v })),
    ];
  }, [type]);

  const agentOptions = [
    { value: 'all', label: 'Tous les agents' },
    ...AGENTS.map(a => ({ value: a.id, label: a.name })),
    { value: '__none__', label: 'Non assignes' },
  ];

  const mandatStatusOptions = [
    { value: 'all', label: 'Tous les mandats' },
    { value: 'actif', label: 'Actif' },
    { value: 'expire', label: 'Expire' },
    { value: 'en_attente', label: 'En attente' },
    { value: 'termine', label: 'Termine' },
  ];

  const dateRangeOptions = [
    { value: 'all', label: 'Toutes dates' },
    { value: '7', label: '7 derniers jours' },
    { value: '30', label: '30 derniers jours' },
    { value: '90', label: '90 derniers jours' },
  ];

  const cityOptions = [
    { value: 'all', label: 'Tous les secteurs' },
    ...CITIES.map(c => ({ value: c, label: c })),
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

  const summaryStats = useMemo(() => {
    const total = clientsForType.length;
    const actifs = clientsForType.filter(c => c.status === 'Actif' || c.statutMetier === 'En mandat' || c.statutMetier === 'En recherche').length;
    const sousContrat = clientsForType.filter(c => c.statutMetier === 'En compromis' || c.statutMetier === 'Vendu / Achete' || c.statutMetier === 'Vendu' || c.statutMetier === 'Bail signe' || c.statutMetier === 'Confirme').length;
    const inactifs = clientsForType.filter(c => c.status === 'Inactif' || c.statutMetier === 'Inactif' || c.statutMetier === 'Perdu' || c.statutMetier === 'Annule').length;
    return { total, actifs, sousContrat, inactifs };
  }, [clientsForType]);

  const typeIconMap: Record<string, React.ReactNode> = {
    acheteur: <Search size={22} />,
    vendeur: <Home size={22} />,
    bailleur: <Briefcase size={22} />,
    locataire: <Users size={22} />,
    voyageur: <Sun size={22} />,
  };

  const typeColorMap: Record<string, string> = {
    acheteur: 'text-accent', vendeur: 'text-violet-600', bailleur: 'text-emerald-600',
    locataire: 'text-amber-600', voyageur: 'text-rose-600',
  };

  const typeBgMap: Record<string, string> = {
    acheteur: 'bg-accent-light', vendeur: 'bg-violet-50', bailleur: 'bg-emerald-50',
    locataire: 'bg-amber-50', voyageur: 'bg-rose-50',
  };

  const formatBudget = (p?: number) =>
    p ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(p) : '-';

  const clientTypeKey: Record<string, 'Acheteur' | 'Vendeur' | 'Bailleur' | 'Locataire' | 'Voyageur'> = {
    acheteur: 'Acheteur', vendeur: 'Vendeur', bailleur: 'Bailleur', locataire: 'Locataire', voyageur: 'Voyageur',
  };

  const handleAddClient = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <BackLink to="/admin/clients" className="mb-2" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${typeBgMap[type || ''] || 'bg-accent-light'} ${typeColorMap[type || ''] || 'text-accent'} flex-shrink-0 hidden sm:flex`}>
            {typeIconMap[type || ''] || <Users size={22} />}
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Clients - {typeLabel}</h1>
            <p className="text-sm text-text-secondary mt-1">
              {summaryStats.total} clients · {summaryStats.actifs} actifs · {summaryStats.sousContrat} sous contrat · {summaryStats.inactifs} inactifs
            </p>
          </div>
        </div>
        <AddClientButton onClick={() => setIsModalOpen(true)} />
      </div>

      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Rechercher par nom, telephone ou email..."
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
                <Select options={statusOptions} value={statusFilter} onValueChange={setStatusFilter} placeholder="Statut" />
                <Select options={agentOptions} value={agentFilter} onValueChange={(v) => setAgentFilter(v)} placeholder="Agent" />
                <Select options={mandatStatusOptions} value={mandatStatutFilter} onValueChange={setMandatStatutFilter} placeholder="Mandat" />
                <Select options={cityOptions} value={cityFilter} onValueChange={setCityFilter} placeholder="Secteur" />
                <Select options={dateRangeOptions} value={dateRange} onValueChange={setDateRange} placeholder="Date de creation" />
                <div className="flex items-center gap-2">
                  <input type="number" placeholder="Budget min" className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} />
                  <span className="text-text-secondary/40 text-xs">-</span>
                  <input type="number" placeholder="Budget max" className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} />
                </div>
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
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Clients actifs</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Actifs</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Sous contrat</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Inactifs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {AGENTS.map(agent => {
                const s = statsByAgent[agent.id] || { total: 0, actifs: 0, sousContrat: 0, inactifs: 0 };
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
                    <td className="text-center px-4 py-2.5">{s.actifs}</td>
                    <td className="text-center px-4 py-2.5">{s.sousContrat}</td>
                    <td className="text-center px-4 py-2.5">{s.inactifs}</td>
                  </tr>
                );
              })}
              {/* Non assignes */}
              <tr className="hover:bg-background/50 transition-colors">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-white text-[10px] font-bold">NA</div>
                    <span className="text-sm text-text-secondary">Non assignes</span>
                  </div>
                </td>
                <td className="text-center px-4 py-2.5 font-semibold">{statsByAgent['']?.total || 0}</td>
                <td className="text-center px-4 py-2.5">{statsByAgent['']?.actifs || 0}</td>
                <td className="text-center px-4 py-2.5">{statsByAgent['']?.sousContrat || 0}</td>
                <td className="text-center px-4 py-2.5">{statsByAgent['']?.inactifs || 0}</td>
              </tr>
              {/* Total row */}
              <tr className="bg-background/30 font-semibold">
                <td className="px-4 py-2.5 text-sm">TOTAL</td>
                <td className="text-center px-4 py-2.5">{totalStats.total}</td>
                <td className="text-center px-4 py-2.5">{totalStats.actifs}</td>
                <td className="text-center px-4 py-2.5">{totalStats.sousContrat}</td>
                <td className="text-center px-4 py-2.5">{totalStats.inactifs}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Client List */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          {filteredClients.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-background/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider w-10">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Client</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden md:table-cell">Contact</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden lg:table-cell">Agent</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden xl:table-cell">Mandat</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Statut</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Budget</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider w-12">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {paginatedClients.map((client, index) => {
                  const mandatBadge = mandateStatusBadge(client.mandateStatus);
                  return (
                    <tr key={client.id} className="hover:bg-background/50 transition-colors group">
                      <td className="px-4 py-3 text-xs text-text-secondary/50">
                        {(page - 1) * PAGE_SIZE + index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full ${getAgentColor(client.agentId)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                            {client.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <button
                              className="text-sm font-medium truncate block max-w-[200px] hover:text-accent transition-colors text-left"
                              onClick={() => navigate(`/admin/clients/${client.id}`)}
                            >
                              {client.name}
                            </button>
                            <div className="flex items-center gap-1.5 text-[11px] text-text-secondary/60 mt-0.5">
                              <MapPin size={10} />
                              <span className="truncate">{client.secteur || 'Non defini'}</span>
                              <span className="text-text-secondary/30">|</span>
                              <span>{client.type}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <Phone size={11} className="text-text-secondary/40 flex-shrink-0" />
                            <span className="text-xs text-text-secondary">{client.phone}</span>
                          </div>
                          {client.email && (
                            <div className="flex items-center gap-1.5">
                              <Mail size={11} className="text-text-secondary/40 flex-shrink-0" />
                              <span className="text-xs text-text-secondary truncate max-w-[160px]">{client.email}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {client.agentId ? (
                          <div className="flex items-center gap-1.5">
                            <div className={`w-5 h-5 rounded-full ${getAgentColor(client.agentId)} flex items-center justify-center text-white text-[8px] font-bold`}>
                              {getAgentInitials(client.agentId)}
                            </div>
                            <span className="text-xs">{getAgentName(client.agentId)}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-text-secondary/50 italic">Non assigne</span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-md border ${mandatBadge.class}`}>
                          {mandatBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-md border ${
                          STATUS_COLORS[client.statutMetier || client.status] || 'bg-gray-50 text-gray-500 border-gray-200'
                        }`}>
                          {client.statutMetier || client.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-semibold text-accent">
                          {formatBudget(client.budget)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center relative">
                        <div className="relative">
                          <button
                            className="p-1.5 rounded-lg hover:bg-background text-text-secondary hover:text-text transition-all opacity-0 group-hover:opacity-100"
                            onClick={() => setShowActionMenu(showActionMenu === client.id ? null : client.id)}
                          >
                            <MoreVertical size={14} />
                          </button>
                          {showActionMenu === client.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setShowActionMenu(null)} />
                              <div className="absolute right-0 top-full mt-1 w-56 bg-card rounded-xl border border-border/50 shadow-dropdown py-1 z-20">
                                <button
                                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-background transition-colors text-left"
                                  onClick={() => { navigate(`/admin/clients/${client.id}`); setShowActionMenu(null); }}
                                >
                                  <Eye size={14} /> Voir la fiche complete
                                </button>
                                <button
                                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-background transition-colors text-left"
                                  onClick={() => { setShowActionMenu(null); }}
                                >
                                  <Edit3 size={14} /> Modifier
                                </button>
                                <button
                                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-background transition-colors text-left"
                                  onClick={() => { setShowActionMenu(null); }}
                                >
                                  <Copy size={14} /> Dupliquer
                                </button>
                                <div className="border-t border-border/40 my-1" />
                                <button
                                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-background transition-colors text-left"
                                  onClick={() => { setActionClient(client); setSelectedAgent(client.agentId); setShowReassignDialog(true); setShowActionMenu(null); }}
                                >
                                  <Repeat size={14} /> Reaffecter a un agent
                                </button>
                                <button
                                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-background transition-colors text-left"
                                  onClick={() => { setActionClient(client); setNewStatus(client.statutMetier || client.status); setShowStatusDialog(true); setShowActionMenu(null); }}
                                >
                                  <RefreshCw size={14} /> Changer le statut
                                </button>
                                <div className="border-t border-border/40 my-1" />
                                <button
                                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-error hover:bg-error/5 transition-colors text-left"
                                  onClick={() => { setActionClient(client); setDeleteConfirm(''); setDeleteReason(''); setShowDeleteDialog(true); setShowActionMenu(null); }}
                                >
                                  <Trash2 size={14} /> Supprimer le client
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center">
              <div className="max-w-xs mx-auto">
                <Search size={32} className="text-text-secondary/20 mx-auto mb-3" />
                <p className="text-text-secondary font-medium">Aucun client trouve</p>
                <p className="text-xs text-text-secondary/60 mt-1">
                  Essayez de modifier vos filtres
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredClients.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 bg-background/20">
            <p className="text-xs text-text-secondary">
              Affichage {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filteredClients.length)} sur {filteredClients.length} clients
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
      <Dialog isOpen={showReassignDialog} onClose={() => setShowReassignDialog(false)} title="Reaffecter un client" size="lg">
        {actionClient && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-background border border-border/50">
              <p className="text-sm font-medium">{actionClient.name}</p>
              <p className="text-xs text-text-secondary">{actionClient.type} · {actionClient.phone}</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-1.5">Agent actuel :</p>
              <div className="flex items-center gap-2 text-sm">
                {actionClient.agentId ? (
                  <>
                    <div className={`w-6 h-6 rounded-full ${getAgentColor(actionClient.agentId)} flex items-center justify-center text-white text-[10px] font-bold`}>
                      {getAgentInitials(actionClient.agentId)}
                    </div>
                    <span>{getAgentName(actionClient.agentId)}</span>
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
                placeholder="Je vous confie ce client pour le suivi..."
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
      <Dialog isOpen={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} title="Supprimer le client" size="lg">
        {actionClient && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-background border border-border/50">
              <p className="text-sm font-medium">{actionClient.name}</p>
              <p className="text-xs text-text-secondary">{actionClient.type} · {actionClient.phone}</p>
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
                    <li>L'historique du client sera efface</li>
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
                <option value="retire">Client retire</option>
                <option value="decede">Client decede</option>
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
        {actionClient && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-background border border-border/50">
              <p className="text-sm font-medium">{actionClient.name}</p>
              <p className="text-xs text-text-secondary">{actionClient.type} · {actionClient.phone}</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Statut actuel</label>
              <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border ${
                STATUS_COLORS[actionClient.statutMetier || actionClient.status] || 'bg-gray-50 text-gray-500 border-gray-200'
              }`}>
                {actionClient.statutMetier || actionClient.status}
              </span>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nouveau statut</label>
              <select
                className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                {(STATUS_BY_TYPE[type || ''] || []).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowStatusDialog(false)}>Annuler</Button>
              <Button variant="default" onClick={handleStatusChange} disabled={newStatus === (actionClient.statutMetier || actionClient.status)}>
                Changer le statut
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Add Client Modal */}
      {isModalOpen && clientTypeKey[type || ''] === 'Acheteur' ? (
        <BuyerFormModal onClose={() => setIsModalOpen(false)} onSubmit={handleAddClient} />
      ) : isModalOpen && clientTypeKey[type || ''] === 'Vendeur' ? (
        <SellerFormModal onClose={() => setIsModalOpen(false)} onSubmit={handleAddClient} />
      ) : isModalOpen && clientTypeKey[type || ''] === 'Bailleur' ? (
        <BailleurFormModal onClose={() => setIsModalOpen(false)} onSubmit={handleAddClient} />
      ) : isModalOpen && clientTypeKey[type || ''] === 'Locataire' ? (
        <LocataireFormModal onClose={() => setIsModalOpen(false)} onSubmit={handleAddClient} />
      ) : isModalOpen && clientTypeKey[type || ''] === 'Voyageur' ? (
        <VoyageurFormModal onClose={() => setIsModalOpen(false)} onSubmit={handleAddClient} />
      ) : isModalOpen ? (
        <ClientFormModal onClose={() => setIsModalOpen(false)} onSubmit={handleAddClient} clientType={clientTypeKey[type || ''] || 'Acheteur'} />
      ) : null}
    </div>
  );
}
