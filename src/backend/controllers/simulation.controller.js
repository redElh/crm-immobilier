import pool from '../config/db.js';

export async function getSimulations(req, res) {
  try {
    const { clientId, type } = req.query;
    let query = `
      SELECT s.*, 
        COALESCE(
          (SELECT name FROM owner_clients WHERE id = s.client_id),
          s.client_name
        ) as client_name_resolved
      FROM simulations s WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (clientId) {
      query += ` AND s.client_id = $${idx++}`;
      params.push(parseInt(clientId));
    }
    if (type) {
      query += ` AND s.type = $${idx++}`;
      params.push(type);
    }

    query += ' ORDER BY s.created_at DESC';

    const { rows } = await pool.query(query, params);

    const mapped = rows.map(row => ({
      id: String(row.id),
      date: row.created_at?.toISOString?.() || row.created_at,
      type: row.type,
      financingType: row.financing_type,
      clientId: row.client_id ? String(row.client_id) : undefined,
      clientName: row.client_name_resolved || row.client_name || '',
      clientEmail: row.client_email || '',
      revenus: row.revenus ? Number(row.revenus) : undefined,
      prixBien: row.prix_bien ? Number(row.prix_bien) : undefined,
      capacite: row.capacite ? Number(row.capacite) : undefined,
      mensualite: row.mensualite ? Number(row.mensualite) : undefined,
      apport: row.apport ? Number(row.apport) : undefined,
      tauxInteret: row.taux_interet ? Number(row.taux_interet) : undefined,
      dureeAnnees: row.duree_annees || undefined,
      fraisNotaire: row.frais_notaire ? Number(row.frais_notaire) : undefined,
      endettementMax: row.endettement_max ? Number(row.endettement_max) : undefined,
      tauxAssurance: row.taux_assurance ? Number(row.taux_assurance) : undefined,
      fraisDossier: row.frais_dossier ? Number(row.frais_dossier) : undefined,
      garantie: row.garantie ? Number(row.garantie) : undefined,
      descriptionAutreFinancement: row.description_autre_financement || undefined,
      notes: row.notes || undefined,
      createdBy: row.created_by || undefined,
    }));

    res.json(mapped);
  } catch (error) {
    console.error('Error fetching simulations:', error);
    res.status(500).json({ error: 'Failed to fetch simulations' });
  }
}

export async function getSimulationById(req, res) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT s.* FROM simulations s WHERE s.id = $1`,
      [parseInt(id)]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Simulation not found' });
    }

    const row = rows[0];
    res.json({
      id: String(row.id),
      date: row.created_at?.toISOString?.() || row.created_at,
      type: row.type,
      financingType: row.financing_type,
      clientId: row.client_id ? String(row.client_id) : undefined,
      clientName: row.client_name || '',
      clientEmail: row.client_email || '',
      revenus: row.revenus ? Number(row.revenus) : undefined,
      prixBien: row.prix_bien ? Number(row.prix_bien) : undefined,
      capacite: row.capacite ? Number(row.capacite) : undefined,
      mensualite: row.mensualite ? Number(row.mensualite) : undefined,
      apport: row.apport ? Number(row.apport) : undefined,
      tauxInteret: row.taux_interet ? Number(row.taux_interet) : undefined,
      dureeAnnees: row.duree_annees || undefined,
      fraisNotaire: row.frais_notaire ? Number(row.frais_notaire) : undefined,
      endettementMax: row.endettement_max ? Number(row.endettement_max) : undefined,
      tauxAssurance: row.taux_assurance ? Number(row.taux_assurance) : undefined,
      fraisDossier: row.frais_dossier ? Number(row.frais_dossier) : undefined,
      garantie: row.garantie ? Number(row.garantie) : undefined,
      descriptionAutreFinancement: row.description_autre_financement || undefined,
      notes: row.notes || undefined,
      createdBy: row.created_by || undefined,
    });
  } catch (error) {
    console.error('Error fetching simulation:', error);
    res.status(500).json({ error: 'Failed to fetch simulation' });
  }
}

