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
  const scope = trigger?.closest('.agent-theme, .admin-theme') as Element | null
  const isDark = Boolean(trigger?.closest('.dark, .stage-dark'))
  /* Portaled modals carry `cosmic-scope` instead of the stage classes */
  const staged = Boolean(trigger?.closest('.stage-dark, .stage-light, .cosmic-scope'))
  const classes = scope ? Array.from(scope.classList).filter(c => KEEP_CLASSES.includes(c)) : []
  if (staged) classes.push('staged-scope', 'cosmic-scope')
  return createPortal(
    <div className={classes.join(' ')}>
      {isDark ? <div className="dark">{content}</div> : content}
    </div>,
    document.body,
  )
}
