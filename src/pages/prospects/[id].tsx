import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { Prospect } from '../../types/prospect';
import {
  ArrowLeft, Heart, Edit3, Share2, Trash2, Phone, Calendar, Award,
  XOctagon, ExternalLink, Lock, Mail, Globe, Tag, Home, Layers,
  MessageSquare, MapPin, Grid, Maximize2, DollarSign, Eye, Sliders, Clock,
  User, Briefcase, FileText, Users, UserPlus, Shield, Link as LinkIcon,
} from 'react-feather';
import { QualificationFormModal } from '../../components/modules/prospects/QualificationFormModal';
import { ProspectFormModal } from '../../components/modules/prospects/ProspectFormModal';
import { ReminderModal } from '../../components/modules/prospects/ReminderModal';
import { ActionChoiceModal } from '../../components/modules/prospects/ActionChoiceModal';
import { QualificationPocket } from '../../components/modules/prospects/QualificationPocket';
import { ProspectHeader } from '../../components/modules/prospects/ProspectHeader';
import {
  ProspectTabsShell, StageField, StageSection, StageEmpty, useProspectAccent, prospectPrimaryStyle,
} from '../../components/modules/prospects/ProspectDetailStage';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../components/ui/Toast';
import { ContactFormModal } from '../../components/modules/contacts/ContactFormModal';
import { createContact } from '../../services/contactService';
import { fetchProspectById, updateProspect, deleteProspect, updateProspectStatus, scheduleReminder, updateReminder, cancelReminder } from '../../services/prospectService';
import { useMyPermissions, permissionAllowed } from '../../hooks/useMyPermissions';
import { useStageTheme, Stage } from '../../components/dashboard/Stage';

const TABS = [
  { id: 1, label: 'Aperçu', slug: 'apercu' },
  { id: 2, label: 'Critères', slug: 'criteres' },
  { id: 3, label: 'Suivi', slug: 'suivi' },
];