export async function createSimulation(req, res) {
  try {
    const {
      type, financingType, clientId, clientName, clientEmail,
      revenus, prixBien, capacite, mensualite, apport,
      tauxInteret, dureeAnnees, fraisNotaire, endettementMax,
      tauxAssurance, fraisDossier, garantie,
      descriptionAutreFinancement, notes, createdBy,
    } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO simulations (
        client_id, type, financing_type, revenus, prix_bien, capacite,
        mensualite, apport, taux_interet, duree_annees, frais_notaire,
        endettement_max, taux_assurance, frais_dossier, garantie,
        description_autre_financement, notes, client_name, client_email, created_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
      RETURNING *`,
      [
        clientId ? parseInt(clientId) : null,
        type || 'capacite',
        financingType || 'pret_bancaire',
        revenus || 0,
        prixBien || 0,
        capacite || 0,
        mensualite || 0,
        apport || 0,
        tauxInteret || 0,
        dureeAnnees || 0,
        fraisNotaire || 0,
        endettementMax || 0,
        tauxAssurance || 0,
        fraisDossier || 0,
        garantie || 0,
        descriptionAutreFinancement || '',
        notes || '',
        clientName || '',
        clientEmail || '',
        createdBy || '',
      ]
    );

    const row = rows[0];
    res.status(201).json({
      id: String(row.id),
      date: row.created_at?.toISOString?.() || row.created_at,
      type: row.type,
      financingType: row.financing_type,
      clientId: row.client_id ? String(row.client_id) : undefined,
      clientName: row.client_name || '',
      clientEmail: row.client_email || '',
      revenus: row.revenus ? Number(row.revenus) : undefined,
      prixBien: row.prix_bien ? Number(row.prix_bien) : undefined,
      capacite: row.capacite ? Number(row.capacite) : undefined,
      mensualite: row.mensualite ? Number(row.mensualite) : undefined,
      apport: row.apport ? Number(row.apport) : undefined,
      tauxInteret: row.taux_interet ? Number(row.taux_interet) : undefined,
      dureeAnnees: row.duree_annees || undefined,
      fraisNotaire: row.frais_notaire ? Number(row.frais_notaire) : undefined,
      endettementMax: row.endettement_max ? Number(row.endettement_max) : undefined,
      tauxAssurance: row.taux_assurance ? Number(row.taux_assurance) : undefined,
      fraisDossier: row.frais_dossier ? Number(row.frais_dossier) : undefined,
      garantie: row.garantie ? Number(row.garantie) : undefined,
      descriptionAutreFinancement: row.description_autre_financement || undefined,
      notes: row.notes || undefined,
      createdBy: row.created_by || undefined,
    });
  } catch (error) {
    console.error('Error creating simulation:', error);
    res.status(500).json({ error: 'Failed to create simulation' });
  }
}

export async function updateSimulation(req, res) {
  try {
    const { id } = req.params;
    const {
      type, financingType, clientId, clientName, clientEmail,
      revenus, prixBien, capacite, mensualite, apport,
      tauxInteret, dureeAnnees, fraisNotaire, endettementMax,
      tauxAssurance, fraisDossier, garantie,
      descriptionAutreFinancement, notes,
    } = req.body;

    const { rows } = await pool.query(
      `UPDATE simulations SET
        client_id = $1, type = $2, financing_type = $3,
        revenus = $4, prix_bien = $5, capacite = $6,
        mensualite = $7, apport = $8, taux_interet = $9,
        duree_annees = $10, frais_notaire = $11, endettement_max = $12,
        taux_assurance = $13, frais_dossier = $14, garantie = $15,
        description_autre_financement = $16, notes = $17,
        client_name = $18, client_email = $19,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $20 RETURNING *`,
      [
        clientId ? parseInt(clientId) : null,
        type || 'capacite',
        financingType || 'pret_bancaire',
        revenus || 0,
        prixBien || 0,
        capacite || 0,
        mensualite || 0,
        apport || 0,
        tauxInteret || 0,
        dureeAnnees || 0,
        fraisNotaire || 0,
        endettementMax || 0,
        tauxAssurance || 0,
        fraisDossier || 0,
        garantie || 0,
        descriptionAutreFinancement || '',
        notes || '',
        clientName || '',
        clientEmail || '',
        parseInt(id),
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Simulation not found' });
    }

    const row = rows[0];
    res.json({
      id: String(row.id),
      date: row.created_at?.toISOString?.() || row.created_at,
      type: row.type,
      financingType: row.financing_type,
      clientId: row.client_id ? String(row.client_id) : undefined,
      clientName: row.client_name || '',
      clientEmail: row.client_email || '',
      revenus: row.revenus ? Number(row.revenus) : undefined,
      prixBien: row.prix_bien ? Number(row.prix_bien) : undefined,
      capacite: row.capacite ? Number(row.capacite) : undefined,
      mensualite: row.mensualite ? Number(row.mensualite) : undefined,
      apport: row.apport ? Number(row.apport) : undefined,
      tauxInteret: row.taux_interet ? Number(row.taux_interet) : undefined,
      dureeAnnees: row.duree_annees || undefined,
      fraisNotaire: row.frais_notaire ? Number(row.frais_notaire) : undefined,
      endettementMax: row.endettement_max ? Number(row.endettement_max) : undefined,
      tauxAssurance: row.taux_assurance ? Number(row.taux_assurance) : undefined,
      fraisDossier: row.frais_dossier ? Number(row.frais_dossier) : undefined,
      garantie: row.garantie ? Number(row.garantie) : undefined,
      descriptionAutreFinancement: row.description_autre_financement || undefined,
      notes: row.notes || undefined,
      createdBy: row.created_by || undefined,
    });
  } catch (error) {
    console.error('Error updating simulation:', error);
    res.status(500).json({ error: 'Failed to update simulation' });
  }
}

export async function deleteSimulation(req, res) {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query(
      `DELETE FROM simulations WHERE id = $1`,
      [parseInt(id)]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Simulation not found' });
    }

    res.json({ success: true, message: 'Simulation deleted' });
  } catch (error) {
    console.error('Error deleting simulation:', error);
    res.status(500).json({ error: 'Failed to delete simulation' });
  }
}
