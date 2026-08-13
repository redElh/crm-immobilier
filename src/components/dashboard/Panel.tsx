import { ChevronRight } from 'react-feather'
import { cn } from '../../lib/utils'

export function DashboardPanel({
  title,
  icon: Icon,
  badge,
  children,
  className,
  action,
}: {
  title: string
  icon?: React.ComponentType<{ size?: number | string; className?: string }>
  badge?: React.ReactNode
  children: React.ReactNode
  className?: string
  action?: React.ReactNode
}) {
  return (
    <div className={cn('rounded-xl border border-border/50 bg-card p-5 shadow-card transition-all duration-200 hover:shadow-card-hover', className)}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-light text-accent">
              <Icon size={14} />
            </div>
          )}
          <h2 className="text-sm font-semibold">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {action}
          {badge}
        </div>
      </div>
      {children}
    </div>
  )
}

export function DashboardLinkRow({
  children,
  onClick,
  label,
  className,
}: {
  children?: React.ReactNode
  onClick?: () => void
  label: string
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'mt-4 flex w-full items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-accent-hover',
        className
      )}
    >
      {children}
      {label}
      <ChevronRight size={14} />
    </button>
  )
}
