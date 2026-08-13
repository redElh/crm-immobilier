import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'react-feather';
import { COUNTRIES, Country } from '../../data/countries';
import { cn } from '../../lib/utils';

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
    if (!buttonRef.current) return {};
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const dh = Math.min(filtered.length * 36 + 44, 256);
    const openUp = spaceBelow < dh && rect.top > dh;
    return {
      position: 'fixed' as const,
      left: rect.left + 'px',
      width: '264px',
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
        <label className="text-sm font-medium text-text">
          {label}
          {required && <span className="text-error ml-0.5">*</span>}
        </label>
      )}
      <div ref={containerRef} className="flex">
        <button
          ref={buttonRef}
          type="button"
          onClick={handleToggle}
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 h-9 text-sm rounded-l-lg border border-r-0 bg-background border-border whitespace-nowrap select-none',
            'hover:bg-background/80 focus:outline-none',
            error ? 'border-error' : 'border-border'
          )}
        >
          <span className="text-base leading-none">{flagEmoji(selected.iso2)}</span>
          <span className="text-text-secondary text-xs">+{selected.dial}</span>
          <ChevronDown size={13} className={cn('text-text-secondary transition-transform', isOpen && 'rotate-180')} />
        </button>
        <input
          type="tel"
          inputMode="tel"
          value={displayValue}
          onChange={handleInputChange}
          placeholder={hint}
          className={cn(
            'w-full h-9 px-3 py-2 text-sm rounded-r-lg border bg-card',
            'placeholder:text-text-secondary/40',
            'focus:outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all duration-200 ease-out',
            'hover:border-text-secondary/30',
            error ? 'border-error focus:ring-error/15 focus:border-error' : 'border-border',
            className
          )}
        />
      </div>
      {error && (
        <p className="text-xs text-error mt-1">{error}</p>
      )}

      {isOpen && (
        <div
          ref={dropdownRef}
          style={dropdownStyle}
          className="bg-card rounded-lg border border-border/50 shadow-dropdown overflow-hidden"
        >
          <div className="p-2 border-b border-border/30">
            <input
              ref={searchInputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un pays..."
              className="w-full h-8 px-3 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent"
            />
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <div className="px-4 py-4 text-center text-xs text-text-secondary/60">Aucun pays trouvé</div>
            )}
            {filtered.map((c) => (
              <button
                key={c.iso2}
                type="button"
                onClick={() => handleSelectCountry(c)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors',
                  selected.iso2 === c.iso2 && c.dial === selected.dial
                    ? 'bg-accent-light text-accent font-medium'
                    : 'text-text-secondary hover:text-text hover:bg-background'
                )}
              >
                <span className="text-base leading-none">{flagEmoji(c.iso2)}</span>
                <span className="flex-1 truncate">{c.name}</span>
                <span className="text-xs text-text-secondary/70">+{c.dial}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
