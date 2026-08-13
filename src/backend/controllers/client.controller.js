import pool from '../config/db.js';
import { getEffectivePermissions } from '../services/permissions.service.js';
import { findMatchingProperties } from '../services/matching.service.js';
import { onClientStatusChange } from '../services/status-transition.service.js';
import { syncContactMandatFromClient, removeContactMandatOnClientDelete } from './contact.controller.js';

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

const MANDATE_TO_CLIENT_STATUS = {
  'Non d\u00e9fini': { vendeur: 'En attente de signature', bailleur: 'En attente de signature', acheteur: 'En recherche', locataire: 'En recherche' },
  'En attente de signature': { vendeur: 'En attente de signature', bailleur: 'En attente de signature', acheteur: 'En recherche', locataire: 'En recherche' },
  'Actif': { vendeur: 'En mandat', bailleur: 'En mandat', acheteur: 'En recherche', locataire: 'En recherche' },
  'Expire': { vendeur: 'Inactif', bailleur: 'Inactif', acheteur: 'Inactif', locataire: 'Inactif' },
  'Resilie': { vendeur: 'Perdu', bailleur: 'Perdu', acheteur: 'Perdu', locataire: 'Perdu' },
  'Termine': { vendeur: 'Vendu', bailleur: 'Lou\u00e9', acheteur: 'Vendu / Achet\u00e9', locataire: 'Install\u00e9' },
};

const RESERVATION_TO_CLIENT_STATUS = {
  '': { voyageur: 'En recherche' },
  'Brouillon': { voyageur: 'En recherche' },
  'En attente': { voyageur: 'R\u00e9servation en cours' },
  'Confirm\u00e9e': { voyageur: 'Confirm\u00e9' },
  'Pay\u00e9e': { voyageur: 'Pay\u00e9' },
  'Occup\u00e9': { voyageur: 'En s\u00e9jour' },
  'Termin\u00e9': { voyageur: 'Termin\u00e9' },
  'Annul\u00e9e': { voyageur: 'Annul\u00e9' },
};

function deriveStatutMetier(mandatStatus, clientType) {
  if (!mandatStatus) return '';
  const entry = MANDATE_TO_CLIENT_STATUS[mandatStatus];
  if (!entry) return '';
  const lowerType = (clientType || '').toLowerCase();
  return entry[lowerType] || entry.vendeur || '';
}

function deriveStatutMetierFromReservation(reservationStatus) {
  const entry = RESERVATION_TO_CLIENT_STATUS[reservationStatus || ''];
  return entry ? entry.voyageur : 'En recherche';
}

const KNOWN_COLUMNS = new Set([
  'clientType', 'type', 'firstName', 'lastName', 'name', 'email', 'phone',
  'address', 'profession', 'companyName', 'legalForm', 'siren',
  'notes', 'status', 'statutMetier', 'agentId', 'agentDesigne',
  'mandatStatus', 'statutMandat', 'mandatId',
  'mandatPdfUrl', 'mandatPdfName',
  'docIdentiteUrl', 'docIdentiteName', 'docDomicileUrl', 'docDomicileName',
  'docRevenusUrl', 'docRevenusName', 'docFinancementUrl', 'docFinancementName',
  'docBancaireUrl', 'docBancaireName',
  'createdAt', 'updatedAt', 'createdBy',
]);

