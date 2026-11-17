import { useState } from 'react';
import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import {
  Phone, Mail, MapPin, Calendar, DollarSign, Maximize2, Grid, Tag, Compass,
  ShoppingCart, Key, Heart, Edit3, ExternalLink, Trash2, MessageSquare, Clock,
  XOctagon, RotateCcw, Award, ChevronRight,
} from 'react-feather';
import { Prospect } from '../../../types/prospect';
import { calcProspectCompletion } from '../../../utils/prospectCompletion';
import { getQualifiedCountdown } from '../../../utils/qualifiedCountdown';
import { StatusChangeDropdown } from './StatusChangeDropdown';
import { TiltCard, ShimmerProgress, STAGE_HUES, useStageTheme, type StageHue } from '../../dashboard/Stage';

interface ProspectCardProps {
  prospect: Prospect;
  onClick?: () => void;
  onEdit?: (prospect: Prospect) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (prospectId: string, status: Prospect['status']) => void;
  onCalendarClick?: (prospectId: string, prospectName: string) => void;
  onQualifyClick?: (prospect: Prospect) => void;
  onQualify?: (prospectId: string) => void;
  onMarkLost?: (prospectId: string) => void;
  onViewContact?: (contactId: string) => void;
  canWrite?: boolean;
}

/* =====================================================================
   ProspectCard — premium Stage edition (mirrors ClientCard):
   dark = one united stage hue identity across all cards (violet, like
   a single-type clients page), light = sidebar emerald glass.
   Status badge = per-status convenient color with pulsing dot, exactly
   like the client status tags (own color per status, both themes).
   Dark completion bar glows with the united card accent.
   Footer pinned to the bottom so every row stays aligned.
   ===================================================================== */

export const TYPE_META: Record<string, { icon: any; label: string; hue: StageHue }> = {
  Acheter: { icon: ShoppingCart, label: 'Acheter', hue: STAGE_HUES.violet },
  Louer: { icon: Key, label: 'Louer', hue: STAGE_HUES.sky },
  Vendre: { icon: Tag, label: 'Vendre', hue: STAGE_HUES.emerald },
  'Faire estimer': { icon: Compass, label: 'Faire estimer', hue: STAGE_HUES.amber },
};

const SKY_HUE: StageHue = { a: '#38BDF8', b: '#0369A1', glow: 'rgba(56,189,248,0.40)', line: '#38BDF8' };
const AMBER_HUE: StageHue = { a: '#FBBF24', b: '#B45309', glow: 'rgba(251,191,36,0.40)', line: '#FBBF24' };
const ORANGE_HUE: StageHue = { a: '#FB923C', b: '#C2410C', glow: 'rgba(251,146,60,0.35)', line: '#FB923C' };
export const RED_HUE: StageHue = { a: '#F87171', b: '#B91C1C', glow: 'rgba(248,113,113,0.40)', line: '#F87171' };
const VIOLET_HUE: StageHue = { a: '#8B7CFF', b: '#5B4BD4', glow: 'rgba(124,92,255,0.50)', line: '#8B7CFF' };

export const normalizeStatus = (s?: string) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

const STATUS_HUES: Record<string, StageHue> = {
  nouveau: SKY_HUE,
  contacte: AMBER_HUE,
  qualifie: STAGE_HUES.emerald,
  'en attente': ORANGE_HUE,
  perdu: RED_HUE,
  converti: VIOLET_HUE,
};

export const getStatusHue = (status?: string): StageHue | undefined => STATUS_HUES[normalizeStatus(status)];

const STATUS_LABELS: Record<string, string> = {
  nouveau: 'Nouveau',
  contacte: 'Contacté',
  qualifie: 'Qualifié',
  'en attente': 'En attente',
  perdu: 'Perdu',
  converti: 'Converti',
};

export const getStatusLabel = (status?: string): string => STATUS_LABELS[normalizeStatus(status)] || (status || '');

export const SIDEBAR_EMERALD: StageHue = { a: '#2DD4BF', b: '#0D9488', glow: 'rgba(13,148,136,0.35)', line: '#14B8A6' };
export const LIGHT_INK = '#0F766E';

export function getInitials(firstName?: string, lastName?: string): string {
  const a = (firstName || '').trim().charAt(0);
  const b = (lastName || '').trim().charAt(0);
  const initials = `${a}${b}`.toUpperCase();
  return initials || '??';
}

interface DetailChip {
  icon: any;
  value: string;
}

interface DetailTag {
  label: string;
  primary?: boolean;
}

