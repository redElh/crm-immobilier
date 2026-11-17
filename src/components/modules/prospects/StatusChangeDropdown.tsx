import { useState, useRef, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Phone, CheckCircle, Clock, Award, XCircle, TrendingUp } from 'react-feather';
import { Prospect } from '../../../types/prospect';
import { useStageChrome } from '../../modules/calendar/useStageChrome';
import { STAGE_HUES, type StageHue } from '../../dashboard/Stage';

interface StatusChangeDropdownProps {
  currentStatus: Prospect['status'];
  onStatusChange: (status: Prospect['status']) => void;
  onCalendarClick?: () => void;
  onQualifyClick?: () => void;
  compact?: boolean;
}

const SKY_HUE: StageHue = { a: '#38BDF8', b: '#0369A1', glow: 'rgba(56,189,248,0.40)', line: '#38BDF8' };
const AMBER_HUE: StageHue = { a: '#FBBF24', b: '#B45309', glow: 'rgba(251,191,36,0.40)', line: '#FBBF24' };
const ORANGE_HUE: StageHue = { a: '#FB923C', b: '#C2410C', glow: 'rgba(251,146,60,0.35)', line: '#FB923C' };
const RED_HUE: StageHue = { a: '#F87171', b: '#B91C1C', glow: 'rgba(248,113,113,0.40)', line: '#F87171' };
const VIOLET_HUE: StageHue = { a: '#8B7CFF', b: '#5B4BD4', glow: 'rgba(124,92,255,0.50)', line: '#8B7CFF' };

const norm = (s?: string) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

const STATUS_META: { value: Prospect['status']; label: string; icon: any; hue: StageHue }[] = [
  { value: 'Nouveau', label: 'Nouveau', icon: null, hue: SKY_HUE },
  { value: 'Contacté', label: 'Contacté', icon: Phone, hue: AMBER_HUE },
  { value: 'Qualifié', label: 'Qualifié', icon: Award, hue: STAGE_HUES.emerald },
  { value: 'En attente', label: 'En attente', icon: Clock, hue: ORANGE_HUE },
  { value: 'Perdu', label: 'Perdu', icon: XCircle, hue: RED_HUE },
  { value: 'Converti', label: 'Converti', icon: TrendingUp, hue: VIOLET_HUE },
];

const STATUS_BADGE: Record<string, { text: string; bg: string; border: string }> = {
  Nouveau: { text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  Contacté: { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  Qualifié: { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  'En attente': { text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  Perdu: { text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
  Converti: { text: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200' },
};

export const StatusChangeDropdown = ({ currentStatus, onStatusChange, onCalendarClick, onQualifyClick, compact }: StatusChangeDropdownProps) => {
  const { staged, dark } = useStageChrome();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const meta = STATUS_META.find(s => norm(s.value) === norm(currentStatus)) || STATUS_META[0];
  const hue = meta.hue;
  const badge = STATUS_BADGE[meta.value] || STATUS_BADGE.Nouveau;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (status: Prospect['status']) => {
    if (status === 'Qualifié' && onQualifyClick) {
      onQualifyClick();
    } else if (status === 'En attente' && onCalendarClick) {
      onCalendarClick();
    } else {
      onStatusChange(status);
    }
    setIsOpen(false);
  };

  const pillStyle: CSSProperties | undefined = staged
    ? dark
      ? { background: `${hue.a}2E`, color: '#fff', border: `1px solid ${hue.a}5C`, boxShadow: `0 2px 12px ${hue.glow}, inset 0 1px 0 rgba(255,255,255,0.14)` }
      : { background: `${hue.a}1C`, color: hue.b, border: `1px solid ${hue.a}42`, boxShadow: `0 2px 10px ${hue.glow}, inset 0 1px 0 rgba(255,255,255,0.7)` }
    : undefined;

  const pillClass = (size: 'sm' | 'md') => staged
    ? `inline-flex items-center gap-1.5 rounded-full font-extrabold uppercase tracking-[0.08em] backdrop-blur-md transition-all hover:brightness-110 ${size === 'sm' ? 'px-2 py-1 text-[10px]' : 'px-2.5 py-1 text-[10px]'}`
    : `inline-flex items-center rounded-lg border font-medium transition-all hover:shadow-sm ${badge.bg} ${badge.text} ${badge.border} ${size === 'sm' ? 'gap-1.5 px-2 py-1 text-[10px]' : 'gap-2 px-3 py-1.5 text-xs'}`;

  const panelClass = staged
    ? dark
      ? 'absolute top-full left-0 z-50 mt-1.5 w-44 rounded-2xl border border-violet-500/20 bg-[#0F0A1E] py-1.5 shadow-[0_24px_60px_-20px_rgba(124,92,255,0.45),inset_0_1px_0_rgba(255,255,255,0.08)]'
      : 'absolute top-full left-0 z-50 mt-1.5 w-44 rounded-2xl border border-white/70 bg-white/95 py-1.5 shadow-[0_24px_60px_-28px_rgba(13,148,136,0.4),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl'
    : 'absolute top-full left-0 mt-1 w-40 bg-card rounded-lg border border-border/60 shadow-lg z-50 py-1 animate-fade-in';

  const itemClass = (active: boolean) => staged
    ? `w-full flex items-center gap-2 px-3 py-2 text-xs transition-all border-l-2 ${
        active
          ? dark ? 'border-violet-400 bg-violet-500/15 font-semibold text-white' : 'border-teal-500 bg-teal-500/10 font-semibold text-teal-900'
          : dark ? 'border-transparent text-slate-300 hover:bg-white/[0.06] hover:text-white' : 'border-transparent text-teal-900/70 hover:bg-teal-900/[0.04] hover:text-teal-900'
      }`
    : `w-full flex items-center gap-2 px-3 py-2 text-xs transition-all hover:bg-background ${
        active ? 'font-semibold bg-background/50' : ''
      }`;

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className={pillClass(compact ? 'sm' : 'md')}
        style={pillStyle}
      >
        {staged && (
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: hue.line }} />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: hue.line, boxShadow: `0 0 8px ${hue.glow}` }} />
          </span>
        )}
        {meta.label}
        <ChevronDown size={compact ? 10 : 12} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={panelClass}
          >
            {STATUS_META.map(opt => {
              const Icon = opt.icon;
              const active = norm(opt.value) === norm(currentStatus);
              return (
                <button
                  key={opt.value}
                  onClick={(e) => { e.stopPropagation(); handleSelect(opt.value); }}
                  className={itemClass(active)}
                >
                  {staged ? (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full" style={{ background: `${opt.hue.a}22`, color: dark ? opt.hue.a : opt.hue.b }}>
                      {Icon ? <Icon size={10} /> : <span className="h-1.5 w-1.5 rounded-full" style={{ background: opt.hue.line }} />}
                    </span>
                  ) : (
                    <span className={STATUS_BADGE[opt.value]?.text || ''}>
                      {Icon ? <Icon size={12} /> : <span className="block w-3 h-3 rounded-full bg-blue-500/20" />}
                    </span>
                  )}
                  <span className={staged ? '' : (STATUS_BADGE[opt.value]?.text || '')}>{opt.label}</span>
                  {active && <CheckCircle size={11} className="ml-auto opacity-70" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