function extractKnownFields(body) {
  const data = { ...body };
  const clearSet = new Set(Array.isArray(data._clear) ? data._clear : []);
  delete data._clear;

  const clientType = data.clientType || data.type || '';
  const firstName = data.firstName || (data.name ? data.name.split(' ').slice(0, -1).join(' ') : '') || '';
  const lastName = data.lastName || (data.name ? data.name.split(' ').slice(-1).join(' ') : '') || '';
  const name = data.name || `${firstName} ${lastName}`.trim() || 'Nouveau client';

  const email = data.email || '';
  const phone = data.phone || '';
  const address = data.address || '';
  const profession = data.profession || '';
  const companyName = data.companyName || '';
  const legalForm = data.legalForm || '';
  const siren = data.siren || '';
  const notes = data.notes || '';
  const status = data.status || 'Actif';
  const statutMetier = data.statutMetier || '';
  const agentId = data.agentId || '';
  const agentDesigne = data.agentDesigne || '';
  const mandatStatus = data.mandatStatus || data.statutMandat || '';
  const mandatId = data.mandatId || null;
  const mandatPdfUrl = data.mandatPdfUrl || '';
  const mandatPdfName = data.mandatPdfName || '';
  const docIdentiteUrl = data.docIdentiteUrl || '';
  const docIdentiteName = data.docIdentiteName || '';
  const docDomicileUrl = data.docDomicileUrl || '';
  const docDomicileName = data.docDomicileName || '';
  const docRevenusUrl = data.docRevenusUrl || '';
  const docRevenusName = data.docRevenusName || '';
  const docFinancementUrl = data.docFinancementUrl || '';
  const docFinancementName = data.docFinancementName || '';
  const docBancaireUrl = data.docBancaireUrl || '';
  const docBancaireName = data.docBancaireName || '';

  const extraData = {};
  for (const [key, value] of Object.entries(data)) {
    if (!KNOWN_COLUMNS.has(key) && key !== 'id') {
      extraData[key] = value;
    }
  }
  if (name) extraData.name = name;

  return {
    clientType, firstName, lastName, name, email, phone,
    address, profession, companyName, legalForm, siren,
    notes, status, statutMetier, agentId, agentDesigne,
    mandatStatus, mandatId, mandatPdfUrl, mandatPdfName,
    docIdentiteUrl, docIdentiteName, docDomicileUrl, docDomicileName,
    docRevenusUrl, docRevenusName, docFinancementUrl, docFinancementName,
    docBancaireUrl, docBancaireName,
    extraData,
    clearSet,
  };
}

function rowToClient(row) {
  const data = row.data || {};
  return {
    ...data,
    id: String(row.id),
    name: data.name || `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Nouveau client',
    type: row.client_type || data.type || '',
    firstName: row.first_name || '',
    lastName: row.last_name || '',
    clientType: row.client_type || data.clientType || '',
    email: row.email || '',
    phone: row.phone || '',
    address: row.address || data.address || '',
    profession: row.profession || data.profession || '',
    companyName: row.company_name || '',
    legalForm: row.legal_form || '',
    siren: row.siren || '',
    notes: row.notes || '',
    status: row.status || 'actif',
    statutMetier: row.statut_metier || '',
    mandatStatus: row.mandat_status || '',
    statutMandat: row.mandat_status || '',
    mandatId: row.mandat_id ? String(row.mandat_id) : undefined,
    agentId: row.agent_id || '',
    agentDesigne: row.agent_designe || '',
    mandatPdfUrl: row.mandat_pdf_url || '',
    mandatPdfName: row.mandat_pdf_name || '',
    docIdentiteUrl: row.doc_identite_url || '',
    docIdentiteName: row.doc_identite_name || '',
    docDomicileUrl: row.doc_domicile_url || '',
    docDomicileName: row.doc_domicile_name || '',
    docRevenusUrl: row.doc_revenus_url || '',
    docRevenusName: row.doc_revenus_name || '',
    docFinancementUrl: row.doc_financement_url || '',
    docFinancementName: row.doc_financement_name || '',
    docBancaireUrl: row.doc_bancaire_url || '',
    docBancaireName: row.doc_bancaire_name || '',
    originalClientId: row.original_client_id ? String(row.original_client_id) : undefined,
    contactId: data.contactId || undefined,
    languesParlees: Array.isArray(data.languesParlees) ? data.languesParlees : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getClientsByContact(req, res) {
  try {
    await assertAgentPermission(req, 'clients-lecture', "Vous n'avez pas accès aux clients.");
    const { contactId } = req.params;
    const result = await pool.query(
      "SELECT * FROM owner_clients WHERE data->>'contactId' = $1 ORDER BY created_at DESC",
      [contactId]
    );
    res.json(result.rows.map(rowToClient));
  } catch (error) {
    console.error('Error fetching clients by contact:', error);
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
}

export async function getClients(req, res) {
  try {
    await assertAgentPermission(req, 'clients-lecture', "Vous n'avez pas accès aux clients.");
    const { type, search, agent_id } = req.query;
    let sql = 'SELECT * FROM owner_clients WHERE 1=1';
    const params = [];
    if (type) {
      params.push(type);
      sql += ` AND LOWER(client_type) = LOWER($${params.length})`;
    }
    if (agent_id) {
      params.push(agent_id);
      sql += ` AND (agent_id = $${params.length} OR LOWER(agent_designe) = LOWER((SELECT first_name || ' ' || last_name FROM users WHERE id = $${params.length}::int)))`;
    }
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (first_name ILIKE $${params.length} OR last_name ILIKE $${params.length} OR company_name ILIKE $${params.length} OR email ILIKE $${params.length} OR phone ILIKE $${params.length} OR data->>'name' ILIKE $${params.length})`;
    }
    sql += ' ORDER BY created_at DESC';
    const result = await pool.query(sql, params);
    res.json(result.rows.map(rowToClient));
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
}

