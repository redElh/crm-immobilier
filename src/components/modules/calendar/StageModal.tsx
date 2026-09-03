import type { ReactNode, ComponentType } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'react-feather'
import { cn } from '../../../lib/utils'
import { STAGE_HUES, OrbIcon, type StageHue } from '../../dashboard/Stage'
import { useStageChrome } from './useStageChrome'

interface StageModalProps {
  open: boolean
  onClose: () => void
  title: string
  eyebrow?: string
  subtitle?: string
  icon?: ComponentType<{ size?: number | string; className?: string }>
  hue?: StageHue
  accent?: string
  badge?: ReactNode
  children: ReactNode
  footer?: ReactNode
  maxWidth?: string
  bodyClassName?: string
  centered?: boolean
}

export default function StageModal({
  open, onClose, title, eyebrow, subtitle, icon: Icon, hue = STAGE_HUES.violet, accent, badge,
  children, footer, maxWidth = 'max-w-2xl', bodyClassName, centered = false,
}: StageModalProps) {
  const { staged, dark } = useStageChrome()
  const glow = accent || hue.glow

  return createPortal(
    <div
      className={cn(
        staged ? 'agent-theme' : 'admin-theme',
        staged && !dark && 'stage-light',
        staged && 'cosmic-scope',
      )}
    >
      <div className={dark ? 'dark' : undefined}>
        <AnimatePresence>
          {open && (
            <div className={cn('fixed inset-0 z-[70] flex px-4 pb-10', centered ? 'items-center justify-center' : 'items-start justify-center pt-[6vh]')}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 backdrop-blur-md"
            style={{
              background: staged && dark
                ? 'radial-gradient(120% 90% at 50% 0%, rgba(20,16,60,0.55), rgba(3,5,14,0.78))'
                : staged
                  ? 'radial-gradient(120% 90% at 50% 0%, rgba(13,148,136,0.18), rgba(4,24,22,0.45))'
                  : 'rgba(15,23,42,0.45)',
            }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            className={cn('relative w-full', maxWidth)}
          >
            <div
              className={cn(
                'overflow-hidden',
                staged ? 'pop-glass rounded-3xl' : 'rounded-2xl border border-border/60 bg-card shadow-modal',
                staged && dark && 'border border-white/10 shadow-[0_40px_100px_-24px_rgba(0,0,0,0.9)]',
                staged && !dark && 'border border-white/80',
              )}
            >
              {/* Accent beam */}
              <div
                className="h-[3px] w-full"
                style={{
                  background: `linear-gradient(90deg, transparent, ${glow} 30%, ${
                    staged ? (dark ? '#8B7CFF' : '#14B8A6') : 'hsl(var(--accent))'
                  } 50%, transparent)`,
                }}
              />

              {/* Header */}
              <div
                className="relative flex items-center gap-3.5 px-6 py-4"
                style={
                  staged
                    ? {
                        background: `radial-gradient(90% 140% at 0% 0%, ${
                          accent ? `${accent}1F` : 'rgba(139,124,255,0.12)'
                        }, transparent 65%)`,
                      }
                    : undefined
                }
              >
                {staged && Icon && <OrbIcon icon={Icon} hue={hue} size={44} radius={14} />}
                <div className="min-w-0 flex-1">
                  {(eyebrow || badge) && (
                    <div className="mb-0.5 flex items-center gap-2">
                      {eyebrow && (
                        <p
                          className={cn(
                            'text-[9px] font-bold uppercase tracking-[0.22em]',
                            staged ? (dark ? 'text-slate-400/75' : 'text-teal-900/45') : 'text-text-secondary',
                          )}
                        >
                          {eyebrow}
                        </p>
                      )}
                      {badge}
                    </div>
                  )}
                  <h2
                    className={cn(
                      'truncate text-lg font-bold tracking-tight leading-tight',
                      staged
                        ? dark
                          ? 'bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent'
                          : 'bg-gradient-to-r from-teal-900 via-teal-700 to-emerald-600 bg-clip-text text-transparent'
                        : 'text-text',
                    )}
                  >
                    {title}
                  </h2>
                  {subtitle && (
                    <p className={cn('mt-0.5 truncate text-xs', staged ? (dark ? 'text-slate-400' : 'text-teal-900/55') : 'text-text-secondary')}>
                      {subtitle}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  aria-label="Fermer"
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-all duration-200 active:scale-95',
                    staged && dark
                      ? 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                      : staged
                        ? 'border-teal-900/10 bg-white/70 text-teal-900/60 hover:bg-white hover:text-teal-900'
                        : 'border-border text-text-secondary hover:bg-background hover:text-text',
                  )}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Body */}
              <div className={cn('px-6 pb-5', staged && (dark ? 'text-slate-200' : 'text-teal-950'), 'cal-modal-scroll', bodyClassName)}>{children}</div>

              {/* Footer */}
              {footer && (
                <div
                  className={cn(
                    'flex items-center justify-end gap-2.5 px-6 py-4',
                    staged
                      ? dark
                        ? 'border-t border-white/[0.07] bg-white/[0.02]'
                        : 'border-t border-teal-900/[0.08] bg-white/40'
                      : 'border-t border-border/40 bg-background/50',
                  )}
                >
                  {footer}
                </div>
              )}
            </div>
          </motion.div>
        </div>
          )}
        </AnimatePresence>
      </div>
    </div>,
    document.body,
  )
}

