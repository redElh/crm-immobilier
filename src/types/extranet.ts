export type ClientType = 'Vendeur' | 'Acheteur' | 'Bailleur' | 'Locataire' | 'Voyageur'
export type AccessStatus = 'actif' | 'inactif' | 'bloque'
export type ActionType = 'Connexion' | 'Visite' | 'Proposition' | 'Telechargement'
export type ActivityBadge = 'tres_actif' | 'actif' | 'peu_actif' | 'inactif'

export interface ConnectionLog {
  id: string
  clientId: string
  date: string
  action: ActionType
  ip: string
  userAgent: string
  os: string
  browser: string
}

export interface ExtranetClient {
  id: string
  name: string
  email: string
  type: ClientType
  product: string
  productRef?: string
  status: AccessStatus
  totalConnections: number
  lastAction: ActionType
  lastDate: string
  lastIp: string
  lastUserAgent: string
  lastOs: string
  lastBrowser: string
  agent: string
  activationDate: string
}

export interface ActivityDay {
  day: string
  shortDay: string
  connexions: number
  visites: number
  propositions: number
  telechargements: number
}

export interface ClientTypeRepartition {
  type: ClientType
  count: number
  percentage: number
  color: string
}

export interface TopClient {
  rank: number
  name: string
  type: ClientType
  totalConnections: number
  agent: string
}

export const AGENTS = ['Y. AATIC', 'M. ABABOU', 'D. DJEDJE', 'H. OUAKRIM', 'S. AGENCE']

export const ACTIVITY_BADGE_CONFIG: Record<ActivityBadge, { label: string; color: string; bg: string }> = {
  tres_actif: { label: 'Tres actif', color: 'text-emerald-600', bg: 'bg-emerald-100' },
  actif: { label: 'Actif', color: 'text-blue-600', bg: 'bg-blue-100' },
  peu_actif: { label: 'Peu actif', color: 'text-amber-600', bg: 'bg-amber-100' },
  inactif: { label: 'Inactif', color: 'text-slate-500', bg: 'bg-slate-100' },
}

export function computeActivityBadge(connections: number, status: AccessStatus): ActivityBadge {
  if (status === 'inactif' || connections === 0) return 'inactif'
  if (connections >= 15) return 'tres_actif'
  if (connections >= 5) return 'actif'
  return 'peu_actif'
}

const IP_BASE = '192.168.1'