export async function getClientById(req, res) {
  try {
    const perms = await assertAgentPermission(req, 'clients-lecture', "Vous n'avez pas accès aux clients.");
    if (perms && !perms['clients-info-privees']) {
      const err = new Error("Vous n'avez pas accès aux informations privées de ce client.");
      err.status = 403;
      throw err;
    }
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM owner_clients WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json(rowToClient(result.rows[0]));
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
}

export async function createClient(req, res) {
  try {
    await assertAgentPermission(req, 'clients-ecriture', "Vous n'avez pas le droit d'ajouter des clients.");
    const fields = extractKnownFields(req.body);
    if (!fields.clientType) {
      return res.status(400).json({ error: 'clientType is required' });
    }

    const finalStatutMetier = fields.statutMetier || deriveStatutMetier(fields.mandatStatus, fields.clientType) || '';

    const result = await pool.query(
      `INSERT INTO owner_clients (client_type, first_name, last_name, email, phone, address, profession, company_name, legal_form, siren, notes, status, statut_metier, agent_id, agent_designe, mandat_status, mandat_id, mandat_pdf_url, mandat_pdf_name, doc_identite_url, doc_identite_name, doc_domicile_url, doc_domicile_name, doc_revenus_url, doc_revenus_name, doc_financement_url, doc_financement_name, doc_bancaire_url, doc_bancaire_name, data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30) RETURNING *`,
      [
        fields.clientType, fields.firstName, fields.lastName, fields.email, fields.phone,
        fields.address, fields.profession, fields.companyName, fields.legalForm, fields.siren,
        fields.notes, fields.status || 'Actif', finalStatutMetier, fields.agentId,
        fields.agentDesigne, fields.mandatStatus, fields.mandatId,
        fields.mandatPdfUrl, fields.mandatPdfName,
        fields.docIdentiteUrl, fields.docIdentiteName,
        fields.docDomicileUrl, fields.docDomicileName,
        fields.docRevenusUrl, fields.docRevenusName,
        fields.docFinancementUrl, fields.docFinancementName,
        fields.docBancaireUrl, fields.docBancaireName,
        JSON.stringify(fields.extraData),
      ]
    );
    const newClient = rowToClient(result.rows[0]);

    syncContactMandatFromClient({ ...fields, ...newClient, id: result.rows[0].id }).catch(() => {});

    if (finalStatutMetier || fields.mandatStatus) {
      try {
        const mandatType = fields.typeMandat || fields.extraData?.typeMandat || '';
        await onClientStatusChange(
          newClient.id,
          fields.mandatStatus || '',
          finalStatutMetier || '',
          fields.clientType,
          newClient.name,
          fields.agentDesigne || '',
          fields.agentId || '',
          undefined,
          mandatType
        );
      } catch (cascadeErr) {
        console.error('Error cascading client creation:', cascadeErr);
      }
    }

    res.status(201).json(newClient);
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
}

export async function updateClient(req, res) {
  try {
    await assertAgentPermission(req, 'clients-ecriture', "Vous n'avez pas le droit de modifier les clients.");
    const { id } = req.params;
    const fields = extractKnownFields(req.body);

    let finalStatutMetier = fields.statutMetier;
    if (!finalStatutMetier && fields.mandatStatus) {
      const current = await pool.query('SELECT client_type FROM owner_clients WHERE id = $1', [id]);
      if (current.rows.length > 0) {
        finalStatutMetier = deriveStatutMetier(fields.mandatStatus, current.rows[0].client_type);
      }
    }

    const existing = await pool.query('SELECT data FROM owner_clients WHERE id = $1', [id]);
    const existingData = existing.rows.length > 0 ? (existing.rows[0].data || {}) : {};
    const mergedData = { ...existingData, ...fields.extraData };

    const result = await pool.query(
      `UPDATE owner_clients SET
        client_type = COALESCE(NULLIF($1, ''), client_type),
        first_name = COALESCE(NULLIF($2, ''), first_name),
        last_name = COALESCE(NULLIF($3, ''), last_name),
        email = COALESCE(NULLIF($4, ''), email),
        phone = COALESCE(NULLIF($5, ''), phone),
        address = COALESCE(NULLIF($6, ''), address),
        profession = COALESCE(NULLIF($7, ''), profession),
        company_name = COALESCE(NULLIF($8, ''), company_name),
        legal_form = COALESCE(NULLIF($9, ''), legal_form),
        siren = COALESCE(NULLIF($10, ''), siren),
        notes = COALESCE(NULLIF($11, ''), notes),
        status = COALESCE(NULLIF($12, ''), status),
        statut_metier = COALESCE(NULLIF($13, ''), statut_metier),
        agent_id = COALESCE(NULLIF($14, ''), agent_id),
        agent_designe = COALESCE(NULLIF($15, ''), agent_designe),
        mandat_status = COALESCE(NULLIF($16, ''), mandat_status),
        mandat_id = COALESCE($17, mandat_id),
        mandat_pdf_url = COALESCE(NULLIF($18, ''), mandat_pdf_url),
        mandat_pdf_name = COALESCE(NULLIF($19, ''), mandat_pdf_name),
        doc_identite_url = COALESCE(NULLIF($20, ''), doc_identite_url),
        doc_identite_name = COALESCE(NULLIF($21, ''), doc_identite_name),
        doc_domicile_url = COALESCE(NULLIF($22, ''), doc_domicile_url),
        doc_domicile_name = COALESCE(NULLIF($23, ''), doc_domicile_name),
        doc_revenus_url = COALESCE(NULLIF($24, ''), doc_revenus_url),
        doc_revenus_name = COALESCE(NULLIF($25, ''), doc_revenus_name),
        doc_financement_url = COALESCE(NULLIF($26, ''), doc_financement_url),
        doc_financement_name = COALESCE(NULLIF($27, ''), doc_financement_name),
        doc_bancaire_url = COALESCE(NULLIF($28, ''), doc_bancaire_url),
        doc_bancaire_name = COALESCE(NULLIF($29, ''), doc_bancaire_name),
        data = $30::jsonb,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $31 RETURNING *`,
      [
        fields.clientType, fields.firstName, fields.lastName, fields.email, fields.phone,
        fields.address, fields.profession, fields.companyName, fields.legalForm, fields.siren,
        fields.notes, fields.status, finalStatutMetier || '', fields.agentId, fields.agentDesigne,
        fields.mandatStatus, fields.mandatId,
        fields.mandatPdfUrl, fields.mandatPdfName,
        fields.docIdentiteUrl, fields.docIdentiteName,
        fields.docDomicileUrl, fields.docDomicileName,
        fields.docRevenusUrl, fields.docRevenusName,
        fields.docFinancementUrl, fields.docFinancementName,
        fields.docBancaireUrl, fields.docBancaireName,
        JSON.stringify(mergedData), id,
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    if (fields.clearSet.size > 0) {
      const CLEARABLE = new Set(['statut_metier', 'mandat_status', 'status', 'agent_id', 'agent_designe']);
      const toClear = [...fields.clearSet].filter(f => CLEARABLE.has(f));
      if (toClear.length > 0) {
        const setClauses = toClear.map((f) => `${f} = ''`).join(', ');
        await pool.query(`UPDATE owner_clients SET ${setClauses} WHERE id = $1`, [id]);
      }
    }

    const updatedClient = rowToClient(result.rows[0]);
    const newMandatStatus = fields.mandatStatus || '';
    const newStatutMetier = finalStatutMetier || updatedClient.statutMetier || '';

    syncContactMandatFromClient({ ...fields, ...updatedClient, id: result.rows[0].id }).catch(() => {});

    if (newMandatStatus || newStatutMetier) {
      try {
        const mandatType = fields.typeMandat || fields.extraData?.typeMandat || mergedData?.typeMandat || '';
        await onClientStatusChange(
          id,
          newMandatStatus,
          newStatutMetier,
          updatedClient.clientType || updatedClient.type,
          updatedClient.name,
          updatedClient.agentDesigne || updatedClient.agentId || '',
          updatedClient.agentId || '',
          undefined,
          mandatType
        );
      } catch (cascadeErr) {
        console.error('Error cascading client update:', cascadeErr);
      }
    }

    // Propagate a renamed client to linked records (registre, contracts,
    // transactions, reservations)
    const fullName = [updatedClient.firstName, updatedClient.lastName].filter(Boolean).join(' ').trim();
    if (fullName) {
      try {
        await pool.query(
          `UPDATE registre SET client_name = $1, updated_at = NOW()
           WHERE client_id = $2 AND client_name IS DISTINCT FROM $1`,
          [fullName, result.rows[0].id]
        );
        await pool.query(
          `UPDATE contracts SET client_name = $1, updated_at = NOW()
           WHERE client_id = $2 AND client_name IS DISTINCT FROM $1`,
          [fullName, result.rows[0].id]
        );
        await pool.query(
          `UPDATE transactions SET client_name = $1, updated_at = NOW()
           WHERE client_id = $2 AND client_name IS DISTINCT FROM $1`,
          [fullName, result.rows[0].id]
        );
        await pool.query(
          `UPDATE reservations SET client_name = $1, updated_at = NOW()
           WHERE client_id = $2 AND client_name IS DISTINCT FROM $1`,
          [fullName, result.rows[0].id]
        );
      } catch (nameSyncErr) {
        console.error('Error syncing client name to linked records:', nameSyncErr);
      }
    }

    res.json(updatedClient);
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
}

export async function deleteClient(req, res) {
  try {
    await assertAgentPermission(req, 'clients-supprimer', "Vous n'avez pas le droit de supprimer les clients.");
    const { id } = req.params;
    const existing = await pool.query('SELECT data FROM owner_clients WHERE id = $1', [id]);
    const result = await pool.query('DELETE FROM owner_clients WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    const deleted = result.rows[0];
    const mandatId = `client-${deleted.id}`;
    let contactId = existing.rows[0]?.data?.contactId;
    if (!contactId) {
      try {
        const reverseLookup = await pool.query(
          "SELECT id FROM contacts WHERE mandats @> $1::jsonb",
          [JSON.stringify([{ id: mandatId }])]
        );
        if (reverseLookup.rows.length > 0) {
          contactId = reverseLookup.rows[0].id;
        }
      } catch (_) { /* ignore */ }
    }
    if (contactId) {
      removeContactMandatOnClientDelete(deleted.id, contactId).catch(() => {});
    }
    res.json({ message: 'Client deleted', id: String(deleted.id) });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
}

export async function duplicateClient(req, res) {
  try {
    await assertAgentPermission(req, 'clients-ecriture', "Vous n'avez pas le droit de dupliquer les clients.");
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM owner_clients WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    const src = result.rows[0];
    const parentId = src.original_client_id || src.id;
    const duplicatorId = req.user?.id ? String(req.user.id) : '';
    let duplicatorName = '';
    if (duplicatorId) {
      const userResult = await pool.query('SELECT first_name, last_name FROM users WHERE id = $1', [duplicatorId]);
      if (userResult.rows.length > 0) {
        const u = userResult.rows[0];
        duplicatorName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
      }
    }

    const cols = [
      'client_type', 'first_name', 'last_name', 'email', 'phone',
      'address', 'profession', 'company_name', 'legal_form', 'siren',
      'notes', 'status', 'statut_metier', 'agent_id', 'agent_designe',
      'mandat_status', 'mandat_pdf_url', 'mandat_pdf_name',
      'doc_identite_url', 'doc_identite_name',
      'doc_domicile_url', 'doc_domicile_name',
      'doc_revenus_url', 'doc_revenus_name',
      'doc_financement_url', 'doc_financement_name',
      'doc_bancaire_url', 'doc_bancaire_name',
      'data', 'original_client_id',
    ];
    const vals = [
      src.client_type, src.first_name, src.last_name, src.email, src.phone,
      src.address, src.profession, src.company_name, src.legal_form, src.siren,
      src.notes, 'Actif', src.statut_metier || '', duplicatorId || src.agent_id, duplicatorName || src.agent_designe || '',
      src.mandat_status || '', src.mandat_pdf_url || '', src.mandat_pdf_name || '',
      src.doc_identite_url || '', src.doc_identite_name || '',
      src.doc_domicile_url || '', src.doc_domicile_name || '',
      src.doc_revenus_url || '', src.doc_revenus_name || '',
      src.doc_financement_url || '', src.doc_financement_name || '',
      src.doc_bancaire_url || '', src.doc_bancaire_name || '',
      JSON.stringify(src.data || {}), parentId,
    ];
    if (cols.length !== vals.length) {
      console.error('Column/value mismatch:', cols.length, 'cols vs', vals.length, 'vals');
      return res.status(500).json({ error: 'Internal server error' });
    }
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
    const insertResult = await pool.query(
      `INSERT INTO owner_clients (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`,
      vals,
    );
    res.status(201).json(rowToClient(insertResult.rows[0]));
  } catch (error) {
    console.error('Error duplicating client:', error);
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
}

export async function getClientCroisements(req, res) {
  try {
    const perms = await assertAgentPermission(req, 'clients-lecture', "Vous n'avez pas accès aux clients.");
    if (perms && !perms['clients-info-privees']) {
      const err = new Error("Vous n'avez pas accès aux informations privées de ce client.");
      err.status = 403;
      throw err;
    }
    const { id } = req.params;
    const matches = await findMatchingProperties(id);
    res.json(matches);
  } catch (error) {
    console.error('Error fetching croisements:', error);
    if (error.message === 'Client not found') {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
}

export async function proposeProperty(req, res) {
  try {
    await assertAgentPermission(req, 'clients-ecriture', "Vous n'avez pas le droit de proposer des biens aux clients.");
    const { id } = req.params;
    const { propertyId, email, subject, message, score, details } = req.body;

    if (!propertyId || !email) {
      return res.status(400).json({ error: 'propertyId and email are required' });
    }

    const clientResult = await pool.query('SELECT * FROM owner_clients WHERE id = $1', [id]);
    if (clientResult.rows.length === 0) return res.status(404).json({ error: 'Client not found' });

    const data = clientResult.rows[0].data || {};
    const clientName = data.name || ((clientResult.rows[0].first_name || '') + ' ' + (clientResult.rows[0].last_name || '')).trim() || 'Client';

    const propResult = await pool.query('SELECT * FROM properties WHERE id = $1', [propertyId]);
    if (propResult.rows.length === 0) return res.status(404).json({ error: 'Property not found' });

    const r = propResult.rows[0];
    let fd = r.form_data;
    if (typeof fd === 'string') try { fd = JSON.parse(fd); } catch (e) { fd = {}; }

    const property = {
      propertyId: String(r.id),
      title: r.title || '',
      reference: r.reference || '',
      price: Number(fd?.prixNetVendeur || fd?.loyerHC || r.price) || 0,
      surface: Number(r.surface) || 0,
      rooms: Number(r.rooms) || 0,
      bedrooms: Number(r.bedrooms) || 0,
      city: r.city || '',
      district: r.district || '',
      description: r.description || '',
      images: Array.isArray(r.images) ? r.images : [],
    };

    let agentName = 'Votre agent immobilier';
    let agentEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || '';
    if (req.userId) {
      const agentResult = await pool.query('SELECT first_name, last_name, email FROM users WHERE id = $1', [req.userId]);
      if (agentResult.rows.length > 0) {
        agentName = ((agentResult.rows[0].first_name || '') + ' ' + (agentResult.rows[0].last_name || '')).trim() || agentName;
        agentEmail = agentResult.rows[0].email || agentEmail;
      }
    }

    const { sendPropertyProposalEmail } = await import('../services/email.service.js');
    await sendPropertyProposalEmail({
      to: email,
      clientName,
      property,
      score: score || 0,
      message: message || '',
      agentName,
      agentEmail,
      details: details || null,
    });

    res.json({ success: true, message: 'Email de proposition envoyé avec succès' });
  } catch (error) {
    console.error('Error sending property proposal:', error);
    res.status(error.status || 500).json({ error: error.message || 'Erreur lors de l\'envoi de l\'email de proposition' });
  }
}

export async function sendFinancement(req, res) {
  try {
    await assertAgentPermission(req, 'clients-ecriture', "Vous n'avez pas le droit d'envoyer une simulation de financement.");
    const { id } = req.params;
    const { email, subject, message } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }

    const clientResult = await pool.query('SELECT * FROM owner_clients WHERE id = $1', [id]);
    if (clientResult.rows.length === 0) return res.status(404).json({ error: 'Client not found' });

    const data = clientResult.rows[0].data || {};
    const clientName = data.name || ((clientResult.rows[0].first_name || '') + ' ' + (clientResult.rows[0].last_name || '')).trim() || 'Client';

    let agentName = 'Votre agent immobilier';
    if (req.userId) {
      const agentResult = await pool.query('SELECT first_name, last_name FROM users WHERE id = $1', [req.userId]);
      if (agentResult.rows.length > 0) {
        agentName = ((agentResult.rows[0].first_name || '') + ' ' + (agentResult.rows[0].last_name || '')).trim() || agentName;
      }
    }

    const { sendFinancementEmail } = await import('../services/email.service.js');
    await sendFinancementEmail({
      to: email,
      subject: subject || 'Simulation de financement',
      message: message || '',
      clientName,
      agentName,
    });

    res.json({ success: true, message: 'Email de financement envoyé avec succès' });
  } catch (error) {
    console.error('Error sending financement email:', error);
    res.status(error.status || 500).json({ error: error.message || 'Erreur lors de l\'envoi de l\'email de financement' });
  }
}
