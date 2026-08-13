import { useId } from 'react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis, RadialBarChart, RadialBar,
} from 'recharts'
import { useThemeColors } from './useThemeColors'

interface TooltipItem {
  name?: string
  value?: number | string
  color?: string
  payload?: Record<string, unknown>
}

export function ChartTooltip({ active, payload, label }: {
  active?: boolean
  payload?: TooltipItem[]
  label?: string | number
}) {
  const colors = useThemeColors()
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-lg border border-border/50 px-3 py-2 text-xs shadow-lg"
      style={{ backgroundColor: colors.card }}
    >
      {label !== undefined && (
        <p className="mb-1 font-semibold" style={{ color: colors.text }}>
          {label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color || colors.accent }}
            />
            <span style={{ color: colors.textSecondary }}>{entry.name}</span>
            <span className="ml-auto font-medium" style={{ color: colors.text }}>
              {typeof entry.value === 'number'
                ? entry.value.toLocaleString('fr-FR')
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Sparkline({ data, color }: { data: number[]; color: string }) {
  const colors = useThemeColors()
  const id = useId().replace(/:/g, '')
  const max = Math.max(...data, 1)
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * 100},${100 - (v / max) * 100}`)
    .join(' ')
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
      <polygon
        points={`0,100 ${points} 100,100`}
        fill={`url(#spark-${id})`}
        opacity="0.35"
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.8" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export interface TrendSeries {
  dataKey: string
  name?: string
  color?: string
}

export function TrendChart({
  data,
  series,
  height = 240,
}: {
  data: Record<string, string | number>[]
  series: TrendSeries[]
  height?: number
}) {
  const colors = useThemeColors()
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -14, bottom: 0 }}>
        <defs>
          {series.map(s => {
            const id = `grad-${s.dataKey}`
            const color = s.color || colors.accent
            return (
              <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.35" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            )
          })}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: colors.textSecondary }}
          axisLine={{ stroke: colors.axis }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: colors.textSecondary }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: colors.border }} />
        {series.map(s => (
          <Area
            key={s.dataKey}
            type="monotone"
            dataKey={s.dataKey}
            name={s.name || s.dataKey}
            stroke={s.color || colors.accent}
            strokeWidth={2.5}
            fill={`url(#grad-${s.dataKey})`}
            animationDuration={900}
            dot={{ r: 3, fill: s.color || colors.accent, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}

export interface BarSeries {
  dataKey: string
  name?: string
  color: string
  stackId?: string
  radius?: boolean
}

export function BarChartCard({
  data,
  series,
  height = 220,
}: {
  data: Record<string, string | number>[]
  series: BarSeries[]
  height?: number
}) {
  const colors = useThemeColors()
  const radiusSeries = series.filter(s => s.radius)
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -14, bottom: 0 }} barCategoryGap="24%">
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: colors.textSecondary }}
          axisLine={{ stroke: colors.axis }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: colors.textSecondary }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: colors.border, opacity: 0.35 }} />
        {series.map(s => (
          <Bar
            key={s.dataKey}
            dataKey={s.dataKey}
            name={s.name || s.dataKey}
            stackId={s.stackId}
            fill={s.color}
            radius={s.radius ? [4, 4, 0, 0] : undefined}
            animationDuration={800}
            maxBarSize={radiusSeries.length ? undefined : 18}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

export function DonutCard({
  data,
  height = 220,
  centerLabel,
  centerValue,
}: {
  data: { name: string; value: number; color: string }[]
  height?: number
  centerLabel?: string
  centerValue?: string
}) {
  const colors = useThemeColors()
  const total = data.reduce((sum, d) => sum + d.value, 0)
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={<ChartTooltip />} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="68%"
            outerRadius="92%"
            paddingAngle={3}
            cornerRadius={6}
            strokeWidth={0}
            animationDuration={900}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {(centerValue || centerLabel) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tracking-tight" style={{ color: colors.text }}>
            {centerValue}
          </span>
          {centerLabel && (
            <span className="text-xs" style={{ color: colors.textSecondary }}>
              {centerLabel}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export function RadialCard({
  value,
  label,
  color,
  height = 190,
}: {
  value: number
  label?: string
  color: string
  height?: number
}) {
  const colors = useThemeColors()
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="68%"
          outerRadius="100%"
          data={[{ name: label || 'Progression', value, fill: color }]}
          startAngle={90}
          endAngle={-270}
        >
          <RadialBar
            dataKey="value"
            cornerRadius={20}
            fill={color}
            background={{ fill: colors.border, opacity: 0.5 }}
            animationDuration={1200}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tracking-tight" style={{ color: colors.text }}>
          {value}%
        </span>
        {label && (
          <span className="text-xs" style={{ color: colors.textSecondary }}>
            {label}
          </span>
        )}
      </div>
    </div>
  )
}
