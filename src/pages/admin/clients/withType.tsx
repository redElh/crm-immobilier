import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useState, useEffect, useMemo, useRef } from 'react';
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
  Users, Shield, Calendar, Star, Home, Briefcase, Sun, ChevronDown, Plus,
  ArrowUp, ArrowDown, UserCheck, FileText, DollarSign, TrendingUp
} from 'react-feather';
import { CITIES } from './mockData';
import type { AdminClient } from './mockData';
import type { Client } from '../../../types/client';
import { AddClientButton } from '../../../components/modules/clients/AddClientButton';
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
    acheteur: `${total} client${total !== 1 ? 's' : ''} \u00b7 ${actifs} actif${actifs !== 1 ? 's' : ''} \u00b7 ${enNegoc} en n\u00e9gociation \u00b7 ${enCompromis} en compromis \u00b7 ${nouveauCeMois} ce mois \u00b7 ${biensProposes} biens propos\u00e9s`,
    vendeur: `${total} client${total !== 1 ? 's' : ''} \u00b7 ${actifs} actif${actifs !== 1 ? 's' : ''} \u00b7 ${enNegoc} en n\u00e9gociation \u00b7 ${enCompromis} en compromis \u00b7 ${nouveauCeMois} vendu${nouveauCeMois !== 1 ? 's' : ''} ce mois \u00b7 ${biensProposes} biens en stock`,
    bailleur: `${total} client${total !== 1 ? 's' : ''} \u00b7 ${actifs} actif${actifs !== 1 ? 's' : ''} \u00b7 ${bauxSignes} baux actifs \u00b7 ${nouveauCeMois} location${nouveauCeMois !== 1 ? 's' : ''} ce mois \u00b7 ${biensProposes} biens en location`,
    locataire: `${total} client${total !== 1 ? 's' : ''} \u00b7 ${actifs} actif${actifs !== 1 ? 's' : ''} \u00b7 ${enDossier} en dossier \u00b7 ${bauxSignes} baux sign\u00e9s \u00b7 ${installes} install\u00e9s \u00b7 ${biensProposes} biens propos\u00e9s`,
    voyageur: `${total} client${total !== 1 ? 's' : ''} \u00b7 ${actifs} actif${actifs !== 1 ? 's' : ''} \u00b7 ${reservations} r\u00e9servations confirm\u00e9es \u00b7 ${sejourEnCours} s\u00e9jour en cours \u00b7 ${sejoursTermines} s\u00e9jours termin\u00e9s ce mois`,
  };
  return summaries[type] || '';
};

