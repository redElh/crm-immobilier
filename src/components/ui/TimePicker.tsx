import React, { useRef, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock } from 'react-feather'
import { cn } from '../../lib/utils'
import { portalWithTheme } from './dropdownTheme'
import { useStageChrome } from '../modules/calendar/useStageChrome'
import { useStageScope } from '../dashboard/Stage'

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
    const isAdmin = useStageScope() === 'admin'
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

    const justOpenedRef = useRef(false)

    const openPanel = () => {
      const { hour: h, minute: m } = parseTime(currentValue)
      setTempHour(h)
      setTempMinute(m)
      setDropdownStyle(computePosition())
      setIsOpen(true)
      justOpenedRef.current = true
      window.setTimeout(() => { justOpenedRef.current = false }, 400)
    }

    /* Opening on pointerdown instead of click makes the trigger immune to
       swallowed clicks (node swaps / focus scroll between down and up). */
    const handlePointerDown = () => {
      if (disabled || isOpen) return
      openPanel()
    }

    const handleToggle = () => {
      if (disabled) return
      if (isOpen) {
        setIsOpen(false)
      } else {
        openPanel()
      }
    }

    const handleClick = () => {
      if (justOpenedRef.current) {
        justOpenedRef.current = false
        return
      }
      handleToggle()
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

    /* Re-measure while a host modal's entry spring is still moving the panel:
       keeps the picker glued to its trigger instead of trusting a single
       first measure taken mid-animation. */
    useEffect(() => {
      if (!isOpen) return
      let raf = 0
      const start = performance.now()
      const track = () => {
        setDropdownStyle((prev) => {
          const next = computePosition()
          const same =
            Object.keys(next).length === Object.keys(prev).length &&
            Object.entries(next).every(([k, v]) => (prev as Record<string, unknown>)[k] === v)
          return same ? prev : next
        })
        if (performance.now() - start < 700) raf = requestAnimationFrame(track)
      }
      raf = requestAnimationFrame(track)
      return () => cancelAnimationFrame(raf)
    }, [isOpen, computePosition])

    const displayValue = currentValue || placeholder || 'Sélectionner une heure'

    const stagedClass = staged
      ? dark
        ? isAdmin
          ? 'w-full h-9 flex items-center gap-2 px-3 text-sm rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] [background-color:transparent] text-slate-100 outline-none transition-all duration-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-8px_16px_-12px_rgba(0,0,0,0.7),0_6px_18px_-8px_rgba(3,5,14,0.9)] hover:border-white/15 focus:border-rose-400/70'
          : 'w-full h-9 flex items-center gap-2 px-3 text-sm rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] [background-color:transparent] text-slate-100 outline-none transition-all duration-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-8px_16px_-12px_rgba(0,0,0,0.7),0_6px_18px_-8px_rgba(3,5,14,0.9)] hover:border-white/15 focus:border-violet-400/70'
        : isAdmin
          ? 'w-full h-9 flex items-center gap-2 px-3 text-sm rounded-xl border border-orange-900/20 bg-gradient-to-b from-white to-orange-50/80 [background-color:transparent] text-slate-900 outline-none transition-all duration-200 shadow-[inset_0_1px_0_rgba(255,255,255,1),0_4px_16px_-8px_rgba(41,37,36,0.16)] hover:border-orange-900/30 focus:border-orange-500'
          : 'w-full h-9 flex items-center gap-2 px-3 text-sm rounded-xl border border-teal-900/15 bg-gradient-to-b from-white to-teal-50/70 [background-color:transparent] text-teal-950 outline-none transition-all duration-200 shadow-[inset_0_1px_0_rgba(255,255,255,1),inset_0_-6px_14px_-10px_rgba(13,148,136,0.35),0_6px_18px_-10px_rgba(13,148,136,0.45)] hover:border-teal-900/20 focus:border-teal-500/70'
      : null
    return (
      <div ref={containerRef}>
        {label && (
          <label className={cn('block mb-1.5', staged ? (dark ? 'text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400/85' : isAdmin ? 'text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500' : 'text-[11px] font-bold uppercase tracking-[0.14em] text-teal-900/55') : 'text-sm font-medium text-text mb-1.5')}>
            {label}
            {required && <span className="text-error ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          <div
            ref={buttonRef}
            role="button"
            tabIndex={0}
            onPointerDown={handlePointerDown}
            onClick={handleClick}
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
                className={cn(
                  'rounded-2xl border p-3 backdrop-blur-xl',
                  staged
                    ? dark
                      ? isAdmin
                        ? 'border-rose-500/20 bg-[#180F1E] shadow-[0_24px_60px_-20px_rgba(244,63,94,0.35),inset_0_1px_0_rgba(255,255,255,0.08)]'
                        : 'border-violet-500/20 bg-[#0F0A1E] shadow-[0_24px_60px_-20px_rgba(124,92,255,0.35),inset_0_1px_0_rgba(255,255,255,0.08)]'
                      : isAdmin
                        ? 'border-white/70 bg-white/92 shadow-[0_24px_60px_-28px_rgba(41,37,36,0.28),inset_0_1px_0_rgba(255,255,255,0.9)]'
                        : 'border-white/70 bg-white/92 shadow-[0_24px_60px_-28px_rgba(13,148,136,0.35),inset_0_1px_0_rgba(255,255,255,0.9)]'
                    : 'bg-card border-border/50 shadow-dropdown'
                )}
              >
                <div className="flex items-stretch gap-1">
                  <div className="flex-1">
                    <div className={cn('text-[10px] font-bold text-center mb-1.5 uppercase tracking-[0.14em]', staged ? (dark ? 'text-slate-500' : isAdmin ? 'text-slate-400' : 'text-teal-900/45') : 'text-text-secondary/50')}>
                      Heures
                    </div>
                    <div
                      ref={hourListRef}
                      className="overflow-y-auto max-h-[168px] scrollbar-thin space-y-0.5 scroll-smooth"
                    >
                      {HOURS.map((h) => {
                        const selected = tempHour === h
                        return (
                          <button
                            key={h}
                            type="button"
                            onClick={() => {
                              setTempHour(h)
                              commitTime(h, tempMinute || '00')
                            }}
                            className={cn(
                              'w-full text-center py-1 text-[13px] tabular-nums rounded-lg border transition-all duration-150',
                              staged
                                ? selected
                                  ? dark
                                    ? isAdmin
                                      ? 'bg-gradient-to-r from-rose-500/25 to-violet-600/25 text-white border-rose-400/30 font-bold shadow-[0_0_12px_-4px_rgba(244,63,94,0.7)]'
                                      : 'bg-gradient-to-r from-violet-500/25 to-indigo-600/25 text-white border-violet-400/30 font-bold shadow-[0_0_12px_-4px_rgba(124,92,255,0.7)]'
                                    : isAdmin
                                      ? 'bg-orange-500/14 text-orange-900 border-orange-500/25 font-bold shadow-[0_0_12px_-4px_rgba(249,115,22,0.5)]'
                                      : 'bg-teal-500/14 text-teal-900 border-teal-500/25 font-bold shadow-[0_0_12px_-4px_rgba(20,184,166,0.5)]'
                                  : dark
                                    ? 'text-slate-300 border-transparent hover:bg-white/[0.06] hover:text-white'
                                    : isAdmin
                                      ? 'text-slate-600 border-transparent hover:bg-slate-900/[0.04] hover:text-slate-900'
                                      : 'text-teal-900/70 border-transparent hover:bg-teal-900/[0.04] hover:text-teal-900'
                                : selected
                                  ? 'bg-accent text-white border-transparent font-semibold shadow-sm'
                                  : 'text-text-secondary border-transparent hover:text-text hover:bg-background'
                            )}
                          >
                            {h}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-center w-6 shrink-0">
                    <span className={cn('text-lg font-semibold mt-6', staged ? (dark ? (isAdmin ? 'text-rose-300/70' : 'text-violet-300/70') : (isAdmin ? 'text-orange-600/60' : 'text-teal-600/60')) : 'text-text-secondary/40')}>:</span>
                  </div>

                  <div className="flex-1">
                    <div className={cn('text-[10px] font-bold text-center mb-1.5 uppercase tracking-[0.14em]', staged ? (dark ? 'text-slate-500' : isAdmin ? 'text-slate-400' : 'text-teal-900/45') : 'text-text-secondary/50')}>
                      Minutes
                    </div>
                    <div
                      ref={minuteListRef}
                      className="overflow-y-auto max-h-[168px] scrollbar-thin space-y-0.5 scroll-smooth"
                    >
                      {MINUTES.map((m) => {
                        const selected = tempMinute === m
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => {
                              setTempMinute(m)
                              commitTime(tempHour || '00', m)
                            }}
                            className={cn(
                              'w-full text-center py-1 text-[13px] tabular-nums rounded-lg border transition-all duration-150',
                              staged
                                ? selected
                                  ? dark
                                    ? isAdmin
                                      ? 'bg-gradient-to-r from-rose-500/25 to-violet-600/25 text-white border-rose-400/30 font-bold shadow-[0_0_12px_-4px_rgba(244,63,94,0.7)]'
                                      : 'bg-gradient-to-r from-violet-500/25 to-indigo-600/25 text-white border-violet-400/30 font-bold shadow-[0_0_12px_-4px_rgba(124,92,255,0.7)]'
                                    : isAdmin
                                      ? 'bg-orange-500/14 text-orange-900 border-orange-500/25 font-bold shadow-[0_0_12px_-4px_rgba(249,115,22,0.5)]'
                                      : 'bg-teal-500/14 text-teal-900 border-teal-500/25 font-bold shadow-[0_0_12px_-4px_rgba(20,184,166,0.5)]'
                                  : dark
                                    ? 'text-slate-300 border-transparent hover:bg-white/[0.06] hover:text-white'
                                    : isAdmin
                                      ? 'text-slate-600 border-transparent hover:bg-slate-900/[0.04] hover:text-slate-900'
                                      : 'text-teal-900/70 border-transparent hover:bg-teal-900/[0.04] hover:text-teal-900'
                                : selected
                                  ? 'bg-accent text-white border-transparent font-semibold shadow-sm'
                                  : 'text-text-secondary border-transparent hover:text-text hover:bg-background'
                            )}
                          >
                            {m}
                          </button>
                        )
                      })}
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
