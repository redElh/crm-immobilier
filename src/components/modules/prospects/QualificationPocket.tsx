import { useState, useEffect, type CSSProperties } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, ChevronRight, ChevronDown, Phone, Mail, DollarSign, Trash2, Clock } from 'react-feather';
import { Prospect } from '../../../types/prospect';
import { fetchQualifiedProspects, updateProspectStatus } from '../../../services/prospectService';
import { getQualifiedCountdown } from '../../../utils/qualifiedCountdown';
import { useToast } from '../../ui/Toast';
import { useStageTheme, STAGE_HUES } from '../../dashboard/Stage';
import { getInitials } from './ProspectCard';
import { FLOATING_POCKET_ANCHOR, FLOATING_POCKET_PANEL, FLOATING_POCKET_LIST_H } from '../../../lib/floating';

interface QualificationPocketProps {
  onConvert: (prospect: Prospect) => void;
  refreshTrigger?: number;
  onStatusReverted?: (prospect: Prospect) => void;
  canWrite?: boolean;
  /** Fires when the orb appears/disappears, so the draft bubble can restack. */
  onPresenceChange?: (present: boolean) => void;
}

/* Urgency hues for the countdown chip (semantic, both themes). */
const URGENCY_HUES: Record<string, { a: string; b: string; glow: string }> = {
  safe: { a: '#34D399', b: '#059669', glow: 'rgba(52,211,153,0.35)' },
  warning: { a: '#FBBF24', b: '#B45309', glow: 'rgba(251,191,36,0.35)' },
  critical: { a: '#F87171', b: '#B91C1C', glow: 'rgba(248,113,113,0.35)' },
  expired: { a: '#EF4444', b: '#991B1B', glow: 'rgba(239,68,68,0.35)' },
};

