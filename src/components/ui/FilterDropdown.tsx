import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from 'react-feather';
import { cn } from "../../lib/utils";
import { useStageChrome } from '../modules/calendar/useStageChrome';

interface FilterDropdownProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

export const FilterDropdown = ({ options, value, onChange, label = "Filter", className = "" }: FilterDropdownProps) => {
  const { staged, dark } = useStageChrome();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  const computePosition = useCallback(() => {
    if (!buttonRef.current) return {};
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const dh = Math.min(options.length * 36 + 8, 240);
    const openUp = spaceBelow < dh && rect.top > dh;
    return {
      position: 'fixed' as const,
      left: rect.left + 'px',
      minWidth: Math.max(rect.width, 220) + 'px',
      ...(openUp
        ? { bottom: window.innerHeight - rect.top + 4 + 'px' }
        : { top: rect.bottom + 4 + 'px' }),
      zIndex: 9999,
    };
  }, [options.length]);

  const handleToggle = () => {
    if (isOpen) {
      setIsOpen(false)
    } else {
      setDropdownStyle(computePosition())
      setIsOpen(true)
    }
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) return
      if (containerRef.current && containerRef.current.contains(e.target as Node)) return
      if (buttonRef.current && buttonRef.current.contains(e.target as Node)) return
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return
    const onScroll = () => setDropdownStyle(computePosition())
    const onResize = () => setDropdownStyle(computePosition())
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
  }, [isOpen, computePosition])

  const stagedButtonClass = staged
    ? dark
      ? 'w-full h-10 flex items-center justify-between gap-2 px-3 text-sm rounded-xl border border-white/10 text-slate-100 outline-none transition-all duration-200 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_6px_18px_-10px_rgba(3,5,14,0.9)] hover:border-white/20 focus:border-violet-400/70 focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_0_0_3px_rgba(124,92,255,0.25)]'
      : 'w-full h-10 flex items-center justify-between gap-2 px-3 text-sm rounded-xl border border-teal-900/15 text-teal-950 outline-none transition-all duration-200 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_6px_18px_-10px_rgba(13,148,136,0.45)] hover:border-teal-900/25 focus:border-teal-500/70 focus:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_0_0_3px_rgba(20,184,166,0.22)]'
    : null

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      {label && (
        <label className={cn('block mb-1.5', staged ? (dark ? 'text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400/85' : 'text-[11px] font-bold uppercase tracking-[0.14em] text-teal-900/55') : 'text-sm font-medium text-text')}>
          {label}
        </label>
      )}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={cn(
          stagedButtonClass
            ? stagedButtonClass
            : "w-full h-9 flex items-center justify-between px-3 text-sm rounded-lg border border-border bg-card text-text hover:bg-background hover:border-text-secondary/30 transition-all duration-200"
        )}
      >
        <span className="truncate">{selectedOption?.label}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <ChevronDown size={14} className={cn("shrink-0", staged ? (dark ? 'text-slate-400' : 'text-teal-900/50') : 'text-text-secondary')} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            key="filter-dropdown"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={dropdownStyle}
            className={cn(
              "py-1 max-h-60 overflow-y-auto rounded-2xl border",
              staged
                ? dark
                  ? "border-violet-500/20 bg-[#0F0A1E] shadow-[0_24px_60px_-20px_rgba(124,92,255,0.35),inset_0_1px_0_rgba(255,255,255,0.08)]"
                  : "border-white/70 bg-white/92 backdrop-blur-xl shadow-[0_24px_60px_-28px_rgba(13,148,136,0.35),inset_0_1px_0_rgba(255,255,255,0.9)]"
                : "bg-card rounded-lg border-border/50 shadow-dropdown"
            )}
          >
            {options.map((option, idx) => {
              const active = value === option.value;
              return (
                <motion.button
                  key={option.value}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.12, delay: idx * 0.025 }}
                  type="button"
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm transition-all flex items-center gap-2 mx-1 rounded-xl",
                    staged
                      ? active
                        ? dark
                          ? 'bg-gradient-to-r from-violet-500/25 to-indigo-600/25 text-white border border-violet-400/30 shadow-[0_0_16px_-4px_rgba(124,92,255,0.7),inset_0_1px_0_rgba(255,255,255,0.12)] font-medium'
                          : 'bg-teal-500/14 text-teal-900 border border-teal-500/25 font-medium shadow-[0_0_12px_-4px_rgba(20,184,166,0.5)]'
                        : dark
                          ? 'text-slate-200 border border-transparent hover:bg-white/[0.06] hover:text-white hover:border-white/10'
                          : 'text-teal-900/70 border border-transparent hover:bg-teal-900/[0.04] hover:text-teal-900'
                      : active
                        ? "bg-accent-light text-accent font-medium mx-0 rounded-none"
                        : "text-text-secondary hover:text-text hover:bg-background mx-0 rounded-none"
                  )}
                  onClick={() => { onChange(option.value); setIsOpen(false); }}
                >
                  {active && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={cn('w-1.5 h-1.5 rounded-full shrink-0', staged ? (dark ? 'bg-violet-400 shadow-[0_0_8px_rgba(139,124,255,0.8)]' : 'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.7)]') : 'bg-accent')}
                    />
                  )}
                  <span className={cn(staged ? '' : !active && "ml-[18px]")}>
                    {option.label}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
