import { useEffect, useState } from 'react'

function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const color = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

function getThemeElement(): HTMLElement {
  if (typeof document === 'undefined') return null as unknown as HTMLElement
  return document.querySelector<HTMLElement>('.admin-theme, .agent-theme') || document.documentElement
}

function parseCssVar(name: string, fallback: string, el: HTMLElement): string {
  if (typeof window === 'undefined') return fallback
  const raw = getComputedStyle(el)
    .getPropertyValue(name)
    .trim()
  if (!raw) return fallback
  if (raw.startsWith('#')) return raw
  const parts = raw.split(' ').map(p => parseFloat(p))
  if (parts.some(p => Number.isNaN(p))) return fallback
  const [h, s, l] = parts
  return hslToHex(h, s, l)
}

export interface ThemeColors {
  accent: string
  accentHover: string
  accentLight: string
  text: string
  textSecondary: string
  border: string
  background: string
  card: string
  grid: string
  axis: string
}

export function useThemeColors(): ThemeColors {
  const read = (): ThemeColors => {
    const el = getThemeElement()
    return {
      accent: parseCssVar('--accent', '#2c8264', el),
      accentHover: parseCssVar('--accent-hover', '#1d694f', el),
      accentLight: parseCssVar('--accent-light', '#eef7f3', el),
      text: parseCssVar('--text', '#111827', el),
      textSecondary: parseCssVar('--text-secondary', '#4b5563', el),
      border: parseCssVar('--border', '#e5e7eb', el),
      background: parseCssVar('--background', '#f3f4f6', el),
      card: parseCssVar('--card', '#ffffff', el),
      grid: 'rgba(128, 128, 128, 0.14)',
      axis: 'rgba(128, 128, 128, 0.35)',
    }
  }
  const [colors, setColors] = useState<ThemeColors>(read)

  useEffect(() => {
    const update = () => setColors(read())
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style'],
    })
    update()
    return () => observer.disconnect()
  }, [])

  return colors
}
