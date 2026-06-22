import { useNavigate, useParams } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import { BackLink } from '../../../components/ui/BackLink';
import { Dialog } from '../../../components/ui/Dialog';
import type { Property } from '../../../types/property';
import {
  PROPERTY_TYPE_LABELS, TRANSACTION_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS
} from '../../../types/property';
import {
  Search, Plus, Sliders, X, ChevronDown, MoreVertical, User,
  Edit3, Copy, Repeat, Trash2, RefreshCw, Eye, Phone, Mail,
  MapPin, Maximize2, Grid, CheckCircle, AlertTriangle, Hash,
  FileText, ArrowUp, ArrowDown, Users, Shield, Calendar, Home
} from 'react-feather';
import { AGENTS, CITIES, allProperties, getPropertiesByType } from './mockData';
import type { AdminProperty, MandatStatus } from './mockData';

const PAGE_SIZE = 6;

const formatPrice = (p: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(p);

export default function AdminPropertiesPageWithType() {
  const navigate = useNavigate();
  const { type } = useParams<{ type: string }>();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [mandatStatutFilter, setMandatStatutFilter] = useState<string>('all');
  const [mandatTypeFilter, setMandatTypeFilter] = useState<string>('all');
  const [transactionFilter, setTransactionFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [surfaceMin, setSurfaceMin] = useState('');
  const [surfaceMax, setSurfaceMax] = useState('');
  const [dateRange, setDateRange] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const [actionProperty, setActionProperty] = useState<AdminProperty | null>(null);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [reassignNote, setReassignNote] = useState('');
  const [sendNotification, setSendNotification] = useState(false);

  const propertiesForType = useMemo(() => type ? getPropertiesByType(type) : allProperties, [type]);

  const typeLabel = ({ residential: 'Residentiel', commercial: 'Commercial', land: 'Terrains', vacation: 'Vacances', luxury: 'Luxe' } as Record<string, string>)[type || ''] || '';

  const STATUS_BY_TYPE: Record<string, string[]> = {
    residential: ['for_sale', 'for_rent', 'mandate_pending', 'negotiation', 'under_compromise', 'signing', 'sold', 'rented', 'withdrawn'],
    commercial: ['for_sale_or_rent', 'negotiation', 'under_promise', 'sold_or_rented', 'withdrawn'],
    land: ['for_sale', 'under_promise', 'urbanism', 'sold', 'withdrawn'],
    vacation: ['available', 'option', 'reserved', 'occupied', 'unavailable', 'withdrawn'],
    luxury: ['for_sale_or_rent', 'confidential', 'negotiation', 'sold_or_rented', 'withdrawn'],
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
      .filter(p => mandatStatutFilter === 'all' || p.mandateStatus === mandatStatutFilter)
      .filter(p => mandatTypeFilter === 'all' || p.mandateType === mandatTypeFilter)
      .filter(p => transactionFilter === 'all' || p.transactionType === transactionFilter)
      .filter(p => cityFilter === 'all' || p.city === cityFilter)
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
  }, [propertiesForType, searchTerm, statusFilter, agentFilter, mandatStatutFilter, mandatTypeFilter, transactionFilter, cityFilter, priceMin, priceMax, surfaceMin, surfaceMax, dateRange]);

  const totalPages = Math.max(1, Math.ceil(filteredProperties.length / PAGE_SIZE));
  const paginatedProperties = filteredProperties.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
    const stats: Record<string, { total: number; enVente: number; enLocation: number; vendus: number }> = {};
    [...AGENTS.map(a => a.id), ''].forEach(id => { stats[id] = { total: 0, enVente: 0, enLocation: 0, vendus: 0 }; });

    propertiesForType.forEach(p => {
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

  const activeFiltersCount = [
    statusFilter !== 'all',
    agentFilter !== 'all',
    mandatStatutFilter !== 'all',
    mandatTypeFilter !== 'all',
    transactionFilter !== 'all',
    cityFilter !== 'all',
    priceMin !== '',
    priceMax !== '',
    surfaceMin !== '',
    surfaceMax !== '',
    dateRange !== 'all',
  ].filter(Boolean).length;

  const resetFilters = () => {
    setStatusFilter('all'); setAgentFilter('all'); setMandatStatutFilter('all');
    setMandatTypeFilter('all'); setTransactionFilter('all'); setCityFilter('all');
    setPriceMin(''); setPriceMax(''); setSurfaceMin(''); setSurfaceMax(''); setDateRange('all');
  };

  const statusOptions = useMemo(() => {
    const statuses = type ? (STATUS_BY_TYPE[type] || Object.keys(STATUS_LABELS)) : Object.keys(STATUS_LABELS);
    return [
      { value: 'all', label: 'Tous les statuts' },
      ...statuses.map(v => ({ value: v, label: STATUS_LABELS[v] || v })),
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
    ...CITIES.map(c => ({ value: c, label: c })),
  ];

  const dateRangeOptions = [
    { value: 'all', label: 'Toutes dates' },
    { value: '7', label: '7 derniers jours' },
    { value: '30', label: '30 derniers jours' },
    { value: '90', label: '90 derniers jours' },
  ];

  const mandateStatusBadge = (status: MandatStatus) => {
    const variants: Record<string, string> = {
      actif: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      expire: 'bg-red-50 text-red-700 border-red-200',
      en_attente: 'bg-amber-50 text-amber-700 border-amber-200',
      termine: 'bg-gray-50 text-gray-700 border-gray-200',
    };
    const labels: Record<string, string> = {
      actif: 'Actif',
      expire: 'Expire',
      en_attente: 'En attente',
      termine: 'Termine',
    };
    return { class: variants[status] || '', label: labels[status] || status };
  };

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
    const total = propertiesForType.length;
    const enVente = propertiesForType.filter(p => p.transactionType === 'vente').length;
    const enLocation = propertiesForType.filter(p => p.transactionType === 'location_ld' || p.transactionType === 'location_saisonniere').length;
    const vendus = propertiesForType.filter(p => p.status === 'sold' || p.status === 'rented' || p.status === 'sold_or_rented').length;
    return { total, enVente, enLocation, vendus };
  }, [propertiesForType]);

  return (
    <div className="space-y-6 animate-fade-in">
      <BackLink to="/admin/properties" className="mb-2" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Biens - {typeLabel}</h1>
          <p className="text-sm text-text-secondary mt-1">
            {summaryStats.total} biens · {summaryStats.enVente} en vente · {summaryStats.enLocation} en location · {summaryStats.vendus} vendus ce mois
          </p>
        </div>
        <Button variant="default" icon={<Plus size={14} />} onClick={() => navigate(`/admin/properties/add${type ? `?type=${type}` : ''}`)}>
          Ajouter un bien
        </Button>
      </div>

      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Rechercher par nom, localisation ou reference..."
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
                <Select options={statusOptions} value={statusFilter} onValueChange={setStatusFilter} />
                <Select options={agentOptions} value={agentFilter === '__none__' ? '__none__' : agentFilter} onValueChange={(v) => setAgentFilter(v === '__none__' ? '__none__' : v)} />
                <Select options={mandatStatusOptions} value={mandatStatutFilter} onValueChange={setMandatStatutFilter} />
                <Select options={mandatTypeOptions} value={mandatTypeFilter} onValueChange={setMandatTypeFilter} />
                <Select options={transactionOptions} value={transactionFilter} onValueChange={setTransactionFilter} />
                <Select options={cityOptions} value={cityFilter} onValueChange={setCityFilter} />
                <Select options={dateRangeOptions} value={dateRange} onValueChange={setDateRange} />
                <div className="flex items-center gap-2">
                  <input type="number" placeholder="Prix min" className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} />
                  <span className="text-text-secondary/40 text-xs">-</span>
                  <input type="number" placeholder="Prix max" className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" placeholder="Surface min" className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all" value={surfaceMin} onChange={(e) => setSurfaceMin(e.target.value)} />
                  <span className="text-text-secondary/40 text-xs">-</span>
                  <input type="number" placeholder="Surface max" className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all" value={surfaceMax} onChange={(e) => setSurfaceMax(e.target.value)} />
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
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Biens actifs</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">En vente</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">En location</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Ventes ce mois</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {AGENTS.map(agent => {
                const s = statsByAgent[agent.id] || { total: 0, enVente: 0, enLocation: 0, vendus: 0 };
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
                    <td className="text-center px-4 py-2.5">{s.enVente}</td>
                    <td className="text-center px-4 py-2.5">{s.enLocation}</td>
                    <td className="text-center px-4 py-2.5">{s.vendus}</td>
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
                <td className="text-center px-4 py-2.5">{statsByAgent['']?.enVente || 0}</td>
                <td className="text-center px-4 py-2.5">{statsByAgent['']?.enLocation || 0}</td>
                <td className="text-center px-4 py-2.5">{statsByAgent['']?.vendus || 0}</td>
              </tr>
              {/* Total row */}
              <tr className="bg-background/30 font-semibold">
                <td className="px-4 py-2.5 text-sm">TOTAL</td>
                <td className="text-center px-4 py-2.5">{totalStats.total}</td>
                <td className="text-center px-4 py-2.5">{totalStats.enVente}</td>
                <td className="text-center px-4 py-2.5">{totalStats.enLocation}</td>
                <td className="text-center px-4 py-2.5">{totalStats.vendus}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Property List */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          {filteredProperties.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-background/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider w-10">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Reference</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Bien</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden md:table-cell">Proprietaire</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden lg:table-cell">Agent</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden xl:table-cell">Mandat</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Statut</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Prix</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider w-12">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {paginatedProperties.map((property, index) => {
                  const mandatBadge = mandateStatusBadge(property.mandateStatus);
                  return (
                    <tr key={property.id} className="hover:bg-background/50 transition-colors group">
                      <td className="px-4 py-3 text-xs text-text-secondary/50">
                        {(page - 1) * PAGE_SIZE + index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-text-secondary/60">{property.reference}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-light to-background flex-shrink-0 flex items-center justify-center overflow-hidden">
                            {property.images?.[0] ? (
                              <img src={property.images[0]} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Home size={14} className="text-text-secondary/30" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <button
                              className="text-sm font-medium truncate block max-w-[200px] hover:text-accent transition-colors"
                              onClick={() => navigate(`/admin/properties/${property.id}`)}
                            >
                              {property.title}
                            </button>
                            <div className="flex items-center gap-1.5 text-[11px] text-text-secondary/60 mt-0.5">
                              <MapPin size={10} />
                              <span className="truncate">{property.city}</span>
                              <span className="text-text-secondary/30">|</span>
                              <Maximize2 size={10} />
                              <span>{property.surface} m2</span>
                              {property.bedrooms > 0 && (
                                <>
                                  <span className="text-text-secondary/30">|</span>
                                  <span>{property.bedrooms} ch.</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-1.5">
                          <User size={11} className="text-text-secondary/40 flex-shrink-0" />
                          <span className="text-xs text-text-secondary truncate max-w-[120px]">
                            {property.owner.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {property.agentId ? (
                          <div className="flex items-center gap-1.5">
                            <div className={`w-5 h-5 rounded-full ${getAgentColor(property.agentId)} flex items-center justify-center text-white text-[8px] font-bold`}>
                              {getAgentInitials(property.agentId)}
                            </div>
                            <span className="text-xs">{getAgentName(property.agentId)}</span>
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
                          STATUS_COLORS[property.status] || 'bg-gray-50 text-gray-500 border-gray-200'
                        }`}>
                          {STATUS_LABELS[property.status] || property.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-semibold text-accent">
                          {property.prixSurDemande ? 'Sur demande' : formatPrice(property.price)}
                        </span>
                        {(property.transactionType === 'location_ld' || property.transactionType === 'location_saisonniere') && (
                          <span className="text-[10px] text-text-secondary ml-0.5">
                            {property.transactionType === 'location_ld' ? '/mois' : '/nuit'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center relative">
                        <div className="relative">
                          <button
                            className="p-1.5 rounded-lg hover:bg-background text-text-secondary hover:text-text transition-all opacity-0 group-hover:opacity-100"
                            onClick={() => setShowActionMenu(showActionMenu === property.id ? null : property.id)}
                          >
                            <MoreVertical size={14} />
                          </button>
                          {showActionMenu === property.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setShowActionMenu(null)} />
                              <div className="absolute right-0 top-full mt-1 w-56 bg-card rounded-xl border border-border/50 shadow-dropdown py-1 z-20">
                                <button
                                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-background transition-colors text-left"
                                  onClick={() => { navigate(`/admin/properties/${property.id}`); setShowActionMenu(null); }}
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
                                  onClick={() => { setActionProperty(property); setSelectedAgent(property.agentId); setShowReassignDialog(true); setShowActionMenu(null); }}
                                >
                                  <Repeat size={14} /> Reaffecter a un agent
                                </button>
                                <button
                                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-background transition-colors text-left"
                                  onClick={() => { setActionProperty(property); setNewStatus(property.status); setShowStatusDialog(true); setShowActionMenu(null); }}
                                >
                                  <RefreshCw size={14} /> Changer le statut
                                </button>
                                <div className="border-t border-border/40 my-1" />
                                <button
                                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-error hover:bg-error/5 transition-colors text-left"
                                  onClick={() => { setActionProperty(property); setDeleteConfirm(''); setDeleteReason(''); setShowDeleteDialog(true); setShowActionMenu(null); }}
                                >
                                  <Trash2 size={14} /> Supprimer le bien
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
                <p className="text-text-secondary font-medium">Aucun bien trouve</p>
                <p className="text-xs text-text-secondary/60 mt-1">
                  Essayez de modifier vos filtres ou d'ajouter un nouveau bien
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredProperties.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 bg-background/20">
            <p className="text-xs text-text-secondary">
              Affichage {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filteredProperties.length)} sur {filteredProperties.length} biens
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
      <Dialog isOpen={showReassignDialog} onClose={() => setShowReassignDialog(false)} title="Reaffecter un bien" size="lg">
        {actionProperty && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-background border border-border/50">
              <p className="text-sm font-medium">{actionProperty.title}</p>
              <p className="text-xs text-text-secondary">#{actionProperty.reference}</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-1.5">Agent actuel :</p>
              <div className="flex items-center gap-2 text-sm">
                {actionProperty.agentId ? (
                  <>
                    <div className={`w-6 h-6 rounded-full ${getAgentColor(actionProperty.agentId)} flex items-center justify-center text-white text-[10px] font-bold`}>
                      {getAgentInitials(actionProperty.agentId)}
                    </div>
                    <span>{getAgentName(actionProperty.agentId)}</span>
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
                placeholder="Je vous confie ce bien pour le suivi..."
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
      <Dialog isOpen={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} title="Supprimer le bien" size="lg">
        {actionProperty && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-background border border-border/50">
              <p className="text-sm font-medium">{actionProperty.title}</p>
              <p className="text-xs text-text-secondary">#{actionProperty.reference}</p>
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
                className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
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
              <Button variant="danger" onClick={handleDelete} disabled={deleteConfirm !== 'SUPPRIMER'}>
                Confirmer la suppression
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Change Status Dialog */}
      <Dialog isOpen={showStatusDialog} onClose={() => setShowStatusDialog(false)} title="Changer le statut" size="md">
        {actionProperty && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-background border border-border/50">
              <p className="text-sm font-medium">{actionProperty.title}</p>
              <p className="text-xs text-text-secondary">#{actionProperty.reference}</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Statut actuel</label>
              <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border ${
                STATUS_COLORS[actionProperty.status] || 'bg-gray-50 text-gray-500 border-gray-200'
              }`}>
                {STATUS_LABELS[actionProperty.status] || actionProperty.status}
              </span>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nouveau statut</label>
              <select
                className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                {(STATUS_BY_TYPE[type || ''] || Object.keys(STATUS_LABELS)).map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowStatusDialog(false)}>Annuler</Button>
              <Button variant="default" onClick={handleStatusChange} disabled={newStatus === actionProperty.status}>
                Changer le statut
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
