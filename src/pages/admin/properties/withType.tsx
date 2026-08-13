import { useNavigate, useParams } from 'react-router-dom';
import { useState, useMemo, useEffect, useRef } from 'react';
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
import { AGENTS, ADMINS } from './mockData';
import type { AdminProperty, MandatStatus } from './mockData';
import { DraftSection } from '../../../components/modules/properties/DraftSection';
import { fetchProperties, duplicateProperty, deleteProperty, reassignProperty } from '../../../services/propertyService'
import { api } from '../../../services/api'
import { useToast } from '../../../components/ui/Toast'
import { ConfidentialProvider } from '../../../components/modules/confidentiality/ConfidentialContext';
import { ConfidentialBanner } from '../../../components/modules/confidentiality/ConfidentialBanner';

const ADMIN_BUTTON_CLASSES = 'bg-amber-600 hover:bg-amber-700 border-amber-600 hover:border-amber-700 text-white shadow-[0_10px_24px_rgba(217,119,6,0.35)]'
const GERANT_BUTTON_CLASSES = 'bg-[#905D5D] hover:bg-[#7D5050] border-[#905D5D] hover:border-[#7D5050] text-white shadow-[0_10px_24px_rgba(144,93,93,0.35)]'

const GERANT_STATUS_OVERRIDES: Record<string, string> = {
  mandate_pending: 'bg-[#E7D5D5] text-[#905D5D] border-[#E0C6C6]',
  negotiation: 'bg-[#E7D5D5] text-[#905D5D] border-[#E0C6C6]',
  under_compromise: 'bg-[#F0E2E2] text-[#7D5050] border-[#E0C6C6]',
  under_promise: 'bg-[#F0E2E2] text-[#7D5050] border-[#E0C6C6]',
  signing: 'bg-[#E7D5D5] text-[#905D5D] border-[#E0C6C6]',
  option: 'bg-[#E7D5D5] text-[#905D5D] border-[#E0C6C6]',
  urbanism: 'bg-[#E7D5D5] text-[#905D5D] border-[#E0C6C6]',
};
const statusColor = (status: string, isGerant: boolean) =>
  isGerant && GERANT_STATUS_OVERRIDES[status] ? GERANT_STATUS_OVERRIDES[status] : STATUS_COLORS[status];

const CITY_GROUPS: Record<string, string[]> = {
  Essaouira: [
    'Argana', 'Azlef', 'Douar Laraab', 'Erraounak', 'Ghazoua', 'Medina',
    'Ounagha', 'Arbaa Ida Ougourd', 'Sidi Kaouki', 'Sidi Magdoul',
    'Sidi Ahmed Essayeh', 'Tidzi',
  ],
};

const TOP_CITIES = ['Essaouira', 'Marrakech', 'Agadir'];

const PAGE_SIZE = 6;

