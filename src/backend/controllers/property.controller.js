import pool from '../config/db.js';
import {
  triggerPropertyCreated,
  triggerPropertyDeleted,
  triggerChanges,
} from '../services/property-timeline.service.js';
import { triggerPropertyAddedAutomation, triggerPropertySoldAutomation, triggerPropertyRentedAutomation } from '../services/property-automator.service.js';
import { clearPropertyDocsCache } from '../services/propertyDocs.service.js';

function rowToProperty(row) {
  const base = {
    id: String(row.id),
    reference: row.reference,
    title: row.title,
    propertyType: row.property_type,
    transactionType: row.transaction_type,
    status: row.status,
    price: Number(row.price) || 0,
    priceMin: row.price_min ? Number(row.price_min) : undefined,
    priceMax: row.price_max ? Number(row.price_max) : undefined,
    surface: Number(row.surface) || 0,
    landSize: row.land_size ? Number(row.land_size) : undefined,
    bedrooms: row.bedrooms || 0,
    bathrooms: row.bathrooms || 0,
    rooms: row.rooms || 0,
    sleepingCapacity: row.sleeping_capacity || undefined,
    location: row.location || '',
    address: row.address || '',
    city: row.city || '',
    district: row.district || '',
    latitude: row.latitude ? Number(row.latitude) : undefined,
    longitude: row.longitude ? Number(row.longitude) : undefined,
    description: row.description || '',
    features: row.features || [],
    images: row.images || [],
    documents: row.documents && typeof row.documents === 'object' ? row.documents : { fileTree: [] },
    yearBuilt: row.year_built || undefined,
    dpe: row.dpe || undefined,
    mandateType: row.mandate_type || '',
    propertyState: row.property_state || '',
    isSeasonal: row.is_seasonal || false,
    owner: (() => {
      const o = row.owner || {};
      const name = o.name || ((o.firstName || '') + ' ' + (o.lastName || '')).trim() || '';
      return { id: o.id || '', name, phone: o.phone || '', email: o.email || '' };
    })(),
    agentId: row.agent_id || '',
    mandateStatus: row.mandate_status || 'actif',
    mandateStartDate: row.mandate_start_date
      ? new Date(row.mandate_start_date).toISOString().slice(0, 10)
      : '',
    mandateEndDate: row.mandate_end_date
      ? new Date(row.mandate_end_date).toISOString().slice(0, 10)
      : '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    clientId: row.client_id ? String(row.client_id) : undefined,
    originalPropertyId: row.original_property_id ? String(row.original_property_id) : undefined,
  };
  if (row.form_data) {
    let data = row.form_data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch { data = {}; }
    }
    if (typeof data === 'object') {
      Object.assign(base, data);
    }
  }
  // Reconstruct fields that were historically mapped to columns instead of form_data
  if (base.prixNetVendeur === undefined && row.price) base.prixNetVendeur = Number(row.price);
  if (base.prixMinimum === undefined && row.price_min) base.prixMinimum = Number(row.price_min);
  if (base.prixExpertise === undefined && row.price_max) base.prixExpertise = Number(row.price_max);
  // For rental properties, use loyerHC as the price if prixNetVendeur is not set
  if (!base.prixNetVendeur && base.loyerHC) base.prixNetVendeur = Number(base.loyerHC);
  if (!base.price && base.loyerHC) base.price = Number(base.loyerHC);
  return base;
}

function getVal(obj, path, defaultVal) {
  const keys = path.split('.');
  let val = obj;
  for (const k of keys) {
    if (val == null || typeof val !== 'object') return defaultVal;
    val = val[k];
  }
  return val !== undefined && val !== null && val !== '' ? val : defaultVal;
}

function toInt(v, fallback = 0) {
  const n = parseInt(v, 10);
  return isNaN(n) ? fallback : n;
}

function toFloat(v, fallback = 0) {
  const n = parseFloat(v);
  return isNaN(n) ? fallback : n;
}

const MAPPED_KEYS = new Set([
  'reference', 'title', 'propertyType', 'transactionType', 'status',
  'property', 'bedrooms', 'bathroom', 'livingRoom',
  'clientId',
  'location', 'district', 'description',
  'features', 'images', 'documents',
  'dpe', 'propertyState', 'isSeasonal',
  'owner', 'agentId', 'mandateStatus', 'mandateType', 'mandateStartDate', 'mandateEndDate', 'mandateRemuneration',
  'mandate', 'sleepingCapacity',
])

