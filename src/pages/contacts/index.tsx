import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Contact } from '../../types/contact';
import { SearchInput } from '../../components/ui/SearchInput';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { ContactCard } from '../../components/modules/contacts/ContactCard';
import { ContactFormModal } from '../../components/modules/contacts/ContactFormModal';
import { ContactDraftSection } from '../../components/modules/contacts/ContactDraftSection';
import { Plus, Users, Search, ArrowUp, ArrowDown, X, Sliders, TrendingUp, UserX, User, Briefcase, Tag, CheckCircle } from 'react-feather';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../components/ui/Toast';
import { fetchContacts, createContact, updateContact, deleteContact } from '../../services/contactService';
import { allContacts } from '../admin/contacts/mockData';
import { useMyPermissions, permissionAllowed } from '../../hooks/useMyPermissions';
import { Lock } from 'react-feather';
import { useStageTheme, Stage, StageBadge, STAGE_HUES, OrbIcon, AnimatedNumber, GlowSparkline, type StageHue } from '../../components/dashboard/Stage';
import type { ContactDraft } from '../../services/contactDraftStorage';

const mandatDot = (color: string, glow?: string) => ({ size = 10 }: { size?: number; className?: string }) => (
  <span className="inline-block shrink-0 rounded-full" style={{ width: Math.round(size * 0.55), height: Math.round(size * 0.55), background: color, boxShadow: glow ? `0 0 8px ${glow}` : undefined }} />
);

const mandatTypeOptions = [
  { value: 'all', label: 'Tous les types', icon: undefined },
  { value: 'Vendeur', label: 'Vendeur', icon: mandatDot('#38BDF8', 'rgba(56,189,248,0.8)') },
  { value: 'Bailleur', label: 'Bailleur', icon: mandatDot('#34D399', 'rgba(52,211,153,0.8)') },
  { value: 'Acheteur', label: 'Acheteur', icon: mandatDot('#8B7CFF', 'rgba(139,124,255,0.8)') },
  { value: 'Locataire', label: 'Locataire', icon: mandatDot('#FBBF24', 'rgba(251,191,36,0.8)') },
  { value: 'Voyageur', label: 'Voyageur', icon: mandatDot('#E879F9', 'rgba(232,121,249,0.8)') },
];

const contactTypeOptions = [
  { value: 'all', label: 'Tous les types' },
  { value: 'Particulier', label: 'Particulier' },
  { value: 'Professionnel', label: 'Professionnel' },
  { value: 'Indivision / Succession', label: 'Indivision / Succession' },
];

