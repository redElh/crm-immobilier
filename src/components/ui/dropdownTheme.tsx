import { createPortal } from 'react-dom'
import { useLayoutEffect, useState, type ReactNode } from 'react'
import { useStageTheme } from '../dashboard/Stage'

const KEEP_CLASSES = ['agent-theme', 'admin-theme', 'stage-light', 'stage-dark']

type ResolvedTheme = { classes: string; isDark: boolean }

function resolveTheme(trigger: HTMLElement | null): ResolvedTheme {
  const themeScope = trigger?.closest('.agent-theme, .admin-theme, .stage-light, .stage-dark') as Element | null
  const stageEl = trigger?.closest('.stage-light, .stage-dark') as Element | null
  const stageClass = stageEl?.classList.contains('stage-light')
    ? 'stage-light'
    : stageEl?.classList.contains('stage-dark')
      ? 'stage-dark'
      : null
  const isDark = Boolean(trigger?.closest('.dark, .stage-dark'))
  const staged = Boolean(trigger?.closest('.stage-dark, .stage-light, .cosmic-scope'))
  const classes = themeScope ? Array.from(themeScope.classList).filter(c => KEEP_CLASSES.includes(c)) : []
  if (stageClass && !classes.includes(stageClass)) classes.push(stageClass)
  if (staged) classes.push('staged-scope', 'cosmic-scope')
  return { classes: classes.join(' '), isDark }
}

function ThemedPortal({ trigger, children }: { trigger: HTMLElement | null; children: ReactNode }) {
  // Re-render whenever the Stage theme flips so the committed DOM can be
  // re-read below (render-time reads still see the previous theme's classes).
  const stageTheme = useStageTheme()
  const [theme, setTheme] = useState<ResolvedTheme>({ classes: '', isDark: false })
  useLayoutEffect(() => {
    const next = resolveTheme(trigger)
    setTheme(prev => (prev.classes === next.classes && prev.isDark === next.isDark ? prev : next))
  }, [trigger, stageTheme])
  return createPortal(
    <div
      className={theme.classes}
      /* `.stage-light` / `.stage-dark` also carry the page-shell rules
         (position: relative; isolation: isolate; overflow: hidden). On a
         body-level portal that traps the fixed dropdown in a z-auto stacking
         context which can paint BELOW the host modal (z-[70]/z-[80]) depending
         on portal insertion order. Lift this scope above modals and drop the
         containing block. */
      style={{ position: 'relative', zIndex: 9990, isolation: 'auto', overflow: 'visible' }}
    >
      {theme.isDark ? <div className="dark">{children}</div> : children}
    </div>,
    document.body,
  )
}

/**
 * Portals floating dropdown panels to document.body so they escape
 * clipping/containing-block ancestors (backdrop-filter, overflow,
 * transforms). Re-applies the theme scope classes captured from the
 * trigger element so token utilities (bg-card, text-text, ...) and the
 * `.dark` overrides keep resolving exactly as they would in place.
 *
 * Theme classes are resolved again after each commit: on a theme switch
 * they must be read from the updated DOM, not from the render pass.
 */
export function portalWithTheme(trigger: HTMLElement | null, content: ReactNode): ReactNode {
  if (typeof document === 'undefined') return content
  return <ThemedPortal trigger={trigger}>{content}</ThemedPortal>
}
