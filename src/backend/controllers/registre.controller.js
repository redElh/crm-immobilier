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

function rowToRegistre(row) {
  return {
    id: String(row.id),
    reference: row.reference,
    transactionId: row.transaction_id ? String(row.transaction_id) : null,
    clientId: String(row.client_id),
    clientName: row.client_name,
    clientType: row.client_type,
    propertyId: row.property_id ? String(row.property_id) : null,
    propertyTitle: row.property_title,
    propertyRef: row.property_ref,
    type: row.type,
    etape: row.etape,
    role: row.role,
    montant: row.montant,
    agentName: row.agent_name,
    agentId: row.agent_id,
    dateContrat: row.date_contrat ? new Date(row.date_contrat).toISOString().slice(0, 10) : '',
    dateExpiration: row.date_expiration ? new Date(row.date_expiration).toISOString().slice(0, 10) : '',
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getRegistre(req, res) {
  try {
    await assertAgentPermission(req, 'registre-lecture', "Vous n'avez pas accès au registre.");
    const { client_id, property_id, type, etape, agent_id, search, date_from, date_to } = req.query;
    const conditions = [];
    const values = [];
    let index = 1;

    if (client_id) {
      conditions.push(`r.client_id = $${index++}`);
      values.push(client_id);
    }
    if (property_id) {
      conditions.push(`r.property_id = $${index++}`);
      values.push(property_id);
    }
    if (type) {
      conditions.push(`r.type = $${index++}`);
      values.push(type);
    }
    if (etape) {
      conditions.push(`r.etape = $${index++}`);
      values.push(etape);
    }
    if (agent_id) {
      conditions.push(`r.agent_id = $${index++}`);
      values.push(agent_id);
    }
    if (search) {
      conditions.push(`(r.reference ILIKE $${index} OR r.client_name ILIKE $${index} OR r.property_title ILIKE $${index})`);
      values.push(`%${search}%`);
      index++;
    }
    if (date_from) {
      conditions.push(`r.created_at >= $${index++}`);
      values.push(date_from);
    }
    if (date_to) {
      conditions.push(`r.created_at <= $${index++}`);
      values.push(date_to);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `SELECT r.*, COALESCE(u.first_name || ' ' || u.last_name, r.agent_name) AS agent_name
                   FROM registre r
                   LEFT JOIN users u ON u.id::text = r.agent_id
                   ${whereClause} ORDER BY r.created_at DESC`;

    const { rows } = await pool.query(query, values);
    res.json(rows.map(rowToRegistre));
  } catch (error) {
    console.error('Error fetching registre:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du registre' });
  }
}

export async function getRegistreById(req, res) {
  try {
    await assertAgentPermission(req, 'registre-lecture', "Vous n'avez pas accès au registre.");
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT r.*, COALESCE(u.first_name || ' ' || u.last_name, r.agent_name) AS agent_name
       FROM registre r
       LEFT JOIN users u ON u.id::text = r.agent_id
       WHERE r.id = $1`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Entrée non trouvée' });
    }
    res.json(rowToRegistre(rows[0]));
  } catch (error) {
    console.error('Error fetching registre entry:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'entrée' });
  }
}

export async function createRegistreEntry(req, res) {
  try {
    await assertAgentPermission(req, 'registre-ecriture', "Vous n'avez pas le droit de créer des entrées au registre.");
    const {
      transactionId, clientId, clientName, clientType,
      propertyId, propertyTitle, propertyRef,
      type, etape, role, montant, agentName, agentId,
      dateContrat, dateExpiration, notes
    } = req.body;

    const year = new Date().getFullYear();
    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) FROM registre WHERE reference LIKE $1`,
      [`REG-${year}-%`]
    );
    const count = parseInt(countRows[0].count, 10) + 1;
    const reference = `REG-${year}-${String(count).padStart(3, '0')}`;

    const { rows } = await pool.query(
      `INSERT INTO registre
        (reference, transaction_id, client_id, client_name, client_type,
         property_id, property_title, property_ref,
         type, etape, role, montant, agent_name, agent_id,
         date_contrat, date_expiration, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING *`,
      [
        reference, transactionId || null, clientId, clientName, clientType,
        propertyId || null, propertyTitle, propertyRef,
        type, etape, role, montant, agentName, agentId,
        dateContrat || null, dateExpiration || null, notes
      ]
    );

    res.status(201).json(rowToRegistre(rows[0]));
  } catch (error) {
    console.error('Error creating registre entry:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'entrée' });
  }
}

export async function updateRegistreEntry(req, res) {
  try {
    await assertAgentPermission(req, 'registre-ecriture', "Vous n'avez pas le droit de modifier le registre.");
    const { id } = req.params;
    const fields = [
      'transaction_id', 'client_id', 'client_name', 'client_type',
      'property_id', 'property_title', 'property_ref',
      'type', 'etape', 'role', 'montant', 'agent_name', 'agent_id',
      'date_contrat', 'date_expiration', 'notes'
    ];

    const setClauses = [];
    const values = [];
    let index = 1;

    for (const field of fields) {
      const camel = field.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      if (req.body[camel] !== undefined) {
        setClauses.push(`${field} = $${index++}`);
        values.push(req.body[camel]);
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const { rows } = await pool.query(
      `UPDATE registre SET ${setClauses.join(', ')} WHERE id = $${index} RETURNING *`,
      values
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Entrée non trouvée' });
    }
    res.json(rowToRegistre(rows[0]));
  } catch (error) {
    console.error('Error updating registre entry:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'entrée' });
  }
}

export async function deleteRegistreEntry(req, res) {
  try {
    await assertAgentPermission(req, 'registre-ecriture', "Vous n'avez pas le droit de supprimer des entrées du registre.");
    const { id } = req.params;
    const { rows } = await pool.query(
      'DELETE FROM registre WHERE id = $1 RETURNING id',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Entrée non trouvée' });
    }
    res.json({ message: 'Entrée supprimée', id: String(rows[0].id) });
  } catch (error) {
    console.error('Error deleting registre entry:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'entrée' });
  }
}

export async function getRegistreStats(req, res) {
  try {
    await assertAgentPermission(req, 'registre-lecture', "Vous n'avez pas accès au registre.");
    const [totalRes, byEtapeRes, byTypeRes, byAgentRes] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM registre'),
      pool.query('SELECT etape, COUNT(*) as count FROM registre GROUP BY etape ORDER BY count DESC'),
      pool.query('SELECT type, COUNT(*) as count FROM registre GROUP BY type ORDER BY count DESC'),
      pool.query('SELECT agent_id, agent_name, COUNT(*) as count FROM registre GROUP BY agent_id, agent_name ORDER BY count DESC'),
    ]);

    res.json({
      total: parseInt(totalRes.rows[0].count, 10),
      byEtape: byEtapeRes.rows,
      byType: byTypeRes.rows,
      byAgent: byAgentRes.rows,
    });
  } catch (error) {
    console.error('Error fetching registre stats:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
}
