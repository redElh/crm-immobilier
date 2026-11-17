import type { CSSProperties, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Sliders, Award, Tag } from 'react-feather';
import { useStageTheme, useStageScope, useStageAccent, type StageHue } from '../../dashboard/Stage';
import { LIGHT_INK } from './ProspectCard';

/* =====================================================================
   ProspectDetailStage — shared staged kit for the prospect detail page:
   glass shell + sliding pill tab bar + chip fields + section titles.
   Dark = united stage violet · Light = sidebar emerald glass.
   ===================================================================== */

/** Theme + accent resolution shared by the header and the tabs shell.
 *  Agent keeps its violet/emerald identity; admin/gérant inherit the
 *  shell accent (crimson-rose dark, vivid orange light). */
export function useProspectAccent() {
  const theme = useStageTheme();
  const scope = useStageScope();
  const isDark = theme === 'dark';
  const accent = useStageAccent();
  const ink = isDark ? accent.a : scope === 'admin' ? accent.b : LIGHT_INK;
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
  apercu: User,
  criteres: Sliders,
  suivi: Award,
};

/* ------------------------------------------------------------------ */
/* Staged tab shell: glass panel + scrollable pill bar + animated swap */
/* ------------------------------------------------------------------ */

export function ProspectTabsShell({
  tabs,
  activeTab,
  onChange,
  children,
}: {
  tabs: { id: number; label: string; slug: string }[];
  activeTab: number;
  onChange: (id: number) => void;
  children: ReactNode;
}) {
  const { isDark, accent } = useProspectAccent();
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
                    layoutId="prospect-detail-tab-pill"
                    className="absolute inset-0 rounded-xl border border-white/20"
                    style={{
                      backgroundImage: isDark
                        ? 'linear-gradient(145deg, #8B7CFF 0%, #6C5ECF 60%, #5646C9 100%)'
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
/* Staged field — glass chip replacing InfoRow on the detail page      */
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
      <div className={`mt-1.5 text-sm font-bold leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
        {value}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Staged section — title row + responsive grid of fields             */
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
/* Staged tag group — label row + wrapping pills                       */
/* ------------------------------------------------------------------ */

export function StageTags({
  icon: Icon,
  label,
  items,
  accent,
  ink,
  isDark,
  delay = 0,
}: {
  icon: IconType;
  label: string;
  items: string[];
  accent: StageHue;
  ink: string;
  isDark: boolean;
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
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="inline-flex max-w-full items-center truncate rounded-lg px-2 py-1 text-[11px] font-semibold"
            style={
              isDark
                ? { background: `${accent.a}1E`, color: accent.a, border: `1px solid ${accent.a}36` }
                : { background: `${accent.a}14`, color: ink, border: `1px solid ${accent.a}36` }
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
/* Staged empty state — for tabs with nothing to show yet              */
/* ------------------------------------------------------------------ */

export function StageEmpty({
  icon: Icon,
  title,
  hint,
  accent,
  ink,
  isDark,
  action,
}: {
  icon: IconType;
  title: string;
  hint?: string;
  accent: StageHue;
  ink: string;
  isDark: boolean;
  action?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`flex flex-col items-center justify-center rounded-2xl border px-6 py-10 text-center ${
        isDark ? 'border-white/[0.07] bg-white/[0.03]' : 'border-slate-200/70 bg-white/60'
      }`}
    >
      <span
        className="flex h-12 w-12 items-center justify-center rounded-2xl border"
        style={
          isDark
            ? { background: `${accent.a}14`, borderColor: `${accent.a}30`, color: accent.a }
            : { background: `${accent.a}12`, borderColor: `${accent.a}30`, color: ink }
        }
      >
        <Icon size={20} />
      </span>
      <h3 className={`mt-3 text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
      {hint && <p className={`mt-1 max-w-sm text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}

/** Primary gradient CTA shared by the detail page (united violet / emerald). */
export function prospectPrimaryStyle(isDark: boolean): CSSProperties {
  return isDark
    ? { backgroundImage: 'linear-gradient(145deg, #8B7CFF 0%, #6C5ECF 60%, #5646C9 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 10px 26px -8px rgba(124,92,255,0.65)' }
    : { backgroundImage: 'linear-gradient(145deg, #2DD4BF 0%, #14B8A6 60%, #0D9488 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 10px 26px -10px rgba(13,148,136,0.6)' };
}
