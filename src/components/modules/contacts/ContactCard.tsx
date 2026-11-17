import { useState } from 'react';
import type { CSSProperties } from 'react';
import { motion, useAnimation } from 'framer-motion';
import {
  Phone, Mail, MapPin, Globe, User, Users, Briefcase, MessageSquare,
  Calendar, Hash, FileText, Star, Heart, Edit3, ExternalLink, Trash2,
  TrendingUp, ShoppingCart, Key, Home, Compass, Lock, ChevronRight,
} from 'react-feather';
import { Contact } from '../../../types/contact';
import { calcContactCompletion } from '../../../utils/contactCompletion';
import { TiltCard, ShimmerProgress, STAGE_HUES, useStageTheme, type StageHue } from '../../dashboard/Stage';
import { SIDEBAR_EMERALD, LIGHT_INK, RED_HUE } from '../prospects/ProspectCard';

interface ContactCardProps {
  contact: Contact;
  onClick?: () => void;
  onEdit?: (contact: Contact) => void;
  onDelete?: (id: string) => void;
  locked?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canExport?: boolean;
}

/* =====================================================================
   ContactCard — premium Stage edition (mirrors ProspectCard):
   dark = one united stage hue identity across all cards (sky — the
   contact module hue), light = sidebar emerald glass.
   Mandat type pills use the client-type hues shared with the clients
   module (Acheteur violet, Vendeur sky, Bailleur emerald, Locataire
   amber, Voyageur fuchsia), each with its count and active dot.
   ===================================================================== */

export const TYPE_META: Record<string, { icon: any; label: string; hue: StageHue }> = {
  Particulier: { icon: User, label: 'Particulier', hue: STAGE_HUES.sky },
  Professionnel: { icon: Briefcase, label: 'Professionnel', hue: STAGE_HUES.violet },
  'Indivision / Succession': { icon: Users, label: 'Indivision', hue: STAGE_HUES.amber },
};

const MANDAT_META: Record<string, { icon: any; hue: StageHue }> = {
  Vendeur: { icon: TrendingUp, hue: STAGE_HUES.sky },
  Bailleur: { icon: Key, hue: STAGE_HUES.emerald },
  Acheteur: { icon: ShoppingCart, hue: STAGE_HUES.violet },
  Locataire: { icon: Home, hue: STAGE_HUES.amber },
  Voyageur: { icon: Compass, hue: STAGE_HUES.fuchsia },
};

export function getInitials(civility?: string, firstName?: string, lastName?: string): string {
  const a = (firstName || '').trim().charAt(0);
  const b = (lastName || '').trim().charAt(0);
  const initials = `${a}${b}`.toUpperCase();
  return initials || '??';
}

interface DetailChip {
  icon: any;
  value: string;
}

