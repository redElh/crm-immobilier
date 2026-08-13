import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react'
import { Automator, AutomatorLog, AutomatorNotification, LogStatut, AutomatorCategorie, AutomatorNiveau, NotificationCanal } from '../types/automator'
import { api } from '../services/api'

export interface TriggeredNotification {
  id: string
  eventId: string
  eventLabel: string
  categorie: string
  channel: 'email' | 'crm'
  title: string
  message: string
  emailHtml?: string
  crmHtml?: string
  readAt?: string
  agentNom: string
  bienTitre: string
  clientNom: string
  clientType: string
  mandatType: string
  dateExpiration: string
  dateTriggered: string
  read: boolean
  createurRole?: string
  bienType?: string
}

export interface UpdateAutomatorInput extends AddAutomatorInput {
  id: number
}

export interface AddAutomatorInput {
  modeleId: number
  eventId?: string
  niveau: AutomatorNiveau
  niveauLabel: string
  nomPersonnalise?: string
  createdBy: string
  delegatedBy?: string
  delegatedTo?: string
  delegationType?: 'all' | 'specific'
  actif: boolean
  frequence: string
  notifications: {
    canal: NotificationCanal
    actif: boolean
    langue: string
    objetTemplate?: string
    messageTemplate: string
    destinataires: string[]
  }[]
}

interface AutomatorContextValue {
  automators: Automator[]
  addAutomator: (input: AddAutomatorInput) => Promise<Automator | undefined>
  updateAutomator: (input: UpdateAutomatorInput) => void
  toggleAutomator: (id: number) => void
  deleteAutomator: (id: number) => void
  triggerInactivityCheck: () => Promise<void>
  triggerSeedInactiveAgent: () => Promise<any>
  triggeredNotifications: TriggeredNotification[]
  unreadCount: number
  logs: AutomatorLog[]
  addLog: (log: Omit<AutomatorLog, 'id'>) => void
  totalExecutions: number
  totalSuccess: number
  totalFailed: number
  totalPending: number
  triggerMandatExpire: (data: {
    bienTitre: string
    bienAdresse?: string
    clientPrenom: string
    clientNom: string
    clientType: string
    mandatType: string
    mandatNumero?: string
    dateExpiration: string
    agentNom: string
    agentEmail?: string
    automatorId?: number
    channels: ('email' | 'crm')[]
  }) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  getUnreadCount: () => number
  checkExpiredMandats: (clients: Array<{
    id: string
    name: string
    type: string
    area?: string
    dateExpiration?: string
    statutMandat?: string
    typeMandat?: string
    numeroMandat?: string
    propertyType?: string
    agentId?: string
  }>, getAgentName: (agentId?: string) => string) => void
}

const AutomatorContext = createContext<AutomatorContextValue | null>(null)

export function useAutomator() {
  const ctx = useContext(AutomatorContext)
  if (!ctx) throw new Error('useAutomator must be used within AutomatorProvider')
  return ctx
}

