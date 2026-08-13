import { motion } from 'framer-motion'
import { ArrowDownRight, ArrowUpRight } from 'react-feather'
import { cn } from '../../lib/utils'
import { AnimatedNumber } from './AnimatedNumber'
import { Sparkline } from './charts'

interface StatCardProps {
  icon: React.ComponentType<{ size?: number | string; className?: string }>
  label: string
  value: number
  suffix?: string
  trend?: string
  trendUp?: boolean
  iconBg?: string
  iconColor?: string
  spark?: number[]
  sparkColor?: string
  delay?: number
}

export function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  trend,
  trendUp = true,
  iconBg,
  iconColor,
  spark,
  sparkColor,
  delay = 0,
}: StatCardProps) {
  const TrendIcon = trendUp ? ArrowUpRight : ArrowDownRight
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0, 0, 0.58, 1] }}
      className="relative overflow-hidden rounded-xl border border-border/50 bg-card p-4 shadow-card transition-all duration-200 hover:shadow-card-hover"
    >
      {spark && sparkColor && (
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 opacity-50">
          <Sparkline data={spark} color={sparkColor} />
        </div>
      )}
      <div className="relative">
        <div className="mb-2.5 flex items-center justify-between">
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', iconBg, iconColor)}>
            <Icon size={17} />
          </div>
          {trend && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-xs font-medium',
                trendUp ? 'text-emerald-600' : 'text-error'
              )}
            >
              <TrendIcon size={11} />
              {trend}
            </span>
          )}
        </div>
        <AnimatedNumber
          value={value}
          suffix={suffix}
          className="block text-2xl font-semibold tracking-tight"
        />
        <p className="mt-0.5 text-[13px] text-text-secondary">{label}</p>
      </div>
    </motion.div>
  )
}