export const ProspectCard = ({ prospect, onClick, onEdit, onDelete, onStatusChange, onCalendarClick, onQualifyClick, onQualify, onMarkLost, onViewContact, canWrite = true }: ProspectCardProps) => {
  const [liked, setLiked] = useState(false);
  const theme = useStageTheme();
  const isDark = theme === 'dark';

  const meta = TYPE_META[prospect.type] || TYPE_META.Acheter;
  const TypeIcon = meta.icon;
  /* Dark: united stage violet across every card (like a clients page sharing one type hue). */
  const accent = isDark ? STAGE_HUES.violet : SIDEBAR_EMERALD;
  const ink = isDark ? STAGE_HUES.violet.a : LIGHT_INK;
  const badgeHue = getStatusHue(prospect.status) || accent;
  const statusKey = normalizeStatus(prospect.status);

  const fullName = `${prospect.civility ? prospect.civility + ' ' : ''}${prospect.firstName} ${prospect.lastName}`.trim();
  const devise = prospect.currency || 'MAD';
  const formatPrice = (val?: number) => (val ? val.toLocaleString('fr-FR') : null);
  const completion = calcProspectCompletion(prospect);
  const completionHue = completion >= 80 ? STAGE_HUES.emerald : completion >= 50 ? STAGE_HUES.amber : RED_HUE;

  const chips: DetailChip[] = [];
  if (prospect.location) chips.push({ icon: MapPin, value: prospect.location });
  if (prospect.rooms) chips.push({ icon: Grid, value: `${prospect.rooms} pièces` });
  if (prospect.bedrooms) chips.push({ icon: Grid, value: `${prospect.bedrooms} ch.` });
  if (prospect.minSurface) chips.push({ icon: Maximize2, value: `${prospect.minSurface} m²` });
  if (prospect.maxPrice) chips.push({ icon: DollarSign, value: `${formatPrice(prospect.maxPrice)} ${devise}` });
  if (prospect.origin) chips.push({ icon: Compass, value: prospect.origin });
  if (prospect.spokenLanguage) chips.push({ icon: Tag, value: prospect.spokenLanguage });
  const visibleChips = chips.slice(0, 6);

  const tags: DetailTag[] = [];
  if (prospect.viewType) tags.push({ label: `Vue ${prospect.viewType}`, primary: true });
  if (prospect.viewDetail) tags.push({ label: prospect.viewDetail });
  if (prospect.categories) tags.push({ label: prospect.categories });
  (prospect.propertyTypes || []).slice(0, 3).forEach(pt => tags.push({ label: pt }));
  const visibleTags = tags.slice(0, 5);

  const badgeStyle: CSSProperties = isDark
    ? { background: `${badgeHue.a}2E`, color: '#fff', border: `1px solid ${badgeHue.a}5C`, boxShadow: `0 2px 12px ${badgeHue.glow}, inset 0 1px 0 rgba(255,255,255,0.14)` }
    : { background: `${badgeHue.a}1C`, color: badgeHue.b, border: `1px solid ${badgeHue.a}42`, boxShadow: `0 2px 10px ${badgeHue.glow}, inset 0 1px 0 rgba(255,255,255,0.7)` };

  const countdown = statusKey === 'qualifie' ? getQualifiedCountdown(prospect.qualifiedAt) : null;
  const countdownHue = countdown
    ? (countdown.urgency === 'safe' ? STAGE_HUES.emerald : countdown.urgency === 'warning' ? STAGE_HUES.amber : RED_HUE)
    : null;

  return (
    <motion.div
      className="h-full"
      layout
      initial={{ opacity: 0, y: 28, scale: 0.96, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="group relative h-full" style={{ perspective: 1000 }}>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-2 rounded-[26px] opacity-60 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: `radial-gradient(60% 55% at 50% 0%, ${accent.glow}, transparent 70%)`, filter: 'blur(18px)' }}
        />
        <TiltCard className="h-full !rounded-[20px]" onClick={onClick}>
          <div
            className="absolute inset-x-0 top-0 z-10 h-[3px]"
            style={{ background: `linear-gradient(90deg, ${accent.a}, ${accent.b})`, boxShadow: `0 0 14px ${accent.glow}` }}
          />
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
                    {getInitials(prospect.firstName, prospect.lastName)}
                  </div>
                  <span
                    className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2"
                    style={{
                      borderColor: isDark ? '#0B1022' : '#ffffff',
                      background: `linear-gradient(145deg, ${accent.a}, ${accent.b})`,
                      boxShadow: `0 2px 8px ${accent.glow}`,
                    }}
                  >
                    <TypeIcon size={9} className="text-white" />
                  </span>
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <h3 className={`truncate text-[15px] font-extrabold leading-snug tracking-[-0.2px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {fullName}
                    </h3>
                    {statusKey === 'nouveau' && (
                      <span className="relative flex h-1.5 w-1.5 shrink-0">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-60" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.9)]" />
                      </span>
                    )}
                  </div>
                  <div className={`mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <span className="inline-flex min-w-0 items-center gap-1">
                      <Phone size={11} className="shrink-0" style={{ color: ink }} />
                      <span className="truncate font-medium">{prospect.phone || '—'}</span>
                    </span>
                    {prospect.mobile && (
                      <span className="inline-flex min-w-0 items-center gap-1">
                        <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>·</span>
                        <span className="truncate font-medium">{prospect.mobile}</span>
                      </span>
                    )}
                    {prospect.email && (
                      <span className="inline-flex min-w-0 items-center gap-1">
                        <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>·</span>
                        <Mail size={11} className="shrink-0 opacity-60" />
                        <span className="truncate">{prospect.email}</span>
                      </span>
                    )}
                  </div>
                  {statusKey === 'converti' && prospect.contactId && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onViewContact?.(prospect.contactId!); }}
                      className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold transition-opacity hover:opacity-80"
                      style={{ color: ink }}
                      title="Voir le contact d'origine"
                    >
                      <ExternalLink size={10} /> Contact d'origine
                    </button>
                  )}
                </div>
              </div>

              {/* badges */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {onStatusChange && canWrite ? (
                  <StatusChangeDropdown
                    currentStatus={prospect.status}
                    onStatusChange={(status) => onStatusChange(prospect.id, status)}
                    onCalendarClick={() => onCalendarClick?.(prospect.id, fullName)}
                    onQualifyClick={() => onQualifyClick?.(prospect)}
                    compact
                  />
                ) : (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] backdrop-blur-md"
                    style={badgeStyle}
                  >
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: badgeHue.line }} />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: badgeHue.line, boxShadow: `0 0 8px ${badgeHue.glow}` }} />
                    </span>
                    <span className="max-w-[160px] truncate">{getStatusLabel(prospect.status)}</span>
                  </span>
                )}
                {countdown && countdownHue && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold"
                    style={isDark
                      ? { background: `${countdownHue.a}22`, color: countdownHue.a, border: `1px solid ${countdownHue.a}44` }
                      : { background: `${countdownHue.a}16`, color: countdownHue.b, border: `1px solid ${countdownHue.a}40` }}
                  >
                    <Clock size={9} />
                    {countdown.label}
                  </span>
                )}
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold"
                  style={isDark
                    ? { background: `${accent.a}14`, color: accent.a, border: `1px solid ${accent.a}30` }
                    : { background: `${accent.a}12`, color: ink, border: `1px solid ${accent.a}30` }}
                >
                  {meta.label}
                </span>
              </div>

              {/* detail chips */}
              {visibleChips.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-1.5">
                  {visibleChips.map((chip, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className={`flex min-w-0 items-center gap-1.5 rounded-xl border px-2 py-[7px] backdrop-blur-sm transition-colors duration-300 ${isDark ? 'border-white/[0.07] bg-white/[0.04]' : 'border-slate-200/70 bg-white/75 shadow-[0_1px_2px_rgba(15,23,42,0.05)]'}`}
                    >
                      <chip.icon size={12} className="shrink-0" style={{ color: ink }} />
                      <span className={`truncate text-[11px] font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                        {chip.value}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* tags */}
              {visibleTags.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {visibleTags.map((tag, i) => tag.primary ? (
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

              {/* message */}
              {prospect.message && (
                <div className={`mt-2 flex items-center gap-1.5 rounded-xl border px-2 py-1.5 ${isDark ? 'border-white/[0.06] bg-white/[0.03]' : 'border-slate-200/60 bg-white/50'}`}>
                  <MessageSquare size={10} className="shrink-0" style={{ color: ink }} />
                  <span className={`truncate text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{prospect.message}</span>
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
                  height={isDark ? 7 : 6}
                  intense={isDark}
                />
              </div>
            </div>

            {/* footer — pinned to bottom */}
            <div className={`mt-auto flex items-center justify-between gap-2 border-t px-4 py-2.5 backdrop-blur-md ${isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-teal-900/10 bg-white/60'}`}>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onClick?.(); }}
                className="group/btn inline-flex items-center gap-1 text-xs font-bold transition-all duration-200 hover:gap-1.5"
                style={{ color: ink }}
              >
                Voir fiche
                <ChevronRight size={13} strokeWidth={2.5} className="transition-transform duration-200 group-hover/btn:translate-x-0.5" />
              </button>
              <div className="flex items-center gap-1">
                <span className="flex items-center gap-1 transition-all duration-300 lg:translate-x-1 lg:opacity-0 lg:group-hover:translate-x-0 lg:group-hover:opacity-100 lg:group-focus-within:translate-x-0 lg:group-focus-within:opacity-100">
                  <button
                    type="button"
                    title="J'aime"
                    onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg border backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 ${liked ? 'border-rose-400/40 bg-rose-500/10 text-rose-400' : isDark ? 'border-white/10 bg-white/[0.05] text-slate-400 hover:border-white/20 hover:bg-white/10 hover:text-white' : 'border-slate-200/80 bg-white text-slate-500 shadow-sm hover:text-slate-900'}`}
                  >
                    <Heart size={13} fill={liked ? 'currentColor' : 'none'} />
                  </button>
                  {statusKey === 'contacte' && canWrite && (
                    <button
                      type="button"
                      title="Programmer un rappel"
                      onClick={(e) => { e.stopPropagation(); onCalendarClick?.(prospect.id, fullName); }}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg border backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 ${isDark ? 'border-white/10 bg-white/[0.05] text-amber-300 hover:border-amber-300/40 hover:bg-amber-400/10' : 'border-slate-200/80 bg-white text-amber-500 shadow-sm hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600'}`}
                    >
                      <Calendar size={13} />
                    </button>
                  )}
                  {!['qualifie', 'perdu', 'converti'].includes(statusKey) && canWrite && (
                    <button
                      type="button"
                      title="Qualifier le prospect"
                      onClick={(e) => { e.stopPropagation(); onQualify?.(prospect.id); }}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg border backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 ${isDark ? 'border-white/10 bg-white/[0.05] text-emerald-300 hover:border-emerald-300/40 hover:bg-emerald-400/10' : 'border-slate-200/80 bg-white text-emerald-500 shadow-sm hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600'}`}
                    >
                      <Award size={13} />
                    </button>
                  )}
                  {canWrite && (
                    <button
                      type="button"
                      title="Modifier"
                      onClick={(e) => { e.stopPropagation(); onEdit?.(prospect); }}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg border backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 ${isDark ? 'border-white/10 bg-white/[0.05] text-slate-400 hover:border-white/20 hover:bg-white/10 hover:text-white' : 'border-slate-200/80 bg-white text-slate-500 shadow-sm hover:text-slate-900'}`}
                    >
                      <Edit3 size={13} />
                    </button>
                  )}
                  {statusKey === 'converti' && prospect.contactId ? (
                    <button
                      type="button"
                      title="Voir le contact"
                      onClick={(e) => { e.stopPropagation(); onViewContact?.(prospect.contactId!); }}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg border backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 ${isDark ? 'border-violet-400/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20' : 'border-violet-200/80 bg-white text-violet-500 shadow-sm hover:bg-violet-50'}`}
                    >
                      <ExternalLink size={13} />
                    </button>
                  ) : statusKey === 'perdu' && canWrite ? (
                    <button
                      type="button"
                      title="Recontacter"
                      onClick={(e) => { e.stopPropagation(); onStatusChange?.(prospect.id, 'Contacté'); }}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg border backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 ${isDark ? 'border-sky-400/30 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20' : 'border-sky-200/80 bg-white text-sky-500 shadow-sm hover:bg-sky-50'}`}
                    >
                      <RotateCcw size={13} />
                    </button>
                  ) : null}
                  {!['perdu', 'converti'].includes(statusKey) && canWrite && (
                    <button
                      type="button"
                      title="Marquer comme perdu"
                      onClick={(e) => { e.stopPropagation(); onMarkLost?.(prospect.id); }}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg border backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 ${isDark ? 'border-white/10 bg-white/[0.05] text-rose-300/80 hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-300' : 'border-slate-200/80 bg-white text-rose-400 shadow-sm hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600'}`}
                    >
                      <XOctagon size={13} />
                    </button>
                  )}
                  {canWrite && (
                    <button
                      type="button"
                      title="Supprimer"
                      onClick={(e) => { e.stopPropagation(); onDelete?.(prospect.id); }}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg border backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 ${isDark ? 'border-white/10 bg-white/[0.05] text-slate-400 hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-300' : 'border-slate-200/80 bg-white text-slate-500 shadow-sm hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600'}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </span>
              </div>
            </div>
          </div>
        </TiltCard>
      </div>
    </motion.div>
  );
};
