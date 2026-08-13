import { createContext, useContext, useCallback, type ReactNode } from 'react'
import { useState, useEffect } from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  theme: ThemePreference
  setTheme: (t: ThemePreference) => void
}

const STORAGE_KEY = 'crm-theme'

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  setTheme: () => {},
})

/**
 * Resolve a preference to whether dark mode should be active.
 * 'system' resolves to the light default mode for now.
 */
export function resolveDark(theme: ThemePreference): boolean {
  return theme === 'dark'
}

export function readStoredTheme(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {
    // ignore storage errors
  }
  return 'light'
}

export function applyThemeClass(theme: ThemePreference) {
  document.documentElement.classList.toggle('dark', resolveDark(theme))
}

/**
 * Apply the stored theme before the app renders to avoid a flash of the
 * wrong mode. Called once from the entry point.
 */
export function initTheme() {
  applyThemeClass(readStoredTheme())
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>(readStoredTheme)

  useEffect(() => {
    applyThemeClass(theme)
  }, [theme])

  const setTheme = useCallback((t: ThemePreference) => {
    try {
      localStorage.setItem(STORAGE_KEY, t)
    } catch {
      // ignore storage errors
    }
    setThemeState(t)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
