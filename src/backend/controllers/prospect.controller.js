import pool from '../config/db.js';
import { isAdminPanelRole } from '../config/roles.js';
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

function rowToProspect(row) {
  return {
    id: String(row.id),
    type: row.prospect_type,
    origin: row.origin,
    date: row.prospect_date,
    message: row.message || '',
    civility: row.civility,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    mobile: row.mobile || '',
    spokenLanguage: row.spoken_language,
    meansOfContact: row.means_of_contact || [],
    categories: row.categories,
    propertyTypes: row.property_types || [],
    location: row.location || '',
    rooms: row.rooms || undefined,
    bedrooms: row.bedrooms || undefined,
    minSurface: row.min_surface || undefined,
    maxPrice: row.max_price ? Number(row.max_price) : undefined,
    currency: row.currency || 'MAD',
    viewType: row.view_type || '',
    viewDetail: row.view_detail || '',
    status: row.status,
    reminderDate: row.reminder_date || null,
    reminderNote: row.reminder_note || '',
    qualifiedAt: row.qualified_at || null,
    contactedAt: row.contacted_at || null,
    qualificationData: row.qualification_data || null,
    agentId: row.agent_id || null,
    contactId: row.contact_id || null,
    originalProspectId: row.original_prospect_id ? String(row.original_prospect_id) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getProspects(req, res) {
  try {
    await assertAgentPermission(req, 'prospects-lecture', "Vous n'avez pas accès aux prospects.");
    const { search, status, origin, type } = req.query;
    let query = 'SELECT * FROM prospects';
    const conditions = [];
    const values = [];
    let idx = 1;

    if (!isAdminPanelRole(req.user?.role)) {
      conditions.push(`agent_id = $${idx}`);
      values.push(String(req.user.id));
      idx++;
    }

    if (search) {
      conditions.push(`(LOWER(first_name) LIKE $${idx} OR LOWER(last_name) LIKE $${idx} OR LOWER(email) LIKE $${idx} OR phone LIKE $${idx})`);
      values.push(`%${search.toLowerCase()}%`);
      idx++;
    }
    if (status) {
      conditions.push(`status = $${idx}`);
      values.push(status);
      idx++;
    }
    if (origin) {
      conditions.push(`origin = $${idx}`);
      values.push(origin);
      idx++;
    }
    if (type) {
      conditions.push(`prospect_type = $${idx}`);
      values.push(type);
      idx++;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, values);
    res.json(result.rows.map(rowToProspect));
  } catch (error) {
    console.error('Error fetching prospects:', error);
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
}

export async function getProspectById(req, res) {
  try {
    await assertAgentPermission(req, 'prospects-lecture', "Vous n'avez pas accès aux prospects.");
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM prospects WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prospect not found' });
    }
    res.json(rowToProspect(result.rows[0]));
  } catch (error) {
    console.error('Error fetching prospect:', error);
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
}

export async function getQualifiedProspects(req, res) {
  try {
    await assertAgentPermission(req, 'prospects-lecture', "Vous n'avez pas accès aux prospects.");
    let query = `SELECT * FROM prospects WHERE status = 'Qualifié'`;
    const values = [];
    let idx = 1;

    if (!isAdminPanelRole(req.user?.role)) {
      query += ` AND agent_id = $${idx}`;
      values.push(String(req.user.id));
      idx++;
    }

    query += ' ORDER BY qualified_at DESC NULLS LAST';
    const result = await pool.query(query, values);
    res.json(result.rows.map(rowToProspect));
  } catch (error) {
    console.error('Error fetching qualified prospects:', error);
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
}

export async function createProspect(req, res) {
  try {
    await assertAgentPermission(req, 'prospects-ecriture', "Vous n'avez pas le droit d'ajouter des prospects.");
    const b = req.body;
    const result = await pool.query(
      `INSERT INTO prospects (
        prospect_type, origin, prospect_date, message, civility, first_name, last_name,
        email, phone, mobile, spoken_language, means_of_contact, categories, property_types,
        location, rooms, bedrooms, min_surface, max_price, currency, view_type, view_detail,
        status, agent_id
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24
      ) RETURNING *`,
      [
        b.type || 'Acheter',
        b.origin || '',
        b.date || '',
        b.message || '',
        b.civility || 'M.',
        b.firstName || '',
        b.lastName || '',
        b.email || '',
        b.phone || '',
        b.mobile || '',
        b.spokenLanguage || '',
        JSON.stringify(b.meansOfContact || []),
        b.categories || '',
        JSON.stringify(b.propertyTypes || []),
        b.location || '',
        b.rooms || null,
        b.bedrooms || null,
        b.minSurface || null,
        b.maxPrice || null,
        b.currency || 'MAD',
        b.viewType || '',
        b.viewDetail || '',
        b.status || 'Nouveau',
        b.agentId || req.user?.id || null,
      ]
    );
    res.status(201).json(rowToProspect(result.rows[0]));
  } catch (error) {
    console.error('Error creating prospect:', error);
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
}

export async function updateProspect(req, res) {
  try {
    await assertAgentPermission(req, 'prospects-ecriture', "Vous n'avez pas le droit de modifier les prospects.");
    const { id } = req.params;
    const b = req.body;

    const result = await pool.query(
      `UPDATE prospects SET
        prospect_type = $1, origin = $2, prospect_date = $3, message = $4,
        civility = $5, first_name = $6, last_name = $7, email = $8,
        phone = $9, mobile = $10, spoken_language = $11, means_of_contact = $12,
        categories = $13, property_types = $14, location = $15, rooms = $16,
        bedrooms = $17, min_surface = $18, max_price = $19, currency = $20,
        view_type = $21, view_detail = $22, status = $23,
        reminder_date = $25, reminder_note = $26,
        updated_at = NOW()
      WHERE id = $24 RETURNING *`,
      [
        b.type || 'Acheter',
        b.origin || '',
        b.date || '',
        b.message || '',
        b.civility || 'M.',
        b.firstName || '',
        b.lastName || '',
        b.email || '',
        b.phone || '',
        b.mobile || '',
        b.spokenLanguage || '',
        JSON.stringify(b.meansOfContact || []),
        b.categories || '',
        JSON.stringify(b.propertyTypes || []),
        b.location || '',
        b.rooms || null,
        b.bedrooms || null,
        b.minSurface || null,
        b.maxPrice || null,
        b.currency || 'MAD',
        b.viewType || '',
        b.viewDetail || '',
        b.status || 'Nouveau',
        id,
        b.reminderDate || null,
        b.reminderNote || '',
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prospect not found' });
    }
    res.json(rowToProspect(result.rows[0]));
  } catch (error) {
    console.error('Error updating prospect:', error);
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
}

export async function updateProspectStatus(req, res) {
  try {
    await assertAgentPermission(req, 'prospects-ecriture', "Vous n'avez pas le droit de modifier les prospects.");
    const { id } = req.params;
    const { status, reminderDate, reminderNote, qualificationData, contactId } = req.body;

    const validStatuses = ['Nouveau', 'Contacté', 'Qualifié', 'En attente', 'Perdu', 'Converti'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const setClauses = ['status = $1'];
    const values = [status];
    let idx = 2;

    // Timestamps per status
    if (status === 'Contacté') {
      setClauses.push('contacted_at = COALESCE(contacted_at, NOW())');
    }
    if (status === 'Qualifié') {
      setClauses.push('qualified_at = COALESCE(qualified_at, NOW())');
      if (qualificationData) {
        setClauses.push(`qualification_data = $${idx}`);
        values.push(JSON.stringify(qualificationData));
        idx++;
      }
    }
    // When leaving Qualifié, clear qualification fields
    if (status !== 'Qualifié') {
      setClauses.push('qualified_at = NULL');
      setClauses.push('qualification_data = NULL');
    }

    // Store contactId when converting
    if (status === 'Converti' && contactId) {
      setClauses.push(`contact_id = $${idx}`);
      values.push(contactId);
      idx++;
    }

    // Reminder fields
    if (status === 'En attente') {
      if (reminderDate) {
        setClauses.push(`reminder_date = $${idx}`);
        values.push(reminderDate);
        idx++;
      }
      if (reminderNote !== undefined) {
        setClauses.push(`reminder_note = $${idx}`);
        values.push(reminderNote);
        idx++;
      }
    } else {
      setClauses.push('reminder_date = NULL');
      setClauses.push("reminder_note = ''");
    }

    setClauses.push('updated_at = NOW()');
    values.push(id);

    const query = `UPDATE prospects SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`;
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prospect not found' });
    }
    res.json(rowToProspect(result.rows[0]));
  } catch (error) {
    console.error('Error updating prospect status:', error);
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
}

export async function scheduleReminder(req, res) {
  try {
    await assertAgentPermission(req, 'prospects-ecriture', "Vous n'avez pas le droit de modifier les prospects.");
    const { id } = req.params;
    const { reminderDate, reminderNote } = req.body;

    if (!reminderDate) {
      return res.status(400).json({ error: 'reminderDate is required' });
    }

    const result = await pool.query(
      `UPDATE prospects SET
        reminder_date = $1, reminder_note = $2,
        status = 'En attente', updated_at = NOW()
      WHERE id = $3 RETURNING *`,
      [reminderDate, reminderNote || '', id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prospect not found' });
    }
    res.json(rowToProspect(result.rows[0]));
  } catch (error) {
    console.error('Error scheduling reminder:', error);
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
}

export async function updateReminder(req, res) {
  try {
    await assertAgentPermission(req, 'prospects-ecriture', "Vous n'avez pas le droit de modifier les prospects.");
    const { id } = req.params;
    const { reminderDate, reminderNote } = req.body;

    if (!reminderDate) {
      return res.status(400).json({ error: 'reminderDate is required' });
    }

    const result = await pool.query(
      `UPDATE prospects SET
        reminder_date = $1, reminder_note = $2, updated_at = NOW()
      WHERE id = $3 AND status = 'En attente' RETURNING *`,
      [reminderDate, reminderNote || '', id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prospect not found or not En attente' });
    }
    res.json(rowToProspect(result.rows[0]));
  } catch (error) {
    console.error('Error updating reminder:', error);
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
}

export async function cancelReminder(req, res) {
  try {
    await assertAgentPermission(req, 'prospects-ecriture', "Vous n'avez pas le droit de modifier les prospects.");
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE prospects SET
        status = 'Contacté',
        reminder_date = NULL,
        reminder_note = '',
        contacted_at = NOW(),
        updated_at = NOW()
      WHERE id = $1 AND status = 'En attente' RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prospect not found or not En attente' });
    }
    res.json(rowToProspect(result.rows[0]));
  } catch (error) {
    console.error('Error cancelling reminder:', error);
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
}

export async function duplicateProspect(req, res) {
  try {
    await assertAgentPermission(req, 'prospects-ecriture', "Vous n'avez pas le droit d'ajouter des prospects.");
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM prospects WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prospect not found' });
    }
    const src = result.rows[0];
    const toJsonb = (v, fallback = '[]') => {
      if (v === null || v === undefined) return fallback;
      if (typeof v === 'string') {
        if (v === '' || v === 'null') return fallback;
        try { JSON.parse(v); return v; } catch { return fallback; }
      }
      return JSON.stringify(v);
    };
    const dup = await pool.query(
      `INSERT INTO prospects (
        prospect_type, origin, prospect_date, message, civility, first_name, last_name,
        email, phone, mobile, spoken_language, means_of_contact, categories, property_types,
        location, rooms, bedrooms, min_surface, max_price, currency, view_type, view_detail,
        status, agent_id, original_prospect_id
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13,$14::jsonb,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25
      ) RETURNING *`,
      [
        src.prospect_type, src.origin, src.prospect_date, src.message,
        src.civility, src.first_name, src.last_name, src.email,
        src.phone, src.mobile, src.spoken_language, toJsonb(src.means_of_contact),
        src.categories, toJsonb(src.property_types), src.location, src.rooms,
        src.bedrooms, src.min_surface, src.max_price, src.currency,
        src.view_type, src.view_detail, src.status, req.user.id,
        src.original_prospect_id || src.id,
      ]
    );
    res.status(201).json(rowToProspect(dup.rows[0]));
  } catch (error) {
    console.error('Error duplicating prospect:', error);
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
}

export async function deleteProspect(req, res) {
  try {
    await assertAgentPermission(req, 'prospects-ecriture', "Vous n'avez pas le droit de supprimer les prospects.");
    const { id } = req.params;
    await pool.query('DELETE FROM prospects WHERE original_prospect_id = $1', [id]);
    const result = await pool.query('DELETE FROM prospects WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prospect not found' });
    }
    res.json({ message: 'Prospect deleted' });
  } catch (error) {
    console.error('Error deleting prospect:', error);
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
}
