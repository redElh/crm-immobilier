import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { Prospect } from '../../../types/prospect';
import {
  ArrowLeft, Heart, Edit3, Share2, Trash2, Phone, Calendar, Award,
  XOctagon, ExternalLink, Mail, Globe, Tag, Home, Layers,
  MessageSquare, MapPin, Grid, Maximize2, DollarSign, Eye, Sliders, Clock,
  User, Briefcase, FileText, Users, UserPlus, Shield, Link as LinkIcon,
  Repeat, RefreshCw, AlertTriangle, Copy, Check,
} from 'react-feather';
import { QualificationFormModal } from '../../../components/modules/prospects/QualificationFormModal';
import { ProspectFormModal } from '../../../components/modules/prospects/ProspectFormModal';
import { ReminderModal } from '../../../components/modules/prospects/ReminderModal';
import { ActionChoiceModal } from '../../../components/modules/prospects/ActionChoiceModal';
import StageModal, { useStageModalButtons } from '../../../components/modules/calendar/StageModal';
import { QualificationPocket } from '../../../components/modules/prospects/QualificationPocket';
import { ProspectHeader } from '../../../components/modules/prospects/ProspectHeader';
import {
  ProspectTabsShell, StageField, StageSection, StageEmpty, useProspectAccent,
  prospectPrimaryStyle, stagePillStyle,
} from '../../../components/modules/prospects/ProspectDetailStage';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../../components/ui/Toast';
import { ContactFormModal } from '../../../components/modules/contacts/ContactFormModal';
import { createContact } from '../../../services/contactService';
import {
  fetchProspectById, updateProspect, deleteProspect as apiDeleteProspect,
  updateProspectStatus, scheduleReminder, updateReminder, cancelReminder, duplicateProspect,
} from '../../../services/prospectService';
import { api } from '../../../services/api';
import { useStageTheme, STAGE_HUES, type StageHue } from '../../../components/dashboard/Stage';
import { cn } from '../../../lib/utils';

const TABS = [
  { id: 1, label: 'Aperçu', slug: 'apercu' },
  { id: 2, label: 'Critères', slug: 'criteres' },
  { id: 3, label: 'Suivi', slug: 'suivi' },
];

const STATUS_OPTIONS = [
  { value: 'Nouveau', label: 'Nouveau' },
  { value: 'Contacté', label: 'Contacté' },
  { value: 'Qualifié', label: 'Qualifié' },
  { value: 'En attente', label: 'En attente' },
  { value: 'Perdu', label: 'Perdu' },
  { value: 'Converti', label: 'Converti' },
];

const DANGER_HUE: StageHue = {
  a: '#FB7185', b: '#E11D48', glow: 'rgba(244,63,94,0.45)', line: '#F43F5E',
};

const STATUS_HUES: Record<string, StageHue> = {
  Nouveau: STAGE_HUES.sky,
  'Contacté': STAGE_HUES.amber,
  'Qualifié': STAGE_HUES.emerald,
  'En attente': STAGE_HUES.fuchsia,
  Perdu: DANGER_HUE,
  Converti: STAGE_HUES.violet,
};

function ProspectSummaryCard({ prospect }: { prospect: Prospect }) {
  const theme = useStageTheme();
  const isDark = theme === 'dark';
  const { accent } = useProspectAccent();
  const initials = `${(prospect.firstName || '')[0] || ''}${(prospect.lastName || '')[0] || ''}`.toUpperCase() || '?';

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl border p-3.5 backdrop-blur-sm',
        isDark
          ? 'border-white/[0.08] bg-white/[0.03]'
          : 'border-slate-200/70 bg-white/70 shadow-[0_1px_2px_rgba(15,23,42,0.05)]',
      )}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-white"
        style={{ background: `linear-gradient(145deg, ${accent.a}, ${accent.b})`, boxShadow: `0 6px 18px -6px ${accent.glow}` }}
      >
        {initials}
      </div>
      <div className="min-w-0">
        <p className={cn('truncate text-sm font-extrabold', isDark ? 'text-white' : 'text-slate-900')}>
          {prospect.civility} {prospect.firstName} {prospect.lastName}
        </p>
        <p className={cn('truncate text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>
          {prospect.email} · {prospect.phone}
        </p>
      </div>
    </div>
  );
}

const COLORS = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500', 'bg-cyan-500', 'bg-pink-500'];

