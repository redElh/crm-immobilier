import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import {
  Phone, Mail, MapPin, DollarSign, Globe, Tag, Grid, Compass, Clock,
} from 'react-feather';
import { CompletionRing } from '../../ui/CompletionRing';
import { calcProspectCompletion } from '../../../utils/prospectCompletion';
import { getQualifiedCountdown } from '../../../utils/qualifiedCountdown';
import { StatusChangeDropdown } from './StatusChangeDropdown';
import { Prospect } from '../../../types/prospect';
import { STAGE_HUES } from '../../dashboard/Stage';
import { useProspectAccent } from './ProspectDetailStage';
import { TYPE_META, RED_HUE, getStatusHue, getStatusLabel, getInitials, normalizeStatus } from './ProspectCard';

/* =====================================================================
   ProspectHeader — premium Stage edition of the prospect detail hero:
   orb initials + type lens, status dropdown with per-status pulsing hue,
   countdown + type pills, completion lens chip, KPI chips and glass
   contact pills. Dark = united stage violet · Light = sidebar emerald.
   ===================================================================== */

const fmtDate = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : null;

const fmtDateTime = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;

interface ProspectHeaderProps {
  prospect: Prospect;
  canWrite: boolean;
  onStatusChange: (status: Prospect['status']) => void;
  onCalendarClick: () => void;
  onQualifyClick: () => void;
}

