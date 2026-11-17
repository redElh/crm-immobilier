import { useState, useRef, useEffect, useLayoutEffect, useCallback, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MoreVertical } from 'react-feather'
import { cn } from '../../lib/utils'
import { useStageChrome } from '../modules/calendar/useStageChrome'
import { GERANT_MAUVE_HUE, useStageAccent, useStageScope } from '../dashboard/Stage'

export interface RegistreAction {
  icon: ReactNode
  label: string
  onClick: () => void
  variant?: 'default' | 'danger'
  separator?: boolean
  disabled?: boolean
  content?: ReactNode
}

interface MenuTarget {
  rect: DOMRect
}

interface MenuPos {
  top: number
  right: number
}

interface RegistreActionsMenuProps {
  actions: RegistreAction[]
  trigger?: ReactNode
  width?: number
  estimatedHeight?: number
  className?: string
  menuClassName?: string
  onOpenChange?: (open: boolean) => void
  alwaysVisible?: boolean
  isGerant?: boolean
}

export function RegistreActionsMenu({
  actions,
  trigger,
  width = 224,
  estimatedHeight = 280,
  className,
  menuClassName,
  onOpenChange,
  alwaysVisible = false,
  isGerant = false,
}: RegistreActionsMenuProps) {
  const [target, setTarget] = useState<MenuTarget | null>(null)
  const [pos, setPos] = useState<MenuPos | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const { staged, dark } = useStageChrome()
  const scope = useStageScope()
  const stageAccent = useStageAccent()
  const accent = isGerant ? GERANT_MAUVE_HUE : stageAccent
  const isAdmin = scope === 'admin'

  const triggerClass = staged
    ? dark
      ? cn(
          'h-8 w-8 items-center justify-center rounded-xl border bg-white/[0.05] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md transition-all duration-300',
          isGerant
            ? 'border-[#A56E6E]/25 text-[#E7D5D5] hover:border-[#A56E6E]/45 hover:bg-[#905D5D]/15'
            : isAdmin
              ? 'border-rose-400/20 text-rose-200 hover:border-rose-400/45 hover:bg-rose-500/10'
              : 'border-white/10 text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white',
        )
      : cn(
          'h-8 w-8 items-center justify-center rounded-xl border bg-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-md transition-all duration-300',
          isGerant
            ? 'border-[#905D5D]/15 text-[#7D5050]/80 hover:border-[#905D5D]/30 hover:bg-white hover:text-[#7D5050]'
            : isAdmin
              ? 'border-orange-900/10 text-orange-900/70 hover:border-orange-500/30 hover:bg-white hover:text-orange-900'
              : 'border-teal-900/10 text-teal-800/70 hover:border-teal-900/20 hover:bg-white hover:text-teal-900',
        )
    : 'p-1.5 rounded-lg text-text-secondary hover:bg-background hover:text-text'

  const itemBaseClass = staged
    ? dark
      ? isGerant
        ? 'text-slate-200 hover:bg-[#A56E6E]/10 hover:text-[#F0DADA]'
        : isAdmin
          ? 'text-slate-200 hover:bg-rose-500/10 hover:text-rose-100'
          : 'text-slate-200 hover:bg-white/[0.06] hover:text-white'
      : isGerant
        ? 'text-[#7D5050]/85 hover:bg-[#905D5D]/10 hover:text-[#7D5050]'
        : isAdmin
          ? 'text-orange-900/80 hover:bg-orange-500/10 hover:text-orange-900'
          : 'text-teal-900/80 hover:bg-teal-500/10 hover:text-teal-900'
    : 'text-text hover:bg-background'

  const itemDangerClass = staged
    ? dark
      ? 'text-rose-400 hover:bg-rose-500/10'
      : 'text-rose-600 hover:bg-rose-500/10'
    : 'text-error hover:bg-error/5'

  const panelClass = staged
    ? dark
      ? cn(
          'rounded-2xl border bg-[#0F0A1E]',
          isGerant ? 'border-[#A56E6E]/25' : isAdmin ? 'border-rose-500/20' : 'border-violet-500/20',
        )
      : cn(
          'rounded-2xl border bg-white/90 backdrop-blur-xl',
          isGerant ? 'border-[#905D5D]/15' : isAdmin ? 'border-orange-500/15' : 'border-white/70',
        )
    : 'bg-card rounded-xl border border-border/50 shadow-dropdown'

  const close = useCallback(() => {
    setTarget(null)
    setPos(null)
    onOpenChange?.(false)
  }, [onOpenChange])

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const btn = e.currentTarget as HTMLElement
    if (target) {
      close()
      return
    }
    const rect = btn.getBoundingClientRect()
    const vh = window.innerHeight
    const estH = estimatedHeight
    const top = rect.bottom + estH <= vh - 8 ? rect.bottom + 4 : Math.max(8, rect.top - estH - 4)
    const right = Math.min(window.innerWidth - rect.right, Math.max(8, window.innerWidth - 8 - width))
    setPos({ top, right })
    setTarget({ rect })
    onOpenChange?.(true)
  }, [target, estimatedHeight, width, close, onOpenChange])

  // After the menu renders, measure its real size and re-anchor it so it stays
  // flush with the trigger button and within the viewport.
  useLayoutEffect(() => {
    if (!target || !pos || !menuRef.current) return
    const menuH = menuRef.current.offsetHeight
    const menuW = menuRef.current.offsetWidth
    const vh = window.innerHeight
    const rect = target.rect
    let top = rect.bottom + 4
    if (top + menuH > vh - 8) top = Math.max(8, rect.top - menuH - 4)
    const right = Math.min(window.innerWidth - rect.right, Math.max(8, window.innerWidth - 8 - menuW))
    if (top !== pos.top || right !== pos.right) setPos({ top, right })
  }, [target, pos])

  useEffect(() => {
    if (!target) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) close()
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [target, close])

  return (
    <div className={`relative inline-flex ${className || ''}`}>
      <motion.button
        type="button"
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Actions"
        onClick={handleClick}
        className={cn(
          'relative inline-flex transition-opacity',
          !alwaysVisible && 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-hover/row:opacity-100 focus-visible:opacity-100',
          triggerClass,
        )}
      >
        <motion.span
          animate={{ rotate: target ? 90 : 0, scale: target ? 1.1 : 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="inline-flex"
        >
          {trigger || <MoreVertical size={14} />}
        </motion.span>
      </motion.button>
      {/* Overlay + panel portal to document.body: inside transformed ancestors
          (tilt cards, overflow-hidden grids) a fixed panel would be clipped. */}
      {createPortal(
        <AnimatePresence>
          {target && pos && (
            <motion.div
              key="registre-actions-overlay"
              className={cn('fixed inset-0 z-40', staged && dark && 'bg-black/40')}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              onClick={(e) => {
                e.stopPropagation()
                close()
              }}
            />
          )}
          {target && pos && (
            <motion.div
              key="registre-actions-panel"
              ref={menuRef}
              initial={{ opacity: 0, y: 10, scale: 0.95, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: 8, scale: 0.96, filter: 'blur(4px)' }}
              transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.7 }}
              style={{
                position: 'fixed',
                top: pos.top,
                right: pos.right,
                width,
                background: staged
                  ? dark
                    ? `linear-gradient(155deg, ${accent.b}24, #0F0A1E 46%)`
                    : 'rgba(255,255,255,0.92)'
                  : undefined,
                borderColor: staged ? `${accent.line}${dark ? '40' : '33'}` : undefined,
                boxShadow: staged
                  ? `0 24px 60px -20px ${accent.glow}, inset 0 1px 0 rgba(255,255,255,${dark ? '0.08' : '0.9'})`
                  : undefined,
              }}
              className={cn('py-1 z-50 max-h-[300px] overflow-y-auto scrollbar-thin', panelClass, menuClassName)}
              onClick={(e) => e.stopPropagation()}
            >
              {actions.map((action, i) => (
                <div key={i}>
                  {action.separator && (
                    <div
                      className={cn('border-t my-1', staged && dark ? 'border-white/[0.08]' : 'border-border/40')}
                      style={staged ? { borderColor: `${accent.line}22` } : undefined}
                    />
                  )}
                  {action.content ? (
                    <div className="px-1 py-0.5">{action.content}</div>
                  ) : (
                    <button
                      type="button"
                      disabled={action.disabled}
                      className={cn(
                        'flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-colors duration-200 text-left',
                        action.variant === 'danger' ? itemDangerClass : itemBaseClass,
                        action.disabled && 'opacity-40 pointer-events-none',
                      )}
                      onClick={() => {
                        action.onClick()
                        close()
                      }}
                    >
                      {action.icon}
                      {action.label}
                    </button>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  )
}
