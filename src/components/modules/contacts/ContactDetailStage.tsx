import type { CSSProperties, ReactNode } from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Users, Sliders, FileText, Clock, ChevronLeft, ChevronRight, Plus, Tag,
  TrendingUp, Key, ShoppingCart, Home, Compass, Mail, Phone, MapPin,
  Briefcase, CreditCard, Globe, MessageSquare,
} from 'react-feather';
import type { Contact, Mandat } from '../../../types/contact';
import {
  useStageTheme, useStageScope, useStageAccent, GERANT_MAUVE_HUE, STAGE_HUES, type StageHue,
} from '../../dashboard/Stage';
import { CompletionRing } from '../../ui/CompletionRing';
import { calcContactCompletion } from '../../../utils/contactCompletion';
import { StageField, StageSection, StageTags, StageEmpty, stagePillStyle } from '../prospects/ProspectDetailStage';
import { SIDEBAR_EMERALD, LIGHT_INK, RED_HUE, normalizeStatus } from '../prospects/ProspectCard';

/* =====================================================================
   ContactDetailStage — shared staged kit for the contact detail page:
   glass shell + sliding pill tab bar + hero header + staged mandat
   cards. Agent = sky (dark) / sidebar emerald (light); admin inherits
   the shell crimson-rose or orange accent, gérant wears the mauve.
   Field chips are re-used from the prospect kit.
   ===================================================================== */

type IconType = React.ComponentType<{ size?: number | string; className?: string; style?: CSSProperties }>;

export {
  StageField, StageSection, StageTags, StageEmpty, stagePillStyle,
};

/** Theme + accent resolution shared by the header and the tabs shell.
 *  Agent keeps its sky/emerald identity. Admin/gérant inherit the shell
 *  accent (crimson-rose dark, vivid orange light) or the gérant mauve. */
export function useContactAccent(isGerant = false) {
  const theme = useStageTheme();
  const scope = useStageScope();
  const stageAccent = useStageAccent();
  const isDark = theme === 'dark';
  const accent = isGerant
    ? GERANT_MAUVE_HUE
    : scope === 'admin'
      ? stageAccent
      : isDark ? STAGE_HUES.sky : SIDEBAR_EMERALD;
  const ink = isDark ? accent.a : scope === 'admin' ? accent.b : LIGHT_INK;
  return { isDark, accent, ink };
}

/** Primary gradient CTA shared by the detail page (united sky / emerald,
 *  or the admin/gérant interface hue when provided). */
export function contactPrimaryStyle(isDark: boolean, accent?: StageHue): CSSProperties {
  const hue = accent || (isDark ? STAGE_HUES.sky : SIDEBAR_EMERALD);
  return {
    backgroundImage: `linear-gradient(145deg, ${hue.a} 0%, ${hue.b} 55%, ${hue.b} 100%)`,
    boxShadow: `inset 0 1px 0 rgba(255,255,255,${isDark ? '0.4' : '0.5'}), 0 10px 26px -8px ${hue.glow}`,
  };
}

export const CONTACT_TYPE_META: Record<string, { icon: IconType; label: string; hue: StageHue }> = {
  Particulier: { icon: User, label: 'Particulier', hue: STAGE_HUES.sky },
  Professionnel: { icon: Briefcase, label: 'Professionnel', hue: STAGE_HUES.violet },
  'Indivision / Succession': { icon: Users, label: 'Indivision', hue: STAGE_HUES.amber },
};

export const CONTACT_MANDAT_META: Record<string, { icon: IconType; hue: StageHue }> = {
  Vendeur: { icon: TrendingUp, hue: STAGE_HUES.sky },
  Bailleur: { icon: Key, hue: STAGE_HUES.emerald },
  Acheteur: { icon: ShoppingCart, hue: STAGE_HUES.violet },
  Locataire: { icon: Home, hue: STAGE_HUES.amber },
  Voyageur: { icon: Compass, hue: STAGE_HUES.fuchsia },
};

/* ------------------------------------------------------------------ */
/* Staged tab shell: glass panel + scrollable pill bar + animated swap */
/* ------------------------------------------------------------------ */