const formatPrice = (p: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(p);

const getDisplayPrice = (p: any) => {
  if (p?.transactionType === 'location_ld') return p?.loyerHC || 0;
  if (p?.prixNetVendeur && p?.honorairesPct && p?.honorairesType === 'inclus') {
    return Math.round(Number(p.prixNetVendeur) * (1 + Number(p.honorairesPct) / 100));
  }
  return p?.prixNetVendeur || p?.price || 0;
};

export default function AdminPropertiesPageWithType() {
  const navigate = useNavigate();
  const { type, adminId } = useParams<{ type: string; adminId: string }>();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignStep, setAssignStep] = useState<'choose' | 'agent' | 'admin'>('choose');

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
  const [menuTarget, setMenuTarget] = useState<{ property: AdminProperty; bounds: DOMRect } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuTarget(null);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);
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

  useEffect(() => {
    api.get<any>('/auth/me')
      .then(u => u && setIsGerant(u.role === 'gerant'))
      .catch(() => {});
  }, []);

  const accentFocus = isGerant ? 'focus:ring-[#905D5D]/20 focus:border-[#905D5D]' : 'focus:ring-accent/20 focus:border-accent';

  useEffect(() => {
    setLoading(true);
    fetchProperties()
      .then(setAllProperties)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.get<any[]>('/admin/users').then(setUsers).catch(() => {});
  }, []);

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
    const enLocation = propertiesForType.filter(p => p.transactionType === 'location_ld' || p.transactionType === 'location_saisonniere').length;
    const vendus = propertiesForType.filter(p => p.status === 'sold' || p.status === 'rented' || p.status === 'sold_or_rented').length;
    return { total, enVente, enLocation, vendus };
  }, [propertiesForType]);

  return (
    <ConfidentialProvider>
    <div className="space-y-6 animate-fade-in">
      <BackLink to={`/admin/${adminId}/properties`} className="mb-2" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Biens - {typeLabel}</h1>
          <p className="text-sm text-text-secondary mt-1">
            {summaryStats.total} biens · {summaryStats.enVente} en vente · {summaryStats.enLocation} en location · {summaryStats.vendus} vendus ce mois
          </p>
        </div>
        <Button variant="default" className={isGerant ? GERANT_BUTTON_CLASSES : ADMIN_BUTTON_CLASSES} icon={<Plus size={14} />} onClick={() => { setShowAssignModal(true); setAssignStep('choose') }}>
          Ajouter un bien
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className={`w-6 h-6 border-2 border-t-transparent rounded-full animate-spin ${isGerant ? 'border-[#905D5D]' : 'border-accent'}`} />
        </div>
      ) : (
      <>
      {allProperties.length > 0 && <ConfidentialBanner isGerant={isGerant} />}

      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Rechercher par nom, localisation ou reference..."
            className={`w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 transition-all ${accentFocus}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button
            className={`btn-secondary h-9 px-3 flex items-center gap-2 text-sm rounded-lg border border-border bg-card hover:bg-background transition-all ${showFilters || activeFiltersCount > 0 ? (isGerant ? 'ring-2 ring-[#905D5D]/20 border-[#905D5D]' : 'ring-2 ring-accent/20 border-accent') : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Sliders size={14} />
            Filtres
            {activeFiltersCount > 0 && (
              <span className={`w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center ${isGerant ? 'bg-[#905D5D]' : 'bg-accent'}`}>
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
                <Select options={cityOptions} value={cityFilter} onValueChange={(v) => { setCityFilter(v); setCitySubFilter('all'); }} />
                {cityFilter === 'Essaouira' && subCityOptions.length > 0 && (
                  <Select options={subCityOptions} value={citySubFilter} onValueChange={setCitySubFilter} />
                )}
                <Select options={dateRangeOptions} value={dateRange} onValueChange={setDateRange} />
                <div className="flex items-center gap-2">
                  <input type="number" placeholder="Prix min" className={`w-full h-9 px-3 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 transition-all ${accentFocus}`} value={priceMin} onChange={(e) => setPriceMin(e.target.value)} />
                  <span className="text-text-secondary/40 text-xs">-</span>
                  <input type="number" placeholder="Prix max" className={`w-full h-9 px-3 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 transition-all ${accentFocus}`} value={priceMax} onChange={(e) => setPriceMax(e.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" placeholder="Surface min" className={`w-full h-9 px-3 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 transition-all ${accentFocus}`} value={surfaceMin} onChange={(e) => setSurfaceMin(e.target.value)} />
                  <span className="text-text-secondary/40 text-xs">-</span>
                  <input type="number" placeholder="Surface max" className={`w-full h-9 px-3 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 transition-all ${accentFocus}`} value={surfaceMax} onChange={(e) => setSurfaceMax(e.target.value)} />
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
          <span className="text-sm font-medium">Statistiques</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Intervenant</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Biens actifs</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">En vente</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">En location</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Ventes ce mois</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {statsRows.map(({ id, person, stats: s }) => {
                const badge = getRoleBadge(person, isGerant);
                return (
                  <tr key={id} className="hover:bg-background/50 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full ${person?.color || 'bg-gray-400'} flex items-center justify-center text-white text-[10px] font-bold`}>
                          {person?.initials || id.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium">{person?.name || id}</span>
                        {badge && (
                          <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold rounded-full uppercase tracking-wider ${badge.cls}`}>
                            {badge.label}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-center px-4 py-2.5 font-semibold">{s.total}</td>
                    <td className="text-center px-4 py-2.5">{s.enVente}</td>
                    <td className="text-center px-4 py-2.5">{s.enLocation}</td>
                    <td className="text-center px-4 py-2.5">{s.vendus}</td>
                  </tr>
                );
              })}
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

      {/* Drafts */}
      <DraftSection propertyType={type} adminSlug={adminId} />

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
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden lg:table-cell">Géré par</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden xl:table-cell">Mandat</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Statut</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Prix</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider w-12">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {paginatedProperties.map((property, index) => {
                  const mandatStatus = property.mandate_statutMandat || property.mandateStatus;
                  const mandatBadge = mandateStatusBadge(mandatStatus, isGerant);
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
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br to-background flex-shrink-0 flex items-center justify-center overflow-hidden ${isGerant ? 'from-[#E7D5D5]' : 'from-accent-light'}`}>
                            {property.images?.[0] ? (
                              <img src={property.images[0]} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Home size={14} className="text-text-secondary/30" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <button
                                className={`text-sm font-medium truncate block max-w-[180px] transition-colors ${isGerant ? 'hover:text-[#905D5D]' : 'hover:text-accent'}`}
                                onClick={() => navigate(`/admin/${adminId}/properties/${property.id}`)}
                              >
                                {property.title}
                              </button>
                              {property.originalPropertyId ? (
                                <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold rounded-full uppercase tracking-wider shrink-0 ${isGerant ? 'bg-[#F0E2E2] text-[#7D5050]' : 'bg-orange-100 text-orange-700'}`}>
                                  Copie
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold rounded-full uppercase tracking-wider bg-blue-100 text-blue-700 shrink-0">
                                  Original
                                </span>
                              )}
                            </div>
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
                            {property.owner?.name
                              || [(property.owner as any)?.firstName, (property.owner as any)?.lastName].filter(Boolean).join(' ')
                              || [(property as any).owner_firstName, (property as any).owner_lastName].filter(Boolean).join(' ')
                              || 'Non renseigné'}
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
                            {(() => {
                              const person = findPerson(property.agentId);
                              const badge = getRoleBadge(person, isGerant);
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
                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-md border ${mandatBadge.class}`}>
                          {mandatBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-md border ${
                          statusColor(property.status, isGerant) || 'bg-gray-50 text-gray-500 border-gray-200'
                        }`}>
                          {STATUS_LABELS[property.status] || property.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-semibold ${isGerant ? 'text-[#905D5D]' : 'text-accent'}`}>
                          {property.prixSurDemande ? 'Sur demande' : formatPrice(getDisplayPrice(property))}
                        </span>
                        {(property.transactionType === 'location_ld' || property.transactionType === 'location_saisonniere') && (
                          <span className="text-[10px] text-text-secondary ml-0.5">
                            {property.transactionType === 'location_ld' ? '/mois' : '/nuit'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          className="p-1.5 rounded-lg hover:bg-background text-text-secondary hover:text-text transition-all opacity-0 group-hover:opacity-100"
                          onClick={(e) => setMenuTarget(menuTarget?.property.id === property.id ? null : { property, bounds: e.currentTarget.getBoundingClientRect() })}
                        >
                          <MoreVertical size={14} />
                        </button>
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
                      ? isGerant ? 'bg-[#905D5D] text-white' : 'bg-accent text-white'
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

      </>
      )}

      {/* Reassign Dialog */}
      <Dialog isOpen={showReassignDialog} onClose={() => setShowReassignDialog(false)} title="Reaffecter un bien" size="lg">
        {actionProperty && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-background border border-border/50">
              <p className="text-sm font-medium">{actionProperty.title}</p>
              <p className="text-xs text-text-secondary">#{actionProperty.reference}</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-1.5">Responsable actuel :</p>
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
              <label className="text-sm font-medium mb-1.5 block">Nouveau responsable</label>
              <Select
                placeholder="Sélectionner un agent"
                value={selectedAgent}
                onValueChange={(v) => setSelectedAgent(v)}
                options={users.map((u: any) => ({
                  value: String(u.id),
                  label: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
                }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Note pour l'agent</label>
              <textarea
                className={`w-full h-20 px-3 py-2 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 transition-all resize-none ${accentFocus}`}
                placeholder="Je vous confie ce bien pour le suivi..."
                value={reassignNote}
                onChange={(e) => setReassignNote(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                className={`w-4 h-4 rounded border-border focus:ring-2 ${isGerant ? 'accent-[#905D5D] focus:ring-[#905D5D]/20' : 'text-accent focus:ring-accent/20'}`}
                checked={sendNotification}
                onChange={(e) => setSendNotification(e.target.checked)}
              />
              Envoyer une notification a l'agent
            </label>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowReassignDialog(false)}>Annuler</Button>
              <Button variant="default" className={isGerant ? GERANT_BUTTON_CLASSES : ADMIN_BUTTON_CLASSES} onClick={handleReassign} disabled={!selectedAgent}>Reaffecter</Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Floating Action Menu */}
      <AnimatePresence>
        {menuTarget && (() => {
          const { property, bounds } = menuTarget;
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
                className="w-56 bg-card rounded-xl border border-border/50 shadow-dropdown py-1 z-50 max-h-[300px] overflow-y-auto scrollbar-thin"
              >
                <button
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-background transition-colors text-left"
                  onClick={() => { setMenuTarget(null); navigate(`/admin/${adminId}/properties/${property.id}`); }}
                >
                  <Eye size={14} /> Voir la fiche complete
                </button>
                {!isOtherAdmin(property.agentId) && (
                  <button
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-background transition-colors text-left"
                    onClick={() => { setMenuTarget(null); navigate(`/admin/${adminId}/properties/type/${type}/edit/${property.id}`); }}
                  >
                    <Edit3 size={14} /> Modifier
                  </button>
                )}
                {!isOtherAdmin(property.agentId) && (
                  <button
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-background transition-colors text-left"
                    onClick={async () => {
                      setMenuTarget(null);
                      try {
                        const duplicated = await duplicateProperty(property.id);
                        setAllProperties(prev => [duplicated, ...prev]);
                        toast('success', `Bien ${duplicated.reference} dupliqué avec succès`);
                      } catch (e: any) {
                        toast('error', e.message || 'Erreur lors de la duplication');
                      }
                    }}
                  >
                    <Copy size={14} /> Dupliquer
                  </button>
                )}
                {!isOtherAdmin(property.agentId) && <div className="border-t border-border/40 my-1" />}
                {!isOtherAdmin(property.agentId) && (
                  <button
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-background transition-colors text-left"
                    onClick={() => { setActionProperty(property); setSelectedAgent(property.agentId); setShowReassignDialog(true); setMenuTarget(null); }}
                  >
                    <Repeat size={14} /> Reaffecter a un agent
                  </button>
                )}
                {!isOtherAdmin(property.agentId) && (
                  <button
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-background transition-colors text-left"
                    onClick={() => { setActionProperty(property); setNewStatus(property.status); setShowStatusDialog(true); setMenuTarget(null); }}
                  >
                    <RefreshCw size={14} /> Changer le statut
                  </button>
                )}
                {!isOtherAdmin(property.agentId) && <div className="border-t border-border/40 my-1" />}
                {!isOtherAdmin(property.agentId) && (
                  <button
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-error hover:bg-error/5 transition-colors text-left"
                    onClick={() => { setActionProperty(property); setDeleteConfirm(''); setDeleteReason(''); setShowDeleteDialog(true); setMenuTarget(null); }}
                  >
                    <Trash2 size={14} /> Supprimer le bien
                  </button>
                )}
                {isOtherAdmin(property.agentId) && (
                  <div className="px-4 py-2.5 text-xs text-text-secondary/50 italic">Lecture seule</div>
                )}
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>

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
                className={`w-full h-10 px-3 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 transition-all ${accentFocus}`}
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
              <Select
                placeholder="Sélectionner un statut"
                value={newStatus}
                onValueChange={(v) => setNewStatus(v)}
                options={(STATUS_BY_TRANSACTION[actionProperty.transactionType] || Object.keys(STATUS_LABELS)).map(s => ({
                  value: s,
                  label: STATUS_LABELS[s] || s,
                }))}
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowStatusDialog(false)}>Annuler</Button>
              <Button variant="default" className={isGerant ? GERANT_BUTTON_CLASSES : ADMIN_BUTTON_CLASSES} onClick={handleStatusChange} disabled={newStatus === actionProperty.status}>
                Changer le statut
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Attribution du bien" size="sm">
        {assignStep === 'choose' ? (
          <div className="space-y-3">
            <p className="text-sm text-text-secondary mb-4">Souhaitez-vous confier ce bien à un agent, un admin ou le gérer vous-même ?</p>
            <button
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border/40 bg-background/50 hover:bg-background transition-all text-left group"
              onClick={() => setAssignStep('agent')}
            >
              <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-500 group-hover:scale-105 transition-transform">
                <Users size={16} />
              </div>
              <div>
                <div className="text-sm font-medium text-text">Confier à un agent</div>
                <div className="text-xs text-text-secondary">Le bien sera rattaché à un agent immobilier</div>
              </div>
            </button>
            <button
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border/40 bg-background/50 hover:bg-background transition-all text-left group"
              onClick={() => setAssignStep('admin')}
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:scale-105 transition-transform">
                <Shield size={16} />
              </div>
              <div>
                <div className="text-sm font-medium text-text">Confier à un admin</div>
                <div className="text-xs text-text-secondary">Le bien sera géré par un autre administrateur</div>
              </div>
            </button>
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/30" /></div>
              <div className="relative flex justify-center"><span className="bg-card px-3 text-xs text-text-secondary/50">ou</span></div>
            </div>
            <button
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border bg-background/50 transition-all text-left group ${isGerant ? 'border-[#905D5D]/20 hover:bg-[#905D5D]/5 hover:border-[#905D5D]/30' : 'border-accent/20 bg-accent/5 hover:bg-accent/10 hover:border-accent/30'}`}
              onClick={() => { setShowAssignModal(false); navigate(`/admin/${adminId}/properties/type/${type}/add`) }}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D]' : 'bg-accent/10 text-accent'}`}>
                <User size={16} />
              </div>
              <div>
                <div className={`text-sm font-medium ${isGerant ? 'text-[#905D5D]' : 'text-accent'}`}>Je gère moi-même</div>
                <div className="text-xs text-text-secondary">Ajouter le bien directement en tant qu'admin</div>
              </div>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              className="text-xs text-text-secondary hover:text-text flex items-center gap-1 transition-colors mb-2"
              onClick={() => setAssignStep('choose')}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Retour
            </button>
            <p className="text-sm text-text-secondary mb-1">
              {assignStep === 'agent' ? 'Sélectionnez un agent' : 'Sélectionnez un admin'}
            </p>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {(assignStep === 'agent'
                ? [...users.filter(u => u.role === 'agent').map(u => ({
                    id: String(u.id), name: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
                    initials: `${(u.first_name || '')[0]}${(u.last_name || '')[0]}`.toUpperCase() || '?',
                    color: COLORS[Math.abs(Number(u.id) || u.id.length) % COLORS.length],
                  })), ...AGENTS]
                : [...users.filter(u => u.role === 'admin' || u.role === 'gerant').map(u => ({
                    id: String(u.id), name: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
                    initials: `${(u.first_name || '')[0]}${(u.last_name || '')[0]}`.toUpperCase() || '?',
                    color: 'bg-indigo-500',
                  })), ...ADMINS]
              ).map((person) => (
                <button
                  key={person.id}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border border-border/30 hover:bg-background/50 transition-all text-left group ${isGerant ? 'hover:border-[#905D5D]/30' : 'hover:border-accent/30'}`}
                  onClick={() => {
                    setShowAssignModal(false);
                    const targetType = assignStep === 'agent' ? 'agent' : 'admin';
                    navigate(`/admin/${adminId}/properties/type/${type}/add?assignedTo=${person.id}&assignedType=${targetType}`);
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
    </div>
    </ConfidentialProvider>
  );
}
