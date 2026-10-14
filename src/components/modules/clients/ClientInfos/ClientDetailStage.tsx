import type { CSSProperties, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sliders, Star, MapPin, Zap, DollarSign, CreditCard, FileText, BarChart2,
  Folder, TrendingUp, MessageSquare, User, Calendar, Shield, Home, Tag, Info,
  Navigation, ShoppingBag, BookOpen, Activity, Coffee, Tv, Eye, Layers, ChevronRight,
} from 'react-feather';
import { useStageTheme, STAGE_HUES, ShimmerProgress, type StageHue } from '../../../dashboard/Stage';
import { getClientStatusHue } from '../ClientCard';

/* =====================================================================
   ClientDetailStage — shared staged kit for the client detail tabs:
   glass shell + sliding pill tab bar + chip fields + section titles +
   status pills. One language for Acheteur / Vendeur / Bailleur /
   Locataire / Voyageur, fluid in both themes.
   ===================================================================== */

export const DETAIL_TYPE_HUE: Record<string, StageHue> = {
  Acheteur: STAGE_HUES.violet,
  Vendeur: STAGE_HUES.sky,
  Bailleur: STAGE_HUES.emerald,
  Locataire: STAGE_HUES.amber,
  Voyageur: STAGE_HUES.fuchsia,
};

export const SIDEBAR_EMERALD: StageHue = {
  a: '#2DD4BF',
  b: '#0D9488',
  glow: 'rgba(13,148,136,0.35)',
  line: '#14B8A6',
};
export const LIGHT_INK = '#0F766E';
export const GERANT_HUE: StageHue = {
  a: '#C9A0A0',
  b: '#905D5D',
  glow: 'rgba(144,93,93,0.35)',
  line: '#905D5D',
};
export const SKY_PILL_HUE: StageHue = {
  a: '#38BDF8',
  b: '#0369A1',
  glow: 'rgba(56,189,248,0.40)',
  line: '#38BDF8',
};

/** Theme + accent resolution shared by every detail tab component. */
export function useDetailAccent(clientType?: string, isGerant = false) {
  const theme = useStageTheme();
  const isDark = theme === 'dark';
  const typeHue = DETAIL_TYPE_HUE[clientType || ''] || STAGE_HUES.violet;
  const accent = isGerant ? GERANT_HUE : (isDark ? typeHue : SIDEBAR_EMERALD);
  const ink = isGerant ? '#905D5D' : (isDark ? typeHue.a : LIGHT_INK);
  return { isDark, accent, ink };
}

/** Pill dress shared with cards/headers (white on dark, deep hue on light). */
export function stagePillStyle(hue: StageHue, isDark: boolean): CSSProperties {
  return isDark
    ? { background: `${hue.a}2E`, color: '#fff', border: `1px solid ${hue.a}5C`, boxShadow: `0 2px 12px ${hue.glow}, inset 0 1px 0 rgba(255,255,255,0.14)` }
    : { background: `${hue.a}1C`, color: hue.b, border: `1px solid ${hue.a}42`, boxShadow: `0 2px 10px ${hue.glow}, inset 0 1px 0 rgba(255,255,255,0.7)` };
}

type IconType = React.ComponentType<{ size?: number | string; className?: string; style?: CSSProperties }>;

const TAB_ICONS: Record<string, IconType> = {
  criteres: Sliders,
  infos: Info,
  caracteristiques: Star,
  proximites: MapPin,
  prestations: Zap,
  finances: DollarSign,
  financement: CreditCard,
  mandat: FileText,
  croisements: BarChart2,
  documents: Folder,
  transactions: TrendingUp,
  contrats: FileText,
  notes_activite: MessageSquare,
  prix_honoraires: DollarSign,
  loyer_charges: Home,
  situation: User,
  budget_periode: Calendar,
  paiement_sejour: CreditCard,
  contrat: FileText,
  solvabilite: Shield,
};

/* ------------------------------------------------------------------ */
/* Staged tab shell: glass panel + scrollable pill bar + animated swap */
/* ------------------------------------------------------------------ */

