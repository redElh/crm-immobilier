import { useMemo } from 'react'
import { useStageTheme } from '../../dashboard/Stage'

/**
 * Detects whether the component lives inside the agent shell
 * (stage-dark / stage-light ancestor) and resolves the active variant.
 * Falls back to `staged: false` for the admin shell, whose token
 * palette (admin-theme) stays authoritative.
 */
export function useStageChrome(): { staged: boolean; dark: boolean } {
  const theme = useStageTheme()
  const staged = useMemo(() => {
    if (typeof document === 'undefined') return false
    return Boolean(document.querySelector('.stage-dark, .stage-light'))
  }, [])
  return { staged, dark: staged && theme === 'dark' }
}