const TAB_ICONS: Record<string, IconType> = {
  apercu: User,
  profil: Sliders,
  mandats: FileText,
  suivi: Clock,
};

export function ContactTabsShell({
  tabs,
  activeTab,
  onChange,
  children,
  isGerant = false,
}: {
  tabs: { id: number; label: string; slug: string }[];
  activeTab: number;
  onChange: (id: number) => void;
  children: ReactNode;
  isGerant?: boolean;
}) {
  const { isDark, accent } = useContactAccent(isGerant);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="stage-glass relative mt-4 overflow-hidden !rounded-[24px]"
    >
      <div
        className="absolute inset-x-0 top-0 z-10 h-[3px]"
        style={{ background: `linear-gradient(90deg, ${accent.a}, ${accent.b})`, boxShadow: `0 0 14px ${accent.glow}` }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: isDark
            ? `radial-gradient(100% 70% at 50% 0%, ${accent.a}1F, transparent 62%)`
            : `radial-gradient(100% 70% at 50% 0%, ${accent.a}14, transparent 62%)`,
        }}
      />
      <div className="relative">
        <div className="flex gap-1.5 overflow-x-auto border-b px-4 pb-3 pt-4 scrollbar-thin sm:px-5" style={{ borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(13,148,136,0.12)' }}>
          {tabs.map((t) => {
            const active = activeTab === t.id;
            const Icon = TAB_ICONS[t.slug] || FileText;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onChange(t.id)}
                className={`relative flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all duration-200 ${
                  active
                    ? 'text-white'
                    : isDark
                      ? 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
                      : 'text-slate-500 hover:bg-teal-900/[0.05] hover:text-slate-900'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="contact-detail-tab-pill"
                    className="absolute inset-0 rounded-xl border border-white/20"
                    style={{
                      backgroundImage: `linear-gradient(145deg, ${accent.a} 0%, ${accent.b} 60%, ${accent.b} 100%)`,
                      boxShadow: isDark
                        ? 'inset 0 1px 0 rgba(255,255,255,0.35), 0 8px 20px -8px rgba(0,0,0,0.5)'
                        : `inset 0 1px 0 rgba(255,255,255,0.5), 0 8px 20px -10px ${accent.glow}`,
                    }}
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <Icon size={13} className="relative z-10 shrink-0" />
                <span className="relative z-10 whitespace-nowrap">{t.label}</span>
              </button>
            );
          })}
        </div>
        <div className="p-4 sm:p-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero header — orb initials + type lens, completion lens, KPI chips  */
/* ------------------------------------------------------------------ */

const fmtDate = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : null;

export function ContactHeader({
  contact,
  mandats,
  isGerant = false,
  clientTypes,
}: {
  contact: Contact;
  mandats: Mandat[];
  isGerant?: boolean;
  clientTypes?: string[];
}) {
  const { isDark, accent, ink } = useContactAccent(isGerant);
  const meta = CONTACT_TYPE_META[contact.type] || CONTACT_TYPE_META.Particulier;
  const TypeIcon = meta.icon;

  const completion = calcContactCompletion(contact);
  const completionHue = completion >= 80 ? STAGE_HUES.emerald : completion >= 50 ? STAGE_HUES.amber : RED_HUE;
  const completionInk = isDark ? completionHue.a : completionHue.b;
  const completionHint = completion >= 80 ? 'Fiche complète' : completion >= 50 ? 'En cours' : 'À compléter';

  const fullName = `${contact.civility} ${contact.firstName} ${contact.lastName}`.trim();
  const mandatTypes = clientTypes && clientTypes.length > 0
    ? clientTypes
    : Array.from(new Set(mandats.map((m) => m.clientType)));

  const contactPill = `inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold backdrop-blur-md transition-all duration-200 ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10 hover:text-white' : 'border-slate-200/80 bg-white/70 text-slate-600 shadow-sm hover:bg-white hover:text-slate-900'}`;

  const kpis = [
    { label: 'Email', value: contact.emailPrincipal || '—', icon: Mail },
    { label: 'Mobile', value: contact.mobile || '—', icon: Phone },
    { label: 'Ville', value: contact.ville || '—', icon: MapPin },
    { label: 'Devise', value: contact.devisePreferee || 'MAD', icon: CreditCard },
  ];

  const createdLabel = fmtDate(contact.createdAt);
  const updatedLabel = fmtDate(contact.updatedAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="stage-glass relative overflow-hidden !rounded-[24px]"
    >
      {/* top gradient line */}
      <div
        className="absolute inset-x-0 top-0 z-10 h-[3px]"
        style={{ background: `linear-gradient(90deg, ${accent.a}, ${accent.b})`, boxShadow: `0 0 14px ${accent.glow}` }}
      />
      {/* ambient wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: isDark
            ? `radial-gradient(110% 80% at 50% 0%, ${accent.a}26, transparent 62%), radial-gradient(70% 55% at 100% 100%, ${accent.b}14, transparent 60%)`
            : `radial-gradient(110% 80% at 50% 0%, ${accent.a}1F, transparent 62%), radial-gradient(70% 55% at 100% 100%, ${accent.a}10, transparent 60%)`,
        }}
      />

      <div className="relative space-y-5 p-5 sm:p-6">
        {/* identity row: avatar + name (left), completion lens (right) */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative shrink-0"
            >
              <div
                className="orb-icon select-none text-xl font-extrabold tracking-tight"
                style={{ width: 64, height: 64, borderRadius: 20, '--orb-a': accent.a, '--orb-b': accent.b, '--orb-glow': accent.glow } as CSSProperties}
              >
                {(`${contact.firstName?.[0] || ''}${contact.lastName?.[0] || ''}`).toUpperCase() || '??'}
              </div>
              <span
                className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2"
                style={{
                  borderColor: isDark ? '#0B1022' : '#ffffff',
                  background: `linear-gradient(145deg, ${accent.a}, ${accent.b})`,
                  boxShadow: `0 2px 8px ${accent.glow}`,
                }}
              >
                <TypeIcon size={10} className="text-white" />
              </span>
            </motion.div>

            <div className="min-w-0 flex-1 pt-0.5">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                className={`truncate text-xl font-extrabold tracking-[-0.4px] sm:text-2xl ${isDark ? 'text-white' : 'text-slate-900'}`}
              >
                {fullName}
              </motion.h1>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="mt-2 flex flex-wrap items-center gap-1.5"
              >
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] backdrop-blur-md"
                  style={stagePillStyle(meta.hue, isDark)}
                >
                  <TypeIcon size={10} />
                  {meta.label}
                </span>
                {mandatTypes.map((ct) => {
                  const m = CONTACT_MANDAT_META[ct];
                  const Icon = m?.icon;
                  return (
                    <span
                      key={ct}
                      className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold"
                      style={stagePillStyle(m?.hue || accent, isDark)}
                    >
                      {Icon && <Icon size={9} />}
                      {ct}
                    </span>
                  );
                })}
              </motion.div>
              <div className={`mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {contact.profession && <span className="font-semibold" style={{ color: ink }}>{contact.profession}</span>}
                {contact.createdAt && <span>· Créé le {createdLabel}</span>}
              </div>
            </div>
          </div>

          {/* completion lens: standalone staged chip */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            title={`Fiche complétée à ${completion}%`}
            className={`flex shrink-0 items-center gap-3 rounded-2xl border px-3.5 py-2.5 backdrop-blur-sm sm:ml-auto ${isDark ? 'border-white/[0.07] bg-white/[0.04]' : 'border-slate-200/70 bg-white/75 shadow-[0_1px_2px_rgba(15,23,42,0.05)]'}`}
          >
            <CompletionRing percent={completion} size={46} strokeWidth={4} showLabel={true} />
            <div className="leading-tight">
              <p className={`text-[9px] font-bold uppercase tracking-[0.14em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Complétion
              </p>
              <p className="text-base font-extrabold tabular-nums" style={{ color: completionInk }}>
                {completion}%
              </p>
              <p className={`text-[10px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {completionHint}
              </p>
            </div>
          </motion.div>
        </div>

        {/* KPI chips */}
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {kpis.map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className={`rounded-2xl border p-3 backdrop-blur-sm ${isDark ? 'border-white/[0.07] bg-white/[0.04]' : 'border-slate-200/70 bg-white/75 shadow-[0_1px_2px_rgba(15,23,42,0.05)]'}`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border"
                    style={isDark
                      ? { background: `${accent.a}14`, borderColor: `${accent.a}30`, color: accent.a }
                      : { background: `${accent.a}12`, borderColor: `${accent.a}30`, color: ink }}
                  >
                    <Icon size={13} />
                  </span>
                  <span className={`truncate text-[10px] font-bold uppercase tracking-[0.12em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {kpi.label}
                  </span>
                </div>
                <p className={`mt-1.5 truncate text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {kpi.value}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* contact pills + timestamps */}
        <div className={`flex flex-col gap-3 border-t pt-4 lg:flex-row lg:items-center ${isDark ? 'border-white/[0.06]' : 'border-teal-900/10'}`}>
          <div className="flex flex-wrap items-center gap-1.5">
            {contact.mobile && (
              <a href={`tel:${contact.mobile}`} className={contactPill}>
                <Phone size={12} style={{ color: ink }} /> {contact.mobile}
              </a>
            )}
            {contact.telephoneFixe && (
              <a href={`tel:${contact.telephoneFixe}`} className={contactPill}>
                <Phone size={12} style={{ color: ink }} /> {contact.telephoneFixe}
              </a>
            )}
            {contact.emailPrincipal && (
              <a href={`mailto:${contact.emailPrincipal}`} className={contactPill}>
                <Mail size={12} style={{ color: ink }} /> <span className="max-w-[220px] truncate">{contact.emailPrincipal}</span>
              </a>
            )}
            {contact.emailSecondaire && (
              <a href={`mailto:${contact.emailSecondaire}`} className={contactPill}>
                <Mail size={12} style={{ color: ink }} /> <span className="max-w-[200px] truncate">{contact.emailSecondaire}</span>
              </a>
            )}
            {contact.langueParlee?.length > 0 && (
              <span className={contactPill}>
                <Globe size={12} style={{ color: ink }} /> {contact.langueParlee.join(', ')}
              </span>
            )}
            {contact.moyenContactPrefere && (
              <span className={contactPill}>
                <MessageSquare size={12} style={{ color: ink }} /> {contact.moyenContactPrefere}
              </span>
            )}
          </div>
          {(createdLabel || updatedLabel) && (
            <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold lg:ml-auto ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {createdLabel && <span>Créé le {createdLabel}</span>}
              {updatedLabel && <span>Modifié le {updatedLabel}</span>}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Staged mandat cards                                                 */
/* ------------------------------------------------------------------ */

function MandatField({ icon: Icon, label, value, isDark, hue }: { icon: IconType; label: string; value?: string | number | null | boolean; isDark: boolean; hue: StageHue }) {
  if (value === null || value === undefined || value === '') return null;
  const display = typeof value === 'boolean' ? (value ? 'Oui' : 'Non') : typeof value === 'number' ? value.toLocaleString('fr-FR') : value;
  return (
    <div className="flex items-start gap-2 py-1">
      <span
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border"
        style={isDark
          ? { background: `${hue.a}14`, borderColor: `${hue.a}30`, color: hue.a }
          : { background: `${hue.a}12`, borderColor: `${hue.a}30`, color: hue.b }}
      >
        <Icon size={10} />
      </span>
      <div className="min-w-0">
        <p className={`text-[9px] font-bold uppercase tracking-[0.14em] leading-none mb-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
        <p className={`text-xs font-bold leading-snug ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{display}</p>
      </div>
    </div>
  );
}

function MandatBlock({ title, isDark, accent, children }: { title: string; isDark: boolean; accent: StageHue; children: ReactNode }) {
  return (
    <div className="pt-3" style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)'}` }}>
      <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em]" style={{ color: isDark ? accent.a : accent.b }}>{title}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">{children}</div>
    </div>
  );
}

function MandatStatusPill({ mandat, isDark }: { mandat: Mandat; isDark: boolean }) {
  const s = mandat.statutMandat || mandat.statutReservation || '';
  if (!s) return null;
  const key = normalizeStatus(s);
  const hue = key === 'actif' ? STAGE_HUES.emerald : key === 'en attente' ? STAGE_HUES.amber : RED_HUE;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.08em]"
      style={isDark
        ? { background: `${hue.a}22`, color: hue.a, border: `1px solid ${hue.a}40` }
        : { background: `${hue.a}16`, color: hue.b, border: `1px solid ${hue.a}3C` }}
    >
      {key === 'actif' && <span className="relative flex h-1 w-1">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: hue.line }} />
        <span className="relative inline-flex h-1 w-1 rounded-full" style={{ background: hue.line }} />
      </span>}
      {s}
    </span>
  );
}

function MandatMetierPill({ mandat, isDark }: { mandat: Mandat; isDark: boolean }) {
  const s = mandat.statutMetier;
  if (!s) return null;
  const ok = ['En mandat', 'Confirmé', 'Payé', 'Vendu', 'Loué', 'Installé', 'En séjour'].includes(s);
  const hue = ok ? STAGE_HUES.emerald : STAGE_HUES.amber;
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.08em]"
      style={isDark
        ? { background: `${hue.a}22`, color: hue.a, border: `1px solid ${hue.a}40` }
        : { background: `${hue.a}16`, color: hue.b, border: `1px solid ${hue.a}3C` }}
    >
      {s}
    </span>
  );
}

const SECTION_TITLES: Record<string, string> = {
  Vendeur: 'Mandat de vente',
  Acheteur: 'Mandat de recherche',
  Bailleur: 'Mandat de gestion',
  Locataire: 'Mandat de recherche location',
  Voyageur: 'Informations de réservation',
};

export function RichMandatCard({ mandat, index, total, isGerant = false }: { mandat: Mandat; index: number; total: number; isGerant?: boolean }) {
  const { isDark, accent } = useContactAccent(isGerant);
  const meta = CONTACT_MANDAT_META[mandat.clientType];
  const Icon = meta?.icon || FileText;
  const hue = meta?.hue || accent;
  const isVoyageur = mandat.clientType === 'Voyageur';
  const numeroRef = isVoyageur ? (mandat.numeroReservation || mandat.numeroMandat) : mandat.numeroMandat;
  const isActive = mandat.status === 'Actif';
  const isExpired = mandat.status === 'Expiré';
  const stripe = isActive
    ? `linear-gradient(90deg, ${STAGE_HUES.emerald.a}, ${STAGE_HUES.emerald.b})`
    : isExpired
      ? 'linear-gradient(90deg, rgba(148,163,184,0.5), rgba(148,163,184,0.25))'
      : `linear-gradient(90deg, ${STAGE_HUES.amber.a}, ${STAGE_HUES.amber.b})`;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border transition-all ${
        isExpired ? 'opacity-75 border-dashed' : ''
      } ${isDark ? 'border-white/[0.08] bg-white/[0.03]' : 'border-slate-200/70 bg-white/85 shadow-[0_1px_2px_rgba(15,23,42,0.05)]'}`}
      style={isExpired && !isDark ? { borderColor: 'rgba(15,23,42,0.18)' } : undefined}
    >
      <div className="h-1.5 w-full" style={{ background: stripe }} />
      <div className="space-y-3 p-4 sm:p-5">
        {/* header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className="orb-icon shrink-0 select-none"
              style={{ width: 40, height: 40, borderRadius: 12, '--orb-a': hue.a, '--orb-b': hue.b, '--orb-glow': hue.glow } as CSSProperties}
            >
              <Icon size={17} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{mandat.clientType}</span>
                {numeroRef && (
                  <span
                    title={`N° ${isVoyageur ? 'de réservation' : 'de mandat'}`}
                    className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold ${isDark ? 'border border-white/10 bg-white/[0.06] text-slate-300' : 'border border-slate-200/80 bg-slate-100 text-slate-600'}`}
                  >
                    {numeroRef}
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <MandatStatusPill mandat={mandat} isDark={isDark} />
                <MandatMetierPill mandat={mandat} isDark={isDark} />
              </div>
            </div>
          </div>
          <span className={`shrink-0 text-[10px] font-mono tabular-nums ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{index + 1}/{total}</span>
        </div>

        {/* section title banner */}
        <div
          className="rounded-lg px-3 py-2"
          style={isDark
            ? { background: `${hue.a}12`, border: `1px solid ${hue.a}26` }
            : { background: `${hue.a}0F`, border: `1px solid ${hue.a}26` }}
        >
          <p className="text-xs font-bold" style={{ color: isDark ? hue.a : hue.b }}>
            {SECTION_TITLES[mandat.clientType] || 'Mandat'}
          </p>
        </div>

        <MandatBlock title="Informations du mandat" isDark={isDark} accent={hue}>
          {mandat.numeroMandat && <MandatField icon={FileText} label="Numéro" value={mandat.numeroMandat} isDark={isDark} hue={hue} />}
          {mandat.typeMandat && <MandatField icon={FileText} label="Type" value={mandat.typeMandat} isDark={isDark} hue={hue} />}
          {mandat.dateSignature && <MandatField icon={Clock} label="Date signature" value={mandat.dateSignature} isDark={isDark} hue={hue} />}
          <MandatField icon={Clock} label={isVoyageur ? 'Arrivée' : 'Date début'} value={mandat.startDate} isDark={isDark} hue={hue} />
          {mandat.endDate && <MandatField icon={Clock} label={isVoyageur ? 'Départ' : 'Date expiration'} value={mandat.endDate} isDark={isDark} hue={hue} />}
          {mandat.conjoint && <MandatField icon={User} label="Conjoint" value={mandat.conjoint} isDark={isDark} hue={hue} />}
          {mandat.societe && <MandatField icon={Briefcase} label={mandat.clientType === 'Bailleur' ? 'Société (SCI)' : 'Société'} value={mandat.societe} isDark={isDark} hue={hue} />}
          {mandat.agentDesigne && <MandatField icon={User} label="Agent désigné" value={mandat.agentDesigne} isDark={isDark} hue={hue} />}
        </MandatBlock>

        {/* Voyageur: séjour details */}
        {isVoyageur && (
          <MandatBlock title="Détails du séjour" isDark={isDark} accent={hue}>
            {mandat.bienReserve && <MandatField icon={Home} label="Bien réservé" value={mandat.bienReserve} isDark={isDark} hue={hue} />}
            {mandat.nbNuits != null && mandat.nbNuits > 0 && <MandatField icon={CreditCard} label="Nuits" value={mandat.nbNuits} isDark={isDark} hue={hue} />}
            {mandat.nbAdultes != null && <MandatField icon={User} label="Adultes" value={mandat.nbAdultes} isDark={isDark} hue={hue} />}
            {mandat.nbEnfants != null && mandat.nbEnfants > 0 && <MandatField icon={User} label="Enfants" value={mandat.nbEnfants} isDark={isDark} hue={hue} />}
            {mandat.checkInHeure && <MandatField icon={Clock} label="Check-in" value={mandat.checkInHeure} isDark={isDark} hue={hue} />}
            {mandat.checkOutHeure && <MandatField icon={Clock} label="Check-out" value={mandat.checkOutHeure} isDark={isDark} hue={hue} />}
            {mandat.conditionAnnulation && <MandatField icon={Key} label="Annulation" value={mandat.conditionAnnulation} isDark={isDark} hue={hue} />}
            {mandat.animauxAcceptes != null && <MandatField icon={Tag} label="Animaux" value={mandat.animauxAcceptes} isDark={isDark} hue={hue} />}
            {mandat.fumeur != null && <MandatField icon={Tag} label="Fumeur" value={!mandat.fumeur ? 'Non-fumeur' : 'Fumeur'} isDark={isDark} hue={hue} />}
          </MandatBlock>
        )}

        {/* Voyageur: paiement */}
        {isVoyageur && (
          <MandatBlock title="Paiement" isDark={isDark} accent={hue}>
            {mandat.tarifNuit != null && <MandatField icon={CreditCard} label="€/nuit" value={mandat.tarifNuit} isDark={isDark} hue={hue} />}
            {mandat.montantTotalHorsOptions != null && <MandatField icon={CreditCard} label="Total hors opts" value={mandat.montantTotalHorsOptions} isDark={isDark} hue={hue} />}
            {mandat.montantTotalAvecOptions != null && <MandatField icon={CreditCard} label="Total avec opts" value={mandat.montantTotalAvecOptions} isDark={isDark} hue={hue} />}
            {mandat.acompteMontant != null && <MandatField icon={CreditCard} label="Acompte" value={mandat.acompteMontant} isDark={isDark} hue={hue} />}
            {mandat.soldeRestant != null && <MandatField icon={CreditCard} label="Solde restant" value={mandat.soldeRestant} isDark={isDark} hue={hue} />}
            {mandat.cautionMontant != null && <MandatField icon={Key} label="Caution" value={mandat.cautionMontant} isDark={isDark} hue={hue} />}
          </MandatBlock>
        )}

        {/* Non-voyageur: clause de protection */}
        {!isVoyageur && mandat.dureeProtection && (
          <MandatBlock title="Clause de protection" isDark={isDark} accent={hue}>
            <MandatField icon={Key} label="Clause" value="Activée" isDark={isDark} hue={hue} />
            <MandatField icon={Clock} label="Durée" value={`${mandat.dureeProtection} mois`} isDark={isDark} hue={hue} />
          </MandatBlock>
        )}

        {/* Non-voyageur: rémunération */}
        {!isVoyageur && (
          <MandatBlock title="Rémunération" isDark={isDark} accent={hue}>
            {mandat.typeRemuneration && <MandatField icon={CreditCard} label="Type" value={mandat.typeRemuneration} isDark={isDark} hue={hue} />}
            {mandat.montantRemuneration != null && (
              <MandatField
                icon={CreditCard}
                label={mandat.remunerationIsPercentage ? 'Taux' : 'Montant'}
                value={mandat.remunerationIsPercentage ? `${mandat.montantRemuneration}%` : `${mandat.montantRemuneration} MAD`}
                isDark={isDark}
                hue={hue}
              />
            )}
            {mandat.conditionPaiement && <MandatField icon={CreditCard} label="Condition paiement" value={mandat.conditionPaiement} isDark={isDark} hue={hue} />}
            {mandat.clientType === 'Bailleur' && mandat.fraisMiseEnLocation != null && <MandatField icon={CreditCard} label="Frais mise en location" value={`${mandat.fraisMiseEnLocation} MAD`} isDark={isDark} hue={hue} />}
            {mandat.clientType === 'Bailleur' && mandat.fraisEtatDesLieux != null && <MandatField icon={CreditCard} label="Frais état des lieux" value={`${mandat.fraisEtatDesLieux} MAD`} isDark={isDark} hue={hue} />}
            {mandat.clientType === 'Bailleur' && mandat.fraisRenouvellementBail != null && <MandatField icon={CreditCard} label="Frais renouvellement" value={`${mandat.fraisRenouvellementBail} MAD`} isDark={isDark} hue={hue} />}
          </MandatBlock>
        )}

        {/* mandat PDF */}
        {(mandat.mandatPdfUrl || mandat.contratPdfUrl) && (
          <div className="pt-3" style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)'}` }}>
            <a
              href={mandat.mandatPdfUrl || mandat.contratPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold hover:underline"
              style={{ color: isDark ? accent.a : accent.b }}
            >
              <FileText size={13} />
              {mandat.mandatPdfName || (isVoyageur ? 'Contrat signé (PDF)' : 'Mandat signé (PDF)')}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mandats section — pager + count chips + add CTA                     */
/* ------------------------------------------------------------------ */

export function MandatsStageSection({ mandats, onAddMandat, isGerant = false }: { mandats: Mandat[]; onAddMandat: () => void; isGerant?: boolean }) {
  const { isDark, accent, ink } = useContactAccent(isGerant);
  const activeMandats = mandats.filter((m) => m.status === 'Actif');
  const pendingMandats = mandats.filter((m) => m.status === 'En attente');
  const expiredMandats = mandats.filter((m) => m.status === 'Expiré');
  const allMandats = [...activeMandats, ...pendingMandats, ...expiredMandats];
  const hasMultiple = allMandats.length > 1;
  const [page, setPage] = useState(0);
  const [dir, setDir] = useState(0);

  const goTo = (n: number) => {
    const next = ((n % allMandats.length) + allMandats.length) % allMandats.length;
    setDir(n > page ? 1 : -1);
    setPage(next);
  };

  return (
    <div className="space-y-4">
      {allMandats.length === 0 ? (
        <div>
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border"
            style={isDark
              ? { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: accent.a }
              : { background: 'rgba(15,23,42,0.03)', borderColor: 'rgba(15,23,42,0.08)', color: ink }}
          >
            <FileText size={22} />
          </div>
          <p className={`mt-3 text-sm font-bold text-center ${isDark ? 'text-white' : 'text-slate-900'}`}>Aucun mandat</p>
          <p className={`mt-1 text-xs text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Ajoutez un mandat pour suivre l'activité du contact</p>
        </div>
      ) : hasMultiple ? (
        <div
          className={`relative overflow-hidden rounded-2xl border ${isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-slate-200/60 bg-white/50'}`}
          style={{ minHeight: 120 }}
        >
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.div
              key={page}
              initial={{ opacity: 0, x: dir * 26, filter: 'blur(5px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: dir * -20, filter: 'blur(4px)' }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="p-4 sm:p-5"
            >
              <RichMandatCard mandat={allMandats[page]} index={page} total={allMandats.length} isGerant={isGerant} />
            </motion.div>
          </AnimatePresence>
          {/* pager controls */}
          <div className="flex items-center justify-between px-4 pb-4 sm:px-5">
            <button
              type="button"
              onClick={() => goTo(page - 1)}
              aria-label="Mandat précédent"
              className={`flex h-8 w-8 items-center justify-center rounded-lg border backdrop-blur-md transition-all hover:scale-105 active:scale-95 ${isDark ? 'border-white/10 bg-white/[0.05] text-slate-300 hover:bg-white/10 hover:text-white' : 'border-slate-200/80 bg-white text-slate-500 shadow-sm hover:text-slate-900'}`}
            >
              <ChevronLeft size={14} />
            </button>
            <div className="flex items-center gap-1.5">
              {allMandats.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Mandat ${i + 1}`}
                  onClick={() => goTo(i)}
                  className="rounded-full transition-all duration-200"
                  style={i === page
                    ? { width: 18, height: 5, background: `linear-gradient(90deg, ${accent.a}, ${accent.b})`, boxShadow: `0 0 8px ${accent.glow}` }
                    : { width: 5, height: 5, background: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.15)' }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => goTo(page + 1)}
              aria-label="Mandat suivant"
              className={`flex h-8 w-8 items-center justify-center rounded-lg border backdrop-blur-md transition-all hover:scale-105 active:scale-95 ${isDark ? 'border-white/10 bg-white/[0.05] text-slate-300 hover:bg-white/10 hover:text-white' : 'border-slate-200/80 bg-white text-slate-500 shadow-sm hover:text-slate-900'}`}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      ) : (
        <RichMandatCard mandat={allMandats[0]} index={0} total={1} isGerant={isGerant} />
      )}

      {onAddMandat && (
        <button
          type="button"
          onClick={onAddMandat}
          className={`flex w-full items-center justify-center gap-2 rounded-xl border border-dashed py-2.5 text-xs font-bold transition-all hover:scale-[1.01] active:scale-[0.98] ${
            isDark ? 'border-white/15 text-slate-300 hover:border-white/30 hover:bg-white/[0.05] hover:text-white' : 'border-slate-300/80 text-slate-500 hover:border-teal-500/50 hover:bg-teal-50 hover:text-teal-800'
          }`}
        >
          <Plus size={14} /> Ajouter un mandat
        </button>
      )}
    </div>
  );
}
