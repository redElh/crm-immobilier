import type { CSSProperties, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Key, Sun, ShoppingCart, Home, User, Shield, DollarSign,
  Calendar, Clock, Layout, FileText, MessageSquare, Mail, Phone,
} from 'react-feather';
import type { Contract, ContractType, VenteEtape } from '../../../types/contract';
import { CONTRACT_TYPE_LABELS, CONTRACT_STATUS_LABELS, VENTE_ETAPE_LABELS } from '../../../types/contract';
import { useStageTheme, STAGE_HUES, SLATE_HUE, type StageHue } from '../../dashboard/Stage';
import { stagePillStyle } from '../prospects/ProspectDetailStage';
import { SIDEBAR_EMERALD, LIGHT_INK, RED_HUE } from '../prospects/ProspectCard';

/* =====================================================================
   ContractDetailStage — staged kit for the contract detail page:
   glass shells + sliding pill tab bar + hero header. The page accent
   follows the contract type (dark: vente=sky · classique=emerald ·
   saisonniere=violet — light: sidebar emerald glass).
   Field chips / pills are re-used from the prospect kit.
   ===================================================================== */

type IconType = React.ComponentType<{ size?: number | string; className?: string; style?: CSSProperties }>;

export { stagePillStyle };

export const TYPE_HUES: Record<ContractType, StageHue> = {
  vente: STAGE_HUES.sky,
  location_classique: STAGE_HUES.emerald,
  location_saisonniere: STAGE_HUES.violet,
};

export function contractHue(type?: Contract['type']): StageHue {
  return (type && TYPE_HUES[type as ContractType]) || STAGE_HUES.sky;
}

/** Theme + accent shared by the header and the tabs shell. */
export function useContractAccent(contractType?: Contract['type']) {
  const theme = useStageTheme();
  const isDark = theme === 'dark';
  const base = contractHue(contractType);
  const accent = isDark ? base : SIDEBAR_EMERALD;
  const ink = isDark ? base.a : LIGHT_INK;
  return { isDark, accent, ink, base };
}

