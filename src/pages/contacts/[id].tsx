import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Edit3, ExternalLink, Trash2, Share2, Lock, Search,
  User, Users, Sliders, FileText, Clock, Gift, Book, Monitor, Star,
  MapPin, Tag, Home, Grid, Maximize2, Eye, DollarSign, Mail, Globe,
  CreditCard, MessageSquare, ArrowLeft, Briefcase,
} from 'react-feather';
import type { Contact, Mandat } from '../../types/contact';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { useToast } from '../../components/ui/Toast';
import { fetchContactById, deleteContact, updateContact } from '../../services/contactService';
import { fetchClientsByContactId } from '../../services/clientService';
import { allContacts } from '../admin/contacts/mockData';
import { useMyPermissions, permissionAllowed } from '../../hooks/useMyPermissions';
import { ContactFormModal } from '../../components/modules/contacts/ContactFormModal';
import { MandatChoiceModal } from '../../components/modules/contacts/MandatChoiceModal';
import { Stage, useStageTheme, STAGE_HUES, type StageHue } from '../../components/dashboard/Stage';
import {
  ContactTabsShell, ContactHeader, useContactAccent, contactPrimaryStyle,
  StageField, StageSection, StageTags, StageEmpty, MandatsStageSection,
  CONTACT_TYPE_META, stagePillStyle,
} from '../../components/modules/contacts/ContactDetailStage';

interface ProspectProductData {
  categories: string;
  propertyTypes: string[];
  location?: string;
  rooms?: number;
  bedrooms?: number;
  minSurface?: number;
  maxPrice?: number;
  currency?: string;
  viewType?: string;
  viewDetail?: string;
}

const prospectProductData: Record<string, ProspectProductData> = {
  p1: {
    categories: 'Vente',
    propertyTypes: ['Appartement'],
    location: 'Marrakech',
    rooms: 3,
    bedrooms: 2,
    minSurface: 80,
    maxPrice: 1200000,
    currency: 'MAD',
    viewDetail: 'Jardin',
  },
  p3: {
    categories: 'Vente',
    propertyTypes: ['Garage / Parking'],
    location: 'Rabat',
    maxPrice: 250000,
    currency: 'MAD',
  },
};

const TABS = [
  { id: 1, label: 'Aperçu', slug: 'apercu' },
  { id: 2, label: 'Profil', slug: 'profil' },
  { id: 3, label: 'Mandats', slug: 'mandats' },
  { id: 4, label: 'Suivi', slug: 'suivi' },
];

