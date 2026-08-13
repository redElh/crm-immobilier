import pool from '../config/db.js';

let _tableReady = false;

async function ensureTable() {
  if (_tableReady) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS property_timeline (
        id SERIAL PRIMARY KEY,
        property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        type VARCHAR(100) NOT NULL,
        agent VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_property_timeline_property_id ON property_timeline(property_id)
    `);
    _tableReady = true;
  } catch (err) {
    console.error('[TimelineService] Failed to ensure property_timeline table:', err.message);
  }
}

// Run table check once at module load
ensureTable();

const STATUS_LABELS = {
  for_sale: 'À vendre',
  for_rent: 'À louer',
  for_sale_or_rent: 'À vendre / À louer',
  mandate_pending: 'En attente de mandat',
  negotiation: 'En négociation',
  under_compromise: 'Sous compromis',
  under_promise: 'Sous promesse',
  signing: 'En cours de signature',
  sold: 'Vendu',
  rented: 'Loué',
  sold_or_rented: 'Vendu / Loué',
  available: 'Disponible',
  option: 'En option',
  reserved: 'Réservé',
  occupied: 'Occupé',
  unavailable: 'Indisponible',
  confidential: 'En confidentialité',
  urbanism: "En procédure d'urbanisme",
  withdrawn: 'Retiré',
};

const MANDATE_TYPE_LABELS = {
  exclusif: 'Exclusif',
  simple: 'Simple',
  semi_exclusif: 'Semi-exclusif',
  confidentiel: 'Confidentiel',
};

function fmtPrice(val) {
  if (val == null || val === '') return '';
  return Number(val).toLocaleString('fr-FR');
}

async function getAgentName(user) {
  if (!user) return 'Système';
  let first = user.first_name || '';
  let last = user.last_name || '';
  if (!first && !last && user.id) {
    try {
      const result = await pool.query('SELECT first_name, last_name FROM users WHERE id = $1', [user.id]);
      if (result.rows.length > 0) {
        first = result.rows[0].first_name || '';
        last = result.rows[0].last_name || '';
      }
    } catch (err) {
      console.error('[getAgentName] DB lookup failed:', err.message);
    }
  }
  let name = [first, last].filter(Boolean).join(' ').trim();
  if (!name) name = 'Agent';
  return name;
}

function arraysDiff(oldArr, newArr) {
  const oldSet = new Set((oldArr || []).map(i => typeof i === 'string' ? i : JSON.stringify(i)));
  const newSet = new Set((newArr || []).map(i => typeof i === 'string' ? i : JSON.stringify(i)));
  const added = (newArr || []).filter(i => !oldSet.has(typeof i === 'string' ? i : JSON.stringify(i)));
  const removed = (oldArr || []).filter(i => !newSet.has(typeof i === 'string' ? i : JSON.stringify(i)));
  return { added, removed };
}

function flattenFileTree(nodes, parentPath = '') {
  const files = [];
  for (const node of nodes) {
    if (node.type === 'folder' && node.children) {
      files.push(...flattenFileTree(node.children, parentPath + node.name + '/'));
    } else if (node.type === 'file') {
      files.push({ id: node.id, name: node.name, path: parentPath });
    }
  }
  return files;

}

async function addEntry(propertyId, type, agent, notes) {
  try {
    await pool.query(
      'INSERT INTO property_timeline (property_id, type, agent, notes) VALUES ($1, $2, $3, $4)',
      [propertyId, type, agent || 'Système', notes || '']
    );
  } catch (err) {
    console.error(`[TimelineService] Error adding event type="${type}" for property #${propertyId}:`, err.message);
  }
}