export const ContactCard = ({ contact, onClick, onEdit, onDelete, locked = false, canEdit = true, canDelete = true, canExport = true }: ContactCardProps) => {
  const [liked, setLiked] = useState(false);
  const shakeControls = useAnimation();
  const theme = useStageTheme();
  const isDark = theme === 'dark';

  const meta = TYPE_META[contact.type] || TYPE_META.Particulier;
  const TypeIcon = meta.icon;
  /* Dark: united stage sky across every card (single-type clients page look). */
  const accent = isDark ? STAGE_HUES.sky : SIDEBAR_EMERALD;
  const ink = isDark ? STAGE_HUES.sky.a : LIGHT_INK;

  const fullName = `${contact.civility} ${contact.firstName} ${contact.lastName}`.trim();
  const completion = calcContactCompletion(contact);
  const completionHue = completion >= 80 ? STAGE_HUES.emerald : completion >= 50 ? STAGE_HUES.amber : RED_HUE;

  const uniqueClientTypes = Array.from(new Set(contact.mandats.map((m) => m.clientType)));
  const activeMandats = contact.mandats.filter((m) => m.status === 'Actif');
  const pendingMandats = contact.mandats.filter((m) => m.status === 'En attente');
  const expiredMandats = contact.mandats.filter((m) => m.status === 'Expiré');
  const hasPrivateNote = !!contact.commentairePrive;

  const initials = getInitials(contact.civility, contact.firstName, contact.lastName);
  const fullAddress = [contact.adresse, contact.codePostal, contact.ville, contact.pays].filter(Boolean).join(', ');
  const hasLanguages = contact.langueParlee && contact.langueParlee.length > 0;

  const chips: DetailChip[] = [];
  if (fullAddress) chips.push({ icon: MapPin, value: fullAddress });
  if (contact.nationalite) chips.push({ icon: Globe, value: contact.nationalite });
  if (contact.situationFamiliale) chips.push({
    icon: User,
    value: `${contact.situationFamiliale}${contact.nombreEnfants !== undefined && contact.nombreEnfants > 0 ? ` · ${contact.nombreEnfants} enfant${contact.nombreEnfants > 1 ? 's' : ''}` : ''}`,
  });
  if (contact.moyenContactPrefere) chips.push({ icon: MessageSquare, value: contact.moyenContactPrefere });
  if (contact.numeroFiscal) chips.push({ icon: Hash, value: contact.numeroFiscal });
  if (contact.dateNaissance) chips.push({ icon: Calendar, value: new Date(contact.dateNaissance).toLocaleDateString('fr-FR') });
  if (contact.regimeMatrimonial) chips.push({ icon: FileText, value: contact.regimeMatrimonial });
  if (contact.prescripteur) chips.push({ icon: Star, value: contact.prescripteur });
  const visibleChips = chips.slice(0, 6);

  const handleCardClick = () => {
    if (locked) {
      shakeControls.start({
        x: [0, -10, 10, -7, 7, -4, 4, 0],
        transition: { duration: 0.45 },
      });
      return;
    }
    onClick?.();
  };

  const mandatTypePill = (ct: string) => {
    const m = MANDAT_META[ct] || { icon: null, hue: accent };
    const Icon = m.icon;
    const count = contact.mandats.filter((x) => x.clientType === ct).length;
    const activeCount = contact.mandats.filter((x) => x.clientType === ct && x.status === 'Actif').length;
    return (
      <span
        key={ct}
        className="inline-flex max-w-full items-center gap-1 truncate rounded-lg px-2 py-1 text-[10px] font-bold"
        style={isDark
          ? { background: `${m.hue.a}1E`, color: m.hue.a, border: `1px solid ${m.hue.a}36` }
          : { background: `${m.hue.a}14`, color: m.hue.b, border: `1px solid ${m.hue.a}36` }}
      >
        {Icon && <Icon size={10} className="shrink-0" />}
        <span className="truncate">{ct}</span>
        {count > 1 && <span className="opacity-60">×{count}</span>}
        {activeCount > 0 && (
          <span
            className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full rounded-full text-[7px] font-extrabold text-white"
            style={{ background: STAGE_HUES.emerald.b, boxShadow: `0 0 6px ${STAGE_HUES.emerald.glow}` }}
          >
            {activeCount}
          </span>
        )}
      </span>
    );
  };

  return (
    <motion.div className="h-full" animate={shakeControls} layout>
      <div className="group relative h-full" style={{ perspective: 1000 }}>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-2 rounded-[26px] opacity-60 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: `radial-gradient(60% 55% at 50% 0%, ${accent.glow}, transparent 70%)`, filter: 'blur(18px)' }}
        />
        <TiltCard className="h-full !rounded-[20px]" onClick={handleCardClick}>
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
                    {initials}
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
                  <h3 className={`truncate text-[15px] font-extrabold leading-snug tracking-[-0.2px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {fullName}
                  </h3>
                  <div className={`mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <span className="inline-flex min-w-0 items-center gap-1">
                      <Phone size={11} className="shrink-0" style={{ color: ink }} />
                      <span className="truncate font-medium">{contact.mobile || '—'}</span>
                    </span>
                    {contact.emailPrincipal && (
                      <span className="inline-flex min-w-0 items-center gap-1">
                        <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>·</span>
                        <Mail size={11} className="shrink-0 opacity-60" />
                        <span className="truncate">{contact.emailPrincipal}</span>
                      </span>
                    )}
                    {contact.profession && (
                      <span className="inline-flex min-w-0 items-center gap-1">
                        <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>·</span>
                        <span className="truncate">{contact.profession}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* badges */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold"
                  style={isDark
                    ? { background: `${meta.hue.a}1E`, color: meta.hue.a, border: `1px solid ${meta.hue.a}36` }
                    : { background: `${meta.hue.a}14`, color: meta.hue.b, border: `1px solid ${meta.hue.a}36` }}
                >
                  <TypeIcon size={9} />
                  {meta.label}
                </span>
                {activeMandats.length > 0 && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] backdrop-blur-md"
                    style={isDark
                      ? { background: `${STAGE_HUES.emerald.a}2E`, color: '#fff', border: `1px solid ${STAGE_HUES.emerald.a}5C`, boxShadow: `0 2px 12px ${STAGE_HUES.emerald.glow}, inset 0 1px 0 rgba(255,255,255,0.14)` }
                      : { background: `${STAGE_HUES.emerald.a}1C`, color: STAGE_HUES.emerald.b, border: `1px solid ${STAGE_HUES.emerald.a}42`, boxShadow: `0 2px 10px ${STAGE_HUES.emerald.glow}, inset 0 1px 0 rgba(255,255,255,0.7)` }}
                  >
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: STAGE_HUES.emerald.line }} />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: STAGE_HUES.emerald.line, boxShadow: `0 0 8px ${STAGE_HUES.emerald.glow}` }} />
                    </span>
                    {activeMandats.length} actif{activeMandats.length > 1 ? 's' : ''}
                  </span>
                )}
                {locked && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold"
                    style={isDark
                      ? { background: `${STAGE_HUES.amber.a}22`, color: STAGE_HUES.amber.a, border: `1px solid ${STAGE_HUES.amber.a}44` }
                      : { background: `${STAGE_HUES.amber.a}16`, color: STAGE_HUES.amber.b, border: `1px solid ${STAGE_HUES.amber.a}40` }}
                  >
                    <Lock size={9} />
                    Verrouillé
                  </span>
                )}
                {hasPrivateNote && (
                  <span
                    className="inline-flex items-center rounded-full px-1.5 py-1 text-[10px]"
                    title="Note privée"
                    style={isDark
                      ? { background: `${STAGE_HUES.amber.a}16`, color: STAGE_HUES.amber.a, border: `1px solid ${STAGE_HUES.amber.a}38` }
                      : { background: `${STAGE_HUES.amber.a}12`, color: STAGE_HUES.amber.b, border: `1px solid ${STAGE_HUES.amber.a}38` }}
                  >
                    <Lock size={9} />
                  </span>
                )}
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

              {/* mandat type pills + languages */}
              {(uniqueClientTypes.length > 0 || hasLanguages) && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {uniqueClientTypes.map((ct) => mandatTypePill(ct))}
                  {(contact.langueParlee || []).slice(0, 3).map((lang) => (
                    <span
                      key={lang}
                      className={`inline-flex max-w-full items-center truncate rounded-lg border px-2 py-1 text-[10px] font-semibold ${isDark ? 'border-white/10 bg-white/[0.04] text-slate-300' : 'border-slate-200/80 bg-white/60 text-slate-500'}`}
                    >
                      <span className="truncate">{lang}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* mandat status summary */}
              {(activeMandats.length > 0 || pendingMandats.length > 0 || expiredMandats.length > 0) && (
                <div className={`mt-2 flex items-center gap-3 text-[10px] font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {activeMandats.length > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: STAGE_HUES.emerald.line, boxShadow: `0 0 6px ${STAGE_HUES.emerald.glow}` }} />
                      {activeMandats.length} actif{activeMandats.length > 1 ? 's' : ''}
                    </span>
                  )}
                  {pendingMandats.length > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: STAGE_HUES.amber.line }} />
                      {pendingMandats.length} en attente
                    </span>
                  )}
                  {expiredMandats.length > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: RED_HUE.line }} />
                      {expiredMandats.length} expiré{expiredMandats.length > 1 ? 's' : ''}
                    </span>
                  )}
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
                  {canEdit && (
                    <button
                      type="button"
                      title="Modifier"
                      onClick={(e) => { e.stopPropagation(); onEdit?.(contact); }}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg border backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 ${isDark ? 'border-white/10 bg-white/[0.05] text-slate-400 hover:border-white/20 hover:bg-white/10 hover:text-white' : 'border-slate-200/80 bg-white text-slate-500 shadow-sm hover:text-slate-900'}`}
                    >
                      <Edit3 size={13} />
                    </button>
                  )}
                  {canExport && (
                    <button
                      type="button"
                      title="Partager la fiche"
                      onClick={(e) => { e.stopPropagation(); }}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg border backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 ${isDark ? 'border-white/10 bg-white/[0.05] text-slate-400 hover:border-sky-400/40 hover:bg-sky-400/10 hover:text-sky-300' : 'border-slate-200/80 bg-white text-slate-500 shadow-sm hover:border-sky-200 hover:bg-sky-50 hover:text-sky-600'}`}
                    >
                      <ExternalLink size={13} />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      title="Supprimer"
                      onClick={(e) => { e.stopPropagation(); onDelete?.(contact.id); }}
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