export const ProspectHeader = ({ prospect, canWrite, onStatusChange, onCalendarClick, onQualifyClick }: ProspectHeaderProps) => {
  const { isDark, accent, ink } = useProspectAccent();

  const meta = TYPE_META[prospect.type] || TYPE_META.Acheter;
  const TypeIcon = meta.icon;
  const badgeHue = getStatusHue(prospect.status) || accent;
  const statusKey = normalizeStatus(prospect.status);
  const fullName = `${prospect.civility ? prospect.civility + ' ' : ''}${prospect.firstName} ${prospect.lastName}`.trim();
  const devise = prospect.currency || 'MAD';

  const completion = calcProspectCompletion(prospect);
  const completionHue = completion >= 80 ? STAGE_HUES.emerald : completion >= 50 ? STAGE_HUES.amber : RED_HUE;
  const completionInk = isDark ? completionHue.a : completionHue.b;
  const completionHint = completion >= 80 ? 'Dossier complet' : completion >= 50 ? 'En cours' : 'À compléter';

  const countdown = statusKey === 'qualifie' ? getQualifiedCountdown(prospect.qualifiedAt) : null;
  const countdownHue = countdown
    ? (countdown.urgency === 'safe' ? STAGE_HUES.emerald : countdown.urgency === 'warning' ? STAGE_HUES.amber : RED_HUE)
    : null;

  const badgeStyle: CSSProperties = isDark
    ? { background: `${badgeHue.a}2E`, color: '#fff', border: `1px solid ${badgeHue.a}5C`, boxShadow: `0 2px 12px ${badgeHue.glow}, inset 0 1px 0 rgba(255,255,255,0.14)` }
    : { background: `${badgeHue.a}1C`, color: badgeHue.b, border: `1px solid ${badgeHue.a}42`, boxShadow: `0 2px 10px ${badgeHue.glow}, inset 0 1px 0 rgba(255,255,255,0.7)` };

  const contactPill = `inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold backdrop-blur-md transition-all duration-200 ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10 hover:text-white' : 'border-slate-200/80 bg-white/70 text-slate-600 shadow-sm hover:bg-white hover:text-slate-900'}`;

  const kpis = [
    { label: 'Budget max', value: prospect.maxPrice ? `${prospect.maxPrice.toLocaleString('fr-FR')} ${devise}` : '—', icon: DollarSign },
    { label: 'Localisation', value: prospect.location || '—', icon: MapPin },
    { label: 'Pièces', value: prospect.rooms ? `${prospect.rooms} pièces` : '—', icon: Grid },
    { label: 'Origine', value: prospect.origin || '—', icon: Compass },
  ];

  const reminderLabel = fmtDateTime(prospect.reminderDate);
  const contactedLabel = fmtDate(prospect.contactedAt);
  const qualifiedLabel = fmtDate(prospect.qualifiedAt);

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
        {/* ── Identity row: avatar + name (left), completion lens (right) ── */}
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
                {getInitials(prospect.firstName, prospect.lastName)}
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
                {canWrite ? (
                  <StatusChangeDropdown
                    currentStatus={prospect.status}
                    onStatusChange={onStatusChange}
                    onCalendarClick={onCalendarClick}
                    onQualifyClick={onQualifyClick}
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
                    <span className="max-w-[220px] truncate">{getStatusLabel(prospect.status)}</span>
                  </span>
                )}
                {countdown && countdownHue && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold"
                    style={isDark
                      ? { background: `${countdownHue.a}22`, color: countdownHue.a, border: `1px solid ${countdownHue.a}44` }
                      : { background: `${countdownHue.a}16`, color: countdownHue.b, border: `1px solid ${countdownHue.a}40` }}
                  >
                    <Clock size={10} />
                    {countdown.label}
                  </span>
                )}
                <span
                  className="inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold"
                  style={isDark
                    ? { background: `${accent.a}14`, color: accent.a, border: `1px solid ${accent.a}30` }
                    : { background: `${accent.a}12`, color: ink, border: `1px solid ${accent.a}30` }}
                >
                  {meta.label}
                </span>
              </motion.div>
              <div className={`mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {prospect.origin && <span className="font-semibold" style={{ color: ink }}>{prospect.origin}</span>}
                {prospect.createdAt && <span>· Créé le {fmtDate(prospect.createdAt)}</span>}
              </div>
            </div>
          </div>

          {/* ── Completion lens: standalone staged chip ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            title={`Profil complété à ${completion}%`}
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

        {/* ── KPI chips ── */}
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
                <p className={`mt-1.5 truncate text-sm font-extrabold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {kpi.value}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* ── Reminder bar ── */}
        {reminderLabel && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className={`flex flex-wrap items-center gap-2 rounded-2xl border px-3.5 py-2.5 ${isDark ? 'border-orange-400/20 bg-orange-500/10' : 'border-orange-200/80 bg-orange-50/70'}`}
          >
            <Clock size={13} className={isDark ? 'text-orange-300' : 'text-orange-600'} />
            <span className={`text-xs font-bold ${isDark ? 'text-orange-300' : 'text-orange-700'}`}>
              Rappel : {reminderLabel}
            </span>
            {prospect.reminderNote && (
              <span className={`text-[11px] ${isDark ? 'text-orange-300/70' : 'text-orange-600/80'}`}>— {prospect.reminderNote}</span>
            )}
          </motion.div>
        )}

        {/* ── Contact pills + follow-up timestamps ── */}
        <div className={`flex flex-col gap-3 border-t pt-4 lg:flex-row lg:items-center ${isDark ? 'border-white/[0.06]' : 'border-teal-900/10'}`}>
          <div className="flex flex-wrap items-center gap-1.5">
            {prospect.phone && (
              <a href={`tel:${prospect.phone}`} className={contactPill}>
                <Phone size={12} style={{ color: ink }} /> {prospect.phone}
              </a>
            )}
            {prospect.mobile && (
              <a href={`tel:${prospect.mobile}`} className={contactPill}>
                <Phone size={12} style={{ color: ink }} /> {prospect.mobile}
              </a>
            )}
            {prospect.email && (
              <a href={`mailto:${prospect.email}`} className={contactPill}>
                <Mail size={12} style={{ color: ink }} /> <span className="max-w-[220px] truncate">{prospect.email}</span>
              </a>
            )}
            {prospect.spokenLanguage && (
              <span className={contactPill}>
                <Globe size={12} style={{ color: ink }} /> {prospect.spokenLanguage}
              </span>
            )}
            {prospect.meansOfContact?.length > 0 && (
              <span className={contactPill}>
                <Tag size={12} style={{ color: ink }} /> <span className="max-w-[200px] truncate">{prospect.meansOfContact.join(', ')}</span>
              </span>
            )}
          </div>
          {(contactedLabel || qualifiedLabel) && (
            <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold lg:ml-auto ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {contactedLabel && <span>Contacté le {contactedLabel}</span>}
              {qualifiedLabel && <span>Qualifié le {qualifiedLabel}</span>}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
