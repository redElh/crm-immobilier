import { useNavigate, useParams } from 'react-router-dom';
import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { Select } from '../../../components/ui/Select';
import { Dialog } from '../../../components/ui/Dialog';
import {
  Search, Sliders, X, MoreVertical, User, Edit3, Repeat, Trash2, Copy, ChevronLeft,
  RefreshCw, Eye, Phone, Mail, MapPin, AlertTriangle, TrendingUp,
  Users, Shield, Calendar, ArrowUp, ArrowDown, CheckCircle, UserPlus, UserX,
  Clock, DollarSign, Home, MessageSquare, Briefcase, Tag, Award, Plus
} from 'react-feather';
import type { Contact } from '../../../types/contact';
import { ContactFormModal } from '../../../components/modules/contacts/ContactFormModal';
import { ContactDraftSection } from '../../../components/modules/contacts/ContactDraftSection';
import { fetchContacts, duplicateContact, updateContact, deleteContact, createContact } from '../../../services/contactService';
import { api } from '../../../services/api';
import { useToast } from '../../../components/ui/Toast';
import type { ContactDraft } from '../../../services/contactDraftStorage';

const PAGE_SIZE = 8;

const TYPE_COLORS: Record<string, string> = {
  Particulier: 'bg-blue-50 text-blue-700 border-blue-200',
  Professionnel: 'bg-purple-50 text-purple-700 border-purple-200',
  'Indivision / Succession': 'bg-orange-50 text-orange-700 border-orange-200',
};

const TYPE_OPTIONS = [
  { value: 'all', label: 'Tous les types' },
  { value: 'Particulier', label: 'Particulier' },
  { value: 'Professionnel', label: 'Professionnel' },
  { value: 'Indivision / Succession', label: 'Indivision / Succession' },
];

const MANDAT_TYPE_OPTIONS = [
  { value: 'all', label: 'Tous mandats' },
  { value: 'Acheteur', label: 'Acheteur' },
  { value: 'Vendeur', label: 'Vendeur' },
  { value: 'Bailleur', label: 'Bailleur' },
  { value: 'Locataire', label: 'Locataire' },
  { value: 'Voyageur', label: 'Voyageur' },
];

const MANDAT_COLORS: Record<string, string> = {
  Acheteur: 'bg-emerald-50 text-emerald-700',
  Vendeur: 'bg-amber-50 text-amber-700',
  Bailleur: 'bg-accent-light text-accent',
  Locataire: 'bg-violet-50 text-violet-700',
  Voyageur: 'bg-rose-50 text-rose-700',
};

