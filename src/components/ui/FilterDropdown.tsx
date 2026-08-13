import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from 'react-feather';
import { cn } from "../../lib/utils";

interface FilterDropdownProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

export const FilterDropdown = ({ options, value, onChange, label = "Filter", className = "" }: FilterDropdownProps) => {
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

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      {label && <label className="block text-sm font-medium text-text mb-1.5">{label}</label>}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className="w-full h-9 flex items-center justify-between px-3 text-sm rounded-lg border border-border bg-card text-text hover:bg-background hover:border-text-secondary/30 transition-all duration-200"
      >
        <span className="truncate">{selectedOption?.label}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <ChevronDown size={14} className="text-text-secondary shrink-0" />
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
            className="bg-card rounded-lg border border-border/50 shadow-dropdown py-1 overflow-y-auto max-h-60"
          >
            {options.map((option, idx) => (
              <motion.button
                key={option.value}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.12, delay: idx * 0.025 }}
                type="button"
                className={cn(
                  "w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2",
                  value === option.value
                    ? "bg-accent-light text-accent font-medium"
                    : "text-text-secondary hover:text-text hover:bg-background"
                )}
                onClick={() => { onChange(option.value); setIsOpen(false); }}
              >
                {value === option.value && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-1.5 h-1.5 rounded-full bg-accent shrink-0"
                  />
                )}
                <span className={cn(!(value === option.value) && "ml-[18px]")}>
                  {option.label}
                </span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
