import pool from '../config/db.js';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_CAL_API = 'https://www.googleapis.com/calendar/v3';
const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/calendar.events';

export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5001';
export const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

export function getRedirectUri() {
  return (
    process.env.CLIENT_GOOGLE_CALENDAR_REDIRECT_URI ||
    process.env.GOOGLE_CALENDAR_REDIRECT_URI ||
    `${BACKEND_URL}/api/auth/google/callback`
  );
}

export function getClientConfig() {
  return {
    clientId: process.env.CLIENT_GOOGLE_CALENDAR_ID || process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.CLIENT_GOOGLE_CALENDAR_SECRET || process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: getRedirectUri(),
  };
}

function encodeState(data) {
  return Buffer.from(JSON.stringify(data)).toString('base64url');
}

function decodeState(state) {
  try {
    const data = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
    if (!data || !data.userId) return null;
    return data;
  } catch {
    return null;
  }
}

export function buildAuthUrl(userId, returnPath = '/calendar') {
  const { clientId, redirectUri } = getClientConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    state: encodeState({ userId: String(userId), path: returnPath, ts: Date.now() }),
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export function parseCallbackState(state) {
  const data = decodeState(state);
  if (!data) return null;
  if (Date.now() - (data.ts || 0) > 10 * 60 * 1000) return null;
  return { userId: String(data.userId), path: data.path || '/calendar' };
}

export async function exchangeCode(code) {
  const { clientId, clientSecret, redirectUri } = getClientConfig();
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || 'Token exchange failed');
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || '',
    expiresIn: Number(data.expires_in || 3600),
    scope: data.scope || '',
  };
}

async function refreshAccessToken(refreshToken) {
  const { clientId, clientSecret } = getClientConfig();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || 'Token refresh failed');
  }
  return {
    accessToken: data.access_token,
    expiresIn: Number(data.expires_in || 3600),
  };
}

export async function storeTokens(userId, { accessToken, refreshToken, expiresIn, email }) {
  const expiry = new Date(Date.now() + expiresIn * 1000);
  await pool.query(
    `INSERT INTO google_calendar_tokens (user_id, access_token, refresh_token, token_expiry, google_email, updated_at)
     VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
     ON CONFLICT (user_id) DO UPDATE SET
       access_token = EXCLUDED.access_token,
       refresh_token = CASE WHEN EXCLUDED.refresh_token <> '' THEN EXCLUDED.refresh_token ELSE google_calendar_tokens.refresh_token END,
       token_expiry = EXCLUDED.token_expiry,
       google_email = EXCLUDED.google_email,
       updated_at = CURRENT_TIMESTAMP`,
    [userId, accessToken, refreshToken, expiry, email || '']
  );
}

async function getTokenRow(userId) {
  const { rows } = await pool.query(
    'SELECT * FROM google_calendar_tokens WHERE user_id = $1',
    [userId]
  );
  return rows[0] || null;
}

export async function getConnectionStatus(userId) {
  const row = await getTokenRow(userId);
  if (!row) return { connected: false };
  return {
    connected: true,
    email: row.google_email || '',
    expiresAt: row.token_expiry ? new Date(row.token_expiry).toISOString() : null,
  };
}

export async function disconnect(userId) {
  await pool.query('DELETE FROM google_calendar_tokens WHERE user_id = $1', [userId]);
}

async function getAccessToken(userId) {
  const row = await getTokenRow(userId);
  if (!row) return null;

  const expiry = new Date(row.token_expiry || 0).getTime();
  const now = Date.now();

  if (row.access_token && expiry > now + 60 * 1000) {
    return row.access_token;
  }

  if (!row.refresh_token) {
    throw new Error('Google: no refresh token available, please reconnect');
  }

  const { accessToken, expiresIn } = await refreshAccessToken(row.refresh_token);
  const expiry2 = new Date(Date.now() + expiresIn * 1000);
  await pool.query(
    'UPDATE google_calendar_tokens SET access_token = $1, token_expiry = $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $3',
    [accessToken, expiry2, userId]
  );
  return accessToken;
}

