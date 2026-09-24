import { useEffect, useState } from 'react'
import { useStageTheme } from '../../dashboard/Stage'

/**
 * Detects whether the component lives inside the agent shell
 * (stage-dark / stage-light ancestor) and resolves the active variant.
 * Falls back to `staged: false` for the admin shell, whose token
 * palette (admin-theme) stays authoritative.
 */
export function useStageChrome(): { staged: boolean; dark: boolean } {
  const theme = useStageTheme()
  const [staged, setStaged] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false
    return Boolean(document.querySelector('.stage-dark, .stage-light, .agent-theme'))
  })
  useEffect(() => {
    const check = () => setStaged(Boolean(document.querySelector('.stage-dark, .stage-light, .agent-theme')))
    check()
    // Re-check after mount and when theme changes (stage shell may be injected after)
    const id = setTimeout(check, 0)
    window.addEventListener('resize', check)
    return () => {
      clearTimeout(id)
      window.removeEventListener('resize', check)
    }
  }, [theme])
  return { staged, dark: staged && theme === 'dark' }
}
