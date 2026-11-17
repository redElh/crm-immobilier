import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import StageModal, { useStageModalButtons } from '../../../components/modules/calendar/StageModal';
import {
  GERANT_MAUVE_HUE, STAGE_HUES, useStageTheme, type StageHue,
} from '../../../components/dashboard/Stage';
import { cn } from '../../../lib/utils';
import { calcContactCompletion } from '../../../utils/contactCompletion';
import { useToast } from '../../../components/ui/Toast';
import { api } from '../../../services/api';
import { fetchContactById, deleteContact, updateContact, duplicateContact } from '../../../services/contactService';
import { fetchClientsByContactId } from '../../../services/clientService';
import { ContactFormModal } from '../../../components/modules/contacts/ContactFormModal';
import { MandatChoiceModal } from '../../../components/modules/contacts/MandatChoiceModal';
import type { Contact, Mandat } from '../../../types/contact';
import {
  User, Phone, Mail, Calendar, Globe, Tag, Users, Sliders, FileText, Star, Clock,
  MessageSquare, MapPin, Briefcase, CreditCard, Gift, Book, Monitor, Edit3, Trash2,
  Repeat, Copy, ArrowLeft, Heart, Shield, ExternalLink, AlertTriangle, Bell,
} from 'react-feather';
import {
  ContactTabsShell, ContactHeader, useContactAccent, contactPrimaryStyle,
  StageField, StageSection, StageTags, MandatsStageSection,
  CONTACT_TYPE_META, stagePillStyle,
} from '../../../components/modules/contacts/ContactDetailStage';

const COLORS = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500', 'bg-cyan-500', 'bg-pink-500'];

const DANGER_HUE: StageHue = {
  a: '#FB7185',
  b: '#E11D48',
  glow: 'rgba(244,63,94,0.45)',
  line: '#F43F5E',
};

const TABS = [
  { id: 1, label: 'Aperçu', slug: 'apercu' },
  { id: 2, label: 'Profil', slug: 'profil' },
  { id: 3, label: 'Mandats', slug: 'mandats' },
  { id: 4, label: 'Suivi', slug: 'suivi' },
];

function ContactSummary({ contact, hue, isDark, isGerant }: { contact: Contact; hue: StageHue; isDark: boolean; isGerant: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl border p-3.5 backdrop-blur-sm',
        isDark
          ? 'border-white/[0.08] bg-white/[0.04]'
          : isGerant
            ? 'border-[#905D5D]/15 bg-white/70'
            : 'border-orange-900/10 bg-white/70',
      )}
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[11px] font-extrabold text-white"
        style={{
          backgroundImage: `linear-gradient(145deg, ${hue.a}, ${hue.b})`,
          boxShadow: `0 10px 22px -10px ${hue.glow}, inset 0 1px 0 rgba(255,255,255,0.35)`,
        }}
      >
        {`${contact.firstName?.[0] || ''}${contact.lastName?.[0] || ''}`.toUpperCase() || '?'}
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

