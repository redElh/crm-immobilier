import type { ComponentType, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../../../lib/utils'
import { useStageChrome } from '../../calendar/useStageChrome'
import { useStageTheme } from '../../../dashboard/Stage'
import { STAGE_HUES, OrbIcon, SLATE_HUE, type StageHue } from '../../../dashboard/Stage'
import { MotionCard } from '../../../ui/Card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../../ui/Accordion'

/* =====================================================================
   Stage-aware shared primitives for the property add/modify form.
   Mirrors the premium Stage system from Dashboard / Property types / [id].
   Degrades gracefully to the admin token palette when NOT inside Stage.
   ===================================================================== */

export type { StageHue }

export function usePropertyAccent(): { staged: boolean; dark: boolean; hue: StageHue } {
  const { staged, dark } = useStageChrome()
  const hue = staged ? (dark ? STAGE_HUES.violet : STAGE_HUES.emerald) : SLATE_HUE
  return { staged, dark, hue }
}

/* ---------------------------------------------------------------------
   SectionCard — premium glass panel with OrbIcon header.
   Header mirrors StagePanel (Dashboard.tsx:452-471):
     stage-glass + OrbIcon 34 / radius 11 + title [15px] bold -0.2px
   Staged titles are solid (white / slate-900) — like StagePanel —
   not the hero gradient. Subtitles are muted.
   Admin fallback = MotionCard + Accordion dot + semibold text-text.
   --------------------------------------------------------------------- */

interface SectionCardProps {
  value: string
  title: string
  subtitle?: string
  icon?: ComponentType<{ size?: number | string; className?: string }>
  hue?: StageHue
  badge?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
  className?: string
}

export function SectionCard({
  value,
  title,
  subtitle,
  icon,
  hue,
  badge,
  defaultOpen = true,
  children,
  className,
}: SectionCardProps) {
  const { staged, dark } = useStageChrome()
  const theme = useStageTheme()
  const isDark = staged ? dark : theme === 'dark'
  const activeHue = hue || (staged ? (dark ? STAGE_HUES.violet : STAGE_HUES.emerald) : SLATE_HUE)

  // Keep accordion open by default; user can collapse.
  const defaultVal = defaultOpen ? [value] : []

  return (
    <MotionCard
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] as any }}
      className={cn(
        'overflow-hidden',
        staged ? 'stage-glass rounded-3xl p-0' : 'p-0',
        className,
      )}
    >
      <Accordion type="multiple" defaultValue={defaultVal}>
        <AccordionItem value={value} className="border-0">
          <AccordionTrigger
            className={cn(
              'transition-colors duration-200 [&>svg]:transition-colors',
              staged
                ? dark
                  ? 'px-5 py-4 hover:bg-white/[0.04] [&>svg]:text-slate-500'
                  : 'px-5 py-4 hover:bg-teal-900/[0.04] [&>svg]:text-teal-900/35'
                : 'px-6 py-4 hover:bg-background/50',
            )}
          >
            <div className="flex min-w-0 flex-1 items-center gap-3 pr-2">
              {staged ? (
                <OrbIcon icon={icon || InfoIcon} hue={activeHue} size={34} radius={11} />
              ) : (
                <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              )}
              <div className="min-w-0 flex-1 text-left">
                <span
                  className={cn(
                    'block truncate text-[15px] font-bold tracking-[-0.2px]',
                    staged
                      ? isDark
                        ? 'text-white'
                        : 'text-slate-900'
                      : 'font-semibold text-text text-sm',
                  )}
                >
                  {title}
                </span>
                {subtitle && (
                  <span
                    className={cn(
                      'mt-0.5 block truncate text-xs leading-none',
                      staged
                        ? isDark
                          ? 'text-slate-400'
                          : 'text-teal-900/55'
                        : 'text-text-secondary',
                    )}
                  >
                    {subtitle}
                  </span>
                )}
              </div>
              {badge}
            </div>
          </AccordionTrigger>
          <AccordionContent className={cn(staged ? 'px-5 pb-5' : 'px-6 pb-6')}>{children}</AccordionContent>
        </AccordionItem>
      </Accordion>
    </MotionCard>
  )
}