const fmtDate = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const fmtDateTime = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function ProspectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const perms = useMyPermissions();
  const canRead = permissionAllowed(perms, 'prospects-lecture');
  const canWrite = permissionAllowed(perms, 'prospects-ecriture');
  const permsLoaded = perms !== null;
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTabState] = useState(() => TABS.find(t => t.slug === searchParams.get('tab'))?.id || 1);
  const setActiveTab = useCallback((tabId: number) => {
    setActiveTabState(tabId);
    const slug = TABS.find(t => t.id === tabId)?.slug;
    if (slug) setSearchParams(prev => { prev.set('tab', slug); return prev; }, { replace: true });
  }, [setSearchParams]);
  const theme = useStageTheme();
  const isDark = theme === 'dark';
  const { accent, ink } = useProspectAccent();

  useEffect(() => {
    if (!id) return;
    if (!permsLoaded || !canRead) return;
    setLoading(true);
    fetchProspectById(id)
      .then(setProspect)
      .catch(() => toast('error', 'Erreur lors du chargement du prospect'))
      .finally(() => setLoading(false));
  }, [id, toast, permsLoaded, canRead]);

  if (permsLoaded && !canRead) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-border/40 flex items-center justify-center mb-4">
          <Lock size={28} className="text-text-secondary" />
        </div>
        <h2 className="text-lg font-semibold">Prospect inaccessible</h2>
        <p className="text-sm text-text-secondary mt-1 max-w-sm">
          Vous n'avez pas la permission de consulter ce prospect. Contactez votre administrateur.
        </p>
        <Button variant="outline" className="mt-6" onClick={() => navigate('/prospects')}>Retour aux prospects</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <Stage theme={theme}>
        <div className="flex items-center justify-center py-24">
          <div className="relative flex h-12 w-12 items-center justify-center">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full"
              style={{ background: isDark ? 'rgba(139,124,255,0.2)' : 'rgba(45,212,191,0.25)' }}
            />
            <span
              className="relative inline-flex h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
              style={{ borderColor: isDark ? 'rgba(139,124,255,0.8)' : 'rgba(20,184,166,0.8)', borderTopColor: 'transparent' }}
            />
          </div>
        </div>
      </Stage>
    );
  }

  if (!prospect) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">Prospect non trouvé</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/prospects')}>Retour aux prospects</Button>
      </div>
    );
  }

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
  const glassBtn = `inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold backdrop-blur-md transition-all duration-200 hover:scale-[1.02] active:scale-95 ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10 hover:text-white' : 'border-teal-900/10 bg-white/60 text-slate-600 shadow-sm hover:bg-white hover:text-slate-900'}`;
  const roseBtn = `inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold backdrop-blur-md transition-all duration-200 hover:scale-[1.02] active:scale-95 ${isDark ? 'border-rose-400/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:text-rose-200' : 'border-rose-200/80 bg-rose-50/70 text-rose-600 shadow-sm hover:bg-rose-50 hover:text-rose-700'}`;
  const emeraldBtn = `inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold backdrop-blur-md transition-all duration-200 hover:scale-[1.02] active:scale-95 ${isDark ? 'border-emerald-300/30 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20' : 'border-emerald-200 bg-emerald-50/80 text-emerald-700 hover:bg-emerald-50'}`;

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
    <Stage theme={theme}>
      <div className="space-y-5 animate-fade-in">
        {/* ── Top action bar: Retour + quick actions (fluid entrance) ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <motion.button
            type="button"
            onClick={() => navigate('/prospects')}
            whileHover="hover"
            whileTap={{ scale: 0.96 }}
            title="Retour aux prospects"
            className={`group/back relative flex h-9 shrink-0 items-center gap-2 overflow-hidden rounded-xl border pl-2.5 pr-4 text-xs font-bold backdrop-blur-md transition-all ${
              isDark
                ? 'border-white/10 bg-white/[0.04] text-slate-400 hover:border-violet-400/30 hover:bg-white/10 hover:text-white'
                : 'border-teal-900/10 bg-white/60 text-teal-900/60 hover:border-teal-900/20 hover:bg-white hover:text-teal-900'
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
              className={`flex h-9 w-9 items-center justify-center rounded-xl border backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/20 hover:bg-white/10 hover:text-white' : 'border-teal-900/10 bg-white/60 text-slate-500 shadow-sm hover:bg-white hover:text-slate-900'}`}
            >
              <Heart size={15} fill={liked ? 'currentColor' : 'none'} className={liked ? 'text-rose-500' : ''} />
            </motion.button>

            {canWrite && prospect.status === 'Nouveau' && (
              <button type="button" className={primaryBtn} style={prospectPrimaryStyle(isDark)} onClick={() => handleStatusChange('Contacté')}>
                <Phone size={14} /> Marquer comme contacté
              </button>
            )}
            {canWrite && prospect.status === 'Contacté' && (
              <button type="button" className={primaryBtn} style={prospectPrimaryStyle(isDark)} onClick={() => setShowReminderModal(true)}>
                <Calendar size={14} /> Programmer un rappel
              </button>
            )}
            {canWrite && prospect.status === 'Qualifié' && (
              <button type="button" className={primaryBtn} style={prospectPrimaryStyle(isDark)} onClick={() => setShowConvertModal(true)}>
                <User size={14} /> Convertir en contact
              </button>
            )}
            {canWrite && prospect.status === 'Perdu' && (
              <button type="button" className={primaryBtn} style={prospectPrimaryStyle(isDark)} onClick={() => handleStatusChange('Contacté')}>
                <Phone size={14} /> Marquer comme contacté
              </button>
            )}
            {prospect.status === 'Converti' && prospect.contactId && (
              <button type="button" className={primaryBtn} style={prospectPrimaryStyle(isDark)} onClick={() => navigate(`/contacts/${prospect.contactId}`)}>
                <ExternalLink size={14} /> Voir le contact
              </button>
            )}

            {canWrite && !['Qualifié', 'Perdu', 'Converti'].includes(prospect.status) && (
              <button type="button" className={emeraldBtn} onClick={() => setShowQualificationModal(true)}>
                <Award size={14} /> Qualifier
              </button>
            )}
            {canWrite && !['Perdu', 'Converti'].includes(prospect.status) && (
              <button type="button" className={roseBtn} onClick={() => handleStatusChange('Perdu')}>
                <XOctagon size={14} /> Marquer comme perdu
              </button>
            )}
            {canWrite && (
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
            )}
            <button type="button" className={glassBtn}>
              <Share2 size={14} /> Partager
            </button>
            {canWrite && (
              <button type="button" className={roseBtn} onClick={() => { setDeleteConfirm(''); setShowDeleteDialog(true); }}>
                <Trash2 size={14} /> Supprimer
              </button>
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

        <Dialog isOpen={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} title="Supprimer le prospect" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Voulez-vous vraiment supprimer <span className="font-semibold text-text-primary">{prospect?.firstName} {prospect?.lastName}</span> ?
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
                if (!id || deleteConfirm !== 'SUPPRIMER') return;
                try {
                  await deleteProspect(id);
                  toast('success', `${prospect?.firstName} ${prospect?.lastName} supprimé`);
                  navigate('/prospects');
                } catch { toast('error', 'Erreur lors de la suppression'); }
                setShowDeleteDialog(false);
                setDeleteConfirm('');
              }}>
                Confirmer la suppression
              </Button>
            </div>
          </div>
        </Dialog>
      </div>
    </Stage>
  );
}
