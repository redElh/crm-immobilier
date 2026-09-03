import React, { useRef, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock } from 'react-feather'
import { cn } from '../../lib/utils'
import { portalWithTheme } from './dropdownTheme'
import { useStageChrome } from '../modules/calendar/useStageChrome'

interface TimePickerProps {
  label?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
  error?: string
  className?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  name?: string
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

function parseTime(val: string) {
  if (!val) return { hour: '', minute: '' }
  const [h, m] = val.split(':')
  return { hour: h || '', minute: m || '' }
}

export const TimePicker = React.forwardRef<HTMLInputElement, TimePickerProps>(
  ({ label, value, onChange, onBlur, error, className, placeholder, required, disabled, name }, ref) => {
    const { staged, dark } = useStageChrome()
    const [isOpen, setIsOpen] = useState(false)
    const [selectedTime, setSelectedTime] = useState(value || '')
    const containerRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLDivElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const hourListRef = useRef<HTMLDivElement>(null)
    const minuteListRef = useRef<HTMLDivElement>(null)
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
    const isControlled = value !== undefined
    const currentValue = isControlled ? value! : selectedTime
    const { hour, minute } = parseTime(currentValue)

    const [tempHour, setTempHour] = useState(hour)
    const [tempMinute, setTempMinute] = useState(minute)

    useEffect(() => {
      setTempHour(hour)
      setTempMinute(minute)
    }, [hour, minute])

    const computePosition = useCallback(() => {
      if (!buttonRef.current) return {}
      const rect = buttonRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom - 8
      const dh = 220
      const openUp = spaceBelow < dh && rect.top > dh
      return {
        position: 'fixed' as const,
        left: rect.left + 'px',
        width: Math.max(rect.width, 200) + 'px',
        ...(openUp
          ? { bottom: window.innerHeight - rect.top + 4 + 'px' }
          : { top: rect.bottom + 4 + 'px' }),
        zIndex: 9999,
      }
    }, [])

    useEffect(() => {
      if (!isOpen) return
      const idxH = HOURS.indexOf(tempHour)
      const idxM = MINUTES.indexOf(tempMinute)
      if (idxH >= 0 && hourListRef.current) {
        ;(hourListRef.current.children[idxH] as HTMLElement)?.scrollIntoView({ block: 'center', behavior: 'auto' })
      }
      if (idxM >= 0 && minuteListRef.current) {
        ;(minuteListRef.current.children[idxM] as HTMLElement)?.scrollIntoView({ block: 'center', behavior: 'auto' })
      }
    }, [isOpen])

    const commitTime = (h: string, m: string) => {
      const val = `${h}:${m}`
      if (!isControlled) setSelectedTime(val)
      if (onChange) {
        onChange({ target: { value: val } } as React.ChangeEvent<HTMLInputElement>)
      }
      setIsOpen(false)
    }

    const handleToggle = () => {
      if (disabled) return
      if (isOpen) {
        setIsOpen(false)
      } else {
        const { hour: h, minute: m } = parseTime(currentValue)
        setTempHour(h)
        setTempMinute(m)
        setDropdownStyle(computePosition())
        setIsOpen(true)
      }
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

    const displayValue = currentValue || placeholder || 'Sélectionner une heure'

    const stagedClass = staged
      ? dark
        ? 'w-full h-9 flex items-center gap-2 px-3 text-sm rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] [background-color:transparent] text-slate-100 outline-none transition-all duration-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-8px_16px_-12px_rgba(0,0,0,0.7),0_6px_18px_-8px_rgba(3,5,14,0.9)] hover:border-white/15 focus:border-violet-400/70'
        : 'w-full h-9 flex items-center gap-2 px-3 text-sm rounded-xl border border-teal-900/15 bg-gradient-to-b from-white to-teal-50/70 [background-color:transparent] text-teal-950 outline-none transition-all duration-200 shadow-[inset_0_1px_0_rgba(255,255,255,1),inset_0_-6px_14px_-10px_rgba(13,148,136,0.35),0_6px_18px_-10px_rgba(13,148,136,0.45)] hover:border-teal-900/20 focus:border-teal-500/70'
      : null
    return (
      <div ref={containerRef}>
        {label && (
          <label className={cn('block mb-1.5', staged ? (dark ? 'text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400/85' : 'text-[11px] font-bold uppercase tracking-[0.14em] text-teal-900/55') : 'text-sm font-medium text-text mb-1.5')}>
            {label}
            {required && <span className="text-error ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          <div
            ref={buttonRef}
            role="button"
            tabIndex={0}
            onClick={handleToggle}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleToggle() }}
            className={cn(
              stagedClass ? stagedClass : cn(
                'w-full h-9 flex items-center gap-2 px-3 text-sm rounded-lg cursor-pointer',
                'transition-all duration-200 ease-out',
                'border bg-card text-text',
                'focus:outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent',
                'hover:border-text-secondary/30'
              ),
              className,
              error && (staged ? '!border-rose-400/60' : 'border-error ring-2 ring-error/15'),
              disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
            )}
          >
            <Clock size={15} className={cn('shrink-0', staged && dark ? 'text-slate-500' : 'text-text-secondary')} />
            <span className={cn('flex-1 truncate', !currentValue && (staged && dark ? 'text-slate-500' : 'text-text-secondary/60'))}>
              {displayValue}
            </span>
          </div>
        </div>

        {portalWithTheme(
          buttonRef.current,
          <AnimatePresence>
            {isOpen && (
              <motion.div
                ref={dropdownRef}
                key="timepicker-dropdown"
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                style={dropdownStyle}
                className="bg-card rounded-lg border border-border/50 shadow-dropdown p-3"
              >
                <div className="flex items-stretch gap-1">
                  <div className="flex-1">
                    <div className="text-[10px] font-medium text-text-secondary/50 text-center mb-1.5 uppercase tracking-wider">
                      Heures
                    </div>
                    <div
                      ref={hourListRef}
                      className="overflow-y-auto max-h-[168px] scrollbar-thin space-y-0.5 scroll-smooth"
                    >
                      {HOURS.map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => {
                            setTempHour(h)
                            commitTime(h, tempMinute || '00')
                          }}
                          className={cn(
                            'w-full text-center py-1.5 text-sm rounded-md transition-all duration-150',
                            tempHour === h
                              ? 'bg-accent text-white font-semibold shadow-sm'
                              : 'text-text-secondary hover:text-text hover:bg-background'
                          )}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-center w-6 shrink-0">
                    <span className="text-lg font-semibold text-text-secondary/40 mt-6">:</span>
                  </div>

                  <div className="flex-1">
                    <div className="text-[10px] font-medium text-text-secondary/50 text-center mb-1.5 uppercase tracking-wider">
                      Minutes
                    </div>
                    <div
                      ref={minuteListRef}
                      className="overflow-y-auto max-h-[168px] scrollbar-thin space-y-0.5 scroll-smooth"
                    >
                      {MINUTES.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            setTempMinute(m)
                            commitTime(tempHour || '00', m)
                          }}
                          className={cn(
                            'w-full text-center py-1.5 text-sm rounded-md transition-all duration-150',
                            tempMinute === m
                              ? 'bg-accent text-white font-semibold shadow-sm'
                              : 'text-text-secondary hover:text-text hover:bg-background'
                          )}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
        )}

        <input
          ref={ref}
          type="hidden"
          name={name}
          value={currentValue}
          required={required}
        />

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
)

TimePicker.displayName = 'TimePicker'
