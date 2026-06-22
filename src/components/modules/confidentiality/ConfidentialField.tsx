import { type ReactNode, type ElementType } from 'react'
import { useConfidential } from './ConfidentialContext'

export function ConfidentialField({ children, as: Component = 'span', className = '' }: {
  children: ReactNode
  as?: ElementType
  className?: string
}) {
  const { revealed } = useConfidential()

  if (revealed) {
    return <Component className={className}>{children}</Component>
  }

  return (
    <Component className={`text-text-secondary/30 italic select-none ${className}`}>
      ••••••••
    </Component>
  )
}

export function ConfidentialValue({ children }: { children: ReactNode }) {
  const { revealed } = useConfidential()

  if (revealed) {
    return <>{children}</>
  }

  return (
    <span className="text-text-secondary/30 italic select-none">••••••••</span>
  )
}
