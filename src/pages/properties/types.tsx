import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, useMemo, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import {
  Home, Briefcase, MapPin, Sun, Star, Tag, TrendingUp, CheckCircle,
  Calendar, FileText, Grid, Filter, BarChart2, Eye, ArrowUpRight, ArrowDownRight,
  Layers, Zap, Activity, PieChart, BarChart, TrendingUp as TrendingUpIcon
} from 'react-feather';
import { getDraftCount } from '../../services/draftStorage';
import { DraftSection } from '../../components/modules/properties/DraftSection';
import { fetchProperties } from '../../services/propertyService';
import { api } from '../../services/api';
import { useStageChrome } from '../../components/modules/calendar/useStageChrome';
import {
  Stage, StageTabs, StageStatCard, StagePanel, StageBadge,
  StageButton, OrbIcon, TiltCard, STAGE_HUES, SLATE_HUE, useStageTheme,
  ShimmerProgress, AnimatedNumber, StageAreaChart, StageBarChart, StageGauge, GlowSparkline
} from '../../components/dashboard/Stage';

const TYPE_META = [
  { type: 'residential', title: 'Résidentiel', description: 'Appartements, maisons, villas', icon: Home, hue: STAGE_HUES.violet },
  { type: 'commercial', title: 'Commercial', description: 'Bureaux, locaux, boutiques', icon: Briefcase, hue: STAGE_HUES.sky },
  { type: 'land', title: 'Terrains', description: 'Terrains constructibles, agricoles', icon: MapPin, hue: STAGE_HUES.emerald },
  { type: 'vacation', title: 'Vacances', description: 'Résidences secondaires, locations saisonnières', icon: Sun, hue: STAGE_HUES.amber },
  { type: 'luxury', title: 'Luxe', description: 'Biens haut de gamme', icon: Star, hue: STAGE_HUES.fuchsia },
];

const tabs = [
  { id: 'grid', label: 'Grille', icon: Grid },
  { id: 'pipeline', label: 'Pipeline', icon: Filter },
  { id: 'stats', label: 'Statistiques', icon: BarChart2 },
];

const subtitles: Record<string, string> = {
  grid: 'Explorez vos biens par catégorie',
  pipeline: 'Suivez le cycle de vie de vos biens',
  stats: 'Analysez la performance par type',
};

/* ---------------------------------------------------------------------
   Shared static definitions + precomputed data shapes.
   All data derivation happens ONCE at page level (useMemo on allProperties)
   so tab panels render instantly and never recompute on tab switches.
--------------------------------------------------------------------- */

const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

const SOLD_STATUSES = ['sold', 'rented', 'sold_or_rented'];

type StageHue = typeof STAGE_HUES.violet;

const PIPELINE_STAGES: { key: string; label: string; hue: StageHue; icon: any }[] = [
  { key: 'draft', label: 'Brouillons', hue: STAGE_HUES.sky, icon: FileText },
  { key: 'active', label: 'Actifs', hue: STAGE_HUES.violet, icon: Home },
  { key: 'negotiation', label: 'En négociation', hue: STAGE_HUES.amber, icon: Tag },
  { key: 'compromise', label: 'Compromis', hue: STAGE_HUES.fuchsia, icon: CheckCircle },
  { key: 'sold', label: 'Vendus/Loués', hue: STAGE_HUES.emerald, icon: TrendingUp },
];

const TRANSACTION_TYPES: { key: string; label: string; hue: StageHue }[] = [
  { key: 'vente', label: 'Vente', hue: STAGE_HUES.emerald },
  { key: 'location_ld', label: 'Location LD', hue: STAGE_HUES.sky },
  { key: 'location_saisonniere', label: 'Location saisonnière', hue: STAGE_HUES.amber },
];

const STATUS_META: { key: string; label: string; hue: StageHue }[] = [
  { key: 'draft', label: 'Brouillons', hue: STAGE_HUES.sky },
  { key: 'active', label: 'Actifs', hue: STAGE_HUES.violet },
  { key: 'negotiation', label: 'En négociation', hue: STAGE_HUES.amber },
  { key: 'compromise', label: 'Compromis', hue: STAGE_HUES.fuchsia },
  { key: 'sold', label: 'Vendus', hue: STAGE_HUES.emerald },
  { key: 'rented', label: 'Loués', hue: STAGE_HUES.emerald },
];

export interface PipelinePre {
  stageData: { key: string; label: string; hue: StageHue; icon: any; value: number }[];
  total: number;
  conversionRate: number;
  flowData: Record<string, string | number>[];
}

export interface StatsPre {
  totalProperties: number;
  transactionData: { key: string; label: string; hue: StageHue; count: number }[];
  statusData: { key: string; label: string; hue: StageHue; count: number }[];
  typeBreakdown: any[];
  trendData: Record<string, string | number>[];
  performanceData: any[];
  barChartData: Record<string, string | number>[];
}

