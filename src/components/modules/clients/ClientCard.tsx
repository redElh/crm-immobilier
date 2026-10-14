import type { CSSProperties } from 'react';
import { Home, MapPin, Maximize2, Edit3, Trash2, Calendar, Users, Briefcase, Shield, Star, Moon, Eye, Zap, CheckCircle, DollarSign, ChevronRight, Lock, Link as LinkIcon, Phone, Mail } from 'react-feather';
import { useNavigate } from 'react-router-dom';
import { motion, useAnimation } from 'framer-motion';
import { calcClientCompletion } from '../../../utils/clientCompletion';
import { ShimmerProgress, TiltCard, STAGE_HUES, useStageTheme, type StageHue } from '../../dashboard/Stage';

/* =====================================================================
   ClientCard — premium Stage edition:
   dark mode = hue identity per client type (violet/sky/emerald/amber/
   fuchsia). Light mode = sidebar emerald shades (#2DD4BF -> #0D9488,
   ink #0F766E) in a premium Staged way — no cream, no blue washes.
   Status badge = per-status convenient color (all types, both themes).
   Footer is pinned to the bottom so every row stays aligned.
   ===================================================================== */

const TYPE_HUE: Record<string, StageHue> = {
  Acheteur: STAGE_HUES.violet,
  Vendeur: STAGE_HUES.sky,
  Bailleur: STAGE_HUES.emerald,
  Locataire: STAGE_HUES.amber,
  Voyageur: STAGE_HUES.fuchsia,
};

/* Sidebar emerald identity (agent shell): logo orb #2DD4BF -> #0D9488,
   active nav gradient with #14B8A6. Light-mode cards use this family
   exclusively — premium glass, no cream. */
const SIDEBAR_EMERALD: StageHue = {
  a: '#2DD4BF',
  b: '#0D9488',
  glow: 'rgba(13,148,136,0.35)',
  line: '#14B8A6',
};
const LIGHT_INK = '#0F766E';

const LOCKED_HUE: StageHue = { a: '#FB7185', b: '#BE123C', glow: 'rgba(251,113,133,0.40)', line: '#FB7185' };

/* ------------------------------------------------------------------
   Per-status convenient colors — covers every statutMetier / status
   across Acheteur, Vendeur, Bailleur, Locataire, Voyageur.
   Pipeline logic: discovery (sky/cyan) → viewing (violet/pink) →
   mandate (indigo/orange) → negotiation (amber/violet) → success
   (emerald/green) · failures muted (red/gray). Readable in both
   themes via the badge dress (white on dark, deep b on light tint).
   ------------------------------------------------------------------ */
const SKY_HUE: StageHue = { a: '#38BDF8', b: '#0369A1', glow: 'rgba(56,189,248,0.40)', line: '#38BDF8' };
const CYAN_HUE: StageHue = { a: '#22D3EE', b: '#0E7490', glow: 'rgba(34,211,238,0.35)', line: '#22D3EE' };
const INDIGO_HUE: StageHue = { a: '#818CF8', b: '#4338CA', glow: 'rgba(129,140,248,0.40)', line: '#818CF8' };
const LIGHT_VIOLET_HUE: StageHue = { a: '#A78BFA', b: '#6D28D9', glow: 'rgba(167,139,250,0.40)', line: '#A78BFA' };
const PINK_HUE: StageHue = { a: '#F472B6', b: '#BE185D', glow: 'rgba(244,114,182,0.35)', line: '#F472B6' };
const ORANGE_HUE: StageHue = { a: '#FB923C', b: '#C2410C', glow: 'rgba(251,146,60,0.35)', line: '#FB923C' };
const TEAL_HUE: StageHue = { a: '#2DD4BF', b: '#0D9488', glow: 'rgba(13,148,136,0.35)', line: '#14B8A6' };
const GREEN_HUE: StageHue = { a: '#4ADE80', b: '#15803D', glow: 'rgba(74,222,128,0.35)', line: '#4ADE80' };
const RED_HUE: StageHue = { a: '#F87171', b: '#B91C1C', glow: 'rgba(248,113,113,0.40)', line: '#F87171' };
const SLATE_HUE_LOCAL: StageHue = { a: '#94A3B8', b: '#475569', glow: 'rgba(148,163,184,0.35)', line: '#94A3B8' };
const MUTED_HUE: StageHue = { a: '#CBD5E1', b: '#64748B', glow: 'rgba(148,163,184,0.30)', line: '#94A3B8' };