function mapInput(body, { partial = false } = {}) {
  const mapped = {}

  // When partial is true, only include fields whose source keys are present in the body.
  // This prevents wiping existing data with defaults on partial updates.
  const shouldInclude = (...bodyKeys) => !partial || bodyKeys.some(k => k in body)

  if (shouldInclude('reference')) mapped.reference = body.reference
  if (shouldInclude('propertyTitle')) mapped.title = body.propertyTitle || ''
  if (shouldInclude('propertyType')) mapped.property_type = body.propertyType || 'residential'
  if (shouldInclude('transactionType')) mapped.transaction_type = body.transactionType || 'vente'
  if (shouldInclude('status')) mapped.status = body.status || 'for_sale'
  if (shouldInclude('price')) mapped.price = toFloat(getVal(body, 'price', 0))
  if (shouldInclude('prixMinimum')) mapped.price_min = toFloat(getVal(body, 'prixMinimum', null)) || undefined
  if (shouldInclude('prixExpertise')) mapped.price_max = toFloat(getVal(body, 'prixExpertise', null)) || undefined
  if (shouldInclude('property', 'surface')) mapped.surface = toFloat(getVal(body, 'property.surface', 0))
  if (shouldInclude('property', 'landSize')) mapped.land_size = toFloat(getVal(body, 'property.landSize', null)) || undefined
  if (shouldInclude('property', 'bedrooms', 'bedrooms')) mapped.bedrooms = toInt(getVal(body, 'property.bedrooms', getVal(body, 'bedrooms.total', 0)))
  if (shouldInclude('bathroom', 'property')) mapped.bathrooms = toInt(getVal(body, 'bathroom.count', getVal(body, 'property.bathrooms', 0)))
  if (shouldInclude('property', 'livingRoom')) mapped.rooms = toInt(getVal(body, 'property.rooms', getVal(body, 'livingRoom.count', 0)))
  if (shouldInclude('sleepingCapacity')) mapped.sleeping_capacity = toInt(body.sleepingCapacity, null)
  if (shouldInclude('location')) mapped.location = getVal(body, 'location.type', '') || ''
  if (shouldInclude('property', 'address')) mapped.address = getVal(body, 'property.address', '') || ''
  if (shouldInclude('property', 'city')) mapped.city = getVal(body, 'property.city', '') || ''
  if (shouldInclude('district')) mapped.district = body.district || ''
  if (shouldInclude('location')) {
    mapped.latitude = toFloat(getVal(body, 'location.latitude', null)) || null
    mapped.longitude = toFloat(getVal(body, 'location.longitude', null)) || null
  }
  if (shouldInclude('property', 'description')) mapped.description = getVal(body, 'property.description', '') || ''
  if (shouldInclude('features')) mapped.features = JSON.stringify(body.features || [])
  if (shouldInclude('images', 'photos')) mapped.images = JSON.stringify([...new Set([...(Array.isArray(body.images) ? body.images : []), ...(Array.isArray(body.photos) ? body.photos : [])])])
  if (shouldInclude('documents')) mapped.documents = JSON.stringify(
    body.documents && typeof body.documents === 'object' && !Array.isArray(body.documents)
      ? body.documents
      : {}
  )
  if (shouldInclude('property', 'constructionYear')) mapped.year_built = toInt(getVal(body, 'property.constructionYear', null)) || null
  if (shouldInclude('dpe')) mapped.dpe = body.dpe ? JSON.stringify(body.dpe) : null
  if (shouldInclude('mandate', 'mandateType')) mapped.mandate_type = getVal(body, 'mandate.type', getVal(body, 'mandate.typeMandat', body.mandateType || '')) || ''
  if (shouldInclude('propertyState', 'property')) mapped.property_state = body.propertyState || getVal(body, 'property.state', '') || ''
  if (shouldInclude('isSeasonal')) mapped.is_seasonal = body.isSeasonal || false
  if (shouldInclude('owner')) mapped.owner = body.owner ? JSON.stringify(body.owner) : JSON.stringify({ id: '', name: '', phone: '', email: '' })
  if (shouldInclude('clientId')) mapped.client_id = body.clientId || null
  if (shouldInclude('agentId')) mapped.agent_id = body.agentId || ''
  if (shouldInclude('mandate', 'mandateStatus')) mapped.mandate_status = getVal(body, 'mandate.statutMandat', body.mandateStatus || 'actif')
  if (shouldInclude('mandate', 'mandateStartDate')) mapped.mandate_start_date = getVal(body, 'mandate.dateDebut', getVal(body, 'mandate.startDate', getVal(body, 'mandateStartDate', new Date().toISOString().slice(0, 10))))
  if (shouldInclude('mandate', 'mandateEndDate')) mapped.mandate_end_date = getVal(body, 'mandate.dateExpiration', getVal(body, 'mandate.endDate', getVal(body, 'mandateEndDate', new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10))))

  const formData = {}
  for (const [key, val] of Object.entries(body)) {
    if (!MAPPED_KEYS.has(key) && val !== undefined && val !== null) {
      formData[key] = val
    }
  }
  // Extract sub-fields from mapped objects into form_data
  // property.* flattens to top-level; others get prefix (e.g. bedrooms.total → bedrooms_total)
  const SUB_KEY_CONFIG = [
    { key: 'property', prefix: '' },
    { key: 'bedrooms', prefix: 'bedrooms_' },
    { key: 'bathroom', prefix: 'bathroom_' },
    { key: 'livingRoom', prefix: 'livingRoom_' },
    { key: 'location', prefix: '' },
    { key: 'owner', prefix: 'owner_' },
    { key: 'mandate', prefix: 'mandate_' },
  ]
  for (const { key, prefix } of SUB_KEY_CONFIG) {
    const obj = body[key]
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      for (const [subKey, val] of Object.entries(obj)) {
        if (val !== undefined && val !== null && val !== '') {
          formData[prefix + subKey] = val
        }
      }
    }
  }

  if (Object.keys(formData).length > 0) {
    mapped.form_data = JSON.stringify(formData)
  }

  return mapped
}

