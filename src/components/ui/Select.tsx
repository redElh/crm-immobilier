import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'react-feather'
import { cn } from '../../lib/utils'

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

  return (
    <div ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-text mb-1.5">
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
            'w-full h-9 flex items-center justify-between px-3 text-sm rounded-lg border bg-card text-text cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent',
            'hover:border-text-secondary/30',
            'transition-all duration-200 ease-out',
            error ? 'border-error' : 'border-border',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
          {...props}
        >
          <span className={cn('truncate flex items-center gap-2', !selectedOption && 'text-text-secondary/60')}>
            {selectedOption?.icon && <selectedOption.icon size={14} className="text-text-secondary shrink-0" />}
            {selectedOption ? selectedOption.label : placeholder || 'Sélectionner...'}
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <ChevronDown size={14} className="text-text-secondary shrink-0" />
          </motion.div>
        </button>
      </div>

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
            className="bg-card rounded-lg border border-border/50 shadow-dropdown py-1 max-h-48 overflow-y-auto"
          >
            {options.map((option, idx) => (
              <motion.button
                key={option.value}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.12, delay: idx * 0.025 }}
                type="button"
                className={cn(
                  'w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2',
                  currentValue === option.value
                    ? 'bg-accent-light text-accent font-medium'
                    : 'text-text-secondary hover:text-text hover:bg-background'
                )}
                onClick={() => handleSelect(option.value)}
              >
                {currentValue === option.value && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-1.5 h-1.5 rounded-full bg-accent shrink-0"
                  />
                )}
                <span className={cn('flex items-center gap-2', !(currentValue === option.value) && 'ml-[18px]')}>
                  {option.icon && <option.icon size={14} className="text-text-secondary shrink-0" />}
                  {option.label}
                </span>
              </motion.button>
            ))}
            {options.length === 0 && (
              <div className="px-3 py-4 text-center text-xs text-text-secondary/60">
                Aucune option disponible
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

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
