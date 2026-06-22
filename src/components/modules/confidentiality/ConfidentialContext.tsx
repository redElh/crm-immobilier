import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface ConfidentialContextType {
  revealed: boolean
  reveal: () => void
  hide: () => void
  toggle: () => void
}

const ConfidentialContext = createContext<ConfidentialContextType | null>(null)

export function ConfidentialProvider({ children }: { children: ReactNode }) {
  const [revealed, setRevealed] = useState(false)

  const reveal = useCallback(() => {
    setRevealed(true)
  }, [])

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