export async function triggerPropertyCreated(property, user) {
  const agent = await getAgentName(user);
  const notes = `Bien créé · ${property.title || ''} (${property.reference || ''})`;
  await addEntry(property.id, 'creation', agent, notes);

  // Log agent assignment if the property was assigned to someone
  if (property.agentId) {
    let agentName = property.agentId;
    try {
      const result = await pool.query('SELECT first_name, last_name FROM users WHERE id = $1', [property.agentId]);
      if (result.rows.length > 0) {
        const first = result.rows[0].first_name || '';
        const last = result.rows[0].last_name || '';
        agentName = [first, last].filter(Boolean).join(' ').trim() || property.agentId;
      }
    } catch (err) {
      console.error('[triggerPropertyCreated] Failed to fetch agent name:', err.message);
    }
    await addEntry(property.id, 'agent_assigne', agent, `Agent assigné : ${agentName}`);
  }
}

export async function triggerPropertyDeleted(property, user) {
  const agent = await getAgentName(user);
  const notes = `Bien supprimé · ${property.title || ''} (${property.reference || ''})`;
  await addEntry(property.id, 'bien_supprime', agent, notes);
}

export async function triggerPropertyRestored(property, user) {
  const agent = await getAgentName(user);
  const notes = `Bien restauré · ${property.title || ''} (${property.reference || ''})`;
  await addEntry(property.id, 'bien_restaure', agent, notes);
}