export function ClientTabsShell({
  tabs,
  activeTab,
  onChange,
  clientType,
  isGerant = false,
  children,
}: {
  tabs: { id: number; label: string; slug: string }[];
  activeTab: number;
  onChange: (id: number) => void;
  clientType?: string;
  isGerant?: boolean;
  children: ReactNode;
}) {
  const { isDark, accent } = useDetailAccent(clientType, isGerant);
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
        {/* pill bar */}
        <div className="flex gap-1.5 overflow-x-auto border-b px-4 pb-3 pt-4 scrollbar-thin sm:px-5" style={{ borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(13,148,136,0.12)' }}>
          {tabs.map((t) => {
            const active = activeTab === t.id;
            const Icon = TAB_ICONS[t.slug] || Tag;
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
                    layoutId="client-detail-tab-pill"
                    className="absolute inset-0 rounded-xl border border-white/20"
                    style={{
                      backgroundImage: isGerant
                        ? 'linear-gradient(145deg, #C9A0A0 0%, #905D5D 100%)'
                        : isDark
                          ? 'linear-gradient(145deg, #8B7CFF 0%, #6C5ECF 60%, #5646C9 100%)'
                          : 'linear-gradient(145deg, #2DD4BF 0%, #14B8A6 60%, #0D9488 100%)',
                      boxShadow: isDark || isGerant
                        ? 'inset 0 1px 0 rgba(255,255,255,0.35), 0 8px 20px -8px rgba(0,0,0,0.5)'
                        : 'inset 0 1px 0 rgba(255,255,255,0.5), 0 8px 20px -10px rgba(13,148,136,0.55)',
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
        {/* content */}
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
/* Staged field — glass chip replacement for InfoField in criteria     */
/* ------------------------------------------------------------------ */

export function StageField({
  icon: Icon,
  label,
  value,
  accent,
  ink,
  isDark,
  delay = 0,
  action,
}: {
  icon: IconType;
  label: string;
  value: ReactNode;
  accent: StageHue;
  ink: string;
  isDark: boolean;
  delay?: number;
  action?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`rounded-2xl border p-3 backdrop-blur-sm transition-colors duration-300 ${
        isDark
          ? 'border-white/[0.07] bg-white/[0.04]'
          : 'border-slate-200/70 bg-white/75 shadow-[0_1px_2px_rgba(15,23,42,0.05)]'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border"
            style={
              isDark
                ? { background: `${accent.a}14`, borderColor: `${accent.a}30`, color: accent.a }
                : { background: `${accent.a}12`, borderColor: `${accent.a}30`, color: ink }
            }
          >
            <Icon size={13} />
          </span>
          <span className={`truncate text-[10px] font-bold uppercase tracking-[0.12em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {label}
          </span>
        </div>
        {action}
      </div>
      <p className={`mt-1.5 text-sm font-bold leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
        {value}
      </p>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Staged empty state                                                  */
/* ------------------------------------------------------------------ */
export function StageSection({
  icon: Icon,
  title,
  accent,
  ink,
  isDark,
  delay = 0,
  children,
}: {
  icon: IconType;
  title: string;
  accent: StageHue;
  ink: string;
  isDark: boolean;
  delay?: number;
  children: ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mb-2.5 flex items-center gap-2">
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border"
          style={
            isDark
              ? { background: `${accent.a}14`, borderColor: `${accent.a}30`, color: accent.a }
              : { background: `${accent.a}12`, borderColor: `${accent.a}30`, color: ink }
          }
        >
          <Icon size={12} />
        </span>
        <h4 className={`shrink-0 text-[10px] font-extrabold uppercase tracking-[0.16em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {title}
        </h4>
        <span
          aria-hidden="true"
          className="h-px flex-1"
          style={{ background: isDark ? `linear-gradient(90deg, ${accent.a}30, transparent)` : `linear-gradient(90deg, ${accent.a}35, transparent)` }}
        />
      </div>
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">{children}</div>
    </motion.section>
  );
}

/* ------------------------------------------------------------------ */
/* Header pills row — Statut (status hue) + Classification + Origine   */
/* ------------------------------------------------------------------ */

export function HeaderPills({
  statutMetier,
  classification,
  source,
  extra,
  isDark,
}: {
  statutMetier?: string;
  classification?: string;
  source?: string;
  extra?: ReactNode;
  isDark: boolean;
}) {
  if (!statutMetier && !classification && !source && !extra) return null;
  const statusHue = getClientStatusHue(statutMetier) || SKY_PILL_HUE;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-wrap items-center gap-2"
    >
      {statutMetier && (
        <span className={`flex items-center gap-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <span className="font-semibold">Statut :</span>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] backdrop-blur-md"
            style={stagePillStyle(statusHue, isDark)}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: statusHue.line }} />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: statusHue.line, boxShadow: `0 0 8px ${statusHue.glow}` }} />
            </span>
            {statutMetier}
          </span>
        </span>
      )}
      {classification && (
        <span className={`flex items-center gap-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <span className="font-semibold">Classification :</span>
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-200' : 'border-slate-200/80 bg-white/70 text-slate-600'}`}>
            {classification}
          </span>
        </span>
      )}
      {source && (
        <span className={`flex items-center gap-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <span className="font-semibold">Origine :</span>
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-bold"
            style={isDark
              ? { background: `${SKY_PILL_HUE.a}1E`, color: SKY_PILL_HUE.a, border: `1px solid ${SKY_PILL_HUE.a}36` }
              : { background: `${SKY_PILL_HUE.a}14`, color: SKY_PILL_HUE.b, border: `1px solid ${SKY_PILL_HUE.a}36` }}
          >
            {source}
          </span>
        </span>
      )}
      {extra}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Staged tag group — label row + wrapping pills (primary = accent)    */
/* ------------------------------------------------------------------ */

export function StageTags({
  icon: Icon,
  label,
  items,
  accent,
  ink,
  isDark,
  primary = true,
  delay = 0,
}: {
  icon: IconType;
  label: string;
  items: string[];
  accent: StageHue;
  ink: string;
  isDark: boolean;
  primary?: boolean;
  delay?: number;
}) {
  if (!items || items.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`rounded-2xl border p-3 backdrop-blur-sm ${
        isDark
          ? 'border-white/[0.07] bg-white/[0.04]'
          : 'border-slate-200/70 bg-white/75 shadow-[0_1px_2px_rgba(15,23,42,0.05)]'
      }`}
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border"
          style={
            isDark
              ? { background: `${accent.a}14`, borderColor: `${accent.a}30`, color: accent.a }
              : { background: `${accent.a}12`, borderColor: `${accent.a}30`, color: ink }
          }
        >
          <Icon size={12} />
        </span>
        <span className={`text-[10px] font-extrabold uppercase tracking-[0.16em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {label}
        </span>
        <span
          className="rounded-full px-1.5 py-0.5 text-[9px] font-extrabold tabular-nums"
          style={
            isDark
              ? { background: `${accent.a}14`, color: accent.a, border: `1px solid ${accent.a}30` }
              : { background: `${accent.a}12`, color: ink, border: `1px solid ${accent.a}30` }
          }
        >
          {items.length}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="inline-flex max-w-full items-center truncate rounded-lg px-2 py-1 text-[11px] font-semibold"
            style={
              primary
                ? isDark
                  ? { background: `${accent.a}1E`, color: accent.a, border: `1px solid ${accent.a}36` }
                  : { background: `${accent.a}14`, color: ink, border: `1px solid ${accent.a}36` }
                : isDark
                  ? { background: 'rgba(255,255,255,0.04)', color: '#CBD5E1', border: '1px solid rgba(255,255,255,0.10)' }
                  : { background: 'rgba(255,255,255,0.6)', color: '#64748B', border: '1px solid rgba(15,23,42,0.10)' }
            }
          >
            <span className="truncate">{item}</span>
          </span>
        ))}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Proximités grid — one staged tag card per non-empty category        */
/* ------------------------------------------------------------------ */

export interface ProximitesData {
  transports?: string[];
  commerces?: string[];
  education?: string[];
  sante?: string[];
  loisirs?: string[];
}

const PROX_CONFIG: { key: keyof ProximitesData; label: string; icon: IconType }[] = [
  { key: 'transports', label: 'Transports', icon: Navigation },
  { key: 'commerces', label: 'Commerces & Services', icon: ShoppingBag },
  { key: 'education', label: 'Éducation', icon: BookOpen },
  { key: 'sante', label: 'Santé & Sport', icon: Activity },
  { key: 'loisirs', label: 'Loisirs & Nature', icon: Coffee },
];

export function ProximitesGrid({
  data,
  accent,
  ink,
  isDark,
}: {
  data?: ProximitesData | null;
  accent: StageHue;
  ink: string;
  isDark: boolean;
}) {
  const cats = PROX_CONFIG.filter((c) => data?.[c.key]?.length);
  if (cats.length === 0) return <StageEmpty isDark={isDark} />;
  return (
    <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
      {cats.map((c, i) => (
        <StageTags
          key={c.key}
          icon={c.icon}
          label={c.label}
          items={data?.[c.key] || []}
          accent={accent}
          ink={ink}
          isDark={isDark}
          delay={i * 0.05}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Prestations grid — one staged tag card per non-empty category       */
/* ------------------------------------------------------------------ */

export interface PrestationsData {
  exterieur?: string[];
  confort?: string[];
  electromenager?: string[];
  multimedia?: string[];
  sport?: string[];
}

const PREST_CONFIG: { key: keyof PrestationsData; label: string; icon: IconType }[] = [
  { key: 'exterieur', label: 'Extérieur & Sécurité', icon: Shield },
  { key: 'confort', label: 'Confort & Équipement', icon: Coffee },
  { key: 'electromenager', label: 'Électroménager & Mobilier', icon: Zap },
  { key: 'multimedia', label: 'Multimédia & Communication', icon: Tv },
  { key: 'sport', label: 'Sport & Loisirs', icon: Activity },
];

export function PrestationsGrid({
  data,
  accent,
  ink,
  isDark,
  labels,
  only,
}: {
  data?: PrestationsData | null;
  accent: StageHue;
  ink: string;
  isDark: boolean;
  /** per-key label overrides (e.g. Voyageur wording) */
  labels?: Partial<Record<keyof PrestationsData, string>>;
  /** restrict visible categories (defaults to all five) */
  only?: (keyof PrestationsData)[];
}) {
  const cats = PREST_CONFIG.filter((c) => (!only || only.includes(c.key)) && data?.[c.key]?.length);
  if (cats.length === 0) return <StageEmpty isDark={isDark} />;
  return (
    <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
      {cats.map((c, i) => (
        <StageTags
          key={c.key}
          icon={c.icon}
          label={labels?.[c.key] || c.label}
          items={data?.[c.key] || []}
          accent={accent}
          ink={ink}
          isDark={isDark}
          delay={i * 0.05}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Staged empty state                                                  */
/* ------------------------------------------------------------------ */
export function StageEmpty({ isDark }: { isDark: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center py-12 text-center"
    >
      <div
        className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border backdrop-blur-sm ${
          isDark ? 'border-white/10 bg-white/[0.04] text-slate-500' : 'border-slate-200/70 bg-white/70 text-slate-400 shadow-sm'
        }`}
      >
        <Info size={22} />
      </div>
      <p className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
        Aucune information renseignée pour cette section
      </p>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Finance primitives — generic pill, hero amount, progress, doc row   */
/* ------------------------------------------------------------------ */

export const SLATE_STAGE_HUE: StageHue = {
  a: '#94A3B8', b: '#475569', glow: 'rgba(148,163,184,0.35)', line: '#94A3B8',
};
export const RED_STAGE_HUE: StageHue = {
  a: '#F87171', b: '#B91C1C', glow: 'rgba(248,113,113,0.40)', line: '#F87171',
};
export const OK_STAGE_HUE: StageHue = STAGE_HUES.emerald;

function normalizeStageKey(s?: string): string {
  return (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const FIN_STATUS_HUES: Record<string, StageHue> = {
  'en cours': STAGE_HUES.amber,
  accorde: STAGE_HUES.emerald,
  refuse: RED_STAGE_HUE,
};

/** Convenient hue for a financement statut (Accordé / En cours / Refusé). */
export function getFinancementStatusHue(status?: string): StageHue | undefined {
  const key = normalizeStageKey(status);
  if (!key) return undefined;
  return FIN_STATUS_HUES[key];
}

/** Generic staged pill (status, Oui/Non, …) — readable in both themes. */
export function StagePill({
  label,
  hue,
  isDark,
  dot = true,
}: {
  label: string;
  hue: StageHue;
  isDark: boolean;
  dot?: boolean;
}) {
  return (
    <span
      className="inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold backdrop-blur-md"
      style={stagePillStyle(hue, isDark)}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ background: hue.line, boxShadow: `0 0 6px ${hue.glow}` }}
        />
      )}
      <span className="truncate">{label}</span>
    </span>
  );
}

/** Hero amount card — big staged figure (FAI price, loyer CC, …). */
export function StageHeroAmount({
  icon: Icon,
  label,
  value,
  hint,
  accent,
  ink,
  isDark,
  delay = 0,
}: {
  icon: IconType;
  label: string;
  value: string;
  hint?: string;
  accent: StageHue;
  ink: string;
  isDark: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`relative overflow-hidden rounded-2xl border p-4 backdrop-blur-sm ${
        isDark
          ? 'border-white/[0.07] bg-white/[0.04]'
          : 'border-slate-200/70 bg-white/75 shadow-[0_1px_2px_rgba(15,23,42,0.05)]'
      }`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(90% 120% at 0% 0%, ${accent.a}1F, transparent 60%)` }}
      />
      <div className="relative flex items-center gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white"
          style={{
            background: `linear-gradient(145deg, ${accent.a}, ${accent.b})`,
            boxShadow: `inset 0 1px 1px rgba(255,255,255,0.5), 0 8px 20px -8px ${accent.glow}`,
          }}
        >
          <Icon size={18} />
        </span>
        <div className="min-w-0">
          <p className={`text-[10px] font-bold uppercase tracking-[0.14em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {label}
          </p>
          <p className="truncate text-xl font-extrabold tabular-nums tracking-tight" style={{ color: ink }}>
            {value}
          </p>
          {hint && (
            <p className={`mt-0.5 text-[10px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {hint}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/** Progress card — label + figure + shimmer bar + message. */
export function StageProgressCard({
  icon: Icon,
  label,
  value,
  pct,
  message,
  hue,
  isDark,
  delay = 0,
}: {
  icon: IconType;
  label: string;
  value: string;
  pct: number;
  message?: string;
  hue: StageHue;
  isDark: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`rounded-2xl border p-4 backdrop-blur-sm ${
        isDark
          ? 'border-white/[0.07] bg-white/[0.04]'
          : 'border-slate-200/70 bg-white/75 shadow-[0_1px_2px_rgba(15,23,42,0.05)]'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border"
            style={
              isDark
                ? { background: `${hue.a}14`, borderColor: `${hue.a}30`, color: hue.a }
                : { background: `${hue.a}12`, borderColor: `${hue.a}30`, color: hue.b }
            }
          >
            <Icon size={15} />
          </span>
          <div className="min-w-0">
            <p className={`truncate text-[10px] font-bold uppercase tracking-[0.12em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {label}
            </p>
            <p className={`truncate text-sm font-extrabold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {value}
            </p>
          </div>
        </div>
        <span className="shrink-0 text-lg font-extrabold tabular-nums" style={{ color: isDark ? hue.a : hue.b }}>
          {pct}%
        </span>
      </div>
      <div className="mt-2.5">
        <ShimmerProgress pct={pct} colorFrom={hue.a} colorTo={hue.b} glow={hue.glow} height={6} />
      </div>
      {message && (
        <p className={`mt-1.5 text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {message}
        </p>
      )}
    </motion.div>
  );
}

/** Document row — staged file opener (bilan, attestation, …). */
export function StageDocButton({
  title,
  name,
  onOpen,
  accent,
  ink,
  isDark,
}: {
  title: string;
  name: string;
  onOpen: () => void;
  accent: StageHue;
  ink: string;
  isDark: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left backdrop-blur-sm transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] ${
        isDark
          ? 'border-white/[0.07] bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.07]'
          : 'border-slate-200/70 bg-white/75 shadow-sm hover:bg-white'
      }`}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
        style={
          isDark
            ? { background: `${accent.a}14`, borderColor: `${accent.a}30`, color: accent.a }
            : { background: `${accent.a}12`, borderColor: `${accent.a}30`, color: ink }
        }
      >
        <FileText size={15} />
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className={`block text-[10px] font-bold uppercase tracking-[0.12em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          {title}
        </span>
        <span className={`block truncate text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {name}
        </span>
      </span>
      <span
        className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold"
        style={
          isDark
            ? { background: `${STAGE_HUES.emerald.a}1E`, color: STAGE_HUES.emerald.a, border: `1px solid ${STAGE_HUES.emerald.a}36` }
            : { background: `${STAGE_HUES.emerald.a}14`, color: STAGE_HUES.emerald.b, border: `1px solid ${STAGE_HUES.emerald.a}36` }
        }
      >
        <Eye size={10} /> Voir
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Mandat primitives — status hue + linked property card              */
/* ------------------------------------------------------------------ */

const MANDAT_STATUS_HUES: Record<string, StageHue> = {
  actif: STAGE_HUES.emerald,
  expire: RED_STAGE_HUE,
  attente: STAGE_HUES.amber,
  termine: SLATE_STAGE_HUE,
  resilie: RED_STAGE_HUE,
};

/** Convenient hue for a mandat statut (Actif / Expiré / En attente / …). */export function getMandatStatusHue(status?: string): StageHue | undefined {
  const key = normalizeStageKey(status);
  if (!key) return undefined;
  if (key.includes('expir')) return MANDAT_STATUS_HUES.expire;
  if (key.includes('resili')) return MANDAT_STATUS_HUES.resilie;
  if (key.includes('termin')) return MANDAT_STATUS_HUES.termine;
  if (key.includes('attend')) return MANDAT_STATUS_HUES.attente;
  if (key.includes('actif')) return MANDAT_STATUS_HUES.actif;
  return undefined;
}

/** Linked property card — staged Bien concerné / recherché opener. */
export function StageLinkCard({
  icon: Icon = Layers,
  eyebrow,
  title,
  onOpen,
  accent,
  ink,
  isDark,
  delay = 0,
}: {
  icon?: IconType;
  eyebrow: string;
  title: string;
  onOpen?: () => void;
  accent: StageHue;
  ink: string;
  isDark: boolean;
  delay?: number;
}) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      onClick={onOpen}
      className={`group flex w-full items-center gap-3 rounded-2xl border p-3 text-left backdrop-blur-sm transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] ${
        isDark
          ? 'border-white/[0.07] bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.07]'
          : 'border-slate-200/70 bg-white/75 shadow-[0_1px_2px_rgba(15,23,42,0.05)] hover:bg-white hover:shadow-md'
      } ${onOpen ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
        style={
          isDark
            ? { background: `${accent.a}14`, borderColor: `${accent.a}30`, color: accent.a }
            : { background: `${accent.a}12`, borderColor: `${accent.a}30`, color: ink }
        }
      >
        <Icon size={15} />
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className={`block text-[10px] font-bold uppercase tracking-[0.12em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          {eyebrow}
        </span>
        <span className="block truncate text-sm font-bold" style={{ color: ink }}>
          {title}
        </span>
      </span>
      {onOpen && (
        <ChevronRight
          size={15}
          className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
          style={{ color: ink }}
        />
      )}
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/* Score primitives — hue + conic ring for compatibility scores        */
/* ------------------------------------------------------------------ */

/** Convenient hue for a 0-100 compatibility score. */
export function getScoreHue(score: number, isGerant = false): StageHue {
  if (score >= 80) return STAGE_HUES.emerald;
  if (score >= 60) return isGerant ? GERANT_HUE : STAGE_HUES.amber;
  return RED_STAGE_HUE;
}

export function scoreLabel(score: number): string {
  if (score >= 80) return 'Excellente';
  if (score >= 60) return 'Moyenne';
  return 'Faible';
}

/** Conic score ring — glowing gauge lens, readable in both themes. */
export function ScoreRing({
  score,
  size = 48,
  isGerant = false,
  isDark,
}: {
  score: number;
  size?: number;
  isGerant?: boolean;
  isDark: boolean;
}) {
  const hue = getScoreHue(score, isGerant);
  const track = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.10)';
  return (
    <div
      className="shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        padding: Math.max(2, Math.round(size * 0.07)),
        background: `conic-gradient(${hue.line} ${Math.min(100, Math.max(0, score))}%, ${track} 0)`,
        boxShadow: `0 0 18px ${hue.glow}`,
      }}
    >
      <div
        className="flex h-full w-full flex-col items-center justify-center rounded-full"
        style={{ background: isDark ? '#0C1226' : '#ffffff' }}
      >
        <span
          className="font-extrabold tabular-nums leading-none"
          style={{ color: isDark ? hue.a : hue.b, fontSize: Math.round(size * 0.32) }}
        >
          {score}
          <span style={{ fontSize: Math.round(size * 0.2), fontWeight: 700 }}>%</span>
        </span>
      </div>
    </div>
  );
}