/* Shared class helpers for form controls inside stage modals */

export function useStageFormClasses() {
  const { staged, dark } = useStageChrome()

  const input = (className?: string) =>
    cn(
      staged
        ? dark
          ? /* Background color is set via the arbitrary property (not bg-transparent):
               tailwind-merge groups bg-transparent with the gradient utilities and
               drops whichever comes first, which left native inputs without any
               author background — Chrome then painted them opaque #3b3b3b under
               color-scheme:dark, breaking the glass skin shared with the pickers. */
            'w-full rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] [background-color:transparent] px-3 text-sm text-slate-100 outline-none transition-all duration-200 placeholder:text-slate-500 focus:border-violet-400/70 focus:from-violet-400/25 focus:to-indigo-500/[0.07] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-8px_16px_-12px_rgba(0,0,0,0.7),0_6px_18px_-8px_rgba(3,5,14,0.9)] focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-8px_16px_-12px_rgba(0,0,0,0.6),0_0_0_3px_rgba(124,92,255,0.28),0_10px_30px_-8px_rgba(124,92,255,0.55)]'
          : 'w-full rounded-xl border border-teal-900/15 bg-gradient-to-b from-white to-teal-50/70 [background-color:transparent] px-3 text-sm text-teal-950 outline-none transition-all duration-200 placeholder:text-teal-900/35 focus:border-teal-500/70 shadow-[inset_0_1px_0_rgba(255,255,255,1),inset_0_-6px_14px_-10px_rgba(13,148,136,0.35),0_6px_18px_-10px_rgba(13,148,136,0.45)] focus:shadow-[inset_0_1px_0_rgba(255,255,255,1),inset_0_-6px_14px_-10px_rgba(13,148,136,0.4),0_0_0_3px_rgba(20,184,166,0.25),0_10px_28px_-10px_rgba(13,148,136,0.6)]'
        : 'w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text outline-none transition-all placeholder:text-text-secondary/40 focus:border-accent focus:ring-2 focus:ring-accent/15',
      className,
    )

  const label = cn(
    'mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em]',
    staged ? (dark ? 'text-slate-400/85' : 'text-teal-900/55') : 'text-sm font-medium normal-case tracking-normal text-text',
  )

  return { input, label, staged, dark }
}

/* Primary / secondary action buttons themed for the modal footer */
export function useStageModalButtons() {
  const { staged, dark } = useStageChrome()

  const primary =
    'inline-flex h-9 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-white transition-all duration-200 active:scale-[0.97] ' +
    (staged
      ? dark
        ? 'border border-white/25 bg-gradient-to-b from-[#8B7CFF] to-[#5646C9] shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_10px_26px_-8px_rgba(124,92,255,0.8)] hover:brightness-110'
        : 'border border-white/50 bg-gradient-to-b from-teal-400 to-emerald-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_10px_26px_-10px_rgba(13,148,136,0.7)] hover:brightness-105'
      : 'btn-primary')

  const ghost =
    'inline-flex h-9 items-center gap-1.5 rounded-xl border px-4 text-sm font-semibold transition-all duration-200 active:scale-[0.97] ' +
    (staged
      ? dark
        ? 'border-white/12 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
        : 'border-teal-900/12 bg-white/70 text-teal-900/70 hover:bg-white hover:text-teal-900'
      : 'btn-secondary')

  return { primary, ghost }
}