/** Primary gradient CTA (type-tinted in dark / emerald in light). */
export function contractPrimaryStyle(accent: StageHue, isDark: boolean): CSSProperties {
  return isDark
    ? { backgroundImage: `linear-gradient(145deg, ${accent.a} 0%, ${accent.b} 60%, ${accent.b} 100%)`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35), 0 10px 26px -8px ${accent.glow}` }
    : { backgroundImage: 'linear-gradient(145deg, #2DD4BF 0%, #14B8A6 60%, #0D9488 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 10px 26px -10px rgba(13,148,136,0.6)' };
}

/* Status → hue (united with the contracts list page). */
export const STATUS_HUES: Record<string, StageHue> = {
  en_cours: STAGE_HUES.amber,
  confirme_actif: STAGE_HUES.emerald,
  paye: STAGE_HUES.violet,
  occupe: STAGE_HUES.sky,
  finalise_termine: SLATE_HUE,
  annule: RED_HUE,
};

export const statusHue = (s?: string): StageHue =>
  STATUS_HUES[s || ''] || STAGE_HUES.amber;

/* Client role → pill config. */
export const CONTRACT_PARTY_META: Record<string, { icon: IconType; hue: StageHue }> = {
  Vendeur: { icon: TrendingUp, hue: STAGE_HUES.violet },
  Acheteur: { icon: ShoppingCart, hue: STAGE_HUES.sky },
  Bailleur: { icon: Key, hue: STAGE_HUES.emerald },
  Locataire: { icon: Home, hue: STAGE_HUES.amber },
  Voyageur: { icon: Sun, hue: STAGE_HUES.fuchsia },
};

export const partyRoleMeta = (role?: string) =>
  CONTRACT_PARTY_META[role || ''] || { icon: User, hue: STAGE_HUES.sky };

const ETAPE_HUES: Record<string, StageHue> = {
  reservation: STAGE_HUES.amber,
  compromis: STAGE_HUES.sky,
  acte_authentique: STAGE_HUES.emerald,
};

const fmtDateShort = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : null;

const moneyFmt = (devise?: string) => (n?: number) =>
  n == null || Number.isNaN(n)
    ? '—'
    : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: devise || 'MAD', maximumFractionDigits: 0 }).format(n);

/* ------------------------------------------------------------------ */
/* Stage pill — hue chip used across the page                          */
/* ------------------------------------------------------------------ */

export function StagePill({
  hue, isDark, icon: Icon, children, pulse,
}: { hue: StageHue; isDark: boolean; icon?: IconType; children: ReactNode; pulse?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] backdrop-blur-md"
      style={stagePillStyle(hue, isDark)}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: hue.line }} />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: hue.line }} />
        </span>
      )}
      {Icon && <Icon size={10} />}
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Staged tabs shell                                                   */
/* ------------------------------------------------------------------ */

const TAB_ICONS: Record<string, IconType> = {
  resume: Layout,
  parties: User,
  financier: DollarSign,
  documents: FileText,
  historique: Clock,
  notes: MessageSquare,
};

export function ContractTabsShell({
  tabs, activeTab, onChange, accent, children,
}: {
  tabs: { id: string; label: string; slug: string }[];
  activeTab: string;
  onChange: (id: string) => void;
  accent: StageHue;
  children: ReactNode;
}) {
  const theme = useStageTheme();
  const isDark = theme === 'dark';
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
        <div
          className="flex gap-1.5 overflow-x-auto border-b px-4 pb-3 pt-4 scrollbar-thin sm:px-5"
          style={{ borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(13,148,136,0.12)' }}
        >
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
                    layoutId="contract-detail-tab-pill"
                    className="absolute inset-0 rounded-xl border border-white/20"
                    style={{
                      backgroundImage: isDark
                        ? `linear-gradient(145deg, ${accent.a} 0%, ${accent.b} 60%, ${accent.b} 100%)`
                        : 'linear-gradient(145deg, #2DD4BF 0%, #14B8A6 60%, #0D9488 100%)',
                      boxShadow: isDark
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
/* Hero header — type orb + reference, status/étape pills, money lens   */
/* ------------------------------------------------------------------ */

export function ContractHeader({ contract, agentName }: { contract: Contract; agentName: string }) {
  const { isDark, accent, ink, base } = useContractAccent(contract.type);
  const money = moneyFmt(contract.devise);

  const mainAmount = contract.type === 'vente'
    ? { label: 'Prix de vente', value: money(contract.prixVente), unit: '' as const }
    : contract.type === 'location_classique'
      ? { label: 'Loyer mensuel', value: money(contract.loyerMensuelHC), unit: '/mois' as const }
      : { label: 'Total du séjour', value: money(contract.prixTotalSejour), unit: '' as const };
  const mainDate = contract.type === 'vente'
    ? { label: contract.etape === 'acte_authentique' ? 'Acte authentique' : contract.etape === 'compromis' ? 'Compromis' : contract.etape === 'reservation' ? 'Réservation' : 'Offre', value: contract.dateActe || contract.dateCompromis || contract.dateReservation || contract.dateOffre }
    : contract.type === 'location_classique'
      ? { label: 'Début du bail', value: contract.dateDebutBail }
      : { label: 'Arrivée', value: contract.dateArrivee };

  const statusH = STATUS_HUES[contract.status] || STAGE_HUES.amber;
  const etapeHue = contract.etape ? ETAPE_HUES[contract.etape] || STAGE_HUES.violet : null;

  const kpis = [
    { label: 'Statut', value: CONTRACT_STATUS_LABELS[contract.status], icon: Shield },
    { label: 'Référence', value: contract.reference, icon: FileText, mono: true },
    { label: 'Agent responsable', value: agentName || '—', icon: User },
    { label: 'Date de création', value: contract.createdAt ? new Date(contract.createdAt).toLocaleDateString('fr-FR') : (contract.dateCreation ? new Date(contract.dateCreation).toLocaleDateString('fr-FR') : '—'), icon: Calendar },
  ];

  const createdLabel = fmtDateShort(contract.createdAt || contract.dateCreation);
  const updatedLabel = fmtDateShort(contract.updatedAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="stage-glass relative overflow-hidden !rounded-[24px]"
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
            ? `radial-gradient(110% 80% at 50% 0%, ${accent.a}26, transparent 62%), radial-gradient(70% 55% at 100% 100%, ${accent.b}14, transparent 60%)`
            : `radial-gradient(110% 80% at 50% 0%, ${accent.a}1F, transparent 62%), radial-gradient(70% 55% at 100% 100%, ${accent.a}10, transparent 60%)`,
        }}
      />

      <div className="relative space-y-5 p-5 sm:p-6">
        {/* identity row: type orb + names (left), money lens (right) */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative shrink-0"
            >
              <div
                className="orb-icon select-none flex items-center justify-center text-white"
                style={{ width: 64, height: 64, borderRadius: 20, '--orb-a': base.a, '--orb-b': base.b, '--orb-glow': base.glow } as CSSProperties}
              >
                {contract.type === 'vente' ? <TrendingUp size={26} /> : contract.type === 'location_classique' ? <Key size={26} /> : <Sun size={26} />}
              </div>
              <span
                className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2"
                style={{
                  borderColor: isDark ? '#0B1022' : '#ffffff',
                  background: `linear-gradient(145deg, ${accent.a}, ${accent.b})`,
                  boxShadow: `0 2px 8px ${accent.glow}`,
                }}
              >
                <Home size={10} className="text-white" />
              </span>
            </motion.div>

            <div className="min-w-0 flex-1 pt-0.5">
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.03 }}
                className="font-mono text-[11px] font-bold uppercase tracking-[0.14em]"
                style={{ color: ink }}
              >
                Contrat {contract.reference}
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                className={`mt-1 text-xl font-extrabold tracking-[-0.4px] sm:text-2xl ${isDark ? 'text-white' : 'text-slate-900'}`}
              >
                {CONTRACT_TYPE_LABELS[contract.type]}
              </motion.h1>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="mt-2 flex flex-wrap items-center gap-1.5"
              >
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] backdrop-blur-md"
                  style={stagePillStyle(statusH, isDark)}
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: statusH.line }} />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: statusH.line }} />
                  </span>
                  {CONTRACT_STATUS_LABELS[contract.status]}
                </span>
                {contract.type === 'vente' && contract.etape && etapeHue && (
                  <StagePill hue={etapeHue} isDark={isDark}>{VENTE_ETAPE_LABELS[contract.etape]}</StagePill>
                )}
                {agentName && <StagePill hue={accent} isDark={isDark} icon={User}>{agentName}</StagePill>}
              </motion.div>
              <div className={`mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <span className="flex items-center gap-1.5"><User size={12} /> {contract.partieA.name || '—'}</span>
                {contract.partieB.name && (
                  <>
                    <span className="opacity-40">→</span>
                    <span className="flex items-center gap-1.5"><User size={12} /> {contract.partieB.name}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* money lens: standalone staged chip */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className={`flex shrink-0 items-center gap-3 rounded-2xl border px-3.5 py-2.5 backdrop-blur-sm sm:ml-auto ${isDark ? 'border-white/[0.07] bg-white/[0.04]' : 'border-slate-200/70 bg-white/75 shadow-[0_1px_2px_rgba(15,23,42,0.05)]'}`}
          >
            <div className="leading-tight">
              <p className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.14em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                <DollarSign size={9} /> {mainAmount.label}
              </p>
              <p className="text-lg font-extrabold tabular-nums" style={{ color: isDark ? base.a : LIGHT_INK }}>
                {contract.type === 'location_classique'
                  ? <span>{mainAmount.value}<span className="text-[10px] font-semibold opacity-60"> {mainAmount.unit}</span></span>
                  : mainAmount.value}
              </p>
              <p className={`text-[10px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {mainDate.label} : {fmtDateShort(mainDate.value) || '—'}
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
                <p className={`mt-1.5 truncate text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'} ${kpi.mono ? 'font-mono' : ''}`}>
                  {kpi.value}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* contact pills + timestamps */}
        <div className={`flex flex-col gap-3 border-t pt-4 lg:flex-row lg:items-center ${isDark ? 'border-white/[0.06]' : 'border-teal-900/10'}`}>
          <div className="flex flex-wrap items-center gap-1.5">
            {[contract.partieA, contract.partieB].map((party, pi) => party ? (
              <div key={pi} className="contents">
                {party.email && (
                  <a
                    href={`mailto:${party.email}`}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold backdrop-blur-md transition-all duration-200 ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10 hover:text-white' : 'border-slate-200/80 bg-white/70 text-slate-600 shadow-sm hover:bg-white hover:text-slate-900'}`}
                  >
                    <Mail size={12} style={{ color: ink }} /> <span className="max-w-[180px] truncate">{party.email}</span>
                  </a>
                )}
                {party.phone && (
                  <a
                    href={`tel:${party.phone}`}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold backdrop-blur-md transition-all duration-200 ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10 hover:text-white' : 'border-slate-200/80 bg-white/70 text-slate-600 shadow-sm hover:bg-white hover:text-slate-900'}`}
                  >
                    <Phone size={12} style={{ color: ink }} /> {party.phone}
                  </a>
                )}
              </div>
            ) : null)}
          </div>
          {(createdLabel || updatedLabel) && (
            <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold lg:ml-auto ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {createdLabel && <span>Créé le {createdLabel}</span>}
              {updatedLabel && <span>Mis à jour le {updatedLabel}</span>}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
