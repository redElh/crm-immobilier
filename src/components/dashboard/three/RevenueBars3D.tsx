import { Bars3D, formatCompactValue, type Bars3DItem } from './Bars3D'
import type { StageHue } from '../Stage'

export interface RevenueBars3DProps {
  data: { label: string; ca: number; deals: number }[]
  hue: StageHue
  isDark: boolean
  height?: number
  className?: string
}

/**
 * RevenueBars3D — the agency revenue scene. Each month becomes a rounded
 * neon column; hovering reveals the number of mandates concluded.
 */
export function RevenueBars3D({ data, hue, isDark, height = 280, className }: RevenueBars3DProps) {
  const items: Bars3DItem[] = data.map(d => ({
    label: d.label,
    value: d.ca,
    hue,
    meta: `${d.deals} mandat${d.deals > 1 ? 's' : ''} · ${formatCompactValue(d.ca)} MAD`,
  }))

  return (
    <Bars3D
      data={items}
      hue={hue}
      isDark={isDark}
      height={height}
      className={className}
      showValues
      valueFormatter={formatCompactValue}
      hint="glisser pour orbiter · cliquer pour épingler"
    />
  )
}
