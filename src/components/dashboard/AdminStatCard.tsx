import { motion } from 'framer-motion'
import { ArrowDownRight, ArrowUpRight } from 'react-feather'
import {
  AnimatedNumber,
  OrbIcon,
  TiltCard,
  useStageTheme,
  type StageHue,
} from './Stage'

export interface AdminStatFact {
  label: string
  value: React.ReactNode
}

export interface AdminStatCardProps {
  icon: React.ComponentType<{ size?: number | string; className?: string }>
  label: string
  value: number
  suffix?: string
  decimals?: number
  unit?: string
  detail?: string
  trend?: string
  trendUp?: boolean
  hue: StageHue
  facts?: AdminStatFact[]
  action?: React.ReactNode
  delay?: number
  spark?: number[]
}

/**
 * AdminStatCard — compact mission-control KPI with a living sparkline,
 * two secondary facts, staggered entrance and a hover light sweep.
 */
export function AdminStatCard({
  icon,
  label,
  value,
  suffix,
  decimals = 0,
  unit,
  detail,
  trend,
  trendUp = true,
  hue,
  facts,
  action,
  delay = 0,
  spark,
}: AdminStatCardProps) {
  const theme = useStageTheme()
  const dark = theme === 'dark'
  const TrendIcon = trendUp ? ArrowUpRight : ArrowDownRight
  const trendColor = dark
    ? trendUp ? '#6EE7B7' : '#FDA4AF'
    : trendUp ? '#047857' : '#DC2626'
  const labelColor = dark ? 'text-slate-400' : 'text-slate-500'
  const valueColor = dark ? 'text-white' : 'text-slate-900'
  const factLabel = dark ? 'text-slate-500' : 'text-slate-500'
  const factValue = dark ? 'text-slate-200' : 'text-slate-800'

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className="h-full"
    >
      <TiltCard
        className="admin-kpi-card group relative flex h-full min-h-[146px] flex-col p-3.5"
        contentClassName="flex flex-col"
      >
        <span
          aria-hidden="true"
          className="kpi-sheen pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        />

        <div className="relative z-10 flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="kpi-orb transition-transform duration-500 ease-out">
              <OrbIcon icon={icon} hue={hue} size={34} radius={11} />
            </span>
            <div className="min-w-0">
              <p className={`truncate text-[9.5px] font-extrabold uppercase tracking-[1.35px] ${labelColor}`}>
                {label}
              </p>
              {detail && (
                <p className={`mt-0.5 truncate text-[10px] font-medium ${dark ? 'text-slate-500' : 'text-slate-500'}`}>
                  {detail}
                </p>
              )}
            </div>
          </div>
          {action}
        </div>

        <div className="relative z-10 mt-2.5 flex items-end gap-2">
          <span className={`text-[27px] font-black leading-none tracking-[-0.9px] ${valueColor}`}>
            <AnimatedNumber
              value={value}
              suffix={suffix}
              decimals={decimals}
              decimalSeparator=","
            />
          </span>
          {unit && (
            <span className={`mb-0.5 text-[10px] font-bold uppercase tracking-[0.8px] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
              {unit}
            </span>
          )}
          {trend && (
            <span
              className="mb-0.5 ml-auto inline-flex shrink-0 items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-extrabold"
              style={{
                color: trendColor,
                borderColor: `${trendColor}33`,
                backgroundColor: `${trendColor}12`,
              }}
            >
              <TrendIcon size={10} strokeWidth={3} />
              {trend}
            </span>
          )}
        </div>

        {facts && facts.length > 0 && (
          <div className={`relative z-10 mt-auto grid gap-1.5 pt-2.5 ${facts.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {facts.map(f => (
              <div key={f.label} className={`min-w-0 rounded-lg border px-2 py-1.5 ${dark ? 'border-white/[0.07] bg-[#0D0A18]/90' : 'border-slate-200/70 bg-white/90'}`}>
                <p className={`truncate text-[8px] font-bold uppercase tracking-[1.1px] ${factLabel}`}>{f.label}</p>
                <p className={`mt-0.5 truncate text-[11px] font-extrabold leading-tight ${factValue}`}>{f.value}</p>
              </div>
            ))}
          </div>
        )}
      </TiltCard>
    </motion.div>
  )
}