const fmtDate = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const fmtDateTime = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function AdminProspectDetailPage() {
  const { id, adminId } = useParams<{ id: string; adminId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const theme = useStageTheme();
  const isDark = theme === 'dark';
  const { accent, ink } = useProspectAccent();
  const canWrite = true;
  const btns = useStageModalButtons();

  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQualificationModal, setShowQualificationModal] = useState(false);
  const [liked, setLiked] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [qualifiedRefresh, setQualifiedRefresh] = useState(0);
  const [showActionChoice, setShowActionChoice] = useState(false);
  const [showEditReminder, setShowEditReminder] = useState(false);

  const [users, setUsers] = useState<any[]>([]);
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [reassignNote, setReassignNote] = useState('');

  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTabState] = useState(() => TABS.find(t => t.slug === searchParams.get('tab'))?.id || 1);
  const setActiveTab = useCallback((tabId: number) => {
    setActiveTabState(tabId);
    const slug = TABS.find(t => t.id === tabId)?.slug;
    if (slug) setSearchParams(prev => { prev.set('tab', slug); return prev; }, { replace: true });
  }, [setSearchParams]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      fetchProspectById(id),
      api.get<any[]>('/admin/users').catch(() => []),
    ]).then(([p, u]) => {
      setProspect(p);
      setUsers(u);
    }).catch(() => toast('error', 'Erreur lors du chargement du prospect')).finally(() => setLoading(false));
  }, [id, toast]);

  const findPerson = (agentId: string | number | null | undefined) => {
    if (!agentId) return undefined;
    const sid = String(agentId);
    const user = users.find(u => String(u.id) === sid && u.status !== 'supprimé');
    if (user) {
      const initials = `${(user.first_name || '')[0]}${(user.last_name || '')[0]}`.toUpperCase() || '?';
      const color = COLORS[Math.abs(Number(user.id) || user.id.length) % COLORS.length];
      return { name: `${user.first_name || ''} ${user.last_name || ''}`.trim(), initials, color, role: user.role, position: user.position };
    }
    return undefined;
  };

  const getAgentName = (agentId: string | number | null | undefined) => {
    if (!agentId) return 'Non assigné';
    const person = findPerson(agentId);
    return person ? person.name : 'Ancien responsable';
  };

  const getAgentInitials = (agentId: string | number | null | undefined) => {
    if (!agentId) return 'NA';
    const person = findPerson(agentId);
    return person ? person.initials : String(agentId).slice(0, 2).toUpperCase();
  };

  const getRoleBadge = (person?: { role?: string; position?: string }): { label: string; hue: StageHue } | null => {
    if (!person) return null;
    if (person.role === 'agent') return { label: person.position || 'Agent', hue: STAGE_HUES.emerald };
    if (person.role === 'gerant') return { label: 'Gérant', hue: STAGE_HUES.amber };
    if (person.role === 'admin') return { label: 'Admin', hue: STAGE_HUES.violet };
    return null;
  };

  const handleReassign = async () => {
    if (!prospect || !selectedAgent) return;
    try {
      await updateProspect(String(prospect.id), { agentId: selectedAgent } as any);
      setProspect({ ...prospect, agentId: Number(selectedAgent) } as any);
      toast('success', 'Prospect réaffecté avec succès');
    } catch (err: any) {
      toast('error', err.message || 'Erreur lors de la réaffectation');
    }
    setShowReassignDialog(false);
    setSelectedAgent('');
    setReassignNote('');
  };

  const handleDelete = async () => {
    if (deleteConfirm !== 'SUPPRIMER' || !prospect) return;
    try {
      await apiDeleteProspect(String(prospect.id));
      toast('success', 'Prospect supprimé avec succès');
      navigate(`/admin/${adminId}/prospects`);
    } catch (err: any) {
      toast('error', err.message || 'Erreur lors de la suppression');
    }
    setShowDeleteDialog(false);
    setDeleteConfirm('');
    setDeleteReason('');
  };

  const handleAdminStatusChange = async () => {
    if (!prospect || !newStatus || newStatus === prospect.status) return;
    try {
      const opts = newStatus === 'Qualifié'
        ? { qualificationData: { previousStatus: prospect.status } }
        : undefined;
      const updated = await updateProspectStatus(String(prospect.id), newStatus as Prospect['status'], opts);
      setProspect(updated);
      if (newStatus === 'Qualifié') setQualifiedRefresh(c => c + 1);
      toast('success', 'Statut modifié avec succès');
    } catch (err: any) {
      toast('error', err.message || 'Erreur lors du changement de statut');
    }
    setShowStatusDialog(false);
  };

  const handleDuplicate = async () => {
    if (!prospect) return;
    try {
      await duplicateProspect(String(prospect.id));
      toast('success', `${prospect.firstName} ${prospect.lastName} dupliqué`);
      navigate(`/admin/${adminId}/prospects`);
    } catch (err: any) {
      toast('error', err.message || 'Erreur lors de la duplication');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="relative flex h-12 w-12 items-center justify-center">
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full"
            style={{ background: isDark ? 'rgba(244,63,94,0.2)' : 'rgba(249,115,22,0.25)' }}
          />
          <span
            className="relative inline-flex h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: isDark ? 'rgba(244,63,94,0.8)' : 'rgba(249,115,22,0.8)', borderTopColor: 'transparent' }}
          />
        </div>
      </div>
    );
  }

  if (!prospect) {
    return (
      <div className="py-12 text-center">
        <p className="text-text-secondary">Prospect non trouvé</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate(`/admin/${adminId}/prospects`)}>Retour aux prospects</Button>
      </div>
    );
  }

  const person = findPerson(prospect.agentId);
  const roleBadge = getRoleBadge(person);

  const handleQualify = async (data: any) => {
    if (!id || !prospect) return;
    try {
      const updated = await updateProspectStatus(id, 'Qualifié', {
        qualificationData: { previousStatus: prospect.status, ...data },
      });
      setProspect(updated);
      setShowQualificationModal(false);
      setQualifiedRefresh(c => c + 1);
      toast('success', 'Prospect qualifié avec succès');
    } catch {
      toast('error', 'Erreur lors de la qualification');
    }
  };

  const handleUpdateProspect = async (data: Omit<Prospect, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!id) return;
    try {
      const updated = await updateProspect(id, data);
      setProspect(updated);
      setShowEditModal(false);
      toast('success', 'Prospect modifié avec succès');
    } catch {
      toast('error', 'Erreur lors de la modification du prospect');
    }
  };

  const handleStatusChange = async (status: Prospect['status']) => {
    if (!id || !prospect) return;
    try {
      const opts = status === 'Qualifié'
        ? { qualificationData: { previousStatus: prospect.status } }
        : undefined;
      const updated = await updateProspectStatus(id, status, opts);
      setProspect(updated);
      if (status === 'Qualifié') setQualifiedRefresh(c => c + 1);
      toast('success', `Statut changé en "${status}"`);
    } catch {
      toast('error', 'Erreur lors du changement de statut');
    }
  };

  const handleStatusReverted = (updated: Prospect) => {
    setProspect(updated);
  };

  const handleReminderConfirm = async (reminderDate: string, reminderNote: string) => {
    if (!id) return;
    try {
      const updated = await scheduleReminder(id, reminderDate, reminderNote);
      setProspect(updated);
      setShowReminderModal(false);
      toast('success', 'Rappel programmé');
    } catch {
      toast('error', 'Erreur lors de la programmation du rappel');
    }
  };

  const handleEditReminderSubmit = async (reminderDate: string, reminderNote: string) => {
    if (!id) return;
    try {
      const updated = await updateReminder(id, reminderDate, reminderNote);
      setProspect(updated);
      setShowEditReminder(false);
      toast('success', 'Rappel mis à jour');
    } catch {
      toast('error', 'Erreur lors de la mise à jour du rappel');
    }
  };

  const handleCancelReminder = async () => {
    if (!id) return;
    try {
      const updated = await cancelReminder(id);
      setProspect(updated);
      setShowEditReminder(false);
      toast('success', 'Rappel supprimé — retour au statut "Contacté"');
    } catch {
      toast('error', 'Erreur lors de la suppression du rappel');
    }
  };

  const handleConvertSubmit = async (data: any) => {
    if (!prospect) return;
    try {
      const merged = {
        ...prospect.qualificationData,
        ...data,
        firstName: prospect.firstName,
        lastName: prospect.lastName,
        civility: prospect.civility,
        mobile: prospect.phone,
        emailPrincipal: prospect.email,
        langueParlee: prospect.spokenLanguage ? [prospect.spokenLanguage] : [],
        devisePreferee: prospect.currency || 'MAD',
        ville: prospect.location || '',
        commentairePrive: `[Prospect #${prospect.id}] ${prospect.message || ''}`,
        originalProspectId: prospect.id,
      };
      const created = await createContact(merged);
      const updated = await updateProspectStatus(prospect.id, 'Converti', { contactId: created.id });
      setProspect(updated);
      setShowConvertModal(false);
      setQualifiedRefresh(c => c + 1);
      toast('success', 'Prospect converti en contact avec succès');
    } catch {
      toast('error', 'Erreur lors de la conversion');
    }
  };

  const devise = prospect.currency || 'MAD';

  const primaryBtn = 'inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-xs font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95';
  const glassBtn = `inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold backdrop-blur-md transition-all duration-200 hover:scale-[1.02] active:scale-95 ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10 hover:text-white' : 'border-slate-200/80 bg-white/70 text-slate-600 shadow-sm hover:bg-white hover:text-slate-900'}`;
  const roseBtn = `inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold backdrop-blur-md transition-all duration-200 hover:scale-[1.02] active:scale-95 ${isDark ? 'border-rose-400/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:text-rose-200' : 'border-rose-200/80 bg-rose-50/70 text-rose-600 shadow-sm hover:bg-rose-50 hover:text-rose-700'}`;
  const emeraldBtn = `inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold backdrop-blur-md transition-all duration-200 hover:scale-[1.02] active:scale-95 ${isDark ? 'border-emerald-300/30 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20' : 'border-emerald-200 bg-emerald-50/80 text-emerald-700 hover:bg-emerald-50'}`;
  const adminBtn = `inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-bold backdrop-blur-md transition-all duration-200 hover:scale-[1.02] active:scale-95 ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10 hover:text-white' : 'border-slate-200/80 bg-white/70 text-slate-600 shadow-sm hover:bg-white hover:text-slate-900'}`;
  const adminDangerBtn = `inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-bold backdrop-blur-md transition-all duration-200 hover:scale-[1.02] active:scale-95 ${isDark ? 'border-rose-400/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:text-rose-200' : 'border-rose-200/80 bg-rose-50/70 text-rose-600 shadow-sm hover:bg-rose-50 hover:text-rose-700'}`;

  const qd = (prospect.qualificationData || {}) as Record<string, any>;
  const qv = (key: string): string | null => {
    const v = qd[key];
    if (v === undefined || v === null || v === '') return null;
    return String(v);
  };
  const fmtQDate = (v: string) => {
    const d = new Date(v);
    return isNaN(d.getTime()) ? v : d.toLocaleDateString('fr-FR');
  };

  const qualFields = [
    { icon: User, label: 'Type de contact', value: qv('type') },
    { icon: Briefcase, label: 'Profession', value: qv('profession') },
    { icon: MapPin, label: 'Lieu de naissance', value: qv('lieuNaissance') },
    { icon: Calendar, label: 'Date de naissance', value: qv('dateNaissance') ? fmtQDate(qv('dateNaissance')!) : null },
    { icon: Globe, label: 'Nationalité', value: qv('nationalite') },
    { icon: FileText, label: 'N° fiscal', value: qv('numeroFiscal') },
    { icon: Mail, label: 'Email secondaire', value: qv('emailSecondaire') },
    { icon: Phone, label: 'Télécopie', value: qv('telephoneFixe') },
    { icon: Heart, label: 'Situation familiale', value: qv('situationFamiliale') },
    { icon: Users, label: "Nombre d'enfants", value: qv('nombreEnfants') },
    { icon: Shield, label: 'Régime matrimonial', value: qv('regimeMatrimonial') },
    { icon: UserPlus, label: 'Prescripteur', value: qv('prescripteur') },
    { icon: DollarSign, label: 'Devise préférée', value: qv('devisePreferee') },
    { icon: LinkIcon, label: 'Site internet', value: qv('siteInternet') },
  ];
  const visibleQualFields = qualFields.filter(f => f.value);
  const addressFull = [qd.adresse, qd.adresse2, [qd.codePostal, qd.pays].filter(Boolean).join(' ')].filter(Boolean).join(', ');

  const renderApercu = () => (
    <div className="space-y-5">
      <StageSection icon={Phone} title="Contact" accent={accent} ink={ink} isDark={isDark}>
        <StageField icon={Mail} label="Email" value={prospect.email || '—'} accent={accent} ink={ink} isDark={isDark} />
        <StageField icon={Phone} label="Téléphone" value={prospect.phone || '—'} accent={accent} ink={ink} isDark={isDark} />
        {prospect.mobile && <StageField icon={Phone} label="Mobile" value={prospect.mobile} accent={accent} ink={ink} isDark={isDark} />}
        <StageField icon={Globe} label="Langue parlée" value={prospect.spokenLanguage || '—'} accent={accent} ink={ink} isDark={isDark} />
        <StageField icon={Tag} label="Moyens de contact" value={prospect.meansOfContact?.length ? prospect.meansOfContact.join(', ') : '—'} accent={accent} ink={ink} isDark={isDark} />
      </StageSection>

      <StageSection icon={Layers} title="Produit" accent={accent} ink={ink} isDark={isDark} delay={0.05}>
        <StageField icon={Tag} label="Catégorie" value={prospect.categories || '—'} accent={accent} ink={ink} isDark={isDark} />
        <StageField icon={Home} label="Types de bien" value={prospect.propertyTypes?.length ? prospect.propertyTypes.join(', ') : '—'} accent={accent} ink={ink} isDark={isDark} />
      </StageSection>

      {prospect.message && (
        <StageSection icon={MessageSquare} title="Message" accent={accent} ink={ink} isDark={isDark} delay={0.1}>
          <div className="md:col-span-2">
            <StageField
              icon={MessageSquare}
              label="Message du prospect"
              value={<span className="block font-semibold leading-relaxed">{prospect.message}</span>}
              accent={accent}
              ink={ink}
              isDark={isDark}
            />
          </div>
        </StageSection>
      )}
    </div>
  );

  const renderCriteres = () => (
    <StageSection icon={Sliders} title="Critères de recherche" accent={accent} ink={ink} isDark={isDark}>
      <StageField icon={MapPin} label="Localisation" value={prospect.location || '—'} accent={accent} ink={ink} isDark={isDark} />
      <StageField icon={Grid} label="Pièces" value={prospect.rooms ?? '—'} accent={accent} ink={ink} isDark={isDark} />
      <StageField icon={Grid} label="Chambres" value={prospect.bedrooms ?? '—'} accent={accent} ink={ink} isDark={isDark} />
      <StageField icon={Maximize2} label="Surface minimum" value={prospect.minSurface ? `${prospect.minSurface} m²` : '—'} accent={accent} ink={ink} isDark={isDark} />
      <StageField icon={DollarSign} label="Budget maximum" value={prospect.maxPrice ? `${prospect.maxPrice.toLocaleString('fr-FR')} ${devise}` : '—'} accent={accent} ink={ink} isDark={isDark} />
      {(prospect.viewType || prospect.viewDetail) && (
        <StageField icon={Eye} label="Vue" value={[prospect.viewType, prospect.viewDetail].filter(Boolean).join(' / ')} accent={accent} ink={ink} isDark={isDark} />
      )}
    </StageSection>
  );

  const renderSuivi = () => (
    <div className="space-y-5">
      {visibleQualFields.length > 0 || addressFull ? (
        <StageSection icon={Award} title="Dossier de qualification" accent={accent} ink={ink} isDark={isDark}>
          {visibleQualFields.map((f, i) => (
            <StageField key={f.label} icon={f.icon} label={f.label} value={f.value} accent={accent} ink={ink} isDark={isDark} delay={i * 0.03} />
          ))}
          {addressFull && (
            <div className="md:col-span-2">
              <StageField icon={Home} label="Adresse" value={addressFull} accent={accent} ink={ink} isDark={isDark} />
            </div>
          )}
        </StageSection>
      ) : (
        <StageEmpty
          icon={Award}
          title="Prospect pas encore qualifié"
          hint="Complétez le dossier de qualification pour préparer la conversion en contact."
          accent={accent}
          ink={ink}
          isDark={isDark}
          action={canWrite ? (
            <button type="button" className={primaryBtn} style={prospectPrimaryStyle(isDark)} onClick={() => setShowQualificationModal(true)}>
              <Award size={14} /> Qualifier le prospect
            </button>
          ) : undefined}
        />
      )}

      <StageSection icon={Clock} title="Suivi" accent={accent} ink={ink} isDark={isDark} delay={0.08}>
        <StageField icon={Calendar} label="Créé le" value={fmtDate(prospect.createdAt)} accent={accent} ink={ink} isDark={isDark} />
        {prospect.contactedAt && <StageField icon={Phone} label="Contacté le" value={fmtDate(prospect.contactedAt)} accent={accent} ink={ink} isDark={isDark} />}
        {prospect.qualifiedAt && <StageField icon={Award} label="Qualifié le" value={fmtDate(prospect.qualifiedAt)} accent={accent} ink={ink} isDark={isDark} />}
        {prospect.reminderDate && <StageField icon={Clock} label="Rappel programmé" value={fmtDateTime(prospect.reminderDate)} accent={accent} ink={ink} isDark={isDark} />}
      </StageSection>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Top action bar ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <motion.button
          type="button"
          onClick={() => navigate(`/admin/${adminId}/prospects`)}
          whileHover="hover"
          whileTap={{ scale: 0.96 }}
          title="Retour aux prospects"
          className={`group/back relative flex h-9 shrink-0 items-center gap-2 overflow-hidden rounded-xl border pl-2.5 pr-4 text-xs font-bold backdrop-blur-md transition-all ${
            isDark
              ? 'border-white/10 bg-white/[0.04] text-slate-400 hover:border-violet-400/30 hover:bg-white/10 hover:text-white'
              : 'border-slate-200/80 bg-white/70 text-slate-500 shadow-sm hover:border-slate-300 hover:bg-white hover:text-slate-900'
          }`}
        >
          <motion.span
            className="flex h-6 w-6 items-center justify-center rounded-lg"
            style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.05)' }}
            variants={{ hover: { x: -3 } }}
            transition={{ type: 'spring', stiffness: 500, damping: 28 }}
          >
            <ArrowLeft size={14} style={{ color: isDark ? accent.a : ink }} />
          </motion.span>
          <span>Retour aux prospects</span>
          <motion.span
            className="absolute inset-x-3 bottom-1 h-[2px] origin-left rounded-full"
            style={{ background: `linear-gradient(90deg, ${accent.a}, ${accent.b})` }}
            initial={{ scaleX: 0, opacity: 0 }}
            variants={{ hover: { scaleX: 1, opacity: 0.8 } }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          />
        </motion.button>

        <div className="flex flex-wrap items-center gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.85 }}
            title="J'aime"
            onClick={() => setLiked(!liked)}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/20 hover:bg-white/10 hover:text-white' : 'border-slate-200/80 bg-white/70 text-slate-500 shadow-sm hover:bg-white hover:text-slate-900'}`}
          >
            <Heart size={15} fill={liked ? 'currentColor' : 'none'} className={liked ? 'text-rose-500' : ''} />
          </motion.button>

          {prospect.status === 'Nouveau' && (
            <button type="button" className={primaryBtn} style={prospectPrimaryStyle(isDark)} onClick={() => handleStatusChange('Contacté')}>
              <Phone size={14} /> Marquer comme contacté
            </button>
          )}
          {prospect.status === 'Contacté' && (
            <button type="button" className={primaryBtn} style={prospectPrimaryStyle(isDark)} onClick={() => setShowReminderModal(true)}>
              <Calendar size={14} /> Programmer un rappel
            </button>
          )}
          {prospect.status === 'Qualifié' && (
            <button type="button" className={primaryBtn} style={prospectPrimaryStyle(isDark)} onClick={() => setShowConvertModal(true)}>
              <User size={14} /> Convertir en contact
            </button>
          )}
          {prospect.status === 'Perdu' && (
            <button type="button" className={primaryBtn} style={prospectPrimaryStyle(isDark)} onClick={() => handleStatusChange('Contacté')}>
              <Phone size={14} /> Marquer comme contacté
            </button>
          )}
          {prospect.status === 'Converti' && prospect.contactId && (
            <button type="button" className={primaryBtn} style={prospectPrimaryStyle(isDark)} onClick={() => navigate(`/admin/${adminId}/contacts/${prospect.contactId}`)}>
              <ExternalLink size={14} /> Voir le contact
            </button>
          )}

          {!['Qualifié', 'Perdu', 'Converti'].includes(prospect.status) && (
            <button type="button" className={emeraldBtn} onClick={() => setShowQualificationModal(true)}>
              <Award size={14} /> Qualifier
            </button>
          )}
          {!['Perdu', 'Converti'].includes(prospect.status) && (
            <button type="button" className={roseBtn} onClick={() => handleStatusChange('Perdu')}>
              <XOctagon size={14} /> Marquer comme perdu
            </button>
          )}
          <button
            type="button"
            className={glassBtn}
            onClick={() => {
              if (prospect.status === 'En attente') {
                setShowActionChoice(true);
              } else {
                setShowEditModal(true);
              }
            }}
          >
            <Edit3 size={14} /> Modifier
          </button>
          <button type="button" className={glassBtn}>
            <Share2 size={14} /> Partager
          </button>
        </div>
      </motion.div>

      {/* ── Admin actions ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        className="stage-glass relative overflow-hidden !rounded-[20px] px-3.5 py-2.5"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="mr-1 inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em]"
            style={{ color: isDark ? accent.a : ink }}
          >
            <Shield size={13} /> Actions administrateur
          </span>
          <button
            type="button"
            className={adminBtn}
            onClick={() => { setSelectedAgent(String(prospect.agentId || '')); setReassignNote(''); setShowReassignDialog(true); }}
          >
            <Repeat size={13} /> Réaffecter
          </button>
          <button
            type="button"
            className={adminBtn}
            onClick={() => { setNewStatus(prospect.status); setShowStatusDialog(true); }}
          >
            <RefreshCw size={13} /> Changer le statut
          </button>
          <button type="button" className={adminBtn} onClick={handleDuplicate}>
            <Copy size={13} /> Dupliquer
          </button>
          <button
            type="button"
            className={adminDangerBtn}
            onClick={() => { setDeleteConfirm(''); setDeleteReason(''); setShowDeleteDialog(true); }}
          >
            <Trash2 size={13} /> Supprimer
          </button>
          {prospect.originalProspectId && (
            <span
              className="ml-auto inline-flex items-center rounded-full px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em]"
              style={stagePillStyle(STAGE_HUES.amber, isDark)}
            >
              Copie
            </span>
          )}
        </div>
      </motion.div>

      {/* ── Stage hero header ── */}
      <ProspectHeader
        prospect={prospect}
        canWrite={canWrite}
        onStatusChange={handleStatusChange}
        onCalendarClick={() => setShowReminderModal(true)}
        onQualifyClick={() => setShowQualificationModal(true)}
      />

      {/* ── Responsable ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        className="stage-glass relative overflow-hidden !rounded-[24px]"
      >
        <div
          className="absolute inset-x-0 top-0 h-[3px]"
          style={{ background: `linear-gradient(90deg, ${accent.a}, ${accent.b})`, boxShadow: `0 0 14px ${accent.glow}` }}
        />
        <div className="relative flex flex-wrap items-center gap-3 p-4 sm:p-5">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-extrabold text-white"
            style={{ background: `linear-gradient(145deg, ${accent.a}, ${accent.b})`, boxShadow: `0 6px 18px -6px ${accent.glow}` }}
          >
            {getAgentInitials(prospect.agentId)}
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-[10px] font-extrabold uppercase tracking-[0.14em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Responsable
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
              <p className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {getAgentName(prospect.agentId)}
              </p>
              {roleBadge && (
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.08em]"
                  style={stagePillStyle(roleBadge.hue, isDark)}
                >
                  {roleBadge.label}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            className={glassBtn}
            onClick={() => { setSelectedAgent(String(prospect.agentId || '')); setReassignNote(''); setShowReassignDialog(true); }}
          >
            <Repeat size={14} /> Réaffecter
          </button>
        </div>
      </motion.div>

      {/* ── Staged tabbed panel: Aperçu / Critères / Suivi ── */}
      <ProspectTabsShell tabs={TABS} activeTab={activeTab} onChange={setActiveTab}>
        {activeTab === 1 && renderApercu()}
        {activeTab === 2 && renderCriteres()}
        {activeTab === 3 && renderSuivi()}
      </ProspectTabsShell>

      <QualificationPocket
        onConvert={() => {}}
        refreshTrigger={qualifiedRefresh}
        onStatusReverted={handleStatusReverted}
        canWrite={canWrite}
      />

      <AnimatePresence>
        {showQualificationModal && prospect && (
          <QualificationFormModal
            onClose={() => setShowQualificationModal(false)}
            onSubmit={handleQualify}
            prospect={prospect}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditModal && prospect && (
          <ProspectFormModal
            onClose={() => setShowEditModal(false)}
            onSubmit={handleUpdateProspect}
            prospect={prospect}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReminderModal && prospect && (
          <ReminderModal
            onClose={() => setShowReminderModal(false)}
            onConfirm={handleReminderConfirm}
            prospectName={`${prospect.civility} ${prospect.firstName} ${prospect.lastName}`}
          />
        )}
      </AnimatePresence>

      {showActionChoice && prospect && (
        <ActionChoiceModal
          onClose={() => setShowActionChoice(false)}
          onEditInfo={() => { setShowActionChoice(false); setShowEditModal(true); }}
          onEditReminder={() => { setShowActionChoice(false); setShowEditReminder(true); }}
          prospectName={`${prospect.civility} ${prospect.firstName} ${prospect.lastName}`}
          currentReminder={prospect.reminderDate}
        />
      )}

      <AnimatePresence>
        {showEditReminder && prospect && (
          <ReminderModal
            onClose={() => setShowEditReminder(false)}
            onConfirm={handleEditReminderSubmit}
            onCancel={handleCancelReminder}
            prospectName={`${prospect.civility} ${prospect.firstName} ${prospect.lastName}`}
            mode="edit"
            initialDate={prospect.reminderDate ? prospect.reminderDate.split('T')[0] : ''}
            initialTime={prospect.reminderDate ? new Date(prospect.reminderDate).toTimeString().slice(0, 5) : '09:00'}
            initialNote={prospect.reminderNote || ''}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConvertModal && prospect && (
          <ContactFormModal
            onClose={() => setShowConvertModal(false)}
            onSubmit={handleConvertSubmit}
            contact={{
              id: '',
              type: 'Particulier',
              civility: prospect.civility as any,
              firstName: prospect.firstName,
              lastName: prospect.lastName,
              emailPrincipal: prospect.email,
              emailSecondaire: '',
              mobile: prospect.phone,
              telephoneFixe: '',
              profession: '',
              lieuNaissance: '',
              dateNaissance: '',
              nationalite: '',
              numeroFiscal: '',
              adresse: '',
              adresse2: '',
              codePostal: '',
              ville: prospect.location || '',
              pays: '',
              moyenContactPrefere: '',
              langueParlee: prospect.spokenLanguage ? [prospect.spokenLanguage] : [],
              devisePreferee: prospect.currency || 'MAD',
              prescripteur: '',
              regimeMatrimonial: '',
              siteInternet: '',
              commentairePrive: `[Prospect #${prospect.id}] ${prospect.message || ''}`,
              originalProspectId: prospect.id,
              mandats: [],
              createdAt: '',
              updatedAt: '',
            }}
          />
        )}
      </AnimatePresence>

      {/* Reassign Modal */}
      <StageModal
        open={showReassignDialog}
        onClose={() => setShowReassignDialog(false)}
        eyebrow="Administration"
        title="Réaffecter un prospect"
        subtitle={`${prospect.civility} ${prospect.firstName} ${prospect.lastName}`}
        icon={Repeat}
        hue={accent}
        accent={accent.a}
        maxWidth="max-w-lg"
        centered
        bodyClassName="space-y-4 pt-1"
        footer={
          <>
            <button type="button" onClick={() => setShowReassignDialog(false)} className={btns.ghost}>
              Annuler
            </button>
            <button
              type="button"
              onClick={handleReassign}
              disabled={!selectedAgent}
              className={cn(btns.primary, !selectedAgent && 'pointer-events-none opacity-40')}
            >
              <Repeat size={14} /> Réaffecter
            </button>
          </>
        }
      >
        <ProspectSummaryCard prospect={prospect} />

        <div>
          <p className={cn('mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em]', isDark ? 'text-slate-400/85' : 'text-orange-900/55')}>
            Responsable actuel
          </p>
          <div
            className={cn(
              'flex items-center gap-3 rounded-2xl border p-3',
              isDark ? 'border-white/[0.08] bg-white/[0.03]' : 'border-slate-200/70 bg-white/70',
            )}
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-extrabold text-white"
              style={{
                background: person
                  ? `linear-gradient(145deg, ${accent.a}, ${accent.b})`
                  : isDark
                    ? 'rgba(148,163,184,0.25)'
                    : 'rgba(148,163,184,0.35)',
                boxShadow: person ? `0 6px 16px -6px ${accent.glow}` : undefined,
              }}
            >
              {getAgentInitials(prospect.agentId)}
            </div>
            <div className="min-w-0 flex-1">
              <p className={cn('truncate text-sm font-bold', isDark ? 'text-white' : 'text-slate-900')}>
                {getAgentName(prospect.agentId)}
              </p>
              {!prospect.agentId && (
                <p className={cn('text-[11px]', isDark ? 'text-slate-500' : 'text-slate-400')}>Aucun responsable</p>
              )}
            </div>
            {roleBadge && (
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.08em]"
                style={stagePillStyle(roleBadge.hue, isDark)}
              >
                {roleBadge.label}
              </span>
            )}
          </div>
        </div>

        <Select
          label="Nouveau responsable"
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

        <Textarea
          label="Note pour le responsable"
          placeholder="Je vous confie ce prospect pour le suivi..."
          value={reassignNote}
          onChange={(e) => setReassignNote(e.target.value)}
          rows={3}
        />
      </StageModal>

      {/* Delete Confirmation Modal */}
      <StageModal
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        eyebrow="Zone sensible"
        title="Supprimer le prospect"
        subtitle={`${prospect.civility} ${prospect.firstName} ${prospect.lastName}`}
        icon={Trash2}
        hue={DANGER_HUE}
        accent={DANGER_HUE.a}
        maxWidth="max-w-lg"
        centered
        bodyClassName="space-y-4 pt-1"
        footer={
          <>
            <button type="button" onClick={() => setShowDeleteDialog(false)} className={btns.ghost}>
              Annuler
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteConfirm !== 'SUPPRIMER'}
              className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-xl border px-4 text-sm font-semibold transition-all duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40',
                isDark
                  ? 'border-rose-500/30 bg-rose-500/15 text-rose-200 hover:bg-rose-500/25'
                  : 'border-rose-500 bg-rose-500 text-white shadow-[0_10px_24px_-10px_rgba(244,63,94,0.7)] hover:bg-rose-600',
              )}
            >
              <Trash2 size={14} /> Confirmer la suppression
            </button>
          </>
        }
      >
        <ProspectSummaryCard prospect={prospect} />

        <div
          className={cn(
            'flex items-start gap-2.5 rounded-2xl border p-3.5',
            isDark ? 'border-rose-400/25 bg-rose-500/10' : 'border-rose-200/80 bg-rose-50/80',
          )}
        >
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-rose-500" />
          <div className={cn('space-y-1 text-xs', isDark ? 'text-rose-200' : 'text-rose-700')}>
            <p className="font-bold">Attention :</p>
            <ul className="list-inside list-disc space-y-0.5">
              <li>Cette action est IRRÉVERSIBLE</li>
              <li>Toutes les copies de ce prospect seront également supprimées</li>
              <li>L&apos;historique du prospect sera effacé</li>
            </ul>
          </div>
        </div>

        <Input
          label="Confirmation"
          placeholder='Tapez "SUPPRIMER" pour confirmer'
          value={deleteConfirm}
          onChange={(e) => setDeleteConfirm(e.target.value)}
        />

        <Select
          label="Motif de suppression (optionnel)"
          placeholder="Sélectionner un motif"
          value={deleteReason}
          onValueChange={(v) => setDeleteReason(v)}
          options={[
            { value: '', label: 'Sélectionner un motif' },
            { value: 'doublon', label: 'Erreur de saisie - Doublon' },
            { value: 'converti', label: 'Déjà converti en client' },
            { value: 'retire', label: 'Prospect retiré' },
            { value: 'autre', label: 'Autre' },
          ]}
        />
      </StageModal>

      {/* Change Status Modal */}
      <StageModal
        open={showStatusDialog}
        onClose={() => setShowStatusDialog(false)}
        eyebrow="Workflow"
        title="Changer le statut"
        subtitle={`${prospect.civility} ${prospect.firstName} ${prospect.lastName}`}
        icon={RefreshCw}
        hue={accent}
        accent={accent.a}
        maxWidth="max-w-lg"
        centered
        bodyClassName="space-y-4 pt-1"
        footer={
          <>
            <button type="button" onClick={() => setShowStatusDialog(false)} className={btns.ghost}>
              Annuler
            </button>
            <button
              type="button"
              onClick={handleAdminStatusChange}
              disabled={newStatus === prospect.status}
              className={cn(btns.primary, newStatus === prospect.status && 'pointer-events-none opacity-40')}
            >
              <RefreshCw size={14} /> Changer le statut
            </button>
          </>
        }
      >
        <ProspectSummaryCard prospect={prospect} />

        <div>
          <p className={cn('mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em]', isDark ? 'text-slate-400/85' : 'text-orange-900/55')}>
            Statut actuel
          </p>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.08em]"
            style={stagePillStyle(STATUS_HUES[prospect.status] || STAGE_HUES.violet, isDark)}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: (STATUS_HUES[prospect.status] || STAGE_HUES.violet).line }}
            />
            {prospect.status}
          </span>
        </div>

        <div>
          <p className={cn('mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em]', isDark ? 'text-slate-400/85' : 'text-orange-900/55')}>
            Nouveau statut
          </p>
          <div className="grid grid-cols-2 gap-2">
            {STATUS_OPTIONS.map((s) => {
              const hue = STATUS_HUES[s.value] || STAGE_HUES.violet;
              const selected = newStatus === s.value;
              return (
                <motion.button
                  key={s.value}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setNewStatus(s.value)}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition-all duration-200',
                    !selected &&
                      (isDark
                        ? 'border-white/[0.08] bg-white/[0.03] text-slate-300 hover:border-white/15 hover:bg-white/[0.06]'
                        : 'border-slate-200/70 bg-white/70 text-slate-600 hover:border-slate-300 hover:bg-white'),
                  )}
                  style={selected ? stagePillStyle(hue, isDark) : undefined}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: hue.line, boxShadow: `0 0 8px ${hue.glow}` }}
                    />
                    {s.label}
                  </span>
                  {selected && <Check size={13} />}
                </motion.button>
              );
            })}
          </div>
        </div>
      </StageModal>
    </div>
  );
}
