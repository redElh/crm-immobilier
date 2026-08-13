import { api } from './api'

const EVENT_NAME = 'sq:triggered-notifs-changed'

export interface TriggerData {
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
  bienConcerneId?: string
  agentId?: string
}

function generateEmailHtml(d: TriggerData): string {
  const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Roboto,sans-serif;background:#f4f5f7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr><td style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:28px 32px;">
          <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">Mandat expir\u00e9</h1>
          <p style="margin:6px 0 0;color:#a8b2d1;font-size:13px;">Square Meter - Notification automator</p>
        </td></tr>
        <tr><td style="padding:28px 32px;">
          <p style="margin:0 0 16px;color:#333;font-size:14px;">Bonjour <strong>${d.agentNom}</strong>,</p>
          <p style="margin:0 0 20px;color:#555;font-size:13px;line-height:1.6;">Le mandat pour le bien suivant a expir\u00e9. Veuillez prendre les dispositions n\u00e9cessaires.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fb;border-radius:8px;border:1px solid #e8ecf1;">
            <tr><td style="padding:20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:6px 0;color:#888;font-size:12px;width:140px;">Client</td><td style="padding:6px 0;color:#1a1a2e;font-size:13px;font-weight:600;">${d.clientPrenom} ${d.clientNom}</td></tr>
                <tr><td style="padding:6px 0;color:#888;font-size:12px;">Type</td><td style="padding:6px 0;color:#333;font-size:13px;">${d.clientType}</td></tr>
                <tr><td style="padding:6px 0;color:#888;font-size:12px;">Bien</td><td style="padding:6px 0;color:#333;font-size:13px;font-weight:500;">${d.bienTitre}</td></tr>
                ${d.bienAdresse ? `<tr><td style="padding:6px 0;color:#888;font-size:12px;">Adresse</td><td style="padding:6px 0;color:#333;font-size:13px;">${d.bienAdresse}</td></tr>` : ''}
                <tr><td style="padding:6px 0;color:#888;font-size:12px;">Mandat</td><td style="padding:6px 0;color:#333;font-size:13px;">${d.mandatType}${d.mandatNumero ? ` - ${d.mandatNumero}` : ''}</td></tr>
                <tr><td style="padding:6px 0;color:#888;font-size:12px;">Expiration</td><td style="padding:6px 0;color:#e74c3c;font-size:13px;font-weight:600;">${d.dateExpiration}</td></tr>
                <tr><td style="padding:6px 0;color:#888;font-size:12px;">Statut</td><td style="padding:6px 0;"><span style="background:#fef2f2;color:#dc2626;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600;">EXPIR\u00c9</span></td></tr>
              </table>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="background:#f8f9fb;padding:16px 32px;border-top:1px solid #e8ecf1;">
          <p style="margin:0;color:#999;font-size:11px;text-align:center;">Email envoy\u00e9 automatiquement par Square Meter le ${today}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`.trim()
}

function generateCrmHtml(d: TriggerData): string {
  const clientFullName = `${d.clientPrenom} ${d.clientNom}`
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
      <tr><td style="padding:5px 0;color:#888;font-size:11px;">Type</td><td style="padding:5px 0;color:#333;font-size:12px;">${d.clientType}</td></tr>
      <tr><td style="padding:5px 0;color:#888;font-size:11px;">Bien</td><td style="padding:5px 0;color:#333;font-size:12px;font-weight:500;">${d.bienTitre}</td></tr>
      ${d.bienAdresse ? `<tr><td style="padding:5px 0;color:#888;font-size:11px;">Adresse</td><td style="padding:5px 0;color:#333;font-size:12px;">${d.bienAdresse}</td></tr>` : ''}
      <tr><td style="padding:5px 0;color:#888;font-size:11px;">Mandat</td><td style="padding:5px 0;color:#333;font-size:12px;">${d.mandatType}${d.mandatNumero ? ` - ${d.mandatNumero}` : ''}</td></tr>
      <tr><td style="padding:5px 0;color:#888;font-size:11px;">Expiration</td><td style="padding:5px 0;color:#dc2626;font-size:12px;font-weight:600;">${d.dateExpiration}</td></tr>
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

async function resolvePropertyTitle(bienConcerneId?: string): Promise<{ bienTitre: string; bienAdresse: string } | null> {
  if (!bienConcerneId) return null
  try {
    const property = await api.get<any>(`/properties/${bienConcerneId}`)
    if (property) {
      const title = property.title || property.reference || `Bien #${property.id}`
      const city = property.city || ''
      const address = property.address || ''
      return {
        bienTitre: city ? `${title} - ${city}` : title,
        bienAdresse: address,
      }
    }
  } catch (e) {
    console.warn('Failed to fetch property for bienConcerneId:', bienConcerneId, e)
  }
  return null
}