/* ---------------------------------------------------------------------
   SubPanel — inner tile for grouped fields.
   Mirrors Dashboard useT().tile:
     dark:  border-white/10 bg-white/[0.04]
     light: border-teal-900/10 bg-white/60 + inset highlight + soft shadow
   Admin:   border-border/30 bg-background/50
   --------------------------------------------------------------------- */

export function SubPanel({
  title,
  className,
  children,
}: {
  title?: ReactNode
  className?: string
  children: ReactNode
}) {
  const { staged, dark } = useStageChrome()
  const isDark = dark
  return (
    <div
      className={cn(
        'rounded-2xl p-4',
        staged
          ? isDark
            ? 'border border-white/10 bg-white/[0.04]'
            : 'border border-teal-900/10 bg-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_30px_-18px_rgba(13,148,136,0.35)]'
          : 'rounded-xl border border-border/30 bg-background/50',
        className,
      )}
    >
      {title !== undefined && (
        <h4
          className={cn(
            'mb-3 text-[11px] font-bold uppercase tracking-[0.14em]',
            staged ? (isDark ? 'text-slate-400' : 'text-teal-900/60') : 'text-text text-sm font-semibold normal-case tracking-normal',
          )}
        >
          {title}
        </h4>
      )}
      {children}
    </div>
  )
}

export function SubLabel({ children }: { children: ReactNode }) {
  const { staged, dark } = useStageChrome()
  return (
    <h5
      className={cn(
        'mb-2 text-[11px] font-bold uppercase tracking-[0.14em]',
        staged ? (dark ? 'text-slate-400/90' : 'text-teal-900/45') : 'text-text-secondary text-xs font-semibold',
      )}
    >
      {children}
    </h5>
  )
}

/* MediaDrop — Stage glass solid panel (no dashed) for photos/videos */
export function MediaDrop({
  icon: Icon,
  label,
  hint,
  count,
  children,
  staged,
  dark,
}: {
  icon: ComponentType<{ size?: number | string; className?: string }>
  label: string
  hint: string
  count?: number
  children: ReactNode
  staged: boolean
  dark: boolean
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border p-4 transition-colors',
        staged
          ? dark
            ? 'border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_24px_-14px_rgba(0,0,0,0.55)] hover:border-white/15 hover:from-white/[0.08] hover:to-white/[0.03]'
            : 'border-teal-900/10 bg-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_8px_24px_-14px_rgba(13,148,136,0.22)] hover:border-teal-900/15 hover:bg-white'
          : 'border-border bg-background/30 hover:border-border/60',
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border shadow-sm',
            staged
              ? dark
                ? 'border-white/10 bg-white/[0.07] text-violet-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.10)]'
                : 'border-teal-900/10 bg-white text-teal-700 shadow-[inset_0_1px_0_rgba(255,255,255,1)]'
              : 'border-border bg-card text-text-secondary',
          )}
        >
          <Icon size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn('text-sm font-semibold leading-none', staged ? (dark ? 'text-white' : 'text-slate-900') : 'text-text')}>
            {label}
            {typeof count === 'number' && count > 0 && (
              <span className={cn('ml-2 inline-flex items-center rounded-full border px-1.5 py-0.5 text-[11px] font-bold', staged ? (dark ? 'border-white/15 bg-white/10 text-slate-200' : 'border-teal-900/15 bg-teal-900/8 text-teal-800') : 'bg-accent-light text-accent')}>
                {count}
              </span>
            )}
          </p>
          <p className={cn('mt-1 text-xs leading-none', staged ? (dark ? 'text-slate-400' : 'text-teal-900/55') : 'text-text-secondary')}>{hint}</p>
        </div>
      </div>
      <div className="mt-3.5">{children}</div>
    </div>
  )
}

function InfoIcon({ size = 16, className }: { size?: number | string; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  )
}

export const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

export const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
}

export function Field({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={item} className={className}>
      {children}
    </motion.div>
  )
}

export function FieldGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={cn('grid grid-cols-1 md:grid-cols-2 gap-5', className)}
    >
      {children}
    </motion.div>
  )
}