export const QualificationPocket = ({ onConvert, refreshTrigger, onStatusReverted, canWrite = true, onPresenceChange }: QualificationPocketProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [qualified, setQualified] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const isDark = useStageTheme() === 'dark';

  const loadQualified = async () => {
    try {
      setLoading(true);
      const data = await fetchQualifiedProspects();
      setQualified(data);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQualified();
  }, [refreshTrigger]);

  useEffect(() => {
    onPresenceChange?.(qualified.length > 0 || isOpen);
  }, [qualified.length, isOpen, onPresenceChange]);

  const handleRemoveFromPocket = async (prospect: Prospect) => {
    const previousStatus = (prospect.qualificationData as Record<string, unknown>)?.previousStatus as Prospect['status'] | undefined;
    const revertTo = previousStatus || 'Contacté';
    try {
      const updated = await updateProspectStatus(prospect.id, revertTo);
      setQualified(prev => prev.filter(p => p.id !== prospect.id));
      onStatusReverted?.(updated);
      toast('success', `Prospect retourné au statut "${revertTo}"`);
    } catch {
      toast('error', 'Erreur lors du retrait');
    }
  };

  if (qualified.length === 0 && !isOpen) return null;

  /* Same volume as the Cardinal orb: identical 64px orb-icon recipe.
     Light stays emerald (qualified); dark mixes crimson → deep rose → violet. */
  const orbVars = {
    '--orb-a': isDark ? '#F43F5E' : STAGE_HUES.emerald.a,
    '--orb-b': isDark ? '#6D28D9' : STAGE_HUES.emerald.b,
    '--orb-glow': isDark ? 'rgba(190,18,60,0.55)' : STAGE_HUES.emerald.glow,
  } as CSSProperties;

  const ink = isDark ? '#F8FAFC' : '#0F172A';
  const subInk = isDark ? 'rgba(148,163,184,0.75)' : 'rgba(51,65,85,0.65)';
  const hairline = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.07)';

  const fieldPill: CSSProperties = {
    color: subInk,
    borderColor: hairline,
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.85)',
  };

  return (
    <div className={`fixed z-[10000] animate-fade-in ${FLOATING_POCKET_ANCHOR}`}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 480, damping: 34, mass: 0.7 }}
            className={`pop-glass absolute ${FLOATING_POCKET_PANEL} right-0 w-[360px] max-w-[calc(100vw-32px)] overflow-hidden rounded-3xl`}
            style={{ transformOrigin: '88% 100%' }}
          >
            {/* Identity hairline — mirrors the stage panel language */}
            <div
              className="h-[3px] w-full"
              style={{
                background: isDark
                  ? 'linear-gradient(90deg, transparent, rgba(244,63,94,0.85) 20%, #BE123C 45%, rgba(124,58,237,0.7) 75%, transparent)'
                  : 'linear-gradient(90deg, transparent, rgba(52,211,153,0.85) 20%, #34D399 50%, transparent)',
              }}
            />

            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 pb-3 pt-3.5">
              <span className="orb-icon h-10 w-10 shrink-0 rounded-full" style={orbVars}>
                <Award size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-tight tracking-tight" style={{ color: ink }}>Poche de qualification</p>
                <p className="text-[11px] leading-tight" style={{ color: subInk }}>
                  {qualified.length} prospect{qualified.length !== 1 ? 's' : ''} qualifié{qualified.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Replier la poche"
                className={`flex h-7 w-7 items-center justify-center rounded-full transition-all ${isDark ? 'text-slate-400 hover:bg-white/10 hover:text-white' : 'text-slate-500 hover:bg-slate-900/5 hover:text-slate-900'}`}
              >
                <motion.span animate={{ rotate: isOpen ? 0 : 180 }} transition={{ duration: 0.25 }}>
                  <ChevronDown size={14} />
                </motion.span>
              </button>
            </div>

            <div className="border-t" style={{ borderColor: hairline }} />

            {/* List */}
            <div className="space-y-2 overflow-y-auto p-2.5" style={{ maxHeight: FLOATING_POCKET_LIST_H }}>
              {loading ? (
                <div className="flex justify-center py-8">
                  <span className={`h-6 w-6 animate-spin rounded-full border-2 border-t-transparent ${isDark ? 'border-rose-400/80' : 'border-emerald-400/80'}`} />
                </div>
              ) : qualified.length === 0 ? (
                <div className="px-4 py-9 text-center">
                  <Award size={26} className="mx-auto mb-2 opacity-25" style={{ color: ink }} />
                  <p className="text-xs" style={{ color: subInk }}>Aucun prospect qualifié</p>
                </div>
              ) : (
                qualified.map((prospect, i) => {
                  const cd = getQualifiedCountdown(prospect.qualifiedAt);
                  const hue = cd ? URGENCY_HUES[cd.urgency] || URGENCY_HUES.safe : null;
                  return (
                    <motion.div
                      key={prospect.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="group relative overflow-hidden rounded-2xl border p-3"
                      style={{
                        borderColor: hairline,
                        background: isDark ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.72)',
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="orb-icon h-9 w-9 shrink-0 rounded-full text-[11px] font-extrabold tracking-wide"
                          style={orbVars}
                        >
                          {getInitials(prospect.firstName, prospect.lastName)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold leading-tight" style={{ color: ink }}>
                            {prospect.civility} {prospect.firstName} {prospect.lastName}
                          </p>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            {prospect.origin && (
                              <span className="truncate text-[10px]" style={{ color: subInk }}>{prospect.origin}</span>
                            )}
                            {cd && hue && (
                              <span
                                className="inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-px text-[9px] font-bold"
                                style={{
                                  color: isDark ? hue.a : hue.b,
                                  borderColor: `${hue.a}40`,
                                  backgroundColor: isDark ? `${hue.a}1F` : `${hue.a}14`,
                                }}
                              >
                                <Clock size={8} />
                                {cd.label}
                              </span>
                            )}
                          </div>
                        </div>
                        {canWrite && (
                          <button
                            onClick={() => handleRemoveFromPocket(prospect)}
                            title="Retirer de la poche"
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full opacity-0 transition-all group-hover:opacity-100 ${isDark ? 'text-slate-400 hover:bg-rose-400/15 hover:text-rose-300' : 'text-slate-400 hover:bg-rose-500/10 hover:text-rose-600'}`}
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>

                      {(prospect.phone || prospect.email || prospect.maxPrice) && (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {prospect.phone && (
                            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium" style={fieldPill}>
                              <Phone size={9} />{prospect.phone}
                            </span>
                          )}
                          {prospect.email && (
                            <span className="inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium" style={fieldPill}>
                              <Mail size={9} /><span className="truncate">{prospect.email}</span>
                            </span>
                          )}
                          {prospect.maxPrice && (
                              <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold" style={{ ...fieldPill, color: isDark ? '#FB7185' : STAGE_HUES.emerald.b }}>
                              <DollarSign size={9} />
                              {prospect.maxPrice.toLocaleString('fr-FR')} {prospect.currency || 'MAD'}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="mt-2.5">
                        {canWrite ? (
                          <button
                            onClick={() => onConvert(prospect)}
                            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold text-white transition-transform hover:scale-[1.015] active:scale-[0.97]"
                            style={{
                              backgroundImage: isDark
                                ? 'linear-gradient(145deg, #F43F5E 0%, #C2266B 55%, #6D28D9 100%)'
                                : 'linear-gradient(145deg, #34D399 0%, #10B981 55%, #059669 100%)',
                              boxShadow: isDark
                                ? 'inset 0 1px 0 rgba(255,255,255,0.35), 0 10px 22px -10px rgba(190,18,60,0.75)'
                                : 'inset 0 1px 0 rgba(255,255,255,0.4), 0 10px 22px -10px rgba(5,150,105,0.7)',
                            }}
                          >
                            Convertir en contact
                            <ChevronRight size={12} />
                          </button>
                        ) : (
                          <div className="flex w-full items-center justify-center rounded-xl border px-3 py-2 text-[11px] font-medium" style={{ ...fieldPill, color: subInk }}>
                            Consultation seule
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orb — same 64px volume as the Cardinal bubble, bottom-aligned with it */}
      <motion.button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={orbVars}
        aria-label="Poche de qualification"
        title="Poche de qualification"
        className={`orb-icon relative h-16 w-16 rounded-full focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-rose-300/60' : 'focus:ring-emerald-300/70'} ${isOpen ? 'ring-2 ring-white/50' : ''}`}
      >
        <Award size={26} />
        {qualified.length > 0 && (
          <motion.span
            key={qualified.length}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 620, damping: 22 }}
            className={`absolute -right-0.5 -top-0.5 flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-white px-1 text-[11px] font-extrabold ${isDark ? 'text-rose-600' : 'text-emerald-600'}`}
            style={{ boxShadow: isDark ? '0 6px 14px -6px rgba(190,18,60,0.95)' : '0 6px 14px -6px rgba(5,150,105,0.9)' }}
          >
            {qualified.length}
          </motion.span>
        )}
      </motion.button>
    </div>
  );
};