async function googleFetch(userId, path, { method = 'GET', body, params } = {}) {
  const accessToken = await getAccessToken(userId);
  if (!accessToken) return null;

  const url = new URL(`${GOOGLE_CAL_API}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    }
  }

  const headers = { Authorization: `Bearer ${accessToken}` };
  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Google Calendar API ${res.status}: ${text.slice(0, 200)}`);
  }

  if (res.status === 204) return {};
  return res.json();
}

export async function getPrimaryCalendarInfo(userId) {
  const data = await googleFetch(userId, '/users/me/calendarList/primary');
  if (!data) return null;
  return { id: data.id || 'primary', summary: data.summary || '' };
}

export async function listGoogleEvents(userId, { timeMin, timeMax } = {}) {
  const data = await googleFetch(userId, '/calendars/primary/events', {
    params: {
      timeMin,
      timeMax,
      maxResults: 2500,
      singleEvents: true,
      orderBy: 'startTime',
    },
  });
  return data ? data.items || [] : [];
}

async function saveSyncToken(userId, nextSyncToken) {
  if (!nextSyncToken) return;
  await pool.query(
    'UPDATE google_calendar_tokens SET sync_token = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
    [nextSyncToken, userId]
  );
}

export async function listGoogleEventsIncremental(userId) {
  const row = await getTokenRow(userId);
  const syncToken = (row && row.sync_token) || null;
  try {
    const data = await googleFetch(userId, '/calendars/primary/events', {
      params: {
        syncToken: syncToken || undefined,
        maxResults: 2500,
        showDeleted: true,
      },
    });
    await saveSyncToken(userId, data.nextSyncToken);
    return { items: data.items || [], full: !syncToken };
  } catch (error) {
    if (String(error.message).includes('410')) {
      const data = await googleFetch(userId, '/calendars/primary/events', {
        params: {
          maxResults: 2500,
          showDeleted: true,
        },
      });
      await saveSyncToken(userId, data.nextSyncToken);
      return { items: data.items || [], full: true };
    }
    throw error;
  }
}

const DETAILS_MARKER = '\n\n---\n\n';

const REMINDER_MINUTES = {
  '15 minutes avant': 15,
  '30 minutes avant': 30,
  '1 heure avant': 60,
  '2 heures avant': 120,
  '1 jour avant': 1440,
  '2 jours avant': 2880,
  '1 semaine avant': 10080,
};

function parseReminderMinutes(label) {
  const match = String(label).toLowerCase().match(/(\d+)\s*(minute|heure|jour|semaine)s?\s*(avant)?/);
  if (!match) return 0;
  const n = parseInt(match[1], 10);
  const multipliers = { minute: 1, heure: 60, jour: 1440, semaine: 10080 };
  return n * (multipliers[match[2]] || 0);
}

function minutesToReminderLabel(minutes) {
  const table = {
    15: '15 minutes avant',
    30: '30 minutes avant',
    60: '1 heure avant',
    120: '2 heures avant',
    1440: '1 jour avant',
    2880: '2 jours avant',
    10080: '1 semaine avant',
  };
  if (table[minutes]) return table[minutes];
  if (minutes % 10080 === 0) return minutes / 10080 > 1 ? `${minutes / 10080} semaines avant` : '1 semaine avant';
  if (minutes % 1440 === 0) return minutes / 1440 > 1 ? `${minutes / 1440} jours avant` : '1 jour avant';
  if (minutes % 60 === 0) return minutes / 60 > 1 ? `${minutes / 60} heures avant` : '1 heure avant';
  return `${minutes} minutes avant`;
}

function buildCrmReminders(googleEvent) {
  const rem = googleEvent.reminders;
  if (!rem || !Array.isArray(rem.overrides)) return [];
  return rem.overrides
    .filter(o => o && typeof o.minutes === 'number' && o.minutes > 0)
    .map(o => ({ label: minutesToReminderLabel(o.minutes) }));
}

