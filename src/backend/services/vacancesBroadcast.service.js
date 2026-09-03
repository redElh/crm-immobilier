/**
 * Lightweight in-memory pub/sub for vacances calendar updates.
 * CRM WS clients (and any external SSE) can subscribe.
 * This is the instant path complementing the webhook: squaremeter.ma could also
 * subscribe via WebSocket to wss://api.squaremeter.ma/ws?channel=vacances or SSE.
 */

const listeners = new Set()

export function broadcastVacancesUpdate(propertyId, reservedDates) {
  const payload = {
    type: 'vacances.calendar.updated',
    propertyId: String(propertyId),
    reservedDates,
    count: reservedDates.length,
    timestamp: new Date().toISOString(),
  }
  for (const fn of listeners) {
    try { fn(payload) } catch (_) {}
  }
  // Also try to push via existing WS server broadcastToAll if available
  try {
    // dynamic import to avoid hard dep
    import('../ws/server.js').then(m => {
      if (typeof m.broadcastToAll === 'function') {
        m.broadcastToAll(payload)
      }
    }).catch(() => {})
  } catch (_) {}
}

export function onVacancesUpdate(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
