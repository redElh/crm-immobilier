import { useState, useRef, useEffect, useLayoutEffect, useCallback, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MoreVertical } from 'react-feather'

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
}: RegistreActionsMenuProps) {
  const [target, setTarget] = useState<MenuTarget | null>(null)
  const [pos, setPos] = useState<MenuPos | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

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
      <button
        type="button"
        className={`p-1.5 rounded-lg hover:bg-background text-text-secondary hover:text-text transition-all ${alwaysVisible ? '' : 'opacity-0 group-hover:opacity-100'}`}
        onClick={handleClick}
      >
        {trigger || <MoreVertical size={14} />}
      </button>
      <AnimatePresence>
        {target && pos && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
            />
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.12 }}
              style={{ position: 'fixed', top: pos.top, right: pos.right, width }}
              className={`bg-card rounded-xl border border-border/50 shadow-dropdown py-1 z-50 max-h-[300px] overflow-y-auto scrollbar-thin ${menuClassName || ''}`}
            >
              {actions.map((action, i) => (
                <div key={i}>
                  {action.separator && <div className="border-t border-border/40 my-1" />}
                  {action.content ? (
                    <div className="px-1 py-0.5">{action.content}</div>
                  ) : (
                    <button
                      type="button"
                      disabled={action.disabled}
                      className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-colors text-left ${
                        action.variant === 'danger'
                          ? 'text-error hover:bg-error/5'
                          : 'text-text hover:bg-background'
                      } ${action.disabled ? 'opacity-40 pointer-events-none' : ''}`}
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
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