function buildReminders(crmEvent) {
  const raw = Array.isArray(crmEvent.reminders) ? crmEvent.reminders : [];
  const labels = raw
    .map(r => (typeof r === 'string' ? r : r && r.label))
    .filter(Boolean);
  const overrides = [];
  for (const label of labels) {
    const minutes = REMINDER_MINUTES[label] || parseReminderMinutes(label);
    if (minutes > 0) overrides.push({ method: 'popup', minutes });
  }
  if (overrides.length === 0) return null;
  return { useDefault: false, overrides };
}

async function getAgentNames(agentIds) {
  const ids = (agentIds || []).map(String).filter(Boolean);
  if (ids.length === 0) return [];
  const { rows } = await pool.query(
    'SELECT first_name, last_name FROM users WHERE id::text = ANY($1)',
    [ids]
  );
  return rows
    .map(r => `${r.first_name || ''} ${r.last_name || ''}`.trim())
    .filter(Boolean);
}

function buildDetailsBlock(crmEvent, agentNames) {
  const lines = [];
  if (agentNames.length) {
    lines.push('Agent(s)');
    for (const name of agentNames) {
      const parts = name.trim().split(/\s+/);
      const first = parts[0] || '';
      const last = parts.length > 1 ? parts[parts.length - 1] : '';
      const initials = ((first[0] || '') + (last[0] || '')).toUpperCase();
      lines.push(`${initials} ${first}`);
    }
    lines.push('');
  }
  if (crmEvent.client_name) {
    lines.push('Client', crmEvent.client_name);
    if (crmEvent.client_phone) lines.push(crmEvent.client_phone);
    if (crmEvent.client_email) lines.push(crmEvent.client_email);
    lines.push('');
  }
  if (crmEvent.property_name) {
    lines.push('Bien', crmEvent.property_name);
    if (crmEvent.property_ref) lines.push(`Réf ${crmEvent.property_ref}`);
    lines.push('');
  }
  return lines.join('\n').trimEnd();
}

async function buildEventResource(crmEvent) {
  const start = new Date(crmEvent.start_at || crmEvent.start);
  const end = new Date(crmEvent.end_at || crmEvent.end);
  start.setMilliseconds(0);
  end.setMilliseconds(0);
  const details = buildDetailsBlock(crmEvent, await getAgentNames(crmEvent.agent_ids));
  const description = [details, crmEvent.description]
    .filter(Boolean)
    .join(DETAILS_MARKER);
  const resource = {
    summary: crmEvent.title || 'Événement CRM',
    start: { dateTime: start.toISOString() },
    end: { dateTime: end.toISOString() },
    extendedProperties: {
      private: { crmEventId: String(crmEvent.id), crmType: crmEvent.type || 'visite' },
    },
  };
  if (crmEvent.location) resource.location = crmEvent.location;
  const reminders = buildReminders(crmEvent);
  if (reminders) resource.reminders = reminders;
  if (description) resource.description = description;
  return resource;
}

function getCrmEventId(googleEvent) {
  const priv = googleEvent.extendedProperties && googleEvent.extendedProperties.private;
  return priv && priv.crmEventId ? String(priv.crmEventId) : null;
}

export async function insertGoogleEvent(userId, crmEvent) {
  const resource = await buildEventResource(crmEvent);
  const data = await googleFetch(userId, '/calendars/primary/events', {
    method: 'POST',
    body: resource,
  });
  return data;
}

export async function updateGoogleEvent(userId, googleEventId, crmEvent) {
  const resource = await buildEventResource(crmEvent);
  return googleFetch(userId, `/calendars/primary/events/${encodeURIComponent(googleEventId)}`, {
    method: 'PUT',
    body: resource,
  });
}

export async function deleteGoogleEvent(userId, googleEventId) {
  return googleFetch(userId, `/calendars/primary/events/${encodeURIComponent(googleEventId)}`, {
    method: 'DELETE',
  });
}

async function resolveUserIdByName(name) {
  if (!name) return null;
  const { rows } = await pool.query(
    `SELECT id FROM users
     WHERE LOWER(TRIM(first_name || ' ' || last_name)) = $1
        OR LOWER(TRIM(email)) = $1
     LIMIT 1`,
    [String(name).toLowerCase().trim()]
  );
  return rows[0] ? String(rows[0].id) : null;
}