/** normalized (accent/case/spacing-insensitive) status → hue */
const CLIENT_STATUS_HUES: Record<string, StageHue> = {
  'en qualification': SKY_HUE,
  'en recherche': CYAN_HUE,
  'en visite': LIGHT_VIOLET_HUE,
  'en dossier': PINK_HUE,
  'reservation en cours': CYAN_HUE,
  'en mandat': INDIGO_HUE,
  'en attente de signature': ORANGE_HUE,
  'en negociation': STAGE_HUES.amber,
  'en compromis': STAGE_HUES.violet,
  'en location': TEAL_HUE,
  'occupe': TEAL_HUE,
  'loue': STAGE_HUES.emerald,
  'vendu': STAGE_HUES.emerald,
  'vendu / achete': STAGE_HUES.emerald,
  'vendu/achete': STAGE_HUES.emerald,
  'bail signe': STAGE_HUES.emerald,
  'confirme': STAGE_HUES.emerald,
  'paye': STAGE_HUES.emerald,
  'contrat signe': STAGE_HUES.emerald,
  'actif': TEAL_HUE,
  'installe': GREEN_HUE,
  'en sejour': SKY_HUE,
  'en cours': SKY_HUE,
  'termine': SLATE_HUE_LOCAL,
  'perdu': RED_HUE,
  'annule': RED_HUE,
  'inactif': MUTED_HUE,
  'archive': MUTED_HUE,
};

