import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'
import { useThemeColors } from './useThemeColors'

export interface DashboardTab {
  id: string
  label: string
  icon: React.ComponentType<{ size?: number | string; className?: string }>
}

interface DashboardTabsProps {
  tabs: DashboardTab[]
  activeId: string
  onChange: (id: string) => void
  columns?: 4 | 5 | 6
  accentColor?: string
}

export function DashboardTabs({ tabs, activeId, onChange, columns = 5, accentColor }: DashboardTabsProps) {
  const colors = useThemeColors()
  const accent = accentColor || colors.accent
  const gridClass = columns === 4
    ? 'lg:grid-cols-4'
    : columns === 6
      ? 'lg:grid-cols-6'
      : 'lg:grid-cols-5'

  return (
    <div className={`grid w-full grid-cols-2 gap-1 rounded-xl border border-border/50 bg-card p-1.5 shadow-card sm:grid-cols-3 ${gridClass}`}>
      {tabs.map(tab => {
        const Icon = tab.icon
        const active = tab.id === activeId
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative flex items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-[13px] font-medium transition-colors',
              active ? 'text-white' : 'text-text-secondary hover:bg-background hover:text-text'
            )}
          >
            {active && (
              <motion.span
                layoutId="dashboard-tab-pill"
                className="absolute inset-0 rounded-lg"
                style={{
                  backgroundColor: accent,
                  boxShadow: `0 6px 18px -6px ${accent}`,
                }}
                transition={{ type: 'spring', stiffness: 380, damping: 34 }}
              />
            )}
            <Icon size={15} className="relative z-10" />
            <span className="relative z-10 truncate">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export function TabContent({
  children,
  tabId,
  className,
}: {
  children: React.ReactNode
  tabId: string
  className?: string
}) {
  return (
    <motion.div
      key={tabId}
      initial={{ opacity: 0, y: 14, filter: 'brightness(0.5)' }}
      animate={{ opacity: 1, y: 0, filter: 'brightness(1)' }}
      transition={{ duration: 0.32, ease: [0.65, 0, 0.35, 1] }}
      className={cn('space-y-6', className)}
    >
      {children}
    </motion.div>
  )
}