export default function AdminContactsPage() {
  const navigate = useNavigate();
  const { adminId } = useParams<{ adminId: string }>();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [mandatFilter, setMandatFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const [actionContact, setActionContact] = useState<Contact | null>(null);
  const [menuTarget, setMenuTarget] = useState<{ contact: Contact; bounds: DOMRect } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [reassignNote, setReassignNote] = useState('');
  const [sendNotification, setSendNotification] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignStep, setAssignStep] = useState<'choose' | 'agent' | 'admin'>('choose');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [draftId, setDraftId] = useState<string | undefined>();
  const [draftChange, setDraftChange] = useState(0);
  const userId = adminId || 'admin';

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    fetchContacts({ include_copies: 'true' })
      .then(data => setContacts(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.get<any[]>('/admin/users').then(setUsers).catch(() => {});
    api.get<any>('/auth/me').then(setCurrentUser).catch(() => {});
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

  const filteredContacts = useMemo(() => {
    return contacts
      .filter(c =>
        !searchTerm ||
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.emailPrincipal.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.mobile.includes(searchTerm)
      )
      .filter(c => typeFilter === 'all' || c.type === typeFilter)
      .filter(c => {
        if (agentFilter === 'all') return true;
        if (agentFilter === '__none__') return !c.agentId;
        return String(c.agentId || '') === agentFilter;
      })
      .filter(c => mandatFilter === 'all' || c.mandats.some(m => m.clientType === mandatFilter))
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
  }, [contacts, searchTerm, typeFilter, agentFilter, mandatFilter, dateRange, users]);

  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / PAGE_SIZE));
  const paginatedContacts = filteredContacts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const getAgentName = (agentId: string | number | null | undefined) => {
    if (!agentId) return 'Non assigne';
    const person = findPerson(agentId);
    return person ? person.name : 'Ancien agent';
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
    const total = contacts.length;
    const avecMandatActif = contacts.filter(c => c.mandats.some(m => m.status === 'Actif')).length;
    const sansMandat = total - avecMandatActif;
    const particulier = contacts.filter(c => c.type === 'Particulier').length;
    const professionnel = contacts.filter(c => c.type === 'Professionnel').length;
    const succession = contacts.filter(c => c.type === 'Indivision / Succession').length;
    const mandatsActifs = contacts.reduce((sum, c) => sum + c.mandats.filter(m => m.status === 'Actif').length, 0);
    const moyenneMandats = total > 0 ? (mandatsActifs / total).toFixed(1) : '0';
    return { total, avecMandatActif, sansMandat, particulier, professionnel, succession, mandatsActifs, moyenneMandats };
  }, [contacts]);

  const statsByAgent = useMemo(() => {
    const stats: Record<string, { total: number; actifs: number; sansMandat: number }> = {};
    contacts.forEach(c => {
      const id = String(c.agentId || '');
      if (!stats[id]) stats[id] = { total: 0, actifs: 0, sansMandat: 0 };
      stats[id].total++;
      if (c.mandats.some(m => m.status === 'Actif')) stats[id].actifs++;
      else stats[id].sansMandat++;
    });
    return stats;
  }, [contacts]);

  const totalStats = useMemo(() => {
    const vals = Object.values(statsByAgent);
    return {
      total: vals.reduce((s, v) => s + v.total, 0),
      actifs: vals.reduce((s, v) => s + v.actifs, 0),
      sansMandat: vals.reduce((s, v) => s + v.sansMandat, 0),
    };
  }, [statsByAgent]);

  const activeFiltersCount = [
    typeFilter !== 'all', agentFilter !== 'all', mandatFilter !== 'all', dateRange !== 'all',
  ].filter(Boolean).length;

  const resetFilters = () => {
    setTypeFilter('all'); setAgentFilter('all'); setMandatFilter('all'); setDateRange('all');
  };

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

  const handleAddContact = async (data: Omit<Contact, 'id' | 'mandats' | 'createdAt' | 'updatedAt'>) => {
    try {
      const payload = { ...data, agentId: selectedAgent || '' };
      await createContact(payload as any);
      const refreshed = await fetchContacts({ include_copies: 'true' });
      setContacts(Array.isArray(refreshed) ? refreshed : []);
      toast('success', 'Contact ajouté avec succès');
      setIsModalOpen(false);
      setSelectedAgent('');
      setDraftId(undefined);
    } catch (err) {
      toast('error', 'Erreur lors de la création du contact');
    }
  };

  const handleEditContact = async (data: Omit<Contact, 'id' | 'mandats' | 'createdAt' | 'updatedAt'>) => {
    if (!editingContact) return;
    try {
      await updateContact(String(editingContact.id), data);
      const refreshed = await fetchContacts({ include_copies: 'true' });
      setContacts(Array.isArray(refreshed) ? refreshed : []);
      toast('success', 'Contact modifié avec succès');
      setEditingContact(null);
    } catch {
      toast('error', 'Erreur lors de la modification');
    }
  };

  const kpiCards = [
    { label: 'Total contacts', value: kpiData.total, evolution: '+12%', up: true, icon: Users, color: 'text-accent', bg: 'bg-accent-light' },
    { label: 'Avec mandat actif', value: kpiData.avecMandatActif, evolution: '+8%', up: true, icon: Award, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Sans mandat', value: kpiData.sansMandat, evolution: '0%', up: false, icon: UserX, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Particuliers', value: kpiData.particulier, evolution: '+15%', up: true, icon: User, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Professionnels', value: kpiData.professionnel, evolution: '+5%', up: true, icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Successions', value: kpiData.succession, evolution: '0%', up: true, icon: Tag, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contacts - Vue d'ensemble</h1>
          <p className="text-sm text-text-secondary mt-1">
            {kpiData.total} contacts · {kpiData.avecMandatActif} avec mandats actifs · {kpiData.sansMandat} sans mandat
          </p>
        </div>
        <Button variant="default" icon={<Plus size={14} />} onClick={() => { setShowAssignModal(true); setAssignStep('choose'); }}>
          Nouveau contact
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
      <>
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Select options={TYPE_OPTIONS} value={typeFilter} onValueChange={setTypeFilter} placeholder="Type de contact" />
                <Select options={agentOptions} value={agentFilter} onValueChange={(v) => setAgentFilter(v)} placeholder="Agent" />
                <Select options={MANDAT_TYPE_OPTIONS} value={mandatFilter} onValueChange={setMandatFilter} placeholder="Type de mandat" />
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
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Total contacts</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Avec mandat actif</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Sans mandat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {users.filter((u: any) => u.status !== 'supprimé').map((user: any) => {
                const userId = String(user.id);
                const s = statsByAgent[userId] || { total: 0, actifs: 0, sansMandat: 0 };
                const person = findPerson(userId);
                return (
                  <tr key={userId} className="hover:bg-background/50 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full ${person?.color || 'bg-gray-400'} flex items-center justify-center text-white text-[10px] font-bold`}>
                          {person?.initials || userId.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium">{person?.name || userId}</span>
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
                    <td className="text-center px-4 py-2.5">{s.actifs}</td>
                    <td className="text-center px-4 py-2.5">{s.sansMandat}</td>
                  </tr>
                );
              })}
              {/* Unassigned row */}
              {statsByAgent[''] && (
                <tr className="hover:bg-background/50 transition-colors">
                  <td className="px-4 py-2.5">
                    <span className="text-sm text-text-secondary/50 italic">Non assigne</span>
                  </td>
                  <td className="text-center px-4 py-2.5 font-semibold">{statsByAgent[''].total}</td>
                  <td className="text-center px-4 py-2.5">{statsByAgent[''].actifs}</td>
                  <td className="text-center px-4 py-2.5">{statsByAgent[''].sansMandat}</td>
                </tr>
              )}
              <tr className="bg-background/30 font-semibold">
                <td className="px-4 py-2.5 text-sm">TOTAL</td>
                <td className="text-center px-4 py-2.5">{totalStats.total}</td>
                <td className="text-center px-4 py-2.5">{totalStats.actifs}</td>
                <td className="text-center px-4 py-2.5">{totalStats.sansMandat}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Contacts Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          {filteredContacts.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-background/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider w-10">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Contact</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden md:table-cell">Contact</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden lg:table-cell">Géré par</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden xl:table-cell">Mandats</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider w-12">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {paginatedContacts.map((contact, index) => (
                  <tr key={contact.id} className="hover:bg-background/50 transition-colors group">
                    <td className="px-4 py-3 text-xs text-text-secondary/50">
                      {(page - 1) * PAGE_SIZE + index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full ${getAgentColor(contact.agentId)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                          {contact.firstName[0]}{contact.lastName[0]}
                        </div>
                        <div className="min-w-0">
                          <button
                            className="text-sm font-medium truncate block max-w-[200px] hover:text-accent transition-colors text-left"
                            onClick={() => navigate(`/admin/${adminId}/contacts/${contact.id}`)}
                          >
                            {contact.civility} {contact.firstName} {contact.lastName}
                          </button>
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            <Calendar size={10} className="text-text-secondary/60" />
                            <span className="text-[11px] text-text-secondary/60">{new Date(contact.createdAt).toLocaleDateString('fr-FR')}</span>
                            {contact.originalContactId ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 text-[8px] font-semibold rounded-full uppercase tracking-wider bg-orange-100 text-orange-700">Copie</span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 text-[8px] font-semibold rounded-full uppercase tracking-wider bg-blue-100 text-blue-700">Original</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <Phone size={11} className="text-text-secondary/40 flex-shrink-0" />
                          <span className="text-xs text-text-secondary">{contact.mobile}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Mail size={11} className="text-text-secondary/40 flex-shrink-0" />
                          <span className="text-xs text-text-secondary truncate max-w-[160px]">{contact.emailPrincipal}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {contact.agentId ? (
                        <div className="flex items-center gap-1.5">
                          <div className={`w-5 h-5 rounded-full ${getAgentColor(contact.agentId)} flex items-center justify-center text-white text-[8px] font-bold`}>
                            {getAgentInitials(contact.agentId)}
                          </div>
                          <span className="text-xs">{getAgentName(contact.agentId)}</span>
                          {(() => {
                            const badge = getRoleBadge(findPerson(contact.agentId));
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
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-md border ${TYPE_COLORS[contact.type] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                        {contact.type === 'Indivision / Succession' ? 'Succession' : contact.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {contact.mandats.length > 0 ? (
                          contact.mandats.map(m => (
                            <span key={m.id} className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded ${MANDAT_COLORS[m.clientType] || 'bg-gray-50 text-gray-500'}`}>
                              {m.clientType}
                              {m.status === 'Expiré' && <span className="ml-0.5 opacity-60">(E)</span>}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-text-secondary/50 italic">Aucun</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        className="p-1.5 rounded-lg hover:bg-background text-text-secondary hover:text-text transition-all opacity-0 group-hover:opacity-100"
                        onClick={(e) => { e.stopPropagation(); setMenuTarget(menuTarget?.contact.id === contact.id ? null : { contact, bounds: e.currentTarget.getBoundingClientRect() }); }}
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
                <p className="text-text-secondary font-medium">Aucun contact trouve</p>
                <p className="text-xs text-text-secondary/60 mt-1">
                  Essayez de modifier vos filtres
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredContacts.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 bg-background/20">
            <p className="text-xs text-text-secondary">
              Affichage {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filteredContacts.length)} sur {filteredContacts.length} contacts
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

      </>
      )}

      {/* Floating Action Menu */}
      <AnimatePresence>
        {menuTarget && (() => {
          const { contact, bounds } = menuTarget;
          const viewportH = window.innerHeight;
          const spaceBelow = viewportH - bounds.bottom;
          const menuH = 220;
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
                  onClick={() => { setMenuTarget(null); navigate(`/admin/${adminId}/contacts/${contact.id}`); }}
                >
                  <Eye size={14} /> Voir la fiche complete
                </button>
                <button
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-background transition-colors text-left"
                  onClick={() => { setMenuTarget(null); setEditingContact(contact); }}
                >
                  <Edit3 size={14} /> Modifier
                </button>
                <button
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-background transition-colors text-left"
                  onClick={async () => {
                    setMenuTarget(null);
                    try {
                      const duplicated = await duplicateContact(String(contact.id));
                      setContacts(prev => [duplicated, ...prev]);
                      toast('success', `${contact.firstName} ${contact.lastName} dupliqué avec succès`);
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
                  onClick={() => { setMenuTarget(null); setActionContact(contact); setSelectedAgent(String(contact.agentId || '')); setShowReassignDialog(true); }}
                >
                  <Repeat size={14} /> Reaffecter a un agent
                </button>
                <div className="border-t border-border/40 my-1" />
                <button
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-error hover:bg-error/5 transition-colors text-left"
                  onClick={() => { setMenuTarget(null); setActionContact(contact); setDeleteConfirm(''); setDeleteReason(''); setShowDeleteDialog(true); }}
                >
                  <Trash2 size={14} /> Supprimer
                </button>
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>

      {/* Attribution Dialog */}
      <Dialog isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Attribution du contact" size="sm">
        {assignStep === 'choose' ? (
          <div className="space-y-3">
            <p className="text-sm text-text-secondary mb-4">Souhaitez-vous confier ce contact à un agent, un admin ou le gérer vous-même ?</p>
            <button
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border/40 bg-background/50 hover:bg-background hover:border-accent/30 transition-all text-left group"
              onClick={() => setAssignStep('agent')}
            >
              <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-500 group-hover:scale-105 transition-transform">
                <Users size={16} />
              </div>
              <div>
                <div className="text-sm font-medium text-text">Confier à un agent</div>
                <div className="text-xs text-text-secondary">Le contact sera rattaché à un agent immobilier</div>
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
                <div className="text-xs text-text-secondary">Le contact sera géré par un autre administrateur</div>
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
                <div className="text-xs text-text-secondary">Ajouter le contact directement en tant qu'admin</div>
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

      {/* Add Contact Modal */}
      {isModalOpen && (
        <ContactFormModal
          onClose={() => { setIsModalOpen(false); setSelectedAgent(''); setDraftId(undefined); }}
          onSubmit={handleAddContact}
          draftId={draftId}
          userId={userId}
          onDraftChange={() => setDraftChange(c => c + 1)}
        />
      )}

      {/* Edit Contact Modal */}
      {editingContact && (
        <ContactFormModal
          contact={editingContact}
          onClose={() => setEditingContact(null)}
          onSubmit={handleEditContact}
          draftId={draftId}
          userId={userId}
          onDraftChange={() => setDraftChange(c => c + 1)}
        />
      )}

      {/* Reassign Dialog */}
      <Dialog isOpen={showReassignDialog} onClose={() => setShowReassignDialog(false)} title="Reaffecter un contact" size="lg">
        {actionContact && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-background border border-border/50">
              <p className="text-sm font-medium">{actionContact.civility} {actionContact.firstName} {actionContact.lastName}</p>
              <p className="text-xs text-text-secondary">{actionContact.emailPrincipal} · {actionContact.mobile}</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-1.5">Responsable actuel :</p>
              <div className="flex items-center gap-2 text-sm">
                {actionContact.agentId ? (
                  <>
                    <div className={`w-6 h-6 rounded-full ${getAgentColor(actionContact.agentId)} flex items-center justify-center text-white text-[10px] font-bold`}>
                      {getAgentInitials(actionContact.agentId)}
                    </div>
                    <span>{getAgentName(actionContact.agentId)}</span>
                  </>
                ) : (
                  <span className="text-text-secondary italic">Non assigne</span>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nouvel responsable</label>
              <select
                className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
              >
                <option value="">Selectionner un responsable</option>
                {users.filter((u: any) => u.status !== 'supprimé').map((u: any) => (
                  <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>
                ))}
                <option value="">Non assigne</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Note pour le responsable</label>
              <textarea
                className="w-full h-20 px-3 py-2 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-none"
                placeholder="Je vous confie ce contact pour le suivi..."
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
              Envoyer une notification au nouveau responsable
            </label>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowReassignDialog(false)}>Annuler</Button>
              <Button variant="default" onClick={async () => {
                if (!actionContact || !selectedAgent) return;
                try {
                  await updateContact(String(actionContact.id), { agentId: selectedAgent } as any);
                  setContacts(prev => prev.map(c => c.id === actionContact.id ? { ...c, agentId: selectedAgent } : c));
                  toast('success', 'Contact réaffecté avec succès');
                } catch (err: any) {
                  toast('error', err.message || 'Erreur lors de la réaffectation');
                }
                setShowReassignDialog(false);
                setSelectedAgent('');
                setReassignNote('');
              }} disabled={!selectedAgent}>Reaffecter</Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog isOpen={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} title="Supprimer le contact" size="lg">
        {actionContact && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-background border border-border/50">
              <p className="text-sm font-medium">{actionContact.civility} {actionContact.firstName} {actionContact.lastName}</p>
              <p className="text-xs text-text-secondary">{actionContact.emailPrincipal} · {actionContact.mobile}</p>
            </div>
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-red-700 space-y-1">
                  <p className="font-medium">Attention :</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Cette action est IRREVERSIBLE</li>
                    <li>Tous les documents associes seront supprimes</li>
                    <li>L'historique du contact sera efface</li>
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
                <option value="converti">Deja converti en prospect/client</option>
                <option value="retire">Contact retire</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>Annuler</Button>
              <Button variant="danger" onClick={async () => {
                if (!actionContact || deleteConfirm !== 'SUPPRIMER') return;
                try {
                  await deleteContact(String(actionContact.id));
                  setContacts(prev => prev.filter(c => c.id !== actionContact.id));
                  toast('success', `${actionContact.firstName} ${actionContact.lastName} supprimé`);
                } catch (err: any) {
                  toast('error', err.message || 'Erreur lors de la suppression');
                }
                setShowDeleteDialog(false);
                setDeleteConfirm('');
              }} disabled={deleteConfirm !== 'SUPPRIMER'}>
                Confirmer la suppression
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      <ContactDraftSection
        userId={userId}
        draftChange={draftChange}
        onResume={(draft: ContactDraft) => {
          setDraftId(draft.id);
          setIsModalOpen(true);
        }}
      />
    </div>
  );
}