function normalizeClientStatus(s?: string): string {
  return (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Convenient StageHue for a statutMetier / status label (undefined = fallback to card accent). */
export function getClientStatusHue(status?: string): StageHue | undefined {
  const key = normalizeClientStatus(status);
  if (!key) return undefined;
  return (
    CLIENT_STATUS_HUES[key] ||
    CLIENT_STATUS_HUES[key.replace(/\s*\/\s*/g, '/')] ||
    CLIENT_STATUS_HUES[key.replace(/\s*\/\s*/g, ' / ')]
  );
}

const HONORIFICS = new Set(['m', 'mme', 'mlle', 'mr', 'mrs', 'dr', 'pr', 'maitre', 'me']);

/* Tokens that carry no initial value (conjunctions, separators, particles). */
const INITIAL_SKIP = new Set(['&', '+', '-', '/', 'et', 'and', 'y', 'e', 'und', 'de', 'du', 'des', 'la', 'le', 'les', 'l', 'd', 'el', 'al', 'van', 'von', 'di', 'da', 'del', 'ben', 'bin', 'ibn']);

export function getClientInitials(name?: string): string {
  if (!name) return '??';
  const words = name.trim().split(/\s+/).filter(Boolean);
  /* Keep only tokens containing a letter/digit — drops '&', '+', etc. */
  const letterWords = words.filter(w => /[A-Za-zÀ-ÖØ-öø-ÿ0-9]/.test(w));
  const meaningful = letterWords.filter((w, idx) => {
    const clean = w
      .replace(/^[^A-Za-zÀ-ÖØ-öø-ÿ0-9]+|[^A-Za-zÀ-ÖØ-öø-ÿ0-9]+$/g, '')
      .replace(/\.$/, '')
      .toLowerCase();
    if (clean === '' || HONORIFICS.has(clean)) return false;
    /* Particles/conjunctions only skipped past the first word
       (keeps first names like "Ben" or "Al" intact). */
    if (idx > 0 && INITIAL_SKIP.has(clean)) return false;
    return true;
  });
  const src = meaningful.length > 0 ? meaningful : letterWords.length > 0 ? letterWords : words;
  /* First letter character of each word (skips leading quotes/digits). */
  const initials = src
    .slice(0, 2)
    .map(w => {
      const m = w.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/);
      return m ? m[0].toUpperCase() : '';
    })
    .join('');
  return initials || '??';
}

interface ClientCardProps {
  client: {
    id: string;
    name: string;
    type: string;
    status: string;
    phone: string;
    email?: string;
    statutMetier?: string;
    propertyType?: string;
    budget?: number;
    prixMin?: number;
    prixMax?: number;
    devise?: string;
    minSurface?: number;
    surfaceMax?: number;
    secteur?: string;
    classification?: string;
    lastContact?: string;
    // Buyer
    urgency?: string;
    currentSituation?: string;
    pieces?: number;
    chambres?: number;
    vue?: string;
    exposition?: string;
    etat?: string;
    standing?: string;
    mustHaveFeatures?: string;
    attributPrincipal?: string;
    criteres?: string[];
    // Renter
    employmentStatus?: string;
    guarantor?: boolean;
    guarantorName?: string;
    furnished?: boolean;
    anciennete?: number;
    nomEmployeur?: string;
    dateFinContrat?: string;
    periodeEssai?: boolean;
    minRentalDuration?: number;
    statutOccupation?: string;
    // Seller
    reasonForSelling?: string;
    dateSignature?: string;
    statutMandat?: string;
    creditRestantDu?: number;
    lotCopropriete?: number;
    syndicPresent?: boolean;
    // Landlord
    loyerHC?: number;
    charges?: number;
    depotGarantie?: number;
    typeLoyer?: string;
    periodiciteLoyer?: string;
    raisonMiseEnLocation?: string;
    dateDisponibilite?: string;
    creditEnCours?: boolean;
    preferredTenant?: string;
    includedUtilities?: string;
    // Voyageur
    budgetNuitMin?: number;
    budgetNuitMax?: number;
    dateArrivee?: string;
    dateDepart?: string;
    nbNuits?: number;
    nbPersonnes?: number;
    nbVoyageurs?: number;
    bienReserve?: string;
    statutReservation?: string;
    numeroReservation?: string;
    tarifNuit?: number;
    animaux?: boolean;
    budgetTotal?: number;
    nbEnfants?: number;
    nbAdultes?: number;
    modePaiement?: string;
    checkInHeure?: string;
    checkOutHeure?: string;
    optionsSelectionnees?: string[];
    contactId?: string;
  };
  agentId?: string;
  onEdit?: (client: ClientCardProps['client']) => void;
  onDelete?: (id: string) => void;
  locked?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canExport?: boolean;
  /** stagger index for entrance animation */
  index?: number;
}

interface DetailItem {
  icon: any;
  value: string;
}

interface DetailTag {
  label: string;
  primary?: boolean;
}

export const ClientCard = ({ client, agentId, onEdit, onDelete, locked = false, canEdit = true, canDelete = true, index = 0 }: ClientCardProps) => {
  const navigate = useNavigate();
  const theme = useStageTheme();
  const isDark = theme === 'dark';
  const shakeControls = useAnimation();

  const typeHue = TYPE_HUE[client.type] || STAGE_HUES.violet;
  /* Dark: per-type hue identity. Light: sidebar emerald shades, premium staged. */
  const accent = isDark ? typeHue : SIDEBAR_EMERALD;
  const ink = isDark ? typeHue.a : LIGHT_INK;
  const formatPrice = (val?: number) => val ? val.toLocaleString('fr-FR') : null;
  const devise = client.devise || 'MAD';

  const detailUrl = agentId ? `/${agentId}/clients/type/${client.type?.toLowerCase() || ''}/${client.id}` : `/clients/${client.id}`;
  const completion = (client as any).completion ?? calcClientCompletion(client);
  const completionHue = completion >= 80 ? STAGE_HUES.emerald : completion >= 50 ? STAGE_HUES.amber : { a: '#F87171', b: '#B91C1C', glow: 'rgba(248,113,113,0.4)', line: '#F87171' };

  const handleCardClick = () => {
    if (locked) {
      shakeControls.start({
        x: [0, -10, 10, -7, 7, -4, 4, 0],
        transition: { duration: 0.45 },
      });
      return;
    }
    navigate(detailUrl);
  };

  const details = (): { items: DetailItem[]; tags: DetailTag[] } => {
    const items: DetailItem[] = [];
    const tags: DetailTag[] = [];
    switch (client.type) {
      case 'Acheteur': {
        if (client.prixMin || client.prixMax) items.push({ icon: DollarSign, value: `${formatPrice(client.prixMin) || '?'} ~ ${formatPrice(client.prixMax) || '?'} ${devise}` });
        if (client.propertyType) items.push({ icon: Home, value: client.propertyType });
        if (client.minSurface || client.surfaceMax) items.push({ icon: Maximize2, value: `${client.minSurface || '?'} ~ ${client.surfaceMax || '?'} m²` });
        if (client.secteur) items.push({ icon: MapPin, value: client.secteur });
        if (client.pieces) items.push({ icon: Home, value: `${client.pieces} pièces` });
        if (client.chambres) items.push({ icon: Moon, value: `${client.chambres} ch.` });
        if (client.currentSituation) items.push({ icon: Briefcase, value: client.currentSituation });
        if (client.urgency) items.push({ icon: Zap, value: client.urgency });
        if (client.attributPrincipal) tags.push({ label: client.attributPrincipal, primary: true });
        if (client.vue) tags.push({ label: `Vue ${client.vue}` });
        if (client.exposition) tags.push({ label: `Expo ${client.exposition}` });
        if (client.etat) tags.push({ label: client.etat });
        if (client.standing) tags.push({ label: client.standing });
        client.criteres?.slice(0, 2).forEach(c => tags.push({ label: c }));
        break;
      }
      case 'Locataire': {
        if (client.prixMin || client.prixMax) items.push({ icon: DollarSign, value: `${formatPrice(client.prixMin) || '?'} ~ ${formatPrice(client.prixMax) || '?'} ${devise}/mois` });
        if (client.propertyType) items.push({ icon: Home, value: client.propertyType });
        if (client.minSurface || client.surfaceMax) items.push({ icon: Maximize2, value: `${client.minSurface || '?'} ~ ${client.surfaceMax || '?'} m²` });
        if (client.secteur) items.push({ icon: MapPin, value: client.secteur });
        if (client.employmentStatus) items.push({ icon: Briefcase, value: client.employmentStatus });
        if (client.nomEmployeur) items.push({ icon: Briefcase, value: client.nomEmployeur });
        if (client.guarantor !== undefined) items.push({ icon: Shield, value: client.guarantor ? `Garant · ${client.guarantorName || 'Oui'}` : 'Sans garant' });
        if (client.furnished !== undefined) items.push({ icon: Home, value: client.furnished ? 'Meublé' : 'Non meublé' });
        if (client.attributPrincipal) tags.push({ label: client.attributPrincipal, primary: true });
        if (client.anciennete) tags.push({ label: `${client.anciennete} ans d'ancienneté` });
        if (client.periodeEssai !== undefined) tags.push({ label: client.periodeEssai ? "Période d'essai" : 'CDI confirmé' });
        if (client.minRentalDuration) tags.push({ label: `${client.minRentalDuration} mois min` });
        if (client.statutOccupation) tags.push({ label: client.statutOccupation });
        if (client.dateFinContrat) tags.push({ label: `Fin contrat ${new Date(client.dateFinContrat).toLocaleDateString('fr-FR')}` });
        break;
      }
      case 'Vendeur': {
        if (client.prixMin || client.prixMax || client.budget) items.push({ icon: DollarSign, value: `${formatPrice(client.prixMin || client.budget) || '?'} ${devise}` });
        if (client.propertyType) items.push({ icon: Home, value: client.propertyType });
        if (client.minSurface || client.surfaceMax) items.push({ icon: Maximize2, value: `${client.minSurface || '?'} ~ ${client.surfaceMax || '?'} m²` });
        if (client.secteur) items.push({ icon: MapPin, value: client.secteur });
        if (client.standing) items.push({ icon: Star, value: client.standing });
        if (client.dateSignature) items.push({ icon: Calendar, value: `Mandat ${new Date(client.dateSignature).toLocaleDateString('fr-FR')}` });
        if (client.statutMandat) items.push({ icon: CheckCircle, value: client.statutMandat });
        if (client.vue) items.push({ icon: Eye, value: `Vue ${client.vue}` });
        if (client.reasonForSelling) tags.push({ label: client.reasonForSelling, primary: true });
        if (client.lotCopropriete) tags.push({ label: `Lot ${client.lotCopropriete}` });
        if (client.syndicPresent !== undefined) tags.push({ label: client.syndicPresent ? 'Syndic présent' : 'Pas de syndic' });
        if (client.creditRestantDu) tags.push({ label: `Crédit ${client.creditRestantDu.toLocaleString('fr-FR')} ${devise}` });
        break;
      }
      case 'Bailleur': {
        if (client.loyerHC !== undefined) items.push({ icon: DollarSign, value: `${client.loyerHC.toLocaleString('fr-FR')} ${devise}/mois` });
        if (client.propertyType) items.push({ icon: Home, value: client.propertyType });
        if (client.charges !== undefined && client.charges > 0) items.push({ icon: DollarSign, value: `Charges ${client.charges.toLocaleString('fr-FR')}` });
        if (client.depotGarantie !== undefined) items.push({ icon: Shield, value: `Caution ${client.depotGarantie.toLocaleString('fr-FR')}` });
        if (client.minSurface || client.surfaceMax) items.push({ icon: Maximize2, value: `${client.minSurface || '?'} ~ ${client.surfaceMax || '?'} m²` });
        if (client.secteur) items.push({ icon: MapPin, value: client.secteur });
        if (client.dateDisponibilite) items.push({ icon: Calendar, value: `Dispo ${new Date(client.dateDisponibilite).toLocaleDateString('fr-FR')}` });
        if (client.preferredTenant) items.push({ icon: Users, value: client.preferredTenant });
        if (client.typeLoyer) tags.push({ label: client.typeLoyer, primary: true });
        if (client.periodiciteLoyer) tags.push({ label: client.periodiciteLoyer });
        if (client.raisonMiseEnLocation) tags.push({ label: client.raisonMiseEnLocation });
        if (client.creditEnCours !== undefined) tags.push({ label: client.creditEnCours ? 'Crédit en cours' : 'Pas de crédit' });
        if (client.loyerHC !== undefined && client.charges !== undefined) tags.push({ label: `CC ${(client.loyerHC + client.charges).toLocaleString('fr-FR')} ${devise}`, primary: true });
        break;
      }
      case 'Voyageur': {
        if (client.budgetNuitMin || client.budgetNuitMax || client.tarifNuit) items.push({ icon: DollarSign, value: `${formatPrice(client.tarifNuit || client.budgetNuitMin) || '?'} ${devise}/nuit` });
        if (client.dateArrivee || client.dateDepart) items.push({ icon: Calendar, value: `${client.dateArrivee ? new Date(client.dateArrivee).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '?'} → ${client.dateDepart ? new Date(client.dateDepart).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '?'}` });
        if (client.nbNuits !== undefined && client.nbNuits > 0) items.push({ icon: Moon, value: `${client.nbNuits} nuits` });
        if (client.nbPersonnes || client.nbVoyageurs) items.push({ icon: Users, value: `${client.nbPersonnes || client.nbVoyageurs} pers.` });
        if (client.nbAdultes || client.nbEnfants) items.push({ icon: Users, value: `${client.nbAdultes || 0} ad · ${client.nbEnfants || 0} enf` });
        if (client.bienReserve) items.push({ icon: Home, value: client.bienReserve });
        if (client.checkInHeure) items.push({ icon: Calendar, value: `Check-in ${client.checkInHeure}` });
        if (client.checkOutHeure) items.push({ icon: Calendar, value: `Check-out ${client.checkOutHeure}` });
        if (client.budgetTotal) tags.push({ label: `Total ${client.budgetTotal.toLocaleString('fr-FR')} ${devise}`, primary: true });
        if (client.statutReservation) tags.push({ label: client.statutReservation, primary: true });
        if (client.modePaiement) tags.push({ label: client.modePaiement });
        if (client.animaux !== undefined) tags.push({ label: client.animaux ? 'Animaux acceptés' : "Pas d'animaux" });
        client.optionsSelectionnees?.slice(0, 2).forEach(o => tags.push({ label: o }));
        break;
      }
      default:
        break;
    }
    return { items: items.slice(0, 6), tags: tags.slice(0, 5) };
  };

  const { items, tags } = details();
  const badgeLabel = locked ? 'Verrouillé' : (client.statutMetier || client.status);
  /* Per-status convenient color; fallback to card accent when unknown. */
  const badgeHue = locked ? LOCKED_HUE : (getClientStatusHue(badgeLabel) || accent);

  /* Premium badge: bright readable in both themes (white on dark glass, deep hue on light tint). */
  const badgeStyle: CSSProperties = isDark
    ? { background: `${badgeHue.a}2E`, color: '#fff', border: `1px solid ${badgeHue.a}5C`, boxShadow: `0 2px 12px ${badgeHue.glow}, inset 0 1px 0 rgba(255,255,255,0.14)` }
    : { background: `${badgeHue.a}1C`, color: badgeHue.b, border: `1px solid ${badgeHue.a}42`, boxShadow: `0 2px 10px ${badgeHue.glow}, inset 0 1px 0 rgba(255,255,255,0.7)` };

  return (
    <motion.div
      className="h-full"
      layout
      initial={{ opacity: 0, y: 28, scale: 0.96, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.55, delay: Math.min(index * 0.05, 0.4), ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div animate={shakeControls} className="group relative h-full" style={{ perspective: 1000 }}>
        {/* ambient halo — subtle at rest, blooms on hover */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-2 rounded-[26px] opacity-60 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: `radial-gradient(60% 55% at 50% 0%, ${accent.glow}, transparent 70%)`, filter: 'blur(18px)' }}
        />
        <TiltCard className={`h-full !rounded-[20px] ${locked ? '!cursor-not-allowed' : ''}`} onClick={handleCardClick}>
          {/* top gradient line */}
          <div
            className="absolute inset-x-0 top-0 z-10 h-[3px]"
            style={{ background: `linear-gradient(90deg, ${accent.a}, ${accent.b})`, boxShadow: `0 0 14px ${accent.glow}` }}
          />
          {/* emerald wash in light, hue wash in dark — premium staged, no cream */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background: isDark
                ? `radial-gradient(120% 85% at 50% 0%, ${accent.a}26, transparent 62%), radial-gradient(80% 60% at 100% 100%, ${accent.b}14, transparent 60%)`
                : `radial-gradient(120% 85% at 50% 0%, ${accent.a}1F, transparent 62%), radial-gradient(80% 60% at 100% 100%, ${accent.a}10, transparent 60%)`,
            }}
          />
          <div className="relative flex h-full flex-col">
            <div className="flex flex-1 flex-col px-4 pb-3 pt-4">
              {/* header */}
              <div className="flex items-start gap-3">
                <div className="relative shrink-0">
                  <div
                    className="orb-icon select-none text-[15px] font-extrabold tracking-tight"
                    style={{ width: 50, height: 50, borderRadius: 16, '--orb-a': accent.a, '--orb-b': accent.b, '--orb-glow': accent.glow } as CSSProperties}
                  >
                    {getClientInitials(client.name)}
                  </div>
                  <span
                    className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 text-white"
                    style={{
                      borderColor: isDark ? '#0B1022' : '#ffffff',
                      background: `linear-gradient(145deg, ${accent.a}, ${accent.b})`,
                      boxShadow: `0 2px 8px ${accent.glow}`,
                    }}
                  >
                    {locked ? <Lock size={9} /> : <CheckCircle size={9} />}
                  </span>
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <h3 className={`truncate text-[15px] font-extrabold leading-snug tracking-[-0.2px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {client.name}
                  </h3>
                  <div className={`mt-1 flex min-w-0 items-center gap-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <span className="inline-flex min-w-0 items-center gap-1 truncate">
                      <Phone size={11} className="shrink-0" style={{ color: ink }} />
                      <span className="truncate font-medium">{client.phone || '—'}</span>
                    </span>
                    {client.email && (
                      <span className="inline-flex min-w-0 items-center gap-1 truncate">
                        <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>·</span>
                        <Mail size={11} className="shrink-0 opacity-60" />
                        <span className="truncate">{client.email}</span>
                      </span>
                    )}
                  </div>
                  {client.contactId && (
                    <a
                      href={(() => {
                        const base = window.location.pathname.replace(/\/clients\/.*/, '');
                        return `${base}/contacts/${client.contactId}`;
                      })()}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold transition-opacity hover:opacity-80"
                      style={{ color: ink }}
                      title="Voir le contact d'origine"
                    >
                      <LinkIcon size={10} /> Contact d'origine
                    </a>
                  )}
                </div>
              </div>

              {/* badges */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] backdrop-blur-md"
                  style={badgeStyle}
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: badgeHue.line }} />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: badgeHue.line, boxShadow: `0 0 8px ${badgeHue.glow}` }} />
                  </span>
                  <span className="max-w-[160px] truncate">{badgeLabel}</span>
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold"
                  style={isDark
                    ? { background: `${accent.a}14`, color: accent.a, border: `1px solid ${accent.a}30` }
                    : { background: `${accent.a}12`, color: ink, border: `1px solid ${accent.a}30` }}
                >
                  {client.type}
                </span>
                {client.classification && (
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-semibold ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-300' : 'border-slate-200/80 bg-white/70 text-slate-500'}`}
                  >
                    {client.classification}
                  </span>
                )}
              </div>

              {/* detail chips */}
              {items.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-1.5">
                  {items.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + index * 0.03 + i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className={`flex min-w-0 items-center gap-1.5 rounded-xl border px-2 py-[7px] backdrop-blur-sm transition-colors duration-300 ${isDark ? 'border-white/[0.07] bg-white/[0.04]' : 'border-slate-200/70 bg-white/75 shadow-[0_1px_2px_rgba(15,23,42,0.05)]'}`}
                    >
                      <item.icon size={12} className="shrink-0" style={{ color: ink }} />
                      <span className={`truncate text-[11px] font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                        {item.value}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* tags */}
              {tags.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {tags.map((tag, i) => tag.primary ? (
                    <span
                      key={i}
                      className="inline-flex max-w-full items-center gap-1 truncate rounded-lg px-2 py-1 text-[10px] font-bold"
                      style={isDark
                        ? { background: `${accent.a}1E`, color: accent.a, border: `1px solid ${accent.a}36` }
                        : { background: `${accent.a}14`, color: ink, border: `1px solid ${accent.a}36` }}
                    >
                      <span className="truncate">{tag.label}</span>
                    </span>
                  ) : (
                    <span
                      key={i}
                      className={`inline-flex max-w-full items-center truncate rounded-lg border px-2 py-1 text-[10px] font-semibold ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-300' : 'border-slate-200/80 bg-white/60 text-slate-500'}`}
                    >
                      <span className="truncate">{tag.label}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* spacer pushes completion + footer to the bottom so all cards align */}
              <div className="flex-1" style={{ minHeight: 12 }} />

              {/* completion */}
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-[0.14em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    Complétion
                  </span>
                  <span className="text-[12px] font-extrabold tabular-nums" style={{ color: isDark ? completionHue.a : completionHue.b }}>
                    {completion}%
                  </span>
                </div>
                <ShimmerProgress
                  pct={completion}
                  colorFrom={completionHue.a}
                  colorTo={completionHue.b}
                  glow={completionHue.glow}
                  height={6}
                />
              </div>
            </div>

            {/* footer — pinned to bottom via mt-auto */}
            <div className={`mt-auto flex items-center justify-between gap-2 border-t px-4 py-2.5 backdrop-blur-md ${isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-teal-900/10 bg-white/60'}`}>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleCardClick(); }}
                className="group/btn inline-flex items-center gap-1 text-xs font-bold transition-all duration-200 hover:gap-1.5"
                style={{ color: ink }}
              >
                {locked ? (
                  <>
                    <Lock size={12} />
                    Verrouillé
                  </>
                ) : (
                  <>
                    Voir fiche
                    <ChevronRight size={13} strokeWidth={2.5} className="transition-transform duration-200 group-hover/btn:translate-x-0.5" />
                  </>
                )}
              </button>
              <div className="flex items-center gap-1.5">
                {client.lastContact && (
                  <span className={`mr-1 hidden text-[10px] font-medium tabular-nums sm:inline ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {new Date(client.lastContact).toLocaleDateString('fr-FR')}
                  </span>
                )}
                <span className="flex items-center gap-1.5 transition-all duration-300 lg:translate-x-1 lg:opacity-0 lg:group-hover:translate-x-0 lg:group-hover:opacity-100 lg:group-focus-within:translate-x-0 lg:group-focus-within:opacity-100">
                  {canEdit && (
                    <button
                      type="button"
                      title="Modifier"
                      onClick={(e) => { e.stopPropagation(); onEdit?.(client); }}
                      className={`flex h-8 w-8 items-center justify-center rounded-xl border backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 ${isDark ? 'border-white/10 bg-white/[0.05] text-slate-400 hover:border-white/20 hover:bg-white/10 hover:text-white' : 'border-slate-200/80 bg-white text-slate-500 shadow-sm hover:bg-white hover:text-slate-900'}`}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${accent.a}55`; e.currentTarget.style.color = ink; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.color = ''; }}
                    >
                      <Edit3 size={14} />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      title="Supprimer"
                      onClick={(e) => { e.stopPropagation(); onDelete?.(client.id); }}
                      className={`flex h-8 w-8 items-center justify-center rounded-xl border backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 ${isDark ? 'border-white/10 bg-white/[0.05] text-slate-400 hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-300' : 'border-slate-200/80 bg-white text-slate-500 shadow-sm hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600'}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </span>
              </div>
            </div>
          </div>
        </TiltCard>
      </motion.div>
    </motion.div>
  );
};
