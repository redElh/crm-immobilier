import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Phone, CheckCircle, Clock, Award, XCircle, TrendingUp } from 'react-feather';
import { Prospect } from '../../../types/prospect';

interface StatusChangeDropdownProps {
  currentStatus: Prospect['status'];
  onStatusChange: (status: Prospect['status']) => void;
  onCalendarClick?: () => void;
  onQualifyClick?: () => void;
  compact?: boolean;
}

const STATUS_OPTIONS: { value: Prospect['status']; label: string; icon: any; color: string; bgColor: string }[] = [
  { value: 'Nouveau', label: 'Nouveau', icon: null, color: 'text-blue-700', bgColor: 'bg-blue-50' },
  { value: 'Contacté', label: 'Contacté', icon: Phone, color: 'text-amber-700', bgColor: 'bg-amber-50' },
  { value: 'Qualifié', label: 'Qualifié', icon: Award, color: 'text-emerald-700', bgColor: 'bg-emerald-50' },
  { value: 'En attente', label: 'En attente', icon: Clock, color: 'text-orange-700', bgColor: 'bg-orange-50' },
  { value: 'Perdu', label: 'Perdu', icon: XCircle, color: 'text-red-700', bgColor: 'bg-red-50' },
  { value: 'Converti', label: 'Converti', icon: TrendingUp, color: 'text-violet-700', bgColor: 'bg-violet-50' },
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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const badge = STATUS_BADGE[currentStatus] || STATUS_BADGE.Nouveau;

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

  if (compact) {
    return (
      <div ref={dropdownRef} className="relative">
        <button
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          className={`inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium rounded-lg border transition-all hover:shadow-sm ${badge.bg} ${badge.text} ${badge.border}`}
        >
          {currentStatus}
          <ChevronDown size={10} />
        </button>
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-40 bg-card rounded-lg border border-border/60 shadow-lg z-50 py-1 animate-fade-in">
            {STATUS_OPTIONS.map(opt => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={(e) => { e.stopPropagation(); handleSelect(opt.value); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-all hover:bg-background ${
                    opt.value === currentStatus ? 'font-semibold bg-background/50' : ''
                  } ${opt.color}`}
                >
                  {Icon && <Icon size={12} />}
                  {!Icon && <span className="w-3 h-3 rounded-full bg-blue-500/20" />}
                  {opt.label}
                  {opt.value === currentStatus && <CheckCircle size={11} className="ml-auto" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all hover:shadow-sm cursor-pointer ${badge.bg} ${badge.text} ${badge.border}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${badge.text.replace('text-', 'bg-')}`} />
        {currentStatus}
        <ChevronDown size={12} />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-card rounded-lg border border-border/60 shadow-lg z-50 py-1 animate-fade-in">
          <p className="px-3 py-1.5 text-[10px] text-text-secondary/50 font-medium uppercase tracking-wider">Changer le statut</p>
          {STATUS_OPTIONS.map(opt => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                onClick={(e) => { e.stopPropagation(); handleSelect(opt.value); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-all hover:bg-background ${
                  opt.value === currentStatus ? 'font-semibold bg-background/50' : ''
                } ${opt.color}`}
              >
                {Icon ? <Icon size={13} /> : <span className="w-3 h-3 rounded-full bg-blue-500/20" />}
                {opt.label}
                {opt.value === currentStatus && <CheckCircle size={11} className="ml-auto opacity-60" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
