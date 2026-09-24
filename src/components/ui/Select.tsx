import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'react-feather'
import { cn } from '../../lib/utils'
import { portalWithTheme } from './dropdownTheme'
import { useStageChrome } from '../modules/calendar/useStageChrome'

interface SelectOption {
  value: string
  label: string
  icon?: React.ComponentType<{ size?: number; className?: string }>
}

interface SelectProps {
  label?: string
  options: SelectOption[]
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  onChange?: (value: string) => void
  error?: string
  className?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
}

export const Select = ({
  label,
  options,
  onValueChange,
  onChange,
  error,
  className = '',
  placeholder,
  disabled,
  required,
  value: controlledValue,
  defaultValue,
  ...props
}: SelectProps & { [key: string]: any }) => {
  const { staged, dark } = useStageChrome()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedValue, setSelectedValue] = useState(defaultValue || controlledValue || '')
  const buttonRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const isControlled = controlledValue !== undefined
  const currentValue = isControlled ? controlledValue : selectedValue
  const selectedOption = options.find((opt) => opt.value === currentValue)

  const computePosition = useCallback(() => {
    if (!buttonRef.current) return {}
    const rect = buttonRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom - 8
    const dh = Math.min(options.length * 36 + 8, 192)
    const openUp = spaceBelow < dh && rect.top > dh
    return {
      position: 'fixed' as const,
      left: rect.left + 'px',
      width: rect.width + 'px',
      ...(openUp
        ? { bottom: window.innerHeight - rect.top + 4 + 'px' }
        : { top: rect.bottom + 4 + 'px' }),
      zIndex: 9999,
    }
  }, [options.length])

  const handleToggle = () => {
    if (disabled) return
    if (isOpen) {
      setIsOpen(false)
    } else {
      setDropdownStyle(computePosition())
      setIsOpen(true)
    }
  }

  const handleSelect = (val: string) => {
    if (!isControlled) setSelectedValue(val)
    onValueChange?.(val)
    onChange?.(val)
    setIsOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) return
      if (containerRef.current && containerRef.current.contains(e.target as Node)) return
      if (buttonRef.current && buttonRef.current.contains(e.target as Node)) return
      setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
      ? 'w-full h-9 flex items-center justify-between px-3 text-sm rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] [background-color:transparent] text-slate-100 outline-none transition-all duration-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-8px_16px_-12px_rgba(0,0,0,0.7),0_6px_18px_-8px_rgba(3,5,14,0.9)] hover:border-white/15 focus:border-violet-400/70 focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-8px_16px_-12px_rgba(0,0,0,0.6),0_0_0_3px_rgba(124,92,255,0.28),0_10px_30px_-8px_rgba(124,92,255,0.55)]'
      : 'w-full h-9 flex items-center justify-between px-3 text-sm rounded-xl border border-teal-900/15 bg-gradient-to-b from-white to-teal-50/70 [background-color:transparent] text-teal-950 outline-none transition-all duration-200 shadow-[inset_0_1px_0_rgba(255,255,255,1),inset_0_-6px_14px_-10px_rgba(13,148,136,0.35),0_6px_18px_-10px_rgba(13,148,136,0.45)] hover:border-teal-900/20 focus:border-teal-500/70 focus:shadow-[inset_0_1px_0_rgba(255,255,255,1),inset_0_-6px_14px_-10px_rgba(13,148,136,0.4),0_0_0_3px_rgba(20,184,166,0.25),0_10px_28px_-10px_rgba(13,148,136,0.6)]'
    : null
  return (
    <div ref={containerRef}>
      {label && (
        <label className={cn('block mb-1.5', staged ? (dark ? 'text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400/85' : 'text-[11px] font-bold uppercase tracking-[0.14em] text-teal-900/55') : 'text-sm font-medium text-text')}>
          {label}
          {required && <span className="text-error ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          disabled={disabled}
          onClick={handleToggle}
          className={cn(
            stagedButtonClass
              ? stagedButtonClass
              : cn(
                  'w-full h-9 flex items-center justify-between px-3 text-sm rounded-lg cursor-pointer',
                  'transition-all duration-200 ease-out',
                  'bg-card text-text border border-border',
                  'focus:outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent',
                  'hover:border-text-secondary/30'
                ),
            className && !stagedButtonClass ? className : '',
            stagedButtonClass && className ? className : '',
            error && (staged ? '!border-rose-400/60' : 'border-error'),
            disabled && 'opacity-50 cursor-not-allowed',
          )}
          {...props}
        >
          <span className={cn('truncate flex items-center gap-2', !selectedOption && (staged && dark ? 'text-slate-500' : 'text-text-secondary/60'))}>
            {selectedOption?.icon && <selectedOption.icon size={14} className={cn('shrink-0', staged && dark ? 'text-slate-500' : 'text-text-secondary')} />}
            {selectedOption ? selectedOption.label : placeholder || 'Sélectionner...'}
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <ChevronDown size={14} className={cn('shrink-0', staged && dark ? 'text-slate-500' : 'text-text-secondary')} />
          </motion.div>
        </button>
      </div>

      {portalWithTheme(
        buttonRef.current,
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={dropdownRef}
              key="select-dropdown"
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              style={dropdownStyle}
              className={cn(
                'py-1 max-h-64 overflow-y-auto scrollbar-thin rounded-2xl border',
                staged
                  ? dark
                    ? 'border-violet-500/20 bg-[#0F0A1E] shadow-[0_24px_60px_-20px_rgba(124,92,255,0.35),inset_0_1px_0_rgba(255,255,255,0.08)]'
                    : 'border-white/70 bg-white/92 backdrop-blur-xl shadow-[0_24px_60px_-28px_rgba(13,148,136,0.35),inset_0_1px_0_rgba(255,255,255,0.9)]'
                  : 'bg-card rounded-lg border-border/50 shadow-dropdown'
              )}
            >
            {options.map((option, idx) => {
              const active = currentValue === option.value
              return (
              <motion.button
                key={option.value}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.12, delay: idx * 0.025 }}
                type="button"
                className={cn(
                  'w-full text-left px-3 py-2 text-sm transition-all flex items-center gap-2 mx-1 rounded-xl',
                  staged
                    ? active
                      ? dark
                        ? 'bg-gradient-to-r from-violet-500/25 to-indigo-600/25 text-white border border-violet-400/30 shadow-[0_0_16px_-4px_rgba(124,92,255,0.7),inset_0_1px_0_rgba(255,255,255,0.12)] font-medium'
                        : 'bg-teal-500/14 text-teal-900 border border-teal-500/25 font-medium shadow-[0_0_12px_-4px_rgba(20,184,166,0.5)]'
                      : dark
                        ? 'text-slate-200 border border-transparent hover:bg-white/[0.06] hover:text-white hover:border-white/10'
                        : 'text-teal-900/70 border border-transparent hover:bg-teal-900/[0.04] hover:text-teal-900'
                    : active
                      ? 'bg-accent-light text-accent font-medium mx-0 rounded-none'
                      : 'text-text-secondary hover:text-text hover:bg-background mx-0 rounded-none'
                )}
                onClick={() => handleSelect(option.value)}
              >
                {active && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={cn('w-1.5 h-1.5 rounded-full shrink-0', staged ? (dark ? 'bg-violet-400 shadow-[0_0_8px_rgba(139,124,255,0.8)]' : 'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.7)]') : 'bg-accent')}
                  />
                )}
                <span className={cn('flex items-center gap-2', !active && staged && 'ml-[14px]', !active && !staged && 'ml-[18px]')}>
                  {option.icon && <option.icon size={14} className={cn('shrink-0', staged ? (dark ? 'text-slate-400' : 'text-teal-700/60') : 'text-text-secondary')} />}
                  {option.label}
                </span>
              </motion.button>
            )})}
            {options.length === 0 && (
              <div className={cn('px-3 py-4 text-center text-xs', staged ? (dark ? 'text-slate-500' : 'text-teal-900/45') : 'text-text-secondary/60')}>
                Aucune option disponible
              </div>
            )}
            </motion.div>
          )}
        </AnimatePresence>,
      )}

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-error flex items-center gap-1 mt-1.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          {error}
        </motion.p>
      )}
    </div>
  )
}