async function getUserFullName(userId) {
  const { rows } = await pool.query(
    'SELECT first_name, last_name FROM users WHERE id = $1',
    [userId]
  );
  const row = rows[0];
  if (!row) return '';
  return `${row.first_name || ''} ${row.last_name || ''}`.trim();
}

async function getCrmEventsForUser(userId, googleSyncOnly = true) {
  const fullName = await getUserFullName(userId);
  const { rows } = await pool.query(
    `SELECT * FROM calendar_events
     WHERE ($4 OR google_sync = TRUE)
       AND (
         agent_ids::text LIKE $1
         OR agent_ids::text LIKE $2
         OR ($3 <> '' AND LOWER(TRIM(created_by)) = $5)
       )
     ORDER BY start_at ASC`,
    [`%"${userId}"%`, `%${userId}%`, fullName, !googleSyncOnly, fullName.toLowerCase().trim()]
  );
  return rows;
}


export async function syncUserEventsToGoogle(userId) {
  if (!(await getConnectionStatus(userId)).connected) {
    return { pushed: 0, updated: 0, failed: 0, connected: false };
  }

  const crmEvents = await getCrmEventsForUser(userId, true);
  const windowStart = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const windowEnd = new Date(Date.now() + 400 * 24 * 3600 * 1000).toISOString();
  const googleEvents = await listGoogleEvents(userId, {
    timeMin: windowStart,
    timeMax: windowEnd,
  });

  const existingById = new Map();
  for (const ge of googleEvents) {
    const crmId = getCrmEventId(ge);
    if (crmId) existingById.set(crmId, ge.id);
  }

  let pushed = 0;
  let updated = 0;
  let failed = 0;

  for (const ev of crmEvents) {
    try {
      const id = String(ev.id);
      const googleId = existingById.get(id);
      if (googleId) {
        await updateGoogleEvent(userId, googleId, ev);
        updated += 1;
      } else {
        await insertGoogleEvent(userId, ev);
        pushed += 1;
      }
    } catch (error) {
      console.error(`[google] sync failed for event ${ev.id}:`, error.message);
      failed += 1;
    }
  }

  return { pushed, updated, failed, connected: true };
}

function parseGoogleTime(gStart, gEnd) {
  if (!gStart) return null;
  const start = gStart.dateTime
    ? new Date(gStart.dateTime)
    : gStart.date
      ? new Date(`${gStart.date}T00:00:00`)
      : null;
  if (!start || isNaN(start.getTime())) return null;
  let end = null;
  if (gEnd) {
    if (gEnd.dateTime) end = new Date(gEnd.dateTime);
    else if (gEnd.date) end = new Date(`${gEnd.date}T00:00:00`);
  }
  if (!end || isNaN(end.getTime())) end = new Date(start.getTime() + 3600 * 1000);
  return {
    start_at: start.toISOString(),
    end_at: end.toISOString(),
    all_day: !gStart.dateTime,
  };
}

function extractDescription(googleEvent) {
  const raw = googleEvent.description || '';
  const idx = raw.indexOf('\n\n---\n\n');
  if (idx !== -1) return raw.slice(idx + '\n\n---\n\n'.length).trim();
  return raw.split('\n').filter(line => !line.startsWith('Client: ')).join('\n').trim();
}