function buildMandatExpireEmailHtml(data: {
  bienTitre: string
  bienAdresse?: string
  clientPrenom: string
  clientNom: string
  clientType: string
  mandatType: string
  mandatNumero?: string
  dateExpiration: string
  agentNom: string
}): string {
  const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Roboto,sans-serif;background:#f4f5f7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:28px 32px;">
          <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">Mandat expire</h1>
          <p style="margin:6px 0 0;color:#a8b2d1;font-size:13px;">Square Meter - Notification automator</p>
        </td></tr>
        <tr><td style="padding:28px 32px;">
          <p style="margin:0 0 16px;color:#333;font-size:14px;">Bonjour <strong>${data.agentNom}</strong>,</p>
          <p style="margin:0 0 20px;color:#555;font-size:13px;line-height:1.6;">
            Le mandat pour le bien suivant a expiré. Veuillez prendre les dispositions nécessaires.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fb;border-radius:8px;border:1px solid #e8ecf1;">
            <tr><td style="padding:20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;color:#888;font-size:12px;width:140px;">Client</td>
                  <td style="padding:6px 0;color:#1a1a2e;font-size:13px;font-weight:600;">${data.clientPrenom} ${data.clientNom}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#888;font-size:12px;">Type de client</td>
                  <td style="padding:6px 0;color:#333;font-size:13px;">${data.clientType}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#888;font-size:12px;">Bien</td>
                  <td style="padding:6px 0;color:#333;font-size:13px;font-weight:500;">${data.bienTitre}</td>
                </tr>
                ${data.bienAdresse ? `<tr>
                  <td style="padding:6px 0;color:#888;font-size:12px;">Adresse</td>
                  <td style="padding:6px 0;color:#333;font-size:13px;">${data.bienAdresse}</td>
                </tr>` : ''}
                <tr>
                  <td style="padding:6px 0;color:#888;font-size:12px;">Type de mandat</td>
                  <td style="padding:6px 0;color:#333;font-size:13px;">${data.mandatType}</td>
                </tr>
                ${data.mandatNumero ? `<tr>
                  <td style="padding:6px 0;color:#888;font-size:12px;">N° Mandat</td>
                  <td style="padding:6px 0;color:#333;font-size:13px;">${data.mandatNumero}</td>
                </tr>` : ''}
                <tr>
                  <td style="padding:6px 0;color:#888;font-size:12px;">Date d'expiration</td>
                  <td style="padding:6px 0;color:#e74c3c;font-size:13px;font-weight:600;">${data.dateExpiration}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#888;font-size:12px;">Statut</td>
                  <td style="padding:6px 0;"><span style="background:#fef2f2;color:#dc2626;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600;">EXPIRE</span></td>
                </tr>
              </table>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
            <tr><td align="center">
              <a href="#" style="display:inline-block;background:#1a1a2e;color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">Acceder au CRM</a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="background:#f8f9fb;padding:16px 32px;border-top:1px solid #e8ecf1;">
          <p style="margin:0;color:#999;font-size:11px;text-align:center;">
            Email envoye automatiquement par Square Meter le ${today} | Ne pas repondre a cet email
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim()
}

function buildMandatExpireCrmMessage(data: {
  bienTitre: string
  bienAdresse?: string
  clientPrenom: string
  clientNom: string
  clientType: string
  mandatType: string
  mandatNumero?: string
  dateExpiration: string
}): string {
  const lines = [
    `Mandat ${data.mandatType} expire`,
    ``,
    `Client : ${data.clientPrenom} ${data.clientNom} (${data.clientType})`,
    `Bien : ${data.bienTitre}`,
  ]
  if (data.bienAdresse) lines.push(`Adresse : ${data.bienAdresse}`)
  if (data.mandatNumero) lines.push(`N\u00b0 Mandat : ${data.mandatNumero}`)
  lines.push(`Date d'expiration : ${data.dateExpiration}`)
  lines.push(`Statut : Expir\u00e9`)
  lines.push(``, `Merci de prendre les dispositions n\u00e9cessaires.`)
  return lines.join(`\n`)
}

function buildMandatExpireCrmHtml(data: {
  bienTitre: string
  bienAdresse?: string
  clientPrenom: string
  clientNom: string
  clientType: string
  mandatType: string
  mandatNumero?: string
  dateExpiration: string
  agentNom: string
}): string {
  const clientFullName = `${data.clientPrenom} ${data.clientNom}`
  return `
<div style="font-family:'Segoe UI',Roboto,sans-serif;padding:24px;background:#f8f6ff;border-radius:12px;border:1px solid #e4d9ff;">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #e4d9ff;">
    <div style="width:36px;height:36px;border-radius:10px;background:#7c3aed;display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;">&#x1F514;</div>
    <div>
      <div style="font-size:13px;font-weight:700;color:#1a1a2e;">Mandat expir\u00e9</div>
      <div style="font-size:11px;color:#7c3aed;">Notification CRM - Square Meter</div>
    </div>
  </div>
  <div style="background:#ffffff;border-radius:8px;border:1px solid #ede9fe;padding:16px;">
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:5px 0;color:#888;font-size:11px;width:100px;">Client</td><td style="padding:5px 0;color:#1a1a2e;font-size:12px;font-weight:600;">${clientFullName}</td></tr>
      <tr><td style="padding:5px 0;color:#888;font-size:11px;">Type</td><td style="padding:5px 0;color:#333;font-size:12px;">${data.clientType}</td></tr>
      <tr><td style="padding:5px 0;color:#888;font-size:11px;">Bien</td><td style="padding:5px 0;color:#333;font-size:12px;font-weight:500;">${data.bienTitre}</td></tr>
      ${data.bienAdresse ? `<tr><td style="padding:5px 0;color:#888;font-size:11px;">Adresse</td><td style="padding:5px 0;color:#333;font-size:12px;">${data.bienAdresse}</td></tr>` : ''}
      <tr><td style="padding:5px 0;color:#888;font-size:11px;">Mandat</td><td style="padding:5px 0;color:#333;font-size:12px;">${data.mandatType}${data.mandatNumero ? ` - ${data.mandatNumero}` : ''}</td></tr>
      <tr><td style="padding:5px 0;color:#888;font-size:11px;">Expiration</td><td style="padding:5px 0;color:#dc2626;font-size:12px;font-weight:600;">${data.dateExpiration}</td></tr>
    </table>
  </div>
  <div style="margin-top:16px;padding:12px;background:#fef2f2;border-radius:8px;border:1px solid #fecaca;text-align:center;">
    <span style="background:#dc2626;color:#fff;padding:3px 14px;border-radius:10px;font-size:10px;font-weight:700;">EXPIR\u00c9</span>
  </div>
  <div style="margin-top:16px;font-size:11px;color:#999;text-align:center;padding-top:12px;border-top:1px solid #e4d9ff;">
    Notification CRM g\u00e9n\u00e9r\u00e9e par Square Meter le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
  </div>
</div>`.trim()
}

