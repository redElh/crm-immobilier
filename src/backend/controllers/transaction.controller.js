import pool from '../config/db.js';
import { onClientStatusChange, onMandatSigned, onMandatResiliated, onMandatExpired } from '../services/status-transition.service.js';

function rowToTransaction(row) {
  return {
    id: String(row.id),
    reference: row.reference,
    clientId: String(row.client_id),
    clientName: row.client_name,
    clientType: row.client_type,
    propertyId: row.property_id ? String(row.property_id) : null,
    propertyTitle: row.property_title,
    propertyRef: row.property_ref,
    type: row.type,
    etape: row.etape,
    role: row.role,
    dateContracted: row.date_contracted ? new Date(row.date_contracted).toISOString().slice(0, 10) : '',
    dateReservation: row.date_reservation ? new Date(row.date_reservation).toISOString().slice(0, 10) : '',
    dateExpiration: row.date_expiration ? new Date(row.date_expiration).toISOString().slice(0, 10) : '',
    montant: row.montant,
    agentName: row.agent_name,
    agentId: row.agent_id,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function generateReference(prefix) {
  const year = new Date().getFullYear();
  const result = await pool.query(
    `SELECT COUNT(*) as count FROM transactions WHERE reference LIKE $1`,
    [`${prefix}-${year}-%`]
  );
  const count = parseInt(result.rows[0].count) + 1;
  return `${prefix}-${year}-${String(count).padStart(3, '0')}`;
}

export async function getTransactions(req, res) {
  try {
    const { client_id, property_id, type, etape, agent_id, search } = req.query;

    let query = 'SELECT * FROM transactions';
    const conditions = [];
    const values = [];
    let index = 1;

    if (client_id) {
      conditions.push(`client_id = $${index++}`);
      values.push(client_id);
    }
    if (property_id) {
      conditions.push(`property_id = $${index++}`);
      values.push(property_id);
    }
    if (type) {
      conditions.push(`type = $${index++}`);
      values.push(type);
    }
    if (etape) {
      conditions.push(`etape = $${index++}`);
      values.push(etape);
    }
    if (agent_id) {
      conditions.push(`agent_id = $${index++}`);
      values.push(agent_id);
    }
    if (search) {
      conditions.push(`(reference ILIKE $${index} OR client_name ILIKE $${index} OR property_title ILIKE $${index})`);
      values.push(`%${search}%`);
      index++;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, values);
    const transactions = result.rows.map(rowToTransaction);
    res.json(transactions);
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des transactions' });
  }
}

export async function getTransactionById(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM transactions WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction non trouvée' });
    }
    res.json(rowToTransaction(result.rows[0]));
  } catch (err) {
    console.error('Error fetching transaction:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération de la transaction' });
  }
}