async function sendEmailToBackend(to: string, subject: string, html: string, agentNom: string) {
  try {
    await api.post('/notifications/send-automator-email', {
      to, subject, html, agentName: agentNom,
    })
    return true
  } catch (e) {
    console.error('Failed to send automator email:', e)
    return false
  }
}

async function findOrCreateAutomator(eventId: string, now: string, agentName?: string): Promise<number> {
  try {
    const automators = await api.get<any[]>('/automators')
    const matching = automators.find((a: any) => a.actif && a.eventId === eventId)
    if (matching) {
      return matching.id
    }
    const created = await api.post<any>('/automators', {
      modeleId: 7,
      eventId,
      niveau: 'agence',
      niveauLabel: 'Square Meter',
      createdBy: agentName || 'Agent',
      actif: true,
      frequence: 'Imm\u00e9diat',
      notifications: [{
        canal: 'email',
        actif: true,
        langue: 'fr',
        objetTemplate: 'Mandat expir\u00e9 - {{bien.titre}}',
        messageTemplate: 'Notification automator pour mandat expir\u00e9',
        destinataires: ['agent', 'contact'],
      }],
    })
    return created.id
  } catch (e) {
    console.warn('Could not find/create automator via API, using fallback', e)
    return Date.now()
  }
}

export async function triggerMandatExpireNotification(data: TriggerData) {
  const now = new Date().toISOString()
  const clientFullName = `${data.clientPrenom} ${data.clientNom}`

  const eventId = 'vendeur_mandat_expire'

  const resolved = data.bienConcerneId ? await resolvePropertyTitle(data.bienConcerneId) : null
  const bienTitre = resolved?.bienTitre || data.bienTitre
  const bienAdresse = resolved?.bienAdresse || data.bienAdresse

  const emailHtml = generateEmailHtml({ ...data, bienTitre, bienAdresse })
  const crmHtml = generateCrmHtml({ ...data, bienTitre, bienAdresse })

  const automatorId = await findOrCreateAutomator(eventId, now, data.agentNom)

  const newNotifs: any[] = []
  const newLogs: any[] = []

  const emailNotif = {
    eventId,
    eventLabel: 'Mandat expir\u00e9',
    categorie: 'contrats',
    channel: 'email',
    title: `Email envoy\u00e9 - Mandat expir\u00e9 - ${bienTitre}`,
    message: `Email envoy\u00e9 \u00e0 ${data.agentNom} : Mandat expir\u00e9 - ${bienTitre}\nClient : ${clientFullName}`,
    emailHtml,
    agentNom: data.agentNom,
    bienTitre,
    clientNom: clientFullName,
    clientType: data.clientType,
    mandatType: data.mandatType,
    dateExpiration: data.dateExpiration,
    dateTriggered: now,
    read: false,
  }

  const crmNotif = {
    eventId,
    eventLabel: 'Mandat expir\u00e9',
    categorie: 'contrats',
    channel: 'crm',
    title: `Mandat expir\u00e9 - ${clientFullName} - ${bienTitre}`,
    message: `Mandat expir\u00e9 - ${clientFullName} (${data.clientType})`,
    crmHtml,
    agentNom: data.agentNom,
    bienTitre,
    clientNom: clientFullName,
    clientType: data.clientType,
    mandatType: data.mandatType,
    dateExpiration: data.dateExpiration,
    dateTriggered: now,
    read: false,
  }

  const logEntry = {
    automatorId,
    evenement: 'Mandat expir\u00e9',
    destinataire: data.agentNom,
    statut: 'succes',
    executeLe: now,
    contenu: `D\u00e9clench\u00e9 depuis formulaire client : ${data.clientPrenom} ${data.clientNom} (${data.clientType}) | ${bienTitre}`,
  }

  try {
    const createdEmail = await api.post<any>('/automators/notifications', emailNotif)
    newNotifs.push(createdEmail)
  } catch {}
  try {
    const createdCrm = await api.post<any>('/automators/notifications', crmNotif)
    newNotifs.push(createdCrm)
  } catch {}
  try {
    const createdLog = await api.post<any>('/automators/logs', logEntry)
    newLogs.push(createdLog)
  } catch {}

  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: newNotifs.length }))

  if (data.agentEmail) {
    sendEmailToBackend(data.agentEmail, `Mandat expir\u00e9 - ${bienTitre}`, emailHtml, data.agentNom)
  }
}