export default function ContactsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const perms = useMyPermissions();
  const canRead = permissionAllowed(perms, 'contacts-lecture');
  const canWrite = permissionAllowed(perms, 'contacts-ecriture');
  const canDelete = permissionAllowed(perms, 'contacts-supprimer');
  const canInfo = permissionAllowed(perms, 'contacts-info-privees');
  const canDemandes = permissionAllowed(perms, 'contacts-demandes');
  const canExport = permissionAllowed(perms, 'contacts-general-export');
  const permsLoaded = perms !== null;
  const [searchTerm, setSearchTerm] = useState('');
  const [mandatFilter, setMandatFilter] = useState('all');
  const [contactTypeFilter, setContactTypeFilter] = useState('all');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showContactForm, setShowContactForm] = useState(false);
  const [editContact, setEditContact] = useState<Contact | undefined>();
  const [draftId, setDraftId] = useState<string | undefined>();
  const [draftChange, setDraftChange] = useState(0);
  const userId = '1';
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const theme = useStageTheme();
  const isDark = theme === 'dark';

  const loadContacts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchContacts();
      /* Real data wins; fall back to the demo book when the API is down or empty. */
      setContacts(data.length > 0 ? data : allContacts);
    } catch {
      setContacts(allContacts);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadContacts(); }, [loadContacts]);

  const filteredContacts = useMemo(() => contacts.filter((c) => {
    const matchesSearch =
      c.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.emailPrincipal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.mobile.includes(searchTerm);
    const matchesMandat =
      mandatFilter === 'all' ||
      c.mandats.some((m) => m.clientType === mandatFilter && m.status === 'Actif');
    const matchesType =
      contactTypeFilter === 'all' ||
      c.type === contactTypeFilter;
    const matchesDemandes =
      canDemandes ||
      !c.mandats.some((m) => m.clientType === 'Acheteur');
    return matchesSearch && matchesMandat && matchesType && matchesDemandes;
  }), [contacts, searchTerm, mandatFilter, contactTypeFilter, canDemandes]);

  const hasActiveFilters = searchTerm.trim() !== '' || mandatFilter !== 'all' || contactTypeFilter !== 'all';
  const clearFilters = () => { setSearchTerm(''); setMandatFilter('all'); setContactTypeFilter('all'); };

  const availableMandatOptions = canDemandes
    ? mandatTypeOptions
    : mandatTypeOptions.filter((o) => o.value !== 'Acheteur');

  const handleCreateContact = async (data: Omit<Contact, 'id' | 'mandats' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editContact) {
        const updated = await updateContact(editContact.id, data);
        setContacts((prev) => prev.map(c => c.id === updated.id ? updated : c));
        toast('success', 'Contact modifié avec succès');
      } else {
        const newContact = await createContact(data);
        setContacts((prev) => [newContact, ...prev]);
        toast('success', 'Contact créé avec succès');
      }
      setShowContactForm(false);
      setEditContact(undefined);
    } catch (err) {
      toast('error', editContact ? 'Erreur lors de la modification' : 'Erreur lors de la création du contact');
    }
  };

  const kpiData = useMemo(() => {
    const total = contacts.length;
    const avecMandatActif = contacts.filter(c => c.mandats.some(m => m.status === 'Actif')).length;
    const sansMandat = total - avecMandatActif;
    const particulier = contacts.filter(c => c.type === 'Particulier').length;
    const professionnel = contacts.filter(c => c.type === 'Professionnel').length;
    const succession = contacts.filter(c => c.type === 'Indivision / Succession').length;
    return { total, avecMandatActif, sansMandat, particulier, professionnel, succession };
  }, [contacts]);

  if (permsLoaded && !canRead) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-border/40 flex items-center justify-center mb-4">
          <Lock size={28} className="text-text-secondary" />
        </div>
        <h2 className="text-lg font-semibold">Contacts inaccessibles</h2>
        <p className="text-sm text-text-secondary mt-1 max-w-sm">
          Vous n'avez pas la permission de consulter les contacts. Contactez votre administrateur.
        </p>
      </div>
    );
  }

  return (
    <Stage theme={theme}>
      <div className="space-y-6 animate-fade-in">
        {/* Header hero */}
        <div className="stage-glass relative overflow-hidden p-5 sm:p-6">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.18), transparent 70%)' }} />
          <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full pointer-events-none opacity-40" style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.18), transparent 70%)' }} />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.9)]" /></span>
                <p className={`text-[10px] font-bold uppercase tracking-[0.22em] ${isDark ? 'text-slate-400/80' : 'text-teal-900/50'}`}>Contacts · Vue d'ensemble</p>
              </div>
              <h1 className={`mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'bg-gradient-to-r from-white via-sky-100 to-sky-300 bg-clip-text text-transparent' : 'bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-600 bg-clip-text text-transparent'}`}>Contacts - Vue d'ensemble</h1>
              <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-teal-900/60'}`}>
                {kpiData.total} contacts · {kpiData.avecMandatActif} avec mandats actifs · {kpiData.sansMandat} sans mandat
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: 'rgba(124,92,255,0.18)', background: 'rgba(124,92,255,0.10)', color: isDark ? '#C7CBFF' : '#5B4BD4' }}>
                  <Users size={12} />{kpiData.total} total
                </span>
                {kpiData.avecMandatActif > 0 && <span className="inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold" style={{ borderColor: 'rgba(16,185,129,0.18)', background: 'rgba(16,185,129,0.10)', color: '#059669' }}><TrendingUp size={12} />{kpiData.avecMandatActif} actifs</span>}
                {kpiData.sansMandat > 0 && <span className="inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold" style={{ borderColor: 'rgba(244,63,94,0.18)', background: 'rgba(244,63,94,0.08)', color: isDark ? '#FDA4AF' : '#E11D48' }}><UserX size={12} />{kpiData.sansMandat} sans mandat</span>}
              </div>
            </div>
            {canWrite && (
              <button
                onClick={() => { setEditContact(undefined); setShowContactForm(true); }}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/20 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95"
                style={{
                  backgroundImage: isDark ? 'linear-gradient(145deg, #38BDF8 0%, #0284C7 60%, #0369A1 100%)' : 'linear-gradient(145deg, #2DD4BF 0%, #14B8A6 60%, #0D9488 100%)',
                  boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.4), 0 10px 26px -8px rgba(56,189,248,0.55)' : 'inset 0 1px 0 rgba(255,255,255,0.5), 0 10px 26px -10px rgba(13,148,136,0.6)',
                }}
              >
                <Plus size={16} />
                Nouveau contact
              </button>
            )}
          </div>
        </div>

        {/* KPI Cards — compact premium strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-6 gap-3">
          {[
            { icon: Users, label: 'Total', value: kpiData.total, trend: '+12%', up: true, hue: STAGE_HUES.violet, spark: [2,4,3,6,5,8] },
            { icon: TrendingUp, label: 'Mandat actif', value: kpiData.avecMandatActif, trend: '+8%', up: true, hue: STAGE_HUES.emerald, spark: [1,2,3,2,4,5] },
            { icon: UserX, label: 'Sans mandat', value: kpiData.sansMandat, trend: '0%', up: true, hue: { a: '#F87171', b: '#B91C1C', glow: 'rgba(248,113,113,0.40)', line: '#F87171' }, spark: [1,1,1,2,1,1] },
            { icon: User, label: 'Particuliers', value: kpiData.particulier, trend: '+15%', up: true, hue: STAGE_HUES.sky, spark: [1,3,2,5,4,7] },
            { icon: Briefcase, label: 'Professionnels', value: kpiData.professionnel, trend: '+5%', up: true, hue: STAGE_HUES.violet, spark: [1,2,2,3,3,4] },
            { icon: Tag, label: 'Successions', value: kpiData.succession, trend: '0%', up: true, hue: STAGE_HUES.amber, spark: [1,1,2,1,2,1] },
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

        {/* Search + Filters + Liste */}
        <div className="stage-glass overflow-hidden rounded-2xl">
          <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, transparent, ${isDark ? 'rgba(56,189,248,0.9)' : 'rgba(20,184,166,0.9)'} 18%, ${isDark ? '#38BDF8' : '#14B8A6'} 50%, transparent)` }} />
          <div className="space-y-4 px-5 pb-4 pt-5" style={{ background: isDark ? 'radial-gradient(90% 140% at 0% 0%, rgba(56,189,248,0.07), transparent 65%)' : 'radial-gradient(90% 140% at 0% 0%, rgba(20,184,166,0.06), transparent 65%)' }}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <OrbIcon icon={Sliders} hue={isDark ? STAGE_HUES.sky : { a: '#2DD4BF', b: '#0D9488', glow: 'rgba(13,148,136,0.35)', line: '#14B8A6' }} size={26} radius={8} />
                <div>
                  <p className={`text-sm font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Recherche & filtres</p>
                  <p className={`text-[11px] leading-tight ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <AnimatedNumber value={filteredContacts.length} className="inline font-semibold" /> contact{filteredContacts.length !== 1 ? 's' : ''} sur {contacts.length}
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-[minmax(0,1.6fr)_repeat(2,minmax(0,1fr))]">
              <div>
                <label className={`block mb-1.5 ${isDark ? 'text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400/85' : 'text-[11px] font-bold uppercase tracking-[0.14em] text-teal-900/55'}`}>Recherche</label>
                <SearchInput
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nom, email ou téléphone..."
                />
              </div>
              <Select
                label="Type de contact"
                className="!h-10"
                options={contactTypeOptions}
                value={contactTypeFilter}
                onChange={setContactTypeFilter}
              />
              <Select
                label="Type de mandat"
                className="!h-10"
                options={availableMandatOptions}
                value={mandatFilter}
                onChange={setMandatFilter}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="relative flex h-12 w-12 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400/20" />
                <span className="relative inline-flex h-8 w-8 animate-spin rounded-full border-2 border-sky-400/80 border-t-transparent" />
              </div>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="max-w-sm p-10 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.03)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)'}` }}>
                  <Search size={22} className={isDark ? 'text-white/20' : 'text-slate-400/60'} />
                </div>
                <h3 className={`mb-1 text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Aucun contact trouvé</h3>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Essayez de modifier vos filtres ou d'ajouter un nouveau contact</p>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <div className="mb-3 flex items-center justify-between gap-3 px-5">
                <div className="flex items-center gap-2.5">
                  <OrbIcon icon={Users} hue={isDark ? STAGE_HUES.sky : { a: '#2DD4BF', b: '#0D9488', glow: 'rgba(13,148,136,0.35)', line: '#14B8A6' }} size={26} radius={8} />
                  <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Liste des contacts</span>
                </div>
                <StageBadge variant="neutral">
                  <AnimatedNumber value={filteredContacts.length} className="inline font-bold" /> contact{filteredContacts.length !== 1 ? 's' : ''}
                </StageBadge>
              </div>
              <div className="grid auto-rows-fr grid-cols-1 items-stretch gap-4 pb-5 px-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredContacts.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    locked={!canInfo}
                    canEdit={canWrite}
                    canDelete={canDelete}
                    canExport={canExport}
                    onClick={() => navigate(`/contacts/${contact.id}`)}
                    onEdit={(c) => { setEditContact(c); setShowContactForm(true); }}
                    onDelete={(id) => { setDeleteTargetId(id); setShowDeleteDialog(true); setDeleteConfirm(''); }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <AnimatePresence>
          {showContactForm && (
            <ContactFormModal
              onClose={() => { setShowContactForm(false); setEditContact(undefined); setDraftId(undefined); }}
              onSubmit={handleCreateContact}
              contact={editContact}
              draftId={draftId}
              userId={userId}
              onDraftChange={() => setDraftChange(c => c + 1)}
            />
          )}
        </AnimatePresence>

        <ContactDraftSection
          userId={userId}
          draftChange={draftChange}
          onResume={(draft: ContactDraft) => {
            setDraftId(draft.id);
            setShowContactForm(true);
          }}
        />

        <Dialog isOpen={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} title="Supprimer le contact" size="sm">
          {(() => {
            const target = contacts.find(c => c.id === deleteTargetId);
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
                      await deleteContact(deleteTargetId);
                      setContacts(prev => prev.filter(c => c.id !== deleteTargetId));
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
