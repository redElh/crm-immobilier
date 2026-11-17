import { useNavigate, useParams } from 'react-router-dom';
import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import {
  Search, Sliders, X, User, Edit3, Repeat, Trash2, Copy, ChevronLeft, ChevronRight,
  RefreshCw, Eye, Phone, Mail, AlertTriangle, Users, Calendar, CheckCircle, Bell,
  UserX, Tag, Award, Plus, Activity, PieChart, Compass,
} from 'react-feather';
import type { Contact } from '../../../types/contact';
import { ContactFormModal } from '../../../components/modules/contacts/ContactFormModal';
import { ContactAssignModal } from '../../../components/modules/contacts/ContactAssignModal';
import { ContactDraftSection } from '../../../components/modules/contacts/ContactDraftSection';
import { RegistreActionsMenu } from '../../../components/ui/RegistreActionsMenu';
import { fetchContacts, duplicateContact, updateContact, deleteContact, createContact } from '../../../services/contactService';
import { api } from '../../../services/api';
import { useToast } from '../../../components/ui/Toast';
import type { ContactDraft } from '../../../services/contactDraftStorage';
import { cn } from '../../../lib/utils';
import StageModal, { useStageModalButtons } from '../../../components/modules/calendar/StageModal';
import {
  StagePanel, StageBadge, StageButton, STAGE_HUES, SLATE_HUE, GERANT_MAUVE_HUE,
  useStageTheme, useStageAccent, type StageHue,
} from '../../../components/dashboard/Stage';
import { stagePillStyle } from '../../../components/modules/prospects/ProspectDetailStage';
import { AdminStatCard } from '../../../components/dashboard/AdminStatCard';
import { ContactOrbit3D } from '../../../components/dashboard/three/ContactOrbit3D';
import { MandatRadar3D } from '../../../components/dashboard/three/MandatRadar3D';

const PAGE_SIZE = 8;

