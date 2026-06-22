import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { Select } from '../../../components/ui/Select';
import { Dialog } from '../../../components/ui/Dialog';
import {
  Search, Sliders, X, MoreVertical, User, Edit3, Repeat, Trash2,
  RefreshCw, Eye, Phone, Mail, MapPin, AlertTriangle, TrendingUp,
  Users, Shield, Calendar, ArrowUp, ArrowDown, CheckCircle, UserPlus,
  Clock, DollarSign, Home, MessageSquare, Briefcase, Tag, Award, Plus
} from 'react-feather';
import { AGENTS, allContacts } from './mockData';
import type { AdminContact } from './mockData';
import type { Contact } from '../../../types/contact';
import { ContactFormModal } from '../../../components/modules/contacts/ContactFormModal';

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

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [mandatFilter, setMandatFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const [actionContact, setActionContact] = useState<AdminContact | null>(null);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [reassignNote, setReassignNote] = useState('');
  const [sendNotification, setSendNotification] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredContacts = useMemo(() => {
    return allContacts
      .filter(c =>
        !searchTerm ||
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.emailPrincipal.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.mobile.includes(searchTerm)
      )
      .filter(c => typeFilter === 'all' || c.type === typeFilter)
      .filter(c => agentFilter === 'all' || (agentFilter === '__none__' ? !c.agentId : c.agentId === agentFilter))
      .filter(c => mandatFilter === 'all' || c.mandats.some(m => m.clientType === mandatFilter && m.status === 'Actif'))
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
  }, [searchTerm, typeFilter, agentFilter, mandatFilter, dateRange]);

  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / PAGE_SIZE));
  const paginatedContacts = filteredContacts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
    const total = allContacts.length;
    const avecMandatActif = allContacts.filter(c => c.mandats.some(m => m.status === 'Actif')).length;
    const particulier = allContacts.filter(c => c.type === 'Particulier').length;
    const professionnel = allContacts.filter(c => c.type === 'Professionnel').length;
    const succession = allContacts.filter(c => c.type === 'Indivision / Succession').length;
    const mandatsActifs = allContacts.reduce((sum, c) => sum + c.mandats.filter(m => m.status === 'Actif').length, 0);
    const moyenneMandats = total > 0 ? (mandatsActifs / total).toFixed(1) : '0';
    return { total, avecMandatActif, particulier, professionnel, succession, mandatsActifs, moyenneMandats };
  }, []);

  const statsByAgent = useMemo(() => {
    const stats: Record<string, { total: number; actifs: number }> = {};
    [...AGENTS.map(a => a.id), ''].forEach(id => { stats[id] = { total: 0, actifs: 0 }; });

    allContacts.forEach(c => {
      const id = c.agentId || '';
      if (!stats[id]) stats[id] = { total: 0, actifs: 0 };
      stats[id].total++;
      if (c.mandats.some(m => m.status === 'Actif')) stats[id].actifs++;
    });
    return stats;
  }, []);

  const totalStats = useMemo(() => {
    const vals = Object.values(statsByAgent);
    return {
      total: vals.reduce((s, v) => s + v.total, 0),
      actifs: vals.reduce((s, v) => s + v.actifs, 0),
    };
  }, [statsByAgent]);

  const activeFiltersCount = [
    typeFilter !== 'all', agentFilter !== 'all', mandatFilter !== 'all', dateRange !== 'all',
  ].filter(Boolean).length;

  const resetFilters = () => {
    setTypeFilter('all'); setAgentFilter('all'); setMandatFilter('all'); setDateRange('all');
  };

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

  const handleAddContact = (_data: Omit<Contact, 'id' | 'mandats' | 'createdAt' | 'updatedAt'>) => {
    setIsModalOpen(false);
  };

  const kpiCards = [
    { label: 'Total contacts', value: kpiData.total, evolution: '+12%', up: true, icon: Users, color: 'text-accent', bg: 'bg-accent-light' },
    { label: 'Avec mandat actif', value: kpiData.avecMandatActif, evolution: '+8%', up: true, icon: Award, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Particuliers', value: kpiData.particulier, evolution: '+15%', up: true, icon: User, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Professionnels', value: kpiData.professionnel, evolution: '+5%', up: true, icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Successions', value: kpiData.succession, evolution: '0%', up: true, icon: Tag, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Mandats actifs', value: kpiData.mandatsActifs, evolution: '+10%', up: true, icon: TrendingUp, color: 'text-accent', bg: 'bg-accent-light' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contacts - Vue d'ensemble</h1>
          <p className="text-sm text-text-secondary mt-1">
            {kpiData.total} contacts · {kpiData.avecMandatActif} avec mandats actifs · {kpiData.mandatsActifs} mandats
          </p>
        </div>
        <Button variant="default" icon={<Plus size={14} />} onClick={() => setIsModalOpen(true)}>
          Nouveau contact
        </Button>
      </div>

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
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Total contacts</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Avec mandat actif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {AGENTS.map(agent => {
                const s = statsByAgent[agent.id] || { total: 0, actifs: 0 };
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
                <td className="text-center px-4 py-2.5">{statsByAgent['']?.actifs || 0}</td>
              </tr>
              <tr className="bg-background/30 font-semibold">
                <td className="px-4 py-2.5 text-sm">TOTAL</td>
                <td className="text-center px-4 py-2.5">{totalStats.total}</td>
                <td className="text-center px-4 py-2.5">{totalStats.actifs}</td>
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
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider hidden lg:table-cell">Agent</th>
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
                            onClick={() => navigate(`/admin/contacts/${contact.id}`)}
                          >
                            {contact.civility} {contact.firstName} {contact.lastName}
                          </button>
                          <div className="flex items-center gap-1.5 text-[11px] text-text-secondary/60 mt-0.5">
                            <Calendar size={10} />
                            <span>{new Date(contact.createdAt).toLocaleDateString('fr-FR')}</span>
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
                    <td className="px-4 py-3 text-center relative">
                      <div className="relative">
                        <button
                          className="p-1.5 rounded-lg hover:bg-background text-text-secondary hover:text-text transition-all opacity-0 group-hover:opacity-100"
                          onClick={() => setShowActionMenu(showActionMenu === contact.id ? null : contact.id)}
                        >
                          <MoreVertical size={14} />
                        </button>
                        {showActionMenu === contact.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowActionMenu(null)} />
                            <div className="absolute right-0 top-full mt-1 w-56 bg-card rounded-xl border border-border/50 shadow-dropdown py-1 z-20">
                              <button
                                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-background transition-colors text-left"
                                onClick={() => { navigate(`/admin/contacts/${contact.id}`); setShowActionMenu(null); }}
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
                                onClick={() => { setActionContact(contact); setSelectedAgent(contact.agentId); setShowReassignDialog(true); setShowActionMenu(null); }}
                              >
                                <Repeat size={14} /> Reaffecter a un agent
                              </button>
                              <div className="border-t border-border/40 my-1" />
                              <button
                                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-error hover:bg-error/5 transition-colors text-left"
                                onClick={() => { setActionContact(contact); setDeleteConfirm(''); setDeleteReason(''); setShowDeleteDialog(true); setShowActionMenu(null); }}
                              >
                                <Trash2 size={14} /> Supprimer le contact
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

      {/* Add Contact Modal */}
      {isModalOpen && (
        <ContactFormModal onClose={() => setIsModalOpen(false)} onSubmit={handleAddContact} />
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
              <p className="text-xs text-text-secondary mb-1.5">Agent actuel :</p>
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
              Envoyer une notification a l'agent
            </label>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowReassignDialog(false)}>Annuler</Button>
              <Button variant="default" onClick={() => { setShowReassignDialog(false); setSelectedAgent(''); }} disabled={!selectedAgent}>Reaffecter</Button>
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
              <Button variant="danger" onClick={() => { setShowDeleteDialog(false); setDeleteConfirm(''); }} disabled={deleteConfirm !== 'SUPPRIMER'}>
                Confirmer la suppression
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
