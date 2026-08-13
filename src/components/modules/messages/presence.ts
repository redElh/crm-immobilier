import type { PresenceStatus } from '../../../types/messages'

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
}

const gradientColors = [
  'bg-gradient-to-br from-indigo-500 to-violet-600',
  'bg-gradient-to-br from-sky-500 to-blue-600',
  'bg-gradient-to-br from-emerald-500 to-teal-600',
  'bg-gradient-to-br from-amber-500 to-orange-600',
  'bg-gradient-to-br from-rose-500 to-pink-600',
  'bg-gradient-to-br from-fuchsia-500 to-purple-600',
  'bg-gradient-to-br from-cyan-500 to-sky-600',
]

export function avatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  }
  return gradientColors[hash % gradientColors.length]
}

export function presenceDotClass(presence?: PresenceStatus): string {
  if (presence === 'online') return 'bg-emerald-500'
  if (presence === 'away') return 'bg-amber-400'
  return 'bg-text-secondary/40'
}

export function formatInactiveDuration(lastSeen?: string): string {
  if (!lastSeen) return 'quelques instants'
  const elapsed = Date.now() - new Date(lastSeen).getTime()
  if (!Number.isFinite(elapsed) || elapsed < 0) return 'quelques instants'
  const secs = Math.floor(elapsed / 1000)
  if (secs < 60) return "moins d'une minute"
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `plus de ${mins} minute${mins > 1 ? 's' : ''}`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `plus de ${hours} heure${hours > 1 ? 's' : ''}`
  const days = Math.floor(hours / 24)
  if (days < 7) return `plus de ${days} jour${days > 1 ? 's' : ''}`
  const weeks = Math.floor(days / 7)
  return `plus de ${weeks} semaine${weeks > 1 ? 's' : ''}`
}

export function presenceLabel(presence?: PresenceStatus, lastSeen?: string): { label: string; dot: string; text: string } {
  if (presence === 'online') return { label: 'En ligne', dot: 'bg-emerald-500', text: 'text-emerald-600' }
  if (presence === 'away') return { label: `Inactif (Pas connecté depuis ${formatInactiveDuration(lastSeen)})`, dot: 'bg-amber-400', text: 'text-amber-600' }
  return { label: '⚪ Hors ligne (Déconnecté)', dot: 'bg-text-secondary/40', text: 'text-text-secondary' }
}