export default function ContactPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const perms = useMyPermissions();
  const canRead = permissionAllowed(perms, 'contacts-lecture');
  const canWrite = permissionAllowed(perms, 'contacts-ecriture');
  const canDelete = permissionAllowed(perms, 'contacts-supprimer');
  const canInfo = permissionAllowed(perms, 'contacts-info-privees');
  const canExport = permissionAllowed(perms, 'contacts-general-export');
  const permsLoaded = perms !== null;
  const { isDark, accent, ink } = useContactAccent();
  const theme = useStageTheme();
  const [contact, setContact] = useState<Contact | null>(null);
  const [linkedClients, setLinkedClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [activeTab, setActiveTab] = useState(1);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showMandatChoice, setShowMandatChoice] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const loadContact = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      /* The API only knows numeric ids — demo-book ids (ex: "ac1") are resolved locally. */
      const isNumericId = /^\d+$/.test(id);
      if (isNumericId) {
        try {
          const data = await fetchContactById(id);
          setContact(data);
          try {
            const clients = await fetchClientsByContactId(id);
            setLinkedClients(clients);
          } catch {
            setLinkedClients([]);
          }
          return;
        } catch {
          /* API indisponible : retombe sur le book de démonstration. */
        }
      }
      const mock = allContacts.find((c) => c.id === id);
      if (mock) {
        setContact(mock);
      } else {
        toast('error', 'Contact introuvable');
      }
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    if (permsLoaded && canRead && canInfo) loadContact();
  }, [loadContact, permsLoaded, canRead, canInfo]);

  if (permsLoaded && (!canRead || !canInfo)) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-border/40 flex items-center justify-center mb-4">
          <Lock size={28} className="text-text-secondary" />
        </div>
        <h2 className="text-lg font-semibold">Contact verrouillé</h2>
        <p className="text-sm text-text-secondary mt-1 max-w-sm">
          Vous n'avez pas la permission d'accéder aux informations privées de ce contact. Contactez votre administrateur.
        </p>
        <Button variant="outline" className="mt-6" onClick={() => navigate('/contacts')}>Retour aux contacts</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="relative flex h-12 w-12 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400/20" />
          <span className="relative inline-flex h-8 w-8 animate-spin rounded-full border-2 border-sky-400/80 border-t-transparent" />
        </div>
      </div>
    );
  }
  if (!contact) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">Contact non trouvé</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/contacts')}>Retour aux contacts</Button>
      </div>
    );
  }

  const activeMandats = contact.mandats.filter((m) => m.status === 'Actif');
  const pendingMandats = contact.mandats.filter((m) => m.status === 'En attente');
  const expiredMandats = contact.mandats.filter((m) => m.status === 'Expiré');
  const allDisplayMandats: Mandat[] = [...activeMandats, ...pendingMandats, ...expiredMandats];
  const productData = contact.originalProspectId ? prospectProductData[contact.originalProspectId] : undefined;

  const glassBtn = `inline-flex items-center gap-2 rounded-xl border px-3.5 h-9 text-xs font-bold transition-all active:scale-[0.97] ${
    isDark
      ? 'border-white/10 bg-white/[0.05] text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white'
      : 'border-slate-200/80 bg-white/70 text-slate-600 shadow-sm hover:bg-white hover:text-slate-900'
  }`;
  const primaryBtn = 'inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 h-9 text-xs font-extrabold text-white transition-all hover:scale-[1.02] active:scale-[0.97]';
  const dangerBtn = `inline-flex items-center gap-2 rounded-xl border px-3 h-9 text-xs font-bold transition-all active:scale-[0.97] ${
    isDark
      ? 'border-rose-400/30 bg-rose-500/10 text-rose-300 hover:border-rose-400/50 hover:bg-rose-500/20'
      : 'border-rose-200/80 bg-rose-50/80 text-rose-500 shadow-sm hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600'
  }`;

  const renderTypeChips = () => (
    <div className="flex flex-wrap gap-2">
      {(['Particulier', 'Professionnel', 'Indivision / Succession'] as const).map((t) => {
        const m = CONTACT_TYPE_META[t];
        const Icon = m.icon;
        const selected = contact?.type === t;
        return (
          <span
            key={t}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold transition-all ${
              selected
                ? ''
                : isDark
                  ? 'border-white/[0.07] bg-white/[0.03] text-slate-400'
                  : 'border-slate-200/70 bg-white/60 text-slate-500'
            }`}
            style={selected
              ? (isDark
                ? { borderColor: `${STAGE_HUES.sky.a}55`, background: `${STAGE_HUES.sky.a}14`, color: '#fff' }
                : { borderColor: 'rgba(13,148,136,0.35)', background: 'rgba(13,148,136,0.10)', color: '#0F766E' })
              : undefined}
          >
            <span
              className="flex h-4 w-4 items-center justify-center rounded-full border-2"
              style={selected ? { borderColor: isDark ? STAGE_HUES.sky.a : '#0D9488' } : { borderColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(15,23,42,0.25)' }}
            >
              {selected && <span className="h-1.5 w-1.5 rounded-full" style={{ background: isDark ? STAGE_HUES.sky.a : '#0D9488' }} />}
            </span>
            <span style={selected ? { color: isDark ? STAGE_HUES.sky.a : '#0D9488' } : undefined}><Icon size={13} /></span>
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
    <Stage theme={theme}>
      <div className="space-y-4 animate-fade-in">
        {/* Top action bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <motion.button
            type="button"
            onClick={() => navigate('/contacts')}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            whileHover="hover"
            whileTap={{ scale: 0.96 }}
            title="Retour aux contacts"
            className={`group/back relative flex h-9 shrink-0 items-center gap-2 overflow-hidden rounded-xl border pl-2.5 pr-4 text-xs font-bold backdrop-blur-md transition-all ${
              isDark
                ? 'border-white/10 bg-white/[0.05] text-slate-300 hover:border-sky-400/30 hover:bg-white/10 hover:text-white'
                : 'border-slate-200/80 bg-white/70 text-slate-600 shadow-sm hover:border-teal-500/40 hover:bg-white hover:text-teal-900'
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
            <span>Retour aux contacts</span>
            <motion.span
              className="absolute inset-x-3 bottom-1 h-[2px] origin-left rounded-full"
              style={{ background: `linear-gradient(90deg, ${accent.a}, ${accent.b})` }}
              initial={{ scaleX: 0, opacity: 0 }}
              variants={{ hover: { scaleX: 1, opacity: 0.8 } }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            />
          </motion.button>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setLiked(!liked)}
              title="J'aime"
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all active:scale-95 ${
                liked
                  ? 'border-rose-400/40 bg-rose-500/10 text-rose-400'
                  : isDark
                    ? 'border-white/10 bg-white/[0.05] text-slate-400 hover:border-white/20 hover:bg-white/10 hover:text-white'
                    : 'border-slate-200/80 bg-white/70 text-slate-500 shadow-sm hover:text-slate-900'
              }`}
            >
              <Heart size={15} fill={liked ? 'currentColor' : 'none'} />
            </button>
            {canWrite && (
              <button type="button" onClick={() => setShowEditForm(true)} className={primaryBtn} style={contactPrimaryStyle(isDark)}>
                <Edit3 size={14} /> Modifier
              </button>
            )}
            {canExport && (
              <button type="button" className={glassBtn}>
                <Share2 size={14} /> Partager
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                title="Supprimer le contact"
                onClick={() => { setShowDeleteDialog(true); setDeleteConfirm(''); }}
                className={dangerBtn}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Hero header */}
        <ContactHeader contact={contact} mandats={allDisplayMandats} />

        {/* Staged tabs shell */}
        <ContactTabsShell tabs={TABS} activeTab={activeTab} onChange={setActiveTab}>
          {activeTab === 1 && (
            <div className="space-y-6">
              <StageSection icon={Star} title="Général" accent={accent} ink={ink} isDark={isDark}>
                <div className="md:col-span-2">{renderTypeChips()}</div>
              </StageSection>

              <StageSection icon={User} title="Identité complète" accent={accent} ink={ink} isDark={isDark}>
                <StageField icon={User} label="Civilité" value={contact.civility} accent={accent} ink={ink} isDark={isDark} delay={0.02} />
                <StageField icon={User} label="Nom de famille" value={contact.lastName} accent={accent} ink={ink} isDark={isDark} delay={0.04} />
                <StageField icon={User} label="Prénom" value={contact.firstName} accent={accent} ink={ink} isDark={isDark} delay={0.06} />
                <StageField icon={Mail} label="Email principal" value={contact.emailPrincipal} accent={accent} ink={ink} isDark={isDark} delay={0.08} />
                <StageField icon={Mail} label="Email secondaire" value={contact.emailSecondaire || null} accent={accent} ink={ink} isDark={isDark} delay={0.1} />
                <StageField icon={MapPin} label="Lieu de naissance" value={contact.lieuNaissance || null} accent={accent} ink={ink} isDark={isDark} delay={0.12} />
                <StageField icon={Clock} label="Date de naissance" value={contact.dateNaissance ? new Date(contact.dateNaissance).toLocaleDateString('fr-FR') : null} accent={accent} ink={ink} isDark={isDark} delay={0.14} />
                <StageField icon={Globe} label="Nationalité" value={contact.nationalite || null} accent={accent} ink={ink} isDark={isDark} delay={0.16} />
                <StageField icon={CreditCard} label="Numéro fiscal" value={contact.numeroFiscal || null} accent={accent} ink={ink} isDark={isDark} delay={0.18} />
                <StageField icon={Briefcase} label="Profession" value={contact.profession || null} accent={accent} ink={ink} isDark={isDark} delay={0.2} />
              </StageSection>

              <StageSection icon={MapPin} title="Adresse" accent={accent} ink={ink} isDark={isDark}>
                <StageField icon={MapPin} label="Adresse" value={contact.adresse || null} accent={accent} ink={ink} isDark={isDark} delay={0.02} />
                <StageField icon={MapPin} label="Adresse (2)" value={contact.adresse2 || null} accent={accent} ink={ink} isDark={isDark} delay={0.04} />
                <StageField icon={MapPin} label="Code postal" value={contact.codePostal || null} accent={accent} ink={ink} isDark={isDark} delay={0.06} />
                <StageField icon={MapPin} label="Ville" value={contact.ville || null} accent={accent} ink={ink} isDark={isDark} delay={0.08} />
                <StageField icon={Globe} label="Pays" value={contact.pays || null} accent={accent} ink={ink} isDark={isDark} delay={0.1} />
              </StageSection>
            </div>
          )}

          {activeTab === 2 && (
            <div className="space-y-6">
              <StageSection icon={Users} title="Préférences" accent={accent} ink={ink} isDark={isDark}>
                <StageField icon={MessageSquare} label="Moyen de contact préféré" value={contact.moyenContactPrefere || null} accent={accent} ink={ink} isDark={isDark} delay={0.02} />
                <StageField icon={CreditCard} label="Devise préférée" value={contact.devisePreferee || null} accent={accent} ink={ink} isDark={isDark} delay={0.04} />
                <div className="md:col-span-2">
                  <StageTags icon={Globe} label="Langue(s) parlée(s)" items={contact.langueParlee || []} accent={accent} ink={ink} isDark={isDark} delay={0.06} />
                </div>
              </StageSection>

              <StageSection icon={Sliders} title="Critères complémentaires" accent={accent} ink={ink} isDark={isDark}>
                <StageField icon={Users} label="Situation familiale" value={contact.situationFamiliale || null} accent={accent} ink={ink} isDark={isDark} delay={0.02} />
                <StageField icon={Users} label="Nombre d'enfants" value={(contact.nombreEnfants ?? null) as number | null} accent={accent} ink={ink} isDark={isDark} delay={0.04} />
                <StageField icon={Gift} label="Prescripteur" value={contact.prescripteur || null} accent={accent} ink={ink} isDark={isDark} delay={0.06} />
                <StageField icon={Book} label="Régime matrimonial" value={contact.regimeMatrimonial || null} accent={accent} ink={ink} isDark={isDark} delay={0.08} />
                <StageField icon={Monitor} label="Site internet" value={contact.siteInternet || null} accent={accent} ink={ink} isDark={isDark} delay={0.1} />
              </StageSection>

              {productData && (
                <StageSection icon={Home} title="Produit d'origine" accent={accent} ink={ink} isDark={isDark}>
                  <StageField icon={Tag} label="Catégorie" value={productData.categories} accent={accent} ink={ink} isDark={isDark} delay={0.02} />
                  <StageField icon={Home} label="Types de bien" value={productData.propertyTypes.join(', ')} accent={accent} ink={ink} isDark={isDark} delay={0.04} />
                  <StageField icon={MapPin} label="Localisation" value={productData.location || null} accent={accent} ink={ink} isDark={isDark} delay={0.06} />
                  <StageField icon={Grid} label="Pièces" value={(productData.rooms ?? null) as number | null} accent={accent} ink={ink} isDark={isDark} delay={0.08} />
                  <StageField icon={Grid} label="Chambres" value={(productData.bedrooms ?? null) as number | null} accent={accent} ink={ink} isDark={isDark} delay={0.1} />
                  <StageField icon={Maximize2} label="Surface min" value={productData.minSurface ? `${productData.minSurface} m²` : null} accent={accent} ink={ink} isDark={isDark} delay={0.12} />
                  <StageField icon={DollarSign} label="Budget max" value={productData.maxPrice ? `${productData.maxPrice.toLocaleString('fr-FR')} ${productData.currency || 'MAD'}` : null} accent={accent} ink={ink} isDark={isDark} delay={0.14} />
                  <StageField icon={Eye} label="Vue" value={[productData.viewType, productData.viewDetail].filter(Boolean).join(' / ') || null} accent={accent} ink={ink} isDark={isDark} delay={0.16} />
                </StageSection>
              )}

              {!productData && (
                <StageEmpty
                  icon={Search}
                  title="Aucun critère d'origine"
                  hint="Ce contact n'a pas été converti depuis un prospect avec critères de recherche."
                  accent={accent}
                  ink={ink}
                  isDark={isDark}
                />
              )}
            </div>
          )}

          {activeTab === 3 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold backdrop-blur-md"
                  style={isDark
                    ? { borderColor: `${accent.a}36`, background: `${accent.a}1E`, color: accent.a }
                    : { borderColor: `${accent.a}36`, background: `${accent.a}14`, color: ink }}
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
              <MandatsStageSection mandats={allDisplayMandats} onAddMandat={() => setShowMandatChoice(true)} />
            </div>
          )}

          {activeTab === 4 && (
            <div className="space-y-6">
              <StageSection icon={FileText} title="Interne" accent={accent} ink={ink} isDark={isDark}>
                <div className="md:col-span-2">
                  <StageField icon={FileText} label="Commentaire privé" value={contact.commentairePrive || 'Aucun commentaire privé'} accent={accent} ink={ink} isDark={isDark} delay={0.02} />
                </div>
              </StageSection>

              <StageSection icon={ExternalLink} title="Origine & suivi" accent={accent} ink={ink} isDark={isDark}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.02, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className={`md:col-span-2 rounded-2xl border p-3 backdrop-blur-sm ${isDark ? 'border-white/[0.07] bg-white/[0.04]' : 'border-slate-200/70 bg-white/75 shadow-[0_1px_2px_rgba(15,23,42,0.05)]'}`}
                >
                  {contact.originalProspectId ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/prospects/${contact.originalProspectId}`)}
                      className="group/origin inline-flex max-w-full items-center gap-2 text-sm font-bold transition-all hover:gap-2.5"
                      style={{ color: isDark ? accent.a : ink }}
                    >
                      <ExternalLink size={14} />
                      <span>Voir le prospect d'origine</span>
                      <span className="font-mono text-xs opacity-60">#{contact.originalProspectId}</span>
                    </button>
                  ) : (
                    <p className={`inline-flex items-center gap-2 text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <ArrowLeft size={14} style={{ color: isDark ? accent.a : ink }} />
                      Créé directement — aucun prospect d'origine
                    </p>
                  )}
                </motion.div>
                <StageField icon={Clock} label="Créé le" value={new Date(contact.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })} accent={accent} ink={ink} isDark={isDark} delay={0.04} />
                <StageField icon={Clock} label="Modifié le" value={new Date(contact.updatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })} accent={accent} ink={ink} isDark={isDark} delay={0.06} />
                <div className="md:col-span-2">
                  <StageTags
                    icon={Tag}
                    label="Types de mandats"
                    items={Array.from(new Set(allDisplayMandats.map((m) => m.clientType)))}
                    accent={accent}
                    ink={ink}
                    isDark={isDark}
                    delay={0.08}
                  />
                </div>
              </StageSection>
            </div>
          )}
        </ContactTabsShell>

        <AnimatePresence>
          {showEditForm && (
            <ContactFormModal
              onClose={() => setShowEditForm(false)}
              onSubmit={async (data) => {
                try {
                  const updated = await updateContact(contact.id, data);
                  setContact(updated);
                  setShowEditForm(false);
                  toast('success', 'Contact modifié avec succès');
                } catch {
                  toast('error', 'Erreur lors de la modification');
                }
              }}
              contact={contact}
            />
          )}
        </AnimatePresence>

        {showMandatChoice && contact && (
          <MandatChoiceModal
            contact={contact}
            onClose={() => setShowMandatChoice(false)}
          />
        )}

        <Dialog isOpen={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} title="Supprimer le contact" size="sm">
          {contact && (
            <div className="space-y-4">
              <p className="text-sm text-text-secondary">
                Voulez-vous vraiment supprimer <span className="font-semibold text-text-primary">{contact.firstName} {contact.lastName}</span> ?
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
                    await deleteContact(id);
                    toast('success', 'Contact supprimé');
                    navigate('/contacts');
                  } catch { toast('error', 'Erreur lors de la suppression'); }
                  setShowDeleteDialog(false);
                  setDeleteConfirm('');
                }}>
                  Confirmer la suppression
                </Button>
              </div>
            </div>
          )}
        </Dialog>
      </div>
    </Stage>
  );
}