export async function triggerChanges(oldProp, newProp, user) {
  const agent = await getAgentName(user);
  const propertyId = newProp.id || oldProp.id;

  if (!propertyId) return;

  const statusOld = oldProp.status;
  const statusNew = newProp.status;
  if (statusNew && statusOld && statusNew !== statusOld) {
    const oldLabel = STATUS_LABELS[statusOld] || statusOld;
    const newLabel = STATUS_LABELS[statusNew] || statusNew;
    await addEntry(propertyId, 'statut_change', agent, `Statut modifié : "${oldLabel}" → "${newLabel}"`);
  }

  const priceOld = Number(oldProp.price) || 0;
  const priceNew = Number(newProp.price) || 0;
  if (priceNew !== priceOld && priceNew > 0) {
    await addEntry(propertyId, 'prix_modifie', agent, `Prix modifié : ${fmtPrice(priceOld)} MAD → ${fmtPrice(priceNew)} MAD`);
  }

  const priceMinOld = Number(oldProp.priceMin) || 0;
  const priceMinNew = Number(newProp.priceMin) || 0;
  if (priceMinNew !== priceMinOld && !priceMinOld && priceMinNew > 0) {
    await addEntry(propertyId, 'prix_negocie', agent, `Prix négociable ajouté : ${fmtPrice(priceMinNew)} MAD`);
  }

  const agentOld = oldProp.agentId || oldProp.agent_id;
  const agentNew = newProp.agentId || newProp.agent_id;
  if (agentNew && !agentOld) {
    await addEntry(propertyId, 'agent_assigne', agent, `Agent assigné : ${agentNew}`);
  } else if (agentNew && agentOld && agentNew !== agentOld) {
    await addEntry(propertyId, 'agent_reaffecte', agent, `Agent réaffecté : ${agentOld} → ${agentNew}`);
  } else if (!agentNew && agentOld) {
    await addEntry(propertyId, 'agent_retire', agent, `Agent retiré : ${agentOld}`);
  }

  const surfaceOld = Number(oldProp.surface) || 0;
  const surfaceNew = Number(newProp.surface) || 0;
  if (surfaceNew !== surfaceOld && surfaceNew > 0) {
    await addEntry(propertyId, 'surface_modifiee', agent, `Surface modifiée : ${surfaceOld} m² → ${surfaceNew} m²`);
  }

  const descOld = (oldProp.description || '').trim();
  const descNew = (newProp.description || '').trim();
  if (descNew !== descOld && descNew.length > 0) {
    await addEntry(propertyId, 'description_modifiee', agent, `Description modifiée`);
  }

  const otherChanges = [];
  const trackedFields = [
    { key: 'bedrooms', label: 'Nombre de chambres' },
    { key: 'bathrooms', label: 'Nombre de salles de bain' },
    { key: 'rooms', label: 'Nombre de pièces' },
    { key: 'landSize', label: 'Surface terrain' },
    { key: 'city', label: 'Ville' },
    { key: 'district', label: 'Quartier' },
    { key: 'yearBuilt', label: 'Année de construction' },
    { key: 'mandateStatus', label: 'Statut du mandat' },
    { key: 'mandateType', label: 'Type de mandat' },
  ];
  for (const { key, label } of trackedFields) {
    if (oldProp[key] !== newProp[key]) {
      otherChanges.push(label);
    }
  }
  if (otherChanges.length > 0) {
    await addEntry(propertyId, 'caracteristiques_modifiees', agent, `Caractéristiques modifiées : ${otherChanges.join(', ')}`);
  }

  const oldImages = Array.isArray(oldProp.images) ? oldProp.images : [];
  const newImages = Array.isArray(newProp.images) ? newProp.images : [];
  const imgDiff = arraysDiff(oldImages, newImages);
  for (const img of imgDiff.added) {
    const name = typeof img === 'string' ? img.split('/').pop() || img : 'Photo';
    if (name.match(/\.(mp4|mov|avi|mkv|webm)$/i)) {
      await addEntry(propertyId, 'video_ajoutee', agent, `Vidéo ajoutée : ${name}`);
    } else {
      await addEntry(propertyId, 'photos_ajoutees', agent, `Photo ajoutée : ${name}`);
    }
  }
  for (const img of imgDiff.removed) {
    const name = typeof img === 'string' ? img.split('/').pop() || img : 'Photo';
    if (name.match(/\.(mp4|mov|avi|mkv|webm)$/i)) {
      await addEntry(propertyId, 'video_supprimee', agent, `Vidéo supprimée : ${name}`);
    } else {
      await addEntry(propertyId, 'photos_supprimees', agent, `Photo supprimée : ${name}`);
    }
  }

  // File tree change detection — compare flattened file lists
  const oldDocData = oldProp.documents;
  const newDocData = newProp.documents;

  const oldTree = oldDocData && !Array.isArray(oldDocData) && oldDocData.fileTree ? oldDocData.fileTree : [];
  const newTree = newDocData && !Array.isArray(newDocData) && newDocData.fileTree ? newDocData.fileTree : [];
  const oldFiles = flattenFileTree(oldTree);
  const newFiles = flattenFileTree(newTree);
  const oldById = new Map(oldFiles.map(f => [f.id, f]));
  const newById = new Map(newFiles.map(f => [f.id, f]));
  for (const f of newFiles) {
    if (!oldById.has(f.id)) {
      await addEntry(propertyId, 'fichier_ajoute', agent, `Fichier ajouté : ${f.name}`);
    }
  }
  for (const f of oldFiles) {
    if (!newById.has(f.id)) {
      await addEntry(propertyId, 'fichier_supprime', agent, `Fichier supprimé : ${f.name}`);
    }
  }
  for (const [id, oldF] of oldById) {
    const newF = newById.get(id);
    if (newF && oldF.path !== newF.path) {
      await addEntry(propertyId, 'fichier_deplace', agent, `Fichier déplacé : ${oldF.name}`);
    }
  }

  const mandateStatusOld = oldProp.mandateStatus || oldProp.mandate_status;
  const mandateStatusNew = newProp.mandateStatus || newProp.mandate_status;
  if (mandateStatusNew && mandateStatusOld && mandateStatusNew !== mandateStatusOld) {
    if (newProp.propertyType === 'residential' && newProp.transactionType === 'vente') {
      if (mandateStatusNew === 'signe') {
        const mandateType = MANDATE_TYPE_LABELS[newProp.mandateType] || newProp.mandateType || 'Standard';
        const startDate = newProp.mandateStartDate || newProp.mandate_start_date || '';
        await addEntry(propertyId, 'mandat_signe', agent, `Mandat de vente signé · ${mandateType}${startDate ? ` (${startDate})` : ''}`);
      }
      // Mandat expiré (cron) - not handled here
    }
    if (mandateStatusNew === 'expire') {
      await addEntry(propertyId, 'mandat_expire', agent, `Mandat expiré`);
    }
  }

  // Residential Sales Specific Actions
  if (newProp.propertyType === 'residential' && newProp.transactionType === 'vente') {
    if (statusNew === 'under_compromise' && statusOld !== 'under_compromise') {
      await addEntry(propertyId, 'compromis_signe', agent, `Compromis de vente signé - ${new Date().toISOString().slice(0, 10)}`);
    }
    if (statusNew === 'signing' && statusOld !== 'signing') {
      await addEntry(propertyId, 'acte_authentique_signe', agent, `Acte authentique signé - ${new Date().toISOString().slice(0, 10)} - Vente finalisée`);
      await addEntry(propertyId, 'vente_finalisee', agent, `Vente finalisée - ${fmtPrice(newProp.price)} MAD`);
    } else if (statusNew === 'sold' && statusOld !== 'sold') {
      // This might be redundant if 'signing' -> 'sold' is a quick transition, but ensures finalization is logged
      await addEntry(propertyId, 'vente_finalisee', agent, `Vente finalisée - ${fmtPrice(newProp.price)} MAD`);
    }
  }

  // Residential Rental Specific Actions
  if (newProp.propertyType === 'residential' && newProp.transactionType === 'location') {
    if (statusNew === 'rented' && statusOld !== 'rented') {
      const leaseDuration = ''; // No clear field for this, can be added if available
      await addEntry(propertyId, 'bail_signe', agent, `Bail signé - ${new Date().toISOString().slice(0, 10)}${leaseDuration ? ` - ${leaseDuration}` : ''}`);
    }
    // Assume mandateEndDate is used for lease expiration for now
    if (mandateEndNew && mandateEndOld && mandateEndNew !== mandateEndOld) {
      await addEntry(propertyId, 'bail_renouvele', agent, `Bail renouvelé - Nouvelle date d'expiration : ${mandateEndNew}`);
    }

    // Locataire entrant/sortant, État des lieux entrant/sortant - require dedicated fields, not currently present.
    // Will add placeholders if specific fields for these are identified later.
  }
  const mandateEndOld = oldProp.mandateEndDate || oldProp.mandate_end_date;
  const mandateEndNew = newProp.mandateEndDate || newProp.mandate_end_date;
  if (mandateEndNew && mandateEndOld && mandateEndNew !== mandateEndOld) {
    if (newProp.propertyType === 'residential' && newProp.transactionType === 'vente') {
      await addEntry(propertyId, 'mandat_renouvele', agent, `Mandat renouvelé · Nouvelle date d'expiration : ${mandateEndNew}`);
    }
  }

  const brochureOld = oldProp.brochure;
  const brochureNew = newProp.brochure;
  if (brochureNew && !brochureOld) {
    await addEntry(propertyId, 'brochure_generer', agent, `Brochure PDF générée`);
  }

  const virtualTourOld = oldProp.virtualTourUrl;
  const virtualTourNew = newProp.virtualTourUrl;
  if (virtualTourNew && !virtualTourOld) {
    await addEntry(propertyId, 'visite_virtuelle_ajoutee', agent, `Visite virtuelle ajoutée`);
  }

  const bienPublieNew = newProp.bienPublie || newProp.bien_publie;
  const bienPublieOld = oldProp.bienPublie || oldProp.bien_publie;
  if (bienPublieNew && !bienPublieOld) {
    await addEntry(propertyId, 'bien_publie', agent, `Bien publié`);
  }

  if (newProp.status === 'withdrawn' && oldProp.status !== 'withdrawn') {
    if (newProp.propertyType === 'residential' && newProp.transactionType === 'vente') {
      const motif = newProp.retraitMotif || newProp.withdrawalReason || '';
      await addEntry(propertyId, 'bien_retire', agent, `Bien retiré du marché${motif ? ` · ${motif}` : ''}`);
    }
  }
}
