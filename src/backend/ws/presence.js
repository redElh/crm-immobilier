// In-memory presence store.
// userId (number) -> { status, lastSeen }
// `status` is one of 'online' | 'away' | 'offline'
// - online  : user is on a Messages page (reported by the frontend reporter)
// - away    : user is elsewhere in the CRM, or closed the window
// - offline : user explicitly logged out
const presence = new Map();

export function setPresence(userId, status) {
  const existing = presence.get(Number(userId));
  // Keep `lastSeen` stable while the status does not change (e.g. repeated
  // "away" heartbeats), so the inactivity duration the other clients compute
  // keeps counting up from the moment the status was entered.
  if (existing && existing.status === status) {
    return existing;
  }
  const record = { status, lastSeen: Date.now() };
  presence.set(Number(userId), record);
  return record;
}

export function getPresence(userId) {
  return presence.get(Number(userId)) || null;
}