function TabIntro({ title, subtitle }: { title: string; subtitle: string }) {
  const { dark } = useStageChrome();
  const theme = useStageTheme();
  const isDark = theme === 'dark';
  return (
    <div>
      <h2 className={`text-xl font-bold tracking-[-0.3px] ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h2>
      <p className={`mt-0.5 text-sm ${isDark ? 'text-slate-400' : 'text-teal-900/60'}`}>{subtitle}</p>
    </div>
  );
}

function PropertyTypeOrb({ property, index, onClick }: { property: any; index: number; onClick: () => void }) {
  const { dark } = useStageChrome();
  const theme = useStageTheme();
  const isDark = theme === 'dark';
  const { type, title, description, count, icon: Icon, hue } = property;
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  // Direct DOM writes via rAF — zero React re-renders during mouse tracking
  const applyTilt = (x: number, y: number) => {
    const el = tiltRef.current;
    if (!el) return;
    const rx = (y - 0.5) * -12;
    const ry = (x - 0.5) * 12;
    el.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => applyTilt(x, y));
  };

  const handleMouseLeave = () => {
    setHovered(false);
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    if (tiltRef.current) tiltRef.current.style.transform = 'rotateX(0deg) rotateY(0deg)';
  };

  return (
    <motion.div
      key={type}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: 1000 }}
    >
      <div
        ref={cardRef}
        className="group relative h-full w-full cursor-pointer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        onClick={onClick}
      >
        {/* ──────────────────────────────────────────────────────────────
             LAYER -1: Subtle ambient glow (single layer, no blur animation)
        ────────────────────────────────────────────────────────────── */}
        <div
          className="absolute -inset-3 rounded-[27px] -z-10 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, ${hue.glow} 0%, transparent 65%)`,
            opacity: hovered ? 0.35 : 0.15,
            transform: `translateZ(-30px) scale(${hovered ? 1.15 : 1.05})`,
            transition: 'opacity 0.3s ease, transform 0.3s ease',
          }}
        />

        {/* ──────────────────────────────────────────────────────────────
             LAYER 0: Holographic border ring (mounted only while hovered)
        ────────────────────────────────────────────────────────────── */}
        {hovered && (
          <div className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden" style={{ transform: 'translateZ(-15px)' }}>
            <motion.div
              className="absolute inset-[1px] rounded-2xl"
              style={{
                background: `conic-gradient(from 0deg, transparent 0%, ${hue.a} 25%, transparent 50%, ${hue.b} 75%, transparent 100%)`,
                filter: 'blur(1px)',
                transformOrigin: 'center',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────────
             MAIN CARD - Glassmorphic 3D panel
        ────────────────────────────────────────────────────────────── */}
        <div
          ref={tiltRef}
          className="relative h-full w-full rounded-2xl"
          style={{
            transformStyle: 'preserve-3d',
            willChange: 'transform',
            transition: 'transform 0.15s ease-out',
            boxShadow: `
              0 0 0 1px ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)'},
              0 4px 24px -4px ${isDark ? 'rgba(0,0,0,0.4)' : 'rgba(15,23,42,0.12)'},
              0 16px 48px -16px ${hue.glow},
              ${hovered ? `0 24px 64px -20px ${hue.glow}, inset 0 1px 0 rgba(255,255,255,0.12)` : 'inset 0 1px 0 rgba(255,255,255,0.08)'},
            `,
            background: isDark
              ? `linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.04) 100%)`
              : `linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.7) 100%)`,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
{/* ──────────────────────────────────────────────────────────────
             LAYER 1: Top accent bar with animated progress
        ────────────────────────────────────────────────────────────── */}
          <div className="absolute top-0 left-0 right-0 h-1 pointer-events-none" style={{ zIndex: 10 }}>
            <motion.div
              className="h-full rounded-t-2xl"
              style={{
                background: `linear-gradient(90deg, ${hue.a}, ${hue.b}, ${hue.a})`,
                backgroundSize: '200% 100%',
                transformOrigin: 'left center',
              }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1, delay: 0.2 + index * 0.04, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)`,
                  backgroundSize: '50% 100%',
                }}
              />
            </motion.div>
          </div>

          {/* ──────────────────────────────────────────────────────────────
               CARD CONTENT
          ────────────────────────────────────────────────────────────── */}
          <div className="relative z-20 h-full flex flex-col p-5 md:p-6">
            {/* ── Header: Icon + Action ── */}
            <div className="flex items-start justify-between mb-4 md:mb-5">
              <div className="relative">
                {/* Icon container with 3D depth */}
                <div
                  className="relative"
                  style={{ transform: 'translateZ(20px)' }}
                >
                  {/* Icon glow base */}
                  <div
                    className="absolute -inset-3 rounded-2xl pointer-events-none"
                    style={{
                      background: `radial-gradient(ellipse at 30% 25%, ${hue.a}40, ${hue.b}20 60%, transparent)`,
                      filter: 'blur(12px)',
                      opacity: hovered ? 1 : 0.6,
                      transition: 'opacity 0.3s ease',
                    }}
                  />
                  
                  {/* Main icon orb - fully custom 3D */}
                  <div
                    className="relative flex items-center justify-center"
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 20,
                      transformStyle: 'preserve-3d',
                      background: `linear-gradient(145deg, ${hue.a} 0%, ${hue.b} 100%)`,
                      boxShadow: `
                        inset 0 1px 1px rgba(255,255,255,0.6),
                        inset 0 -8px 16px rgba(0,0,0,0.3),
                        0 12px 32px -8px ${hue.glow},
                        0 4px 16px -4px ${hue.glow},
                      `,
                    }}
                  >
                    {/* Top highlight */}
                    <div className="absolute inset-0 rounded-[20px] pointer-events-none"
                      style={{
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 50%)',
                      }}
                    />
                    {/* Icon */}
                    <Icon size={28} className="relative text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
                    {/* Bottom reflection */}
                    <div className="absolute bottom-0 left-1/4 right-1/4 h-4 pointer-events-none"
                      style={{
                        background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.1))',
                        borderRadius: '0 0 20px 20px',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* View button - glass pill */}
              <motion.button
                className="flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 group"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.04)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)'}`,
                  backdropFilter: 'blur(10px)',
                  color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(15,23,42,0.5)',
                }}
                whileHover={{
                  background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.08)',
                  color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(15,23,42,0.9)',
                  scale: 1.05,
                }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                aria-label="Voir détails"
              >
                <Eye size={16} />
                <motion.div
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at center, ${hue.a}33, transparent 70%)`,
                    opacity: 0,
                  }}
                  whileHover={{ opacity: 1 }}
                />
              </motion.button>
            </div>

            {/* ── Middle: Title, Status, Description ── */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center gap-2.5 mb-2">
                <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-950'}`}>
                  {title}
                </h3>
                <motion.span
                  className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] rounded-full"
                  style={{
                    background: `linear-gradient(135deg, ${hue.a}22, ${hue.b}22)`,
                    color: hue.a,
                    border: `1px solid ${hue.a}33`,
                  }}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 + index * 0.04, type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: hue.a, boxShadow: `0 0 6px ${hue.glow}` }}
                  />
                  ACTIF
                </motion.span>
              </div>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {description}
              </p>
            </div>

            {/* ── Footer: Stats + Progress ── */}
            <div className="mt-4 pt-4 border-t" style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)' }}>
              <div className="flex items-center justify-between gap-4">
                {/* Count with animated number */}
                <div className="flex items-baseline gap-2">
                  <motion.div
                    className="relative"
                    style={{ minWidth: 50 }}
                  >
                    <AnimatedNumber
                      value={count}
                      className={`text-3xl font-extrabold tabular-nums tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}
                    />
                    {/* Underline gradient */}
                    <motion.div
                      className="absolute bottom-[-4px] left-0 h-1 rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${hue.a}, ${hue.b})`,
                        boxShadow: `0 0 10px ${hue.glow}`,
                      }}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.8, delay: 0.4 + index * 0.04, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </motion.div>
                  <span className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    bien{count > 1 ? 's' : ''}
                  </span>
                </div>

                {/* Right side: Draft badge */}
                <div className="flex items-center gap-2">
                  {getDraftCount('current', type) > 0 && (
                    <StageBadge variant="warn" className="text-[10px] px-2 py-1">
                      <FileText size={10} className="mr-1" />
                      {getDraftCount('current', type)} brouillon{getDraftCount('current', type) !== 1 ? 's' : ''}
                    </StageBadge>
                  )}
                </div>
              </div>
            </div>

            {/* ── Explore button — same style as the active tab pill ── */}
            <button
              type="button"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-[13px] font-semibold text-white transition-transform duration-200 hover:scale-[1.02] active:scale-[0.97]"
              style={{
                backgroundImage: isDark
                  ? 'linear-gradient(145deg, #8B7CFF 0%, #6C5ECF 60%, #5646C9 100%)'
                  : 'linear-gradient(145deg, #2DD4BF 0%, #14B8A6 60%, #0D9488 100%)',
                boxShadow: isDark
                  ? 'inset 0 1px 0 rgba(255,255,255,0.4), 0 10px 26px -8px rgba(124,92,255,0.65)'
                  : 'inset 0 1px 0 rgba(255,255,255,0.5), 0 10px 26px -10px rgba(13,148,136,0.6)',
              }}
              onClick={(e) => { e.stopPropagation(); onClick(); }}
            >
              <Zap size={14} />
              Explorer ce type
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const PipelineTab = memo(function PipelineTab({ pre, navigate }: { pre: PipelinePre; navigate: (path: string) => void }) {
  const { dark } = useStageChrome();
  const theme = useStageTheme();
  const isDark = theme === 'dark';

  // Data arrives fully precomputed from the page — this component never recomputes
  const { stageData, total, conversionRate, flowData } = pre;

  return (
    <>
      <TabIntro title="Pipeline des biens" subtitle={subtitles.pipeline} />
      
      {/* 3D Pipeline Flow Visualization */}
      <StagePanel title="Flux du pipeline (12 mois)" icon={Filter} hue={STAGE_HUES.violet} className="min-h-[380px]">
        <div className="h-full">
          <StageAreaChart
            data={flowData}
            series={[
              { dataKey: 'draft', name: 'Brouillons', hue: STAGE_HUES.sky },
              { dataKey: 'active', name: 'Actifs', hue: STAGE_HUES.violet },
              { dataKey: 'negotiation', name: 'Négociation', hue: STAGE_HUES.amber },
              { dataKey: 'compromise', name: 'Compromis', hue: STAGE_HUES.fuchsia },
              { dataKey: 'sold', name: 'Vendus/Loués', hue: STAGE_HUES.emerald },
            ]}
            height={320}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {stageData.map(stage => (
            <span key={stage.key} className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full"
              style={{
                background: `${stage.hue.a}18`,
                color: stage.hue.a,
                border: `1px solid ${stage.hue.a}33`,
              }}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: stage.hue.line, boxShadow: `0 0 6px ${stage.hue.glow}` }} />
              {stage.label}
            </span>
          ))}
        </div>
      </StagePanel>

      {/* Pipeline Stages - 3D Cards */}
      <StagePanel title="Cycle de vie des biens" icon={Filter} hue={STAGE_HUES.violet}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {stageData.map((stage, i) => (
            <motion.div
              key={stage.key}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            >
              <TiltCard className="h-full p-4 text-center relative overflow-hidden group">
                {/* Depth glow */}
                <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                  style={{
                    background: `radial-gradient(ellipse at center, ${stage.hue.glow} 0%, transparent 70%)`,
                    filter: 'blur(16px)',
                    transform: 'scale(1.2)',
                  }}
                />
                
                <div className="relative z-10">
                  <div
                    className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-extrabold text-white relative overflow-hidden"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${stage.hue.a}, ${stage.hue.b})`,
                      boxShadow: `inset 0 1px 1px rgba(255,255,255,0.55), inset 0 -5px 10px rgba(0,0,0,0.3), 0 12px 28px -8px ${stage.hue.glow}`,
                    }}
                  >
                    <AnimatedNumber value={stage.value} className="text-2xl font-extrabold" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className={`text-[13px] font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{stage.label}</p>
                  <div className="mt-2 h-1.5 w-full rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${stage.hue.a}, ${stage.hue.b})`, boxShadow: `0 0 10px ${stage.hue.glow}` }}
                      initial={{ width: 0 }}
                      animate={{ width: total > 0 ? `${(stage.value / total) * 100}%` : '0%' }}
                      transition={{ duration: 1.2, delay: 0.3 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                  <span className={`mt-1 inline-flex items-center gap-0.5 text-xs font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`}>
                    <ArrowUpRight size={11} />
                    {total > 0 ? Math.round((stage.value / total) * 1000) / 10 : 0}%
                  </span>
                </div>
              </TiltCard>
              {i < stageData.length - 1 && (
                <motion.div
                  className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 lg:block"
                  animate={{ x: [-4, 4, -4] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <ArrowDownRight size={20} className={`${isDark ? 'text-slate-600' : 'text-teal-900/30'}`} />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        <div className={`mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl px-4 py-3.5 text-sm ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/70 border border-teal-900/10'}`}>
          <div className="flex items-center gap-2">
            <span className={isDark ? 'text-slate-400' : 'text-teal-900/60'}>Taux de conversion global :</span>
            <span className={`inline-flex items-center gap-0.5 font-extrabold ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`}>
              {conversionRate}%
              <ArrowUpRight size={12} />
            </span>
          </div>
          <div className={`h-4 w-px ${isDark ? 'bg-white/15' : 'bg-teal-900/15'}`} />
          <div className="flex items-center gap-2">
            <span className={isDark ? 'text-slate-400' : 'text-teal-900/60'}>Total biens :</span>
            <span className={`font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{total}</span>
          </div>
        </div>
      </StagePanel>

      {/* Status Distribution - Horizontal Bars (lighter than 3D Donut) */}
      <StagePanel title="Répartition par statut" icon={PieChart} hue={STAGE_HUES.sky} className="min-h-[320px]">
        <div className="flex flex-col h-full">
          {total > 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-4">
              <div className="w-full max-w-md space-y-4">
                {stageData.map(item => (
                  <div key={item.key} className="group">
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className={`flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <span
                          className="h-2.5 w-2.5 rounded-sm"
                          style={{ backgroundColor: item.hue.line, boxShadow: isDark ? `0 0 8px ${item.hue.glow}` : 'none' }}
                        />
                        {item.label}
                      </span>
                      <span className={`font-bold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {item.value} ({total > 0 ? Math.round((item.value / total) * 100) : 0}%)
                      </span>
                    </div>
                    <ShimmerProgress
                      pct={total > 0 ? (item.value / total) * 100 : 0}
                      colorFrom={item.hue.a}
                      colorTo={item.hue.b}
                      glow={item.hue.glow}
                      height={8}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center p-8">
                <Filter size={48} className="mx-auto mb-4" style={{ color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.2)' }} />
                <p className={isDark ? 'text-slate-500' : 'text-teal-900/50'}>Aucune donnée de pipeline disponible</p>
                <p className="text-sm mt-1 text-slate-400">Ajoutez des biens pour voir la répartition</p>
              </div>
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-2 justify-center">
            {stageData.map(item => (
              <span key={item.key} className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full"
                style={{
                  background: `${item.hue.a}18`,
                  color: item.hue.a,
                  border: `1px solid ${item.hue.a}33`,
                }}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: item.hue.line, boxShadow: `0 0 6px ${item.hue.glow}` }} />
                {item.label} {item.value} ({total > 0 ? Math.round((item.value / total) * 100) : 0}%)
              </span>
            ))}
          </div>
        </div>
      </StagePanel>

      {/* Actions rapides with 3D cards */}
      <StagePanel title="Actions rapides" icon={Tag} hue={STAGE_HUES.amber}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Nouveau résidentiel', icon: Home, hue: STAGE_HUES.violet, action: () => navigate('/properties/create?type=residential') },
            { label: 'Nouveau commercial', icon: Briefcase, hue: STAGE_HUES.sky, action: () => navigate('/properties/create?type=commercial') },
            { label: 'Nouveau terrain', icon: MapPin, hue: STAGE_HUES.emerald, action: () => navigate('/properties/create?type=land') },
            { label: 'Nouveau vacances', icon: Sun, hue: STAGE_HUES.amber, action: () => navigate('/properties/create?type=vacation') },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <TiltCard className="h-full">
                <StageButton variant="glass" size="md" className="w-full h-auto py-5 flex flex-col items-center gap-3" onClick={item.action}>
                  <OrbIcon icon={item.icon} hue={item.hue} size={44} radius={14} />
                  <span className={`font-semibold text-center ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{item.label}</span>
                </StageButton>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </StagePanel>
    </>
  );
});

const StatsTab = memo(function StatsTab({ pre }: { pre: StatsPre }) {
  const { dark } = useStageChrome();
  const theme = useStageTheme();
  const isDark = theme === 'dark';

  // Data arrives fully precomputed from the page — this component never recomputes
  const { totalProperties, transactionData, statusData, typeBreakdown, trendData, performanceData, barChartData } = pre;

  return (
    <>
      <TabIntro title="Statistiques détaillées" subtitle={subtitles.stats} />

      {/* KPI Cards with sparklines */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {transactionData.map((t, i) => (
          <StageStatCard
            key={t.key}
            icon={Tag}
            label={t.label}
            value={t.count}
            hue={t.hue}
            delay={i * 0.05}
            spark={[2, 4, 3, 5, 4, 6, 5, 7]}
          />
        ))}
      </div>

      {/* Main Charts Row - Horizontal Bars + Area Chart */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Horizontal Bars - Répartition par statut (lighter than 3D Donut) */}
        <StagePanel title="Répartition par statut" icon={PieChart} hue={STAGE_HUES.violet} className="min-h-[380px]">
          <div className="flex flex-col h-full">
            {statusData.length > 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-md space-y-4">
                  {statusData.map(item => (
                    <div key={item.key} className="group">
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className={`flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          <span
                            className="h-2.5 w-2.5 rounded-sm"
                            style={{ backgroundColor: item.hue.line, boxShadow: isDark ? `0 0 8px ${item.hue.glow}` : 'none' }}
                          />
                          {item.label}
                        </span>
                        <span className={`font-bold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {item.count} ({totalProperties > 0 ? Math.round((item.count / totalProperties) * 100) : 0}%)
                        </span>
                      </div>
                      <ShimmerProgress
                        pct={totalProperties > 0 ? (item.count / totalProperties) * 100 : 0}
                        colorFrom={item.hue.a}
                        colorTo={item.hue.b}
                        glow={item.hue.glow}
                        height={8}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center p-8">
                  <BarChart2 size={48} className="mx-auto mb-4" style={{ color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.2)' }} />
                  <p className={isDark ? 'text-slate-500' : 'text-teal-900/50'}>Aucune donnée de statut disponible</p>
                  <p className="text-sm mt-1 text-slate-400">Ajoutez des biens pour voir la répartition</p>
                </div>
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-2 justify-center">
              {statusData.map(item => (
                <span key={item.key} className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full"
                  style={{
                    background: `${item.hue.a}18`,
                    color: item.hue.a,
                    border: `1px solid ${item.hue.a}33`,
                  }}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: item.hue.line, boxShadow: `0 0 6px ${item.hue.glow}` }} />
                  {item.label} {item.count}
                </span>
              ))}
            </div>
          </div>
        </StagePanel>

        {/* Area Chart - Evolution mensuelle */}
        <StagePanel title="Évolution mensuelle" icon={Activity} hue={STAGE_HUES.sky} className="min-h-[380px]">
          <div className="h-full">
            <StageAreaChart
              data={trendData}
              series={[
                { dataKey: 'vente', name: 'Ventes', hue: STAGE_HUES.emerald },
                { dataKey: 'location', name: 'Locations', hue: STAGE_HUES.sky },
                { dataKey: 'total', name: 'Total', hue: STAGE_HUES.violet },
              ]}
              height={300}
            />
          </div>
        </StagePanel>
      </div>

      {/* Second Charts Row - Bar Chart + Gauge */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Bar Chart - Performance par type */}
        <StagePanel title="Performance par type de bien" icon={BarChart} hue={STAGE_HUES.amber} className="min-h-[380px]">
          <div className="h-full">
            <StageBarChart
              data={barChartData}
              series={[
                { dataKey: 'vente', name: 'Vente', hue: STAGE_HUES.emerald },
                { dataKey: 'location', name: 'Location', hue: STAGE_HUES.sky },
              ]}
              height={300}
            />
          </div>
        </StagePanel>

        {/* Gauge + Type breakdown */}
        <StagePanel title="Taux de conversion par type" icon={TrendingUpIcon} hue={STAGE_HUES.fuchsia} className="min-h-[380px]">
          <div className="space-y-4">
            {performanceData.map((item, i) => (
              <div key={item.label} className="group">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <OrbIcon icon={Home} hue={item.hue} size={28} radius={8} />
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.label}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className={`font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`}>{item.conversion}%</span>
                    <span className={`text-slate-400`}>{item.total} biens</span>
                  </div>
                </div>
                <div className="relative h-3">
                  <ShimmerProgress
                    pct={item.conversion}
                    colorFrom={item.hue.a}
                    colorTo={item.hue.b}
                    glow={item.hue.glow}
                    height={6}
                  />
                </div>
                <div className="mt-1.5 flex gap-4 text-[11px]">
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded" style={{ background: STAGE_HUES.emerald.line }} />
                    Vente: {item.vente}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded" style={{ background: STAGE_HUES.sky.line }} />
                    Location: {item.location}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </StagePanel>
      </div>

      {/* Third Row - Detailed status breakdown table */}
      <StagePanel title="Détail complet des statuts" icon={FileText} hue={STAGE_HUES.emerald}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>Type de bien</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>Total</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>Vente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>Location</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>Actifs</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>Négociation</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>Compromis</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>Vendus/Loués</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>Brouillons</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>Conversion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {typeBreakdown.map((item, rowIndex) => (
                <motion.tr
                  key={item.type}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: rowIndex * 0.04 }}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3 font-medium" style={{ color: isDark ? '#E2E8F0' : '#1E293B' }}>
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.hue.line, boxShadow: `0 0 8px ${item.hue.glow}` }} />
                      {item.title}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold tabular-nums" style={{ color: isDark ? '#FFF' : '#0F172A' }}>{item.count}</td>
                  <td className="px-4 py-3" style={{ color: '#34D399' }}>{item.vente}</td>
                  <td className="px-4 py-3" style={{ color: '#38BDF8' }}>{item.location}</td>
                  <td className="px-4 py-3" style={{ color: '#8B7CFF' }}>
                    {item.actifs}
                  </td>
                  <td className="px-4 py-3" style={{ color: '#FBBF24' }}>
                    {item.negotiation}
                  </td>
                  <td className="px-4 py-3" style={{ color: '#E879F9' }}>
                    {item.compromise}
                  </td>
                  <td className="px-4 py-3 font-bold" style={{ color: '#34D399' }}>
                    {item.soldOrRented}
                  </td>
                  <td className="px-4 py-3" style={{ color: '#FBBF24' }}>
                    {item.drafts}
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-24">
                      <ShimmerProgress
                        pct={item.count > 0 ? Math.round(((item.vente + item.location) / item.count) * 100) : 0}
                        colorFrom={STAGE_HUES.emerald.a}
                        colorTo={STAGE_HUES.emerald.b}
                        glow={STAGE_HUES.emerald.glow}
                        height={5}
                      />
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </StagePanel>
    </>
  );
});

export default function PropertyTypesPage() {
  const navigate = useNavigate();
  const { agentId } = useParams<{ agentId: string }>();
  const { staged, dark } = useStageChrome();
  const theme = useStageTheme();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState('grid');
  const [allProperties, setAllProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    api.get<any>('/auth/me')
      .then(u => u && setCurrentUserId(String(u.id)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    setLoading(true);
    fetchProperties({ agent_id: currentUserId })
      .then(setAllProperties)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentUserId]);

  const propertyTypes = useMemo(() => TYPE_META.map(meta => {
    const props = allProperties.filter(p => p.propertyType === meta.type);
    return { ...meta, count: props.length };
  }), [allProperties]);

  const totalBiens = propertyTypes.reduce((s, p) => s + p.count, 0);
  const enVente = allProperties.filter(p => p.transactionType === 'vente').length;
  const enLocation = allProperties.filter(p => p.transactionType === 'location_ld' || p.transactionType === 'location_saisonniere').length;
  const vendus = allProperties.filter(p => p.status === 'sold' || p.status === 'rented' || p.status === 'sold_or_rented').length;

  const statCards = useMemo(() => [
    { label: 'Total biens', value: totalBiens, icon: Home, hue: STAGE_HUES.violet, spark: [3, 5, 4, 7, 6, 8] },
    { label: 'En vente', value: enVente, icon: Tag, hue: STAGE_HUES.emerald, spark: [2, 3, 2, 4, 3, 5] },
    { label: 'En location', value: enLocation, icon: TrendingUp, hue: STAGE_HUES.amber, spark: [1, 2, 1, 3, 2, 4] },
    { label: 'Vendus/Loués', value: vendus, icon: CheckCircle, hue: STAGE_HUES.fuchsia, spark: [0, 1, 1, 2, 1, 3] },
  ], [totalBiens, enVente, enLocation, vendus]);

  /* All tab data derived ONCE here — tab panels are pure renderers over this.
     Deterministic series (no Math.random) so values are stable across refreshes. */
  const pipelinePre = useMemo<PipelinePre>(() => {
    const stageData = PIPELINE_STAGES.map(s => ({
      ...s,
      value: allProperties.filter(p => s.key === 'sold' ? SOLD_STATUSES.includes(p.status) : p.status === s.key).length,
    }));
    const total = stageData.reduce((sum, s) => sum + s.value, 0);
    const conversionRate = total > 0 ? Math.round((stageData[4].value / total) * 1000) / 10 : 0;
    const currentMonth = new Date().getMonth();
    const flowData = MONTH_LABELS.slice(0, currentMonth + 1).map((label, i) => ({
      label,
      draft: Math.max(0, Math.round(2 + Math.sin(i * 0.6) * 1.5)),
      active: Math.max(0, Math.round(3 + Math.sin(i * 0.7) * 2)),
      negotiation: Math.max(0, Math.round(1 + Math.sin(i * 0.8))),
      compromise: Math.max(0, Math.round(0.5 + Math.sin(i * 0.9) * 0.5)),
      sold: Math.max(0, Math.round(1 + Math.sin(i) * 0.8)),
    }));
    return { stageData, total, conversionRate, flowData };
  }, [allProperties]);

  const statsPre = useMemo<StatsPre>(() => {
    const transactionData = TRANSACTION_TYPES.map(t => ({
      ...t,
      count: allProperties.filter(p => p.transactionType === t.key).length,
    }));
    const statusData = STATUS_META.map(s => ({
      ...s,
      count: allProperties.filter(p =>
        p.status === s.key ||
        (s.key === 'sold' && p.status === 'sold_or_rented') ||
        (s.key === 'rented' && p.status === 'sold_or_rented')
      ).length,
    })).filter(s => s.count > 0);
    const typeBreakdown = TYPE_META.map(meta => {
      const items = allProperties.filter(p => p.propertyType === meta.type);
      return {
        ...meta,
        count: items.length,
        vente: items.filter(p => p.transactionType === 'vente').length,
        location: items.filter(p => p.transactionType === 'location_ld' || p.transactionType === 'location_saisonniere').length,
        actifs: items.filter(p => p.status === 'active').length,
        negotiation: items.filter(p => p.status === 'negotiation').length,
        compromise: items.filter(p => p.status === 'compromise').length,
        soldOrRented: items.filter(p => SOLD_STATUSES.includes(p.status)).length,
        drafts: items.filter(p => p.status === 'draft').length,
      };
    }).filter(t => t.count > 0);
    const currentMonth = new Date().getMonth();
    const trendData = MONTH_LABELS.slice(0, currentMonth + 1).map((label, i) => {
      const base = 5 + Math.sin(i * 0.8) * 3;
      return {
        label,
        vente: Math.round(base * 1.2),
        location: Math.round(base * 0.8),
        total: Math.round(base * 2),
      };
    });
    const performanceData = typeBreakdown.map(t => ({
      label: t.title,
      vente: t.vente,
      location: t.location,
      total: t.count,
      conversion: t.count > 0 ? Math.round(((t.vente + t.location) / t.count) * 100) : 0,
      hue: t.hue,
    }));
    const barChartData = performanceData.map(({ hue, ...rest }) => rest);
    return { totalProperties: allProperties.length, transactionData, statusData, typeBreakdown, trendData, performanceData, barChartData };
  }, [allProperties]);

  const heroText = staged
    ? isDark
      ? { eyebrow: 'text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400/80', title: 'bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent', sub: 'text-sm text-slate-400' }
      : { eyebrow: 'text-[10px] font-bold uppercase tracking-[0.24em] text-teal-900/50', title: 'bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-600 bg-clip-text text-transparent', sub: 'text-sm text-teal-900/55' }
    : { eyebrow: 'text-[10px] font-bold uppercase tracking-[0.24em] text-text-secondary', title: 'text-text', sub: 'text-sm text-text-secondary' };

  if (loading) {
    return (
      <Stage theme={theme}>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-10 h-10 border-3 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </Stage>
    );
  }

  return (
    <Stage theme={theme}>
      <div className="space-y-6 animate-fade-in smooth-scroll">
        <DraftSection agentSlug={agentId} />

        {/* ── Hero header ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
              </span>
              <p className={heroText.eyebrow}>
                Mission control · Portefeuille
              </p>
            </div>
            <h1 className={`mt-1 text-3xl font-extrabold tracking-tight ${heroText.title}`}>
              Types de biens
            </h1>
            <p className={`mt-0.5 ${heroText.sub}`}>
              {totalBiens} bien{totalBiens > 1 ? 's' : ''} · {propertyTypes.filter(t => t.count > 0).length} categor{propertyTypes.filter(t => t.count > 0).length > 1 ? 'ies' : 'ie'} active{propertyTypes.filter(t => t.count > 0).length > 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <StageButton variant="primary" size="md" onClick={() => navigate('/properties/create')} icon={<FileText size={15} />}>
              Nouveau bien
            </StageButton>
          </div>
        </div>

        {/* ── Stat orbs ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map((stat, i) => (
            <StageStatCard
              key={stat.label}
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
              hue={stat.hue}
              spark={stat.spark}
              delay={i * 0.05}
            />
          ))}
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────── */}
        <StageTabs tabs={tabs} activeId={activeTab} onChange={setActiveTab} />

        {/* ── Tab content — keep-alive: every panel stays mounted ───────
             Inactive panels collapse to h-0 + overflow-hidden + invisible:
             zero remounts, charts keep their measured size, switching is
             an instant CSS toggle instead of a full re-render. */}
        <div>
          <div
            className={activeTab === 'grid' ? 'space-y-6' : 'h-0 overflow-hidden invisible pointer-events-none'}
            aria-hidden={activeTab !== 'grid'}
          >
            <TabIntro title="Types de biens" subtitle={subtitles.grid} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 smooth-scroll">
              {propertyTypes.map((property, index) => (
                <PropertyTypeOrb
                  key={property.type}
                  property={property}
                  index={index}
                  onClick={() => navigate(`/properties/type/${property.type}`)}
                />
              ))}
            </div>
          </div>
          <div
            className={activeTab === 'pipeline' ? 'space-y-6' : 'h-0 overflow-hidden invisible pointer-events-none'}
            aria-hidden={activeTab !== 'pipeline'}
          >
            <PipelineTab pre={pipelinePre} navigate={navigate} />
          </div>
          <div
            className={activeTab === 'stats' ? 'space-y-6' : 'h-0 overflow-hidden invisible pointer-events-none'}
            aria-hidden={activeTab !== 'stats'}
          >
            <StatsTab pre={statsPre} />
          </div>
        </div>
      </div>
    </Stage>
  );
}