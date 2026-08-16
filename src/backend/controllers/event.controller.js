import pool from '../config/db.js';
import { syncEventToGoogle, removeEventFromGoogle } from '../services/googleCalendar.service.js';
import { getEffectivePermissions } from '../services/permissions.service.js';

async function assertAgentCalendarAccess(req, requireWrite = false) {
  if (req.user?.role !== 'agent') return;
  const perms = await getEffectivePermissions(req.user.id);
  const allowed = requireWrite ? perms['calendrier-ecriture'] : perms['calendrier-lecture'];
  if (!allowed) {
    const err = new Error(
      requireWrite
        ? "Vous n'avez pas le droit de modifier le calendrier."
        : "Vous n'avez pas accès au calendrier."
    );
    err.status = 403;
    throw err;
  }
}

async function getActorName(userId) {
  if (!userId) return "L'administrateur";
  const { rows } = await pool.query(
    'SELECT first_name, last_name FROM users WHERE id = $1',
    [userId]
  );
  const row = rows[0];
  if (!row) return "L'administrateur";
  return `${row.first_name || ''} ${row.last_name || ''}`.trim() || "L'administrateur";
}

function normalizeName(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function isAgentOwnerOfEvent(event, userId, userName) {
  if (!event) return false;
  const ids = (event.agent_ids || []).map(String);
  if (ids.includes(String(userId))) return true;
  return Boolean(userName) && Boolean(event.created_by) && normalizeName(event.created_by) === normalizeName(userName);
}

async function assertAgentOwnership(req, event) {
  if (req.user?.role !== 'agent') return true;
  const userName = await getActorName(req.user.id);
  return isAgentOwnerOfEvent(event, req.user.id, userName);
}

async function notifyConcerned(agentIds, actorId, actorName, type, message, eventId) {
  const targets = [...new Set((agentIds || []).map(String).filter(id => id && String(id) !== String(actorId)))];
  const propertyId = String(eventId);
  const propertyRef = `EVENT-${eventId}`;
  for (const userId of targets) {
    const existing = await pool.query(
      `SELECT id FROM notifications
       WHERE user_id = $1 AND type = $2 AND property_id = $3 AND is_read = FALSE
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId, type, propertyId]
    );
    if (existing.rows[0]) {
      await pool.query(
        `UPDATE notifications
         SET message = $1, sender_name = $2, created_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [message, actorName, existing.rows[0].id]
      );
    } else {
      await pool.query(
        `INSERT INTO notifications (user_id, sender_name, type, message, property_id, property_ref)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, actorName, type, message, propertyId, propertyRef]
      );
    }
  }
  return targets.length;
}

async function fetchAgentNames(ids) {
  const numericIds = [...new Set((ids || []).map(String).filter(id => /^\d+$/.test(id)))];
  const map = {};
  if (numericIds.length === 0) return map;
  const { rows } = await pool.query(
    'SELECT id, first_name, last_name FROM users WHERE id = ANY($1::int[])',
    [numericIds.map(Number)]
  );
  for (const row of rows) {
    map[String(row.id)] = `${row.first_name || ''} ${row.last_name || ''}`.trim();
  }
  return map;
}

function rowToEvent(row, nameMap = {}) {
  return {
    id: String(row.id),
    type: row.type,
    title: row.title,
    start: row.start_at,
    end: row.end_at,
    allDay: row.all_day,
    agentIds: row.agent_ids || [],
    agentNames: (row.agent_ids || []).map(id => nameMap[String(id)] || '').filter(Boolean),
    agentId: row.agent_id ? String(row.agent_id) : undefined,
    clientName: row.client_name || undefined,
    clientPhone: row.client_phone || undefined,
    clientEmail: row.client_email || undefined,
    propertyName: row.property_name || undefined,
    propertyRef: row.property_ref || undefined,
    location: row.location || undefined,
    description: row.description || undefined,
    googleSync: row.google_sync,
    reminders: row.reminders || [],
    createdAt: row.created_at,
    createdBy: row.created_by || '',
  };
}

export async function getEvents(req, res) {
  try {
    await assertAgentCalendarAccess(req);
    const result = await pool.query(
      'SELECT * FROM calendar_events ORDER BY start_at ASC'
    );
    const nameMap = await fetchAgentNames(result.rows.flatMap(r => r.agent_ids || []));
    res.json(result.rows.map(row => rowToEvent(row, nameMap)));
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
}

export async function getEventById(req, res) {
  try {
    await assertAgentCalendarAccess(req);
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM calendar_events WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    const nameMap = await fetchAgentNames(result.rows[0].agent_ids || []);
    res.json(rowToEvent(result.rows[0], nameMap));
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
}

export async function createEvent(req, res) {
  try {
    await assertAgentCalendarAccess(req, true);
    const b = req.body;
    const rawAgentIds = Array.isArray(b.agent_ids) ? b.agent_ids : [];
    const agentIds = rawAgentIds.length > 0
      ? rawAgentIds
      : [String(req.user?.id ?? b.agent_id ?? '')].filter(Boolean);
    if (req.user?.role === 'agent' && !agentIds.map(String).includes(String(req.user.id))) {
      return res.status(403).json({ error: "Vous ne pouvez créer des événements que pour vous-même." });
    }
    const result = await pool.query(
      `INSERT INTO calendar_events (
        type, title, start_at, end_at, all_day, agent_id, agent_ids,
        client_name, client_phone, client_email, property_name, property_ref,
        location, description, google_sync, reminders, created_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      RETURNING *`,
      [
        b.type || 'visite', b.title || '', b.start_at, b.end_at, b.all_day || false,
        agentIds[0] || null,
        JSON.stringify(agentIds),
        b.client_name || '', b.client_phone || '', b.client_email || '',
        b.property_name || '', b.property_ref || '', b.location || '',
        b.description || '', b.google_sync || false, JSON.stringify(b.reminders || []),
        b.created_by || '',
      ]
    );
    if (req.user?.role === 'admin' || req.user?.role === 'gerant') {
      try {
        const actorName = await getActorName(req.user.id);
        const message = `Un nouvel événement "${b.title || 'sans objet'}" vous a été assigné par l'administrateur ${actorName}. Pour plus de détails, contactez-le via les messages.`;
        await notifyConcerned(agentIds, req.user.id, actorName, 'event_assigned', message, result.rows[0].id);
      } catch (error) {
        console.error('Error notifying assigned agent:', error);
      }
    }
    if (result.rows[0].google_sync) {
      try {
        await syncEventToGoogle(result.rows[0]);
      } catch (error) {
        console.error('Error syncing event to Google:', error);
      }
    }
    const nameMap = await fetchAgentNames(agentIds);
    res.status(201).json(rowToEvent(result.rows[0], nameMap));
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
}

export async function updateEvent(req, res) {
  try {
    await assertAgentCalendarAccess(req, true);
    const { id } = req.params;
    const b = req.body;
    const previous = await pool.query(
      'SELECT * FROM calendar_events WHERE id = $1',
      [id]
    );
    if (previous.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (req.user?.role === 'agent') {
      if (!(await assertAgentOwnership(req, previous.rows[0]))) {
        return res.status(403).json({ error: "Vous ne pouvez modifier que vos propres événements." });
      }
      const rawAgentIds = Array.isArray(b.agent_ids) ? b.agent_ids : [];
      const previousIds = previous.rows[0].agent_ids || [];
      const newIds = (rawAgentIds.length > 0 ? rawAgentIds : previousIds).map(String);
      if (!newIds.includes(String(req.user.id))) {
        return res.status(403).json({ error: "Vous ne pouvez assigner l'événement qu'à vous-même." });
      }
    }
    const rawAgentIds = Array.isArray(b.agent_ids) ? b.agent_ids : [];
    const previousIds = previous.rows[0].agent_ids || [];
    const agentIds = rawAgentIds.length > 0 ? rawAgentIds : previousIds;
    const result = await pool.query(
      `UPDATE calendar_events SET
        type = $1, title = $2, start_at = $3, end_at = $4, all_day = $5,
        agent_id = $6, agent_ids = $7, client_name = $8, client_phone = $9, client_email = $10,
        property_name = $11, property_ref = $12, location = $13, description = $14,
        google_sync = $15, reminders = $16, created_by = $17, updated_at = CURRENT_TIMESTAMP
      WHERE id = $18
      RETURNING *`,
      [
        b.type || 'visite', b.title || '', b.start_at, b.end_at, b.all_day || false,
        agentIds[0] || previous.rows[0].agent_id || null,
        JSON.stringify(agentIds),
        b.client_name || '', b.client_phone || '', b.client_email || '',
        b.property_name || '', b.property_ref || '', b.location || '',
        b.description || '', b.google_sync || false, JSON.stringify(b.reminders || []),
        b.created_by || '', id,
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (req.user?.role === 'admin' || req.user?.role === 'gerant') {
      try {
        const actorName = await getActorName(req.user.id);
        const oldIds = (previous.rows[0].agent_ids || []).map(String);
        const newIds = agentIds.map(String);
        const union = [...new Set([...oldIds, ...newIds])];
        const message = `Votre événement "${b.title || previous.rows[0].title || 'sans objet'}" a été modifié par l'administrateur ${actorName}. Pour plus de détails, contactez-le via les messages.`;
        await notifyConcerned(union, req.user.id, actorName, 'event_modified', message, id);
      } catch (error) {
        console.error('Error notifying modified event owner:', error);
      }
    }
    if (result.rows[0].google_sync) {
      try {
        await syncEventToGoogle(result.rows[0]);
      } catch (error) {
        console.error('Error syncing event to Google:', error);
      }
    }
    const nameMap = await fetchAgentNames(agentIds);
    res.json(rowToEvent(result.rows[0], nameMap));
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
}

export async function deleteEvent(req, res) {
  try {
    await assertAgentCalendarAccess(req, true);
    const { id } = req.params;
    const existing = await pool.query(
      'SELECT * FROM calendar_events WHERE id = $1',
      [id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (req.user?.role === 'agent' && !(await assertAgentOwnership(req, existing.rows[0]))) {
      return res.status(403).json({ error: "Vous ne pouvez annuler que vos propres événements." });
    }
    const result = await pool.query('DELETE FROM calendar_events WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (req.user?.role === 'admin' || req.user?.role === 'gerant') {
      try {
        const actorName = await getActorName(req.user.id);
        const message = `Votre événement "${existing.rows[0].title || 'sans objet'}" a été supprimé par l'administrateur ${actorName}. Pour plus de détails, contactez-le via les messages.`;
        await notifyConcerned(existing.rows[0].agent_ids, req.user.id, actorName, 'event_deleted', message, id);
      } catch (error) {
        console.error('Error notifying deleted event owner:', error);
      }
    }
    if (existing.rows[0].google_sync) {
      try {
        await removeEventFromGoogle(existing.rows[0]);
      } catch (error) {
        console.error('Error removing event from Google:', error);
      }
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
}