const generateLogs = (clientId: string, count: number, baseDate: Date): ConnectionLog[] => {
  const actions: ActionType[] = ['Connexion', 'Visite', 'Proposition', 'Telechargement']
  const osList = ['Chrome/Windows', 'Chrome/Windows', 'Safari/iOS', 'Chrome/Android', 'Firefox/Windows', 'Safari/macOS']
  const logs: ConnectionLog[] = []
  for (let i = 0; i < count; i++) {
    const date = new Date(baseDate)
    date.setHours(date.getHours() - i * (Math.floor(Math.random() * 48) + 1))
    const agent = osList[Math.floor(Math.random() * osList.length)]
    logs.push({
      id: `log-${clientId}-${i}`,
      clientId,
      date: date.toISOString(),
      action: actions[Math.floor(Math.random() * actions.length)],
      ip: `${IP_BASE}.${Math.floor(Math.random() * 255)}`,
      userAgent: agent,
      os: agent.split('/')[1] || agent,
      browser: agent.split('/')[0] || agent,
    })
  }
  return logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export const mockClients: ExtranetClient[] = [
  {
    id: 'c1', name: 'Hassan El Fassi', email: 'hassan@el-fassi.com',
    type: 'Vendeur', product: 'Villa Argana',
    status: 'actif', totalConnections: 17,
    lastAction: 'Visite', lastDate: '2026-06-12T18:23:46',
    lastIp: '192.168.1.1', lastUserAgent: 'Chrome/Windows',
    lastOs: 'Windows', lastBrowser: 'Chrome',
    agent: 'Y. AATIC', activationDate: '2026-06-01',
  },
  {
    id: 'c2', name: 'Fatima Bennani', email: 'fatima@bennani.com',
    type: 'Vendeur', product: 'Appartement Sidi Magdoul',
    status: 'actif', totalConnections: 1,
    lastAction: 'Proposition', lastDate: '2026-06-12T12:13:00',
    lastIp: '192.168.1.2', lastUserAgent: 'Chrome/Windows',
    lastOs: 'Windows', lastBrowser: 'Chrome',
    agent: 'Y. AATIC', activationDate: '2026-06-10',
  },
  {
    id: 'c3', name: 'Ahmed Benali', email: 'ahmed@benali.com',
    type: 'Acheteur', product: '(Recherche)',
    status: 'actif', totalConnections: 6,
    lastAction: 'Proposition', lastDate: '2026-06-11T09:00:00',
    lastIp: '192.168.1.3', lastUserAgent: 'Safari/iOS',
    lastOs: 'iOS', lastBrowser: 'Safari',
    agent: 'D. DJEDJE', activationDate: '2026-05-20',
  },
  {
    id: 'c4', name: 'Sophie Martin', email: 'sophie@martin.com',
    type: 'Voyageur', product: 'Villa St-Tropez (Vacances)',
    status: 'inactif', totalConnections: 0,
    lastAction: 'Connexion', lastDate: '',
    lastIp: '-', lastUserAgent: '-',
    lastOs: '-', lastBrowser: '-',
    agent: 'S. AGENCE', activationDate: '',
  },
  {
    id: 'c5', name: 'Nadia El Fassi', email: 'nadia@elfassi.com',
    type: 'Bailleur', product: 'Appartement 2 pieces',
    status: 'actif', totalConnections: 12,
    lastAction: 'Telechargement', lastDate: '2026-06-11T14:30:00',
    lastIp: '192.168.1.5', lastUserAgent: 'Firefox/Windows',
    lastOs: 'Windows', lastBrowser: 'Firefox',
    agent: 'H. OUAKRIM', activationDate: '2026-04-15',
  },
  {
    id: 'c6', name: 'Pierre Moreau', email: 'pierre@moreau.com',
    type: 'Locataire', product: '(Recherche)',
    status: 'bloque', totalConnections: 3,
    lastAction: 'Connexion', lastDate: '2026-06-08T22:15:00',
    lastIp: '192.168.1.6', lastUserAgent: 'Chrome/Android',
    lastOs: 'Android', lastBrowser: 'Chrome',
    agent: 'M. ABABOU', activationDate: '2026-06-01',
  },
  {
    id: 'c7', name: 'Sarah Klein', email: 'sarah@klein.de',
    type: 'Voyageur', product: 'Studio Medina',
    status: 'actif', totalConnections: 8,
    lastAction: 'Visite', lastDate: '2026-06-12T08:45:00',
    lastIp: '192.168.1.7', lastUserAgent: 'Chrome/Windows',
    lastOs: 'Windows', lastBrowser: 'Chrome',
    agent: 'Y. AATIC', activationDate: '2026-06-08',
  },
  {
    id: 'c8', name: 'Karim Benali', email: 'karim@benali.com',
    type: 'Acheteur', product: '(Recherche)',
    status: 'actif', totalConnections: 22,
    lastAction: 'Connexion', lastDate: '2026-06-12T20:05:00',
    lastIp: '192.168.1.8', lastUserAgent: 'Safari/macOS',
    lastOs: 'macOS', lastBrowser: 'Safari',
    agent: 'D. DJEDJE', activationDate: '2026-03-10',
  },
  {
    id: 'c9', name: 'Thomas Berger', email: 'thomas@berger.fr',
    type: 'Voyageur', product: 'Riad Essaouira',
    status: 'actif', totalConnections: 5,
    lastAction: 'Proposition', lastDate: '2026-06-10T16:30:00',
    lastIp: '192.168.1.9', lastUserAgent: 'Chrome/Windows',
    lastOs: 'Windows', lastBrowser: 'Chrome',
    agent: 'M. ABABOU', activationDate: '2026-06-01',
  },
  {
    id: 'c10', name: 'Sophie Laurent', email: 'sophie@laurent.fr',
    type: 'Locataire', product: '(Recherche)',
    status: 'inactif', totalConnections: 0,
    lastAction: 'Connexion', lastDate: '',
    lastIp: '-', lastUserAgent: '-',
    lastOs: '-', lastBrowser: '-',
    agent: 'D. DJEDJE', activationDate: '',
  },
]

export const allLogs: ConnectionLog[] = [
  ...generateLogs('c1', 17, new Date('2026-06-12T18:23:46')),
  ...generateLogs('c2', 1, new Date('2026-06-12T12:13:00')),
  ...generateLogs('c3', 6, new Date('2026-06-11T09:00:00')),
  ...generateLogs('c5', 12, new Date('2026-06-11T14:30:00')),
  ...generateLogs('c6', 3, new Date('2026-06-08T22:15:00')),
  ...generateLogs('c7', 8, new Date('2026-06-12T08:45:00')),
  ...generateLogs('c8', 22, new Date('2026-06-12T20:05:00')),
  ...generateLogs('c9', 5, new Date('2026-06-10T16:30:00')),
]

export const generateActivityDays = (): ActivityDay[] => {
  const now = new Date()
  const days: ActivityDay[] = []
  const shortNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dayKey = d.toISOString().slice(0, 10)
    const logsOnDay = allLogs.filter(l => l.date.slice(0, 10) === dayKey)
    days.push({
      day: dayKey,
      shortDay: shortNames[d.getDay() === 0 ? 6 : d.getDay() - 1],
      connexions: logsOnDay.filter(l => l.action === 'Connexion').length,
      visites: logsOnDay.filter(l => l.action === 'Visite').length,
      propositions: logsOnDay.filter(l => l.action === 'Proposition').length,
      telechargements: logsOnDay.filter(l => l.action === 'Telechargement').length,
    })
  }
  return days
}

export function getClientLogs(clientId: string): ConnectionLog[] {
  return allLogs.filter(l => l.clientId === clientId).slice(0, 50)
}

export const STATUS_COLORS: Record<AccessStatus, string> = {
  actif: 'text-emerald-500',
  inactif: 'text-amber-500',
  bloque: 'text-red-500',
}

export const STATUS_BG: Record<AccessStatus, string> = {
  actif: 'bg-emerald-500/10 border-emerald-500/20',
  inactif: 'bg-amber-500/10 border-amber-500/20',
  bloque: 'bg-red-500/10 border-red-500/20',
}
