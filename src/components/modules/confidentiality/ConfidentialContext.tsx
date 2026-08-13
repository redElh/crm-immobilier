import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'

interface ConfidentialContextType {
  revealed: boolean
  reveal: () => void
  hide: () => void
  toggle: () => void
}

const ConfidentialContext = createContext<ConfidentialContextType | null>(null)

const STORAGE_KEY = 'confidential_revealed'

export function ConfidentialProvider({ children }: { children: ReactNode }) {
  const [revealed, setRevealed] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(revealed))
  }, [revealed])

  const reveal = useCallback(() => setRevealed(true), [])
  const hide = useCallback(() => setRevealed(false), [])
  const toggle = useCallback(() => setRevealed(prev => !prev), [])

  return (
    <ConfidentialContext.Provider value={{ revealed, reveal, hide, toggle }}>
      {children}
    </ConfidentialContext.Provider>
  )
}

export function useConfidential() {
  const ctx = useContext(ConfidentialContext)
  if (!ctx) throw new Error('useConfidential must be used within ConfidentialProvider')
  return ctx
}

export function useOptionalConfidential() {
  const ctx = useContext(ConfidentialContext)
  return ctx ?? { revealed: true, reveal: () => {}, hide: () => {}, toggle: () => {} }
}
