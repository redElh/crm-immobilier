import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Prospect } from '../../types/prospect';
import { SearchInput } from '../../components/ui/SearchInput';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { Dialog } from '../../components/ui/Dialog';
import { Plus, Users, UserPlus, Phone, CheckCircle, Clock, AlertTriangle, TrendingUp, DollarSign, Search, ArrowUp, ArrowDown, X, Sliders } from 'react-feather';
import { ProspectCard } from '../../components/modules/prospects/ProspectCard';
import { ProspectFormModal } from '../../components/modules/prospects/ProspectFormModal';
import { ProspectDraftSection } from '../../components/modules/prospects/ProspectDraftSection';
import { ReminderModal } from '../../components/modules/prospects/ReminderModal';
import { QualificationPocket } from '../../components/modules/prospects/QualificationPocket';
import { ContactFormModal } from '../../components/modules/contacts/ContactFormModal';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../components/ui/Toast';
import { createProspect, updateProspect, deleteProspect, updateProspectStatus, scheduleReminder, updateReminder, cancelReminder, fetchProspects } from '../../services/prospectService';
import { createContact } from '../../services/contactService';
import { useMyPermissions, permissionAllowed } from '../../hooks/useMyPermissions';
import { ActionChoiceModal } from '../../components/modules/prospects/ActionChoiceModal';
import { Lock } from 'react-feather';
import { useStageChrome } from '../../components/modules/calendar/useStageChrome';
import { useStageTheme, Stage, StageStatCard, StagePanel, StageBadge, STAGE_HUES, OrbIcon, TiltCard, AnimatedNumber, GlowSparkline } from '../../components/dashboard/Stage';
import type { ProspectDraft } from '../../services/prospectDraftStorage';

const ORIGINS = ['Site web', 'Référence', 'Appel téléphonique', 'Réseaux sociaux', 'Recommandation', 'Mubawab', 'Properstar', 'Green-Acres'];

const statusDot = (color: string, glow?: string) => ({ size = 10 }: { size?: number; className?: string }) => (
  <span className="inline-block shrink-0 rounded-full" style={{ width: Math.round(size * 0.55), height: Math.round(size * 0.55), background: color, boxShadow: glow ? `0 0 8px ${glow}` : undefined }} />
);