export async function getProperties(req, res) {
  try {
    const { type, search, status, agent_id, client_id } = req.query;
    const useJoin = !!search;
    let sql = useJoin
      ? 'SELECT p.* FROM properties p LEFT JOIN owner_clients c ON p.client_id = c.id WHERE 1=1'
      : 'SELECT * FROM properties WHERE 1=1';
    const params = [];
    if (type) {
      params.push(type);
      sql += ` AND ${useJoin ? 'p.' : ''}property_type = $${params.length}`;
    }
    if (client_id) {
      params.push(client_id);
      sql += ` AND ${useJoin ? 'p.' : ''}client_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      sql += ` AND ${useJoin ? 'p.' : ''}status = $${params.length}`;
    }
    if (agent_id) {
      params.push(agent_id);
      sql += ` AND ${useJoin ? 'p.' : ''}agent_id = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (p.title ILIKE $${params.length} OR p.reference ILIKE $${params.length} OR p.location ILIKE $${params.length} OR p.city ILIKE $${params.length} OR c.first_name ILIKE $${params.length} OR c.last_name ILIKE $${params.length} OR c.company_name ILIKE $${params.length})`;
    }
    sql += ` ORDER BY ${useJoin ? 'p.' : ''}created_at DESC`;
    const result = await pool.query(sql, params);
    res.json(result.rows.map(rowToProperty));
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getPropertyById(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM properties WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    const row = result.rows[0];
    const property = rowToProperty(row);
    const ownerObj = typeof row.owner === 'string' ? JSON.parse(row.owner || '{}') : (row.owner || {});
    const resolveOwnerName = (o) => {
      if (o.name) return o.name;
      if (o.firstName || o.lastName) return ((o.firstName || '') + ' ' + (o.lastName || '')).trim();
      return '';
    };
    const currentOwnerName = resolveOwnerName(ownerObj);
    if ((!currentOwnerName || !ownerObj.email) && row.client_id) {
      try {
        const ownerClient = await pool.query('SELECT * FROM owner_clients WHERE id = $1', [row.client_id]);
        if (ownerClient.rows.length > 0) {
          const oc = ownerClient.rows[0];
          const ocData = oc.data || {};
          const fkName = ocData.name || ((oc.first_name || '') + ' ' + (oc.last_name || '')).trim() || '';
          property.owner = {
            id: String(oc.id),
            name: currentOwnerName || fkName,
            phone: ownerObj.phone || oc.phone || ocData.phone || '',
            email: ownerObj.email || oc.email || ocData.email || '',
          };
        }
      } catch (e) { /* ignore */ }
    } else {
      property.owner = {
        id: ownerObj.id || '',
        name: currentOwnerName,
        phone: ownerObj.phone || '',
        email: ownerObj.email || '',
      };
    }
    res.json(property);
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function generateReference(req, res) {
  try {
    const { propertyType } = req.query;
    const prefixMap = {
      residential: 'RES', commercial: 'COM', land: 'TER',
      vacation: 'VAC', luxury: 'LUX',
    };
    const prefix = prefixMap[propertyType] || 'GEN';
    const year = new Date().getFullYear();
    const result = await pool.query(
      `SELECT reference FROM properties WHERE reference LIKE $1 ORDER BY reference DESC LIMIT 1`,
      [`${prefix}-${year}-%`]
    );
    let num = 1;
    if (result.rows.length > 0) {
      const last = result.rows[0].reference;
      const parts = last.split('-');
      num = parseInt(parts[parts.length - 1], 10) + 1;
    }
    const ref = `${prefix}-${year}-${String(num).padStart(3, '0')}`;
    res.json({ reference: ref });
  } catch (error) {
    console.error('Error generating reference:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createProperty(req, res) {
  try {
    const data = mapInput(req.body);
    if (!data.agent_id && req.user?.id) {
      data.agent_id = String(req.user.id);
    }
    const cols = Object.keys(data);
    const vals = Object.values(data);
    const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
    const result = await pool.query(
      `INSERT INTO properties (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`,
      vals
    );
    const property = rowToProperty(result.rows[0]);
    triggerPropertyCreated(property, req.user).catch(err =>
      console.error('Error logging property creation:', err.stack || err)
    );
    triggerPropertyAddedAutomation(property, req.user).catch(err =>
      console.error('Error triggering property automator:', err.stack || err)
    );

    // Create notification if assigned to someone other than the creator
    if (data.agent_id && String(data.agent_id) !== String(req.user?.id)) {
      let adminName = 'Administrateur';
      if (req.user?.id) {
        try {
          const userRes = await pool.query('SELECT first_name, last_name FROM users WHERE id = $1', [req.user.id]);
          if (userRes.rows.length > 0) {
            const first = userRes.rows[0].first_name || '';
            const last = userRes.rows[0].last_name || '';
            adminName = [first, last].filter(Boolean).join(' ').trim() || 'Administrateur';
          }
        } catch (err) {
          console.error('Error getting admin name for notification:', err.message);
        }
      }
      try {
        await pool.query(
          `INSERT INTO notifications (user_id, sender_name, type, message, property_id, property_ref)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [data.agent_id, adminName, 'property_assigned',
           `Le bien ${property.reference || ''} (${property.title || 'Sans titre'}) vous a été attribué.`,
           String(property.id), property.reference || '']
        );
      } catch (err) {
        console.error('Error creating notification on property assignment:', err.message);
      }
    }

    res.status(201).json(property);
  } catch (error) {
    console.error('Error creating property:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Duplicate reference' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}

const MANDATE_TO_CLIENT_STATUS = {
  'Non d\u00e9fini': { vendeur: 'En attente de signature', bailleur: 'En attente de signature', acheteur: 'En recherche', locataire: 'En recherche' },
  'En attente de signature': { vendeur: 'En attente de signature', bailleur: 'En attente de signature', acheteur: 'En recherche', locataire: 'En recherche' },
  'Actif': { vendeur: 'En mandat', bailleur: 'En mandat', acheteur: 'En recherche', locataire: 'En recherche' },
  'Expire': { vendeur: 'Inactif', bailleur: 'Inactif', acheteur: 'Inactif', locataire: 'Inactif' },
  'Resilie': { vendeur: 'Perdu', bailleur: 'Perdu', acheteur: 'Perdu', locataire: 'Perdu' },
  'Termine': { vendeur: 'Vendu', bailleur: 'Lou\u00e9', acheteur: 'Vendu / Achet\u00e9', locataire: 'Install\u00e9' },
};

function deriveStatutMetier(mandatStatus, clientType) {
  if (!mandatStatus) return '';
  const entry = MANDATE_TO_CLIENT_STATUS[mandatStatus];
  if (!entry) return '';
  const lowerType = (clientType || '').toLowerCase();
  return entry[lowerType] || entry.vendeur || '';
}

async function cascadeMandateToClient(clientId, mandatStatus) {
  if (!clientId) return;
  try {
    const clientRes = await pool.query('SELECT client_type, statut_metier FROM owner_clients WHERE id = $1', [clientId]);
    if (clientRes.rows.length === 0) return;
    const clientType = clientRes.rows[0].client_type;
    const newStatutMetier = deriveStatutMetier(mandatStatus, clientType);
    await pool.query(
      `UPDATE owner_clients SET mandat_status = $1, statut_metier = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
      [mandatStatus || '', newStatutMetier, clientId]
    );
  } catch (err) {
    console.error('Error cascading mandate to client:', err.message);
  }
}

export async function updateProperty(req, res) {
  try {
    const { id } = req.params;
    const existing = await pool.query('SELECT * FROM properties WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    const oldProperty = rowToProperty(existing.rows[0]);
    const data = mapInput(req.body, { partial: true });
    delete data.reference;

    // Merge form_data with existing to prevent data loss on partial updates
    if (data.form_data) {
      let existingFormData = {}
      const existingRow = existing.rows[0]
      if (existingRow.form_data) {
        existingFormData = typeof existingRow.form_data === 'string'
          ? (function() { try { return JSON.parse(existingRow.form_data) } catch { return {} } })()
          : existingRow.form_data
      }
      const newFormData = typeof data.form_data === 'string'
        ? (function() { try { return JSON.parse(data.form_data) } catch { return {} } })()
        : data.form_data
      data.form_data = JSON.stringify({ ...existingFormData, ...newFormData })
    }

    const cols = Object.keys(data);
    const vals = Object.values(data);
    const setClauses = cols.map((col, i) => `${col} = $${i + 1}`).join(', ');
    vals.push(id);
    const result = await pool.query(
      `UPDATE properties SET ${setClauses}, updated_at = CURRENT_TIMESTAMP WHERE id = $${vals.length} RETURNING *`,
      vals
    );
    const newProperty = rowToProperty(result.rows[0]);
    triggerChanges(oldProperty, newProperty, req.user).catch(err =>
      console.error('Error logging property changes:', err.stack || err)
    );

    // Cascade mandate_status change to the linked client
    if (data.mandate_status && data.mandate_status !== oldProperty.mandateStatus) {
      const propRow = result.rows[0];
      if (propRow.client_id) {
        cascadeMandateToClient(propRow.client_id, data.mandate_status);
      }
    }

    if (oldProperty.status !== 'sold' && newProperty.status === 'sold') {
      console.log(`[PropertyController] Status changed to sold for property ${id} via updateProperty, triggering automation`);
      triggerPropertySoldAutomation(newProperty, req.user).catch(err =>
        console.error('Error triggering property sold automator:', err.stack || err)
      );
    }

    if (oldProperty.status !== 'rented' && newProperty.status === 'rented') {
      console.log(`[PropertyController] Status changed to rented for property ${id} via updateProperty, triggering automation`);
      triggerPropertyRentedAutomation(newProperty, req.user).catch(err =>
        console.error('Error triggering property rented automator:', err.stack || err)
      );
    }

    res.json(newProperty);
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updatePropertyCompletion(req, res) {
  try {
    const { id } = req.params;
    const { completion, completionTabs } = req.body;

    const existing = await pool.query('SELECT * FROM properties WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const existingRow = existing.rows[0];
    let existingFormData = {};
    if (existingRow.form_data) {
      existingFormData = typeof existingRow.form_data === 'string'
        ? (function () { try { return JSON.parse(existingRow.form_data); } catch { return {}; } })()
        : existingRow.form_data;
    }

    const pct = Math.min(100, Math.max(0, Math.round(Number(completion) || 0)));
    const tabs = completionTabs && typeof completionTabs === 'object' ? completionTabs : {};

    const result = await pool.query(
      `UPDATE properties SET form_data = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [JSON.stringify({ ...existingFormData, completion: pct, completionTabs: tabs }), id]
    );

    res.json(rowToProperty(result.rows[0]));
  } catch (error) {
    console.error('Error updating property completion:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updatePropertyStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    const oldRow = await pool.query('SELECT status FROM properties WHERE id = $1', [id]);
    const oldStatus = oldRow.rows[0]?.status;

    const result = await pool.query(
      'UPDATE properties SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    const property = rowToProperty(result.rows[0]);

    if (oldStatus !== 'sold' && status === 'sold') {
      console.log(`[PropertyController] Status changed to sold for property ${id}, triggering automation`);
      triggerPropertySoldAutomation(property, req.user).catch(err =>
        console.error('Error triggering property sold automator:', err.stack || err)
      );
    }

    if (oldStatus !== 'rented' && status === 'rented') {
      console.log(`[PropertyController] Status changed to rented for property ${id}, triggering automation`);
      triggerPropertyRentedAutomation(property, req.user).catch(err =>
        console.error('Error triggering property rented automator:', err.stack || err)
      );
    }

    res.json(property);
  } catch (error) {
    console.error('Error updating property status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function duplicateProperty(req, res) {
  try {
    const { id } = req.params;
    const existing = await pool.query('SELECT * FROM properties WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    const original = existing.rows[0];

    const prefixMap = {
      residential: 'RES', commercial: 'COM', land: 'TER',
      vacation: 'VAC', luxury: 'LUX',
    };
    const prefix = prefixMap[original.property_type] || 'GEN';
    const year = new Date().getFullYear();
    const refResult = await pool.query(
      `SELECT reference FROM properties WHERE reference LIKE $1 ORDER BY reference DESC LIMIT 1`,
      [`${prefix}-${year}-%`]
    );
    let num = 1;
    if (refResult.rows.length > 0) {
      const last = refResult.rows[0].reference;
      const parts = last.split('-');
      num = parseInt(parts[parts.length - 1], 10) + 1;
    }
    const newRef = `${prefix}-${year}-${String(num).padStart(3, '0')}`;

    const toJson = (v) => v != null ? JSON.stringify(v) : null;

    const parentId = original.original_property_id || original.id;

    const result = await pool.query(
      `INSERT INTO properties (
        reference, title, property_type, transaction_type, status,
        price, price_min, price_max, surface, land_size,
        bedrooms, bathrooms, rooms, sleeping_capacity,
        location, address, city, district, latitude, longitude,
        description, features, images, documents,
        year_built, dpe, mandate_type, property_state, is_seasonal,
        client_id, owner, agent_id, mandate_status, mandate_start_date, mandate_end_date, form_data,
        original_property_id, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24,
        $25, $26, $27, $28, $29,
        $30, $31, $32, $33, $34, $35, $36,
        $37, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *`,
      [
        newRef, original.title, original.property_type, original.transaction_type, original.status,
        original.price, original.price_min, original.price_max, original.surface, original.land_size,
        original.bedrooms, original.bathrooms, original.rooms, original.sleeping_capacity,
        original.location, original.address, original.city, original.district, original.latitude, original.longitude,
        original.description, toJson(original.features), toJson(original.images), toJson(original.documents),
        original.year_built, toJson(original.dpe), original.mandate_type, original.property_state, original.is_seasonal,
        original.client_id, toJson(original.owner), req.user?.id ? String(req.user.id) : '', original.mandate_status,
        null, null, toJson(original.form_data),
        parentId,
      ]
    );

    const property = rowToProperty(result.rows[0]);
    res.status(201).json(property);
  } catch (error) {
    console.error('Error duplicating property:', error.message || error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Duplicate reference, please try again' });
    }
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export async function reassignProperty(req, res) {
  try {
    const { id } = req.params;
    const { agentId, note } = req.body;
    if (!agentId) {
      return res.status(400).json({ error: 'agentId is required' });
    }

    // Get current property
    const existing = await pool.query('SELECT * FROM properties WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    const oldProperty = rowToProperty(existing.rows[0]);
    const oldAgentId = oldProperty.agentId;

    // Get current admin name
    let adminName = 'Admin';
    if (req.user?.id) {
      const userRes = await pool.query('SELECT first_name, last_name FROM users WHERE id = $1', [req.user.id]);
      if (userRes.rows.length > 0) {
        const first = userRes.rows[0].first_name || '';
        const last = userRes.rows[0].last_name || '';
        adminName = [first, last].filter(Boolean).join(' ').trim() || 'Admin';
      }
    }

    // Get old agent name
    let oldAgentName = '';
    if (oldAgentId) {
      const oldUserRes = await pool.query('SELECT first_name, last_name FROM users WHERE id = $1', [oldAgentId]);
      if (oldUserRes.rows.length > 0) {
        const first = oldUserRes.rows[0].first_name || '';
        const last = oldUserRes.rows[0].last_name || '';
        oldAgentName = [first, last].filter(Boolean).join(' ').trim();
      }
    }

    // Get new agent name
    let newAgentName = '';
    const newUserRes = await pool.query('SELECT first_name, last_name FROM users WHERE id = $1', [agentId]);
    if (newUserRes.rows.length > 0) {
      const first = newUserRes.rows[0].first_name || '';
      const last = newUserRes.rows[0].last_name || '';
      newAgentName = [first, last].filter(Boolean).join(' ').trim();
    }

    // Update agent_id
    const result = await pool.query(
      'UPDATE properties SET agent_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [agentId, id]
    );
    const updatedProperty = rowToProperty(result.rows[0]);

    // Create notification for new agent
    const ref = oldProperty.reference || '';
    const notifMessage = note
      ? `Bien ${ref} · ${oldProperty.title || ''} — ${note}`
      : `Bien ${ref} · ${oldProperty.title || ''} vous a été affecté`;
    try {
      await pool.query(
        `INSERT INTO notifications (user_id, sender_name, type, message, property_id, property_ref)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [agentId, adminName, 'property_assigned', notifMessage, String(id), ref]
      );
    } catch (err) {
      console.error('Error creating notification:', err.message);
    }

    // Add timeline event
    const timelineNotes = `Agent réaffecté : ${oldAgentName || 'Non assigné'} → ${newAgentName}`;
    try {
      await pool.query(
        'INSERT INTO property_timeline (property_id, type, agent, notes) VALUES ($1, $2, $3, $4)',
        [id, 'agent_reaffecte', adminName, timelineNotes]
      );
    } catch (err) {
      console.error('Error adding timeline event:', err.message);
    }

    res.json(updatedProperty);
  } catch (error) {
    console.error('Error reassigning property:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updatePropertyDocuments(req, res) {
  try {
    const { id } = req.params;
    const { fileTree } = req.body;
    const existing = await pool.query('SELECT * FROM properties WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    const oldProperty = rowToProperty(existing.rows[0]);
    const docs = { fileTree: fileTree || [] };
    await pool.query('UPDATE properties SET documents = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [JSON.stringify(docs), id]);
    clearPropertyDocsCache();
    const result = await pool.query('SELECT * FROM properties WHERE id = $1', [id]);
    const newProperty = rowToProperty(result.rows[0]);
    triggerChanges(oldProperty, newProperty, req.user).catch(err =>
      console.error('Error logging document changes:', err.stack || err)
    );
    res.json(newProperty);
  } catch (error) {
    console.error('Error updating property documents:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function uploadPropertyFile(req, res) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    const files = req.files.map(f => ({
      url: `/uploads/properties/${f.filename}`,
      filename: f.filename,
      originalname: f.originalname,
      mimetype: f.mimetype,
      size: f.size,
    }));
    res.json({ files });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteProperty(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM properties WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    const deletedProperty = rowToProperty(result.rows[0]);
    triggerPropertyDeleted(deletedProperty, req.user).catch(err =>
      console.error('Error logging property deletion:', err.stack || err)
    );
    res.json({ message: 'Property deleted', id: deletedProperty.id });
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getTimeline(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT t.*
      FROM property_timeline t
      WHERE t.property_id = $1
      ORDER BY t.created_at DESC`,
      [id]
    );
    // Resolve 'Agent' placeholder on read using the property's assigned agent
    let agentName = '';
    if (result.rows.length > 0 && result.rows[0].agent === 'Agent') {
      const propRes = await pool.query('SELECT agent_id FROM properties WHERE id = $1', [id]);
      if (propRes.rows.length > 0 && propRes.rows[0].agent_id) {
        const aid = propRes.rows[0].agent_id;
        if (/^\d+$/.test(aid)) {
          const userRes = await pool.query('SELECT first_name, last_name FROM users WHERE id = $1', [aid]);
          if (userRes.rows.length > 0) {
            const first = userRes.rows[0].first_name || '';
            const last = userRes.rows[0].last_name || '';
            agentName = [first, last].filter(Boolean).join(' ').trim();
          }
        }
      }
    }
    res.json(result.rows.map(row => ({
      id: String(row.id),
      date: row.created_at,
      type: row.type,
      agent: row.agent === 'Agent' && agentName ? agentName : (row.agent || ''),
      notes: row.notes || '',
    })));
  } catch (error) {
    console.error('Error fetching timeline:', error);
    if (error.code === '42P01') {
      return res.status(200).json([]);
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function addTimelineEvent(req, res) {
  try {
    const { id } = req.params;
    const { type, notes } = req.body;
    const existing = await pool.query('SELECT id FROM properties WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    // Fetch agent name from authenticated user
    let agent = '';
    if (req.user?.id) {
      const userRes = await pool.query('SELECT first_name, last_name FROM users WHERE id = $1', [req.user.id]);
      if (userRes.rows.length > 0) {
        const first = userRes.rows[0].first_name || '';
        const last = userRes.rows[0].last_name || '';
        agent = [first, last].filter(Boolean).join(' ').trim();
      }
    }
    if (!agent) agent = req.body.agent || '';
    const result = await pool.query(
      'INSERT INTO property_timeline (property_id, type, agent, notes) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, type, agent || '', notes || '']
    );
    const row = result.rows[0];
    res.status(201).json({
      id: String(row.id),
      date: row.created_at,
      type: row.type,
      agent: row.agent || '',
      notes: row.notes || '',
    });
  } catch (error) {
    console.error('Error adding timeline event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateTimelineEvent(req, res) {
  try {
    const { id, eventId } = req.params;
    const { notes, type, agent } = req.body;
    const result = await pool.query(
      'UPDATE property_timeline SET notes = $1, type = COALESCE($2, type), agent = COALESCE($3, agent) WHERE id = $4 AND property_id = $5 RETURNING *',
      [notes, type || null, agent || null, eventId, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Timeline event not found' });
    }
    const row = result.rows[0];
    res.json({
      id: String(row.id),
      date: row.created_at,
      type: row.type,
      agent: row.agent || '',
      notes: row.notes || '',
    });
  } catch (error) {
    console.error('Error updating timeline event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteTimelineEvent(req, res) {
  try {
    const { id, eventId } = req.params;
    const result = await pool.query(
      'DELETE FROM property_timeline WHERE id = $1 AND property_id = $2 RETURNING *',
      [eventId, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Timeline event not found' });
    }
    res.json({ message: 'Timeline event deleted', id: eventId });
  } catch (error) {
    console.error('Error deleting timeline event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getPropertyMatching(req, res) {
  try {
    const { id } = req.params;
    const { findMatchingClients } = await import('../services/matching.service.js');
    const matches = await findMatchingClients(id);
    res.json(matches);
  } catch (error) {
    console.error('Error fetching property matching:', error);
    if (error.message === 'Property not found') {
      return res.status(404).json({ error: 'Property not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function proposeToClient(req, res) {
  try {
    const { id } = req.params;
    const { clientId, email, subject, message, score, details, buyerName } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }

    const propResult = await pool.query('SELECT * FROM properties WHERE id = $1', [id]);
    if (propResult.rows.length === 0) return res.status(404).json({ error: 'Property not found' });

    const r = propResult.rows[0];
    let fd = r.form_data;
    if (typeof fd === 'string') try { fd = JSON.parse(fd); } catch (e) { fd = {}; }

    let ownerName = 'Propriétaire';
    let ownerEmail = email;
    let buyerEmail = '';
    let buyerPhone = '';
    if (clientId) {
      const clientResult = await pool.query('SELECT * FROM owner_clients WHERE id = $1', [clientId]);
      if (clientResult.rows.length > 0) {
        const cData = clientResult.rows[0].data || {};
        buyerEmail = clientResult.rows[0].email || cData.email || '';
        buyerPhone = clientResult.rows[0].phone || cData.phone || '';
      }
    }

    const ownerParsed = typeof r.owner === 'string' ? JSON.parse(r.owner || '{}') : (r.owner || {});
    const resolveOwnerName = (o) => {
      if (o.name) return o.name;
      if (o.firstName || o.lastName) return ((o.firstName || '') + ' ' + (o.lastName || '')).trim();
      return '';
    };
    ownerName = resolveOwnerName(ownerParsed) || '';
    ownerEmail = ownerParsed.email || email;

    if (!ownerName && r.client_id) {
      try {
        const ownerClientResult = await pool.query('SELECT * FROM owner_clients WHERE id = $1', [r.client_id]);
        if (ownerClientResult.rows.length > 0) {
          const oData = ownerClientResult.rows[0].data || {};
          ownerName = oData.name || ((ownerClientResult.rows[0].first_name || '') + ' ' + (ownerClientResult.rows[0].last_name || '')).trim() || '';
          ownerEmail = ownerClientResult.rows[0].email || oData.email || ownerEmail;
        }
      } catch (e) { /* ignore */ }
    }
    if (!ownerName) ownerName = 'Propriétaire';

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

    const { sendOwnerBuyerNotificationEmail } = await import('../services/email.service.js');
    const isRental = ['location_ld', 'location_saisonniere'].includes(r.transaction_type);
    const clientType = isRental ? 'Locataire' : 'Acheteur';
    await sendOwnerBuyerNotificationEmail({
      to: email,
      ownerName,
      property,
      buyerName: buyerName || (isRental ? 'Locataire' : 'Acheteur'),
      buyerEmail,
      buyerPhone,
      score: score || 0,
      message: message || '',
      agentName,
      agentEmail,
      details: details || null,
      clientType,
    });

    res.json({ success: true, message: 'Notification envoyée au propriétaire avec succès' });
  } catch (error) {
    console.error('Error sending owner notification:', error);
    res.status(500).json({ error: "Erreur lors de l'envoi de la notification" });
  }
}

export async function refuseMatch(req, res) {
  try {
    const { id } = req.params;
    const { clientId } = req.body;
    if (!clientId) return res.status(400).json({ error: 'clientId is required' });

    const agentId = req.userId ? String(req.userId) : null;
    await pool.query(
      `INSERT INTO refused_matches (property_id, client_id, agent_id) VALUES ($1, $2, $3) ON CONFLICT (property_id, client_id) DO NOTHING`,
      [id, clientId, agentId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error refusing match:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function unrefuseMatch(req, res) {
  try {
    const { id, clientId } = req.params;
    await pool.query('DELETE FROM refused_matches WHERE property_id = $1 AND client_id = $2', [id, clientId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error unrefusing match:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
