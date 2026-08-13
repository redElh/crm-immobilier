import { type ReactNode } from 'react'
import { Lock } from 'react-feather'

// Blurs + locks a section of content when the permission is not granted.
export function PermissionLocked({ allowed, label = 'Accès restreint', children, className = '' }: {
  allowed: boolean
  label?: string
  children: ReactNode
  className?: string
}) {
  if (allowed) return <>{children}</>
  return (
    <div className={`relative select-none ${className}`}>
      <div className="pointer-events-none blur-[3px] opacity-40" aria-hidden="true">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg bg-card border border-border/60 shadow-sm text-text-secondary">
          <Lock size={12} />
          {label}
        </span>
      </div>
    </div>
  )
}

// Masks a single value (••••••••) when the permission is not granted.
export function PermissionValue({ allowed, children }: { allowed: boolean; children: ReactNode }) {
  if (allowed) return <>{children}</>
  return <span className="text-text-secondary/30 italic select-none">••••••••</span>
}