export default function AdminContactDetailPage() {
  const { id, adminId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [contact, setContact] = useState<Contact | null>(null);
  const [linkedClients, setLinkedClients] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [activeTab, setActiveTab] = useState(1);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showMandatChoice, setShowMandatChoice] = useState(false);
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [reassignNote, setReassignNote] = useState('');
  const [sendNotification, setSendNotification] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const theme = useStageTheme();
  const isDark = theme === 'dark';
  const isGerant = currentUser?.role === 'gerant';
  const { accent, ink } = useContactAccent(isGerant);
  const interfaceHue = isGerant ? GERANT_MAUVE_HUE : accent;
  const btns = useStageModalButtons();

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

  const glassBtn = cn(
    'inline-flex h-9 items-center gap-2 rounded-xl border px-3.5 text-xs font-bold backdrop-blur-md transition-all duration-200 active:scale-[0.97]',
    isDark
      ? 'border-white/10 bg-white/[0.05] text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white'
      : isGerant
        ? 'border-[#905D5D]/15 bg-white/70 text-[#7D5050]/80 shadow-sm hover:border-[#905D5D]/30 hover:bg-white hover:text-[#7D5050]'
        : 'border-orange-900/10 bg-white/70 text-orange-900/70 shadow-sm hover:border-orange-500/30 hover:bg-white hover:text-orange-900',
  );
  const primaryBtn = 'inline-flex h-9 items-center gap-2 rounded-xl border border-white/20 px-4 text-xs font-extrabold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]';
  const dangerBtn = cn(
    'inline-flex h-9 items-center gap-2 rounded-xl border px-3.5 text-xs font-bold backdrop-blur-md transition-all duration-200 active:scale-[0.97]',
    isDark
      ? 'border-rose-400/30 bg-rose-500/10 text-rose-300 hover:border-rose-400/50 hover:bg-rose-500/20'
      : 'border-rose-200/80 bg-rose-50/80 text-rose-500 shadow-sm hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600',
  );

  useEffect(() => {
    api.get<any>('/auth/me').then(setCurrentUser).catch(() => {});
  }, []);

  const loadContact = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [c, u] = await Promise.all([
        fetchContactById(id),
        api.get<any[]>('/admin/users'),
      ]);
      setContact(c);
      setUsers(Array.isArray(u) ? u : []);
      try {
        const clients = await fetchClientsByContactId(id);
        setLinkedClients(clients);
      } catch {
        setLinkedClients([]);
      }
    } catch {
      setContact(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadContact(); }, [loadContact]);

  const findPerson = (agentId: string | number | null | undefined) => {
    if (!agentId) return undefined;
    const aid = String(agentId);
    const user = users.find(u => String(u.id) === aid && u.status !== 'supprimé');
    if (user) {
      const initials = `${(user.first_name || '')[0] || ''}${(user.last_name || '')[0] || ''}`.toUpperCase() || '?';
      const color = COLORS[Math.abs(Number(user.id) || user.id.length) % COLORS.length];
      return { name: `${user.first_name || ''} ${user.last_name || ''}`.trim(), initials, color, role: user.role, position: user.position };
    }
    return undefined;
  };

  const getAgentName = (agentId: string | number | null | undefined) => {
    if (!agentId) return 'Non assigné';
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

  const getRoleBadge = (person?: { role?: string; position?: string }): { label: string; hue: StageHue } | null => {
    if (!person) return null;
    if (person.role === 'agent') return { label: person.position || 'Agent', hue: STAGE_HUES.emerald };
    if (person.role === 'gerant') return { label: 'Gérant', hue: STAGE_HUES.amber };
    if (person.role === 'admin') return { label: 'Admin', hue: STAGE_HUES.violet };
    return null;
  };

  const handleReassign = async () => {
    if (!contact || !selectedAgent) return;
    try {
      await updateContact(String(contact.id), { agentId: selectedAgent } as any);
      setContact({ ...contact, agentId: selectedAgent });
      toast('success', 'Contact réaffecté avec succès');
    } catch (err: any) {
      toast('error', err.message || 'Erreur lors de la réaffectation');
    }
    setShowReassignDialog(false);
    setSelectedAgent('');
    setReassignNote('');
    setSendNotification(false);
  };

  const handleDelete = async () => {
    if (deleteConfirm !== 'SUPPRIMER' || !contact) return;
    try {
      await deleteContact(String(contact.id));
      toast('success', `${contact.firstName} ${contact.lastName} supprimé`);
      navigate(`/admin/${adminId}/contacts`);
    } catch (err: any) {
      toast('error', err.message || 'Erreur lors de la suppression');
    }
    setShowDeleteDialog(false);
  };

  const handleDuplicate = async () => {
    if (!contact) return;
    try {
      await duplicateContact(String(contact.id));
      toast('success', `${contact.firstName} ${contact.lastName} dupliqué`);
      loadContact();
    } catch (err: any) {
      toast('error', err.message || 'Erreur lors de la duplication');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="relative flex h-12 w-12 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full" style={{ background: `${interfaceHue.a}22` }} />
          <span className="relative inline-flex h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: interfaceHue.a, borderTopColor: 'transparent' }} />
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className={cn('flex flex-col items-center justify-center rounded-3xl border px-6 py-16 text-center', isDark ? 'border-white/[0.08] bg-white/[0.03]' : 'border-slate-200/70 bg-white/60')}>
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl border" style={{ background: `${interfaceHue.a}14`, borderColor: `${interfaceHue.a}30`, color: isDark ? interfaceHue.a : ink }}>
          <User size={22} />
        </span>
        <h2 className={cn('mt-3 text-base font-extrabold', isDark ? 'text-white' : 'text-slate-900')}>Contact non trouvé</h2>
        <button className={cn('mt-5', glassBtn)} onClick={() => navigate(`/admin/${adminId}/contacts`)}>
          <ArrowLeft size={14} /> Retour aux contacts
        </button>
      </div>
    );
  }

  const activeMandats = contact.mandats.filter((m) => m.status === 'Actif');
  const pendingMandats = contact.mandats.filter((m) => m.status === 'En attente');
  const expiredMandats = contact.mandats.filter((m) => m.status === 'Expiré');
  const allDisplayMandats: Mandat[] = [...activeMandats, ...pendingMandats, ...expiredMandats];
  const mandatClientTypes = Array.from(new Set([
    ...allDisplayMandats.map((m) => m.clientType),
    ...linkedClients.map((c) => c.clientType || c.type).filter(Boolean),
  ]));
  const completion = calcContactCompletion(contact);
  const isCopy = !!contact.originalContactId;
  const originalId = contact.originalContactId || contact.id;
  const responsible = contact.agentId ? findPerson(contact.agentId) : undefined;
  const roleBadge = getRoleBadge(responsible);

  const contactLink = (href: string, value: string) => (
    <a href={href} className="hover:underline" style={{ color: isDark ? interfaceHue.a : ink }}>{value}</a>
  );

  const renderTypeChips = () => (
    <div className="flex flex-wrap gap-2">
      {(['Particulier', 'Professionnel', 'Indivision / Succession'] as const).map((t) => {
        const m = CONTACT_TYPE_META[t];
        const Icon = m.icon;
        const selected = contact.type === t;
        return (
          <span
            key={t}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold transition-all',
              selected
                ? ''
                : isDark
                  ? 'border-white/[0.07] bg-white/[0.03] text-slate-400'
                  : 'border-slate-200/70 bg-white/60 text-slate-500',
            )}
            style={selected
              ? (isDark
                ? { borderColor: `${interfaceHue.a}55`, background: `${interfaceHue.a}14`, color: '#fff' }
                : { borderColor: `${interfaceHue.a}55`, background: `${interfaceHue.a}10`, color: ink })
              : undefined}
          >
            <span
              className="flex h-4 w-4 items-center justify-center rounded-full border-2"
              style={selected ? { borderColor: isDark ? interfaceHue.a : interfaceHue.b } : { borderColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(15,23,42,0.25)' }}
            >
              {selected && <span className="h-1.5 w-1.5 rounded-full" style={{ background: isDark ? interfaceHue.a : interfaceHue.b }} />}
            </span>
            <span style={selected ? { color: isDark ? interfaceHue.a : ink } : undefined}><Icon size={13} /></span>
            {t}
          </span>
        );
      })}
    </div>
  );

  const mandatCountChip = (label: string, count: number, hue: StageHue, pulse?: boolean) => (
    <span
      key={label}
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] backdrop-blur-md"
      style={stagePillStyle(hue, isDark)}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: hue.line }} />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: hue.line }} />
        </span>
      )}
      {label} · {count}
    </span>
  );

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <motion.button
            type="button"
            onClick={() => navigate(`/admin/${adminId}/contacts`)}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            whileHover="hover"
            whileTap={{ scale: 0.96 }}
            title="Retour aux contacts"
            className={cn(
              'group/back relative flex h-9 shrink-0 items-center gap-2 overflow-hidden rounded-xl border pl-2.5 pr-4 text-xs font-bold backdrop-blur-md transition-all',
              isDark
                ? 'border-white/10 bg-white/[0.05] text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white'
                : isGerant
                  ? 'border-[#905D5D]/15 bg-white/70 text-[#7D5050]/80 shadow-sm hover:border-[#905D5D]/35 hover:bg-white hover:text-[#7D5050]'
                  : 'border-orange-900/10 bg-white/70 text-orange-900/70 shadow-sm hover:border-orange-500/35 hover:bg-white hover:text-orange-900',
            )}
          >
            <motion.span
              className="flex h-6 w-6 items-center justify-center rounded-lg"
              style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.05)' }}
              variants={{ hover: { x: -3 } }}
              transition={{ type: 'spring', stiffness: 500, damping: 28 }}
            >
              <ArrowLeft size={14} style={{ color: isDark ? interfaceHue.a : ink }} />
            </motion.span>
            <span>Retour aux contacts</span>
            <motion.span
              className="absolute inset-x-3 bottom-1 h-[2px] origin-left rounded-full"
              style={{ background: `linear-gradient(90deg, ${interfaceHue.a}, ${interfaceHue.b})` }}
              initial={{ scaleX: 0, opacity: 0 }}
              variants={{ hover: { scaleX: 1, opacity: 0.8 } }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            />
          </motion.button>
          <span
            className="hidden h-9 items-center gap-1.5 rounded-xl border px-3 text-[10px] font-extrabold uppercase tracking-[0.08em] sm:inline-flex"
            style={stagePillStyle(interfaceHue, isDark)}
          >
            <Shield size={12} /> Actions admin
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={glassBtn}
            onClick={() => { setSelectedAgent(String(contact.agentId || '')); setShowReassignDialog(true); }}
          >
            <Repeat size={14} /> Réaffecter
          </button>
          <button type="button" className={glassBtn} onClick={handleDuplicate}>
            <Copy size={14} /> Dupliquer
          </button>
          <button
            type="button"
            className={dangerBtn}
            onClick={() => { setDeleteConfirm(''); setDeleteReason(''); setShowDeleteDialog(true); }}
          >
            <Trash2 size={14} /> Supprimer
          </button>
          <button
            type="button"
            onClick={() => setLiked(!liked)}
            title="J'aime"
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-xl border transition-all active:scale-95',
              liked
                ? 'border-rose-400/40 bg-rose-500/10 text-rose-400'
                : isDark
                  ? 'border-white/10 bg-white/[0.05] text-slate-400 hover:border-white/20 hover:bg-white/10 hover:text-white'
                  : 'border-slate-200/80 bg-white/70 text-slate-500 shadow-sm hover:text-slate-900',
            )}
          >
            <Heart size={15} fill={liked ? 'currentColor' : 'none'} />
          </button>
          <button type="button" onClick={() => setShowEditForm(true)} className={primaryBtn} style={contactPrimaryStyle(isDark, interfaceHue)}>
            <Edit3 size={14} /> Modifier
          </button>
        </div>
      </div>

      {/* Hero header */}
      <ContactHeader contact={contact} mandats={allDisplayMandats} isGerant={isGerant} clientTypes={mandatClientTypes} />

      {/* Responsible bar */}
      {contact.agentId && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            'flex flex-wrap items-center gap-3 rounded-2xl border p-3.5 backdrop-blur-md',
            isDark ? 'border-white/[0.08] bg-white/[0.03]' : 'border-slate-200/70 bg-white/70 shadow-[0_1px_2px_rgba(15,23,42,0.05)]',
          )}
          style={{ borderColor: `${interfaceHue.line}26` }}
        >
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${getAgentColor(contact.agentId)} text-[11px] font-bold text-white`}>
            {getAgentInitials(contact.agentId)}
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className={cn('text-[10px] font-extrabold uppercase tracking-[0.14em]', isDark ? 'text-slate-500' : 'text-slate-400')}>
              Responsable
            </span>
            <span className={cn('text-sm font-bold', isDark ? 'text-white' : 'text-slate-900')}>{getAgentName(contact.agentId)}</span>
            {roleBadge && (
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.08em]" style={stagePillStyle(roleBadge.hue, isDark)}>
                {roleBadge.label}
              </span>
            )}
          </div>
          <button
            type="button"
            className={cn('ml-auto', glassBtn)}
            onClick={() => { setSelectedAgent(String(contact.agentId || '')); setShowReassignDialog(true); }}
          >
            <Repeat size={13} /> Changer
          </button>
        </motion.div>
      )}

      {/* Staged tabs shell */}
      <ContactTabsShell tabs={TABS} activeTab={activeTab} onChange={setActiveTab} isGerant={isGerant}>
        {activeTab === 1 && (
          <div className="space-y-6">
            <StageSection icon={Star} title="Général" accent={interfaceHue} ink={ink} isDark={isDark}>
              <div className="md:col-span-2">{renderTypeChips()}</div>
            </StageSection>

            <StageSection icon={User} title="Identité complète" accent={interfaceHue} ink={ink} isDark={isDark}>
              <StageField icon={User} label="Civilité" value={contact.civility} accent={interfaceHue} ink={ink} isDark={isDark} delay={0.02} />
              <StageField icon={User} label="Nom de famille" value={contact.lastName} accent={interfaceHue} ink={ink} isDark={isDark} delay={0.04} />
              <StageField icon={User} label="Prénom" value={contact.firstName} accent={interfaceHue} ink={ink} isDark={isDark} delay={0.06} />
              <StageField icon={Mail} label="Email principal" value={contactLink(`mailto:${contact.emailPrincipal}`, contact.emailPrincipal)} accent={interfaceHue} ink={ink} isDark={isDark} delay={0.08} />
              <StageField icon={Mail} label="Email secondaire" value={contact.emailSecondaire ? contactLink(`mailto:${contact.emailSecondaire}`, contact.emailSecondaire) : null} accent={interfaceHue} ink={ink} isDark={isDark} delay={0.1} />
              <StageField icon={Phone} label="Mobile" value={contactLink(`tel:${contact.mobile}`, contact.mobile)} accent={interfaceHue} ink={ink} isDark={isDark} delay={0.12} />
              <StageField icon={Phone} label="Téléphone fixe" value={contact.telephoneFixe ? contactLink(`tel:${contact.telephoneFixe}`, contact.telephoneFixe) : null} accent={interfaceHue} ink={ink} isDark={isDark} delay={0.14} />
              <StageField icon={Briefcase} label="Profession" value={contact.profession || null} accent={interfaceHue} ink={ink} isDark={isDark} delay={0.16} />
              <StageField icon={MapPin} label="Lieu de naissance" value={contact.lieuNaissance || null} accent={interfaceHue} ink={ink} isDark={isDark} delay={0.18} />
              <StageField icon={Calendar} label="Date de naissance" value={contact.dateNaissance ? new Date(contact.dateNaissance).toLocaleDateString('fr-FR') : null} accent={interfaceHue} ink={ink} isDark={isDark} delay={0.2} />
              <StageField icon={Globe} label="Nationalité" value={contact.nationalite || null} accent={interfaceHue} ink={ink} isDark={isDark} delay={0.22} />
              <StageField icon={CreditCard} label="Numéro fiscal" value={contact.numeroFiscal || null} accent={interfaceHue} ink={ink} isDark={isDark} delay={0.24} />
            </StageSection>

            <StageSection icon={MapPin} title="Adresse" accent={interfaceHue} ink={ink} isDark={isDark}>
              <StageField icon={MapPin} label="Adresse" value={contact.adresse || null} accent={interfaceHue} ink={ink} isDark={isDark} delay={0.02} />
              <StageField icon={MapPin} label="Adresse (2)" value={contact.adresse2 || null} accent={interfaceHue} ink={ink} isDark={isDark} delay={0.04} />
              <StageField icon={MapPin} label="Code postal" value={contact.codePostal || null} accent={interfaceHue} ink={ink} isDark={isDark} delay={0.06} />
              <StageField icon={MapPin} label="Ville" value={contact.ville || null} accent={interfaceHue} ink={ink} isDark={isDark} delay={0.08} />
              <StageField icon={Globe} label="Pays" value={contact.pays || null} accent={interfaceHue} ink={ink} isDark={isDark} delay={0.1} />
            </StageSection>
          </div>
        )}

        {activeTab === 2 && (
          <div className="space-y-6">
            <StageSection icon={Sliders} title="Préférences" accent={interfaceHue} ink={ink} isDark={isDark}>
              <StageField icon={MessageSquare} label="Moyen de contact préféré" value={contact.moyenContactPrefere || null} accent={interfaceHue} ink={ink} isDark={isDark} delay={0.02} />
              <StageField icon={CreditCard} label="Devise préférée" value={contact.devisePreferee || null} accent={interfaceHue} ink={ink} isDark={isDark} delay={0.04} />
              <div className="md:col-span-2">
                <StageTags icon={Globe} label="Langue(s) parlée(s)" items={contact.langueParlee || []} accent={interfaceHue} ink={ink} isDark={isDark} delay={0.06} />
              </div>
            </StageSection>

            <StageSection icon={Users} title="Critères complémentaires" accent={interfaceHue} ink={ink} isDark={isDark}>
              <StageField icon={Users} label="Situation familiale" value={contact.situationFamiliale || null} accent={interfaceHue} ink={ink} isDark={isDark} delay={0.02} />
              <StageField icon={Users} label="Nombre d'enfants" value={(contact.nombreEnfants ?? null) as number | null} accent={interfaceHue} ink={ink} isDark={isDark} delay={0.04} />
              <StageField icon={Gift} label="Prescripteur" value={contact.prescripteur || null} accent={interfaceHue} ink={ink} isDark={isDark} delay={0.06} />
              <StageField icon={Book} label="Régime matrimonial" value={contact.regimeMatrimonial || null} accent={interfaceHue} ink={ink} isDark={isDark} delay={0.08} />
              <StageField icon={Monitor} label="Site internet" value={contact.siteInternet || null} accent={interfaceHue} ink={ink} isDark={isDark} delay={0.1} />
            </StageSection>

            <StageSection icon={FileText} title="Complétion de la fiche" accent={interfaceHue} ink={ink} isDark={isDark}>
              <div className="md:col-span-2">
                <div
                  className="h-2.5 w-full overflow-hidden rounded-full"
                  style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)' }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completion}%` }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${interfaceHue.a}, ${interfaceHue.b})`, boxShadow: `0 0 14px ${interfaceHue.glow}` }}
                  />
                </div>
                <p className={cn('mt-2 text-xs font-bold', isDark ? 'text-slate-400' : 'text-slate-500')}>
                  {completion}% de la fiche contact est renseignée.
                </p>
              </div>
            </StageSection>
          </div>
        )}

        {activeTab === 3 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold backdrop-blur-md"
                style={isDark
                  ? { borderColor: `${interfaceHue.a}36`, background: `${interfaceHue.a}1E`, color: interfaceHue.a }
                  : { borderColor: `${interfaceHue.a}36`, background: `${interfaceHue.a}14`, color: ink }}
              >
                <FileText size={12} />
                {allDisplayMandats.length} mandat{allDisplayMandats.length > 1 ? 's' : ''}
              </span>
              {activeMandats.length > 0 && mandatCountChip('actifs', activeMandats.length, STAGE_HUES.emerald, true)}
              {pendingMandats.length > 0 && mandatCountChip('en attente', pendingMandats.length, STAGE_HUES.amber)}
              {expiredMandats.length > 0 && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em]"
                  style={isDark
                    ? { background: 'rgba(248,113,113,0.20)', color: '#FCA5A5', border: '1px solid rgba(248,113,113,0.45)' }
                    : { background: 'rgba(248,113,113,0.10)', color: '#B91C1C', border: '1px solid rgba(248,113,113,0.35)' }}
                >
                  {expiredMandats.length} expiré{expiredMandats.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <MandatsStageSection mandats={allDisplayMandats} onAddMandat={() => setShowMandatChoice(true)} isGerant={isGerant} />
          </div>
        )}

        {activeTab === 4 && (
          <div className="space-y-6">
            <StageSection icon={FileText} title="Interne" accent={interfaceHue} ink={ink} isDark={isDark}>
              <div className="md:col-span-2">
                <StageField icon={FileText} label="Commentaire privé" value={contact.commentairePrive || 'Aucun commentaire privé'} accent={interfaceHue} ink={ink} isDark={isDark} delay={0.02} />
              </div>
            </StageSection>

            <StageSection icon={ExternalLink} title="Origine & suivi" accent={interfaceHue} ink={ink} isDark={isDark}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.02, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  'rounded-2xl border p-3 backdrop-blur-sm md:col-span-2',
                  isDark ? 'border-white/[0.07] bg-white/[0.04]' : 'border-slate-200/70 bg-white/75 shadow-[0_1px_2px_rgba(15,23,42,0.05)]',
                )}
              >
                {contact.originalProspectId ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/${adminId}/prospects/${contact.originalProspectId}`)}
                    className="group/origin inline-flex max-w-full items-center gap-2 text-sm font-bold transition-all hover:gap-2.5"
                    style={{ color: isDark ? interfaceHue.a : ink }}
                  >
                    <ExternalLink size={14} />
                    <span>Voir le prospect d'origine</span>
                    <span className="font-mono text-xs opacity-60">#{contact.originalProspectId}</span>
                  </button>
                ) : (
                  <p className={cn('inline-flex items-center gap-2 text-sm font-bold', isDark ? 'text-slate-400' : 'text-slate-500')}>
                    <ArrowLeft size={14} style={{ color: isDark ? interfaceHue.a : ink }} />
                    Créé directement — aucun prospect d'origine
                  </p>
                )}
              </motion.div>
              {isCopy && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className={cn(
                    'rounded-2xl border p-3 backdrop-blur-sm md:col-span-2',
                    isDark ? 'border-white/[0.07] bg-white/[0.04]' : 'border-slate-200/70 bg-white/75 shadow-[0_1px_2px_rgba(15,23,42,0.05)]',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/${adminId}/contacts/${originalId}`)}
                    className="group/origin inline-flex max-w-full items-center gap-2 text-sm font-bold transition-all hover:gap-2.5"
                    style={{ color: isDark ? interfaceHue.a : ink }}
                  >
                    <Copy size={14} />
                    <span>Voir le contact original</span>
                    <span className="font-mono text-xs opacity-60">#{originalId}</span>
                  </button>
                </motion.div>
              )}
              <StageField icon={Calendar} label="Créé le" value={new Date(contact.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })} accent={interfaceHue} ink={ink} isDark={isDark} delay={0.06} />
              <StageField icon={Clock} label="Modifié le" value={new Date(contact.updatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })} accent={interfaceHue} ink={ink} isDark={isDark} delay={0.08} />
              <div className="md:col-span-2">
                <StageTags
                  icon={Tag}
                  label="Types de mandats"
                  items={mandatClientTypes}
                  accent={interfaceHue}
                  ink={ink}
                  isDark={isDark}
                  delay={0.1}
                />
              </div>
              {linkedClients.length > 0 && (
                <div className="md:col-span-2">
                  <StageTags
                    icon={Users}
                    label="Clients liés"
                    items={linkedClients.map((c) => c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.clientType || 'Client')}
                    accent={interfaceHue}
                    ink={ink}
                    isDark={isDark}
                    delay={0.12}
                  />
                </div>
              )}
            </StageSection>
          </div>
        )}
      </ContactTabsShell>

      <AnimatePresence>
        {showEditForm && contact && (
          <ContactFormModal
            contact={contact}
            onClose={() => setShowEditForm(false)}
            isGerant={isGerant}
            onSubmit={async (data) => {
              try {
                await updateContact(contact.id, data);
                toast('success', 'Contact modifié avec succès');
                loadContact();
              } catch {
                toast('error', 'Erreur lors de la modification');
              }
              setShowEditForm(false);
            }}
          />
        )}
      </AnimatePresence>

      {showMandatChoice && contact && (
        <MandatChoiceModal
          contact={contact}
          onClose={() => setShowMandatChoice(false)}
          isGerant={isGerant}
        />
      )}

      <StageModal
        open={showReassignDialog}
        onClose={() => { setShowReassignDialog(false); setSendNotification(false); }}
        title="Réaffecter un contact"
        eyebrow="Attribution"
        subtitle={contact ? `${contact.civility || ''} ${contact.firstName} ${contact.lastName}`.trim() : undefined}
        icon={Repeat}
        hue={interfaceHue}
        maxWidth="max-w-xl"
        centered
        footer={contact ? (
          <>
            <button className={ghostBtn} onClick={() => { setShowReassignDialog(false); setSendNotification(false); }}>Annuler</button>
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
        {contact && (
          <div className="space-y-4">
            <ContactSummary contact={contact} hue={interfaceHue} isDark={isDark} isGerant={isGerant} />
            <div>
              <p className={fieldLabel}>Responsable actuel</p>
              <div className="flex items-center gap-2 text-sm">
                {contact.agentId ? (
                  <>
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full ${getAgentColor(contact.agentId)} text-[10px] font-bold text-white`}>
                      {getAgentInitials(contact.agentId)}
                    </div>
                    <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>{getAgentName(contact.agentId)}</span>
                    {roleBadge && (
                      <span
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.08em]"
                        style={stagePillStyle(roleBadge.hue, isDark)}
                      >
                        {roleBadge.label}
                      </span>
                    )}
                  </>
                ) : (
                  <span className={isDark ? 'italic text-slate-500' : 'italic text-slate-400'}>Non assigné</span>
                )}
              </div>
            </div>
            <div>
              <label className={fieldLabel}>Nouveau responsable</label>
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
        subtitle={contact ? `${contact.civility || ''} ${contact.firstName} ${contact.lastName}`.trim() : undefined}
        icon={Trash2}
        hue={DANGER_HUE}
        maxWidth="max-w-xl"
        centered
        footer={contact ? (
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
        {contact && (
          <div className="space-y-4">
            <ContactSummary contact={contact} hue={DANGER_HUE} isDark={isDark} isGerant={isGerant} />
            <div className={cn('rounded-2xl border p-3.5', isDark ? 'border-rose-400/25 bg-rose-500/10' : 'border-rose-200 bg-rose-50')}>
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={16} className={cn('mt-0.5 shrink-0', isDark ? 'text-rose-300' : 'text-rose-500')} />
                <div className={cn('space-y-1 text-xs', isDark ? 'text-rose-200/85' : 'text-rose-700')}>
                  <p className="font-semibold">Attention — action irréversible</p>
                  <ul className="list-inside list-disc space-y-0.5">
                    <li>Cette action est IRRÉVERSIBLE</li>
                    <li>Tous les documents associés seront supprimés</li>
                    {!isCopy && <li>Toutes les copies de ce contact seront supprimées</li>}
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
    </div>
  );
}
