import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, ChevronLeft, ChevronRight } from 'react-feather'
import { cn } from '../../lib/utils'
import { portalWithTheme } from './dropdownTheme'
import { useStageChrome } from '../modules/calendar/useStageChrome'

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

interface DatePickerProps {
  label?: string
  value?: string
  defaultValue?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
  error?: string
  className?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  min?: string | number
  max?: string | number
  name?: string
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function parseDate(value?: string): Date | null {
  if (!value) return null
  const hasTime = /T| /.test(value)
  const d = hasTime ? new Date(value) : new Date(value + 'T00:00:00')
  return isNaN(d.getTime()) ? null : d
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, value, defaultValue, onChange, onBlur, error, className, placeholder, required, disabled, min, max, name }, ref) => {
    const { staged, dark } = useStageChrome()
    const [isOpen, setIsOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState(value || defaultValue || '')
    const containerRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLDivElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
    const isControlled = value !== undefined
    const currentValue = isControlled ? value! : selectedDate

    const parsed = useMemo(() => parseDate(currentValue), [currentValue])
    const [viewYear, setViewYear] = useState(parsed ? parsed.getFullYear() : new Date().getFullYear())
    const [viewMonth, setViewMonth] = useState(parsed ? parsed.getMonth() : new Date().getMonth())
    const [showYearPicker, setShowYearPicker] = useState(false)
    const [navDir, setNavDir] = useState(0)
    const currentYear = new Date().getFullYear()
    const decadeStart = Math.floor(viewYear / 10) * 10

    useEffect(() => {
      if (parsed) {
        setViewYear(parsed.getFullYear())
        setViewMonth(parsed.getMonth())
      }
    }, [parsed])

    const displayDate = parsed
      ? parsed.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
      : ''

    const buildCalendarDays = useCallback(() => {
      const daysInMonth = getDaysInMonth(viewYear, viewMonth)
      const firstDay = new Date(viewYear, viewMonth, 1).getDay()
      const startOffset = firstDay === 0 ? 6 : firstDay - 1

      const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1
      const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear
      const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth)

      const cells: { day: number; month: number; year: number; current: boolean }[] = []

      for (let i = startOffset - 1; i >= 0; i--) {
        cells.push({ day: daysInPrevMonth - i, month: prevMonth, year: prevYear, current: false })
      }
      for (let d = 1; d <= daysInMonth; d++) {
        cells.push({ day: d, month: viewMonth, year: viewYear, current: true })
      }
      const totalCells = cells.length
      const remainder = totalCells % 7
      if (remainder > 0) {
        const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1
        const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear
        for (let d = 1; d <= 7 - remainder; d++) {
          cells.push({ day: d, month: nextMonth, year: nextYear, current: false })
        }
      }
      return cells
    }, [viewYear, viewMonth])

    const calendarDays = useMemo(buildCalendarDays, [buildCalendarDays])

    const computePosition = useCallback(() => {
      if (!buttonRef.current) return {}
      const rect = buttonRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom - 8
      const dh = 380
      const openUp = spaceBelow < dh && rect.top > dh
      return {
        position: 'fixed' as const,
        left: Math.max(8, Math.min(rect.left, window.innerWidth - 320)) + 'px',
        width: Math.max(Math.min(rect.width, 304), 264) + 'px',
        ...(openUp
          ? { bottom: window.innerHeight - rect.top + 4 + 'px' }
          : { top: rect.bottom + 4 + 'px' }),
        zIndex: 9999,
      }
    }, [])

    const handleToggle = () => {
      if (disabled) return
      if (isOpen) {
        setIsOpen(false)
      } else {
        setDropdownStyle(computePosition())
        setIsOpen(true)
      }
    }

    const selectDay = (year: number, month: number, day: number) => {
      if (isDisabled(year, month, day)) return
      const newVal = formatDate(year, month, day)
      if (!isControlled) {
        setSelectedDate(newVal)
        setViewYear(year)
        setViewMonth(month)
      }
      if (onChange) {
        const nativeInput = document.createElement('input')
        nativeInput.type = 'date'
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
        nativeSetter?.call(nativeInput, newVal)
        nativeInput.dispatchEvent(new Event('change', { bubbles: true }))
        const nativeInput2 = document.createElement('input')
        nativeInput2.type = 'date'
        nativeSetter?.call(nativeInput2, newVal)
        nativeInput2.dispatchEvent(new Event('input', { bubbles: true }))
        onChange({ target: { value: newVal } } as React.ChangeEvent<HTMLInputElement>)
      }
      setIsOpen(false)
    }

    const isSelected = (year: number, month: number, day: number) => {
      return currentValue === formatDate(year, month, day)
    }

    const isToday = (year: number, month: number, day: number) => {
      const t = new Date()
      return year === t.getFullYear() && month === t.getMonth() && day === t.getDate()
    }

    const minDate = useMemo(() => {
      if (min === undefined || min === null || min === '') return null
      const s = String(min)
      const hasTime = /T| /.test(s)
      const d = hasTime ? new Date(s) : new Date(s + 'T00:00:00')
      return isNaN(d.getTime()) ? null : d
    }, [min])

    const isDisabled = (year: number, month: number, day: number) => {
      if (disabled) return true
      if (minDate) {
        const d = new Date(year, month, day)
        if (d.getTime() < minDate.getTime()) return true
      }
      return false
    }

    const clearDate = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (isControlled) {
        if (onChange) {
          onChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>)
        }
      } else {
        setSelectedDate('')
      }
    }

    const prevMonth = () => {
      setNavDir(-1)
      setViewMonth((m) => (m === 0 ? 11 : m - 1))
      setViewYear((y) => (viewMonth === 0 ? y - 1 : y))
    }

    const nextMonth = () => {
      setNavDir(1)
      setViewMonth((m) => (m === 11 ? 0 : m + 1))
      setViewYear((y) => (viewMonth === 11 ? y + 1 : y))
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

    const stagedClass = staged
      ? dark
        ? 'w-full h-9 flex items-center justify-between px-3 text-sm rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] [background-color:transparent] text-slate-100 outline-none transition-all duration-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-8px_16px_-12px_rgba(0,0,0,0.7),0_6px_18px_-8px_rgba(3,5,14,0.9)] hover:border-white/15 focus:border-violet-400/70'
        : 'w-full h-9 flex items-center justify-between px-3 text-sm rounded-xl border border-teal-900/15 bg-gradient-to-b from-white to-teal-50/70 [background-color:transparent] text-teal-950 outline-none transition-all duration-200 shadow-[inset_0_1px_0_rgba(255,255,255,1),inset_0_-6px_14px_-10px_rgba(13,148,136,0.35),0_6px_18px_-10px_rgba(13,148,136,0.45)] hover:border-teal-900/20 focus:border-teal-500/70'
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
                'w-full h-9 flex items-center justify-between px-3 text-sm rounded-lg cursor-pointer',
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
            <div className="flex items-center gap-2 min-w-0">
              <Calendar size={15} className={cn('shrink-0', staged && dark ? 'text-slate-500' : 'text-text-secondary')} />
              <span className={cn('truncate', !displayDate && (staged && dark ? 'text-slate-500' : 'text-text-secondary/60'))}>
                {displayDate || placeholder || 'Sélectionner une date'}
              </span>
            </div>
            {currentValue && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                type="button"
                tabIndex={-1}
                className="p-0.5 rounded text-text-secondary/40 hover:text-text hover:bg-background transition-colors shrink-0"
                onClick={clearDate}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </motion.button>
            )}
          </div>
        </div>

        {portalWithTheme(
          buttonRef.current,
          <AnimatePresence>
            {isOpen && (
              <motion.div
                ref={dropdownRef}
                key="datepicker-dropdown"
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                style={dropdownStyle}
                className="bg-card rounded-2xl border border-border/50 shadow-dropdown p-4 select-none"
              >
                {/* header */}
                <div className="mb-3 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={prevMonth}
                    aria-label="Mois précédent"
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-text-secondary transition-all duration-200 hover:bg-background hover:text-text active:scale-90"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowYearPicker(!showYearPicker)}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-[13px] font-bold tabular-nums transition-all duration-200 active:scale-95 ${
                      showYearPicker
                        ? 'border-accent/40 bg-accent-light/60 text-accent'
                        : 'border-border/50 bg-background text-text hover:border-accent/30 hover:text-accent'
                    }`}
                  >
                    {MONTHS[viewMonth]} {viewYear}
                    <ChevronRight size={12} className={cn('transition-transform duration-200', showYearPicker && 'rotate-90')} />
                  </button>
                  <button
                    type="button"
                    onClick={nextMonth}
                    aria-label="Mois suivant"
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-text-secondary transition-all duration-200 hover:bg-background hover:text-text active:scale-90"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                <AnimatePresence>
                  {showYearPicker && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="mb-3 overflow-hidden"
                    >
                      <div className="rounded-xl border border-border/50 bg-background p-3">
                        <div className="mb-2.5 flex items-center justify-between">
                          <button
                            type="button"
                            aria-label="Décennie précédente"
                            onClick={() => setViewYear(y => y - 10)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-text-secondary transition-all duration-200 hover:bg-card hover:text-text active:scale-90"
                          >
                            <ChevronLeft size={14} />
                          </button>
                          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-text-secondary">
                            {decadeStart} – {decadeStart + 9}
                          </span>
                          <button
                            type="button"
                            aria-label="Décennie suivante"
                            onClick={() => setViewYear(y => y + 10)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-text-secondary transition-all duration-200 hover:bg-card hover:text-text active:scale-90"
                          >
                            <ChevronRight size={14} />
                          </button>
                        </div>
                        <div className="grid grid-cols-5 gap-1.5">
                          {Array.from({ length: 12 }, (_, i) => decadeStart - 1 + i).map((y) => {
                            const isCurrent = y === currentYear
                            const isSelected = y === viewYear
                            const isInRange = y >= decadeStart && y <= decadeStart + 9
                            return (
                              <motion.button
                                key={y}
                                type="button"
                                whileHover={!isSelected ? { scale: 1.08, y: -1 } : undefined}
                                whileTap={{ scale: 0.92 }}
                                onClick={() => { setViewYear(y); setShowYearPicker(false); }}
                                className={cn(
                                  'flex h-9 items-center justify-center rounded-lg text-xs font-semibold tabular-nums transition-colors duration-150',
                                  !isInRange && 'text-text-secondary/25',
                                  isInRange && !isSelected && !isCurrent && 'text-text-secondary hover:bg-card hover:text-text',
                                  isCurrent && !isSelected && 'bg-accent/10 text-accent ring-1 ring-accent/40',
                                  isSelected && 'dp-selected !text-white',
                                )}
                              >
                                {y}
                              </motion.button>
                            )
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* weekdays */}
                <div className="mb-1.5 grid grid-cols-7 gap-1">
                  {DAYS.map((d) => (
                    <div key={d} className="py-1 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-text-secondary/45">
                      {d}
                    </div>
                  ))}
                </div>

                {/* day grid — slides with month navigation */}
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={`${viewYear}-${viewMonth}`}
                    initial={{ opacity: 0, x: navDir * 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: navDir * -20 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="grid grid-cols-7 gap-1"
                  >
                    {calendarDays.map((cell, idx) => (
                      <motion.button
                        key={idx}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.18, delay: Math.min(idx * 0.006, 0.2), ease: [0.22, 1, 0.36, 1] }}
                        whileHover={!isDisabled(cell.year, cell.month, cell.day) ? { scale: 1.12, y: -1 } : undefined}
                        whileTap={{ scale: 0.88 }}
                        type="button"
                        disabled={isDisabled(cell.year, cell.month, cell.day)}
                        onClick={() => selectDay(cell.year, cell.month, cell.day)}
                        className={cn(
                          'flex aspect-square w-full items-center justify-center rounded-lg text-[13px] font-medium transition-colors duration-150',
                          cell.current ? 'text-text hover:bg-accent-light/60' : 'text-text-secondary/25',
                          isDisabled(cell.year, cell.month, cell.day) && 'cursor-not-allowed text-text-secondary/20 hover:bg-transparent',
                          isSelected(cell.year, cell.month, cell.day) && 'dp-selected !text-white font-bold hover:brightness-110',
                          isToday(cell.year, cell.month, cell.day) && !isSelected(cell.year, cell.month, cell.day) && 'ring-1 ring-accent/50',
                        )}
                      >
                        {cell.day}
                      </motion.button>
                    ))}
                  </motion.div>
                </AnimatePresence>
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

DatePicker.displayName = 'DatePicker'
