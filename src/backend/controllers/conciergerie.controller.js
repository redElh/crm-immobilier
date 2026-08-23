import pool from '../config/db.js';

// ─── PARTNERS ─────────────────────────────────────────────

export const getPartners = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*,
        (SELECT COUNT(*) FROM conciergerie_activities a WHERE a.partner_id = p.id) AS activity_count
      FROM conciergerie_partners p
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('getPartners error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const createPartner = async (req, res) => {
  try {
    const { name, contact_name, phone, email, address, commission_rate, contract_status, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Le nom du partenaire est requis' });
    const result = await pool.query(
      `INSERT INTO conciergerie_partners (name, contact_name, phone, email, address, commission_rate, contract_status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [name, contact_name || null, phone || null, email || null, address || null, commission_rate || 10, contract_status || 'en_cours', notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createPartner error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const updatePartner = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact_name, phone, email, address, commission_rate, contract_status, notes, is_active } = req.body;
    const result = await pool.query(
      `UPDATE conciergerie_partners SET name=$1, contact_name=$2, phone=$3, email=$4, address=$5,
       commission_rate=$6, contract_status=$7, notes=$8, is_active=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [name, contact_name || null, phone || null, email || null, address || null, commission_rate || 10, contract_status || 'en_cours', notes || null, is_active !== false, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Partenaire introuvable' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('updatePartner error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const deletePartner = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM conciergerie_partners WHERE id=$1 RETURNING id', [id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Partenaire introuvable' });
    res.json({ success: true });
  } catch (err) {
    console.error('deletePartner error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ─── ACTIVITIES ───────────────────────────────────────────

export const getActivities = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, p.name AS partner_name, p.commission_rate AS partner_commission_rate
      FROM conciergerie_activities a
      LEFT JOIN conciergerie_partners p ON a.partner_id = p.id
      ORDER BY a.created_at DESC
    `);
    const activities = result.rows;
    if (activities.length > 0) {
      const ids = activities.map(a => a.id);
      const tiersResult = await pool.query(
        `SELECT * FROM conciergerie_pricing_tiers WHERE activity_id = ANY($1) ORDER BY min_persons ASC`,
        [ids]
      );
      const tiersMap = {};
      for (const t of tiersResult.rows) {
        if (!tiersMap[t.activity_id]) tiersMap[t.activity_id] = [];
        tiersMap[t.activity_id].push(t);
      }
      for (const a of activities) {
        a.pricing_tiers = tiersMap[a.id] || [];
      }
    }
    res.json(activities);
  } catch (err) {
    console.error('getActivities error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const createActivity = async (req, res) => {
  try {
    const { name, category, partner_id, duration_hours, min_capacity, max_capacity, price, commission_rate,
      description, photo_url, short_description, whatsapp, contact_email, included_items, not_included_items, availability, photos } = req.body;
    if (!name || !category || !price) return res.status(400).json({ error: 'Nom, catégorie et prix sont requis' });
    const result = await pool.query(
      `INSERT INTO conciergerie_activities (name, category, partner_id, duration_hours, min_capacity, max_capacity, price, commission_rate, description, photo_url, short_description, whatsapp, contact_email, included_items, not_included_items, availability, photos)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
      [name, category, partner_id || null, duration_hours || null, min_capacity || 1, max_capacity || 12, price, commission_rate || 10,
        description || null, photo_url || null, short_description || null, whatsapp || null, contact_email || null,
        included_items?.length ? included_items : null, not_included_items?.length ? not_included_items : null,
        availability || 'sur_demande', photos?.length ? photos : null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createActivity error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const updateActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, partner_id, duration_hours, min_capacity, max_capacity, price, commission_rate,
      description, photo_url, is_active, short_description, whatsapp, contact_email, included_items, not_included_items, availability, photos } = req.body;
    const result = await pool.query(
      `UPDATE conciergerie_activities SET name=$1, category=$2, partner_id=$3, duration_hours=$4,
       min_capacity=$5, max_capacity=$6, price=$7, commission_rate=$8, description=$9, photo_url=$10,
       is_active=$11, short_description=$12, whatsapp=$13, contact_email=$14, included_items=$15,
       not_included_items=$16, availability=$17, photos=$18, updated_at=NOW()
       WHERE id=$19 RETURNING *`,
      [name, category, partner_id || null, duration_hours || null, min_capacity || 1, max_capacity || 12, price, commission_rate || 10,
        description || null, photo_url || null, is_active !== false, short_description || null, whatsapp || null,
        contact_email || null, included_items?.length ? included_items : null, not_included_items?.length ? not_included_items : null,
        availability || 'sur_demande', photos?.length ? photos : null, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Activité introuvable' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('updateActivity error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM conciergerie_activities WHERE id=$1 RETURNING id', [id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Activité introuvable' });
    res.json({ success: true });
  } catch (err) {
    console.error('deleteActivity error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ─── RESERVATIONS ─────────────────────────────────────────

export const getReservations = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, a.name AS activity_name, a.category AS activity_category, a.price AS activity_price
      FROM conciergerie_reservations r
      LEFT JOIN conciergerie_activities a ON r.activity_id = a.id
      ORDER BY r.reservation_date DESC, r.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('getReservations error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const createReservation = async (req, res) => {
  try {
    const { activity_id, client_id, client_name, client_email, client_phone, reservation_date, participants, notes } = req.body;
    if (!activity_id || !client_name || !reservation_date) {
      return res.status(400).json({ error: 'Activité, nom du client et date sont requis' });
    }
    const actResult = await pool.query('SELECT price, commission_rate FROM conciergerie_activities WHERE id=$1', [activity_id]);
    if (!actResult.rows.length) return res.status(404).json({ error: 'Activité introuvable' });
    const activity = actResult.rows[0];
    const qty = participants || 1;

    let pricePerPerson = Number(activity.price);
    let commissionRate = Number(activity.commission_rate);

    const tierResult = await pool.query(
      `SELECT price_per_person, commission_rate FROM conciergerie_pricing_tiers
       WHERE activity_id = $1 AND $2 >= min_persons AND $2 <= max_persons LIMIT 1`,
      [activity_id, qty]
    );
    if (tierResult.rows.length > 0) {
      pricePerPerson = Number(tierResult.rows[0].price_per_person);
      if (tierResult.rows[0].commission_rate != null) {
        commissionRate = Number(tierResult.rows[0].commission_rate);
      }
    }

    const total_price = pricePerPerson * qty;
    const commission_amount = total_price * (commissionRate / 100);

    const result = await pool.query(
      `INSERT INTO conciergerie_reservations (activity_id, client_id, client_name, client_email, client_phone, reservation_date, participants, total_price, commission_amount, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [activity_id, client_id || null, client_name, client_email || null, client_phone || null, reservation_date, qty, total_price, commission_amount, notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createReservation error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const updateReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const result = await pool.query(
      `UPDATE conciergerie_reservations SET status=$1, notes=$2, updated_at=NOW() WHERE id=$3 RETURNING *`,
      [status || 'en_attente', notes || null, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Réservation introuvable' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('updateReservation error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM conciergerie_reservations WHERE id=$1 RETURNING id', [id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Réservation introuvable' });
    res.json({ success: true });
  } catch (err) {
    console.error('deleteReservation error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ─── STATS ────────────────────────────────────────────────

export const getConciergerieStats = async (req, res) => {
  try {
    const [activities, partners, reservations, commissions] = await Promise.all([
      pool.query('SELECT COUNT(*) AS total, SUM(CASE WHEN is_active THEN 1 ELSE 0 END) AS active FROM conciergerie_activities'),
      pool.query('SELECT COUNT(*) AS total, SUM(CASE WHEN is_active THEN 1 ELSE 0 END) AS active FROM conciergerie_partners'),
      pool.query(`SELECT COUNT(*) AS total,
        SUM(CASE WHEN status='en_attente' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status='confirmee' THEN 1 ELSE 0 END) AS confirmed,
        SUM(CASE WHEN status='terminee' THEN 1 ELSE 0 END) AS completed
        FROM conciergerie_reservations`),
      pool.query(`SELECT COALESCE(SUM(commission_amount),0) AS total_commissions
        FROM conciergerie_reservations WHERE status != 'annulee'`),
    ]);
    res.json({
      activeActivities: Number(activities.rows[0]?.active) || 0,
      totalActivities: Number(activities.rows[0]?.total) || 0,
      activePartners: Number(partners.rows[0]?.active) || 0,
      totalPartners: Number(partners.rows[0]?.total) || 0,
      totalReservations: Number(reservations.rows[0]?.total) || 0,
      pendingReservations: Number(reservations.rows[0]?.pending) || 0,
      confirmedReservations: Number(reservations.rows[0]?.confirmed) || 0,
      completedReservations: Number(reservations.rows[0]?.completed) || 0,
      totalCommissions: Number(commissions.rows[0]?.total_commissions) || 0,
    });
  } catch (err) {
    console.error('getConciergerieStats error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getCommissions = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id AS partner_id, p.name AS partner_name, p.commission_rate,
        COUNT(r.id) AS reservation_count,
        COALESCE(SUM(r.total_price),0) AS total_revenue,
        COALESCE(SUM(r.commission_amount),0) AS total_commission
      FROM conciergerie_partners p
      LEFT JOIN conciergerie_activities a ON a.partner_id = p.id
      LEFT JOIN conciergerie_reservations r ON r.activity_id = a.id AND r.status != 'annulee'
      WHERE p.is_active = true
      GROUP BY p.id, p.name, p.commission_rate
      ORDER BY total_commission DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('getCommissions error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ─── PHOTO UPLOAD ──────────────────────────────────────────

export const uploadActivityPhotos = async (req, res) => {
  try {
    if (!req.files?.length) return res.status(400).json({ error: 'Aucun fichier uploadé' });
    const urls = req.files.map(f => `/uploads/conciergerie/${f.filename}`);
    res.json({ urls });
  } catch (err) {
    console.error('uploadActivityPhotos error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ─── PRICING TIERS ────────────────────────────────────────

export const getPricingTiers = async (req, res) => {
  try {
    const { activityId } = req.params;
    const result = await pool.query(
      'SELECT * FROM conciergerie_pricing_tiers WHERE activity_id = $1 ORDER BY min_persons ASC',
      [activityId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getPricingTiers error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const createPricingTier = async (req, res) => {
  try {
    const { activityId } = req.params;
    const { min_persons, max_persons, price_per_person, commission_rate } = req.body;
    if (!min_persons || !max_persons || !price_per_person) {
      return res.status(400).json({ error: 'Min, max et prix par personne sont requis' });
    }
    const result = await pool.query(
      `INSERT INTO conciergerie_pricing_tiers (activity_id, min_persons, max_persons, price_per_person, commission_rate)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [activityId, min_persons, max_persons, price_per_person, commission_rate || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createPricingTier error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const updatePricingTier = async (req, res) => {
  try {
    const { id } = req.params;
    const { min_persons, max_persons, price_per_person, commission_rate } = req.body;
    const result = await pool.query(
      `UPDATE conciergerie_pricing_tiers SET min_persons=$1, max_persons=$2, price_per_person=$3,
       commission_rate=$4, updated_at=NOW() WHERE id=$5 RETURNING *`,
      [min_persons, max_persons, price_per_person, commission_rate || null, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Palier introuvable' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('updatePricingTier error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const deletePricingTier = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM conciergerie_pricing_tiers WHERE id=$1 RETURNING id', [id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Palier introuvable' });
    res.json({ success: true });
  } catch (err) {
    console.error('deletePricingTier error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
