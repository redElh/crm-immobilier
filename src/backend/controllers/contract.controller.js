import pool from '../config/db.js';
import { unlink } from 'fs/promises';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { sendContractEmail } from '../services/email.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONTRACT_SELECT = `
  SELECT c.*,
    p.address AS property_address,
    p.city AS property_city,
    p.district AS property_district,
    p.property_type AS property_type_label,
    p.owner AS property_owner,
    oc.first_name AS owner_first_name,
    oc.last_name AS owner_last_name,
    oc.phone AS owner_phone,
    oc.email AS owner_email,
    oc.client_type AS owner_client_type,
    oc.id AS owner_client_id,
    vc.first_name AS party_a_first_name,
    vc.last_name AS party_a_last_name,
    vc.phone AS party_a_phone,
    vc.email AS party_a_email,
    vc.data AS party_a_data
  FROM contracts c
  LEFT JOIN properties p ON p.id = c.property_id
  LEFT JOIN owner_clients oc ON oc.id = p.client_id
    OR (p.client_id IS NULL AND p.owner IS NOT NULL AND oc.email IS NOT NULL AND oc.email = p.owner->>'email')
  LEFT JOIN owner_clients vc ON vc.id = c.client_id
`;

export async function insertContractHistory(conn, contractId, action, details, agentName) {
  const db = conn || pool;
  try {
    await db.query(
      `INSERT INTO contract_history (contract_id, action, details, agent_name)
       VALUES ($1, $2, $3, $4)`,
      [contractId, action, details || '', agentName || '']
    );
  } catch (error) {
    console.error('Error recording contract history:', error);
  }
}

// JWT payload only carries { id, role }, so resolve the actor's display name
// from the users table to record a correct agent_name in the history.
async function resolveActorName(req, fallback) {
  const userId = req.user && req.user.id != null ? String(req.user.id) : '';
  if (!userId) return fallback || '';
  try {
    const { rows } = await pool.query(
      'SELECT first_name, last_name FROM users WHERE id = $1',
      [userId]
    );
    if (rows.length > 0) {
      const name = [rows[0].first_name, rows[0].last_name].filter(Boolean).join(' ').trim();
      if (name) return name;
    }
  } catch (error) {
    console.error('Error resolving actor name:', error);
  }
  return fallback || '';
}

function parseJson(value) {
  if (value == null) return {};
  if (typeof value === 'string') {
    try { return JSON.parse(value || '{}'); } catch { return {}; }
  }
  return value;
}

function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function parseOwnerJson(row) {
  if (typeof row.property_owner === 'string') {
    try { return JSON.parse(row.property_owner || '{}'); } catch { return {}; }
  }
  return row.property_owner || {};
}

function buildPartieA(row) {
  const type = row.client_type || '';
  const name = [row.party_a_first_name, row.party_a_last_name].filter(Boolean).join(' ').trim()
    || row.client_name || '';
  return {
    id: row.client_id ? String(row.client_id) : '',
    name,
    type,
    phone: row.party_a_phone || '',
    email: row.party_a_email || '',
    role: type || 'Partie A',
  };
}

function buildPartieB(row) {
  const ownerObj = parseOwnerJson(row);
  const name = [row.owner_first_name, row.owner_last_name].filter(Boolean).join(' ').trim()
    || [ownerObj.firstName, ownerObj.lastName].filter(Boolean).join(' ').trim()
    || ownerObj.name || '';
  const type = row.owner_client_type || 'Bailleur';
  const id = row.owner_client_id ? String(row.owner_client_id) : (ownerObj.id ? String(ownerObj.id) : '');
  return {
    id,
    name,
    type,
    phone: row.owner_phone || ownerObj.phone || '',
    email: row.owner_email || ownerObj.email || '',
    role: 'Propriétaire',
  };
}

function rowToContract(row) {
  const propertyAddress = [...new Set([row.property_address, row.property_city, row.property_district].filter(Boolean))].join(', ');
  const partyAData = parseJson(row.party_a_data);
  const documents = Array.isArray(row.documents) ? row.documents : [];
  return {
    id: String(row.id),
    clientId: row.client_id ? String(row.client_id) : undefined,
    propertyId: row.property_id ? String(row.property_id) : undefined,
    contractType: row.contract_type,
    status: row.status,
    startDate: row.start_date ? new Date(row.start_date).toISOString().slice(0, 10) : '',
    endDate: row.end_date ? new Date(row.end_date).toISOString().slice(0, 10) : '',
    amount: row.amount ? Number(row.amount) : 0,
    notes: row.notes || '',
    clientName: row.client_name || '',
    clientType: row.client_type || '',
    propertyTitle: row.property_title || '',
    propertyRef: row.property_ref || '',
    propertyAddress,
    propertyTypeLabel: row.property_type_label || '',
    reference: row.reference || '',
    role: row.role || '',
    agentName: row.agent_name || '',
    agentId: row.agent_id ? String(row.agent_id) : undefined,
    dateReservation: row.date_reservation ? new Date(row.date_reservation).toISOString().slice(0, 10) : '',
    dateExpiration: row.date_expiration ? new Date(row.date_expiration).toISOString().slice(0, 10) : '',
    // Location saisonnière financials come from the linked voyageur client's data
    acompteVerse: partyAData.acompteVersee != null ? Number(partyAData.acompteVersee) : undefined,
    soldeRestant: partyAData.soldeRestant != null ? Number(partyAData.soldeRestant) : undefined,
    caution: partyAData.caution != null ? Number(partyAData.caution)
      : partyAData.cautionMontant != null ? Number(partyAData.cautionMontant)
      : partyAData.cautionsMontant != null ? Number(partyAData.cautionsMontant) : undefined,
    documents,
    partieA: buildPartieA(row),
    partieB: buildPartieB(row),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getContracts(req, res) {
  try {
    const { client_id, property_id, status, type, search, agent_id } = req.query;
    let sql = `${CONTRACT_SELECT} WHERE 1=1`;
    const params = [];
    if (client_id) {
      params.push(client_id);
      sql += ` AND c.client_id = $${params.length}`;
    }
    if (property_id) {
      params.push(property_id);
      sql += ` AND c.property_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      sql += ` AND c.status = $${params.length}`;
    }
    if (type) {
      params.push(type);
      sql += ` AND c.contract_type = $${params.length}`;
    }
    if (agent_id) {
      params.push(agent_id);
      sql += ` AND c.agent_id = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (c.reference ILIKE $${params.length} OR c.client_name ILIKE $${params.length} OR c.property_title ILIKE $${params.length})`;
    }
    sql += ' ORDER BY c.created_at DESC';
    const result = await pool.query(sql, params);
    res.json(result.rows.map(rowToContract));
  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getContractById(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(`${CONTRACT_SELECT} WHERE c.id = $1`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    res.json(rowToContract(result.rows[0]));
  } catch (error) {
    console.error('Error fetching contract:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getContractsByClient(req, res) {
  try {
    const { client_id } = req.params;
    const result = await pool.query(
      `${CONTRACT_SELECT} WHERE c.client_id = $1 ORDER BY c.created_at DESC`,
      [client_id]
    );
    res.json(result.rows.map(rowToContract));
  } catch (error) {
    console.error('Error fetching contracts by client:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getContractStats(req, res) {
  try {
    const [totalResult, byStatusResult, byTypeResult] = await Promise.all([
      pool.query('SELECT COUNT(*) AS total FROM contracts'),
      pool.query(
        `SELECT status, COUNT(*)::int AS count
         FROM contracts GROUP BY status ORDER BY status`
      ),
      pool.query(
        `SELECT contract_type, COUNT(*)::int AS count
         FROM contracts GROUP BY contract_type ORDER BY contract_type`
      ),
    ]);

    const byStatus = {};
    for (const row of byStatusResult.rows) {
      byStatus[row.status] = row.count;
    }

    const byType = {};
    for (const row of byTypeResult.rows) {
      byType[row.contract_type] = row.count;
    }

    res.json({
      total: Number(totalResult.rows[0].total),
      byStatus,
      byType,
    });
  } catch (error) {
    console.error('Error fetching contract stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createContract(req, res) {
  try {
    const {
      clientId, propertyId, contractType, status,
      startDate, endDate, amount, notes,
      clientName, clientType, propertyTitle, propertyRef,
      reference, role, agentName, agentId,
      dateReservation, dateExpiration,
    } = req.body;
    if (!clientId) {
      return res.status(400).json({ error: 'clientId is required' });
    }

    let finalReference = reference;
    if (!finalReference) {
      const year = new Date().getFullYear();
      const countResult = await pool.query(
        `SELECT COUNT(*)::int AS cnt FROM contracts`
      );
      const nextNum = countResult.rows[0].cnt + 1;
      finalReference = `CTR-${year}-${String(nextNum).padStart(3, '0')}`;
    }

    const result = await pool.query(
      `INSERT INTO contracts (
        client_id, property_id, contract_type, status, start_date, end_date,
        amount, notes, client_name, client_type, property_title, property_ref,
        reference, role, agent_name, agent_id, date_reservation, date_expiration
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       RETURNING *`,
      [
        clientId, propertyId || null, contractType || 'location_saisonniere',
        status || 'en_cours', startDate || null, endDate || null,
        amount || 0, notes || '',
        clientName || '', clientType || '', propertyTitle || '', propertyRef || '',
        finalReference, role || '', agentName || '', agentId || null,
        dateReservation || null, dateExpiration || null,
      ]
    );
    const created = rowToContract(result.rows[0]);
    const actorName = await resolveActorName(req, agentName || 'Système');
    insertContractHistory(null, created.id, 'Contrat créé', `Contrat ${finalReference} créé`, actorName);
    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating contract:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateContract(req, res) {
  try {
    const { id } = req.params;
    const {
      clientId, propertyId, contractType, status,
      startDate, endDate, amount, notes,
      clientName, clientType, propertyTitle, propertyRef,
      reference, role, agentName, agentId,
      dateReservation, dateExpiration,
    } = req.body;
    const before = await pool.query('SELECT * FROM contracts WHERE id = $1', [id]);
    if (before.rows.length === 0) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    const oldRow = before.rows[0];

    const result = await pool.query(
      `UPDATE contracts SET
        client_id = COALESCE($1, client_id),
        property_id = COALESCE($2, property_id),
        contract_type = COALESCE($3, contract_type),
        status = COALESCE($4, status),
        start_date = COALESCE($5, start_date),
        end_date = COALESCE($6, end_date),
        amount = COALESCE($7, amount),
        notes = COALESCE($8, notes),
        client_name = COALESCE($9, client_name),
        client_type = COALESCE($10, client_type),
        property_title = COALESCE($11, property_title),
        property_ref = COALESCE($12, property_ref),
        reference = COALESCE($13, reference),
        role = COALESCE($14, role),
        agent_name = COALESCE($15, agent_name),
        agent_id = COALESCE($16, agent_id),
        date_reservation = COALESCE($17, date_reservation),
        date_expiration = COALESCE($18, date_expiration),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $19 RETURNING *`,
      [
        clientId, propertyId, contractType, status,
        startDate, endDate, amount, notes,
        clientName, clientType, propertyTitle, propertyRef,
        reference, role, agentName, agentId,
        dateReservation, dateExpiration, id,
      ]
    );

    const updated = rowToContract(result.rows[0]);
    const actorName = await resolveActorName(req, updated.agentName || 'Agent');

    if (status && status !== oldRow.status) {
      insertContractHistory(
        null, updated.id, 'Changement de statut',
        `Statut passé de "${oldRow.status}" à "${status}"`,
        actorName
      );
    }
    if (notes !== undefined && notes !== (oldRow.notes || '')) {
      insertContractHistory(
        null, updated.id, 'Modification de la note',
        notes ? 'Note interne mise à jour' : 'Note interne supprimée',
        actorName
      );
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating contract:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getContractHistory(req, res) {
  try {
    const { id } = req.params;
    const { action, from, to, page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const conditions = ['h.contract_id = $1'];
    const params = [id];
    if (action) {
      params.push(action);
      conditions.push(`h.action = $${params.length}`);
    }
    if (from) {
      params.push(from);
      conditions.push(`h.created_at >= $${params.length}::date`);
    }
    if (to) {
      params.push(to);
      conditions.push(`h.created_at < ($${params.length}::date + interval '1 day')`);
    }
    const whereSql = conditions.join(' AND ');

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM contract_history h WHERE ${whereSql}`,
      params
    );
    const total = countResult.rows[0].total;

    const result = await pool.query(
      `SELECT h.id, h.action, h.details, h.agent_name AS agent, h.created_at AS date
       FROM contract_history h
       WHERE ${whereSql}
       ORDER BY h.created_at DESC, h.id DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limitNum, offset]
    );

    res.json({
      items: result.rows.map(r => ({
        id: String(r.id),
        action: r.action,
        details: r.details,
        agent: r.agent,
        date: r.date,
      })),
      total,
      page: pageNum,
      pages: Math.max(1, Math.ceil(total / limitNum)),
    });
  } catch (error) {
    console.error('Error fetching contract history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function uploadContractFile(req, res) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Aucun fichier reçu' });
    }
    const files = req.files.map(f => ({
      id: `${Date.now()}-${f.filename}`,
      url: `/uploads/contracts/${f.filename}`,
      filename: f.filename,
      name: f.originalname,
      mimetype: f.mimetype,
      size: formatFileSize(f.size),
    }));
    res.json({ files });
  } catch (error) {
    console.error('Error uploading contract file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateContractDocuments(req, res) {
  try {
    const { id } = req.params;
    const { documents } = req.body;
    const result = await pool.query(
      `UPDATE contracts SET documents = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [JSON.stringify(Array.isArray(documents) ? documents : []), id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    res.json(rowToContract(result.rows[0]));
  } catch (error) {
    console.error('Error updating contract documents:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteContractDocument(req, res) {
  try {
    const { id, docId } = req.params;
    const existing = await pool.query('SELECT documents FROM contracts WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    const documents = Array.isArray(existing.rows[0].documents) ? existing.rows[0].documents : [];
    const target = documents.find(d => String(d.id) === String(docId));
    const remaining = documents.filter(d => String(d.id) !== String(docId));
    if (target && target.url && !target.url.startsWith('#')) {
      try {
        await unlink(join(__dirname, '..', target.url));
      } catch { /* file may not exist on disk */ }
    }
    await pool.query(
      `UPDATE contracts SET documents = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [JSON.stringify(remaining), id]
    );
    res.json({ success: true, documents: remaining });
  } catch (error) {
    console.error('Error deleting contract document:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function sendContractToProprietaire(req, res) {
  try {
    const { id } = req.params;
    const { subject, message, senderName } = req.body;
    const result = await pool.query(`${CONTRACT_SELECT} WHERE c.id = $1`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    const row = result.rows[0];
    const partieB = buildPartieB(row);
    if (!partieB.email) {
      return res.status(400).json({ error: 'Aucun email renseigné pour le propriétaire' });
    }
    const contract = rowToContract(row);
    await sendContractEmail({
      to: partieB.email,
      ownerName: partieB.name,
      subject: subject || `Contrat ${contract.reference} — ${contract.propertyTitle}`,
      message,
      contract,
      senderName,
    });
    res.json({ success: true, to: partieB.email });
  } catch (error) {
    console.error('Error sending contract to proprietaire:', error);
    res.status(500).json({ error: "Erreur lors de l'envoi de l'email" });
  }
}

// Booking keys stored in the voyageur's owner_clients.data that describe a
// specific stay. They are cleared when a saisonnière contract is deleted so
// the client is fully reset to its initial "Brouillon / En recherche" state.
const VOYAGEUR_BOOKING_DATA_KEYS = [
  'dateArrivee', 'dateDepart', 'nbNuits', 'tarifNuit',
  'acompteVersee', 'soldeRestant', 'caution', 'cautionMontant', 'cautionsMontant',
  'montantTotalAvecOptions', 'montantTotalHorsOptions', 'proprieteId',
];

export async function deleteContract(req, res) {
  try {
    const { id } = req.params;
    const existing = await pool.query('SELECT * FROM contracts WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    const contract = existing.rows[0];

    // Unlink uploaded documents from disk
    const documents = Array.isArray(contract.documents) ? contract.documents : [];
    for (const doc of documents) {
      if (doc && doc.url && !doc.url.startsWith('#')) {
        try { await unlink(join(__dirname, '..', doc.url)); } catch { /* file may not exist on disk */ }
      }
    }

    // Voyageur / saisonnière contract: undo the full cascade created when the
    // reservation was confirmed (contract + reservation + registre + transaction
    // + voyageur status/data).
    const isVoyageur = String(contract.contract_type || '') === 'location_saisonniere'
      || String(contract.client_type || '').toLowerCase() === 'voyageur';

    if (isVoyageur) {
      const clientId = contract.client_id != null ? String(contract.client_id) : '';

      // 1) Cancel the linked reservation(s) → the reserved days become disponible
      if (clientId) {
        const resDel = await pool.query(
          `DELETE FROM reservations
           WHERE client_id = $1
             AND ($2::int IS NULL OR property_id = $2)
             AND ($3::date IS NULL OR end_date >= $3)
             AND ($4::date IS NULL OR start_date <= $4)`,
          [clientId, contract.property_id, contract.start_date, contract.end_date]
        );
        if (resDel.rowCount === 0) {
          await pool.query(
            `DELETE FROM reservations WHERE client_id = $1 AND ($2::int IS NULL OR property_id = $2)`,
            [clientId, contract.property_id]
          );
        }
      }

      // 2) Reset the voyageur: statut -> "En recherche", statut réservation -> "Brouillon",
      //    and clear the booking data so the client is back to its draft state.
      if (clientId) {
        const { rows: clientRows } = await pool.query(
          'SELECT data FROM owner_clients WHERE id = $1',
          [clientId]
        );
        if (clientRows.length > 0) {
          const data = { ...parseJson(clientRows[0].data) };
          for (const key of VOYAGEUR_BOOKING_DATA_KEYS) delete data[key];
          await pool.query(
            `UPDATE owner_clients SET statut_metier = 'En recherche', mandat_status = 'Brouillon',
               data = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [JSON.stringify(data), clientId]
          );
        } else {
          await pool.query(
            `UPDATE owner_clients SET statut_metier = 'En recherche', mandat_status = 'Brouillon',
               updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [clientId]
          );
        }
      }

      // 3) Delete the linked registre entry created by the cascade
      if (clientId) {
        await pool.query(
          `DELETE FROM registre WHERE client_id = $1 AND type = 'location_saisonniere'`,
          [clientId]
        );
      }

      // 4) Delete the linked saisonnière transaction created by the cascade
      if (clientId) {
        await pool.query(
          `DELETE FROM transactions WHERE client_id = $1 AND type = 'location_saisonniere'`,
          [clientId]
        );
      }
    }

    // Contract deletion cascades to contract_history (FK ON DELETE CASCADE).
    await pool.query('DELETE FROM contracts WHERE id = $1', [id]);
    res.json({ message: 'Contract deleted', id: String(contract.id) });
  } catch (error) {
    console.error('Error deleting contract:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