export async function pullGoogleEventsToCrm(userId) {
  if (!(await getConnectionStatus(userId)).connected) {
    return { pulled: 0, failed: 0, connected: false };
  }

  const { items: googleEvents } = await listGoogleEventsIncremental(userId);

  let pulled = 0;
  let failed = 0;

  for (const ge of googleEvents) {
    if (ge.status === 'cancelled') continue;
    const crmId = getCrmEventId(ge);
    if (!crmId) continue;
    try {
      const { rows } = await pool.query('SELECT * FROM calendar_events WHERE id = $1', [crmId]);
      if (rows.length === 0) continue;
      const ev = rows[0];
      if (!ev.google_sync) continue;

      const times = parseGoogleTime(ge.start, ge.end);
      if (!times) continue;
      const title = ge.summary || '';
      const description = extractDescription(ge);
      const location = ge.location || '';
      const reminderLabels = buildCrmReminders(ge).map(r => r.label).sort();
      const crmReminderLabels = (Array.isArray(ev.reminders) ? ev.reminders : [])
        .map(r => (typeof r === 'string' ? r : r && r.label) || '')
        .filter(Boolean)
        .sort();

      const changed =
        String(ev.title || '') !== title ||
        String(ev.description || '') !== description ||
        String(ev.location || '') !== location ||
        Boolean(ev.all_day) !== times.all_day ||
        JSON.stringify(crmReminderLabels) !== JSON.stringify(reminderLabels) ||
        Math.floor(new Date(ev.start_at || 0).getTime() / 1000) !== Math.floor(new Date(times.start_at).getTime() / 1000) ||
        Math.floor(new Date(ev.end_at || 0).getTime() / 1000) !== Math.floor(new Date(times.end_at).getTime() / 1000);

      if (!changed) continue;

      await pool.query(
        `UPDATE calendar_events SET
          title = $1, description = $2, location = $3,
          start_at = $4, end_at = $5, all_day = $6, reminders = $7,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $8`,
        [
          title, description, location, times.start_at, times.end_at, times.all_day,
          JSON.stringify(reminderLabels.map(label => ({ label }))),
          crmId,
        ]
      );
      pulled += 1;
    } catch (error) {
      console.error(`[google] pull failed for event ${crmId}:`, error.message);
      failed += 1;
    }
  }

  return { pulled, failed, connected: true };
}

export async function syncEventToGoogle(crmEvent) {
  const ownerIds = new Set((crmEvent.agent_ids || []).map(String));
  const creatorId = await resolveUserIdByName(crmEvent.created_by);
  if (creatorId) ownerIds.add(creatorId);
  let synced = 0;
  for (const ownerId of ownerIds) {
    if (!(await getConnectionStatus(ownerId)).connected) continue;
    try {
      const windowStart = new Date(Date.now() - 400 * 24 * 3600 * 1000).toISOString();
      const windowEnd = new Date(Date.now() + 400 * 24 * 3600 * 1000).toISOString();
      const googleEvents = await listGoogleEvents(ownerId, {
        timeMin: windowStart,
        timeMax: windowEnd,
      });
      const match = googleEvents.find(ge => getCrmEventId(ge) === String(crmEvent.id));
      if (match) {
        await updateGoogleEvent(ownerId, match.id, crmEvent);
      } else {
        await insertGoogleEvent(ownerId, crmEvent);
      }
      synced += 1;
    } catch (error) {
      console.error(`[google] sync event ${crmEvent.id} for owner ${ownerId} failed:`, error.message);
    }
  }
  return synced;
}

export async function removeEventFromGoogle(crmEvent) {
  const ownerIds = new Set((crmEvent.agent_ids || []).map(String));
  const creatorId = await resolveUserIdByName(crmEvent.created_by);
  if (creatorId) ownerIds.add(creatorId);
  let removed = 0;
  for (const ownerId of ownerIds) {
    if (!(await getConnectionStatus(ownerId)).connected) continue;
    try {
      const windowStart = new Date(Date.now() - 400 * 24 * 3600 * 1000).toISOString();
      const windowEnd = new Date(Date.now() + 400 * 24 * 3600 * 1000).toISOString();
      const googleEvents = await listGoogleEvents(ownerId, {
        timeMin: windowStart,
        timeMax: windowEnd,
      });
      const match = googleEvents.find(ge => getCrmEventId(ge) === String(crmEvent.id));
      if (match) {
        await deleteGoogleEvent(ownerId, match.id);
        removed += 1;
      }
    } catch (error) {
      console.error(`[google] remove event ${crmEvent.id} for owner ${ownerId} failed:`, error.message);
    }
  }
  return removed;
}
