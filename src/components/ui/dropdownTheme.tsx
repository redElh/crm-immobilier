import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

const KEEP_CLASSES = ['agent-theme', 'admin-theme', 'stage-light', 'stage-dark']

/**
 * Portals floating dropdown panels to document.body so they escape
 * clipping/containing-block ancestors (backdrop-filter, overflow,
 * transforms). Re-applies the theme scope classes captured from the
 * trigger element so token utilities (bg-card, text-text, ...) and the
 * `.dark` overrides keep resolving exactly as they would in place.
 */
export function portalWithTheme(trigger: HTMLElement | null, content: ReactNode): ReactNode {
  if (typeof document === 'undefined') return content
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
  return createPortal(
    <div className={classes.join(' ')}>
      {isDark ? <div className="dark">{content}</div> : content}
    </div>,
    document.body,
  )
}
