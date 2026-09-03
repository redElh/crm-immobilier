/**
 * Notify squaremeter.ma (and any revalidation/webhook targets) that a vacances calendar changed.
 * Fire-and-forget — failures are logged but never block the CRM save.
 *
 * Env (all optional, option A = no webhook needed for instant API reads):
 *   SQUAREMETER_WEBHOOK_URL        — e.g. https://www.squaremeter.ma/api/revalidate-vacances
 *   SQUAREMETER_REVALIDATE_URL     — alias
 *   SQUAREMETER_WEBHOOK_SECRET     — sent as X-Webhook-Secret / Bearer
 *   SQUAREMETER_WEBHOOK_TOKEN      — alias
 *
 * Payload: { type:'vacances.calendar.updated', propertyId, reservedDates, timestamp, source:'crm-toolbox' }
 *
 * For truly instant UX without webhook, keep public API Cache-Control short (max-age=5)
 * and have squaremeter.ma fetch with { cache:'no-store' } or { next:{ revalidate:0 } }.
 */

const DEFAULT_TIMEOUT_MS = 5000

function getWebhookConfig() {
  const url = process.env.SQUAREMETER_WEBHOOK_URL || process.env.SQUAREMETER_REVALIDATE_URL || ''
  const secret = process.env.SQUAREMETER_WEBHOOK_SECRET || process.env.SQUAREMETER_WEBHOOK_TOKEN || process.env.SQUAREMETER_REVALIDATE_SECRET || ''
  return { url: url.trim(), secret: secret.trim() }
}

async function postWithTimeout(url, options, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: ctrl.signal })
  } finally {
    clearTimeout(id)
  }
}

export async function notifyVacancesUpdate(propertyId, reservedDates) {
  const { url, secret } = getWebhookConfig()
  // Always log for observability, even if no webhook configured
  console.log(`[VacancesNotify] property ${propertyId} -> ${reservedDates.length} dates | webhook=${url ? 'yes' : 'none'}`)

  // 1) Optional HTTP webhook to www.squaremeter.ma (revalidate ISR / purge CDN)
  if (url) {
    try {
      const payload = {
        type: 'vacances.calendar.updated',
        propertyId: String(propertyId),
        reservedDates,
        count: reservedDates.length,
        timestamp: new Date().toISOString(),
        source: 'crm-toolbox',
      }
      const headers = { 'Content-Type': 'application/json' }
      if (secret) {
        headers['X-Webhook-Secret'] = secret
        headers['Authorization'] = `Bearer ${secret}`
      }
      const res = await postWithTimeout(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })
      const body = await res.text().catch(() => '')
      if (!res.ok) {
        console.warn(`[VacancesNotify] webhook ${url} -> ${res.status} ${body.slice(0, 300)}`)
      } else {
        console.log(`[VacancesNotify] webhook OK ${res.status}`)
      }
    } catch (e) {
      console.warn('[VacancesNotify] webhook failed', e?.message || e)
    }
  }

  // 2) Optional Cloudflare cache purge (if CF credentials are set)
  //    Lets api.squaremeter.ma responses be instantly fresh even when CDN cached.
  const cfZone = process.env.CF_ZONE_ID
  const cfToken = process.env.CF_API_TOKEN
  const backendOrigin = process.env.BACKEND_URL || 'https://api.squaremeter.ma'
  if (cfZone && cfToken && propertyId) {
    try {
      const purgeUrl = `https://api.cloudflare.com/client/v4/zones/${cfZone}/purge_cache`
      const files = [
        `${backendOrigin}/api/public/vacances/reservations/${propertyId}`,
        `${backendOrigin}/api/public/vacances/calendar`,
        `${backendOrigin}/api/public/vacances/reservations?ids=${propertyId}`,
      ]
      const res = await postWithTimeout(purgeUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cfToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files }),
      })
      if (!res.ok) console.warn('[VacancesNotify] CF purge failed', res.status)
      else console.log('[VacancesNotify] CF purge OK')
    } catch (e) {
      console.warn('[VacancesNotify] CF purge error', e?.message || e)
    }
  }

  // 3) In-process hook for any WS/SSE broadcaster (squaremeter.ma could subscribe via WS if desired)
  //    We try to import ws/server dynamically to avoid circular dep.
  try {
    const { broadcastVacancesUpdate } = await import('./vacancesBroadcast.service.js').catch(() => ({}))
    if (typeof broadcastVacancesUpdate === 'function') {
      broadcastVacancesUpdate(String(propertyId), reservedDates)
    }
  } catch (_) {}
}