const DANGER_HUE: StageHue = {
  a: '#FB7185',
  b: '#E11D48',
  glow: 'rgba(244,63,94,0.45)',
  line: '#F43F5E',
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

const DATE_RANGE_OPTIONS = [
  { value: 'all', label: 'Toutes dates' },
  { value: '7', label: '7 derniers jours' },
  { value: '30', label: '30 derniers jours' },
  { value: '90', label: '90 derniers jours' },
];

const TYPE_HUES: Record<string, StageHue> = {
  Particulier: STAGE_HUES.sky,
  Professionnel: STAGE_HUES.violet,
  'Indivision / Succession': STAGE_HUES.amber,
};

const MANDAT_HUES: Record<string, StageHue> = {
  Acheteur: STAGE_HUES.emerald,
  Vendeur: STAGE_HUES.amber,
  Bailleur: STAGE_HUES.sky,
  Locataire: STAGE_HUES.violet,
  Voyageur: STAGE_HUES.fuchsia,
};

const MANDAT_ORDER = ['Acheteur', 'Vendeur', 'Bailleur', 'Locataire', 'Voyageur'];

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

function ContactSummaryCard({
  contact, hue, isDark, isGerant,
}: {
  contact: Contact;
  hue: StageHue;
  isDark: boolean;
  isGerant: boolean;
}) {
  const initials = `${contact.firstName?.[0] || ''}${contact.lastName?.[0] || ''}`.toUpperCase() || '?';
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
          {contact.civility} {contact.firstName} {contact.lastName}
        </p>
        <p className={cn('truncate text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>
          {contact.emailPrincipal} · {contact.mobile}
        </p>
      </div>
    </div>
  );
}

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
  const searchRef = useRef<HTMLInputElement>(null);

  const [actionContact, setActionContact] = useState<Contact | null>(null);
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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [draftId, setDraftId] = useState<string | undefined>();
  const [draftChange, setDraftChange] = useState(0);
  const userId = adminId || 'admin';

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);

  const { toast } = useToast();
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
  }, [contacts, searchTerm, typeFilter, agentFilter, mandatFilter, dateRange]);

  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / PAGE_SIZE));
  const paginatedContacts = filteredContacts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(p => Math.min(p, totalPages));
  }, [totalPages]);

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
    const mandatTypes: Record<string, number> = { Acheteur: 0, Vendeur: 0, Bailleur: 0, Locataire: 0, Voyageur: 0 };
    contacts.forEach(c => c.mandats.forEach(m => {
      mandatTypes[m.clientType] = (mandatTypes[m.clientType] || 0) + 1;
    }));
    const totalMandats = Object.values(mandatTypes).reduce((s, v) => s + v, 0);
    const tauxCouverture = total > 0 ? Math.round((avecMandatActif / total) * 100) : 0;
    return { total, avecMandatActif, sansMandat, particulier, professionnel, succession, mandatsActifs, moyenneMandats, mandatTypes, totalMandats, tauxCouverture };
  }, [contacts]);

  const statsByAgent = useMemo(() => {
    const stats: Record<string, { total: number; actifs: number; sansMandat: number; mandats: number; mandatsActifs: number }> = {};
    contacts.forEach(c => {
      const id = String(c.agentId || '');
      if (!stats[id]) stats[id] = { total: 0, actifs: 0, sansMandat: 0, mandats: 0, mandatsActifs: 0 };
      const active = c.mandats.filter(m => m.status === 'Actif').length;
      stats[id].total++;
      stats[id].mandats += c.mandats.length;
      stats[id].mandatsActifs += active;
      if (active > 0) stats[id].actifs++;
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
      mandats: vals.reduce((s, v) => s + v.mandats, 0),
      mandatsActifs: vals.reduce((s, v) => s + v.mandatsActifs, 0),
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

  const filterChips = useMemo(() => {
    const chips: { key: string; label: string; value: string; clear: () => void }[] = [];
    if (typeFilter !== 'all') chips.push({ key: 'type', label: 'Type', value: TYPE_OPTIONS.find(o => o.value === typeFilter)?.label || typeFilter, clear: () => setTypeFilter('all') });
    if (agentFilter !== 'all') {
      const found = agentOptions.find(o => o.value === agentFilter);
      chips.push({ key: 'agent', label: 'Responsable', value: found?.label || agentFilter, clear: () => setAgentFilter('all') });
    }
    if (mandatFilter !== 'all') chips.push({ key: 'mandat', label: 'Mandat', value: mandatFilter, clear: () => setMandatFilter('all') });
    if (dateRange !== 'all') chips.push({ key: 'date', label: 'Période', value: DATE_RANGE_OPTIONS.find(o => o.value === dateRange)?.label || dateRange, clear: () => setDateRange('all') });
    return chips;
  }, [typeFilter, agentFilter, mandatFilter, dateRange, agentOptions]);

  const keyboardHint = useMemo(
    () => (typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform) ? '⌘ K' : 'Ctrl K'),
    [],
  );

  const teamAgents = users.filter((u: any) => u.status !== 'supprimé');

  const typeSlices = useMemo(() => [
    { name: 'Particulier', value: kpiData.particulier, hue: TYPE_HUES.Particulier },
    { name: 'Professionnel', value: kpiData.professionnel, hue: TYPE_HUES.Professionnel },
    { name: 'Indivision / Succession', value: kpiData.succession, hue: TYPE_HUES['Indivision / Succession'] },
  ], [kpiData.particulier, kpiData.professionnel, kpiData.succession]);

  const mandatSlices = useMemo(() => MANDAT_ORDER.map(name => ({
    name,
    value: kpiData.mandatTypes[name] || 0,
    hue: MANDAT_HUES[name],
  })), [kpiData.mandatTypes]);

  const sansMandatPct = kpiData.total > 0 ? Math.round((kpiData.sansMandat / kpiData.total) * 100) : 0;

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
    } catch {
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

  const refreshContacts = () => {
    setLoading(true);
    fetchContacts({ include_copies: 'true' })
      .then(data => setContacts(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleReassign = async () => {
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
  };

  const handleDelete = async () => {
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
  };

  const gradientTitle = isDark
    ? 'bg-clip-text text-transparent bg-gradient-to-r from-[#F43F5E] via-[#FB7185] to-[#8B7CFF]'
    : 'bg-clip-text text-transparent bg-gradient-to-r from-[#EA580C] via-[#F97316] to-[#FBBF24]';

  return (
    <div className="space-y-5 pb-24">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className={cn('flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[3px]', isDark ? 'text-slate-400' : 'text-teal-900/50')}>
              <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Square Immo · Contacts · Temps réel
            </p>
            <h1 className={cn('mt-2 text-4xl font-black tracking-[-2px] sm:text-5xl', gradientTitle)}>
              CONTACTS 360
            </h1>
            <p className={cn('mt-1.5 text-sm', isDark ? 'text-slate-400' : 'text-teal-900/60')}>
              Portefeuille relationnel — typologies, mandats et couverture par intervenant.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StageButton variant="glass" size="md" icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />} onClick={refreshContacts} disabled={loading}>
              Actualiser
            </StageButton>
            <StageButton size="md" icon={<Plus size={14} />} onClick={() => setShowAssignModal(true)}>
              Nouveau contact
            </StageButton>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          icon={Users}
          label="Total contacts"
          value={kpiData.total}
          unit="contacts"
          detail={`${kpiData.avecMandatActif} avec mandat actif`}
          hue={accent}
          facts={[
            { label: 'Particuliers', value: kpiData.particulier },
            { label: 'Professionnels', value: kpiData.professionnel },
          ]}
          delay={0}
        />
        <AdminStatCard
          icon={CheckCircle}
          label="Couverture mandats"
          value={kpiData.tauxCouverture}
          suffix="%"
          decimals={0}
          detail={`${kpiData.mandatsActifs} mandats actifs`}
          hue={STAGE_HUES.emerald}
          facts={[
            { label: 'Actifs', value: kpiData.avecMandatActif },
            { label: 'Moy./contact', value: kpiData.moyenneMandats },
          ]}
          delay={0.06}
        />
        <AdminStatCard
          icon={UserX}
          label="Sans mandat"
          value={kpiData.sansMandat}
          unit="contacts"
          detail={`${sansMandatPct}% à qualifier`}
          hue={STAGE_HUES.amber}
          facts={[
            { label: 'Successions', value: kpiData.succession },
            { label: 'Professionnels', value: kpiData.professionnel },
          ]}
          delay={0.12}
        />
        <AdminStatCard
          icon={Award}
          label="Mandats actifs"
          value={kpiData.mandatsActifs}
          unit="mandats"
          detail={`moyenne ${kpiData.moyenneMandats}/contact`}
          hue={STAGE_HUES.violet}
          facts={[
            { label: 'Vendeurs', value: kpiData.mandatTypes.Vendeur || 0 },
            { label: 'Acheteurs', value: kpiData.mandatTypes.Acheteur || 0 },
          ]}
          delay={0.18}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <StagePanel
          title="Constellation des contacts"
          icon={Activity}
          hue={accent}
          outerClassName="lg:col-span-2"
          className="min-h-[400px]"
          badge={<StageBadge variant="neutral">{kpiData.total} contacts</StageBadge>}
        >
          <div className="flex h-full flex-col">
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <StageBadge variant="neutral">{kpiData.particulier} particuliers</StageBadge>
              <StageBadge variant="violet">{kpiData.professionnel} professionnels</StageBadge>
              <StageBadge variant="warn">{kpiData.succession} successions</StageBadge>
            </div>
            <ContactOrbit3D
              slices={typeSlices}
              centerValue={String(kpiData.total)}
              centerLabel="contacts"
              isDark={isDark}
              accent={accent}
              height={300}
              className="mt-2 min-h-[300px] w-full flex-1"
            />
            <div className="mt-1.5 flex shrink-0 items-center justify-between gap-2">
              <span className={cn('text-[10px] font-semibold', isDark ? 'text-slate-500' : 'text-slate-400')}>
                Portefeuille · <b className={isDark ? 'text-slate-300' : 'text-slate-700'}>{kpiData.total} contacts</b>
              </span>
              <span className={cn('hidden text-[10px] font-semibold sm:block', isDark ? 'text-slate-500' : 'text-slate-400')}>
                {kpiData.avecMandatActif} avec mandat · {kpiData.sansMandat} sans
              </span>
            </div>
          </div>
        </StagePanel>

        <StagePanel
          title="Radar des mandats"
          icon={PieChart}
          hue={STAGE_HUES.sky}
          badge={<StageBadge variant="neutral">{kpiData.totalMandats} mandats</StageBadge>}
        >
          <div className="flex h-full flex-col">
            <MandatRadar3D
              slices={mandatSlices}
              centerValue={String(kpiData.totalMandats)}
              centerLabel="mandats"
              isDark={isDark}
              accent={STAGE_HUES.sky}
              height={280}
              className="w-full"
            />
            <div className="mt-3 space-y-1.5">
              {mandatSlices.map(s => {
                const share = kpiData.totalMandats > 0 ? Math.round((s.value / kpiData.totalMandats) * 100) : 0;
                return (
                  <div key={s.name} className={cn('flex items-center gap-2 rounded-xl border px-2.5 py-1.5', isDark ? 'border-white/[0.05] bg-white/[0.02]' : 'border-slate-200/60 bg-white/60')}>
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.hue.line, boxShadow: `0 0 6px ${s.hue.glow}` }} />
                    <span className={cn('min-w-0 flex-1 truncate text-[11px] font-bold', isDark ? 'text-slate-300' : 'text-slate-600')}>{s.name}</span>
                    <span className={cn('text-[11px] font-extrabold tabular-nums', isDark ? 'text-slate-200' : 'text-slate-800')}>{s.value}</span>
                    <span className={cn('w-8 text-right text-[9.5px] font-semibold tabular-nums', isDark ? 'text-slate-500' : 'text-slate-400')}>{share}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </StagePanel>
      </div>

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
                {filteredContacts.length} résultat{filteredContacts.length > 1 ? 's' : ''}
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
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { key: 'type', label: 'Type de contact', icon: Tag, control: <Select options={TYPE_OPTIONS} value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }} placeholder="Type de contact" /> },
                  { key: 'agent', label: 'Responsable', icon: User, control: <Select options={agentOptions} value={agentFilter} onValueChange={(v) => { setAgentFilter(v); setPage(1); }} placeholder="Responsable" /> },
                  { key: 'mandat', label: 'Type de mandat', icon: Compass, control: <Select options={MANDAT_TYPE_OPTIONS} value={mandatFilter} onValueChange={(v) => { setMandatFilter(v); setPage(1); }} placeholder="Type de mandat" /> },
                  { key: 'date', label: 'Date de création', icon: Calendar, control: <Select options={DATE_RANGE_OPTIONS} value={dateRange} onValueChange={(v) => { setDateRange(v); setPage(1); }} placeholder="Date de création" /> },
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
                  <b className={isDark ? 'text-slate-300' : 'text-slate-600'}>{filteredContacts.length}</b> contact{filteredContacts.length > 1 ? 's' : ''} correspondant{filteredContacts.length > 1 ? 's' : ''}
                </span>
              </div>
            </StagePanel>
          </motion.div>
        )}
      </AnimatePresence>

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
            { label: 'Avec mandat', count: totalStats.actifs, hue: STAGE_HUES.emerald },
            { label: 'Sans mandat', count: totalStats.sansMandat, hue: STAGE_HUES.amber },
            { label: 'Mandats actifs', count: totalStats.mandatsActifs, hue: STAGE_HUES.violet },
            { label: 'Mandats totaux', count: totalStats.mandats, hue: SLATE_HUE },
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
                    { label: 'Avec mandat', align: 'text-center', dot: STAGE_HUES.emerald },
                    { label: 'Sans mandat', align: 'text-center', dot: STAGE_HUES.amber },
                    { label: 'Mandats actifs', align: 'text-center', dot: STAGE_HUES.violet },
                    { label: 'Couverture', align: 'text-center' },
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
                  const s = statsByAgent[uid] || { total: 0, actifs: 0, sansMandat: 0, mandats: 0, mandatsActifs: 0 };
                  const person = findPerson(uid);
                  const hue = agentHueFor(uid);
                  const badge = getRoleBadge(person);
                  const rate = s.total > 0 ? Math.round((s.actifs / s.total) * 100) : 0;
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
                            { value: s.actifs, hue: STAGE_HUES.emerald },
                            { value: s.sansMandat, hue: STAGE_HUES.amber },
                          ]}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className={cn('text-center text-xs font-semibold tabular-nums', isDark ? 'text-slate-300' : 'text-slate-700')}>{s.actifs}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={cn('text-center text-xs font-semibold tabular-nums', isDark ? 'text-slate-300' : 'text-slate-700')}>{s.sansMandat}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={cn('text-center text-xs font-semibold tabular-nums', isDark ? 'text-slate-300' : 'text-slate-700')}>{s.mandatsActifs}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-14">
                            <StageMixBar isDark={isDark} segments={[{ value: rate, hue: STAGE_HUES.emerald }, { value: Math.max(0, 100 - rate), hue: SLATE_HUE }]} />
                          </div>
                          <span className={cn('min-w-[32px] text-right text-[11px] font-bold tabular-nums', isDark ? 'text-slate-200' : 'text-slate-700')}>{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {statsByAgent[''] && (() => {
                  const s = statsByAgent[''];
                  const rate = s.total > 0 ? Math.round((s.actifs / s.total) * 100) : 0;
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
                            { value: s.actifs, hue: STAGE_HUES.emerald },
                            { value: s.sansMandat, hue: STAGE_HUES.amber },
                          ]}
                        />
                      </td>
                      <td className={cn('px-4 py-3 text-center text-xs font-semibold tabular-nums', isDark ? 'text-slate-300' : 'text-slate-700')}>{s.actifs}</td>
                      <td className={cn('px-4 py-3 text-center text-xs font-semibold tabular-nums', isDark ? 'text-slate-300' : 'text-slate-700')}>{s.sansMandat}</td>
                      <td className={cn('px-4 py-3 text-center text-xs font-semibold tabular-nums', isDark ? 'text-slate-300' : 'text-slate-700')}>{s.mandatsActifs}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-14">
                            <StageMixBar isDark={isDark} segments={[{ value: rate, hue: STAGE_HUES.emerald }, { value: Math.max(0, 100 - rate), hue: SLATE_HUE }]} />
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
                  <td className={cn('px-4 py-3 text-center text-xs font-bold tabular-nums', isDark ? 'text-slate-200' : 'text-slate-800')}>{totalStats.actifs}</td>
                  <td className={cn('px-4 py-3 text-center text-xs font-bold tabular-nums', isDark ? 'text-slate-200' : 'text-slate-800')}>{totalStats.sansMandat}</td>
                  <td className={cn('px-4 py-3 text-center text-xs font-bold tabular-nums', isDark ? 'text-slate-200' : 'text-slate-800')}>{totalStats.mandatsActifs}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center">
                      <span className={cn('rounded-full px-2 py-1 text-[11px] font-extrabold tabular-nums', isDark ? 'bg-white/[0.06] text-white' : 'bg-white text-slate-900')}>
                        {totalStats.total > 0 ? Math.round((totalStats.actifs / totalStats.total) * 100) : 0}%
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </StagePanel>

      <StagePanel
        title="Registre des contacts"
        icon={Users}
        hue={accent}
        action={
          <div className="flex items-center gap-1.5">
            <StageBadge variant="neutral">
              {filteredContacts.length} contact{filteredContacts.length > 1 ? 's' : ''}
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
            Cliquez sur un contact pour ouvrir sa fiche 360°
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { label: 'Particulier', hue: TYPE_HUES.Particulier },
              { label: 'Professionnel', hue: TYPE_HUES.Professionnel },
              { label: 'Succession', hue: TYPE_HUES['Indivision / Succession'] },
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
            {loading ? (
              <div className="flex items-center justify-center py-14">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" style={{ color: accent.line }} />
              </div>
            ) : filteredContacts.length > 0 ? (
              <table className="w-full min-w-[920px] text-sm">
                <thead>
                  <tr className={cn('border-b', isDark ? 'border-white/[0.07] bg-white/[0.03]' : 'border-slate-200/70 bg-slate-50/70')}>
                    {[
                      { label: '#', cls: 'w-12 text-left' },
                      { label: 'Contact', cls: 'text-left' },
                      { label: 'Coordonnées', cls: 'text-left hidden md:table-cell' },
                      { label: 'Géré par', cls: 'text-left hidden lg:table-cell' },
                      { label: 'Type', cls: 'text-left' },
                      { label: 'Mandats', cls: 'text-left hidden xl:table-cell' },
                      { label: 'Actions', cls: 'w-16 text-center' },
                    ].map(col => (
                      <th key={col.label} className={cn('px-4 py-3 text-[9.5px] font-extrabold uppercase tracking-[0.14em]', col.cls, isDark ? 'text-slate-400' : 'text-slate-500')}>
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedContacts.map((contact, index) => {
                    const agentHue = agentHueFor(contact.agentId);
                    const typeHue = TYPE_HUES[contact.type] || SLATE_HUE;
                    const initials = `${contact.firstName?.[0] || ''}${contact.lastName?.[0] || ''}`.toUpperCase() || '?';
                    const activeMandats = contact.mandats.filter(m => m.status === 'Actif').length;
                    return (
                      <tr
                        key={contact.id}
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
                                style={{ background: typeHue.line, borderColor: isDark ? '#0B1024' : '#fff', boxShadow: `0 0 6px ${typeHue.glow}` }}
                              />
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <button
                                  className={cn('max-w-[190px] truncate text-left text-[13px] font-bold transition-opacity hover:opacity-75', isDark ? 'text-white' : 'text-slate-900')}
                                  onClick={() => navigate(`/admin/${adminId}/contacts/${contact.id}`)}
                                >
                                  {contact.civility} {contact.firstName} {contact.lastName}
                                </button>
                                <span
                                  className="shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider"
                                  style={stagePillStyle(contact.originalContactId ? (STAGE_HUES.amber) : (STAGE_HUES.emerald), isDark)}
                                >
                                  {contact.originalContactId ? 'Copie' : 'Original'}
                                </span>
                              </div>
                              <div className={cn('mt-0.5 flex items-center gap-1.5 text-[10.5px] font-medium', isDark ? 'text-slate-500' : 'text-slate-400')}>
                                <Calendar size={10} />
                                <span>{new Date(contact.createdAt).toLocaleDateString('fr-FR')}</span>
                                <span className="opacity-50">·</span>
                                <span>{activeMandats} mandat{activeMandats > 1 ? 's' : ''} actif{activeMandats > 1 ? 's' : ''}</span>
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
                              <span className={cn('text-[11px] font-medium', isDark ? 'text-slate-300' : 'text-slate-600')}>{contact.mobile}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className={cn('flex h-4 w-4 items-center justify-center rounded', isDark ? 'bg-white/[0.05] text-slate-500' : 'bg-slate-900/[0.05] text-slate-400')}>
                                <Mail size={9} />
                              </span>
                              <span className={cn('max-w-[160px] truncate text-[11px] font-medium', isDark ? 'text-slate-400' : 'text-slate-500')}>{contact.emailPrincipal}</span>
                            </div>
                          </div>
                        </td>
                        <td className="hidden px-4 py-3 lg:table-cell">
                          {contact.agentId ? (
                            <div className="flex items-center gap-1.5">
                              <span
                                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-extrabold text-white"
                                style={{
                                  backgroundImage: `linear-gradient(145deg, ${agentHue.a}, ${agentHue.b})`,
                                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
                                }}
                              >
                                {getAgentInitials(contact.agentId)}
                              </span>
                              <span className={cn('max-w-[110px] truncate text-[11px] font-semibold', isDark ? 'text-slate-300' : 'text-slate-700')}>
                                {getAgentName(contact.agentId)}
                              </span>
                              {(() => {
                                const badge = getRoleBadge(findPerson(contact.agentId));
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
                        <td className="px-4 py-3">
                          <HueChip
                            hue={typeHue}
                            label={contact.type === 'Indivision / Succession' ? 'Succession' : contact.type}
                            isDark={isDark}
                            icon={Tag}
                          />
                        </td>
                        <td className="hidden px-4 py-3 xl:table-cell">
                          {contact.mandats.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {contact.mandats.slice(0, 3).map(m => (
                                <span
                                  key={m.id}
                                  className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9.5px] font-bold"
                                  style={stagePillStyle(MANDAT_HUES[m.clientType] || SLATE_HUE, isDark)}
                                >
                                  {m.clientType}
                                  {m.status === 'Expiré' && <span className="opacity-60">(E)</span>}
                                </span>
                              ))}
                              {contact.mandats.length > 3 && (
                                <span className={cn('inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9.5px] font-bold', isDark ? 'border-white/[0.08] text-slate-400' : 'border-slate-200/70 text-slate-500')}>
                                  +{contact.mandats.length - 3}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className={cn('text-[10px] font-medium italic', isDark ? 'text-slate-500' : 'text-slate-400')}>Aucun</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <RegistreActionsMenu
                            isGerant={isGerant}
                            actions={[
                              { icon: <Eye size={14} />, label: 'Voir la fiche complète', onClick: () => navigate(`/admin/${adminId}/contacts/${contact.id}`) },
                              { icon: <Edit3 size={14} />, label: 'Modifier', onClick: () => setEditingContact(contact) },
                              {
                                icon: <Copy size={14} />,
                                label: 'Dupliquer',
                                onClick: async () => {
                                  try {
                                    const duplicated = await duplicateContact(String(contact.id));
                                    setContacts(prev => [duplicated, ...prev]);
                                    toast('success', `${contact.firstName} ${contact.lastName} dupliqué avec succès`);
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
                                  setActionContact(contact);
                                  setSelectedAgent(String(contact.agentId || ''));
                                  setShowReassignDialog(true);
                                },
                              },
                              { separator: true, icon: <></>, label: '', onClick: () => {} },
                              {
                                icon: <Trash2 size={14} />,
                                label: 'Supprimer',
                                variant: 'danger',
                                onClick: () => {
                                  setActionContact(contact);
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
                <p className={cn('mt-3 text-sm font-extrabold', isDark ? 'text-white' : 'text-slate-900')}>Aucun contact trouvé</p>
                <p className={cn('mt-1 max-w-xs text-xs leading-relaxed', isDark ? 'text-slate-400' : 'text-slate-500')}>
                  Ajustez vos filtres ou réinitialisez la recherche pour afficher vos contacts.
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

          {filteredContacts.length > 0 && (
            <div className={cn('flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between', isDark ? 'border-white/[0.07] bg-white/[0.02]' : 'border-slate-200/70 bg-slate-50/60')}>
              <p className={cn('text-[11px] font-medium', isDark ? 'text-slate-400' : 'text-slate-500')}>
                Affichage <b className={isDark ? 'text-slate-200' : 'text-slate-700'}>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredContacts.length)}</b> sur <b className={isDark ? 'text-slate-200' : 'text-slate-700'}>{filteredContacts.length}</b> contacts
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

      <ContactAssignModal
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
        {isModalOpen && (
          <ContactFormModal
            onClose={() => { setIsModalOpen(false); setSelectedAgent(''); setDraftId(undefined); }}
            onSubmit={handleAddContact}
            draftId={draftId}
            userId={userId}
            isGerant={currentUser?.role === 'gerant'}
            onDraftChange={() => setDraftChange(c => c + 1)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingContact && (
          <ContactFormModal
            contact={editingContact}
            onClose={() => setEditingContact(null)}
            onSubmit={handleEditContact}
            draftId={draftId}
            userId={userId}
            isGerant={currentUser?.role === 'gerant'}
            onDraftChange={() => setDraftChange(c => c + 1)}
          />
        )}
      </AnimatePresence>

      <StageModal
        open={showReassignDialog}
        onClose={() => setShowReassignDialog(false)}
        title="Réaffecter un contact"
        eyebrow="Attribution"
        subtitle={actionContact ? `${actionContact.civility || ''} ${actionContact.firstName} ${actionContact.lastName}`.trim() : undefined}
        icon={Repeat}
        hue={interfaceHue}
        maxWidth="max-w-xl"
        centered
        footer={actionContact ? (
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
        {actionContact && (
          <div className="space-y-4">
            <ContactSummaryCard contact={actionContact} hue={interfaceHue} isDark={isDark} isGerant={isGerant} />
            <div>
              <p className={fieldLabel}>Responsable actuel</p>
              <div className="flex items-center gap-2 text-sm">
                {actionContact.agentId ? (
                  <>
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white ${getAgentColor(actionContact.agentId)}`}>
                      {getAgentInitials(actionContact.agentId)}
                    </div>
                    <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>{getAgentName(actionContact.agentId)}</span>
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
                placeholder="Je vous confie ce contact pour le suivi..."
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
        title="Supprimer le contact"
        eyebrow="Zone sensible"
        subtitle={actionContact ? `${actionContact.civility || ''} ${actionContact.firstName} ${actionContact.lastName}`.trim() : undefined}
        icon={Trash2}
        hue={DANGER_HUE}
        maxWidth="max-w-xl"
        centered
        footer={actionContact ? (
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
        {actionContact && (
          <div className="space-y-4">
            <ContactSummaryCard contact={actionContact} hue={DANGER_HUE} isDark={isDark} isGerant={isGerant} />
            <div className={cn('rounded-2xl border p-3.5', isDark ? 'border-rose-400/25 bg-rose-500/10' : 'border-rose-200 bg-rose-50')}>
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={16} className={cn('mt-0.5 shrink-0', isDark ? 'text-rose-300' : 'text-rose-500')} />
                <div className={cn('space-y-1 text-xs', isDark ? 'text-rose-200/85' : 'text-rose-700')}>
                  <p className="font-semibold">Attention — action irréversible</p>
                  <ul className="list-inside list-disc space-y-0.5">
                    <li>Cette action est IRREVERSIBLE</li>
                    <li>Tous les documents associés seront supprimés</li>
                    <li>L'historique du contact sera effacé</li>
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
                  { value: 'converti', label: 'Déjà converti en prospect/client' },
                  { value: 'retire', label: 'Contact retiré' },
                  { value: 'autre', label: 'Autre' },
                ]}
              />
            </div>
          </div>
        )}
      </StageModal>

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
