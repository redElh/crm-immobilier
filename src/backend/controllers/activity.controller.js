import pool from '../config/db.js';
import { getEffectivePermissions } from '../services/permissions.service.js';

// For agents only, checks that the given permission is allowed. Returns the
// effective permissions map (or null for non-agents). Throws 403 otherwise.
async function assertAgentPermission(req, permissionKey, message) {
  if (req.user?.role !== 'agent') return null;
  const perms = await getEffectivePermissions(req.user.id);
  if (!perms[permissionKey]) {
    const err = new Error(message);
    err.status = 403;
    throw err;
  }
  return perms;
}

export async function getActivities(req, res) {
  try {
    await assertAgentPermission(req, 'clients-lecture', "Vous n'avez pas accès aux clients.");
    const { id } = req.params;
    const { type, author, from, to, search, page = 1, limit = 50 } = req.query;
    const params = [id, 'visite'];
    let sql = 'SELECT * FROM client_activities WHERE (client_id = $1 OR (type = $2 AND (visit_buyer_id = $1 OR visit_seller_id = $1)))';
    let idx = 3;

    if (type && type !== 'all') { sql += ` AND type = $${idx++}`; params.push(type); }
    if (author) { sql += ` AND LOWER(author_name) LIKE $${idx++}`; params.push(`%${author.toLowerCase()}%`); }
    if (from) { sql += ` AND activity_date >= $${idx++}`; params.push(from); }
    if (to) { sql += ` AND activity_date <= $${idx++}`; params.push(to); }
    if (search) {
      sql += ` AND (LOWER(subject) LIKE $${idx} OR LOWER(description) LIKE $${idx})`;
      params.push(`%${search.toLowerCase()}%`);
      idx++;
    }

    const countResult = await pool.query(sql.replace('SELECT *', 'SELECT COUNT(*)'), params);
    const total = parseInt(countResult.rows[0].count) || 0;

    const offset = (Math.max(1, Number(page)) - 1) * Number(limit);
    sql += ` ORDER BY activity_date DESC, created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(Number(limit), offset);

    const result = await pool.query(sql, params);

    const typeCountsResult = await pool.query(
      `SELECT type, COUNT(*)::int AS count FROM client_activities WHERE (client_id = $1 OR (type = $2 AND (visit_buyer_id = $1 OR visit_seller_id = $1))) GROUP BY type`,
      [id, 'visite']
    );
    const typeCounts = {};
    for (const row of typeCountsResult.rows) {
      typeCounts[row.type] = row.count;
    }

    res.json({ activities: result.rows, total, page: Number(page), limit: Number(limit), typeCounts });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
}

export async function createActivity(req, res) {
  try {
    await assertAgentPermission(req, 'clients-ecriture', "Vous n'avez pas le droit d'ajouter des activités.");
    const { id } = req.params;
    const { type, direction, subject, description, activity_date, has_reminder, reminder_date, is_important, status, visit_property_id, visit_buyer_id, visit_seller_id } = req.body;

    if (!type) return res.status(400).json({ error: 'type is required' });

    if (type === 'visite') {
      await assertAgentPermission(req, 'clients-visite', "Vous n'avez pas le droit de créer des visites.");
    }

    let authorName = '';
    let authorId = null;
    let authorRole = '';

    const userId = req.user?.id || req.userId || null;
    const clientResult = await pool.query('SELECT agent_designe, agent_id FROM owner_clients WHERE id = $1', [id]);
    const agentName = clientResult.rows.length > 0 ? (clientResult.rows[0].agent_designe || clientResult.rows[0].agent_id || '') : '';

    if (agentName.trim()) {
      const userResult = await pool.query(
        `SELECT id, first_name, last_name, role FROM users
         WHERE LOWER(TRIM(first_name || ' ' || last_name)) = LOWER(TRIM($1))`,
        [agentName]
      );
      if (userResult.rows.length > 0) {
        const row = userResult.rows[0];
        authorId = String(row.id);
        authorName = ((row.first_name || '') + ' ' + (row.last_name || '')).trim();
        authorRole = row.role || '';
      }
    }

    if (!authorId && userId) {
      authorId = userId;
      const userResult = await pool.query('SELECT first_name, last_name, role FROM users WHERE id = $1', [userId]);
      if (userResult.rows.length > 0) {
        const row = userResult.rows[0];
        authorName = ((row.first_name || '') + ' ' + (row.last_name || '')).trim();
        authorRole = row.role || '';
      }
    }

    const actStatus = status || 'en_attente';
    const result = await pool.query(
      `INSERT INTO client_activities (client_id, type, direction, subject, description, activity_date, has_reminder, reminder_date, is_important, author_id, author_name, author_role, status, visit_property_id, visit_buyer_id, visit_seller_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
      [id, type, direction || '', subject || '', description || '', activity_date || new Date(), has_reminder || false, reminder_date || null, is_important || false, authorId, authorName, authorRole, actStatus,
       visit_property_id ? Number(visit_property_id) : null, visit_buyer_id ? Number(visit_buyer_id) : null, visit_seller_id ? Number(visit_seller_id) : null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
}

export async function updateActivity(req, res) {
  try {
    await assertAgentPermission(req, 'clients-ecriture', "Vous n'avez pas le droit de modifier les activités.");
    const { activityId } = req.params;

    const current = await pool.query('SELECT status, type, alarm_sent, activity_date, reminder_date FROM client_activities WHERE id = $1', [activityId]);
    if (current.rows.length === 0) return res.status(404).json({ error: 'Activity not found' });
    const existing = current.rows[0];

    const { type, direction, subject, description, activity_date, has_reminder, reminder_date, is_important, status, visit_property_id, visit_buyer_id, visit_seller_id } = req.body;

    if (existing.type === 'visite' || type === 'visite') {
      await assertAgentPermission(req, 'clients-visite', "Vous n'avez pas le droit de modifier les visites.");
    }

    // Handle status-only changes — these bypass the alarm_sent lock
    if (status && status !== existing.status) {
      let setClauses = ['status = $1', 'updated_at = NOW()'];
      let values = [status];
      let idx = 2;

      if (status === 'annule') {
        setClauses.push(`alarm_sent = $${idx}`, `reminder_sent = $${idx + 1}`);
        values.push(true, true);
        idx += 2;
      } else if (status === 'termine') {
        setClauses.push(`alarm_sent = $${idx}`, `reminder_sent = $${idx + 1}`);
        values.push(true, true);
        idx += 2;
      } else if (status === 'confirme' && existing.status === 'en_attente') {
        // just update status, keep alarm/reminder intact
      }

      values.push(activityId);
      const result = await pool.query(
        `UPDATE client_activities SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
        values
      );
      return res.json(result.rows[0]);
    }

    // For non-status edits, enforce lock
    if (existing.status === 'annule' || existing.status === 'termine') {
      return res.status(403).json({ error: `Activite ${existing.status === 'annule' ? 'annulee' : 'terminee'} : modification non autorisee` });
    }
    if (existing.alarm_sent) return res.status(403).json({ error: 'Activite verrouillee : alarme deja envoyee' });

    const dateChanged = activity_date && activity_date !== existing.activity_date;
    const reminderChanged = reminder_date !== undefined && reminder_date !== existing.reminder_date;

    const result = await pool.query(
      `UPDATE client_activities SET type = COALESCE($1, type), direction = COALESCE($2, direction), subject = COALESCE($3, subject),
       description = COALESCE($4, description), activity_date = COALESCE($5, activity_date), has_reminder = COALESCE($6, has_reminder),
       reminder_date = $7, is_important = COALESCE($8, is_important),
       visit_property_id = COALESCE($12, visit_property_id), visit_buyer_id = COALESCE($13, visit_buyer_id), visit_seller_id = COALESCE($14, visit_seller_id),
       updated_at = NOW(),
       alarm_sent = CASE WHEN $9 THEN FALSE ELSE alarm_sent END,
       reminder_sent = CASE WHEN $10 THEN FALSE ELSE reminder_sent END
       WHERE id = $11 RETURNING *`,
      [type, direction, subject, description, activity_date, has_reminder, reminder_date || null, is_important, dateChanged, reminderChanged, activityId,
       visit_property_id ? Number(visit_property_id) : null, visit_buyer_id ? Number(visit_buyer_id) : null, visit_seller_id ? Number(visit_seller_id) : null]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
}

export async function deleteActivity(req, res) {
  try {
    await assertAgentPermission(req, 'clients-ecriture', "Vous n'avez pas le droit de supprimer les activités.");
    const { activityId } = req.params;

    const lockCheck = await pool.query('SELECT alarm_sent, status FROM client_activities WHERE id = $1', [activityId]);
    if (lockCheck.rows.length === 0) return res.status(404).json({ error: 'Activity not found' });
    const act = lockCheck.rows[0];
    if (act.alarm_sent) return res.status(403).json({ error: 'Activite verrouillee : alarme deja envoyee' });
    if (act.status === 'annule' || act.status === 'termine') return res.status(403).json({ error: `Activite ${act.status === 'annule' ? 'annulee' : 'terminee'} : suppression non autorisee` });

    const result = await pool.query('DELETE FROM client_activities WHERE id = $1 RETURNING id', [activityId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
}
