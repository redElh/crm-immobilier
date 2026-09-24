import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'react-feather';
import { COUNTRIES, Country } from '../../data/countries';
import { cn } from '../../lib/utils';
import { useStageChrome } from '../modules/calendar/useStageChrome';
import { portalWithTheme } from './dropdownTheme';

interface PhoneInputProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  required?: boolean;
}

export function flagEmoji(iso2: string) {
  return iso2.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

function extractDigits(s: string) {
  return (s || '').replace(/\D+/g, '');
}

function templateLength(format: string) {
  return (format.match(/#/g) || []).length;
}

function formatNational(national: string, format: string) {
  let di = 0;
  let out = '';
  for (const ch of format) {
    if (di >= national.length) break;
    if (ch === '#') {
      out += national[di];
      di++;
    } else {
      out += ch;
    }
  }
  if (di < national.length) out += national.slice(di);
  return out;
}

function parsePhone(full: string) {
  const digits = extractDigits(full);
  if (!digits) return { country: COUNTRIES[0], national: '' };
  const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  for (const c of sorted) {
    if (digits.startsWith(c.dial)) {
      let nat = digits.slice(c.dial.length);
      if (nat.startsWith('0')) nat = nat.slice(1);
      return { country: c, national: nat };
    }
  }
  let nat = digits;
  if (nat.startsWith('0') && nat.length > 1) nat = nat.slice(1);
  return { country: COUNTRIES[0], national: nat };
}

export const PhoneInput = ({
  label,
  value = '',
  onChange,
  placeholder,
  className,
  error,
  required,
}: PhoneInputProps) => {
  const { staged, dark } = useStageChrome();
  // Only use the stage glass styling when inside the agent stage shell.
  // Outside the stage (admin / gerant) the neutral card tokens (bg-card / bg-background)
  // already adapt to dark via CSS variables (html.dark + .admin-theme), so applying
  // the violet glass gradient would render as a translucent white on the peach
  // admin background and look "still white".
  const isDark = staged && dark;
  const [selected, setSelected] = useState<Country>(() => parsePhone(value).country);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { national } = useMemo(() => parsePhone(value), [value]);
  const displayValue = useMemo(() => formatNational(national, selected.format), [national, selected]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dial.includes(q) ||
        c.iso2.toLowerCase() === q
    );
  }, [search]);

  // Keep the selector in sync when the value changes externally (e.g. client selection)
  useEffect(() => {
    setSelected(parsePhone(value).country);
  }, [value]);

  useEffect(() => {
    if (!isOpen) return;
    requestAnimationFrame(() => searchInputRef.current?.focus());
    setSearch('');
  }, [isOpen]);

  const computePosition = useCallback(() => {
    const anchor = containerRef.current;
    if (!anchor) return {};
    const rect = anchor.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const dh = Math.min(filtered.length * 36 + 44, 256);
    const openUp = spaceBelow < dh && rect.top > dh;
    const width = Math.min(320, Math.max(rect.width, 264));
    return {
      position: 'fixed' as const,
      left: rect.left + 'px',
      width: width + 'px',
      ...(openUp
        ? { bottom: window.innerHeight - rect.top + 4 + 'px' }
        : { top: rect.bottom + 4 + 'px' }),
      zIndex: 9999,
    };
  }, [filtered.length]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) return;
      if (containerRef.current && containerRef.current.contains(e.target as Node)) return;
      if (buttonRef.current && buttonRef.current.contains(e.target as Node)) return;
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onScroll = () => setDropdownStyle(computePosition());
    const onResize = () => setDropdownStyle(computePosition());
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [isOpen, computePosition]);

  const handleToggle = () => {
    if (isOpen) {
      setIsOpen(false);
    } else {
      setDropdownStyle(computePosition());
      setIsOpen(true);
    }
  };

  const buildValue = (c: Country, digits: string) => {
    const capped = digits.slice(0, templateLength(c.format));
    const formatted = formatNational(capped, c.format);
    return capped ? `+${c.dial} ${formatted}` : '';
  };

  const handleSelectCountry = (c: Country) => {
    setIsOpen(false);
    setSelected(c);
    if (national) {
      onChange?.(buildValue(c, national));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = extractDigits(e.target.value);
    onChange?.(buildValue(selected, digits));
  };

  const hint = placeholder || selected.format.replace(/#/g, '0');

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className={cn('block mb-1.5', isDark ? 'text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400/85' : staged ? 'text-[11px] font-bold uppercase tracking-[0.14em] text-teal-900/55' : 'text-sm font-medium text-text')}>
          {label}
          {required && <span className="text-error ml-0.5">*</span>}
        </label>
      )}
      <div ref={containerRef} className={cn('flex rounded-xl', isDark && 'shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]', !isDark && staged && 'shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]')}>
        <button
          ref={buttonRef}
          type="button"
          onClick={handleToggle}
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 h-9 text-sm whitespace-nowrap select-none rounded-l-xl border border-r-0 outline-none transition-all duration-200',
            isDark
              ? 'border-white/15 bg-gradient-to-b from-white/[0.10] to-white/[0.05] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] hover:border-violet-400/30 hover:from-white/[0.12] hover:to-white/[0.06] focus:border-violet-400/60'
              : staged
                ? 'border-teal-900/15 bg-gradient-to-b from-white to-teal-50/70 text-teal-900 shadow-[inset_0_1px_0_rgba(255,255,255,1)] hover:border-teal-900/20 focus:border-teal-500/50'
                : 'bg-background text-text border-border hover:bg-background/80 focus:outline-none dark:bg-background dark:text-text dark:border-border',
            error ? '!border-rose-400/60' : '',
            staged ? '' : error ? 'border-error' : 'border-border'
          )}
        >
          <span className="text-base leading-none">{flagEmoji(selected.iso2)}</span>
          <span className={cn('text-xs font-medium', isDark ? 'text-slate-100' : staged ? 'text-teal-800' : 'text-text-secondary')}>+{selected.dial}</span>
          <ChevronDown size={13} className={cn('transition-transform', isDark ? 'text-violet-300' : staged ? 'text-teal-700' : 'text-text-secondary', isOpen && 'rotate-180')} />
        </button>
        <input
          type="tel"
          inputMode="tel"
          value={displayValue}
          onChange={handleInputChange}
          placeholder={hint}
          className={cn(
            'w-full h-9 px-3 py-2 text-sm rounded-r-xl border outline-none transition-all duration-200 border-l-0',
            isDark
              ? 'border-white/15 bg-gradient-to-b from-white/[0.10] to-white/[0.04] [background-color:transparent] text-white placeholder:text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] focus:border-violet-400/60 focus:shadow-[0_0_0_3px_rgba(124,92,255,0.28)]'
              : staged
                ? 'border-teal-900/15 bg-gradient-to-b from-white to-teal-50/60 text-teal-950 placeholder:text-teal-900/40 shadow-[inset_0_1px_0_rgba(255,255,255,1)] focus:border-teal-500/50 focus:shadow-[0_0_0_3px_rgba(20,184,166,0.22)]'
                : 'bg-card text-text placeholder:text-text-secondary/40 focus:ring-2 focus:ring-accent/15 focus:border-accent hover:border-text-secondary/30 border-border dark:bg-card dark:text-text dark:placeholder:text-text-secondary/40 dark:border-border dark:focus:ring-accent/20',
            error ? (staged ? '!border-rose-400/60' : 'border-error') : '',
            className
          )}
        />
      </div>
      {error && (
        <p className={cn('text-xs mt-1', staged ? 'text-rose-300' : 'text-error')}>{error}</p>
      )}

      {portalWithTheme(
        containerRef.current,
        isOpen && (
          <div
            ref={dropdownRef}
            style={dropdownStyle}
            className={cn(
              'rounded-2xl border overflow-hidden backdrop-blur-xl scrollbar-thin',
              isDark
                ? 'border-violet-500/20 bg-[#0F0A1E] shadow-[0_24px_60px_-20px_rgba(124,92,255,0.35),inset_0_1px_0_rgba(255,255,255,0.08)]'
                : staged
                  ? 'border-white/70 bg-white/92 shadow-[0_24px_60px_-28px_rgba(13,148,136,0.35),inset_0_1px_0_rgba(255,255,255,0.9)]'
                  : 'bg-card border-border/50 shadow-dropdown dark:bg-card dark:border-border/50'
            )}
          >
          <div className={cn('p-2 border-b', isDark ? 'border-white/10' : staged ? 'border-teal-900/10' : 'border-border/30')}>
            <input
              ref={searchInputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un pays..."
              className={cn(
                'w-full h-8 px-3 text-sm rounded-xl border outline-none transition-all',
                isDark
                  ? 'border-white/10 bg-white/[0.06] text-slate-100 placeholder:text-slate-500 focus:border-violet-400/40'
                  : staged
                    ? 'border-teal-900/12 bg-white text-teal-900 placeholder:text-teal-900/35 focus:border-teal-500/30'
                    : 'border-border bg-card text-text placeholder:text-text-secondary/50 focus:ring-2 focus:ring-accent/15 focus:border-accent dark:border-border dark:bg-card dark:text-text dark:placeholder:text-text-secondary/50'
              )}
            />
          </div>
          <div className="max-h-52 overflow-y-auto py-1 scrollbar-thin">
            {filtered.length === 0 && (
              <div className={cn('px-4 py-4 text-center text-xs', isDark ? 'text-slate-500' : staged ? 'text-teal-900/45' : 'text-text-secondary/60')}>Aucun pays trouvé</div>
            )}
            {filtered.map((c) => (
              <button
                key={c.iso2}
                type="button"
                onClick={() => handleSelectCountry(c)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors mx-1 rounded-xl',
                  isDark
                    ? selected.iso2 === c.iso2 && c.dial === selected.dial
                      ? 'bg-gradient-to-r from-violet-500/25 to-indigo-600/25 text-white border border-violet-400/30 font-medium'
                      : 'text-slate-200 border border-transparent hover:bg-white/[0.06] hover:text-white'
                    : staged
                      ? selected.iso2 === c.iso2 && c.dial === selected.dial
                        ? 'bg-teal-500/14 text-teal-900 border border-teal-500/25 font-medium'
                        : 'text-teal-900/70 border border-transparent hover:bg-teal-900/[0.04] hover:text-teal-900'
                      : selected.iso2 === c.iso2 && c.dial === selected.dial
                        ? 'bg-accent-light text-accent font-medium'
                        : 'text-text-secondary hover:text-text hover:bg-background'
                )}
              >
                <span className="text-base leading-none">{flagEmoji(c.iso2)}</span>
                <span className="flex-1 truncate">{c.name}</span>
                <span className={cn('text-xs', isDark ? 'text-slate-400' : staged ? 'text-teal-700/60' : 'text-text-secondary/70')}>+{c.dial}</span>
              </button>
            ))}
          </div>
          </div>
        )
      )}
    </div>
  );
};