const typeKpiConfig: Record<string, { label: string; icon: any; color: string; bg: string }[]> = {
  acheteur: [
    { label: 'Total acheteurs', icon: Users, color: 'text-accent', bg: 'bg-accent-light' },
    { label: 'Actifs', icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'En n\u00e9gociation', icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'En compromis', icon: FileText, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Acheteurs ce mois', icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Biens propos\u00e9s', icon: Home, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  ],
  vendeur: [
    { label: 'Total vendeurs', icon: Home, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Actifs (mandat)', icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'En n\u00e9gociation', icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'En compromis', icon: FileText, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Vendus ce mois', icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Biens en stock', icon: Briefcase, color: 'text-rose-600', bg: 'bg-rose-50' },
  ],
  bailleur: [
    { label: 'Total bailleurs', icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Actifs (mandat)', icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Baux actifs', icon: CheckCircle, color: 'text-accent', bg: 'bg-accent-light' },
    { label: 'Locations ce mois', icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Biens en location', icon: Home, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { label: 'Revenus mensuels', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ],
  locataire: [
    { label: 'Total locataires', icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Actifs', icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'En dossier', icon: FileText, color: 'text-accent', bg: 'bg-accent-light' },
    { label: 'Baux sign\u00e9s', icon: CheckCircle, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Locataires install\u00e9s', icon: UserCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Biens propos\u00e9s', icon: Home, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  ],
  voyageur: [
    { label: 'Total voyageurs', icon: Sun, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Actifs', icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'R\u00e9servations confirm\u00e9es', icon: CheckCircle, color: 'text-accent', bg: 'bg-accent-light' },
    { label: 'S\u00e9jour en cours', icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'S\u00e9jours termin\u00e9s ce mois', icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
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

  useEffect(() => {
    api.get<any[]>('/admin/users').then(setUsers).catch(() => {});
    api.get<any>('/auth/me').then(u => {
      setCurrentUser(u);
      if (u) setIsGerant(u.role === 'gerant');
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuTarget(null);
    };
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

  useEffect(() => {
    fetchClients()
      .then(data => setApiClients(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const state = location.state as any;
    if (state?.editingClient) {
      setEditingClient(state.editingClient);
      setIsModalOpen(true);
      window.history.replaceState({}, '');
    }
    if (sessionStorage.getItem('openNewClientModal') === '1') {
      sessionStorage.removeItem('openNewClientModal');
      const contactId = sessionStorage.getItem('selectedContactId') || undefined;
      if (contactId) sessionStorage.removeItem('selectedContactId');
      setSelectedContactId(contactId);
      setIsModalOpen(true);
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
    return users
      .filter((u: any) => u.status !== 'supprimé')
      .map((user: any) => {
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
      total: sum(s => s.total),
      actifs: sum(s => s.actifs),
      enNegoc: sum(s => s.enNegoc),
      enCompromis: sum(s => s.enCompromis),
      vendusAchetes: sum(s => s.vendusAchetes),
      proposesStock: sum(s => s.proposesStock),
      bauxActifs: sum(s => s.bauxActifs),
      locations: sum(s => s.locations),
      enLocation: sum(s => s.enLocation),
      enDossier: sum(s => s.enDossier),
      bauxSignes: sum(s => s.bauxSignes),
      installes: sum(s => s.installes),
      reservations: sum(s => s.reservations),
      sejourEnCours: sum(s => s.sejourEnCours),
      sejoursTermines: sum(s => s.sejoursTermines),
      revenus: sum(s => s.revenus),
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
    ...users.filter((u: any) => u.role === 'agent').map((u: any) => ({ value: String(u.id), label: `${u.first_name || ''} ${u.last_name || ''}`.trim() })),
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

  const handleDelete = async () => {
    if (deleteConfirm !== 'SUPPRIMER' || !actionClient) return;
    const typeName = (actionClient as any).type || 'Client';
    try {
      await deleteClient(String(actionClient.id));
      const updated = await api.get<AdminClient[]>('/clients');
      setApiClients(Array.isArray(updated) ? updated : []);
      toast('success', `${typeName} supprimé`);
    } catch (err) {
      console.error('Failed to delete client:', err);
      toast('error', `Erreur lors de la suppression du ${typeName.toLowerCase()}`);
    }
    setShowDeleteDialog(false);
    setDeleteConfirm('');
    setDeleteReason('');
    setActionClient(null);
  };

  const handleStatusChange = () => {
    setShowStatusDialog(false);
    setNewStatus('');
  };

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
      toast('success', `${typeName} ajout\u00e9 avec succ\u00e8s`);
    } catch (err) {
      console.error('Failed to create client:', err);
      toast('error', `Erreur lors de la cr\u00e9ation du ${typeName.toLowerCase()}`);
    }
    setIsModalOpen(false);
    setEditingClient(null);
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
            clientPrenom: prenom,
            clientNom: nom,
            clientType: (editingClient.type || 'Vendeur').toLowerCase(),
            mandatType: (clientData as any).typeMandat || 'Mandat standard',
            mandatNumero: (clientData as any).numeroMandat,
            dateExpiration: newDateExpiration ? new Date(newDateExpiration).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR'),
            agentNom: getAgentName(editingClient.agentId || ''),
            agentEmail: agentUser?.email || undefined,
            bienConcerneId: (editingClient as any).bienConcerneId || (clientData as any).bienConcerneId,
            agentId: editingClient.agentId,
          })
        } catch (e) {
          console.error('triggerMandatExpireNotification failed:', e)
        }
      }

      toast('success', `${typeName} modifi\u00e9 avec succ\u00e8s`);
    } catch (err) {
      console.error('Failed to update client:', err);
      toast('error', `Erreur lors de la modification du ${typeName.toLowerCase()}`);
    }
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const assignmentInfo = useMemo(() => {
    if (!selectedAgent) return undefined;
    const person = findPerson(selectedAgent);
    if (!person) return undefined;
    return {
      assignedType: person.role === 'agent' ? 'agent' as const : 'admin' as const,
      assignedName: person.name,
    };
  }, [selectedAgent]);

  useEffect(() => {
    if (resumeDraftId) {
      setShowAssignModal(false);
      setIsModalOpen(true);
    }
  }, [resumeDraftId]);

  return (
    <div className="space-y-6 animate-fade-in">
      <BackLink to="/admin/clients" className="mb-2" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${isGerant && (type || '') === 'acheteur' ? 'bg-[#E7D5D5] text-[#905D5D]' : (typeBgMap[type || ''] || 'bg-accent-light') + ' ' + (typeColorMap[type || ''] || 'text-accent')} flex-shrink-0 hidden sm:flex`}>
            {typeIconMap[type || ''] || <Users size={22} />}
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Clients - {typeLabel}</h1>
            <p className="text-sm text-text-secondary mt-1">
              {typeSummary}
            </p>
          </div>
        </div>
        <AddClientButton onClick={() => { setShowAssignModal(true); setAssignStep('choose'); }} isGerant={isGerant} />
      </div>

      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Rechercher par nom, telephone ou email..."
            className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 ${isGerant ? 'focus:ring-[#905D5D]/20 focus:border-[#905D5D]' : 'focus:ring-accent/20 focus:border-accent'} transition-all"
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
                <Select options={statusOptions} value={statusFilter} onValueChange={setStatusFilter} placeholder="Statut" />
                <Select options={agentOptions} value={agentFilter} onValueChange={(v) => setAgentFilter(v)} placeholder="Agent" />
                <Select options={mandatStatusOptions} value={mandatStatutFilter} onValueChange={setMandatStatutFilter} placeholder="Mandat" />
                <Select options={cityOptions} value={cityFilter} onValueChange={setCityFilter} placeholder="Secteur" />
                <Select options={dateRangeOptions} value={dateRange} onValueChange={setDateRange} placeholder="Date de creation" />
                <div className="flex items-center gap-2">
                  <input type="number" placeholder="Budget min" className={`w-full h-9 px-3 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 ${isGerant ? 'focus:ring-[#905D5D]/20 focus:border-[#905D5D]' : 'focus:ring-accent/20 focus:border-accent'} transition-all`} value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} />
                  <span className="text-text-secondary/40 text-xs">-</span>
                  <input type="number" placeholder="Budget max" className={`w-full h-9 px-3 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 ${isGerant ? 'focus:ring-[#905D5D]/20 focus:border-[#905D5D]' : 'focus:ring-accent/20 focus:border-accent'} transition-all`} value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} />
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI Cards */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className={`w-1 h-5 rounded-full ${isGerant ? 'bg-[#905D5D]' : 'bg-accent'}`} />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">Indicateurs {typeLabel.toLowerCase()}</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {(typeKpiConfig[type || ''] || []).map((kpi, i) => {
            const Icon = kpi.icon;
            const resolvedKpi = isGerant && (kpi.label === 'Baux actifs' || kpi.label === 'En dossier' || kpi.label === 'Réservations confirmées')
              ? { ...kpi, color: 'text-[#905D5D]', bg: 'bg-[#E7D5D5]' }
              : kpi;
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
                  <div className={`p-2 rounded-lg ${resolvedKpi.bg}`}>
                    <Icon size={14} className={resolvedKpi.color} />
                  </div>
                </div>
                <p className="text-2xl font-bold">{kpiValues[i] ?? 0}</p>
                <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600">
                  <ArrowUp size={12} />
                  <span>+0%</span>
                  <span className="text-text-secondary/50 ml-1">vs mois dernier</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

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
                {type === 'acheteur' && (<>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Total</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Actifs</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">En négoc.</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">En compromis</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Achetés</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Proposés</th>
                </>)}
                {type === 'vendeur' && (<>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Total</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Actifs</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">En négoc.</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">En compromis</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Vendus</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">En stock</th>
                </>)}
                {type === 'bailleur' && (<>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Total</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Actifs</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Baux actifs</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Locations</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">En location</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Revenus</th>
                </>)}
                {type === 'locataire' && (<>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Total</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Actifs</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">En dossier</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Baux signés</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Installés</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Proposés</th>
                </>)}
                {type === 'voyageur' && (<>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Total</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Actifs</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Réservations</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Séjour en cours</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Séjours terminés</th>
                </>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {statsByAgent.map(({ user, s }: any) => {
                  const userId = String(user.id);
                  const initials = `${(user.first_name || '')[0]}${(user.last_name || '')[0]}`.toUpperCase() || '?';
                  const color = COLORS[Math.abs(Number(user.id) || userId.length) % COLORS.length];
                  const name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
                  const badge = getRoleBadge({ role: user.role, position: user.position });
                  return (
                    <tr key={userId} className="hover:bg-background/50 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full ${color} flex items-center justify-center text-white text-[10px] font-bold`}>
                            {initials}
                          </div>
                          <span className="text-sm font-medium">{name}</span>
                          {badge && (
                            <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold rounded-full uppercase tracking-wider ${badge.cls}`}>
                              {badge.label}
                            </span>
                          )}
                        </div>
                      </td>
                      {type === 'acheteur' && (<>
                        <td className="text-center px-4 py-2.5 font-semibold">{s.total || 0}</td>
                        <td className="text-center px-4 py-2.5">{s.actifs || 0}</td>
                        <td className="text-center px-4 py-2.5">{s.enNegoc || 0}</td>
                        <td className="text-center px-4 py-2.5">{s.enCompromis || 0}</td>
                        <td className="text-center px-4 py-2.5">{s.vendusAchetes || 0}</td>
                        <td className="text-center px-4 py-2.5">{s.proposesStock || 0}</td>
                      </>)}
                      {type === 'vendeur' && (<>
                        <td className="text-center px-4 py-2.5 font-semibold">{s.total || 0}</td>
                        <td className="text-center px-4 py-2.5">{s.actifs || 0}</td>
                        <td className="text-center px-4 py-2.5">{s.enNegoc || 0}</td>
                        <td className="text-center px-4 py-2.5">{s.enCompromis || 0}</td>
                        <td className="text-center px-4 py-2.5">{s.vendusAchetes || 0}</td>
                        <td className="text-center px-4 py-2.5">{s.proposesStock || 0}</td>
                      </>)}
                      {type === 'bailleur' && (<>
                        <td className="text-center px-4 py-2.5 font-semibold">{s.total || 0}</td>
                        <td className="text-center px-4 py-2.5">{s.actifs || 0}</td>
                        <td className="text-center px-4 py-2.5">{s.bauxActifs || 0}</td>
                        <td className="text-center px-4 py-2.5">{s.locations || 0}</td>
                        <td className="text-center px-4 py-2.5">{s.enLocation || 0}</td>
                        <td className="text-center px-4 py-2.5">{s.revenus ? `${s.revenus} €` : '0 €'}</td>
                      </>)}
                      {type === 'locataire' && (<>
                        <td className="text-center px-4 py-2.5 font-semibold">{s.total || 0}</td>
                        <td className="text-center px-4 py-2.5">{s.actifs || 0}</td>
                        <td className="text-center px-4 py-2.5">{s.enDossier || 0}</td>
                        <td className="text-center px-4 py-2.5">{s.bauxSignes || 0}</td>
                        <td className="text-center px-4 py-2.5">{s.installes || 0}</td>
                        <td className="text-center px-4 py-2.5">{s.proposesStock || 0}</td>
                      </>)}
                      {type === 'voyageur' && (<>
                        <td className="text-center px-4 py-2.5 font-semibold">{s.total || 0}</td>
                        <td className="text-center px-4 py-2.5">{s.actifs || 0}</td>
                        <td className="text-center px-4 py-2.5">{s.reservations || 0}</td>
                        <td className="text-center px-4 py-2.5">{s.sejourEnCours || 0}</td>
                        <td className="text-center px-4 py-2.5">{s.sejoursTermines || 0}</td>
                      </>)}
                    </tr>
                  );
                })}
              {/* Total row */}
              <tr className="bg-background/30 font-semibold">
                <td className="px-4 py-2.5 text-sm">TOTAL</td>
                {type === 'acheteur' && (<>
                  <td className="text-center px-4 py-2.5">{tableTotals.total}</td>
                  <td className="text-center px-4 py-2.5">{tableTotals.actifs}</td>
                  <td className="text-center px-4 py-2.5">{tableTotals.enNegoc}</td>
                  <td className="text-center px-4 py-2.5">{tableTotals.enCompromis}</td>
                  <td className="text-center px-4 py-2.5">{tableTotals.vendusAchetes}</td>
                  <td className="text-center px-4 py-2.5">{tableTotals.proposesStock}</td>
                </>)}
                {type === 'vendeur' && (<>
                  <td className="text-center px-4 py-2.5">{tableTotals.total}</td>
                  <td className="text-center px-4 py-2.5">{tableTotals.actifs}</td>
                  <td className="text-center px-4 py-2.5">{tableTotals.enNegoc}</td>
                  <td className="text-center px-4 py-2.5">{tableTotals.enCompromis}</td>
                  <td className="text-center px-4 py-2.5">{tableTotals.vendusAchetes}</td>
                  <td className="text-center px-4 py-2.5">{tableTotals.proposesStock}</td>
                </>)}
                {type === 'bailleur' && (<>
                  <td className="text-center px-4 py-2.5">{tableTotals.total}</td>
                  <td className="text-center px-4 py-2.5">{tableTotals.actifs}</td>
                  <td className="text-center px-4 py-2.5">{tableTotals.bauxActifs}</td>
                  <td className="text-center px-4 py-2.5">{tableTotals.locations}</td>
                  <td className="text-center px-4 py-2.5">{tableTotals.enLocation}</td>
                  <td className="text-center px-4 py-2.5">{tableTotals.revenus ? `${tableTotals.revenus} €` : '0 €'}</td>
                </>)}
                {type === 'locataire' && (<>
                  <td className="text-center px-4 py-2.5">{tableTotals.total}</td>
                  <td className="text-center px-4 py-2.5">{tableTotals.actifs}</td>
                  <td className="text-center px-4 py-2.5">{tableTotals.enDossier}</td>
                  <td className="text-center px-4 py-2.5">{tableTotals.bauxSignes}</td>
                  <td className="text-center px-4 py-2.5">{tableTotals.installes}</td>
                  <td className="text-center px-4 py-2.5">{tableTotals.proposesStock}</td>
                </>)}
                {type === 'voyageur' && (<>
                  <td className="text-center px-4 py-2.5">{tableTotals.total}</td>
                  <td className="text-center px-4 py-2.5">{tableTotals.actifs}</td>
                  <td className="text-center px-4 py-2.5">{tableTotals.reservations}</td>
                  <td className="text-center px-4 py-2.5">{tableTotals.sejourEnCours}</td>
                  <td className="text-center px-4 py-2.5">{tableTotals.sejoursTermines}</td>
                </>)}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Client List */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User size={14} className="text-text-secondary" />
            <span className="text-sm font-medium">Liste des clients ({filteredClients.length})</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          {filteredClients.length === 0 ? (
            <div className="p-12 text-center">
              <div className="max-w-xs mx-auto">
                <Search size={32} className="text-text-secondary/20 mx-auto mb-3" />
                <p className="text-text-secondary font-medium">Aucun client trouve</p>
                <p className="text-xs text-text-secondary/60 mt-1">
                  {clientsForType.length > 0 ? 'Essayez de modifier vos filtres' : 'Les clients apparaissent ici une fois ajoutes'}
                </p>
              </div>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Client</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Statut</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Géré par</th>
                  {type === 'acheteur' && (<>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Budget</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Financement</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Urgence</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Type bien</th>
                  </>)}
                  {type === 'vendeur' && (<>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Prix FAI</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Prix net vendeur</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Surface</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Raison vente</th>
                  </>)}
                  {type === 'bailleur' && (<>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Loyer HC</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Type loyer</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Garantie</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Disponibilite</th>
                  </>)}
                  {type === 'locataire' && (<>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Loyer max</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Situation pro</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Revenus</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Garant</th>
                  </>)}
                  {type === 'voyageur' && (<>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Dates</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Nuits</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Voyageurs</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Budget total</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Reservation</th>
                  </>)}
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {filteredClients.map((c) => {
                  const statusKey = (c.statutMetier || c.status || '').trim();
                  const badgeClass = STATUS_COLORS[statusKey] || 'bg-gray-50 text-gray-600 border-gray-200';
                  const devise = (c as any).devise || 'MAD';
                  const fmt = (n?: number) => n ? Number(n).toLocaleString('fr-FR') : '—';
                  return (
                    <tr key={c.id} className="hover:bg-background/50 transition-colors group cursor-pointer" onClick={() => navigate(`/admin/${adminId}/clients/type/${type}/${c.id}`)}>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full ${getClientColor(c.name)} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}>
                            {getClientInitials(c.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium truncate">{c.name || 'Sans nom'}</p>
                              {(c as any).originalClientId ? (
                                <span className="inline-flex items-center px-1 py-0.5 text-[8px] font-semibold rounded-full uppercase tracking-wider bg-orange-100 text-orange-700 flex-shrink-0">
                                  Copie
                                </span>
                              ) : c.id && apiClients.some((oc: any) => String(oc.originalClientId) === String(c.id)) ? (
                                <span className="inline-flex items-center px-1 py-0.5 text-[8px] font-semibold rounded-full uppercase tracking-wider bg-blue-100 text-blue-700 flex-shrink-0">
                                  Original
                                </span>
                              ) : null}
                            </div>
                            <p className="text-[11px] text-text-secondary/60">{c.phone || c.email || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${badgeClass}`}>
                          {statusKey || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        {c.agentDesigne ? (() => {
                          const person = findPerson(String(c.agentId || '')) || (c.agentDesigne ? findPerson(c.agentDesigne) : undefined);
                          const badge = getRoleBadge(person, isGerant);
                          const displayName = person ? person.name : c.agentDesigne;
                          const initials = person ? person.initials : (c.agentDesigne || 'NA').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
                          const color = person ? person.color : COLORS[Math.abs(Number(c.agentId) || 0) % COLORS.length];
                          return (
                            <div className="flex items-center gap-1.5">
                              <div className={`w-5 h-5 rounded-full ${color} flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0`}>
                                {initials}
                              </div>
                              <span className="text-xs truncate">{displayName}</span>
                              {badge && (
                                <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold rounded-full flex-shrink-0 ${badge.cls}`}>
                                  {badge.label}
                                </span>
                              )}
                            </div>
                          );
                        })() : (
                          <span className="text-xs text-text-secondary/50 italic">Non assigne</span>
                        )}
                      </td>

                      {type === 'acheteur' && (<>
                        <td className="px-4 py-2.5 text-right text-xs font-medium whitespace-nowrap">
                          {c.prixMin || c.prixMax
                            ? `${fmt(c.prixMin)}${c.prixMin && c.prixMax ? ' - ' : ''}${fmt(c.prixMax)} ${devise}`
                            : c.budget ? `${fmt(c.budget)} ${devise}` : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-xs">{(c as any).typeFinancement || '—'}</td>
                        <td className="px-4 py-2.5 text-xs">{(c as any).urgence || '—'}</td>
                        <td className="px-4 py-2.5 text-xs">{c.propertyType || '—'}</td>
                      </>)}

                      {type === 'vendeur' && (<>
                        <td className="px-4 py-2.5 text-right text-xs font-medium whitespace-nowrap">
                          {c.prixVenteFAI ? `${fmt(c.prixVenteFAI)} ${devise}` : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-right text-xs whitespace-nowrap">
                          {(c as any).prixNetVendeur ? `${fmt((c as any).prixNetVendeur)} ${devise}` : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-left text-xs whitespace-nowrap">
                          {(c as any).surfaceMax ? `${(c as any).surfaceMax} m²` : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-xs truncate max-w-[120px]">{(c as any).raisonVente || '—'}</td>
                      </>)}

                      {type === 'bailleur' && (<>
                        <td className="px-4 py-2.5 text-right text-xs font-medium whitespace-nowrap">
                          {(c as any).loyerHC ? `${fmt((c as any).loyerHC)} ${devise}/mois` : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-xs">{(c as any).typeLoyer || '—'}</td>
                        <td className="px-4 py-2.5 text-right text-xs whitespace-nowrap">
                          {(c as any).depotGarantie ? `${fmt((c as any).depotGarantie)} ${devise}` : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-xs">{(c as any).dateDisponibilite ? new Date((c as any).dateDisponibilite).toLocaleDateString('fr-FR') : '—'}</td>
                      </>)}

                      {type === 'locataire' && (<>
                        <td className="px-4 py-2.5 text-right text-xs font-medium whitespace-nowrap">
                          {c.budget ? `${fmt(c.budget)} ${devise}/mois` : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-xs">{(c as any).situationPro || '—'}</td>
                        <td className="px-4 py-2.5 text-right text-xs whitespace-nowrap">
                          {c.contribution ? `${fmt(c.contribution)} ${devise}` : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {(c as any).garant === true || (c as any).garant === 'true' ? (
                            <CheckCircle size={14} className="text-emerald-500 mx-auto" />
                          ) : (
                            <span className="text-text-secondary/40">—</span>
                          )}
                        </td>
                      </>)}

                      {type === 'voyageur' && (<>
                        <td className="px-4 py-2.5 text-xs whitespace-nowrap">
                          {(c as any).dateArrivee && (c as any).dateDepart
                            ? `${new Date((c as any).dateArrivee).toLocaleDateString('fr-FR')} - ${new Date((c as any).dateDepart).toLocaleDateString('fr-FR')}`
                            : (c as any).dateArrivee
                              ? new Date((c as any).dateArrivee).toLocaleDateString('fr-FR')
                              : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-center text-xs font-medium">
                          {(c as any).nbNuits ?? '—'}
                        </td>
                        <td className="px-4 py-2.5 text-center text-xs">
                          {(() => {
                            const adults = (c as any).nbAdultes;
                            const kids = (c as any).nbEnfants;
                            if (!adults && !kids) return '—';
                            const parts: string[] = [];
                            if (adults) parts.push(`${adults} adulte${adults > 1 ? 's' : ''}`);
                            if (kids) parts.push(`${kids} enfant${kids > 1 ? 's' : ''}`);
                            return parts.join(', ');
                          })()}
                        </td>
                        <td className="px-4 py-2.5 text-right text-xs font-medium whitespace-nowrap">
                          {(() => {
                            const total = (c as any).budgetTotal || c.budget;
                            return total ? `${fmt(total)} ${devise}` : '—';
                          })()}
                        </td>
                        <td className="px-4 py-2.5 text-xs">
                          {(c as any).statutReservation || (c as any).numeroReservation || '—'}
                        </td>
                      </>)}

                      <td className="px-4 py-2.5 text-center">
                        <button
                          className="p-1.5 rounded-lg hover:bg-background text-text-secondary hover:text-text transition-all opacity-0 group-hover:opacity-100"
                          onClick={(e) => { e.stopPropagation(); setMenuTarget(menuTarget?.client.id === c.id ? null : { client: c as AdminClient, bounds: e.currentTarget.getBoundingClientRect() }); }}
                        >
                          <MoreVertical size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>

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
                  onClick={() => { setMenuTarget(null); navigate(`/admin/${adminId}/clients/type/${type}/${client.id}`); }}
                >
                  <Eye size={14} /> Voir la fiche complete
                </button>
                <button
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-background transition-colors text-left"
                  onClick={() => { setMenuTarget(null); setEditingClient(client); setIsModalOpen(true); }}
                >
                  <Edit3 size={14} /> Modifier
                </button>
                <button
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-background transition-colors text-left"
                  onClick={async () => {
                    setMenuTarget(null);
                    try {
                      const duplicated = await duplicateClient(String(client.id));
                      const updated = await fetchClients();
                      setApiClients(Array.isArray(updated) ? updated : []);
                      toast('success', `${client.name || 'Client'} dupliqu\u00e9 avec succ\u00e8s`);
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
                  onClick={() => {
  setMenuTarget(null);
  setActionClient(client);
  const rawId = String((client as any).agentId || '');
  const matchedUser = users.find((u: any) => String(u.id) === rawId)
    || users.find((u: any) => {
      const full = `${u.first_name || ''} ${u.last_name || ''}`.trim();
      return full.toLowerCase() === rawId.toLowerCase();
    });
  setSelectedAgent(matchedUser ? String(matchedUser.id) : '');
  setShowReassignDialog(true);
}}
                >
                  <Repeat size={14} /> Reaffecter a un agent
                </button>
                <div className="border-t border-border/40 my-1" />
                <button
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-error hover:bg-error/5 transition-colors text-left"
                  onClick={() => { setMenuTarget(null); setActionClient(client); setDeleteConfirm(''); setDeleteReason(''); setShowDeleteDialog(true); }}
                >
                  <Trash2 size={14} /> Supprimer
                </button>
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>

      {/* Reassign Dialog */}
      <Dialog isOpen={showReassignDialog} onClose={() => setShowReassignDialog(false)} title="Reaffecter un client" size="lg">
        {actionClient && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-background border border-border/50">
              <p className="text-sm font-medium">{actionClient.name}</p>
              <p className="text-xs text-text-secondary">{actionClient.type} · {actionClient.phone}</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-1.5">Responsable actuel :</p>
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
              <label className="text-sm font-medium mb-1.5 block">Nouvel responsable</label>
              <Select
                placeholder="Selectionner un responsable"
                value={selectedAgent}
                onValueChange={(v) => setSelectedAgent(v)}
                options={users.map((u: any) => ({
                  value: String(u.id),
                  label: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
                }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Note pour le responsable</label>
              <textarea
                className={`w-full h-20 px-3 py-2 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 ${isGerant ? 'focus:ring-[#905D5D]/20 focus:border-[#905D5D]' : 'focus:ring-accent/20 focus:border-accent'} transition-all resize-none`}
                placeholder="Je vous confie ce client pour le suivi..."
                value={reassignNote}
                onChange={(e) => setReassignNote(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                className={`w-4 h-4 rounded border-border ${isGerant ? 'accent-[#905D5D] focus:ring-[#905D5D]/20' : 'text-accent focus:ring-accent/20'}`}
                checked={sendNotification}
                onChange={(e) => setSendNotification(e.target.checked)}
              />
              Envoyer une notification au nouveau responsable
            </label>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowReassignDialog(false)}>Annuler</Button>
              <Button variant="default" className={isGerant ? GERANT_BUTTON_CLASSES : ''} onClick={handleReassign} disabled={!selectedAgent}>Reaffecter</Button>
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
                className={`w-full h-10 px-3 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 ${isGerant ? 'focus:ring-[#905D5D]/20 focus:border-[#905D5D]' : 'focus:ring-accent/20 focus:border-accent'} transition-all`}
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
                className={`w-full h-10 px-3 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 ${isGerant ? 'focus:ring-[#905D5D]/20 focus:border-[#905D5D]' : 'focus:ring-accent/20 focus:border-accent'} transition-all`}
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
              <Button variant="default" className={isGerant ? GERANT_BUTTON_CLASSES : ''} onClick={handleStatusChange} disabled={newStatus === (actionClient.statutMetier || actionClient.status)}>
                Changer le statut
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Attribution du client" size="sm">
        {assignStep === 'choose' ? (
          <div className="space-y-3">
            <p className="text-sm text-text-secondary mb-4">Souhaitez-vous confier ce client à un agent, un admin ou le gérer vous-même ?</p>
            <button
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border/40 bg-background/50 hover:bg-background hover:border-accent/30 transition-all text-left group"
              onClick={() => setAssignStep('agent')}
            >
              <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-500 group-hover:scale-105 transition-transform">
                <Users size={16} />
              </div>
              <div>
                <div className="text-sm font-medium text-text">Confier à un agent</div>
                <div className="text-xs text-text-secondary">Le client sera rattaché à un agent immobilier</div>
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
                <div className="text-xs text-text-secondary">Le client sera géré par un autre administrateur</div>
              </div>
            </button>
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/30" /></div>
              <div className="relative flex justify-center"><span className="bg-card px-3 text-xs text-text-secondary/50">ou</span></div>
            </div>
            <button
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left group ${isGerant ? 'border-[#905D5D]/20 bg-[#905D5D]/5 hover:bg-[#905D5D]/10 hover:border-[#905D5D]/30' : 'border-accent/20 bg-accent/5 hover:bg-accent/10 hover:border-accent/30'}`}
              onClick={() => { setShowAssignModal(false); setSelectedAgent(currentUser ? String(currentUser.id) : ''); setIsModalOpen(true); }}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D]' : 'bg-accent/10 text-accent'}`}>
                <User size={16} />
              </div>
              <div>
                <div className={`text-sm font-medium ${isGerant ? 'text-[#905D5D]' : 'text-accent'}`}>Je gère moi-même</div>
                <div className="text-xs text-text-secondary">Ajouter le client directement en tant qu'admin</div>
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
                ? users.filter(u => u.role === 'agent').map(u => ({
                    id: String(u.id), name: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
                    initials: `${(u.first_name || '')[0]}${(u.last_name || '')[0]}`.toUpperCase() || '?',
                    color: COLORS[Math.abs(Number(u.id) || u.id.length) % COLORS.length],
                  }))
                : users.filter(u => (u.role === 'admin' || u.role === 'gerant') && String(u.id) !== String(currentUser?.id)).map(u => ({
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

      {/* Add/Edit Client Modal */}
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
        <ClientDraftSection
          key={draftVersion}
          userId={String(currentUser.id)}
          clientType={clientTypeKey[type || '']}
          onResume={(draft) => setResumeDraftId(draft.id)}
          isGerant={isGerant}
        />
      )}
    </div>
  );
}