export function AutomatorProvider({ children }: { children: ReactNode }) {
  const [automators, setAutomators] = useState<Automator[]>([])
  const [triggeredNotifications, setTriggeredNotifications] = useState<TriggeredNotification[]>([])
  const [logs, setLogs] = useState<AutomatorLog[]>([])
  const [loaded, setLoaded] = useState(false)
  const deletionTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const triggeredClientKeysRef = useState<Set<string>>(new Set())[0]

  useEffect(() => {
    let cancelled = false
    Promise.all([
      api.get<Automator[]>('/automators').catch(() => [] as Automator[]),
      api.get<TriggeredNotification[]>('/automators/notifications').catch(() => [] as TriggeredNotification[]),
      api.get<AutomatorLog[]>('/automators/logs/all').catch(() => [] as AutomatorLog[]),
    ]).then(([automatorsData, notifsData, logsData]) => {
      if (cancelled) return
      setAutomators(automatorsData)
      setTriggeredNotifications(notifsData)
      setLogs(logsData)
      setLoaded(true)
    })
    return () => { cancelled = true }
  }, [])

  const refreshFromApi = useCallback(() => {
    Promise.all([
      api.get<Automator[]>('/automators').catch(() => [] as Automator[]),
      api.get<TriggeredNotification[]>('/automators/notifications').catch(() => [] as TriggeredNotification[]),
      api.get<AutomatorLog[]>('/automators/logs/all').catch(() => [] as AutomatorLog[]),
    ]).then(([automatorsData, notifsData, logsData]) => {
      setAutomators(automatorsData)
      setTriggeredNotifications(notifsData)
      setLogs(logsData)
    })
  }, [])

  useEffect(() => {
    const handler = () => refreshFromApi()
    window.addEventListener('sq:triggered-notifs-changed', handler)
    return () => window.removeEventListener('sq:triggered-notifs-changed', handler)
  }, [refreshFromApi])

  useEffect(() => {
    if (!loaded) return
    const interval = setInterval(() => refreshFromApi(), 15000)
    return () => clearInterval(interval)
  }, [loaded, refreshFromApi])

  useEffect(() => {
    if (!loaded) return
    const now = Date.now()
    const THIRTY_MIN = 30 * 60 * 1000
    const toRemove: string[] = []
    setTriggeredNotifications(prev => {
      const next = prev.filter(n => {
        if (n.read && n.readAt) {
          const elapsed = now - new Date(n.readAt).getTime()
          if (elapsed >= THIRTY_MIN) {
            return false
          }
          scheduleDeletion(n.id, n.readAt)
        }
        return true
      })
      return next
    })
    return () => {
      deletionTimersRef.current.forEach(t => clearTimeout(t))
      deletionTimersRef.current.clear()
    }
  }, [loaded])

  const scheduleDeletion = useCallback((id: string, readAt: string) => {
    const timerId = setTimeout(() => {
      setTriggeredNotifications(prev => prev.filter(n => n.id !== id))
      deletionTimersRef.current.delete(id)
    }, new Date(readAt).getTime() + 30 * 60 * 1000 - Date.now())
    deletionTimersRef.current.set(id, timerId)
  }, [])

  const unreadCount = triggeredNotifications.filter(n => !n.read).length
  const totalExecutions = logs.length
  const totalSuccess = logs.filter(l => l.statut === 'succes').length
  const totalFailed = logs.filter(l => l.statut === 'echec').length
  const totalPending = triggeredNotifications.filter(n => !n.read).length

  const addAutomator = useCallback(async (input: AddAutomatorInput) => {
    const created = await api.post<Automator>('/automators', input as unknown as Record<string, unknown>)
    setAutomators(prev => [created, ...prev])
    return created
  }, [])

  const updateAutomator = useCallback(async (input: UpdateAutomatorInput) => {
    try {
      const { id, ...data } = input
      const updated = await api.put<Automator>(`/automators/${id}`, data as unknown as Record<string, unknown>)
      setAutomators(prev => prev.map(a => a.id === id ? updated : a))
    } catch (err) {
      console.error('Failed to update automator:', err)
    }
  }, [])

  const toggleAutomator = useCallback(async (id: number) => {
    try {
      const updated = await api.patch<Automator>(`/automators/${id}/toggle`)
      setAutomators(prev => prev.map(a => a.id === id ? updated : a))
    } catch (err) {
      console.error('Failed to toggle automator:', err)
    }
  }, [])

  const deleteAutomator = useCallback(async (id: number) => {
    try {
      await api.del(`/automators/${id}`)
      setAutomators(prev => prev.filter(a => a.id !== id))
    } catch (err) {
      console.error('Failed to delete automator:', err)
    }
  }, [])

  const triggerInactivityCheck = useCallback(async () => {
    try {
      await api.post('/automators/trigger-inactivity', {})
      refreshFromApi()
    } catch (err) {
      console.error('Failed to trigger inactivity check:', err)
    }
  }, [refreshFromApi])

  const triggerSeedInactiveAgent = useCallback(async () => {
    const result = await api.post<any>('/automators/seed-inactive-agent', {})
    return result
  }, [])

  const addLog = useCallback(async (log: Omit<AutomatorLog, 'id'>) => {
    try {
      const created = await api.post<AutomatorLog>('/automators/logs', log as unknown as Record<string, unknown>)
      setLogs(prev => [created, ...prev])
    } catch (err) {
      console.error('Failed to create log:', err)
    }
  }, [])

  const triggerMandatExpire = useCallback(async (data: {
    bienTitre: string
    bienAdresse?: string
    clientPrenom: string
    clientNom: string
    clientType: string
    mandatType: string
    mandatNumero?: string
    dateExpiration: string
    agentNom: string
    agentEmail?: string
    automatorId?: number
    channels: ('email' | 'crm')[]
  }) => {
    const now = new Date().toISOString()
    const clientFullName = `${data.clientPrenom} ${data.clientNom}`
    const eventId = 'vendeur_mandat_expire'

    const emailObjet = `Mandat expir\u00e9 - ${data.bienTitre}`
    const emailHtml = buildMandatExpireEmailHtml(data)
    const crmMessage = buildMandatExpireCrmMessage(data)
    const crmHtml = buildMandatExpireCrmHtml(data)

    const newLogs: Omit<AutomatorLog, 'id'>[] = []
    const newNotifs: Omit<TriggeredNotification, 'id'>[] = []

    data.channels.forEach(ch => {
      if (ch === 'email') {
        newNotifs.push({
          eventId,
          eventLabel: 'Mandat expir\u00e9',
          categorie: 'contrats',
          channel: 'email',
          title: `Email envoy\u00e9 - Mandat expir\u00e9 - ${data.bienTitre}`,
          message: `Email envoy\u00e9 \u00e0 ${data.agentNom} : ${emailObjet}\nClient : ${clientFullName} | Bien : ${data.bienTitre}`,
          emailHtml,
          agentNom: data.agentNom,
          bienTitre: data.bienTitre,
          clientNom: clientFullName,
          clientType: data.clientType,
          mandatType: data.mandatType,
          dateExpiration: data.dateExpiration,
          dateTriggered: now,
          read: false,
        })
        newLogs.push({
          automatorId: data.automatorId || 0,
          evenement: 'Mandat expir\u00e9',
          destinataire: data.agentNom,
          statut: 'succes' as LogStatut,
          executeLe: now,
          contenu: `Email envoy\u00e9 \u00e0 ${data.agentNom} (${data.agentEmail || 'N/A'}) : ${emailObjet} | Client : ${clientFullName} | Bien : ${data.bienTitre}`,
        })
      } else {
        newNotifs.push({
          eventId,
          eventLabel: 'Mandat expir\u00e9',
          categorie: 'contrats',
          channel: 'crm',
          title: `Mandat expir\u00e9 - ${clientFullName} - ${data.bienTitre}`,
          message: `Mandat expir\u00e9 - ${clientFullName} (${data.clientType})`,
          crmHtml,
          agentNom: data.agentNom,
          bienTitre: data.bienTitre,
          clientNom: clientFullName,
          clientType: data.clientType,
          mandatType: data.mandatType,
          dateExpiration: data.dateExpiration,
          dateTriggered: now,
          read: false,
        })
        newLogs.push({
          automatorId: data.automatorId || 0,
          evenement: 'Mandat expir\u00e9',
          destinataire: data.agentNom,
          statut: 'succes' as LogStatut,
          executeLe: now,
          contenu: `Notification CRM affich\u00e9e : Mandat expir\u00e9 - ${data.bienTitre} | Client : ${clientFullName}`,
        })
      }
    })

    const createdNotifs: TriggeredNotification[] = []
    for (const n of newNotifs) {
      try {
        const created = await api.post<TriggeredNotification>('/automators/notifications', n as unknown as Record<string, unknown>)
        createdNotifs.push(created)
      } catch {}
    }
    const createdLogs: AutomatorLog[] = []
    for (const l of newLogs) {
      try {
        const created = await api.post<AutomatorLog>('/automators/logs', l as unknown as Record<string, unknown>)
        createdLogs.push(created)
      } catch {}
    }
    if (createdNotifs.length > 0) {
      setTriggeredNotifications(prev => [...createdNotifs, ...prev])
    }
    if (createdLogs.length > 0) {
      setLogs(prev => [...createdLogs, ...prev])
    }
    if (createdNotifs.length > 0 || createdLogs.length > 0) {
      window.dispatchEvent(new CustomEvent('sq:triggered-notifs-changed'))
    }
  }, [])

  const markAsRead = useCallback(async (id: string) => {
    const readAt = new Date().toISOString()
    setTriggeredNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true, readAt } : n)
    )
    try {
      await api.put(`/automators/notifications/${id}/read`)
    } catch {}
    scheduleDeletion(id, readAt)
  }, [scheduleDeletion])

  const markAllAsRead = useCallback(async () => {
    const readAt = new Date().toISOString()
    setTriggeredNotifications(prev => {
      prev.forEach(n => { if (!n.read) scheduleDeletion(n.id, readAt) })
      return prev.map(n => ({ ...n, read: true, readAt }))
    })
    try {
      await api.put('/automators/notifications/read-all')
    } catch {}
  }, [scheduleDeletion])

  const getUnreadCount = useCallback(() => {
    return triggeredNotifications.filter(n => !n.read).length
  }, [triggeredNotifications])

  const checkExpiredMandats = useCallback((clients: Array<{
    id: string
    name: string
    type: string
    area?: string
    dateExpiration?: string
    statutMandat?: string
    typeMandat?: string
    numeroMandat?: string
    propertyType?: string
    agentId?: string
  }>, getAgentName: (agentId?: string) => string) => {
    const now = new Date()
    let hasNew = false
    const newLogsBatch: Omit<AutomatorLog, 'id'>[] = []
    const newNotifsBatch: Omit<TriggeredNotification, 'id'>[] = []

    for (const c of clients) {
      const key = `${c.id}_expire`
      if (triggeredClientKeysRef.has(key)) continue

      const isStatusExpired = c.statutMandat === 'Expire'
      const isDateExpired = c.dateExpiration && new Date(c.dateExpiration) <= now

      if (!isStatusExpired && !isDateExpired) continue

      triggeredClientKeysRef.add(key)
      hasNew = true

      const clientParts = (c.name || '').split(' ')
      const prenom = clientParts[0] || ''
      const nom = clientParts.slice(1).join(' ') || ''
      const clientType = c.type || 'Vendeur'

      const emailObjet = `Mandat expir\u00e9 - ${c.propertyType || 'Bien'} - ${c.area || ''}`
      const emailHtml = buildMandatExpireEmailHtml({
        bienTitre: `${c.propertyType || 'Bien'} - ${c.area || ''}`.trim(),
        bienAdresse: c.area,
        clientPrenom: prenom,
        clientNom: nom,
        clientType,
        mandatType: c.typeMandat || 'Mandat standard',
        mandatNumero: c.numeroMandat,
        dateExpiration: c.dateExpiration ? new Date(c.dateExpiration).toLocaleDateString('fr-FR') : now.toLocaleDateString('fr-FR'),
        agentNom: getAgentName(c.agentId),
      })
      const crmMessage = buildMandatExpireCrmMessage({
        bienTitre: `${c.propertyType || 'Bien'} - ${c.area || ''}`.trim(),
        bienAdresse: c.area,
        clientPrenom: prenom,
        clientNom: nom,
        clientType,
        mandatType: c.typeMandat || 'Mandat standard',
        mandatNumero: c.numeroMandat,
        dateExpiration: c.dateExpiration ? new Date(c.dateExpiration).toLocaleDateString('fr-FR') : now.toLocaleDateString('fr-FR'),
      })
      const crmHtml = buildMandatExpireCrmHtml({
        bienTitre: `${c.propertyType || 'Bien'} - ${c.area || ''}`.trim(),
        bienAdresse: c.area,
        clientPrenom: prenom,
        clientNom: nom,
        clientType,
        mandatType: c.typeMandat || 'Mandat standard',
        mandatNumero: c.numeroMandat,
        dateExpiration: c.dateExpiration ? new Date(c.dateExpiration).toLocaleDateString('fr-FR') : now.toLocaleDateString('fr-FR'),
        agentNom: getAgentName(c.agentId),
      })

      const clientFullNameCheck = `${prenom} ${nom}`

      newNotifsBatch.push({
        eventId: 'vendeur_mandat_expire',
        eventLabel: 'Mandat expir\u00e9',
        categorie: 'contrats',
        channel: 'crm',
        title: `Mandat expir\u00e9 - ${clientFullNameCheck} - ${c.propertyType || 'Bien'} ${c.area || ''}`.trim(),
        message: `Mandat expir\u00e9 - ${clientFullNameCheck} (${clientType})`,
        crmHtml,
        agentNom: getAgentName(c.agentId),
        bienTitre: `${c.propertyType || 'Bien'} - ${c.area || ''}`.trim(),
        clientNom: `${prenom} ${nom}`,
        clientType,
        mandatType: c.typeMandat || 'Mandat standard',
        dateExpiration: c.dateExpiration ? new Date(c.dateExpiration).toLocaleDateString('fr-FR') : now.toLocaleDateString('fr-FR'),
        dateTriggered: now.toISOString(),
        read: false,
      })

      newLogsBatch.push({
        automatorId: 0,
        evenement: 'Mandat expir\u00e9',
        destinataire: getAgentName(c.agentId),
        statut: 'succes' as LogStatut,
        executeLe: now.toISOString(),
        contenu: `D\u00e9tection automatique : Mandat expir\u00e9 - ${prenom} ${nom} (${clientType}) | ${c.propertyType || 'Bien'} - ${c.area || ''}`,
      })
    }

    if (hasNew) {
      Promise.all([
        ...newNotifsBatch.map(n => api.post<TriggeredNotification>('/automators/notifications', n as unknown as Record<string, unknown>).catch(() => null)),
        ...newLogsBatch.map(l => api.post<AutomatorLog>('/automators/logs', l as unknown as Record<string, unknown>).catch(() => null)),
      ]).then(results => {
        const notifResults = results.slice(0, newNotifsBatch.length).filter(Boolean) as TriggeredNotification[]
        const logResults = results.slice(newNotifsBatch.length).filter(Boolean) as AutomatorLog[]
        if (notifResults.length > 0) setTriggeredNotifications(prev => [...notifResults, ...prev])
        if (logResults.length > 0) setLogs(prev => [...logResults, ...prev])
        if (notifResults.length > 0 || logResults.length > 0) {
          window.dispatchEvent(new CustomEvent('sq:triggered-notifs-changed'))
        }
      })
    }
  }, [triggeredClientKeysRef])

  return (
    <AutomatorContext.Provider value={{
      automators,
      addAutomator,
      updateAutomator,
      toggleAutomator,
      deleteAutomator,
      triggerInactivityCheck,
      triggerSeedInactiveAgent,
      triggeredNotifications,
      unreadCount,
      logs,
      addLog,
      totalExecutions,
      totalSuccess,
      totalFailed,
      totalPending,
      triggerMandatExpire,
      markAsRead,
      markAllAsRead,
      getUnreadCount,
      checkExpiredMandats,
    }}>
      {children}
    </AutomatorContext.Provider>
  )
}