export default function ProspectsPage() {
  const navigate = useNavigate();
  const { agentId } = useParams<{ agentId: string }>();
  const { toast } = useToast();
  const perms = useMyPermissions();
  const canRead = permissionAllowed(perms, 'prospects-lecture');
  const canWrite = permissionAllowed(perms, 'prospects-ecriture');
  const permsLoaded = perms !== null;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [originFilter, setOriginFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editProspect, setEditProspect] = useState<Prospect | undefined>();
  const [draftId, setDraftId] = useState<string | undefined>();
  const [draftChange, setDraftChange] = useState(0);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchProspects()
      .then(setProspects)
      .catch(() => toast('error', 'Erreur lors du chargement des prospects'))
      .finally(() => setLoading(false));
  }, [toast]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderTargetId, setReminderTargetId] = useState<string | null>(null);
  const [reminderTargetName, setReminderTargetName] = useState('');
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertProspect, setConvertProspect] = useState<Prospect | undefined>();
  const [qualifiedRefresh, setQualifiedRefresh] = useState(0);
  const [pocketPresent, setPocketPresent] = useState(false);
  const [showActionChoice, setShowActionChoice] = useState(false);
  const [actionChoiceProspect, setActionChoiceProspect] = useState<Prospect | undefined>();
  const [showEditReminder, setShowEditReminder] = useState(false);
  const [editReminderTarget, setEditReminderTarget] = useState<Prospect | undefined>();
  const userId = agentId || '1';
  const { staged, dark } = useStageChrome();
  const theme = useStageTheme();
  const isDark = theme === 'dark';
  const hasActiveFilters = searchTerm.trim() !== '' || statusFilter !== 'all' || originFilter !== 'all' || typeFilter !== 'all';
  const clearFilters = () => { setSearchTerm(''); setStatusFilter('all'); setOriginFilter('all'); setTypeFilter('all'); };

  const filteredProspects = useMemo(() => {
    return prospects.filter((p) => {
      const matchesSearch =
        p.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone.includes(searchTerm);
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchesOrigin = originFilter === 'all' || p.origin === originFilter;
      const matchesType = typeFilter === 'all' || p.type === typeFilter;
      return matchesSearch && matchesStatus && matchesOrigin && matchesType;
    });
  }, [prospects, searchTerm, statusFilter, originFilter, typeFilter]);

  const kpiData = useMemo(() => {
    const total = prospects.length;
    const nouveaux = prospects.filter(p => p.status === 'Nouveau').length;
    const contactes = prospects.filter(p => p.status === 'Contacté').length;
    const qualifies = prospects.filter(p => p.status === 'Qualifié').length;
    const enAttente = prospects.filter(p => p.status === 'En attente').length;
    const perdus = prospects.filter(p => p.status === 'Perdu').length;
    const convertis = prospects.filter(p => p.status === 'Converti').length;
    const tauxConv = total > 0 ? ((convertis / total) * 100).toFixed(1) : '0';
    return { total, nouveaux, contactes, qualifies, enAttente, perdus, convertis, tauxConv };
  }, [prospects]);

  const kpiCards = [
    { label: 'Total prospects', value: kpiData.total, evolution: '+18%', up: true, icon: Users, color: 'text-accent', bg: 'bg-accent-light' },
    { label: 'Nouveaux', value: kpiData.nouveaux, evolution: '+25%', up: true, icon: UserPlus, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Contactés', value: kpiData.contactes, evolution: '+10%', up: true, icon: Phone, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Qualifiés', value: kpiData.qualifies, evolution: '+8%', up: true, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'En attente', value: kpiData.enAttente, evolution: '-5%', up: false, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Perdus', value: kpiData.perdus, evolution: '0%', up: true, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Convertis', value: kpiData.convertis, evolution: '+15%', up: true, icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Taux conv.', value: `${kpiData.tauxConv}%`, evolution: '+2%', up: true, icon: DollarSign, color: 'text-accent', bg: 'bg-accent-light' },
  ];

  const handleStatusChange = useCallback(async (prospectId: string, status: Prospect['status']) => {
    try {
      const updated = await updateProspectStatus(prospectId, status);
      setProspects(prev => prev.map(p => p.id === updated.id ? updated : p));
      if (status === 'Qualifié') setQualifiedRefresh(c => c + 1);
      toast('success', `Statut changé en "${status}"`);
    } catch {
      toast('error', 'Erreur lors du changement de statut');
    }
  }, [toast]);

  const handleReminderConfirm = useCallback(async (reminderDate: string, reminderNote: string) => {
    if (!reminderTargetId) return;
    try {
      const updated = await scheduleReminder(reminderTargetId, reminderDate, reminderNote);
      setProspects(prev => prev.map(p => p.id === updated.id ? updated : p));
      setShowReminderModal(false);
      setReminderTargetId(null);
      toast('success', 'Rappel programmé');
    } catch {
      toast('error', 'Erreur lors de la programmation du rappel');
    }
  }, [reminderTargetId, toast]);

  const handleEditReminderSubmit = useCallback(async (reminderDate: string, reminderNote: string) => {
    if (!editReminderTarget) return;
    try {
      const updated = await updateReminder(editReminderTarget.id, reminderDate, reminderNote);
      setProspects(prev => prev.map(p => p.id === updated.id ? updated : p));
      setShowEditReminder(false);
      setEditReminderTarget(undefined);
      toast('success', 'Rappel mis à jour');
    } catch {
      toast('error', 'Erreur lors de la mise à jour du rappel');
    }
  }, [editReminderTarget, toast]);

  const handleCancelReminder = useCallback(async () => {
    if (!editReminderTarget) return;
    try {
      const updated = await cancelReminder(editReminderTarget.id);
      setProspects(prev => prev.map(p => p.id === updated.id ? updated : p));
      setShowEditReminder(false);
      setEditReminderTarget(undefined);
      toast('success', 'Rappel supprimé — retour au statut "Contacté"');
    } catch {
      toast('error', 'Erreur lors de la suppression du rappel');
    }
  }, [editReminderTarget, toast]);

  const handleConvert = useCallback((prospect: Prospect) => {
    setConvertProspect(prospect);
    setShowConvertModal(true);
  }, []);

  const handleQualifyDirect = useCallback(async (prospectId: string) => {
    try {
      const current = prospects.find(p => p.id === prospectId);
      const updated = await updateProspectStatus(prospectId, 'Qualifié', {
        qualificationData: { previousStatus: current?.status || 'Nouveau' },
      });
      setProspects(prev => prev.map(p => p.id === updated.id ? updated : p));
      setQualifiedRefresh(c => c + 1);
      toast('success', 'Prospect qualifié');
    } catch {
      toast('error', 'Erreur lors de la qualification');
    }
  }, [prospects, toast]);

  const handleStatusReverted = useCallback((updated: Prospect) => {
    setProspects(prev => prev.map(p => p.id === updated.id ? updated : p));
  }, []);

  const handleConvertSubmit = useCallback(async (data: any) => {
    if (!convertProspect) return;
    try {
      const merged = {
        ...convertProspect.qualificationData,
        ...data,
        firstName: convertProspect.firstName,
        lastName: convertProspect.lastName,
        civility: convertProspect.civility,
        mobile: convertProspect.phone,
        emailPrincipal: convertProspect.email,
        langueParlee: convertProspect.spokenLanguage ? [convertProspect.spokenLanguage] : [],
        devisePreferee: convertProspect.currency || 'MAD',
        ville: convertProspect.location || '',
        commentairePrive: `[Prospect #${convertProspect.id}] ${convertProspect.message || ''}`,
        originalProspectId: convertProspect.id,
      };
      const created = await createContact(merged);
      await updateProspectStatus(convertProspect.id, 'Converti', { contactId: created.id });
      setProspects(prev => prev.map(p => p.id === convertProspect.id ? { ...p, status: 'Converti' as const } : p));
      setShowConvertModal(false);
      setConvertProspect(undefined);
      setQualifiedRefresh(c => c + 1);
      toast('success', 'Prospect converti en contact avec succès');
    } catch {
      toast('error', 'Erreur lors de la conversion');
    }
  }, [convertProspect, toast]);

  const handleAddProspect = async (data: Omit<Prospect, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editProspect) {
        const updated = await updateProspect(editProspect.id, data);
        setProspects((prev) => prev.map(p => p.id === updated.id ? updated : p));
        setIsModalOpen(false);
        setEditProspect(undefined);
        toast('success', 'Prospect modifié avec succès');
      } else {
        const created = await createProspect(data);
        setProspects((prev) => [created, ...prev]);
        setIsModalOpen(false);
        toast('success', 'Prospect créé avec succès');
      }
    } catch {
      toast('error', editProspect ? 'Erreur lors de la modification' : 'Erreur lors de la création du prospect');
    }
  };

  if (permsLoaded && !canRead) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-border/40 flex items-center justify-center mb-4">
          <Lock size={28} className="text-text-secondary" />
        </div>
        <h2 className="text-lg font-semibold">Prospects inaccessibles</h2>
        <p className="text-sm text-text-secondary mt-1 max-w-sm">
          Vous n'avez pas la permission de consulter les prospects. Contactez votre administrateur.
        </p>
      </div>
    );
  }

  return (
    <Stage theme={theme}>
      <div className="space-y-6 animate-fade-in">
      {/* Header hero */}
      <div className="stage-glass relative overflow-hidden p-5 sm:p-6">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(124,92,255,0.18), transparent 70%)' }} />
        <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full pointer-events-none opacity-40" style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.18), transparent 70%)' }} />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" /></span>
              <p className={`text-[10px] font-bold uppercase tracking-[0.22em] ${isDark ? 'text-slate-400/80' : 'text-teal-900/50'}`}>Prospects · Vue d'ensemble</p>
            </div>
            <h1 className={`mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent' : 'bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-600 bg-clip-text text-transparent'}`}>Prospects - Vue d'ensemble</h1>
            <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-teal-900/60'}`}>
              {kpiData.total} prospects · {kpiData.nouveaux} nouveaux · {kpiData.qualifies} qualifiés · {kpiData.convertis} convertis
            </p>
            {kpiData.nouveaux > 0 && (
              <p className="text-[11px] text-blue-600/70 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                {kpiData.nouveaux} prospect{kpiData.nouveaux !== 1 ? 's' : ''} en attente de prise de contact
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: 'rgba(124,92,255,0.18)', background: 'rgba(124,92,255,0.10)', color: isDark ? '#C7CBFF' : '#5B4BD4' }}>
                <Users size={12} />{kpiData.total} total
              </span>
              {kpiData.nouveaux > 0 && <span className="inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold" style={{ borderColor: 'rgba(59,130,246,0.18)', background: 'rgba(59,130,246,0.10)', color: '#2563EB' }}><span className="w-2 h-2 rounded-full bg-blue-500" />{kpiData.nouveaux} nouveaux</span>}
              {kpiData.qualifies > 0 && <span className="inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold" style={{ borderColor: 'rgba(16,185,129,0.18)', background: 'rgba(16,185,129,0.10)', color: '#059669' }}><span className="w-2 h-2 rounded-full bg-emerald-500" />{kpiData.qualifies} qualifiés</span>}
              {kpiData.convertis > 0 && <span className="inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold" style={{ borderColor: 'rgba(139,92,246,0.18)', background: 'rgba(139,92,246,0.10)', color: '#7C3AED' }}><span className="w-2 h-2 rounded-full bg-violet-500" />{kpiData.convertis} convertis</span>}
            </div>
          </div>
          {canWrite && (
            <button
              onClick={() => { setEditProspect(undefined); setIsModalOpen(true); }}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/20 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95"
              style={{
                backgroundImage: isDark ? 'linear-gradient(145deg, #8B7CFF 0%, #6C5ECF 60%, #5646C9 100%)' : 'linear-gradient(145deg, #2DD4BF 0%, #14B8A6 60%, #0D9488 100%)',
                boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.4), 0 10px 26px -8px rgba(124,92,255,0.65)' : 'inset 0 1px 0 rgba(255,255,255,0.5), 0 10px 26px -10px rgba(13,148,136,0.6)',
              }}
            >
              <Plus size={16} />
              Nouveau prospect
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards — compact premium strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
        {[
          { icon: Users, label: 'Total', value: kpiData.total, suffix: '', trend: '+18%', up: true, hue: STAGE_HUES.violet, spark: [2,4,3,6,5,8] },
          { icon: UserPlus, label: 'Nouveaux', value: kpiData.nouveaux, suffix: '', trend: '+25%', up: true, hue: STAGE_HUES.sky, spark: [1,3,2,5,4,7] },
          { icon: Phone, label: 'Contactés', value: kpiData.contactes, suffix: '', trend: '+10%', up: true, hue: STAGE_HUES.amber, spark: [1,2,1,3,2,4] },
          { icon: CheckCircle, label: 'Qualifiés', value: kpiData.qualifies, suffix: '', trend: '+8%', up: true, hue: STAGE_HUES.emerald, spark: [1,2,3,2,4,3] },
          { icon: Clock, label: 'En attente', value: kpiData.enAttente, suffix: '', trend: '-5%', up: false, hue: STAGE_HUES.fuchsia, spark: [2,1,2,1,2,1] },
          { icon: AlertTriangle, label: 'Perdus', value: kpiData.perdus, suffix: '', trend: '0%', up: true, hue: STAGE_HUES.fuchsia, spark: [1,1,1,2,1,1] },
          { icon: TrendingUp, label: 'Convertis', value: kpiData.convertis, suffix: '', trend: '+15%', up: true, hue: STAGE_HUES.violet, spark: [1,2,2,3,4,5] },
          { icon: DollarSign, label: 'Taux conv.', value: Number(kpiData.tauxConv), suffix: '%', trend: '+2%', up: true, hue: STAGE_HUES.sky, spark: [1,2,2,3,3,4] },
        ].map((k, i) => {
          const Icon = k.icon;
          const trendColor = k.up ? (isDark ? '#6EE7B7' : '#059669') : (isDark ? '#FDA4AF' : '#E11D48');
          return (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -2 }}
              className="stage-glass group relative overflow-hidden rounded-xl p-3"
            >
              <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full pointer-events-none opacity-30" style={{ background: `radial-gradient(circle, ${k.hue.glow}, transparent 70%)` }} />
              <div className="relative flex items-center gap-2.5">
                <OrbIcon icon={Icon} hue={k.hue} size={30} radius={9} />
                <div className="min-w-0 flex-1">
                  <p className={`text-[9px] font-bold uppercase tracking-[1.4px] ${isDark ? 'text-slate-400' : 'text-teal-900/60'}`}>{k.label}</p>
                  <div className="flex items-baseline gap-0.5">
                    <AnimatedNumber
                      value={k.value}
                      suffix={k.suffix}
                      className={isDark ? 'text-[20px] font-extrabold leading-none tracking-[-0.5px] text-white' : 'text-[20px] font-extrabold leading-none tracking-[-0.5px] text-slate-900'}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between gap-1">
                <span
                  className="inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[9px] font-bold"
                  style={{ color: trendColor, borderColor: `${trendColor}33`, backgroundColor: `${trendColor}14` }}
                >
                  {k.up ? <ArrowUp size={9} strokeWidth={3} /> : <ArrowDown size={9} strokeWidth={3} />}
                  {k.trend}
                </span>
                <div className="flex-1 -mb-1">
                  <GlowSparkline data={k.spark} color={k.hue.line} height={18} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Search + Filters */}
      <div className="stage-glass overflow-hidden rounded-2xl">
        <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, transparent, ${isDark ? 'rgba(139,124,255,0.9)' : 'rgba(20,184,166,0.9)'} 18%, ${isDark ? '#8B7CFF' : '#14B8A6'} 50%, transparent)` }} />
        <div className="space-y-4 px-5 pb-4 pt-5" style={{ background: isDark ? 'radial-gradient(90% 140% at 0% 0%, rgba(139,124,255,0.07), transparent 65%)' : 'radial-gradient(90% 140% at 0% 0%, rgba(20,184,166,0.06), transparent 65%)' }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <OrbIcon icon={Sliders} hue={isDark ? STAGE_HUES.violet : { a: '#2DD4BF', b: '#0D9488', glow: 'rgba(13,148,136,0.35)', line: '#14B8A6' }} size={26} radius={8} />
              <div>
                <p className={`text-sm font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Recherche & filtres</p>
                <p className={`text-[11px] leading-tight ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <AnimatedNumber value={filteredProspects.length} className="inline font-semibold" /> prospect{filteredProspects.length !== 1 ? 's' : ''} sur {prospects.length}
                </p>
              </div>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border px-3.5 text-xs font-semibold backdrop-blur-md transition-all ${isDark ? 'border-white/10 bg-white/[0.06] text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white' : 'border-teal-900/10 bg-white/80 text-teal-700 shadow-[0_4px_14px_-8px_rgba(13,148,136,0.5)] hover:border-teal-900/20 hover:bg-teal-50'}`}
              >
                <X size={12} /> Réinitialiser
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]">
            <div>
              <label className={`block mb-1.5 ${isDark ? 'text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400/85' : 'text-[11px] font-bold uppercase tracking-[0.14em] text-teal-900/55'}`}>Recherche</label>
              <SearchInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nom, email ou téléphone..."
              />
            </div>
            <Select
              label="Statut"
              className="!h-10"
              options={[
                { value: 'all', label: 'Tous les statuts' },
                { value: 'Nouveau', label: 'Nouveau', icon: statusDot('#38BDF8', 'rgba(56,189,248,0.8)') },
                { value: 'Contacté', label: 'Contacté', icon: statusDot('#FBBF24', 'rgba(251,191,36,0.8)') },
                { value: 'Qualifié', label: 'Qualifié', icon: statusDot('#34D399', 'rgba(52,211,153,0.8)') },
                { value: 'En attente', label: 'En attente', icon: statusDot('#FB923C', 'rgba(251,146,60,0.8)') },
                { value: 'Perdu', label: 'Perdu', icon: statusDot('#F87171', 'rgba(248,113,113,0.8)') },
                { value: 'Converti', label: 'Converti', icon: statusDot('#8B7CFF', 'rgba(139,124,255,0.8)') },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
            />
            <Select
              label="Origine"
              className="!h-10"
              options={[
                { value: 'all', label: 'Toutes les origines' },
                ...ORIGINS.map(o => ({ value: o, label: o })),
              ]}
              value={originFilter}
              onChange={setOriginFilter}
            />
            <Select
              label="Type"
              className="!h-10"
              options={[
                { value: 'all', label: 'Tous les types' },
                { value: 'Acheter', label: 'Acheter' },
                { value: 'Louer', label: 'Louer' },
                { value: 'Vendre', label: 'Vendre' },
                { value: 'Faire estimer', label: 'Faire estimer' },
              ]}
              value={typeFilter}
              onChange={setTypeFilter}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="relative flex h-12 w-12 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400/20" />
              <span className="relative inline-flex h-8 w-8 animate-spin rounded-full border-2 border-violet-400/80 border-t-transparent" />
            </div>
          </div>
        ) : filteredProspects.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="max-w-sm p-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.03)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)'}` }}>
                <Search size={22} className={isDark ? 'text-white/20' : 'text-slate-400/60'} />
              </div>
              <h3 className={`mb-1 text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Aucun prospect trouvé</h3>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Essayez de modifier vos filtres ou d'ajouter un nouveau prospect</p>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <div className="mb-3 flex items-center justify-between gap-3 px-5">
              <div className="flex items-center gap-2.5">
                <OrbIcon icon={Users} hue={isDark ? STAGE_HUES.violet : { a: '#2DD4BF', b: '#0D9488', glow: 'rgba(13,148,136,0.35)', line: '#14B8A6' }} size={26} radius={8} />
                <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Liste des prospects</span>
              </div>
              <StageBadge variant="neutral">
                <AnimatedNumber value={filteredProspects.length} className="inline font-bold" /> prospect{filteredProspects.length !== 1 ? 's' : ''}
              </StageBadge>
            </div>
            <div className="grid auto-rows-fr grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredProspects.map((prospect) => (
              <ProspectCard
                key={prospect.id}
                prospect={prospect}
                canWrite={canWrite}
                onClick={() => navigate(`/prospects/${prospect.id}`)}
                onEdit={(p) => {
                  if (p.status === 'En attente') {
                    setActionChoiceProspect(p);
                    setShowActionChoice(true);
                  } else {
                    setEditProspect(p);
                    setIsModalOpen(true);
                  }
                }}
                onDelete={(id) => { setDeleteTargetId(id); setShowDeleteDialog(true); setDeleteConfirm(''); }}
                onStatusChange={handleStatusChange}
                onCalendarClick={(id, name) => { setReminderTargetId(id); setReminderTargetName(name); setShowReminderModal(true); }}
                onQualifyClick={(p) => { setEditProspect(p); setIsModalOpen(true); }}
                onQualify={handleQualifyDirect}
                onMarkLost={(id) => handleStatusChange(id, 'Perdu')}
                onViewContact={(contactId) => navigate(`/contacts/${contactId}`)}
              />
            ))}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <ProspectFormModal
            onClose={() => { setIsModalOpen(false); setEditProspect(undefined); setDraftId(undefined); }}
            onSubmit={handleAddProspect}
            prospect={editProspect}
            draftId={draftId}
            userId={userId}
            onDraftChange={() => setDraftChange(c => c + 1)}
          />
        )}
      </AnimatePresence>

      {canWrite && (
        <ProspectDraftSection
          userId={userId}
          draftChange={draftChange}
          shiftUp={pocketPresent}
          onResume={(draft: ProspectDraft) => {
            setDraftId(draft.id);
            setIsModalOpen(true);
          }}
        />
      )}

      {showReminderModal && (
        <ReminderModal
          onClose={() => { setShowReminderModal(false); setReminderTargetId(null); }}
          onConfirm={handleReminderConfirm}
          prospectName={reminderTargetName}
        />
      )}

      {showActionChoice && actionChoiceProspect && (
        <ActionChoiceModal
          onClose={() => { setShowActionChoice(false); setActionChoiceProspect(undefined); }}
          onEditInfo={() => {
            setEditProspect(actionChoiceProspect);
            setShowActionChoice(false);
            setIsModalOpen(true);
          }}
          onEditReminder={() => {
            setEditReminderTarget(actionChoiceProspect);
            setShowActionChoice(false);
            setShowEditReminder(true);
          }}
          prospectName={`${actionChoiceProspect.civility} ${actionChoiceProspect.firstName} ${actionChoiceProspect.lastName}`}
          currentReminder={actionChoiceProspect.reminderDate}
        />
      )}

      {showEditReminder && editReminderTarget && (
        <ReminderModal
          onClose={() => { setShowEditReminder(false); setEditReminderTarget(undefined); }}
          onConfirm={handleEditReminderSubmit}
          onCancel={handleCancelReminder}
          prospectName={`${editReminderTarget.civility} ${editReminderTarget.firstName} ${editReminderTarget.lastName}`}
          mode="edit"
          initialDate={editReminderTarget.reminderDate ? editReminderTarget.reminderDate.split('T')[0] : ''}
          initialTime={editReminderTarget.reminderDate ? new Date(editReminderTarget.reminderDate).toTimeString().slice(0, 5) : '09:00'}
          initialNote={editReminderTarget.reminderNote || ''}
        />
      )}

      <QualificationPocket onConvert={handleConvert} refreshTrigger={qualifiedRefresh} onStatusReverted={handleStatusReverted} canWrite={canWrite} onPresenceChange={setPocketPresent} />

      <AnimatePresence>
        {showConvertModal && convertProspect && (
        <ContactFormModal
          onClose={() => { setShowConvertModal(false); setConvertProspect(undefined); }}
          onSubmit={handleConvertSubmit}
          contact={{
            id: '',
            type: 'Particulier',
            civility: convertProspect.civility as any,
            firstName: convertProspect.firstName,
            lastName: convertProspect.lastName,
            emailPrincipal: convertProspect.email,
            emailSecondaire: '',
            mobile: convertProspect.phone,
            telephoneFixe: '',
            profession: '',
            lieuNaissance: '',
            dateNaissance: '',
            nationalite: '',
            numeroFiscal: '',
            adresse: '',
            adresse2: '',
            codePostal: '',
            ville: convertProspect.location || '',
            pays: '',
            moyenContactPrefere: '',
            langueParlee: convertProspect.spokenLanguage ? [convertProspect.spokenLanguage] : [],
            devisePreferee: convertProspect.currency || 'MAD',
            prescripteur: '',
            regimeMatrimonial: '',
            siteInternet: '',
            commentairePrive: `[Prospect #${convertProspect.id}] ${convertProspect.message || ''}`,
            originalProspectId: convertProspect.id,
            mandats: [],
            createdAt: '',
            updatedAt: '',
          }}
        />
        )}
      </AnimatePresence>

      <Dialog isOpen={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} title="Supprimer le prospect" size="sm">
        {(() => {
          const target = prospects.find(p => p.id === deleteTargetId);
          if (!target) return null;
          return (
            <div className="space-y-4">
              <p className="text-sm text-text-secondary">
                Voulez-vous vraiment supprimer <span className="font-semibold text-text-primary">{target.firstName} {target.lastName}</span> ?
              </p>
              <p className="text-xs text-text-secondary/70">Cette action est irréversible.</p>
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
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>Annuler</Button>
                <Button variant="danger" disabled={deleteConfirm !== 'SUPPRIMER'} onClick={async () => {
                  if (!deleteTargetId || deleteConfirm !== 'SUPPRIMER') return;
                  try {
                    await deleteProspect(deleteTargetId);
                    setProspects(prev => prev.filter(p => p.id !== deleteTargetId));
                    toast('success', `${target.firstName} ${target.lastName} supprimé`);
                  } catch { toast('error', 'Erreur lors de la suppression'); }
                  setShowDeleteDialog(false);
                  setDeleteTargetId(null);
                  setDeleteConfirm('');
                }}>
                  Confirmer la suppression
                </Button>
              </div>
            </div>
          );
        })()}
      </Dialog>
      </div>
    </Stage>
  );
}
