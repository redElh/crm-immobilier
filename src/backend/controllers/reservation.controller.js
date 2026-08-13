import pool from '../config/db.js';
import { onVoyageurReservationCreated } from '../services/status-transition.service.js';

function toLocalDateString(val) {
  if (!val) return '';
  if (typeof val === 'string') return val.slice(0, 10);
  const d = new Date(val);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function rowToReservation(row) {
  return {
    id: String(row.id),
    propertyId: String(row.property_id),
    clientId: row.client_id ? String(row.client_id) : undefined,
    clientName: row.client_name || '',
    firstName: row.first_name || '',
    lastName: row.last_name || '',
    email: row.email || '',
    phone: row.phone || '',
    languages: row.languages || [],
    startDate: toLocalDateString(row.start_date),
    endDate: toLocalDateString(row.end_date),
    nights: row.nights || 0,
    adults: row.adults || 1,
    children: row.children || 0,
    babies: row.babies || 0,
    pricePerNight: Number(row.price_per_night) || 0,
    totalPrice: Number(row.total_price) || 0,
    optionsPrice: Number(row.options_price) || 0,
    grandTotal: Number(row.grand_total) || 0,
    depositPaid: Number(row.deposit_paid) || 0,
    balanceDue: Number(row.balance_due) || 0,
    status: row.status || 'option',
    options: Array.isArray(row.options) ? row.options : (typeof row.options === 'string' ? (() => { try { return JSON.parse(row.options); } catch { return []; } })() : []),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getReservations(req, res) {
  try {
    const { property_id, start_date, end_date, status, month, year } = req.query;
    let sql = 'SELECT * FROM reservations WHERE 1=1';
    const params = [];
    if (property_id) {
      params.push(property_id);
      sql += ` AND property_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }
    if (month && year) {
      params.push(`${year}-${String(month).padStart(2, '0')}`);
      sql += ` AND TO_CHAR(start_date, 'YYYY-MM') <= $${params.length}`;
      params.push(`${year}-${String(month).padStart(2, '0')}`);
      sql += ` AND TO_CHAR(end_date, 'YYYY-MM') >= $${params.length}`;
    }
    if (start_date) {
      params.push(start_date);
      sql += ` AND end_date >= $${params.length}`;
    }
    if (end_date) {
      params.push(end_date);
      sql += ` AND start_date <= $${params.length}`;
    }
    sql += ' ORDER BY start_date ASC';
    const result = await pool.query(sql, params);
    res.json(result.rows.map(rowToReservation));
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getReservationById(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM reservations WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    res.json(rowToReservation(result.rows[0]));
  } catch (error) {
    console.error('Error fetching reservation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createReservation(req, res) {
  try {
    const {
      propertyId, clientId, clientName, firstName, lastName, email, phone, languages,
      startDate, endDate, nights, adults, children, babies,
      pricePerNight, totalPrice, optionsPrice, grandTotal,
      depositPaid, balanceDue, status, options,
    } = req.body;
    if (!propertyId || !startDate || !endDate) {
      return res.status(400).json({ error: 'propertyId, startDate, and endDate are required' });
    }

    const optionsJson = JSON.stringify(Array.isArray(options) ? options : []);
    const result = await pool.query(
      `INSERT INTO reservations (
        property_id, client_id, client_name, first_name, last_name, email, phone, languages,
        start_date, end_date, nights, adults, children, babies,
        price_per_night, total_price, options_price, grand_total,
        deposit_paid, balance_due, status, options
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22::jsonb)
       RETURNING *`,
      [
        propertyId, clientId || null, clientName || '', firstName || '', lastName || '', email || '', phone || '',
        languages || [], startDate, endDate, nights || 0, adults || 1, children || 0, babies || 0,
        pricePerNight || 0, totalPrice || 0, optionsPrice || 0, grandTotal || 0,
        depositPaid || 0, balanceDue || 0, status || 'option', optionsJson,
      ]
    );
    res.status(201).json(rowToReservation(result.rows[0]));

    if (clientId) {
      try {
        const propRes = await pool.query('SELECT title, reference FROM properties WHERE id = $1', [propertyId]);
        const prop = propRes.rows[0] || {};
        const clRes = await pool.query(
          'SELECT client_type, agent_designe, agent_id FROM owner_clients WHERE id = $1',
          [clientId]
        );
        const cl = clRes.rows[0] || {};
        if ((cl.client_type || '').toLowerCase() === 'voyageur') {
          const agentIdFallback = req.user?.id ? String(req.user.id) : '';
          await onVoyageurReservationCreated(
            String(clientId),
            clientName || `${firstName || ''} ${lastName || ''}`.trim(),
            propertyId,
            prop.title || '',
            prop.reference || '',
            cl.agent_designe || '',
            cl.agent_id || agentIdFallback,
            Number(grandTotal) || Number(totalPrice) || 0,
            startDate,
            endDate
          );
        }
      } catch (syncErr) {
        console.error('Error creating voyageur contract/registre:', syncErr);
      }
    }
  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateReservation(req, res) {
  try {
    const { id } = req.params;
    const {
      propertyId, clientId, clientName, firstName, lastName, email, phone, languages,
      startDate, endDate, nights, adults, children, babies,
      pricePerNight, totalPrice, optionsPrice, grandTotal,
      depositPaid, balanceDue, status, options,
    } = req.body;
    const optionsJson = JSON.stringify(Array.isArray(options) ? options : []);
    const result = await pool.query(
      `UPDATE reservations SET
        property_id = $1,
        client_id = $2,
        client_name = $3,
        first_name = $4,
        last_name = $5,
        email = $6,
        phone = $7,
        languages = $8,
        start_date = $9,
        end_date = $10,
        nights = $11,
        adults = $12,
        children = $13,
        babies = $14,
        price_per_night = $15,
        total_price = $16,
        options_price = $17,
        grand_total = $18,
        deposit_paid = $19,
        balance_due = $20,
        status = $21,
        options = $22::jsonb,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $23 RETURNING *`,
      [
        propertyId, clientId || null, clientName, firstName, lastName, email, phone, languages,
        startDate, endDate, nights, adults, children, babies,
        pricePerNight, totalPrice, optionsPrice, grandTotal,
        depositPaid, balanceDue, status,
        optionsJson,
        id,
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    res.json(rowToReservation(result.rows[0]));
  } catch (error) {
    console.error('Error updating reservation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteReservation(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM reservations WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    res.json({ message: 'Reservation deleted', id: String(result.rows[0].id) });
  } catch (error) {
    console.error('Error deleting reservation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