export async function createTransaction(req, res) {
  try {
    const {
      clientId, clientType, clientName, propertyId, propertyTitle, propertyRef,
      type, etape, role, montant, agentName, agentId, dateContracted, dateExpiration, notes
    } = req.body;

    const prefix = type === 'vente' ? 'VNT' : type === 'location' ? 'LOC' : 'TRX';
    const reference = await generateReference(prefix);

    const result = await pool.query(
      `INSERT INTO transactions
        (reference, client_id, client_name, client_type, property_id, property_title, property_ref,
         type, etape, role, montant, agent_name, agent_id, date_contracted, date_expiration, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        reference, clientId, clientName, clientType, propertyId || null, propertyTitle, propertyRef,
        type, etape || 'prospect', role, montant, agentName, agentId,
        dateContracted || null, dateExpiration || null, notes
      ]
    );

    const transaction = rowToTransaction(result.rows[0]);

    if (clientId && etape) {
      try {
        await onClientStatusChange(clientId, etape, clientType, clientName, agentName, agentId);
      } catch (cascadeErr) {
        console.error('Error cascading status change:', cascadeErr);
      }
    }

    res.status(201).json(transaction);
  } catch (err) {
    console.error('Error creating transaction:', err);
    res.status(500).json({ error: 'Erreur lors de la création de la transaction' });
  }
}

export async function updateTransaction(req, res) {
  try {
    const { id } = req.params;
    const existing = await pool.query('SELECT * FROM transactions WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction non trouvée' });
    }

    const fields = [];
    const values = [];
    let index = 1;

    const updatable = [
      'clientId', 'clientType', 'clientName', 'propertyId', 'propertyTitle', 'propertyRef',
      'type', 'etape', 'role', 'montant', 'agentName', 'agentId',
      'dateContracted', 'dateReservation', 'dateExpiration', 'notes'
    ];
    const dbColumnMap = {
      clientId: 'client_id', clientType: 'client_type', clientName: 'client_name',
      propertyId: 'property_id', propertyTitle: 'property_title', propertyRef: 'property_ref',
      dateContracted: 'date_contracted', dateReservation: 'date_reservation',
      dateExpiration: 'date_expiration', agentName: 'agent_name', agentId: 'agent_id'
    };

    for (const field of updatable) {
      if (req.body[field] !== undefined) {
        const col = dbColumnMap[field] || field;
        fields.push(`${col} = $${index++}`);
        values.push(req.body[field]);
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE transactions SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`,
      values
    );

    const transaction = rowToTransaction(result.rows[0]);
    const oldRow = existing.rows[0];
    const newEtape = req.body.etape;

    if (newEtape && newEtape !== oldRow.etape) {
      try {
        await onClientStatusChange(
          transaction.clientId,
          newEtape,
          transaction.clientType || oldRow.client_type,
          transaction.clientName || oldRow.client_name,
          transaction.agentName || oldRow.agent_name,
          transaction.agentId || oldRow.agent_id
        );
      } catch (cascadeErr) {
        console.error('Error cascading status change:', cascadeErr);
      }
    }

    res.json(transaction);
  } catch (err) {
    console.error('Error updating transaction:', err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la transaction' });
  }
}

export async function deleteTransaction(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM transactions WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction non trouvée' });
    }
    res.json({ message: 'Transaction supprimée avec succès' });
  } catch (err) {
    console.error('Error deleting transaction:', err);
    res.status(500).json({ error: 'Erreur lors de la suppression de la transaction' });
  }
}

export async function signTransaction(req, res) {
  try {
    const { id } = req.params;
    const existing = await pool.query('SELECT * FROM transactions WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction non trouvée' });
    }

    const result = await pool.query(
      `UPDATE transactions SET etape = 'actif', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );
    const transaction = rowToTransaction(result.rows[0]);
    const row = existing.rows[0];

    try {
      await onMandatSigned(
        transaction.clientId || row.client_id,
        row.client_type,
        row.client_name,
        row.property_id,
        row.property_title,
        row.property_ref,
        row.agent_name,
        row.agent_id,
        row.type,
        row.montant,
        row.date_expiration
      );
    } catch (cascadeErr) {
      console.error('Error cascading mandat signed:', cascadeErr);
    }

    res.json(transaction);
  } catch (err) {
    console.error('Error signing transaction:', err);
    res.status(500).json({ error: 'Erreur lors de la signature de la transaction' });
  }
}

export async function resiliateTransaction(req, res) {
  try {
    const { id } = req.params;
    const existing = await pool.query('SELECT * FROM transactions WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction non trouvée' });
    }

    const result = await pool.query(
      `UPDATE transactions SET etape = 'resilie', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );
    const transaction = rowToTransaction(result.rows[0]);
    const row = existing.rows[0];

    try {
      await onMandatResiliated(row.client_id, row.agent_name, row.agent_id);
    } catch (cascadeErr) {
      console.error('Error cascading mandat resiliation:', cascadeErr);
    }

    res.json(transaction);
  } catch (err) {
    console.error('Error resiliating transaction:', err);
    res.status(500).json({ error: 'Erreur lors de la résiliation de la transaction' });
  }
}

export async function expireTransaction(req, res) {
  try {
    const { id } = req.params;
    const existing = await pool.query('SELECT * FROM transactions WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction non trouvée' });
    }

    const result = await pool.query(
      `UPDATE transactions SET etape = 'expire', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );
    const transaction = rowToTransaction(result.rows[0]);
    const row = existing.rows[0];

    try {
      await onMandatExpired(row.client_id, row.agent_name, row.agent_id);
    } catch (cascadeErr) {
      console.error('Error cascading mandat expiration:', cascadeErr);
    }

    res.json(transaction);
  } catch (err) {
    console.error('Error expiring transaction:', err);
    res.status(500).json({ error: 'Erreur lors de l\'expiration de la transaction' });
  }
}
